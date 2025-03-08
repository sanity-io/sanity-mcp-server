#!/usr/bin/env node

/**
 * Special script for GitHub Actions to generate the quality dashboard
 * This avoids the issues with module detection in GitHub Actions
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Constants
const QUALITY_DIR = './scripts/quality';
const OUTPUT_DIR = path.join(QUALITY_DIR, 'output');
const CHECKPOINT_FILE = path.join(QUALITY_DIR, 'quality-tag-checkpoint.ndjson');
const CHART_FILE = path.join(OUTPUT_DIR, 'quality-metrics-chart.html');
const HISTORY_FILE = path.join(OUTPUT_DIR, 'quality-history.json');
const INDEX_FILE = path.join(OUTPUT_DIR, 'index.html');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Main function
async function buildQualityDashboard() {
  console.log('Building quality dashboard for GitHub Pages');
  
  try {
    // 1. Run ESLint to get issues count
    console.log('Getting ESLint metrics...');
    const eslintIssues = getEslintIssues();
    
    // 2. Get complexity metrics
    console.log('Getting complexity metrics...');
    const complexityMetrics = getComplexityMetrics();
    
    // 3. Get duplication metrics
    console.log('Getting duplication metrics...');
    const duplicationMetrics = getDuplicationMetrics();
    
    // 4. Get coverage metrics
    console.log('Getting coverage metrics...');
    const coverageMetrics = getCoverageMetrics();
    
    // 5. Create a checkpoint
    const checkpoint = {
      date: new Date().toISOString(),
      version: getPackageVersion(),
      metrics: {
        eslint: eslintIssues,
        complexity: complexityMetrics,
        duplication: duplicationMetrics,
        testCoverage: coverageMetrics
      }
    };
    
    // 6. Append to checkpoint file
    if (!fs.existsSync(CHECKPOINT_FILE)) {
      fs.writeFileSync(CHECKPOINT_FILE, '');
    }
    
    fs.appendFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint) + '\n');
    console.log(`Checkpoint saved to ${CHECKPOINT_FILE}`);
    
    // 7. Generate quality history JSON
    const historyData = getHistoryData();
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(historyData));
    console.log(`History data saved to ${HISTORY_FILE}`);
    
    // 8. Generate HTML dashboard
    const html = generateHTML(historyData);
    fs.writeFileSync(CHART_FILE, html);
    console.log(`Chart HTML saved to ${CHART_FILE}`);
    
    // 9. Create index.html that redirects to the chart
    const indexHtml = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;URL='quality-metrics-chart.html'" />
  <title>Redirecting to Quality Dashboard</title>
</head>
<body>
  <p>Redirecting to <a href="quality-metrics-chart.html">Quality Dashboard</a>...</p>
</body>
</html>`;
    
    fs.writeFileSync(INDEX_FILE, indexHtml);
    console.log(`Index redirect saved to ${INDEX_FILE}`);
    
    console.log('Quality dashboard build complete');
  } catch (error) {
    console.error('Error building quality dashboard:', error);
    process.exit(1);
  }
}

function getEslintIssues() {
  try {
    const output = execSync('npm run lint -- -f json', { encoding: 'utf8' });
    const jsonStart = output.indexOf('[');
    const jsonEnd = output.lastIndexOf(']') + 1;
    
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      const jsonOutput = output.substring(jsonStart, jsonEnd);
      const lintResults = JSON.parse(jsonOutput);
      
      let warnings = 0;
      let errors = 0;
      
      lintResults.forEach(file => {
        warnings += file.warningCount || 0;
        errors += file.errorCount || 0;
      });
      
      return { warnings, errors };
    }
    
    return { warnings: 0, errors: 0 };
  } catch (error) {
    console.error('Error running ESLint:', error.message);
    return { warnings: 0, errors: 0 };
  }
}

function getComplexityMetrics() {
  try {
    execSync('npm run complexity', { encoding: 'utf8' });
    
    // Default values
    const metrics = {
      cyclomaticComplexity: { average: 5, max: 20 },
      cognitiveComplexity: { average: 6, max: 25 },
      complexFunctions: { high: 0, medium: 0, low: 0 }
    };
    
    // Check if the report exists
    const reportPath = path.join(OUTPUT_DIR, 'complexity-report.json');
    if (fs.existsSync(reportPath)) {
      const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      let highCount = 0;
      let mediumCount = 0;
      let lowCount = 0;
      
      // Count complex functions
      reportData.forEach(file => {
        if (file.messages) {
          file.messages.forEach(msg => {
            if (msg.ruleId === 'complexity' || msg.ruleId === 'sonarjs/cognitive-complexity') {
              const complexity = msg.message.match(/complexity of (\d+)/);
              if (complexity) {
                const value = parseInt(complexity[1]);
                if (value >= 15) highCount++;
                else if (value >= 10) mediumCount++;
                else lowCount++;
              }
            }
          });
        }
      });
      
      metrics.complexFunctions = { high: highCount, medium: mediumCount, low: lowCount };
      
      // Try to extract cyclomatic and cognitive complexity averages
      let cyclomaticSum = 0;
      let cyclomaticMax = 0;
      let cognitiveSum = 0;
      let cognitiveMax = 0;
      let count = 0;
      
      reportData.forEach(file => {
        if (file.messages) {
          file.messages.forEach(msg => {
            if (msg.ruleId === 'complexity') {
              const complexity = msg.message.match(/complexity of (\d+)/);
              if (complexity) {
                const value = parseInt(complexity[1]);
                cyclomaticSum += value;
                cyclomaticMax = Math.max(cyclomaticMax, value);
                count++;
              }
            }
            if (msg.ruleId === 'sonarjs/cognitive-complexity') {
              const complexity = msg.message.match(/complexity of (\d+)/);
              if (complexity) {
                const value = parseInt(complexity[1]);
                cognitiveSum += value;
                cognitiveMax = Math.max(cognitiveMax, value);
              }
            }
          });
        }
      });
      
      if (count > 0) {
        metrics.cyclomaticComplexity.average = Math.round(cyclomaticSum / count);
        metrics.cyclomaticComplexity.max = cyclomaticMax;
        metrics.cognitiveComplexity.average = Math.round(cognitiveSum / count);
        metrics.cognitiveComplexity.max = cognitiveMax;
      }
    }
    
    return metrics;
  } catch (error) {
    console.error('Error getting complexity metrics:', error.message);
    return {
      cyclomaticComplexity: { average: 5, max: 20 },
      cognitiveComplexity: { average: 6, max: 25 },
      complexFunctions: { high: 0, medium: 0, low: 0 }
    };
  }
}

function getDuplicationMetrics() {
  try {
    execSync('npm run find:duplicates', { encoding: 'utf8' });
    
    const metrics = { percentage: 0, lines: 0 };
    
    // Try to find the report
    const reportDir = path.join(OUTPUT_DIR, 'html');
    if (fs.existsSync(reportDir) && fs.existsSync(path.join(reportDir, 'jscpd-report.json'))) {
      const reportData = JSON.parse(fs.readFileSync(path.join(reportDir, 'jscpd-report.json'), 'utf8'));
      
      if (reportData.statistics && reportData.statistics.total) {
        metrics.percentage = parseFloat(reportData.statistics.total.percentage.toFixed(2));
        metrics.lines = reportData.statistics.total.duplicatedLines;
      }
    }
    
    return metrics;
  } catch (error) {
    console.error('Error getting duplication metrics:', error.message);
    return { percentage: 0, lines: 0 };
  }
}

function getCoverageMetrics() {
  try {
    // Try to run coverage if it works, but don't fail if it doesn't
    try {
      execSync('npm run test:coverage', { encoding: 'utf8' });
    } catch (error) {
      console.warn('Coverage tests failed, using existing coverage data if available');
    }
    
    const metrics = { overall: 0, high: 0, medium: 0, low: 0 };
    
    // Try to find coverage report
    const coverageDir = './coverage';
    if (fs.existsSync(coverageDir)) {
      const summaryPath = path.join(coverageDir, 'coverage-summary.json');
      if (fs.existsSync(summaryPath)) {
        const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
        if (summary.total && summary.total.statements) {
          metrics.overall = Math.round(summary.total.statements.pct);
        }
      }
    }
    
    return metrics;
  } catch (error) {
    console.error('Error getting coverage metrics:', error.message);
    return { overall: 0, high: 0, medium: 0, low: 0 };
  }
}

function getPackageVersion() {
  const pkgPath = './package.json';
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return pkg.version || '0.0.0';
  }
  return '0.0.0';
}

function getHistoryData() {
  // Read the checkpoint file and convert to JSON
  if (!fs.existsSync(CHECKPOINT_FILE)) {
    return [];
  }
  
  const content = fs.readFileSync(CHECKPOINT_FILE, 'utf8');
  const lines = content.trim().split('\n');
  
  const data = lines.map(line => {
    try {
      const checkpoint = JSON.parse(line);
      return {
        date: new Date(checkpoint.date).toISOString().split('T')[0],
        version: checkpoint.version,
        // ESLint metrics
        warnings: checkpoint.metrics.eslint.warnings,
        errors: checkpoint.metrics.eslint.errors,
        // Coverage metrics
        coverage: checkpoint.metrics.testCoverage.overall,
        // Duplication metrics
        duplications: checkpoint.metrics.duplication.percentage,
        duplicatedLines: checkpoint.metrics.duplication.lines || 0,
        // Complexity metrics
        complexFunctions: 
          checkpoint.metrics.complexity.complexFunctions.high +
          checkpoint.metrics.complexity.complexFunctions.medium,
        cyclomaticAvg: checkpoint.metrics.complexity.cyclomaticComplexity.average,
        cyclomaticMax: checkpoint.metrics.complexity.cyclomaticComplexity.max,
        cognitiveAvg: checkpoint.metrics.complexity.cognitiveComplexity.average,
        cognitiveMax: checkpoint.metrics.complexity.cognitiveComplexity.max,
        // Test metrics (if available)
        testsPassed: checkpoint.metrics.testResults ? 
          checkpoint.metrics.testResults.reduce((sum, suite) => sum + suite.passed, 0) : 0,
        testsFailed: checkpoint.metrics.testResults ? 
          checkpoint.metrics.testResults.reduce((sum, suite) => sum + suite.failed, 0) : 0,
        testsTotal: checkpoint.metrics.testResults ? 
          checkpoint.metrics.testResults.reduce((sum, suite) => sum + suite.total, 0) : 0,
        testPassRate: checkpoint.metrics.testResults ? 
          checkpoint.metrics.testResults.reduce((sum, suite) => sum + suite.passed, 0) / 
          Math.max(1, checkpoint.metrics.testResults.reduce((sum, suite) => sum + suite.total, 0)) * 100 : 0
      };
    } catch (error) {
      console.error('Error parsing checkpoint line:', error);
      return null;
    }
  }).filter(Boolean);
  
  return data;
}

function generateHTML(historyData) {
  // Get the latest data point
  const latest = historyData.length > 0 ? historyData[historyData.length - 1] : {
    version: getPackageVersion(),
    warnings: 0,
    errors: 0,
    coverage: 0,
    duplications: 0,
    complexFunctions: 0,
    cyclomaticAvg: 0,
    cyclomaticMax: 0,
    cognitiveAvg: 0,
    cognitiveMax: 0,
    testsPassed: 0,
    testsFailed: 0,
    testsTotal: 0,
    testPassRate: 0
  };
  
  // Get test results data for display
  let testResultsData = [];
  
  try {
    const testResultsPath = path.join(OUTPUT_DIR, 'test-results.json');
    if (fs.existsSync(testResultsPath)) {
      const testResults = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));
      if (testResults.results && Array.isArray(testResults.results)) {
        testResultsData = testResults.results;
      }
    }
  } catch (error) {
    console.error('Error reading test results:', error.message);
  }
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sanity MCP Server - Quality Metrics</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
      color: #333;
    }
    h1, h2, h3 {
      color: #0066cc;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .chart-container {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 20px;
      margin-bottom: 30px;
      height: 400px;
    }
    .half-container {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
    }
    .half-chart {
      flex: 1;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 20px;
      height: 300px;
    }
    .stats-container {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
    }
    .stat-card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 15px;
      min-width: 180px;
      margin: 10px;
      text-align: center;
    }
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #333;
    }
    .stat-label {
      font-size: 14px;
      color: #777;
      margin-top: 5px;
    }
    .version {
      font-size: 18px;
      text-align: center;
      margin-bottom: 20px;
    }
    .timestamp {
      font-size: 14px;
      color: #777;
      text-align: center;
      margin-bottom: 30px;
    }
    .test-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .test-table th {
      background-color: #f2f2f2;
      text-align: left;
      padding: 12px;
      font-weight: bold;
      border-bottom: 2px solid #ddd;
    }
    .test-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #ddd;
    }
    .test-table tr:hover {
      background-color: #f9f9f9;
    }
    .status-passed {
      color: #4CAF50;
      font-weight: bold;
    }
    .status-failed {
      color: #F44336;
      font-weight: bold;
    }
    .importance-critical {
      background-color: #ffebee;
    }
    .importance-high {
      background-color: #fff8e1;
    }
    .importance-medium {
      background-color: #e8f5e9;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Sanity MCP Server - Quality Metrics Dashboard</h1>
    <div class="version">Version: ${latest.version}</div>
    <div class="timestamp">Last updated: ${new Date().toISOString().split('T')[0]}</div>
    
    <!-- Latest stats -->
    <div class="stats-container">
      <div class="stat-card">
        <div class="stat-value">${Math.round(latest.testPassRate || 0)}%</div>
        <div class="stat-label">Test Pass Rate</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">${Math.round(latest.coverage || 0)}%</div>
        <div class="stat-label">Test Coverage</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">${latest.warnings || 0}</div>
        <div class="stat-label">ESLint Warnings</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">${latest.errors || 0}</div>
        <div class="stat-label">ESLint Errors</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">${latest.complexFunctions || 0}</div>
        <div class="stat-label">Complex Functions</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">${latest.duplications || 0}%</div>
        <div class="stat-label">Code Duplication</div>
      </div>
    </div>
    
    <!-- Test results section -->
    <h2>Test Results</h2>
    <div class="half-container">
      <div class="half-chart">
        <canvas id="testPassRateChart"></canvas>
      </div>
      <div class="half-chart">
        <canvas id="testCountChart"></canvas>
      </div>
    </div>
    
    <!-- Test details table if we have data -->
    ${testResultsData.length > 0 ? `
    <h3>Test Suite Details</h3>
    <table class="test-table">
      <thead>
        <tr>
          <th>Test Suite</th>
          <th>Status</th>
          <th>Passed/Total</th>
          <th>Pass Rate</th>
        </tr>
      </thead>
      <tbody>
        ${testResultsData
          .sort((a, b) => {
            // Sort by importance first
            const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            if (importanceOrder[a.importance] !== importanceOrder[b.importance]) {
              return importanceOrder[a.importance] - importanceOrder[b.importance];
            }
            // Then by success status
            if (a.success !== b.success) {
              return a.success ? 1 : -1;
            }
            // Then by name
            return a.name.localeCompare(b.name);
          })
          .map(suite => `
            <tr class="importance-${suite.importance}">
              <td>${suite.name}</td>
              <td class="status-${suite.success ? 'passed' : 'failed'}">${suite.success ? 'PASSED' : 'FAILED'}</td>
              <td>${suite.passed}/${suite.total}</td>
              <td>${suite.total > 0 ? Math.round((suite.passed / suite.total) * 100) : 0}%</td>
            </tr>
          `).join('')}
      </tbody>
    </table>
    ` : '<p>No detailed test results available.</p>'}
    
    <!-- Code quality section -->
    <h2>Code Quality Metrics</h2>
    
    <!-- Complexity charts -->
    <div class="half-container">
      <div class="half-chart">
        <canvas id="cyclomaticChart"></canvas>
      </div>
      <div class="half-chart">
        <canvas id="cognitiveChart"></canvas>
      </div>
    </div>
    
    <!-- ESLint and duplication -->
    <h2>Code Issues Trends</h2>
    <div class="chart-container">
      <canvas id="issuesChart"></canvas>
    </div>
    
    <!-- Test coverage -->
    <h2>Test Coverage</h2>
    <div class="chart-container">
      <canvas id="coverageChart"></canvas>
    </div>
  </div>
  
  <script>
    // Convert the history data from our NodeJS script
    const historyData = ${JSON.stringify(historyData)};
    
    // Extract data for charts
    const dates = historyData.map(item => item.date);
    const versions = historyData.map(item => item.version);
    const warnings = historyData.map(item => item.warnings || 0);
    const errors = historyData.map(item => item.errors || 0);
    const coverage = historyData.map(item => item.coverage || 0);
    const duplications = historyData.map(item => item.duplications || 0);
    const complexFunctions = historyData.map(item => item.complexFunctions || 0);
    const cyclomaticAvg = historyData.map(item => item.cyclomaticAvg || 0);
    const cyclomaticMax = historyData.map(item => item.cyclomaticMax || 0);
    const cognitiveAvg = historyData.map(item => item.cognitiveAvg || 0);
    const cognitiveMax = historyData.map(item => item.cognitiveMax || 0);
    const testsPassed = historyData.map(item => item.testsPassed || 0);
    const testsFailed = historyData.map(item => item.testsFailed || 0);
    const testsTotal = historyData.map(item => item.testsTotal || 0);
    const testPassRate = historyData.map(item => item.testPassRate || 0);
    
    // Create the pass rate chart
    const testPassRateCtx = document.getElementById('testPassRateChart').getContext('2d');
    new Chart(testPassRateCtx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Test Pass Rate (%)',
            data: testPassRate,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.1,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Test Pass Rate Trend'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Pass Rate (%)'
            }
          }
        }
      }
    });
    
    // Create the test count chart
    const testCountCtx = document.getElementById('testCountChart').getContext('2d');
    new Chart(testCountCtx, {
      type: 'bar',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Tests Passed',
            data: testsPassed,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgb(75, 192, 192)',
            borderWidth: 1
          },
          {
            label: 'Tests Failed',
            data: testsFailed,
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Test Counts'
          },
          tooltip: {
            mode: 'index'
          }
        },
        scales: {
          x: {
            stacked: true,
          },
          y: {
            stacked: true,
            title: {
              display: true,
              text: 'Number of Tests'
            }
          }
        }
      }
    });
    
    // Create the cyclomatic complexity chart
    const cyclomaticCtx = document.getElementById('cyclomaticChart').getContext('2d');
    new Chart(cyclomaticCtx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Average',
            data: cyclomaticAvg,
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            tension: 0.1
          },
          {
            label: 'Maximum',
            data: cyclomaticMax,
            borderColor: 'rgb(255, 159, 64)',
            backgroundColor: 'rgba(255, 159, 64, 0.5)',
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Cyclomatic Complexity'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Complexity Score'
            }
          }
        }
      }
    });
    
    // Create the cognitive complexity chart
    const cognitiveCtx = document.getElementById('cognitiveChart').getContext('2d');
    new Chart(cognitiveCtx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Average',
            data: cognitiveAvg,
            borderColor: 'rgb(153, 102, 255)',
            backgroundColor: 'rgba(153, 102, 255, 0.5)',
            tension: 0.1
          },
          {
            label: 'Maximum',
            data: cognitiveMax,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Cognitive Complexity'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Complexity Score'
            }
          }
        }
      }
    });
    
    // Create the code issues chart
    const issuesCtx = document.getElementById('issuesChart').getContext('2d');
    new Chart(issuesCtx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'ESLint Warnings',
            data: warnings,
            borderColor: 'rgb(255, 159, 64)',
            backgroundColor: 'rgba(255, 159, 64, 0.5)',
            tension: 0.1
          },
          {
            label: 'ESLint Errors',
            data: errors,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            tension: 0.1
          },
          {
            label: 'Complex Functions',
            data: complexFunctions,
            borderColor: 'rgb(153, 102, 255)',
            backgroundColor: 'rgba(153, 102, 255, 0.5)',
            tension: 0.1
          },
          {
            label: 'Code Duplication (%)',
            data: duplications,
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Code Issues Over Time'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Count / Percentage'
            }
          }
        }
      }
    });
    
    // Create the coverage chart
    const coverageCtx = document.getElementById('coverageChart').getContext('2d');
    new Chart(coverageCtx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Test Coverage (%)',
            data: coverage,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.1,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Test Coverage Trend'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Coverage (%)'
            }
          }
        }
      }
    });
  </script>
</body>
</html>`;
}

// Run the main function
buildQualityDashboard().catch(error => {
  console.error('Error in buildQualityDashboard:', error);
  process.exit(1);
}); 