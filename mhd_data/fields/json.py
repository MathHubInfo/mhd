from __future__ import annotations

import json

from django import forms
from django.core.exceptions import ValidationError
from django.db import connection, models
from rest_framework import serializers

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Any, Optional
    from django.forms import Field
    from django.db.models import Expression
    from django.db.backends.base.base import BaseDatabaseWrapper


class DumbJSONField(models.TextField):
    """
    A dumb JSONField that stores it's value as encoded text
    Should not be used
    Use the builtin JSONField instead
    """

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        # default is blank = True, to allow empty inputs
        if "blank" not in kwargs:
            kwargs["blank"] = True
            self._has_blank = False
        else:
            self._has_blank = True

        default = kwargs.get("default", None)
        if default is not None:
            kwargs["default"] = self._dump_json(default)

        super().__init__(*args, **kwargs)

    def deconstruct(self) -> tuple[str, str, list[Any], dict[str, Any]]:
        name, path, args, kwargs = super().deconstruct()
        if "default" in kwargs and kwargs["default"] is not None:
            kwargs["default"] = self._load_json(kwargs["default"])

        # remove the blank kwarg when it didn't exist beforehand
        if not self._has_blank:
            kwargs.pop("blank")

        return name, path, args, kwargs

    def get_internal_type(self) -> str:
        return "TextField"

    ##
    # Save conversions
    ##
    def _load_json(self, value: str) -> Any:
        try:
            return json.loads(value)
        except Exception as e:
            raise ValidationError(str(e))

    def _dump_json(self, value: Any) -> str:
        self._validate(value)
        try:
            return json.dumps(value)
        except Exception as e:
            raise ValidationError(str(e))

    def _validate(self, value: Any) -> bool:
        """Called before storing this field"""
        return True

    ##
    # Converting to database values
    ##

    def get_prep_value(self, value: Optional[Any]) -> Optional[str]:
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

    def from_db_value(
        self,
        value: Optional[Any],
        expression: Expression,
        connection: BaseDatabaseWrapper,
    ) -> Optional[Any]:
        if value is None:
            return value

        return self._load_json(value)

    def to_python(self, value: Optional[str]) -> Any:
        if value is None:
            return None

        if not isinstance(value, str):
            value = str(value)

        return self._load_json(value)

    def formfield(self, **kwargs: Any) -> Field:
        # Passing max_length to forms.CharField means that the value's length
        # will be validated twice. This is considered acceptable since we want
        # the value in the form field (to pass into widget for example).
        return super().formfield(
            **{
                "max_length": self.max_length,
                **({} if self.choices else {"widget": forms.Textarea}),
                **kwargs,
            }
        )


class DumbJSONFieldSerializer(serializers.Field):
    """Implements a no-op serializer for DumbJSONFields"""

    def to_representation(self, value: Any) -> Any:
        return value

    def to_internal_value(self, data: Any) -> Any:
        return data


serializers.ModelSerializer.serializer_field_mapping[
    DumbJSONField
] = DumbJSONFieldSerializer

if connection.vendor == "postgresql":
    from django.db.models import JSONField

    class SmartJSONField(JSONField):
        """
        posgres-aware version of a JSONField
        Should not be used

        Use the builtin JSONField instead
        """

        using_postgres = True

else:

    class SmartJSONField(DumbJSONField):
        """
        non-postgres-aware version of a JSONField
        Should not be used

        Use the builtin JSONField instead
        """

        using_postgres = False


__all__ = ["DumbJSONField", "SmartJSONField"]
