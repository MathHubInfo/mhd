from __future__ import annotations

from django.db import models
from rest_framework import serializers

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Any
    from django.db.models import Field
    from rest_framework.serializers import Serializer

def get_standard_serializer_field(field: Field) -> Serializer:
    """
        Given a field, returns the standardized DRF Serializer for it
    """

    # make a copy of the field
    # so that it is not ever associated to two different models
    field = reconstruct(field)

    class FakeModel(models.Model):
        class Meta:
            abstract = True
        value = field

    class FakeSerializer(serializers.ModelSerializer):
        class Meta:
            model = FakeModel
            fields = ['value']

    serializer = FakeSerializer()
    sfield, sargs = serializer.build_standard_field('value', field)
    return sfield(**sargs)

def check_field_value(field: Field, serializer: Serializer, value: Any):
    """ Checks if the given value for the given field is valid """

    serializer.to_internal_value(value)

def reconstruct(field: Field) -> Field:
    """ Deconstructs and Re-constructs a field """

    name, clz, args, kwargs = field.deconstruct()
    return field.__class__(*args, **kwargs)
