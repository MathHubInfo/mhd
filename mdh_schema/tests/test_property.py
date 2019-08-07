from django.core.management import call_command
from django.test import TestCase

from mdh_data.models import StandardInt
from mdh_django.utils import AssetPath

from ..models import Property

DEMO_COLLECTION_PATH = AssetPath(__file__, "res", "collection_v0.json")


class PropertyTest(TestCase):

    def setUp(self):
        """ Creates the demo collection using the upsert command """

        # create the collection
        call_command('upsert_collection', DEMO_COLLECTION_PATH,
                     update=False, quiet=True)

    def test_property_codec(self):
        """ Tests that the property can be used """

        # get the trace property
        trace = Property.objects.get(slug="trace")

        # checks that the codec_model exists
        self.assertIs(trace.codec_model, StandardInt)
