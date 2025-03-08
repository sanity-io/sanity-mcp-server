#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TEST_RESULTS_FILE = './scripts/quality/output/test-results.json';
const TEST_RESULTS_DIR = path.dirname(TEST_RESULTS_FILE);

/**
 * Collects test results from different test suites
 * Returns a JSON structure with test results
 */
function collectTestResults() {
  console.log('Collecting test results...');
  
  // Define test suites in order of importance
  const testSuites = [
    { 
      name: 'Core Integration Tests', 
      command: 'npm run test:integration:critical -- --reporter json',
      importance: 'critical'
    },
    { 
      name: 'Standard Integration Tests', 
      command: 'npm run test:integration:standard -- --reporter json',
      importance: 'high'
    },
    { 
      name: 'Extended Integration Tests', 
      command: 'npm run test:integration:extended -- --reporter json',
      importance: 'medium'
    },
    { 
      name: 'Unit Tests', 
      command: 'npm run test:unit -- --reporter json',
      importance: 'high'
    },
    { 
      name: 'Controller Tests', 
      command: 'npm run test:controllers -- --reporter json',
      importance: 'medium'
    }
  ];
  
  const results = [];
  
  // Run each test suite and collect results
  for (const suite of testSuites) {
    console.log(`Running ${suite.name}...`);
    try {
      const output = execSync(suite.command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
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

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  collectTestResults();
}

// Helper function to convert URL to path (for ES modules)
function fileURLToPath(url) {
  if (url.startsWith('file://')) {
    return new URL(url).pathname;
  }
  return url;
}

export { collectTestResults }; 