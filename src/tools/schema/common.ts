import {outdent} from 'outdent'

export const SCHEMA_DEPLOYMENT_INSTRUCTIONS = outdent`
  Your Sanity schema has not been deployed. In your Sanity project, run the following command:
  \`\`\`shell
  SANITY_CLI_SCHEMA_STORE_ENABLED=true npx sanity@latest schema deploy
  \`\`\`
`
