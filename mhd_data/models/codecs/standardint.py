from __future__ import annotations

from django.db import models

from ..codec import Codec

from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Any


class StandardInt(Codec):
    """Standard Integer Codec"""

    value: int = models.IntegerField()
    _serializer_field = serializers.IntegerField()

    operators = ("=", "<", "<=", ">", ">=", "!=")

    @classmethod
    def is_valid_operand(cls, literal: Any) -> bool:
        """Checks that the argument is a valid operand"""
        try:
            literal = cls.populate_values(literal)[0]
        except ValidationError:
            return False

        return isinstance(literal, int) and not isinstance(literal, bool)
