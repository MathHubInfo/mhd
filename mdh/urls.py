from django.contrib import admin
from django.urls import include, path

from mdh_schema.router import router as schema_router
from mdh_data.views.frontend import FrontendHomeView, FrontendCollectionView, FrontendItemView
from mdh_data.views.api import QueryView

urlpatterns = [
    path('api/query/<slug:cid>/', QueryView.as_view()),
    path('api/schema/', include(schema_router.urls)),
    path('admin/', admin.site.urls),

    # frontend-served urls, one for nginx
    path('collection/<slug:cid>/', FrontendCollectionView.as_view()),
    path('item/<slug:uuid>', FrontendItemView.as_view()),
    path('', FrontendHomeView.as_view())
]
