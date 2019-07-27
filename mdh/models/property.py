from django.db import models

from .collection import Collection
from .utils import ModelWithMetadata


class Property(ModelWithMetadata):
    """ Information about a specific property """

    display_name = models.TextField(help_text="Display Name for this property")
    slug = models.TextField(help_text="Identifier of this Collection")

    codec_table = models.SlugField(help_text="Name of the codec table that stores this property ")

    @property
    def codec_model(self):
        """ Returns the Codec Model belonging to this Property or None """
        from .codec import Codec # lazy import
        
        model = Codec.find_codec(self.codec_table)
        if model is None:
            raise ValueError('Can not find Codec Table {0:r}'.format(self.codec_table))
        return model
    
    collection = models.ManyToManyField(Collection, help_text="Collection(s) this property occurs in")

__all__ = ["Property"]
