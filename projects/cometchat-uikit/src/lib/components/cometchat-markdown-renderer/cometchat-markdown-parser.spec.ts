/**
 * Unit Tests for CometChatMarkdownParser
 * Feature: ai-assistant-chat
 */

import { CometChatMarkdownParser, MarkdownNode } from './cometchat-markdown-parser';

describe('CometChatMarkdownParser', () => {
  let parser: CometChatMarkdownParser;

  beforeEach(() => {
    parser = new CometChatMarkdownParser();
  });

  // ── Headings ────────────────────────────────────────────────────────────────

  describe('headings', () => {
    it('should parse h1', () => {
      const nodes = parser.parse('# Hello');
      expect(nodes[0].type).toBe('heading');
      expect(nodes[0].level).toBe(1);
    });

    it('should parse h2', () => {
      const nodes = parser.parse('## Hello');
      expect(nodes[0].type).toBe('heading');
      expect(nodes[0].level).toBe(2);
    });

    it('should parse h3', () => {
      const nodes = parser.parse('### Hello');
      expect(nodes[0].type).toBe('heading');
      expect(nodes[0].level).toBe(3);
    });

    it('should parse h4', () => {
      const nodes = parser.parse('#### Hello');
      expect(nodes[0].type).toBe('heading');
      expect(nodes[0].level).toBe(4);
    });

    it('should parse h5', () => {
      const nodes = parser.parse('##### Hello');
      expect(nodes[0].type).toBe('heading');
      expect(nodes[0].level).toBe(5);
    });

    it('should parse h6', () => {
      const nodes = parser.parse('###### Hello');
      expect(nodes[0].type).toBe('heading');
      expect(nodes[0].level).toBe(6);
    });

    it('should include heading text in children', () => {
      const nodes = parser.parse('# My Title');
      expect(nodes[0].children).toBeDefined();
      const textNode = nodes[0].children!.find((n) => n.type === 'text');
      expect(textNode?.content).toBe('My Title');
    });
  });

  // ── Bold ────────────────────────────────────────────────────────────────────

  describe('bold', () => {
    it('should parse bold text', () => {
      const nodes = parser.parse('**bold text**');
      const para = nodes.find((n) => n.type === 'paragraph');
      expect(para).toBeDefined();
      const bold = para!.children!.find((n) => n.type === 'bold');
      expect(bold).toBeDefined();
      expect(bold!.content).toBe('bold text');
    });
  });

  // ── Italic ──────────────────────────────────────────────────────────────────

  describe('italic', () => {
    it('should parse italic text', () => {
      const nodes = parser.parse('_italic text_');
      const para = nodes.find((n) => n.type === 'paragraph');
      const italic = para!.children!.find((n) => n.type === 'italic');
      expect(italic).toBeDefined();
      expect(italic!.content).toBe('italic text');
    });
  });

  // ── Strikethrough ───────────────────────────────────────────────────────────

  describe('strikethrough', () => {
    it('should parse strikethrough text', () => {
      const nodes = parser.parse('~~struck~~');
      const para = nodes.find((n) => n.type === 'paragraph');
      const strike = para!.children!.find((n) => n.type === 'strikethrough');
      expect(strike).toBeDefined();
      expect(strike!.content).toBe('struck');
    });
  });

  // ── Inline code ─────────────────────────────────────────────────────────────

  describe('inline code', () => {
    it('should parse inline code', () => {
      const nodes = parser.parse('Use `console.log()` here');
      const para = nodes.find((n) => n.type === 'paragraph');
      const code = para!.children!.find((n) => n.type === 'inlineCode');
      expect(code).toBeDefined();
      expect(code!.content).toBe('console.log()');
    });
  });

  // ── Code blocks ─────────────────────────────────────────────────────────────

  describe('code blocks', () => {
    it('should parse fenced code block with language', () => {
      const nodes = parser.parse('```typescript\nconst x = 1;\n```');
      const block = nodes.find((n) => n.type === 'codeBlock');
      expect(block).toBeDefined();
      expect(block!.lang).toBe('typescript');
      expect(block!.content).toBe('const x = 1;');
    });

    it('should parse fenced code block without language', () => {
      const nodes = parser.parse('```\nsome code\n```');
      const block = nodes.find((n) => n.type === 'codeBlock');
      expect(block).toBeDefined();
      expect(block!.lang).toBe('');
      expect(block!.content).toBe('some code');
    });

    it('should preserve multi-line code content', () => {
      const nodes = parser.parse('```js\nline1\nline2\nline3\n```');
      const block = nodes.find((n) => n.type === 'codeBlock');
      expect(block!.content).toBe('line1\nline2\nline3');
    });
  });

  // ── Blockquotes ─────────────────────────────────────────────────────────────

  describe('blockquotes', () => {
    it('should parse blockquote', () => {
      const nodes = parser.parse('> This is a quote');
      const bq = nodes.find((n) => n.type === 'blockquote');
      expect(bq).toBeDefined();
    });

    it('should include blockquote text in children', () => {
      const nodes = parser.parse('> Quote text');
      const bq = nodes.find((n) => n.type === 'blockquote');
      const text = bq!.children!.find((n) => n.type === 'text');
      expect(text?.content).toBe('Quote text');
    });
  });

  // ── Ordered lists ───────────────────────────────────────────────────────────

  describe('ordered lists', () => {
    it('should parse ordered list', () => {
      const nodes = parser.parse('1. First\n2. Second\n3. Third');
      const list = nodes.find((n) => n.type === 'orderedList');
      expect(list).toBeDefined();
      expect(list!.children!.length).toBe(3);
    });

    it('should create listItem children', () => {
      const nodes = parser.parse('1. Item one');
      const list = nodes.find((n) => n.type === 'orderedList');
      expect(list!.children![0].type).toBe('listItem');
    });
  });

  // ── Unordered lists ─────────────────────────────────────────────────────────

  describe('unordered lists', () => {
    it('should parse unordered list with dashes', () => {
      const nodes = parser.parse('- Alpha\n- Beta\n- Gamma');
      const list = nodes.find((n) => n.type === 'unorderedList');
      expect(list).toBeDefined();
      expect(list!.children!.length).toBe(3);
    });

    it('should parse unordered list with asterisks', () => {
      const nodes = parser.parse('* One\n* Two');
      const list = nodes.find((n) => n.type === 'unorderedList');
      expect(list).toBeDefined();
    });
  });

  // ── Nested lists ────────────────────────────────────────────────────────────

  describe('nested lists (3 levels)', () => {
    it('should parse 2-level nested list', () => {
      const md = '- Parent\n  - Child';
      const nodes = parser.parse(md);
      const list = nodes.find((n) => n.type === 'unorderedList');
      expect(list).toBeDefined();
      const parentItem = list!.children![0];
      expect(parentItem.type).toBe('listItem');
      // Child list should be nested inside parent item
      const nestedList = parentItem.children!.find(
        (n) => n.type === 'unorderedList' || n.type === 'orderedList'
      );
      expect(nestedList).toBeDefined();
    });

    it('should parse 3-level nested list', () => {
      const md = '- L1\n  - L2\n    - L3';
      const nodes = parser.parse(md);
      const list = nodes.find((n) => n.type === 'unorderedList');
      expect(list).toBeDefined();
      const l1Item = list!.children![0];
      const l2List = l1Item.children!.find(
        (n) => n.type === 'unorderedList' || n.type === 'orderedList'
      );
      expect(l2List).toBeDefined();
    });
  });

  // ── Links ───────────────────────────────────────────────────────────────────

  describe('links', () => {
    it('should parse hyperlink', () => {
      const nodes = parser.parse('[CometChat](https://cometchat.com)');
      const para = nodes.find((n) => n.type === 'paragraph');
      const link = para!.children!.find((n) => n.type === 'link');
      expect(link).toBeDefined();
      expect(link!.content).toBe('CometChat');
      expect(link!.href).toBe('https://cometchat.com');
    });
  });

  // ── Images ──────────────────────────────────────────────────────────────────

  describe('images', () => {
    it('should parse image node with type, href, and alt', () => {
      const nodes = parser.parse('![A cat](https://example.com/cat.png)');
      const para = nodes.find((n) => n.type === 'paragraph');
      const img = para!.children!.find((n) => n.type === 'image');
      expect(img).toBeDefined();
      expect(img!.type).toBe('image');
      expect(img!.href).toBe('https://example.com/cat.png');
      expect(img!.alt).toBe('A cat');
    });

    it('should parse image with empty alt text', () => {
      const nodes = parser.parse('![](https://example.com/img.png)');
      const para = nodes.find((n) => n.type === 'paragraph');
      const img = para!.children!.find((n) => n.type === 'image');
      expect(img!.alt).toBe('');
    });
  });

  // ── Horizontal rules ────────────────────────────────────────────────────────

  describe('horizontal rules', () => {
    it('should parse --- as hr', () => {
      const nodes = parser.parse('---');
      expect(nodes[0].type).toBe('hr');
    });

    it('should parse longer --- as hr', () => {
      const nodes = parser.parse('------');
      expect(nodes[0].type).toBe('hr');
    });
  });

  // ── GFM Tables ──────────────────────────────────────────────────────────────

  describe('GFM tables', () => {
    const tableMarkdown = '| Name | Age |\n| --- | --- |\n| Alice | 30 |\n| Bob | 25 |';

    it('should parse table node', () => {
      const nodes = parser.parse(tableMarkdown);
      const table = nodes.find((n) => n.type === 'table');
      expect(table).toBeDefined();
    });

    it('should parse table headers', () => {
      const nodes = parser.parse(tableMarkdown);
      const table = nodes.find((n) => n.type === 'table');
      expect(table!.headers).toEqual(['Name', 'Age']);
    });

    it('should parse table rows', () => {
      const nodes = parser.parse(tableMarkdown);
      const table = nodes.find((n) => n.type === 'table');
      expect(table!.rows).toEqual([
        ['Alice', '30'],
        ['Bob', '25'],
      ]);
    });
  });

  // ── Paragraphs ──────────────────────────────────────────────────────────────

  describe('paragraphs', () => {
    it('should parse plain text as paragraph', () => {
      const nodes = parser.parse('Hello world');
      expect(nodes[0].type).toBe('paragraph');
    });

    it('should return empty array for empty string', () => {
      expect(parser.parse('')).toEqual([]);
    });
  });

  // ── Line breaks ─────────────────────────────────────────────────────────────

  describe('line breaks', () => {
    it('should produce lineBreak node for blank line', () => {
      const nodes = parser.parse('First\n\nSecond');
      const lb = nodes.find((n) => n.type === 'lineBreak');
      expect(lb).toBeDefined();
    });

    it('should not produce lineBreak for two trailing spaces (not supported)', () => {
      const nodes = parser.parse('Line with trailing spaces  ');
      const lb = nodes.find((n) => n.type === 'lineBreak');
      // Trailing-space line breaks are not supported by this parser
      expect(lb).toBeUndefined();
    });
  });

  // ── Streaming partial tolerance ─────────────────────────────────────────────

  describe('streaming partial tolerance', () => {
    it('should not throw for unclosed code fence in streaming mode', () => {
      expect(() => parser.parse('```typescript\nconst x =', true)).not.toThrow();
    });

    it('should return non-empty result for unclosed code fence in streaming mode', () => {
      const nodes = parser.parse('```typescript\nconst x =', true);
      expect(nodes.length).toBeGreaterThan(0);
    });

    it('should not throw for unclosed bold in streaming mode', () => {
      expect(() => parser.parse('Some **unclosed bold', true)).not.toThrow();
    });

    it('should return non-empty result for unclosed bold in streaming mode', () => {
      const nodes = parser.parse('Some **unclosed bold', true);
      expect(nodes.length).toBeGreaterThan(0);
    });

    it('should not throw for partial heading in streaming mode', () => {
      expect(() => parser.parse('# ', true)).not.toThrow();
    });

    it('should not throw for empty string in streaming mode', () => {
      expect(() => parser.parse('', true)).not.toThrow();
    });
  });

  // ── XSS escaping ────────────────────────────────────────────────────────────

  describe('XSS escaping', () => {
    it('should escape <script> tags', () => {
      const nodes = parser.parse('<script>alert("xss")</script>');
      const para = nodes.find((n) => n.type === 'paragraph');
      const text = para!.children!.find((n) => n.type === 'text');
      expect(text!.content).toContain('&lt;script&gt;');
      expect(text!.content).not.toContain('<script>');
    });

    it('should escape <img onerror> tags', () => {
      const nodes = parser.parse('<img src=x onerror=alert(1)>');
      const para = nodes.find((n) => n.type === 'paragraph');
      const text = para!.children!.find((n) => n.type === 'text');
      expect(text!.content).not.toContain('<img');
      expect(text!.content).toContain('&lt;img');
    });

    it('should escape & characters', () => {
      const nodes = parser.parse('Tom & Jerry');
      const para = nodes.find((n) => n.type === 'paragraph');
      const text = para!.children!.find((n) => n.type === 'text');
      expect(text!.content).toContain('&amp;');
    });

    it('should escape double quotes', () => {
      const nodes = parser.parse('Say "hello"');
      const para = nodes.find((n) => n.type === 'paragraph');
      const text = para!.children!.find((n) => n.type === 'text');
      expect(text!.content).toContain('&quot;');
    });

    it('should escape single quotes', () => {
      const nodes = parser.parse("It's fine");
      const para = nodes.find((n) => n.type === 'paragraph');
      const text = para!.children!.find((n) => n.type === 'text');
      expect(text!.content).toContain('&#39;');
    });

    it('should not escape content inside code blocks (raw code preserved)', () => {
      const nodes = parser.parse('```\n<div>hello</div>\n```');
      const block = nodes.find((n) => n.type === 'codeBlock');
      // Code block content is stored raw (renderer will escape when outputting)
      expect(block!.content).toBe('<div>hello</div>');
    });
  });
});
