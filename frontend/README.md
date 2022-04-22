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

- `/home/[no]`: an overview page of all existing collections
- `/about/`: a generic about page
- `/debug/`: a debug page (development mode only)
- `/collection/[slug]`: a search page for the given collection if it exists, an error page otherwise
- `/collection/[slug]/provenance`: an provenance page about a specific collection
- `/item/[slug]/[uuid]`: a details page for the specific item

The `/` page by default redirects to `/home/1`, to show the first page of collections.

If furthermore expects the backend routes to be available:

- `/api/`: proxied to the backend (assumed to be running at `127.0.0.1:8000`) for api requests
- `/api/admin/`: the admin page (also proxied to the backend)

From a user perspective the frontend and backend are served under the same url. 

## Configuration

The frontend makes uses of [NextJS Environment Variables](https://nextjs.org/docs/basic-features/environment-variables#loading-environment-variables).
The variables, and default values, are documented in the `.env` file.
Local settings should be stored in `.env.local`.

### Single Collection Mode

A special frontend setting is the so-called __Single Collection Mode__. 
This can be configured in `.env.local` and makes the frontend appear as if it only knows about a single collection.
It can be configured by providing the slug of the collection in `.env` or `.env.local`.
The URLS then change as follows:

- `/home/[no]`: not supported
- `/about/`: a generic about page
- `/debug/`: a debug page (development mode only)
- `/`: a search page for the selected collection
- `/provenance`: provenance page about the selected collection
- `/item/[uuid]`: a details page about the selected item

The API routes remain unchanged.

## Development

Thus to start a complete development environment (with support for auto-reloading) we first start the backend on localhost:8000. 
This can be achieve by something like `python manage.py runserver` (see [Backend README](../README.md#Development) for details). 

In parallel, we can then start the react development server with:

```
yarn dev
```

By default, this server listens on localhost:3000. 

Additionally, we employ [`@next/bundle-analyzer`](https://www.npmjs.com/package/@next/bundle-analyzer) to debug bundle sizes.
To view the ouput, run the builder with `ANALYZE` set to true:

```bash
ANALZYE=true yarn dev
```

## Deployment

See [Backend Deployment](../README.md#Deployment). 
