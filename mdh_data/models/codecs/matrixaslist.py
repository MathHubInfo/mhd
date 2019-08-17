from django.db import models

from ...fields.ndarray import SmartNDArrayField
from ..codec import Codec
from .standardint import StandardInt


def MatrixAsListCodec(elementCodec, rows, columns):
    """ A Codec Operator for Matrices as list """
    class CodecClass(Codec):
        class Meta(Codec.Meta):
            abstract = True
        value = SmartNDArrayField(typ=elementCodec.get_value_field(), dim=1)
    return CodecClass

class MatrixAsList_StandardInt_2_2(MatrixAsListCodec(StandardInt, 2, 2)):
    pass

__all__ = ['MatrixAsList_StandardInt_2_2']
