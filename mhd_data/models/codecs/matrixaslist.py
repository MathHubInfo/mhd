from __future__ import annotations

from ...fields.ndarray import SmartNDArrayField
from ..codecoperator import codec_operator

from .standardint import StandardInt

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ...models import Codec
    from typing import Type


@codec_operator
def MatrixAsListCodec(
    elementCodec: Type[Codec], rows: int, columns: int
) -> tuple[Type[object], str]:
    """A Codec Operator for Matrices as list"""

    class CodecClass:
        value = SmartNDArrayField(typ=elementCodec.get_value_fields()[0], dim=1)

    return CodecClass, "MatrixAsList_{}_{}_{}".format(
        elementCodec.get_codec_name(), rows, columns
    )


MatrixAsListCodec(StandardInt, 2, 2)
MatrixAsListCodec(StandardInt, 3, 3)
