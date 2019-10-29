import json

from django.test import TestCase

from mhd_tests.utils import AssetPath, LoadJSONAsset

from .collection import insert_testing_data

from ..models import Item

Z3Z_COLLECTION_PATH = AssetPath(__file__, "res", "z3z_collection.json")
Z3Z_PROVENANCE_PATH = AssetPath(__file__, "res", "z3z_provenance.json")
Z3Z_DATA_PATH = AssetPath(__file__, "res", "z3z_data.json")

Z3Z_ALL_PATH = AssetPath(__file__, "res", "z3z_query_all.json")
Z3Z_ALL_ASSET = LoadJSONAsset(Z3Z_ALL_PATH)

Z3Z_F1_PATH = AssetPath(__file__, "res", "z3z_query_f1.json")
Z3Z_F1_ASSET = LoadJSONAsset(Z3Z_F1_PATH)

Z3Z_F1_F2_PATH = AssetPath(__file__, "res", "z3z_query_f1_f2.json")
Z3Z_F1_F2_ASSET = LoadJSONAsset(Z3Z_F1_F2_PATH)


class Z3ZCollectionTest(TestCase):
    """
        Tests that the Z/3Z collection can be inserted into the database.
        The Z/3Z collection is a set of functions from Z/3Z including several
        nulls, which checks that the database importer and querying can handle those.
    """
    def setUp(self):
        self.collection = insert_testing_data(
            Z3Z_COLLECTION_PATH, Z3Z_DATA_PATH, Z3Z_PROVENANCE_PATH, reset=True)
    def test_build_query(self):
        """ Checks that queries are built correctly """

        col_pk = self.collection.pk
        f0_pk = self.collection.get_property('f0').pk
        f1_pk = self.collection.get_property('f1').pk
        f2_pk = self.collection.get_property('f2').pk
        invertible = self.collection.get_property('invertible').pk

        GOT_QUERY_ALL_PROPS, _ = self.collection.query()
        EXPECTED_QUERY_ALL_PROPS = 'SELECT I.id as id,"T_f0".value as "property_value_f0","T_f1".value as "property_value_f1","T_f2".value as "property_value_f2","T_invertible".value as "property_value_invertible" FROM mhd_data_item as I JOIN mhd_data_itemcollectionassociation as CI ON I.id = CI.item_id AND CI.collection_id = {} LEFT OUTER JOIN mhd_data_standardint as "T_f0" ON I.id = "T_f0".item_id AND "T_f0".active AND "T_f0".prop_id = {} LEFT OUTER JOIN mhd_data_standardint as "T_f1" ON I.id = "T_f1".item_id AND "T_f1".active AND "T_f1".prop_id = {} LEFT OUTER JOIN mhd_data_standardint as "T_f2" ON I.id = "T_f2".item_id AND "T_f2".active AND "T_f2".prop_id = {} LEFT OUTER JOIN mhd_data_standardbool as "T_invertible" ON I.id = "T_invertible".item_id AND "T_invertible".active AND "T_invertible".prop_id = {} ORDER BY I.id'
        EXPECTED_QUERY_ALL_PROPS = EXPECTED_QUERY_ALL_PROPS.format(col_pk, f0_pk, f1_pk, f2_pk, invertible)
        self.assertEqual(GOT_QUERY_ALL_PROPS.query.sql, EXPECTED_QUERY_ALL_PROPS,
                         "check that by default all properties are queried")
        self.assertTupleEqual(GOT_QUERY_ALL_PROPS.query.params, (),
                              "check that by default all properties are queried")

        ORDERED_QUERY_ALL, _ = self.collection.query(order='f1,-f0,+f2')
        EXPECTED_ORDERED_QUERY_ALL = 'SELECT I.id as id,"T_f0".value as "property_value_f0","T_f1".value as "property_value_f1","T_f2".value as "property_value_f2","T_invertible".value as "property_value_invertible" FROM mhd_data_item as I JOIN mhd_data_itemcollectionassociation as CI ON I.id = CI.item_id AND CI.collection_id = {} LEFT OUTER JOIN mhd_data_standardint as "T_f0" ON I.id = "T_f0".item_id AND "T_f0".active AND "T_f0".prop_id = {} LEFT OUTER JOIN mhd_data_standardint as "T_f1" ON I.id = "T_f1".item_id AND "T_f1".active AND "T_f1".prop_id = {} LEFT OUTER JOIN mhd_data_standardint as "T_f2" ON I.id = "T_f2".item_id AND "T_f2".active AND "T_f2".prop_id = {} LEFT OUTER JOIN mhd_data_standardbool as "T_invertible" ON I.id = "T_invertible".item_id AND "T_invertible".active AND "T_invertible".prop_id = {} ORDER BY "property_value_f1" ASC, "property_value_f0" DESC, "property_value_f2" ASC'
        EXPECTED_ORDERED_QUERY_ALL = EXPECTED_ORDERED_QUERY_ALL.format(col_pk, f0_pk, f1_pk, f2_pk, invertible)
        self.assertEqual(ORDERED_QUERY_ALL.query.sql, EXPECTED_ORDERED_QUERY_ALL,
                         "check that order queries are generated properly")
        self.assertTupleEqual(ORDERED_QUERY_ALL.query.params, (),
                              "check that order queries are generated properly")

        GOT_QUERY_F1_LIMIT, _ = self.collection.query(
            properties=[self.collection.get_property("f1")], limit=1, offset=2)
        EXPECTED_QUERY_F1_LIMIT = 'SELECT I.id as id,"T_f1".value as "property_value_f1" FROM mhd_data_item as I JOIN mhd_data_itemcollectionassociation as CI ON I.id = CI.item_id AND CI.collection_id = {} LEFT OUTER JOIN mhd_data_standardint as "T_f1" ON I.id = "T_f1".item_id AND "T_f1".active AND "T_f1".prop_id = {} ORDER BY I.id LIMIT 1 OFFSET 2'
        EXPECTED_QUERY_F1_LIMIT = EXPECTED_QUERY_F1_LIMIT.format(col_pk, f1_pk)
        self.assertEqual(GOT_QUERY_F1_LIMIT.query.sql, EXPECTED_QUERY_F1_LIMIT,
                         "check that a limit query for only 1 property is built as expected")
        self.assertTupleEqual(GOT_QUERY_F1_LIMIT.query.params, (),
                              "check that a limit query for only 1 property is built as expected")
        GOT_QUERY_F1_F2_FILTER, _ = self.collection.query(
            properties=[self.collection.get_property("f1"), self.collection.get_property("f2")], filter="f1 = 0")
        EXPECTED_QUERY_F1_F2_FILTER = 'SELECT I.id as id,"T_f1".value as "property_value_f1","T_f2".value as "property_value_f2" FROM mhd_data_item as I JOIN mhd_data_itemcollectionassociation as CI ON I.id = CI.item_id AND CI.collection_id = {} LEFT OUTER JOIN mhd_data_standardint as "T_f1" ON I.id = "T_f1".item_id AND "T_f1".active AND "T_f1".prop_id = {} LEFT OUTER JOIN mhd_data_standardint as "T_f2" ON I.id = "T_f2".item_id AND "T_f2".active AND "T_f2".prop_id = {} WHERE "T_f1".value = %s ORDER BY I.id'
        EXPECTED_QUERY_F1_F2_FILTER = EXPECTED_QUERY_F1_F2_FILTER.format(col_pk, f1_pk, f2_pk)
        self.assertEqual(GOT_QUERY_F1_F2_FILTER.query.sql, EXPECTED_QUERY_F1_F2_FILTER,
                         "check that an (f1, f2) query with filter is built as expected")
        self.assertTupleEqual(GOT_QUERY_F1_F2_FILTER.query.params, (0,),
                              "check that a limit query for only 1 property is built as expected")

    def test_query_semantics(self):
        """ Tests that .semantic() queries return the right values """

        GOT_QUERY_ALL = self.collection.semantic()
        self.assertJSONEqual(json.dumps(list(GOT_QUERY_ALL)), Z3Z_ALL_ASSET,
                             "check that the query for all properties returns all properties")


        GOT_QUERY_F1_LIMIT = self.collection.semantic(
            properties=[self.collection.get_property("f1")], limit=1, offset=2)
        self.assertJSONEqual(json.dumps(list(GOT_QUERY_F1_LIMIT)), Z3Z_F1_ASSET,
                             "check that the query for all a limited f1 returns correct response")


        GOT_QUERY_F1_F2_FILTER = self.collection.semantic(
            properties=[self.collection.get_property("f1"), self.collection.get_property("f2")], filter="f1 = 0")
        self.assertJSONEqual(json.dumps(list(GOT_QUERY_F1_F2_FILTER)), Z3Z_F1_F2_ASSET,
                             "check that the query for f1 = 0 returns the right results")

    def test_query_count(self):
        col_pk = self.collection.pk
        f0_pk = self.collection.get_property('f0').pk
        f1_pk = self.collection.get_property('f1').pk
        f2_pk = self.collection.get_property('f2').pk
        invertible = self.collection.get_property('invertible').pk

        GOT_QUERY_ALL_PROPS = self.collection.query_count()
        EXPECTED_QUERY_ALL_PROPS = 'SELECT Count(*) as count FROM mhd_data_item as I JOIN mhd_data_itemcollectionassociation as CI ON I.id = CI.item_id AND CI.collection_id = {} LEFT OUTER JOIN mhd_data_standardint as "T_f0" ON I.id = "T_f0".item_id AND "T_f0".active AND "T_f0".prop_id = {} LEFT OUTER JOIN mhd_data_standardint as "T_f1" ON I.id = "T_f1".item_id AND "T_f1".active AND "T_f1".prop_id = {} LEFT OUTER JOIN mhd_data_standardint as "T_f2" ON I.id = "T_f2".item_id AND "T_f2".active AND "T_f2".prop_id = {} LEFT OUTER JOIN mhd_data_standardbool as "T_invertible" ON I.id = "T_invertible".item_id AND "T_invertible".active AND "T_invertible".prop_id = {}'
        EXPECTED_QUERY_ALL_PROPS = EXPECTED_QUERY_ALL_PROPS.format(col_pk, f0_pk, f1_pk, f2_pk, invertible)
        self.assertEqual(GOT_QUERY_ALL_PROPS.query.sql, EXPECTED_QUERY_ALL_PROPS)
        self.assertTupleEqual(GOT_QUERY_ALL_PROPS.query.params, ())

        GOT_QUERY_F1_F2_FILTER = self.collection.query_count(
            properties=[self.collection.get_property("f1"), self.collection.get_property("f2")], filter="f1 = 0")
        EXPECTED_QUERY_F1_F2_FILTER = 'SELECT Count(*) as count FROM mhd_data_item as I JOIN mhd_data_itemcollectionassociation as CI ON I.id = CI.item_id AND CI.collection_id = {} LEFT OUTER JOIN mhd_data_standardint as "T_f1" ON I.id = "T_f1".item_id AND "T_f1".active AND "T_f1".prop_id = {} LEFT OUTER JOIN mhd_data_standardint as "T_f2" ON I.id = "T_f2".item_id AND "T_f2".active AND "T_f2".prop_id = {} WHERE "T_f1".value = %s'
        EXPECTED_QUERY_F1_F2_FILTER = EXPECTED_QUERY_F1_F2_FILTER.format(col_pk, f1_pk, f2_pk)
        self.assertEqual(GOT_QUERY_F1_F2_FILTER.query.sql, EXPECTED_QUERY_F1_F2_FILTER)
        self.assertTupleEqual(GOT_QUERY_F1_F2_FILTER.query.params, (0,))

    def test_query_item_semantics(self):
        for jitem in Z3Z_ALL_ASSET:
            item = Item.objects.get(id=jitem["_id"])
            GOT_ITEM_SEMANTIC = item.semantic(self.collection)
            self.assertJSONEqual(json.dumps(GOT_ITEM_SEMANTIC), jitem)
