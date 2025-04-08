import {sanityClient} from '../../config/sanity.js'

export async function getDatasetsTool() {
  try {
    const datasets = await sanityClient.datasets.list()
    if (datasets.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'No datasets found',
          },
        ],
      }
    }
    const outputText = datasets
      .map((dataset) => {
        const fields = [
          ['Dataset Name', dataset.name],
          ['Created At', dataset.createdAt],
          ['Created By User ID', dataset.createdByUserId],
          ['Dataset Profile', dataset.datasetProfile],
          ['Tags', dataset.tags?.length ? dataset.tags : null],
          ['Features', dataset.features?.length ? dataset.features : null],
          ['ACL Mode', dataset.aclMode],
          ['Addon For', dataset.addonFor],
        ]
        return `${fields
          .filter(([_, value]) => value)
          .map(([label, value]) => `  ${label}: ${value}`)
          .join('\n')}\n\n`
      })
      .join('')
    return {
      content: [
        {
          type: 'text' as const,
          text: `Current Sanity Datasets:\n\n${outputText}`,
        },
      ],
    }
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Error fetching datasets: ${error}`,
        },
      ],
    }
  }
}
