from django.db import models

from ..codec import Codec

class StandardInt(Codec):
    """ A Table for the integer codec """

    value = models.IntegerField()
