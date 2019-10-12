from django.db import models
from mdh_data.fields.json import DumbJSONField, SmartJSONField
from mdh_data.fields.ndarray import DumbNDArrayField, SmartNDArrayField


class DumbJSONFieldModel(models.Model):
    """ Model used for DumbJSONField testing """
    data = DumbJSONField(null = True)

class SmartJSONFieldModel(models.Model):
    """ Model used for SmartJSONField testing """
    data = SmartJSONField(null = True)

class DumbNDArrayOneModel(models.Model):
    """ Model used for one-dimensional DumbNDArrayField testing """

    data = DumbNDArrayField(typ = models.IntegerField(), dim = 1)

class SmartNDArrayOneModel(models.Model):
    """ Model used for one-dimensional SmartNDArrayField testing """

    data = SmartNDArrayField(typ = models.IntegerField(), dim = 1)

class DumbNDArrayTwoModel(models.Model):
    """ Model used for two-dimensional DumbNDArrayField testing """

    data = DumbNDArrayField(typ = models.IntegerField(), dim = 2)

class SmartNDArrayTwoModel(models.Model):
    """ Model used for two-dimensional SmartNDArrayField testing """

    data = SmartNDArrayField(typ = models.IntegerField(), dim = 2)
