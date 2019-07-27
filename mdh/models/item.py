from django.db import models

from .collection import Collection


class Item(models.Model):
    """ Any Item in Any Collection """

    collections = models.ManyToManyField(Collection, help_text="Collection(s) each item occurs in")

__all__ = ["Item"]
