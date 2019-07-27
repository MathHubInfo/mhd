from django.db import models

from ..codec import Codec

class StandardBool(Codec):
    """ A Table for the integer codec """

    value = models.BooleanField()
