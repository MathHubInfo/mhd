from django.db import models, transaction

from .collection import Collection
from .utils import ModelWithMetadata


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


            First, a new Property() object is created and stored in the
            database with appropriate 'slug', 'displayName' and 
            'metadata' and 'codec' values. If a Property() with the given 'slug' in the provided collection
            already exists, raises unless skip_existing is set.

            If any substep fails, rolls back all operations and then raises an appropriate Exception. 

            Returns a pair (property, created). Property is the affected property. 
            When created is true, the property was newly created. When false, it was skipped. 
        """

        # if we don't have a logger, set it to a dummy function
        if logger is None:
            logger = lambda x: None

        # lazy import
        from .codec import Codec

        # performs a very mininmal check that required properties are provided
        if ('displayName' not in value) or ('slug' not in value) or ('codec' not in value):
            raise ValueError("Incomplete serialization: 'displayName', 'slug', 'codec' are required. ")

        # read all the properties
        slug = value['slug']
        displayName = value['displayName']
        if 'metadata' in value:
            metadata = json.dumps(value['metadata'])
        else:
            metadata = None
        codec = value['codec']
        
        # Make sure that the codec exists
        if Codec.find_codec(codec) is None:
            raise ValueError('Unknown codec {0:s}'.format(codec))

        # Check if the property already exists
        candidate = collection.property_set.filter(slug=slug)
        if candidate:
            if not skip_existing:
                raise ValueError('Property associated to {0:s} with slug {1:s} already exists'.format(collection.slug, slug))
            logger("Skipped creating property {0:s}: Already exists. ".format(slug))
            return candidate.first(), False
        
        # Else create the property
        prop = self.create(slug=slug, display_name=displayName, codec_table=codec)
        prop.collections.add(collection)
        prop.save()
        logger("Created property {0:s}".format(slug))
        return prop, True
        



class Property(ModelWithMetadata):
    """ Information about a specific property """

    objects = PropertyManager()

    display_name = models.TextField(help_text="Display Name for this property")
    slug = models.SlugField(help_text="Identifier of this Collection")

    codec_table = models.SlugField(help_text="Name of the codec table that stores this property ")

    @property
    def codec_model(self):
        """ Returns the Codec Model belonging to this Property or None """
        from .codec import Codec # lazy import
        
        model = Codec.find_codec(self.codec_table)
        if model is None:
            raise ValueError('Can not find Codec Table {0:r}'.format(self.codec_table))
        return model
    
    def get_column(self, collection):
        """ Returns a QuerySet of the appropriate CodecModel that represents this property within the collection """

        return self.codec_model.objects.filter(prop=self, item__collection__contains=collection)
    
    collections = models.ManyToManyField(Collection, help_text="Collection(s) this property occurs in", blank=True)

    def __str__(self):
        return "Property {0:d} ({1!r})".format(self.pk, self.slug)

__all__ = ["Property"]
