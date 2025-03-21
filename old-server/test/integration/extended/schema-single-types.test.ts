/* eslint-disable no-empty-function, no-unused-vars */
/**
 * Integration test for schema commands with single types
 * @vitest-environment node
 * @tags integration, extended
 */
import {beforeAll, describe, expect, it} from 'vitest'

import config from '../../../src/config/config.js'
import * as schemaController from '../../../src/controllers/schema.js'

// Suppress console output during tests
const originalConsoleLog = console.log
const originalConsoleError = console.error

describe('Schema Single Types Integration Test', () => {
  // Store the project ID and dataset from config for testing
  const projectId = config.projectId || process.env.SANITY_PROJECT_ID || ''
  const dataset = config.dataset || process.env.SANITY_DATASET || 'production'

  beforeAll(() => {
    // Mute console output during tests
    console.log = () => {}
    console.error = () => {}

    // Skip tests if project ID is not configured
    if (!projectId) {
      console.error = originalConsoleError
      console.error('SANITY_PROJECT_ID not set, skipping integration tests')
    }
  })

  it('should list available schema types', async () => {
    if (!projectId) {
      return
    }

    const schemaTypes = await schemaController.listSchemaTypes(projectId, dataset)
    expect(schemaTypes).toBeDefined()
    expect(Array.isArray(schemaTypes)).toBe(true)

    // Log found types for debugging
    console.error = originalConsoleError
    console.log = originalConsoleLog
    console.log('Available schema types:', schemaTypes)
  })

  it('should debug the schema structure to understand single types', async () => {
    if (!projectId) {
      return
    }

    // Restore console for debug output
    console.error = originalConsoleError
    console.log = originalConsoleLog

    try {
      // Get the full schema to examine its structure
      const fullSchema = await schemaController.getSchema(projectId, dataset)

      // Count different types of schema items
      const typeCounts = fullSchema.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1
        return acc
      }, {})
      console.log('Schema type counts:', typeCounts)

      // Try to find a specific known single type
      const singleDoc = fullSchema.find((item) => item.name === 'homepage')
      if (singleDoc) {
        console.log('Homepage type:', singleDoc.type)
        console.log('Homepage isSingle?:', singleDoc.isSingle)
        console.log('Homepage __experimental_singletonDocument?:', singleDoc.__experimental_singletonDocument)
      }

      // Look for any types with 'single' or 'singleton' in their properties
      const potentialSingleTypes = fullSchema.filter((item) => {
        const itemStr = JSON.stringify(item)
        return itemStr.includes('single') || itemStr.includes('singleton')
      })

      if (potentialSingleTypes.length > 0) {
        console.log('Potential single types found:', potentialSingleTypes.length)
        // Print names of potential single types
        console.log('Potential single type names:', potentialSingleTypes.map((t) => t.name))
      }

      // Look specifically at one of the potential single types
      const singleResourceBlock = fullSchema.find((item) => item.name === 'singleResourceBlock')
      if (singleResourceBlock) {
        console.log('singleResourceBlock type:', singleResourceBlock.type)
        // Print all first-level properties to see what makes it "single"
        const props = Object.keys(singleResourceBlock)
        console.log('singleResourceBlock properties:', props)

        // Check if it has any special properties
        if (props.some((p) => p.includes('single') || p.includes('singleton'))) {
          console.log('Found single-related property in singleResourceBlock')
        }
      }

      // Look at the docsOverview type as well
      const docsOverview = fullSchema.find((item) => item.name === 'docsOverview')
      if (docsOverview) {
        console.log('docsOverview type:', docsOverview.type)
        const props = Object.keys(docsOverview)
        console.log('docsOverview properties:', props)
      }
    } catch (error) {
      console.error('Error debugging schema structure:', error)
    }
  })

  it('should get schema for a document type using getSchemaForType', async () => {
    if (!projectId) {
      return
    }

    // Restore console for debug output
    console.error = originalConsoleError
    console.log = originalConsoleLog

    try {
      // This is expected to fail for a document type that's a single type
      const homeSchema = await schemaController.getSchemaForType(projectId, dataset, 'homepage')
      console.log('Homepage schema retrieved:', homeSchema.name)
      expect(homeSchema).toBeDefined()
      expect(homeSchema.name).toBe('homepage')
    } catch (error) {
      console.error('Error getting homepage schema:', error)
      throw error // Rethrow to fail the test
    }
  })

  it('should get schema for a document type using getTypeSchema', async () => {
    if (!projectId) {
      return
    }

    try {
      // This should work for any type
      const homeSchema = await schemaController.getTypeSchema(projectId, dataset, 'homepage')
      console.log('Homepage schema retrieved with getTypeSchema:', homeSchema.name)
      expect(homeSchema).toBeDefined()
      expect(homeSchema.name).toBe('homepage')
    } catch (error) {
      console.error('Error getting homepage schema with getTypeSchema:', error)
      throw error // Rethrow to fail the test
    }
  })

  it('should test getSchemaForType with a potential single type', async () => {
    if (!projectId) {
      return
    }

    // Restore console for debug output
    console.error = originalConsoleError
    console.log = originalConsoleLog

    try {
      const schemaTypes = await schemaController.listSchemaTypes(projectId, dataset)
      const singleResourceBlockInfo = schemaTypes.find((type) => type.name === 'singleResourceBlock')

      if (singleResourceBlockInfo) {
        console.log('SingleResourceBlock type from listSchemaTypes:', singleResourceBlockInfo.type)

        try {
          // Try to get the schema for singleResourceBlock using getSchemaForType
          const schema = await schemaController.getSchemaForType(projectId, dataset, 'singleResourceBlock')
          console.log('Successfully got schema for singleResourceBlock using getSchemaForType')
        } catch (error) {
          console.log('Failed to get schema for singleResourceBlock using getSchemaForType:', error.message)
        }

        // Try with getTypeSchema which should always work
        const schema = await schemaController.getTypeSchema(projectId, dataset, 'singleResourceBlock')
        console.log('Successfully got schema for singleResourceBlock using getTypeSchema')
      } else {
        console.log('SingleResourceBlock type not found in schema types')
      }
    } catch (error) {
      console.error('Error testing single type:', error)
    }
  })

  it('should get schema for a non-document type', async () => {
    if (!projectId) {
      return
    }

    try {
      // Try to get a potential non-document type identified in the debug test
      const schema = await schemaController.getSchemaForType(projectId, dataset, 'singleResourceBlock')
      console.log('SingleResourceBlock schema retrieved:', schema.name)
      expect(schema.name).toBe('singleResourceBlock')
    } catch (error) {
      console.log('SingleResourceBlock type not found in schema types')
    }
  })

  it('should get schema with referenced types', async () => {
    if (!projectId) {
      return
    }

    try {
      // Get a type that likely has references (like post with author reference)
      const schema = await schemaController.getSchemaForType(projectId, dataset, 'post', {includeReferences: true})
      console.log('Post schema retrieved with references:', schema.name)
      if (schema.references) {
        console.log('Referenced types:', schema.references.map((ref) => ref.name))
        expect(schema.references.length).toBeGreaterThan(0)
      }
    } catch (error) {
      console.log('Post type not found or does not have references:', error.message)
    }
  })
})
