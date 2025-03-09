import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

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
  
  // Write the HTML file
  fs.writeFileSync(CHART_HTML_FILE, html);
  console.log(`Quality metrics chart generated at ${CHART_HTML_FILE}`);
  
  // Try to open the file in the default browser
  try {
    const platform = process.platform;
    const command = platform === 'darwin' ? 'open' : 
                    platform === 'win32' ? 'start' : 'xdg-open';
    
    execSync(`${command} "${CHART_HTML_FILE}"`);
  } catch (error) {
    console.log(`Chart generated, but couldn't open automatically. Please open ${CHART_HTML_FILE} in your browser.`);
  }
}

/**
 * Generate HTML content with Chart.js visualizations
 */
function generateHtml(checkpoints) {
  // Extract data for charts
  const dates = checkpoints.map(c => {
    const date = new Date(c.date);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  });
  
  // Format version with tag info
  const versions = checkpoints.map(c => c.isTagged ? `${c.version} (${c.tagName})` : c.version);
  
  // Extract metrics
  const eslintErrors = checkpoints.map(c => c.metrics.eslint.errors);
  const eslintWarnings = checkpoints.map(c => c.metrics.eslint.warnings);
  
  const cyclomaticAvg = checkpoints.map(c => c.metrics.complexity.cyclomaticComplexity.average);
  const cyclomaticMax = checkpoints.map(c => c.metrics.complexity.cyclomaticComplexity.max);
  const cognitiveAvg = checkpoints.map(c => c.metrics.complexity.cognitiveComplexity.average);
  const cognitiveMax = checkpoints.map(c => c.metrics.complexity.cognitiveComplexity.max);
  
  const coverageOverall = checkpoints.map(c => c.metrics.testCoverage.overall);
  const duplicationPercentage = checkpoints.map(c => c.metrics.duplication.percentage);
  
  // Complexity counts by severity
  const complexHigh = checkpoints.map(c => c.metrics.complexity.complexFunctions.high);
  const complexMedium = checkpoints.map(c => c.metrics.complexity.complexFunctions.medium);
  const complexLow = checkpoints.map(c => c.metrics.complexity.complexFunctions.low);
  
  // Coverage counts by level
  const coverageHigh = checkpoints.map(c => c.metrics.testCoverage.high);
  const coverageMedium = checkpoints.map(c => c.metrics.testCoverage.medium);
  const coverageLow = checkpoints.map(c => c.metrics.testCoverage.low);
  
  // Get the latest test results
  const latestTestResults = checkpoints.length > 0 && 
    checkpoints[checkpoints.length - 1].metrics.testResults ? 
    checkpoints[checkpoints.length - 1].metrics.testResults : [];
    
  // Calculate total pass/fail numbers
  const totalTests = latestTestResults.reduce((sum, suite) => sum + suite.total, 0);
  const passedTests = latestTestResults.reduce((sum, suite) => sum + suite.passed, 0);
  const failedTests = latestTestResults.reduce((sum, suite) => sum + suite.failed, 0);
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  
  // Generate the HTML
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
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .chart-container {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 20px;
      margin-bottom: 30px;
    }
    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 30px;
    }
    h2 {
      color: #555;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
      margin-top: 0;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
      gap: 20px;
    }
    .full-width {
      grid-column: 1 / -1;
    }
    .stats-container {
      display: flex;
      justify-content: space-around;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }
    .stat-card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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
    .trend-positive {
      color: #4CAF50;
    }
    .trend-negative {
      color: #F44336;
    }
    .trend-neutral {
      color: #FF9800;
    }
    .test-results-container {
      margin-top: 30px;
      padding: 20px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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
      margin-top: 20px;
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
  </style>
</head>
<body>
  <h1>Sanity MCP Server - Quality Metrics Dashboard</h1>
  
  <!-- Latest stats -->
  <div class="stats-container">
    <div class="stat-card">
      <div class="stat-value">${coverageOverall[coverageOverall.length - 1]}%</div>
      <div class="stat-label">Test Coverage</div>
      <div class="stat-trend ${getTrendClass(coverageOverall)}">${getTrendIndicator(coverageOverall)}</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-value">${eslintWarnings[eslintWarnings.length - 1]}</div>
      <div class="stat-label">ESLint Warnings</div>
      <div class="stat-trend ${getTrendClass(eslintWarnings, true)}">${getTrendIndicator(eslintWarnings, true)}</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-value">${eslintErrors[eslintErrors.length - 1]}</div>
      <div class="stat-label">ESLint Errors</div>
      <div class="stat-trend ${getTrendClass(eslintErrors, true)}">${getTrendIndicator(eslintErrors, true)}</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-value">${complexHigh[complexHigh.length - 1]}</div>
      <div class="stat-label">Complex Functions</div>
      <div class="stat-trend ${getTrendClass(complexHigh, true)}">${getTrendIndicator(complexHigh, true)}</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-value">${duplicationPercentage[duplicationPercentage.length - 1]}%</div>
      <div class="stat-label">Code Duplication</div>
      <div class="stat-trend ${getTrendClass(duplicationPercentage, true)}">${getTrendIndicator(duplicationPercentage, true)}</div>
    </div>
    
    <div class="stat-card">
      <div class="stat-value">${passRate}%</div>
      <div class="stat-label">Test Pass Rate</div>
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
        ${latestTestResults
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
  
  <div class="metrics-grid">
    <!-- Test Coverage Chart -->
    <div class="chart-container">
      <h2>Test Coverage</h2>
      <canvas id="coverageChart"></canvas>
    </div>
    
    <!-- Complexity Chart -->
    <div class="chart-container">
      <h2>Code Complexity</h2>
      <canvas id="complexityChart"></canvas>
    </div>
    
    <!-- ESLint Issues Chart -->
    <div class="chart-container">
      <h2>ESLint Issues</h2>
      <canvas id="eslintChart"></canvas>
    </div>
    
    <!-- Duplication Chart -->
    <div class="chart-container">
      <h2>Code Duplication</h2>
      <canvas id="duplicationChart"></canvas>
    </div>
    
    <!-- Complex Functions Chart -->
    <div class="chart-container">
      <h2>Complex Functions by Severity</h2>
      <canvas id="complexFunctionsChart"></canvas>
    </div>
    
    <!-- Files by Coverage Chart -->
    <div class="chart-container">
      <h2>Files by Coverage Level</h2>
      <canvas id="filesByCoverageChart"></canvas>
    </div>
    
    <!-- Timeline Chart (all metrics) -->
    <div class="chart-container full-width">
      <h2>Quality Metrics Timeline</h2>
      <canvas id="timelineChart"></canvas>
    </div>
  </div>
  
  <script>
    // Common chart options
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true
        }
      }
    };
    
    // Default colors
    const colors = {
      coverage: 'rgba(54, 162, 235, 0.7)',
      eslintErrors: 'rgba(255, 99, 132, 0.7)',
      eslintWarnings: 'rgba(255, 159, 64, 0.7)',
      duplication: 'rgba(75, 192, 192, 0.7)',
      cyclomaticComplexity: 'rgba(153, 102, 255, 0.7)',
      cognitiveComplexity: 'rgba(201, 203, 207, 0.7)',
      high: 'rgba(255, 99, 132, 0.7)',
      medium: 'rgba(255, 159, 64, 0.7)',
      low: 'rgba(75, 192, 192, 0.7)'
    };
    
    // Chart data
    const labels = ${JSON.stringify(versions)};
    const dates = ${JSON.stringify(dates)};
    
    // Create Coverage Chart
    const coverageCtx = document.getElementById('coverageChart').getContext('2d');
    new Chart(coverageCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Overall Coverage (%)',
          data: ${JSON.stringify(coverageOverall)},
          backgroundColor: colors.coverage,
          borderColor: colors.coverage,
          borderWidth: 2,
          tension: 0.3
        }]
      },
      options: {
        ...commonOptions,
        scales: {
          ...commonOptions.scales,
          y: {
            ...commonOptions.scales.y,
            min: Math.max(0, Math.min(...${JSON.stringify(coverageOverall)}) - 5),
            max: Math.min(100, Math.max(...${JSON.stringify(coverageOverall)}) + 5),
            title: {
              display: true,
              text: 'Coverage %'
            }
          }
        }
      }
    });
    
    // Create Complexity Chart
    const complexityCtx = document.getElementById('complexityChart').getContext('2d');
    new Chart(complexityCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Cyclomatic Complexity (Avg)',
            data: ${JSON.stringify(cyclomaticAvg)},
            backgroundColor: colors.cyclomaticComplexity,
            borderColor: colors.cyclomaticComplexity,
            borderWidth: 2,
            tension: 0.3
          },
          {
            label: 'Cognitive Complexity (Avg)',
            data: ${JSON.stringify(cognitiveAvg)},
            backgroundColor: colors.cognitiveComplexity,
            borderColor: colors.cognitiveComplexity,
            borderWidth: 2,
            tension: 0.3
          }
        ]
      },
      options: commonOptions
    });
    
    // Create ESLint Chart
    const eslintCtx = document.getElementById('eslintChart').getContext('2d');
    new Chart(eslintCtx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Errors',
            data: ${JSON.stringify(eslintErrors)},
            backgroundColor: colors.eslintErrors,
            borderColor: colors.eslintErrors,
            borderWidth: 1
          },
          {
            label: 'Warnings',
            data: ${JSON.stringify(eslintWarnings)},
            backgroundColor: colors.eslintWarnings,
            borderColor: colors.eslintWarnings,
            borderWidth: 1
          }
        ]
      },
      options: {
        ...commonOptions,
        scales: {
          ...commonOptions.scales,
          y: {
            ...commonOptions.scales.y,
            title: {
              display: true,
              text: 'Issue Count'
            }
          }
        }
      }
    });
    
    // Create Duplication Chart
    const duplicationCtx = document.getElementById('duplicationChart').getContext('2d');
    new Chart(duplicationCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Duplication (%)',
          data: ${JSON.stringify(duplicationPercentage)},
          backgroundColor: colors.duplication,
          borderColor: colors.duplication,
          borderWidth: 2,
          tension: 0.3
        }]
      },
      options: {
        ...commonOptions,
        scales: {
          ...commonOptions.scales,
          y: {
            ...commonOptions.scales.y,
            min: 0,
            max: Math.min(100, Math.max(...${JSON.stringify(duplicationPercentage)}) + 5),
            title: {
              display: true,
              text: 'Duplication %'
            }
          }
        }
      }
    });
    
    // Create Complex Functions Chart
    const complexFunctionsCtx = document.getElementById('complexFunctionsChart').getContext('2d');
    new Chart(complexFunctionsCtx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'High Complexity',
            data: ${JSON.stringify(complexHigh)},
            backgroundColor: colors.high,
            borderColor: colors.high,
            borderWidth: 1
          },
          {
            label: 'Medium Complexity',
            data: ${JSON.stringify(complexMedium)},
            backgroundColor: colors.medium,
            borderColor: colors.medium,
            borderWidth: 1
          },
          {
            label: 'Low Complexity',
            data: ${JSON.stringify(complexLow)},
            backgroundColor: colors.low,
            borderColor: colors.low,
            borderWidth: 1
          }
        ]
      },
      options: {
        ...commonOptions,
        scales: {
          ...commonOptions.scales,
          y: {
            ...commonOptions.scales.y,
            stacked: true,
            title: {
              display: true,
              text: 'Function Count'
            }
          },
          x: {
            ...commonOptions.scales.x,
            stacked: true
          }
        }
      }
    });
    
    // Create Files by Coverage Chart
    const filesByCoverageCtx = document.getElementById('filesByCoverageChart').getContext('2d');
    new Chart(filesByCoverageCtx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Low Coverage (<30%)',
            data: ${JSON.stringify(coverageLow)},
            backgroundColor: colors.high,
            borderColor: colors.high,
            borderWidth: 1
          },
          {
            label: 'Medium Coverage (30-60%)',
            data: ${JSON.stringify(coverageMedium)},
            backgroundColor: colors.medium,
            borderColor: colors.medium,
            borderWidth: 1
          },
          {
            label: 'High Coverage (>60%)',
            data: ${JSON.stringify(coverageHigh)},
            backgroundColor: colors.low,
            borderColor: colors.low,
            borderWidth: 1
          }
        ]
      },
      options: {
        ...commonOptions,
        scales: {
          ...commonOptions.scales,
          y: {
            ...commonOptions.scales.y,
            stacked: true,
            title: {
              display: true,
              text: 'File Count'
            }
          },
          x: {
            ...commonOptions.scales.x,
            stacked: true
          }
        }
      }
    });
    
    // Create Timeline Chart
    const timelineCtx = document.getElementById('timelineChart').getContext('2d');
    new Chart(timelineCtx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Test Coverage (%)',
            data: ${JSON.stringify(coverageOverall)},
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            tension: 0.3,
            yAxisID: 'y'
          },
          {
            label: 'ESLint Warnings',
            data: ${JSON.stringify(eslintWarnings)},
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 2,
            tension: 0.3,
            yAxisID: 'y1'
          },
          {
            label: 'Code Duplication (%)',
            data: ${JSON.stringify(duplicationPercentage)},
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            tension: 0.3,
            yAxisID: 'y'
          },
          {
            label: 'Cyclomatic Complexity (Avg)',
            data: ${JSON.stringify(cyclomaticAvg)},
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 2,
            tension: 0.3,
            yAxisID: 'y2'
          }
        ]
      },
      options: {
        ...commonOptions,
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Percentage'
            },
            min: 0,
            max: 100
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Count'
            },
            min: 0,
            grid: {
              drawOnChartArea: false
            }
          },
          y2: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Complexity'
            },
            min: 0,
            max: 30,
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Helper function to determine the trend direction for a metric
 * @param {number[]} values - Array of values
 * @param {boolean} [lowerIsBetter=false] - Whether lower values are better (e.g., for errors)
 * @returns {string} - Trend indicator symbol
 */
function getTrendIndicator(values, lowerIsBetter = false) {
  if (values.length < 2) return '—';
  
  const latest = values[values.length - 1];
  const previous = values[values.length - 2];
  
  if (latest === previous) return '—';
  
  const isImproving = lowerIsBetter ? latest < previous : latest > previous;
  return isImproving ? '↑' : '↓';
}

/**
 * Helper function to get CSS class based on trend direction
 * @param {number[]} values - Array of values
 * @param {boolean} [lowerIsBetter=false] - Whether lower values are better (e.g., for errors)
 * @returns {string} - CSS class name
 */
function getTrendClass(values, lowerIsBetter = false) {
  if (values.length < 2) return 'trend-neutral';
  
  const latest = values[values.length - 1];
  const previous = values[values.length - 2];
  
  if (latest === previous) return 'trend-neutral';
  
  const isImproving = lowerIsBetter ? latest < previous : latest > previous;
  return isImproving ? 'trend-positive' : 'trend-negative';
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateQualityChart();
}

export { generateQualityChart }; 