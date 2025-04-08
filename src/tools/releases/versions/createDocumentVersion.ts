import {SanityClient} from '@sanity/client'
import {actionRequest, ActionTypes} from '../../documents/actions/actionRequest.js'

export interface addDocumentRequest extends ActionTypes {
  publishedId: string
  document: Document
}

export interface DocumentIdentifiers {
  _id: string
  _type: string
}

export interface Document extends DocumentIdentifiers {
  [key: string]: unknown
}

export async function createDocumentVersion(client: SanityClient, req: addDocumentRequest) {
  try {
    const res = await actionRequest<addDocumentRequest[], unknown>(client, [req])
    return res
  } catch (error: unknown) {
    throw error
  }
}
