from __future__ import annotations

from django.db import models
from ..codec import Codec

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Any

class StandardJSON(Codec):
    """ Codec that stores its value as JSON """

    value: Any = models.JSONField()

    operators = ()
    operator_type = None
