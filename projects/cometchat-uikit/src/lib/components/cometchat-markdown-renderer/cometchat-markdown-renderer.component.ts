import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  output,
  signal,
  WritableSignal,
  input,
  PLATFORM_ID,
  untracked,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { CometChatMarkdownParser, MarkdownNode } from './cometchat-markdown-parser';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

/**
 * Walks a MarkdownNode[] AST and produces an HTML string.
 * Code blocks are given a `data-code-block-index` attribute for copy-button wiring.
 */
function renderToHtml(nodes: MarkdownNode[], codeBlockIndex: { value: number }): string {
  let html = '';
  for (const node of nodes) {
    html += renderNode(node, codeBlockIndex);
  }
  return html;
}

function renderChildren(node: MarkdownNode, codeBlockIndex: { value: number }): string {
  if (!node.children?.length) return node.content ?? '';
  return renderToHtml(node.children, codeBlockIndex);
}

function renderNode(node: MarkdownNode, codeBlockIndex: { value: number }): string {
  switch (node.type) {
    case 'heading': {
      const lvl = node.level ?? 1;
      const inner = renderChildren(node, codeBlockIndex);
      return `<h${lvl} class="cometchat-markdown-renderer__heading cometchat-markdown-renderer__heading--${lvl}">${inner}</h${lvl}>`;
    }
    case 'paragraph': {
      const inner = renderChildren(node, codeBlockIndex);
      return `<p class="cometchat-markdown-renderer__paragraph">${inner}</p>`;
    }
    case 'bold':
      return `<strong class="cometchat-markdown-renderer__bold">${node.content ?? ''}</strong>`;
    case 'italic':
      return `<em class="cometchat-markdown-renderer__italic">${node.content ?? ''}</em>`;
    case 'strikethrough':
      return `<del class="cometchat-markdown-renderer__strikethrough">${node.content ?? ''}</del>`;
    case 'inlineCode':
      return `<code class="cometchat-markdown-renderer__inline-code">${node.content ?? ''}</code>`;
    case 'codeBlock': {
      const idx = codeBlockIndex.value++;
      const lang = node.lang ?? '';
      const escaped = escapeHtmlContent(node.content ?? '');
      const langLabel = lang
        ? `<span class="cometchat-markdown-renderer__code-lang">${escapeHtmlContent(lang)}</span>`
        : '';
      return (
        `<div class="cometchat-markdown-renderer__code-block">` +
        `<div class="cometchat-markdown-renderer__code-header">` +
        langLabel +
        `<button data-copy-btn data-code-index="${idx}" class="cometchat-markdown-renderer__code-copy-btn" title="${CometChatLocalize.getLocalizedString('markdown_copy_code')}" aria-label="${CometChatLocalize.getLocalizedString('markdown_copy_code')}">` +
        `<span class="cometchat-markdown-renderer__code-copy-icon"></span>` +
        `</button>` +
        `</div>` +
        `<pre><code class="language-${lang}">${escaped}</code></pre>` +
        `</div>`
      );
    }
    case 'blockquote': {
      const inner = renderChildren(node, codeBlockIndex);
      return `<blockquote class="cometchat-markdown-renderer__blockquote">${inner}</blockquote>`;
    }
    case 'orderedList': {
      const inner = renderChildren(node, codeBlockIndex);
      return `<ol class="cometchat-markdown-renderer__ordered-list">${inner}</ol>`;
    }
    case 'unorderedList': {
      const inner = renderChildren(node, codeBlockIndex);
      return `<ul class="cometchat-markdown-renderer__unordered-list">${inner}</ul>`;
    }
    case 'listItem': {
      const inner = renderChildren(node, codeBlockIndex);
      return `<li class="cometchat-markdown-renderer__list-item">${inner}</li>`;
    }
    case 'link': {
      const href = node.href ?? '#';
      const content = node.content ?? '';
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="cometchat-markdown-renderer__link">${content}</a>`;
    }
    case 'image': {
      const src = node.href ?? '';
      const alt = node.alt ?? '';
      return `<img src="${src}" alt="${alt}" class="cometchat-markdown-renderer__image" data-img-click="${src}" />`;
    }
    case 'hr':
      return `<hr class="cometchat-markdown-renderer__hr" />`;
    case 'lineBreak':
      return `<br />`;
    case 'table': {
      const headers = node.headers ?? [];
      const rows = node.rows ?? [];
      const headerHtml = headers
        .map((h) => `<th class="cometchat-markdown-renderer__table-header-cell">${h}</th>`)
        .join('');
      const rowsHtml = rows
        .map(
          (row) =>
            `<tr class="cometchat-markdown-renderer__table-row">${row
              .map((cell) => `<td class="cometchat-markdown-renderer__table-cell">${cell}</td>`)
              .join('')}</tr>`
        )
        .join('');
      return (
        `<div class="cometchat-markdown-renderer__table-wrapper">` +
        `<table class="cometchat-markdown-renderer__table">` +
        `<thead class="cometchat-markdown-renderer__table-head"><tr class="cometchat-markdown-renderer__table-row">${headerHtml}</tr></thead>` +
        `<tbody class="cometchat-markdown-renderer__table-body">${rowsHtml}</tbody>` +
        `</table>` +
        `</div>`
      );
    }
    case 'text':
      return node.content ?? '';
    default:
      return node.content ?? '';
  }
}

function escapeHtmlContent(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function collectCodeBlocks(nodes: MarkdownNode[], out: string[]): void {
  for (const node of nodes) {
    if (node.type === 'codeBlock') {
      out.push(node.content ?? '');
    }
    if (node.children?.length) {
      collectCodeBlocks(node.children, out);
    }
  }
}

const _parser = new CometChatMarkdownParser();

/** Internal parse result — HTML string + extracted code block contents. */
interface ParseResult {
  html: string;
  codeContents: string[];
}

@Component({
  selector: 'cometchat-markdown-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule],
  templateUrl: './cometchat-markdown-renderer.component.html',
  styleUrls: ['./cometchat-markdown-renderer.component.css'],
  host: {
    style: 'display: block; min-width: 0; max-width: 100%;',
  },
})
export class CometChatMarkdownRenderer {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly platformId = inject(PLATFORM_ID);

  readonly text = input.required<string>();
  readonly streaming = input<boolean>(false);

  readonly imageClick = output<string>();

  /** Tracks copy state per code block (parallel array to parsed code blocks). */
  isCopied: WritableSignal<boolean>[] = [];

  /**
   * Internal computed that parses the AST and produces both the HTML string
   * and the list of raw code block contents. Pure computation — no side effects.
   */
  private readonly _parseResult = computed<ParseResult>(() => {
    const ast = _parser.parse(this.text(), this.streaming());
    const codeContents: string[] = [];
    collectCodeBlocks(ast, codeContents);
    const codeBlockIndex = { value: 0 };
    const html = renderToHtml(ast, codeBlockIndex);
    return { html, codeContents };
  });

  /** Sanitized HTML bound via [innerHTML]. Re-runs only when text() or streaming() changes. */
  readonly renderedHtml = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(this._parseResult().html)
  );

  /** Raw code content per code block — derived from the parse result. */
  readonly codeBlocks = computed<string[]>(() => this._parseResult().codeContents);

  constructor() {
    // Sync isCopied array length whenever the number of code blocks changes.
    // Uses untracked() to avoid circular dependency — we only read codeBlocks()
    // to determine the new length, then mutate the plain array outside the signal graph.
    effect(() => {
      const count = this.codeBlocks().length;
      untracked(() => {
        while (this.isCopied.length < count) {
          this.isCopied.push(signal(false));
        }
        this.isCopied.length = count;
      });
    },{allowSignalWrites:true});
  }

  onContainerClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Handle copy button clicks
    const copyBtn = target.closest('[data-copy-btn]') as HTMLElement | null;
    if (copyBtn) {
      const indexStr = copyBtn.getAttribute('data-code-index');
      if (indexStr !== null) {
        const idx = parseInt(indexStr, 10);
        this._copyCode(idx);
      }
      return;
    }

    // Handle image clicks
    if (target.tagName === 'IMG') {
      const imgSrc = target.getAttribute('data-img-click') ?? (target as HTMLImageElement).src;
      if (imgSrc) {
        this.imageClick.emit(imgSrc);
      }
    }
  }

  private _copyCode(index: number): void {
    const blocks = this.codeBlocks();
    if (index < 0 || index >= blocks.length) return;
    const code = blocks[index];

    this._writeToClipboard(code);

    const sig = this.isCopied[index];
    if (sig) {
      sig.set(true);
      setTimeout(() => sig.set(false), 2000);
    }
  }

  private _writeToClipboard(text: string): void {
    if (isPlatformBrowser(this.platformId) && navigator?.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {
        // Silently fail per spec: no error surfaced to user
      });
    } else if (isPlatformBrowser(this.platformId)) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
      } catch {
        // Silently fail
      }
      document.body.removeChild(textarea);
    }
  }
}
