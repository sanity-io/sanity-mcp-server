import {randomUUID} from 'crypto'
import {sanityClient} from '../../../config/sanity.js'
import {CreateDocumentParams} from './schemas.js'

/**
 * Tool for creating a new document in the Sanity dataset
 */
export async function createDocumentTool(args: CreateDocumentParams) {
  try {
    const {document, publish} = args

    // Generate a random UUID for the document
    const documentId = randomUUID()

    // Create the document with the correct ID (including prefix )
    const documentWithId = {
      ...document,
      _id: publish ? documentId : `drafts.${documentId}`,
    }

    const result = await sanityClient.create(documentWithId, {autoGenerateArrayKeys: true})

    const text = JSON.stringify(
      {
        operation: 'create',
        document: result,
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
          text: `Error creating document: ${errorMessage}`,
        },
      ],
    }
  }
}
