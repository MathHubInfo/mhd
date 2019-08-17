from collections import OrderedDict

from django.db import models, transaction
from rest_framework import serializers

from mdh.utils import uuid4
from mdh_schema.models import Collection


class ItemManager(models.Manager):
    @transaction.atomic
    def insert_into_collection(self, collection, provenance, header, rows, items=None, logger=None):
        """
            Inserts a list of items into a collection with the specified provenance.
            The header is a list of property names which describe the 2-dimensional list "rows".
            The length of header must correspond to the length of each element in rows.
            If "items" is not None, it must be a list of items to associate each row to.
        """

        # Setup a logger if none provided
        if logger is None:
            def logger(x): return None

        # Make sure all the properties exist
        properties = [collection.get_property(h) for h in header]
        for (p, h) in zip(properties, header):
            if p is None:
                raise ValueError(
                    'Property {0:s} does not exist on {1:s}'.format(h, collection.slug))

        if items is None:
            # new items for each property
            items = [Item() for _ in rows]

            # Save and add them to a collection
            # we can not use bulk_create here, because we need the primary keys to be populated
            for item in items:
                item.save()
                item.collections.add(collection)

            logger("Created {0:d} new item(s)".format(len(items)))
        elif len(items) != len(rows):
            raise ValueError('Cannot insert: len(items) != len(rows)')
        else:
            logger("Did not create any new item(s)", len(items))

        # iterate over each column
        # and bulk_insert the values
        for i, prop in enumerate(properties):
            column = [r[i] for r in rows]

            # Make sure that we do not yet have any values
            if prop.get_column(collection).filter(item__in=items).exists():
                raise ValueError(
                    'Cannot insert property {0:s}: Already exists'.format(prop.slug))

            # create objects for all the values
            values = [prop.codec_model(value=prop.codec_model.populate_value(value), item=item, prop=prop, provenance=provenance, active=True)
                      for (item, value) in zip(items, column)]

            # and create them in bulk
            try:
                prop.codec_model.objects.bulk_create(values)
            except Exception as e:
                raise Exception('Unable to create property {0:s}: {1:s}'.format(prop.slug, str(e)))

            # and log
            logger("Inserted {0:d} value(s) into cells for property {1:s}".format(
                len(values), prop.slug))


class Item(models.Model):
    """ Any Item in Any Collection """

    objects = ItemManager()

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
