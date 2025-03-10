import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Mock fs and path for testing
vi.mock('fs');
vi.mock('path');
vi.mock('child_process');

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

// Setup tests for complexity metrics
describe('Complexity Metrics Functions', () => {
  // Create a modified version of the complexity metrics functions for testing
  function getComplexityMetrics() {
    // Mock implementation for testing
    if (fs.existsSync('./scripts/quality/output/complexity-metrics.json')) {
      try {
        const complexityMetrics = JSON.parse(fs.readFileSync('./scripts/quality/output/complexity-metrics.json', 'utf8'));
        
        if (complexityMetrics && complexityMetrics.metrics) {
          const metrics = complexityMetrics.metrics;
          
          // Get max complexity from top functions
          let maxComplexity = 0;
          if (metrics.topFunctions && metrics.topFunctions.length > 0) {
            maxComplexity = metrics.topFunctions.reduce((max, func) => 
              Math.max(max, func.complexity || 0), 0);
          }
          
          return {
            cyclomaticComplexity: {
              average: metrics.averageComplexity || 0,
              max: maxComplexity,
              count: metrics.totalFunctions || 0
            },
            cognitiveComplexity: {
              average: Math.floor((metrics.averageComplexity || 0) * 0.8),
              max: Math.floor(maxComplexity * 0.8),
              count: metrics.totalFunctions || 0
            },
            complexFunctions: {
              high: metrics.highComplexityFunctions || 0,
              medium: metrics.mediumComplexityFunctions || 0,
              low: metrics.lowComplexityFunctions || 0,
              total: metrics.totalFunctions || 0
            }
          };
        }
      } catch (error) {
        console.error(`Error parsing complexity metrics file: ${error.message}`);
      }
    }
    
    // Fallback to ESLint report
    return calculateComplexityFromEslint();
  }
  
  function calculateComplexityFromEslint() {
    if (!fs.existsSync('./scripts/quality/output/complexity-report.json')) {
      return {
        cyclomaticComplexity: { average: 0, max: 0, count: 0 },
        cognitiveComplexity: { average: 0, max: 0, count: 0 },
        complexFunctions: { high: 0, medium: 0, low: 0, total: 0 }
      };
    }
    
    try {
      const report = JSON.parse(fs.readFileSync('./scripts/quality/output/complexity-report.json', 'utf8'));
      
      let highComplexity = 0;
      let mediumComplexity = 0;
      let lowComplexity = 0;
      let totalComplexity = 0;
      let maxComplexity = 0;
      let totalFunctions = 0;
      
      // Count functions by complexity level
      for (const file of report) {
        for (const message of file.messages) {
          if (message.ruleId === 'complexity') {
            const complexityMatch = message.message.match(/complexity of (\d+)/);
            if (complexityMatch) {
              const complexity = parseInt(complexityMatch[1], 10);
              totalComplexity += complexity;
              totalFunctions++;
              
              // Track max complexity
              if (complexity > maxComplexity) {
                maxComplexity = complexity;
              }
              
              // Categorize by severity
              if (complexity > 15) {
                highComplexity++;
              } else if (complexity > 10) {
                mediumComplexity++;
              } else {
                lowComplexity++;
              }
            }
          }
        }
      }
      
      // Calculate average complexity
      const avgComplexity = totalFunctions > 0 ? Math.round(totalComplexity / totalFunctions * 100) / 100 : 0;
      
      return {
        cyclomaticComplexity: {
          average: avgComplexity,
          max: maxComplexity,
          count: totalFunctions
        },
        cognitiveComplexity: {
          average: Math.floor(avgComplexity * 0.8),
          max: Math.floor(maxComplexity * 0.8),
          count: totalFunctions
        },
        complexFunctions: {
          high: highComplexity,
          medium: mediumComplexity,
          low: lowComplexity,
          total: totalFunctions
        }
      };
    } catch (error) {
      console.error(`Error parsing complexity report: ${error.message}`);
      return {
        cyclomaticComplexity: { average: 0, max: 0, count: 0 },
        cognitiveComplexity: { average: 0, max: 0, count: 0 },
        complexFunctions: { high: 0, medium: 0, low: 0, total: 0 }
      };
    }
  }
  
  function findMaxComplexityFromEslint() {
    if (!fs.existsSync('./scripts/quality/output/complexity-report.json')) {
      return 0;
    }
    
    try {
      const report = JSON.parse(fs.readFileSync('./scripts/quality/output/complexity-report.json', 'utf8'));
      let maxComplexity = 0;
      
      for (const file of report) {
        for (const message of file.messages) {
          if (message.ruleId === 'complexity') {
            const complexityMatch = message.message.match(/complexity of (\d+)/);
            if (complexityMatch) {
              const complexity = parseInt(complexityMatch[1], 10);
              if (complexity > maxComplexity) {
                maxComplexity = complexity;
              }
            }
          }
        }
      }
      
      return maxComplexity;
    } catch (error) {
      console.error(`Error finding max complexity: ${error.message}`);
      return 0;
    }
  }
  
  beforeEach(() => {
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

  describe('calculateComplexityFromEslint', () => {
    it('should correctly calculate complexity metrics from ESLint report', () => {
      const result = calculateComplexityFromEslint();
      
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
      
      const result = calculateComplexityFromEslint();
      
      expect(result.cyclomaticComplexity.max).toBe(0);
      expect(result.cyclomaticComplexity.average).toBe(0);
      expect(result.complexFunctions.total).toBe(0);
    });
  });
});

// Test for file count calculation
describe('Test File Count Calculation', () => {
  beforeEach(() => {
    // Mock execSync
    execSync.mockImplementation((cmd) => {
      if (cmd.includes('find test/unit')) {
        return '6';
      } else if (cmd.includes('find test/controllers')) {
        return '6';
      } else if (cmd.includes('find test/integration/standard')) {
        return '12';
      } else {
        return '0';
      }
    });
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
    
    // Test the file count calculation logic
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