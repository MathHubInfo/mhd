import json
from mhd.utils import with_simulate_arg

from django.core.management.base import BaseCommand

from ...models import Collection


class Command(BaseCommand):
    help = 'Creates or updates a collection. '

    def add_arguments(self, parser):
        parser.add_argument('--simulate', '-s', action='store_true',
                            help="Only simulate count update, do not actually update_count. ")
        parser.add_argument('--quiet', '-q', action='store_true',
                            help="Do not produce any output in case of success")

    @with_simulate_arg
    def handle(self, *args, **kwargs):
        for collection in Collection.objects.all():
            count = collection.update_count()

            if kwargs['quiet']:
                continue

            if count is not None:
                print("{0!r}: Updated count to {1}".format(collection.slug, count))
            else:
                print("{0!r}: Count is frozen and was not updated".format(collection.slug))
