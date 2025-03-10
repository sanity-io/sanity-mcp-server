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
 *   --skip-all         Skip all steps, just generate dashboard from existing data
 *   --profile, -p      Show detailed timing information
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';

// Parse command line arguments
const args = process.argv.slice(2);
const skipTests = args.includes('--skip-tests');
const skipComplexity = args.includes('--skip-complexity');
const profiling = args.includes('--profile') || args.includes('-p');
const skipAll = args.includes('--skip-all'); // Uses all existing files

// File paths
const QUALITY_DIR = './scripts/quality';
const OUTPUT_DIR = path.join(QUALITY_DIR, 'output');
const CHART_HTML_FILE = path.join(OUTPUT_DIR, 'quality-metrics-chart.html');
const TEST_RESULTS_FILE = path.join(OUTPUT_DIR, 'test-results.json');
const PROFILE_LOG = path.join(OUTPUT_DIR, 'dashboard-profile.log');

// Record start time for performance tracking
const startTime = Date.now();
const timings = {};

/**
 * A helper function to measure and log the duration of operations
 */
function measureTime(operation, callback) {
  const start = Date.now();
  console.log(`🕒 Starting ${operation}...`);
  
  try {
    const result = callback();
    const end = Date.now();
    const duration = (end - start) / 1000;
    
    // Store timing information
    timings[operation] = duration;
    
    console.log(`✅ ${operation} completed in ${duration.toFixed(2)}s`);
    return result;
  } catch (err) {
    const end = Date.now();
    const duration = (end - start) / 1000;
    
    // Store timing information for failed operations too
    timings[operation] = duration;
    
    console.error(`❌ ${operation} failed after ${duration.toFixed(2)}s: ${err.message}`);
    throw err;
  }
}

/**
 * Execute a command and measure its execution time
 */
function execWithTiming(command, operation, options = {}) {
  return measureTime(operation, () => {
    try {
      return execSync(command, { stdio: 'inherit', ...options });
    } catch (err) {
      // If the command fails but we're continuing anyway, don't rethrow
      if (options.continueOnError) {
        console.warn(`⚠️ Command failed but continuing: ${command}`);
        return null;
      }
      throw err;
    }
  });
}

/**
 * Checks if a file exists and is recent (within the last hour)
 */
function isFileRecentAndValid(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  
  try {
    // Check if the file is readable and contains valid data
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content || content.trim().length === 0) {
      return false;
    }
    
    // Check if the file is recent (less than 1 hour old)
    const stats = fs.statSync(filePath);
    const fileAge = Date.now() - stats.mtimeMs;
    return fileAge < 3600000; // 1 hour in milliseconds
  } catch (err) {
    console.warn(`Error checking file ${filePath}: ${err.message}`);
    return false;
  }
}

/**
 * Main function to generate dashboard quickly
 */
async function generateFastDashboard() {
  console.log('🚀 Generating fast quality dashboard...');
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  try {
    // OPTIMIZATION STRATEGY:
    // 1. Run only unit tests for faster execution
    // 2. Pass appropriate flags to scripts to avoid duplicate work
    // 3. NEVER use stale data - always run the minimal set of tests needed
    
    // Step 1: Run only unit tests if needed
    const testResultsExist = isFileRecentAndValid(TEST_RESULTS_FILE);
    
    if (!skipTests && !skipAll) {
      // We only need to run unit tests and collect them directly
      // Skip the controller and integration tests for speed
      execWithTiming('npm run test:unit', 'Unit Tests', { continueOnError: true });
      
      // Collect test results and any unit test results
      // Skip TypeScript type checking for faster execution
      // Skip running integration tests but use fresh unit test data
      execWithTiming(
        'node scripts/quality/collect-test-results.js --skip-integration --skip-typecheck', 
        'Test Results Collection'
      );
    } else if (skipTests || skipAll) {
      console.log('⚠️ WARNING: Skipping tests as requested. Dashboard will NOT be accurate!');
      console.log('   This should ONLY be used for development purposes.');
      console.log('   Run a full dashboard before committing or reviewing metrics.');
      
      // Even when skipping tests, we should make it clear they're being skipped
      // rather than using stale data silently
      execWithTiming(
        'node scripts/quality/collect-test-results.js --skip-integration --skip-unit --skip-controllers', 
        'Test Results Collection (SKIPPED - no test data will be available)'
      );
    }
    
    // Step 2: Run complexity analysis if needed
    if (!skipComplexity && !skipAll) {
      // Break this down into smaller steps for more detailed profiling
      measureTime('Complexity Analysis', () => {
        execWithTiming('npm run complexity', 'ESLint Complexity Check', { continueOnError: true });
        execWithTiming('node scripts/quality/analyze-complexity.js', 'Complexity Data Processing');
      });
    } else if (skipComplexity || skipAll) {
      console.log('⚠️ WARNING: Skipping complexity analysis as requested. Dashboard will NOT be accurate!');
      console.log('   This should ONLY be used for development purposes.');
      console.log('   Run a full dashboard before committing or reviewing metrics.');
    }
    
    // Step 3: Generate quality snapshot
    if (!skipAll) {
      // Pass the flags to indicate what data we are/aren't collecting
      const snapshotFlags = [];
      if (skipTests) snapshotFlags.push('--skip-tests');
      if (profiling) snapshotFlags.push('--verbose');
      
      execWithTiming(
        `npm run quality:save-snapshot -- ${snapshotFlags.join(' ')}`, 
        'Quality Snapshot Generation'
      );
    } else {
      console.log('⚠️ WARNING: Skipping snapshot generation as requested. Dashboard will NOT be accurate!');
      console.log('   This should ONLY be used for development purposes.');
      console.log('   Run a full dashboard before committing or reviewing metrics.');
    }
    
    // Step 4: Generate the dashboard
    execWithTiming('npm run quality:visualize', 'Chart Generation');
    
    // Calculate and display performance stats
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`\n✅ Fast dashboard generated in ${duration.toFixed(2)}s`);
    
    // Display warning banner if any steps were skipped
    if (skipTests || skipComplexity || skipAll) {
      console.log('\n');
      console.log('⚠️ ════════════════════════════════════════════════ ⚠️');
      console.log('⚠️    WARNING: DASHBOARD CONTAINS PARTIAL DATA     ⚠️');
      console.log('⚠️ Steps were skipped - metrics are NOT complete   ⚠️');
      console.log('⚠️ Use only for development, NOT for evaluation    ⚠️');
      console.log('⚠️ ════════════════════════════════════════════════ ⚠️');
      console.log('\n');
    }
    
    console.log(`📊 Dashboard available at: ${CHART_HTML_FILE}`);
    
    // Print timing information if profiling is enabled
    if (profiling) {
      printTimingInfo(duration);
    }
    
    // Run verification tests
    const testsOk = runSelfTests();
    if (!testsOk) {
      console.log('\n⚠️ Some verification tests failed. Dashboard may be incomplete.');
      console.log('   Run the diagnostic tool for more information:');
      console.log('   node scripts/quality/diagnose-metrics.js --verbose');
    }
    
    return { success: true, duration };
  } catch (err) {
    console.error('Error generating dashboard:', err);
    
    // Print timing information even if there was an error
    if (profiling) {
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      printTimingInfo(duration);
    }
    
    return { success: false, error: err.message };
  }
}

/**
 * Print detailed timing information
 */
function printTimingInfo(totalDuration) {
  console.log('\n📊 DASHBOARD GENERATION PROFILING');
  console.log('══════════════════════════════════');
  
  // Sort operations by duration (descending)
  const sortedTimings = Object.entries(timings)
    .sort((a, b) => b[1] - a[1]);
  
  // Calculate percentage of total time
  sortedTimings.forEach(([operation, duration]) => {
    const percentage = (duration / totalDuration * 100).toFixed(1);
    const bar = generateBar(percentage);
    console.log(`${operation.padEnd(30)} ${duration.toFixed(2)}s ${bar} ${percentage}%`);
  });
  
  // Save profiling information to a log file
  const logContent = JSON.stringify({
    timestamp: new Date().toISOString(),
    totalDuration,
    timings,
    args: process.argv.slice(2)
  }, null, 2);
  
  fs.writeFileSync(PROFILE_LOG, logContent);
  console.log(`\nProfiling data saved to: ${PROFILE_LOG}`);
}

/**
 * Generate a simple bar chart for console output
 */
function generateBar(percentage) {
  const width = 20;
  const filled = Math.round(percentage / 100 * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
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
  if (fs.existsSync(TEST_RESULTS_FILE)) {
    try {
      const testResults = JSON.parse(fs.readFileSync(TEST_RESULTS_FILE, 'utf8'));
      if (testResults.results && Array.isArray(testResults.results)) {
        console.log(`✅ Test results captured (${testResults.results.length} test suites)`);
        
        // Check for integration tests
        const integrationTests = testResults.results.filter(suite => 
          suite.name.includes('Integration Tests'));
        if (integrationTests.length > 0) {
          console.log(`   Including ${integrationTests.length} integration test suites`);
        } else {
          console.warn('⚠️ No integration test results found in the dashboard');
          // Not failing the test for this, just warning
        }
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

// Check if this is being run directly or imported
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

// If this module is the main program, run the dashboard generation
if (isMainModule) {
  generateFastDashboard().catch(err => {
    console.error('Fatal error generating dashboard:', err);
    process.exit(1);
  });
}

// Export functions for testing
export { generateFastDashboard, runSelfTests, measureTime }; 