from __future__ import annotations

import json

from django.test import TestCase

from mhd_tests.utils import AssetPath, LoadJSONAsset

from .collection import insert_testing_data

from ..models import Item
from mhd_schema.models import Property

Z3Z_COLLECTION_PATH = AssetPath(__file__, "res", "z3z_collection.json")
Z3Z_PROVENANCE_PATH = AssetPath(__file__, "res", "z3z_provenance.json")
Z3Z_DATA_PATH = AssetPath(__file__, "res", "z3z_data.json")

Z3Z_ALL_PATH = AssetPath(__file__, "res", "z3z_query_all.json")
Z3Z_ALL_ASSET = LoadJSONAsset(Z3Z_ALL_PATH)


class ItemTest(TestCase):
    def setUp(self) -> None:
        self.collection = insert_testing_data(
            Z3Z_COLLECTION_PATH, Z3Z_DATA_PATH, Z3Z_PROVENANCE_PATH, reset=True)

    def test_annotate_property(self) -> None:
        """ Tests that we can annotate a property correctly """

        # annotating a single property correctly
        item = Item.objects.get(id="00000000-0000-4000-a000-000000000000")
        prop = Property.objects.get(slug="f0")
        self.assertEqual(item._annotate_property(prop), [0])

    def test_item_api(self) -> None:
        item = Item.objects.get(id="00000000-0000-4000-a000-000000000000")
        semantic = item.semantic(self.collection)
        self.assertJSONEqual(json.dumps(semantic), Z3Z_ALL_ASSET[0])
