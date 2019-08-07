from django.test import TestCase

from ..models import Codec
from ..models.codecs import StandardInt


class CodecMetaTest(TestCase):
    def test_find_all_codecs(self):
        """ Checks that all codecs returned by codec are indeed codecs """

        # find all codecs
        got = list(Codec.find_all_codecs())

        # check that we got at least one
        self.assertGreaterEqual(
            len(got), 1, msg="at least one codec is returned")

        # check that they are all codecs
        for codec in got:
            self.assertTrue(issubclass(
                codec, Codec), msg="Codec.find_all_codecs() returns only codec-subclasses")

        # check that none of them are abstract
        for codec in got:
            self.assertTrue(not codec._meta.abstract,
                            msg="Codec.find_all_codecs() returns only concrete models")

    def test_find_codec(self):
        """ Checks that find_codec behaves as expected """

        # existing codec normalize = True
        self.assertEqual(Codec.find_codec("StandardInt"), StandardInt,
                         msg="finds the StandardInt codec by name (normalized)")
        self.assertEqual(Codec.find_codec("mdh_data_StandardInt"), StandardInt,
                         msg="finds the StandardInt codec by table name (normalized)")

        # existing codec normalize = False
        self.assertEqual(Codec.find_codec("standardint", normalize=False),
                         StandardInt, msg="finds the StandardInt codec by normalized name")
        self.assertIsNone(Codec.find_codec("StandardInt", normalize=False),
                          msg="does not normalize name when normalize = False")
        self.assertIsNone(Codec.find_codec("mdh_data_StandardInt", normalize=False),
                          msg="does not normalize name when normalize = False")

        # non-existing codec
        self.assertIsNone(Codec.find_codec(
            "This-codec-doesnt-exist"), msg="does not find a non-existent codec")
