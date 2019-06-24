from django.contrib import admin

# Register your models here.
from .magic import get_all_generated_models

for model in get_all_generated_models():
    admin.site.register(model)