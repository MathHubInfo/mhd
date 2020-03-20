from __future__ import annotations

from django.test import TestCase
from rest_framework.test import APIClient

from mhd_tests.utils import AssetPath

from .collection import insert_testing_data

Z3Z_COLLECTION_PATH = AssetPath(__file__, "res", "z3z_collection.json")
Z3Z_PROVENANCE_PATH = AssetPath(__file__, "res", "z3z_provenance.json")
Z3Z_DATA_PATH = AssetPath(__file__, "res", "z3z_data.json")

class FrontendProxyTest(TestCase):
    def setUp(self) -> None:
        self.collection = insert_testing_data(
            Z3Z_COLLECTION_PATH, Z3Z_DATA_PATH, Z3Z_PROVENANCE_PATH, reset=True)
    def test_root_url(self) -> None:
        """ Checks that the root url returns an appropriate X-Sendfile """

        response = APIClient().get('/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['X-Sendfile'], '/index.html')

    def test_about_url(self) -> None:
        """ Checks that the root url returns an appropriate X-Sendfile """

        response = APIClient().get('/about/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['X-Sendfile'], '/index.html')

    def test_collection_url_exists(self) -> None:
        """ Checks that a good collection url returns an X-Sendfile header """

        response = APIClient().get('/collection/z3zFunctions/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['X-Sendfile'], '/index.html')

    def test_collection_url_doesnotexist(self) -> None:
        """ Checks that a non-existent collection returns 404 """

        response = APIClient().get('/collection/nonExistentCollection/')
        self.assertEqual(response.status_code, 404)
        with self.assertRaises(KeyError):
            response['X-Sendfile']

    def test_item_url_exists(self) -> None:
        """ Checks that a good collection url returns an X-Sendfile header """

        response = APIClient().get('/item/z3zFunctions/00000000-0000-4000-a000-000000000000/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['X-Sendfile'], '/index.html')

    def test_item_url_doesnotexist(self) -> None:
        """ Checks that a non-existent collection url return 404 """

        response = APIClient().get('/item/z3zFunctions/11111111-1111-4000-a000-1111111111111/')
        self.assertEqual(response.status_code, 404)
        with self.assertRaises(KeyError):
            response['X-Sendfile']

    def test_nonmatch(self) -> None:
        """ Checks that non-collection urls do not match """

        response = APIClient().get('/z3zFunctions/')
        self.assertEqual(response.status_code, 404)
        with self.assertRaises(KeyError):
            response['X-Sendfile']

        response = APIClient().get('/collection/not.a.collection.html')
        self.assertEqual(response.status_code, 404)
        with self.assertRaises(KeyError):
            response['X-Sendfile']


        response = APIClient().get('/collection/z3zFunctions/something.html')
        self.assertEqual(response.status_code, 404)
        with self.assertRaises(KeyError):
            response['X-Sendfile']
