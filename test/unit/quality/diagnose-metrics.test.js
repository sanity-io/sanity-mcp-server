import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Add proper TypeScript types for mocked functions
// @ts-ignore - Mock implementation for tests only
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  statSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn()
}));

// @ts-ignore - Mock implementation for tests only
vi.mock('child_process', () => ({
  execSync: vi.fn()
}));

// Path to the script file to test
const SCRIPT_PATH = path.resolve('./scripts/quality/diagnose-metrics.js');

// Sample data for testing
const MOCK_FILES = {
  'quality-tag-checkpoint.ndjson': '{"version":"0.2.6","date":"2023-01-01T00:00:00.000Z"}',
  'complexity-report.json': '{"average":5,"totalFiles":100}',
  'complexity-metrics.json': '{"metrics":{"averageComplexity":5,"highComplexityFunctions":10}}',
  'test-results.json': '{"results":[{"name":"test1","passed":true},{"name":"test2","passed":true}]}',
  'quality-history.json': '{"history":[{"date":"2023-01-01T00:00:00.000Z","metrics":{}}]}',
  'improvement-opportunities.json': '[{"file":"test.ts","description":"High complexity","impact":"high"}]'
};

describe('Diagnostics Script Tests', () => {
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Set up mock file system
    fs.existsSync.mockImplementation((filePath) => {
      const fileName = path.basename(filePath);
      return Object.keys(MOCK_FILES).includes(fileName);
    });
    
    fs.readFileSync.mockImplementation((filePath) => {
      const fileName = path.basename(filePath);
      if (fileName === 'package.json') {
        return JSON.stringify({ version: '0.2.6' });
      }
      return MOCK_FILES[fileName] || '';
    });
    
    fs.statSync.mockImplementation(() => ({
      size: 1024,
      mtime: new Date()
    }));
    
    fs.writeFileSync.mockImplementation(() => true);
    
    // Mock execSync
    execSync.mockImplementation(() => Buffer.from(''));
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('should check for required files', async () => {
    // Create a function to import the script dynamically
    const importScript = async () => {
      // This will trigger the script's execution
      const scriptModule = await import(SCRIPT_PATH);
      return scriptModule;
    };
    
    // Import and execute the script
    await importScript();
    
    // Verify that existsSync was called for each required file
    expect(fs.existsSync).toHaveBeenCalledTimes(expect.any(Number));
    expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('quality-tag-checkpoint.ndjson'));
    expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('complexity-report.json'));
    expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('test-results.json'));
    expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('quality-history.json'));
    expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('improvement-opportunities.json'));
  });
  
  it('should detect missing files', async () => {
    // Make some files "missing"
    fs.existsSync.mockImplementation((filePath) => {
      const fileName = path.basename(filePath);
      // Only say test-results.json exists
      return fileName === 'test-results.json';
    });
    
    // Import and execute the script
    const importScript = async () => {
      const scriptModule = await import(SCRIPT_PATH);
      return scriptModule;
    };
    
    await importScript();
    
    // Verify that writeFileSync was called with issues about missing files
    expect(fs.writeFileSync).toHaveBeenCalled();
    const writeArgs = fs.writeFileSync.mock.calls[0];
    const diagnosticReport = JSON.parse(writeArgs[1]);
    
    expect(diagnosticReport.issues).toContain(expect.stringContaining('Missing required file'));
    expect(diagnosticReport.issues.length).toBeGreaterThan(1);
  });
  
  it('should try to fix missing files when --fix is passed', async () => {
    // Make some files "missing"
    fs.existsSync.mockImplementation((filePath) => {
      const fileName = path.basename(filePath);
      // Only say test-results.json exists initially
      return fileName === 'test-results.json';
    });
    
    // Simulate that --fix argument was passed
    process.argv = [...process.argv, '--fix'];
    
    // After "fix" attempts, make files appear to exist
    let fixAttempted = false;
    execSync.mockImplementation(() => {
      fixAttempted = true;
      return Buffer.from('');
    });
    
    // After execSync is called, make the files appear to exist
    fs.existsSync.mockImplementation((filePath) => {
      const fileName = path.basename(filePath);
      // If fix was attempted, all files exist; otherwise only test-results.json exists
      return fixAttempted || fileName === 'test-results.json';
    });
    
    // Import and execute the script
    const importScript = async () => {
      const scriptModule = await import(SCRIPT_PATH);
      return scriptModule;
    };
    
    await importScript();
    
    // Verify execSync was called to generate missing files
    expect(execSync).toHaveBeenCalled();
    expect(execSync).toHaveBeenCalledWith(expect.stringMatching(/quality:|test:/), expect.any(Object));
  });
  
  it('should validate metrics from files', async () => {
    // Make test-results.json invalid
    MOCK_FILES['test-results.json'] = '{"notResults": []}';
    
    // Import and execute the script
    const importScript = async () => {
      const scriptModule = await import(SCRIPT_PATH);
      return scriptModule;
    };
    
    await importScript();
    
    // Verify that validation detected issues
    expect(fs.writeFileSync).toHaveBeenCalled();
    const writeArgs = fs.writeFileSync.mock.calls[0];
    const diagnosticReport = JSON.parse(writeArgs[1]);
    
    expect(diagnosticReport.issues).toContain(expect.stringContaining('Test results file does not contain results array'));
  });
  
  // Restore original argv after tests
  afterEach(() => {
    process.argv = process.argv.filter(arg => arg !== '--fix');
  });
}); 