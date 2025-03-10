import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Mock imports from our validation modules
vi.mock('../../scripts/quality/collect-test-results.js', () => ({
  validateTestResults: vi.fn().mockImplementation((results) => {
    if (!results || results.length === 0) {
      throw new Error('No test results found');
    }
    return true;
  })
}));

vi.mock('../../scripts/quality/analyze-complexity.js', () => ({
  validateComplexityData: vi.fn().mockImplementation((data) => {
    if (!data || !data.functions) {
      throw new Error('Invalid complexity data');
    }
    return true;
  })
}));

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn()
}));

// Import the module under test
import { validateAllMetrics } from '../../scripts/quality/validate-metrics.js';

describe('Quality Metrics Validation', () => {
  // Setup default mocks
  beforeEach(() => {
    // Mock file existence
    vi.mocked(fs.existsSync).mockImplementation((path) => true);
    
    // Mock valid test results
    vi.mocked(fs.readFileSync).mockImplementation((path) => {
      if (path.toString().includes('test-results.json')) {
        return JSON.stringify({
          timestamp: new Date().toISOString(),
          results: [
            { name: 'Core Integration Tests', success: true, passed: 10, total: 10, files: 5 },
            { name: 'Unit Tests', success: true, passed: 20, total: 20, files: 10 }
          ]
        });
      } 
      else if (path.toString().includes('complexity-metrics.json')) {
        return JSON.stringify({
          timestamp: new Date().toISOString(),
          metrics: {
            totalFiles: 25,
            totalFunctions: 100,
            highComplexityFunctions: 5
          },
          topFunctions: [{ name: 'test', complexity: 10 }]
        });
      }
      else if (path.toString().includes('coverage-summary.json')) {
        return JSON.stringify({
          timestamp: new Date().toISOString(),
          total: {
            statements: { total: 100, covered: 80, pct: 80 },
            lines: { total: 100, covered: 80, pct: 80 }
          }
        });
      }
      return '{}';
    });
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should validate complete data successfully', async () => {
    const result = await validateAllMetrics();
    expect(result.validationPassed).toBe(true);
    expect(result.testResults.passed).toBe(true);
    expect(result.complexity.passed).toBe(true);
    expect(result.coverage.passed).toBe(true);
  });
  
  it('should fail when test results are missing', async () => {
    // Mock test results file doesn't exist
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      return !path.toString().includes('test-results.json');
    });
    
    await expect(validateAllMetrics()).rejects.toThrow('Test results file not found');
  });
  
  it('should fail when test results are invalid', async () => {
    // Mock invalid test results
    vi.mocked(fs.readFileSync).mockImplementation((path) => {
      if (path.toString().includes('test-results.json')) {
        return JSON.stringify({ invalid: true });
      }
      return '{}';
    });
    
    await expect(validateAllMetrics()).rejects.toThrow('Invalid test results data structure');
  });
  
  it('should fail when complexity metrics are missing', async () => {
    // Mock complexity metrics file doesn't exist
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      return !path.toString().includes('complexity-metrics.json');
    });
    
    await expect(validateAllMetrics()).rejects.toThrow('Complexity metrics file not found');
  });
  
  it('should fail when coverage data is missing', async () => {
    // Mock coverage file doesn't exist
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      return !path.toString().includes('coverage-summary.json');
    });
    
    await expect(validateAllMetrics()).rejects.toThrow('Coverage report not found');
  });
  
  it('should fail when coverage data is old', async () => {
    // Mock old coverage data
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 1); // 1 day old
    
    vi.mocked(fs.readFileSync).mockImplementation((path) => {
      if (path.toString().includes('coverage-summary.json')) {
        return JSON.stringify({
          timestamp: oldDate.toISOString(),
          total: {
            statements: { total: 100, covered: 80, pct: 80 },
            lines: { total: 100, covered: 80, pct: 80 }
          }
        });
      }
      return '{}';
    });
    
    await expect(validateAllMetrics()).rejects.toThrow('Coverage data is too old');
  });
}); 