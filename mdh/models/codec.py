from django.apps import apps
from django.db import models

from .item import Item
from .property import Property
from .provenance import Provenance

class Codec(models.Model):
    """ An abstract class for each codec """
    class Meta:
        abstract = True
        unique_together = [['item', 'prop', 'superseeded_by']]
    
    @staticmethod
    def find_all_codecs():
        """ Returns a list of all Codec Models """
        
        return filter(lambda clz: issubclass(clz, Codec), apps.get_models())
    
    @staticmethod
    def find_codec(name):
        """ Finds a Codec By Name """

        # Normalize the name
        name = normalize_codec_name(name)

        # And find a codec with that name
        for c in get_codecs():
            if c.get_codec_name() == name:
                return c

        return None

    @classmethod
    def get_codec_name(cls):
        """ Gets the name of this codec """

        return normalize_codec_name(cls.objects.model._meta.db_table)
    
    value = None

    item = models.ForeignKey(Item, on_delete=models.CASCADE, help_text="Item this this cell represents")
    prop = models.ForeignKey(Property, on_delete=models.CASCADE, help_text="Property this cell represents")

    provenance = models.ForeignKey(Provenance, on_delete=models.CASCADE, help_text="Provenance of this cell")

    active = models.BooleanField(default=True, help_text="Is this item active")
    superseeded_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, help_text="Cell this value is superseeded by")

def normalize_codec_name(name):
    """ Normalizes the name of a codec """
    
    # take only characters after '_'
    if "_" in name:
        name = name.split("_", 1)[1]
    
    # turn the name into lower case
    return name.lower()
    

__all__ = ["Codec"]