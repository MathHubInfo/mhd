from __future__ import annotations

from django.db import models

from ..codec import Codec


class CoveringRelationAsDigraph6(Codec):
    """ CoveringRelationAsDigraph6 Codec """

    value: str = models.TextField()
