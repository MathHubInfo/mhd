from django.db.backends.utils import CursorWrapper as Cursor
from django.db.backends.base.base import BaseDatabaseWrapper as Connection

from typing import List

class MaterializedViewManager(object):
    def __init__(self):
        self.__views = {}  # type: Dict[str, 'MaterializedView']
        self.disabled = False

    def viewsEnabled(self, connection: Connection) -> bool:
        """ Checks if views are enabled for this server """

        # if materialized views are disabled, disable them
        if self.disabled:
            return False

        return connection.vendor == 'postgresql'

    def register(self, view: 'MaterializedView') -> bool:
        """ Registers a MaterializedView with this manager. Should never be called by hand """

        # if a view with the given name already exists, return
        try:
            self.__views[view.name]
            return False
        except KeyError:
            pass

        self.__views[view.name] = view

    def views(self) -> List['MaterializedView']:
        """ Returns a list of all materialized view """
        return [v for k, v in self.__views.items()]

    def sync(self, connection: Connection, concurrently: bool = False):
        """ Syncs the views with the database. This does not remove old views. """

        # not enabled => nothing to be done
        if not self.viewsEnabled(connection):
            print("Materialized views are not enabled, skipping ")
            return

        with connection.cursor() as cursor:
            for view in self.views():

                # create the view if it doesn't exist yet
                if not view.exists(connection, cursor):
                    print("Creating view {} ...".format(view.name), end="")
                    sys.stdout.flush()
                    view.create(connection, cursor, with_data=False)
                    print("OK")

                # populate the view
                print("Refreshing view {} ...".format(view.name), end="")
                sys.stdout.flush()
                view.refresh(connection, cursor, concurrently=concurrently)
                print("OK")

VIEWS_MANAGER = MaterializedViewManager()


class MaterializedView(object):
    """ Represents a single materialized view """

    def __init__(self: 'MaterializedView', query: str, name: str):
        self.query = query
        self.name = name
        self.disabled = False

        # register this view
        VIEWS_MANAGER.register(self)
    
    def disable_unless_exists(self, connection: Connection, cursor: Cursor):
        """ Disables using the accelarated view unless it exists """
        
        self.disabled = not self.exists(connection, cursor) 

    @property
    def name_sql(self) -> str:
        """ Returns the sql name of this view """

        # TODO: Escaping
        return self.name

    @property
    def query_sql(self) -> str:
        """ Return the sql query of this view """

        # TODO: Escaping?
        return self.query

    def to_sql(self, connection: Connection) -> str:
        """ Turns this (potentially) materialized view into a table to be used as an sql string """

        # if views aren't actually enabled, don't use them
        if self.disabled or not VIEWS_MANAGER.viewsEnabled(connection):
            return "({}) as {}".format(self.query_sql, self.name)

        # else return the name
        return self.name

    def exists_sql(self) -> str:
        """ Generates an sql statement to check if this view exists """

        return "SELECT relname, relkind FROM pg_class WHERE relname = '{}' AND relkind = 'm';".format(self.name_sql)

    def exists(self, connection: Connection, cursor: Cursor) -> bool:
        """ Checks if this materialized view exists """
        
        # if views aren't enabled, we don't exist
        if not VIEWS_MANAGER.viewsEnabled(connection):
            return False

        the_view = cursor.execute(self.exists_sql())
        return cursor.fetchone() is not None
    
    def create_sql(self, with_data: bool = False) -> str:
        """ Generates an sql statement to create the view """

        return "CREATE MATERIALIZED VIEW {} AS {} WITH {};".format(self.name_sql, self.query_sql, "DATA" if with_data else "NO DATA")
    
    def create(self, connection: Connection, cursor: Cursor, with_data: bool = False) -> None:
        """ Creates this view """

        cursor.execute(self.create_sql(with_data=with_data))

    def refresh_sql(self, concurrently: bool = False) -> str:
        """ Generates an sql statement to refresh this view """

        return "REFRESH MATERIALIZED VIEW {} {};".format("CONCURRENTLY" if concurrently else "", self.name_sql)
    
    def refresh(self, connection: Connection, cursor: Cursor, concurrently: bool = False) -> None:
        """ Refreshes this view """

        cursor.execute(self.refresh_sql(concurrently=concurrently))
    
    def remove_sql(self) -> str:
        """ Generates an sql statement to remove this view """

        return "DROP MATERIALIZED VIEW {};".format(self.name_sql)

    def remove(self, connection: Connection, cursor: Cursor) -> None:
        """ Refreshes this view """

        cursor.execute(self.remove_sql())

def example():
    # from mhd.utils.mview import example; connection, cursor, view = example()
    from django.db import connection
    view = MaterializedView("SELECT 1 UNION SELECT 0", 'bools')
    cursor = connection.cursor()
    return connection, cursor, view