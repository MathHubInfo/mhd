import json
import uuid
from unittest import mock

from django.core.management import call_command
from django.test import TestCase

from mdh_django.utils import AssetPath, LoadJSONAsset
from mdh_django.utils.uuid import uuid4_mock
from mdh_schema.models import Collection

Z4Z_COLLECTION_PATH = AssetPath(__file__, "res", "z4z_collection.json")
Z4Z_PROVENANCE_PATH = AssetPath(__file__, "res", "z4z_provenance.json")
Z4Z_DATA_PATH = AssetPath(__file__, "res", "z4z_data.json")

Z4Z_ALL_PATH = AssetPath(__file__, "res", "z4z_query_all.json")
Z4Z_ALL_ASSET = LoadJSONAsset(Z4Z_ALL_PATH)

Z4Z_F1_PATH = AssetPath(__file__, "res", "z4z_query_f1.json")
Z4Z_F1_ASSET = LoadJSONAsset(Z4Z_F1_PATH)


class CreateCollectionTest(TestCase):
    def setUp(self):
        """ Creates the demo collection using the upsert command """
        with mock.patch.object(uuid, 'uuid4', uuid4_mock):
            # create the collection
            call_command('upsert_collection', Z4Z_COLLECTION_PATH,
                         update=False, quiet=True)
            # insert the data in the collection
            call_command('insert_data', Z4Z_DATA_PATH, collection="z4zFunctions",
                         fields="f0,f1,f2,invertible", provenance=Z4Z_PROVENANCE_PATH, quiet=True)

    def test_build_query(self):
        """ Checks that queries are built correctly """

        collection = Collection.objects.get(slug='z4zFunctions')

        GOT_QUERY_ALL_PROPS, _ = collection.query()
        EXPECTED_QUERY_ALL_PROPS = "SELECT I.id as id,T_f0.value as property_value_f0,T_f0.id as property_cid_f0,T_f1.value as property_value_f1,T_f1.id as property_cid_f1,T_f2.value as property_value_f2,T_f2.id as property_cid_f2,T_invertible.value as property_value_invertible,T_invertible.id as property_cid_invertible FROM mdh_data_item as I LEFT OUTER JOIN mdh_data_standardint as T_f0 ON I.id == T_f0.item_id AND T_f0.active AND T_f0.prop_id == 1 LEFT OUTER JOIN mdh_data_standardint as T_f1 ON I.id == T_f1.item_id AND T_f1.active AND T_f1.prop_id == 2 LEFT OUTER JOIN mdh_data_standardint as T_f2 ON I.id == T_f2.item_id AND T_f2.active AND T_f2.prop_id == 3 LEFT OUTER JOIN mdh_data_standardbool as T_invertible ON I.id == T_invertible.item_id AND T_invertible.active AND T_invertible.prop_id == 4  ORDER BY id"
        self.assertEqual(str(GOT_QUERY_ALL_PROPS.query.sql), EXPECTED_QUERY_ALL_PROPS,
                         "check that by default all properties are queried")

        GOT_QUERY_F1_LIMIT, _ = collection.query(
            properties=[collection.get_property("f1")], limit=1, offset=2)
        EXPECTED_QUERY_F1_LIMIT = "SELECT I.id as id,T_f1.value as property_value_f1,T_f1.id as property_cid_f1 FROM mdh_data_item as I LEFT OUTER JOIN mdh_data_standardint as T_f1 ON I.id == T_f1.item_id AND T_f1.active AND T_f1.prop_id == 2  ORDER BY id LIMIT 1 OFFSET 2"
        self.assertEqual(GOT_QUERY_F1_LIMIT.query.sql, EXPECTED_QUERY_F1_LIMIT,
                         "check that a limit query for only 1 property is built as expeted")

    def test_query_semantic(self):
        """ Tests that .semantic() queries return the right values """

        collection = Collection.objects.get(slug='z4zFunctions')

        GOT_QUERY_ALL = collection.semantic()
        EXPECTED_QUERY_ALL = Z4Z_ALL_ASSET
        self.assertJSONEqual(json.dumps(list(GOT_QUERY_ALL)), EXPECTED_QUERY_ALL,
                             "check that the query for all properties returns all properties")

        GOT_QUERY_F1_LIMIT = collection.semantic(
            properties=[collection.get_property("f1")], limit=1, offset=2)
        EXPECTED_QUERY_F1_LIMIT = Z4Z_F1_ASSET
        self.assertJSONEqual(json.dumps(list(GOT_QUERY_F1_LIMIT)), EXPECTED_QUERY_F1_LIMIT,
                             "check that the query for all a limited f1 returns correct response")
