# MathDataHub

![Frontend Tests](https://github.com/MathHubInfo/mhd/actions/workflows/frontend/badge.svg)
![Backend Tests](https://github.com/MathHubInfo/mhd/actions/workflows/backend.yml/badge.svg)
![Docker Build](https://github.com/MathHubInfo/mhd/actions/workflows/docker_build/badge.svg)

MathDataHub is a system to provide universal infrastructure for Mathematical Data.
See the paper [Towards a Unified Mathematical Data Infrastructure: Database and Interface Generation](https://kwarc.info/people/mkohlhase/papers/cicm19-MDH.pdf)
for more details.

This repository contains the MathDataHub Implementation consisting of a [Django](https://www.djangoproject.com/)-powered backend and [NextJS](https://nextjs.org/)-powered frontend.

_Note: The code refers to the project as `mhd` (as opposed to the expected `mdh`). This is due to historical reasons._

This README contains backend information, the frontend can be found in the `frontend/` sub-folder.
See [frontend/README.md](frontend/README.md) for more details.

**This code and in particular the documentation are still a work-in-progress**

## Code Structure

The top-level structure of this repository consists of a standard [Django](https://www.djangoproject.com/) project.
There are six apps:

- `mhd`: The main entry point. Contains a `utils/` package used by other apps.
- `mhd_schema`: Stores schema of MHD data. Home of the `Collection` and `Property` tables.
- `mhd_data`: Stores all concrete MHD data. Home of the `Item` and all `Codec` tables.
- `mhd_provenance`: Stores meta-information about MHD data. Home of the `Provenance` tables.
- `mhd_test`: Test-only app for specific test models
- `mddl_catalog`: Catalog of specific MDDL items, currently only codecs.

Currently, MHD depends only on Django and [Django Rest Framework](https://www.django-rest-framework.org/).
To install the dependencies, first make sure you have a recent enough version of Python installed on your system.
You can then install the requirements inside a new [venv](https://docs.python.org/3/library/venv.html):

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Development

** To run this, you need Python 3.10+. We recommend using Python 3.10. **

By default, MathDataHub uses an `sqlite` database.
To get started, you can run the initial migrations:

```bash
python manage.py migrate
```

Next, you can create a user for yourself:

```bash
python manage.py createsuperuser
```

Finally, to run the project:

```bash
python manage.py runserver
```

Furthermore, for debugging purposes it is also possible to log all queries to the console.
To do so, start the server with:

```bash
MHD_LOG_QUERIES=1 python manage.py runserver
```

To additionally customize development settings, create a file named `mhd/local_settings.py`.
This will be automatically loaded by mhd during configuration time.

### Local Postgres instance for testing

```bash
# update the local confiuration file and configure postgres
echo "DATABASES = { 'default': { 'ENGINE': 'django.db.backends.postgresql', 'NAME': 'postgres', 'USER': 'postgres', 'HOST': 'localhost', 'PORT': 5432 } }" \
    >> mhd/local_settings.py

# every time you need to start the database, run:
docker run --rm -it -p 127.0.0.1:5432:5432 -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_DB=postgres -e POSTGRES_USER=postgres -v pgdata:/var/lib/postgresql/data postgres
```

## Database structure

_TODO: Image of layout and explanation_

## Management commands

This is a list of custom `manage.py` commands.
These can be called with `python manage.py <command>` and serve various commands.
See also [Built-in commands](https://docs.djangoproject.com/en/dev/ref/django-admin/#available-commands).

- `upsert_collection`: Creates or updates a collection schema
- `delete_collection`: Removes an empty collection
- `insert_data`: Inserts data into an existing collection
- `load_collection`: Combines `upsert_collection` and `insert_data` commands for convenience.
- `query_collection`: Queries a collection
- `flush_collection`: Flushes all items associated to a collection
- `update_count`: Updates the total number of elements in each collection

## MDDL Codec Catalog

This project also contains the master list of codecs.
This is currently implemented inside the `mddl_catalog` app, but may migrate elsewhere in the future.

The master list itself is stored inside a fixture, and is intended to be edited with Django Admin.
To load data from the fixture, use:

```bash
# optional: delete all existing models in the database
python manage.py migrate mddl_catalog zero
python manage.py migrate

# to load all items from the fixture
python manage.py loaddata mddl_catalog/fixture.json
```

To update data in the fixture, use:

```
python manage.py dumpdata mddl_catalog.CodecCatalogItem > mddl_catalog/fixture.json
```

To load data enti

## URL Structure

This Code Exposes the following urls:

- `/api/query/$collection/` -- List items in a given collection (see details below)
- `/api/query/$collection/count` -- Count items in a given collection (see details below)
- `/api/schema/collections/` -- List all collections
  - `/api/schema/collection/$slug` -- Get a specific collection
- `/api/schema/codecs/` -- Lists all codecs
  - `/api/schema/codecs/$name` -- Get a specific codec
- `/api/admin/` -- Admin interface
  - `/api/admin/static/` -- staticfiles used for the admin interface

### Main Querying Syntax

To Query for items, the `/query/$collection/` API can be used.
To Query only for the count of items, use `/query/$collection/count` instead.
In addition to the collection slug in the URL, it takes the following GET parameters:

- `page`: A 1-based page ID. Defaults to 1.
- `per_page`: Number of entries per page, at most `100`. Defaults to `50`.
- `properties`: A comma-separated list of properties of the given collection to return. Defaults to all properties.
- `filter`: An additional filter DSL (as specified below).

The filter DSL allows comparing the value of any property to either a literal, or a second property of the same codec.
For example:

- `prop1 = 5`: Matches all items where `prop1` has the value `5`
- `5 < prop2`: Matches all items where `5` is less than the value of `prop2`
- `prop1 < prop2`: Matches all items where `prop1` is less than the value `prop2`

The exact operators and literals supported vary by codecs.
Furthermore, it is not possible to compare property values of different codecs.

These simple filters can be combined using `&&`, `||` and `!`. For example:

- `prop1 = 5 && prop2 = 17`: Matches all items where `prop1` has the value `5` and `prop2` has the value 17
- `!(prop1 = 5) && prop2 = 17`: Matches all items where it is not the case that `prop1` has the value `5` and `prop2` has the value 17

Formally, the Filter DSL looks as follows (with the exception of brackets):

```
% A top-level query returning a logical expression
LOGICAL = UNARY | BINARY | FILTER
% A unary operation, only '!' (logical not)
UNARY = '!' LOGICAL

% A binary operation, '&&' (AND) and '||' (OR) supported
BINARY = LOGICAL BINOP LOGICAL
BINOP = '&&' | '||'

% A semantic filter
FILTER = FILTER_LEFT | FILTER_RIGHT | FILTER_BOTH
FILTER_LEFT = LITERAL PROPERTY_OPERATOR PROPERTY_IDENTIFIER
FILTER_RIGHT = PROPERTY_IDENTIFIER PROPERTY_OPERATOR LITERAL
FILTER_BOTH = PROPERTY_IDENTIFIER PROPERTY_OPERATOR PROPERTY_IDENTIFIER

PROPERTY_OPERATOR = any known property operator
PROPERTY_IDENTIFIER = any known property slug
LITERAL = a literal, e.g true, false, a number, a string, or a list of other literals
```

In addition round brackets can be used for grouping.

## Tests & Code Style

For the backend, tests for every important feature exist, and are run by GitHub Actions on every commit.
Note that tests are run both on `sqlite` and `postgres`.

To be able to run the tests, you first need to install the development dependencies:

```
pip install -r requirements-dev.txt
```

Then you can run the tests with:

```bash
pytest
```

One non-feature related test is the CodeStyle test.
This enforces [PEP8](https://pep8.readthedocs.io)-compliance except for maximum line length.

Additionally, a test-only app exists with specific models only used during testing.
To manually enable for local development add `USE_TEST_APP = True` to `mhd/local_settings.py`.

## Adding A New Codec

### Backend

In `mhd_data/models/codecs` add a class (in its own file) extending the abstract class Codec and a line in `__init__.py`

### Frontend

In `frontend/src/codecs/impl` add a class extending the React class Codec. 

## Data Examples

### Z3Z Functions

After setting up the project (see Project Structure and Setup), run the following two commands (to create the collection and to insert data).

```bash
python manage.py upsert_collection mhd_data/tests/res/z3z_collection.json
python manage.py insert_data mhd_data/tests/res/z3z_data.json --collection "z3zFunctions" -f "f0,f1,f2,invertible" -p mhd_data/tests/res/z3z_provenance.json
```

Here is an example of a query URL:

```
http://localhost:8000/api/query/z3zFunctions/?properties=f1,f2&filter=f1%3Df2%26%26f2%3C1
```

### Additive Bases

To import a second collection for testing, use:

```bash
python manage.py upsert_collection mhd_data/tests/res/ab_collection.json
python manage.py insert_data mhd_data/tests/res/ab_data.json --collection "ab" -f "basis,k,n,S,R" -p mhd_data/tests/res/ab_provenance.json
```



### Using (Materialized) Views

With large collections, performance can be slow.
To enhance performance we can make use of (materialized) views.
Basic support for views is implemented in the [mviews](mviews/) app.

Views work on both sqlite and postgres.
Materialized views are only supported with postgres.
Furthermore, because of limitations of 'CREATE VIEW' statement in sqlite, creation of views requires two SQL queries and can be slow for collections with a large number of properties.

Views are enabled and disabled on a per-collection basis.
Use the 'collection_view' command for this.
When available, it will automatically use materialized views.

```bash
# check if a view is enabled for a collection
python manage.py collection_view --info collection_slug

# to enable a view and refresh it in the database
python manage.py collection_view --sync --enable collection_slug

# to disable a view and DROP it from the database
python manage.py collection_view  --disable collection_slug
```

Views are not automatically removed when a collection is deleted.
Furthermore, if you add more properties to a collection, you will have to re-create the view.
This can be achieved by disabling, syncing, re-enabling and then syncing it:

```bash
python manage.py collection_view --disable collection_slug
python manage.py collection_view --sync --enable collection_slug
```

**WARNING**: When views are not syncronized, it is possible for query results to give invalid results or break entirely. 
In particular, when updating or amending a collection, it is recommended to first disable the view for the respective collection and re-enabling it once the update is complete.

## Deployment

![Docker Image](https://github.com/MathHubInfo/mhd/actions/workflows/docker/badge.svg)

Deployment only makes sense in conjunction with the frontend.
To achieve the url structure expected by the frontend, we need to serve the backend and frontend on the same domain.

To achieve this we

- build the NextJS Frontend
- prepare a Django Deployment using [uwsgi](http://projects.unbit.it/uwsgi).
- setup a [supervisord](https://supervisord.readthedocs.io/en/latest/) configuration to run both at the same time

The uwsgi config used to achieve this can be found in [docker/uwsgi.ini](docker/uwsgi.ini).
For every request it switches appropriately between:

- sending a static file (as collected by `python manage.py collectstatic`)
- sending the response to the backend

Next, the NextJS frontend is configured to proxy requests for the `/api/` route to the backend.

Finally, a supervisord instance is configured to run both the backend and frontend at the same time.
The config can be found in [docker/supervisor.conf](docker/supervisor.conf).

This repository contains a `Dockerfile` to enable deployment using [Docker](https://www.docker.com/).
It listens on port 80 and uses an sqlite database stored in a volume mounted at `/data/`.
GitHub Actions build a new image on every commit that is available under [ghcr.io/mathhubinfo/mhd](https://github.com/mathhubinfo/mhd/pkgs/container/mhd).
It can be run with a command like the following:

```
   docker run -e DJANGO_SECRET_KEY=totally_secret_key_here -p 8000:80 -v data:/data/ ghcr.io/mathhubinfo/mhd:latest
```

## License

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a [copy of the GNU General Public License](LICENSE.md)
along with this program. If not, see <https://www.gnu.org/licenses/>.
