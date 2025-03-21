# Unit Test Organization

Unit tests are organized by source directory:

- `controllers/` - Tests for individual controller functions
- `tools/` - Tests for tool functionality
- `utils/` - Tests for utility modules

Unit tests should:

1. Be fast (typically < 200ms per test)
2. Have no external dependencies (databases, APIs, etc.)
3. Test individual functions and modules in isolation
4. Use mocks for external dependencies

These tests are run as part of the pre-commit hook, so they should be quick and reliable.
