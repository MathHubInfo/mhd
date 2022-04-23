from __future__ import annotations

from mhd.utils import ModelWithMetadata, QuerySetLike
from mviews.models import View
from django.db import models, transaction, connection
from django.db.models.signals import post_save

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Optional, Iterable, Type, Any
    from .query import QueryBuilder
    from mhd_data.models import Codec
    from django.db.models import QuerySet
    from collections import OrderedDict


class Collection(ModelWithMetadata):
    """ Collection of Mathematical Items """
    _query_builder: QueryBuilder

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

        # create a new query builder
        from .query import QueryBuilder
        self._query_builder = QueryBuilder(self)

    class Meta:
        indexes = [
            models.Index(fields=['slug']),
        ]

    displayName: str = models.TextField(help_text="Name of this collection")
    slug: str = models.SlugField(
        help_text="Identifier of this collection", unique=True)

    description: str = models.TextField(
        help_text="A human-readable description of this collection")
    url: Optional[str] = models.URLField(
        null=True, blank=True, help_text="URL for more information about this collection")

    count: Optional[int] = models.IntegerField(
        null=True, blank=True, help_text="Total number of items in this collection")
    count_frozen: bool = models.BooleanField(
        default=False, help_text="When set to true, freeze the count of this collection")

    viewName: Optional[str] = models.SlugField(
        help_text="Name for the (potentially materialized) view of this collection (if any)", unique=True, null=True, blank=True)

    template: Optional[str] = models.TextField(
        help_text="Custom template for rendering this collection", null=True, blank=True, default=None
    )

    exporters = models.ManyToManyField("Exporter", help_text="List of enabled exporters for this collection")

    def update_count(self) -> Optional[int]:
        """ Updates the count of items in this collection iff it is not frozen """

        if self.count_frozen:
            return None

        self.count = self.query_count().fetchone()[0]
        self.save()

        for p in self.prefilter_set.all():
            p.update_count()

        return self.count

    def invalidate_count(self) -> None:
        """ Invalidates the count associated to this collection iff it is no frozen """

        if self.count_frozen:
            return

        self.count = None
        self.save()

        for p in self.prefilter_set.all():
            p.invalidate_count()

    flag_large_collection: bool = models.BooleanField(
        default=False, help_text="Flag this collection as potentially large to the user interface"
    )

    def get_property(self, slug: str) -> Optional[Property]:
        """ Returns a property of the given name """
        return self.property_set.filter(slug=slug).first()

    def __str__(self) -> str:
        return "Collection {0!r}".format(self.slug)

    def properties(self) -> Iterable[Property]:
        return self.property_set.all()

    @property
    def codecs(self) -> Iterable[Codec]:
        """ An iterator for the codecs of this collection """
        codecs = set()
        for prop in self.property_set.all():
            codecs.add(prop.codec_model)
        return codecs

    def query(self, properties: Optional[Iterable[Property]] = None, filter: Optional[str] = None, limit: Optional[int] = None, offset: Optional[int] = None, order: Optional[str] = None) -> QuerySet:
        """
            Builds a query returning items in this collection with
            annotated properties prop.
            If properties is None, all collection properties are returned.
            Limit and Offset can be used for pagination, however using only
            offset is not supported.
            Order represents an order to return the results in.
            Returns a tuple (query, properties) of the RawQuerySet query itself and the list
            of queried properties
        """

        from mhd_data.models import Item

        # get all the properties
        if properties is None:
            properties = self.properties()

        # check if we have a materialized view
        view = self.view
        if view is not None:
            use_view = view.name
        else:
            use_view = None

        # build the query
        sql, sql_args = self._query_builder(
            properties=properties,
            where=filter,
            limit=limit,
            offset=offset,
            order=order,
            count_query=False,
            use_view=use_view
        )

        # and return it
        return Item.objects.raw(sql, sql_args), list(properties)

    def query_count(self, properties: Optional[Iterable[Property]]=None, filter: Optional[str]=None) -> QuerySetLike:
        """
            Like .query() but returns a QuerySetLike for counting
        """

        from mhd_data.models import Item

        # get all the properties
        if properties is None:
            properties = self.properties()

        # check if we have a view
        view = self.view
        if view is not None:
            use_view = view.name
        else:
            use_view = None

        # build the query
        sql, sql_args = self._query_builder(
            properties=properties,
            where=filter,
            limit=None,
            offset=None,
            order=None,
            count_query=True,
            use_view=use_view
        )

        # and return it
        return QuerySetLike(sql, sql_args)

    @property
    def view(self) -> Optional[View]:
        """ Returns the view for this collection """

        # if we do not have a name for the materialized view, don't use it
        if not self.viewName:
            return None

        mview_sql, mview_sql_params = self._query_builder.join_builder()
        return View.make_view(self.viewName, mview_sql, mview_sql_params, materialized=View.supports_materialization(connection))

    def semantic(self, *args: Any, **kwargs: Any) -> Iterable[OrderedDict]:
        """ Same as running .query() and calling .semantic() on each returned value """

        # make the query
        qset, props = self.query(*args, **kwargs)
        return map(lambda o: o.semantic_result(self, props), qset)

    def is_empty(self) -> bool:
        """ Checks if this collection is empty """

        # check if any of the properties have values
        for p in self.property_set.all():
            if p.has_values(self):
                return False

        # check if any of the items have values
        return not self.item_set.all().exists()

    @transaction.atomic()
    def safe_delete(self) -> None:
        """ Safely deletes this collection from the database
            Raise CollectionNotEmpty when the collection is not empty
        """

        # if the collection is not empty, raise
        if not self.is_empty():
            raise CollectionNotEmpty

        # clear the property set
        self.property_set.clear()

        # clear all 'orphaned' properties
        Property.objects.filter(collections=None).delete()

        # now delete it from the database
        self.delete()

    @transaction.atomic()
    def flush(self) -> None:
        """ Removes all items from this collection """

        # first delete all the values for all the properties
        for p in self.property_set.all():
            p.values(self).delete()

        # Dis-associate all the items
        self.item_set.clear()

        # clear all the orphaned items
        from mhd_data.models import Item
        Item.objects.filter(collections=None).delete()

def collection_save(sender: Type[Collection], instance: Collection, **kwargs: Any) -> None:
    """ Creates the view of a collection """
    view = instance.view
    if view is not None:
        view.save()

post_save.connect(collection_save, sender=Collection)


class CollectionNotEmpty(Exception):
    """ Raised when the user attempts to delete a collection
    that is not empty """
    pass

class Exporter(models.Model):
    """ Information about an exporter """

    class Meta:
        ordering = ['slug']

    slug: str = models.SlugField(unique=True, help_text="Slug of the exporter")

    def __str__(self):
        return "Exporter {0:d} ({1!r})".format(self.pk, self.slug)

class Property(ModelWithMetadata):
    """ Information about a specific property """

    class Meta:
        indexes = [
            models.Index(fields=['slug']),
        ]
        ordering = ['id']
        verbose_name_plural = 'Properties'

    displayName: str = models.TextField(help_text="Display Name for this property")
    slug: str = models.SlugField(help_text="Identifier of this Collection")

    description: str = models.TextField(
        default="", help_text="A human-readable description of this property")
    url: Optional[str] = models.URLField(
        null=True, blank=True, help_text="URL for more information about this property")

    codec: str = models.SlugField(
        help_text="Name of the codec table that stores this property ")

    @property
    def codec_model(self) -> Type[Codec]:
        """ Returns the Codec Model belonging to this Property or None """
        from mhd_data.models import CodecManager

        model = CodecManager.find_codec(self.codec)
        if model is None:
            raise ValueError(
                'Can not find Codec Table {0:r}'.format(self.codec))
        return model

    def get_column(self, collection: Collection) ->Iterable[Codec]:
        """ Returns a QuerySet of the appropriate CodecModel that represents this property within the collection """

        return self.codec_model.objects.filter(prop=self, item__collections=collection)

    collections = models.ManyToManyField(
        Collection, through='PropertyCollectionMembership', help_text="Collection(s) this property occurs in", blank=True)

    def __str__(self) -> str:
        return "Property {0:d} ({1!r})".format(self.pk, self.slug)

    def values(self, collection: Optional[Collection]=None) -> Iterable[Codec]:
        """ Returns a QuerySet of all values of this property,
        optionally only those linked to a specific collection.
        """

        if collection is not None:
            self.codec_model.objects.filter(item__in=collection.item_set.all())

        return self.codec_model.objects.filter(prop_id=self.id)

    def has_values(self, collection: Optional[Collection]=None) -> bool:
        """ Returns a bool indicating if this property has any values """

        return self.values(collection=collection).exists()

class PropertyCollectionMembership(models.Model):
    class Meta:
        unique_together = [('property', 'collection')]
        indexes = [
            models.Index(fields=['property']),
            models.Index(fields=['collection']),
        ]

    property: Property = models.ForeignKey(Property, on_delete=models.CASCADE)
    collection: Collection = models.ForeignKey(Collection, on_delete=models.CASCADE)


class PreFilter(models.Model):
    collection: Collection = models.ForeignKey(Collection, on_delete=models.CASCADE)
    description: str = models.TextField(
        default="", help_text="Description of this pre-filter")
    condition: str = models.TextField(
        default="", help_text="Condition of this pre-filter")

    count: Optional[int] = models.IntegerField(null=True, blank=True)

    def update_count(self) -> None:
        """ Updates the count of this pre-filter """
        if self.collection.count_frozen:
            return

        self.count = self.collection.query_count(
            filter=self.condition).fetchone()[0]
        self.save()

    def invalidate_count(self) -> None:
        """ Invalidates the count of this pre-filter """

        if self.collection.count_frozen:
            return

        self.count = None
        self.save()

    def __str__(self) -> str:
        return "PreFilter {0!r} [{1!r}]".format(self.description, self.condition)


__all__ = ["Collection", "Property"]
