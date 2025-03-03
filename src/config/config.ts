import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
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

interface Config {
  sanityToken?: string;
  projectId?: string;
  dataset?: string;
  apiVersion: string;
  openAiApiKey?: string;
  port: number;
  schemasDir: string;
  getSchemaPath: (projectId: string, dataset: string) => string;
}

const config: Config = {
  // Sanity token from environment variable
  sanityToken: process.env.SANITY_TOKEN,
  
  // Sanity project ID and dataset from environment variables
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  
  // Sanity API version
  apiVersion: process.env.SANITY_API_VERSION || '2024-05-23',
  
  // OpenAI API key for optional LLM verification
  openAiApiKey: process.env.OPENAI_API_KEY,
  
  // Server port
  port: parseInt(process.env.PORT || '3000', 10),
  
  // Path to schema files
  schemasDir,
  
  /**
   * Get the path to the schema file for a specific project and dataset
   * 
   * @param projectId - Sanity project ID
   * @param dataset - Dataset name
   * @returns The path to the schema file
   */
  getSchemaPath(projectId: string, dataset: string): string {
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
