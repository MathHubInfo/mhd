from __future__ import annotations

from django.apps import apps
from django.db import models, connection

from mhd_provenance.models import Provenance
from mhd_schema.models import Property
from mhd.utils import uuid4, memoized_method

from .item import Item

from functools import lru_cache

from mhd.utils import get_standard_serializer_field

from typing import TYPE_CHECKING, TypeAlias, Iterable, Type, Optional, Any, List

if TYPE_CHECKING:
    from django.db.models import Field
    from rest_framework.serializers import Field as SerializerField

    from uuid import UUID

    SQL: TypeAlias = str
    # an sql query with parameters
    SQLWithParams: TypeAlias = tuple[SQL, list[int | str]]


class CodecManager(models.Manager):

    @staticmethod
    @lru_cache(maxsize=None)
    def find_all_codecs() -> Iterable[Type[Codec]]:
        """ Returns a tuple of all known codecs """

        # we return a tuple here, because those are not mutable
        # and can hence be safely returned by lru_cache()
        return tuple(filter(lambda clz: issubclass(clz, Codec), apps.get_models()))

    @staticmethod
    def collect_operators(codecs: Optional[Iterable[Type[Codec]]] = None) -> Iterable[str]:
        """ Returns a set containing all know operators """

        if codecs is None:
            codecs = CodecManager.find_all_codecs()

        ops: set[str] = set()
        for codec in codecs:
            ops.update(codec.operators)

        return ops

    @staticmethod
    @lru_cache(maxsize=None)
    def find_codec(name: str) -> Optional[Type[Codec]]:
        """ Finds a Codec By Name """

        # And find a codec with that name
        for c in CodecManager.find_all_codecs():
            if c.get_codec_name() == name:
                return c

        return None


class Codec(models.Model):
    """ An abstract class for each codec """
    class Meta:
        abstract = True
        unique_together = (('item', 'prop', 'superseeded_by'))
        indexes = [
            models.Index(fields=['item']),
            models.Index(fields=['prop']),
            models.Index(fields=['active'])
        ]

    objects: CodecManager = CodecManager()

    @classmethod
    @memoized_method(maxsize=None)
    def get_codec_name(cls) -> str:
        """ Gets the name of this codec """
        return cls.__name__

    # Name of database fields containing the values
    value_fields = ['value']

    @classmethod
    def get_value_fields(cls) -> List[Field]:
        """ gets the value field of this model """
        return [cls._meta.get_field(n) for n in cls.value_fields]

    # A DRF serializer field (if any) corresponding to the value object
    # may be omitted iff 'value' can be directly serialized from / to json
    # (e.g. when using integers)
    _serializer_fields: Optional[List[SerializerField]] = None

    @classmethod
    def get_serializer_fields(cls) -> SerializerField:
        """ Gets the serializer field of a class """

        # if the user defined one, return it
        if cls._serializer_fields is not None:
            return cls._serializer_fields

        cls._serializer_fields = [
            get_standard_serializer_field(f) for f in cls.get_value_fields()
        ]
        return cls._serializer_fields

    @classmethod
    def populate_values(cls: Type[Codec], *values: List[Optional[Any]]) -> List[Any]:
        """
            Called to turn a serialized value (usually from the importer)
            into a python object to be assigned to a property.
        """

        sfields = cls.get_serializer_fields()

        return [
            None if (value is None) else sfield.to_internal_value(value)
            for (value, sfield) in zip(values, sfields)
        ]

    @classmethod
    def serialize_values(cls: Type[Codec], *values: List[Any], database: bool = True) -> List[Any]:
        """
            Called by the data serializer to turn a database or python
            value of this codec into a json-serialized value of this codec.
        """

        vfields = cls.get_value_fields()
        sfields = cls.get_serializer_fields()
        results = [None] * len(vfields)

        print(cls, "values", values)

        for (i, (vfield, sfield, value)) in enumerate(zip(vfields, sfields, values)):
            if value is None:
                continue

            # if the value field has a 'from_db_value' we should call it first
            # because our value was not yet parsed
            if database and hasattr(vfield, 'from_db_value'):
                value = vfield.from_db_value(
                    value, None, connection=connection)

            # call the default serializer field with .to_representation
            results[i] = sfield.to_representation(value)

        return results

    @classmethod
    def serialize_value(cls: Type[Codec], value: List[Any], database: bool = True) -> Any:
        if len(cls.get_value_fields()) != 1:
            raise Exception(
                'cannot call serialize_value: more than one value field')

        return cls.serialize_values(value, database=database)[0]

    # A list of supported operators
    operators: Iterable[str] = ()

    # if not None, the query builder will enforce that the operand is of this class
    # using the method is_valid_operand below
    operator_type: Optional[Type[object]] = None

    @classmethod
    def is_valid_operand(cls: Type[Codec], literal: Any) -> bool:
        """ Checks if the provided literal is a valid argument to operator (left || right) on """
        if cls.operator_type is None:
            return True
        return isinstance(literal, cls.operator_type)

    # Next, the implementation of operating on codec values. There are three supported
    # kind of operations, operating with a literal (constant) on the left, the right and
    # comparing two different properties of the same codec.
    # These are implemented by the functions operate_left, operate_right, operate_both
    # below. The functions return a pair of (sql_string, args) as would be passed to
    # a .raw() query.
    #
    # By default, operators map directly to sql operators.
    # Note that the implementation is sql-injection safe, as only operators set in
    # the 'operators' property are passed to this function and column names are not
    # user controlled.

    @classmethod
    def operate_left(cls: Type[Codec], literal: Any, operator: str, db_column: str) -> SQLWithParams:
        """ Implements literal <operator> db_column """

        return "%s {} {}".format(operator, db_column), [cls.serialize_value(literal)]

    @classmethod
    def operate_right(cls: Type[Codec], db_column: str, operator: str, literal: Any) -> SQLWithParams:
        """ Implements db_column <operator> literal """

        return "{} {} %s".format(db_column, operator), [cls.serialize_value(literal)]

    @classmethod
    def operate_both(cls: Type[Codec], db_column1: str, operator: str, db_column2: str) -> SQLWithParams:
        """ Implements db_column1 <operator> db_column2 """

        return "{} {} {}".format(db_column1, operator, db_column2), []

    id: UUID = models.UUIDField(
        primary_key=True, default=uuid4, editable=False)

    item: Item = models.ForeignKey(
        Item, on_delete=models.CASCADE, help_text="Item this this cell represents")
    prop: Property = models.ForeignKey(
        Property, on_delete=models.CASCADE, help_text="Property this cell represents")

    provenance: Provenance = models.ForeignKey(
        Provenance, on_delete=models.CASCADE, help_text="Provenance of this cell")

    active: bool = models.BooleanField(
        default=True, help_text="Is this item active")
    superseeded_by: Optional[Codec] = models.ForeignKey('self', on_delete=models.SET_NULL,
                                                        null=True, blank=True, help_text="Cell this value is superseeded by")


__all__ = ["Codec", "CodecManager"]
