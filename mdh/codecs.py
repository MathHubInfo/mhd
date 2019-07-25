import functools

from django.apps import apps

from .models import Codec

@functools.lru_cache(maxsize=None)
def get_codecs():
    """ Returns a list of all Codec Models """
    return list(filter(lambda clz: issubclass(clz, Codec), apps.get_models()))

@functools.lru_cache(maxsize=None)
def get_codec(name):
    """ Gets a codec by name """

    # normalize the name of the codec
    if "_" not in name:
        name = "mdh_{}".format(name.lower())

    for c in get_codecs():
        if c.get_codec_name() == name:
            return c

    return None