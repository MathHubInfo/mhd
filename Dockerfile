# Stage 1: Build the frontend
FROM node:12 as frontend
WORKDIR /app/frontend/
ADD frontend .
RUN yarn && yarn build

# Stage 2: Build the backend + add the frontend to it
FROM python:3.7-alpine

# Install nginx and configuration
RUN apk add --no-cache nginx \
    && mkdir -p /run/nginx/

# Add requirements and install dependencies
WORKDIR /app/
ADD requirements.txt /app/

# Add the entrypoint and add configuration
RUN mkdir -p /var/www/admin/static/ \
    && apk add --no-cache postgresql-libs \
    && apk add --no-cache --virtual .build-deps gcc musl-dev postgresql-dev \
    && pip install -r requirements.txt --no-cache-dir \
    && apk --purge del .build-deps \
    && pip install gunicorn==19.7 --no-cache-dir

# Install Django App, configure settings and copy over djano app
ADD manage.py /app/
ADD mdh/ /app/mdh/
ADD mdh_data/ /app/mdh_data/
ADD mdh_provenance/ /app/mdh_provenance/
ADD mdh_schema/ /app/mdh_schema/
ADD mdh_tests/ /app/mdh_tests/

### ALL THE CONFIGURATION

ENV DJANGO_SETTINGS_MODULE "mdh.docker_settings"
ENV DJANGO_SECRET_KEY ""
ENV DJANGO_ALLOWED_HOSTS "localhost"
ENV DJANGO_DB_ENGINE "django.db.backends.sqlite3"
ENV DJANGO_DB_NAME "/data/mdh.db"
ENV DJANGO_DB_USER ""
ENV DJANGO_DB_PASSWORD ""
ENV DJANGO_DB_HOST ""
ENV DJANGO_DB_PORT ""

# Copy over static files
RUN DJANGO_SECRET_KEY=setup python manage.py collectstatic --noinput
COPY --from=frontend /app/frontend/build /var/www/frontend/build

# Add nginx and entrypoint
ADD docker/mdh.conf /etc/nginx/mdh.conf
ADD docker/entrypoint.sh /entrypoint.sh

# Volume and ports
VOLUME /data/
EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]