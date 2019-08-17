import json
import uuid
from unittest import mock

from django.core.management import call_command
from django.test import TestCase

from mdh.utils.uuid import uuid4_mock, uuid4_mock_reset
from mdh_schema.models import Collection
from mdh_tests.utils import AssetPath, LoadJSONAsset

JANE_COLLECTION_PATH = AssetPath(__file__, "res", "jane_collection.json")

JANE_DATA_PATH = AssetPath(__file__, "res", "jane_data.json")

JANE_PROVENANCE_PATH = AssetPath(__file__, "res", "jane_provenance.json")

JANE_ALL_PATH = AssetPath(__file__, "res", "jane_all.json")
JANE_ALL_ASSET = LoadJSONAsset(JANE_ALL_PATH)


class CreateCollectionTest(TestCase):
    def setUp(self):
        """ Creates the demo collection using the upsert command """

        uuid4_mock_reset()
        with mock.patch.object(uuid, 'uuid4', uuid4_mock):
            # create the collection
            call_command('upsert_collection', JANE_COLLECTION_PATH,
                        update=False, quiet=True)
            # insert the data in the collection
            call_command('insert_data', JANE_DATA_PATH, collection="jane",
                        fields="mat,trace,orthogonal,eigenvalues,characteristic", provenance=JANE_PROVENANCE_PATH, quiet=True)
        self.collection = Collection.objects.get(slug='jane')

    def test_data_exists(self):

        GOT_QUERY_ALL = self.collection.semantic()
        self.assertJSONEqual(json.dumps(list(GOT_QUERY_ALL)), JANE_ALL_ASSET,
                            "check that the query for all properties returns all properties")
