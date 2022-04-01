"""
Django Docker settings for mhd project.
Reads all relevant settings from the environment
"""

from .settings import *
import os

# No Debugging
DEBUG = False

# we allow only the internal host, as we are proxied via NextJS
ALLOWED_HOSTS = ["127.0.0.1"]

# all our sessions be safe
SECRET_KEY = os.environ.setdefault("DJANGO_SECRET_KEY", "")

# Passwords
DATABASES = {
    'default': {
        'ENGINE': os.environ.setdefault("DJANGO_DB_ENGINE", ""),
        'NAME': os.environ.setdefault("DJANGO_DB_NAME", ""),
        'USER': os.environ.setdefault("DJANGO_DB_USER", ""),
        'PASSWORD': os.environ.setdefault("DJANGO_DB_PASSWORD", ""),
        'HOST': os.environ.setdefault("DJANGO_DB_HOST", ""),
        'PORT': os.environ.setdefault("DJANGO_DB_PORT", ""),
    }
}

# add the static files to the root
STATIC_ROOT = "/var/www/api/admin/static/"
