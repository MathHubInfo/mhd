import json
from django.db import models

class ModelWithMetadata(models.Model):
    """ A mixin to add any kind of meta-data to a Model class """

    class Meta:
        abstract = True

    metadatastring = models.TextField(null=True, blank=True, help_text="Metadata associated to this object")

    @property
    def metadata(self):
        """ Metadata of this object """
        return json.loads(self.metadatastring)
    
    @metadata.setter
    def metadata(self, value):
        """ Sets metadata of this object """
        self.metadatastring = json.dumps(value)
