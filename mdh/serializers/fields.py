import json

from rest_framework import serializers

from ..models import Codec, Collection, Property


class DumbJSONField(serializers.Field):
    def to_representation(self, value):
        return json.dumps(value)

    def to_internal_value(self, data):
        return json.loads(data)

class CodecField(serializers.Field):
    """ A field representing the name of a codec """
    def to_representation(self, value):
        if Codec.find_codec(value) is None:
            raise serializers.ValidationError('Codec {0:s} does not exist'.format(value))
        
        return value

    def to_internal_value(self, data):
        if Codec.find_codec(data) is None:
            raise serializers.ValidationError('Codec {0:s} does not exist'.format(data))
        
        return data

__all__ = ["DumbJSONField", "CodecField"]