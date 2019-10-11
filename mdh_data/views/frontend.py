from django.conf import settings
from django.http import HttpResponse, Http404
from django.views import View

from ..models import Item

from mdh_schema.models import Collection


class FrontendProxyView(View):
    def get(self, request, *args, **kwargs):
        if not self.is_found(request, *args, **kwargs):
            raise Http404

        res = HttpResponse()
        res['X-Sendfile'] = '/index.html'

        # in debugging mode, print a message to show what is expected to happen
        if settings.DEBUG:
            res['Content-Type'] = 'text/html'
            res.write('X-Sendfile /index.html<br/>(In production this will be replaced with index.html')

        return res

    def is_found(self, *args, **kwargs):
        """ Checks if a given item is found """
        raise NotImplementedError


class FrontendHomeView(FrontendProxyView):
    def is_found(self, *args, **kwargs):
        return True


class FrontendCollectionView(FrontendProxyView):
    def is_found(self, request, cid, **kwargs):
        return Collection.objects.filter(slug=cid).exists()


class FrontendItemView(FrontendProxyView):
    def is_found(self, request, cid, uuid, **kwargs):
        if not Collection.objects.filter(slug=cid).exists():
            return False
        try:
            return Item.objects.filter(id=uuid).exists()
        except:
            return False
