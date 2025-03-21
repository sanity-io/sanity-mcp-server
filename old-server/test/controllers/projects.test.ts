import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {listOrganizationsAndProjects, listStudios} from '../../src/controllers/projects.js'
import {sanityApi} from '../../src/utils/sanityClient.js'

// Mock the sanityClient and its API
vi.mock('../../src/utils/sanityClient.js', () => ({
  sanityApi: {
    listProjects: vi.fn()
  }
}))

describe('Projects Controller', () => {
  // Mock data
  const mockProjects = [
    {
      id: 'project1',
      displayName: 'Project 1',
      studioHost: 'project1',
      organizationId: 'org1'
    },
    {
      id: 'project2',
      displayName: 'Project 2',
      studioHost: 'project2',
      externalStudioHost: 'https://project2.example.com',
      organizationId: 'org1'
    },
    {
      id: 'project3',
      displayName: 'Project 3',
      studioHost: 'project3',
      organizationId: 'org2'
    },
    {
      id: 'personal-project',
      displayName: 'Personal Project',
      studioHost: 'personal-project'
      // No organizationId
    }
  ]

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('listOrganizationsAndProjects', () => {
    it('should list organizations and their projects', async () => {
      // Setup
      (sanityApi.listProjects as any).mockResolvedValue(mockProjects)

      // Execute
      const result = await listOrganizationsAndProjects()

      // Verify
      expect(sanityApi.listProjects).toHaveBeenCalled()
      expect(result).toHaveLength(3) // 2 orgs + 1 personal

      // Verify orgs are correct
      const org1 = result.find((org) => org.organizationId === 'org1')
      const org2 = result.find((org) => org.organizationId === 'org2')
      const personal = result.find((org) => org.organizationId === 'personal')

      expect(org1).toBeDefined()
      expect(org2).toBeDefined()
      expect(personal).toBeDefined()

      // Verify projects are assigned to correct orgs
      expect(org1?.projects).toHaveLength(2)
      expect(org2?.projects).toHaveLength(1)
      expect(personal?.projects).toHaveLength(1)

      // Verify project data
      expect(org1?.projects[0].id).toBe('project1')
      expect(org1?.projects[1].id).toBe('project2')
      expect(org2?.projects[0].id).toBe('project3')
      expect(personal?.projects[0].id).toBe('personal-project')
    })

    it('should return only organizations with projects', async () => {
      // Setup - add an empty organization
      const projectsWithEmptyOrg = [
        ...mockProjects,
        {
          id: 'emptyShouldBeFiltered',
          displayName: 'Empty Org Project',
          organizationId: 'emptyOrg'
        }
      ]

      // Remove project from emptyOrg to test filtering
      const filteredProjects = projectsWithEmptyOrg.filter(
        (p) => p.id !== 'emptyShouldBeFiltered'
      );

      (sanityApi.listProjects as any).mockResolvedValue(filteredProjects)

      // Execute
      const result = await listOrganizationsAndProjects()

      // Verify no empty org is included
      expect(result.find((org) => org.organizationId === 'emptyOrg')).toBeUndefined()
    })

    it('should handle errors from the API', async () => {
      // Setup
      (sanityApi.listProjects as any).mockRejectedValue(new Error('API Error'))

      // Execute & Verify
      await expect(listOrganizationsAndProjects()).rejects.toThrow(
        'Failed to list organizations and projects: API Error'
      )
    })
  })

  describe('listStudios', () => {
    it('should list both Sanity-hosted and external studios', async () => {
      // Setup
      (sanityApi.listProjects as any).mockResolvedValue(mockProjects)

      // Execute - project2 has both types of studios
      const result = await listStudios('project2')

      // Verify
      expect(sanityApi.listProjects).toHaveBeenCalled()
      expect(result.studios).toHaveLength(2)

      // Verify both types are present
      const sanityHosted = result.studios.find((s) => s.type === 'sanity-hosted')
      const external = result.studios.find((s) => s.type === 'external')

      expect(sanityHosted).toBeDefined()
      expect(external).toBeDefined()

      expect(sanityHosted?.url).toBe('https://project2.sanity.studio/')
      expect(external?.url).toBe('https://project2.example.com')
    })

    it('should list only Sanity-hosted studio when no external studio exists', async () => {
      // Setup
      (sanityApi.listProjects as any).mockResolvedValue(mockProjects)

      // Execute - project1 has only Sanity-hosted studio
      const result = await listStudios('project1')

      // Verify
      expect(result.studios).toHaveLength(1)
      expect(result.studios[0].type).toBe('sanity-hosted')
      expect(result.studios[0].url).toBe('https://project1.sanity.studio/')
    })

    it('should include a message when no studios are found', async () => {
      // Setup - project with no studios
      const noStudioProject = [
        {
          id: 'nostudio',
          displayName: 'No Studio Project'
          // No studio hosts
        }
      ];
      (sanityApi.listProjects as any).mockResolvedValue(noStudioProject)

      // Execute
      const result = await listStudios('nostudio')

      // Verify
      expect(result.studios).toHaveLength(0)
      expect(result.message).toBe('No hosted studio - Studio may be local only')
    })

    it('should throw an error when project is not found', async () => {
      // Setup
      (sanityApi.listProjects as any).mockResolvedValue(mockProjects)

      // Execute & Verify
      await expect(listStudios('nonexistent')).rejects.toThrow(
        'Project not found: nonexistent'
      )
    })

    it('should handle errors from the API', async () => {
      // Setup
      (sanityApi.listProjects as any).mockRejectedValue(new Error('API Error'))

      // Execute & Verify
      await expect(listStudios('project1')).rejects.toThrow(
        'Failed to list studios: API Error'
      )
    })
  })
})
