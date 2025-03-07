# Code Quality Improvement Recommendations

## Summary
- Total files analyzed: 18
- Total complex functions: 27
- Total code duplications: 0 (0 lines)
- Overall code coverage: 53.87%

## Prioritized Recommendations
Recommendations are prioritized by impact/effort ratio (higher is better):

### 1. Extract NaN lines of duplicated code into a shared function (duplicated in src/utils/sanityClient.ts)
- **File:** src/types/index.ts
- **Location:** src/types/index.ts:undefined-undefined
- **Category:** Small blocks of duplicated code (< 10 lines)
- **Impact:** 2/5
- **Effort:** 1/5
- **Score:** 2.00

### 2. Extract NaN lines of duplicated code into a shared function (duplicated in src/tools/schemaTools.ts)
- **File:** src/tools/releasesTools.ts
- **Location:** src/tools/releasesTools.ts:undefined-undefined
- **Category:** Small blocks of duplicated code (< 10 lines)
- **Impact:** 2/5
- **Effort:** 1/5
- **Score:** 2.00

### 3. Extract NaN lines of duplicated code into a shared function (duplicated in src/tools/mutateTools.ts)
- **File:** src/tools/mutateTools.ts
- **Location:** src/tools/mutateTools.ts:undefined-undefined
- **Category:** Small blocks of duplicated code (< 10 lines)
- **Impact:** 2/5
- **Effort:** 1/5
- **Score:** 2.00

### 4. Extract NaN lines of duplicated code into a shared function (duplicated in src/tools/mutateTools.ts)
- **File:** src/tools/mutateTools.ts
- **Location:** src/tools/mutateTools.ts:undefined-undefined
- **Category:** Small blocks of duplicated code (< 10 lines)
- **Impact:** 2/5
- **Effort:** 1/5
- **Score:** 2.00

### 5. Extract NaN lines of duplicated code into a shared function (duplicated in src/tools/mutateTools.ts)
- **File:** src/tools/mutateTools.ts
- **Location:** src/tools/mutateTools.ts:undefined-undefined
- **Category:** Small blocks of duplicated code (< 10 lines)
- **Impact:** 2/5
- **Effort:** 1/5
- **Score:** 2.00

### 6. Extract NaN lines of duplicated code into a shared function (duplicated in src/tools/groqTools.ts)
- **File:** src/tools/groqTools.ts
- **Location:** src/tools/groqTools.ts:undefined-undefined
- **Category:** Small blocks of duplicated code (< 10 lines)
- **Impact:** 2/5
- **Effort:** 1/5
- **Score:** 2.00

### 7. Extract NaN lines of duplicated code into a shared function (duplicated in src/tools/schemaTools.ts)
- **File:** src/tools/embeddingsTools.ts
- **Location:** src/tools/embeddingsTools.ts:undefined-undefined
- **Category:** Small blocks of duplicated code (< 10 lines)
- **Impact:** 2/5
- **Effort:** 1/5
- **Score:** 2.00

### 8. Extract NaN lines of duplicated code into a shared function (duplicated in src/controllers/releases.ts)
- **File:** src/controllers/releases.ts
- **Location:** src/controllers/releases.ts:undefined-undefined
- **Category:** Small blocks of duplicated code (< 10 lines)
- **Impact:** 2/5
- **Effort:** 1/5
- **Score:** 2.00

### 9. Extract NaN lines of duplicated code into a shared function (duplicated in src/controllers/mutate.ts)
- **File:** src/controllers/mutate.ts
- **Location:** src/controllers/mutate.ts:undefined-undefined
- **Category:** Small blocks of duplicated code (< 10 lines)
- **Impact:** 2/5
- **Effort:** 1/5
- **Score:** 2.00

### 10. Extract NaN lines of duplicated code into a shared function (duplicated in src/controllers/mutate.ts)
- **File:** src/controllers/actions.ts
- **Location:** src/controllers/actions.ts:undefined-undefined
- **Category:** Small blocks of duplicated code (< 10 lines)
- **Impact:** 2/5
- **Effort:** 1/5
- **Score:** 2.00

### 11. Extract NaN lines of duplicated code into a shared function (duplicated in src/controllers/actions.ts)
- **File:** src/controllers/actions.ts
- **Location:** src/controllers/actions.ts:undefined-undefined
- **Category:** Small blocks of duplicated code (< 10 lines)
- **Impact:** 2/5
- **Effort:** 1/5
- **Score:** 2.00

### 12. Extract NaN lines of duplicated code into a shared function (duplicated in src/controllers/actions.ts)
- **File:** src/controllers/actions.ts
- **Location:** src/controllers/actions.ts:undefined-undefined
- **Category:** Small blocks of duplicated code (< 10 lines)
- **Impact:** 2/5
- **Effort:** 1/5
- **Score:** 2.00

### 13. Extract NaN lines of duplicated code into a shared function (duplicated in src/controllers/actions.ts)
- **File:** src/controllers/actions.ts
- **Location:** src/controllers/actions.ts:undefined-undefined
- **Category:** Small blocks of duplicated code (< 10 lines)
- **Impact:** 2/5
- **Effort:** 1/5
- **Score:** 2.00

### 14. Extract NaN lines of duplicated code into a shared function (duplicated in src/controllers/actions.ts)
- **File:** src/controllers/actions.ts
- **Location:** src/controllers/actions.ts:undefined-undefined
- **Category:** Small blocks of duplicated code (< 10 lines)
- **Impact:** 2/5
- **Effort:** 1/5
- **Score:** 2.00

### 15. Extract NaN lines of duplicated code into a shared function (duplicated in src/controllers/actions.ts)
- **File:** src/controllers/actions.ts
- **Location:** src/controllers/actions.ts:undefined-undefined
- **Category:** Small blocks of duplicated code (< 10 lines)
- **Impact:** 2/5
- **Effort:** 1/5
- **Score:** 2.00

### 16. Extract NaN lines of duplicated code into a shared function (duplicated in src/controllers/actions.ts)
- **File:** src/controllers/actions.ts
- **Location:** src/controllers/actions.ts:undefined-undefined
- **Category:** Small blocks of duplicated code (< 10 lines)
- **Impact:** 2/5
- **Effort:** 1/5
- **Score:** 2.00

### 17. Refactor createDocument to reduce complexity from 12 to 10
- **File:** controllers/actions.ts
- **Location:** controllers/actions.ts:162
- **Category:** Functions with cognitive complexity 10-15
- **Impact:** 3/5
- **Effort:** 2/5
- **Score:** 1.50

### 18. Refactor deleteDocument to reduce complexity from 11 to 10
- **File:** controllers/actions.ts
- **Location:** controllers/actions.ts:358
- **Category:** Functions with cognitive complexity 10-15
- **Impact:** 3/5
- **Effort:** 2/5
- **Score:** 1.50

### 19. Refactor function to reduce complexity from 14 to 10
- **File:** controllers/actions.ts
- **Location:** controllers/actions.ts:358
- **Category:** Functions with cognitive complexity 10-15
- **Impact:** 3/5
- **Effort:** 2/5
- **Score:** 1.50

### 20. Refactor createDocumentVersion to reduce complexity from 13 to 10
- **File:** controllers/actions.ts
- **Location:** controllers/actions.ts:566
- **Category:** Functions with cognitive complexity 10-15
- **Impact:** 3/5
- **Effort:** 2/5
- **Score:** 1.50

### 21. Refactor listEmbeddingsIndices to reduce complexity from 12 to 10
- **File:** controllers/embeddings.ts
- **Location:** controllers/embeddings.ts:29
- **Category:** Functions with cognitive complexity 10-15
- **Impact:** 3/5
- **Effort:** 2/5
- **Score:** 1.50

### 22. Refactor function to reduce complexity from 11 to 10
- **File:** controllers/groq.ts
- **Location:** controllers/groq.ts:160
- **Category:** Functions with cognitive complexity 10-15
- **Impact:** 3/5
- **Effort:** 2/5
- **Score:** 1.50

### 23. Refactor createRelease to reduce complexity from 14 to 10
- **File:** controllers/releases.ts
- **Location:** controllers/releases.ts:36
- **Category:** Functions with cognitive complexity 10-15
- **Impact:** 3/5
- **Effort:** 2/5
- **Score:** 1.50

### 24. Refactor function to reduce complexity from 11 to 10
- **File:** controllers/releases.ts
- **Location:** controllers/releases.ts:36
- **Category:** Functions with cognitive complexity 10-15
- **Impact:** 3/5
- **Effort:** 2/5
- **Score:** 1.50

### 25. Refactor removeDocumentFromRelease to reduce complexity from 13 to 10
- **File:** controllers/releases.ts
- **Location:** controllers/releases.ts:257
- **Category:** Functions with cognitive complexity 10-15
- **Impact:** 3/5
- **Effort:** 2/5
- **Score:** 1.50

### 26. Refactor checkForReferences to reduce complexity from 11 to 10
- **File:** controllers/schema.ts
- **Location:** controllers/schema.ts:100
- **Category:** Functions with cognitive complexity 10-15
- **Impact:** 3/5
- **Effort:** 2/5
- **Score:** 1.50

### 27. Refactor function to reduce complexity from 13 to 10
- **File:** integration/release-document-workflow.test.ts
- **Location:** integration/release-document-workflow.test.ts:51
- **Category:** Functions with cognitive complexity 10-15
- **Impact:** 3/5
- **Effort:** 2/5
- **Score:** 1.50

### 28. Refactor function to reduce complexity from 15 to 10
- **File:** utils/portableText.ts
- **Location:** utils/portableText.ts:41
- **Category:** Functions with cognitive complexity 10-15
- **Impact:** 3/5
- **Effort:** 2/5
- **Score:** 1.50

### 29. Refactor function to reduce complexity from 13 to 10
- **File:** utils/portableText.ts
- **Location:** utils/portableText.ts:41
- **Category:** Functions with cognitive complexity 10-15
- **Impact:** 3/5
- **Effort:** 2/5
- **Score:** 1.50

### 30. Refactor function to reduce complexity from 17 to 10
- **File:** controllers/actions.ts
- **Location:** controllers/actions.ts:162
- **Category:** Functions with cognitive complexity 15-30
- **Impact:** 4/5
- **Effort:** 3/5
- **Score:** 1.33

### 31. Refactor editDocument to reduce complexity from 17 to 10
- **File:** controllers/actions.ts
- **Location:** controllers/actions.ts:267
- **Category:** Functions with cognitive complexity 15-30
- **Impact:** 4/5
- **Effort:** 3/5
- **Score:** 1.33

### 32. Refactor function to reduce complexity from 30 to 10
- **File:** controllers/actions.ts
- **Location:** controllers/actions.ts:267
- **Category:** Functions with cognitive complexity 15-30
- **Impact:** 4/5
- **Effort:** 3/5
- **Score:** 1.33

### 33. Refactor function to reduce complexity from 20 to 10
- **File:** controllers/actions.ts
- **Location:** controllers/actions.ts:566
- **Category:** Functions with cognitive complexity 15-30
- **Impact:** 4/5
- **Effort:** 3/5
- **Score:** 1.33

### 34. Refactor semanticSearch to reduce complexity from 18 to 10
- **File:** controllers/embeddings.ts
- **Location:** controllers/embeddings.ts:85
- **Category:** Functions with cognitive complexity 15-30
- **Impact:** 4/5
- **Effort:** 3/5
- **Score:** 1.33

### 35. Refactor function to reduce complexity from 16 to 10
- **File:** controllers/embeddings.ts
- **Location:** controllers/embeddings.ts:85
- **Category:** Functions with cognitive complexity 15-30
- **Impact:** 4/5
- **Effort:** 3/5
- **Score:** 1.33

### 36. Refactor function to reduce complexity from 21 to 10
- **File:** controllers/mutate.ts
- **Location:** controllers/mutate.ts:123
- **Category:** Functions with cognitive complexity 15-30
- **Impact:** 4/5
- **Effort:** 3/5
- **Score:** 1.33

### 37. Refactor addDocumentToRelease to reduce complexity from 17 to 10
- **File:** controllers/releases.ts
- **Location:** controllers/releases.ts:108
- **Category:** Functions with cognitive complexity 15-30
- **Impact:** 4/5
- **Effort:** 3/5
- **Score:** 1.33

### 38. Refactor function to reduce complexity from 21 to 10
- **File:** controllers/releases.ts
- **Location:** controllers/releases.ts:257
- **Category:** Functions with cognitive complexity 15-30
- **Impact:** 4/5
- **Effort:** 3/5
- **Score:** 1.33

### 39. Refactor function to reduce complexity from 24 to 10
- **File:** integration/release-document-workflow.test.ts
- **Location:** integration/release-document-workflow.test.ts:51
- **Category:** Functions with cognitive complexity 15-30
- **Impact:** 4/5
- **Effort:** 3/5
- **Score:** 1.33

### 40. Add unit tests for src/controllers/actions.ts (currently 21.99% covered)
- **File:** src/controllers/actions.ts
- **Location:** src/controllers/actions.ts
- **Category:** Files with coverage 10-30%
- **Impact:** 4/5
- **Effort:** 3/5
- **Score:** 1.33

### 41. Add unit tests for src/tools/contextTools.ts (currently 23.61% covered)
- **File:** src/tools/contextTools.ts
- **Location:** src/tools/contextTools.ts
- **Category:** Files with coverage 10-30%
- **Impact:** 4/5
- **Effort:** 3/5
- **Score:** 1.33

### 42. Refactor function to reduce complexity from 42 to 10
- **File:** controllers/mutate.ts
- **Location:** controllers/mutate.ts:123
- **Category:** Functions with cognitive complexity > 30
- **Impact:** 5/5
- **Effort:** 4/5
- **Score:** 1.25

### 43. Refactor modifyPortableTextField to reduce complexity from 33 to 10
- **File:** controllers/mutate.ts
- **Location:** controllers/mutate.ts:263
- **Category:** Functions with cognitive complexity > 30
- **Impact:** 5/5
- **Effort:** 4/5
- **Score:** 1.25

### 44. Refactor function to reduce complexity from 74 to 10
- **File:** controllers/mutate.ts
- **Location:** controllers/mutate.ts:263
- **Category:** Functions with cognitive complexity > 30
- **Impact:** 5/5
- **Effort:** 4/5
- **Score:** 1.25

### 45. Refactor function to reduce complexity from 33 to 10
- **File:** controllers/releases.ts
- **Location:** controllers/releases.ts:108
- **Category:** Functions with cognitive complexity > 30
- **Impact:** 5/5
- **Effort:** 4/5
- **Score:** 1.25

### 46. Add unit tests for src/controllers/projects.ts (currently 1.47% covered)
- **File:** src/controllers/projects.ts
- **Location:** src/controllers/projects.ts
- **Category:** Files with coverage < 10%
- **Impact:** 5/5
- **Effort:** 4/5
- **Score:** 1.25

### 47. Add unit tests for src/utils/portableText.ts (currently 3.22% covered)
- **File:** src/utils/portableText.ts
- **Location:** src/utils/portableText.ts
- **Category:** Files with coverage < 10%
- **Impact:** 5/5
- **Effort:** 4/5
- **Score:** 1.25

### 48. Add unit tests for src/index.ts (currently 0% covered)
- **File:** src/index.ts
- **Location:** src/index.ts
- **Category:** Files with coverage < 10%
- **Impact:** 5/5
- **Effort:** 4/5
- **Score:** 1.25

