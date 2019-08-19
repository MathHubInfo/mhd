from collections import OrderedDict

from django.db import models, transaction
from rest_framework import serializers

from mdh.utils import uuid4
from mdh_schema.models import Collection

class Item(models.Model):
    """ Any Item in Any Collection """

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)

    collections = models.ManyToManyField(
        Collection, help_text="Collection(s) each item occurs in", blank=True)

    def semantic(self, collection, properties):
        """ Returns a JSON object representing the semantics of this object """
        return SemanticItemSerializer(collection=collection, properties=properties).to_representation(self)


class SemanticItemSerializer(serializers.Serializer):
    def __init__(self, *args, **kwargs):
        self.collection = kwargs.pop('collection')
        self.properties = sorted(kwargs.pop('properties'), key=lambda p: p.slug)

        super().__init__(*args, **kwargs)

    def to_representation(self, item):
        semantic = OrderedDict()
        semantic["_id"] = str(item.pk)
        for p in self.properties:
            semantic[p.slug] = p.codec_model.serialize_value(
                getattr(item, 'property_value_{}'.format(p.slug)))
        return semantic

    def to_internal_value(self, item):
        raise Exception("SemanticItemSerializer is readonly")


__all__ = ["Item"]
