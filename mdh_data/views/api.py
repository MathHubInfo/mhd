from django.shortcuts import get_object_or_404
from rest_framework import generics
from ..models import SemanticItemSerializer
from mdh_schema.models import Collection
from mdh.utils import DefaultRawPaginator
from rest_framework import exceptions, response

from ..querybuilder import QueryBuilderError


class QueryViewException(exceptions.APIException):
    default_code = 400
    default_detail = "Incorrect query"

class QueryView(generics.ListAPIView):
    pagination_class = DefaultRawPaginator

    def get_serializer(self, *args, **kwargs):
        """ Creates a new serializer for the given collection and properties """

        return SemanticItemSerializer(*args, collection=self._collection, properties=self._properties, **kwargs)

    def get_queryset(self):
        """ Creates a new queryset for the given page """

        # find the collection to query
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

        # store properties and queryset
        try:
            q, self._properties = self._collection.query(
                limit=None, offset=None, properties=props, filter=filter, order=order,
            )
        except QueryBuilderError as qe:
            raise QueryViewException(detail=qe)

        # return the queryset
        return q

class ItemView(generics.RetrieveAPIView):
    def get(self, *args, **kwargs):
        collection = get_object_or_404(
            Collection, slug=kwargs['cid'])

        item = get_object_or_404(
            collection.item_set, id=kwargs['uuid']
        )

        return response.Response(item.semantic(collection))
