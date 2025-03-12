import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import config from '../../../src/config/config.js'
import {
  validateDocument,
  validateDocumentId,
  validateGroqQuery,
  validateIndexName,
  validateMutations,
  validateProjectDataset,
  validateReleaseId} from '../../../src/utils/parameterValidation.js'

// Mock config
vi.mock('../../../src/config/config.js', () => ({
  default: {
    projectId: 'default-project',
    dataset: 'default-dataset'
  }
}))

describe('Parameter Validation Utils', () => {
  describe('validateProjectDataset', () => {
    it('should return provided projectId and dataset when both are provided', () => {
      const result = validateProjectDataset('test-project', 'test-dataset')
      expect(result).toEqual({projectId: 'test-project', dataset: 'test-dataset'})
    })

    it('should fall back to config values when parameters are not provided', () => {
      const result = validateProjectDataset()
      expect(result).toEqual({projectId: 'default-project', dataset: 'default-dataset'})
    })

    it('should mix provided parameters with config values', () => {
      const resultWithProjectId = validateProjectDataset('test-project')
      expect(resultWithProjectId).toEqual({projectId: 'test-project', dataset: 'default-dataset'})

      const resultWithDataset = validateProjectDataset(undefined, 'test-dataset')
      expect(resultWithDataset).toEqual({projectId: 'default-project', dataset: 'test-dataset'})
    })

    it('should throw error when projectId cannot be determined', () => {
      // Override config temporarily
      const originalProjectId = config.projectId
      config.projectId = undefined

      expect(() => validateProjectDataset()).toThrow('Project ID is required')

      // Restore config
      config.projectId = originalProjectId
    })

    it('should throw error when dataset cannot be determined', () => {
      // Override config temporarily
      const originalDataset = config.dataset
      config.dataset = undefined

      expect(() => validateProjectDataset()).toThrow('Dataset is required')

      // Restore config
      config.dataset = originalDataset
    })
  })

  describe('validateDocumentId', () => {
    it('should return array of document IDs when string is provided', () => {
      const result = validateDocumentId('doc123')
      expect(result).toEqual(['doc123'])
    })

    it('should return array of document IDs when array is provided', () => {
      const result = validateDocumentId(['doc123', 'doc456'])
      expect(result).toEqual(['doc123', 'doc456'])
    })

    it('should throw error when documentId is missing', () => {
      expect(() => validateDocumentId(undefined as any)).toThrow('Document ID is required')
    })

    it('should throw error when documentId is empty array', () => {
      expect(() => validateDocumentId([])).toThrow('At least one document ID must be provided')
    })

    it('should throw error when document ID is invalid', () => {
      expect(() => validateDocumentId(['doc123', ''])).toThrow('Invalid document ID')
      expect(() => validateDocumentId(['doc123', '   '])).toThrow('Invalid document ID')
    })
  })

  describe('validateMutations', () => {
    it('should not throw error for valid mutations array', () => {
      const mutations = [
        {create: {_type: 'test', title: 'Test'}},
        {delete: {id: 'doc123'}}
      ]
      expect(() => validateMutations(mutations)).not.toThrow()
    })

    it('should throw error when mutations is not an array', () => {
      expect(() => validateMutations({} as any)).toThrow('Mutations must be an array')
    })

    it('should throw error when mutations array is empty', () => {
      expect(() => validateMutations([])).toThrow('At least one mutation must be provided')
    })

    it('should throw error when mutation is not an object', () => {
      expect(() => validateMutations([null])).toThrow('Invalid mutation at index 0')
      expect(() => validateMutations(['string' as any])).toThrow('Invalid mutation at index 0')
    })

    it('should throw error when mutation has no valid operations', () => {
      expect(() => validateMutations([{}])).toThrow('Invalid mutation at index 0')
      expect(() => validateMutations([{invalid: 'operation'}])).toThrow('Invalid mutation at index 0')
    })
  })

  describe('validateDocument', () => {
    it('should not throw error for valid document', () => {
      const document = {_type: 'test', title: 'Test Document'}
      expect(() => validateDocument(document)).not.toThrow()
    })

    it('should not throw error for document with valid _id', () => {
      const document = {_id: 'doc123', _type: 'test', title: 'Test Document'}
      expect(() => validateDocument(document)).not.toThrow()
    })

    it('should throw error when document is not an object', () => {
      expect(() => validateDocument(null as any)).toThrow('Document must be an object')
      expect(() => validateDocument('string' as any)).toThrow('Document must be an object')
    })

    it('should throw error when document is missing _type', () => {
      const document = {title: 'Test Document'}
      expect(() => validateDocument(document)).toThrow('Document must have a _type property')
    })

    it('should throw error when document _id is invalid', () => {
      expect(() => validateDocument({_id: '', _type: 'test'})).toThrow('Document _id must be a non-empty string')
      expect(() => validateDocument({_id: '   ', _type: 'test'})).toThrow('Document _id must be a non-empty string')
      expect(() => validateDocument({_id: 123, _type: 'test'} as any)).toThrow('Document _id must be a non-empty string')
    })
  })

  describe('validateGroqQuery', () => {
    it('should not throw error for valid query', () => {
      expect(() => validateGroqQuery('*[_type == "test"]')).not.toThrow()
    })

    it('should throw error when query is not a string', () => {
      expect(() => validateGroqQuery(null as any)).toThrow('GROQ query must be a string')
      expect(() => validateGroqQuery({} as any)).toThrow('GROQ query must be a string')
    })

    it('should throw error when query is empty', () => {
      expect(() => validateGroqQuery('')).toThrow('GROQ query cannot be empty')
      expect(() => validateGroqQuery('   ')).toThrow('GROQ query cannot be empty')
    })
  })

  describe('validateReleaseId', () => {
    it('should not throw error for valid release ID', () => {
      expect(() => validateReleaseId('release-123')).not.toThrow()
    })

    it('should throw error when release ID is not a string', () => {
      expect(() => validateReleaseId(null as any)).toThrow('Release ID must be a string')
      expect(() => validateReleaseId({} as any)).toThrow('Release ID must be a string')
    })

    it('should throw error when release ID is empty', () => {
      expect(() => validateReleaseId('')).toThrow('Release ID cannot be empty')
      expect(() => validateReleaseId('   ')).toThrow('Release ID cannot be empty')
    })
  })

  describe('validateIndexName', () => {
    it('should not throw error for valid index name', () => {
      expect(() => validateIndexName('products-index')).not.toThrow()
    })

    it('should throw error when index name is not a string', () => {
      expect(() => validateIndexName(null as any)).toThrow('Index name must be a string')
      expect(() => validateIndexName({} as any)).toThrow('Index name must be a string')
    })

    it('should throw error when index name is empty', () => {
      expect(() => validateIndexName('')).toThrow('Index name cannot be empty')
      expect(() => validateIndexName('   ')).toThrow('Index name cannot be empty')
    })
  })
})
