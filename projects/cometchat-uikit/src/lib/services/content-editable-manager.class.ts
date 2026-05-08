/**
 * ContentEditableManager Class
 *
 * Manages the contenteditable element and DOM operations for the rich text editor.
 * Handles initialization, content operations, and HTML sanitization.
 *
 * @module services/content-editable-manager
 * @see Requirements 6.3, 6.4, 6.5, 8.1, 8.2, 8.3, 8.4, 8.5, 9.4
 */

/**
 * Configuration options for ContentEditableManager initialization
 */
export interface ContentEditableConfig {
  /** Placeholder text to display when editor is empty */
  placeholder?: string;
  /** Whether the editor should be editable */
  editable?: boolean;
}

/**
 * ContentEditableManager manages a contenteditable element and provides
 * methods for content manipulation, HTML sanitization, and DOM operations.
 *
 * This class is responsible for:
 * - Initializing the contenteditable element with proper attributes
 * - Getting and setting HTML/text content
 * - Sanitizing HTML to prevent XSS attacks
 * - Parsing and serializing HTML
 * - Checking if the editor is empty
 *
 * @example
 * ```typescript
 * const element = document.createElement('div');
 * const manager = new ContentEditableManager(element);
 * manager.initialize({ placeholder: 'Type here...', editable: true });
 * manager.setHTML('<p>Hello world</p>');
 * const html = manager.getHTML();
 * ```
 */
export class ContentEditableManager {
  private element: HTMLElement;

  /**
   * Whitelist of allowed HTML tags for sanitization
   * @private
   */
  private readonly ALLOWED_TAGS = [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'strike',
    'code',
    'pre',
    'blockquote',
    'ol',
    'ul',
    'li',
    'a',
    'span',
    'div',
  ];

  /**
   * Whitelist of allowed HTML attributes for sanitization
   * @private
   */
  private readonly ALLOWED_ATTRIBUTES = [
    'href',
    'target',
    'rel',
    'class',
    'contenteditable',
    'data-mention-id',
    'data-mention-label',
    'data-mention-self',
    'data-uid',
    'data-mention-type',
    'data-self',
  ];

  /**
   * Create a new ContentEditableManager instance
   * @param element - The contenteditable element to manage
   */
  constructor(element: HTMLElement) {
    this.element = element;
  }

  // ==================== Setup ====================

  /**
   * Initialize the contenteditable element with configuration
   * Sets up ARIA attributes, editable state, and placeholder
   *
   * @param config - Configuration options
   * @see Requirements 6.3, 6.4
   */
  initialize(config: ContentEditableConfig): void {
    // Set contenteditable attribute
    const editable = config.editable !== false;
    this.element.contentEditable = editable ? 'true' : 'false';

    // Set ARIA attributes for accessibility
    this.element.setAttribute('role', 'textbox');
    this.element.setAttribute('aria-multiline', 'true');

    // Set placeholder if provided
    if (config.placeholder) {
      this.element.setAttribute('aria-placeholder', config.placeholder);
    }
  }

  // ==================== Content Operations ====================

  /**
   * Get the HTML content from the editor
   * Returns the raw innerHTML of the contenteditable element
   *
   * @returns HTML string
   * @see Requirements 9.1
   */
  getHTML(): string {
    return this.element.innerHTML;
  }

  /**
   * Get the plain text content from the editor
   * Converts block-level elements and <br> tags to newlines
   * to preserve multiline text structure
   *
   * @returns Plain text string with newlines preserved
   * @see Requirements 9.2
   */
  getText(): string {
    return this.extractTextWithNewlines(this.element);
  }

  /**
   * Recursively extract text from a node, converting block elements
   * and <br> tags to newline characters, and inline formatting to markdown.
   *
   * @param node - The DOM node to extract text from
   * @returns Plain text with newlines and markdown formatting
   * @private
   */
  private extractTextWithNewlines(node: Node): string {
    let result = '';

    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        result += child.textContent || '';
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        const tagName = el.tagName.toLowerCase();

        if (tagName === 'br') {
          result += '\n';
        } else if (['p', 'div', 'blockquote', 'pre', 'li'].includes(tagName)) {
          const content = this.extractTextWithNewlines(el);
          if (content) {
            // Add newline before block element if there's already content
            if (result.length > 0 && !result.endsWith('\n')) {
              result += '\n';
            }
            result += content;
          }
        } else if (tagName === 'strong' || tagName === 'b') {
          const content = this.extractTextWithNewlines(el);
          result += `**${content}**`;
        } else if (tagName === 'em' || tagName === 'i') {
          const content = this.extractTextWithNewlines(el);
          result += `*${content}*`;
        } else if (tagName === 'u') {
          const content = this.extractTextWithNewlines(el);
          result += `__${content}__`;
        } else if (tagName === 's' || tagName === 'del' || tagName === 'strike') {
          const content = this.extractTextWithNewlines(el);
          result += `~~${content}~~`;
        } else if (tagName === 'code') {
          const content = this.extractTextWithNewlines(el);
          result += `\`${content}\``;
        } else {
          result += this.extractTextWithNewlines(el);
        }
      }
    }

    return result;
  }

  /**
   * Set the HTML content of the editor
   * Sanitizes the HTML before setting to prevent XSS attacks
   *
   * @param html - HTML string to set
   * @see Requirements 9.1, 9.4
   */
  setHTML(html: string): void {
    const sanitized = this.sanitizeHTML(html);
    this.element.innerHTML = sanitized;
  }

  /**
   * Clear all content from the editor
   * Removes all HTML and text content
   *
   * @see Requirements 6.5
   */
  clear(): void {
    this.element.innerHTML = '';
  }

  /**
   * Check if the editor is empty
   * Returns true if there is no text content (ignoring whitespace)
   *
   * @returns True if editor is empty
   * @see Requirements 6.3
   */
  isEmpty(): boolean {
    const text = this.getText().trim();
    return text.length === 0;
  }

  // ==================== HTML Sanitization ====================

  /**
   * Sanitize HTML to prevent XSS attacks
   * Removes script tags, event handlers, and dangerous attributes
   * Only allows whitelisted tags and attributes
   *
   * @param html - HTML string to sanitize
   * @returns Sanitized HTML string
   * @see Requirements 9.4
   */
  sanitizeHTML(html: string): string {
    // Use DOMParser instead of innerHTML to prevent script execution during parsing.
    // Setting innerHTML on a live DOM element executes event handlers (e.g. <img onerror=...>)
    // immediately during parsing. DOMParser parses inertly without executing scripts.
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html');
    const temp = doc.body;

    // Recursively sanitize all nodes
    this.sanitizeNode(temp);

    return temp.innerHTML;
  }

  /**
   * Recursively sanitize a DOM node and its children
   * Removes disallowed tags and attributes
   *
   * @param node - Node to sanitize
   * @private
   */
  private sanitizeNode(node: Node): void {
    // Process child nodes first (in reverse to handle removals)
    const children = Array.from(node.childNodes);
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];

      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as Element;
        const tagName = element.tagName.toLowerCase();

        // Check if tag is allowed
        if (!this.ALLOWED_TAGS.includes(tagName)) {
          // For dangerous tags like script, style, remove completely with content
          if (tagName === 'script' || tagName === 'style' || tagName === 'iframe') {
            node.removeChild(element);
          } else {
            // For other disallowed tags, remove tag but keep content
            while (element.firstChild) {
              node.insertBefore(element.firstChild, element);
            }
            node.removeChild(element);
          }
          continue;
        }

        // Sanitize attributes
        this.sanitizeAttributes(element);

        // Recursively sanitize children
        this.sanitizeNode(element);
      } else if (child.nodeType === Node.TEXT_NODE) {
        // Text nodes are safe, keep them
        continue;
      } else {
        // Remove other node types (comments, etc.)
        node.removeChild(child);
      }
    }
  }

  /**
   * Sanitize attributes of an element
   * Removes disallowed attributes and dangerous values
   *
   * @param element - Element to sanitize
   * @private
   */
  private sanitizeAttributes(element: Element): void {
    const attributes = Array.from(element.attributes);

    for (const attr of attributes) {
      const attrName = attr.name.toLowerCase();

      // Remove event handler attributes (onclick, onload, etc.)
      if (attrName.startsWith('on')) {
        element.removeAttribute(attr.name);
        continue;
      }

      // Remove disallowed attributes
      if (!this.ALLOWED_ATTRIBUTES.includes(attrName)) {
        element.removeAttribute(attr.name);
        continue;
      }

      // Sanitize href attributes to prevent javascript: URLs
      if (attrName === 'href') {
        const href = attr.value.trim().toLowerCase();
        if (
          href.startsWith('javascript:') ||
          href.startsWith('data:') ||
          href.startsWith('vbscript:')
        ) {
          element.removeAttribute(attr.name);
        }
      }
    }
  }

  // ==================== DOM Utilities ====================

  /**
   * Parse HTML string into a DocumentFragment
   * Useful for inserting HTML content into the editor
   *
   * @param html - HTML string to parse
   * @returns DocumentFragment containing parsed nodes
   * @see Requirements 8.1, 8.2, 8.3, 8.4, 8.5
   */
  parseHTML(html: string): DocumentFragment {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content;
  }

  /**
   * Serialize a DOM node to HTML string
   * Converts a node and its children to an HTML string
   *
   * @param node - Node to serialize
   * @returns HTML string
   * @see Requirements 8.1, 8.2, 8.3, 8.4, 8.5
   */
  serializeToHTML(node: Node): string {
    if (node.nodeType === Node.ELEMENT_NODE) {
      return (node as Element).outerHTML;
    } else if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    } else if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      const temp = document.createElement('div');
      temp.appendChild(node.cloneNode(true));
      return temp.innerHTML;
    }
    return '';
  }
}
