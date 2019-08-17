from django.db import models

from ...fields.ndarray import SmartNDArrayField
from ..codec import Codec

class ListAsArray_StandardInt(Codec):
    """ Codec for lists as arrays """

    value = SmartNDArrayField(typ=models.IntegerField(), dim=1)
