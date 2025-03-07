# TODO

## High Priority

1. **Unify type definitions across controllers and tools** (IN PROGRESS)
   - Current issue: Type definitions are duplicated between tools and controllers
   - Parameters sometimes marked as optional in tool definitions but required in implementation
   - Need to create shared interfaces and types that can be used consistently
   - Ensure the schema accurately reflects what's actually required in function calls
   - Consider using TypeScript's utility types to derive tool parameter schemas from controller function signatures
   
   ### Implementation Plan
   1. **Create shared interfaces in `src/types/sharedTypes.ts`** ✅
      - Define common parameter interfaces that both tools and controllers can use
      - Create utility types to transform controller function signatures into tool parameter types
      - Include proper JSDoc comments for all shared types
   
   2. **Update ToolDefinition interface in `src/types/tools.ts`** ✅
      - Replace generic `any` types with proper parameterized types
      - Create a type-safe handler function type that preserves parameter and return types
      - Example: `handler: <T extends SharedParams, R>(args: T) => Promise<R>`
   
   3. **Refactor tool definitions in tool provider files** (IN PROGRESS)
      - Update each tool definition to use the shared parameter interfaces
      - Replace `any` in handler functions with proper types
      - Ensure Zod schemas accurately reflect TypeScript types
      - Currently implemented for some mutation tools in `mutateTools.ts`
      - Next steps: Complete remaining tools in `mutateTools.ts` and then other tool providers
   
   4. **Ensure parameter consistency** (IN PROGRESS)
      - Audit all optional vs. required parameters between tools and controllers
      - Make sure optional parameters in tool definitions are truly optional in controllers
      - Add default values where appropriate
   
   5. **Create automated tests for type consistency** (PENDING)
      - Add type checking tests to ensure tools and controllers remain in sync
      - Test both TypeScript types and Zod schema validation

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
