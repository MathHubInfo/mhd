from django.core.management.base import BaseCommand

from mhd_schema.models import Collection
from mhd.utils import with_simulate_arg


class Command(BaseCommand):
    help = 'Removes all items from a collection and deletes associated values from the database'

    def add_arguments(self, parser):
        parser.add_argument(
            'slug', help="Slug of collection to flush")
        parser.add_argument('--simulate', '-s', action="store_true",
                    help="Only simulates flushing")

    @with_simulate_arg
    def handle(self, *args, **kwargs):
        collection = Collection.objects.get(slug=kwargs['slug'])
        collection.flush()
