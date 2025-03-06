# TODO

- Make sure every call that takes a single document ID also can take an array of IDs
- Run a code smell test on the repo and see what we should refactor. The huge tools.js file is a good candidate for refactoring. If we do that the new files should be paired 1:1 with the controllers that they describe.

- Don't list all of release content in the initialContext
- Get more coverage on the integration tests for other workflows


## Done
- ✅ Integration test for release document workflow
- ✅ Fix TypeScript configuration for test files
- ✅ Add pre-release hook for integration tests
- ✅ Add pre-commit hook for running integration tests and type checking

## Pending
- Fix TypeScript errors in test files
- Update document endpoints to use pluralized naming conventions
- Add more integration tests for other workflows
- Add GitHub Actions for CI/CD