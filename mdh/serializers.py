from .models import Property, Codec, Collection
from rest_framework import serializers

import json

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

class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = ['displayName', 'slug', 'codec', 'metadata']
    
    metadata = DumbJSONField(source='metadatastring')
    codec = CodecField()

class CollectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collection
        fields = ['displayName', 'slug', 'metadata', 'properties']

    metadata = DumbJSONField(source='metadatastring')
    properties = PropertySerializer(many=True, source='property_set')
    