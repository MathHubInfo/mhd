from mhd_tests.utils import db
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


class ABMaterializedCollectionTest(TestCase):
    """
        Tests that the demo 'AB' collection can be inserted
        and queryied from the database.
        The AB collection is mathematically meaningful.
    """

    def setUp(self):

        self.collection = insert_testing_data(
            AB_COLLECTION_PATH, AB_DATA_PATH, AB_PROVENANCE_PATH, reset=True)

    @db.skipUnlessPostgres
    def test_data_exists(self):
        # create a materialized view
        self.collection.materializedViewName = 'mhd_materializedview_test'
        self.collection.sync_materialized_view()

        # and query it
        GOT_QUERY_ALL = self.collection.semantic()
        self.assertJSONEqual(json.dumps(list(GOT_QUERY_ALL)), AB_ALL_ASSET,
                             "check that the query for all properties returns all properties")

    @db.skipUnlessPostgres
    def test_query_item_semantics(self):
        # create a materialized view
        self.collection.materializedViewName = 'mhd_materializedview_test'
        self.collection.sync_materialized_view()

        # and query it
        for jitem in AB_ALL_ASSET:
            item = Item.objects.get(id=jitem["_id"])
            GOT_ITEM_SEMANTIC = item.semantic(self.collection)
            self.assertJSONEqual(json.dumps(GOT_ITEM_SEMANTIC), jitem)
