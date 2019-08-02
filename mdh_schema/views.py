from rest_framework import serializers, viewsets

from mdh_data.models import Codec
from mdh_django.utils import DumbJSONField

from .models import Collection, Property


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

class CollectionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Collection.objects.all().order_by('-slug')
    serializer_class = CollectionSerializer
    lookup_field = 'slug'

__all__ = ["CollectionViewSet"]
