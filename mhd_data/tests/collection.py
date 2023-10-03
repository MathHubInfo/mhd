from __future__ import annotations

import uuid
from unittest import mock

from django.core.management import call_command

from mhd.utils.uuid import uuid4_mock, uuid4_mock_reset
from mhd_tests.utils import LoadJSONAsset

from mhd_schema.models import Collection


def insert_testing_data(
    schema_path: str, data_path: str, provenance_path: str, reset: bool = False
) -> Collection:
    """Inserts testing data from the given collection, data, and provenance paths"""

    # if requested, reset the ids
    if reset:
        uuid4_mock_reset()

    with mock.patch.object(uuid, "uuid4", uuid4_mock):
        # create the collection
        call_command(
            "load_collection", schema_path, data_path, provenance_path, quiet=True
        )

        # load the collection with the given name
        collection_name = LoadJSONAsset(schema_path)["slug"]
        return Collection.objects.get(slug=collection_name)
