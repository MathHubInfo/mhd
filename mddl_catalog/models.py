from __future__ import annotations

from django.db import models

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Optional

class CodecCatalogItem(models.Model):
    slug: Optional[str] = models.SlugField(unique=True, null=True, blank=True, help_text="MDDL name")

    math_type: Optional[str] = models.TextField(null=True, blank=True, help_text="MMT Term representing mathtype")
    db_type = models.TextField(null=True, blank=True, help_text="MMT Term representing dbtype")

    KIND_CHOICES = [(k, k) for k in ['Codec', 'Codec Operator', 'Import only', 'Export only']]
    kind: Optional[str] = models.CharField(max_length=256, null=True, blank=True, choices=KIND_CHOICES, help_text="Kind of codec")

    description: Optional[str] = models.TextField(null=True, blank=True, help_text="Human readable description")
    comment: Optional[str] = models.TextField(null=True, blank=True, help_text="Extra comment")

    implemented: bool = models.BooleanField(help_text="Implementation Status")
    mddl: bool = models.BooleanField(help_text="Status in MDDL")
