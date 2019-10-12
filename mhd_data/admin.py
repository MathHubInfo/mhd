from django.contrib import admin
from mhd.utils import AdminLink


from . import models


@admin.register(models.Item)
class ItemAdmin(admin.ModelAdmin):
    def collection_size(self, obj):
        return obj.collections.count()
    collection_size.short_description = '# of Collections'
    collection_size.admin_order_field = 'collections'

    list_display = ['id', 'collection_size']
    list_filter = ['collections']


@admin.register(*models.CodecManager.find_all_codecs())
class CodecAdmin(admin.ModelAdmin):

    @AdminLink
    def prop_link(self, obj):
        return obj.prop
    prop_link.admin_order_field = 'prop__id'
    prop_link.short_description = 'Property'

    @AdminLink
    def item_link(self, obj):
        return obj.item
    item_link.admin_order_field = 'item__id'
    item_link.short_description = 'Item'

    list_display = ['id', 'item_link', 'prop_link',
                    'value', 'active', 'superseeded_by']
    list_filter = ['active', 'prop']
    search_fields = ['value']
