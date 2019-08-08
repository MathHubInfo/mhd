# This code has been adapated from https://github.com/mblance/django-paginator-rawqueryset
# Copyright (c) 2014, Matt Buck
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
#
# 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
#
# 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
#
# 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#
from django.core.paginator import Page
from django.core.paginator import Paginator as DefaultPaginator
from django.db import connections
from django.db.models.query import RawQuerySet
from rest_framework import pagination


class DatabaseNotSupportedException(Exception):
    pass


class RawQuerySetPaginator(DefaultPaginator):
    """An efficient paginator for RawQuerySets.
    """
    _count = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.raw_query_set = self.object_list
        self.connection = connections[self.raw_query_set.db]

    def _get_count(self):
        if self._count is None:
            cursor = self.connection.cursor()
            count_query = """SELECT COUNT(*) FROM (%s) AS sub_query_for_count""" % self.raw_query_set.raw_query
            cursor.execute(count_query, self.raw_query_set.params)
            self._count = cursor.fetchone()[0]

        return self._count
    count = property(_get_count)

    def _get_limit_offset_query(self, limit, offset):
        """mysql, postgresql, and sqlite can all use this syntax
        """
        return """SELECT * FROM (%s) as sub_query_for_pagination
                LIMIT %s OFFSET %s""" % (self.raw_query_set.raw_query, limit, offset)

    mysql_getquery = _get_limit_offset_query
    postgresql_getquery = _get_limit_offset_query
    sqlite_getquery = _get_limit_offset_query

    def oracle_getquery(self, limit, offset):
        """Get the oracle query, but check the version first
           Query is only supported in oracle version >= 12.1
           TODO:TESTING
        """
        major_version, minor_version = self.connection.oracle_version[0:2]
        if major_version < 12 or (major_version == 12 and minor_version < 1):
            raise DatabaseNotSupportedException(
                'Oracle version must be 12.1 or higher')

        return """SELECT * FROM (%s) as sub_query_for_pagination
                  OFFSET %s ROWS FETCH NEXT %s ROWS ONLY
               """ % (self.raw_query_set.raw_query, offset, limit)

    def firebird_getquery(self, limit, offset):  # TODO:TESTING
        return """SELECT FIRST %s SKIP %s *
                FROM (%s) as sub_query_for_pagination
               """ % (limit, offset, self.raw_query_set.raw_query)

    def page(self, number):
        number = self.validate_number(number)
        offset = (number - 1) * self.per_page
        limit = self.per_page
        if offset + limit + self.orphans >= self.count:
            limit = self.count - offset

        database_vendor = self.connection.vendor
        try:
            query_with_limit = getattr(
                self, '%s_getquery' % database_vendor)(limit, offset)
        except AttributeError:
            raise DatabaseNotSupportedException(
                '%s is not supported by RawQuerySetPaginator' % database_vendor)

        data = list(self.raw_query_set.model.objects.raw(
            query_with_limit, self.raw_query_set.params))
        return Page(data, number, self)


class Paginator(object):
    def __new__(cls, object_list, per_page, *args, **kwargs):
        cls = (RawQuerySetPaginator if isinstance(
            object_list, RawQuerySet) else DefaultPaginator)
        instance = cls(object_list, per_page, *args, **kwargs)
        return instance
