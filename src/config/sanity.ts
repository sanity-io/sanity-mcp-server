import {createClient} from '@sanity/client'
import {env} from './env.js'

if (!env.success) {
  throw new Error('Environment variables are not properly configured')
}

export const sanityClient = createClient({
  projectId: env.data.SANITY_PROJECT_ID,
  apiHost: env.data.SANITY_API_HOST,
  dataset: env.data.SANITY_DATASET,
  token: env.data.SANITY_API_TOKEN,
  apiVersion: 'vX', // vX until generate API ships in GA
  perspective: 'raw',
  useCdn: false,
  ...env.data.INTERNAL_SANITY_CLIENT_OPTIONS,
})
