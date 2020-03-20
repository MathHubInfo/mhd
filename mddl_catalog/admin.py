from __future__ import annotations

from django.contrib import admin

from .models import CodecCatalogItem

@admin.register(CodecCatalogItem)
class CodecAdmin(admin.ModelAdmin):
    list_display = (
        'slug', 'math_type', 'db_type', 'kind', 'implemented', 'mddl',
    )

    list_filter = (
        'kind', 'implemented', 'mddl', 'math_type', 'db_type',
    )

    search_fields = (
        'slug', 'math_type', 'db_type', 'kind', 'description', 'comment',
    )
