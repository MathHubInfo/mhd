from collections import OrderedDict

from django.db import models
from rest_framework import serializers

from mdh.utils import uuid4
from mdh_schema.models import Collection, Property

class Item(models.Model):
    """ Any Item in Any Collection """

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)

    collections = models.ManyToManyField(
        Collection, help_text="Collection(s) each item occurs in", blank=True)

    def annotate_property(self, prop):
        """
            Annotates and returns the raw property value for the given property
            on this object
        """

        codec_model = prop.codec_model
        value_field = codec_model._meta.get_field('value')

        # recover the cell database value by filtering appropriately
        # TODO: What to do with multiple elements?
        cell = codec_model.objects.filter(active=True, prop=prop).first()
        if cell is not None:
            value = value_field.get_prep_value(cell.value)
        else:
            value = None

        # and set the property
        setattr(self, 'property_value_{}'.format(prop.slug), value)
        return value

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
