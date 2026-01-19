/**
 * Text renderer for parsing color tags and converting to HTML.
 * Mirrors curses color formatting from Python version.
 */

/**
 * Supported color types
 */
export type ColorType = 'red' | 'yellow' | 'green' | 'blue' | 'bold' | 'default'

/**
 * Represents a part of text with optional color formatting
 */
export interface TextPart {
  content: string
  color: ColorType
}

/**
 * Text renderer class for parsing color tags
 * Converts tags like {red}text{/red} to styled HTML
 */
export class TextRenderer {
  /**
   * Parse text with color tags into an array of TextParts
   * @param text - Text containing color tags like {red}text{/red}
   * @returns Array of text parts with color information
   */
  static parse(text: string): TextPart[] {
    const parts: TextPart[] = []
    const colorStack: ColorType[] = ['default']

    // Regex to match color tags: {color} or {/color}
    const tagRegex = /\{(\/?)(red|yellow|green|blue|bold)\}/g

    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = tagRegex.exec(text)) !== null) {
      const matchIndex = match.index
      const isClosing = match[1] === '/'
      const colorName = match[2] as ColorType

      // Add text before this tag
      if (matchIndex > lastIndex) {
        const content = text.substring(lastIndex, matchIndex)
        const currentColor = colorStack[colorStack.length - 1]
        if (content.length > 0) {
          parts.push({ content, color: currentColor })
        }
      }

      // Update color stack
      if (isClosing) {
        // Pop color from stack (but always keep 'default' at bottom)
        if (colorStack.length > 1) {
          colorStack.pop()
        }
      } else {
        // Push new color onto stack
        colorStack.push(colorName)
      }

      lastIndex = tagRegex.lastIndex
    }

    // Add remaining text after last tag
    if (lastIndex < text.length) {
      const content = text.substring(lastIndex)
      const currentColor = colorStack[colorStack.length - 1]
      if (content.length > 0) {
        parts.push({ content, color: currentColor })
      }
    }

    return parts
  }

  /**
   * Convert text with color tags to HTML string
   * @param text - Text containing color tags
   * @returns HTML string with span elements for colors
   */
  static toHtml(text: string): string {
    const parts = this.parse(text)

    return parts
      .map((part) => {
        if (part.color === 'default') {
          return this.escapeHtml(part.content)
        }
        return `<span class="text-${part.color}">${this.escapeHtml(part.content)}</span>`
      })
      .join('')
  }

  /**
   * Convert text with color tags to React-friendly structure
   * Returns array of objects that can be used with React.createElement
   * @param text - Text containing color tags
   * @returns Array of objects with type, props, and content
   */
  static toReact(text: string): Array<{
    type: 'span' | 'text'
    className?: string
    content: string
  }> {
    const parts = this.parse(text)

    return parts.map((part) => {
      if (part.color === 'default') {
        return {
          type: 'text' as const,
          content: part.content,
        }
      }
      return {
        type: 'span' as const,
        className: `text-${part.color}`,
        content: part.content,
      }
    })
  }

  /**
   * Escape HTML special characters
   * @param text - Text to escape
   * @returns Escaped text safe for HTML
   */
  private static escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * Strip all color tags from text, returning plain text
   * @param text - Text containing color tags
   * @returns Plain text without any tags
   */
  static stripTags(text: string): string {
    return text.replace(/\{\/?(?:red|yellow|green|blue|bold)\}/g, '')
  }

  /**
   * Get CSS class name for a color type
   * @param color - Color type
   * @returns CSS class name
   */
  static getColorClass(color: ColorType): string {
    if (color === 'default') return ''
    return `text-${color}`
  }
}

/**
 * Color tag helper functions
 */
export const ColorTags = {
  /**
   * Wrap text in red color tags
   */
  red: (text: string) => `{red}${text}{/red}`,

  /**
   * Wrap text in yellow color tags
   */
  yellow: (text: string) => `{yellow}${text}{/yellow}`,

  /**
   * Wrap text in green color tags
   */
  green: (text: string) => `{green}${text}{/green}`,

  /**
   * Wrap text in blue color tags
   */
  blue: (text: string) => `{blue}${text}{/blue}`,

  /**
   * Wrap text in bold tags
   */
  bold: (text: string) => `{bold}${text}{/bold}`,
}

/**
 * Format events cube result with appropriate color
 * @param eventsCubeName - Name of the events cube result (GREEN, BLUE, YELLOW, PIRATES)
 * @returns Formatted text with color tags
 */
export function formatEventsCube(eventsCubeName: string): string {
  switch (eventsCubeName) {
    case 'GREEN':
      return ColorTags.green(eventsCubeName)
    case 'BLUE':
      return ColorTags.blue(eventsCubeName)
    case 'YELLOW':
      return ColorTags.yellow(eventsCubeName)
    case 'PIRATES':
      return ColorTags.red(eventsCubeName)
    default:
      return eventsCubeName
  }
}
