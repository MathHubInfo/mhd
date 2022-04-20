from __future__ import annotations

import json
import pathlib
from mhd.utils import with_simulate_arg

from django.core.management.base import BaseCommand

from ...importer import SchemaImporter

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Any
    from argparse import ArgumentParser


class Command(BaseCommand):
    help = 'Creates or updates a collection. '

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument(
            'filename', help=".json file with serialized collection data")
        parser.add_argument('--update', '-u', dest='update', action='store_true',
                            help="When set, update collection instead of provinding a new one. ")
        parser.add_argument('--quiet', '-q', action='store_true',
                            help="Do not produce any output in case of success")
        parser.add_argument('--simulate', '-s', action='store_true',
                    help="Simulate all database operations by wrapping them in a transaction and rolling it back at the end of the command. ")

    @with_simulate_arg
    def handle(self, *args: Any, **kwargs: Any) -> None:
        # open the file and read json
        data = None
        filename = kwargs['filename']
        root_path = pathlib.Path(filename)
        with open(filename) as f:
            data = json.load(f)

        importer = SchemaImporter(data, root_path.parent, kwargs['quiet'])
        importer(update=kwargs['update'])
