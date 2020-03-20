from __future__ import annotations

import functools

from django.urls import reverse
from django.utils.html import format_html

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Callable, Optional

def AdminLink(original: Callable[..., Optional[str]]) -> Callable[..., Optional[str]]:
    """ Decorator that makes a Django admin ForeignKey clickable """

    @functools.wraps(original)
    def wrapper(*args: Any, **kwargs: Any) -> Optional[str]:
        o = original(*args, **kwargs)
        if o is None:
            return None

        url = reverse('admin:%s_%s_change' % (o._meta.app_label,
                                              o._meta.model_name), args=[o.id])
        return format_html("<a href='{}'>{}</a>", url, o)
    return wrapper
