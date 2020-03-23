from __future__ import annotations

from mhd_tests.utils import db
import json

from django.core import management

from django.test import TestCase

from mhd_tests.utils import AssetPath, LoadJSONAsset

from .collection import insert_testing_data

from ..models import Item

AB_COLLECTION_PATH = AssetPath(__file__, "res", "ab_collection.json")

AB_DATA_PATH = AssetPath(__file__, "res", "ab_data.json")

AB_PROVENANCE_PATH = AssetPath(__file__, "res", "ab_provenance.json")

AB_ALL_PATH = AssetPath(__file__, "res", "ab_all.json")
AB_ALL_ASSET = LoadJSONAsset(AB_ALL_PATH)


class ABCollectionWithViewTest(TestCase):
    """
        Tests that the demo 'AB' collection can be inserted
        and queryied from the database.
        The AB collection is mathematically meaningful.
    """

    def setUp(self) -> None:
        # create the command
        self.collection = insert_testing_data(
            AB_COLLECTION_PATH, AB_DATA_PATH, AB_PROVENANCE_PATH, reset=True)

        # enable the view and refresh from the db
        management.call_command('collection_view', self.collection.slug, '--enable', '--sync', enable=True, sync=True)
        self.collection.refresh_from_db()

    def test_sql_uses_view(self) -> None:
        """ Checks that the underlying query uses a view """

        queryset, _ = self.collection.query()
        self.assertEqual(queryset.query.sql, """SELECT id, "property_value_basis", "property_cid_basis", "property_value_k", "property_cid_k", "property_value_n", "property_cid_n", "property_value_S", "property_cid_S", "property_value_R", "property_cid_R" FROM mhd_view_ab""")

    def test_data_exists(self) -> None:
        """ Checks that a query for all items returns the right data """

        # and query it
        GOT_QUERY_ALL = self.collection.semantic()
        self.assertJSONEqual(json.dumps(list(GOT_QUERY_ALL)), AB_ALL_ASSET,
                             "check that the query for all properties returns all properties")

    def test_query_item_semantics(self) -> None:
        """ Checks that a query for a single item returns the right data """

        # and query it
        for jitem in AB_ALL_ASSET:
            item = Item.objects.get(id=jitem["_id"])
            GOT_ITEM_SEMANTIC = item.semantic(self.collection)
            self.assertJSONEqual(json.dumps(GOT_ITEM_SEMANTIC), jitem)
