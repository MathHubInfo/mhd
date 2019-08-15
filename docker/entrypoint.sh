#!/bin/sh

# Run Migrations
python manage.py migrate --noinput

# If a parameter is given, run a manage.py command
# e.g. run 'createsuperuser' to create a super user
#if ! [ -z "$1" ]; then
#    python manage.py $@
#    exit $?
#fi;


# Start gunicorn for wsgi on localhost:8000
gunicorn mdh.wsgi:application --bind 127.0.0.1:8000 &

# Run nginx with django configuration
nginx -c /etc/nginx/mdh.conf