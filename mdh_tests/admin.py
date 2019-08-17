from django.contrib import admin

from . import models

@admin.register(models.DumbJSONFieldModel, models.SmartJSONFieldModel)
class TestAdmin(admin.ModelAdmin):
    pass
