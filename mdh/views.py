from rest_framework import viewsets

from .models import Collection
from .serializers import CollectionSerializer

class CollectionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Collection.objects.all().order_by('-slug')
    serializer_class = CollectionSerializer
    lookup_field = 'slug'