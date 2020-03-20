from __future__ import annotations

from django.core.management.base import BaseCommand

from mhd_schema.models import Collection
from mhd.utils import with_simulate_arg

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Any
    from argparse import ArgumentParser


class Command(BaseCommand):
    help = 'Removes all items from a collection and deletes associated values from the database'

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument(
            'slug', help="Slug of collection to flush")
        parser.add_argument('--simulate', '-s', action="store_true",
                    help="Simulate all database operations by wrapping them in a transaction and rolling it back at the end of the command. ")

    @with_simulate_arg
    def handle(self, *args: Any, **kwargs: Any) -> None:
        collection = Collection.objects.get(slug=kwargs['slug'])
        collection.flush()
