import json


def make_pgsql_serializer(typ):
    """ Builds a serializer for the given postgres type """

    typ = typ.lower()

    # arrays => serialize each value of the property
    if typ.endswith('[]'):
        s = make_pgsql_serializer(typ[:-2])
        return lambda v: '{' + ','.join(map(s, v)) + '}'
    elif typ == 'json':
        return json.dumps
    elif typ == 'jsonb':
        return _pgsql_json_serializer
    elif typ == 'timestamp with time zone':
        return lambda v: "'{}'".format(v.isoformat())
    elif typ == 'text' or typ.startswith('char') or typ.startswith('varchar'):
        return _pgsql_string_serializer
    else:
        return str


def _pgsql_json_serializer(j):
    if j is None:
        return 'None'

    try:
        return json.dumps(j.adapted)
    except AttributeError:
        return json.dumps(j)

def _pgsql_string_serializer(s):
    return '"{}"'.format(s.replace('"', '""'))
