import json

from rest_framework import serializers

from ..models import Collection, Property
from .fields import CodecField, DumbJSONField


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
        #lookup_field = 'slug'

    metadata = DumbJSONField(source='metadatastring')
    properties = PropertySerializer(many=True, source='property_set')

__all__ = ["PropertySerializer", "CollectionSerializer"]