from django.test import TestCase
from mdh.utils import test_db

from ..fields.json import SmartJSONField, DumbJSONField
from django.contrib.postgres.fields import JSONField

class SmartJSONTest(TestCase):
    @test_db.skipUnlessSqlite
    def test_sqlite_uses_DumbJSON(self):
        """ Tests that sqlite uses the DumbJSONField implementation """

        self.assertTrue(issubclass(SmartJSONField, DumbJSONField))

    @test_db.skipUnlessPostgres
    def test_postgres_uses_JSONField(self):
        """ Tests that postgres uses the JSONField implementation """

        self.assertTrue(issubclass(SmartJSONField, JSONField))
