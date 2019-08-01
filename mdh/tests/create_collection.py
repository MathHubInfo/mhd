import json

from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient
from ..models import Collection


class CreateCollectionTest(TestCase):

    def setUp(self):
        """ Creates the demo collection using the upsert command """
        self.maxDiff = None

        # read the collection json (for use in tests below)
        with open('examples/collection.json') as f:
            self.example_collection_asset = json.load(f)

        # create the collection using the manage.py command
        call_command('upsert_collection', 'examples/collection.json', update=False, quiet=True)

    def test_collection_was_created(self):

        # check that the result in the database is none
        obj = Collection.objects.filter(slug="DemoCollection").get()
        self.assertTrue(obj is not None)
    
    def test_api_all_collections(self):
        """ Checks that the demo collection is the only item in the list of collections """

        response = APIClient().get('/collection/')
        expected_response = {
            "count": 1,
            "next": None,
            "previous": None,
            "results": [self.example_collection_asset]
        }

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, expected_response)
    
    def test_api_exact_collection(self):
        """ Checks that the demo collection can be found by slug """


        response = APIClient().get('/collection/DemoCollection/')
        expected_response = self.example_collection_asset
        
        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, expected_response)

