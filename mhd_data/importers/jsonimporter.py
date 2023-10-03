from __future__ import annotations

import ujson as json
from collections import deque

from .importer import DataImporter, ImporterError

from mhd_schema.models import Collection

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import List, Optional, Any
    from .importer import ChunkType, ProvenanceType


class JSONFileImporter(DataImporter):
    """An importer that loads data from a set of json files"""

    _chunk_size: int
    _files: deque
    provenance_path: str

    def __init__(
        self,
        collection_slug: str,
        property_names: List[str],
        data_path: str,
        provenance_path: str,
        quiet: bool,
        batch_size: Optional[int],
        chunk_size: int,
        write_sql: Optional[str],
    ):
        # inner chunk size
        self._chunk_size = chunk_size

        # file list
        self._files = deque([])
        if isinstance(data_path, list) or isinstance(data_path, tuple):
            for d in data_path:
                self._files.append(d)
        else:
            self._files.append(data_path)

        # path to provenance
        self.provenance_path = provenance_path

        # buffer for current file chunk
        self._chunk = None
        self._chunk_fn = None
        self._chunk_offset = None

        # call super()
        collection = Collection.objects.get(slug=collection_slug)
        properties = [collection.get_property(pn) for pn in property_names]
        super().__init__(collection, properties, quiet, batch_size, write_sql)

    def create_provenance(self) -> ProvenanceType:
        """
        Serializes provenance to be used by this importer.
        """

        with open(self.provenance_path) as f:
            prov = json.load(f)

        return prov

    def get_next_chunk(self) -> Optional[ChunkType]:
        """
        Gets the next chunk of items from the import source.
        Should return None if no more chunks are left.
        """

        # grab the next chunk (if we have nothing left)
        if self._chunk is None or len(self._chunk) == 0:
            self._chunk = self._get_next_chunk()

        # if there are no chunks left, return
        if self._chunk is None:
            return None

        # get meta data for the current chunk
        meta = {"filename": self._chunk_fn, "offset": self._chunk_offset}

        # cut the chunk to at most inner_chunk_size
        if self._chunk_size is not None and len(self._chunk) > self._chunk_size:
            c = self._chunk[: self._chunk_size]
            self._chunk_offset += self._chunk_size
            self._chunk = self._chunk[self._chunk_size :]
        else:
            c = self._chunk
            self._chunk = None

        return {"data": c, "meta": meta}

    def _get_next_chunk(self) -> Optional[ChunkType]:
        """
        Loads the next file representing a chunk from disk.
        """

        # if we have no files left, bail
        if len(self._files) == 0:
            return None

        # get the next file path (and store the file path)
        data_path = self._files.popleft()
        self._chunk_fn = data_path
        self._chunk_offset = 0

        # read all of the data file
        with open(data_path) as f:
            try:
                data = json.load(f)
            except Exception as e:
                raise ImporterError(
                    "Unable to read file {}: {}".format(data_path, str(e))
                )

        # if it is not a list, inform the user
        if not isinstance(data, list):
            raise ImporterError(
                "Unable to import data from {}: Not a list. ".format(data_path)
            )

        # return the data
        return data

    def get_chunk_column(self, chunk: ChunkType, property: str, idx: int) -> List[Any]:
        """
        Returns an iterator for the given property of the given chunk of data.
        Should contain get_chunk_length(chunk) elements.
        To be implemented by the subclass.
        """

        return [r[idx] for r in chunk["data"]]

    def get_chunk_length(self, chunk: ChunkType) -> int:
        """
        Gets the length of the given chunk.
        By default¸ simply calls len() on the chunk object,
        but this may be overwritten by the subclass.
        """

        return len(chunk["data"])
