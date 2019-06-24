from django.contrib import admin

from . import models

@admin.register(models.Collection)
class CollectionAdmin(admin.ModelAdmin):
    pass

@admin.register(models.Item)
class ItemAdmin(admin.ModelAdmin):
    pass

@admin.register(models.Property)
class PropertyAdmin(admin.ModelAdmin):
    pass

@admin.register(models.Provenance)
class ProvenanceAdmin(admin.ModelAdmin):
    pass

class CodecAdmin(admin.ModelAdmin):
    pass

@admin.register(models.IntegerCodec)
class IntegerCodec(CodecAdmin):
    pass