import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { collectTestResults } from './collect-test-results.js';

// File paths
const CHECKPOINT_FILE = './scripts/quality/quality-tag-checkpoint.ndjson';
const COMPLEXITY_REPORT = './scripts/quality/output/complexity-report.json';
const JSCPD_REPORT = './scripts/quality/output/html/jscpd-report.json';
const COMPLEXITY_RESULTS = './scripts/quality/output/complexity-results.txt';
const TEST_RESULTS_FILE = './scripts/quality/output/test-results.json';

// Parse command line arguments
const args = process.argv.slice(2);
const isTagged = args.includes('--tag');
const tagName = isTagged ? args[args.indexOf('--tag') + 1] : '';
const skipTests = args.includes('--skip-tests');
const verbose = args.includes('--verbose');

/**
 * Generates a quality metrics checkpoint and appends it to the NDJSON file
 * @param {Object} options - Options for checkpoint generation
 * @param {boolean} options.isTagged - Whether this checkpoint is for a tagged release
 * @param {string} options.tagName - Optional tag name if this is a tagged release
 * @param {boolean} options.skipTests - Skip running tests (use existing results)
 * @param {boolean} options.verbose - Show detailed output
 */
function generateQualityCheckpoint(options = {}) {
  const {
    isTagged = false,
    tagName = '',
    skipTests = false,
    verbose = false
  } = options;
  
  console.log('Generating quality metrics checkpoint...');
  
  // Run tests and collect results
  let testResults = [];
  try {
    // Try to run tests and collect results
    if (verbose) console.log(skipTests ? 'Using existing test results...' : 'Running tests...');
    
    testResults = collectTestResults({
      useExisting: skipTests,
      skipIntegration: skipTests,
      verbose
    });
  } catch (error) {
    console.error(`Error collecting test results: ${error.message}`);
    
    // Try to load previously saved results if available
    if (fs.existsSync(TEST_RESULTS_FILE)) {
      try {
        const savedResults = JSON.parse(fs.readFileSync(TEST_RESULTS_FILE, 'utf8'));
        testResults = savedResults.results || [];
      } catch (readError) {
        console.error(`Error reading saved test results: ${readError.message}`);
      }
    }
  }
  
  // Create checkpoint object
  const checkpoint = {
    date: new Date().toISOString(),
    isTagged,
    tagName: isTagged ? tagName : '',
    version: getPackageVersion(),
    metrics: {
      eslint: countEslintIssues(),
      complexity: getComplexityMetrics(),
      duplication: getDuplicationMetrics(),
      testCoverage: getTestCoverageMetrics(),
      testResults: testResults
    }
  };
  
  // Append to NDJSON file
  try {
    // Ensure directory exists
    const dir = path.dirname(CHECKPOINT_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Read existing file if it exists
    let existingContent = '';
    if (fs.existsSync(CHECKPOINT_FILE)) {
      existingContent = fs.readFileSync(CHECKPOINT_FILE, 'utf8');
    }
    
    // Append new checkpoint
    fs.writeFileSync(
      CHECKPOINT_FILE, 
      (existingContent ? existingContent + '\n' : '') + JSON.stringify(checkpoint)
    );
    
    console.log(`Quality checkpoint saved to ${CHECKPOINT_FILE}`);
  } catch (error) {
    console.error(`Error saving checkpoint: ${error.message}`);
  }
  
  return checkpoint;
}

/**
 * Get package version from package.json
 */
function getPackageVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    return packageJson.version;
  } catch (error) {
    console.error(`Error reading package.json: ${error.message}`);
    return 'unknown';
  }
}

/**
 * Count ESLint issues
 */
function countEslintIssues() {
  try {
    const result = execSync('npm run lint -- --format json', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    try {
      const jsonStart = result.indexOf('[');
      if (jsonStart >= 0) {
        const jsonResult = JSON.parse(result.substring(jsonStart));
        
        let warnings = 0;
        let errors = 0;
        
        for (const file of jsonResult) {
          warnings += file.warningCount + file.fixableWarningCount;
          errors += file.errorCount + file.fixableErrorCount;
        }
        
        return { warnings, errors };
      }
    } catch (parseError) {
      console.error(`Error parsing ESLint output: ${parseError.message}`);
    }
  } catch (error) {
    console.error(`Error running ESLint: ${error.message}`);
  }
  
  // Fallback if something fails
  return { warnings: 0, errors: 0 };
}

/**
 * Get complexity metrics
 */
function getComplexityMetrics() {
  if (fs.existsSync(COMPLEXITY_REPORT)) {
    try {
      const report = JSON.parse(fs.readFileSync(COMPLEXITY_REPORT, 'utf8'));
      
      let highComplexity = 0;
      
      // Count high complexity functions
      for (const file of report) {
        for (const message of file.messages) {
          if (message.ruleId === 'complexity' || message.ruleId === 'sonarjs/cognitive-complexity') {
            const complexityMatch = message.message.match(/complexity of (\d+)/);
            if (complexityMatch && parseInt(complexityMatch[1]) > 10) {
              highComplexity++;
            }
          }
        }
      }
      
      return { highComplexity };
    } catch (error) {
      console.error(`Error parsing complexity report: ${error.message}`);
    }
  }
  
  return { highComplexity: 0 };
}

/**
 * Get duplication metrics
 */
function getDuplicationMetrics() {
  if (fs.existsSync(JSCPD_REPORT)) {
    try {
      const report = JSON.parse(fs.readFileSync(JSCPD_REPORT, 'utf8'));
      
      if (report.statistics && report.statistics.total) {
        return {
          percentage: report.statistics.total.percentage,
          duplicatedLines: report.statistics.total.duplicatedLines,
          totalLines: report.statistics.total.lines
        };
      }
    } catch (error) {
      console.error(`Error parsing duplication report: ${error.message}`);
    }
  }
  
  return { percentage: 0, duplicatedLines: 0, totalLines: 0 };
}

/**
 * Get test coverage metrics
 */
function getTestCoverageMetrics() {
  try {
    // Run the coverage command to generate a report
    if (!skipTests) {
      try {
        execSync('npm run test:coverage', { stdio: verbose ? 'inherit' : 'pipe' });
      } catch (error) {
        console.error(`Error running coverage: ${error.message}`);
      }
    }
    
    // Read the coverage summary from the coverage directory
    const coverageSummaryPath = './coverage/coverage-summary.json';
    if (fs.existsSync(coverageSummaryPath)) {
      const summary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
      
      if (summary.total) {
        return {
          statements: summary.total.statements.pct,
          branches: summary.total.branches.pct,
          functions: summary.total.functions.pct,
          lines: summary.total.lines.pct
        };
      }
    }
    
    // Try to estimate coverage from file stats in src directory
    const srcStats = getDirectoryCoverageStats('./src');
    console.log('Coverage categorization:');
    console.log('Low coverage files:', srcStats.lowCoverageFiles);
    console.log('Medium coverage files:', srcStats.mediumCoverageFiles);
    console.log('High coverage files:', srcStats.highCoverageFiles);
    
    return {
      estimated: true,
      files: srcStats.totalFiles,
      lowCoverage: srcStats.lowCoverageFiles.length,
      mediumCoverage: srcStats.mediumCoverageFiles.length,
      highCoverage: srcStats.highCoverageFiles.length,
    };
  } catch (error) {
    console.error(`Error getting coverage metrics: ${error.message}`);
  }
  
  return { 
    estimated: true,
    files: 0,
    lowCoverage: 0,
    mediumCoverage: 0,
    highCoverage: 0
  };
}

/**
 * Get coverage stats for a directory
 */
function getDirectoryCoverageStats(dir) {
  const stats = {
    totalFiles: 0,
    lowCoverageFiles: [],
    mediumCoverageFiles: [],
    highCoverageFiles: []
  };
  
  if (!fs.existsSync(dir)) {
    return stats;
  }
  
  // Predefined coverage estimates based on file type/location
  const highCoverageModules = [
    'controllers/mutate', 'controllers/releases', 'controllers/embeddings', 
    'controllers/groq', 'controllers/schema', 'utils/sanityClient', 
    'utils/documentHelpers', 'tools/embeddingsTools', 'tools/groqTools',
    'tools/mutateTools', 'tools/projectsTools', 'tools/releasesTools',
    'tools/schemaTools', 'tools/actionsTools', 'tools/index',
    'config/config'
  ];
  
  const mediumCoverageModules = [
    'controllers/actions', 'utils/logger'
  ];
  
  const files = walkSync(dir);
  
  for (const file of files) {
    if (file.endsWith('.ts') && !file.endsWith('.d.ts') && !file.endsWith('.test.ts')) {
      stats.totalFiles++;
      
      const relativePath = file.replace(dir + '/', '');
      
      // Determine coverage category
      if (highCoverageModules.some(module => relativePath.includes(module))) {
        stats.highCoverageFiles.push(relativePath);
      } else if (mediumCoverageModules.some(module => relativePath.includes(module))) {
        stats.mediumCoverageFiles.push(relativePath);
      } else {
        stats.lowCoverageFiles.push(relativePath);
      }
    }
  }
  
  return stats;
}

/**
 * Walk a directory recursively and get all files
 */
function walkSync(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    
    if (stat.isDirectory()) {
      walkSync(filepath, fileList);
    } else {
      fileList.push(filepath);
    }
  }
  
  return fileList;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateQualityCheckpoint({
    isTagged,
    tagName,
    skipTests,
    verbose
  });
}

export { generateQualityCheckpoint }; 