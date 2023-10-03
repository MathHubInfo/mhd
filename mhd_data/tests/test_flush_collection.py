from __future__ import annotations

import json

from django.test import TestCase

from mhd_tests.utils import AssetPath, LoadJSONAsset
from ..models import Item

from .collection import insert_testing_data

JANE_COLLECTION_PATH = AssetPath(__file__, "res", "jane_collection.json")

JANE_DATA_PATH = AssetPath(__file__, "res", "jane_data.json")

JANE_PROVENANCE_PATH = AssetPath(__file__, "res", "jane_provenance.json")

JANE_ALL_PATH = AssetPath(__file__, "res", "jane_all.json")
JANE_ALL_ASSET = LoadJSONAsset(JANE_ALL_PATH)

Z3Z_COLLECTION_PATH = AssetPath(__file__, "res", "z3z_collection.json")
Z3Z_PROVENANCE_PATH = AssetPath(__file__, "res", "z3z_provenance.json")
Z3Z_DATA_PATH = AssetPath(__file__, "res", "z3z_data.json")


class FlushCollectionTest(TestCase):
    def setUp(self) -> None:
        self.collection_a = insert_testing_data(
            JANE_COLLECTION_PATH, JANE_DATA_PATH, JANE_PROVENANCE_PATH, reset=True
        )
        self.collection_b = insert_testing_data(
            Z3Z_COLLECTION_PATH, Z3Z_DATA_PATH, Z3Z_PROVENANCE_PATH
        )

    def test_flush_collection(self) -> None:
        self.assertFalse(
            self.collection_a.is_empty(), "Check that the first collection is not empty"
        )
        self.assertFalse(
            self.collection_b.is_empty(),
            "Check that the second collection is not empty",
        )

        # flush collection b
        self.collection_b.flush()

        self.assertFalse(
            self.collection_a.is_empty(), "Check that the first collection is not empty"
        )
        self.assertTrue(
            self.collection_b.is_empty(), "Check that the second collection is empty"
        )

        # check that the first collection still has values
        GOT_QUERY_ALL = self.collection_a.semantic()
        self.assertJSONEqual(
            json.dumps(list(GOT_QUERY_ALL)),
            JANE_ALL_ASSET,
            "check that the query for all properties returns all properties",
        )

        # check that the second collection does not have values
        GOT_QUERY_NONE = self.collection_b.semantic()
        self.assertJSONEqual(
            json.dumps(list(GOT_QUERY_NONE)),
            [],
            "check that there are no values in collection b",
        )

        # check that there are only three items left
        # and the rest have been cleared
        self.assertEqual(Item.objects.count(), 3)
