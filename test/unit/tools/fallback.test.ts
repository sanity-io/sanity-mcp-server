/**
 * Unit tests for fallback behavior of optional parameters
 * @vitest-environment node
 */
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import config from '../../../src/config/config.js'
import {GroqToolProvider} from '../../../src/tools/groqTools.js'
import {ActionsToolProvider} from '../../../src/tools/actionsTools.js'
import * as groqController from '../../../src/controllers/groq.js'
import * as actionsController from '../../../src/controllers/actions.js'

// Create mock implementations
vi.mock('../../../src/controllers/groq.js', () => ({
  searchContent: vi.fn().mockResolvedValue({
    query: '*',
    results: [],
    count: 0
  })
}))

vi.mock('../../../src/controllers/actions.js', () => ({
  publishDocument: vi.fn().mockResolvedValue({
    success: true,
    message: 'Document published successfully',
    result: {}
  })
}))

describe('Optional parameters fallback behavior', () => {
  const originalProjectId = config.projectId
  const originalDataset = config.dataset
  
  // Set up test environment
  beforeEach(() => {
    // Set environment values for testing
    config.projectId = 'env-project-id'
    config.dataset = 'env-dataset'
    
    // Clear mock call history
    vi.clearAllMocks()
  })
  
  // Restore original config
  afterEach(() => {
    config.projectId = originalProjectId
    config.dataset = originalDataset
  })
  
  describe('GROQ tools', () => {
    it('should use provided projectId and dataset over environment values', async () => {
      // Get the tools
      const tools = GroqToolProvider.getToolDefinitionsStatic()
      
      // Find the searchContent tool
      const searchTool = tools.find(tool => tool.name === 'searchContent')
      // Ensure the tool was found
      expect(searchTool).toBeDefined()
      if (!searchTool) return // Guard clause for TypeScript
      
      // Call the handler with explicit values
      await searchTool.handler({
        projectId: 'explicit-project-id',
        dataset: 'explicit-dataset',
        query: '*'
      })
      
      // Verify correct values were passed
      expect(groqController.searchContent).toHaveBeenCalledWith(
        'explicit-project-id',
        'explicit-dataset',
        '*',
        undefined
      )
    })
    
    it('should fall back to environment values when not provided', async () => {
      // Get the tools
      const tools = GroqToolProvider.getToolDefinitionsStatic()
      
      // Find the searchContent tool
      const searchTool = tools.find(tool => tool.name === 'searchContent')
      // Ensure the tool was found
      expect(searchTool).toBeDefined()
      if (!searchTool) return // Guard clause for TypeScript
      
      // Call the handler without projectId and dataset
      await searchTool.handler({
        query: '*'
      })
      
      // Verify environment values were used
      expect(groqController.searchContent).toHaveBeenCalledWith(
        'env-project-id',
        'env-dataset',
        '*',
        undefined
      )
    })
    
    it('should throw error when no values are available', async () => {
      // Temporarily clear environment values
      config.projectId = undefined
      config.dataset = undefined
      
      // Get the tools
      const tools = GroqToolProvider.getToolDefinitionsStatic()
      
      // Find the searchContent tool
      const searchTool = tools.find(tool => tool.name === 'searchContent')
      // Ensure the tool was found
      expect(searchTool).toBeDefined()
      if (!searchTool) return // Guard clause for TypeScript
      
      // Call the handler without projectId and dataset, expect error
      await expect(searchTool.handler({
        query: '*'
      })).rejects.toThrow(/Project ID and Dataset name are required/)
    })
  })
  
  describe('Actions tools', () => {
    it('should use provided projectId and dataset over environment values', async () => {
      // Get the tools
      const tools = ActionsToolProvider.getToolDefinitionsStatic()
      
      // Find the publishDocument tool
      const publishTool = tools.find(tool => tool.name === 'publishDocument')
      // Ensure the tool was found
      expect(publishTool).toBeDefined()
      if (!publishTool) return // Guard clause for TypeScript
      
      // Call the handler with explicit values
      await publishTool.handler({
        projectId: 'explicit-project-id',
        dataset: 'explicit-dataset',
        documentId: 'doc123'
      })
      
      // Verify correct values were passed
      expect(actionsController.publishDocument).toHaveBeenCalledWith(
        'explicit-project-id',
        'explicit-dataset',
        'doc123'
      )
    })
    
    it('should fall back to environment values when not provided', async () => {
      // Get the tools
      const tools = ActionsToolProvider.getToolDefinitionsStatic()
      
      // Find the publishDocument tool
      const publishTool = tools.find(tool => tool.name === 'publishDocument')
      // Ensure the tool was found
      expect(publishTool).toBeDefined()
      if (!publishTool) return // Guard clause for TypeScript
      
      // Call the handler without projectId and dataset
      await publishTool.handler({
        documentId: 'doc123'
      })
      
      // Verify environment values were used
      expect(actionsController.publishDocument).toHaveBeenCalledWith(
        'env-project-id',
        'env-dataset',
        'doc123'
      )
    })
  })
}) 