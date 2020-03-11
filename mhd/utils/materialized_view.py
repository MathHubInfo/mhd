from django.db.backends.utils import CursorWrapper as Cursor
from django.db.backends.base.base import BaseDatabaseWrapper as Connection

from typing import List

import sys


class MaterializedView(object):
    """ Represents a single materialized view """

    def __init__(self, name: str, query: str):
        self.query = query
        self.name = name
    
    @staticmethod
    def supported(connection: Connection):
        """ Checks if materialized views are supported by a given connection """

        return connection.vendor == 'postgresql'

    def _exists_sql(self) -> str:
        """ Generates an SQL statement that checks if this view exists """

        return "SELECT relname, relkind FROM pg_class WHERE relname = '{}' AND relkind = 'm';".format(self.name)

    def exists(self, connection: Connection, cursor: Cursor) -> bool:
        """ Checks if this materialized view exists """

        # if we do not have postgresql, we don't support views
        if not self.supported(connection):
            return False

        the_view = cursor.execute(self._exists_sql())
        return cursor.fetchone() is not None

    def _create_sql(self, with_data: bool = False) -> str:
        """ Generates an SQL statement that creates this materialized view """

        return "CREATE MATERIALIZED VIEW {} AS {} WITH {};".format(self.name, self.query, "DATA" if with_data else "NO DATA")

    def create(self, connection: Connection, cursor: Cursor, with_data: bool = False) -> None:
        """ Creates this materialized view """

        if not self.supported(connection):
            raise MaterializedViewNotSupported

        cursor.execute(self._create_sql(with_data=with_data))

    def _refresh_sql(self, concurrently: bool = False) -> str:
        """ Generates an SQL statement to refresh this view """

        return "REFRESH MATERIALIZED VIEW {} {};".format("CONCURRENTLY" if concurrently else "", self.name)

    def refresh(self, connection: Connection, cursor: Cursor, concurrently: bool = False) -> None:
        """ Refreshes this materialized view """

        if not self.supported(connection):
            raise MaterializedViewNotSupported

        cursor.execute(self._refresh_sql(concurrently=concurrently))

    def _remove_sql(self) -> str:
        """ Generates an sql statement to remove this view """

        return "DROP MATERIALIZED VIEW {};".format(self.name_sql)

    def remove(self, connection: Connection, cursor: Cursor) -> None:
        """ Refreshes this view """

        if not self.supported(connection):
            raise MaterializedViewNotSupported

        cursor.execute(self.remove_sql())

    def sync(self, connection: Connection, cursor: Cursor, concurrently: bool = False):
        """ Syncronizes this view with the database """

        if not self.supported(connection):
            raise MaterializedViewNotSupported

        # create the view if it doesn't exist yet
        if not self.exists(connection, cursor):
            print("Creating view {} ... ".format(self.name), end="")
            sys.stdout.flush()
            self.create(connection, cursor, with_data=False)
            print("OK")

        # populate the view
        print("Refreshing view {} ... ".format(self.name), end="")
        sys.stdout.flush()
        self.refresh(connection, cursor, concurrently=concurrently)
        print("OK")

class MaterializedViewNotSupported(Exception):
    def __init__(self):
        super().__init__('Materialized Views are not supported by the database')