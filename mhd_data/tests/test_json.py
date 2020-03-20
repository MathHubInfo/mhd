from __future__ import annotations

from django.contrib.postgres.fields import JSONField
from django.test import TestCase

from mhd_tests.models import DumbJSONFieldModel, SmartJSONFieldModel
from mhd_tests.utils import db

from ..fields.json import DumbJSONField, SmartJSONField
from .storage import StorageSuite


class SmartJSONTest(TestCase):
    @db.skipUnlessSqlite
    def test_sqlite_uses_DumbJSON(self) -> None:
        """ Tests that sqlite uses the DumbJSONField implementation """

        self.assertFalse(SmartJSONField.using_postgres)
        self.assertTrue(issubclass(SmartJSONField, DumbJSONField))

    @db.skipUnlessPostgres
    def test_postgres_uses_JSONField(self) -> None:
        """ Tests that postgres uses the JSONField implementation """

        self.assertTrue(SmartJSONField.using_postgres)
        self.assertTrue(issubclass(SmartJSONField, JSONField))

class JSONSuite(StorageSuite):
    """ A Testsuite that tests storing and loading of JSON data """

    def test_store_none(self) -> None:
        self._assert_stores(None)

    def test_can_store_integers(self) -> None:
        self._assert_stores(0)
        self._assert_stores(1)
        self._assert_stores(-1)

    def test_can_store_floats(self) -> None:
        self._assert_stores(0.0)
        self._assert_stores(3.14)
        self._assert_stores(-0.8333)

    def test_can_store_bools(self) -> None:
        self._assert_stores(True)
        self._assert_stores(False)

    def test_store_strings(self) -> None:
        self._assert_stores('')
        self._assert_stores('Hello world')
        self._assert_stores('äöü-things')

    def test_store_lists(self) -> None:
        self._assert_stores([])
        self._assert_stores([1, 2, 3, 4])  # homogeneous
        self._assert_stores(
            [1, 3.14, True, 'hello world', None])  # heterogeneous
        self._assert_stores([[1, 2, 3, 4], [5, 6, 7, 8]])  # 2d-array
        self._assert_stores(
            [1, {'hello': 'world'}, [4, True, 6]])  # something odd

    def test_store_dict(self) -> None:
        self._assert_stores({})
        self._assert_stores({'key': 'value'})
        self._assert_stores({
            'one': 1,
            'pi': 3.14,
            'true': True,
            'nested': {'hello': 0, 'world': [False]}
        })


class DumbJSONStorageTest(JSONSuite, TestCase):
    """ Tests that the DumbJSONField can store JSON objects properly """

    storage_model = DumbJSONFieldModel


class SmartJSONStoragetest(JSONSuite, TestCase):
    """ Tests that the SmartJSOnField can store JSON objects properly """

    storage_model = SmartJSONFieldModel
