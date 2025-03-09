#!/usr/bin/env node
/**
 * Fast Quality Dashboard Generator
 * 
 * This script generates a quality dashboard without running integration tests
 * or other time-consuming operations. It's designed for quick feedback during
 * local development.
 * 
 * Usage:
 *   node scripts/quality/fast-dashboard.js [--skip-tests] [--skip-complexity]
 * 
 * Options:
 *   --skip-tests       Skip running unit tests (use existing results)
 *   --skip-complexity  Skip complexity analysis (use existing results)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Parse command line arguments
const args = process.argv.slice(2);
const skipTests = args.includes('--skip-tests');
const skipComplexity = args.includes('--skip-complexity');

// File paths
const QUALITY_DIR = './scripts/quality';
const OUTPUT_DIR = path.join(QUALITY_DIR, 'output');
const CHART_HTML_FILE = path.join(OUTPUT_DIR, 'quality-metrics-chart.html');
const TEST_RESULTS_FILE = path.join(OUTPUT_DIR, 'test-results.json');

// Record start time for performance tracking
const startTime = Date.now();

/**
 * Main function to generate dashboard quickly
 */
async function generateFastDashboard() {
  console.log('🚀 Generating fast quality dashboard...');
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Step 1: Run only unit tests if needed
  if (!skipTests) {
    console.log('📊 Running unit tests...');
    try {
      execSync('npm run test:unit', { stdio: 'inherit' });
    } catch (err) {
      console.warn('⚠️ Some tests failed, but continuing with dashboard generation');
    }
  } else {
    console.log('⏩ Skipping tests (using existing results)');
  }
  
  // Step 2: Run complexity analysis if needed
  if (!skipComplexity) {
    console.log('🔍 Running complexity analysis...');
    try {
      execSync('npm run quality:complexity', { stdio: 'inherit' });
    } catch (err) {
      console.error('❌ Error running complexity analysis:', err.message);
    }
  } else {
    console.log('⏩ Skipping complexity analysis (using existing results)');
  }
  
  // Step 3: Generate quality snapshot using existing data
  console.log('📸 Generating quality snapshot...');
  try {
    execSync('npm run quality:save-snapshot -- --skip-tests', { stdio: 'inherit' });
  } catch (err) {
    console.error('❌ Error generating quality snapshot:', err.message);
  }
  
  // Step 4: Generate the dashboard
  console.log('🖼️ Building dashboard...');
  try {
    execSync('npm run quality:chart', { stdio: 'inherit' });
  } catch (err) {
    console.error('❌ Error generating chart:', err.message);
  }
  
  // Calculate and display performance stats
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log(`\n✅ Fast dashboard generated in ${duration.toFixed(2)}s`);
  console.log(`📊 Dashboard available at: ${CHART_HTML_FILE}`);
}

/**
 * Tests to verify dashboard generation
 */
function runSelfTests() {
  let testsPassed = true;
  console.log('\n🧪 Running self-tests to verify dashboard...');
  
  // Test 1: Verify dashboard file exists
  if (fs.existsSync(CHART_HTML_FILE)) {
    console.log('✅ Dashboard HTML file exists');
  } else {
    console.error('❌ Dashboard HTML file not generated');
    testsPassed = false;
  }
  
  // Test 2: Verify dashboard contains some content
  if (fs.existsSync(CHART_HTML_FILE)) {
    const content = fs.readFileSync(CHART_HTML_FILE, 'utf8');
    if (content.includes('<canvas') && content.length > 1000) {
      console.log('✅ Dashboard contains chart data');
    } else {
      console.error('❌ Dashboard appears incomplete or corrupt');
      testsPassed = false;
    }
  }
  
  // Test 3: Verify test results were captured (if tests were run)
  if (!skipTests && fs.existsSync(TEST_RESULTS_FILE)) {
    try {
      const testResults = JSON.parse(fs.readFileSync(TEST_RESULTS_FILE, 'utf8'));
      if (testResults.results && Array.isArray(testResults.results)) {
        console.log(`✅ Test results captured (${testResults.results.length} tests)`);
      } else {
        console.error('❌ Test results file has invalid format');
        testsPassed = false;
      }
    } catch (err) {
      console.error('❌ Error reading test results:', err.message);
      testsPassed = false;
    }
  }
  
  return testsPassed;
}

// Generate the dashboard and run verification tests
generateFastDashboard()
  .then(() => {
    // Run verification tests after dashboard generation
    const testsOk = runSelfTests();
    if (!testsOk) {
      console.log('\n⚠️ Some verification tests failed. Dashboard may be incomplete.');
      console.log('   Run the diagnostic tool for more information:');
      console.log('   node scripts/quality/diagnose-metrics.js --verbose');
    }
  })
  .catch(err => {
    console.error('Error generating dashboard:', err);
    process.exit(1);
  }); 