from __future__ import annotations

from django.core.management.base import BaseCommand

from mhd.utils import with_simulate_arg
from mhd_data.importers import JSONFileImporter

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Any
    from argparse import ArgumentParser


class Command(BaseCommand):
    help = "Inserts data into an existing collection"

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument(
            "--collection",
            "-n",
            help="Slug of collection to insert data into",
            required=True,
        )
        parser.add_argument(
            "--fields",
            "-f",
            help="Comma-seperated list of property names",
            required=True,
        )
        parser.add_argument(
            "--provenance",
            "-p",
            help=".json file containing provenance to insert",
            required=True,
        )
        parser.add_argument(
            "--simulate",
            "-s",
            action="store_true",
            help="Simulate all database operations by wrapping them in a transaction and rolling it back at the end of the command. ",
        )
        parser.add_argument(
            "--quiet",
            "-q",
            action="store_true",
            help="Do not produce any output in case of success",
        )
        parser.add_argument(
            "--chunk-size",
            "-c",
            type=int,
            default=None,
            help="Maximum size for each chunk read from a file. ",
        )
        parser.add_argument(
            "--batch-size",
            "-b",
            type=int,
            default=None,
            help="Batch size for insert queries into the database (sqlite only). ",
        )
        parser.add_argument(
            "--write-sql",
            "-w",
            type=str,
            default=None,
            help="When set, instead of batch inserting data write output to the given path. ",
        )

        parser.add_argument(
            "data", nargs="+", help=".json file containing 2-dimensional value array"
        )

    @with_simulate_arg
    def handle(self, *args: Any, **kwargs: Any) -> None:
        importer = JSONFileImporter(
            kwargs["collection"],
            kwargs["fields"].strip().split(","),
            kwargs["data"],
            kwargs["provenance"],
            kwargs["quiet"],
            kwargs["batch_size"],
            kwargs["chunk_size"],
            kwargs["write_sql"],
        )
        importer(update=False)
