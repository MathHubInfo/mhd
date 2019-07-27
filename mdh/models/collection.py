from django.db import models

from .utils import ModelWithMetadata


class Collection(ModelWithMetadata):
    """ Collection of Mathmatical Items """
    display_name = models.TextField(help_text="Name of this collection")
    slug = models.SlugField(help_text="Identifier of this collection", unique=True)

__all__ = ["Collection"]
