from django.db import models
from django.core.exceptions import ValidationError
import json

class DumbJSONField(models.TextField):
    """ A dumb JSONField that stores it's value as encoded text"""

    def __init__(self, *args, **kwargs):
        if 'default' in kwargs and kwargs['default'] is not None:
            kwargs['default'] = DumbJSONField._dump_json(default)

        super().__init__(*args, **kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        if 'default' in kwargs and kwargs['default'] is not None:
            kwargs['default'] = DumbJSONField._load_json(kwargs['default'])

        return name, path, args, kwargs

    ##
    ## Save conversions
    ##
    @staticmethod
    def _load_json(value):
        try:
            return json.loads(value)
        except Exception as e:
            raise ValidationError(str(e))

    @staticmethod
    def _dump_json(value):
        try:
            return json.dumps(value)
        except Exception as e:
            raise ValidationError(str(e))

    ##
    ## Converting to database values
    ##

    def get_prep_value(self, value):
        value = super().get_prep_value(value)

        if value is None:
            return None

        return DumbJSONField._dump_json(value)

    def get_db_prep_value(self, value, connection, prepared=False):

        if value is not None:
            value = DumbJSONField._dump_json(value)

        return super().get_db_prep_value(value, connection, prepared=prepared)


    ##
    ## Converting to Python Values
    ##

    def from_db_value(self, value, expression, connection):
        if value is None:
            return value

        return DumbJSONField._load_json(value)

    def to_python(self, value):
        value = super().to_python(value)
        if value is None:
            return None

        return DumbJSONField._load_json(value)

from django.db import connection
if connection.vendor == 'postgresql':
    from django.contrib.postgres.fields import JSONField
    class SmartJSONField(JSONField):
        """ posgres-aware version of a JSONField """
        pass
else:
    class SmartJSONField(DumbJSONField):
        """ non-postgres-aware version of a JSONField """
        pass

__all__ = ['DumbJSONField', 'SmartJSONField']
