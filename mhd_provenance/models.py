from django.db import models

from mhd.utils import ModelWithMetadata


class Provenance(ModelWithMetadata):
    """ The Provenance model represents provenance-data for a single cell """

    time = models.DateTimeField(auto_now_add=True, help_text="Time at which this provenance was created")
    predecessor = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, help_text="Previous provenance")
