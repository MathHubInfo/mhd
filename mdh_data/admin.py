from django.contrib import admin

from . import models

@admin.register(models.Item)
class ItemAdmin(admin.ModelAdmin):
    pass

@admin.register(models.StandardBool, models.StandardInt)
class CodecAdmin(admin.ModelAdmin):
    pass
