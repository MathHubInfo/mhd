from django.db import models

from ...fields.ndarray import SmartNDArrayField
from ..codec import Codec

class MatrixAsList_StandardInt_2(Codec):
    """ Codec for 2-dimensional matrices as lists """

    value = SmartNDArrayField(typ=models.IntegerField(), dim=2)
