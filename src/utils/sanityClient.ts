import { createClient, SanityClient } from '@sanity/client';
import fetch from 'node-fetch';
import config from '../config/config.ts';

/**
 * Creates a Sanity client for a specific project and dataset
 * 
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name (default: 'production')
 * @returns Configured Sanity client instance
 */
export function createSanityClient(projectId: string, dataset: string = 'production'): SanityClient {
  return createClient({
    projectId,
    dataset,
    apiVersion: config.apiVersion,
    token: config.sanityToken,
    useCdn: false // Using the API directly ensures we get fresh content
  });
}

interface SanityProject {
  id: string;
  displayName: string;
  organizationId: string;
  isDefault: boolean;
  createdAt: string;
  studioHost?: string;
  members: Array<{
    id: string;
    role: string;
  }>;
}

interface SanityAction {
  create?: Record<string, any>;
  createOrReplace?: Record<string, any>;
  createIfNotExists?: Record<string, any>;
  patch?: {
    id: string;
    set?: Record<string, any>;
    setIfMissing?: Record<string, any>;
    unset?: string[];
    insert?: Record<string, any>;
    inc?: Record<string, any>;
    dec?: Record<string, any>;
  };
  delete?: {
    id: string;
  };
}

interface SanityActionResult {
  transactionId: string;
  results: Array<{
    id: string;
    document?: Record<string, any>;
  }>;
}

/**
 * Makes direct HTTP requests to Sanity APIs not covered by the client
 */
export const sanityApi = {
  /**
   * Fetches all projects accessible to the user
   * 
   * @returns Promise with list of projects
   */
  async listProjects(): Promise<SanityProject[]> {
    const response = await fetch('https://api.sanity.io/v2021-06-07/projects', {
      headers: {
        'Authorization': `Bearer ${config.sanityToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    
    return response.json() as Promise<SanityProject[]>;
  },
  
  /**
   * Call the Sanity Actions API
   * 
   * @param projectId - Sanity project ID
   * @param dataset - Dataset name
   * @param actions - Array of action objects
   * @returns Promise with action result
   */
  async performActions(projectId: string, dataset: string, actions: SanityAction[]): Promise<SanityActionResult> {
    const url = `https://${projectId}.api.sanity.io/v${config.apiVersion}/data/action/${dataset}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.sanityToken}`
      },
      body: JSON.stringify({ actions })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Action API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return response.json() as Promise<SanityActionResult>;
  }
};
