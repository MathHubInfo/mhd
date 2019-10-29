import json

from django.test import TestCase

from mhd_tests.utils import AssetPath, LoadJSONAsset

from .collection import insert_testing_data

from ..models import Item

JANE_COLLECTION_PATH = AssetPath(__file__, "res", "jane_collection.json")

JANE_DATA_PATH = AssetPath(__file__, "res", "jane_data.json")

JANE_PROVENANCE_PATH = AssetPath(__file__, "res", "jane_provenance.json")

JANE_ALL_PATH = AssetPath(__file__, "res", "jane_all.json")
JANE_ALL_ASSET = LoadJSONAsset(JANE_ALL_PATH)

Z3Z_COLLECTION_PATH = AssetPath(__file__, "res", "z3z_collection.json")
Z3Z_PROVENANCE_PATH = AssetPath(__file__, "res", "z3z_provenance.json")
Z3Z_DATA_PATH = AssetPath(__file__, "res", "z3z_data.json")

class CreateCollectionTest(TestCase):
    def setUp(self):
        """ Creates the demo collection using the upsert command """

        self.collection = insert_testing_data(
            JANE_COLLECTION_PATH, JANE_DATA_PATH, JANE_PROVENANCE_PATH, reset=True)

        # insert a second collection to check that querying on two collections works
        # properly
        insert_testing_data(Z3Z_COLLECTION_PATH, Z3Z_DATA_PATH, Z3Z_PROVENANCE_PATH)

    def test_data_exists(self):

        GOT_QUERY_ALL = self.collection.semantic()
        self.assertJSONEqual(json.dumps(list(GOT_QUERY_ALL)), JANE_ALL_ASSET,
                             "check that the query for all properties returns all properties")

    def test_query_item_semantics(self):
        for jitem in JANE_ALL_ASSET:
            item = Item.objects.get(id=jitem["_id"])
            GOT_ITEM_SEMANTIC = item.semantic(self.collection)
            self.assertJSONEqual(json.dumps(GOT_ITEM_SEMANTIC), jitem)
