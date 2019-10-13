import logging

import os
class RequireLogQueries(logging.Filter):
    def filter(self, record):
        return os.environ.get('MDH_LOG_QUERIES', False)
