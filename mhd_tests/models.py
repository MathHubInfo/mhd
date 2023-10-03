from __future__ import annotations

from django.db import models
from mhd_data.fields.json import DumbJSONField, SmartJSONField
from mhd_data.fields.ndarray import DumbNDArrayField, SmartNDArrayField

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Optional, Any, List


class DumbJSONFieldModel(models.Model):
    """Model used for DumbJSONField testing"""

    data: Optional[Any] = DumbJSONField(null=True)


class SmartJSONFieldModel(models.Model):
    """Model used for SmartJSONField testing"""

    data: Optional[Any] = SmartJSONField(null=True)


class DumbNDArrayOneModel(models.Model):
    """Model used for one-dimensional DumbNDArrayField testing"""

    data: List[int] = DumbNDArrayField(typ=models.IntegerField(), dim=1)


class SmartNDArrayOneModel(models.Model):
    """Model used for one-dimensional SmartNDArrayField testing"""

    data: List[int] = SmartNDArrayField(typ=models.IntegerField(), dim=1)


class DumbNDArrayTwoModel(models.Model):
    """Model used for two-dimensional DumbNDArrayField testing"""

    data: List[List[int]] = DumbNDArrayField(typ=models.IntegerField(), dim=2)


class SmartNDArrayTwoModel(models.Model):
    """Model used for two-dimensional SmartNDArrayField testing"""

    data: List[List[int]] = SmartNDArrayField(typ=models.IntegerField(), dim=2)


class JSONArrayFieldModel(models.Model):
    """Model used for one-dimension SmartJSONField()-array testing"""

    data: List[Any] = SmartNDArrayField(typ=SmartJSONField(), dim=1)


class TextFieldModel(models.Model):
    """Model used for TextField testing"""

    data: Optional[str] = models.TextField(blank=True)
