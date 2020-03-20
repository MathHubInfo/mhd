from __future__ import annotations

from .json import DumbJSONField
from django.core.exceptions import ValidationError

from django.db import connection

from django.contrib.postgres.fields import ArrayField

from mhd.utils import check_field_value, get_standard_serializer_field

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Optional, Any, List, Dict
    from django.db.models import Field

class DumbNDArrayField(DumbJSONField):
    """ Stores values as an n-dimensional array """

    def __init__(self, *args: Any, typ: Field=None, dim: int=1, size: Optional[int]=None, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

        self.dim = int(dim)
        self.size = size # ignored, but this might be set by some migrations
        if self.dim < 0:
            raise ValueError('dimension must be a positive integer')

        self.typ = typ
        self._field = get_standard_serializer_field(typ)

    def _validate(self, value: Any) -> bool:
        """ Checks that the value passed is indeed an n-dimensional array """

        if value is None:
            return True

        def validate_ndarray(v, dim):
            """ Checks that v is an n-dimentional array value """

            if dim == 0:
                try:
                    check_field_value(self.typ, self._field, v)
                except Exception as e:
                    raise ValidationError("Invalid value: {}: {}".format(v, e))
                return

            if not isinstance(v, list):
                raise ValidationError(
                    'expected to find an {}-dimensional array, but found an {}-dimensional array'
                    .format(self.dim, self.dim - dim))

            for vv in v:
                validate_ndarray(vv, dim - 1)

        validate_ndarray(value, self.dim)
        return True

    def deconstruct(self) -> (str, str, List[Any], Dict[str, Any]):
        name, path, args, kwargs = super().deconstruct()
        kwargs['dim'] = self.dim
        kwargs['typ'] = self.typ
        kwargs['size'] = self.size
        return name, path, args, kwargs


class PostgresNDArrayField(ArrayField):

    def __init__(self, typ: Field=None, dim: int=1, **kwargs: Any):
        self.dim = int(dim)
        if self.dim < 0:
            raise ValueError('dimension must be a positive integer')

        self.typ = typ

        base_field = typ
        for _ in range(dim - 1):
            base_field = ArrayField(base_field)

        super().__init__(base_field, **kwargs)

    def deconstruct(self) -> (str, str, List[Any], Dict[str, Any]):
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
