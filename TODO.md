# TODO

- Comprehensive integration tests for mutations
- Don't list all of release content in the initialContext - just the names
- Get more coverage on the integration tests for other workflows
- ✅ Optimize testing strategy with categorized integration tests

## Code Quality Improvements (Prioritized)

1. ✅ Extract smaller functions from editDocument in controllers/actions.ts
2. ✅ Extract smaller functions from createDocumentVersion in controllers/actions.ts
3. ✅ Extract smaller functions from modifyDocuments in controllers/mutate.ts
4. ✅ Reduce complexity in controllers/releases.ts, focusing on addDocumentToRelease and removeDocumentFromRelease
5. ✅ Reduce complexity in controllers/actions.ts, focusing on createDocument and deleteDocument
6. ✅ Reduce complexity in controllers/releases.ts for createRelease function
7. ✅ Add unit tests for utility functions in documentHelpers.ts
8. ✅ Replace `any` types with more specific types across core controller files
9. ✅ Improve type safety across codebase, particularly for Sanity client operations
10. 🔄 Reduce complexity in embeddings.ts, particularly in semanticSearch function
11. 🆕 Take a more aggressive approach to type safety improvements (no backward compatibility needed):
    - Completely eliminate remaining `any` types in non-test code
    - Redesign function signatures for improved semantics and type safety
    - Refactor parameter orders to be more intuitive without concern for existing consumers
    - Remove conditional handling of test vs. production environments
    - Consider using stricter TypeScript compiler options
12. Add constants for commonly duplicated string literals (especially in test files)
13. Refactor remaining functions with high cognitive complexity, especially in:
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

- ✅ Extract error handling to a reusable createErrorResponse function (for consistency)
- ✅ Apply this across controllers

## Technical Debt

- Move from TS-Node to a bundled dist
- Refactor tests to be more maintaneous and use common setup functions
- Evaluate moving to OpenAPI spec for route definition
- ✅ Address TypeScript type conflicts with @sanity/client types

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

# TODO List for Sanity MCP Server

## High Priority

1. **Unify type definitions across controllers and tools**
   - Current issue: Type definitions are duplicated between tools and controllers
   - Parameters sometimes marked as optional in tool definitions but required in implementation
   - Need to create shared interfaces and types that can be used consistently
   - Ensure the schema accurately reflects what's actually required in function calls
   - Consider using TypeScript's utility types to derive tool parameter schemas from controller function signatures

## Medium Priority

1. **Improve error handling**
   - Add better error messages and consistent error format
   - Add validation for all parameters

2. **Update logger usage across all files**
   - Replace all remaining console.log/error calls with the central logger

3. **Improve test coverage**
   - Add more tests for edge cases
   - Fix integration tests for the MCP server

## Nice to Have

1. **Documentation improvements**
   - Add more examples for each tool
   - Better describe parameters and return values
