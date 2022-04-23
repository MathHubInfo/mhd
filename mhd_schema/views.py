from __future__ import annotations

from django.http import Http404
from rest_framework import response, serializers, viewsets

from mhd_data.models import CodecManager

from .models import Collection, Exporter
from django.http import Http404
from rest_framework import response, serializers, viewsets

from mhd_data.models import CodecManager

from .models import Collection, Property, PreFilter

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Any, Optional
    from mhd_data.models import Codec
    from django.http import HttpRequest
    from rest_framework.response import Response


class CodecField(serializers.Field):
    """ A field representing the name of a codec """

    def to_representation(self, value: str) -> str:
        if CodecManager.find_codec(value) is None:
            raise serializers.ValidationError(
                'Codec {0:s} does not exist'.format(value))

        return value

    def to_internal_value(self, data: str) -> str:
        if CodecManager.find_codec(data) is None:
            raise serializers.ValidationError(
                'Codec {0:s} does not exist'.format(data))

        return data


class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = ['displayName', 'slug', 'description', 'url', 'codec', 'metadata']

    codec = CodecField()

class PreFieldFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreFilter
        fields = ['description', 'condition', 'count']

class ExporterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exporter
        fields = ['slug']


class CollectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collection
        fields = ['displayName', 'slug', 'description', 'url', 'metadata', 'properties', 'exporters', 'preFilters', 'flag_large_collection', 'count', 'template']

    properties = serializers.SerializerMethodField()
    def get_properties(self, obj: Collection) -> PropertySerializer:
        props = obj.property_set.order_by('id')
        return PropertySerializer(props, many=True, context=self.context).data

    preFilters = serializers.SerializerMethodField()
    def get_preFilters(self, obj: Collection) -> PreFieldFieldSerializer:
        pre_filters = obj.prefilter_set.order_by('id')
        return PreFieldFieldSerializer(pre_filters, many=True, context=self.context).data

    exporters = serializers.SerializerMethodField()
    def get_exporters(self, obj: Collection) -> ExporterSerializer:
        exporters = obj.exporters.order_by('id')
        return [exporter.slug for exporter in exporters]


class CollectionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Collection.objects.all().order_by('displayName')
    serializer_class = CollectionSerializer
    lookup_field = 'slug'


class CodecSerializer(serializers.Serializer):
    name = serializers.SerializerMethodField()
    db_type = serializers.SerializerMethodField()

    def get_name(self, obj: Codec) -> Codec:
        return obj.get_codec_name()

    def get_db_type(self, obj: Codec) -> str:
        return obj._meta.get_field('value').get_internal_type()


class CodecViewSet(viewsets.ViewSet):
    serializer_class = CodecSerializer
    lookup_field = 'name'

    def list(self, request, *args, **kwargs):
        serializer = CodecSerializer(
            instance=CodecManager.find_all_codecs(), many=True)
        return response.Response(serializer.data)

    def retrieve(self, request: HttpRequest, name: Optional[str]=None) -> Response:
        obj = CodecManager.find_codec(name)
        if obj is None:
            raise Http404

        serializer = CodecSerializer(instance=obj)
        return response.Response(serializer.data)

__all__ = ["CollectionViewSet", "CodecViewSet"]
