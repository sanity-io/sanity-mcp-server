import {CallToolResult} from '@modelcontextprotocol/sdk/types.js'
import {sanityClient} from '../../../config/sanity.js'
import {GetDocumentParamsType} from './schema.js'

export async function getDocumentById(args: GetDocumentParamsType): Promise<CallToolResult> {
  try {
    let {documentId} = args

    let res = await sanityClient.getDocument(documentId)

    if (res === undefined) {
      return {
        content: [
          {
            type: 'text',
            text: `Document with id ${documentId} not found. This might happen if its a draft, which requires the "drafts." prefix. E.g. "drafts.${documentId}"`,
          },
        ],
      }
    }

    let text = JSON.stringify(res)

    return {
      content: [{type: 'text', text: text}],
    }
  } catch (e: unknown) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `error getting document with error: ${e}`,
        },
      ],
    }
  }
}
