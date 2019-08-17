from django.test import TestCase

from mdh_tests.models import DumbNDArrayTwoModel, SmartNDArrayTwoModel

from .storage import StorageSuite


class NDArraySuiteTwo(StorageSuite):
    def test_positive(self):
        self._assert_stores([])
        self._assert_stores([[1, 2, 3], [4, 5, 6]])

    def test_negative(self):
        # not a list
        self._assert_notstores(True)
        self._assert_notstores(12)
        self._assert_notstores('hello world')
        self._assert_notstores({'a': 5})

        # list but wrong type
        self._assert_notstores(['hello world'])
        self._assert_notstores([{'a': 5}])
        self._assert_notstores([12, 'hello world'])

        # wrong dimension
        self._assert_notstores([1])
        self._assert_notstores([[[1, 2], [3, 4]], []])


class DumbNDArraySuiteTwoTest(NDArraySuiteTwo, TestCase):
    """ Tests for 2-dimensional DumbNDArray backed element """

    storage_model = DumbNDArrayTwoModel


class SmartNDArraySuiteTwoTest(NDArraySuiteTwo, TestCase):
    """ Tests for 2-dimensional SmartNDArray backed element """

    storage_model = SmartNDArrayTwoModel
