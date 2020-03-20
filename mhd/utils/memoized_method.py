from __future__ import annotations

import functools
import weakref

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Any, Callable


def memoized_method(*lru_args: Any, **lru_kwargs: Any) -> Callable[[Callable[...,  Any]], Callable[...,  Any]]:
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        def wrapped_func(self, *args: Any, **kwargs: Any) -> Any:
            # We're storing the wrapped method inside the instance. If we had
            # a strong reference to self the instance would never die.
            self_weak = weakref.ref(self)
            @functools.wraps(func)
            @functools.lru_cache(*lru_args, **lru_kwargs)
            def cached_method(*args, **kwargs):
                return func(self_weak(), *args, **kwargs)
            setattr(self, func.__name__, cached_method)
            return cached_method(*args, **kwargs)
        return wrapped_func
    return decorator
