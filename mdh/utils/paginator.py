from rest_framework import pagination
from rest_framework.response import Response

from collections import OrderedDict

from .raw_paginator import RawQuerySetPaginator

class DefaultPaginator(pagination.PageNumberPagination):
    page_size_query_param = "per_page"
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response(OrderedDict([
            ('count', self.page.paginator.count),
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
            ('num_pages', self.page.paginator.num_pages),
            ('results', data)
        ]))

class DefaultRawPaginator(DefaultPaginator):
    django_paginator_class = RawQuerySetPaginator
