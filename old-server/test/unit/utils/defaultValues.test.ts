/* eslint-disable no-unused-vars */
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import config from '../../../src/config/config.js'
import {
  applyDefaults,
  applyMutationDefaults,
  applyPaginationDefaults,
  applyProjectDatasetDefaults,
  applySearchDefaults,
  DEFAULT_PAGINATION,
  DEFAULT_RETURN_DOCUMENTS,
  DEFAULT_SEARCH,
  DEFAULT_VISIBILITY} from '../../../src/utils/defaultValues.js'

// Mock config
vi.mock('../../../src/config/config.js', () => ({
  default: {
    projectId: 'default-project',
    dataset: 'default-dataset'
  }
}))

describe('Default Values Utils', () => {
  describe('applyProjectDatasetDefaults', () => {
    it('should use provided values when available', () => {
      const result = applyProjectDatasetDefaults('test-project', 'test-dataset')
      expect(result).toEqual({projectId: 'test-project', dataset: 'test-dataset'})
    })

    it('should fall back to config values when parameters are not provided', () => {
      const result = applyProjectDatasetDefaults()
      expect(result).toEqual({projectId: 'default-project', dataset: 'default-dataset'})
    })

    it('should mix provided parameters with config values', () => {
      const resultWithProjectId = applyProjectDatasetDefaults('test-project')
      expect(resultWithProjectId).toEqual({projectId: 'test-project', dataset: 'default-dataset'})

      const resultWithDataset = applyProjectDatasetDefaults(undefined, 'test-dataset')
      expect(resultWithDataset).toEqual({projectId: 'default-project', dataset: 'test-dataset'})
    })

    it('should handle missing config values', () => {
      // Override config temporarily
      const originalProjectId = config.projectId
      const originalDataset = config.dataset
      config.projectId = undefined
      config.dataset = undefined

      const result = applyProjectDatasetDefaults()
      expect(result).toEqual({projectId: '', dataset: ''})

      // Restore config
      config.projectId = originalProjectId
      config.dataset = originalDataset
    })
  })

  describe('applyMutationDefaults', () => {
    it('should use provided values when available', () => {
      const options = {
        returnDocuments: true,
        visibility: 'async' as const
      }
      const result = applyMutationDefaults(options)
      expect(result).toEqual(options)
    })

    it('should use default values when options are not provided', () => {
      const result = applyMutationDefaults()
      expect(result).toEqual({
        returnDocuments: DEFAULT_RETURN_DOCUMENTS,
        visibility: DEFAULT_VISIBILITY
      })
    })

    it('should mix provided options with defaults', () => {
      const result = applyMutationDefaults({returnDocuments: true})
      expect(result).toEqual({
        returnDocuments: true,
        visibility: DEFAULT_VISIBILITY
      })

      const result2 = applyMutationDefaults({visibility: 'deferred' as const})
      expect(result2).toEqual({
        returnDocuments: DEFAULT_RETURN_DOCUMENTS,
        visibility: 'deferred'
      })
    })
  })

  describe('applyPaginationDefaults', () => {
    it('should use provided values when available', () => {
      const pagination = {
        limit: 50,
        offset: 10
      }
      const result = applyPaginationDefaults(pagination)
      expect(result).toEqual(pagination)
    })

    it('should use default values when pagination is not provided', () => {
      const result = applyPaginationDefaults()
      expect(result).toEqual(DEFAULT_PAGINATION)
    })

    it('should mix provided pagination with defaults', () => {
      const result = applyPaginationDefaults({limit: 50})
      expect(result).toEqual({
        limit: 50,
        offset: DEFAULT_PAGINATION.offset
      })

      const result2 = applyPaginationDefaults({offset: 10})
      expect(result2).toEqual({
        limit: DEFAULT_PAGINATION.limit,
        offset: 10
      })
    })
  })

  describe('applySearchDefaults', () => {
    it('should use provided values when available', () => {
      const searchParams = {
        maxResults: 50,
        includeScore: false
      }
      const result = applySearchDefaults(searchParams)
      expect(result).toEqual(searchParams)
    })

    it('should use default values when search parameters are not provided', () => {
      const result = applySearchDefaults()
      expect(result).toEqual(DEFAULT_SEARCH)
    })

    it('should mix provided search parameters with defaults', () => {
      const result = applySearchDefaults({maxResults: 50})
      expect(result).toEqual({
        maxResults: 50,
        includeScore: DEFAULT_SEARCH.includeScore
      })

      const result2 = applySearchDefaults({includeScore: false})
      expect(result2).toEqual({
        maxResults: DEFAULT_SEARCH.maxResults,
        includeScore: false
      })
    })
  })

  describe('applyDefaults', () => {
    it('should use provided values when available', () => {
      const defaults = {a: 1, b: 2, c: 3}
      const obj = {a: 10, b: 20}
      const result = applyDefaults(obj, defaults)
      expect(result).toEqual({a: 10, b: 20, c: 3})
    })

    it('should use all defaults when object is not provided', () => {
      const defaults = {a: 1, b: 2, c: 3}
      const result = applyDefaults(undefined, defaults)
      expect(result).toEqual(defaults)
    })

    it('should handle empty object', () => {
      const defaults = {a: 1, b: 2, c: 3}
      const result = applyDefaults({}, defaults)
      expect(result).toEqual(defaults)
    })

    it('should ignore undefined values in the provided object', () => {
      const defaults = {a: 1, b: 2, c: 3}
      const obj = {a: 10, b: undefined, d: 40}
      const result = applyDefaults(obj, defaults)
      expect(result).toEqual({a: 10, b: 2, c: 3, d: 40})
    })

    it('should handle null values in the provided object', () => {
      const defaults = {a: 1, b: 2, c: 3}
      const obj = {a: null, b: 20}
      const result = applyDefaults(obj as any, defaults)
      expect(result).toEqual({a: null, b: 20, c: 3})
    })
  })
})
