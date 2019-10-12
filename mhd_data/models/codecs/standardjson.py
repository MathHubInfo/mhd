from ...fields.json import SmartJSONField
from ..codec import Codec


class StandardJSON(Codec):
    """ Codec that stores its value as JSON """

    value = SmartJSONField()

    operators = ()
    operator_type = None
