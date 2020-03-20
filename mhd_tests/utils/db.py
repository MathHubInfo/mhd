from __future__ import annotations

from django.db import connection
import unittest

import functools

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Callable, Any

def skipUnlessSqlite(original: Callable[..., Any]) -> Callable[..., Any]:
    """ Decorator that skips a test if the database being used is sqlite """

    @functools.wraps(original)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        if connection.vendor != 'sqlite':
            raise unittest.SkipTest('Database is not using sqlite')

        return original(*args, **kwargs)

    return wrapper

def skipUnlessPostgres(original: Callable[..., Any]) -> Callable[..., Any]:
    """ Decorator that skips a test unless the database being use is postgresql """

    @functools.wraps(original)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        if connection.vendor != 'postgresql':
            raise unittest.SkipTest('Database is not using postgresql')

        return original(*args, **kwargs)

    return wrapper

__all__ = ['skipUnlessSqlite', 'skipUnlessPostgres']
