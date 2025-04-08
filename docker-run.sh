#!/bin/sh
set -e

# Set default environment variables if not provided
export PORT=${PORT:-43010}
export SECRET_PATH_SEGMENT=${SECRET_PATH_SEGMENT:-""}
export SSE_PATH=${SSE_PATH:-/sse}
export MESSAGE_PATH=${MESSAGE_PATH:-/message}

# Check if security token is provided
if [ -z "$SECRET_PATH_SEGMENT" ]; then
  echo "ERROR: SECRET_PATH_SEGMENT environment variable is not set."
  echo "Please set a secret path token for security using: export SECRET_PATH_SEGMENT=yoursecrettoken"
  echo "When deploying to Fly.io, use: fly secrets set SECRET_PATH_SEGMENT=yoursecrettoken"
  exit 1
fi

# Prepend secret path to the endpoints
export SSE_PATH="/${SECRET_PATH_SEGMENT}${SSE_PATH}"
export MESSAGE_PATH="/${SECRET_PATH_SEGMENT}${MESSAGE_PATH}"

# Determine base URL for the application
if [ -n "$FLY_APP_NAME" ]; then
  # Running on Fly.io
  export BASE_URL="https://${FLY_APP_NAME}.fly.dev"
else
  # Running locally
  export BASE_URL="http://localhost:${PORT}"
fi

echo "Starting MCP Server with:"
echo "  BASE_URL: ${BASE_URL}"
echo "  PORT: ${PORT}"
echo "  SSE_PATH: ${SSE_PATH}"
echo "  MESSAGE_PATH: ${MESSAGE_PATH}"

# Start the supergateway with the appropriate configuration
exec npx -y supergateway \
  --stdio "node build/index.js" \
  --port ${PORT} \
  --host 0.0.0.0 \
  --baseUrl "${BASE_URL}" \
  --ssePath ${SSE_PATH} \
  --messagePath ${MESSAGE_PATH} 