from __future__ import annotations

from django.conf import settings
from django.views.static import serve as file_serve

from django.http import HttpResponse, Http404
from django.views import View

from ..models import Item

from mhd_schema.models import Collection

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from django.http import HttpRequest
    from typing import Any


class FrontendProxyView(View):
    def get(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:

        # if we can't find what we are looking for, then return nothing
        if not self.is_found(request, *args, **kwargs):
            raise Http404

        if settings.DEBUG:
            return file_serve(request, path='index.html', document_root=settings.WEBPACK_BUILD_PATH)

        # for production simply return index.html
        res = HttpResponse()
        res['X-Sendfile'] = '/index.html'

        # retturn the response
        return res

    def is_found(self, *args: Any, **kwargs: Any) -> bool:
        """ Checks if a given item is found """
        raise NotImplementedError


class FrontendStaticView(FrontendProxyView):
    def is_found(self, *args: Any, **kwargs: Any) -> bool:
        return True


class FrontendCollectionView(FrontendProxyView):
    def is_found(self, request: HttpRequest, cid: str, **kwargs: Any) -> bool:
        return Collection.objects.filter(slug=cid).exists()


class FrontendItemView(FrontendProxyView):
    def is_found(self, request: HttpRequest, cid: str, uuid: str, **kwargs: Any) -> bool:
        if not Collection.objects.filter(slug=cid).exists():
            return False
        try:
            return Item.objects.filter(id=uuid).exists()
        except:
            return False
