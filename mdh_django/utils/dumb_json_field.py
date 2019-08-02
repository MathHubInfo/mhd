import json

from rest_framework import serializers


class DumbJSONField(serializers.Field):
    def to_representation(self, value):
        return json.loads(value)

    def to_internal_value(self, data):
        return json.dumps(data)

__all__ = ["DumbJSONField"]
