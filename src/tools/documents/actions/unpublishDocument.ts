import {CallToolResult} from '@modelcontextprotocol/sdk/types.js'
import {UnpublishAction} from '@sanity/client'
import {PublishDocumentParamsType} from './schema.js'
import {sanityClient} from '../../../config/sanity.js'

export async function unpublishDocument(args: PublishDocumentParamsType): Promise<CallToolResult> {
  try {
    let {draftId, publishId} = args

    let unpublishAction: UnpublishAction = {
      actionType: 'sanity.action.document.unpublish',
      draftId: draftId,
      publishedId: publishId,
    }

    let res = await sanityClient.action(unpublishAction)

    return {
      content: [
        {
          type: 'text',
          text: `Sucessfully unpublished document with transaction id: ${res.transactionId}`,
        },
      ],
    }
  } catch (e: unknown) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `got error: ${e}`,
        },
      ],
    }
  }
}
