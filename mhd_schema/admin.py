from __future__ import annotations

from django.contrib import admin

from . import models


class PropertyInline(admin.TabularInline):
    model = models.Property.collections.through
    extra = 1


class PreFilterInline(admin.TabularInline):
    model = models.PreFilter
    extra = 1


class CollectionInline(admin.TabularInline):
    model = models.Collection.property_set.through
    extra = 1


@admin.register(models.Collection)
class CollectionAdmin(admin.ModelAdmin):
    def prop_size(self, obj: models.Collection) -> int:
        return obj.property_set.count()

    prop_size.short_description = "# of Properties"
    prop_size.admin_order_field = "property"

    list_display = ["displayName", "hidden", "slug", "prop_size", "viewName"]
    search_fields = ["displayName", "slug"]

    inlines = [PropertyInline, PreFilterInline]


@admin.register(models.Exporter)
class ExporterAdmin(admin.ModelAdmin):
    list_display = ["slug"]
    search_fields = ["slug"]


@admin.register(models.Property)
class PropertyAdmin(admin.ModelAdmin):
    exclude = ["collections"]

    def collection_size(self, obj: models.Property) -> int:
        return obj.collections.count()

    collection_size.short_description = "# of Collections"
    collection_size.admin_order_field = "collections"

    list_display = ["displayName", "slug", "default", "collection_size"]
    list_filter = ["collections"]
    search_fields = ["displayName", "slug"]

    inlines = [
        CollectionInline,
    ]
