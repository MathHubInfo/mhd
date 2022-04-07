# MHD Frontend

Website frontend code, a standard [NextJS](https://nextjs.org/) setup. 

## Installation

We use [yarn](https://yarnpkg.com/) to manage dependencies. 
To install dependencies, clone this repository and then run

```
yarn install
```

## Structure

Frontend routes can be found under `src/pages/` in standard NextJS fashion.
These are:

- `/`, `/home/[no]`: an overview page of all existing collections
- `/about/`: a generic about page
- `/debug/`: a debug page (development mode only)
- `/collection/[slug]`: a search page for the given collection if it exists, an error page otherwise
- `/collection/[slug]/about`: an info page about a specific collection
- `/item/[slug]/[uuid]`: a details page for the specific item

If furthermore expects the backend routes to be available:

- `/api/`: proxied to the backend (assumed to be running at `127.0.0.1:8000`) for api requests
- `/api/admin/`: the admin page (also proxied to the backend)

From a user perspective the frontend and backend are served under the same url. 

## Development

Thus to start a complete development environment (with support for auto-reloading) we first start the backend on localhost:8000. 
This can be achieve by something like `python manage.py runserver` (see [Backend README](../README.md#Development) for details). 

In parallel, we can then start the react development server with:

```
yarn dev
```

By default, this server listens on localhost:3000. 

## Deployment

See [Backend Deployment](../README.md#Deployment). 
