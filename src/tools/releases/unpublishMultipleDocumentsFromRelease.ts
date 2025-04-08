import {actionRequest, ActionTypes} from '../documents/actions/actionRequest.js'
import {UnpublishMultiplesDocumentType} from './schemas.js'
import {sanityClient} from '../../config/sanity.js'
import {processUnpublishRequest} from './unpublishDocumentFromRelease.js'
import {CallToolResult} from '@modelcontextprotocol/sdk/types.js'

export interface UnpublishRequestPayload {
  publishedId: string
  versionId: string // version id following the format <category | empty>.<releaseId>.<publishedId>
}

interface UnpublishRequest extends ActionTypes, UnpublishRequestPayload {}

// finds the document by id and creates a copy of the current state into the release
export async function unpublishMultipleDocumentsFromRelease(
  args: UnpublishMultiplesDocumentType,
): Promise<CallToolResult> {
  let {unpublishDocuments} = args
  try {
    let actions = await Promise.all(
      unpublishDocuments.map((doc) => {
        return processUnpublishRequest(doc)
      }),
    )

    await actionRequest<UnpublishRequest[], any>(sanityClient, actions)

    return {
      content: [
        {
          type: 'text',
          text: 'Successfully unpublished documents from release',
        },
      ],
    }
  } catch (error: unknown) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `error unpublishing documents from release: ${error}`,
        },
      ],
    }
  }
}
