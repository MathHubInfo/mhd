from __future__ import annotations

from django.contrib import admin
from mhd.utils import AdminLink


from . import models

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import List
    from mhd_schema.models import Property
    from django.http import HttpRequest


@admin.register(models.Item)
class ItemAdmin(admin.ModelAdmin):
    def collection_size(self, obj: models.Item) -> int:
        return obj.collections.count()
    collection_size.short_description = '# of Collections'
    collection_size.admin_order_field = 'collections'

    list_display = ['id', 'collection_size']
    list_filter = ['collections']


@admin.register(*models.CodecManager.find_all_codecs())
class CodecAdmin(admin.ModelAdmin):

    @AdminLink
    def prop_link(self, obj: models.Codec) -> Property:
        return obj.prop
    prop_link.admin_order_field = 'prop__id'
    prop_link.short_description = 'Property'

    @AdminLink
    def item_link(self, obj: models.Codec) -> models.Item:
        return obj.item
    item_link.admin_order_field = 'item__id'
    item_link.short_description = 'Item'

    def get_list_display(self, request: HttpRequest) -> List[str]:
        return ['id', 'item_link', 'prop_link', *self.model.value_fields, 'active', 'superseeded_by']

    list_filter = ['active', 'prop']

    def get_search_fields(self, request: HttpRequest) -> List[str]:
        return self.model.value_fields
