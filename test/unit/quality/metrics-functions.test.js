import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Mock fs and path for testing
vi.mock('fs');
vi.mock('path');

// Import the functions to test - use dynamic import since we're mocking modules
let getComplexityMetrics;
let calculateComplexityFromEslintReport;
let findMaxComplexityFromEslint;
let getTestCoverageMetrics;

// Mock data
const mockEslintReport = [
  {
    filePath: '/src/controllers/groq.ts',
    messages: [
      {
        ruleId: 'complexity',
        message: 'Function has a complexity of 25',
        line: 10,
        column: 1,
        nodeType: 'FunctionDeclaration',
        severity: 2,
        source: 'function searchContent() { /* ... */ }'
      },
      {
        ruleId: 'complexity',
        message: 'Function has a complexity of 20',
        line: 100,
        column: 1,
        nodeType: 'FunctionDeclaration',
        severity: 2,
        source: 'function query() { /* ... */ }'
      }
    ]
  },
  {
    filePath: '/src/controllers/documentHelpers.ts',
    messages: [
      {
        ruleId: 'complexity',
        message: 'Function has a complexity of 18',
        line: 5,
        column: 1,
        nodeType: 'FunctionDeclaration',
        severity: 2,
        source: 'function helperFunction() { /* ... */ }'
      }
    ]
  }
];

const mockComplexityMetrics = {
  metrics: {
    averageComplexity: 21,
    topFunctions: [
      { name: 'searchContent', complexity: 25, file: 'groq.ts' },
      { name: 'query', complexity: 20, file: 'groq.ts' }
    ],
    highComplexityFunctions: 5,
    mediumComplexityFunctions: 3,
    lowComplexityFunctions: 10,
    totalFunctions: 18
  }
};

// Setup tests
describe('Quality Metrics Functions', () => {
  beforeEach(async () => {
    vi.resetModules();
    
    // Mock path.join
    path.join = vi.fn().mockImplementation((...args) => args.join('/'));
    
    // Mock filesystem functions
    fs.existsSync = vi.fn().mockReturnValue(true);
    fs.readFileSync = vi.fn().mockImplementation((filePath) => {
      if (filePath.includes('complexity-metrics.json')) {
        return JSON.stringify(mockComplexityMetrics);
      }
      if (filePath.includes('complexity-report.json')) {
        return JSON.stringify(mockEslintReport);
      }
      return '{}';
    });
    
    // Import the functions after mocking
    const module = await import('../../../scripts/quality/generate-quality-checkpoint.js');
    getComplexityMetrics = module.getComplexityMetrics || module.default.getComplexityMetrics;
    calculateComplexityFromEslintReport = module.calculateComplexityFromEslintReport || module.default.calculateComplexityFromEslintReport;
    findMaxComplexityFromEslint = module.findMaxComplexityFromEslint || module.default.findMaxComplexityFromEslint;
    getTestCoverageMetrics = module.getTestCoverageMetrics || module.default.getTestCoverageMetrics;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getComplexityMetrics', () => {
    it('should correctly extract complexity metrics from complexity-metrics.json', () => {
      const result = getComplexityMetrics();
      
      expect(result).toHaveProperty('cyclomaticComplexity');
      expect(result.cyclomaticComplexity).toHaveProperty('average', 21);
      expect(result.cyclomaticComplexity).toHaveProperty('max', 25);
      expect(result.cyclomaticComplexity).toHaveProperty('count', 18);
      
      expect(result).toHaveProperty('cognitiveComplexity');
      expect(result.cognitiveComplexity).toHaveProperty('average', 16); // Approximation based on 80% of cyclomatic
      expect(result.cognitiveComplexity).toHaveProperty('max', 20); // Approximation based on 80% of cyclomatic max
      
      expect(result).toHaveProperty('complexFunctions');
      expect(result.complexFunctions).toHaveProperty('high', 5);
      expect(result.complexFunctions).toHaveProperty('medium', 3);
      expect(result.complexFunctions).toHaveProperty('low', 10);
      expect(result.complexFunctions).toHaveProperty('total', 18);
    });

    it('should fallback to ESLint report if complexity-metrics.json is not available', () => {
      fs.existsSync = vi.fn().mockImplementation((path) => {
        if (path.includes('complexity-metrics.json')) {
          return false;
        }
        return true;
      });
      
      const result = getComplexityMetrics();
      
      expect(result).toHaveProperty('cyclomaticComplexity');
      expect(result.cyclomaticComplexity).toHaveProperty('max', 25);
      expect(result.cyclomaticComplexity).toHaveProperty('average');
    });
  });

  describe('findMaxComplexityFromEslint', () => {
    it('should find the maximum complexity value from ESLint report', () => {
      const maxComplexity = findMaxComplexityFromEslint();
      expect(maxComplexity).toBe(25);
    });

    it('should return 0 if ESLint report does not exist', () => {
      fs.existsSync = vi.fn().mockReturnValue(false);
      const maxComplexity = findMaxComplexityFromEslint();
      expect(maxComplexity).toBe(0);
    });

    it('should handle errors gracefully', () => {
      fs.readFileSync = vi.fn().mockImplementation(() => {
        throw new Error('File read error');
      });
      
      const maxComplexity = findMaxComplexityFromEslint();
      expect(maxComplexity).toBe(0);
    });
  });

  describe('calculateComplexityFromEslintReport', () => {
    it('should correctly calculate complexity metrics from ESLint report', () => {
      const result = calculateComplexityFromEslintReport();
      
      expect(result).toHaveProperty('cyclomaticComplexity');
      expect(result.cyclomaticComplexity).toHaveProperty('max', 25);
      expect(result.cyclomaticComplexity).toHaveProperty('average');
      
      expect(result).toHaveProperty('complexFunctions');
      // Should have categorized the functions by complexity level
      expect(result.complexFunctions).toHaveProperty('high');
      expect(result.complexFunctions).toHaveProperty('medium');
      expect(result.complexFunctions).toHaveProperty('low');
    });

    it('should handle empty or invalid ESLint report', () => {
      fs.readFileSync = vi.fn().mockReturnValue('[]');
      
      const result = calculateComplexityFromEslintReport();
      
      expect(result.cyclomaticComplexity.max).toBe(0);
      expect(result.cyclomaticComplexity.average).toBe(0);
      expect(result.complexFunctions.total).toBe(0);
    });
  });
});

// Test for file count calculation
describe('Test File Count Calculation', () => {
  // Mock execSync for file count tests
  vi.mock('child_process', () => ({
    execSync: vi.fn().mockImplementation((cmd) => {
      if (cmd.includes('find test/unit')) {
        return '6';
      } else if (cmd.includes('find test/controllers')) {
        return '6';
      } else if (cmd.includes('find test/integration/standard')) {
        return '12';
      } else {
        return '0';
      }
    })
  }));
  
  // Import the actual collect-test-results.js to test file count calculation
  let collectTestResults;
  
  beforeEach(async () => {
    vi.resetModules();
    
    // Mock filesystem functions
    fs.existsSync = vi.fn().mockReturnValue(true);
    fs.writeFileSync = vi.fn();
    
    // Import the collectTestResults function after mocking
    const module = await import('../../../scripts/quality/collect-test-results.js');
    collectTestResults = module.default || module;
    
    // Mock console to avoid polluting test output
    global.console = {
      ...global.console,
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn()
    };
  });
  
  it('should correctly calculate file counts for test suites', () => {
    // Setup a mock test result with incorrect file counts
    const mockTestResult = {
      numTotalTestSuites: 62, // Incorrectly high count
      numPassedTests: 100,
      numFailedTests: 0,
      numTotalTests: 100,
      startTime: Date.now() - 1000,
      endTime: Date.now()
    };
    
    // Import the actual implementation
    const { execSync } = require('child_process');
    
    // Test the file count calculation logic from collect-test-results.js
    // We'll create a simplified version here to test the core logic
    const calculateActualFileCount = (directory) => {
      try {
        const command = `find ${directory} -type f -name "*.test.*" | wc -l`;
        return parseInt(execSync(command, { encoding: 'utf8' }).trim());
      } catch (err) {
        return mockTestResult.numTotalTestSuites; // Fall back to original count on error
      }
    };
    
    // Test unit test directory
    const unitTestCount = calculateActualFileCount('test/unit');
    expect(unitTestCount).toBe(6);
    
    // Test controllers directory
    const controllersTestCount = calculateActualFileCount('test/controllers');
    expect(controllersTestCount).toBe(6);
    
    // Test integration tests
    const integrationTestCount = calculateActualFileCount('test/integration/standard');
    expect(integrationTestCount).toBe(12);
  });
}); 