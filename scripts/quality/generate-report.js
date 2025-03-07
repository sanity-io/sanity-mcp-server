#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, 'output');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Gets metrics from ESLint output
 */
function getLintMetrics() {
  return new Promise((resolve, reject) => {
    exec('npm run lint -- -f json', (error, stdout) => {
      try {
        // Extract the JSON part from the output
        const jsonStart = stdout.indexOf('[');
        const jsonEnd = stdout.lastIndexOf(']') + 1;
        const jsonOutput = stdout.substring(jsonStart, jsonEnd);
        
        const lintResults = JSON.parse(jsonOutput);
        
        let warnings = 0;
        let errors = 0;
        
        lintResults.forEach(file => {
          file.messages.forEach(message => {
            if (message.severity === 1) {
              warnings++;
            } else if (message.severity === 2) {
              errors++;
            }
          });
        });
        
        resolve({ warnings, errors });
      } catch (e) {
        console.error('Error parsing lint results:', e);
        resolve({ warnings: 0, errors: 0 }); // Provide default values in case of error
      }
    });
  });
}

/**
 * Gets metrics for code duplication
 */
function getDuplicationMetrics() {
  return new Promise((resolve) => {
    exec('npm run find:duplicates', () => {
      try {
        const jscpdPath = path.join(outputDir, 'jscpd-report.json');
        if (fs.existsSync(jscpdPath)) {
          const jscpdData = JSON.parse(fs.readFileSync(jscpdPath, 'utf8'));
          resolve({ duplications: jscpdData.statistics.total.duplications });
        } else {
          resolve({ duplications: 0 });
        }
      } catch (e) {
        console.error('Error parsing duplication results:', e);
        resolve({ duplications: 0 });
      }
    });
  });
}

/**
 * Analyzes complex functions in the codebase
 */
function getComplexFunctions() {
  return new Promise((resolve) => {
    exec('npm run complexity', () => {
      try {
        const complexityPath = path.join(outputDir, 'complexity-report.json');
        if (fs.existsSync(complexityPath)) {
          const complexityData = JSON.parse(fs.readFileSync(complexityPath, 'utf8'));
          
          const complexFunctions = [];
          let complexFunctionCount = 0;
          
          complexityData.forEach(file => {
            if (!file.filePath) return;
            
            const relativePath = file.filePath.replace(/^.*?\/src\//, 'src/');
            
            file.messages.forEach(message => {
              if (message.ruleId === 'complexity' || message.ruleId === 'sonarjs/cognitive-complexity') {
                complexFunctionCount++;
                
                // Extract function name if available
                let functionName = 'unknown';
                if (message.message.includes("function '")) {
                  functionName = message.message.split("function '")[1].split("'")[0];
                } else if (message.message.includes("method '")) {
                  functionName = message.message.split("method '")[1].split("'")[0];
                }
                
                // Extract complexity value
                const complexityMatch = message.message.match(/complexity of (\d+)/);
                const complexity = complexityMatch ? parseInt(complexityMatch[1], 10) : 0;
                
                complexFunctions.push({
                  file: relativePath,
                  function: functionName,
                  complexity,
                  lines: message.line,
                  message: message.message
                });
              }
            });
          });
          
          // Sort by complexity (highest first)
          complexFunctions.sort((a, b) => b.complexity - a.complexity);
          
          // Only include the top 20 most complex functions
          const topComplexFunctions = complexFunctions.slice(0, 20);
          
          fs.writeFileSync(
            path.join(outputDir, 'complexity-report.json'),
            JSON.stringify(topComplexFunctions, null, 2)
          );
          
          resolve({ complexFunctions: complexFunctionCount, details: topComplexFunctions });
        } else {
          resolve({ complexFunctions: 0, details: [] });
        }
      } catch (e) {
        console.error('Error parsing complexity results:', e);
        resolve({ complexFunctions: 0, details: [] });
      }
    });
  });
}

/**
 * Gets test coverage metrics
 */
function getCoverageMetrics() {
  return new Promise((resolve) => {
    exec('npm run test:coverage', (error) => {
      try {
        // If there's a coverage report, extract stats
        const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
        if (fs.existsSync(coveragePath)) {
          const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
          const coverage = coverageData.total.statements.pct || 0;
          resolve({ coverage: Math.round(coverage) });
        } else {
          console.warn('No coverage report found');
          resolve({ coverage: 0 });
        }
      } catch (e) {
        console.error('Error parsing coverage results:', e);
        resolve({ coverage: 0 });
      }
    });
  });
}

/**
 * Generates a list of improvement opportunities
 */
function generateImprovementOpportunities(complexityReport) {
  const opportunities = [];
  
  // Add complex functions as high impact opportunities
  for (const func of complexityReport.details.slice(0, 5)) {
    opportunities.push({
      file: func.file,
      description: `Function "${func.function}" has a complexity of ${func.complexity}`,
      impact: 'high',
      type: 'complexity'
    });
  }
  
  // Add more opportunities based on other metrics
  // TODO: Add more types of opportunities based on duplication, coverage, etc.
  
  fs.writeFileSync(
    path.join(outputDir, 'improvement-opportunities.json'),
    JSON.stringify(opportunities, null, 2)
  );
  
  return opportunities;
}

/**
 * Updates the quality history file
 */
function updateQualityHistory(metrics) {
  const historyPath = path.join(outputDir, 'quality-history.json');
  let history = [];
  
  // Load existing history if available
  if (fs.existsSync(historyPath)) {
    try {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    } catch (e) {
      console.warn('Error parsing quality history, starting fresh');
    }
  }
  
  // Add new entry with timestamp
  const entry = {
    ...metrics,
    timestamp: new Date().toISOString(),
    version: JSON.parse(fs.readFileSync('package.json', 'utf8')).version
  };
  
  // Keep only the last 10 entries
  history.push(entry);
  if (history.length > 10) {
    history = history.slice(history.length - 10);
  }
  
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  
  return history;
}

/**
 * Main function to generate the quality report
 */
async function generateQualityReport() {
  console.log('Generating quality report...');
  
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Get metrics from various sources
    const lintMetrics = await getLintMetrics();
    console.log('Lint metrics:', lintMetrics);
    
    const duplicationMetrics = await getDuplicationMetrics();
    console.log('Duplication metrics:', duplicationMetrics);
    
    const complexityReport = await getComplexFunctions();
    console.log('Complex functions:', complexityReport.complexFunctions);
    
    const coverageMetrics = await getCoverageMetrics();
    console.log('Coverage metrics:', coverageMetrics);
    
    // Combine all metrics
    const metrics = {
      warnings: lintMetrics.warnings,
      errors: lintMetrics.errors,
      duplications: duplicationMetrics.duplications,
      complexFunctions: complexityReport.complexFunctions,
      coverage: coverageMetrics.coverage
    };
    
    // Generate improvement opportunities
    const opportunities = generateImprovementOpportunities(complexityReport);
    console.log(`Generated ${opportunities.length} improvement opportunities`);
    
    // Update quality history
    const history = updateQualityHistory(metrics);
    console.log(`Updated quality history (${history.length} entries)`);
    
    console.log('Quality report generated successfully');
    
    return { metrics, opportunities, history };
  } catch (error) {
    console.error('Error generating quality report:', error);
    throw error;
  }
}

// Run the report generator
generateQualityReport()
  .then(() => {
    console.log('Quality report completed');
  })
  .catch((error) => {
    console.error('Quality report failed:', error);
    process.exit(1);
  }); 