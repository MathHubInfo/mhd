from django.test import TestCase
from rest_framework.test import APIClient

from .collectionv0 import CollectionV0Test

class FrontendProxyTest(CollectionV0Test, TestCase):
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

    def test_nonmatch(self):
        """ Checks that non-collection urls do not match """

        response = APIClient().get('/z4zFunctions/')
        self.assertEqual(response.status_code, 404)

        response = APIClient().get('/collection/not.a.collection.html')
        self.assertEqual(response.status_code, 404)


        response = APIClient().get('/collection/z4zFunctions/something.html')
        self.assertEqual(response.status_code, 404)
