import json

from os.path import join, dirname


def AssetPath(testfile, *parts):
    """
        Returns the path to a test asset.
        Intended usage:
        AssetPath(__filename__, "res", "example.json")
    """
    return join(dirname(testfile), *parts)


def LoadJSONAsset(asset):
    """ LoadAsset loads a test asset """

    data = None
    with open(asset) as f:
        data = json.load(f)
    return data


__all__ = ["AssetPath", "LoadJSONAsset"]
