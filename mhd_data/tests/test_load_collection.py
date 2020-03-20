from __future__ import annotations

import json
import uuid
from unittest import mock

from django.db import transaction

from django.core.management import call_command
from django.test import TestCase

from mhd.utils.uuid import uuid4_mock, uuid4_mock_reset
from mhd_schema.models import Collection
from mhd_data.models import Item
from mhd_tests.utils import AssetPath, LoadJSONAsset

Z3Z_COLLECTION_PATH = AssetPath(__file__, "res", "z3z_collection.json")
Z3Z_PROVENANCE_PATH = AssetPath(__file__, "res", "z3z_provenance.json")
Z3Z_DATA_PATH = AssetPath(__file__, "res", "z3z_data.json")

Z3Z_ALL_PATH = AssetPath(__file__, "res", "z3z_query_all.json")
Z3Z_ALL_ASSET = LoadJSONAsset(Z3Z_ALL_PATH)

class LoadCollectionTest(TestCase):
    def test_no_simulate_arg(self) -> None:
        """ Checks that calling 'load_collection' without a simulate argument works """

        uuid4_mock_reset()
        with mock.patch.object(uuid, 'uuid4', uuid4_mock):
            call_command(
                'load_collection',
                Z3Z_COLLECTION_PATH, # schema
                Z3Z_DATA_PATH, # data
                Z3Z_PROVENANCE_PATH, # provenance
                quiet=True,
                simulate=False,
                batch_size=None
            )

        # check that the collection objects were inserted
        GOT_QUERY_ALL = Collection.objects.first().semantic()
        self.assertJSONEqual(json.dumps(list(GOT_QUERY_ALL)), Z3Z_ALL_ASSET,
                             "check that the query inserted all entries")

    def test_simulate_arg(self) -> None:
        """ Checks that calling 'load_collection' without a simulate argument does not load any data """

        with transaction.atomic():
            uuid4_mock_reset()
            with mock.patch.object(uuid, 'uuid4', uuid4_mock):
                call_command(
                    'load_collection',
                    Z3Z_COLLECTION_PATH, # schema
                    Z3Z_DATA_PATH, # data
                    Z3Z_PROVENANCE_PATH, # provenance
                    quiet=True,
                    simulate=True,
                    batch_size=None
                )

        # check that the collection objects were inserted
        self.assertEqual(Collection.objects.count(), 0)
        self.assertEqual(Item.objects.count(), 0)
