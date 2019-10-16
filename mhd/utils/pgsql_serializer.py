def pgsql_serializer(typ):
    """ Builds a serializer for the given postgres type """
    if typ.endswith('[]'):
        s = pgsql_serializer(typ[:-2])
        return lambda v: '{' + ','.join(map(s, v)) + '}'
    return str
