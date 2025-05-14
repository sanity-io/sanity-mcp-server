import {outdent} from 'outdent'

export const SCHEMA_DEPLOYMENT_INSTRUCTIONS = outdent`
  Your Sanity schema has not been deployed. In your Sanity project, run the following command:
  \`\`\`shell
  npx sanity@latest schema deploy
  \`\`\`
`
