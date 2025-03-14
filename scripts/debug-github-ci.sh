#!/bin/bash

# debug-github-ci.sh
# Script to run GitHub Actions workflows locally using act

# Ensure the script fails on any error
set -e

# Default values
JOB="integration-tests"
ENV_FILE=".env"
PLATFORM="--platform ubuntu-latest=node:18-buster"

# Display help information
show_help() {
  echo "Debug GitHub CI locally using act"
  echo ""
  echo "Usage: ./scripts/debug-github-ci.sh [options]"
  echo ""
  echo "Options:"
  echo "  -j, --job JOB         Specify the job to run (default: integration-tests)"
  echo "  -e, --env FILE        Specify the environment file (default: .env)"
  echo "  -p, --pull            Pull Docker images before running"
  echo "  -v, --verbose         Enable verbose output from act"
  echo "  -h, --help            Display this help message"
  echo ""
  echo "Available jobs:"
  echo "  - integration-tests        Run all integration tests (critical, standard, and extended)"
  echo "  - critical-integration-tests"
  echo "  - standard-integration-tests"
  echo "  - lint"
  echo "  - unit-tests"
  echo ""
  echo "Example: ./scripts/debug-github-ci.sh --job integration-tests --verbose"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -j|--job)
      JOB="$2"
      shift
      shift
      ;;
    -e|--env)
      ENV_FILE="$2"
      shift
      shift
      ;;
    -p|--pull)
      PULL_OPTION="--pull"
      shift
      ;;
    -v|--verbose)
      VERBOSE_OPTION="--verbose"
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: Environment file '$ENV_FILE' not found."
  echo "Please create this file with your required environment variables."
  exit 1
fi

# Check if act is installed
if ! command -v act &> /dev/null; then
  echo "Error: 'act' is not installed."
  echo "Please install it with 'brew install act' or visit https://github.com/nektos/act"
  exit 1
fi

# If running integration-tests, we need to create a custom workflow for act
if [ "$JOB" = "integration-tests" ]; then
  # Create a temporary workflow file
  TEMP_WORKFLOW_FILE=$(mktemp)
  cat > "$TEMP_WORKFLOW_FILE" << EOF
name: Run All Integration Tests

on:
  workflow_dispatch:

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
      - name: Clean install
        run: |
          rm -rf node_modules package-lock.json
          npm install
      - run: npm run test:integration
EOF

  # Run the GitHub Action workflow locally with the custom workflow file
  echo "Running all integration tests locally with environment from '$ENV_FILE'..."
  echo "This simulates how all integration tests will run in GitHub Actions CI."
  echo ""

  # Execute act with the custom workflow
  act -j integration-tests -W "$TEMP_WORKFLOW_FILE" --env-file "$ENV_FILE" $PLATFORM $PULL_OPTION $VERBOSE_OPTION
  RESULT=$?

  # Clean up the temporary file
  rm "$TEMP_WORKFLOW_FILE"

  # Check if the execution was successful
  if [ $RESULT -eq 0 ]; then
    echo ""
    echo "✅ Success! All integration tests completed successfully."
  else
    echo ""
    echo "❌ Error! Integration tests failed. See above for details."
    exit 1
  fi
else
  # Run the GitHub Action workflow locally for a specific job
  echo "Running GitHub Action job '$JOB' locally with environment from '$ENV_FILE'..."
  echo "This simulates how the job will run in GitHub Actions CI."
  echo ""

  # Execute act with the specified options
  act -j "$JOB" --env-file "$ENV_FILE" $PLATFORM $PULL_OPTION $VERBOSE_OPTION

  # Check if the execution was successful
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! The job '$JOB' completed successfully."
  else
    echo ""
    echo "❌ Error! The job '$JOB' failed. See above for details."
    exit 1
  fi
fi 