from __future__ import annotations

from django.db import models

from ...fields.ndarray import SmartNDArrayField
from ..codec import Codec

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import List


class FactorizationAsSparseArray(Codec):
    """Represents an integer factorization as a sparse array"""

    value: List[int] = SmartNDArrayField(typ=models.IntegerField(), dim=1)
