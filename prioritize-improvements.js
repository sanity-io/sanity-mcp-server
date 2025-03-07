import fs from 'fs';

// Define impact/effort values for different types of improvements
const PRIORITIES = {
  // Complexity scores (higher is worse)
  VERY_HIGH_COMPLEXITY: { impact: 5, effort: 4, description: 'Functions with cognitive complexity > 30' }, 
  HIGH_COMPLEXITY: { impact: 4, effort: 3, description: 'Functions with cognitive complexity 15-30' },
  MEDIUM_COMPLEXITY: { impact: 3, effort: 2, description: 'Functions with cognitive complexity 10-15' },
  
  // Coverage scores (lower is worse)
  VERY_LOW_COVERAGE: { impact: 5, effort: 4, description: 'Files with coverage < 10%' },
  LOW_COVERAGE: { impact: 4, effort: 3, description: 'Files with coverage 10-30%' },
  MEDIUM_COVERAGE: { impact: 3, effort: 2, description: 'Files with coverage 30-60%' },
  
  // Code duplication
  LARGE_DUPLICATION: { impact: 4, effort: 3, description: 'Large blocks of duplicated code (10+ lines)' },
  SMALL_DUPLICATION: { impact: 2, effort: 1, description: 'Small blocks of duplicated code (< 10 lines)' }
};

// Read complexity data
const complexData = fs.readFileSync('./complexity-results.txt', 'utf8').split('\n');

// Parse coverage data (this is an approximation as we'd need to parse the actual coverage report)
// Based on the test:coverage output
const coverageData = [
  { file: 'src/controllers/actions.ts', coverage: 21.99 },
  { file: 'src/controllers/projects.ts', coverage: 1.47 },
  { file: 'src/utils/portableText.ts', coverage: 3.22 },
  { file: 'src/controllers/mutate.ts', coverage: 77.25 },
  { file: 'src/controllers/releases.ts', coverage: 67.77 },
  { file: 'src/controllers/embeddings.ts', coverage: 82.30 },
  { file: 'src/controllers/groq.ts', coverage: 94.71 },
  { file: 'src/controllers/schema.ts', coverage: 98.34 },
  { file: 'src/utils/sanityClient.ts', coverage: 62.33 },
  { file: 'src/tools/contextTools.ts', coverage: 23.61 },
  { file: 'src/tools/embeddingsTools.ts', coverage: 69.76 },
  { file: 'src/tools/groqTools.ts', coverage: 67.64 },
  { file: 'src/tools/mutateTools.ts', coverage: 63.76 },
  { file: 'src/tools/projectsTools.ts', coverage: 84.61 },
  { file: 'src/tools/releasesTools.ts', coverage: 68.53 },
  { file: 'src/tools/schemaTools.ts', coverage: 86.04 },
  { file: 'src/tools/actionsTools.ts', coverage: 78.00 },
  { file: 'src/index.ts', coverage: 0 },
];

// Parse duplication data
// We'll extract this from the jscpd output
const duplicationLines = fs.readFileSync('./report/html/index.html', 'utf8')
  .match(/<p>Found <span>(\d+)<\/span> exact clones with <span>(\d+)<\/span>/);

let totalClones = 0;
let totalDuplicatedLines = 0;
if (duplicationLines) {
  totalClones = parseInt(duplicationLines[1]);
  totalDuplicatedLines = parseInt(duplicationLines[2]);
}

// Parse complex functions
const complexFunctions = [];
let inFunctionsList = false;
complexData.forEach(line => {
  if (line === 'Most complex functions:') {
    inFunctionsList = true;
    return;
  }
  if (line === '') {
    inFunctionsList = false;
    return;
  }
  
  if (inFunctionsList && line.match(/^\d+\./)) {
    // Extract data from lines like: "1. controllers/actions.ts:162:8 - Async function 'createDocument' has a complexity of 12. Maximum allowed is 10."
    const match = line.match(/(\d+)\. ([^:]+):(\d+):(\d+) - (.*)/);
    if (match) {
      const [_, index, file, line, col, message] = match;
      
      // Extract complexity value
      let complexity = 0;
      const complexityMatch = message.match(/complexity of (\d+)/);
      const cognitiveMatch = message.match(/Cognitive Complexity from (\d+) to/);
      
      if (complexityMatch) {
        complexity = parseInt(complexityMatch[1]);
      } else if (cognitiveMatch) {
        complexity = parseInt(cognitiveMatch[1]);
      }
      
      let functionName = '';
      const functionMatch = message.match(/'([^']+)'/);
      if (functionMatch) {
        functionName = functionMatch[1];
      }
      
      complexFunctions.push({
        file,
        line: parseInt(line),
        col: parseInt(col),
        message,
        complexity,
        functionName
      });
    }
  }
});

// Create improvement recommendations
const recommendations = [];

// Add complexity-based recommendations
complexFunctions.forEach(func => {
  let priority;
  if (func.complexity > 30) {
    priority = PRIORITIES.VERY_HIGH_COMPLEXITY;
  } else if (func.complexity > 15) {
    priority = PRIORITIES.HIGH_COMPLEXITY;
  } else {
    priority = PRIORITIES.MEDIUM_COMPLEXITY;
  }
  
  recommendations.push({
    type: 'complexity',
    file: func.file,
    location: `${func.file}:${func.line}`,
    description: `Refactor ${func.functionName || 'function'} to reduce complexity from ${func.complexity} to 10`,
    impact: priority.impact,
    effort: priority.effort,
    category: priority.description,
    score: priority.impact / priority.effort
  });
});

// Add coverage-based recommendations
coverageData.forEach(file => {
  let priority;
  if (file.coverage < 10) {
    priority = PRIORITIES.VERY_LOW_COVERAGE;
  } else if (file.coverage < 30) {
    priority = PRIORITIES.LOW_COVERAGE;
  } else if (file.coverage < 60) {
    priority = PRIORITIES.MEDIUM_COVERAGE;
  } else {
    return; // Skip files with good coverage
  }
  
  recommendations.push({
    type: 'coverage',
    file: file.file,
    location: file.file,
    description: `Add unit tests for ${file.file} (currently ${file.coverage}% covered)`,
    impact: priority.impact,
    effort: priority.effort,
    category: priority.description,
    score: priority.impact / priority.effort
  });
});

// Add duplication recommendations from jscpd output
const duplicationReport = fs.readFileSync('./report/html/jscpd-report.json', 'utf8');
const dupeData = JSON.parse(duplicationReport);

dupeData.duplicates.forEach(dupe => {
  const lines = dupe.firstFile.end.line - dupe.firstFile.start.line + 1;
  const priority = lines >= 10 ? PRIORITIES.LARGE_DUPLICATION : PRIORITIES.SMALL_DUPLICATION;
  
  recommendations.push({
    type: 'duplication',
    file: dupe.firstFile.name,
    secondFile: dupe.secondFile.name,
    location: `${dupe.firstFile.name}:${dupe.firstFile.start.line}-${dupe.firstFile.end.line}`,
    description: `Extract ${lines} lines of duplicated code into a shared function (duplicated in ${dupe.secondFile.name})`,
    impact: priority.impact,
    effort: priority.effort,
    category: priority.description,
    score: priority.impact / priority.effort
  });
});

// Sort recommendations by score (impact/effort ratio)
recommendations.sort((a, b) => b.score - a.score);

// Generate report
let report = `# Code Quality Improvement Recommendations\n\n`;
report += `## Summary\n`;
report += `- Total files analyzed: ${coverageData.length}\n`;
report += `- Total complex functions: ${complexFunctions.length}\n`;
report += `- Total code duplications: ${totalClones} (${totalDuplicatedLines} lines)\n`;
report += `- Overall code coverage: 53.87%\n\n`;

report += `## Prioritized Recommendations\n`;
report += `Recommendations are prioritized by impact/effort ratio (higher is better):\n\n`;

recommendations.forEach((rec, i) => {
  report += `### ${i+1}. ${rec.description}\n`;
  report += `- **File:** ${rec.file}\n`;
  report += `- **Location:** ${rec.location}\n`;
  report += `- **Category:** ${rec.category}\n`;
  report += `- **Impact:** ${rec.impact}/5\n`;
  report += `- **Effort:** ${rec.effort}/5\n`;
  report += `- **Score:** ${rec.score.toFixed(2)}\n\n`;
});

// Write report to file
fs.writeFileSync('./improvement-recommendations.md', report);
console.log('Generated improvement recommendations in improvement-recommendations.md');
