from django.db import models

from ..codec import Codec


class StandardString(Codec):
    """ Standard String Codec """

    value = models.TextField()

    operators = ('=', '!=')
    operator_type = (str,)
