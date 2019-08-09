from django.db import models

from ..codec import Codec


class StandardBool(Codec):
    """ Standard Boolean Codec """

    value = models.BooleanField()

    operators = ('==', '!=')
    operator_type = bool
