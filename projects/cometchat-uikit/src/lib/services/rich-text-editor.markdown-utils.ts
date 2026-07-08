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

  // ── Step 1: Extract multi-line block elements into placeholders ──────────
  // wrapParagraphs splits on \n, so any block element that spans multiple
  // lines (pre/code blocks, multi-line blockquotes) must be pulled out first,
  // processed, then restored after paragraph-wrapping is done.
  const blockPlaceholders: string[] = [];

  // Code blocks (``` ... ```) — must come before inline code
  html = html.replace(/```([\s\S]*?)```/g, (_match, code: string) => {
    const idx = blockPlaceholders.length;
    // Trim leading/trailing newlines from the code content to avoid extra whitespace
    const trimmedCode = code.replace(/^\n/, '').replace(/\n$/, '');
    blockPlaceholders.push(`<pre class="cometchat-rich-text__code-block"><code class="cometchat-rich-text__code">${trimmedCode}</code></pre>`);
    return `\x00BLOCK${idx}\x00`;
  });

  // ── Step 2: Single-line block elements ───────────────────────────────────

  // Blockquotes (> text) — after escaping, ">" becomes "&gt;"
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="cometchat-rich-text__blockquote">$1</blockquote>');

  // Ordered lists (1. item)
  html = convertOrderedLists(html);

  // Unordered lists (- item or * item)
  html = convertUnorderedLists(html);

  // Headings (# H1, ## H2, ### H3)
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // ── Step 3: Inline elements ───────────────────────────────────────────────
  html = convertInlineMarkdown(html);

  // ── Step 4: Wrap bare lines in <p> tags ──────────────────────────────────
  html = wrapParagraphs(html);

  // ── Step 5: Restore multi-line block placeholders ────────────────────────
  html = html.replace(/\x00BLOCK(\d+)\x00/g, (_match, idx: string) => {
    return blockPlaceholders[parseInt(idx, 10)];
  });

  return html;
}

/**
 * Converts inline markdown syntax to HTML.
 * Handles bold, italic, strikethrough, inline code, and links.
 *
 * Uses a placeholder strategy to protect link syntax from being mangled
 * by bold/italic regexes:
 *  1. Extract all [label](url) patterns into indexed placeholders
 *  2. Run bold/italic/strikethrough/code on the placeholder-safe text
 *  3. Restore placeholders as proper <a> tags
 *
 * This prevents underscores or asterisks inside link labels or URLs
 * (e.g. target="_blank") from being misinterpreted as italic/bold markers.
 */
export function convertInlineMarkdown(text: string): string {
  // Step 1: Extract markdown links into placeholders
  const linkPlaceholders: Array<{ label: string; url: string }> = [];
  let result = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, label: string, url: string) => {
      const idx = linkPlaceholders.length;
      linkPlaceholders.push({ label, url });
      return `\x00LINK${idx}\x00`;
    }
  );

  // Step 2: Apply bold/italic/strikethrough/underline/code on placeholder-safe text
  // Bold (**text**)
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Underline (__text__)
  result = result.replace(/__(.+?)__/g, '<u>$1</u>');

  // Italic (*text* or _text_) — must come after bold and underline
  // Use negative lookbehind/lookahead to prevent matching _ inside __
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  result = result.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');

  // Strikethrough (~~text~~)
  result = result.replace(/~~(.+?)~~/g, '<s>$1</s>');

  // Inline code (`code`)
  result = result.replace(/`([^`]+)`/g, '<code class="cometchat-rich-text__code">$1</code>');

  // Step 3: Restore link placeholders as <a> tags
  result = result.replace(/\x00LINK(\d+)\x00/g, (_match, idx: string) => {
    const { label, url } = linkPlaceholders[parseInt(idx, 10)];
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });

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
      return `_${children}_`;
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
      // Calculate nesting depth for indentation
      let depth = 0;
      let ancestor: Element | null = parent?.parentElement ?? null;
      while (ancestor) {
        if (ancestor.tagName.toLowerCase() === 'ol' || ancestor.tagName.toLowerCase() === 'ul') depth++;
        ancestor = ancestor.parentElement;
      }
      const indent = '    '.repeat(depth); // 4 spaces per level (matches CometChatMarkdownFormatter)
      if (parent && parent.tagName.toLowerCase() === 'ol') {
        const index = Array.from(parent.children).indexOf(el) + 1;
        return `${indent}${index}. ${children}\n`;
      }
      return `${indent}- ${children}\n`;
    }
    case 'ul':
    case 'ol':
      // Add leading newline so nested lists start on a new line after parent text
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
  return html.replace(/((?:^[ ]*\d+\. .+\n?)+)/gm, match => {
    return buildNestedList(match.trim().split('\n'), 'ol');
  });
}

function convertUnorderedLists(html: string): string {
  return html.replace(/((?:^[ ]*[-*] .+\n?)+)/gm, match => {
    return buildNestedList(match.trim().split('\n'), 'ul');
  });
}

/**
 * Builds nested HTML list structure from indented markdown lines.
 * Each 4-space indent level creates a nested list.
 */
function buildNestedList(lines: string[], defaultType: 'ol' | 'ul'): string {
  let result = '';
  const stack: { type: string; indent: number }[] = [];
  
  for (const line of lines) {
    const indentMatch = line.match(/^( *)/);
    const indent = indentMatch ? indentMatch[1].length : 0;
    const depth = Math.floor(indent / 4); // 4 spaces per level (matches CometChatMarkdownFormatter)
    const content = line.replace(/^ *(?:\d+\. |[-*] )/, '');
    const lineType = /^ *\d+\./.test(line) ? 'ol' : 'ul';

    // Close deeper levels
    while (stack.length > depth + 1) {
      const popped = stack.pop()!;
      result += `</li></${popped.type}>`;
    }

    if (stack.length === 0) {
      // Start the top-level list
      result += `<${lineType}>`;
      stack.push({ type: lineType, indent: 0 });
    } else if (depth >= stack.length) {
      // Go deeper — open a nested list inside the current <li>
      result += `<${lineType}>`;
      stack.push({ type: lineType, indent: depth });
    } else {
      // Same level — close previous <li>
      result += '</li>';
    }

    result += `<li>${content}`;
  }

  // Close all remaining open tags
  while (stack.length > 0) {
    const popped = stack.pop()!;
    result += `</li></${popped.type}>`;
  }

  return result;
}
function wrapParagraphs(html: string): string {
  // Only wrap lines that aren't already block elements or don't contain block elements
  const blockTags = /^<(h[1-6]|ul|ol|li|pre|blockquote|div|p)/i;
  // Lines that ARE a block element (possibly with closing tag on same line)
  const isBlockLine = /^<(h[1-6]|ul|ol|li|pre|blockquote|div|p)[\s>]/i;
  // Lines that contain a block-level element as their primary content
  const containsBlock = /<(blockquote|pre|ul|ol|h[1-6]|div)[\s>]/i;
  return html
    .split('\n')
    .map(line => {
      if (!line.trim()) return '';
      if (blockTags.test(line.trim())) return line;
      if (isBlockLine.test(line.trim())) return line;
      if (containsBlock.test(line)) return line;
      return `<p>${line}</p>`;
    })
    .join('\n');
}
