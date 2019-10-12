import json

class StorageSuite:
    storage_model = None
    def _assert_stores(self, data, message=None):
        """ Asserts that data can be stored and retrieved"""

        # store and retrieve the data
        instance = self.storage_model(data=data)
        instance.save()
        instance.refresh_from_db()
        got_data = instance.data

        # turn both into standardized json
        js = json.dumps(got_data, sort_keys=True)
        ejs = json.dumps(data, sort_keys=True)

        # and assert equality
        return self.assertEqual(js, ejs, message)

    def _assert_notstores(self, data, message=None):
        with self.assertRaises(Exception):
            self._store_and_retrieve(data)
