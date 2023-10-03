from __future__ import annotations

from rest_framework import routers

from .views import CollectionViewSet, CodecViewSet

router = routers.DefaultRouter()
router.register("collections", CollectionViewSet)
router.register("codecs", CodecViewSet, basename="codecs")

__all__ = ["router"]
