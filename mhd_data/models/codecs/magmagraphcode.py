from __future__ import annotations

from django.db import models

from ..codec import Codec

class MagmaGraphCode(Codec):
    """ Magma Graph Code """

    value: str = models.TextField()

    operators = ()
    operator_type = (str,)
