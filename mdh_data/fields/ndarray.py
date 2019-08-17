from .json import DumbJSONField
from django.core.exceptions import ValidationError

from django.db import connection

from django.contrib.postgres.fields import ArrayField

class DumbNDArrayField(DumbJSONField):
    """ Stores values as an n-dimensional array """

    def __init__(self, *args, typ=None, dim=1, **kwargs):
        super().__init__(*args, **kwargs)

        self.dim = int(dim)
        if self.dim < 0:
            raise ValueError('dimension must be a positive integer')

        self.typ = typ

    def _validate(self, value):
        """ Checks that the value passed is indeed an n-dimensional array """

        if value is None:
            return True

        def validate_ndarray(v, dim):
            """ Checks that v is an n-dimentional array value """

            if dim == 0:
                try:
                    self.typ.get_prep_value(v)
                except Exception as e:
                    raise ValidationError(e)
                return

            if not isinstance(v, list):
                raise ValidationError(
                    'expected to find an n-dimensional array')

            for vv in v:
                validate_ndarray(vv, dim - 1)

        validate_ndarray(value, self.dim)
        return True

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        kwargs['dim'] = self.dim
        kwargs['typ'] = self.typ
        return name, path, args, kwargs

class PostgresNDArrayField(ArrayField):

    def __init__(self, typ=None, dim=1, **kwargs):
        self.dim = int(dim)
        if self.dim < 0:
            raise ValueError('dimension must be a positive integer')

        self.typ = typ

        base_field = typ
        for _ in range(dim - 1):
            base_field = ArrayField(base_field)

        super().__init__(base_field, **kwargs)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        kwargs.pop('base_field')
        kwargs['dim'] = self.dim
        kwargs['typ'] = self.typ
        return name, path, args[1:], kwargs

if connection.vendor == 'postgresql':
    class SmartNDArrayField(PostgresNDArrayField):
        """ posgres-aware version of a NDArrayField """
        using_postgres = True
else:
    class SmartNDArrayField(DumbNDArrayField):
        """ non-postgres-aware version of a NDArrayField """
        using_postgres = False

__all__ = ['DumbNDArrayField', 'PostgresNDArrayField', 'SmartNDArrayField']
