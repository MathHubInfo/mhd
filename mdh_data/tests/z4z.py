import uuid
from unittest import mock

from django.core.management import call_command

from mdh_tests.utils import AssetPath
from mdh.utils.uuid import uuid4_mock, uuid4_mock_reset

from mdh_schema.models import Collection

Z4Z_COLLECTION_PATH = AssetPath(__file__, "res", "z4z_collection.json")
Z4Z_PROVENANCE_PATH = AssetPath(__file__, "res", "z4z_provenance.json")
Z4Z_DATA_PATH = AssetPath(__file__, "res", "z4z_data.json")


class Z4ZTest(object):
    def setUp(self):
        """ Creates the demo collection using the upsert command """

        uuid4_mock_reset()
        with mock.patch.object(uuid, 'uuid4', uuid4_mock):
            # create the collection
            call_command('upsert_collection', Z4Z_COLLECTION_PATH,
                         update=False, quiet=True)
            # insert the data in the collection
            call_command('insert_data', Z4Z_DATA_PATH, collection="z4zFunctions",
                         fields="f0,f1,f2,invertible", provenance=Z4Z_PROVENANCE_PATH, quiet=True)

        self.collection = Collection.objects.get(slug='z4zFunctions')
