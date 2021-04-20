# MHD Frontend

Website frontend code, a standard [create-react-app](https://github.com/facebook/create-react-app) setup. 

## Installation

We use [yarn](https://yarnpkg.com/) to manage dependencies. 
To install dependencies, clone this repository and then run

```
yarn install
```

## Structure

The frontend reacts to the following routes:

- `/`: an overview page of all existing collections
- `/about/`: a generic about page
- `/$collection/`: a search page for the given collection if it exists, an error page otherwise

If furthermore expects the backend routes to be available:

- `/api/`: for all api requests
- `/api/admin/`: if admin login is enabled

This implies that frontend and backend are served under the same url. 

## Development

We [proxy requests in development](https://create-react-app.dev/docs/proxying-api-requests-in-development) to achieve this strucuture.
In particular, we configure a proxy on the url `/api/` and `/admin/` in [src/setupProxy.js](./src/setupProxy.js).

Thus to start a complete development environment (with support for auto-reloading) we first start the backend on localhost:8000. 
This can be achieve by something like `python manage.py runserver` (see [Backend README](../README.md#Development) for details). 

In parallel, we can then start the react development server with:

```
yarn start
```

By default, this server listens on localhost:3000. 

## Deployment

See [Backend Deployment](../README.md#Deployment). 
