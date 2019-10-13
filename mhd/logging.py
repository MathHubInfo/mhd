import logging

import os
MDH_LOG_QUERIES = os.environ.get('MDH_LOG_QUERIES', False)


class RequireLogQueries(logging.Filter):
    def filter(self, record):
        return MDH_LOG_QUERIES
