
from mhd.utils import ModelWithMetadata, QuerySetLike, MaterializedView
from django.db import models, transaction

from typing import Optional, Iterable


class Collection(ModelWithMetadata):
    """ Collection of Mathematical Items """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # create a new query builder
        from .query import QueryBuilder
        self._query_builder = QueryBuilder(self)

    class Meta:
        indexes = [
            models.Index(fields=['slug']),
        ]

    displayName = models.TextField(help_text="Name of this collection")
    slug = models.SlugField(
        help_text="Identifier of this collection", unique=True)

    description = models.TextField(
        help_text="A human-readable description of this collection")
    url = models.URLField(
        null=True, blank=True, help_text="URL for more information about this collection")

    count = models.IntegerField(
        null=True, blank=True, help_text="Total number of items in this collection")
    count_frozen = models.BooleanField(
        default=False, help_text="When set to true, freeze the count of this collection")

    materializedViewName = models.SlugField(
        help_text="Name for the materialized view of this collection (if any)", unique=True, null=True, blank=True)

    def update_count(self) -> int:
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

    flag_large_collection = models.BooleanField(
        default=False, help_text="Flag this collection as potentially large to the user interface"
    )

    def get_property(self, slug: str) -> Optional['Property']:
        """ Returns a property of the given name """
        return self.property_set.filter(slug=slug).first()

    def __str__(self) -> str:
        return "Collection {0!r}".format(self.slug)

    def properties(self) -> Iterable['Property']:
        return self.property_set.all()

    @property
    def codecs(self):
        """ An iterator for the codecs of this collection """
        codecs = set()
        for prop in self.property_set.all():
            codecs.add(prop.codec_model)
        return codecs

    def query(self, properties=None, filter=None, limit=None, offset=None, order=None):
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
        mview = self.materialized_view
        if mview is not None:
            use_view = mview.name
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

    def query_count(self, properties=None, filter=None):
        """
            Like .query() but returns a QuerySetLike for counting
        """

        from mhd_data.models import Item

        # get all the properties
        if properties is None:
            properties = self.properties()

        # check if we have a materialized view
        mview = self.materialized_view
        if mview is not None:
            use_view = mview.name
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

    def sync_materialized_view(self):
        """ Syncronizes this materialized view with the database """

        # if we have a materialized view object, get it
        view = self.materialized_view
        if not view:
            return False

        # and syncronize it
        from django.db import connection
        with connection.cursor() as cursor:
            view.sync(connection, cursor)

        return True

    @property
    def materialized_view(self) -> MaterializedView:
        """ Returns the materialized view for a given collection """

        # if we do not have a name for the materialized view, don't use it
        if not self.materializedViewName:
            return None

        mview_sql, mview_sql_args = self._query_builder.join_builder()
        return MaterializedView(self.materializedViewName, mview_sql, mview_sql_args)

    def semantic(self, *args, **kwargs):
        """ Same as running .query() and calling .semantic() on each returned value """

        # make the query
        qset, props = self.query(*args, **kwargs)
        return map(lambda o: o.semantic_result(self, props), qset)

    def is_empty(self):
        """ Checks if this collection is empty """

        # check if any of the properties have values
        for p in self.property_set.all():
            if p.has_values(self):
                return False

        # check if any of the items have values
        return not self.item_set.all().exists()

    @transaction.atomic()
    def safe_delete(self):
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
    def flush(self):
        """ Removes all items from this collection """

        # first delete all the values for all the properties
        for p in self.property_set.all():
            p.values(self).delete()

        # Dis-associate all the items
        self.item_set.clear()

        # clear all the orphaned items
        from mhd_data.models import Item
        Item.objects.filter(collections=None).delete()


class CollectionNotEmpty(Exception):
    """ Raised when the user attempts to delete a collection
    that is not empty """
    pass


class Property(ModelWithMetadata):
    """ Information about a specific property """

    class Meta:
        indexes = [
            models.Index(fields=['slug']),
        ]
        ordering = ['id']

    displayName = models.TextField(help_text="Display Name for this property")
    slug = models.SlugField(help_text="Identifier of this Collection")

    description = models.TextField(
        default="", help_text="A human-readable description of this property")
    url = models.URLField(
        null=True, blank=True, help_text="URL for more information about this property")

    codec = models.SlugField(
        help_text="Name of the codec table that stores this property ")

    @property
    def codec_model(self):
        """ Returns the Codec Model belonging to this Property or None """
        from mhd_data.models import CodecManager

        model = CodecManager.find_codec(self.codec)
        if model is None:
            raise ValueError(
                'Can not find Codec Table {0:r}'.format(self.codec))
        return model

    def get_column(self, collection):
        """ Returns a QuerySet of the appropriate CodecModel that represents this property within the collection """

        return self.codec_model.objects.filter(prop=self, item__collections=collection)

    collections = models.ManyToManyField(
        Collection, through='PropertyCollectionMembership', help_text="Collection(s) this property occurs in", blank=True)

    def __str__(self):
        return "Property {0:d} ({1!r})".format(self.pk, self.slug)

    def values(self, collection=None):
        """ Returns a QuerySet of all values of this property,
        optionally only those linked to a specific collection.
        """

        if collection is not None:
            self.codec_model.objects.filter(item__in=collection.item_set.all())

        return self.codec_model.objects.filter(prop_id=self.id)

    def has_values(self, collection=None):
        """ Returns a bool indicating if this property has any values """

        return self.values(collection=collection).exists()


class PropertyCollectionMembership(models.Model):
    class Meta:
        unique_together = [('property', 'collection')]
        indexes = [
            models.Index(fields=['property']),
            models.Index(fields=['collection']),
        ]

    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE)


class PreFilter(models.Model):
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE)
    description = models.TextField(
        default="", help_text="Description of this pre-filter")
    condition = models.TextField(
        default="", help_text="Condition of this pre-filter")

    count = models.IntegerField(null=True, blank=True)

    def update_count(self):
        """ Updates the count of this pre-filter """
        if self.collection.count_frozen:
            return

        self.count = self.collection.query_count(
            filter=self.condition).fetchone()[0]
        self.save()

    def invalidate_count(self):
        """ Invalidates the count of this pre-filter """

        if self.collection.count_frozen:
            return

        self.count = None
        self.save()

    def __str__(self):
        return "PreFilter {0!r} [{1!r}]".format(self.description, self.condition)


__all__ = ["Collection", "Property"]
