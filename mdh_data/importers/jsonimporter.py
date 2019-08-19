import json

from .importer import DataImporter, ImporterError

from mdh_schema.models import Collection
from mdh_provenance.models import Provenance

class JSONFileImporter(DataImporter):
    """ An importer that loads data from a set of json files """

    def __init__(self, collection_slug, property_names, data_path, provenance_path, on_chunk_success = None, on_property_success = None):
        collection = Collection.objects.get(slug=collection_slug)
        properties = [collection.get_property(pn) for pn in property_names]

        self.data_path = data_path
        self.provenance_path = provenance_path
        self.done = False

        super().__init__(collection, properties, on_chunk_success, on_property_success)

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

        # if we already returned the chunk, we have no more chunks
        if self.done:
            return None
        self.done = True

        # read all of the data file
        with open(self.data_path) as f:
            data = json.load(f)

        # if it is not a list, inform the user
        if not isinstance(data, list):
            raise ImporterError('Imported data is not a list. ')


        # return the data
        return data

    def get_chunk_column(self, chunk, property, idx):
        """
            Returns an iterator for the given property of the given chunk of data.
            Should contain get_chunk_length(chunk) elements.
            To be implemented by the subclass.
        """

        # fetch the idx' property for this column
        return [r[idx] for r in chunk]
