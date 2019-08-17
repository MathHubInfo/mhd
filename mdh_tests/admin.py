from django.contrib import admin

from . import models

@admin.register(
    models.DumbJSONFieldModel, models.SmartJSONFieldModel,
    models.DumbNDArrayOneModel, models.SmartNDArrayOneModel,
    models.DumbNDArrayTwoModel, models.SmartNDArrayTwoModel,
)
class TestAdmin(admin.ModelAdmin):
    pass
