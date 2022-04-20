from __future__ import annotations

from django.db import connection as default_connection

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import List, Any, Optional
    from django.db.backends.base.base import BaseDatabaseWrapper as Connection


class QuerySetLike(object):
    """ A Query-Set similar wrapper for raw queries """

    _connection: Connection
    query: QuerySetLikeQuery

    def __init__(self, sql: str, params: List[Any], connection: Optional[Connection] = None):
        self._connection = connection if connection is not None else default_connection
        self.query = QuerySetLikeQuery(sql, params)

    def fetchone(self):
        """ Fetches a single result from the server """
        with self._connection.cursor() as c:
            c.execute(self.query.sql, self.query.params)
            return c.fetchone()

    def fetchall(self):
        """ Fetches all results from the server """
        with self._connection.cursor() as c:
            c.execute(self.query.sql, self.query.params)
            return c.fetchall()


class QuerySetLikeQuery(object):
    def __init__(self, sql: str, params: List[Any]):
        self.sql = sql
        self.params = params

    def __str__(self) -> str:
        return self.sql
