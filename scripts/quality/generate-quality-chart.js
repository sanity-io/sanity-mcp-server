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
      grid-template-columns: repeat(3, 1fr);
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
        <p>Current Average Complexity</p>
      </div>
    </div>
    
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
      <div class="chart-container full-width">
        <canvas id="testResultsChart"></canvas>
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
      type: 'bar',
      data: {
        labels: ${JSON.stringify(dates)},
        datasets: [
          {
            label: 'High Coverage Files',
            data: ${JSON.stringify(coverageHigh)},
            backgroundColor: '#4CAF50'
          },
          {
            label: 'Medium Coverage Files',
            data: ${JSON.stringify(coverageMedium)},
            backgroundColor: '#FF9800'
          },
          {
            label: 'Low Coverage Files',
            data: ${JSON.stringify(coverageLow)},
            backgroundColor: '#F44336'
          }
        ]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Test Coverage Distribution',
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
        labels: ${JSON.stringify(latestTestResults.map(suite => suite.name))},
        datasets: [
          {
            label: 'Passed',
            data: ${JSON.stringify(latestTestResults.map(suite => suite.passed))},
            backgroundColor: '#4CAF50'
          },
          {
            label: 'Failed',
            data: ${JSON.stringify(latestTestResults.map(suite => suite.failed))},
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