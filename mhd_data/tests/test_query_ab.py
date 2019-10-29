import json

from django.test import TestCase

from mhd_tests.utils import AssetPath, LoadJSONAsset

from .collection import insert_testing_data

from ..models import Item

AB_COLLECTION_PATH = AssetPath(__file__, "res", "ab_collection.json")

AB_DATA_PATH = AssetPath(__file__, "res", "ab_data.json")

AB_PROVENANCE_PATH = AssetPath(__file__, "res", "ab_provenance.json")

AB_ALL_PATH = AssetPath(__file__, "res", "ab_all.json")
AB_ALL_ASSET = LoadJSONAsset(AB_ALL_PATH)

class ABCollectionTest(TestCase):
    """
        Tests that the demo 'AB' collection can be inserted
        and queryied from the database.
        The AB collection is mathematically meaningful.
    """
    def setUp(self):

        self.collection = insert_testing_data(
            AB_COLLECTION_PATH, AB_DATA_PATH, AB_PROVENANCE_PATH, reset=True)

    def test_data_exists(self):

        GOT_QUERY_ALL = self.collection.semantic()
        self.assertJSONEqual(json.dumps(list(GOT_QUERY_ALL)), AB_ALL_ASSET,
                             "check that the query for all properties returns all properties")

    def test_query_item_semantics(self):
        for jitem in AB_ALL_ASSET:
            item = Item.objects.get(id=jitem["_id"])
            GOT_ITEM_SEMANTIC = item.semantic(self.collection)
            self.assertJSONEqual(json.dumps(GOT_ITEM_SEMANTIC), jitem)
