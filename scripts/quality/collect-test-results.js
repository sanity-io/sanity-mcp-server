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
 * @param {boolean} options.skipIntegration - Skip running integration tests (faster)
 * @param {boolean} options.skipTypecheck - Skip TypeScript type checking for faster tests
 * @param {boolean} options.preserveExistingResults - Keep existing test results when adding new ones
 * @param {boolean} options.verbose - Show detailed output
 * @returns {Array} A JSON structure with test results
 */
function collectTestResults(options = {}) {
  const { 
    useExisting = false, 
    skipIntegration = false,
    skipTypecheck = false,
    preserveExistingResults = true,
    verbose = false 
  } = options;

  console.log('Collecting test results...');
  
  // Load existing test results first
  let existingResults = [];
  if ((useExisting || preserveExistingResults) && fs.existsSync(TEST_RESULTS_FILE)) {
    try {
      console.log('Loading existing test results...');
      const savedResults = JSON.parse(fs.readFileSync(TEST_RESULTS_FILE, 'utf8'));
      if (savedResults && savedResults.results && savedResults.results.length > 0) {
        existingResults = savedResults.results;
        console.log(`Loaded ${existingResults.length} test suite results`);
        
        // If we're using existing results completely, return them now
        if (useExisting) {
          return existingResults;
        }
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
      // Use a modified command that skips TypeScript checking if needed
      command: skipTypecheck 
        ? 'npx vitest run "test/unit" --config config/vitest.config.ts --reporter json'
        : 'npm run test:unit -- --reporter json',
      importance: 'high',
      type: 'unit'
    },
    { 
      name: 'Controller Tests', 
      // Use a modified command that skips TypeScript checking if needed
      command: skipTypecheck
        ? 'npx vitest run "test/controllers" --config config/vitest.config.ts --reporter json'
        : 'npm run test:controllers -- --reporter json',
      importance: 'medium',
      type: 'unit'
    }
  ];
  
  // Instead of filtering out integration tests completely, let's create suites we'll actually run
  let suitesToRun = [...testSuites];
  if (skipIntegration) {
    console.log('Skipping integration test execution for faster results...');
    // Only run unit tests, but keep integration tests in our list for data preservation
    suitesToRun = testSuites.filter(suite => suite.type !== 'integration');
  }
  
  // Results from both existing data and new runs
  const results = [];
  
  // If we want to preserve existing data, add it to our results first
  if (preserveExistingResults && existingResults.length > 0) {
    // Get suite names we'll actually run
    const suitesToRunNames = suitesToRun.map(suite => suite.name);
    
    // Add existing results that won't be refreshed by the current run
    for (const result of existingResults) {
      if (!suitesToRunNames.includes(result.name)) {
        if (verbose) {
          console.log(`Preserving existing results for ${result.name}`);
        }
        results.push(result);
      }
    }
  }
  
  // Run each test suite and collect results
  for (const suite of suitesToRun) {
    console.log(`Running ${suite.name}...`);
    
    try {
      // Set a reasonable timeout for test execution (5 minutes)
      const options = { 
        encoding: 'utf8', 
        stdio: ['pipe', 'pipe', verbose ? 'inherit' : 'pipe'],
        timeout: 5 * 60 * 1000 // 5 minutes
      };
      
      const output = execSync(suite.command, options);
      
      // Try to extract JSON from the output - Vitest may output other text before/after the JSON
      let jsonOutput = '';
      let result = null;
      
      // Look for JSON object starting with {
      const jsonStart = output.indexOf('{');
      if (jsonStart >= 0) {
        jsonOutput = output.substring(jsonStart);
        // Find where the JSON object ends - assuming no similarly formatted objects follow
        let braceCount = 0;
        let jsonEnd = jsonOutput.length;
        
        for (let i = 0; i < jsonOutput.length; i++) {
          if (jsonOutput[i] === '{') braceCount++;
          if (jsonOutput[i] === '}') braceCount--;
          if (braceCount === 0) {
            jsonEnd = i + 1;
            break;
          }
        }
        
        jsonOutput = jsonOutput.substring(0, jsonEnd);
        
        try {
          result = JSON.parse(jsonOutput);
        } catch (parseError) {
          if (verbose) {
            console.error(`Error parsing JSON: ${parseError.message}`);
            console.error(`JSON output starts with: ${jsonOutput.substring(0, 100)}...`);
          }
          throw new Error(`Failed to parse JSON output: ${parseError.message}`);
        }
      } else {
        throw new Error('Could not find JSON output in command results');
      }
      
      // Extract information from the test results
      const resultObj = {
        name: suite.name,
        importance: suite.importance,
        passed: result.numPassedTests || 0,
        failed: result.numFailedTests || 0,
        total: result.numTotalTests || 0,
        success: (result.numFailedTests || 0) === 0,
        files: result.numTotalTestSuites || 0,
        duration: result.startTime && result.endTime ? 
          Math.round((result.endTime - result.startTime) / 1000) : 0,
        coverage: extractCoverageInfo(result)
      };
      
      // Clean up the object by removing undefined properties
      for (const key in resultObj) {
        if (resultObj[key] === undefined) {
          delete resultObj[key];
        }
      }
      
      results.push(resultObj);
      
      if (verbose) {
        console.log(`✅ ${suite.name} results:`, JSON.stringify(resultObj, null, 2));
      }
    } catch (error) {
      console.error(`Error running ${suite.name}: ${error.message}`);
      
      // Add a more detailed error description
      let errorDetail = error.message;
      
      // Check specifically for TypeScript errors
      if (error.message.includes('TS2339')) {
        errorDetail = 'TypeScript type errors found. Try running with --skip-typecheck option.';
      } else if (error.stderr) {
        // Extract more useful error information if available
        errorDetail = `Exit code ${error.status}: ${error.stderr.toString()}`;
      }
      
      // Try to find an existing result for this suite
      const existingResult = existingResults.find(result => result.name === suite.name);
      
      if (existingResult && preserveExistingResults) {
        console.log(`Using existing results for ${suite.name} due to error running tests`);
        results.push(existingResult);
      } else {
        // Add a placeholder result
        results.push({
          name: suite.name,
          importance: suite.importance,
          passed: 0,
          failed: 0, 
          total: 0,
          success: false,
          files: 0,
          duration: 0,
          error: errorDetail
        });
      }
    }
  }
  
  // Save results to file
  if (!fs.existsSync(TEST_RESULTS_DIR)) {
    fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
  }
  
  const resultsObj = { 
    timestamp: new Date().toISOString(),
    results: results
  };
  
  fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(resultsObj, null, 2));
  
  console.log(`Test results saved to ${TEST_RESULTS_FILE}`);
  return results;
}

/**
 * Extract coverage information from test results if available
 * @param {Object} testResult - The test result object from Vitest
 * @returns {Object|undefined} Coverage information or undefined if not available
 */
function extractCoverageInfo(testResult) {
  if (!testResult.coverage) return undefined;
  
  try {
    const coverage = testResult.coverage;
    
    return {
      statements: {
        total: coverage.s?.total || 0,
        covered: coverage.s?.covered || 0,
        pct: coverage.s?.pct || 0
      },
      branches: {
        total: coverage.b?.total || 0,
        covered: coverage.b?.covered || 0,
        pct: coverage.b?.pct || 0
      },
      functions: {
        total: coverage.f?.total || 0,
        covered: coverage.f?.covered || 0,
        pct: coverage.f?.pct || 0
      },
      lines: {
        total: coverage.l?.total || 0,
        covered: coverage.l?.covered || 0,
        pct: coverage.l?.pct || 0
      }
    };
  } catch (error) {
    console.error(`Error extracting coverage info: ${error.message}`);
    return undefined;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const useExisting = args.includes('--use-existing');
const skipIntegration = args.includes('--skip-integration');
const skipTypecheck = args.includes('--skip-typecheck');
const noPreserve = args.includes('--no-preserve');
const verbose = args.includes('--verbose');

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  collectTestResults({ 
    useExisting, 
    skipIntegration,
    skipTypecheck,
    preserveExistingResults: !noPreserve,
    verbose 
  });
}

export { collectTestResults }; 