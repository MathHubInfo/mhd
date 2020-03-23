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
    help = 'Manages views for a given collection. '

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument('collection', help='Slug of collection to update')
        parser.add_argument('--sync', '-s', action='store_true', help='Syncronizes the views after creation')

        modes = parser.add_mutually_exclusive_group(required=True)
        modes.add_argument('--enable', '-e', action='store_true',
                    help="Enables the view for a materialized collection")
        modes.add_argument('--disable', '-d', action='store_true',
                    help="Disables the view for a materialized collection")
        modes.add_argument('--inspect', '-i', action='store_true',
                    help="Inspects the view for a materialized collection")


    @with_simulate_arg
    def handle(self, *args: Any, **kwargs: Any) -> None:
        with connection.cursor() as cursor:
            logger = logging.getLogger('mhd.collection')

            collection = Collection.objects.get(slug=kwargs['collection'])
            sync = kwargs['sync']

            if kwargs['enable']:
                self.handle_enable(logger, connection, cursor, collection, sync)
            elif kwargs['disable']:
                self.handle_disable(logger, connection, cursor, collection, sync)
            else:
                self.handle_info(logger, connection, cursor, collection)

    def handle_enable(self, logger: logging.Logger, connection: Connection, cursor: Cursor, collection: Collection, sync: bool) -> None:
        collection.viewName = 'mhd_view_{}'.format(collection.slug)
        collection.view # this line is required to ensure that the mviews app can find it
        collection.save()
        logger.info('Adding view {} to collection {}'.format(collection.viewName, collection.slug))

        if sync:
            logger.info('Syncronizing view {}'.format(collection.viewName))
            collection.view.sync(connection, cursor, force=True)

    def handle_disable(self, logger: logging.Logger, connection: Connection, cursor: Cursor, collection: Collection, sync: bool) -> None:

        # if we actually syncronize with the database, we delete the view
        view = collection.view
        if sync and view is not None:
            logger.info('Removing view {} from collection {}'.format(view.name, collection.slug))
            view.remove(connection, cursor)
            view.delete()

        collection.viewName = None
        collection.save()

    def handle_info(self, logger: logging.Logger, connection: Connection, cursor: Cursor, collection: Collection) -> None:
        # no view
        view = collection.view
        if view is None:
            logger.info('Collection {}: No view. '.format(collection.slug))
            return

        # view associated, but not syncd
        logger.info('Collection {}: View {}'.format(collection.slug, view.name))
        if view.exists(connection, cursor):
            logger.info('View {}: Exists in database. '.format(view.name))
        else:
            logger.info('View {}: Does not exist in database. '.format(view.name))
