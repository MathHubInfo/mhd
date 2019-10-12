import os

from .settings import *

# install the tests only app
if not 'mhd_tests' in INSTALLED_APPS:
    INSTALLED_APPS.append('mhd_tests')

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
