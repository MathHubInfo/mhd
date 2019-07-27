from django.db import models

class Provenance(models.Model):
    """ The Provenance model represents provenance-data for a single cell """

    time = models.DateTimeField(auto_now_add=True, help_text="Time at which this provenance was created")
    predecessor = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, help_text="Previous provenance")

    metadata = models.TextField(null=True, blank=True, help_text="Metadata for this provenance")

__all__ = ["Provenance"]