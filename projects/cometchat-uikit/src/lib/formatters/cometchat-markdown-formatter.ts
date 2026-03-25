import { CometChatTextFormatter } from './cometchat-text-formatter';

/**
 * CometChatMarkdownFormatter
 *
 * Formats markdown syntax in text messages to HTML.
 * Supports bold, italic, underline, strikethrough, inline code, code blocks,
 * blockquotes, ordered lists, unordered lists, and links.
 *
 * Markdown Syntax Supported:
 * - **bold** → <strong>bold</strong>
 * - *italic* → <em>italic</em>
 * - __underline__ → <u>underline</u>
 * - ~~strikethrough~~ → <s>strikethrough</s>
 * - `code` → <code>code</code>
 * - ```code block``` → <pre><code>code block</code></pre>
 * - > quote → <blockquote>quote</blockquote>
 * - 1. item → <ol><li>item</li></ol>
 * - - item or * item → <ul><li>item</li></ul>
 * - [text](url) → <a href="url">text</a>
 *
 * @see Requirements 2.1, 2.3, 2.4
 */
export class CometChatMarkdownFormatter extends CometChatTextFormatter {
  readonly id = 'markdown-formatter';
  override priority = 30; // Run after mentions (20) but before URLs (40)

  /**
   * Get the regex pattern for markdown detection.
   * This is a simple pattern that matches common markdown syntax.
   * @returns RegExp pattern
   */
  override getRegex(): RegExp {
    // Match any markdown syntax including blockquotes, lists (with indentation), inline formatting, and links
    // Use multiline flag to match patterns at start of any line
    // Added \[.*?\]\(.*?\) to detect markdown links [text](url)
    // Match both raw > and HTML-escaped &gt; for blockquotes (text is HTML-escaped before formatters run)
    return /(\*\*|__|~~|`|^>\s|^&gt;\s?|^ *[-*]\s|^ *\d+\.\s|\[.*?\]\(.*?\))/m;
  }

  /**
   * Format markdown text to HTML
   * @param text - The text to format
   * @returns Formatted HTML text
   */
  override format(text: string): string {
    if (text == null) {
      this.originalText = '';
      this.formattedText = '';
      return '';
    }

    this.originalText = text;
    this.formattedText = this.markdownToHtml(text);
    return this.formattedText;
  }

  /**
   * Convert markdown to HTML
   * @param markdown - Markdown text
   * @returns HTML text
   * @private
   */
  private markdownToHtml(markdown: string): string {
    let html = markdown;

    // Code blocks (must be processed first to avoid conflicts)
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // Blockquotes (process before other inline formatting)
    // Group consecutive lines starting with > into a single blockquote
    html = this.formatBlockquotes(html);

    // Bold: **text** (must be processed before italic to avoid conflicts)
    html = html.replace(/\*\*([^\*]+?)\*\*/g, '<strong>$1</strong>');

    // Strikethrough: ~~text~~ (process before other formatting)
    html = html.replace(/~~([^~]+?)~~/g, '<s>$1</s>');

    // Underline: __text__
    html = html.replace(/__([^_]+?)__/g, '<u>$1</u>');

    // Italic: *text* (single asterisk, not preceded or followed by another asterisk)
    // Use negative lookbehind and lookahead to avoid matching ** from bold
    html = html.replace(/(?<!\*)\*([^\*\n]+?)\*(?!\*)/g, '<em>$1</em>');

    // Inline code: `code` (but not inside code blocks)
    html = html.replace(/`([^`]+?)`/g, '<code>$1</code>');

    // Links: [text](url)
    html = html.replace(
      /\[([^\]]+)\]\(([^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Ordered lists: 1. item
    html = this.formatOrderedLists(html);

    // Unordered lists: - item or * item
    html = this.formatUnorderedLists(html);

    return html;
  }

  /**
   * Format blockquotes - group consecutive lines starting with > into a single blockquote
   * @param text - Text with markdown blockquotes
   * @returns Text with HTML blockquotes
   * @private
   */
  private formatBlockquotes(text: string): string {
    const lines = text.split('\n');
    const result: string[] = [];
    let inBlockquote = false;
    const blockquoteLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match lines starting with > or &gt; (HTML-escaped) followed by optional space and content
      // Allow both "> text" and ">text" formats, and their escaped equivalents
      // Text is HTML-escaped by escapeUserHtml() before formatters run, so > becomes &gt;
      const match = line.match(/^(?:>|&gt;)\s*(.*)$/);

      if (match) {
        // This line is part of a blockquote
        if (!inBlockquote) {
          inBlockquote = true;
        }
        // Only add non-empty content
        const content = match[1].trim();
        if (content) {
          blockquoteLines.push(content);
        }
      } else {
        // Not a blockquote line
        if (inBlockquote) {
          // Close the previous blockquote
          if (blockquoteLines.length > 0) {
            result.push(`<blockquote>${blockquoteLines.join('<br>')}</blockquote>`);
          }
          blockquoteLines.length = 0;
          inBlockquote = false;
        }
        result.push(line);
      }
    }

    // Close any remaining blockquote
    if (inBlockquote && blockquoteLines.length > 0) {
      result.push(`<blockquote>${blockquoteLines.join('<br>')}</blockquote>`);
    }

    return result.join('\n');
  }

  /**
   * Format ordered lists with nested indentation support.
   * Indentation is 4 spaces per nesting level.
   * Nested ordered lists cycle: decimal → lower-alpha → lower-roman.
   * @param text - Text with markdown lists
   * @returns Text with HTML lists
   * @private
   */
  private formatOrderedLists(text: string): string {
    const lines = text.split('\n');
    const result: string[] = [];
    let currentDepth = -1; // -1 means not in a list

    const olStyles = ['decimal', 'lower-alpha', 'lower-roman'];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match indented ordered list items: optional leading spaces + number + dot + space + content
      const match = line.match(/^( *)(\d+)\.\s+(.+)$/);

      if (match) {
        const indent = match[1].length;
        const content = match[3];
        const depth = Math.floor(indent / 4); // 4 spaces per level

        if (currentDepth === -1) {
          // Starting a new list
          result.push(`<ol style="list-style-type: ${olStyles[0]}">`);
          currentDepth = 0;
        }

        // Open nested lists to reach the target depth
        while (currentDepth < depth) {
          currentDepth++;
          const style = olStyles[currentDepth % olStyles.length];
          result.push(`<ol style="list-style-type: ${style}">`);
        }

        // Close nested lists to come back up
        while (currentDepth > depth) {
          result.push('</ol>');
          currentDepth--;
        }

        result.push(`<li>${content}</li>`);
      } else {
        // Not a list item — close all open lists
        while (currentDepth >= 0) {
          result.push('</ol>');
          currentDepth--;
        }
        result.push(line);
      }
    }

    // Close any remaining open lists
    while (currentDepth >= 0) {
      result.push('</ol>');
      currentDepth--;
    }

    return result.join('\n');
  }

  /**
   * Format unordered lists with nested indentation support.
   * Indentation is 4 spaces per nesting level.
   * Nested unordered lists cycle: disc → circle → square.
   * @param text - Text with markdown lists
   * @returns Text with HTML lists
   * @private
   */
  private formatUnorderedLists(text: string): string {
    const lines = text.split('\n');
    const result: string[] = [];
    let currentDepth = -1; // -1 means not in a list

    const ulStyles = ['disc', 'circle', 'square'];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match indented unordered list items: optional leading spaces + dash/asterisk + space + content
      const match = line.match(/^( *)[-*]\s+(.+)$/);

      if (match) {
        const indent = match[1].length;
        const content = match[2];
        const depth = Math.floor(indent / 4); // 4 spaces per level

        if (currentDepth === -1) {
          // Starting a new list
          result.push(`<ul style="list-style-type: ${ulStyles[0]}">`);
          currentDepth = 0;
        }

        // Open nested lists to reach the target depth
        while (currentDepth < depth) {
          currentDepth++;
          const style = ulStyles[currentDepth % ulStyles.length];
          result.push(`<ul style="list-style-type: ${style}">`);
        }

        // Close nested lists to come back up
        while (currentDepth > depth) {
          result.push('</ul>');
          currentDepth--;
        }

        result.push(`<li>${content}</li>`);
      } else {
        // Not a list item — close all open lists
        while (currentDepth >= 0) {
          result.push('</ul>');
          currentDepth--;
        }
        result.push(line);
      }
    }

    // Close any remaining open lists
    while (currentDepth >= 0) {
      result.push('</ul>');
      currentDepth--;
    }

    return result.join('\n');
  }

  /**
   * Check if this formatter should process the given text
   * @param text - The text to check
   * @returns Whether to apply this formatter
   */
  override shouldFormat(text: string): boolean {
    // Only format if text contains markdown syntax
    const regex = this.getRegex();
    const result = regex.test(text);
    return result;
  }
}
