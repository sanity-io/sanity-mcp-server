#!/usr/bin/env node

/**
 * Complexity Check Script
 * 
 * This script runs ESLint with strict complexity rules to identify functions that exceed
 * the complexity thresholds for both cyclomatic and cognitive complexity.
 * 
 * It reports:
 * - High complexity functions (above the threshold)
 * - Summary statistics
 * - Separate lists for cyclomatic and cognitive complexity issues
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Configuration
const CYCLOMATIC_THRESHOLD = 10;
const COGNITIVE_THRESHOLD = 10;
const REPORT_FILE = path.join(OUTPUT_DIR, 'complexity-report.json');

// Function to run ESLint with specific complexity rules
function runComplexityCheck() {
  console.log('Running complexity checks...');
  
  try {
    // Run ESLint with strict complexity rules and output to JSON
    execSync(
      `eslint . --ext .ts --config config/.eslintrc.json --rule 'complexity: ["error", ${CYCLOMATIC_THRESHOLD}]' --rule 'sonarjs/cognitive-complexity: ["error", ${COGNITIVE_THRESHOLD}]' -f json > ${REPORT_FILE}`, 
      { stdio: 'inherit' }
    );
    
    console.log(`Complexity report generated at ${REPORT_FILE}`);
  } catch (error) {
    // ESLint will exit with code 1 if it finds any issues, but that's expected
    console.log('Complexity check completed with issues found.');
  }
  
  // Parse and analyze the results
  analyzeComplexityResults();
}

// Function to parse and analyze the complexity report
function analyzeComplexityResults() {
  if (!fs.existsSync(REPORT_FILE)) {
    console.error('Complexity report file not found. Please run the complexity check first.');
    return;
  }
  
  const rawData = fs.readFileSync(REPORT_FILE, 'utf8');
  const report = JSON.parse(rawData);
  
  // Extract complexity issues
  const complexityIssues = {
    cyclomatic: [],
    cognitive: []
  };
  
  let totalFiles = 0;
  let filesWithIssues = 0;
  let totalIssues = 0;
  
  // Process each file in the report
  report.forEach(fileReport => {
    totalFiles++;
    
    if (fileReport.errorCount > 0 || fileReport.warningCount > 0) {
      filesWithIssues++;
      totalIssues += fileReport.errorCount + fileReport.warningCount;
      
      // Process each message (issue)
      fileReport.messages.forEach(msg => {
        // Create a structured issue object
        const issue = {
          file: fileReport.filePath,
          line: msg.line,
          column: msg.column,
          message: msg.message,
          ruleId: msg.ruleId,
          severity: msg.severity === 2 ? 'error' : 'warning'
        };
        
        // Categorize by complexity type
        if (msg.ruleId === 'complexity') {
          complexityIssues.cyclomatic.push(issue);
        } else if (msg.ruleId === 'sonarjs/cognitive-complexity') {
          complexityIssues.cognitive.push(issue);
        }
      });
    }
  });
  
  // Generate the summary
  console.log('\n=== Complexity Analysis Summary ===');
  console.log(`Files analyzed: ${totalFiles}`);
  console.log(`Files with complexity issues: ${filesWithIssues}`);
  console.log(`Total complexity issues: ${totalIssues}`);
  console.log(`Cyclomatic complexity issues: ${complexityIssues.cyclomatic.length}`);
  console.log(`Cognitive complexity issues: ${complexityIssues.cognitive.length}`);
  
  // Display the issues
  if (complexityIssues.cyclomatic.length > 0) {
    console.log('\n=== Cyclomatic Complexity Issues ===');
    complexityIssues.cyclomatic.forEach(issue => {
      const relativeFile = path.relative(process.cwd(), issue.file);
      console.log(`${relativeFile}:${issue.line}:${issue.column} - ${issue.message} (${issue.severity})`);
    });
  }
  
  if (complexityIssues.cognitive.length > 0) {
    console.log('\n=== Cognitive Complexity Issues ===');
    complexityIssues.cognitive.forEach(issue => {
      const relativeFile = path.relative(process.cwd(), issue.file);
      console.log(`${relativeFile}:${issue.line}:${issue.column} - ${issue.message} (${issue.severity})`);
    });
  }
  
  // Save the structured complexity issues to a JSON file
  const complexityReport = {
    summary: {
      filesAnalyzed: totalFiles,
      filesWithIssues,
      totalIssues,
      cyclomaticIssues: complexityIssues.cyclomatic.length,
      cognitiveIssues: complexityIssues.cognitive.length,
      threshold: {
        cyclomatic: CYCLOMATIC_THRESHOLD,
        cognitive: COGNITIVE_THRESHOLD
      }
    },
    issues: complexityIssues
  };
  
  const structuredReportFile = path.join(OUTPUT_DIR, 'complexity-analysis.json');
  fs.writeFileSync(structuredReportFile, JSON.stringify(complexityReport, null, 2));
  
  console.log(`\nDetailed complexity analysis saved to ${structuredReportFile}`);
  
  // Generate a TODO list for fixing high complexity functions
  generateComplexityTodoList(complexityReport);
}

// Function to generate a TODO list for fixing complex functions
function generateComplexityTodoList(complexityReport) {
  // Combine all issues and sort by file and line
  const allIssues = [
    ...complexityReport.issues.cyclomatic.map(issue => ({ ...issue, type: 'cyclomatic' })),
    ...complexityReport.issues.cognitive.map(issue => ({ ...issue, type: 'cognitive' }))
  ].sort((a, b) => {
    // Sort by file first, then by line number
    const fileComparison = a.file.localeCompare(b.file);
    if (fileComparison !== 0) return fileComparison;
    return a.line - b.line;
  });
  
  // Group by file
  const issuesByFile = {};
  allIssues.forEach(issue => {
    const relativeFile = path.relative(process.cwd(), issue.file);
    if (!issuesByFile[relativeFile]) {
      issuesByFile[relativeFile] = [];
    }
    issuesByFile[relativeFile].push(issue);
  });
  
  // Generate the TODO list content
  let todoContent = '# Complexity Improvements TODO\n\n';
  todoContent += `Generated on: ${new Date().toISOString()}\n\n`;
  todoContent += `## Summary\n`;
  todoContent += `- Files with complexity issues: ${complexityReport.summary.filesWithIssues}\n`;
  todoContent += `- Total complexity issues: ${complexityReport.summary.totalIssues}\n`;
  todoContent += `- Cyclomatic complexity issues: ${complexityReport.summary.cyclomaticIssues}\n`;
  todoContent += `- Cognitive complexity issues: ${complexityReport.summary.cognitiveIssues}\n\n`;
  
  todoContent += `## Complexity Thresholds\n`;
  todoContent += `- Cyclomatic complexity threshold: ${complexityReport.summary.threshold.cyclomatic}\n`;
  todoContent += `- Cognitive complexity threshold: ${complexityReport.summary.threshold.cognitive}\n\n`;
  
  todoContent += `## Issues by File\n\n`;
  
  // Add each file's issues
  Object.keys(issuesByFile).forEach(file => {
    todoContent += `### ${file}\n\n`;
    
    issuesByFile[file].forEach(issue => {
      const complexityType = issue.type.charAt(0).toUpperCase() + issue.type.slice(1);
      todoContent += `- [ ] **${complexityType} Complexity**: Line ${issue.line} - ${issue.message}\n`;
    });
    
    todoContent += '\n';
  });
  
  // Add strategies for reducing complexity
  todoContent += `## Strategies for Reducing Complexity\n\n`;
  
  todoContent += `### Reducing Cyclomatic Complexity\n\n`;
  todoContent += `1. **Extract Methods/Functions**: Break large functions into smaller, more focused ones\n`;
  todoContent += `2. **Simplify Conditional Logic**: Use early returns, guard clauses, and reduce nested if statements\n`;
  todoContent += `3. **Replace Conditionals with Polymorphism**: Use object-oriented patterns\n`;
  todoContent += `4. **Use Configuration Data**: Replace complex switch/case statements with lookup tables\n`;
  todoContent += `5. **Extract Complex Validation Logic**: Move validation to separate functions\n\n`;
  
  todoContent += `### Reducing Cognitive Complexity\n\n`;
  todoContent += `1. **Reduce Nesting**: Excessive nesting makes code hard to understand\n`;
  todoContent += `2. **Extract Decision Making**: Move complex boolean logic to named functions\n`;
  todoContent += `3. **Simplify Loop Logic**: Avoid complex logic inside loops\n`;
  todoContent += `4. **Avoid Double Negations**: Make conditionals positive and clear\n`;
  todoContent += `5. **Use Named Constants**: Replace magic numbers and complex expressions\n`;
  
  // Write the TODO list to a file
  const todoFile = path.join(process.cwd(), 'COMPLEXITY_TODO.md');
  fs.writeFileSync(todoFile, todoContent);
  
  console.log(`\nComplexity TODO list generated at ${todoFile}`);
}

// Run the script
runComplexityCheck(); 