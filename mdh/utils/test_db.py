from django.db import connection
import unittest

import functools

def skipUnlessSqlite(original):
    """ Decorator that skips a test if the database being used is sqlite """

    @functools.wraps(original)
    def wrapper(*args, **kwargs):
        if connection.vendor != 'sqlite':
            raise unittest.SkipTest('Database is not using sqlite')

        return original(*args, **kwargs)

    return wrapper

def skipUnlessPostgres(original):
    """ Decorator that skips a test unless the database being use is postgresql """

    @functools.wraps(original)
    def wrapper(*args, **kwargs):
        if connection.vendor != 'postgresql':
            raise unittest.SkipTest('Database is not using postgresql')

        return original(*args, **kwargs)

    return wrapper

__all__ = ['skipUnlessSqlite', 'skipUnlessPostgres']
