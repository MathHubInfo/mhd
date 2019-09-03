# MathDataHub Django

[![Build Status](https://travis-ci.org/MathHubInfo/mdh_django.svg?branch=master)](https://travis-ci.org/MathHubInfo/mdh_django). 

MathDataHub is a system to provide universal infrastructure for Mathematical Data. 
See the paper [Towards a Unified Mathematical Data Infrastructure: Database and Interface Generation](https://kwarc.info/people/mkohlhase/papers/cicm19-MDH.pdf)
for more details. 

This repository contains the MathDataHub Implementation consisting of a [Django](https://www.djangoproject.com/)-powered backend and [create-react-app](https://github.com/facebook/create-react-app)-powered frontend. 

This README contains backend information, the frontend can be found in the `frontend/` sub-folder. 
See [frontend/README.md](frontend/README.md) for more details. 

__This code and in particular the documentation are still a work-in-progress__

## Code Structure

The top-level structure of this repository consists of a standard [Django](https://www.djangoproject.com/) project. 
There are six apps:

- `mdh`: The main entry point. Contains a `utils/` package used by other apps. 
- `mdh_schema`: Stores schema of MDH data. Home of the `Collection` and `Property` tables. 
- `mdh_data`: Stores all concrete MDH data. Home of the `Item` and all `Codec` tables. 
- `mdh_provenance`: Stores meta-information about MDH data. Home of the `Provenance` tables. 
- `mdh_test`: Test-only app for specific test models
- `mddl_catalog`: Catalog of specific MDDL items, currently only codecs. 

Currently, MDH depends only on Django and [Django Rest Framework](https://www.django-rest-framework.org/).
To install the dependencies, first make sure you have a recent enough version of Python installed on your system. 
You can then install the requirements inside a new [venv](https://docs.python.org/3/library/venv.html):

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Development

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
MDH_LOG_QUERIES=1 python manage.py runserver
```

To additionally customize development settings, create a file named `mdh/local_settings.py`. 
This will be automatically loaded by mdh during configuration time. 

## Database structure

*TODO: Image of layout and explanation*

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
- `/api/schema/collections/` -- List all collections
    - `/api/schema/collection/$slug` -- Get a specific collection
- `/api/schema/codecs/` -- Lists all codecs
    - `/api/schema/codecs/$name` -- Get a specific codec
- `/admin/` -- Admin interface
    - `/admin/static/` -- staticfiles used for the admin interface
- `/` and `/$collection/` -- Matches frontend routes and returns appropriate headers for nginx (see below). 

### Main Querying Syntax

To Query an item, the `/query/$collection/` API can be used. 
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

For the backend, tests for every important feature exist, and are run by Travis CI on every commit. 
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
To manually enable for local development add `USE_TEST_APP = True` to `mdh/local_settings.py`. 

## Data Examples

### Z3Z Functions

After setting up the project (see Project Structure and Setup), run the following two commands (to create the collection and to insert data).

```bash
python manage.py upsert_collection mdh_data/tests/res/z3z_collection.json
python manage.py insert_data mdh_data/tests/res/z3z_data.json -c "z3zFunctions" -f "f0,f1,f2,invertible" -p mdh_data/tests/res/z3z_provenance.json
```
Here is an example of a query URL:

```
http://localhost:8000/api/query/z3zFunctions/?properties=f1,f2&filter=f1%3Df2%26%26f2%3C1
```

## Deployment

Deployment only makes sense in conjunction with the frontend. 
To achieve the url structure expected by the frontend, we need to serve the backend and frontend on the same domain. 

To achieve this we
- generate a static build of the frontend repository; 
- collect all the static files needed by the backend; and
- start the Django app using [gunicorn](https://gunicorn.org/).

We then use [NGINX](https://www.nginx.com/) to delegate appropriatly. 

The nginx config used to achieve this can be found in [docker/mdh.conf](docker/mdh.conf). 
In addition to the procedure described here, it also uses an [X-Accel-Redirect](https://www.nginx.com/resources/wiki/start/topics/examples/x-accel/) returned by the backend to detect if the `/$collection/` url implemented by the frontend should return an HTTP Status of 404 or not. 


This repository contains a `Dockerfile` to enable deployment using [Docker](https://www.docker.com/). 
It listens on port 80 and uses an sqlite database stored in a volume mounted at `/data/`.
A [DockerHub](https://hub.docker.com/) automated build is available under [mathhub/mdh](https://hub.docker.com/r/mathhub/mdh) and can be run with a command like the following:


```
   docker run -e DJANGO_SECRET_KEY=totally_secret_key_here -p 8000:80 -v data:/data/ mathhub/mdh
```


## License

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a [copy of the GNU General Public License](LICENSE.md)
along with this program.  If not, see <https://www.gnu.org/licenses/>.

