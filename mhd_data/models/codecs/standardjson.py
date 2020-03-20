from __future__ import annotations

from ...fields.json import SmartJSONField
from ..codec import Codec

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Any

class StandardJSON(Codec):
    """ Codec that stores its value as JSON """

    value: Any = SmartJSONField()

    operators = ()
    operator_type = None
