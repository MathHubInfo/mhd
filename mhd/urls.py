from django.contrib import admin
from django.urls import include, path

from mhd_schema.router import router as schema_router
from mhd_data.views.frontend import FrontendStaticView, FrontendCollectionView, FrontendItemView
from mhd_data.views.api import QueryView, CountQueryView, ItemView

urlpatterns = [
    path('api/query/<slug:cid>/', QueryView.as_view()),
    path('api/query/<slug:cid>/count', CountQueryView.as_view()),
    path('api/item/<slug:cid>/<slug:uuid>/', ItemView.as_view()),
    path('api/schema/', include(schema_router.urls)),
    path('admin/', admin.site.urls),

    # frontend-served urls, caught by uwsgi in production
    path('collection/<slug:cid>/', FrontendCollectionView.as_view()),
    path('item/<slug:cid>/<slug:uuid>/', FrontendItemView.as_view()),
    path('about/', FrontendStaticView.as_view()),
    path('', FrontendStaticView.as_view())
]
