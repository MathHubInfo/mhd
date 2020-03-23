from __future__ import annotations

from django.conf import settings
from django.contrib import admin
from django.urls import include, path

from mhd_schema.router import router as schema_router
from mhd_data.views.frontend import FrontendStaticView, FrontendCollectionView, FrontendItemView
from mhd_data.views.api import QueryView, CountQueryView, ItemView

urlpatterns = [
    path('api/query/<slug:cid>/', QueryView.as_view()),
    path('api/query/<slug:cid>/count/', CountQueryView.as_view()),
    path('api/item/<slug:cid>/<slug:uuid>/', ItemView.as_view()),
    path('api/schema/', include(schema_router.urls)),
    path('admin/', admin.site.urls),

    # frontend-served urls, caught by uwsgi in production
    path('collection/<slug:cid>/', FrontendCollectionView.as_view()),
    path('collection/<slug:cid>/about/', FrontendCollectionView.as_view()),
    path('item/<slug:cid>/<slug:uuid>/', FrontendItemView.as_view()),
    path('about/', FrontendStaticView.as_view()),
    path('', FrontendStaticView.as_view())
]

# in debugging mode, mixin webpack_build_path
if settings.DEBUG:
    from os.path import dirname, join
    from django.views.static import serve as dir_serve
    from django.urls import re_path

    urlpatterns += [
        re_path(r'^(?P<path>.*)$', dir_serve, kwargs={'document_root': settings.WEBPACK_BUILD_PATH}),
    ]
