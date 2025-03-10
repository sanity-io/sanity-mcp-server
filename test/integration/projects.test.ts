import { describe, it, expect, beforeAll, vi } from 'vitest';
import { sanityApi } from '../../src/utils/sanityClient.js';
import * as projectsController from '../../src/controllers/projects.js';
import config from '../../src/config/config.js';

describe('Projects Integration Tests', () => {
  // Skip these tests if no Sanity token is available
  beforeAll(() => {
    if (!config.sanityToken) {
      console.warn('Skipping projects integration tests: No Sanity token available');
      return;
    }
  });

  // These tests only run if SANITY_TOKEN is set
  // They interact with the actual Sanity API
  it.runIf(!!config.sanityToken)('should list projects and organizations', async () => {
    const result = await projectsController.listOrganizationsAndProjects();
    
    // Simply verify we get some kind of result structure back
    expect(Array.isArray(result)).toBe(true);
    
    // We should have at least one organization (possibly just "Personal Projects")
    expect(result.length).toBeGreaterThan(0);
    
    // Each organization should have an organizationId and projects array
    result.forEach(org => {
      expect(org).toHaveProperty('organizationId');
      expect(org).toHaveProperty('organizationName');
      expect(Array.isArray(org.projects)).toBe(true);
    });
  });

  // This test demonstrates the CORS functionality but doesn't actually modify anything
  it.runIf(!!config.sanityToken)('should properly construct CORS API calls', async () => {
    // Create a spy for the Sanity API call without actually executing it
    const spy = vi.spyOn(sanityApi, 'listCorsOrigins').mockImplementation(() => {
      return Promise.resolve([]);
    });

    const projectId = 'test-project';
    await projectsController.listCorsOrigins(projectId);
    
    expect(spy).toHaveBeenCalledWith(projectId);
    spy.mockRestore();
  });

  // This test demonstrates the token API functionality but doesn't actually modify anything
  it.runIf(!!config.sanityToken)('should properly construct token API calls', async () => {
    // Create a spy for the Sanity API call without actually executing it
    const spy = vi.spyOn(sanityApi, 'createApiToken').mockImplementation(() => {
      return Promise.resolve({
        id: 'mock-token-id',
        key: 'mock-token-key',
        roles: [{ name: 'developer', title: 'Developer' }],
        label: 'Test Token',
        projectUserId: 'mock-user-id',
        createdAt: '2024-03-21T12:00:00.000Z'
      });
    });

    const projectId = 'test-project';
    const label = 'Test Token';
    const roleName = 'developer' as const;
    
    await projectsController.createApiToken(projectId, label, roleName);
    
    expect(spy).toHaveBeenCalledWith(projectId, label, roleName);
    spy.mockRestore();
  });
}); 