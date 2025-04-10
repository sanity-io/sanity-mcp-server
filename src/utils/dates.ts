import {parse as chronoParse} from 'chrono-node'

/**
 * Helper function to parse date strings in various formats
 * @param dateString - ISO date string or natural language date description
 * @returns Parsed date as ISO string or null if parsing failed
 */
export function parseDateString(dateString: string | undefined): string | null {
  if (!dateString) return null

  // First try to parse as ISO date
  const isoDate = new Date(dateString)

  // Check if the date is valid by ensuring it's not NaN
  // and that the ISO string conversion works properly
  if (!Number.isNaN(isoDate.getTime())) {
    return isoDate.toISOString()
  }

  // Try to parse as natural language using chrono
  const chronoResults = chronoParse(dateString, new Date())
  if (chronoResults.length > 0) {
    return chronoResults[0].start.date().toISOString()
  }

  return null
}
