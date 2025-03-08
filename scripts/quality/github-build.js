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
      cyclomaticComplexity: { average: 0, max: 0 },
      cognitiveComplexity: { average: 0, max: 0 },
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
    }
    
    return metrics;
  } catch (error) {
    console.error('Error getting complexity metrics:', error.message);
    return {
      cyclomaticComplexity: { average: 0, max: 0 },
      cognitiveComplexity: { average: 0, max: 0 },
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
        warnings: checkpoint.metrics.eslint.warnings,
        errors: checkpoint.metrics.eslint.errors,
        coverage: checkpoint.metrics.testCoverage.overall,
        duplications: checkpoint.metrics.duplication.percentage,
        complexFunctions: 
          checkpoint.metrics.complexity.complexFunctions.high +
          checkpoint.metrics.complexity.complexFunctions.medium
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
    complexFunctions: 0
  };
  
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
    h1, h2 {
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
    .stats-container {
      display: flex;
      flex-wrap: wrap;
    }
    .stat-card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 15px;
      min-width: 200px;
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
        <div class="stat-value">${latest.coverage}%</div>
        <div class="stat-label">Test Coverage</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">${latest.warnings}</div>
        <div class="stat-label">ESLint Warnings</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">${latest.errors}</div>
        <div class="stat-label">ESLint Errors</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">${latest.complexFunctions}</div>
        <div class="stat-label">Complex Functions</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-value">${latest.duplications}%</div>
        <div class="stat-label">Code Duplication</div>
      </div>
    </div>
    
    <!-- Charts -->
    <h2>Trends Over Time</h2>
    <div class="chart-container">
      <canvas id="qualityChart"></canvas>
    </div>
    
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
    const warnings = historyData.map(item => item.warnings);
    const errors = historyData.map(item => item.errors);
    const coverage = historyData.map(item => item.coverage);
    const duplications = historyData.map(item => item.duplications);
    const complexFunctions = historyData.map(item => item.complexFunctions);
    
    // Create the quality metrics chart
    const qualityCtx = document.getElementById('qualityChart').getContext('2d');
    new Chart(qualityCtx, {
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
        scales: {
          y: {
            beginAtZero: true
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
        scales: {
          y: {
            beginAtZero: true,
            max: 100
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