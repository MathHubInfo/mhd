from django.test import TestCase

from mdh_data.models import StandardInt, StandardBool

from ..models import Property
from .collectionv0 import CollectionV0Test


class PropertyTest(CollectionV0Test, TestCase):

    def test_property_codec(self):
        """ Tests that the property can be used """

        # get the trace property
        trace = Property.objects.get(slug="f0")

        # checks that the codec_model exists
        self.assertIs(trace.codec_model, StandardInt)

    def test_collection_codecs(self):
        """ Checks that the .codecs property of a collection returns the right codecs and properties """

        self.assertSetEqual(self.collection.codecs,
                            set([StandardInt, StandardBool]))
