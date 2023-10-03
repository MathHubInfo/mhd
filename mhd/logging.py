from __future__ import annotations

import logging

import os


class RequireLogQueries(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        return os.environ.get("MHD_LOG_QUERIES", "0") == "1"
