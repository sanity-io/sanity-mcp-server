import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';

// File paths
const CHECKPOINT_FILE = './scripts/quality/quality-tag-checkpoint.ndjson';
const CHART_OUTPUT_DIR = './scripts/quality/output';
const CHART_HTML_FILE = path.join(CHART_OUTPUT_DIR, 'quality-metrics-chart.html');

/**
 * Generate an HTML chart from the NDJSON checkpoints file
 */
function generateQualityChart() {
  console.log('Generating quality metrics chart...');
  
  // Read the NDJSON file
  if (!fs.existsSync(CHECKPOINT_FILE)) {
    console.error(`Checkpoint file not found: ${CHECKPOINT_FILE}`);
    console.error('Run quality:save-snapshot first to generate data');
    return;
  }
  
  const content = fs.readFileSync(CHECKPOINT_FILE, 'utf8');
  const lines = content.trim().split('\n');
  
  if (lines.length === 0) {
    console.error('No checkpoints found in file');
    return;
  }
  
  // Parse each line as JSON
  const checkpoints = lines.map(line => {
    try {
      return JSON.parse(line);
    } catch (e) {
      console.warn(`Error parsing line: ${line}`);
      return null;
    }
  }).filter(Boolean);
  
  if (checkpoints.length === 0) {
    console.error('No valid checkpoints found');
    return;
  }
  
  // Generate the HTML
  const html = generateHtml(checkpoints);
  
  // Ensure output directory exists
  if (!fs.existsSync(CHART_OUTPUT_DIR)) {
    fs.mkdirSync(CHART_OUTPUT_DIR, { recursive: true });
  }
  
  // Write HTML to file
  fs.writeFileSync(CHART_HTML_FILE, html);
  console.log(`Quality metrics chart generated at ${CHART_HTML_FILE}`);
}

/**
 * Generate HTML content with Chart.js visualizations
 */
function generateHtml(checkpoints) {
  // Extract version info
  const dates = checkpoints.map(c => new Date(c.date).toLocaleDateString());
  
  // Format version with tag info
  const versions = checkpoints.map(c => c.isTagged ? `${c.version} (${c.tagName})` : c.version);
  
  // Extract metrics
  const eslintErrors = checkpoints.map(c => c.metrics.eslint.errors);
  const eslintWarnings = checkpoints.map(c => c.metrics.eslint.warnings);
  
  // Handle different complexity metric formats
  const cyclomaticAvg = checkpoints.map(c => {
    if (c.metrics.complexity.cyclomaticComplexity?.average) {
      return c.metrics.complexity.cyclomaticComplexity.average;
    } else if (c.metrics.complexity.averageComplexity) {
      return c.metrics.complexity.averageComplexity;
    } else {
      return 0;  // Default if not found
    }
  });
  
  const cyclomaticMax = checkpoints.map(c => {
    if (c.metrics.complexity.cyclomaticComplexity?.max) {
      return c.metrics.complexity.cyclomaticComplexity.max;
    } else if (c.metrics.complexity.maxComplexity) {
      return c.metrics.complexity.maxComplexity;
    } else {
      return 0;  // Default if not found
    }
  });
  
  const cognitiveAvg = checkpoints.map(c => {
    if (c.metrics.complexity.cognitiveComplexity?.average) {
      return c.metrics.complexity.cognitiveComplexity.average;
    } else {
      return 0;  // Default if not found
    }
  });
  
  const cognitiveMax = checkpoints.map(c => {
    if (c.metrics.complexity.cognitiveComplexity?.max) {
      return c.metrics.complexity.cognitiveComplexity.max;
    } else {
      return 0;  // Default if not found
    }
  });
  
  const coverageOverall = checkpoints.map(c => {
    if (typeof c.metrics.testCoverage.overall === 'number') {
      return c.metrics.testCoverage.overall;
    } else {
      return 0;  // Default if not found
    }
  });
  
  const duplicationPercentage = checkpoints.map(c => {
    if (typeof c.metrics.duplication.percentage === 'number') {
      return c.metrics.duplication.percentage;
    } else {
      return 0;  // Default if not found
    }
  });
  
  // Complexity counts by severity
  const complexHigh = checkpoints.map(c => {
    if (c.metrics.complexity.complexFunctions?.high) {
      return c.metrics.complexity.complexFunctions.high;
    } else if (c.metrics.complexity.highComplexityFunctions) {
      return c.metrics.complexity.highComplexityFunctions;
    } else {
      return 0;  // Default if not found
    }
  });
  
  const complexMedium = checkpoints.map(c => {
    if (c.metrics.complexity.complexFunctions?.medium) {
      return c.metrics.complexity.complexFunctions.medium;
    } else if (c.metrics.complexity.mediumComplexityFunctions) {
      return c.metrics.complexity.mediumComplexityFunctions;
    } else {
      return 0;  // Default if not found
    }
  });
  
  const complexLow = checkpoints.map(c => {
    if (c.metrics.complexity.complexFunctions?.low) {
      return c.metrics.complexity.complexFunctions.low;
    } else if (c.metrics.complexity.lowComplexityFunctions) {
      return c.metrics.complexity.lowComplexityFunctions;
    } else {
      return 0;  // Default if not found
    }
  });
  
  // Coverage counts by level
  const coverageHigh = checkpoints.map(c => {
    if (c.metrics.testCoverage.filesByCoverage?.high) {
      return c.metrics.testCoverage.filesByCoverage.high;
    } else if (c.metrics.testCoverage.highCoverage) {
      return c.metrics.testCoverage.highCoverage;
    } else {
      return 0;  // Default if not found
    }
  });
  
  const coverageMedium = checkpoints.map(c => {
    if (c.metrics.testCoverage.filesByCoverage?.medium) {
      return c.metrics.testCoverage.filesByCoverage.medium;
    } else if (c.metrics.testCoverage.mediumCoverage) {
      return c.metrics.testCoverage.mediumCoverage;
    } else {
      return 0;  // Default if not found
    }
  });
  
  const coverageLow = checkpoints.map(c => {
    if (c.metrics.testCoverage.filesByCoverage?.low) {
      return c.metrics.testCoverage.filesByCoverage.low;
    } else if (c.metrics.testCoverage.lowCoverage) {
      return c.metrics.testCoverage.lowCoverage;
    } else {
      return 0;  // Default if not found
    }
  });
  
  // Get the latest test results
  const latestTestResults = checkpoints.length > 0 && 
    checkpoints[checkpoints.length - 1].metrics.testResults ? 
    checkpoints[checkpoints.length - 1].metrics.testResults : [];
    
  // Ensure testResults is an array
  const testResultsArray = Array.isArray(latestTestResults) ? latestTestResults : [];
    
  // Calculate total pass/fail numbers
  const totalTests = testResultsArray.reduce((sum, suite) => sum + suite.total, 0);
  const passedTests = testResultsArray.reduce((sum, suite) => sum + suite.passed, 0);
  const failedTests = testResultsArray.reduce((sum, suite) => sum + suite.failed, 0);
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  
  // Helper function to determine trend direction
  function getTrendIndicator(values, lowerIsBetter = false) {
    if (values.length < 2) return '—';
    
    const latest = values[values.length - 1];
    const previous = values[values.length - 2];
    
    if (latest === previous) return '—';
    
    const isImproving = lowerIsBetter ? latest < previous : latest > previous;
    return isImproving ? '↑' : '↓';
  }
  
  // Helper function to get CSS class based on trend
  function getTrendClass(values, lowerIsBetter = false) {
    if (values.length < 2) return 'trend-neutral';
    
    const latest = values[values.length - 1];
    const previous = values[values.length - 2];
    
    if (latest === previous) return 'trend-neutral';
    
    const isImproving = lowerIsBetter ? latest < previous : latest > previous;
    return isImproving ? 'trend-positive' : 'trend-negative';
  }
  
  // Generate the HTML
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sanity MCP Quality Metrics</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f7f7f7;
      color: #333;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      margin-bottom: 30px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      color: #333;
    }
    .dashboard {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    .chart-container {
      background-color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .full-width {
      grid-column: 1 / -1;
    }
    .stats-container {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 20px;
      margin-bottom: 20px;
    }
    .stat-card {
      background-color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }
    .stat-card h2 {
      margin: 0;
      font-size: 28px;
      font-weight: bold;
    }
    .stat-card p {
      margin: 5px 0 0;
      font-size: 14px;
      color: #666;
    }
    .pass-rate {
      color: ${passRate > 90 ? '#4CAF50' : passRate > 80 ? '#FF9800' : '#F44336'};
    }
    /* Trend indicators */
    .trend-positive {
      color: #4CAF50;
    }
    .trend-negative {
      color: #F44336;
    }
    .trend-neutral {
      color: #FF9800;
    }
    /* Test results table styles */
    .test-results-container {
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 20px;
      margin-top: 20px;
      overflow-x: auto;
    }
    .test-results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .test-summary {
      display: flex;
      gap: 20px;
    }
    .test-metric {
      text-align: center;
    }
    .test-metric-value {
      font-size: 24px;
      font-weight: bold;
    }
    .test-metric-label {
      font-size: 14px;
      color: #777;
    }
    .test-table {
      width: 100%;
      border-collapse: collapse;
    }
    .test-table th {
      background-color: #f2f2f2;
      padding: 10px;
      text-align: left;
      border-bottom: 2px solid #ddd;
    }
    .test-table td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
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
      background-color: #FFEBEE;
    }
    .importance-high {
      background-color: #FFF8E1;
    }
    .section-heading {
      font-size: 18px;
      margin: 30px 0 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #ddd;
    }
    @media (max-width: 768px) {
      .dashboard {
        grid-template-columns: 1fr;
      }
      .stats-container {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Sanity MCP Quality Metrics - ${new Date().toLocaleDateString()}</h1>
    </div>
    
    <div class="stats-container">
      <div class="stat-card">
        <h2 class="pass-rate">${passRate}%</h2>
        <p>Test Pass Rate</p>
      </div>
      <div class="stat-card">
        <h2>${totalTests}</h2>
        <p>Total Tests</p>
      </div>
      <div class="stat-card">
        <h2>${checkpoints.length > 0 ? cyclomaticAvg[cyclomaticAvg.length-1].toFixed(2) : 'N/A'}</h2>
        <p>Average Complexity</p>
        <div class="${getTrendClass(cyclomaticAvg, true)}">${getTrendIndicator(cyclomaticAvg, true)}</div>
      </div>
      <div class="stat-card">
        <h2>${checkpoints.length > 0 ? cyclomaticMax[cyclomaticMax.length-1] : 'N/A'}</h2>
        <p>Max Complexity</p>
        <div class="${getTrendClass(cyclomaticMax, true)}">${getTrendIndicator(cyclomaticMax, true)}</div>
      </div>
      <div class="stat-card">
        <h2>${eslintWarnings[eslintWarnings.length - 1]}</h2>
        <p>ESLint Warnings</p>
        <div class="${getTrendClass(eslintWarnings, true)}">${getTrendIndicator(eslintWarnings, true)}</div>
      </div>
      <div class="stat-card">
        <h2>${duplicationPercentage[duplicationPercentage.length - 1].toFixed(1)}%</h2>
        <p>Code Duplication</p>
        <div class="${getTrendClass(duplicationPercentage, true)}">${getTrendIndicator(duplicationPercentage, true)}</div>
      </div>
    </div>
    
    <!-- Test Results Section -->
    <div class="test-results-container">
      <div class="test-results-header">
        <h2>Test Results</h2>
        <div class="test-summary">
          <div class="test-metric">
            <div class="test-metric-value">${totalTests}</div>
            <div class="test-metric-label">Total Tests</div>
          </div>
          <div class="test-metric">
            <div class="test-metric-value status-passed">${passedTests}</div>
            <div class="test-metric-label">Passed</div>
          </div>
          <div class="test-metric">
            <div class="test-metric-value status-failed">${failedTests}</div>
            <div class="test-metric-label">Failed</div>
          </div>
        </div>
      </div>
      <table class="test-table">
        <thead>
          <tr>
            <th>Test Suite</th>
            <th>Status</th>
            <th>Passed</th>
            <th>Failed</th>
            <th>Total</th>
            <th>Files</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          ${testResultsArray
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
                <td>${suite.passed}</td>
                <td>${suite.failed}</td>
                <td>${suite.total}</td>
                <td>${suite.files}</td>
                <td>${suite.duration}s</td>
              </tr>
            `).join('')}
        </tbody>
      </table>
    </div>
    
    <h3 class="section-heading">Metrics Charts</h3>
    
    <div class="dashboard">
      <div class="chart-container">
        <canvas id="eslintChart"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="complexityChart"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="complexityDistributionChart"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="coverageChart"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="duplicationChart"></canvas>
      </div>
      <div class="chart-container">
        <canvas id="filesByCoverageChart"></canvas>
      </div>
      <div class="chart-container full-width">
        <canvas id="testResultsChart"></canvas>
      </div>
      <div class="chart-container full-width">
        <canvas id="timelineChart"></canvas>
      </div>
    </div>
  </div>

  <script>
    // Chart Configuration
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    Chart.defaults.color = '#666';
    
    // ESLint Issues Chart
    const eslintCtx = document.getElementById('eslintChart').getContext('2d');
    const eslintChart = new Chart(eslintCtx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(dates)},
        datasets: [
          {
            label: 'Errors',
            data: ${JSON.stringify(eslintErrors)},
            borderColor: '#F44336',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            tension: 0.1,
            fill: true
          },
          {
            label: 'Warnings',
            data: ${JSON.stringify(eslintWarnings)},
            borderColor: '#FF9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            tension: 0.1,
            fill: true
          }
        ]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'ESLint Issues Over Time',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Count'
            }
          }
        }
      }
    });
    
    // Complexity Chart
    const complexityCtx = document.getElementById('complexityChart').getContext('2d');
    const complexityChart = new Chart(complexityCtx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(dates)},
        datasets: [
          {
            label: 'Cyclomatic Avg',
            data: ${JSON.stringify(cyclomaticAvg)},
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.1,
            yAxisID: 'y',
            fill: true
          },
          {
            label: 'Cyclomatic Max',
            data: ${JSON.stringify(cyclomaticMax)},
            borderColor: '#F44336',
            backgroundColor: 'transparent',
            tension: 0.1,
            yAxisID: 'y1',
            borderDash: [5, 5]
          }
        ]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Code Complexity Trends',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Average Complexity'
            },
            suggestedMax: 10
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            title: {
              display: true,
              text: 'Max Complexity'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
    
    // Complexity Distribution Chart
    const complexityDistCtx = document.getElementById('complexityDistributionChart').getContext('2d');
    const complexityDistChart = new Chart(complexityDistCtx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(dates)},
        datasets: [
          {
            label: 'High',
            data: ${JSON.stringify(complexHigh)},
            backgroundColor: '#F44336'
          },
          {
            label: 'Medium',
            data: ${JSON.stringify(complexMedium)},
            backgroundColor: '#FF9800'
          },
          {
            label: 'Low',
            data: ${JSON.stringify(complexLow)},
            backgroundColor: '#4CAF50'
          }
        ]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Complex Functions Distribution',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date'
            },
            stacked: true
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Count'
            },
            stacked: true
          }
        }
      }
    });
    
    // Coverage Chart
    const coverageCtx = document.getElementById('coverageChart').getContext('2d');
    const coverageChart = new Chart(coverageCtx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(dates)},
        datasets: [
          {
            label: 'Overall Coverage (%)',
            data: ${JSON.stringify(coverageOverall)},
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            borderColor: 'rgba(54, 162, 235, 1)',
            tension: 0.1,
            fill: true
          }
        ]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Test Coverage Trend',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Coverage %'
            }
          }
        }
      }
    });
    
    // Duplication Chart
    const duplicationCtx = document.getElementById('duplicationChart').getContext('2d');
    const duplicationChart = new Chart(duplicationCtx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(dates)},
        datasets: [
          {
            label: 'Duplication Percentage',
            data: ${JSON.stringify(duplicationPercentage)},
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            tension: 0.1,
            fill: true
          }
        ]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Code Duplication Trend',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Duplication %'
            }
          }
        }
      }
    });
    
    // Files by Coverage Chart
    const filesByCoverageCtx = document.getElementById('filesByCoverageChart').getContext('2d');
    const filesByCoverageChart = new Chart(filesByCoverageCtx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(dates)},
        datasets: [
          {
            label: 'High Coverage',
            data: ${JSON.stringify(coverageHigh)},
            backgroundColor: '#4CAF50'
          },
          {
            label: 'Medium Coverage',
            data: ${JSON.stringify(coverageMedium)},
            backgroundColor: '#FF9800'
          },
          {
            label: 'Low Coverage',
            data: ${JSON.stringify(coverageLow)},
            backgroundColor: '#F44336'
          }
        ]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Files by Coverage Level',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date'
            },
            stacked: true
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Files'
            },
            stacked: true
          }
        }
      }
    });
    
    // Test Results Chart
    const testResultsCtx = document.getElementById('testResultsChart').getContext('2d');
    const testResultsChart = new Chart(testResultsCtx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(testResultsArray.map(suite => suite.name))},
        datasets: [
          {
            label: 'Passed',
            data: ${JSON.stringify(testResultsArray.map(suite => suite.passed))},
            backgroundColor: '#4CAF50'
          },
          {
            label: 'Failed',
            data: ${JSON.stringify(testResultsArray.map(suite => suite.failed))},
            backgroundColor: '#F44336'
          }
        ]
      },
      options: {
        indexAxis: 'y',
        plugins: {
          title: {
            display: true,
            text: 'Current Test Results by Suite',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            stacked: true,
            title: {
              display: true,
              text: 'Number of Tests'
            }
          },
          y: {
            stacked: true,
            title: {
              display: true,
              text: 'Test Suite'
            }
          }
        }
      }
    });
    
    // Timeline Chart (all metrics in one)
    const timelineCtx = document.getElementById('timelineChart').getContext('2d');
    const timelineChart = new Chart(timelineCtx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(dates)},
        datasets: [
          {
            label: 'Test Coverage (%)',
            data: ${JSON.stringify(coverageOverall)},
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'transparent',
            tension: 0.1,
            yAxisID: 'y-percent'
          },
          {
            label: 'Duplication (%)',
            data: ${JSON.stringify(duplicationPercentage)},
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'transparent',
            tension: 0.1,
            yAxisID: 'y-percent'
          },
          {
            label: 'Complex Functions',
            data: ${JSON.stringify(complexHigh)},
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'transparent',
            tension: 0.1,
            yAxisID: 'y-count'
          },
          {
            label: 'ESLint Issues',
            data: ${JSON.stringify(eslintErrors.map((e, i) => e + eslintWarnings[i]))},
            borderColor: 'rgba(255, 159, 64, 1)',
            backgroundColor: 'transparent',
            tension: 0.1,
            yAxisID: 'y-count'
          }
        ]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'All Metrics Timeline',
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          },
          'y-percent': {
            type: 'linear',
            display: true,
            position: 'left',
            min: 0,
            max: 100,
            title: {
              display: true,
              text: 'Percentage'
            }
          },
          'y-count': {
            type: 'linear',
            display: true,
            position: 'right',
            grid: {
              drawOnChartArea: false
            },
            title: {
              display: true,
              text: 'Count'
            }
          }
        }
      }
    });
  </script>
</body>
</html>`;
}

// Run if this is the main module
if (import.meta.url === pathToFileURL(process.argv[1])?.href) {
  generateQualityChart();
}

// For testing
export { generateQualityChart, generateHtml }; 