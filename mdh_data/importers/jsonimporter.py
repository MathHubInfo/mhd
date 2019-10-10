import json
import math
from collections import deque

from .importer import DataImporter, ImporterError

from mdh_schema.models import Collection
from mdh_provenance.models import Provenance

class JSONFileImporter(DataImporter):
    """ An importer that loads data from a set of json files """

    def __init__(self, collection_slug, property_names, data_path, provenance_path, on_chunk_success = None, on_property_success = None, on_log = None, batch_size = 100):
        collection = Collection.objects.get(slug=collection_slug)
        properties = [collection.get_property(pn) for pn in property_names]

        self._files = deque([])
        if isinstance(data_path, list) or isinstance(data_path, tuple):
            for d in data_path:
                self._files.append(d)
        else:
            self._files.append(data_path)


        self.provenance_path = provenance_path
        super().__init__(collection, properties, on_chunk_success, on_property_success, on_log, batch_size)

    def create_provenance(self):
        """ Creates the provenance model for this importer """

        with open(self.provenance_path) as f:
            prov = json.load(f)

        provenance = Provenance(metadata=prov)
        provenance.save()
        return provenance

    def get_next_chunk(self, previous):
        """
            Gets the next chunk of items from the import source.
            Should return None if no more chunks are left.
        """

        # if we have stuff left from the previous chunk
        # we should use that as our data
        if previous is not None and len(previous["next"]) > 0:
            data = previous["next"]
            cid = previous["cid"] + 1
            ctotal = previous["ctotal"]
            cpath = previous["cpath"]

        # if we do not have any data left over from the previous chunk
        # read more from disk
        else:
            data, cpath = self._read_file_chunk()
            if data is None:
                return None
            cid = 0
            ctotal = math.ceil(len(data) / self.batch_size)

        self.on_log("[{}] Processing batch {} / {}".format(cpath, cid + 1, ctotal))

        # split into rest and current
        return {
            "cid": cid,
            "ctotal": ctotal,
            "cpath": cpath,
            "data": data[:self.batch_size],
            "next": data[self.batch_size:]
        }

    def _read_file_chunk(self):
        # if we have no files left, bail
        if len(self._files) == 0:
            return None, None

        # get the next file path
        data_path = self._files.popleft()

        # read all of the data file
        with open(data_path) as f:
            try:
                data = json.load(f)
            except Exception as e:
                raise ImporterError('Unable to read file {}: {}'.format(data_path, str(e)))

        # if it is not a list, inform the user
        if not isinstance(data, list):
            raise ImporterError('Unable to import data from {}: Not a list. '.format(data_path))

        self.on_log("[{}] Loaded {} items".format(data_path, len(data)))

        # return the data
        return data, data_path

    def get_chunk_length(self, chunk):
        """
            Gets the length of the given chunk.
            By default¸ simply calls len() on the chunk object,
            but this may be overwritten by the subclass.
        """

        return len(chunk["data"])

    def get_chunk_column(self, chunk, property, idx):
        """
            Returns an iterator for the given property of the given chunk of data.
            Should contain get_chunk_length(chunk) elements.
            To be implemented by the subclass.
        """

        # fetch the idx' property for this column
        return [r[idx] for r in chunk["data"]]
