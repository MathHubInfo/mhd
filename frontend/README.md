# MDH Frontend

Website fronted code, a standard [create-react-app](https://github.com/facebook/create-react-app) setup. 

## Installation

We use [yarn](https://yarnpkg.com/) to manage dependencies. 
To install dependencies, clone this repository and then run

```
yarn install
```

## Running

The frontend expects to be served on the same server as the backend api. 
In particular, it needs the following urls to be available:
- `/api/` (all API requests)
- `/admin/` (if desired, allow access to the admin page + static resources)
To achieve this during development, [proxy requests in development](https://create-react-app.dev/docs/proxying-api-requests-in-development). 

Hence [first start the backend](../README.md) on `http://localhost:8000` and then run:

```
yarn start
```

which will start the development server on port 3000.
