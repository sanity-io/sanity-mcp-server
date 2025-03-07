import fs from 'fs';

// Read the JSON report
const report = JSON.parse(fs.readFileSync('./scripts/quality/output/complexity-report.json', 'utf8'));

// Extract function complexity from the messages
const complexFunctions = [];

report.forEach(file => {
  if (file.messages && file.messages.length > 0) {
    file.messages.forEach(msg => {
      // Check if this is a complexity or cognitive complexity error
      if (msg.ruleId === 'complexity' || msg.ruleId === 'sonarjs/cognitive-complexity') {
        complexFunctions.push({
          file: file.filePath.split('/').slice(-2).join('/'),
          line: msg.line,
          column: msg.column,
          ruleId: msg.ruleId,
          message: msg.message,
          severity: msg.severity
        });
      }
    });
  }
});

// Sort by severity and rule type
complexFunctions.sort((a, b) => {
  if (a.severity !== b.severity) {
    return b.severity - a.severity;
  }
  return a.file.localeCompare(b.file);
});

// Print the complex functions
console.log('Most complex functions (sorted by severity):');
console.log('-------------------------------------------');
complexFunctions.forEach((func, index) => {
  console.log(`${index + 1}. ${func.file}:${func.line}:${func.column} - ${func.message}`);
});

// Group by file to get most problematic files
const fileComplexity = {};
complexFunctions.forEach(func => {
  if (!fileComplexity[func.file]) {
    fileComplexity[func.file] = { count: 0, issues: [] };
  }
  fileComplexity[func.file].count++;
  fileComplexity[func.file].issues.push(func);
});

// Sort files by number of complex functions
const sortedFiles = Object.keys(fileComplexity).sort((a, b) => 
  fileComplexity[b].count - fileComplexity[a].count
);

console.log('\n\nFiles with most complexity issues:');
console.log('--------------------------------');
sortedFiles.forEach((file, index) => {
  console.log(`${index + 1}. ${file} - ${fileComplexity[file].count} issues`);
});

// Save results for future reference
fs.writeFileSync('./complexity-results.txt', 
  'Most complex functions:\n' + 
  complexFunctions.map((func, i) => `${i + 1}. ${func.file}:${func.line}:${func.column} - ${func.message}`).join('\n') +
  '\n\nFiles with most complexity issues:\n' +
  sortedFiles.map((file, i) => `${i + 1}. ${file} - ${fileComplexity[file].count} issues`).join('\n')
);

console.log('\nDetailed results saved to complexity-results.txt');
