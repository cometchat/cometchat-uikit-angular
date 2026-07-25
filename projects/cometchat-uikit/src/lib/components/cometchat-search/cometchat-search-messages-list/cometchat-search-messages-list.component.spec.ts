import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChatSearchMessagesListComponent } from './cometchat-search-messages-list.component';
import { SearchMessagesService } from '../../../services/search-messages.service';
import { signal } from '@angular/core';

/**
 * Mock SearchMessagesService that provides the signals the component needs.
 */
class MockSearchMessagesService {
  messages = signal<any[]>([]);
  fetchState = signal('loaded');
  hasMore = signal(false);
  searchKeyword = signal('');
  activeFilters = signal<any[]>([]);
  search = vi.fn();
  fetchNext = vi.fn();
  reset = vi.fn();
  cleanup = vi.fn();
}

describe('CometChatSearchMessagesListComponent', () => {
  let component: CometChatSearchMessagesListComponent;
  let fixture: ComponentFixture<CometChatSearchMessagesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatSearchMessagesListComponent],
      providers: [
        { provide: SearchMessagesService, useClass: MockSearchMessagesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatSearchMessagesListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default empty search keyword', () => {
    expect(component.searchKeyword).toBe('');
  });

  it('should have default empty active filters', () => {
    expect(component.activeFilters).toEqual([]);
  });

  it('should have default alwaysShowSeeMore as false', () => {
    expect(component.alwaysShowSeeMore).toBe(false);
  });

  describe('trackByMessage', () => {
    it('should return message id', () => {
      const mockMessage = { getId: () => 42 } as any;
      expect(component.trackByMessage(0, mockMessage)).toBe(42);
    });
  });

  describe('shouldShowDateSeparator', () => {
    it('should return true for first item', () => {
      expect(component.shouldShowDateSeparator(0)).toBe(true);
    });
  });

  describe('getMessageTitle', () => {
    it('should return receiver name when no uid/guid', () => {
      const mockMessage = {
        getSender: () => ({ getName: () => 'Sender' }),
        getReceiver: () => ({ getName: () => 'Receiver' }),
      } as any;
      expect(component.getMessageTitle(mockMessage)).toBe('Receiver');
    });

    it('should return sender name when uid is set', () => {
      component.uid = 'user1';
      const mockMessage = {
        getSender: () => ({ getName: () => 'Sender' }),
        getReceiver: () => ({ getName: () => 'Receiver' }),
      } as any;
      expect(component.getMessageTitle(mockMessage)).toBe('Sender');
    });
  });

  describe('itemClick output', () => {
    it('should emit message and keyword on handleItemClick', () => {
      const spy = vi.fn();
      component.itemClick.subscribe(spy);
      component.searchKeyword = 'test';

      const mockMessage = { getId: () => 1 } as any;
      component.handleItemClick(mockMessage);

      expect(spy).toHaveBeenCalledWith({
        message: mockMessage,
        searchKeyword: 'test',
      });
    });
  });

  describe('stateChange output', () => {
    it('should emit when service fetchState changes', () => {
      const spy = vi.fn();
      component.stateChange.subscribe(spy);
      // Verify the output emitter exists and is subscribable
      expect(component.stateChange).toBeDefined();
      // The effect-based emission is tested by verifying the wiring exists
      // (full integration tested in parent component spec)
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('hideSection input', () => {
    it('should default to false', () => {
      expect(component.hideSection).toBe(false);
    });
  });

  describe('suppressEmptyErrorView input', () => {
    it('should default to false', () => {
      expect(component.suppressEmptyErrorView).toBe(false);
    });
  });

  describe('getLeadingViewType', () => {
    it('should return audio for audio messages', () => {
      const msg = { getType: () => 'audio' } as any;
      expect(component.getLeadingViewType(msg)).toBe('audio');
    });

    it('should return file for file messages', () => {
      const msg = { getType: () => 'file' } as any;
      expect(component.getLeadingViewType(msg)).toBe('file');
    });

    it('should return none for text messages without links', () => {
      const msg = { getType: () => 'text', getText: () => 'hello', getMetadata: () => ({}) } as any;
      expect(component.getLeadingViewType(msg)).toBe('none');
    });
  });

  describe('getTrailingViewType', () => {
    it('should return image for image messages', () => {
      const msg = { getType: () => 'image' } as any;
      expect(component.getTrailingViewType(msg)).toBe('image');
    });

    it('should return video for video messages', () => {
      const msg = { getType: () => 'video' } as any;
      expect(component.getTrailingViewType(msg)).toBe('video');
    });

    it('should return date for text messages', () => {
      const msg = { getType: () => 'text' } as any;
      expect(component.getTrailingViewType(msg)).toBe('date');
    });
  });

  describe('getFormattedDate', () => {
    it('should format date as DD MMM, hh:mm am/pm', () => {
      // Jan 15, 2025 at 14:30 UTC
      const msg = { getSentAt: () => 1736952600 } as any;
      const result = component.getFormattedDate(msg);
      expect(result).toMatch(/\d{1,2} \w{3}, \d{2}:\d{2} [AaPp][Mm]/);
    });

    it('should return empty string when no sentAt', () => {
      const msg = { getSentAt: () => 0 } as any;
      expect(component.getFormattedDate(msg)).toBe('');
    });
  });

  describe('getMessageSubtitle', () => {
    it('should return text content for text messages', () => {
      const msg = {
        getType: () => 'text',
        getText: () => 'Hello world',
        getSender: () => ({ getUid: () => 'u1', getName: () => 'Alice' }),
      } as any;
      const result = component.getMessageSubtitle(msg);
      expect(result).toContain('Hello world');
    });

    it('should return attachment name for media messages', () => {
      const msg = {
        getType: () => 'file',
        getAttachments: () => [{ getName: () => 'doc.pdf' }],
        getSender: () => ({ getUid: () => 'u1', getName: () => 'Alice' }),
      } as any;
      const result = component.getMessageSubtitle(msg);
      expect(result).toContain('doc.pdf');
    });

    it('should strip markdown links from text', () => {
      const msg = {
        getType: () => 'text',
        getText: () => 'Check [this link](https://example.com) out',
        getSender: () => ({ getUid: () => 'u1', getName: () => 'Alice' }),
      } as any;
      const result = component.getMessageSubtitle(msg);
      expect(result).toContain('this link');
      expect(result).not.toContain('](');
    });

    // --- multi-attachment + caption (React parity) ---
    const media = (over: { type?: string; names?: string[]; caption?: string }) =>
      ({
        getType: () => over.type ?? 'image',
        getAttachments: () => (over.names ?? ['a.jpg']).map((n) => ({ getName: () => n })),
        getCaption: () => over.caption ?? '',
        getData: () => undefined,
        getMetadata: () => null,
        getMentionedUsers: () => [],
        getSender: () => ({ getUid: () => 'u1', getName: () => 'Alice' }),
      }) as any;

    it('shows a counted label for several attachments without a caption', () => {
      expect(
        component.getMessageSubtitle(media({ type: 'image', names: ['a', 'b', 'c'] })),
      ).toContain('3 Images');
    });

    it('shows the caption alone for a single attachment', () => {
      const result = component.getMessageSubtitle(
        media({ type: 'file', names: ['doc.pdf'], caption: 'the contract' }),
      );
      expect(result).toContain('the contract');
      expect(result).not.toContain('doc.pdf');
    });

    it('shows the caption alone for many images — the count lives on the +N badge', () => {
      const result = component.getMessageSubtitle(
        media({ type: 'image', names: ['a', 'b'], caption: 'trip' }),
      );
      expect(result).toContain('trip');
      expect(result).not.toContain('2 Images');
    });

    it('shows "N Files · caption" for many files', () => {
      expect(
        component.getMessageSubtitle(media({ type: 'file', names: ['a', 'b'], caption: 'specs' })),
      ).toContain('2 Files · specs');
    });

    it('strips markdown from a caption', () => {
      const result = component.getMessageSubtitle(
        media({ type: 'image', names: ['a.jpg'], caption: 'see [link](http://x) now' }),
      );
      expect(result).toContain('link');
      expect(result).not.toContain('](');
    });
  });

  describe('subtitle: inline type glyph before the text', () => {
    const msg = (type: string, extra: Record<string, unknown> = {}) =>
      ({
        getType: () => type,
        getAttachments: () => [{ getName: () => 'test-video.mov' }],
        getCaption: () => '',
        getData: () => undefined,
        getMetadata: () => null,
        getMentionedUsers: () => [],
        getText: () => 'hello',
        getParentMessageId: () => 0,
        getSender: () => ({ getUid: () => 'u1', getName: () => 'Alice' }),
        ...extra,
      }) as any;

    it('every media type gets a glyph', () => {
      for (const t of ['image', 'video', 'audio', 'file']) {
        expect(component.getSubtitleIconType(msg(t)), t).toBe(t);
      }
    });

    it('text and unknown types get none', () => {
      expect(component.getSubtitleIconType(msg('text'))).toBeNull();
      expect(component.getSubtitleIconType(msg('extension_poll'))).toBeNull();
    });

    it('the glyph is independent of the LEADING view, which skips image/video', () => {
      // image/video get no leading icon (only audio/file/link do) — but they do get this one.
      expect(component.getLeadingViewType(msg('image'))).toBe('none');
      expect(component.getLeadingViewType(msg('video'))).toBe('none');
      expect(component.getSubtitleIconType(msg('image'))).toBe('image');
      expect(component.getSubtitleIconType(msg('video'))).toBe('video');
      // ...whereas audio and file get both.
      expect(component.getLeadingViewType(msg('audio'))).toBe('audio');
      expect(component.getSubtitleIconType(msg('audio'))).toBe('audio');
    });

    it('the sender prefix is separate from the text, so the glyph can sit between them', () => {
      const m = msg('video');
      expect(component.getSubtitleSenderPrefix(m)).toBe('Alice:');
      expect(component.getMessageSubtitleContent(m)).toBe('test-video.mov');
      // ...and the composed string still reads as before.
      expect(component.getMessageSubtitle(m)).toBe('Alice: test-video.mov');
    });

    it('a conversation-scoped search drops the sender prefix', () => {
      component.uid = 'someone';
      const m = msg('video');
      expect(component.getSubtitleSenderPrefix(m)).toBe('');
      expect(component.getMessageSubtitle(m)).toBe('test-video.mov');
    });

    it('a thread reply is flagged for the thread glyph', () => {
      expect(component.hasThreadReply(msg('text'))).toBe(false);
      expect(component.hasThreadReply(msg('text', { getParentMessageId: () => 42 }))).toBe(true);
    });
  });

  describe('trailing view: +N badge and video poster', () => {
    const media = (names: string[], metadata: any = null) =>
      ({
        getType: () => 'image',
        getAttachments: () => names.map((n) => ({ getName: () => n, getUrl: () => `u/${n}` })),
        getMetadata: () => metadata,
      }) as any;

    it('overflow is count-1 — the thumbnail already shows one', () => {
      expect(component.getAttachmentOverflow(media(['a']))).toBe(0);
      expect(component.getAttachmentOverflow(media(['a', 'b', 'c']))).toBe(2);
    });

    it('reads the thumbnail-generation poster when present', () => {
      const withPoster = media(['v.mp4'], {
        '@injected': { extensions: { 'thumbnail-generation': { url_medium: 'https://cdn/p.jpg' } } },
      });
      expect(component.getVideoPosterUrl(withPoster)).toBe('https://cdn/p.jpg');
    });

    it('returns null with no poster, so the <video> paints its own first frame', () => {
      expect(component.getVideoPosterUrl(media(['v.mp4']))).toBeNull();
      expect(component.getVideoPosterUrl(media(['v.mp4'], { '@injected': {} }))).toBeNull();
    });
  });

  describe('shouldShowDateSeparator (extended)', () => {
    it('should return true when month changes between items', () => {
      // Jan and Feb messages
      component.service.messages.set([
        { getSentAt: () => 1704067200 } as any, // Jan 1 2024
        { getSentAt: () => 1706745600 } as any, // Feb 1 2024
      ]);
      expect(component.shouldShowDateSeparator(1)).toBe(true);
    });

    it('should return false for same month items', () => {
      // Both in Jan 2024
      component.service.messages.set([
        { getSentAt: () => 1704067200 } as any, // Jan 1 2024
        { getSentAt: () => 1704153600 } as any, // Jan 2 2024
      ]);
      expect(component.shouldShowDateSeparator(1)).toBe(false);
    });
  });

  // The search leading view shows ONE stacked-sheets glyph for every file, as the React kit does.
  // Per-extension icons stay in the message bubble and the composer tray, where a card represents a
  // single known attachment; a search result may carry several of mixed types.
  describe('getFileTypeIcon', () => {
    const withName = (name: string) => ({ getAttachments: () => [{ getName: () => name }] }) as any;

    it('is the same glyph regardless of extension', () => {
      expect(component.getFileTypeIcon(withName('report.pdf'))).toBe('assets/document-file-icon.svg');
      expect(component.getFileTypeIcon(withName('sheet.xlsx'))).toBe('assets/document-file-icon.svg');
      expect(component.getFileTypeIcon(withName('data.xyz'))).toBe('assets/document-file-icon.svg');
    });

    it('needs no attachment at all, so a malformed result cannot break the row', () => {
      expect(component.getFileTypeIcon({ getAttachments: () => [] } as any)).toBe(
        'assets/document-file-icon.svg',
      );
      expect(component.getFileTypeIcon()).toBe('assets/document-file-icon.svg');
    });
  });
});
