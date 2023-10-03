from __future__ import annotations

from django.test import TestCase

from mhd_tests.models import DumbNDArrayOneModel, SmartNDArrayOneModel
from mhd_tests.utils import db

from ..fields.ndarray import DumbNDArrayField, PostgresNDArrayField, SmartNDArrayField
from .storage import StorageSuite


class SmartNDArrayTest(TestCase):
    @db.skipUnlessSqlite
    def test_sqlite_uses_DumbNDArrayField(self) -> None:
        """Tests that sqlite uses the DumbNDArrayField implementation"""

        self.assertFalse(SmartNDArrayField.using_postgres)
        self.assertTrue(issubclass(SmartNDArrayField, DumbNDArrayField))

    @db.skipUnlessPostgres
    def test_postgres_uses_JSONField(self) -> None:
        """Tests that postgres uses the ListField implementation"""

        self.assertTrue(SmartNDArrayField.using_postgres)
        self.assertTrue(issubclass(SmartNDArrayField, PostgresNDArrayField))


class NDArraySuiteOne(StorageSuite):
    def test_positive(self) -> None:
        self._assert_stores([])
        self._assert_stores([1, 2, 3])

    def test_negative(self) -> None:
        # not a list
        self._assert_notstores(True)
        self._assert_notstores(12)
        self._assert_notstores("hello world")
        self._assert_notstores({"a": 5})

        # list but wrong type
        self._assert_notstores(["hello world"])
        self._assert_notstores([{"a": 5}])
        self._assert_notstores([12, "hello world"])

        # wrong dimension
        self._assert_notstores([[1], [2]])


class DumbNDArraySuiteOneTest(NDArraySuiteOne, TestCase):
    """Tests for 1-dimensional DumbNDArray backed element"""

    storage_model = DumbNDArrayOneModel


class SmartNDArraySuiteOneTest(NDArraySuiteOne, TestCase):
    """Tests for 1-dimensional SmartNDArray backed element"""

    storage_model = SmartNDArrayOneModel
