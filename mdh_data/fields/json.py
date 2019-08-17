from django.db import connection
from django.db import models
from django.core.exceptions import ValidationError
import json


class DumbJSONField(models.TextField):
    """ A dumb JSONField that stores it's value as encoded text"""

    def __init__(self, *args, **kwargs):
        # default is blank = True, to allow empty inputs
        if 'blank' not in kwargs:
            kwargs['blank'] = True
            self._has_blank = False
        else:
            self._has_blank = True

        if 'default' in kwargs and kwargs['default'] is not None:
            kwargs['default'] = self._dump_json(default)

        super().__init__(*args, **kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        if 'default' in kwargs and kwargs['default'] is not None:
            kwargs['default'] = self._load_json(kwargs['default'])

        # remove the blank kwarg when it didn't exist beforehand
        if not self._has_blank:
            kwargs.pop('blank')

        return name, path, args, kwargs

    ##
    # Save conversions
    ##
    def _load_json(self, value):
        try:
            return json.loads(value)
        except Exception as e:
            raise ValidationError(str(e))

    def _dump_json(self, value):
        self._validate(value)
        try:
            return json.dumps(value)
        except Exception as e:
            raise ValidationError(str(e))

    def _validate(self, value):
        """ Called before storing this field """
        return True

    ##
    # Converting to database values
    ##

    def get_prep_value(self, value):
        value = super().get_prep_value(value)

        if value is None:
            return None

        return self._dump_json(value)

    def get_db_prep_value(self, value, connection, prepared=False):

        if value is not None:
            value = self._dump_json(value)

        return super().get_db_prep_value(value, connection, prepared=prepared)

    ##
    # Converting to Python Values
    ##

    def from_db_value(self, value, expression, connection):
        if value is None:
            return value

        return self._load_json(value)

    def to_python(self, value):
        value = super().to_python(value)
        if value is None:
            return None

        return self._load_json(value)


if connection.vendor == 'postgresql':
    from django.contrib.postgres.fields import JSONField

    class SmartJSONField(JSONField):
        """ posgres-aware version of a JSONField """
        using_postgres = True
else:
    class SmartJSONField(DumbJSONField):
        """ non-postgres-aware version of a JSONField """
        using_postgres = False

__all__ = ['DumbJSONField', 'SmartJSONField']
