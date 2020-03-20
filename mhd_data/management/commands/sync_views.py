from __future__ import annotations

from django.core.management.base import BaseCommand

from mhd_schema.models import Collection

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Any

class Command(BaseCommand):
    help = 'Syncronizes materialized views'

    def handle(self, *args: Any, **kwargs: Any) -> Any:
        for collection in Collection.objects.all():
            collection.sync_materialized_view()
