from ..query import FilterBuilder
from django.test import TestCase

from mhd_data.tests.collection import insert_testing_data

from mhd_tests.utils import AssetPath

Z3Z_COLLECTION_PATH = AssetPath(__file__, "..", "..", "mhd_data", "tests", "res", "z3z_collection.json")
Z3Z_PROVENANCE_PATH = AssetPath(__file__, "..", "..", "mhd_data", "tests", "res", "z3z_provenance.json")
Z3Z_DATA_PATH = AssetPath(__file__, "..", "..", "mhd_data", "tests", "res", "z3z_data.json")


class FilterBuilderTest(TestCase):
    def setUp(self):
        self.collection = insert_testing_data(
            Z3Z_COLLECTION_PATH, Z3Z_DATA_PATH, Z3Z_PROVENANCE_PATH, reset=True)

    def test_build_filters(self):
        # create a filter builder
        fb = FilterBuilder(self.collection)

        # simple logicals

        # left operand
        q1sql, q1args = fb("f1 <= 1")
        self.assertEqual(q1sql, '"property_value_f1" <= %s')
        self.assertListEqual(q1args, [1])

        # right operand
        q2sql, q2args = fb("1 <= f1")
        self.assertEqual(q2sql, '%s <= "property_value_f1"')
        self.assertListEqual(q2args, [1])

        # both operands
        q3sql, q3args = fb("f1 <= f2")
        self.assertEqual(q3sql, '"property_value_f1" <= "property_value_f2"')
        self.assertListEqual(q3args, [])

        # logical and
        q4sql, q4args = fb("f1 >= 0 && f1 <= 10")
        self.assertEqual(q4sql, '("property_value_f1" >= %s) AND ("property_value_f1" <= %s)')
        self.assertListEqual(q4args, [0, 10])

        # logical or
        q5sql, q5args = fb("f1 >= 1 || f1 <= 2")
        self.assertEqual(q5sql, '("property_value_f1" >= %s) OR ("property_value_f1" <= %s)')
        self.assertListEqual(q5args, [1, 2])

        # logical not
        q6sql, q6args = fb("!(f1 = 1)")
        self.assertEqual(q6sql, 'NOT("property_value_f1" = %s)')
        self.assertListEqual(q6args, [1])

        # big combination
        q7sql, q7args = fb("!(!(f1 = 1) || f2 = 0)")
        self.assertEqual(
            q7sql, 'NOT((NOT("property_value_f1" = %s)) OR ("property_value_f2" = %s))')
        self.assertListEqual(q7args, [1, 0])
