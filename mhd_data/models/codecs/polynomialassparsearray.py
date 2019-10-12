from django.db import models

from ...fields.ndarray import SmartNDArrayField
from ..codec import Codec

class PolynomialAsSparseArray(Codec):
    """ Represents a polynomial as a sparse array """

    value = SmartNDArrayField(typ=models.IntegerField(), dim=1)
