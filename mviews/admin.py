from django.contrib import admin

from .models import View


# Register your models here.
@admin.register(View)
class ViewAdmin(admin.ModelAdmin):
    list_display = ("name", "sql", "materialized", "paramsJSON")
