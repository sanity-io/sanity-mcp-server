import { jest } from '@jest/globals';
import { listOrganizationsAndProjects, listStudios } from '../../src/controllers/projects.js';
import { sanityApi } from '../../src/utils/sanityClient.js';

// Mock the sanityApi.listProjects function
jest.mock('../../src/utils/sanityClient.js', () => ({
  sanityApi: {
    listProjects: jest.fn()
  }
}));

describe('Projects Controller', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('listOrganizationsAndProjects', () => {
    it('should group projects by organization', async () => {
      // Mock the API response
      sanityApi.listProjects.mockResolvedValue([
        {
          id: 'project1',
          displayName: 'Project 1',
          organizationId: 'org1',
          studioHost: 'project1'
        },
        {
          id: 'project2',
          displayName: 'Project 2',
          organizationId: 'org1',
          studioHost: 'project2'
        },
        {
          id: 'project3',
          displayName: 'Project 3',
          organizationId: null,
          studioHost: 'project3'
        }
      ]);
      
      // Call the function
      const result = await listOrganizationsAndProjects();
      
      // Check that projects are grouped correctly
      expect(result).toHaveLength(2); // Two organizations: org1 and personal
      
      // Check organization 1
      const org1 = result.find(org => org.organizationId === 'org1');
      expect(org1).toBeDefined();
      expect(org1.projects).toHaveLength(2);
      expect(org1.projects.map(p => p.id)).toEqual(['project1', 'project2']);
      
      // Check personal projects
      const personal = result.find(org => org.organizationId === 'personal');
      expect(personal).toBeDefined();
      expect(personal.projects).toHaveLength(1);
      expect(personal.projects[0].id).toEqual('project3');
      
      // Check that the API was called
      expect(sanityApi.listProjects).toHaveBeenCalledTimes(1);
    });
    
    it('should handle errors', async () => {
      // Mock an API error
      sanityApi.listProjects.mockRejectedValue(new Error('API error'));
      
      // Call should throw
      await expect(listOrganizationsAndProjects()).rejects.toThrow('Failed to list organizations and projects');
    });
  });
  
  describe('listStudios', () => {
    it('should return studio URLs for a project', async () => {
      // Mock the API response
      sanityApi.listProjects.mockResolvedValue([
        {
          id: 'project1',
          displayName: 'Project 1',
          studioHost: 'project1-studio',
          externalStudioHost: 'https://external-studio.example.com'
        }
      ]);
      
      // Call the function
      const result = await listStudios('project1');
      
      // Check the studios
      expect(result.studios).toHaveLength(2);
      expect(result.studios[0]).toEqual({
        type: 'sanity-hosted',
        url: 'https://project1-studio.sanity.studio/'
      });
      expect(result.studios[1]).toEqual({
        type: 'external',
        url: 'https://external-studio.example.com'
      });
    });
    
    it('should handle projects with no studios', async () => {
      // Mock the API response
      sanityApi.listProjects.mockResolvedValue([
        {
          id: 'project2',
          displayName: 'Project 2',
          studioHost: null,
          externalStudioHost: null
        }
      ]);
      
      // Call the function
      const result = await listStudios('project2');
      
      // Check the result
      expect(result.studios).toHaveLength(0);
      expect(result.message).toContain('No hosted studio');
    });
    
    it('should throw an error for non-existent projects', async () => {
      // Mock the API response with no matching project
      sanityApi.listProjects.mockResolvedValue([
        { id: 'other-project' }
      ]);
      
      // Call should throw
      await expect(listStudios('non-existent')).rejects.toThrow('Project not found');
    });
  });
});
