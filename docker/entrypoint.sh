#!/bin/sh

# Run Migrations
python manage.py migrate --noinput

# startup with whatever command was provided
"$@"