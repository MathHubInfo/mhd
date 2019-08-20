from django.test import TestCase
from rest_framework.test import APIClient

from mdh_tests.utils import AssetPath

from .collection import insert_testing_data

Z4Z_COLLECTION_PATH = AssetPath(__file__, "res", "z4z_collection.json")
Z4Z_PROVENANCE_PATH = AssetPath(__file__, "res", "z4z_provenance.json")
Z4Z_DATA_PATH = AssetPath(__file__, "res", "z4z_data.json")

class FrontendProxyTest(TestCase):
    def setUp(self):
        self.collection = insert_testing_data(
            Z4Z_COLLECTION_PATH, Z4Z_DATA_PATH, Z4Z_PROVENANCE_PATH, reset=True)
    def test_root_url(self):
        """ Checks that the root url returns an appropriate X-Accel-Redirect """

        response = APIClient().get('/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['X-Accel-Redirect'], '/frontend/')

    def test_collection_url_exists(self):
        """ Checks that a good collection url is redirected to /frontend/ """

        response = APIClient().get('/collection/z4zFunctions/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['X-Accel-Redirect'], '/frontend/')

    def test_collection_url_doesnotexist(self):
        """ Checks that a non-existent collection url is redirected to /frontend/404/ """

        response = APIClient().get('/collection/nonExistentCollection/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['X-Accel-Redirect'], '/frontend/404/')

    def test_item_url_exists(self):
        """ Checks that a good collection url is redirected to /frontend/ """

        response = APIClient().get('/item/00000000-0000-4000-a000-000000000000')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['X-Accel-Redirect'], '/frontend/')

    def test_item_url_doesnotexist(self):
        """ Checks that a non-existent collection url is redirected to /frontend/404/ """

        response = APIClient().get('/item/11111111-1111-4000-a000-1111111111111')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['X-Accel-Redirect'], '/frontend/404/')

    def test_nonmatch(self):
        """ Checks that non-collection urls do not match """

        response = APIClient().get('/z4zFunctions/')
        self.assertEqual(response.status_code, 404)

        response = APIClient().get('/collection/not.a.collection.html')
        self.assertEqual(response.status_code, 404)


        response = APIClient().get('/collection/z4zFunctions/something.html')
        self.assertEqual(response.status_code, 404)
