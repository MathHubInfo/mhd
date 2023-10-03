from __future__ import annotations

from rest_framework import pagination
from rest_framework.response import Response

from collections import OrderedDict

from .raw_paginator import RawQuerySetPaginator

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    pass


def after(s: str, needle: str):
    try:
        idx = s.index(needle)
        return s[idx + len(needle) :], True
    except ValueError:
        return s, False


class DefaultPaginator(pagination.PageNumberPagination):
    page_size_query_param: str = "per_page"
    max_page_size: int = 1000

    def clean_pagination_link(self, link):
        if not isinstance(link, str):
            return link

        link, ok = after(link, "://")
        if not ok:
            return link

        link, ok = after(link, "/")
        if not ok:
            return link
        return "/" + link

    def get_next_link(self):
        return self.clean_pagination_link(super().get_next_link())

    def get_prev_link(self):
        return self.clean_pagination_link(super().get_prev_link())

    def get_paginated_response(self, data: list[Any]) -> Response:
        return Response(
            OrderedDict(
                [
                    ("count", self.page.paginator.count),
                    ("next", self.get_next_link()),
                    ("previous", self.get_previous_link()),
                    ("num_pages", self.page.paginator.num_pages),
                    ("results", data),
                ]
            )
        )


class DefaultRawPaginator(DefaultPaginator):
    django_paginator_class = RawQuerySetPaginator
