from __future__ import annotations

import math
import json
import re

from typing import Callable, Any, List, Union, Optional
from datetime import datetime

CSV_NULL = '\\N'
CSV_NULL_ESCAPED = "E'\\N'"

ARY_TYP_REGEX = re.compile(r'^(.*)\[(?:\d+)?\]$')


def make_pgsql_serializer(typ: str, is_nested: bool = False) -> Callable[[Any], str]:
    """ Creates a serializer for the given postgres type
        That is, it returns a function taking a python
        value representing the type and returning a string
        to be written inside a CSV file """
    ary = ARY_TYP_REGEX.match(typ)
    if ary:
        return lambda v: _pgsql_encode_ary(v, ary.group(1))
    elif typ in NUMERIC_TYPES:
        return _pgsql_encode_numeric
    elif typ in BOOLEAN_TYPES:
        return _pgsql_encode_boolean
    elif typ.split('(')[0] in CHARS_TYPES:
        return _pqsql_encode_chars
    elif typ in TIME_TYPES:
        return _pgsql_encode_time
    elif typ == 'json':
        return lambda v: _pgsql_encode_json(v, is_nested)
    elif typ == 'jsonb':
        return lambda v: _pgsq_encode_jsonb(v, is_nested)
    elif typ == 'uuid':
        return _pgsq_encode_uuid

    raise ValueError('Unsupported Postgres Type: {}'.format(typ))

#########################
# Array Types
#########################


def _pgsql_encode_ary(v: List[Any], subtype: str) -> str:
    if v is None:
        return CSV_NULL

    sub = make_pgsql_serializer(subtype, is_nested=True)
    return '{' + ','.join(map(sub, v)) + '}'

#########################
# Numeric Types
#########################


p_inf = float("inf")
n_inf = float("-inf")

NUMERIC_TYPES = ('smallint', 'integer', 'bigint', 'decimal', 'numeric',
                 'real', 'double precision', 'smallserial', 'serial', 'bigserial')


def _pgsql_encode_numeric(n: Optional[Union[float, int]]) -> str:
    """ Escapes a number for use with postgres """

    if n is None:
        return 'NULL'

    if math.isnan(n):
        return 'NaN'

    if n == p_inf:
        return 'Infinity'
    if n == n_inf:
        return '-Infinity'

    return str(n)

#########################
# Boolean Types
#########################


BOOLEAN_TYPES = ('boolean',)


def _pgsql_encode_boolean(b: Optional[bool]) -> str:
    """ Escapes a boolean for use with postgres """

    if b is None:
        return CSV_NULL

    return 'true' if b else 'false'

#########################
# Character Types
#########################


CHARS_TYPES = ('character varying', 'varchar', 'character', 'char', 'text')
CHARS_ESCAPES = ('"', "\t", "\n", "\\", "\r")


def _pqsql_encode_chars(s: Optional[str]) -> str:
    # if we provided nothing, return null
    if s is None:
        return CSV_NULL

    return s.translate(
        s.maketrans({C: "\\" + C for C in CHARS_ESCAPES})
    )


#########################
# Time Types
#########################
TIME_TYPES = ('timestamp with time zone',)


def _pgsql_encode_time(dt: Optional[datetime]) -> str:
    if dt is None:
        return CSV_NULL

    return dt.isoformat()


#########################
# JSON Types
#########################
JSON_ESCAPES = ('\\')


def _pgsql_encode_json(j: Any, is_nested: bool) -> str:
    # perform a normal json encoding
    s = json.dumps(j)
    s = s.translate(
        s.maketrans({C: "\\" + C for C in JSON_ESCAPES})
    )

    # if we're not nested, we're done!
    if not is_nested:
        return s

    # FIXME: I don't know why this particular encoding
    # But this seems to work
    return '"{}"'.format(s.translate(
        s.maketrans({
            '"': '\\\\"',
            '\t': '\\\\t',
            '\\': '\\\\',
        })
    ))


def _pgsq_encode_jsonb(jb, is_nested: bool):
    try:
        return _pgsql_encode_json(jb.adapted, is_nested)
    except AttributeError:
        return _pgsql_encode_json(jb, is_nested)

#########################
# UUID Types
#########################


def _pgsq_encode_uuid(u: Optional[Any]) -> str:
    if u is None:
        return CSV_NULL

    return str(u)
