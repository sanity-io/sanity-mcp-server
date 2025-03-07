import fs from 'fs';
import path from 'path';
import { generateQualityCheckpoint } from './generate-quality-checkpoint.js';

// File paths
const README_PATH = './README.md';
const METRICS_SECTION_START = '## Quality Metrics';
const METRICS_SECTION_END = '## License';

/**
 * Updates the README.md file with current quality metrics
 * @param {boolean} isTagged - Whether this is a tagged release
 * @param {string} tagName - The name of the tag (if tagged)
 * @returns {Promise<void>}
 */
async function updateReadmeWithMetrics(isTagged = false, tagName = '') {
  console.log('Updating README with quality metrics...');
  
  // Generate a quality checkpoint
  const checkpoint = generateQualityCheckpoint(isTagged, tagName);
  
  // Read the current README
  const readmeContent = fs.readFileSync(README_PATH, 'utf8');
  
  // Split the README content
  const readmeLines = readmeContent.split('\n');
  
  // Find the start and end of the metrics section
  let metricsStartIndex = -1;
  let metricsEndIndex = -1;
  
  for (let i = 0; i < readmeLines.length; i++) {
    if (readmeLines[i].includes(METRICS_SECTION_START)) {
      metricsStartIndex = i;
    } else if (metricsStartIndex !== -1 && readmeLines[i].includes(METRICS_SECTION_END)) {
      metricsEndIndex = i;
      break;
    }
  }
  
  // If we couldn't find the metrics section or the end marker, add it before the License section
  if (metricsStartIndex === -1 || metricsEndIndex === -1) {
    metricsStartIndex = readmeLines.findIndex(line => line.includes(METRICS_SECTION_END)) - 1;
    if (metricsStartIndex === -2) {
      // If we couldn't find the License section either, add it at the end
      metricsStartIndex = readmeLines.length;
    }
    
    // Insert the metrics section header
    readmeLines.splice(metricsStartIndex, 0, '', METRICS_SECTION_START, '');
    metricsEndIndex = metricsStartIndex + 3;
  } else {
    // We found the section, so set endIndex to the beginning of the next section
    metricsEndIndex = metricsEndIndex === -1 ? readmeLines.length : metricsEndIndex;
    
    // Increment the start index to skip the section header
    metricsStartIndex += 1;
  }
  
  // Generate the metrics markdown
  const metricsMarkdown = generateMetricsMarkdown(checkpoint);
  
  // Replace all content between ## Quality Metrics and the next ## section
  readmeLines.splice(
    metricsStartIndex + 1, 
    metricsEndIndex - metricsStartIndex - 1,
    ...metricsMarkdown.split('\n')
  );
  
  // Write the updated README
  fs.writeFileSync(README_PATH, readmeLines.join('\n'));
  
  console.log('README updated with latest quality metrics');
}

/**
 * Generate markdown content for the metrics section
 * @param {Object} checkpoint - The quality checkpoint data
 * @returns {string} - Markdown content
 */
function generateMetricsMarkdown(checkpoint) {
  const { date, version, tagName, metrics } = checkpoint;
  
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const versionDisplay = tagName ? `${version} (${tagName})` : version;
  
  let markdown = `
This section provides links to the latest quality metrics for this project.

### Latest Quality Metrics Summary - ${formattedDate}

**Version:** ${versionDisplay}

Key metrics at a glance:
- Test Coverage: ${metrics.testCoverage.overall}%
- ESLint Issues: ${metrics.eslint.errors} errors, ${metrics.eslint.warnings} warnings
- Complex Functions: ${metrics.complexity.complexFunctions.total}
- Code Duplication: ${metrics.duplication.percentage}%

#### Detailed Quality Information

- [📊 Interactive Quality Metrics Dashboard](./scripts/quality/output/quality-metrics-chart.html) - Visual trends of code quality over time
- [📝 Quality Improvement Recommendations](./scripts/quality/output/improvement-recommendations.md) - Prioritized list of suggested improvements
- [📈 Raw Quality Data (NDJSON)](./scripts/quality/quality-tag-checkpoint.ndjson) - Historical quality metrics for all releases

Quality metrics are automatically updated on each release and can be manually generated with \`npm run quality:report\`.
`;

  return markdown;
}

// If script is run directly, update the README with metrics
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Check if this is a tagged checkpoint
  const isTagged = process.argv.includes('--tagged');
  const tagIndex = process.argv.indexOf('--tag');
  const tagName = tagIndex >= 0 && process.argv.length > tagIndex + 1 
    ? process.argv[tagIndex + 1] 
    : '';
  
  updateReadmeWithMetrics(isTagged, tagName);
}

// Add fileURLToPath function for ES modules
function fileURLToPath(url) {
  if (typeof URL !== 'undefined') {
    const urlObj = new URL(url);
    return urlObj.pathname;
  }
  return url.replace(/^file:\/\//, '');
}

export { updateReadmeWithMetrics }; 