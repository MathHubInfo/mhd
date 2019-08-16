from django.test import TestCase
import unittest

from ..fields.json import SmartJSONField, DumbJSONField
from django.contrib.postgres.fields import JSONField

class SmartJSONTest(TestCase):
    def test_sqlite_uses_DumbJSON(self):
        """ Tests that sqlite uses the DumbJSONField implementation """

        from django.db import connection
        if connection.vendor != 'sqlite':
            raise unittest.SkipTest('Database vendor is not sqlite')

        self.assertTrue(issubclass(SmartJSONField, DumbJSONField))

    def test_postgres_uses_JSONField(self):
        """ Tests that postgres uses the JSONField implementation """

        from django.db import connection
        if connection.vendor != 'postgresql':
            raise unittest.SkipTest('Database vendor is not postgres')

        self.assertTrue(issubclass(SmartJSONField, JSONField))
