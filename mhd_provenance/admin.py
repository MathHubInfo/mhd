from __future__ import annotations

from django.contrib import admin

from .models import Provenance


@admin.register(Provenance)
class ProvenanceAdmin(admin.ModelAdmin):
    pass
