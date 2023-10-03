from __future__ import annotations

from django.db import models

from ..codec import Codec


class GraphAsSparse6(Codec):
    """GraphAsSparse6 Codec"""

    value: str = models.TextField()
