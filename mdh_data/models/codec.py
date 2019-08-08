from django.apps import apps
from django.db import models

from mdh_provenance.models import Provenance
from mdh_schema.models import Property
from mdh_django.utils import uuid4

from .item import Item


class Codec(models.Model):
    """ An abstract class for each codec """
    class Meta:
        abstract = True
        unique_together = [['item', 'prop', 'superseeded_by']]

    CODEC_TABLE_PREFIX = 'mdh_data_'
    @staticmethod
    def normalize_codec_name(name):
        """ Normalizes the name of a codec """

        if name.startswith(Codec.CODEC_TABLE_PREFIX):
            name = name[len(Codec.CODEC_TABLE_PREFIX):]

        # turn the name into lower case
        return name.lower()

    @staticmethod
    def find_all_codecs():
        """ Returns a list of all Codec Models """

        return filter(lambda clz: issubclass(clz, Codec), apps.get_models())

    @staticmethod
    def find_codec(name, normalize=True):
        """ Finds a Codec By Name """

        # Normalize the name
        if normalize:
            name = Codec.normalize_codec_name(name)

        # And find a codec with that name
        for c in Codec.find_all_codecs():
            if c.get_codec_name() == name:
                return c

        return None

    @classmethod
    def get_codec_name(cls):
        """ Gets the name of this codec """

        return Codec.normalize_codec_name(cls.objects.model._meta.db_table)

    # A database field containing the value, overwritten by subclass
    value = None

    # A DRF serializer field (if any) corresponding to the value object
    # may be omitted iff 'value' can be directly serialized from / to json
    # (e.g. when using integers)
    _serializer_field = None

    @classmethod
    def populate_value(cls, value):
        """ Called by the importer to populate the value """
        if cls._serializer_field is None:
            return value

        return cls._serializer_field.to_internal_value(value)

    @classmethod
    def serialize_value(cls, value):
        """ Called by the serializer to serialize the value """
        if cls._serializer_field is None:
            return value

        return cls._serializer_field.to_representation(value)

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


__all__ = ["Codec"]
