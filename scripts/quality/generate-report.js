#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { version } = require('../../package.json');

// Directories
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Output files
const QUALITY_HISTORY_FILE = path.join(outputDir, 'quality-history.json');
const COMPLEXITY_REPORT_FILE = path.join(outputDir, 'complexity-report.json');
const IMPROVEMENTS_FILE = path.join(outputDir, 'improvement-opportunities.json');

// Run eslint to get warnings and errors
function getLintMetrics() {
  try {
    const result = execSync('npx eslint . --ext .ts --config config/.eslintrc.json -f json', { encoding: 'utf8' });
    const lintResults = JSON.parse(result);
    
    let warnings = 0;
    let errors = 0;

    lintResults.forEach(file => {
      file.messages.forEach(msg => {
        if (msg.severity === 1) warnings++;
        if (msg.severity === 2) errors++;
      });
    });

    return { warnings, errors };
  } catch (error) {
    // ESLint might exit with non-zero status if there are errors
    try {
      const result = error.stdout.toString();
      const lintResults = JSON.parse(result);
      
      let warnings = 0;
      let errors = 0;

      lintResults.forEach(file => {
        file.messages.forEach(msg => {
          if (msg.severity === 1) warnings++;
          if (msg.severity === 2) errors++;
        });
      });

      return { warnings, errors };
    } catch (innerError) {
      console.error('Error parsing ESLint results:', innerError);
      return { warnings: 0, errors: 0 };
    }
  }
}

// Get code duplication metrics
function getDuplicationMetrics() {
  try {
    const result = execSync('npx jscpd . --pattern "src/**/*.ts" --ignore "src/types/**/*.ts,dist/**" --format typescript', { encoding: 'utf8' });
    
    // Extract duplication percentage
    const match = result.match(/duplicated lines: (\d+\.\d+)%/);
    const duplications = match ? parseFloat(match[1]) : 0;
    
    return { duplications };
  } catch (error) {
    console.error('Error running jscpd:', error);
    return { duplications: 0 };
  }
}

// Get complex functions
function getComplexFunctions() {
  try {
    const result = execSync('npx eslint . --ext .ts --config config/.eslintrc.json --rule "complexity: [\"warn\", 10]" --rule "sonarjs/cognitive-complexity: [\"warn\", 10]" -f json', { encoding: 'utf8' });
    let lintResults;
    
    try {
      lintResults = JSON.parse(result);
    } catch {
      lintResults = JSON.parse(error.stdout.toString());
    }
    
    let complexFunctions = 0;
    const complexityReport = [];
    
    lintResults.forEach(file => {
      file.messages.forEach(msg => {
        if (msg.ruleId === 'complexity' || msg.ruleId === 'sonarjs/cognitive-complexity') {
          complexFunctions++;
          
          // Extract function name from message
          const fnNameMatch = msg.message.match(/Function '([^']+)'/);
          const fnName = fnNameMatch ? fnNameMatch[1] : 'Anonymous function';
          
          // Extract complexity value
          const complexityMatch = msg.message.match(/complexity of (\d+)/);
          const complexity = complexityMatch ? parseInt(complexityMatch[1]) : 0;
          
          complexityReport.push({
            file: file.filePath.replace(process.cwd(), ''),
            function: fnName,
            complexity,
            lines: `${msg.line}-${msg.endLine || msg.line}`,
            message: msg.message
          });
        }
      });
    });
    
    // Sort by complexity (highest first)
    complexityReport.sort((a, b) => b.complexity - a.complexity);
    
    // Write complexity report
    fs.writeFileSync(COMPLEXITY_REPORT_FILE, JSON.stringify(complexityReport, null, 2));
    
    return { complexFunctions, complexityReport };
  } catch (error) {
    console.error('Error analyzing code complexity:', error);
    return { complexFunctions: 0, complexityReport: [] };
  }
}

// Get test coverage metrics
function getCoverageMetrics() {
  try {
    // Run tests with coverage
    execSync('npx vitest run --coverage', { stdio: 'inherit' });
    
    // Read coverage report (if it exists)
    const coverageFile = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    
    if (fs.existsSync(coverageFile)) {
      const coverageData = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
      const coverage = coverageData.total.lines.pct;
      return { coverage };
    }
    
    return { coverage: 0 };
  } catch (error) {
    console.error('Error measuring test coverage:', error);
    return { coverage: 0 };
  }
}

// Generate improvement opportunities
function generateImprovementOpportunities(complexityReport) {
  const opportunities = [];
  
  // Add high complexity functions as high impact opportunities
  complexityReport.filter(fn => fn.complexity > 15).forEach(fn => {
    opportunities.push({
      file: fn.file,
      description: `Refactor function ${fn.function} to reduce cognitive complexity from ${fn.complexity} to 15 or less`,
      impact: 'high',
      effort: 'medium'
    });
  });
  
  // TODO: Add more types of improvement opportunities based on:
  // - Low test coverage files
  // - Files with many lint warnings
  // - Files with high duplication
  
  // Write improvements file
  fs.writeFileSync(IMPROVEMENTS_FILE, JSON.stringify(opportunities, null, 2));
  
  return opportunities;
}

// Update quality history
function updateQualityHistory(metrics) {
  let history = [];
  
  // Read existing history if available
  if (fs.existsSync(QUALITY_HISTORY_FILE)) {
    history = JSON.parse(fs.readFileSync(QUALITY_HISTORY_FILE, 'utf8'));
  }
  
  // Add new entry
  const entry = {
    ...metrics,
    version,
    timestamp: new Date().toISOString(),
    git: {
      commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
      branch: execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
    }
  };
  
  history.push(entry);
  
  // Write updated history
  fs.writeFileSync(QUALITY_HISTORY_FILE, JSON.stringify(history, null, 2));
  
  return history;
}

// Main function to generate quality report
async function generateQualityReport() {
  console.log('Generating quality report...');
  
  // Gather metrics
  const lintMetrics = getLintMetrics();
  console.log('Lint metrics:', lintMetrics);
  
  const duplicationMetrics = getDuplicationMetrics();
  console.log('Duplication metrics:', duplicationMetrics);
  
  const { complexFunctions, complexityReport } = getComplexFunctions();
  console.log('Complex functions:', complexFunctions);
  
  const coverageMetrics = getCoverageMetrics();
  console.log('Coverage metrics:', coverageMetrics);
  
  // Generate improvement opportunities
  const opportunities = generateImprovementOpportunities(complexityReport);
  console.log(`Generated ${opportunities.length} improvement opportunities`);
  
  // Combine metrics
  const metrics = {
    ...lintMetrics,
    ...duplicationMetrics,
    complexFunctions,
    ...coverageMetrics
  };
  
  // Update quality history
  const history = updateQualityHistory(metrics);
  console.log(`Updated quality history (${history.length} entries)`);
  
  console.log('Quality report generated successfully!');
  console.log(`Results saved to ${outputDir}`);
}

// Run the report generator
generateQualityReport().catch(error => {
  console.error('Error generating quality report:', error);
  process.exit(1);
}); 