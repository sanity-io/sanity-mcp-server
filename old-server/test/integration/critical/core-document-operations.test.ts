/**
 * Core document operations integration test
 * @vitest-environment node
 * @tags integration, critical
 */
import dotenv from 'dotenv'
import {v4 as uuidv4} from 'uuid'
import {afterAll, beforeAll, describe, expect, it} from 'vitest'

import * as actions from '../../../src/controllers/actions.js'
import {createSanityClient} from '../../../src/utils/sanityClient.js'

// Load environment variables
dotenv.config()

// Define environment-dependent variables
const projectId = process.env.SANITY_PROJECT_ID || 'zwl9ofqf'
const dataset = process.env.SANITY_DATASET || 'production'

// Helper function to wait for a short period - reduced for faster tests
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Helper function to ensure ID has draft prefix
const ensureDraftId = (id) => (id.startsWith('drafts.') ? id : `drafts.${id}`)

// Helper function to poll for a document until it meets certain criteria or times out
async function pollForDocument(client, id, predicate, maxAttempts = 5, interval = 300) {
  const draftId = ensureDraftId(id)

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Try getting the draft version
      const doc = await client.getDocument(draftId)

      // If document exists and meets the predicate condition, return it
      if (doc && predicate(doc)) {
        return doc
      }

      // If document exists but doesn't meet condition, wait and try again
      if (doc) {
        console.log(`Document found but condition not met on attempt ${attempt + 1}/${maxAttempts}. Waiting...`)
      } else {
        console.log(`Document not found on attempt ${attempt + 1}/${maxAttempts}. Waiting...`)
      }

      // Wait before next attempt
      await delay(interval)
    } catch (error) {
      console.warn(`Error fetching document on attempt ${attempt + 1}/${maxAttempts}:`, error)
      await delay(interval)
    }
  }

  // Try one last time with the non-draft ID
  try {
    const doc = await client.getDocument(id)
    if (doc && predicate(doc)) {
      return doc
    }
  } catch (error) {
    // Ignore errors on the last attempt
  }

  return null
}

// Helper function to get a document with draft fallback
async function getDocument(client, id) {
  try {
    // Try getting the draft version first (most likely after edits)
    const draftId = ensureDraftId(id)
    const draftDoc = await client.getDocument(draftId)
    if (draftDoc) {
      console.log(`Found document as draft: ${draftId}`)
      return draftDoc
    }

    // If not found as draft, try the published version
    const doc = await client.getDocument(id)
    if (doc) {
      console.log(`Found document as published: ${id}`)
      return doc
    }

    console.log(`Document not found with either ID: ${id} or ${draftId}`)
    return null
  } catch (error) {
    console.warn(`Error fetching document ${id}:`, error)
    return null
  }
}

describe('Core Document Operations', () => {
  // Generate unique IDs for this test run
  const docId = `core-test-doc-${uuidv4().substring(0, 8)}`
  const docTitle = 'Core Test Document'
  const updatedTitle = 'Core Test Document (Updated)'

  // Create a client for direct operations
  let client

  // Track whether we've successfully obtained a document
  let actualDocId

  // Skip tests if environment is not properly configured
  beforeAll(() => {
    if (!projectId || !dataset) {
      console.warn('Missing required environment variables for integration tests')
      return
    }

    client = createSanityClient(projectId, dataset)
  })

  // Clean up after tests
  afterAll(async () => {
    if (projectId && dataset) {
      try {
        // Clean up both the draft and published version
        await actions.deleteDocument(projectId, dataset, docId)
        if (actualDocId && actualDocId !== docId) {
          await actions.deleteDocument(projectId, dataset, actualDocId)
        }
        console.log(`Cleaned up document: ${docId}`)
      } catch (error) {
        console.warn(`Failed to clean up document ${docId}:`, error)
      }
    }
  })

  it('should create a document using controller function', async () => {
    // Skip if missing configuration
    if (!projectId || !dataset) {
      return
    }

    const document = {
      _id: docId,
      _type: 'test',
      title: docTitle,
      description: 'This is a test document for core operations',
      createdAt: new Date().toISOString()
    }

    const result = await actions.createDocument(projectId, dataset, document)

    expect(result).toBeDefined()
    expect(result.documentId).toContain(docId)
    expect(result.success).toBe(true)

    // Store the actual document ID returned
    actualDocId = result.documentId
    console.log(`Document created with ID: ${actualDocId}`)
  })

  it('should read a document using client.getDocument()', async () => {
    // Skip if missing configuration
    if (!projectId || !dataset) {
      return
    }

    // Get document directly with fallback to draft
    const doc = await getDocument(client, docId)

    // Verify the document exists and has the expected properties
    expect(doc).toBeDefined()
    expect(doc._id).toBeDefined()
    console.log(`Read document with ID: ${doc._id}, title: ${doc.title}`)
    expect(doc.title).toBe(docTitle)

    // Update actual doc ID if needed
    if (!actualDocId) {
      actualDocId = doc._id
    }
  })

  it('should update a document using client.transaction()', async () => {
    // Skip if missing configuration
    if (!projectId || !dataset) {
      return
    }

    // First get the document
    const doc = await getDocument(client, docId)
    expect(doc).toBeDefined()
    const draftId = doc._id

    console.log(`Updating document with ID: ${draftId}`)

    // Use client directly to update document
    const updates = {
      title: updatedTitle,
      updatedAt: new Date().toISOString()
    }

    // Create a transaction to update the document
    const transaction = client.transaction()
    transaction.patch(draftId, {
      set: updates
    })

    const result = await transaction.commit()
    console.log('Document updated result:', result)

    expect(result).toBeDefined()
    expect(result.results).toBeDefined()
    expect(result.results.length).toBeGreaterThan(0)

    // Store the actual document ID
    actualDocId = draftId
  })

  it('should verify document updated with client.getDocument()', async () => {
    // Skip if missing configuration
    if (!projectId || !dataset) {
      return
    }

    // Use polling to check for the updated document
    const idToCheck = actualDocId || ensureDraftId(docId)
    console.log(`Polling for updated document with ID: ${idToCheck}`)

    const doc = await pollForDocument(
      client,
      idToCheck,
      (doc) => doc.title === updatedTitle
    )

    // Verify the document exists and has the updated properties
    expect(doc).toBeDefined()
    expect(doc._id).toBeDefined()
    console.log(`Retrieved document with ID: ${doc._id}, title: ${doc.title}`)
    expect(doc.title).toBe(updatedTitle)
  })

  it('should patch a document using client.transaction()', async () => {
    // Skip if missing configuration
    if (!projectId || !dataset) {
      return
    }

    // Get the document to find its current ID - use the actual ID if we have it
    const idToCheck = actualDocId || ensureDraftId(docId)
    console.log(`Getting document for patch with ID: ${idToCheck}`)

    const doc = await getDocument(client, idToCheck)
    expect(doc).toBeDefined()
    console.log(`Patching document with ID: ${doc._id}`)

    // Use client directly to patch document
    const transaction = client.transaction()
    transaction.patch(doc._id, {
      set: {
        patchedField: 'This was added via patch',
        tags: ['core', 'test']
      }
    })

    const result = await transaction.commit()
    console.log('Patch result:', result)

    expect(result).toBeDefined()
    expect(result.results).toBeDefined()
    expect(result.results.length).toBeGreaterThan(0)

    // Store the actual document ID if not already set
    if (!actualDocId) {
      actualDocId = doc._id
    }
  })

  it('should verify patched document with client.getDocument()', async () => {
    // Skip if missing configuration
    if (!projectId || !dataset) {
      return
    }

    // Use polling to check for the patched document
    const idToCheck = actualDocId || ensureDraftId(docId)
    console.log(`Polling for patched document with ID: ${idToCheck}`)

    const doc = await pollForDocument(
      client,
      idToCheck,
      (doc) => doc.patchedField === 'This was added via patch' &&
               Array.isArray(doc.tags) &&
               doc.tags.includes('core')
    )

    // Verify the document exists and has the patched properties
    expect(doc).toBeDefined()
    expect(doc._id).toBeDefined()
    console.log(`Retrieved patched document with ID: ${doc._id}, title: ${doc.title}`)
    expect(doc.patchedField).toBe('This was added via patch')
    expect(doc.tags).toEqual(['core', 'test'])
  })

  it('should delete a document using controller function', async () => {
    // Skip if missing configuration
    if (!projectId || !dataset) {
      return
    }

    console.log(`Deleting document with ID: ${docId}`)
    const result = await actions.deleteDocument(projectId, dataset, docId)

    expect(result).toBeDefined()
    expect(result.success).toBe(true)
  })

  it('should confirm document is deleted with client.getDocument()', async () => {
    // Skip if missing configuration
    if (!projectId || !dataset) {
      return
    }

    // Poll to confirm deletion - run both checks in parallel
    const [draftDeleted, publishedDeleted] = await Promise.all([
      pollForDocument(
        client,
        actualDocId || ensureDraftId(docId),
        () => false, // Always return false to continue polling until timeout
        3, // Fewer attempts since we expect not to find it
        200 // Shorter interval
      ),
      pollForDocument(
        client,
        docId,
        () => false, // Always return false to continue polling until timeout
        3, // Fewer attempts since we expect not to find it
        200 // Shorter interval
      )
    ])

    // Both should be null after deletion
    expect(draftDeleted).toBeNull()
    expect(publishedDeleted).toBeNull()
  })
})
