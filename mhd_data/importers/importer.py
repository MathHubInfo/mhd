from uuid import uuid4

from mhd.utils import with_simulate_arg

from mhd_data.models import Item
from mhd_provenance.models import Provenance
from mhd_schema.models import Collection, Property


class DataImporter(object):
    """
        A Data Importer is an abstraction for importing data into MathHubData.

        Does not yet support the update property
    """

    def __init__(self, collection, properties, on_chunk_success=None, on_property_success=None, on_log=None, batch_size=100):
        """ Creates a new data importer for the given collection and properties """
        self.collection = collection
        self.properties = properties
        self.batch_size = batch_size

        if on_chunk_success is None:
            self.on_chunk_success = lambda chunk, uuids: None
        else:
            self.on_chunk_success = on_chunk_success

        if on_property_success is None:
            self.on_property_success = lambda chunk, uuids, property: None
        else:
            self.on_property_success = on_property_success

        if on_log is None:
            self.on_log = lambda msg: None
        else:
            self.on_log = on_log

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

    @with_simulate_arg
    def __call__(self, update=False, simulate=False):
        """
            Imports all data available to this DataImporter.
        """

        # Create the procenance
        self.provenance = self.create_provenance()

        if not isinstance(self.provenance, Provenance):
            raise ImportValidationError('Invalid Provenance passed')

        chunk = self.get_next_chunk(None)
        while chunk is not None:
            uuids = self._import_chunk(chunk, update=update)
            self.on_chunk_success(chunk, uuids)
            chunk = self.get_next_chunk(chunk)

    def _import_chunk(self, chunk, update):
        """
            Imports the given chunk into the system and returns the UUIDs of the elements
            created
        """
        # TODO: make use of the update parameter

        if chunk is None:
            raise ImportError('Attempted to import an empty chunk')

        # Either generate new ids or use existing ones
        uuids = [
            uuid4() if uuid is None else uuid for uuid in self.get_chunk_uuids(chunk)]
        items = [Item(id=uuid) for uuid in uuids]

        # bulk create the items and the collection they were added to
        Item.objects.bulk_create(items, batch_size=self.batch_size)
        self.collection.item_set.add(*items)

        # iterate and create each propesrty
        for (idx, p) in enumerate(self.properties):
            try:
                self._import_chunk_property(chunk, items, p, idx, update=update)
                self.on_property_success(chunk, uuids, p)
            except Exception as e:
                raise ImporterError('Unable to import property {}: {}'.format(p.slug, str(e)))

        # return the uuds
        return uuids

    def _import_chunk_property(self, chunk, items, prop, idx, update):
        """
            Creates the given property for the given chunk and the provided items
        """

        column = self.get_chunk_column(chunk, prop, idx)

        # TODO: If update is set, set all the existing property values
        # to disabled. If update is not set, check that no value already exists and else
        # 'raise'

        # Create each of the property values and populate them from the literal ones
        # in the column
        model = prop.codec_model

        values = [
            self.instantiate_value(model, item, prop, value)
            for (item, value) in zip(items, column)
        ]

        model.objects.bulk_create(filter(lambda v: v is not None, values), batch_size=self.batch_size)

    def instantiate_value(self, model, item, prop, value):
        value = model.populate_value(value)
        if value is None:
            return None


        return model(
            value=value,
            item=item,
            prop=prop,
            provenance=self.provenance
        )

    #
    # Methods to be implemented by subclass
    #

    def create_provenance(self):
        """
            Creates or gets the procenance of this importer.
            To be implemented by sub-class.
        """

        raise NotImplementedError

    def get_next_chunk(self, previous):
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
