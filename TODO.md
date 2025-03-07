# TODO

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
   - Increase coverage for low-coverage files, especially:
     - src/controllers/projects.ts (1.47% covered)
     - src/utils/portableText.ts (3.22% covered)  
     - src/index.ts (0% covered)
     - src/controllers/actions.ts (21.99% covered)
     - src/tools/contextTools.ts (23.61% covered)

4. **Address code complexity and duplication**
   - Refactor the applyPatchOperations function in documentHelpers.ts to reduce complexity (currently 25, limit is 15)
   - Extract duplicate code patterns across files into shared utility functions
   - Create shared parameter validation functions for common parameter patterns

## Nice to Have

1. **Documentation improvements**
   - Add more examples for each tool
   - Better describe parameters and return values
