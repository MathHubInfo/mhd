from django.utils.html import format_html
from django.urls import reverse


def AdminLink(original):
    """ Decorator that makes a Django admin ForeignKey clickable """

    def wrapper(self, obj):
        o = original(self, obj)
        if o is None:
            return None

        url = reverse('admin:%s_%s_change' % (o._meta.app_label,
                                              o._meta.model_name), args=[o.id])
        return format_html("<a href='{}'>{}</a>", url, o)
    return wrapper
