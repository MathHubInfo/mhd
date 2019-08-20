from django.db import models
from rest_framework import serializers

def get_standard_serializer_field(field):
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

def check_field_value(field, serializer, value):
    """ Checks if the given value for the given field is valid """

    serializer.to_internal_value(value)

def reconstruct(field):
    """ Deconstructs and Re-constructs a field """

    name, clz, args, kwargs = field.deconstruct()
    return field.__class__(*args, **kwargs)
