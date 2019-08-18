from django.test import TestCase

from ..models import Codec, CodecManager
from ..models.codecs import StandardInt, StandardBool


class CodecManagerTest(TestCase):
    def test_find_all_codecs(self):
        """ Checks that all codecs returned by codec are indeed codecs """

        # find all codecs
        got = list(CodecManager.find_all_codecs())

        # check that we got at least one
        self.assertGreaterEqual(
            len(got), 1, msg="at least one codec is returned")

        # check that they are all codecs
        for codec in got:
            self.assertTrue(issubclass(
                codec, Codec), msg="CodecManager.find_all_codecs() returns only codec-subclasses")

        # check that none of them are abstract
        for codec in got:
            self.assertTrue(not codec._meta.abstract,
                            msg="CodecManager.find_all_codecs() returns only concrete models")

    def test_find_codec(self):
        """ Checks that find_codec behaves as expected """

        # existing codec
        self.assertEqual(CodecManager.find_codec("StandardInt"), StandardInt,
                         msg="finds the StandardInt codec by name")

        # not finding existing codec
        self.assertIsNone(CodecManager.find_codec("mdh_data_standardint"),
                         msg="does not the StandardInt codec by table name")
        self.assertIsNone(CodecManager.find_codec("standardint"),
                        msg="does not the StandardInt codec by normalized name")

        # non-existing codec
        self.assertIsNone(CodecManager.find_codec(
            "This-codec-doesnt-exist"), msg="does not find a non-existent codec")

    def test_collect_operators(self):
        """ Checks that the collect_operators function works as expected """

        self.assertSetEqual(CodecManager.collect_operators(
            [StandardBool]), set(["=", "!="]), "Test that collecting only StandardBool operators works as expected")

        self.assertSetEqual(CodecManager.collect_operators([StandardInt, StandardBool]),
                            set(['=', '<', '<=', '>', '>=', '!=']),
                            "Test that collecting int and bool operators works as expected")

    def test_is_valid_operand(self):
        """ Checks the is_valid_operand methods """

        # StandardInt
        self.assertTrue(StandardInt.is_valid_operand(
            123), "checks that 123 is a valid StandardInt operand")
        self.assertFalse(StandardInt.is_valid_operand(
            True), "checks that True is not a valid StandardInt operand")

        # StandardBool
        self.assertFalse(StandardBool.is_valid_operand(
            123), "checks that 123 is not a valid StandardBool operand")
        self.assertTrue(StandardBool.is_valid_operand(True),
                        "checks that True is a valid StandardBool operand")

    def test_operations(self):
        """ Checks that generating operations on StandardInt works properly """

        # operate left
        olsql, olargs = StandardInt.operate_left(123, "<=", "T_f1")
        self.assertEqual(olsql, "%s <= T_f1")
        self.assertListEqual(olargs, [123])

        # operate right
        olsql, olargs = StandardInt.operate_right("T_f1", "<=", 123)
        self.assertEqual(olsql, "T_f1 <= %s")
        self.assertListEqual(olargs, [123])

        # operate both
        bsql, bargs = StandardInt.operate_both("T_f1", "<=", "T_f2")
        self.assertEqual(bsql, "T_f1 <= T_f2")
        self.assertListEqual(bargs, [])
