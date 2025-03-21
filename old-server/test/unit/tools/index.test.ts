/**
 * Unit tests for tool index
 * @vitest-environment node
 */
import {describe, expect, it} from 'vitest'

import {getToolDefinitions} from '../../../src/tools/index.js'

// Simple minimal test that avoids testing specific tool names
describe('Tool index', () => {
  it('should export getToolDefinitions', () => {
    expect(typeof getToolDefinitions).toBe('function')
  })

  it('should return an array of tool definitions', () => {
    const tools = getToolDefinitions()
    expect(Array.isArray(tools)).toBe(true)
    expect(tools.length).toBeGreaterThan(0)
  })

  it('should include tools with proper format', () => {
    const tools = getToolDefinitions()
    const someTool = tools[0]
    expect(someTool).toBeDefined()
    expect(someTool).toHaveProperty('name')
    expect(someTool).toHaveProperty('description')
    expect(someTool).toHaveProperty('parameters')
  })
})
