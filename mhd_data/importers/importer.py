import csv
import gc
import logging
import time
from uuid import uuid4

from django.db import connection
from tqdm import tqdm

from mhd_data.models import Item
from mhd_provenance.models import Provenance
from mhd_schema.models import Collection, Property

from mhd.utils import BatchImporter


class DataImporter(object):
    """
        A Data Importer is an abstraction for importing data into MathHubData.

        Does not yet support the update property
    """

    def __init__(self, collection, properties, quiet=False, batch_size=None, output_folder=None):
        """ Creates a new data importer for the given collection and properties """
        self.logger = logging.getLogger('mhd.dataimporter')
        self.logger.setLevel(logging.WARN if quiet else logging.DEBUG)

        self.batch = BatchImporter.get_default_importer(None, quiet=quiet, batch_size=batch_size)

        self.collection = collection
        self.properties = properties
        self.output_folder = output_folder

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
        self.batch(Item, ['id'], [[uuid] for uuid in uuids])
        self.logger.info('Collection {1!r}: {0!s} Item(s) saved in database'.format(len(uuids), self.collection.slug))

        # Create Item-Collection Associations
        cid = self.collection.id
        self.batch(Item.collections.through, ['collection_id', 'item_id'], [[cid, uuid] for uuid in uuids])
        self.logger.info('Collection {1!r}: {0!s} Item-Collection Association(s) saved in database'.format(len(uuids), self.collection.slug))

        # run the garbage collector to get rid of all the items we already stored
        gc.collect()

        # iterate and create each propesrty
        for (idx, p) in enumerate(self.properties):
            propstart = time.time()
            try:
                self._import_chunk_property(chunk, uuids, p, idx, update=update)
            except Exception as e:
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
        self.batch(model, ['id', 'value', 'item_id', 'prop_id', 'provenance_id', 'active'], filter(lambda v: v[1] is not None, values), len(values))
        self.logger.info('Collection {2!r}: Property {1!r}: {0!r} Value(s) saved in database'.format(len(values), prop.slug, self.collection.slug))

        # run the garbage collectorto get rid of things we no longer need
        values = None
        gc.collect()

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
