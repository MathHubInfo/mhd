import json

from django.core.management.base import BaseCommand
import argparse
from mdh_schema.models import Collection


def nonnegative(value):
    ivalue = int(value)
    if ivalue < 0:
        raise argparse.ArgumentTypeError(
            "%s is an invalid non-negative int value" % value)
    return ivalue


class Command(BaseCommand):
    help = 'Queries the database for a specific collection'

    def add_arguments(self, parser):
        parser.add_argument('collection', help="Slug of collection to fetch")
        parser.add_argument(
            '--properties', '-p', help="Comma-seperated slugs of properties to query to query")

        modes = parser.add_mutually_exclusive_group()
        modes.add_argument('--sql', '-s', action='store_true',
                           help="Instead of returning results, print the sql query")
        modes.add_argument('--explain', '-e', action='store_true',
                           help="Instead of returning results, explain the query only")

        parser.add_argument('--from', '-f', type=nonnegative,
                            default=0, help="Index to start results at. ")
        parser.add_argument('--limit', '-l', type=nonnegative,
                            default=10, help="Maximum number of results to return")

    def handle(self, *args, **kwargs):
        # find collection
        collection = Collection.objects.filter(
            slug=kwargs['collection']).first()
        if collection is None:
            raise ValueError(
                'Collection {0:s} does not exist'.format(kwargs['collection']))

        # get all the properties
        properties = None
        if kwargs['properties']:
            properties = map(lambda p: collection.get_property(
                'p'), kwargs['properties'].split(","))

        # build te queryset
        qset = collection.query(offset=kwargs['from'], limit=kwargs['limit'])

        if kwargs['sql']:
            print(qset.query)
            return

        # if the explain flag was set, explain the query
        if kwargs['explain']:
            print(qset.explain())
            return


        results = [result.semantic(collection) for result in qset]
        print(json.dumps(results, indent=4))
