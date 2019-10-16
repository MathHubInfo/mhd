from uuid import uuid4

import logging
from tqdm import tqdm

import time

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

        # Generate Items
        items = [Item(id=uuid) for uuid in tqdm(uuids, leave=False)]
        self.logger.info('Collection {1!r}: {0!s} Item(s) instantiated'.format(len(items), self.collection.slug))

        # bulk create the items
        Item.objects.bulk_create(items, batch_size=self.batch_size, ignore_conflicts=True)
        self.logger.info('Collection {1!r}: {0!s} Item(s) saved in database'.format(len(items), self.collection.slug))

        # Create item associations
        ItemCollections = Item.collections.through
        cid = self.collection.id
        assocs = [ItemCollections(collection_id=cid, item_id=i.id) for i in tqdm(items, leave=False)]
        self.logger.info('Collection {1!r}: {0!s} Item-Collection Association(s) instantiated'.format(len(assocs), self.collection.slug))

        # bulk_create them
        ItemCollections.objects.bulk_create(assocs, batch_size=self.batch_size, ignore_conflicts=True)

        self.logger.info('Collection {1!r}: {0!s} Item-Collection Association(s) saved in database'.format(len(assocs), self.collection.slug))

        # iterate and create each propesrty
        for (idx, p) in enumerate(self.properties):
            propstart = time.time()
            try:
                self._import_chunk_property(chunk, uuids, p, idx, update=update)
            except Exception as e:
                raise ImporterError('Unable to import property {}: {}'.format(p.slug, str(e)))
            self.logger.info('Collection {2!r}: Property {1!r}: Took {0} second(s)'.format(time.time() - propstart, p.slug, self.collection.slug))

        self.logger.info('Collection {1!r}: Took {0} second(s)'.format(time.time() - start, self.collection.slug))
        # return the uuds
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
            model(
                value=populate_value(value),
                item_id=uuid,
                prop_id=prop_id,
                provenance_id=provenance_id
            )
            for (uuid, value) in zip(tqdm(uuids, leave=False), column)
        ]
        self.logger.info('Collection {2!r}: Property {1!r}: {0!r} Value(s) instantiated'.format(len(values), prop.slug, self.collection.slug))

        # bulk_create all the values
        model.objects.bulk_create(filter(lambda v: v.value is not None, values), batch_size=self.batch_size, ignore_conflicts=True)
        self.logger.info('Collection {2!r}: Property {1!r}: {0!r} Value(s) saved in database'.format(len(values), prop.slug, self.collection.slug))
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
