from __future__ import annotations

import json

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Type, Optional, Any
    from django.db.models import Model


class StorageSuite:
    storage_model: Type[Model] = None

    def _assert_stores(self, data: Any, message: Optional[str] = None) -> None:
        """Asserts that data can be stored and retrieved"""

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

    def _assert_notstores(self, data: Any, message: Optional[str] = None) -> None:
        with self.assertRaises(Exception):
            self._store_and_retrieve(data)
