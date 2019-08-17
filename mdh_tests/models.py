from django.db import models
from mdh_data.fields.json import DumbJSONField, SmartJSONField


class DumbJSONFieldModel(models.Model):
    """ Model used for DumbJSONField testing """
    data = DumbJSONField(null = True)

class SmartJSONFieldModel(models.Model):
    """ Model used for SmartJSONField testing """
    data = SmartJSONField(null = True)
