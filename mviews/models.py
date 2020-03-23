from __future__ import annotations

import json
import logging

from django.db import models

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import List, Optional, Any

    from django.db.backends.utils import CursorWrapper as Cursor
    from django.db.backends.base.base import BaseDatabaseWrapper as Connection

    SQLWithParams = [str, List[Any]]

class ViewImplementation:
    name: str
    sql: str
    materialized: bool
    params: Optional[List[Any]]

    @staticmethod
    def supports_materialization(connection) -> bool:
        return connection.vendor != 'sqlite'

    def _quote_values(self, connection: Connection, cursor: Cursor, values: List[Any]) -> List[str]:
        """ Quotes a list of values for inclusion in a different sql value """

        # make a statement SELECT quote(%s), quote(%s), ... for each of the values
        sql = "SELECT {}".format(", ".join(["quote(%s)"] * len(values)))
        cursor.execute(sql, values)
        return cursor.fetchone()

    def _execute(self, connection: Connection, cursor: Cursor, sql: str, args: List[Any], force_manual_escape: bool = False) -> None:
        if force_manual_escape:
            # in a manual escape sitatuon, we use the quote() SQL function to manually escape each parameter
            escape_args = self._quote_values(connection, cursor, args)

            # split the query and add in the escaped values
            split_query = sql.split("%s")
            substiuted_query_parts = [query_part+escaped_arg for (escaped_arg, query_part) in zip(escape_args, split_query[:-1])]
            sql = "".join(substiuted_query_parts) + split_query[-1]

            # we subtituted in the variables, so we no longer need any argument
            args = []

        # execute using the vanilla cursor
        return cursor.execute(sql, args)

    def _exists_sql(self, connection) -> SQLWithParams:
        """ Generates an SQL statement that checks if this view exists """

        vendor = connection.vendor

        if vendor == 'postgresql':
            return "SELECT relname, relkind FROM pg_class WHERE relname = %s AND relkind in ('m', 'v')", [self.name]
        elif vendor == 'sqlite':
            return "SELECT name FROM sqlite_master WHERE type='view' AND name=%s", [self.name]

        raise VendorNotSupportedException()

    def exists(self, connection: Connection, cursor: Cursor) -> bool:
        """ Checks if this view exists """

        exists_sql, exists_params = self._exists_sql(connection)
        the_view = self._execute(connection, cursor, exists_sql, exists_params)

        # check if the value returned is not None
        return cursor.fetchone() is not None

    def _create_sql(self, connection: Connection, with_data: bool = False) -> str:
        """ Generates an SQL statement that creates this materialized view """

        # we can only create materialized views on sqlite
        if self.materialized and connection.vendor == 'sqlite':
            raise MaterializedViewNotSupported()

        # create a materialized view
        if self.materialized:
            sql = "CREATE MATERIALIZED VIEW {} AS {} WITH {}".format(
                self.name, self.sql, "DATA" if with_data else "NO DATA")
        else:
            sql = "CREATE VIEW {} AS {}".format(self.name, self.sql)

        # create the view
        return sql, self.params

    def create(self, connection: Connection, cursor: Cursor, with_data: bool = False) -> None:
        """ Creates this view, optionally with or without data """

        create_sql, create_sql_params = self._create_sql(
            connection, with_data=with_data)
        self._execute(connection, cursor, create_sql, create_sql_params, force_manual_escape=connection.vendor == 'sqlite')

    def _refresh_sql(self, concurrently: bool = False) -> str:
        """ Generates an SQL statement to refresh this view """

        return "REFRESH MATERIALIZED VIEW {} {};".format("CONCURRENTLY" if concurrently else "", self.name)

    def refresh(self, connection: Connection, cursor: Cursor, concurrently: bool = False) -> None:
        """ Refreshes this materialized view """

        # if we are not materialized, we don't need to refresh the view
        if not self.materialized:
            return

        # and return the cursor
        self._execute(connection, cursor, self._refresh_sql(concurrently=concurrently), [])

    def _remove_sql(self) -> str:
        """ Generates an sql statement to remove this view """

        return "DROP {}VIEW {};".format("MATERIALIZED " if self.materialized else "", self.name)

    def remove(self, connection: Connection, cursor: Cursor) -> None:
        """ Removes this view from the database """

        # if the view exists, remove it
        if self.exists(connection, cursor):
            self._execute(connection, cursor, self._remove_sql(), [])

    def sync(self, connection: Connection, cursor: Cursor, force: bool = False, concurrently: bool = False):
        """ Syncronizes this view.
            When force is True, then any existing views will be removed and then recreated.
        """

        # if we force a re-create delete the existing view
        if force:
            self.remove(connection, cursor)

        # if the view does not exist, create it
        if not self.exists(connection, cursor):
            self.create(connection, cursor, with_data=False)

        # and refresh the view
        if self.materialized:
            self.refresh(connection, cursor, False)


# Create your models here.
class View(ViewImplementation, models.Model):
    name: str = models.SlugField(
        unique=True, help_text='The database name of this view')
    sql: str = models.TextField(help_text='The SQL of this view')
    paramsJSON: str = models.TextField(help_text='The parameters of this view')
    materialized: bool = models.BooleanField(
        help_text='Boolean indicating if this view is materialized')

    @staticmethod
    def make_view(name: str, sql: str, params: Optional[List[Any]] = None, materialized: bool = False, update: bool = False) -> View:
        """ Gets an appropriate view. Should call .sync() on the view when possible """

        # get or update the view
        obj, created = View.objects.update_or_create(name=name, defaults={
            'sql': sql,
            'materialized': materialized,
            'paramsJSON': json.dumps(params),
        })

        # and return
        return obj

    @classmethod
    def sync_all(cls, connection: Connection, cursor: Cursor, force: bool = False, logger: Optional[logging.Logger] = None) -> None:
        """ Syncronizes all existing views using the .sync() method """

        for v in cls.objects.all():
            if v.exists(connection, cursor):
                if logger is not None:
                    logger.info('Syncronizing view {0!r}'.format(v.name))
                v.sync(connection, cursor)
            else:
                if logger is not None:
                    logger.info('Removing view {0!r}'.format(v.name))
                v.delete()

    @property
    def params(self) -> Optional[List[Any]]:
        """ Sets the parameters of this view """
        return tuple(json.loads(self.paramsJSON))

    @params.setter
    def params(self, value):
        """ Sets the value of this view """
        self.paramsJSON = json.dumps(value)


class VendorNotSupportedException(Exception):
    def __init__(self):
        super().__init__('Database vendor not supported. ')


class MaterializedViewNotSupported(VendorNotSupportedException):
    def __init__(self):
        super().__init__('Materialized Views are not supported by the database')
