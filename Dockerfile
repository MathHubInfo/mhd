# Add all the dependencies
FROM python:3.10-alpine as base

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

FROM base as frontend

# add and run the frontend code
ADD frontend /app/frontend
WORKDIR /app/frontend
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN yarn install --frozen-lockfile --production
RUN yarn build --no-lint

FROM base as final
ARG DJANGO_SECRET_KEY=something-insecure
ENV DJANGO_DB_ENGINE "django.db.backends.sqlite3"
ENV DJANGO_DB_NAME "/data/mhd.db"
ENV DJANGO_DB_USER ""
ENV DJANGO_DB_PASSWORD ""
ENV DJANGO_DB_HOST ""
ENV DJANGO_DB_PORT ""

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
ENV DJANGO_SECRET_KEY $DJANGO_SECRET_KEY
ENV DJANGO_DB_ENGINE $DJANGO_DB_ENGINE
ENV DJANGO_DB_NAME $DJANGO_DB_NAME
ENV DJANGO_DB_USER $DJANGO_DB_USER
ENV DJANGO_DB_PASSWORD $DJANGO_DB_PASSWORD
ENV DJANGO_DB_HOST $DJANGO_DB_HOST
ENV DJANGO_DB_PORT $DJANGO_DB_PORT

# Copy over static files
RUN DJANGO_SECRET_KEY=setup python manage.py collectstatic --noinput

WORKDIR /app/frontend/
COPY --from=frontend /app/frontend/content ./content
COPY --from=frontend /app/frontend/public ./public
COPY --from=frontend /app/frontend/package.json ./package.json

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=frontend /app/frontend/.next/standalone ./
COPY --from=frontend /app/frontend/.next/static ./.next/static


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
