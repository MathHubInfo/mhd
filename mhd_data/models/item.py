from collections import OrderedDict

from django.db import models
from rest_framework import serializers

from mdh.utils import uuid4
from mhd_schema.models import Collection

class Item(models.Model):
    """ Any Item in Any Collection """

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)

    collections = models.ManyToManyField(
        Collection, help_text="Collection(s) each item occurs in", blank=True)

    def _annotate_property(self, prop):
        """
            Annotates and returns the property value of this property.
        """

        codec_model = prop.codec_model

        # recover the cell database value by filtering appropriately
        # TODO: What to do with multiple elements?
        cell = codec_model.objects.filter(active=True, prop=prop).first()
        if cell is not None:
            value = cell.value
        else:
            value = None

        # and set the property
        setattr(self, 'property_value_{}'.format(prop.slug), value)
        return value

    def semantic(self, collection):
        """
            Annotates all properties of the given collection to the object
            and returns an appropriate annotation.
        """

        properties = list(collection.property_set.order_by('id'))
        for p in properties:
            self._annotate_property(p)

        return self.semantic_result(collection, properties, False)

    def semantic_result(self, collection, properties, database=True):
        """
            Returns a serialized version of this object as part of a semantic
            result set.
            Requires appropriatly annoted values on this object.
        """

        return SemanticItemSerializer(collection=collection, properties=properties, database=database).to_representation(self)


class SemanticItemSerializer(serializers.Serializer):
    def __init__(self, *args, database = True, **kwargs):
        self.collection = kwargs.pop('collection')
        self.database = database
        self.properties = sorted(kwargs.pop('properties'), key=lambda p: p.slug)

        super().__init__(*args, **kwargs)

    def to_representation(self, item):
        semantic = OrderedDict()
        semantic["_id"] = str(item.pk)
        for p in self.properties:
            semantic[p.slug] = p.codec_model.serialize_value(
                getattr(item, 'property_value_{}'.format(p.slug)),
                database=self.database
            )
        return semantic

    def to_internal_value(self, item):
        raise Exception("SemanticItemSerializer is readonly")


__all__ = ["Item"]
