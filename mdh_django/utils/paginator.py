from rest_framework import pagination

from .raw_paginator import RawQuerySetPaginator

class DefaultPaginator(pagination.PageNumberPagination):
    page_size_query_param = "per_page"
    max_page_size = 100

class DefaultRawPaginator(DefaultPaginator):
    django_paginator_class = RawQuerySetPaginator
