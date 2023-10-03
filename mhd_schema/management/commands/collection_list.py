from __future__ import annotations

import json
from mhd.utils import with_simulate_arg

from django.core.management.base import BaseCommand
from django.db import connection

import logging

from ...models import Collection

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Any
    from argparse import ArgumentParser

    from django.db.backends.utils import CursorWrapper as Cursor
    from django.db.backends.base.base import BaseDatabaseWrapper as Connection


class Command(BaseCommand):
    help = "Lists or unlists a collection from the front page. "

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument("collection", help="Slug of collection to update")

        modes = parser.add_mutually_exclusive_group(required=True)
        modes.add_argument(
            "--list",
            "-l",
            action="store_true",
            help="Lists the collection on the front page",
        )
        modes.add_argument(
            "--unlist",
            "-u",
            action="store_true",
            help="Unlists the collection on the front page",
        )

    def handle(self, *args: Any, **kwargs: Any) -> None:
        with connection.cursor() as cursor:
            logger = logging.getLogger("mhd.collection")

            collection = Collection.objects.get(slug=kwargs["collection"])

            if kwargs["list"]:
                collection.hidden = False
                logger.info("Listing collection {}".format(collection.slug))
            elif kwargs["unlist"]:
                collection.hidden = True
                logger.info("Unlisting collection {}".format(collection.slug))
            collection.save()
