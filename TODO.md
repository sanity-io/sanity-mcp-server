# TODO

- Fix the schema command for single types
- Update single document endpoints with pluralized versions - check if union types actually work (addDocumentToRelease is a good one, also getDocument). First see if we want to have separate verbs for single and plural versions or use union types. API design question.

- Run a code smell test on the repo and see what we should refactor. The huge tools.js file is a good candidate for refactoring. If we do that the new files should be paired 1:1 with the controllers that they describe.

- Don't list all of release content in the initialContext
- Get more coverage on the integration tests for other workflows


## Done
- ✅ Integration test for release document workflow
- ✅ Fix TypeScript configuration for test files
- ✅ Add pre-release hook for integration tests
- ✅ Add pre-commit hook for running integration tests and type checking
- ✅ Add integration test for array parameter deserialization
- ✅ Check that we don't have errors serializing arrays over the protocol
- ✅ Fix TypeScript errors in test files

