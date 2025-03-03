import { marked } from 'marked';
import { gfmHeadingId } from 'marked-gfm-heading-id';

// Use the heading ID extension
marked.use(gfmHeadingId());

/**
 * Converts Portable Text to Markdown
 * 
 * @param {Array} blocks - Array of Portable Text blocks
 * @returns {string} Markdown string
 */
export function portableTextToMarkdown(blocks) {
  if (!blocks || !Array.isArray(blocks)) {
    return '';
  }
  
  return blocks.map(block => {
    // Handle different block types
    if (block._type === 'block') {
      // Convert text spans with marks to markdown
      const text = block.children
        .map(span => {
          let result = span.text || '';
          
          // Apply marks (bold, italic, etc)
          if (span.marks && span.marks.length > 0) {
            span.marks.forEach(mark => {
              // Handle different mark types
              if (mark === 'strong') {
                result = `**${result}**`;
              } else if (mark === 'em') {
                result = `*${result}*`;
              } else if (mark === 'code') {
                result = `\`${result}\``;
              }
              // Additional marks could be handled here
            });
          }
          
          return result;
        })
        .join('');
      
      // Handle block styles (headings, lists, etc)
      if (block.style === 'h1') {
        return `# ${text}`;
      } else if (block.style === 'h2') {
        return `## ${text}`;
      } else if (block.style === 'h3') {
        return `### ${text}`;
      } else if (block.style === 'h4') {
        return `#### ${text}`;
      } else if (block.style === 'h5') {
        return `##### ${text}`;
      } else if (block.style === 'h6') {
        return `###### ${text}`;
      } else if (block.style === 'blockquote') {
        return `> ${text}`;
      } else if (block.listItem === 'bullet') {
        return `- ${text}`;
      } else if (block.listItem === 'number') {
        return `1. ${text}`;
      }
      
      // Default to normal paragraph
      return text;
    } else if (block._type === 'image') {
      // Handle image blocks
      const caption = block.caption || '';
      return `![${caption}](${block.asset._ref})`;
    }
    
    // Handle other block types or return empty string
    return '';
  }).join('\n\n');
}

/**
 * Converts Markdown to Portable Text
 * 
 * @param {string} markdown - Markdown string
 * @returns {Array} Array of Portable Text blocks
 */
export function markdownToPortableText(markdown) {
  if (!markdown) {
    return [];
  }
  
  // Parse markdown to AST
  const tokens = marked.lexer(markdown);
  
  // Convert tokens to Portable Text blocks
  return tokens.map(token => {
    switch (token.type) {
      case 'paragraph':
        return {
          _type: 'block',
          style: 'normal',
          _key: generateKey(),
          markDefs: [],
          children: [
            {
              _type: 'span',
              _key: generateKey(),
              text: token.text,
              marks: []
            }
          ]
        };
        
      case 'heading':
        return {
          _type: 'block',
          style: `h${token.depth}`,
          _key: generateKey(),
          markDefs: [],
          children: [
            {
              _type: 'span',
              _key: generateKey(),
              text: token.text,
              marks: []
            }
          ]
        };
        
      case 'list':
        return token.items.map(item => ({
          _type: 'block',
          style: 'normal',
          _key: generateKey(),
          listItem: token.ordered ? 'number' : 'bullet',
          level: 1,
          markDefs: [],
          children: [
            {
              _type: 'span',
              _key: generateKey(),
              text: item.text,
              marks: []
            }
          ]
        }));
        
      case 'blockquote':
        return {
          _type: 'block',
          style: 'blockquote',
          _key: generateKey(),
          markDefs: [],
          children: [
            {
              _type: 'span',
              _key: generateKey(),
              text: token.text,
              marks: []
            }
          ]
        };
        
      // Add other token types as needed
        
      default:
        return null;
    }
  })
  .flat()
  .filter(Boolean);
}

// Generate a random key for Portable Text objects
function generateKey() {
  return Math.random().toString(36).substring(2, 15);
}
