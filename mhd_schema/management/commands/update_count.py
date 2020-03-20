from __future__ import annotations

import json
from mhd.utils import with_simulate_arg

from django.core.management.base import BaseCommand

from ...models import Collection

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Any
    from argparse import ArgumentParser



class Command(BaseCommand):
    help = 'Creates or updates a collection. '

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument('--simulate', '-s', action='store_true',
                    help="Simulate all database operations by wrapping them in a transaction and rolling it back at the end of the command. ")
        parser.add_argument('--quiet', '-q', action='store_true',
                            help="Do not produce any output in case of success")

    @with_simulate_arg
    def handle(self, *args: Any, **kwargs: Any) -> None:
        for collection in Collection.objects.all():
            count = collection.update_count()

            if kwargs['quiet']:
                continue

            if count is not None:
                print("{0!r}: Updated count to {1}".format(collection.slug, count))
            else:
                print("{0!r}: Count is frozen and was not updated".format(collection.slug))
