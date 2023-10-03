from __future__ import annotations

from django.db import models

from ..codec import Codec


class StandardBool(Codec):
    """Standard Boolean Codec"""

    value: bool = models.BooleanField()

    operators = ("=", "!=")
    operator_type = bool
