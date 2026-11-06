/**
 * Security regression tests for the markdown renderer (CI 1 `security-tests`, ENG-40457).
 *
 * The renderer binds its output with bypassSecurityTrustHtml, so anything that reaches the
 * DOM from message text must already be inert: links and images may only use schemes that
 * can't run script, and every piece of user text (including table cells) must be escaped.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pipe, PipeTransform } from '@angular/core';
import { CometChatMarkdownRenderer } from './cometchat-markdown-renderer.component';
import { HtmlSanitizerService } from '../../services/html-sanitizer.service';
import { CometChatMarkdownParser, MarkdownNode } from './cometchat-markdown-parser';

@Pipe({ name: 'translate', standalone: true })
class MockTranslatePipe implements PipeTransform {
  transform(key: string): string {
    return key;
  }
}

describe('CometChatMarkdownRenderer security', () => {
  let fixture: ComponentFixture<CometChatMarkdownRenderer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CometChatMarkdownRenderer] })
      .overrideComponent(CometChatMarkdownRenderer, { set: { imports: [MockTranslatePipe] } })
      .compileComponents();
    fixture = TestBed.createComponent(CometChatMarkdownRenderer);
  });

  function render(text: string): HTMLElement {
    fixture.componentRef.setInput('text', text);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('.cometchat-markdown-renderer__container');
  }

  describe('render boundary', () => {
    it('DOMPurify cleans the output even if the parser lets raw HTML through (second layer)', () => {
      // The parser escapes HTML (layer 1). Simulate a parser regression that hands raw HTML to the
      // renderer, and check that the DOMPurify pass alone still strips everything unsafe.
      const raw =
        '<img src="x" onerror="alert(1)"><script>alert(2)</script>' +
        '<a href="javascript:alert(3)" onclick="alert(4)">link</a><iframe src="https://evil.test"></iframe>' +
        '<svg><animate onbegin="alert(5)"></animate></svg>safe text';
      const unescaped: MarkdownNode[] = [{ type: 'paragraph', children: [{ type: 'text', content: raw }] } as MarkdownNode];
      const parse = vi.spyOn(CometChatMarkdownParser.prototype, 'parse').mockReturnValue(unescaped);
      const container = render('anything');
      parse.mockRestore();

      expect(container.textContent).toContain('safe text');
      expect(container.querySelector('script, iframe, svg, img[onerror]')).toBeNull();
      expect(container.querySelector('[onclick], [onerror], [onbegin]')).toBeNull();
      expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
    });

    it('runs the rendered HTML through DOMPurify before it is marked as trusted', () => {
      const sanitizer = TestBed.inject(HtmlSanitizerService);
      const spy = vi.spyOn(sanitizer, 'sanitizeWithConfig');
      render('**bold** and [a link](https://example.com)');
      expect(spy).toHaveBeenCalled();
      const [html, config] = spy.mock.calls[spy.mock.calls.length - 1];
      expect(html).toContain('cometchat-markdown-renderer__bold');
      expect(config.ALLOWED_TAGS).not.toContain('script');
      expect(config.ALLOWED_ATTR).not.toContain('onerror');
    });

    it('keeps the markdown it renders intact after sanitizing', () => {
      const el = render('# Title\n\n**bold** `code` [link](https://example.com)\n\n```ts\nconst a = 1;\n```');
      expect(el.querySelector('h1')?.textContent).toContain('Title');
      expect(el.querySelector('strong')?.textContent).toBe('bold');
      expect(el.querySelector('a')?.getAttribute('href')).toBe('https://example.com');
      expect(el.querySelector('pre code')?.textContent).toContain('const a = 1;');
      expect(el.querySelector('button[data-copy-btn]')).not.toBeNull();
    });
  });

  describe('links', () => {
    it.each([
      ['javascript:', '[click](javascript:alert(1))'],
      ['mixed-case JavaScript:', '[click](JaVaScRiPt:alert(1))'],
      ['whitespace inside the scheme', '[click](java\tscript:alert(1))'],
      ['leading whitespace', '[click]( javascript:alert(1))'],
      ['data:', '[click](data:text/html,<script>alert(1)</script>)'],
      ['vbscript:', '[click](vbscript:msgbox(1))'],
    ])('a %s link renders inert', (_label, text) => {
      const link = render(text).querySelector('a');
      expect(link).not.toBeNull();
      expect(link!.getAttribute('href')).toBe('#');
      expect(link!.textContent).toBe('click');
    });

    it.each([
      ['https', '[site](https://cometchat.com/docs)', 'https://cometchat.com/docs'],
      ['http', '[site](http://example.com)', 'http://example.com'],
      ['mailto', '[mail](mailto:support@cometchat.com)', 'mailto:support@cometchat.com'],
      ['tel', '[call](tel:+15551234567)', 'tel:+15551234567'],
      ['relative path', '[docs](/docs/angular)', '/docs/angular'],
      ['in-page anchor', '[top](#top)', '#top'],
    ])('a %s link keeps its URL', (_label, text, href) => {
      const link = render(text).querySelector('a');
      expect(link!.getAttribute('href')).toBe(href);
      expect(link!.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('cannot break out of the href attribute with a quote', () => {
      const container = render('[x](https://a.com/"onmouseover="alert(1))');
      const link = container.querySelector('a');
      expect(link!.hasAttribute('onmouseover')).toBe(false);
    });
  });

  describe('images', () => {
    it.each([
      ['javascript:', '![pic](javascript:alert(1))'],
      ['data:', '![pic](data:image/svg+xml,<svg onload=alert(1)>)'],
    ])('a %s image source is dropped', (_label, text) => {
      const img = render(text).querySelector('img');
      expect(img).not.toBeNull();
      expect(img!.getAttribute('src')).toBe('');
      expect(img!.getAttribute('data-img-click')).toBe('');
    });

    it('an https image keeps its source', () => {
      const img = render('![pic](https://cdn.example.com/a.png)').querySelector('img');
      expect(img!.getAttribute('src')).toBe('https://cdn.example.com/a.png');
    });

    it('clicking an image with a dropped source emits nothing', () => {
      const emitted: string[] = [];
      fixture.componentInstance.imageClick.subscribe((src: string) => emitted.push(src));
      render('![pic](javascript:alert(1))').querySelector('img')!.click();
      expect(emitted).toEqual([]);
    });
  });

  describe('HTML in message text is escaped', () => {
    const payload = '<img src=x onerror="alert(1)">';

    it.each([
      ['a paragraph', payload],
      ['a heading', `# ${payload}`],
      ['a blockquote', `> ${payload}`],
      ['a list item', `- ${payload}`],
      ['inline code', `\`${payload}\``],
      ['a code block', `\`\`\`\n${payload}\n\`\`\``],
      ['a table header cell', `| ${payload} | b |\n| --- | --- |\n| 1 | 2 |`],
      ['a table body cell', `| a | b |\n| --- | --- |\n| ${payload} | 2 |`],
    ])('in %s it renders as text, not an element', (_label, text) => {
      const container = render(text);
      expect(container.querySelector('img')).toBeNull();
      expect(container.querySelector('[onerror]')).toBeNull();
      expect(container.textContent).toContain('<img src=x onerror="alert(1)">');
    });

    it('a <script> tag in a table cell is shown as text', () => {
      const container = render('| <script>alert(1)</script> |\n| --- |\n| x |');
      expect(container.querySelector('script')).toBeNull();
      expect(container.querySelector('th')!.textContent).toBe('<script>alert(1)</script>');
    });

    it('plain table text still renders unchanged', () => {
      const container = render('| Name | Score |\n| --- | --- |\n| Ann & Bo | 10 |');
      expect([...container.querySelectorAll('th')].map((c) => c.textContent)).toEqual(['Name', 'Score']);
      expect([...container.querySelectorAll('td')].map((c) => c.textContent)).toEqual(['Ann & Bo', '10']);
    });
  });
});
