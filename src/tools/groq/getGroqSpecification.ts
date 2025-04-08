import type {RequestHandlerExtra} from '@modelcontextprotocol/sdk/shared/protocol.js'

import {GroqSpecification, GroqSpecificationSchema} from './schemas.js'

/**
 * Fetches and validates the GROQ specification
 */
export async function getGroqSpecification(): Promise<{
  specification: GroqSpecification
  source: string
}> {
  // Fetch the GROQ specification from the Sanity documentation
  const response = await fetch('https://sanity-io.github.io/GROQ/')

  if (!response.ok) {
    throw new Error(`Failed to fetch GROQ specification, status: ${response.status}`)
  }

  const specification: GroqSpecification = {
    name: 'GROQ',
    version: '1.0',
    description:
      'GROQ (Graph-Relational Object Queries) is a query language for JSON-like data ' +
      'structures that enables you to filter and join data from multiple collections ' +
      'without explicit joins.',
    coreFeatures: [
      'Filtering with predicates and operators',
      'Projections to shape the returned data',
      'Joins across documents without explicit join syntax',
      'Aggregation and grouping',
      'Ordering and slicing results',
    ],
    queryStructure: [
      {
        name: 'Dataset selector',
        description: 'Select the dataset to query, defaults to the current dataset',
        syntax: '*',
        example: "*[_type == 'post']",
      },
      {
        name: 'Filter',
        description: 'Filter documents using conditions inside square brackets',
        syntax: '[<condition>]',
        example: "*[_type == 'post' && publishedAt > '2023-01-01']",
      },
      {
        name: 'Projection',
        description: 'Shape the returned data using a projection object',
        syntax: '{<field>, <field2>}',
        example: "*[_type == 'post']{title, body, author}",
      },
      {
        name: 'References',
        description: 'Follow references to other documents',
        syntax: '<reference>->',
        example: "*[_type == 'post']{title, 'authorName': author->name}",
      },
      {
        name: 'Ordering',
        description: 'Order results',
        syntax: 'order(<field> [asc|desc])',
        example: "*[_type == 'post'] | order(publishedAt desc)",
      },
      {
        name: 'Slicing',
        description: 'Limit the number of results',
        syntax: '[<start>...<end>]',
        example: "*[_type == 'post'] | order(publishedAt desc)[0...10]",
      },
    ],
    operators: [
      {name: '==', description: 'Equal to', example: "_type == 'post'"},
      {name: '!=', description: 'Not equal to', example: "_type != 'page'"},
      {name: '>', description: 'Greater than', example: "publishedAt > '2023-01-01'"},
      {name: '>=', description: 'Greater than or equal to', example: 'views >= 100'},
      {name: '<', description: 'Less than', example: 'price < 50'},
      {name: '<=', description: 'Less than or equal to', example: 'stock <= 10'},
      {
        name: 'in',
        description: 'Check if value exists in an array',
        example: "'fiction' in categories",
      },
      {
        name: 'match',
        description: 'Check if string matches a pattern',
        example: "title match 'coffee*'",
      },
      {name: '&&', description: 'Logical AND', example: "_type == 'post' && published == true"},
      {name: '||', description: 'Logical OR', example: "_type == 'post' || _type == 'article'"},
      {name: '!', description: 'Logical NOT', example: '!draft'},
      {
        name: '?',
        description: 'Conditional selector (if condition is met)',
        example: 'featured ? title : null',
      },
    ],
    examples: [
      {
        description: "Get all documents of type 'post'",
        query: "*[_type == 'post']",
      },
      {
        description: 'Get the title of all posts',
        query: "*[_type == 'post'].title",
      },
      {
        description: 'Get posts with their authors',
        query: "*[_type == 'post']{title, 'authorName': author->name}",
      },
      {
        description: 'Get the 10 latest posts',
        query: "*[_type == 'post'] | order(publishedAt desc)[0...10]",
      },
    ],
    functions: [
      {
        name: 'count()',
        description: 'Counts the number of items in an array',
        example: "count(*[_type == 'post'])",
      },
      {
        name: 'defined()',
        description: 'Checks if a property is defined',
        example: "*[_type == 'post' && defined(imageUrl)]",
      },
      {
        name: 'references()',
        description: 'Checks if a document references another',
        example: "*[_type == 'post' && references('author-id')]",
      },
      {
        name: 'order()',
        description: 'Orders results by a property',
        example: "*[_type == 'post'] | order(publishedAt desc)",
      },
    ],
    resources: [
      {name: 'GROQ documentation', url: 'https://www.sanity.io/docs/groq'},
      {name: 'GROQ cheat sheet', url: 'https://www.sanity.io/docs/query-cheat-sheet'},
      {name: 'Learn GROQ', url: 'https://groq.dev/'},
      {name: 'GROQ specification', url: 'https://sanity-io.github.io/GROQ/'},
    ],
  }

  // Validate the specification against our schema
  return {
    specification: GroqSpecificationSchema.parse(specification),
    source: 'https://sanity-io.github.io/GROQ/',
  }
}

/**
 * Tool implementation for getting the GROQ specification
 */
export async function getGroqSpecificationTool(args: {}, extra: RequestHandlerExtra) {
  try {
    const {specification, source} = await getGroqSpecification()

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(specification, null, 2),
        },
      ],
      specification,
      source,
    }
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Error fetching GROQ specification: ${error}`,
        },
      ],
    }
  }
}
