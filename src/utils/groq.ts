import {parse} from 'groq-js'

export async function validateGroqQuery(
  query: string,
): Promise<{isValid: boolean; error?: string; tree?: ReturnType<typeof parse>}> {
  try {
    const tree = parse(query)
    return {isValid: true, tree}
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
