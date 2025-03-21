#!/bin/bash

# debug-github-ci.sh
# Script to run GitHub Actions workflows locally using act

# Ensure the script fails on any error
set -e

# Default values
DEFAULT_JOB="critical-integration-tests"
ENV_FILE=".env"
PLATFORM=""
PULL=false
VERBOSE=false
ARCH_FLAG="--container-architecture linux/amd64"

print_help() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --help                     Display this help message"
    echo "  --job JOB_NAME             Specify the GitHub Actions job to run (default: critical-integration-tests)"
    echo "  --platform PLATFORM        Specify the platform (e.g., ubuntu-latest)"
    echo "  --env-file FILE            Specify the environment file (default: .env)"
    echo "  --pull                     Pull the latest Docker image"
    echo "  --verbose                  Display verbose output"
    echo ""
    echo "Available jobs:"
    echo "  integration-tests          Run all integration tests (critical and standard sequentially)"
    echo "  critical-integration-tests Run only critical integration tests"
    echo "  standard-integration-tests Run only standard integration tests"
    echo "  unit-tests                 Run unit tests"
    echo "  lint                       Run linting"
    echo "  quality-info               Run quality information"
    echo ""
    echo "Example: $0 --job unit-tests --env-file .env.test"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help)
            print_help
            exit 0
            ;;
        --job)
            JOB="$2"
            shift
            shift
            ;;
        --platform)
            PLATFORM="--platform $2"
            shift
            shift
            ;;
        --env-file)
            ENV_FILE="$2"
            shift
            shift
            ;;
        --pull)
            PULL=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            print_help
            exit 1
            ;;
    esac
done

# Set default job if not specified
if [ -z "$JOB" ]; then
    JOB="$DEFAULT_JOB"
fi

# Set pull option
if [ "$PULL" = true ]; then
    PULL_OPTION="--pull"
else
    PULL_OPTION=""
fi

# Set verbose option
if [ "$VERBOSE" = true ]; then
    VERBOSE_OPTION="-v"
else
    VERBOSE_OPTION=""
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Handle the special case for running all integration tests
if [ "$JOB" = "integration-tests" ]; then
    echo "Running all integration tests locally with environment from '$ENV_FILE'..."
    echo "This simulates how integration tests will run in GitHub Actions CI."
    echo ""
    echo "Step 1/2: Running critical integration tests..."
    
    act -j critical-integration-tests --env-file "$ENV_FILE" $PLATFORM $PULL_OPTION $VERBOSE_OPTION $ARCH_FLAG
    CRITICAL_RESULT=$?
    
    if [ $CRITICAL_RESULT -ne 0 ]; then
        echo "❌ Critical integration tests failed. Aborting."
        exit $CRITICAL_RESULT
    fi
    
    echo ""
    echo "Step 2/2: Running standard integration tests..."
    
    act -j standard-integration-tests --env-file "$ENV_FILE" $PLATFORM $PULL_OPTION $VERBOSE_OPTION $ARCH_FLAG
    STANDARD_RESULT=$?
    
    if [ $STANDARD_RESULT -ne 0 ]; then
        echo "❌ Standard integration tests failed."
        exit $STANDARD_RESULT
    fi
    
    echo ""
    echo "✅ Success! All integration tests completed successfully."
else
    echo "Running GitHub Action job '$JOB' locally with environment from '$ENV_FILE'..."
    echo "This simulates how the job will run in GitHub Actions CI."
    echo ""
    
    act -j "$JOB" --env-file "$ENV_FILE" $PLATFORM $PULL_OPTION $VERBOSE_OPTION $ARCH_FLAG
    JOB_RESULT=$?
    
    if [ $JOB_RESULT -ne 0 ]; then
        echo "❌ The job '$JOB' failed."
        exit $JOB_RESULT
    else
        echo ""
        echo "✅ Success! The job '$JOB' completed successfully."
    fi
fi 