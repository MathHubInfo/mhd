from django.core.management.base import BaseCommand

from mhd.utils import with_simulate_arg
from mhd_data.importers import JSONFileImporter


class Command(BaseCommand):
    help = 'Inserts data into an existing collection'

    def add_arguments(self, parser):
        parser.add_argument(
            '--collection', '-c', help="Slug of collection to insert data into", required=True)
        parser.add_argument(
            '--fields', '-f', help="Comma-seperated list of property names", required=True)
        parser.add_argument(
            '--provenance', '-p', help=".json file containing provenance to insert", required=True)
        parser.add_argument('--simulate', '-s', action='store_true',
                            help="Only simulate inseration, do not actually store any data")
        parser.add_argument('--quiet', '-q', action='store_true',
                            help="Do not produce any output in case of success")
        parser.add_argument('--batch-size', '-b', type=int, default=None,
                            help="Batch size for insert queries into the database. ")
        parser.add_argument(
            'data', nargs='+', help=".json file containing 2-dimensional value array")

    @with_simulate_arg
    def handle(self, *args, **kwargs):
        importer = JSONFileImporter(
            kwargs['collection'], kwargs['fields'].strip().split(","),
            kwargs['data'], kwargs['provenance'],
            quiet=kwargs['quiet'],
            batch_size=kwargs['batch_size']
        )
        importer(update=False)
