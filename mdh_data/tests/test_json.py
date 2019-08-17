import json

from django.test import TestCase

from mdh_tests.models import DumbJSONFieldModel, SmartJSONFieldModel


class JSONSuite:
    """ A Testsuite that tests storing and loading of JSON data """

    def _store_and_retrieve(self, data):
        raise NotImplementedError

    def _assert_stores(self, data, message=None):
        """ Asserts that data can be stored and retrieved"""

        # store and retrieve the data once
        got_data = self._store_and_retrieve(data)

        # turn both into standardized json
        js = json.dumps(got_data, sort_keys=True)
        ejs = json.dumps(data, sort_keys=True)

        # and assert equality
        return self.assertEqual(js, ejs, message)

    def test_store_none(self):
        self._assert_stores(None)

    def test_can_store_integers(self):
        self._assert_stores(0)
        self._assert_stores(1)
        self._assert_stores(-1)

    def test_can_store_floats(self):
        self._assert_stores(0.0)
        self._assert_stores(3.14)
        self._assert_stores(-0.8333)

    def test_can_store_bools(self):
        self._assert_stores(True)
        self._assert_stores(False)

    def test_store_strings(self):
        self._assert_stores('')
        self._assert_stores('Hello world')
        self._assert_stores('äöü-things')

    def test_store_lists(self):
        self._assert_stores([])
        self._assert_stores([1, 2, 3, 4])  # homogeneous
        self._assert_stores(
            [1, 3.14, True, 'hello world', None])  # heterogeneous
        self._assert_stores([[1, 2, 3, 4], [5, 6, 7, 8]])  # 2d-array
        self._assert_stores(
            [1, {'hello': 'world'}, [4, True, 6]])  # something odd

    def test_store_dict(self):
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

    def _store_and_retrieve(self, data):
        instance = DumbJSONFieldModel(data=data)
        instance.save()
        instance.refresh_from_db()
        return instance.data


class SmartJSONStoragetest(JSONSuite, TestCase):
    """ Tests that the SmartJSOnField can store JSON objects properly """
    def _store_and_retrieve(self, data):
        instance = SmartJSONFieldModel(data=data)
        instance.save()
        instance.refresh_from_db()
        return instance.data
