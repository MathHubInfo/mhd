from django.contrib import admin
from django.urls import include, path

from mhd_schema.router import router as schema_router
from mdh_data.views.frontend import FrontendHomeView, FrontendCollectionView, FrontendItemView
from mdh_data.views.api import QueryView, ItemView

urlpatterns = [
    path('api/query/<slug:cid>/', QueryView.as_view()),
    path('api/item/<slug:cid>/<slug:uuid>/', ItemView.as_view()),
    path('api/schema/', include(schema_router.urls)),
    path('admin/', admin.site.urls),

    # frontend-served urls, caught by uwsgi in production
    path('collection/<slug:cid>/', FrontendCollectionView.as_view()),
    path('item/<slug:cid>/<slug:uuid>/', FrontendItemView.as_view()),
    path('', FrontendHomeView.as_view())
]
