FROM python:3.10-alpine

# Add requirements and install dependencies
WORKDIR /app/
ADD requirements.txt /app/
ADD requirements-prod.txt /app/

# Add dependencies
RUN mkdir -p /var/www/api/admin/static/ \
    && apk add --no-cache bash postgresql-libs postgresql-client pcre-dev libffi-dev mailcap supervisor yarn \
    && apk add --no-cache --virtual .build-deps gcc g++ musl-dev postgresql-dev linux-headers python3-dev \
    && pip install -r requirements.txt -r requirements-prod.txt --no-cache-dir \
    && apk --purge del .build-deps

# Install Django App, configure settings and copy over djano app
ADD manage.py /app/
ADD mhd/ /app/mhd/
ADD mhd_data/ /app/mhd_data/
ADD mhd_provenance/ /app/mhd_provenance/
ADD mhd_schema/ /app/mhd_schema/
ADD mhd_tests/ /app/mhd_tests/
ADD mddl_catalog/ /app/mddl_catalog/
ADD mviews/ /app/mviews/

### ALL THE CONFIGURATION

ENV DJANGO_SETTINGS_MODULE "mhd.docker_settings"
ENV DJANGO_SECRET_KEY ""
ENV DJANGO_DB_ENGINE "django.db.backends.sqlite3"
ENV DJANGO_DB_NAME "/data/mhd.db"
ENV DJANGO_DB_USER ""
ENV DJANGO_DB_PASSWORD ""
ENV DJANGO_DB_HOST ""
ENV DJANGO_DB_PORT ""

# Copy over static files
RUN DJANGO_SECRET_KEY=setup python manage.py collectstatic --noinput

# add and run the frontend code
ADD frontend /app/frontend
WORKDIR /app/frontend
ENV NEXT_TELEMETRY_DISABLED=1
RUN yarn --frozen-lockfile && NODE_ENV=production yarn build

# Add uwsgi, supervisor config and entrypoint
ADD docker/entrypoint.sh /entrypoint.sh
ADD docker/supervisor.conf /supervisor.conf
ADD docker/uwsgi.ini /uwsgi.ini

# Volume and ports
VOLUME /data/
EXPOSE 80

WORKDIR /app/
ENTRYPOINT ["/entrypoint.sh"]
CMD ["supervisord", "-c", "/supervisor.conf"]