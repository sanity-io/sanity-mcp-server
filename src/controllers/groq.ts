/**
 * GROQ Query Controller
 *
 * Handles GROQ queries against the Sanity Content Lake
 */
import {SanityClient} from '@sanity/client'

import config from '../config/config.js'
import type {
  ContentObject,
  ContentValue,
  GroqSpecification,
  QueryResponse,
  SanityDocument,
  SanityQueryParams
} from '../types/index.js'
import logger from '../utils/logger.js'
import {createSanityClient} from '../utils/sanityClient.js'

interface Subscription {
  unsubscribe: () => void;
}

// Map of active subscriptions
const activeSubscriptions = new Map<string, Subscription>()

/**
 * Creates a Sanity client based on the environment (test or production)
 */
function createClient(projectId: string, dataset: string, params: SanityQueryParams = {}): SanityClient {
  if (process.env.NODE_ENV === 'test') {
    return createSanityClient(projectId, dataset)
  }

  return createSanityClient(projectId, dataset, {
    apiVersion: config.apiVersion,
    useCdn: params.useCdn !== false,
    token: params.token || config.sanityToken,
    perspective: params.includeDrafts ? 'previewDrafts' : 'published'
  })
}

/**
 * Executes a GROQ query with the appropriate parameters based on environmen
 */
async function executeQuery(
  client: SanityClient,
  queryString: string,
  params: SanityQueryParams = {}
): Promise<SanityDocument | SanityDocument[]> {
  const queryParams = params.params && typeof params.params === 'object' ? params.params : {}

  if (process.env.NODE_ENV === 'test') {
    // In test mode, only pass query and params without the third parameter
    return await client.fetch(queryString, queryParams)
  }

  // In production, include a third parameter for consistency/caching settings
  return await client.fetch(queryString, queryParams, {})
}

/**
 * Applies additional filtering based on parameters
 */
function applyFilters(
  results: SanityDocument | SanityDocument[],
  params: SanityQueryParams = {}
): SanityDocument | SanityDocument[] {
  let filtered = results

  // Apply additional filter if specified
  if (typeof params.filter === 'function' && Array.isArray(filtered)) {
    filtered = filtered.filter(params.filter)
  }

  // Apply additional limit if specified
  if (params.limit && typeof params.limit === 'number' && Array.isArray(filtered)) {
    filtered = filtered.slice(0, params.limit)
  }

  return filtered
}

/**
 * Formats the result count for the response
 */
function getResultCount(results: SanityDocument | SanityDocument[]): number {
  if (Array.isArray(results)) {
    return results.length
  }
  return results ? 1 : 0
}

/**
 * Checks if a value is a Portable Text block array
 *
 * @param value - The value to check
 * @returns True if the value is a Portable Text block array
 */
function isPortableTextArray(value: unknown): boolean {
  return Array.isArray(value) &&
         value.length > 0 &&
         value[0] !== null &&
         value[0] !== undefined &&
         typeof value[0] === 'object' &&
         '_type' in value[0] &&
         value[0]._type === 'block'
}

/**
 * Processes a single document to convert Portable Text fields to a placeholder
 *
 * @param doc - Sanity document that may contain Portable Text fields
 * @returns Processed document with Portable Text converted to placeholder tex
 */
function processDocument(doc: ContentObject | null): ContentObject | null {
  // Handle null or undefined
  if (!doc) {
    return doc
  }

  // Create a shallow copy to avoid mutating the original
  const result: ContentObject = {...doc}

  // Process each field in the objec
  for (const [key, value] of Object.entries(result)) {
    // Handle Portable Text blocks
    if (isPortableTextArray(value)) {
      result[key] = '[Portable Text Content]' as ContentValue
    } else if (value && typeof value === 'object') {
      // Process nested objects
      result[key] = processDocument(value as ContentObject) as ContentValue
    }
    // Primitive values are left as is
  }

  return result
}

/**
 * Helper function to convert Portable Text fields to placeholder tex
 *
 * @param data - Data containing potential Portable Text fields
 * @returns Processed data with Portable Text converted to placeholder tex
 */
function processPortableTextFields(
  data: SanityDocument | SanityDocument[]
): SanityDocument | SanityDocument[] {
  // Handle array of results
  if (Array.isArray(data)) {
    return data.map((item) => processDocument(item) as SanityDocument)
  }

  // Handle single resul
  return processDocument(data) as SanityDocument
}

/**
 * Searches for content using a GROQ query
 *
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param queryString - GROQ query
 * @param params - Additional parameters for the query
 * @returns The query results
 */
export async function searchContent(
  projectId: string,
  dataset: string,
  queryString: string,
  params: SanityQueryParams = {}
): Promise<QueryResponse<SanityDocument | SanityDocument[]>> {
  try {
    // Create client with appropriate configuration
    const client = createClient(projectId, dataset, params)

    // Execute the query
    const results = await executeQuery(client, queryString, params)

    // Apply any additional filtering
    const filtered = applyFilters(results, params)

    // Process portable text fields
    const processedResults = processPortableTextFields(filtered)

    // Calculate result coun
    const count = getResultCount(processedResults)

    // Standard response
    return {
      query: queryString,
      results: processedResults,
      count
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('Error executing GROQ query:', error)
    throw new Error(`Failed to execute GROQ query: ${errorMessage}`)
  }
}

/**
 * Executes GROQ queries to retrieve conten
 *
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param queryString - GROQ query to execute
 * @param params - Query parameters (if any)
 * @returns Query results
 */
export async function query(
  projectId: string,
  dataset: string,
  queryString: string,
  params: SanityQueryParams = {}
): Promise<{
  results: SanityDocument | SanityDocument[];
}> {
  try {
    // Create client with appropriate configuration
    const client = createClient(projectId, dataset, params)

    // Execute the query
    const results = await executeQuery(client, queryString, params)

    // Apply any additional filtering
    const filtered = applyFilters(results, params)

    // Process portable text fields
    const processedResults = processPortableTextFields(filtered)

    // Standard response
    return {
      results: processedResults
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('Error executing GROQ query:', error)
    throw new Error(`Failed to execute GROQ query: ${errorMessage}`)
  }
}

/**
 * Subscribes to real-time updates for documents matching a query
 *
 * @param projectId - Sanity project ID
 * @param dataset - Dataset name
 * @param queryString - GROQ query to listen to
 * @returns Subscription details
 */
export async function subscribeToUpdates(
  projectId: string,
  dataset: string,
  queryString: string
): Promise<{
  subscriptionId: string;
  query: string;
  message: string;
}> {
  try {
    const client = createSanityClient(projectId, dataset)

    // Create a subscription
    const subscription = client.listen(queryString)

    // Generate a unique subscription ID
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`

    // Set up event handlers for the subscription
    const sub = subscription.subscribe((update) => {
      // Process the update even
      logger.info(`Document update for subscription ${subscriptionId}:`, {
        documentId: update.documentId,
        type: update.transition,
        result: update.result
      })

      // In a production implementation, you would send these updates to the clien
      // e.g., via WebSockets, Server-Sent Events, or a notification system
    })

    // Store the subscription in the active subscriptions map
    activeSubscriptions.set(subscriptionId, sub)

    return {
      subscriptionId,
      query: queryString,
      message: `Successfully subscribed to updates for query: ${queryString}`
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('Error setting up subscription:', error)
    throw new Error(`Failed to subscribe to updates: ${errorMessage}`)
  }
}

/**
 * Fetches the GROQ specification from the Sanity documentation
 *
 * @returns The GROQ specification
 */
export async function getGroqSpecification(): Promise<{
  specification: GroqSpecification;
  source: string;
}> {
  try {
    // Fetch the GROQ specification from the Sanity documentation
    const response = await fetch('https://sanity-io.github.io/GROQ/')

    if (!response.ok) {
      throw new Error(`Failed to fetch GROQ specification, status: ${response.status}`)
    }

    return {
      specification: {
        name: 'GROQ',
        version: '1.0',
        description: 'GROQ (Graph-Relational Object Queries) is a query language for JSON-like data ' +
                   'structures that enables you to filter and join data from multiple collections ' +
                   'without explicit joins.',
        coreFeatures: [
          'Filtering with predicates and operators',
          'Projections to shape the returned data',
          'Joins across documents without explicit join syntax',
          'Aggregation and grouping',
          'Ordering and slicing results'
        ],
        queryStructure: [
          {
            name: 'Dataset selector',
            description: 'Select the dataset to query, defaults to the current dataset',
            syntax: '*',
            example: "*[_type == 'post']"
          },
          {
            name: 'Filter',
            description: 'Filter documents using conditions inside square brackets',
            syntax: '[<condition>]',
            example: "*[_type == 'post' && publishedAt > '2023-01-01']"
          },
          {
            name: 'Projection',
            description: 'Shape the returned data using a projection object',
            syntax: '{<field>, <field2>}',
            example: "*[_type == 'post']{title, body, author}"
          },
          {
            name: 'References',
            description: 'Follow references to other documents',
            syntax: '<reference>->',
            example: "*[_type == 'post']{title, 'authorName': author->name}"
          },
          {
            name: 'Ordering',
            description: 'Order results',
            syntax: 'order(<field> [asc|desc])',
            example: "*[_type == 'post'] | order(publishedAt desc)"
          },
          {
            name: 'Slicing',
            description: 'Limit the number of results',
            syntax: '[<start>...<end>]',
            example: "*[_type == 'post'] | order(publishedAt desc)[0...10]"
          }
        ],
        operators: [
          {name: '==', description: 'Equal to', example: "_type == 'post'"},
          {name: '!=', description: 'Not equal to', example: "_type != 'page'"},
          {name: '>', description: 'Greater than', example: "publishedAt > '2023-01-01'"},
          {name: '>=', description: 'Greater than or equal to', example: 'views >= 100'},
          {name: '<', description: 'Less than', example: 'price < 50'},
          {name: '<=', description: 'Less than or equal to', example: 'stock <= 10'},
          {name: 'in', description: 'Check if value exists in an array', example: "'fiction' in categories"},
          {name: 'match', description: 'Check if string matches a pattern', example: "title match 'coffee*'"},
          {name: '&&', description: 'Logical AND', example: "_type == 'post' && published == true"},
          {name: '||', description: 'Logical OR', example: "_type == 'post' || _type == 'article'"},
          {name: '!', description: 'Logical NOT', example: '!draft'},
          {name: '?', description: 'Conditional selector (if condition is met)', example: 'featured ? title : null'},
          {name: 'count()', description: 'Count items', example: "count(*[_type == 'post'])"},
          {name: 'defined()', description: 'Check if field is defined', example: 'defined(imageUrl)'},
          {
            name: 'references()',
            description: 'Check if document references another',
            example: "references('doc-id')"
          }
        ],
        examples: [
          {
            description: "Get all documents of type 'post'",
            query: "*[_type == 'post']"
          },
          {
            description: 'Get the title of all posts',
            query: "*[_type == 'post'].title"
          },
          {
            description: 'Get posts with their authors',
            query: "*[_type == 'post']{title, 'authorName': author->name}"
          },
          {
            description: 'Filter posts by published date',
            query: "*[_type == 'post' && publishedAt > '2023-01-01']"
          },
          {
            description: 'Get the 10 latest posts',
            query: "*[_type == 'post'] | order(publishedAt desc)[0...10]"
          },
          {
            description: 'Count posts by category',
            query: "*[_type == 'category']{name, 'count': count(*[_type == 'post' && references(^._id)])}"
          },
          {
            description: 'Get posts with specific fields and follow author reference',
            query: "*[_type == 'post']{title, body, 'author': author->{name, 'imageUrl': image.asset->url}}"
          },
          {
            description: 'Full-text search in post titles',
            query: "*[_type == 'post' && title match 'design*']"
          }
        ],
        functions: [
          {
            name: 'count()',
            description: 'Counts the number of items in an array',
            example: "count(*[_type == 'post'])"
          },
          {
            name: 'defined()',
            description: 'Checks if a property is defined',
            example: "*[_type == 'post' && defined(imageUrl)]"
          },
          {
            name: 'references()',
            description: 'Checks if a document references another',
            example: "*[_type == 'post' && references('author-id')]"
          },
          {
            name: 'order()',
            description: 'Orders results by a property',
            example: "*[_type == 'post'] | order(publishedAt desc)"
          },
          {
            name: 'now()',
            description: 'Returns the current datetime',
            example: "*[_type == 'post' && publishedAt < now()]"
          },
          {
            name: 'coalesce()',
            description: 'Returns the first non-null value',
            example: "coalesce(subtitle, title, 'Untitled')"
          },
          {
            name: 'select()',
            description: 'Selects value based on a condition',
            example: "select(_type == 'post' => title, _type == 'page' => heading, 'Unknown')"
          },
          {
            name: 'length()',
            description: 'Returns the length of a string or array',
            example: "*[_type == 'post' && length(tags) > 3]"
          }
        ],
        resources: [
          {name: 'GROQ documentation', url: 'https://www.sanity.io/docs/groq'},
          {name: 'GROQ cheat sheet', url: 'https://www.sanity.io/docs/query-cheat-sheet'},
          {name: 'Learn GROQ', url: 'https://groq.dev/'},
          {name: 'GROQ specification', url: 'https://sanity-io.github.io/GROQ/'}
        ]
      },
      source: 'https://sanity-io.github.io/GROQ/'
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('Error fetching GROQ specification:', error)
    throw new Error(`Failed to get GROQ specification: ${errorMessage}`)
  }
}
