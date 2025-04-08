import {sanityClient} from '../../../config/sanity.js'
import {DeleteDocumentParams} from './schemas.js'

/**
 * Tool for deleting a document from the Sanity dataset using its ID
 */
export async function deleteDocumentTool(args: DeleteDocumentParams) {
  try {
    const {id} = args

    // Delete the document using the sanity client with just the ID
    const result = await sanityClient.delete(id)
    const text = JSON.stringify(
      {
        operation: 'delete',
        documentId: id,
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
  } catch (error) {
    console.error('Error deleting document:', error)
    throw error
  }
}
