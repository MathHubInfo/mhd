from __future__ import annotations

from django.db import models

from ..codec import Codec
from ...fields.ndarray import SmartNDArrayField


class GraphLabel(Codec):
    value_fields = ['label', 'params']

    label: str = models.TextField()
    params: int = SmartNDArrayField(typ=models.IntegerField(), dim=1)
