from django.db import models

class Collection(models.Model):
    """ Collection of Mathmatical Items """
    display_name = models.TextField(help_text="Name of this collection")
    slug = models.SlugField(help_text="Identifier of this collection", unique=True)

    metadata = models.TextField(null=True, blank=True, help_text="Metadata for this collection")

class Item(models.Model):
    """ Any Item in Any Collection """

    collections = models.ManyToManyField(Collection, help_text="Collection(s) each item occurs in")

class Property(models.Model):
    """ Information about a specific property """

    display_name = models.TextField(help_text="Display Name for this property")
    slug = models.TextField(help_text="Identifier of this Collection")

    metadata = models.TextField(null=True, blank=True, help_text="Metadata for this property")

    codec_table = models.SlugField(help_text="Name of the codec table that stores this property ")
    collection = models.ManyToManyField(Collection, help_text="Collection(s) this property occurs in")

class Provenance(models.Model):
    """ The Provenance model represents provenance-data for a single cell """

    time = models.DateTimeField(auto_now_add=True, help_text="Time at which this provenance was created")
    predecessor = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, help_text="Previous provenance")

    metadata = models.TextField(null=True, blank=True, help_text="Metadata for this provenance")

class Codec(models.Model):
    """ An abstract class for each codec """
    class Meta:
        abstract = True
        unique_together = [['item', 'prop', 'superseeded_by']]
    
    @classmethod
    def get_codec_name(cls):
        """ Gets the name of this codec """
        return cls.objects.model._meta.db_table
    
    value = None

    item = models.ForeignKey(Item, on_delete=models.CASCADE, help_text="Item this this cell represents")
    prop = models.ForeignKey(Property, on_delete=models.CASCADE, help_text="Property this cell represents")

    provenance = models.ForeignKey(Provenance, on_delete=models.CASCADE, help_text="Provenance of this cell")

    active = models.BooleanField(default=True, help_text="Is this item active")
    superseeded_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, help_text="Cell this value is superseeded by")


### Individual code classec below this point

class IntegerCodec(Codec):
    """ A Table for the integer codec """

    value = models.IntegerField()