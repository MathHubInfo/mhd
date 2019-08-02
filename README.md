# MathDataHub Django

[![Build Status](https://travis-ci.org/MathHubInfo/mdh_django.svg?branch=master)](https://travis-ci.org/MathHubInfo/mdh_django)

This repository contains the MathDataHub (Django-powered) backend Implementation. 
__This code and in particular the documentation are still a work-in-progress__
__Warning: The data models are not yet stable, and migrations might be overwritten, do not rely on this for safe storage yet__

MathDataHub is a system to provide universal infrastructure for Mathematical Data. 
See the paper [Towards a Unified Mathematical Data Infrastructure: Database and Interface Generation](https://kwarc.info/people/mkohlhase/papers/cicm19-MDH.pdf)
for more details. 

## Project Structure and Setup

This repository is a consists of a standard [Django](https://www.djangoproject.com/) project. 
There are two apps:

- `mdh_django`: The main entry point app
- `mdh`: Main app implementing datasets and collecions

Currently, MDH depends only on Django and [Django Rest Framework](https://www.django-rest-framework.org/).
To install the dependencies, first make sure you have a recent enough version of Python installed on your system. 
You can then install the requirements inside a new [venv](https://docs.python.org/3/library/venv.html):

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

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

## Database structure

*TODO: Image of layout and explanation*


## Tests

Basic tests exist, and are run by Travis CI on every commit. 

To locally run the tests, use:

```bash
python manage.py tests
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

