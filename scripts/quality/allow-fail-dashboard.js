#!/usr/bin/env node
/**
 * Modified Quality Dashboard Generator
 * 
 * This script generates a quality dashboard while allowing test failures.
 * It captures test failures rather than stopping the dashboard generation.
 * 
 * Usage:
 *   node scripts/quality/allow-fail-dashboard.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// File paths
const QUALITY_DIR = './scripts/quality';
const OUTPUT_DIR = path.join(QUALITY_DIR, 'output');
const CHART_HTML_FILE = path.join(OUTPUT_DIR, 'quality-metrics-chart.html');
const TEST_RESULTS_FILE = path.join(OUTPUT_DIR, 'test-results.json');

// Record start time for performance tracking
const startTime = Date.now();

/**
 * A helper function to measure and log the duration of operations
 */
function measureTime(operation, callback) {
  const start = Date.now();
  console.log(`🕒 Starting ${operation}...`);
  
  try {
    const result = callback();
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`✅ ${operation} completed in ${duration}s`);
    return result;
  } catch (error) {
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`⚠️ ${operation} encountered issues after ${duration}s`);
    console.error(error.message);
    return null;
  }
}

/**
 * Execute a command and capture its output, allowing failures
 */
function execAllowFail(command, operation) {
  return measureTime(operation, () => {
    try {
      return execSync(command, { stdio: 'pipe', encoding: 'utf8' });
    } catch (err) {
      console.error(`⚠️ Command failed: ${command}`);
      console.error(`⚠️ This is expected if tests are failing, continuing with dashboard generation.`);
      
      // Instead of failing, return an object indicating the failure
      return {
        failed: true,
        error: err.message,
        output: err.stdout?.toString() || '',
        stderr: err.stderr?.toString() || ''
      };
    }
  });
}

/**
 * Main function to generate dashboard with failure tolerance
 */
async function generateDashboard() {
  console.log('🚀 Generating quality dashboard (allowing test failures)...');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Run complexity check - generate fresh complexity data
  execAllowFail('npm run complexity', 'Complexity Analysis');
  
  // Run complexity analysis to generate metrics
  execAllowFail('npm run quality:analyze', 'Metrics Analysis');

  // Run unit tests - allow failures
  const unitTestResult = execAllowFail('npm run test:unit', 'Unit Tests');
  console.log(unitTestResult?.failed ? '⚠️ Unit tests have failures' : '✅ Unit tests completed');

  // Try to run core integration tests - allow failures
  const coreTestResult = execAllowFail('npm run test:core', 'Core Integration Tests');
  console.log(coreTestResult?.failed ? '⚠️ Core tests have failures' : '✅ Core tests completed');

  // Generate visualization
  execAllowFail('npm run quality:visualize', 'Quality Visualization');
  
  // Check if chart was generated
  if (fs.existsSync(CHART_HTML_FILE)) {
    console.log(`📊 Quality dashboard generated at ${CHART_HTML_FILE}`);
  } else {
    console.error('❌ Failed to generate quality dashboard chart');
  }

  // Calculate and log total duration
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`🏁 Dashboard generation completed in ${totalDuration}s`);
}

// Run the dashboard generation
generateDashboard().catch(error => {
  console.error('Fatal error generating dashboard:', error);
  process.exit(1);
}); 