from django.test import TestCase
from mdh_tests.utils import db

from ..fields.json import SmartJSONField, DumbJSONField
from django.contrib.postgres.fields import JSONField

class SmartJSONTest(TestCase):
    @db.skipUnlessSqlite
    def test_sqlite_uses_DumbJSON(self):
        """ Tests that sqlite uses the DumbJSONField implementation """

        self.assertFalse(SmartJSONField.using_postgres)
        self.assertTrue(issubclass(SmartJSONField, DumbJSONField))

    @db.skipUnlessPostgres
    def test_postgres_uses_JSONField(self):
        """ Tests that postgres uses the JSONField implementation """

        self.assertTrue(SmartJSONField.using_postgres)
        self.assertTrue(issubclass(SmartJSONField, JSONField))
