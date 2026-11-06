// The calls SDK reaches for JitsiMeetJS at import time, which jsdom has no window for.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSearchMessagesListComponent } from './cometchat-search-messages-list.component';
import { SearchMessagesService } from '../../../services/search-messages.service';
import { CometChatLocalize } from '../../../resources/CometChatLocalize';

/**
 * The real service talks to the SDK. Only the signals the helpers under test read
 * matter here, plus the three methods the component calls.
 *
 * `loadMore` — NOT `fetchNext` — is the name the component uses; a mock with the
 * wrong name makes the pagination handlers throw instead of resolving.
 */
class MockSearchMessagesService {
  messages = signal<any[]>([]);
  fetchState = signal('loaded');
  hasMoreResults = signal(false);
  search = vi.fn().mockResolvedValue(undefined);
  loadMore = vi.fn().mockResolvedValue(undefined);
  reset = vi.fn();
}

/** Epoch SECONDS — the component multiplies by 1000 itself. */
const JAN_1_2024 = Date.UTC(2024, 0, 1) / 1000;
const JAN_15_2024 = Date.UTC(2024, 0, 15) / 1000;
const FEB_1_2024 = Date.UTC(2024, 1, 1) / 1000;
const JAN_1_2025 = Date.UTC(2025, 0, 1) / 1000;
/** 2024-02-01T00:30:00Z — still January in any of the Americas. */
const FEB_1_2024_00_30_UTC = Date.UTC(2024, 1, 1, 0, 30) / 1000;

/** A message stub carrying only the accessors the method under test reaches for. */
const msg = (over: Record<string, unknown> = {}): CometChat.BaseMessage =>
  ({
    getId: () => 1,
    getType: () => 'text',
    getCategory: () => 'message',
    ...over,
  }) as unknown as CometChat.BaseMessage;

const linkPreviewMeta = (links: unknown[]) => ({
  '@injected': { extensions: { 'link-preview': { links } } },
});

const thumbnailMeta = (urlMedium: unknown) => ({
  '@injected': { extensions: { 'thumbnail-generation': { url_medium: urlMedium } } },
});

/** An object whose first property access blows up, to drive the catch branches. */
const explodingMetadata = () => {
  const o = {};
  Object.defineProperty(o, '@injected', {
    get() {
      throw new Error('metadata unavailable');
    },
  });
  return o;
};

const attachment = (url: string) => ({ getUrl: () => url, getName: () => 'a.bin' });

describe('CometChatSearchMessagesListComponent — dates and leading/trailing views', () => {
  let component: CometChatSearchMessagesListComponent;
  let fixture: ComponentFixture<CometChatSearchMessagesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatSearchMessagesListComponent],
      providers: [{ provide: SearchMessagesService, useClass: MockSearchMessagesService }],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatSearchMessagesListComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // formatMonthSeparator
  // ─────────────────────────────────────────────────────────────────────────
  describe('formatMonthSeparator', () => {
    it('returns an empty heading for a zero timestamp', () => {
      const formatDate = vi.spyOn(CometChatLocalize, 'formatDate');
      expect(component.formatMonthSeparator(0)).toBe('');
      expect(formatDate).not.toHaveBeenCalled();
    });

    it('returns an empty heading for a timestamp that is not a number', () => {
      expect(component.formatMonthSeparator(NaN)).toBe('');
      expect(component.formatMonthSeparator(undefined as unknown as number)).toBe('');
    });

    it('renders month and year through Intl, never through the pattern formatter', () => {
      vi.spyOn(CometChatLocalize, 'getDateLocaleLanguage').mockReturnValue('en-US');
      vi.spyOn(CometChatLocalize, 'getTimezone').mockReturnValue('UTC');
      const formatDate = vi.spyOn(CometChatLocalize, 'formatDate');

      expect(component.formatMonthSeparator(JAN_15_2024)).toBe('January 2024');
      // 'MMMM YYYY' would also render "January 2024", so the output alone cannot
      // tell the two paths apart — only the untouched fallback can.
      expect(formatDate).not.toHaveBeenCalled();
    });

    it('lets the locale choose the order of month and year', () => {
      vi.spyOn(CometChatLocalize, 'getDateLocaleLanguage').mockReturnValue('ja-JP');
      vi.spyOn(CometChatLocalize, 'getTimezone').mockReturnValue('UTC');

      // Japanese writes year first; a hard-coded 'MMMM YYYY' would read backwards.
      expect(component.formatMonthSeparator(FEB_1_2024)).toBe('2024年2月');
    });

    it('honours the configured timezone, not the host one', () => {
      vi.spyOn(CometChatLocalize, 'getDateLocaleLanguage').mockReturnValue('en-US');
      const timezone = vi.spyOn(CometChatLocalize, 'getTimezone').mockReturnValue('UTC');

      expect(component.formatMonthSeparator(FEB_1_2024_00_30_UTC)).toBe('February 2024');
      expect(timezone).toHaveBeenCalled();

      timezone.mockReturnValue('America/New_York');
      // Half past midnight UTC is still the previous month in New York, so the
      // heading must move with the rows beneath it.
      expect(component.formatMonthSeparator(FEB_1_2024_00_30_UTC)).toBe('January 2024');
    });

    it('falls back to the pattern formatter when the locale tag is unusable', () => {
      // A single-letter tag is structurally invalid, so Intl throws a RangeError.
      vi.spyOn(CometChatLocalize, 'getDateLocaleLanguage').mockReturnValue('e');
      vi.spyOn(CometChatLocalize, 'getTimezone').mockReturnValue('UTC');
      const formatDate = vi.spyOn(CometChatLocalize, 'formatDate').mockReturnValue('January 2024');

      expect(component.formatMonthSeparator(JAN_15_2024)).toBe('January 2024');
      expect(formatDate).toHaveBeenCalledWith(JAN_15_2024, {
        today: 'MMMM YYYY',
        yesterday: 'MMMM YYYY',
        lastWeek: 'MMMM YYYY',
        otherDays: 'MMMM YYYY',
      });
    });

    it('falls back when the configured timezone is unknown', () => {
      vi.spyOn(CometChatLocalize, 'getDateLocaleLanguage').mockReturnValue('en-US');
      vi.spyOn(CometChatLocalize, 'getTimezone').mockReturnValue('Mars/Olympus');
      const formatDate = vi.spyOn(CometChatLocalize, 'formatDate').mockReturnValue('fallback');

      expect(component.formatMonthSeparator(FEB_1_2024)).toBe('fallback');
      expect(formatDate).toHaveBeenCalledTimes(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // shouldShowDateSeparator
  // ─────────────────────────────────────────────────────────────────────────
  describe('shouldShowDateSeparator', () => {
    const atSecond = (sentAt: number | undefined) => msg({ getSentAt: () => sentAt });

    it('always shows a separator above the first result', () => {
      component.service.messages.set([atSecond(JAN_1_2024), atSecond(JAN_15_2024)]);
      expect(component.shouldShowDateSeparator(0)).toBe(true);

      // The index is checked before the list is read, so an empty list is fine too.
      component.service.messages.set([]);
      expect(component.shouldShowDateSeparator(0)).toBe(true);
    });

    it('hides the separator inside the same month', () => {
      component.service.messages.set([atSecond(JAN_1_2024), atSecond(JAN_15_2024)]);
      expect(component.shouldShowDateSeparator(1)).toBe(false);
    });

    it('shows a separator when the month changes', () => {
      // Also pins the seconds-to-milliseconds conversion: read as milliseconds both
      // stamps land in January 1970, collapsing into one month and hiding this.
      component.service.messages.set([atSecond(JAN_15_2024), atSecond(FEB_1_2024)]);
      expect(component.shouldShowDateSeparator(1)).toBe(true);
    });

    it('shows a separator when only the year changes', () => {
      component.service.messages.set([atSecond(JAN_1_2024), atSecond(JAN_1_2025)]);
      expect(component.shouldShowDateSeparator(1)).toBe(true);
    });

    it('hides the separator when the current result has no timestamp', () => {
      component.service.messages.set([atSecond(JAN_1_2024), atSecond(undefined)]);
      expect(component.shouldShowDateSeparator(1)).toBe(false);
    });

    it('hides the separator when the previous result has no timestamp', () => {
      component.service.messages.set([atSecond(0), atSecond(FEB_1_2024)]);
      expect(component.shouldShowDateSeparator(1)).toBe(false);
    });

    it('hides the separator for an index past the end of the list', () => {
      component.service.messages.set([atSecond(JAN_1_2024)]);
      expect(component.shouldShowDateSeparator(5)).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getMessageIndex
  // ─────────────────────────────────────────────────────────────────────────
  describe('getMessageIndex', () => {
    const withId = (id: number) => msg({ getId: () => id });

    it('finds the position of a loaded message', () => {
      component.service.messages.set([withId(10), withId(20), withId(30)]);
      expect(component.getMessageIndex(withId(10))).toBe(0);
      expect(component.getMessageIndex(withId(30))).toBe(2);
    });

    it('returns -1 for a message that is not in the results', () => {
      component.service.messages.set([withId(10), withId(20)]);
      expect(component.getMessageIndex(withId(99))).toBe(-1);
    });

    it('returns -1 when nothing is loaded', () => {
      component.service.messages.set([]);
      expect(component.getMessageIndex(withId(10))).toBe(-1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getLeadingViewType
  // ─────────────────────────────────────────────────────────────────────────
  describe('getLeadingViewType', () => {
    const text = (body: string, metadata: unknown = {}) =>
      msg({ getType: () => 'text', getText: () => body, getMetadata: () => metadata });

    it('is audio for an audio result', () => {
      expect(component.getLeadingViewType(msg({ getType: () => 'audio' }))).toBe('audio');
    });

    it('is file for a file result', () => {
      expect(component.getLeadingViewType(msg({ getType: () => 'file' }))).toBe('file');
    });

    it('is link when the link-preview extension ran, whatever the text says', () => {
      const m = text('read this', linkPreviewMeta([{ favicon: 'https://x.com/f.ico' }]));
      expect(component.getLeadingViewType(m)).toBe('link');
    });

    it('is link when the text itself is a bare URL and no preview was injected', () => {
      expect(component.getLeadingViewType(text('https://example.com'))).toBe('link');
    });

    it('is link when a URL sits mid-sentence', () => {
      expect(component.getLeadingViewType(text('see https://example.com/docs for more'))).toBe('link');
    });

    it('is none for a text result with neither a preview nor a URL', () => {
      expect(component.getLeadingViewType(text('just talking'))).toBe('none');
    });

    it('is none for a text result whose preview links array is empty', () => {
      expect(component.getLeadingViewType(text('just talking', linkPreviewMeta([])))).toBe('none');
    });

    it('is none for image, video and unknown types', () => {
      for (const type of ['image', 'video', 'extension_poll']) {
        expect(component.getLeadingViewType(msg({ getType: () => type })), type).toBe('none');
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getFileTypeIcon
  // ─────────────────────────────────────────────────────────────────────────
  describe('getFileTypeIcon', () => {
    it('is one stacked-sheets glyph for every file result', () => {
      const pdf = msg({ getAttachments: () => [{ getName: () => 'a.pdf' }] });
      const zip = msg({ getAttachments: () => [{ getName: () => 'a.zip' }] });
      expect(component.getFileTypeIcon(pdf)).toBe('assets/document-file-icon.svg');
      expect(component.getFileTypeIcon(zip)).toBe('assets/document-file-icon.svg');
    });

    it('needs no message at all', () => {
      expect(component.getFileTypeIcon()).toBe('assets/document-file-icon.svg');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getLinkFavicon
  // ─────────────────────────────────────────────────────────────────────────
  describe('getLinkFavicon', () => {
    const withMetadata = (metadata: unknown) => msg({ getMetadata: () => metadata });

    it('returns the favicon of the first previewed link', () => {
      const m = withMetadata(linkPreviewMeta([{ favicon: 'https://x.com/f.ico' }]));
      expect(component.getLinkFavicon(m)).toBe('https://x.com/f.ico');
    });

    it('ignores later links when several were previewed', () => {
      const m = withMetadata(
        linkPreviewMeta([{ favicon: 'https://first.com/f.ico' }, { favicon: 'https://second.com/f.ico' }])
      );
      expect(component.getLinkFavicon(m)).toBe('https://first.com/f.ico');
    });

    it('is null when the first previewed link carries no favicon', () => {
      const m = withMetadata(linkPreviewMeta([{ title: 'no icon here' }]));
      expect(component.getLinkFavicon(m)).toBeNull();
    });

    it('is null when the preview links array is empty', () => {
      expect(component.getLinkFavicon(withMetadata(linkPreviewMeta([])))).toBeNull();
    });

    it('is null when the link-preview extension did not run', () => {
      expect(component.getLinkFavicon(withMetadata({ '@injected': { extensions: {} } }))).toBeNull();
      expect(component.getLinkFavicon(withMetadata(null))).toBeNull();
    });

    it('is null when reading the metadata throws', () => {
      const m = msg({
        getMetadata: () => {
          throw new Error('no metadata');
        },
      });
      expect(component.getLinkFavicon(m)).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getTrailingViewType
  // ─────────────────────────────────────────────────────────────────────────
  describe('getTrailingViewType', () => {
    it('is image for an image result', () => {
      expect(component.getTrailingViewType(msg({ getType: () => 'image' }))).toBe('image');
    });

    it('is video for a video result', () => {
      expect(component.getTrailingViewType(msg({ getType: () => 'video' }))).toBe('video');
    });

    it('is the date for everything else', () => {
      for (const type of ['text', 'audio', 'file', 'extension_poll']) {
        expect(component.getTrailingViewType(msg({ getType: () => type })), type).toBe('date');
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getAttachmentOverflow
  // ─────────────────────────────────────────────────────────────────────────
  describe('getAttachmentOverflow', () => {
    const withAttachments = (count: number) =>
      msg({ getAttachments: () => Array.from({ length: count }, (_, i) => attachment(`u/${i}`)) });

    it('is zero for a single attachment, which the thumbnail already shows', () => {
      expect(component.getAttachmentOverflow(withAttachments(1))).toBe(0);
    });

    it('never goes negative when the result has no attachments', () => {
      expect(component.getAttachmentOverflow(withAttachments(0))).toBe(0);
    });

    it('counts the hidden attachments behind the thumbnail', () => {
      expect(component.getAttachmentOverflow(withAttachments(2))).toBe(1);
      expect(component.getAttachmentOverflow(withAttachments(5))).toBe(4);
    });

    it('is zero when the result exposes no attachments accessor at all', () => {
      expect(component.getAttachmentOverflow(msg())).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getVideoPosterUrl
  // ─────────────────────────────────────────────────────────────────────────
  describe('getVideoPosterUrl', () => {
    const withMetadata = (metadata: unknown) => msg({ getMetadata: () => metadata });

    it('returns the poster the thumbnail-generation extension supplied', () => {
      expect(component.getVideoPosterUrl(withMetadata(thumbnailMeta('https://cdn/p.jpg')))).toBe(
        'https://cdn/p.jpg'
      );
    });

    it('is null for an empty poster url, so the video paints its own frame', () => {
      expect(component.getVideoPosterUrl(withMetadata(thumbnailMeta('')))).toBeNull();
    });

    it('is null when the poster url is not a string', () => {
      expect(component.getVideoPosterUrl(withMetadata(thumbnailMeta(42)))).toBeNull();
      expect(component.getVideoPosterUrl(withMetadata(thumbnailMeta({ url: 'x' })))).toBeNull();
    });

    it('is null when the extension did not run', () => {
      expect(component.getVideoPosterUrl(withMetadata(null))).toBeNull();
      expect(component.getVideoPosterUrl(withMetadata({}))).toBeNull();
      expect(component.getVideoPosterUrl(withMetadata({ '@injected': { extensions: {} } }))).toBeNull();
    });

    it('is null when the result exposes no metadata accessor', () => {
      expect(component.getVideoPosterUrl(msg())).toBeNull();
    });

    it('is null when reading the metadata throws', () => {
      const m = msg({
        getMetadata: () => {
          throw new Error('no metadata');
        },
      });
      expect(component.getVideoPosterUrl(m)).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getAttachmentUrl
  // ─────────────────────────────────────────────────────────────────────────
  describe('getAttachmentUrl', () => {
    it('is the url of the first attachment', () => {
      const m = msg({ getAttachments: () => [attachment('https://cdn/one.jpg')] });
      expect(component.getAttachmentUrl(m)).toBe('https://cdn/one.jpg');
    });

    it('ignores the remaining attachments', () => {
      const m = msg({
        getAttachments: () => [attachment('https://cdn/one.jpg'), attachment('https://cdn/two.jpg')],
      });
      expect(component.getAttachmentUrl(m)).toBe('https://cdn/one.jpg');
    });

    it('is empty when the attachments array is empty', () => {
      expect(component.getAttachmentUrl(msg({ getAttachments: () => [] }))).toBe('');
    });

    it('is empty when there is no attachments array', () => {
      expect(component.getAttachmentUrl(msg({ getAttachments: () => undefined }))).toBe('');
    });

    it('is empty when the attachment has no url', () => {
      expect(component.getAttachmentUrl(msg({ getAttachments: () => [attachment('')] }))).toBe('');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // getFormattedDate
  // ─────────────────────────────────────────────────────────────────────────
  describe('getFormattedDate', () => {
    it('is empty when the result has no timestamp', () => {
      const formatDate = vi.spyOn(CometChatLocalize, 'formatDate');
      expect(component.getFormattedDate(msg({ getSentAt: () => 0 }))).toBe('');
      expect(formatDate).not.toHaveBeenCalled();
    });

    it("builds its pattern from the locale's own time pattern", () => {
      vi.spyOn(CometChatLocalize, 'getTimePattern').mockReturnValue('HH:mm');
      const formatDate = vi.spyOn(CometChatLocalize, 'formatDate').mockReturnValue('15 Jan, 09:30');

      expect(component.getFormattedDate(msg({ getSentAt: () => JAN_15_2024 }))).toBe('15 Jan, 09:30');
      expect(formatDate).toHaveBeenCalledWith(JAN_15_2024, {
        today: 'D MMM, HH:mm',
        yesterday: 'D MMM, HH:mm',
        lastWeek: 'D MMM, HH:mm',
        otherDays: 'D MMM, HH:mm',
      });
    });

    it('follows a 12-hour locale when that is what the pattern says', () => {
      vi.spyOn(CometChatLocalize, 'getTimePattern').mockReturnValue('hh:mm A');
      const formatDate = vi.spyOn(CometChatLocalize, 'formatDate').mockReturnValue('x');

      component.getFormattedDate(msg({ getSentAt: () => JAN_15_2024 }));

      expect(formatDate.mock.calls[0][1].today).toBe('D MMM, hh:mm A');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // trackByMessage
  // ─────────────────────────────────────────────────────────────────────────
  describe('trackByMessage', () => {
    it('keys a row by the message id, not by its position', () => {
      expect(component.trackByMessage(0, msg({ getId: () => 77 }))).toBe(77);
      expect(component.trackByMessage(9, msg({ getId: () => 77 }))).toBe(77);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // hasLinkPreview (private)
  // ─────────────────────────────────────────────────────────────────────────
  describe('hasLinkPreview', () => {
    const hasLinkPreview = (metadata: unknown): boolean =>
      (component as any).hasLinkPreview(metadata);

    it('is true when the extension previewed at least one link', () => {
      expect(hasLinkPreview(linkPreviewMeta([{ url: 'https://x.com' }]))).toBe(true);
    });

    it('is false when the links array is empty', () => {
      expect(hasLinkPreview(linkPreviewMeta([]))).toBe(false);
    });

    it('is false when there is no link-preview section', () => {
      expect(hasLinkPreview({ '@injected': { extensions: {} } })).toBe(false);
      expect(hasLinkPreview({})).toBe(false);
      expect(hasLinkPreview(undefined)).toBe(false);
      expect(hasLinkPreview(null)).toBe(false);
    });

    it('is false when reading the metadata throws', () => {
      expect(hasLinkPreview(explodingMetadata())).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // isURL (private)
  // ─────────────────────────────────────────────────────────────────────────
  describe('isURL', () => {
    const isURL = (text: string): boolean => (component as any).isURL(text);

    it('is false for empty text', () => {
      expect(isURL('')).toBe(false);
      expect(isURL(undefined as unknown as string)).toBe(false);
    });

    it('is true for an https url', () => {
      expect(isURL('https://x.com')).toBe(true);
    });

    it('is true for an http url', () => {
      expect(isURL('http://x.com')).toBe(true);
    });

    it('is true for a url with surrounding whitespace', () => {
      expect(isURL('  https://x.com  ')).toBe(true);
    });

    it('is true for a url embedded mid-sentence', () => {
      expect(isURL('have a look at https://x.com/page today')).toBe(true);
    });

    it('is false for ordinary prose', () => {
      expect(isURL('no links in this one')).toBe(false);
      expect(isURL('x.com is not a url here')).toBe(false);
    });

    it('is false for a scheme it does not recognise', () => {
      expect(isURL('ftp://x')).toBe(false);
    });
  });
});
