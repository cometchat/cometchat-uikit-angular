/**
 * CometChatMarkdownParser
 * Pure TypeScript — no Angular DI, no external dependencies.
 *
 * Supported constructs:
 *  1.  Headings h1–h6  (# … ######)
 *  2.  Bold  **text**  or  __text__
 *  3.  Italic  *text*  or  _text_
 *  4.  Strikethrough  ~~text~~
 *  5.  Inline code  `code`
 *  6.  Fenced code blocks  ```lang … ```
 *  7.  Blockquotes  > text
 *  8.  Ordered lists  1. item
 *  9.  Unordered lists  - item / * item
 * 10.  Nested lists (up to 3 levels)
 * 11.  Hyperlinks  [text](url)
 * 12.  Images  ![alt](url)
 * 13.  Horizontal rules  ---
 * 14.  Line breaks (blank line)
 * 15.  Paragraphs
 * 16.  GFM tables  | col | col |
 */

export type MarkdownNodeType =
  | 'heading'
  | 'paragraph'
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'inlineCode'
  | 'codeBlock'
  | 'blockquote'
  | 'orderedList'
  | 'unorderedList'
  | 'listItem'
  | 'link'
  | 'image'
  | 'hr'
  | 'lineBreak'
  | 'table'
  | 'text';

export interface MarkdownNode {
  type: MarkdownNodeType;
  content?: string;
  children?: MarkdownNode[];
  level?: number;
  lang?: string;
  href?: string;
  alt?: string;
  rows?: string[][];
  headers?: string[];
}

// ── XSS helpers ───────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Inline parser ─────────────────────────────────────────────────────────────

function parseInline(text: string): MarkdownNode[] {
  const nodes: MarkdownNode[] = [];
  let remaining = text;

  // Order: images > links > bold (**/__) > strikethrough > italic (*/_) > inline code
  const inlineRe =
    /!\[([^\]]*)\]\(([^)]*)\)|\[([^\]]*)\]\(([^)]*)\)|\*\*([^*]+)\*\*|__([^_]+)__|~~([^~]+)~~|\*([^*]+)\*|_([^_]+)_|`([^`]+)`/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  inlineRe.lastIndex = 0;

  while ((match = inlineRe.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', content: remaining.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined) {
      nodes.push({ type: 'image', alt: match[1], href: match[2] });
    } else if (match[3] !== undefined) {
      nodes.push({ type: 'link', content: match[3], href: match[4] });
    } else if (match[5] !== undefined) {
      nodes.push({ type: 'bold', content: match[5] });
    } else if (match[6] !== undefined) {
      nodes.push({ type: 'bold', content: match[6] });
    } else if (match[7] !== undefined) {
      nodes.push({ type: 'strikethrough', content: match[7] });
    } else if (match[8] !== undefined) {
      nodes.push({ type: 'italic', content: match[8] });
    } else if (match[9] !== undefined) {
      nodes.push({ type: 'italic', content: match[9] });
    } else if (match[10] !== undefined) {
      nodes.push({ type: 'inlineCode', content: match[10] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < remaining.length) {
    nodes.push({ type: 'text', content: remaining.slice(lastIndex) });
  }

  return nodes.length > 0 ? nodes : [{ type: 'text', content: text }];
}

// ── List helpers ──────────────────────────────────────────────────────────────

interface RawListItem {
  indent: number;
  ordered: boolean;
  content: string;
}

function parseListItems(lines: string[]): MarkdownNode {
  const rawItems: RawListItem[] = [];

  for (const line of lines) {
    const orderedMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
    const unorderedMatch = line.match(/^(\s*)[-*]\s+(.*)/);
    if (orderedMatch) {
      rawItems.push({ indent: orderedMatch[1].length, ordered: true, content: orderedMatch[2] });
    } else if (unorderedMatch) {
      rawItems.push({ indent: unorderedMatch[1].length, ordered: false, content: unorderedMatch[2] });
    }
  }

  function buildList(items: RawListItem[], depth: number): MarkdownNode {
    const listType: MarkdownNodeType = items[0]?.ordered ? 'orderedList' : 'unorderedList';
    const listNode: MarkdownNode = { type: listType, children: [] };
    let i = 0;

    while (i < items.length) {
      const item = items[i];
      const listItem: MarkdownNode = {
        type: 'listItem',
        children: parseInline(escapeHtml(item.content)),
      };

      const nestedItems: RawListItem[] = [];
      i++;
      while (i < items.length && items[i].indent > item.indent && depth < 3) {
        nestedItems.push(items[i]);
        i++;
      }

      if (nestedItems.length > 0) {
        listItem.children = [...(listItem.children ?? []), buildList(nestedItems, depth + 1)];
      }

      listNode.children!.push(listItem);
    }

    return listNode;
  }

  return buildList(rawItems, 1);
}

// ── Table helpers ─────────────────────────────────────────────────────────────

function parseTableRow(line: string): string[] {
  return line.split('|').slice(1, -1).map((c) => c.trim());
}

function isTableSeparator(line: string): boolean {
  return /^\|?[\s\-:|]+\|/.test(line);
}

// ── Fence detection ───────────────────────────────────────────────────────────

/**
 * Returns the language tag if the line opens a fenced code block, otherwise null.
 * Handles: ```python  ``` python  ```Python  leading spaces  \r endings
 */
function getFenceLang(line: string): string | null {
  const m = line.trimEnd().match(/^\s*```\s*(\w*)\s*$/);
  return m ? m[1] : null;
}

function isClosingFence(line: string): boolean {
  return /^\s*```\s*$/.test(line.trimEnd());
}

// ── Block parser ──────────────────────────────────────────────────────────────

export class CometChatMarkdownParser {
  parse(text: string, streaming?: boolean): MarkdownNode[] {
    if (!text) return [];

    const nodes: MarkdownNode[] = [];
    const lines = text.split('\n').map(l => l.replace(/\r$/, ''));
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // ── Fenced code block ──────────────────────────────────────────────────
      const fenceLang = getFenceLang(line);
      if (fenceLang !== null) {
        const lang = fenceLang;
        const codeLines: string[] = [];
        i++;
        let closed = false;

        while (i < lines.length) {
          if (isClosingFence(lines[i])) {
            closed = true;
            i++;
            break;
          }
          codeLines.push(lines[i]);
          i++;
        }

        // During streaming an unclosed fence is still rendered as a code block
        // so the user sees syntax-highlighted code as it arrives.
        nodes.push({
          type: 'codeBlock',
          lang,
          content: codeLines.join('\n'),
        });
        continue;
      }

      // ── Heading ────────────────────────────────────────────────────────────
      const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
      if (headingMatch) {
        nodes.push({
          type: 'heading',
          level: headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6,
          children: parseInline(escapeHtml(headingMatch[2])),
        });
        i++;
        continue;
      }

      // ── Horizontal rule ────────────────────────────────────────────────────
      if (/^-{3,}$/.test(line.trim())) {
        nodes.push({ type: 'hr' });
        i++;
        continue;
      }

      // ── Blockquote ─────────────────────────────────────────────────────────
      if (line.startsWith('> ')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].startsWith('> ')) {
          quoteLines.push(lines[i].slice(2));
          i++;
        }
        nodes.push({
          type: 'blockquote',
          children: parseInline(escapeHtml(quoteLines.join('\n'))),
        });
        continue;
      }

      // ── GFM Table ──────────────────────────────────────────────────────────
      if (line.startsWith('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
        const headers = parseTableRow(line);
        i += 2;
        const rows: string[][] = [];
        while (i < lines.length && lines[i].startsWith('|')) {
          rows.push(parseTableRow(lines[i]));
          i++;
        }
        nodes.push({ type: 'table', headers, rows });
        continue;
      }

      // ── Ordered / Unordered list ───────────────────────────────────────────
      if (/^\s*\d+\.\s+/.test(line) || /^\s*[-*]\s+/.test(line)) {
        const listLines: string[] = [];
        while (
          i < lines.length &&
          (/^\s*\d+\.\s+/.test(lines[i]) ||
            /^\s*[-*]\s+/.test(lines[i]) ||
            /^\s{2,}/.test(lines[i]))
        ) {
          listLines.push(lines[i]);
          i++;
        }
        nodes.push(parseListItems(listLines));
        continue;
      }

      // ── Blank line ─────────────────────────────────────────────────────────
      if (line.trim() === '') {
        nodes.push({ type: 'lineBreak' });
        i++;
        continue;
      }

      // ── Paragraph ─────────────────────────────────────────────────────────
      const paraLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !lines[i].match(/^#{1,6}\s/) &&
        getFenceLang(lines[i]) === null &&
        !lines[i].startsWith('> ') &&
        !lines[i].startsWith('|') &&
        !/^\s*\d+\.\s+/.test(lines[i]) &&
        !/^\s*[-*]\s+/.test(lines[i]) &&
        !/^-{3,}$/.test(lines[i].trim())
      ) {
        paraLines.push(lines[i]);
        i++;
      }

      if (paraLines.length > 0) {
        const paraText = paraLines.join('\n');
        nodes.push({
          type: 'paragraph',
          children: parseInline(escapeHtml(paraText.trimEnd())),
        });
      }
    }

    return nodes;
  }
}
