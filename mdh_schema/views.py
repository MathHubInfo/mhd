from rest_framework import response, serializers, views, viewsets

from mdh_data.models import Codec
from mdh_django.utils import DumbJSONField

from django.http import Http404

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

class CodecSerializer(serializers.Serializer):
    name = serializers.SerializerMethodField()
    db_type = serializers.SerializerMethodField()

    def get_name(self, obj):
        return obj.get_codec_name()
    
    def get_db_type(self, obj):
        return obj._meta.get_field('value').get_internal_type()

class CodecViewSet(viewsets.ViewSet):
    serializer_class = CodecSerializer
    lookup_field = 'name'

    def list(self, request, *args, **kwargs):
        serializer = CodecSerializer(instance=Codec.find_all_codecs(), many=True)
        return response.Response(serializer.data)
    
    def retrieve(self, request, name=None):
        obj = Codec.find_codec(name, normalize=False)
        if obj is None:
            raise Http404
        
        serializer = CodecSerializer(instance=obj)
        return response.Response(serializer.data)

__all__ = ["CollectionViewSet", "CodecViewSet"]
