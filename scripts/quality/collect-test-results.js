#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const TEST_RESULTS_FILE = './scripts/quality/output/test-results.json';
const TEST_RESULTS_DIR = path.dirname(TEST_RESULTS_FILE);

/**
 * Collects test results from different test suites
 * @param {Object} options - Collection options
 * @param {boolean} options.useExisting - Use existing test results if available
 * @param {boolean} options.skipIntegration - Skip integration tests (faster)
 * @param {boolean} options.verbose - Show detailed output
 * @returns {Array} A JSON structure with test results
 */
function collectTestResults(options = {}) {
  const { useExisting = false, skipIntegration = false, verbose = false } = options;

  console.log('Collecting test results...');
  
  // Check if we should use existing results
  if (useExisting && fs.existsSync(TEST_RESULTS_FILE)) {
    try {
      console.log('Using existing test results...');
      const savedResults = JSON.parse(fs.readFileSync(TEST_RESULTS_FILE, 'utf8'));
      if (savedResults && savedResults.results && savedResults.results.length > 0) {
        console.log(`Loaded ${savedResults.results.length} test suite results`);
        return savedResults.results;
      }
    } catch (error) {
      console.error(`Error reading existing test results: ${error.message}`);
      console.log('Falling back to running tests...');
    }
  }
  
  // Define test suites in order of importance
  let testSuites = [
    { 
      name: 'Core Integration Tests', 
      command: 'npm run test:integration:critical -- --reporter json',
      importance: 'critical',
      type: 'integration'
    },
    { 
      name: 'Standard Integration Tests', 
      command: 'npm run test:integration:standard -- --reporter json',
      importance: 'high',
      type: 'integration'
    },
    { 
      name: 'Extended Integration Tests', 
      command: 'npm run test:integration:extended -- --reporter json',
      importance: 'medium',
      type: 'integration'
    },
    { 
      name: 'Unit Tests', 
      command: 'npm run test:unit -- --reporter json',
      importance: 'high',
      type: 'unit'
    },
    { 
      name: 'Controller Tests', 
      command: 'npm run test:controllers -- --reporter json',
      importance: 'medium',
      type: 'unit'
    }
  ];
  
  // Apply filters if required
  if (skipIntegration) {
    console.log('Skipping integration tests for faster results...');
    testSuites = testSuites.filter(suite => suite.type !== 'integration');
  }
  
  const results = [];
  
  // Run each test suite and collect results
  for (const suite of testSuites) {
    console.log(`Running ${suite.name}...`);
    try {
      const output = execSync(suite.command, { 
        encoding: 'utf8', 
        stdio: ['pipe', 'pipe', verbose ? 'inherit' : 'pipe'] 
      });
      const jsonStart = output.indexOf('{');
      if (jsonStart >= 0) {
        const jsonOutput = output.substring(jsonStart);
        const result = JSON.parse(jsonOutput);
        
        results.push({
          name: suite.name,
          importance: suite.importance,
          passed: result.numPassedTests,
          failed: result.numFailedTests,
          total: result.numTotalTests,
          success: result.numFailedTests === 0,
          files: result.numTotalTestSuites,
          duration: result.startTime && result.endTime ? 
            Math.round((result.endTime - result.startTime) / 1000) : 0
        });
      } else {
        console.error(`Could not find JSON output for ${suite.name}`);
        results.push({
          name: suite.name,
          importance: suite.importance,
          passed: 0,
          failed: 0,
          total: 0,
          success: false,
          files: 0,
          duration: 0,
          error: 'Failed to parse output'
        });
      }
    } catch (error) {
      console.error(`Error running ${suite.name}: ${error.message}`);
      results.push({
        name: suite.name,
        importance: suite.importance,
        passed: 0,
        failed: 0, 
        total: 0,
        success: false,
        files: 0,
        duration: 0,
        error: error.message
      });
    }
  }
  
  // Save results to file
  if (!fs.existsSync(TEST_RESULTS_DIR)) {
    fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
  }
  
  fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify({ 
    timestamp: new Date().toISOString(),
    results: results
  }, null, 2));
  
  console.log(`Test results saved to ${TEST_RESULTS_FILE}`);
  return results;
}

// Parse command line arguments
const args = process.argv.slice(2);
const useExisting = args.includes('--use-existing');
const skipIntegration = args.includes('--skip-integration');
const verbose = args.includes('--verbose');

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  collectTestResults({ useExisting, skipIntegration, verbose });
}

export { collectTestResults }; 