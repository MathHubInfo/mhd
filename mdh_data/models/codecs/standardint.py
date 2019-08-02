from django.db import models

from ..codec import Codec

class StandardInt(Codec):
    """ Standard Integer Codec """

    value = models.IntegerField()
