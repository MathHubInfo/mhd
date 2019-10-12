from ...fields.ndarray import SmartNDArrayField
from .standardint import StandardInt
from .standardjson import StandardJSON
from ..codecoperator import codec_operator

@codec_operator
def ListAsArrayCodec(elementCodec):
    """ A Codec Operator for Matrices as list """

    class CodecClass():
        value = SmartNDArrayField(typ=elementCodec.get_value_field(), dim=1, null=True, blank=True)

    return CodecClass, 'ListAsArray_{}'.format(elementCodec.get_codec_name())


ListAsArrayCodec(StandardInt)
ListAsArrayCodec(StandardJSON)
