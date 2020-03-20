from __future__ import annotations

from django.db import models

from mhd.utils import ModelWithMetadata, uuid4

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Optional
    from uuid import UUID
    from datetime import datetime


class Provenance(ModelWithMetadata):
    """ The Provenance model represents provenance-data for a single cell """
    id: UUID = models.UUIDField(primary_key=True, default=uuid4, editable=False)

    time: datetime = models.DateTimeField(auto_now_add=True, help_text="Time at which this provenance was created")
    predecessor: Optional[Provenance] = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, help_text="Previous provenance")
