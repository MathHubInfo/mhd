import uuid
from unittest import mock

from django.core.management import call_command

from mdh.utils.uuid import uuid4_mock, uuid4_mock_reset
from mdh_tests.utils import LoadJSONAsset

from mdh_schema.models import Collection


def insert_testing_data(schema_path, data_path, provenance_path, reset=False):
    """ Inserts testing data from the given collection, data, and provenance paths """

    # if requested, reset the ids
    if reset:
        uuid4_mock_reset()

    with mock.patch.object(uuid, 'uuid4', uuid4_mock):
        # create the collection
        call_command('upsert_collection', schema_path,
                     update=False, quiet=True)

        # get needed info from schema
        schema_data = LoadJSONAsset(schema_path)
        collection_name = schema_data['slug']
        fields = ','.join([p['slug'] for p in schema_data['properties']])

        # insert the data in the collection
        call_command('insert_data', data_path, collection=collection_name,
                     fields=fields, provenance=provenance_path, quiet=True)

        return Collection.objects.get(slug=collection_name)
