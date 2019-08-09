from django.db import models

from ..codec import Codec

from rest_framework import serializers


class StandardInt(Codec):
    """ Standard Integer Codec """

    value = models.IntegerField()
    _serializer_field = serializers.IntegerField()

    operators = ('==', '<', '<=', '>', '>=', '!=')
    @classmethod
    def is_valid_operand(cls, literal):
        """ Checks that the argument is a valid operand """
        return isinstance(literal, int) and not isinstance(literal, bool)
