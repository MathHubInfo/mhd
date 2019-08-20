from django.core.management.base import BaseCommand
from django.core.management import call_command

from mdh.utils import with_simulate_arg

import json


class Command(BaseCommand):
    help = 'Creates a new collection and loads data for it into the system'

    def add_arguments(self, parser):
        parser.add_argument(
            'schema', help='.json file containing collection schema')
        parser.add_argument(
            'data', help=".json file containing 2-dimensional value array")
        parser.add_argument(
            'provenance', help=".json file containing provenance to insert")
        parser.add_argument('--quiet', '-q', action='store_true',
                            help="Do not produce any output in case of success")
        parser.add_argument('--simulate', '-s', action="store_true",
                            help="Only simulate collection creation, do not actually store any data")

    @with_simulate_arg
    def handle(self, schema, data, provenance, quiet=False, simulate=False, **kwargs):
        call_command('upsert_collection', schema, update=False, quiet=quiet)

        # get needed info from schema
        with open(schema, 'r') as f:
            schema_data = json.load(f)
        collection_name = schema_data['slug']
        fields = ','.join([p['slug'] for p in schema_data['properties']])

        # insert the data in the collection
        call_command('insert_data', data,  collection=collection_name,
                     fields=fields, provenance=provenance, quiet=quiet)
