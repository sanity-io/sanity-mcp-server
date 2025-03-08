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
      - ✅ MutateTools: Created shared interfaces and updated tool definitions
      - ✅ SchemaTools: Created shared interfaces for schema operations
      - ✅ GroqTools: Created shared interfaces for GROQ query operations
      - ✅ ActionsTools: Created shared interfaces for Sanity actions
      - ✅ ContextTools: Created shared interfaces for context operations
      - ✅ ProjectsTools: Created shared interfaces for project operations
      - ✅ ReleasesTools: Created shared interfaces for release management
      - ✅ EmbeddingsTools: Created shared interfaces for embeddings operations
   
   4. **Ensure parameter consistency** ✅
      - ✅ Added proper handling of optional projectId and dataset parameters
      - ✅ Implemented consistent fallbacks to config values
      - ✅ Added type conversion for parameters that need it (e.g., string to string[])
      - ✅ Add validation for required parameters
      - ✅ Add default values where appropriate
   
   5. **Create automated tests for type consistency** ✅
      - ✅ Create a test module that verifies type compatibility between tools and controllers
      - ✅ Add specific tests for each tool provider to ensure schema validation works correctly
      - ✅ Test edge cases like missing optional parameters and type conversions

## Medium Priority

1. **Improve error handling**
   - Add better error messages and consistent error format
   - ✅ Add validation for all parameters

2. **Update logger usage across all files**
   - Replace all remaining console.log/error calls with the central logger

3. **Fix TypeScript type errors related to verbatimModuleSyntax**
   - Fix "Property comes from an index signature, so it must be accessed with ['prop']" errors
   - Fix "is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled" errors
   - Ensure proper usage of bracket notation for index signatures
   - Convert type imports to use the `type` keyword
   - Prioritize fixing errors in critical controllers like actions.ts, groq.ts, and mutate.ts

   ### TypeScript Error Fix Plan

   #### Overview
   This plan outlines the approach for fixing TypeScript errors in the Sanity MCP Server codebase. The errors are primarily related to two issues:

   1. **Type-only imports**: With `verbatimModuleSyntax` enabled, types must be imported using the `type` keyword.
   2. **Index signature access**: Properties from index signatures must be accessed with bracket notation (`['prop']`) instead of dot notation (`.prop`).

   #### Files to Fix

   ##### High Priority Controllers
   1. ✅ `src/controllers/actions.ts` - FIXED
   2. ✅ `src/controllers/groq.ts` - FIXED
   3. ✅ `src/controllers/mutate.ts` - FIXED
   4. ✅ `src/controllers/embeddings.ts` - FIXED
   5. ✅ `src/controllers/releases.ts` - FIXED

   ##### Tools
   1. ✅ `src/tools/mutateTools.ts` - FIXED
   2. ✅ `src/tools/contextTools.ts` - FIXED
   3. `src/tools/embeddingsTools.ts` - 9 errors
   4. `src/tools/releasesTools.ts` - 11 errors
   5. `src/tools/projectsTools.ts` - 7 errors
   6. `src/tools/schemaTools.ts` - 7 errors
   7. `src/tools/groqTools.ts` - 6 errors
   8. `src/tools/actionsTools.ts` - 5 errors
   9. `src/tools/index.ts` - 2 errors

   ##### Types
   1. `src/types/sharedTypes.ts` - 12 errors
   2. `src/types/sanity.ts` - 4 errors
   3. `src/types/tools.ts` - 4 errors
   4. `src/types/index.ts` - 1 error
   5. `src/types/toolProvider.ts` - 1 error

   ##### Utils
   1. `src/utils/documentHelpers.ts` - 8 errors
   2. `src/utils/parameterValidation.ts` - 4 errors
   3. `src/utils/sanityClient.ts` - 2 errors

   ##### Other
   1. `src/controllers/schema.ts` - 4 errors
   2. `src/index.ts` - 1 error

   #### Common Patterns to Fix

   ##### Type-only Imports
   ```typescript
   // Before
   import { SomeType } from './types.js';

   // After
   import type { SomeType } from './types.js';
   ```

   ##### Index Signature Access
   ```typescript
   // Before
   if (obj.property) {
     return obj.property;
   }

   // After
   if (obj['property']) {
     return obj['property'];
   }
   ```

4. **Improve test coverage**
   - Add more tests for edge cases
   - Fix integration tests for the MCP server
   - Increase coverage for low-coverage files, especially:
     - src/controllers/projects.ts (1.47% covered)
     - src/utils/portableText.ts (3.22% covered)  
     - src/index.ts (0% covered)
     - src/controllers/actions.ts (21.99% covered)
     - src/controllers/contextTools.ts (23.61% covered)

5. **Address code complexity and duplication**
   - Refactor the applyPatchOperations function in documentHelpers.ts to reduce complexity (currently 25, limit is 15)
   - Extract duplicate code patterns across files into shared utility functions
   - ✅ Create shared parameter validation functions for common parameter patterns

6. **Optimize test execution and performance** ✅
   - Configured Vitest for parallel test execution using workspaces
   - Set up thread pooling for optimal multi-core utilization
   - Separated unit and integration tests for better resource management
   - Reduced overall test execution time

## Nice to Have

1. **Documentation improvements**
   - Add more examples for each tool
   - Better describe parameters and return values
