import {CallToolResult} from '@modelcontextprotocol/sdk/types.js'
import {sanityClient} from '../../config/sanity.js'
import {actionRequest, ActionTypes} from '../documents/actions/actionRequest.js'
import {parseReleaseId} from '../utils.js'
import {ReleaseMetadataType, ReleaseMetadataUpdateType} from './schemas.js'

interface ReleaseMetadataUpdateRequest extends ActionTypes {
  releaseId: string
  patch: {
    set: {
      metadata: ReleaseMetadataType
    }
  }
}

export async function updateReleaseInformation(
  args: ReleaseMetadataUpdateType,
): Promise<CallToolResult> {
  const {releaseId, metadata} = args

  const parsedId = parseReleaseId(releaseId)

  try {
    const doc = await sanityClient.getDocument(parsedId)
    if (!doc) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `no release with id ${releaseId}`,
          },
        ],
      }
    }

    const req: ReleaseMetadataUpdateRequest = {
      actionType: 'sanity.action.release.edit',
      releaseId: releaseId,
      patch: {
        set: {
          metadata: metadata,
        },
      },
    }

    await actionRequest<ReleaseMetadataUpdateRequest[], unknown>(sanityClient, [req])
    return {
      content: [
        {
          type: 'text',
          text: `Successfully updated the release fields`,
        },
      ],
    }
  } catch (error: unknown) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `error updating release metadata: ${error}`,
        },
      ],
    }
  }
}
