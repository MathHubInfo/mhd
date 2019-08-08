from django.shortcuts import get_object_or_404
from rest_framework import generics
from .models import SemanticItemSerializer
from mdh_schema.models import Collection
from mdh_django.utils import DefaultRawPaginator


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

        # store properties and queryset
        q, self._properties = self._collection.query(limit=None, offset=None)

        # return the queryset
        return q
