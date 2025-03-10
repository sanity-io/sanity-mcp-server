#!/usr/bin/env node
/**
 * Quality Metrics Validation Module
 * 
 * This script validates that all required metrics are present and valid
 * before allowing dashboard generation. Implements hard fail approach.
 */

import fs from 'fs';
import path from 'path';
import { validateTestResults } from './collect-test-results.js';
import { validateComplexityData } from './analyze-complexity.js';

// File paths
const TEST_RESULTS_FILE = './scripts/quality/output/test-results.json';
const COMPLEXITY_METRICS = './scripts/quality/output/complexity-metrics.json';
const COVERAGE_REPORT = './scripts/quality/output/coverage-summary.json';
const VALIDATION_RESULT = './scripts/quality/output/validation-result.json';

/**
 * Validates all required metrics data before dashboard generation
 * @param {Object} options - Validation options
 * @param {boolean} [options.verbose=false] - Whether to show detailed output
 * @returns {Object} Validation result with status and detailed info
 * @throws {Error} If validation fails
 */
export function validateAllMetrics(options = { verbose: false }) {
  const { verbose = false } = options;
  console.log('Validating quality metrics data...');
  
  const validationResult = {
    timestamp: new Date().toISOString(),
    validationPassed: false,
    testResults: { passed: false, details: {} },
    complexity: { passed: false, details: {} },
    coverage: { passed: false, details: {} }
  };
  
  try {
    // 1. Validate test results
    console.log('Validating test results...');
    if (!fs.existsSync(TEST_RESULTS_FILE)) {
      throw new Error(`Test results file not found at ${TEST_RESULTS_FILE}`);
    }
    
    const testResultsData = JSON.parse(fs.readFileSync(TEST_RESULTS_FILE, 'utf8'));
    if (!testResultsData || !testResultsData.results) {
      throw new Error('Invalid test results data structure');
    }
    
    validateTestResults(testResultsData.results);
    validationResult.testResults.passed = true;
    validationResult.testResults.details = {
      suites: testResultsData.results.length,
      totalTests: testResultsData.results.reduce((sum, suite) => sum + suite.total, 0),
      passedTests: testResultsData.results.reduce((sum, suite) => sum + suite.passed, 0)
    };
    console.log('✓ Test results validation passed');
    
    // 2. Validate complexity metrics
    console.log('Validating complexity metrics...');
    if (!fs.existsSync(COMPLEXITY_METRICS)) {
      throw new Error(`Complexity metrics file not found at ${COMPLEXITY_METRICS}`);
    }
    
    const complexityData = JSON.parse(fs.readFileSync(COMPLEXITY_METRICS, 'utf8'));
    if (!complexityData || !complexityData.metrics) {
      throw new Error('Invalid complexity metrics data structure');
    }
    
    // Validate with imported function
    validateComplexityData({
      functions: complexityData.topFunctions,
      totalFiles: complexityData.metrics.totalFiles,
      timestamp: complexityData.timestamp
    });
    
    validationResult.complexity.passed = true;
    validationResult.complexity.details = {
      files: complexityData.metrics.totalFiles,
      functions: complexityData.metrics.totalFunctions,
      highComplexity: complexityData.metrics.highComplexityFunctions
    };
    console.log('✓ Complexity metrics validation passed');
    
    // 3. Validate coverage data
    console.log('Validating coverage data...');
    if (!fs.existsSync(COVERAGE_REPORT)) {
      throw new Error(`Coverage report not found at ${COVERAGE_REPORT}`);
    }
    
    const coverageData = JSON.parse(fs.readFileSync(COVERAGE_REPORT, 'utf8'));
    if (!coverageData || !coverageData.total) {
      throw new Error('Invalid coverage data structure');
    }
    
    // Basic validation of coverage data
    if (!coverageData.total.statements || !coverageData.total.lines) {
      throw new Error('Coverage data is missing required metrics');
    }
    
    // Ensure coverage timestamp is recent (within an hour)
    const coverageTimestamp = coverageData.timestamp || new Date().toISOString();
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    if (new Date(coverageTimestamp) < oneHourAgo) {
      throw new Error('Coverage data is too old. Regenerate with current code.');
    }
    
    validationResult.coverage.passed = true;
    validationResult.coverage.details = {
      coverage: coverageData.total.statements.pct,
      files: Object.keys(coverageData).filter(key => key !== 'total').length
    };
    console.log('✓ Coverage data validation passed');
    
    // All validations passed
    validationResult.validationPassed = true;
    console.log('✓ All metrics validations passed');
    
    // Save validation result
    fs.writeFileSync(VALIDATION_RESULT, JSON.stringify(validationResult, null, 2));
    
    return validationResult;
    
  } catch (error) {
    console.error(`ERROR: Metrics validation failed: ${error.message}`);
    
    // Save failed validation result
    validationResult.error = error.message;
    fs.writeFileSync(VALIDATION_RESULT, JSON.stringify(validationResult, null, 2));
    
    throw new Error(`Metrics validation failed: ${error.message}`);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const verbose = process.argv.includes('--verbose');
    validateAllMetrics({ verbose });
    console.log('All metrics validated successfully. Dashboard generation can proceed.');
  } catch (error) {
    console.error('ERROR: Metrics validation failed:');
    console.error(error.message);
    process.exit(1); // Hard fail with non-zero exit code
  }
}

export default validateAllMetrics; 