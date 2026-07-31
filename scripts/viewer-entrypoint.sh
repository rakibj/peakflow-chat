#!/bin/bash

cd apps/viewer;
node  -e "const { configureRuntimeEnv } = require('next-runtime-env/build/configure'); configureRuntimeEnv();"
cd ../..;

HOSTNAME=0.0.0.0 PORT=${PORT:-3000} NODE_OPTIONS="--no-node-snapshot --max-old-space-size=400" node apps/viewer/server.js;