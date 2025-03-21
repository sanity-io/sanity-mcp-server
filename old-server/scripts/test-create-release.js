// Script to test create release functionality directly
import { createRelease } from '../dist/controllers/releases.js';

async function testCreateRelease() {
  try {
    // Use the same project ID and dataset from Claude config
    const projectId = process.env.SANITY_PROJECT_ID || 'zwl9ofqf';
    const dataset = process.env.SANITY_DATASET || 'production';
    
    // Create a release with a timestamp to ensure uniqueness
    const releaseId = `test-release-${Date.now()}`;
    const title = 'Test Release via Script';
    
    console.log(`Creating release ${releaseId} in project ${projectId}, dataset ${dataset}...`);
    
    const result = await createRelease(
      projectId,
      dataset,
      releaseId,
      title,
      {
        description: 'Created via direct script testing',
        releaseType: 'asap'
      }
    );
    
    console.log('Success:', result);
  } catch (error) {
    console.error('Failed to create release:', error);
  }
}

testCreateRelease();
