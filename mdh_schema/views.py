from django.conf import settings
from django.http import Http404, HttpResponse
from django.views import View
from rest_framework import response, serializers, viewsets

from mdh_data.models import CodecManager
from mdh_schema.models import Collection

from .models import Collection, Property


class CodecField(serializers.Field):
    """ A field representing the name of a codec """

    def to_representation(self, value):
        if CodecManager.find_codec(value) is None:
            raise serializers.ValidationError(
                'Codec {0:s} does not exist'.format(value))

        return value

    def to_internal_value(self, data):
        if CodecManager.find_codec(data) is None:
            raise serializers.ValidationError(
                'Codec {0:s} does not exist'.format(data))

        return data


class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = ['displayName', 'slug', 'codec', 'metadata']

    codec = CodecField()


class CollectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collection
        fields = ['displayName', 'slug', 'metadata', 'properties']

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
        serializer = CodecSerializer(
            instance=CodecManager.find_all_codecs(), many=True)
        return response.Response(serializer.data)

    def retrieve(self, request, name=None):
        obj = CodecManager.find_codec(name)
        if obj is None:
            raise Http404

        serializer = CodecSerializer(instance=obj)
        return response.Response(serializer.data)


class FrontendProxyView(View):
    def get(self, request, cid=None):
        if cid is None or Collection.objects.filter(slug=cid).exists():
            url = '/frontend/'
        else:
            url = '/frontend/404/'

        res = HttpResponse()
        res['X-Accel-Redirect'] = url

        # in debugging mode, print a message to show what is expected to happen
        if settings.DEBUG:
            res['Content-Type'] = 'text/html'
            status = 200 if url == '/frontend/' else 404
            res.write('X-Accel-Redirect {}<br/>(In production nginx will replace this by index.html with code {})'.format(url, status))

        return res


__all__ = ["CollectionViewSet", "CodecViewSet", "FrontendProxyView"]
