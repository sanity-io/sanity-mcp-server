import {readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {dirname} from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read package.json using import instead of require
const packageJsonPath = join(__dirname, '../package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

const outputPath = join(__dirname, '../src/config/version.ts')

// Generate version file content directly
const content = `// Generated file - do not edit
export const VERSION = '${packageJson.version}';
`

writeFileSync(outputPath, content)
console.info(`Generated version.ts with version ${packageJson.version}`)
