// Script to list documents in a specific release
import { listReleaseDocuments } from '../dist/controllers/releases.js';

async function testListReleaseDocuments() {
  try {
    // Use the same project ID and dataset from config
    const projectId = process.env.SANITY_PROJECT_ID || 'zwl9ofqf';
    const dataset = process.env.SANITY_DATASET || 'production';
    
    // The release ID from your example
    const releaseId = "release-1741044548403-fixops";
    
    console.log(`Listing documents in release ${releaseId} (project: ${projectId}, dataset: ${dataset})...`);
    
    const result = await listReleaseDocuments(projectId, dataset, releaseId);
    
    console.log('Result:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Error listing documents in release:`, error);
  }
}

testListReleaseDocuments();
