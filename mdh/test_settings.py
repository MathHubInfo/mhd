import os

from .settings import *

if os.environ.get('DATABASE') == 'postgres':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': 'postgres',
            'USER': 'postgres',
            'HOST': 'localhost',
            'PORT': 5432
        }
    }
