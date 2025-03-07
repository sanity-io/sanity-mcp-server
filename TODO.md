# TODO

- Run a code smell test on the repo and see what we should refactor. The huge tools.js file is a good candidate for refactoring. If we do that the new files should be paired 1:1 with the controllers that they describe.

- Don't list all of release content in the initialContext - just the names
- Get more coverage on the integration tests for other workflows

## Code Quality Improvements (Prioritized)

1. ✅ Extract smaller functions from editDocument in controllers/actions.ts
2. ✅ Extract smaller functions from createDocumentVersion in controllers/actions.ts
3. ✅ Extract smaller functions from modifyDocuments in controllers/mutate.ts
4. ✅ Reduce complexity in controllers/releases.ts, focusing on addDocumentToRelease and removeDocumentFromRelease
5. ✅ Reduce complexity in controllers/actions.ts, focusing on createDocument and deleteDocument
6. ✅ Reduce complexity in controllers/releases.ts for createRelease function
7. ✅ Add unit tests for utility functions in documentHelpers.ts

8. 🔄 Replace `any` types with more specific types across core controller files
9. 🔄 Reduce complexity in embeddings.ts, particularly in semanticSearch function

10. Add constants for commonly duplicated string literals (especially in test files)
11. Refactor remaining functions with high cognitive complexity, especially in:
    - controllers/embeddings.ts (listEmbeddingsIndices, semanticSearch)
    - controllers/groq.ts
    - controllers/schema.ts (checkForReferences)
    - utils/documentHelpers.ts (applyPatchOperations)
    - utils/portableText.ts

## Tooling & Process Improvements

- Set up ESLint + Prettier with TypeScript (including complexity analysis rules)
- Add GitHub Action for linting
- Improve CI pipeline
- Add code coverage reporting

## Error Handling

- Extract error handling to a reusable createErrorResponse function (for consistency)
- Apply this across controllers

## Technical Debt

- Move from TS-Node to a bundled dist
- Refactor tests to be more maintaneous and use common setup functions
- Evaluate moving to OpenAPI spec for route definition

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
- ✅ Add unit tests for utility functions in documentHelpers.ts
