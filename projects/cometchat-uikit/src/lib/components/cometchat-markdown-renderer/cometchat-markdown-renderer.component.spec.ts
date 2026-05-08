import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Pipe, PipeTransform } from '@angular/core';
import { vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { CometChatMarkdownRenderer } from './cometchat-markdown-renderer.component';

@Pipe({ name: 'translate', standalone: true })
class MockTranslatePipe implements PipeTransform {
  transform(key: string): string {
    const map: Record<string, string> = {
      ai_assistant_chat_code_copied: 'Copied!',
    };
    return map[key] ?? key;
  }
}

describe('CometChatMarkdownRenderer', () => {
  let fixture: ComponentFixture<CometChatMarkdownRenderer>;
  let component: CometChatMarkdownRenderer;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatMarkdownRenderer],
      providers: [],
    })
      .overrideComponent(CometChatMarkdownRenderer, {
        set: {
          imports: [MockTranslatePipe],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CometChatMarkdownRenderer);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('text', 'Hello');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('renderedHtml computed signal', () => {
    it('should render plain text', () => {
      fixture.componentRef.setInput('text', 'Hello world');
      fixture.detectChanges();
      const container = fixture.nativeElement.querySelector('.cometchat-markdown-renderer__container');
      expect(container.innerHTML).toContain('Hello world');
    });

    it('should render bold markdown', () => {
      fixture.componentRef.setInput('text', '**bold text**');
      fixture.detectChanges();
      const container = fixture.nativeElement.querySelector('.cometchat-markdown-renderer__container');
      expect(container.innerHTML).toContain('<strong');
      expect(container.innerHTML).toContain('bold text');
    });

    it('should render heading markdown', () => {
      fixture.componentRef.setInput('text', '# Heading 1');
      fixture.detectChanges();
      const container = fixture.nativeElement.querySelector('.cometchat-markdown-renderer__container');
      expect(container.innerHTML).toContain('<h1');
      expect(container.innerHTML).toContain('Heading 1');
    });

    it('should render code block with copy button', () => {
      fixture.componentRef.setInput('text', '```js\nconsole.log("hi");\n```');
      fixture.detectChanges();
      const container = fixture.nativeElement.querySelector('.cometchat-markdown-renderer__container');
      expect(container.innerHTML).toContain('cometchat-markdown-renderer__code-block');
      expect(container.innerHTML).toContain('data-copy-btn');
    });

    it('should re-render when text input changes', () => {
      fixture.componentRef.setInput('text', 'First text');
      fixture.detectChanges();
      let container = fixture.nativeElement.querySelector('.cometchat-markdown-renderer__container');
      expect(container.innerHTML).toContain('First text');

      fixture.componentRef.setInput('text', 'Second text');
      fixture.detectChanges();
      container = fixture.nativeElement.querySelector('.cometchat-markdown-renderer__container');
      expect(container.innerHTML).toContain('Second text');
      expect(container.innerHTML).not.toContain('First text');
    });

    it('should re-render when streaming input changes', () => {
      fixture.componentRef.setInput('text', '```\ncode');
      fixture.componentRef.setInput('streaming', false);
      fixture.detectChanges();
      const htmlNonStreaming = component.renderedHtml();

      fixture.componentRef.setInput('streaming', true);
      fixture.detectChanges();
      const htmlStreaming = component.renderedHtml();

      // Both should produce a result (streaming mode renders partial as plain text)
      expect(htmlNonStreaming).toBeTruthy();
      expect(htmlStreaming).toBeTruthy();
    });
  });

  describe('isCopied signals', () => {
    it('should create isCopied signals parallel to code blocks', () => {
      fixture.componentRef.setInput('text', '```js\ncode1\n```\n\n```py\ncode2\n```');
      fixture.detectChanges();
      expect(component.isCopied.length).toBe(2);
    });

    it('should start with isCopied false for each code block', () => {
      fixture.componentRef.setInput('text', '```js\nconst x = 1;\n```');
      fixture.detectChanges();
      expect(component.isCopied[0]()).toBe(false);
    });

    it('should set isCopied[i] to true on copy button click and revert after 2s', async () => {
      // Define navigator.clipboard if not available in jsdom
      if (!navigator.clipboard) {
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: () => Promise.resolve() },
          configurable: true,
        });
      }
      const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
      vi.useFakeTimers();

      fixture.componentRef.setInput('text', '```js\nconst x = 1;\n```');
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('.cometchat-markdown-renderer__container');
      const copyBtn = container.querySelector('[data-copy-btn]') as HTMLElement;
      expect(copyBtn).toBeTruthy();

      copyBtn.click();
      expect(component.isCopied[0]()).toBe(true);

      vi.advanceTimersByTime(2001);
      expect(component.isCopied[0]()).toBe(false);

      vi.useRealTimers();
      clipboardSpy.mockRestore();
    });
  });

  describe('imageClick output', () => {
    it('should emit imageClick when an image is clicked', () => {
      fixture.componentRef.setInput('text', '![alt text](https://example.com/img.png)');
      fixture.detectChanges();

      let emittedUrl: string | undefined;
      component.imageClick.subscribe((url: string) => (emittedUrl = url));

      const container = fixture.nativeElement.querySelector('.cometchat-markdown-renderer__container');
      const img = container.querySelector('img') as HTMLImageElement;
      expect(img).toBeTruthy();

      img.click();
      expect(emittedUrl).toBe('https://example.com/img.png');
    });
  });

  describe('XSS prevention', () => {
    it('should escape raw HTML in input', () => {
      fixture.componentRef.setInput('text', '<script>alert("xss")</script>');
      fixture.detectChanges();
      const container = fixture.nativeElement.querySelector('.cometchat-markdown-renderer__container');
      expect(container.innerHTML).not.toContain('<script>');
      expect(container.innerHTML).toContain('&lt;script&gt;');
    });
  });

  describe('codeBlocks signal', () => {
    it('should store raw code content for each code block', () => {
      fixture.componentRef.setInput('text', '```js\nconsole.log("hello");\n```');
      fixture.detectChanges();
      const blocks = component.codeBlocks();
      expect(blocks.length).toBe(1);
      expect(blocks[0]).toBe('console.log("hello");');
    });
  });
});
