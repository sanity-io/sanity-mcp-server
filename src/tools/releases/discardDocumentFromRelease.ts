import {CallToolResult} from '@modelcontextprotocol/sdk/types.js'
import {DiscardDocParamsType} from './schemas.js'
import {sanityClient} from '../../config/sanity.js'
import {addDocVersionId, parseId} from '../utils.js'
import {actionRequest, ActionTypes} from '../documents/actions/actionRequest.js'

interface DiscardRequest extends ActionTypes {
  versionId: string
  purge: boolean
}

export async function removeDocumentFromRelease(
  args: DiscardDocParamsType,
): Promise<CallToolResult> {
  const {releaseId, publishedId} = args

  const parsedReleasedId = parseId(releaseId)

  const parsedDocId = parseId(publishedId)

  const versionId = addDocVersionId(parsedDocId, parsedReleasedId)

  const doc = await sanityClient.getDocument(versionId)
  if (!doc) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `no document with published id ${publishedId} in release: ${releaseId}`,
        },
      ],
    }
  }

  try {
    await actionRequest<DiscardRequest[], unknown>(sanityClient, [
      {
        actionType: 'sanity.action.document.version.discard',
        versionId: versionId,
        purge: false, // keep purge to always false for now
      },
    ])

    return {
      content: [
        {
          type: 'text',
          text: `Successfully removed changed document ${versionId} from release`,
        },
      ],
    }
  } catch (error: unknown) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `error removing document from release: ${error}`,
        },
      ],
    }
  }
}
