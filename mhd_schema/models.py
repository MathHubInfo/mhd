
from mhd.utils import ModelWithMetadata, QuerySetLike
from django.db import models, connection, transaction


class Collection(ModelWithMetadata):
    """ Collection of Mathematical Items """

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

    count = models.IntegerField(null=True, blank=True, help_text="Total number of items in this collection")
    count_frozen = models.BooleanField(default=False, help_text="When set to true, freeze the count of this collection")
    def update_count(self):
        """ Updates the count of items in this collection iff it is not frozen """

        if self.count_frozen:
            return None

        self.count = self.query_count().fetchone()[0]
        self.save()
        return self.count


    flag_large_collection = models.BooleanField(
        default=False, help_text="Flag this collection as potentially large to the user interface"
    )

    def get_property(self, slug):
        """ Returns a property of the given name """
        return self.property_set.filter(slug=slug).first()

    def __str__(self):
        return "Collection {0!r}".format(self.slug)

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

        # lazy import
        from mhd_data.models import Item

        SQL, SQL_ARGS, properties = self._query(
            properties, filter, limit, offset, order)
        return Item.objects.raw(SQL, SQL_ARGS), list(properties)

    def query_count(self, properties=None, filter=None):
        """
            Like .query() but returns a QuerySetLike for counting
        """
        # run the sql
        SQL, SQL_ARGS, _ = self._query(
            properties=properties, filter=filter, count=True)
        return QuerySetLike(SQL, SQL_ARGS)

    def _query(self, properties=None, filter=None, limit=None, offset=None, order=None, count=False):
        """
            Builds a query returning items in this collection with
            annotated properties prop.
            If properties is None, all collection properties are returned.
            Limit and Offset can be used for pagination, however using only
            offset is not supported.
            Order represents an order to return the results in.
            When count is True, instead return a query that counts the
            results instead of a normal query.
            Returns a triple (sql, query, properties) of the query itself
            and the list of queried properties
        """

        # lazy import
        from mhd_data.models import Item
        from mhd_data.querybuilder import QueryBuilder

        # SELECT I.id FROM

        # The queries built by this module look as following:
        #
        # SELECT I.id as id,
        #
        # T_prop1.value as prop1_value, T_prop1.id as prop1_cid,
        # T_prop2.value as prop2_value, T_prop2.id as prop2_cid
        #
        # FROM mhd_data_item as I
        #
        # JOIN mhd_data_item_collection as CI
        # ON I.id = CI.item_id AND CI.collection_id = ${collection_id}
        #
        # LEFT OUTER JOIN Codec1 as T_prop1
        # ON I.id = T_prop1.item_id AND T_prop1.active AND T_prop1.prop_id = ${id_of_prop1}
        #
        # LEFT OUTER JOIN Codec2 as T_prop2
        # ON I.id = T_prop2.item_id AND T_prop2.active AND T_prop2.prop_id = ${id_of_prop2};

        # if no properties are given use all of them
        if properties is None:
            properties = self.property_set.all()

        PROPERTIES = []
        SELECTS = ["Count(*) as count"] if count else ["I.id as id"]
        JOINS = [
            "FROM {} as I".format(Item._meta.db_table),

            "JOIN {} as CI ON I.id = CI.item_id AND CI.collection_id = {}".format(
                Item.collections.through._meta.db_table,
                self.pk
            )
        ]
        SUFFIXES = []

        for prop in properties:
            # the physical table to look up the values in
            physical_table = prop.codec_model._meta.db_table
            physical_prop_id = str(prop.pk)

            # alias for the appropriate property table
            virtual_table = '"T_{}"'.format(prop.slug)

            # alias for the value field
            value_field = '"property_value_{}"'.format(prop.slug)
            # alias for the cid field
            cid_field = '"property_cid_{}"'.format(prop.slug)

            # The property we just added
            PROPERTIES.append(prop.slug)

            if not count:
                # Fields we select, TODO: Support for derived values
                SELECTS.append("{}.value as {}".format(
                    virtual_table, value_field))
                # SELECTS.append("{}.id as {}".format(virtual_table, cid_field))

            # build the JOINs query
            JOINS.append("LEFT OUTER JOIN {} as {}".format(
                physical_table, virtual_table))

            JOINS.append(
                "ON I.id = {0:s}.item_id AND {0:s}.active AND {0:s}.prop_id = {1:s}".format(virtual_table, physical_prop_id))

        # add an order by clause
        if not count and order is not None and len(order) > 0:
            def parse_order(oslug):
                oslug = oslug.strip()
                if len(oslug) == 0:
                    raise Exception('Order string received empty property')

                if oslug[0] == '+':
                    order = 'ASC'
                    oslug = oslug[1:]
                elif oslug[0] == '-':
                    order = 'DESC'
                    oslug = oslug[1:]
                else:
                    order = 'ASC'

                oslug = oslug.strip()
                if len(oslug) == 0:
                    raise Exception('Order string received empty property')

                if not oslug in PROPERTIES:
                    raise Exception('Unknown property {}'.format(oslug))

                return '"property_value_{}" {}'.format(oslug, order)
            ORDER_PARTS = ', '.join([parse_order(o) for o in order.split(',')])
            SUFFIXES.append("ORDER BY {}".format(ORDER_PARTS))

        elif not count:
            SUFFIXES.append("ORDER BY I.id")

        # and build the slicing clauses
        if (limit is not None):
            SUFFIXES.append("LIMIT {0:d}".format(limit))
            if (offset is not None):
                SUFFIXES.append("OFFSET {0:d}".format(offset))

        # join the appropriate string
        SQL_SELECTS = ",".join(SELECTS)
        SQL_JOINS = " ".join(JOINS)
        SQL_SUFFIXES = " ".join(SUFFIXES)

        # if we have a filter, we need to build it using the querybuilder
        if filter is not None:
            qb = QueryBuilder()
            SQL_FILTER, SQL_ARGS = qb(filter, properties)
            SQL = "SELECT {} {} WHERE {} {}".format(
                SQL_SELECTS, SQL_JOINS, SQL_FILTER, SQL_SUFFIXES)
        else:
            # Build the final query and return it inside a raw
            SQL = "SELECT {} {} {}".format(
                SQL_SELECTS, SQL_JOINS, SQL_SUFFIXES)
            SQL_ARGS = []

        # return the sql statement, the arguments and the properties
        return SQL.strip(), tuple(SQL_ARGS), list(properties)

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

    def __str__(self):
        return "PreFilter {0!r} [{1!r}]".format(self.description, self.condition)

__all__ = ["Collection", "Property"]
