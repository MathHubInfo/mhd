#!/bin/sh

rm -rf build/
yarn build
http-server build -a 0.0.0.0 -p 8080