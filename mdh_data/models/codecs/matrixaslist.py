from ...fields.ndarray import SmartNDArrayField
from ..codecoperator import codec_operator

from .standardint import StandardInt


@codec_operator
def MatrixAsListCodec(elementCodec, rows, columns):
    """ A Codec Operator for Matrices as list """

    class CodecClass():
        value = SmartNDArrayField(typ=elementCodec.get_value_field(), dim=1)

    return CodecClass, 'MatrixAsList_{}_{}_{}'.format(elementCodec.get_codec_name(), rows, columns)

MatrixAsListCodec(StandardInt, 2, 2)
MatrixAsListCodec(StandardInt, 3, 3)
