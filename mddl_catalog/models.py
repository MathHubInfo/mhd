from django.db import models

class CodecCatalogItem(models.Model):
    slug = models.SlugField(unique=True, null=True, blank=True, help_text="MDDL name")

    math_type = models.TextField(null=True, blank=True, help_text="MMT Term representing mathtype")
    db_type = models.TextField(null=True, blank=True, help_text="MMT Term representing dbtype")

    KIND_CHOICES = [(k, k) for k in ['Codec', 'Codec Operator', 'Import only', 'Export only']]
    kind = models.CharField(max_length=256, null=True, blank=True, choices=KIND_CHOICES, help_text="Kind of codec")


    description = models.TextField(null=True, blank=True, help_text="Human readable description")
    comment = models.TextField(null=True, blank=True, help_text="Extra comment")

    implemented = models.BooleanField(help_text="Implementation Status")
    mddl = models.BooleanField(help_text="Status in MDDL")
