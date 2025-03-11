import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables
dotenv.config()

// We need to handle both ESM and CommonJS
// Since we can't rely on import.meta.url in all TS configurations,
// we'll use the dirname of the current module
const __dirname = path.resolve()

// Parse command line arguments
function parseCommandLineArgs() {
  const args: Record<string, string> = {}

  for (const arg of process.argv) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=')
      if (key && value) {
        // Convert kebab-case to env var format
        const envKey = key.toUpperCase().replace(/-/g, '_')
        args[envKey] = value
      }
    }
  }

  return args
}

const cmdArgs = parseCommandLineArgs()

// Ensure schemas directory exists
const schemasDir = process.env.SCHEMAS_DIR || path.join(__dirname, 'schemas')
if (!fs.existsSync(schemasDir)) {
  fs.mkdirSync(schemasDir, {recursive: true})
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
  // Sanity token from environment variable or command line
  sanityToken: cmdArgs.SANITY_TOKEN || process.env.SANITY_TOKEN,

  // Sanity project ID and dataset from environment variables or command line
  projectId: cmdArgs.SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID,
  dataset: cmdArgs.SANITY_DATASET || process.env.SANITY_DATASET,

  // Sanity API version
  apiVersion: cmdArgs.SANITY_API_VERSION || process.env.SANITY_API_VERSION || '2024-05-23',

  // OpenAI API key for optional LLM verification
  openAiApiKey: cmdArgs.OPENAI_API_KEY || process.env.OPENAI_API_KEY,

  // Server port
  port: parseInt(cmdArgs.PORT || process.env.PORT || '3000', 10),

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
    return path.join(this.schemasDir, `${projectId}_${dataset}.json`)
  }
}

// Validate required config - only exit in production mode
const isTestMode = process.env.NODE_ENV === 'test' || process.argv.some((arg) => arg.includes('jest'))

if (!config.sanityToken && !isTestMode) {
  console.error('Error: SANITY_TOKEN environment variable is required')
  process.exit(1)
}

export default config
