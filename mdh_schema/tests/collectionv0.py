from django.core.management import call_command

from mdh_tests.utils import AssetPath
from mdh_schema.models import Collection

DEMO_COLLECTION_PATH = AssetPath(__file__, "res", "collection_v0.json")


class CollectionV0Test(object):
    def setUp(self):
        """ Creates the demo collection using the upsert command """

        call_command('upsert_collection', DEMO_COLLECTION_PATH,
                     update=False, quiet=True)

        self.collection = Collection.objects.get(slug='z3zFunctions')
