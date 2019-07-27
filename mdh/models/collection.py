from django.db import models

class Collection(models.Model):
    """ Collection of Mathmatical Items """
    display_name = models.TextField(help_text="Name of this collection")
    slug = models.SlugField(help_text="Identifier of this collection", unique=True)

    metadata = models.TextField(null=True, blank=True, help_text="Metadata for this collection")

__all__ = ["Collection"]