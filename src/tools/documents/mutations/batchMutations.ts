import type {RequestHandlerExtra} from '@modelcontextprotocol/sdk/shared/protocol.js'
import {sanityClient} from '../../../config/sanity.js'
import {BatchMutationsParams} from './schemas.js'

/**
 * Tool for performing multiple mutations in a single transaction
 */
export async function batchMutationsTool(args: BatchMutationsParams, extra: RequestHandlerExtra) {
  try {
    let transaction = sanityClient.transaction()

    for (const mutation of args.mutations) {
      if (mutation.create) {
        transaction = transaction.create(mutation.create)
      } else if (mutation.createOrReplace) {
        transaction = transaction.createOrReplace(mutation.createOrReplace)
      } else if (mutation.createIfNotExists) {
        transaction = transaction.createIfNotExists(mutation.createIfNotExists)
      } else if (mutation.delete) {
        transaction = transaction.delete(mutation.delete.id)
      } else if (mutation.patch) {
        let patch = sanityClient.patch(mutation.patch.id)

        if (mutation.patch.set) patch = patch.set(mutation.patch.set)
        if (mutation.patch.setIfMissing) patch = patch.setIfMissing(mutation.patch.setIfMissing)
        if (mutation.patch.unset) patch = patch.unset(mutation.patch.unset)
        if (mutation.patch.inc) patch = patch.inc(mutation.patch.inc)
        if (mutation.patch.dec) patch = patch.dec(mutation.patch.dec)
        if (mutation.patch.ifRevisionId) patch = patch.ifRevisionId(mutation.patch.ifRevisionId)

        transaction = transaction.patch(patch)
      }
    }

    const result = await transaction.commit(args.options)
    const text = JSON.stringify(
      {
        mutations: args.mutations,
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
  } catch (error: any) {
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Error executing batch mutations: ${error.message}`,
        },
      ],
    }
  }
}
