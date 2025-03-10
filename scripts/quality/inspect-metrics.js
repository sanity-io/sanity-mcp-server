#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the quality checkpoint file
const CHECKPOINT_FILE = path.join(__dirname, 'quality-tag-checkpoint.ndjson');

/**
 * Inspects the metrics data to verify key metrics are present
 */
function inspectMetricsData() {
  console.log('🔍 Inspecting quality metrics data...');
  
  if (!fs.existsSync(CHECKPOINT_FILE)) {
    console.error(`Error: Checkpoint file not found: ${CHECKPOINT_FILE}`);
    process.exit(1);
  }
  
  // Read the checkpoint file
  const fileContent = fs.readFileSync(CHECKPOINT_FILE, 'utf8');
  const lines = fileContent.split('\n').filter(line => line.trim() !== '');
  
  // Parse the checkpoints
  const checkpoints = lines.map(line => {
    try {
      return JSON.parse(line);
    } catch (error) {
      console.error(`Error parsing line: ${line}`);
      return null;
    }
  }).filter(cp => cp !== null);
  
  if (checkpoints.length === 0) {
    console.error('No valid checkpoints found in the file');
    process.exit(1);
  }
  
  // Get the latest checkpoint
  const latestCheckpoint = checkpoints[checkpoints.length - 1];
  
  console.log('\n📊 Latest Metrics Summary:');
  console.log(`Date: ${new Date(latestCheckpoint.date).toLocaleString()}`);
  console.log(`Version: ${latestCheckpoint.version}`);
  
  // Display complexity metrics
  console.log('\n🔄 Complexity Metrics:');
  const complexity = latestCheckpoint.metrics.complexity;
  
  if (complexity.cyclomaticComplexity) {
    console.log(`  Cyclomatic Avg: ${complexity.cyclomaticComplexity.average}`);
    console.log(`  Cyclomatic Max: ${complexity.cyclomaticComplexity.max}`);
    console.log(`  Total Functions: ${complexity.cyclomaticComplexity.count}`);
  } else {
    console.log('  ❌ No cyclomatic complexity data found');
  }
  
  if (complexity.cognitiveComplexity) {
    console.log(`  Cognitive Avg: ${complexity.cognitiveComplexity.average}`);
    console.log(`  Cognitive Max: ${complexity.cognitiveComplexity.max}`);
  } else {
    console.log('  ❌ No cognitive complexity data found');
  }
  
  if (complexity.complexFunctions) {
    console.log(`  High Complexity Functions: ${complexity.complexFunctions.high}`);
    console.log(`  Medium Complexity Functions: ${complexity.complexFunctions.medium}`);
    console.log(`  Low Complexity Functions: ${complexity.complexFunctions.low}`);
  } else {
    console.log('  ❌ No complex function distribution data found');
  }
  
  // Display test coverage metrics
  console.log('\n📝 Test Coverage Metrics:');
  const coverage = latestCheckpoint.metrics.testCoverage;
  
  console.log(`  Overall Coverage: ${coverage.overall}%`);
  
  if (coverage.filesByCoverage) {
    console.log(`  High Coverage Files: ${coverage.filesByCoverage.high}`);
    console.log(`  Medium Coverage Files: ${coverage.filesByCoverage.medium}`);
    console.log(`  Low Coverage Files: ${coverage.filesByCoverage.low}`);
  } else {
    console.log('  ❌ No file coverage distribution data found');
  }
  
  // Display test results
  console.log('\n🧪 Test Results:');
  const testResults = latestCheckpoint.metrics.testResults;
  
  if (testResults && testResults.length > 0) {
    console.log(`  Total Test Suites: ${testResults.length}`);
    const totalTests = testResults.reduce((sum, suite) => sum + suite.total, 0);
    const passedTests = testResults.reduce((sum, suite) => sum + suite.passed, 0);
    const failedTests = testResults.reduce((sum, suite) => sum + suite.failed, 0);
    
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed Tests: ${passedTests}`);
    console.log(`  Failed Tests: ${failedTests}`);
    console.log(`  Pass Rate: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%`);
    
    // Show individual test suites
    console.log('\n  Test Suites:');
    testResults.forEach(suite => {
      console.log(`    - ${suite.name}: ${suite.passed}/${suite.total} passed, ${suite.files} files`);
    });
  } else {
    console.log('  ❌ No test results found');
  }
  
  // Compare with previous checkpoint to check for regressions
  if (checkpoints.length > 1) {
    const previousCheckpoint = checkpoints[checkpoints.length - 2];
    
    console.log('\n📈 Changes Since Previous Checkpoint:');
    
    // Compare complexity metrics
    const prevComplexity = previousCheckpoint.metrics.complexity;
    if (complexity.cyclomaticComplexity && prevComplexity.cyclomaticComplexity) {
      const avgChange = complexity.cyclomaticComplexity.average - prevComplexity.cyclomaticComplexity.average;
      const maxChange = complexity.cyclomaticComplexity.max - prevComplexity.cyclomaticComplexity.max;
      
      console.log(`  Cyclomatic Avg: ${avgChange > 0 ? '↑' : avgChange < 0 ? '↓' : '—'} ${Math.abs(avgChange).toFixed(2)}`);
      console.log(`  Cyclomatic Max: ${maxChange > 0 ? '↑' : maxChange < 0 ? '↓' : '—'} ${Math.abs(maxChange)}`);
    }
    
    // Compare test coverage
    const prevCoverage = previousCheckpoint.metrics.testCoverage;
    if (coverage.overall && prevCoverage.overall) {
      const coverageChange = coverage.overall - prevCoverage.overall;
      console.log(`  Overall Coverage: ${coverageChange > 0 ? '↑' : coverageChange < 0 ? '↓' : '—'} ${Math.abs(coverageChange).toFixed(2)}%`);
    }
  }
  
  console.log('\n✅ Metrics inspection complete');
}

// Run the inspection
inspectMetricsData(); 