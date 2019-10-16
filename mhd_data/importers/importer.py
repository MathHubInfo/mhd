import csv
import gc
import logging
import time
from io import StringIO
from uuid import uuid4

from mhd.utils import pgsql_serializer

from django.db import connection
from tqdm import tqdm

from mhd_data.models import Item
from mhd_provenance.models import Provenance
from mhd_schema.models import Collection, Property


class DataImporter(object):
    """
        A Data Importer is an abstraction for importing data into MathHubData.

        Does not yet support the update property
    """

    def __init__(self, collection, properties, quiet=False, batch_size=None):
        """ Creates a new data importer for the given collection and properties """
        self.logger = logging.getLogger('mhd.dataimporter')
        self.logger.setLevel(logging.WARN if quiet else logging.DEBUG)

        self.collection = collection
        self.properties = properties
        self.batch_size = batch_size

        self._validate_params()

    def _validate_params(self):
        if not isinstance(self.collection, Collection):
            raise ImportValidationError(
                'No valid collection passed to DataImporter. ')

        for p in self.properties:
            if not isinstance(p, Property):
                raise ImportValidationError(
                    'Invalid property passed to DataImporter. ')
            if not p.collections.filter(pk=self.collection.pk):
                raise ImportValidationError(
                    'Property {} is not a part of collection {}'.format(p.slug, self.collection.slug))

    def __call__(self, update=False):
        """
            Imports all data available to this DataImporter.
            Returns a list of all items by UUIDS
        """

        # Create the procenance
        self.provenance = self.create_provenance()

        if not isinstance(self.provenance, Provenance):
            raise ImportValidationError('Invalid Provenance passed')

        uuid_list = []

        while True:
            # import the next chunk (if any)
            uuids = self._import_chunk(self.get_next_chunk(), update=update)
            if uuids is None:
                break

            uuid_list.append(uuids)
            self.logger.info('Finished import of {} item(s)'.format(len(uuids)))

        return uuid_list

    def _import_chunk(self, chunk, update):
        """
            Imports the given chunk into the system and returns the UUIDs of the elements
            created
        """

        # if no chunk was passed, we are done
        if chunk is None:
            return None


        # start time
        start = time.time()

        # Generate UUIDs
        uuids = [
            uuid4() if uuid is None else uuid for uuid in tqdm(self.get_chunk_uuids(chunk), leave=False)]
        self.logger.info('Collection {1!r}: {0!s} fresh UUID(s) generated'.format(len(uuids), self.collection.slug))

        # Create items in the database
        self._insert_into_db(Item, ['id'], [[uuid] for uuid in uuids])
        self.logger.info('Collection {1!r}: {0!s} Item(s) saved in database'.format(len(uuids), self.collection.slug))

        # Create Item-Collection Associations
        cid = self.collection.id
        self._insert_into_db(Item.collections.through, ['collection_id', 'item_id'], [[cid, uuid] for uuid in uuids])
        self.logger.info('Collection {1!r}: {0!s} Item-Collection Association(s) saved in database'.format(len(uuids), self.collection.slug))

        # run the garbage collector to get rid of all the items we already stored
        gc.collect()

        # iterate and create each propesrty
        for (idx, p) in enumerate(self.properties):
            propstart = time.time()
            try:
                self._import_chunk_property(chunk, uuids, p, idx, update=update)
            except Exception as e:
                raise
                raise ImporterError('Unable to import property {}: {}'.format(p.slug, str(e)))
            self.logger.info('Collection {2!r}: Property {1!r}: Took {0} second(s)'.format(time.time() - propstart, p.slug, self.collection.slug))

        self.logger.info('Collection {1!r}: Took {0} second(s)'.format(time.time() - start, self.collection.slug))

        # run the garbage collector and then return the uuids
        gc.collect()
        return uuids

    def _import_chunk_property(self, chunk, uuids, prop, idx, update):
        """
            Creates the given property for the given chunk and the provided items
        """

        # TODO: If update is set, set all the existing property values
        # to disabled. If update is not set, check that no value already exists and else
        # 'raise'

        # cache some values that will be used in multiple iterations below
        # this means we don't need to constantly look them up again, leading
        # to a significant speedup
        column = self.get_chunk_column(chunk, prop, idx)
        prop_id = prop.id
        model = prop.codec_model
        populate_value = model.populate_value
        provenance_id = self.provenance.id

        # Create each of the property values and populate them from the literal ones
        # in the column
        values = [
            [
                uuid4(),
                populate_value(value),
                uuid,
                prop_id,
                provenance_id,
                True
            ]
            for (uuid, value) in zip(tqdm(uuids, leave=False), column)
        ]
        self.logger.info('Collection {2!r}: Property {1!r}: {0!r} Value(s) instantiated'.format(len(values), prop.slug, self.collection.slug))

        # insert them into the db
        self._insert_into_db(model, ['id', 'value', 'item_id', 'prop_id', 'provenance_id', 'active'], filter(lambda v: v[1] is not None, values), len(values))
        self.logger.info('Collection {2!r}: Property {1!r}: {0!r} Value(s) saved in database'.format(len(values), prop.slug, self.collection.slug))

        # run the garbage collectorto get rid of things we no longer need
        values = None
        gc.collect()

    def _insert_into_db(self, model, fields, values, count_instances = None):
        """
            Insert into db inserts values for a given model into the database as efficient as possible
        """

        # split out postgres
        if connection.vendor == 'postgresql':
            return self._insert_into_db_postgres(model, fields, values, count_instances=count_instances)

        # else do the normal thing
        return self._insert_into_db_regular(model, fields, values, count_instances=count_instances)

    def _insert_into_db_regular(self, model, fields, values, count_instances=None):
        """
            DB-agnostic data insertion
        """

        # create the instance from the field names and values
        instances = [
            model(**{name: value[i] for (i, name) in enumerate(fields)})
                for value in tqdm(values, leave=False, total=count_instances)
        ]

        # send some logger into
        self.logger.info('Created {} instanc(s), sending to database ...'.format(count_instances or len(values)))

        # and run bulk_create
        return model.objects.bulk_create(instances, batch_size=self.batch_size)

    def _insert_into_db_postgres(self, model, fields, values, count_instances=None):
        # dump all the model instances into a csv writer
        stream = StringIO()
        writer = csv.writer(stream, delimiter='\t')

        # find serializers and prep values for the database
        preppers = [model._meta.get_field(f).get_prep_value for f in fields]
        serializers = [pgsql_serializer(model._meta.get_field(f).db_type(connection=connection)) for f in fields]

        # prepare values for the database
        for value in tqdm(values, leave=False, total=count_instances):
            writer.writerow([
                s(p(v)) for (s, p, v) in zip(serializers, preppers, value)
            ])

        self.logger.info('Data serialized, sending {} Byte(s) to postgres ...'.format(stream.tell()))
        stream.seek(0)

        # and import into the database
        with connection.cursor() as cursor:
            cursor.copy_from(
                file=stream,
                table=model._meta.db_table,
                sep='\t',
                columns=fields,
            )

        # close the stream just to be sure it's no longer used
        stream.close()


    #
    # Methods to be implemented by subclass
    #

    def create_provenance(self):
        """
            Creates or gets the procenance of this importer.
            To be implemented by sub-class.
        """

        raise NotImplementedError

    def get_next_chunk(self):
        """
            Gets the next chunk of items from the import source.
            Should return None if no more chunks are left.
            To be implemented by subclass.
        """

        raise NotImplementedError

    def get_chunk_length(self, chunk):
        """
            Gets the length of the given chunk.
            By default¸ simply calls len() on the chunk object,
            but this may be overwritten by the subclass.
        """

        return len(chunk)

    def get_chunk_uuids(self, chunk):
        """
            Returns an iterator of length get_chunk_length(chunk)
            with each element representing the uuid of each element in the
            chunk. Each uuid is either an element of type UUID or None,
            indicating it should be automatically created by the database.

            May be overwritten by subclass.
        """
        return [None] * self.get_chunk_length(chunk)

    def get_chunk_column(self, chunk, property, idx):
        """
            Returns an iterator for the given property of the given chunk of data.
            Should contain get_chunk_length(chunk) elements.
            To be implemented by the subclass.
        """

        raise NotImplementedError


class ImporterError(Exception):
    def __init__(self, message):
        super().__init__('Unable to create collection: {}'.format(message))


class ImportValidationError(ImporterError):
    def __init__(self, messsage):
        super().__init__('Invalid input: {}'.format(message))
