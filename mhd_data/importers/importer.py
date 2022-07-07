from __future__ import annotations

import gc
import logging
import time

from django.utils import timezone

from tqdm import tqdm

from mhd.utils import BatchImporter, uuid4
from mhd_data.models import Item
from mhd_provenance.models import Provenance
from mhd_schema.models import Collection, Property

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Iterable, Any, List, Optional
    from logging import Logger
    ChunkType = Any
    ProvenanceType = Any


class DataImporter(object):
    """
        A Data Importer is an abstraction for importing data into MathDataHub.

        Does not yet support the update property
    """

    logger: Logger
    batch: BatchImporter
    collection: Collection
    properties: Iterable[Property]

    def __init__(self, collection: Collection, properties: Iterable[Property], quiet: bool = False, batch_size: Optional[int] = None, write_sql=None):
        """ Creates a new data importer for the given collection and properties """
        self.logger = logging.getLogger('mhd.dataimporter')
        self.logger.setLevel(logging.WARN if quiet else logging.DEBUG)

        self.batch = BatchImporter.get_default_importer(
            write_sql, quiet=quiet, batch_size=batch_size)

        self.collection = collection
        self.properties = properties

        self._validate_params()

    def _validate_params(self) -> None:
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

    def __call__(self, update: bool = False) -> List[str]:
        """
            Imports all data available to this DataImporter.
            Returns a list of all items by UUIDS
        """

        provenance_data = self.create_provenance()
        self.provenance = uuid4()

        self.batch(Provenance, ['id', 'metadata', 'time'], [
            [
                self.provenance,
                provenance_data,
                timezone.now()
            ]
        ])

        uuid_list = []

        while True:
            # import the next chunk (if any)
            uuids = self._import_chunk(self.get_next_chunk(), update=update)
            if uuids is None:
                break

            uuid_list.append(uuids)
            self.logger.info(
                'Finished import of {} item(s)'.format(len(uuids)))

        self.collection.invalidate_count()
        self.logger.info(
            'Invalidated collection count, run "python manage.py update_count" to update it. ')

        return uuid_list

    def _import_chunk(self, chunk: ChunkType, update: bool) -> List[str]:
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
        self.logger.info('Collection {1!r}: {0!s} fresh UUID(s) generated'.format(
            len(uuids), self.collection.slug))

        # Create items in the database
        self.batch(Item, ['id'], [[uuid] for uuid in uuids])
        self.logger.info('Collection {1!r}: {0!s} Item(s) saved in database'.format(
            len(uuids), self.collection.slug))

        # Create Item-Collection Associations
        cid = self.collection.id
        self.batch(Item.collections.through, ['collection_id', 'item_id'], [
                   [cid, uuid] for uuid in uuids])
        self.logger.info(
            'Collection {1!r}: {0!s} Item-Collection Association(s) saved in database'.format(len(uuids), self.collection.slug))

        # run the garbage collector to get rid of all the items we already stored
        gc.collect()

        # iterate and create each propesrty
        for (idx, p) in enumerate(self.properties):
            propstart = time.time()
            try:
                self._import_chunk_property(
                    chunk, uuids, p, idx, update=update)
            except Exception as e:
                raise ImporterError(
                    'Unable to import property {}: {}'.format(p.slug, str(e)))
            self.logger.info('Collection {2!r}: Property {1!r}: Took {0} second(s)'.format(
                time.time() - propstart, p.slug, self.collection.slug))

        self.logger.info('Collection {1!r}: Took {0} second(s)'.format(
            time.time() - start, self.collection.slug))

        # run the garbage collector and then return the uuids
        gc.collect()
        return uuids

    def _import_chunk_property(self, chunk: ChunkType, uuids: List[str], prop: Property, idx: int, update: bool) -> None:
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
        populate_values = model.populate_values
        value_columns = [m.name for m in model.get_value_fields()]
        provenance_id = self.provenance

        lift = (lambda v: [v]) if len(value_columns) == 1 else (lambda v: v)

        # Create each of the property values and populate them from the literal ones
        # in the column
        values = [
            [
                uuid4(),
                uuid,
                prop_id,
                provenance_id,
                True,
                *populate_values(*lift(value)),
            ]
            for (uuid, value) in zip(tqdm(uuids, leave=False), column)
        ]
        self.logger.info('Collection {2!r}: Property {1!r}: {0!r} Value(s) instantiated'.format(
            len(values), prop.slug, self.collection.slug))

        # insert them into the db
        self.batch(
            model,
            ['id', 'item_id', 'prop_id', 'provenance_id', 'active', *value_columns],
            filter(
                # Do not insert values that are only none
                lambda v: not all(x is None for x in v[5:]),
                values,
            ),
            len(values),
        )
        self.logger.info('Collection {2!r}: Property {1!r}: {0!r} Value(s) saved in database'.format(
            len(values), prop.slug, self.collection.slug))

        # run the garbage collector to get rid of things we no longer need
        values = None
        gc.collect()

    #
    # Methods to be implemented by subclass
    #

    def create_provenance(self) -> ProvenanceType:
        """
            Serializes provenance to be used by this importer.
            To be implemented by subclass.
        """

        raise NotImplementedError

    def get_next_chunk(self) -> Optional[ChunkType]:
        """
            Gets the next chunk of items from the import source.
            Should return None if no more chunks are left.
            To be implemented by subclass.
        """

        raise NotImplementedError

    def get_chunk_length(self, chunk: ChunkType) -> int:
        """
            Gets the length of the given chunk.
            By default¸ simply calls len() on the chunk object,
            but this may be overwritten by the subclass.
        """

        return len(chunk)

    def get_chunk_uuids(self, chunk: ChunkType) -> List[Optional[str]]:
        """
            Returns an iterator of length get_chunk_length(chunk)
            with each element representing the uuid of each element in the
            chunk. Each uuid is either an element of type UUID or None,
            indicating it should be automatically created by the database.

            May be overwritten by subclass.
        """
        return [None] * self.get_chunk_length(chunk)

    def get_chunk_column(self, chunk: ChunkType, property: str, idx: int) -> Iterable[Any]:
        """
            Returns an iterator for the given property of the given chunk of data.
            Should contain get_chunk_length(chunk) elements.
            To be implemented by the subclass.
        """

        raise NotImplementedError


class ImporterError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__('Unable to create collection: {}'.format(message))


class ImportValidationError(ImporterError):
    def __init__(self, message: str) -> None:
        super().__init__('Invalid input: {}'.format(message))
