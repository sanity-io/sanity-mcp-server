# TODO

## High Priority
1. ✅ **Fix TypeScript Errors**
   - ✅ Fix type errors in mutate.ts with proper null checks
     - ✅ Import logger in createDocument and patchDocument functions
     - ✅ Fix type checking for document parameters (Record<string, any> vs IdentifiedSanityDocumentStub)

2. ✅ **Fix Critical Linting Errors**
   - ✅ Fix semicolon errors in groq.ts
   - ✅ Fix quotes style error in groq.ts (line 299)
   - ✅ Fix brace style errors in groq.ts and schema.ts

3. ✅ **Reduce Cognitive Complexity**
   - ✅ Refactor the processDocument function in groq.ts to reduce complexity
   - ✅ Fix strict equality issue in groq.ts (use === instead of == for null comparisons)
   - ✅ Refactor the arrow function in src/controllers/mutate.ts:323 to reduce complexity

4. ensure that dataset and project are required in all tools (apart from get initial context)

## Medium Priority
1. 🔄 **Replace 'any' Types**
   - 🔄 Create proper type definitions in src/types:
     - ✅ Define ContentValue and ContentObject types for general document content
     - ⬜ Tackle PortableText types separately (deferred for cleaner approach)
     - ⬜ Define ApiResponse types for consistent return values
   - ⬜ Replace any types in controllers (start with most used):
     - ⬜ Replace any types in actions.ts (~30 occurrences)
     - ⬜ Replace any types in groq.ts (~15 occurrences) 
     - ⬜ Replace any types in mutate.ts (~15 occurrences)

2. 🔄 **Fix Long Lines**
   - ⬜ Break up long lines exceeding 120 characters:
     - ⬜ Address groq.ts API specification (lines 461-468)
     - ⬜ Break up URL and template string lines in embeddings.ts
     - ⬜ Fix long import lines in releases.ts
   - ⬜ Create helper functions for repeated complex operations

3. 🔄 **Fix Class-methods-use-this Warnings**
   - ⬜ Refactor tool classes to use static methods:
     - ⬜ Convert getToolDefinitions methods to static
     - ⬜ Update imports and usage accordingly

## Low Priority
1. ⬜ **Standardize Code Structure**
   - ⬜ Ensure consistent error handling patterns
   - ⬜ Standardize function signatures and return types
   - ⬜ Create utility functions for repeated code patterns

2. ⬜ **Documentation Improvements**
   - ⬜ Update JSDoc comments with proper types
   - ⬜ Add missing documentation for functions and parameters
   - ⬜ Standardize comment formatting

3. ⬜ **Remaining ESLint Warnings**
   - ⬜ Create an incremental plan for addressing remaining warnings
   - ⬜ Add exclusions for justified cases with explanatory comments

4. ⬜ **Advanced Type Definitions**
   - ⬜ Create dedicated PortableText type system
   - ⬜ Implement strict mutation types
   - ⬜ Add proper response type definitions

## Completed
1. ✅ **Remove Portable Text Utility**
   - ✅ Delete src/utils/portableText.ts file
   - ✅ Update groq.ts to handle Portable Text without the utility
   - ✅ Update groq.test.ts to remove references to the utility

2. ✅ **Enable Stricter TypeScript and Linting**
   - ✅ Enable noUnusedLocals and noUnusedParameters in tsconfig.json
   - ✅ Update ESLint rules to make warnings into errors

3. ✅ **Remove LLM Verification**
   - ✅ Remove LLM verification parameter from GROQ functions in controllers/groq.ts
   - ✅ Update GroqQueryResult type in sharedTypes.ts to remove verification field
   - ✅ Remove verification test from groq.test.ts
