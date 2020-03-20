from __future__ import annotations

from django.db import models

from ..codec import Codec

class StandardString(Codec):
    """ Standard String Codec """

    value: str = models.TextField()

    operators = ('=', '!=')
    operator_type = (str,)
