from django.db import models

__all__ = []

####
#### Dynamic models
####
from .magic import import_all_generated_models

def load_dynamic_modules():
    current_module = __import__(__name__)
    for name, impl in import_all_generated_models():
        setattr(current_module, name, impl)
        __all__.append(name)
load_dynamic_modules()