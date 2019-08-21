from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from mdh_tests.utils import LoadJSONAsset, AssetPath

Z3Z_V0_PATH = AssetPath(__file__, "res", "collection_v0.json")

Z3Z_V1_PATH = AssetPath(__file__, "res", "collection_v1.json")
Z3Z_V1_ASSET = LoadJSONAsset(Z3Z_V1_PATH)


class UpdateCollectionTest(TestCase):
    def setUp(self):
        """ Creates the demo collection using the upsert command """

        # create the collection
        call_command('upsert_collection', Z3Z_V0_PATH,
                     update=False, quiet=True)

        # update the collection
        call_command('upsert_collection', Z3Z_V1_PATH,
                     update=True, quiet=True)

    def test_api_all_collections(self):
        """ Checks that the demo collection was correctly updated in the list of collections """

        response = APIClient().get('/api/schema/collections/')
        expected_response = {
            "count": 1,
            "next": None,
            "previous": None,
            "num_pages": 1,
            "results": [Z3Z_V1_ASSET]
        }

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, expected_response)

    def test_api_exact_collection(self):
        """ Checks that the demo collection can be correctly found by slug """

        self.maxDiff = None

        response = APIClient().get('/api/schema/collections/z3zFunctions/')
        expected_response = Z3Z_V1_ASSET

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, expected_response)
