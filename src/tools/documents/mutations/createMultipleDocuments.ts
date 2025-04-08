import {randomUUID} from 'node:crypto'
import {sanityClient} from '../../../config/sanity.js'
import type {CreateMultipleDocumentsParams} from './schemas.js'

/**
 * Tool for creating multiple documents in the Sanity dataset
 */
export async function createMultipleDocumentsTool(args: CreateMultipleDocumentsParams) {
  try {
    const {documents, options, publish} = args

    // Create a transaction for all documents
    const transaction = sanityClient.transaction()

    // Add each document creation to the transaction with appropriate IDs
    for (const doc of documents) {
      const documentId = randomUUID()
      const documentWithId = {
        ...doc,
        _id: publish ? documentId : `drafts.${documentId}`,
      }
      transaction.create(documentWithId)
    }

    // Commit the transaction with autoGenerateArrayKeys enabled and any additional options
    const result = await transaction.commit({
      autoGenerateArrayKeys: true,
      ...options,
    })

    const text = JSON.stringify(
      {
        operation: 'create_multiple',
        documentsCount: documents.length,
        options: {autoGenerateArrayKeys: true, ...options},
        result,
      },
      null,
      2,
    )

    return {
      content: [
        {
          type: 'text' as const,
          text: text,
        },
      ],
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Error creating multiple documents: ${errorMessage}`,
        },
      ],
    }
  }
}
