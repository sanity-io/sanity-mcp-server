import {createClient, requester as baseRequester, type ClientConfig} from '@sanity/client'
import {headers} from 'get-it/middleware'
import {env} from './env.js'

if (!env.success) {
  throw new Error('Environment variables are not properly configured')
}

const clientConfig: ClientConfig = {
  projectId: env.data.SANITY_PROJECT_ID,
  dataset: env.data.SANITY_DATASET,
  apiHost: env.data.SANITY_API_HOST,
  token: env.data.SANITY_API_TOKEN,
  apiVersion: 'vX', // vX until generate API ships in GA
  perspective: 'raw',
  useCdn: false,
}

if (env.data.INTERNAL_REQUEST_TAG_PREFIX) {
  clientConfig.requestTagPrefix = env.data.INTERNAL_REQUEST_TAG_PREFIX
}

if (env.data.INTERNAL_USE_PROJECT_HOSTNAME !== undefined) {
  clientConfig.useProjectHostname = env.data.INTERNAL_USE_PROJECT_HOSTNAME
}

if (env.data.INTERNAL_REQUESTER_HEADERS) {
  const requester = baseRequester.clone()
  requester.use(headers(env.data.INTERNAL_REQUESTER_HEADERS))
  clientConfig.requester = requester
}

export const sanityClient = createClient(clientConfig)
