import json

from django.db import models, transaction

from .utils import ModelWithMetadata


class CollectionManager(models.Manager):
    @transaction.atomic
    def create_or_update_from_serializer(self, value, update = False, logger=None):
        """
            Creates or updates a new collection based on the appropriate
            serialization in value. The value is serialized as:

            {
                'collection': {
                    'displayName': string,
                    'slug': string,
                    'metadata': {} # any JSON, optional

                }
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
        # lazy import to prevent cyclic references
        from .property import Property

        # if we don't have a logger, set it to a dummy function
        if logger is None:
            logger = lambda x: None

        # Default return values
        collection = None
        created = False

        if ('collection' not in value) or ('properties' not in value):
            raise ValueError("Incomplete serialization: 'collection' and 'properties' are required. ")
        cvalue = value['collection']
        properties = value['properties']
        
        # performs a very mininmal check that required properties are provided
        if ('displayName' not in cvalue) or ('slug' not in cvalue):
            raise ValueError("Incomplete serialization: 'displayName' and 'slug'")

        # read all the collection properties
        slug = cvalue['slug']
        displayName = cvalue['displayName']
        if 'metadata' in cvalue:
            metadata = json.dumps(cvalue['metadata'])
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
                    'displayName':displayName, 'metadatastring': metadata
                }
            )
            if created:
                logger("Created collection {0:s}. ".format(slug))
            else:
                logger("Updated collection {0:s}. ".format(slug))

        # Create or update all the properties
        props = [
            Property.objects.create_property_from_serializer(p, collection, skip_existing=update, logger=logger)[0]
                for p in properties]

        # remove all other properties
        extra = collection.property_set.exclude(pk__in=[p.pk for p in props])
        logger("Disassociated {0:d} property / properties from collection. ".format(len(extra)))
        collection.property_set.remove(*extra)

        # And return the values
        return collection, created

class Collection(ModelWithMetadata):
    """ Collection of Mathmatical Items """

    objects = CollectionManager()

    displayName = models.TextField(help_text="Name of this collection")
    slug = models.SlugField(help_text="Identifier of this collection", unique=True)

    def get_property(self, slug):
        """ Returns a property of the given name """
        return self.property_set.filter(slug=slug).first()

    def __str__(self):
        return "Collection {0!r}".format(self.slug)

__all__ = ["CollectionManager", "Collection"]
