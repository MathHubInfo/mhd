from django.test import TestCase

from .z4z import Z4ZTest

from ..querybuilder import QueryBuilder


class QueryBuilderTest(Z4ZTest, TestCase):
    def setUp(self):
        super().setUp()

        self.properties = list(self.collection.property_set.all())

    def test_build_queries(self):
        # create a query builder
        qb = QueryBuilder()

        # simple logicals

        # left operand
        q1sql, q1args = qb("f1 <= 1", self.properties)
        self.assertEqual(q1sql, 'T_f1.value <= %s')
        self.assertListEqual(q1args, [1])

        # right operand
        q2sql, q2args = qb("1 <= f1", self.properties)
        self.assertEqual(q2sql, '%s <= T_f1.value')
        self.assertListEqual(q2args, [1])

        # both operands
        q3sql, q3args = qb("f1 <= f2", self.properties)
        self.assertEqual(q3sql, 'T_f1.value <= T_f2.value')
        self.assertListEqual(q3args, [])

        # logical and
        q4sql, q4args = qb("f1 >= 0 && f1 <= 10", self.properties)
        self.assertEqual(q4sql, '(T_f1.value >= %s) AND (T_f1.value <= %s)')
        self.assertListEqual(q4args, [0, 10])

        # logical or
        q5sql, q5args = qb("f1 >= 1 || f1 <= 2", self.properties)
        self.assertEqual(q5sql, '(T_f1.value >= %s) OR (T_f1.value <= %s)')
        self.assertListEqual(q5args, [1, 2])

        # logical not
        q6sql, q6args = qb("!(f1 == 1)", self.properties)
        self.assertEqual(q6sql, 'NOT(T_f1.value == %s)')
        self.assertListEqual(q6args, [1])

        # big combination
        q7sql, q7args = qb("!(!(f1 == 1) || f2 == 0)", self.properties)
        self.assertEqual(q7sql, 'NOT((NOT(T_f1.value == %s)) OR (T_f2.value == %s))')
        self.assertListEqual(q7args, [1, 0])
