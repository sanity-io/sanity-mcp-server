import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Get the directory path for this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure schemas directory exists
const schemasDir = process.env.SCHEMAS_DIR || path.resolve(__dirname, '../../schemas');
if (!fs.existsSync(schemasDir)) {
  fs.mkdirSync(schemasDir, { recursive: true });
}

const config = {
  // Sanity token from environment variable
  sanityToken: process.env.SANITY_TOKEN,
  
  // Sanity project ID and dataset from environment variables
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  
  // Sanity API version
  apiVersion: process.env.SANITY_API_VERSION || '2023-10-01',
  
  // OpenAI API key for optional LLM verification
  openAiApiKey: process.env.OPENAI_API_KEY,
  
  // Server port
  port: process.env.PORT || 3000,
  
  // Path to schema files
  schemasDir,
  
  /**
   * Get the path to the schema file for a specific project and dataset
   * 
   * @param {string} projectId - Sanity project ID
   * @param {string} dataset - Dataset name
   * @returns {string} The path to the schema file
   */
  getSchemaPath(projectId, dataset) {
    return path.join(this.schemasDir, `${projectId}_${dataset}.json`);
  }
};

// Validate required config - only exit in production mode
const isTestMode = process.env.NODE_ENV === 'test' || process.argv.some(arg => arg.includes('jest'));

if (!config.sanityToken && !isTestMode) {
  console.error('Error: SANITY_TOKEN environment variable is required');
  process.exit(1);
}

export default config;
