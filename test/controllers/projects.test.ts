import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as projectsController from '../../src/controllers/projects.js';
import { sanityApi } from '../../src/utils/sanityClient.js';

// Mock the sanityApi
vi.mock('../../src/utils/sanityClient.js', () => ({
  sanityApi: {
    listProjects: vi.fn(),
    listCorsOrigins: vi.fn(),
    addCorsOrigin: vi.fn(),
    createApiToken: vi.fn(),
    listApiTokens: vi.fn()
  }
}));

describe('Projects Controller', () => {
  const mockProjectId = 'test-project';
  
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('listOrganizationsAndProjects', () => {
    it('should list organizations and their projects', async () => {
      const mockProjects = [
        { id: 'proj1', displayName: 'Project 1', organizationId: 'org1' },
        { id: 'proj2', displayName: 'Project 2', organizationId: 'org1' },
        { id: 'proj3', displayName: 'Project 3' }
      ];
      
      (sanityApi.listProjects as any).mockResolvedValueOnce(mockProjects);

      const result = await projectsController.listOrganizationsAndProjects();

      expect(sanityApi.listProjects).toHaveBeenCalled();
      expect(result).toHaveLength(2); // One organization + personal projects
      
      // Find the organization by ID since order may vary
      const orgResults = result.reduce((acc, org) => {
        acc[org.organizationId] = org;
        return acc;
      }, {} as Record<string, any>);
      
      // Verify org1 organization
      expect(orgResults['org1']).toBeDefined();
      expect(orgResults['org1'].projects).toHaveLength(2);
      
      // Verify personal organization
      expect(orgResults['personal']).toBeDefined();
      expect(orgResults['personal'].projects).toHaveLength(1);
    });

    it('should handle API errors', async () => {
      (sanityApi.listProjects as any).mockRejectedValueOnce(new Error('API Error'));

      await expect(projectsController.listOrganizationsAndProjects())
        .rejects.toThrow('Failed to list organizations and projects');
    });
  });

  describe('listStudios', () => {
    it('should list studios for a project', async () => {
      const mockProjects = [
        { 
          id: mockProjectId, 
          displayName: 'Test Project', 
          studioHost: 'test-project',
          externalStudioHost: 'https://external-studio.example.com'
        }
      ];
      
      (sanityApi.listProjects as any).mockResolvedValueOnce(mockProjects);

      const result = await projectsController.listStudios(mockProjectId);

      expect(sanityApi.listProjects).toHaveBeenCalled();
      expect(result.studios).toHaveLength(2);
      expect(result.studios[0].type).toBe('sanity-hosted');
      expect(result.studios[1].type).toBe('external');
    });

    it('should return a message when no studios found', async () => {
      const mockProjects = [
        { id: mockProjectId, displayName: 'Test Project' }
      ];
      
      (sanityApi.listProjects as any).mockResolvedValueOnce(mockProjects);

      const result = await projectsController.listStudios(mockProjectId);

      expect(result.studios).toHaveLength(0);
      expect(result.message).toBe('No hosted studio - Studio may be local only');
    });

    it('should throw error when project not found', async () => {
      const mockProjects = [
        { id: 'other-project', displayName: 'Other Project' }
      ];
      
      (sanityApi.listProjects as any).mockResolvedValueOnce(mockProjects);

      await expect(projectsController.listStudios(mockProjectId))
        .rejects.toThrow('Project not found');
    });
  });

  describe('listCorsOrigins', () => {
    it('should list CORS origins for a project', async () => {
      const mockCorsOrigins = [
        {
          id: 1,
          projectId: mockProjectId,
          origin: 'https://example.com',
          allowCredentials: true,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          deletedAt: null
        }
      ];
      
      (sanityApi.listCorsOrigins as any).mockResolvedValueOnce(mockCorsOrigins);

      const result = await projectsController.listCorsOrigins(mockProjectId);

      expect(sanityApi.listCorsOrigins).toHaveBeenCalledWith(mockProjectId);
      expect(result).toEqual(mockCorsOrigins);
    });

    it('should throw error when project ID is missing', async () => {
      await expect(projectsController.listCorsOrigins(''))
        .rejects.toThrow('Project ID is required');
    });

    it('should handle API errors', async () => {
      (sanityApi.listCorsOrigins as any).mockRejectedValueOnce(new Error('API Error'));

      await expect(projectsController.listCorsOrigins(mockProjectId))
        .rejects.toThrow('Failed to list CORS origins');
    });
  });

  describe('addCorsOrigin', () => {
    it('should add a CORS origin to a project', async () => {
      const mockCorsOrigin = {
        id: 1,
        projectId: mockProjectId,
        origin: 'https://example.com',
        allowCredentials: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        deletedAt: null
      };
      
      (sanityApi.addCorsOrigin as any).mockResolvedValueOnce(mockCorsOrigin);

      const result = await projectsController.addCorsOrigin(
        mockProjectId,
        'https://example.com',
        true
      );

      expect(sanityApi.addCorsOrigin).toHaveBeenCalledWith(
        mockProjectId,
        'https://example.com',
        true
      );
      expect(result).toEqual(mockCorsOrigin);
    });

    it('should use default allowCredentials value', async () => {
      const mockCorsOrigin = {
        id: 1,
        projectId: mockProjectId,
        origin: 'https://example.com',
        allowCredentials: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        deletedAt: null
      };
      
      (sanityApi.addCorsOrigin as any).mockResolvedValueOnce(mockCorsOrigin);

      await projectsController.addCorsOrigin(
        mockProjectId,
        'https://example.com'
      );

      expect(sanityApi.addCorsOrigin).toHaveBeenCalledWith(
        mockProjectId,
        'https://example.com',
        true
      );
    });

    it('should throw error when project ID is missing', async () => {
      await expect(projectsController.addCorsOrigin(
        '',
        'https://example.com'
      )).rejects.toThrow('Project ID is required');
    });

    it('should throw error when origin is missing', async () => {
      await expect(projectsController.addCorsOrigin(
        mockProjectId,
        ''
      )).rejects.toThrow('Origin URL is required');
    });

    it('should throw error for invalid origin URL', async () => {
      await expect(projectsController.addCorsOrigin(
        mockProjectId,
        'invalid-url'
      )).rejects.toThrow('Invalid origin URL format');
    });

    it('should handle API errors', async () => {
      (sanityApi.addCorsOrigin as any).mockRejectedValueOnce(new Error('API Error'));

      await expect(projectsController.addCorsOrigin(
        mockProjectId,
        'https://example.com'
      )).rejects.toThrow('Failed to add CORS origin');
    });
  });

  describe('createApiToken', () => {
    it('should create an API token for a project', async () => {
      const mockApiToken = {
        id: 'token1',
        key: 'api-key-value',
        roles: [{ name: 'developer', title: 'Developer' }],
        label: 'Test Token',
        projectUserId: '123'
      };
      
      (sanityApi.createApiToken as any).mockResolvedValueOnce(mockApiToken);

      const result = await projectsController.createApiToken(
        mockProjectId,
        'Test Token',
        'developer'
      );

      expect(sanityApi.createApiToken).toHaveBeenCalledWith(
        mockProjectId,
        'Test Token',
        'developer'
      );
      expect(result).toEqual(mockApiToken);
    });

    it('should throw error when project ID is missing', async () => {
      await expect(projectsController.createApiToken(
        '',
        'Test Token',
        'developer'
      )).rejects.toThrow('Project ID is required');
    });

    it('should throw error when label is missing', async () => {
      await expect(projectsController.createApiToken(
        mockProjectId,
        '',
        'developer'
      )).rejects.toThrow('Token label is required');
    });

    it('should throw error when role name is missing', async () => {
      await expect(projectsController.createApiToken(
        mockProjectId,
        'Test Token',
        '' as any
      )).rejects.toThrow('Role name is required');
    });

    it('should handle API errors', async () => {
      (sanityApi.createApiToken as any).mockRejectedValueOnce(new Error('API Error'));

      await expect(projectsController.createApiToken(
        mockProjectId,
        'Test Token',
        'developer'
      )).rejects.toThrow('Failed to create API token');
    });
  });

  describe('listApiTokens', () => {
    it('should list API tokens for a project', async () => {
      const mockApiTokens = [
        {
          id: 'token1',
          key: 'api-key-value-1',
          roles: [{ name: 'developer', title: 'Developer' }],
          label: 'Test Token 1',
          projectUserId: '123'
        },
        {
          id: 'token2',
          key: 'api-key-value-2',
          roles: [{ name: 'editor', title: 'Editor' }],
          label: 'Test Token 2',
          projectUserId: '123'
        }
      ];
      
      (sanityApi.listApiTokens as any).mockResolvedValueOnce(mockApiTokens);

      const result = await projectsController.listApiTokens(mockProjectId);

      expect(sanityApi.listApiTokens).toHaveBeenCalledWith(mockProjectId);
      expect(result).toEqual(mockApiTokens);
    });

    it('should throw error when project ID is missing', async () => {
      await expect(projectsController.listApiTokens(''))
        .rejects.toThrow('Project ID is required');
    });

    it('should handle API errors', async () => {
      (sanityApi.listApiTokens as any).mockRejectedValueOnce(new Error('API Error'));

      await expect(projectsController.listApiTokens(mockProjectId))
        .rejects.toThrow('Failed to list API tokens');
    });
  });
}); 