import json

from django.test import TestCase

from mdh_tests.utils import AssetPath, LoadJSONAsset

from .z4z import Z4ZTest

Z4Z_ALL_PATH = AssetPath(__file__, "res", "z4z_query_all.json")
Z4Z_ALL_ASSET = LoadJSONAsset(Z4Z_ALL_PATH)

Z4Z_F1_PATH = AssetPath(__file__, "res", "z4z_query_f1.json")
Z4Z_F1_ASSET = LoadJSONAsset(Z4Z_F1_PATH)

Z4Z_F1_F2_PATH = AssetPath(__file__, "res", "z4z_query_f1_f2.json")
Z4Z_F1_F2_ASSET = LoadJSONAsset(Z4Z_F1_F2_PATH)


class CreateCollectionTest(Z4ZTest, TestCase):
    def test_build_query(self):
        """ Checks that queries are built correctly """

        self.maxDiff = None

        f0_pk = self.collection.get_property('f0').pk
        f1_pk = self.collection.get_property('f1').pk
        f2_pk = self.collection.get_property('f2').pk
        invertible = self.collection.get_property('invertible').pk

        GOT_QUERY_ALL_PROPS, _ = self.collection.query()
        EXPECTED_QUERY_ALL_PROPS = "SELECT I.id as id,T_f0.value as property_value_f0,T_f0.id as property_cid_f0,T_f1.value as property_value_f1,T_f1.id as property_cid_f1,T_f2.value as property_value_f2,T_f2.id as property_cid_f2,T_invertible.value as property_value_invertible,T_invertible.id as property_cid_invertible FROM mdh_data_item as I LEFT OUTER JOIN mdh_data_standardint as T_f0 ON I.id = T_f0.item_id AND T_f0.active AND T_f0.prop_id = {} LEFT OUTER JOIN mdh_data_standardint as T_f1 ON I.id = T_f1.item_id AND T_f1.active AND T_f1.prop_id = {} LEFT OUTER JOIN mdh_data_standardint as T_f2 ON I.id = T_f2.item_id AND T_f2.active AND T_f2.prop_id = {} LEFT OUTER JOIN mdh_data_standardbool as T_invertible ON I.id = T_invertible.item_id AND T_invertible.active AND T_invertible.prop_id = {} ORDER BY I.id"
        EXPECTED_QUERY_ALL_PROPS = EXPECTED_QUERY_ALL_PROPS.format(f0_pk, f1_pk, f2_pk, invertible)
        self.assertEqual(GOT_QUERY_ALL_PROPS.query.sql, EXPECTED_QUERY_ALL_PROPS,
                         "check that by default all properties are queried")
        self.assertTupleEqual(GOT_QUERY_ALL_PROPS.query.params, (),
                              "check that by default all properties are queried")

        GOT_QUERY_F1_LIMIT, _ = self.collection.query(
            properties=[self.collection.get_property("f1")], limit=1, offset=2)
        EXPECTED_QUERY_F1_LIMIT = "SELECT I.id as id,T_f1.value as property_value_f1,T_f1.id as property_cid_f1 FROM mdh_data_item as I LEFT OUTER JOIN mdh_data_standardint as T_f1 ON I.id = T_f1.item_id AND T_f1.active AND T_f1.prop_id = {} ORDER BY I.id LIMIT 1 OFFSET 2"
        EXPECTED_QUERY_F1_LIMIT = EXPECTED_QUERY_F1_LIMIT.format(f1_pk)
        self.assertEqual(GOT_QUERY_F1_LIMIT.query.sql, EXPECTED_QUERY_F1_LIMIT,
                         "check that a limit query for only 1 property is built as expected")
        self.assertTupleEqual(GOT_QUERY_F1_LIMIT.query.params, (),
                              "check that a limit query for only 1 property is built as expected")

        GOT_QUERY_F1_F2_FILTER, _ = self.collection.query(
            properties=[self.collection.get_property("f1"), self.collection.get_property("f2")], filter="f1 = 0")
        EXPECTED_QUERY_F1_F2_FILTER = "SELECT I.id as id,T_f1.value as property_value_f1,T_f1.id as property_cid_f1,T_f2.value as property_value_f2,T_f2.id as property_cid_f2 FROM mdh_data_item as I LEFT OUTER JOIN mdh_data_standardint as T_f1 ON I.id = T_f1.item_id AND T_f1.active AND T_f1.prop_id = {} LEFT OUTER JOIN mdh_data_standardint as T_f2 ON I.id = T_f2.item_id AND T_f2.active AND T_f2.prop_id = {} WHERE T_f1.value = %s ORDER BY I.id"
        EXPECTED_QUERY_F1_F2_FILTER = EXPECTED_QUERY_F1_F2_FILTER.format(f1_pk, f2_pk)
        self.assertEqual(GOT_QUERY_F1_F2_FILTER.query.sql, EXPECTED_QUERY_F1_F2_FILTER,
                         "check that an (f1, f2) query with filter is built as expected")
        self.assertTupleEqual(GOT_QUERY_F1_F2_FILTER.query.params, (0,),
                              "check that a limit query for only 1 property is built as expected")

    def test_query_semantics(self):
        """ Tests that .semantic() queries return the right values """

        GOT_QUERY_ALL = self.collection.semantic()
        self.assertJSONEqual(json.dumps(list(GOT_QUERY_ALL)), Z4Z_ALL_ASSET,
                             "check that the query for all properties returns all properties")


        GOT_QUERY_F1_LIMIT = self.collection.semantic(
            properties=[self.collection.get_property("f1")], limit=1, offset=2)
        self.assertJSONEqual(json.dumps(list(GOT_QUERY_F1_LIMIT)), Z4Z_F1_ASSET,
                             "check that the query for all a limited f1 returns correct response")


        GOT_QUERY_F1_F2_FILTER = self.collection.semantic(
            properties=[self.collection.get_property("f1"), self.collection.get_property("f2")], filter="f1 = 0")
        self.assertJSONEqual(json.dumps(list(GOT_QUERY_F1_F2_FILTER)), Z4Z_F1_F2_ASSET,
                             "check that the query for f1 = 0 returns the right results")
