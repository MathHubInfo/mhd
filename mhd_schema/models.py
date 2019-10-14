
from mhd.utils import ModelWithMetadata
from django.db import models


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
            Returns a tuple (query, properties) of the query itself and the list
            of queried properties
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
        SELECTS = ["I.id as id"]
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

            # The fields we select
            # TODO: Support derived values here
            SELECTS.append("{}.value as {}".format(virtual_table, value_field))
            SELECTS.append("{}.id as {}".format(virtual_table, cid_field))

            # build the JOINs query
            JOINS.append("LEFT OUTER JOIN {} as {}".format(
                physical_table, virtual_table))

            JOINS.append(
                "ON I.id = {0:s}.item_id AND {0:s}.active AND {0:s}.prop_id = {1:s}".format(virtual_table, physical_prop_id))

        # add an order by clause
        if order is not None and len(order) > 0:
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

        else:
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

        # and build the sql
        return Item.objects.raw(SQL, tuple(SQL_ARGS)), list(properties)

    def semantic(self, *args, **kwargs):
        """ Same as running .query() and calling .semantic() on each returned value """

        # make the query
        qset, props = self.query(*args, **kwargs)
        return map(lambda o: o.semantic_result(self, props), qset)


class Property(ModelWithMetadata):
    """ Information about a specific property """

    class Meta:
        indexes = [
            models.Index(fields=['slug']),
        ]

    displayName = models.TextField(help_text="Display Name for this property")
    slug = models.SlugField(help_text="Identifier of this Collection")

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

class PropertyCollectionMembership(models.Model):
    class Meta:
        unique_together = [('property', 'collection')]
        indexes = [
            models.Index(fields=['property']),
            models.Index(fields=['collection']),
        ]

    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE)


__all__ = ["Collection", "Property"]
