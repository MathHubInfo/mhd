from django.shortcuts import get_object_or_404
from rest_framework import generics, views, response
from ..models import SemanticItemSerializer
from mhd_schema.models import Collection
from mhd.utils import DefaultRawPaginator
from rest_framework import exceptions, response

from django.http import Http404

from ..querybuilder import QueryBuilderError


class QueryViewException(exceptions.APIException):
    default_code = 400
    default_detail = "Incorrect query"

class QueryViewMixin:
    def build_query_params(self):
        self._collection = get_object_or_404(
            Collection, slug=self.kwargs['cid'])

        # parse the properties value
        props = None
        properties = self.request.query_params.get('properties', None)
        if properties is not None:
            props = []
            for p in properties.split(","):
                pp = self._collection.get_property(p)
                if pp is None:
                    raise QueryViewException(
                        detail="Unknown property {0!r} of collection {1!r}".format(p, self._collection.slug))
                props.append(pp)

            if len(props) == 0:
                props = None

        # read the filter
        filter = self.request.query_params.get('filter', None)
        order = self.request.query_params.get('order', None)

        return props, filter, order

class QueryView(QueryViewMixin, generics.ListAPIView):
    pagination_class = DefaultRawPaginator

    def get_serializer(self, *args, **kwargs):
        """ Creates a new serializer for the given collection and properties """

        return SemanticItemSerializer(*args, collection=self._collection, properties=self._properties, **kwargs)

    def get_queryset(self):
        """ Creates a new queryset for the given page """

        # build the query
        props, filter, order = self.build_query_params()

        # store properties and queryset
        try:
            q, self._properties = self._collection.query(
                limit=None, offset=None, properties=props, filter=filter, order=order,
            )
        except QueryBuilderError as qe:
            raise QueryViewException(detail=qe)

        # return the queryset
        return q

class CountQueryView(QueryViewMixin, views.APIView):
    def get(self, request, **kwargs):
        # get the query params and then build a count query
        props, filter, order = self.build_query_params()
        count = self._collection.query_count(properties=props, filter=filter).fetchone()[0]
        return response.Response({'count': count})

class ItemView(generics.RetrieveAPIView):
    def get(self, *args, **kwargs):
        collection = get_object_or_404(
            Collection, slug=kwargs['cid'])

        try:
            item = collection.item_set.get(id=kwargs['uuid'])
        except:
            raise Http404

        return response.Response(item.semantic(collection))
