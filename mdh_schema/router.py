from django.contrib import admin
from django.urls import include, path
from rest_framework import routers

from .views import CollectionViewSet, CodecViewSet

router = routers.DefaultRouter()
router.register('collections', CollectionViewSet)
router.register('codecs', CodecViewSet, basename="codecs")