#!/bin/sh

# Get the new config files
echo "Checking configuration ..."
ls -alh /app/src/config

# Build (with caches still there)
echo "Running build ..."
yarn build

# and run a webserver
echo "Starting webserver"
http-server build -a 0.0.0.0 -p 8080