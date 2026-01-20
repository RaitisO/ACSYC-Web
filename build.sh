#!/bin/bash
# Build script for Railway deployment
# Sets environment variables and builds the Vue app

export VITE_API_BASE_URL=${VITE_API_BASE_URL:-"https://acsyc-server-production.up.railway.app/api"}
export NODE_ENV=production

echo "Building with API URL: $VITE_API_BASE_URL"
npm run build-only
