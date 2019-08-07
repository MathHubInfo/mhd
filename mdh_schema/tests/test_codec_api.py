from django.test import TestCase
from rest_framework.test import APIClient

from mdh_django.utils import LoadJSONAsset, AssetPath

CODEC_LIST_PATH = AssetPath(__file__, "res", "codec_list.json")
CODEC_LIST_ASSET = LoadJSONAsset(CODEC_LIST_PATH)

CODEC_SI_PATH = AssetPath(__file__, "res", "codec_standardint.json")
CODEC_SI_ASSET = LoadJSONAsset(CODEC_SI_PATH)


class CollectionAPITest(TestCase):

    def test_api_all_collections(self):
        """ Checks that the demo collection is the only item in the list of collections """

        response = APIClient().get('/schema/codecs/')

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, CODEC_LIST_ASSET)

    def test_api_exact_collection(self):
        """ Checks that the demo collection can be found by slug """

        response = APIClient().get('/schema/codecs/standardint/')

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, CODEC_SI_ASSET)
