import {marked} from 'marked'
import {gfmHeadingId} from 'marked-gfm-heading-id'

// Use the heading ID extension
marked.use(gfmHeadingId())

interface PortableTextSpan {
  _key?: string;
  _type?: string;
  text?: string;
  marks?: string[];
}

interface PortableTextBlock {
  _key?: string;
  _type: string;
  style?: string;
  listItem?: 'bullet' | 'number';
  children?: PortableTextSpan[];
  markDefs?: any[];
  level?: number;
  caption?: string;
  asset?: {
    _ref: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Converts Portable Text to Markdown
 *
 * @param blocks - Array of Portable Text blocks
 * @returns Markdown string
 */
export function portableTextToMarkdown(blocks: PortableTextBlock[]): string {
  if (!blocks || !Array.isArray(blocks)) {
    return ''
  }

  return blocks.map((block) => {
    // Handle different block types
    if (block._type === 'block') {
      // Convert text spans with marks to markdown
      const text = block.children
        ?.map((span) => {
          let result = span.text || ''

          // Apply marks (bold, italic, etc)
          if (span.marks && span.marks.length > 0) {
            span.marks.forEach((mark) => {
              // Handle different mark types
              if (mark === 'strong') {
                result = `**${result}**`
              } else if (mark === 'em') {
                result = `*${result}*`
              } else if (mark === 'code') {
                result = `\`${result}\``
              }
              // Additional marks could be handled here
            })
          }

          return result
        })
        .join('') || ''

      // Handle block styles (headings, lists, etc)
      if (block.style === 'h1') {
        return `# ${text}`
      } else if (block.style === 'h2') {
        return `## ${text}`
      } else if (block.style === 'h3') {
        return `### ${text}`
      } else if (block.style === 'h4') {
        return `#### ${text}`
      } else if (block.style === 'h5') {
        return `##### ${text}`
      } else if (block.style === 'h6') {
        return `###### ${text}`
      } else if (block.style === 'blockquote') {
        return `> ${text}`
      } else if (block.listItem === 'bullet') {
        return `- ${text}`
      } else if (block.listItem === 'number') {
        return `1. ${text}`
      }

      // Default to normal paragraph
      return text
    } else if (block._type === 'image' && block.asset) {
      // Handle image blocks
      const caption = block.caption || ''
      return `![${caption}](${block.asset._ref})`
    }

    // Handle other block types or return empty string
    return ''
  }).join('\n\n')
}

/**
 * Converts Markdown to Portable Text
 *
 * @param markdown - Markdown string to convert
 * @returns Array of Portable Text blocks
 */
export function markdownToPortableText(markdown: string): PortableTextBlock[] {
  if (!markdown) {
    return []
  }

  // Parse markdown to tokens
  const tokens = marked.lexer(markdown)
  const blocks: PortableTextBlock[] = []

  tokens.forEach((token) => {
    // Handle different token types
    if (token.type === 'paragraph') {
      blocks.push({
        _key: generateKey(),
        _type: 'block',
        style: 'normal',
        children: [
          {
            _key: generateKey(),
            _type: 'span',
            text: token.text,
            marks: []
          }
        ],
        markDefs: []
      })
    } else if (token.type === 'heading') {
      blocks.push({
        _key: generateKey(),
        _type: 'block',
        style: `h${token.depth}`,
        children: [
          {
            _key: generateKey(),
            _type: 'span',
            text: token.text,
            marks: []
          }
        ],
        markDefs: []
      })
    } else if (token.type === 'blockquote') {
      blocks.push({
        _key: generateKey(),
        _type: 'block',
        style: 'blockquote',
        children: [
          {
            _key: generateKey(),
            _type: 'span',
            text: token.text,
            marks: []
          }
        ],
        markDefs: []
      })
    } else if (token.type === 'list') {
      token.items.forEach((item: any) => {
        blocks.push({
          _key: generateKey(),
          _type: 'block',
          style: 'normal',
          listItem: token.ordered ? 'number' : 'bullet',
          level: 1,
          children: [
            {
              _key: generateKey(),
              _type: 'span',
              text: item.text,
              marks: []
            }
          ],
          markDefs: []
        })
      })
    } else if (token.type === 'code') {
      blocks.push({
        _key: generateKey(),
        _type: 'block',
        style: 'normal',
        children: [
          {
            _key: generateKey(),
            _type: 'span',
            text: token.text,
            marks: ['code']
          }
        ],
        markDefs: []
      })
    } else if (token.type === 'image') {
      blocks.push({
        _key: generateKey(),
        _type: 'image',
        caption: token.text,
        asset: {
          _ref: token.href
        }
      })
    }
    // Additional token types can be handled here
  })

  return blocks
}

/**
 * Generate a random key for Portable Text objects
 */
function generateKey(): string {
  return Math.random().toString(36).substring(2, 15)
}
