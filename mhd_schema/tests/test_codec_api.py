from __future__ import annotations

from django.test import TestCase
from rest_framework.test import APIClient
import json

from mhd_tests.utils import LoadJSONAsset, AssetPath

CODEC_LIST_PATH = AssetPath(__file__, "res", "codec_list.json")
CODEC_LIST_ASSET = LoadJSONAsset(CODEC_LIST_PATH)

CODEC_SI_PATH = AssetPath(__file__, "res", "codec_standardint.json")
CODEC_SI_ASSET = LoadJSONAsset(CODEC_SI_PATH)


class CodecAPITest(TestCase):
    def test_api_all_collections(self) -> None:
        """Checks that the demo collection is the only item in the list of collections"""

        response = APIClient().get("/api/schema/codecs/")

        # we got an http 200
        self.assertEqual(response.status_code, 200)

        GOT_JSON = response.json()
        GOT_NAMES = [c["name"] for c in GOT_JSON]
        for c in CODEC_LIST_ASSET:
            try:
                idx = GOT_NAMES.index(c["name"])
            except:
                idx = -1
            self.assertNotEqual(
                idx, -1, "Expected that codec {} is found".format(c["name"])
            )
            self.assertJSONEqual(json.dumps(GOT_JSON[idx]), c)

    def test_api_exact_collection(self) -> None:
        """Checks that the demo collection can be found by slug"""

        response = APIClient().get("/api/schema/codecs/StandardInt/")

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, CODEC_SI_ASSET)
