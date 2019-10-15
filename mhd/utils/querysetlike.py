from django.db import connection as default_connection

class QuerySetLike(object):
    """ A Query-Set similar wrapper for raw queries """
    def __init__(self, sql, params, connection = None):
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
    def __init__(self, sql, params):
        self.sql = sql
        self.params = params

    def __str__(self):
        return self.sql
