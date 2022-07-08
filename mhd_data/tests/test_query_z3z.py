from __future__ import annotations

import json

from django.test import TestCase

from mhd_tests.utils import AssetPath, LoadJSONAsset

from .collection import insert_testing_data

from ..models import Item

from typing import TYPE_CHECKING, TypeAlias, Any

if TYPE_CHECKING:
    from django.db.models import QuerySet

    SQL: TypeAlias = QuerySet
    # an sql query with parameters
    SQLWithParams: TypeAlias = tuple[SQL, list[int | str]]

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

    def setUp(self) -> None:
        self.collection = insert_testing_data(
            Z3Z_COLLECTION_PATH, Z3Z_DATA_PATH, Z3Z_PROVENANCE_PATH, reset=True)

    def _assert_query(self, got: SQL | SQLWithParams, expected_query: str, expected_props: list[Any]):
        if isinstance(got, tuple):
            got_qs = got[0]
        else:
            got_qs = got
        print("got", got_qs.query.sql)
        print("expected", expected_query.strip())
        expected_query = expected_query.strip()
        print(got_qs.query.sql)
        self.assertEqual(got_qs.query.sql, expected_query,
                         "query is as expected")
        print(got_qs.query.params)
        print(expected_props)
        self.assertTupleEqual(tuple(got_qs.query.params), expected_props,
                              "props are as expected")

    def test_build_query(self) -> None:
        """ Checks that queries are built correctly """

        col_pk = str(self.collection.pk)
        f0_pk = str(self.collection.get_property('f0').pk)
        f1_pk = str(self.collection.get_property('f1').pk)
        f2_pk = str(self.collection.get_property('f2').pk)
        invertible = str(self.collection.get_property('invertible').pk)

        # query
        plain_query = self.collection.query()
        self._assert_query(plain_query, """
SELECT id, "property_value_f0_0", "property_cid_f0", "property_value_f1_0", "property_cid_f1", "property_value_f2_0", "property_cid_f2", "property_value_invertible_0", "property_cid_invertible" FROM (SELECT I.id as id, "T_f0".value as "property_value_f0_0", "T_f0".id as "property_cid_f0", "T_f1".value as "property_value_f1_0", "T_f1".id as "property_cid_f1", "T_f2".value as "property_value_f2_0", "T_f2".id as "property_cid_f2", "T_invertible".value as "property_value_invertible_0", "T_invertible".id as "property_cid_invertible" FROM mhd_data_item as I JOIN mhd_data_itemcollectionassociation as CI ON I.id = CI.item_id AND CI.collection_id = %s LEFT OUTER JOIN mhd_data_standardint AS "T_f0" ON I.id = "T_f0".item_id AND "T_f0".active AND "T_f0".prop_id = %s LEFT OUTER JOIN mhd_data_standardint AS "T_f1" ON I.id = "T_f1".item_id AND "T_f1".active AND "T_f1".prop_id = %s LEFT OUTER JOIN mhd_data_standardint AS "T_f2" ON I.id = "T_f2".item_id AND "T_f2".active AND "T_f2".prop_id = %s LEFT OUTER JOIN mhd_data_standardbool AS "T_invertible" ON I.id = "T_invertible".item_id AND "T_invertible".active AND "T_invertible".prop_id = %s) AS collection
        """, (col_pk, f0_pk, f1_pk, f2_pk, invertible))

        # query with order
        order_query = self.collection.query(order='f1,-f0,+f2')
        self._assert_query(order_query, """
SELECT id, "property_value_f0_0", "property_cid_f0", "property_value_f1_0", "property_cid_f1", "property_value_f2_0", "property_cid_f2", "property_value_invertible_0", "property_cid_invertible" FROM (SELECT I.id as id, "T_f0".value as "property_value_f0_0", "T_f0".id as "property_cid_f0", "T_f1".value as "property_value_f1_0", "T_f1".id as "property_cid_f1", "T_f2".value as "property_value_f2_0", "T_f2".id as "property_cid_f2", "T_invertible".value as "property_value_invertible_0", "T_invertible".id as "property_cid_invertible" FROM mhd_data_item as I JOIN mhd_data_itemcollectionassociation as CI ON I.id = CI.item_id AND CI.collection_id = %s LEFT OUTER JOIN mhd_data_standardint AS "T_f0" ON I.id = "T_f0".item_id AND "T_f0".active AND "T_f0".prop_id = %s LEFT OUTER JOIN mhd_data_standardint AS "T_f1" ON I.id = "T_f1".item_id AND "T_f1".active AND "T_f1".prop_id = %s LEFT OUTER JOIN mhd_data_standardint AS "T_f2" ON I.id = "T_f2".item_id AND "T_f2".active AND "T_f2".prop_id = %s LEFT OUTER JOIN mhd_data_standardbool AS "T_invertible" ON I.id = "T_invertible".item_id AND "T_invertible".active AND "T_invertible".prop_id = %s) AS collection ORDER BY "property_value_f1_0" ASC, "property_value_f0_0" DESC, "property_value_f2_0" ASC
        """, (col_pk, f0_pk, f1_pk, f2_pk, invertible))

        # limit
        limit_query = self.collection.query(
            properties=[self.collection.get_property("f1")], limit=1, offset=2)
        self._assert_query(limit_query, """
SELECT id, "property_value_f1_0", "property_cid_f1" FROM (SELECT I.id as id, "T_f0".value as "property_value_f0_0", "T_f0".id as "property_cid_f0", "T_f1".value as "property_value_f1_0", "T_f1".id as "property_cid_f1", "T_f2".value as "property_value_f2_0", "T_f2".id as "property_cid_f2", "T_invertible".value as "property_value_invertible_0", "T_invertible".id as "property_cid_invertible" FROM mhd_data_item as I JOIN mhd_data_itemcollectionassociation as CI ON I.id = CI.item_id AND CI.collection_id = %s LEFT OUTER JOIN mhd_data_standardint AS "T_f0" ON I.id = "T_f0".item_id AND "T_f0".active AND "T_f0".prop_id = %s LEFT OUTER JOIN mhd_data_standardint AS "T_f1" ON I.id = "T_f1".item_id AND "T_f1".active AND "T_f1".prop_id = %s LEFT OUTER JOIN mhd_data_standardint AS "T_f2" ON I.id = "T_f2".item_id AND "T_f2".active AND "T_f2".prop_id = %s LEFT OUTER JOIN mhd_data_standardbool AS "T_invertible" ON I.id = "T_invertible".item_id AND "T_invertible".active AND "T_invertible".prop_id = %s) AS collection LIMIT %s OFFSET %s
        """, (col_pk, f0_pk, f1_pk, f2_pk, invertible, 1, 2))

        # filter
        filter_query = self.collection.query(properties=[self.collection.get_property(
            "f1"), self.collection.get_property("f2")], filter="f1 = 0")
        self._assert_query(filter_query, """
SELECT id, "property_value_f1_0", "property_cid_f1", "property_value_f2_0", "property_cid_f2" FROM (SELECT I.id as id, "T_f0".value as "property_value_f0_0", "T_f0".id as "property_cid_f0", "T_f1".value as "property_value_f1_0", "T_f1".id as "property_cid_f1", "T_f2".value as "property_value_f2_0", "T_f2".id as "property_cid_f2", "T_invertible".value as "property_value_invertible_0", "T_invertible".id as "property_cid_invertible" FROM mhd_data_item as I JOIN mhd_data_itemcollectionassociation as CI ON I.id = CI.item_id AND CI.collection_id = %s LEFT OUTER JOIN mhd_data_standardint AS "T_f0" ON I.id = "T_f0".item_id AND "T_f0".active AND "T_f0".prop_id = %s LEFT OUTER JOIN mhd_data_standardint AS "T_f1" ON I.id = "T_f1".item_id AND "T_f1".active AND "T_f1".prop_id = %s LEFT OUTER JOIN mhd_data_standardint AS "T_f2" ON I.id = "T_f2".item_id AND "T_f2".active AND "T_f2".prop_id = %s LEFT OUTER JOIN mhd_data_standardbool AS "T_invertible" ON I.id = "T_invertible".item_id AND "T_invertible".active AND "T_invertible".prop_id = %s) AS collection WHERE "property_value_f1_0" = %s
        """, (col_pk, f0_pk, f1_pk, f2_pk, invertible, 0))

    def test_query_semantics(self) -> None:
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

    def test_query_count(self) -> None:
        col_pk = str(self.collection.pk)
        f0_pk = str(self.collection.get_property('f0').pk)
        f1_pk = str(self.collection.get_property('f1').pk)
        f2_pk = str(self.collection.get_property('f2').pk)
        invertible = str(self.collection.get_property('invertible').pk)

        # normal query
        plain_query = self.collection.query_count()
        self._assert_query(plain_query, """
SELECT COUNT(*) FROM (SELECT I.id as id, "T_f0".value as "property_value_f0_0", "T_f0".id as "property_cid_f0", "T_f1".value as "property_value_f1_0", "T_f1".id as "property_cid_f1", "T_f2".value as "property_value_f2_0", "T_f2".id as "property_cid_f2", "T_invertible".value as "property_value_invertible_0", "T_invertible".id as "property_cid_invertible" FROM mhd_data_item as I JOIN mhd_data_itemcollectionassociation as CI ON I.id = CI.item_id AND CI.collection_id = %s LEFT OUTER JOIN mhd_data_standardint AS "T_f0" ON I.id = "T_f0".item_id AND "T_f0".active AND "T_f0".prop_id = %s LEFT OUTER JOIN mhd_data_standardint AS "T_f1" ON I.id = "T_f1".item_id AND "T_f1".active AND "T_f1".prop_id = %s LEFT OUTER JOIN mhd_data_standardint AS "T_f2" ON I.id = "T_f2".item_id AND "T_f2".active AND "T_f2".prop_id = %s LEFT OUTER JOIN mhd_data_standardbool AS "T_invertible" ON I.id = "T_invertible".item_id AND "T_invertible".active AND "T_invertible".prop_id = %s) AS collection
        """, (col_pk, f0_pk, f1_pk, f2_pk, invertible))

        # filter
        filter_query = self.collection.query_count(properties=[self.collection.get_property(
            "f1"), self.collection.get_property("f2")], filter="f1 = 0")
        self._assert_query(filter_query, """
SELECT COUNT(*) FROM (SELECT I.id as id, "T_f0".value as "property_value_f0_0", "T_f0".id as "property_cid_f0", "T_f1".value as "property_value_f1_0", "T_f1".id as "property_cid_f1", "T_f2".value as "property_value_f2_0", "T_f2".id as "property_cid_f2", "T_invertible".value as "property_value_invertible_0", "T_invertible".id as "property_cid_invertible" FROM mhd_data_item as I JOIN mhd_data_itemcollectionassociation as CI ON I.id = CI.item_id AND CI.collection_id = %s LEFT OUTER JOIN mhd_data_standardint AS "T_f0" ON I.id = "T_f0".item_id AND "T_f0".active AND "T_f0".prop_id = %s LEFT OUTER JOIN mhd_data_standardint AS "T_f1" ON I.id = "T_f1".item_id AND "T_f1".active AND "T_f1".prop_id = %s LEFT OUTER JOIN mhd_data_standardint AS "T_f2" ON I.id = "T_f2".item_id AND "T_f2".active AND "T_f2".prop_id = %s LEFT OUTER JOIN mhd_data_standardbool AS "T_invertible" ON I.id = "T_invertible".item_id AND "T_invertible".active AND "T_invertible".prop_id = %s) AS collection WHERE "property_value_f1_0" = %s
        """, (col_pk, f0_pk, f1_pk, f2_pk, invertible, 0))

    def test_query_item_semantics(self) -> None:
        for jitem in Z3Z_ALL_ASSET:
            item = Item.objects.get(id=jitem["_id"])
            GOT_ITEM_SEMANTIC = item.semantic(self.collection)
            self.assertJSONEqual(json.dumps(GOT_ITEM_SEMANTIC), jitem)
