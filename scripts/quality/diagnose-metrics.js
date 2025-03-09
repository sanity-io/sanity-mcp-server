#!/usr/bin/env node
/**
 * Diagnostic script for quality dashboard metrics
 * 
 * This script helps diagnose issues with the quality dashboard by:
 * 1. Checking for the existence of all required metrics files
 * 2. Validating the format and content of each metrics file
 * 3. Generating a comprehensive report of all metrics
 * 4. Identifying missing or malformed metrics
 * 
 * Usage:
 *   node scripts/quality/diagnose-metrics.js [--verbose] [--fix] [--skip-tests]
 * 
 * Options:
 *   --verbose     Show detailed logging during diagnosis
 *   --fix         Attempt to fix common issues automatically
 *   --skip-tests  Skip running tests (uses existing test results)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Parse command line arguments
const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const fix = args.includes('--fix');
const skipTests = args.includes('--skip-tests');

// File paths
const QUALITY_DIR = './scripts/quality';
const OUTPUT_DIR = path.join(QUALITY_DIR, 'output');
const DIAGNOSTIC_OUTPUT = path.join(OUTPUT_DIR, 'diagnostic-report.json');
const CHECKPOINT_FILE = path.join(QUALITY_DIR, 'quality-tag-checkpoint.ndjson');
const COMPLEXITY_REPORT = path.join(OUTPUT_DIR, 'complexity-report.json');
const COMPLEXITY_METRICS = path.join(OUTPUT_DIR, 'complexity-metrics.json');
const TEST_RESULTS_FILE = path.join(OUTPUT_DIR, 'test-results.json');
const QUALITY_HISTORY = path.join(OUTPUT_DIR, 'quality-history.json');
const IMPROVEMENT_OPPORTUNITIES = path.join(OUTPUT_DIR, 'improvement-opportunities.json');

// Required files for a complete dashboard
const REQUIRED_FILES = [
  CHECKPOINT_FILE,
  COMPLEXITY_REPORT,
  COMPLEXITY_METRICS,
  TEST_RESULTS_FILE,
  QUALITY_HISTORY,
  IMPROVEMENT_OPPORTUNITIES
];

/**
 * Main diagnostic function
 */
async function runDiagnostics() {
  console.log('🔍 Starting quality metrics diagnostics...');
  
  // Create diagnostics object to store all findings
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: getEnvironmentInfo(),
    fileChecks: {},
    metrics: {},
    issues: [],
    recommendations: []
  };
  
  // Check if all required files exist
  console.log('Checking for required metrics files...');
  const missingFiles = [];
  
  for (const file of REQUIRED_FILES) {
    const exists = fs.existsSync(file);
    diagnostics.fileChecks[file] = { exists };
    
    if (!exists) {
      missingFiles.push(file);
      diagnostics.issues.push(`Missing required file: ${file}`);
      
      if (verbose) {
        console.error(`❌ Missing file: ${file}`);
      }
    } else if (verbose) {
      console.log(`✅ Found file: ${file}`);
      
      // Get file stats
      const stats = fs.statSync(file);
      diagnostics.fileChecks[file].size = stats.size;
      diagnostics.fileChecks[file].modified = stats.mtime;
      
      if (stats.size === 0) {
        diagnostics.issues.push(`File exists but is empty: ${file}`);
        console.warn(`⚠️ File exists but is empty: ${file}`);
      }
    }
  }
  
  // If there are missing files and fix is enabled, try to generate them
  if (missingFiles.length > 0 && fix) {
    console.log(`Attempting to fix ${missingFiles.length} missing files...`);
    await fixMissingFiles(missingFiles, diagnostics);
  }
  
  // Collect and validate metrics from each file
  await collectMetrics(diagnostics);
  
  // Generate recommendations based on findings
  generateRecommendations(diagnostics);
  
  // Save diagnostic report
  fs.writeFileSync(DIAGNOSTIC_OUTPUT, JSON.stringify(diagnostics, null, 2));
  console.log(`📊 Diagnostic report saved to ${DIAGNOSTIC_OUTPUT}`);
  
  // Print summary
  printSummary(diagnostics);
}

/**
 * Get basic environment information
 */
function getEnvironmentInfo() {
  const env = {
    nodeVersion: process.version,
    platform: process.platform,
    packageVersion: 'unknown'
  };
  
  // Get package version
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    env.packageVersion = packageJson.version;
  } catch (err) {
    console.error('Could not read package.json');
  }
  
  return env;
}

/**
 * Attempt to fix missing files
 */
async function fixMissingFiles(missingFiles, diagnostics) {
  // For each missing file, determine how to generate it
  for (const file of missingFiles) {
    console.log(`Attempting to generate: ${file}`);
    
    try {
      if (file === COMPLEXITY_REPORT || file === COMPLEXITY_METRICS) {
        // Run complexity analysis
        console.log('Running complexity analysis...');
        execSync('npm run quality:complexity', { stdio: verbose ? 'inherit' : 'pipe' });
      } else if (file === TEST_RESULTS_FILE && !skipTests) {
        // Run tests to generate test results
        console.log('Running tests to generate results...');
        execSync('npm run test:unit', { stdio: verbose ? 'inherit' : 'pipe' });
      } else if (file === QUALITY_HISTORY || file === IMPROVEMENT_OPPORTUNITIES) {
        // Generate quality history and improvement opportunities
        console.log('Generating quality history...');
        execSync('npm run quality:save-snapshot', { stdio: verbose ? 'inherit' : 'pipe' });
      }
      
      // Check if file now exists
      if (fs.existsSync(file)) {
        console.log(`✅ Successfully generated: ${file}`);
        diagnostics.fileChecks[file].exists = true;
        diagnostics.fileChecks[file].generated = true;
      } else {
        console.error(`❌ Failed to generate: ${file}`);
        diagnostics.issues.push(`Attempted to generate ${file} but failed`);
      }
    } catch (err) {
      console.error(`Error generating ${file}: ${err.message}`);
      diagnostics.issues.push(`Error while generating ${file}: ${err.message}`);
    }
  }
}

/**
 * Collect and validate metrics from each file
 */
async function collectMetrics(diagnostics) {
  console.log('Collecting and validating metrics...');
  
  // Check test results
  if (fs.existsSync(TEST_RESULTS_FILE)) {
    try {
      const testResults = JSON.parse(fs.readFileSync(TEST_RESULTS_FILE, 'utf8'));
      diagnostics.metrics.testResults = testResults;
      
      // Check if test metrics are complete
      if (!testResults.results || !Array.isArray(testResults.results)) {
        diagnostics.issues.push('Test results file does not contain results array');
      } else if (testResults.results.length === 0) {
        diagnostics.issues.push('Test results array is empty');
      }
      
      if (verbose) {
        console.log(`Found ${testResults.results?.length || 0} test results`);
      }
    } catch (err) {
      diagnostics.issues.push(`Error parsing test results: ${err.message}`);
    }
  }
  
  // Check complexity metrics
  if (fs.existsSync(COMPLEXITY_METRICS)) {
    try {
      const complexityMetrics = JSON.parse(fs.readFileSync(COMPLEXITY_METRICS, 'utf8'));
      diagnostics.metrics.complexity = complexityMetrics;
      
      // Check if complexity metrics are complete
      if (!complexityMetrics.metrics) {
        diagnostics.issues.push('Complexity metrics file does not contain metrics object');
      }
      
      if (verbose) {
        console.log('Complexity metrics found');
        if (complexityMetrics.metrics) {
          console.log(`Average complexity: ${complexityMetrics.metrics.averageComplexity || 'unknown'}`);
          console.log(`High complexity functions: ${complexityMetrics.metrics.highComplexityFunctions || 'unknown'}`);
        }
      }
    } catch (err) {
      diagnostics.issues.push(`Error parsing complexity metrics: ${err.message}`);
    }
  }
  
  // Check quality history
  if (fs.existsSync(QUALITY_HISTORY)) {
    try {
      const qualityHistory = JSON.parse(fs.readFileSync(QUALITY_HISTORY, 'utf8'));
      diagnostics.metrics.history = qualityHistory;
      
      // Check if history is complete
      if (!qualityHistory.history || !Array.isArray(qualityHistory.history)) {
        diagnostics.issues.push('Quality history file does not contain history array');
      } else if (qualityHistory.history.length === 0) {
        diagnostics.issues.push('Quality history array is empty');
      }
      
      if (verbose) {
        console.log(`Found ${qualityHistory.history?.length || 0} quality history entries`);
      }
    } catch (err) {
      diagnostics.issues.push(`Error parsing quality history: ${err.message}`);
    }
  }
  
  // Check improvement opportunities
  if (fs.existsSync(IMPROVEMENT_OPPORTUNITIES)) {
    try {
      const opportunities = JSON.parse(fs.readFileSync(IMPROVEMENT_OPPORTUNITIES, 'utf8'));
      diagnostics.metrics.opportunities = opportunities;
      
      // Check if opportunities are complete
      if (!Array.isArray(opportunities)) {
        diagnostics.issues.push('Improvement opportunities file does not contain an array');
      }
      
      if (verbose) {
        console.log(`Found ${opportunities?.length || 0} improvement opportunities`);
        
        // Count high impact issues
        const highImpact = opportunities.filter(o => o.impact === 'high').length;
        console.log(`High impact issues: ${highImpact}`);
      }
    } catch (err) {
      diagnostics.issues.push(`Error parsing improvement opportunities: ${err.message}`);
    }
  }
}

/**
 * Generate recommendations based on findings
 */
function generateRecommendations(diagnostics) {
  // Base recommendations on issues found
  if (diagnostics.issues.length === 0) {
    diagnostics.recommendations.push('All quality metrics appear to be in good shape!');
    return;
  }
  
  // Recommendations for missing files
  const missingFiles = Object.entries(diagnostics.fileChecks)
    .filter(([_, check]) => !check.exists)
    .map(([file]) => file);
  
  if (missingFiles.length > 0) {
    diagnostics.recommendations.push(`Run 'npm run quality:full' to generate all metrics files`);
  }
  
  // Recommendations for specific issues
  if (diagnostics.issues.some(issue => issue.includes('test results'))) {
    diagnostics.recommendations.push(`Run 'npm run test:unit' to generate fresh test results`);
  }
  
  if (diagnostics.issues.some(issue => issue.includes('complexity'))) {
    diagnostics.recommendations.push(`Run 'npm run quality:complexity' to update complexity metrics`);
  }
  
  if (diagnostics.issues.some(issue => issue.includes('history'))) {
    diagnostics.recommendations.push(`Run 'npm run quality:save-snapshot' to update quality history`);
  }
}

/**
 * Print a summary of the diagnostics
 */
function printSummary(diagnostics) {
  console.log('\n📋 QUALITY METRICS DIAGNOSTIC SUMMARY');
  console.log('═════════════════════════════════════\n');
  
  // File status
  console.log('📁 FILE STATUS:');
  const fileStatuses = Object.entries(diagnostics.fileChecks).map(([file, check]) => {
    const status = check.exists ? '✅' : '❌';
    const relativePath = file.replace('./', '');
    return `  ${status} ${relativePath}`;
  });
  console.log(fileStatuses.join('\n'));
  
  // Issues
  if (diagnostics.issues.length > 0) {
    console.log('\n⚠️ ISSUES FOUND:');
    diagnostics.issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
  } else {
    console.log('\n✅ NO ISSUES FOUND');
  }
  
  // Recommendations
  if (diagnostics.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    diagnostics.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
  }
  
  console.log('\n📊 Full diagnostic report saved to:');
  console.log(`  ${DIAGNOSTIC_OUTPUT}`);
}

// Run diagnostics
runDiagnostics().catch(err => {
  console.error('Error running diagnostics:', err);
  process.exit(1);
}); 