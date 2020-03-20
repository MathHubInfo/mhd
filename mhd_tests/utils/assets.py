from __future__ import annotations

import json

from os.path import join, dirname

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Any


def AssetPath(testfile: str, *parts: str) -> str:
    """
        Returns the path to a test asset.
        Intended usage:
        AssetPath(__filename__, "res", "example.json")
    """
    return join(dirname(testfile), *parts)


def LoadJSONAsset(asset: str) -> Any:
    """ LoadAsset loads a test asset """

    data = None
    with open(asset) as f:
        data = json.load(f)
    return data


__all__ = ["AssetPath", "LoadJSONAsset"]
