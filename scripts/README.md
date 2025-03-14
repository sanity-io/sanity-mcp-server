# GitHub CI Debugging Tools

This directory contains scripts to help debug and simulate GitHub Actions workflows locally.

## Debug GitHub CI Locally

The `debug-github-ci.sh` script allows you to run GitHub Actions workflows locally using the [act](https://github.com/nektos/act) tool. This is helpful to test how your code will behave in the GitHub Actions environment before pushing to the repository.

### Prerequisites

1. Install [act](https://github.com/nektos/act):
   ```bash
   # macOS with Homebrew
   brew install act
   
   # Linux/macOS with bash
   curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
   ```

2. Make sure you have Docker running on your machine

3. Ensure your `.env` file contains all necessary environment variables (same ones that exist as secrets in GitHub)

### Usage

You can run the script directly:

```bash
./scripts/debug-github-ci.sh [options]
```

Or use one of the npm scripts:

```bash
# Run all integration tests (default job)
npm run debug-github-ci

# Run specific jobs
npm run debug-github-ci:integration  # All integration tests
npm run debug-github-ci:lint         # Linting checks
npm run debug-github-ci:unit         # Unit tests
```

### Options

- `-j, --job JOB` - Specify the job to run (default: integration-tests)
- `-e, --env FILE` - Specify the environment file (default: .env)
- `-p, --pull` - Pull Docker images before running
- `-v, --verbose` - Enable verbose output from act
- `-h, --help` - Display help message

### Available Jobs

- `integration-tests` - Run all integration tests (critical, standard, and extended)
- `critical-integration-tests` - Run only critical integration tests
- `standard-integration-tests` - Run only standard integration tests
- `lint` - Run linting checks
- `unit-tests` - Run unit tests

### Examples

```bash
# Run all integration tests with verbose output
./scripts/debug-github-ci.sh --verbose

# Run linting checks with a custom env file
./scripts/debug-github-ci.sh --job lint --env .env.test

# Run unit tests and pull the latest Docker images
./scripts/debug-github-ci.sh --job unit-tests --pull
```

### Troubleshooting

If you encounter issues:

1. Make sure Docker is running
2. Verify your `.env` file contains all required variables
3. Try running with `--verbose` flag for more detailed output
4. Pull the latest Docker images with `--pull` flag
5. Check the [act documentation](https://github.com/nektos/act) for more information 