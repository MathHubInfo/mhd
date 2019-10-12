This folder contains a sample docker-compose file for deploying `mhd` with a postgres instance via docker-compose. 
To use it, run:

```bash
# copy over the default config file
cp .env.sample .env
# edit .env with your favorite editor
your-editor-here .env
# start it up
docker-compose up -d
```

To run any manage.py commands (like e.g. creating a superuser or inserting data), you can start a shell inside the container. 
To achieve this, run:

```bash
docker-compose exec mhd /bin/sh
```