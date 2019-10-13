from django.apps import apps
from django.db import models, connection

from mhd_provenance.models import Provenance
from mhd_schema.models import Property
from mhd.utils import uuid4, memoized_method

from .item import Item

from functools import lru_cache

from mhd.utils import get_standard_serializer_field


class CodecManager(models.Manager):

    @staticmethod
    @lru_cache(maxsize=None)
    def find_all_codecs():
        """ Returns a tuple of all known codecs """

        # we return a tuple here, because those are not mutable
        # and can hence be safely returned by lru_cache()
        return tuple(filter(lambda clz: issubclass(clz, Codec), apps.get_models()))

    @staticmethod
    def collect_operators(codecs=None):
        """ Returns a set containing all know operators """

        if codecs is None:
            codecs = CodecManager.find_all_codecs()

        ops = set()
        for codec in codecs:
            ops.update(codec.operators)

        return ops

    @staticmethod
    @lru_cache(maxsize=None)
    def find_codec(name):
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

    objects = CodecManager()

    @classmethod
    @memoized_method(maxsize=None)
    def get_codec_name(cls):
        """ Gets the name of this codec """
        return cls.__name__

    # A database field containing the value, overwritten by subclass
    value = None

    @classmethod
    def get_value_field(cls):
        """ gets the value field of this model """
        return cls._meta.get_field('value')

    # A DRF serializer field (if any) corresponding to the value object
    # may be omitted iff 'value' can be directly serialized from / to json
    # (e.g. when using integers)
    _serializer_field = None

    @classmethod
    def get_serializer_field(cls):
        """ Gets the serializer field of a class """

        # if the user defined one, return it
        if cls._serializer_field is not None:
            return cls._serializer_field

        cls._serializer_field = get_standard_serializer_field(cls._meta.get_field('value'))
        return cls._serializer_field

    @classmethod
    def populate_value(cls, value):
        """
            Called to turn a serialized value (usually from the importer)
            into a python object to be assigned to a property.
        """

        if value is None:
            return None

        return cls.get_serializer_field().to_internal_value(value)

    @classmethod
    def populate_db_value(cls, value):
        """
            Called to turn a python value of this codec into a raw
            database object to be used by the annotator.
        """

        valuefield = cls._meta.get_field('value')
        return valuefield.get_prep_value(value)

    @classmethod
    def serialize_value(cls, value, database = True):
        """
            Called by the data serializer to turn a database or python
            value of this codec into a json-serialized value of this codec.
        """

        if value is None:
            return None

        # if the value field has a 'from_db_value' we should call it first
        # because our value was not yet parsed
        vfield = cls._meta.get_field('value')
        if database and hasattr(vfield, 'from_db_value'):
            value = vfield.from_db_value(value, None, connection=connection)

        # call the default serializer field with .to_representation
        return cls.get_serializer_field().to_representation(value)

    # A list of supported operators
    operators = ()

    # if not None, the query builder will enforce that the operand is of this class
    # using the method is_valid_operand below
    operator_type = None
    @classmethod
    def is_valid_operand(cls, literal):
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
    def operate_left(cls, literal, operator, db_column):
        """ Implements literal <operator> db_column """

        return "%s {} {}".format(operator, db_column), [cls.serialize_value(literal)]

    @classmethod
    def operate_right(cls, db_column, operator, literal):
        """ Implements db_column <operator> literal """

        return "{} {} %s".format(db_column, operator), [cls.serialize_value(literal)]

    @classmethod
    def operate_both(cls, db_column1, operator, db_column2):
        """ Implements db_column1 <operator> db_column2 """

        return "{} {} {}".format(db_column1, operator, db_column2), []

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)

    item = models.ForeignKey(
        Item, on_delete=models.CASCADE, help_text="Item this this cell represents")
    prop = models.ForeignKey(
        Property, on_delete=models.CASCADE, help_text="Property this cell represents")

    provenance = models.ForeignKey(
        Provenance, on_delete=models.CASCADE, help_text="Provenance of this cell")

    active = models.BooleanField(default=True, help_text="Is this item active")
    superseeded_by = models.ForeignKey('self', on_delete=models.SET_NULL,
                                       null=True, blank=True, help_text="Cell this value is superseeded by")


__all__ = ["Codec", "CodecManager"]