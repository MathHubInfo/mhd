"""
    This file contains a no-op wrapper around UUIDs.
    It exists to allow hooking into UUID generation during tests and should not be changed.
"""

import uuid


def uuid4(*args, **kwargs):
    """ A no-op wrapper to be used instead of uuid.uuid4 """
    return uuid.uuid4(*args, **kwargs)


uuid4_mock_state = {'counter': 0}

def uuid4_mock_reset():
    """ Resets the uuid4_mock """
    uuid4_mock_state['counter'] = 0

def uuid4_mock(*args, **kwargs):
    """ A mocked version of UUIDv4 """

    # grab the current hex and format the counter
    h = '{0:030x}'.format(uuid4_mock_state['counter'])
    uuid4_mock_state['counter'] += 1

    # we use the hex to mock a UUID 4
    return uuid.UUID(hex=h[0:12] + "4" + h[12:15] + "a" + h[15:30])

__all__ = ["uuid4"]
