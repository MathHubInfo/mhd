from __future__ import annotations

import json

from django.core.management.base import BaseCommand
import argparse
from mhd_schema.models import Collection

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Any
    from argparse import ArgumentParser


def nonnegative(value: Any) -> int:
    ivalue = int(value)
    if ivalue < 0:
        raise argparse.ArgumentTypeError(
            "%s is an invalid non-negative int value" % value
        )
    return ivalue


class Command(BaseCommand):
    help = "Sends a query for a specific collection"

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument("collection", help="Slug of collection to fetch")
        parser.add_argument(
            "--properties",
            "-p",
            help="Comma-seperated slugs of properties to query to query",
        )
        parser.add_argument("--filter", "-f", help="Filter to give for query")
        parser.add_argument(
            "--sql",
            "-s",
            action="store_true",
            help="Instead of returning results, print the sql query",
        )

        parser.add_argument(
            "--order", "-", type=str, default=None, help="Order to return results in. "
        )
        parser.add_argument(
            "-c",
            "--count",
            action="store_true",
            help="Send a query to count elements instead of a normal query",
        )
        parser.add_argument(
            "--offset",
            "-o",
            type=nonnegative,
            default=0,
            help="Index to start results at. ",
        )
        parser.add_argument(
            "--limit",
            "-l",
            type=nonnegative,
            default=10,
            help="Maximum number of results to return",
        )

    def handle(self, *args: Any, **kwargs: Any) -> None:
        # find collection
        collection = Collection.objects.filter(slug=kwargs["collection"]).first()
        if collection is None:
            raise ValueError(
                "Collection {0:s} does not exist".format(kwargs["collection"])
            )

        # get all the properties
        properties = None
        if kwargs["properties"]:
            properties = map(
                lambda p: collection.get_property("p"), kwargs["properties"].split(",")
            )

        if not kwargs["count"]:
            qset, props = collection.query(
                offset=kwargs["offset"],
                limit=kwargs["limit"],
                filter=kwargs["filter"],
                order=kwargs["order"],
            )
        else:
            qset = collection.query_count(filter=kwargs["filter"])

        if kwargs["sql"]:
            print(qset.query)
            return

        if not kwargs["count"]:
            results = [result.semantic_result(collection, props) for result in qset]
        else:
            results = qset.fetchone()[0]
        print(json.dumps(results, indent=4))
