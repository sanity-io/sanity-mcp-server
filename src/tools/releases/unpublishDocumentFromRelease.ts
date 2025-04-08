import {actionRequest, ActionTypes} from '../documents/actions/actionRequest.js'
import {DocumentCategory, parseDocId} from '../utils.js'
import {UnpublishActionBodyType} from './schemas.js'
import {sanityClient} from '../../config/sanity.js'
import {CallToolResult} from '@modelcontextprotocol/sdk/types.js'

interface UnpublishRequest extends ActionTypes, UnpublishActionBodyType {}

export async function processUnpublishRequest(
  params: UnpublishActionBodyType,
): Promise<UnpublishRequest> {
  // retrieves the publish id from the version or drafts id
  let {versionId} = params

  let [category, publishedId] = parseDocId(versionId)
  if (category !== DocumentCategory.Versions) {
    throw Error('version id must contain version prefix')
  }

  return {
    actionType: 'sanity.action.document.version.unpublish',
    publishedId: publishedId,
    versionId: versionId,
  }
}

// finds the document by id and creates a copy of the current state into the release
export async function unpublishDocumentFromRelease(
  args: UnpublishActionBodyType,
): Promise<CallToolResult> {
  try {
    let unpublishReq = await processUnpublishRequest(args)

    await actionRequest<UnpublishRequest[], unknown>(sanityClient, [unpublishReq])

    return {
      content: [
        {
          type: 'text',
          text: 'Successfully unpublished document from release',
        },
      ],
    }
  } catch (error: unknown) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `error unpublishing document from release: ${error}`,
        },
      ],
    }
  }
}
