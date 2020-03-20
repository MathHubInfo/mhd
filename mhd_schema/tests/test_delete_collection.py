from __future__ import annotations

from django.test import TestCase

from django.core.management import call_command

from ..models import Collection, Property, PropertyCollectionMembership

from mhd_tests.utils import LoadJSONAsset, AssetPath

COLLECTION_V0_PATH = AssetPath(__file__, "res", "collection_v0.json")
COLLECTION_V0_ASSET = LoadJSONAsset(COLLECTION_V0_PATH)


class CreateCollectionTest(TestCase):
    def setUp(self) -> None:
        """ Creates the demo collection using the upsert command """

        call_command('upsert_collection', COLLECTION_V0_PATH,
                     update=False, quiet=True)

        self.collection = Collection.objects.get(slug='z3zFunctions')

    def test_delete_collection(self) -> None:
        """ Checks that delete_collection actually deletes a collection """

        self.collection.safe_delete()
        self.assertFalse(Collection.objects.exists(), "Check that there are no more collections")
        self.assertFalse(Property.objects.exists(), "Check that there are no more properties")
        self.assertFalse(PropertyCollectionMembership.objects.exists(), "Check that there are no more property-collection memberships")
