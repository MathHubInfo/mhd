import json

from django.test import TestCase

from mdh_tests.utils import AssetPath, LoadJSONAsset

from .collection import insert_testing_data

AB_COLLECTION_PATH = AssetPath(__file__, "res", "ab_collection.json")

AB_DATA_PATH = AssetPath(__file__, "res", "ab_data.json")

AB_PROVENANCE_PATH = AssetPath(__file__, "res", "ab_provenance.json")

AB_ALL_PATH = AssetPath(__file__, "res", "ab_all.json")
AB_ALL_ASSET = LoadJSONAsset(AB_ALL_PATH)

class CreateCollectionTest(TestCase):
    def setUp(self):
        """ Creates the demo collection using the upsert command """

        self.collection = insert_testing_data(
            AB_COLLECTION_PATH, AB_DATA_PATH, AB_PROVENANCE_PATH, reset=True)

    def test_data_exists(self):

        GOT_QUERY_ALL = self.collection.semantic()
        self.assertJSONEqual(json.dumps(list(GOT_QUERY_ALL)), AB_ALL_ASSET,
                             "check that the query for all properties returns all properties")
