# GitHub CI Debugging Tools

This directory contains scripts and tools to help debug and simulate GitHub Actions workflows locally.

## Overview

The main script `debug-github-ci.sh` allows you to run GitHub Actions workflows locally using [act](https://github.com/nektos/act), which simulates the GitHub Actions environment on your local machine. This is particularly useful for debugging CI issues without having to commit and push changes to GitHub.

## Prerequisites

- [Docker](https://www.docker.com/) must be installed and running
- [act](https://github.com/nektos/act) must be installed (run `brew install act` on macOS)
- A `.env` file in the project root with the necessary environment variables

## Usage

### Using npm scripts

The simplest way to use these debugging tools is through the npm scripts:

```bash
# Run all integration tests (both critical and standard)
npm run debug-github-ci:integration

# Run only critical integration tests
npm run debug-github-ci:critical

# Run only standard integration tests
npm run debug-github-ci:standard

# Run unit tests
npm run debug-github-ci:unit

# Run linting
npm run debug-github-ci:lint
```

### Using the script directly

For more control, you can use the script directly:

```bash
./scripts/debug-github-ci.sh --job JOB_NAME [options]
```

#### Options

- `--help`: Display help message
- `--job JOB_NAME`: Specify the GitHub Actions job to run (default: critical-integration-tests)
- `--platform PLATFORM`: Specify the platform (e.g., ubuntu-latest)
- `--env-file FILE`: Specify the environment file (default: .env)
- `--pull`: Pull the latest Docker image
- `--verbose`: Display verbose output

#### Available Jobs

- `integration-tests`: Run all integration tests (critical and standard sequentially)
- `critical-integration-tests`: Run only critical integration tests
- `standard-integration-tests`: Run only standard integration tests
- `unit-tests`: Run unit tests
- `lint`: Run linting
- `quality-info`: Run quality information

## Examples

Run critical integration tests with verbose output:
```bash
./scripts/debug-github-ci.sh --job critical-integration-tests --verbose
```

Run linting with a custom environment file:
```bash
./scripts/debug-github-ci.sh --job lint --env-file .env.local
```

## Troubleshooting

### M-series Mac Architecture Issues

If you're using an Apple M-series chip (M1, M2, etc.), you may encounter architecture-related issues. The script automatically adds the `--container-architecture linux/amd64` flag to handle this, but you might need to ensure Docker Desktop is configured to support this emulation.

### Docker Not Running

Ensure Docker is running before executing the script. The script will check for this and display an error if Docker is not available.

### Job Not Found

Make sure the job you're trying to run exists in the GitHub Actions workflow files. You can list available jobs with `act --list`.

### Environment Variables

The script uses the `.env` file in the project root by default. Ensure this file contains all the necessary environment variables required by your tests. 