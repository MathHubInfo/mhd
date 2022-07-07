from __future__ import annotations

from collections import OrderedDict

from django.db import models
from rest_framework import serializers

from mhd.utils import uuid4
from mhd_schema.models import Collection

from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from typing import Optional, List, Any, Iterable
    from uuid import UUID
    from mhd_schema.models import Property


class Item(models.Model):
    """ Any Item in Any Collection """

    id: UUID = models.UUIDField(
        primary_key=True, default=uuid4, editable=False)

    collections = models.ManyToManyField(
        Collection, through='ItemCollectionAssociation', help_text="Collection(s) each item occurs in", blank=True)

    def _annotate_property(self, prop: Property) -> List[Any]:
        """
            Annotates and returns the property value of this property.
        """

        from mhd_schema.query import QueryBuilder  # lazy to avoid cyclic import

        codec_model = prop.codec_model

        # recover the cell database value by filtering appropriately
        # TODO: What to do with multiple elements?
        cell = codec_model.objects.filter(
            item_id=self.id, active=True, prop=prop).first()

        vfields = codec_model.get_value_fields()

        results = [None] * len(vfields)
        for (i, vfield) in enumerate(vfields):
            value = getattr(cell, vfield.name) if (cell is not None) else None
            setattr(self, QueryBuilder._prop_value(prop, i, sql=False), value)
            results[i] = value
        return results

    def semantic(self, collection: Collection) -> OrderedDict:
        """
            Annotates all proper ties of the given collection to the object
            and returns an appropriate annotation.
        """

        properties = list(collection.property_set.order_by('id'))
        for p in properties:
            self._annotate_property(p)

        return self.semantic_result(collection, properties, False)

    def semantic_result(self, collection: Collection, properties: Iterable[Property], database: bool = True) -> OrderedDict:
        """
            Returns a serialized version of this object as part of a semantic
            result set.
            Requires appropriatly annoted values on this object.
        """

        return SemanticItemSerializer(collection=collection, properties=properties, database=database).to_representation(self)


class ItemCollectionAssociation(models.Model):
    """ Explicit association between items and collections """
    class Meta:
        unique_together = [('item', 'collection')]
        indexes = [
            models.Index(fields=['item']),
            models.Index(fields=['collection']),
        ]

    item: Item = models.ForeignKey(Item, on_delete=models.CASCADE)
    collection: Collection = models.ForeignKey(
        Collection, on_delete=models.CASCADE)


class SemanticItemSerializer(serializers.Serializer):
    collection: Collection
    database: bool
    properties: Iterable[Property]

    def __init__(self, *args: Any, database: bool = True, **kwargs: Any) -> None:
        self.collection = kwargs.pop('collection')
        self.database = database
        self.properties = sorted(kwargs.pop(
            'properties'), key=lambda p: p.slug)

        super().__init__(*args, **kwargs)

    def to_representation(self, item: Item) -> OrderedDict:
        from mhd_schema.query import QueryBuilder  # lazy to avoid cyclic import

        semantic = OrderedDict()
        semantic["_id"] = str(item.pk)
        for p in self.properties:
            values = p.codec_model.serialize_values(
                *[
                    getattr(item, QueryBuilder._prop_value(p, i, sql=False))
                    for i in range(len(p.codec_model.get_value_fields()))
                ],
                database=self.database
            )
            semantic[p.slug] = values[0] if len(values) == 1 else values
        return semantic

    def to_internal_value(self, item: Item) -> None:
        raise Exception("SemanticItemSerializer is readonly")


__all__ = ["Item"]
