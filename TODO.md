# TODO

- Run a code smell test on the repo and see what we should refactor. The huge tools.js file is a good candidate for refactoring. If we do that the new files should be paired 1:1 with the controllers that they describe.

- Don't list all of release content in the initialContext
- Get more coverage on the integration tests for other workflows

## Code Quality Improvements (Prioritized)

### High Impact, Low Effort
- Break down complex functions into smaller helper functions:
  - Extract smaller functions from `modifyDocuments` in `controllers/mutate.ts`
  - ✅ Refactor `editDocument` in `controllers/actions.ts` (cognitive complexity: 30)
  - ✅ Simplify `createDocumentVersion` in `controllers/actions.ts` (cognitive complexity: 20)
- ✅ Extract repeated patterns in `actions.ts` to shared utility functions
- Add constants for commonly duplicated string literals in test files

### Medium Impact, Low Effort
- Replace `any` types with more specific types in core controller files
  - Focus on files with highest usage in: `controllers/actions.ts` and `controllers/mutate.ts`
- Add unit tests for the simplest untested functions in `projects.ts`
- Use the new `documentHelpers.ts` utility functions in other controller files

### Next Steps
- Add unit tests for the new helper functions in `documentHelpers.ts`
- Improve error handling with the new `createErrorResponse` helper
- Consider adding more specific TypeScript interfaces for Sanity document types

## Done
- ✅ Integration test for release document workflow
- ✅ Fix TypeScript configuration for test files
- ✅ Add pre-release hook for integration tests
- ✅ Add pre-commit hook for running integration tests and type checking
- ✅ Add integration test for array parameter deserialization
- ✅ Check that we don't have errors serializing arrays over the protocol
- ✅ Fix TypeScript errors in test files
- ✅ Fix the schema command for single types
- ✅ Update single document endpoints with pluralized versions - check if union types actually work (addDocumentToRelease is a good one, also getDocument). First see if we want to have separate verbs for single and plural versions or use union types. API design question.
- ✅ Remove `modifyPortableTextField` functionality (complex implementation with high cognitive complexity)
- ✅ Refactor `editDocument` and `createDocumentVersion` in `controllers/actions.ts`
- ✅ Extract repeated patterns in `actions.ts` to shared utility functions
