import {describe, expect, it} from 'vitest'

import {isSufficientApiVersion} from '../../../src/utils/sanityClient.ts'

describe('Sanity Client Utilities', () => {
  describe('isSufficientApiVersion', () => {
    it('should return true when current version is newer than required', () => {
      expect(isSufficientApiVersion('2025-03-01', '2025-02-19')).toBe(true)
      expect(isSufficientApiVersion('2026-01-01', '2025-02-19')).toBe(true)
      expect(isSufficientApiVersion('2025-02-20', '2025-02-19')).toBe(true)
    })

    it('should return true when current version equals required version', () => {
      expect(isSufficientApiVersion('2025-02-19', '2025-02-19')).toBe(true)
    })

    it('should return false when current version is older than required', () => {
      expect(isSufficientApiVersion('2024-10-01', '2025-02-19')).toBe(false)
      expect(isSufficientApiVersion('2025-01-01', '2025-02-19')).toBe(false)
      expect(isSufficientApiVersion('2025-02-18', '2025-02-19')).toBe(false)
    })

    it('should handle v-prefixed versions correctly', () => {
      expect(isSufficientApiVersion('v2025-03-01', '2025-02-19')).toBe(true)
      expect(isSufficientApiVersion('2025-03-01', 'v2025-02-19')).toBe(true)
    })
  })
})
