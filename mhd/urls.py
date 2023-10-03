from __future__ import annotations

from django.conf import settings
from django.contrib import admin
from django.urls import include, path

from mhd_schema.router import router as schema_router
from mhd_data.views import QueryView, CountQueryView, ItemView

urlpatterns = [
    path("api/query/<slug:cid>/", QueryView.as_view()),
    path("api/query/<slug:cid>/count/", CountQueryView.as_view()),
    path("api/item/<slug:cid>/<slug:uuid>/", ItemView.as_view()),
    path("api/schema/", include(schema_router.urls)),
    path("api/admin/", admin.site.urls),
]

# in debugging mode, mixin webpack_build_path
if settings.DEBUG:
    from django.views.static import serve as dir_serve
    from django.urls import re_path

    urlpatterns += [
        re_path(
            r"^(?P<path>.*)$",
            dir_serve,
            kwargs={"document_root": settings.WEBPACK_BUILD_PATH},
        ),
    ]
