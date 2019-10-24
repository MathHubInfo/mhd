from django.core.management.base import BaseCommand

from mhd.utils import with_simulate_arg
from ...models import Collection


class Command(BaseCommand):
    help = 'Deletes a collection. '

    def add_arguments(self, parser):
        parser.add_argument(
            'slug', help="Slug of collection to delete")
        parser.add_argument('--simulate', '-s', action="store_true",
                    help="Only simulate deletion")

    @with_simulate_arg
    def handle(self, *args, **kwargs):
        collection = Collection.objects.get(slug=kwargs['slug'])
        collection.safe_delete()
