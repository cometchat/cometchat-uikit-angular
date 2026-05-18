/**
 * Markdown conversion utilities for RichTextEditor.
 *
 * Extracted from rich-text-editor.class.ts to isolate markdown-to-HTML
 * and HTML-to-markdown conversion logic in a focused, testable module.
 */

// ==================== Markdown → HTML ====================

/**
 * Converts a markdown string to an HTML string.
 * Handles block-level elements (headings, lists, blockquotes, code blocks)
 * and inline elements (bold, italic, code, links, strikethrough).
 *
 * @param text - Raw markdown text
 * @returns HTML string
 */
export function markdownToHtml(text: string): string {
  if (!text) return '';

  let html = text;

  // Escape HTML entities first to prevent XSS
  html = escapeHtmlEntities(html);

  // Code blocks (``` ... ```) — must come before inline code
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Blockquotes (> text)
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // Ordered lists (1. item)
  html = convertOrderedLists(html);

  // Unordered lists (- item or * item)
  html = convertUnorderedLists(html);

  // Headings (# H1, ## H2, ### H3)
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Inline elements
  html = convertInlineMarkdown(html);

  // Paragraphs — wrap bare lines
  html = wrapParagraphs(html);

  return html;
}

/**
 * Converts inline markdown syntax to HTML.
 * Handles bold, italic, strikethrough, inline code, and links.
 */
export function convertInlineMarkdown(text: string): string {
  let result = text;

  // Bold (**text** or __text__)
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic (*text* or _text_) — must come after bold
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  result = result.replace(/_(.+?)_/g, '<em>$1</em>');

  // Strikethrough (~~text~~)
  result = result.replace(/~~(.+?)~~/g, '<s>$1</s>');

  // Inline code (`code`)
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links ([text](url))
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  return result;
}

// ==================== HTML → Markdown ====================

/**
 * Converts an HTML element's content to a markdown string.
 * Used when extracting plain text with formatting from the editor.
 *
 * @param element - Root HTML element to convert
 * @returns Markdown string
 */
export function htmlToMarkdown(element: HTMLElement): string {
  return convertNodeToMarkdown(element).trim();
}

function convertNodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? '';
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const children = Array.from(el.childNodes).map(convertNodeToMarkdown).join('');

  switch (tag) {
    case 'span': {
      // ENG-35081: Convert mention spans back to SDK mention format so that
      // copy-pasting @all or @user mentions preserves the structured mention data.
      const uid = el.getAttribute('data-uid');
      const mentionType = el.getAttribute('data-mention-type');
      if (uid !== null) {
        if (mentionType === 'channel' || uid === 'all') {
          const label = (el.textContent || '@all').replace(/^@/, '');
          return `<@all:${label}>`;
        }
        return `<@uid:${uid}>`;
      }
      return children;
    }
    case 'strong':
    case 'b':
      return `**${children}**`;
    case 'em':
    case 'i':
      return `*${children}*`;
    case 'u':
      return `__${children}__`;
    case 's':
    case 'del':
    case 'strike':
      return `~~${children}~~`;
    case 'code':
      return el.closest('pre') ? children : `\`${children}\``;
    case 'pre':
      return `\`\`\`\n${children}\n\`\`\``;
    case 'blockquote':
      return children
        .split('\n')
        .map(line => `> ${line}`)
        .join('\n');
    case 'a': {
      const href = el.getAttribute('href') ?? '';
      return `[${children}](${href})`;
    }
    case 'br':
      return '\n';
    case 'p':
    case 'div':
      return `${children}\n`;
    case 'li': {
      const parent = el.parentElement;
      if (parent && parent.tagName.toLowerCase() === 'ol') {
        const index = Array.from(parent.children).indexOf(el) + 1;
        return `${index}. ${children}\n`;
      }
      return `- ${children}\n`;
    }
    case 'ul':
    case 'ol':
      return `\n${children}`;
    case 'h1':
      return `# ${children}\n`;
    case 'h2':
      return `## ${children}\n`;
    case 'h3':
      return `### ${children}\n`;
    default:
      return children;
  }
}

// ==================== Auto-list Detection ====================

/**
 * Checks whether the given text at the cursor position matches an auto-list trigger.
 * Returns the list type if matched, or null if not.
 *
 * Triggers:
 * - "- " or "* " → bullet list
 * - "1. " → ordered list
 */
export function detectAutoListTrigger(
  textBeforeCursor: string
): 'bullet' | 'ordered' | null {
  if (/^[-*]\s$/.test(textBeforeCursor)) return 'bullet';
  if (/^\d+\.\s$/.test(textBeforeCursor)) return 'ordered';
  return null;
}

// ==================== Private Helpers ====================

function escapeHtmlEntities(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function convertOrderedLists(html: string): string {
  return html.replace(/((?:^\d+\. .+\n?)+)/gm, match => {
    const items = match
      .trim()
      .split('\n')
      .map(line => `<li>${line.replace(/^\d+\. /, '')}</li>`)
      .join('');
    return `<ol>${items}</ol>`;
  });
}

function convertUnorderedLists(html: string): string {
  return html.replace(/((?:^[-*] .+\n?)+)/gm, match => {
    const items = match
      .trim()
      .split('\n')
      .map(line => `<li>${line.replace(/^[-*] /, '')}</li>`)
      .join('');
    return `<ul>${items}</ul>`;
  });
}

function wrapParagraphs(html: string): string {
  // Only wrap lines that aren't already block elements
  const blockTags = /^<(h[1-6]|ul|ol|li|pre|blockquote|div|p)/i;
  return html
    .split('\n')
    .map(line => {
      if (!line.trim()) return '';
      if (blockTags.test(line.trim())) return line;
      return `<p>${line}</p>`;
    })
    .join('\n');
}
