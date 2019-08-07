from django.contrib import admin

from . import models


class PropertyInline(admin.TabularInline):
    model = models.Property.collections.through
    extra = 1


class CollectionInline(admin.TabularInline):
    model = models.Collection.property_set.through
    extra = 1


@admin.register(models.Collection)
class CollectionAdmin(admin.ModelAdmin):
    def prop_size(self, obj):
        return obj.property_set.count()
    prop_size.short_description = '# of Properties'
    prop_size.admin_order_field = 'property'

    list_display = ['displayName', 'slug', 'prop_size']
    search_fields = ['displayName', 'slug']

    inlines = [
        PropertyInline,
    ]


@admin.register(models.Property)
class PropertyAdmin(admin.ModelAdmin):
    exclude = ['collections']

    def collection_size(self, obj):
        return obj.collections.count()
    collection_size.short_description = '# of Collections'
    collection_size.admin_order_field = 'collections'

    list_display = ['displayName', 'slug', 'collection_size']
    list_filter = ['collections']
    search_fields = ['displayName', 'slug']

    inlines = [
        CollectionInline,
    ]
