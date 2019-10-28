import json

from django.test import TestCase

from mhd_tests.utils import AssetPath, LoadJSONAsset

from .collection import insert_testing_data

JANE_COLLECTION_PATH = AssetPath(__file__, "res", "jane_collection.json")

JANE_DATA_PATH = AssetPath(__file__, "res", "jane_data.json")

JANE_PROVENANCE_PATH = AssetPath(__file__, "res", "jane_provenance.json")


class UpdateCountTest(TestCase):
    def setUp(self):
        """ Creates the demo collection using the upsert command """

        self.collection = insert_testing_data(
            JANE_COLLECTION_PATH, JANE_DATA_PATH, JANE_PROVENANCE_PATH, reset=True)

    def test_update_count(self):
        """ Checks that delete_collection actually deletes a collection """
        self.collection.count_frozen = False
        self.collection.save()

        # counting a collection gives the expected result
        self.assertIsNone(self.collection.count)
        self.assertEqual(self.collection.update_count(), 3)
        self.assertEqual(self.collection.count, 3)

        # insert a fake count
        self.collection.count = 100
        self.collection.save()

        # ensure that it is not updated
        self.assertEqual(self.collection.update_count(), 3)
        self.assertEqual(self.collection.count, 3)

    def test_update_frozen_count(self):
        # freeze the count
        self.collection.count_frozen = True
        self.collection.save()

        # ensure that is stays as is
        self.assertIsNone(self.collection.count)
        self.assertIsNone(self.collection.update_count())
        self.assertIsNone(self.collection.count)

        # insert a fake count
        self.collection.count = 100
        self.collection.save()

        # ensure that it is not updated
        self.assertEqual(self.collection.update_count(), None)
        self.assertEqual(self.collection.count, 100)
