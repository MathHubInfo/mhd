from __future__ import annotations

from django.test import TestCase
from rest_framework.test import APIClient

from django.core.management import call_command

from ..models import Collection

from mhd_tests.utils import LoadJSONAsset, AssetPath

COLLECTION_V0_PATH = AssetPath(__file__, "res", "collection_v0.json")
COLLECTION_V0_PATH_INLINE = AssetPath(
    __file__, "res", "collection_v0_inline_template.json"
)
COLLECTION_V0_ASSET = LoadJSONAsset(COLLECTION_V0_PATH)
COLLECTION_V0_TEMPLATE = open(
    AssetPath(__file__, "res", "simple_template.jinja2")
).read()
COLLECTION_V0_ASSET["template"] = COLLECTION_V0_TEMPLATE


class CreateCollectionTest(TestCase):
    def setUp(self) -> None:
        """Creates the demo collection using the upsert command"""

        call_command("upsert_collection", COLLECTION_V0_PATH, update=False, quiet=True)

        self.collection = Collection.objects.get(slug="z3zFunctions")

    def test_api_all_collections(self) -> None:
        """Checks that the demo collection is the only item in the list of collections"""

        response = APIClient().get("/api/schema/collections/")
        expected_response = {
            "count": 1,
            "next": None,
            "previous": None,
            "num_pages": 1,
            "results": [COLLECTION_V0_ASSET],
        }

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, expected_response)

    def test_api_exact_collection(self):
        """Checks that the demo collection can be found by slug"""

        response = APIClient().get("/api/schema/collections/z3zFunctions/")
        expected_response = COLLECTION_V0_ASSET

        print(response.content)

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, expected_response)

    def test_collection_with_inline_template(self):
        call_command(
            "upsert_collection", COLLECTION_V0_PATH_INLINE, update=False, quiet=True
        )

        collection = Collection.objects.get(slug="z3zFunctionsInline")
        self.assertEqual(collection.template, "Hello,\n brave %s new {{ name }}")
