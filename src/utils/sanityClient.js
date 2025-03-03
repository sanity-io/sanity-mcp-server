import { createClient } from '@sanity/client';
import fetch from 'node-fetch';
import config from '../config/config.js';

/**
 * Creates a Sanity client for a specific project and dataset
 * 
 * @param {string} projectId - Sanity project ID
 * @param {string} dataset - Dataset name (default: 'production')
 * @returns {Object} Configured Sanity client instance
 */
export function createSanityClient(projectId, dataset = 'production') {
  return createClient({
    projectId,
    dataset,
    apiVersion: config.apiVersion,
    token: config.sanityToken,
    useCdn: false // Using the API directly ensures we get fresh content
  });
}

/**
 * Makes direct HTTP requests to Sanity APIs not covered by the client
 */
export const sanityApi = {
  /**
   * Fetches all projects accessible to the user
   * 
   * @returns {Promise<Array>} List of projects
   */
  async listProjects() {
    const response = await fetch('https://api.sanity.io/v2021-06-07/projects', {
      headers: {
        'Authorization': `Bearer ${config.sanityToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  /**
   * Call the Sanity Actions API
   * 
   * @param {string} projectId - Sanity project ID
   * @param {string} dataset - Dataset name
   * @param {Array} actions - Array of action objects
   * @returns {Promise<Object>} Action result
   */
  async performActions(projectId, dataset, actions) {
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
    
    return response.json();
  }
};
