import json

from django.db import models, transaction

from mdh.utils import ModelWithMetadata


class CollectionManager(models.Manager):
    @transaction.atomic
    def create_or_update_from_serializer(self, value, update=False, logger=None):
        """
            Creates or updates a new collection based on the appropriate
            serialization in value. The value is serialized as:

            {
                'displayName': string,
                'slug': string,
                'metadata': {}, # any JSON, optional
                'properties': property[] # property serialization, see the Property model
            }

            First, a new Collection() object is created and stored in the
            database with appropriate 'slug', 'displayName' and
            'metadata' values. If a collection with the same slug already
            exists, and update is set to False, an Exception is raised. If
            update is set to True, instead of creating a new collection,
            the old one is reused.

            Next, for each property
                Property.objects.create_or_update_property_from_serializer(property, skip_existing=update, logger=logger)
            is called. Furthermore, if any other properties are still associated with the collection, their association is removed.

            Takes an optional logger argument which, if set, is called with informational messages.

            If any substep fails, rolls back all operations and then raises an appropriate Exception.

            Returns a pair (collection, created). Collection is the new or update collection.
            When created is true, the collection was newly created. When false, it was updated.
        """

        # if we don't have a logger, set it to a dummy function
        if logger is None:
            def logger(x): return None

        # Default return values
        collection = None
        created = False

        if ('properties' not in value) or ('displayName' not in value) or ('slug' not in value):
            raise ValueError(
                "Incomplete serialization: 'properties', 'displayName', 'slug' are required. ")

        properties = value['properties']
        slug = value['slug']
        displayName = value['displayName']
        if 'metadata' in value:
            metadata = json.dumps(value['metadata'])
        else:
            metadata = None

        # If we don't have the update flag set, simply create a new object
        if not update:
            collection = self.create(
                slug=slug, displayName=displayName, metadatastring=metadata
            )
            logger("Created collection {0:s}".format(slug))
            created = True
        # Else create or update it
        else:
            collection, created = self.update_or_create(
                slug=slug,
                defaults={
                    'displayName': displayName, 'metadatastring': metadata
                }
            )
            if created:
                logger("Created collection {0:s}. ".format(slug))
            else:
                logger("Updated collection {0:s}. ".format(slug))

        # Create or update all the properties
        props = [
            Property.objects.create_property_from_serializer(
                p, collection, skip_existing=update, logger=logger)[0]
            for p in properties]

        # remove all other properties
        extra = collection.property_set.exclude(pk__in=[p.pk for p in props])
        logger(
            "Disassociated {0:d} property / properties from collection. ".format(len(extra)))
        collection.property_set.remove(*extra)

        # And return the values
        return collection, created


class Collection(ModelWithMetadata):
    """ Collection of Mathmatical Items """

    objects = CollectionManager()

    displayName = models.TextField(help_text="Name of this collection")
    slug = models.SlugField(
        help_text="Identifier of this collection", unique=True)

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

    def query(self, properties=None, filter=None, limit=None, offset=None, order=True):
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
        from mdh_data.models import Item
        from mdh_data.querybuilder import QueryBuilder

        # The queries built by this module look as following:
        #
        # SELECT I.id as id,
        #
        # T_prop1.value as prop1_value, T_prop1.id as prop1_cid,
        # T_prop2.value as prop2_value, T_prop2.id as prop2_cid
        #
        # FROM mdh_data_item as I
        #
        # LEFT OUTER JOIN Codec1 as T_prop1
        # ON I.id == T_prop1.item_id AND T_prop1.active AND T_prop1.prop_id == ${id_of_prop1}
        #
        # LEFT OUTER JOIN Codec2 as T_prop2
        # ON I.id == T_prop2.item_id AND T_prop2.active AND T_prop2.prop_id == ${id_of_prop2};

        # if no properties are given use all of them
        if properties is None:
            properties = self.property_set.all()

        PROPERTIES = []
        SELECTS = ["I.id as id"]
        JOINS = ["FROM {} as I".format(Item._meta.db_table)]
        SUFFIXES = []

        for prop in properties:
            # the physical table to look up the values in
            physical_table = prop.codec_model._meta.db_table
            physical_prop_id = str(prop.pk)

            # alias for the appropriate property table
            virtual_table = 'T_{}'.format(prop.slug)

            # alias for the value field
            value_field = 'property_value_{}'.format(prop.slug)
            # alias for the cid field
            cid_field = 'property_cid_{}'.format(prop.slug)

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
                "ON I.id == {0:s}.item_id AND {0:s}.active AND {0:s}.prop_id == {1:s}".format(virtual_table, physical_prop_id))

        # add an order by clause
        if order:
            # TODO: Allow ordering by an abitrary property
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
        return map(lambda o: o.semantic(self, props), qset)


class PropertyManager(models.Manager):
    @transaction.atomic
    def create_property_from_serializer(self,  value, collection, skip_existing=False, logger=None):
        """
            Creates a (collection-associated) property based on the appropriate
            serialization in value. The value is serialized as:

            {
                'displayName': string,
                'slug': string,
                'metadata': {} # any JSON, optional
                'codec': string
            }


            First, a new Property() object is created and stored in the database
            with appropriate 'slug', 'displayName' and 'metadata' and 'codec'
            values. If a Property() with the given 'slug' in the provided
            collection already exists, raises unless skip_existing is set.

            If any substep fails, rolls back all operations and then raises
            an appropriate Exception.

            Returns a pair (property, created). Property is the affected
            property. When created is true, the property was newly created. When
            false, it was skipped.
        """

        # if we don't have a logger, set it to a dummy function
        if logger is None:
            def logger(x): return None

        # lazy import
        from mdh_data.models import CodecManager

        # performs a very mininmal check that required properties are provided
        if ('displayName' not in value) or ('slug' not in value) or ('codec' not in value):
            raise ValueError(
                "Incomplete serialization: 'displayName', 'slug', 'codec' are required. ")

        # read all the properties
        slug = value['slug']
        displayName = value['displayName']
        if 'metadata' in value:
            metadata = json.dumps(value['metadata'])
        else:
            metadata = None
        codec = value['codec']

        # Make sure that the codec exists
        if CodecManager.find_codec(codec) is None:
            raise ValueError('Unknown codec {0:s}'.format(codec))

        # Check if the property already exists
        candidate = collection.property_set.filter(slug=slug)
        if candidate:
            if not skip_existing:
                raise ValueError('Property associated to {0:s} with slug {1:s} already exists'.format(
                    collection.slug, slug))
            logger(
                "Skipped creating property {0:s}: Already exists. ".format(slug))
            return candidate.first(), False

        # Else create the property
        prop = self.create(slug=slug, displayName=displayName,
                           codec=codec, metadatastring=metadata)
        prop.collections.add(collection)
        prop.save()
        logger("Created property {0:s}".format(slug))
        return prop, True


class Property(ModelWithMetadata):
    """ Information about a specific property """

    objects = PropertyManager()

    displayName = models.TextField(help_text="Display Name for this property")
    slug = models.SlugField(help_text="Identifier of this Collection")

    codec = models.SlugField(
        help_text="Name of the codec table that stores this property ")

    @property
    def codec_model(self):
        """ Returns the Codec Model belonging to this Property or None """
        from mdh_data.models import CodecManager

        model = CodecManager.find_codec(self.codec)
        if model is None:
            raise ValueError(
                'Can not find Codec Table {0:r}'.format(self.codec))
        return model

    def get_column(self, collection):
        """ Returns a QuerySet of the appropriate CodecModel that represents this property within the collection """

        return self.codec_model.objects.filter(prop=self, item__collections=collection)

    def get_column_annotations(self, collection, attributes=None):
        """ Returns a list of expressions that can be used as an item annotation for this property """

        if attributes is None:
            attributes = ['value']

        return {
            'property_{}_{}'.format(self.slug, a):
                models.Subquery(self.codec_model.objects.filter(
                    active=True, prop=self, item__pk=models.OuterRef('pk')).values(a))
            for a in attributes
        }

    collections = models.ManyToManyField(
        Collection, help_text="Collection(s) this property occurs in", blank=True)

    def __str__(self):
        return "Property {0:d} ({1!r})".format(self.pk, self.slug)


__all__ = ["Collection", "Property"]
