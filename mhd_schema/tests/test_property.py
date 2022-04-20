from __future__ import annotations

from django.core.management import call_command
from django.test import TestCase

from mhd_data.models import StandardBool, StandardInt
from mhd_tests.utils import AssetPath

from ..models import Collection

from ..models import Property

Z3Z_V1_PATH = AssetPath(__file__, "res", "collection_v1.json")


class PropertyTest(TestCase):
    def setUp(self) -> None:
        """ Creates the demo collection using the upsert command """

        # create the collection
        call_command('upsert_collection', Z3Z_V1_PATH,
                     update=False, quiet=True)
        self.collection = Collection.objects.get(slug='z3zFunctions')

    def test_property_codec(self) -> None:
        """ Tests that the property can be used """

        # get the trace property
        trace = Property.objects.get(slug="f0")

        # checks that the codec_model exists
        self.assertIs(trace.codec_model, StandardInt)

    def test_collection_codecs(self) -> None:
        """ Checks that the .codecs property of a collection returns the right codecs and properties """

        self.assertSetEqual(self.collection.codecs,
                            {StandardInt, StandardBool})
