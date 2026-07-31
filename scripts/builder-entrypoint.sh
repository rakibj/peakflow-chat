#!/bin/bash

cd apps/builder;
node  -e "const { configureRuntimeEnv } = require('next-runtime-env/build/configure'); configureRuntimeEnv();"
cd ../..;

./node_modules/.bin/prisma migrate deploy --schema=packages/prisma/postgresql/schema.prisma --config=packages/prisma/prisma.config.ts;

HOSTNAME=0.0.0.0 PORT=${PORT:-3000} node apps/builder/server.js;
