from django.db import models
from mdh_data.fields.json import SmartJSONField


class ModelWithMetadata(models.Model):
    """ A mixin to add any kind of meta-data to a Model class """

    class Meta:
        abstract = True

    metadata = SmartJSONField(null=True, blank=True,
                              help_text="Metadata associated with this object")
