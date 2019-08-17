import os

from .settings import *

# install the tests only app
if not 'mdh_tests' in INSTALLED_APPS:
    INSTALLED_APPS.append('mdh_tests')

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
