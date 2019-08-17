from ...fields.ndarray import SmartNDArrayField
from ..codec import Codec
from .standardint import StandardInt


def ListAsArrayCodec(elementCodec):
    """ A Codec Operator for Lists as arrays as list """

    class CodecClass(Codec):
        class Meta(Codec.Meta):
            abstract = True
        value = SmartNDArrayField(typ=elementCodec.get_value_field(), dim=1)
    return CodecClass

class ListAsArray_StandardInt(ListAsArrayCodec(StandardInt)):
    pass

__all__ = ['ListAsArray_StandardInt']
