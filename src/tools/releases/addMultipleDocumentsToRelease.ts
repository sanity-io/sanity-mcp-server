import {addDocumentRequest} from './versions/createDocumentVersion.js'
import {CallToolResult} from '@modelcontextprotocol/sdk/types.js'
import {PublishMultiplesDocumentType} from './schemas.js'
import {sanityClient} from '../../config/sanity.js'
import {processDocumentForRelease} from './addDocumentToRelease.js'
import {actionRequest} from '../documents/actions/actionRequest.js'

export async function addMultipleDocumentsToRelease(
  args: PublishMultiplesDocumentType,
): Promise<CallToolResult> {
  try {
    let {publishDocuments} = args
    let actions = await Promise.all(
      publishDocuments.map((doc) => {
        return processDocumentForRelease(doc)
      }),
    )

    await actionRequest<addDocumentRequest[], unknown>(sanityClient, actions)
    return {
      content: [
        {
          type: 'text',
          text: 'Successfully added documents to release',
        },
      ],
    }
  } catch (error: unknown) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `error adding documents to release: ${error}`,
        },
      ],
    }
  }
}
