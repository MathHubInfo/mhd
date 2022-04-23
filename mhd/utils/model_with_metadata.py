from __future__ import annotations

from django.db import models

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Any

class ModelWithMetadata(models.Model):
    """ A mixin to add any kind of meta-data to a Model class """

    class Meta:
        abstract = True

    metadata: Any = models.JSONField(null=True, blank=True,
                              help_text="Metadata associated with this object")
