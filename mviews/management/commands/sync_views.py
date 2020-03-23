from __future__ import annotations

from django.core.management.base import BaseCommand

from mviews.models import View
import logging

from django.db import connection

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Any
    from argparse import ArgumentParser

class Command(BaseCommand):
    help = 'Syncronizes all (materialized) views with the database'

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument('--force', default=False, action='store_true', help='Re-create already existing views to update the schema. ')

    def handle(self, *args: Any, **kwargs: Any) -> Any:
        logger = logging.getLogger('mhd.sync')

        with connection.cursor() as cursor:
            View.sync_all(connection, cursor, force=kwargs['force'], logger=logging.getLogger(''))
