// The calls SDK reaches for JitsiMeetJS at import time, which jsdom does not provide.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSearchMessagesListComponent } from './cometchat-search-messages-list.component';
import { SearchMessagesService } from '../../../services/search-messages.service';
import { HtmlSanitizerService } from '../../../services/html-sanitizer.service';
import { States } from '../../../Enums/Enums';

/**
 * Stand-in for the real service. `loadMore` is the name the component calls — a mock that
 * spells it `fetchNext` leaves the pagination paths silently unexercised.
 */
class MockSearchMessagesService {
  messages = signal<any[]>([]);
  fetchState = signal<States>(States.loaded);
  hasMore = signal(false);
  hasMoreResults = signal(false);
  search = vi.fn().mockResolvedValue(undefined);
  loadMore = vi.fn().mockResolvedValue(undefined);
  reset = vi.fn();
}

/** The exact config the subtitle sanitizer is contracted to pass to DOMPurify. */
const EXPECTED_SANITIZER_CONFIG = {
  ALLOWED_TAGS: ['span', 'strong', 'em', 'b', 'i', 'u', 's', 'code', 'a'],
  ALLOWED_ATTR: [
    'class',
    'data-uid',
    'data-mention-type',
    'data-hashtag',
    'href',
    'target',
    'rel',
    'style',
  ],
};

function user(uid: string, name: string): CometChat.User {
  return { getUid: () => uid, getName: () => name } as unknown as CometChat.User;
}

function textMessage(
  text: unknown,
  options: { mentionedUsers?: CometChat.User[]; omitMentionAccessor?: boolean } = {}
): CometChat.BaseMessage {
  const base: Record<string, unknown> = {
    getId: () => 1,
    getType: () => 'text',
    getCategory: () => 'message',
    getText: () => text,
  };
  if (!options.omitMentionAccessor) {
    base['getMentionedUsers'] = () => options.mentionedUsers ?? [];
  }
  return base as unknown as CometChat.BaseMessage;
}

function mediaMessage(options: {
  type?: string;
  caption?: string;
  dataText?: string;
  attachmentNames?: string[];
  mentionedUsers?: CometChat.User[];
  metadata?: Record<string, unknown> | null;
  /** Drop getMentionedUsers entirely, as an older SDK build would. */
  omitMentionAccessor?: boolean;
}): CometChat.BaseMessage {
  const names = options.attachmentNames ?? ['holiday.jpg'];
  const attachments = names.map(name => ({ getName: () => name, getUrl: () => `https://cdn/${name}` }));
  const base: Record<string, unknown> = {
    getId: () => 7,
    getType: () => options.type ?? 'image',
    getCategory: () => 'message',
    getAttachments: () => attachments,
    getCaption: () => options.caption,
    getData: () => (options.dataText === undefined ? null : { text: options.dataText }),
    getMetadata: () => options.metadata ?? null,
  };
  if (!options.omitMentionAccessor) {
    base['getMentionedUsers'] = () => options.mentionedUsers ?? [];
  }
  return base as unknown as CometChat.BaseMessage;
}

describe('CometChatSearchMessagesListComponent — subtitle sanitizing and mentions', () => {
  let component: CometChatSearchMessagesListComponent;
  let sanitizer: HtmlSanitizerService;

  /** Call the private list/markup pre-processor + sanitizer directly. */
  const sanitize = (html: string): string =>
    (component as unknown as { sanitizeSubtitleHtml: (h: string) => string }).sanitizeSubtitleHtml(html);

  /** Call the private mention-tag formatter directly. */
  const formatMentions = (text: unknown, users: CometChat.User[]): string =>
    (
      component as unknown as {
        formatPlainMentions: (t: unknown, u: CometChat.User[]) => string;
      }
    ).formatPlainMentions(text, users);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatSearchMessagesListComponent],
      providers: [{ provide: SearchMessagesService, useClass: MockSearchMessagesService }],
    }).compileComponents();

    const fixture = TestBed.createComponent(CometChatSearchMessagesListComponent);
    component = fixture.componentInstance;
    sanitizer = TestBed.inject(HtmlSanitizerService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sanitizeSubtitleHtml — ordered lists', () => {
    it('numbers a three-item ordered list 1, 2, 3 in order', () => {
      expect(sanitize('<ol><li>alpha</li><li>beta</li><li>gamma</li></ol>')).toBe(
        '1. alpha 2. beta 3. gamma'
      );
    });

    it('restarts the counter at 1 in a second ordered list', () => {
      const out = sanitize('<ol><li>a</li><li>b</li></ol><ol><li>c</li><li>d</li></ol>');
      expect(out).toBe('1. a 2. b 1. c 2. d');
    });

    it('keeps numbering items that carry attributes on the li tag', () => {
      expect(sanitize('<ol><li class="x">a</li><li data-k="v">b</li></ol>')).toBe('1. a 2. b');
    });

    it('ignores a start attribute on the ol and still begins at 1', () => {
      expect(sanitize('<ol start="5"><li>a</li><li>b</li></ol>')).toBe('1. a 2. b');
    });

    it('handles uppercase OL/LI tags', () => {
      expect(sanitize('<OL><LI>a</LI><LI>b</LI></OL>')).toBe('1. a 2. b');
    });

    it('leaves an ordered list with no items untouched apart from tag removal', () => {
      expect(sanitize('<ol>nothing listed</ol>')).toBe('nothing listed');
    });
  });

  describe('sanitizeSubtitleHtml — unordered lists', () => {
    it('prefixes every unordered item with a bullet', () => {
      expect(sanitize('<ul><li>one</li><li>two</li><li>three</li></ul>')).toBe('• one • two • three');
    });

    it('bullets items in a second unordered list too', () => {
      expect(sanitize('<ul><li>a</li></ul><ul><li>b</li></ul>')).toBe('• a • b');
    });

    it('keeps bulleting items that carry attributes on the li tag', () => {
      expect(sanitize('<ul class="c"><li class="x">a</li></ul>')).toBe('• a');
    });
  });

  describe('sanitizeSubtitleHtml — mixed and nested lists', () => {
    it('numbers the ordered list and bullets the unordered one when both are present', () => {
      expect(sanitize('<ol><li>one</li></ol><ul><li>two</li></ul>')).toBe('1. one • two');
    });

    it('bullets the outer item but glues the nested number to the text it follows', () => {
      // The inner <ol> is rewritten first, so "1. " lands immediately after the outer
      // item's text with no separator — documented here as observed, not as desirable.
      expect(sanitize('<ul><li>outer<ol><li>inner</li></ol></li></ul>')).toBe('• outer1. inner');
    });
  });

  describe('sanitizeSubtitleHtml — block-level closing tags', () => {
    it('turns a paragraph break into a space', () => {
      expect(sanitize('<p>one</p><p>two</p>')).toBe('one two');
    });

    it('turns a blockquote close into a space', () => {
      expect(sanitize('<blockquote>quoted</blockquote>after')).toBe('quoted after');
    });

    it('turns an h1 close into a space', () => {
      expect(sanitize('<h1>Title</h1>Body')).toBe('Title Body');
    });

    it('turns an h6 close into a space', () => {
      expect(sanitize('<h6>Small</h6>Body')).toBe('Small Body');
    });

    it('turns a stray li close outside any list into a space', () => {
      expect(sanitize('<li>item</li>tail')).toBe('item tail');
    });
  });

  describe('sanitizeSubtitleHtml — sanitizer contract', () => {
    it('passes the inline-only ALLOWED_TAGS and ALLOWED_ATTR lists to the sanitizer', () => {
      const spy = vi.spyOn(sanitizer, 'sanitizeWithConfig');
      sanitize('<strong>hi</strong>');
      expect(spy).toHaveBeenCalledWith('<strong>hi</strong>', EXPECTED_SANITIZER_CONFIG);
    });

    it('sanitizes the list-marker-rewritten html, not the original', () => {
      const spy = vi.spyOn(sanitizer, 'sanitizeWithConfig');
      sanitize('<ol><li>a</li></ol>');
      expect(spy.mock.calls[0]?.[0]).toBe('1. a ');
    });

    it('keeps allowed inline formatting tags', () => {
      expect(sanitize('<strong>bold</strong> and <em>italic</em>')).toBe(
        '<strong>bold</strong> and <em>italic</em>'
      );
    });

    it('keeps mention spans with their data attributes', () => {
      const out = sanitize('<span class="mention" data-uid="u1">@Alice</span>');
      expect(out).toContain('data-uid="u1"');
      expect(out).toContain('class="mention"');
    });

    it('keeps an anchor href while the sanitizer hardens the link', () => {
      const out = sanitize('<a href="https://example.com">link</a>');
      expect(out).toContain('href="https://example.com"');
      expect(out).toContain('target="_blank"');
    });

    it('drops a disallowed wrapper tag but keeps its text', () => {
      expect(sanitize('<div>kept</div>')).toBe('kept');
    });

    it('drops an image tag entirely', () => {
      expect(sanitize('<img src="x.png">text')).toBe('text');
    });

    it('returns an empty string for whitespace-only input', () => {
      expect(sanitize('   \n  ')).toBe('');
    });
  });

  describe('sanitizeSubtitleHtml — final single-line cleanup', () => {
    it('replaces newlines with spaces', () => {
      expect(sanitize('one\ntwo')).toBe('one two');
    });

    it('collapses a run of spaces into one', () => {
      expect(sanitize('one     two')).toBe('one two');
    });

    it('trims leading and trailing whitespace', () => {
      expect(sanitize('  padded  ')).toBe('padded');
    });

    it('applies newline, collapse and trim together', () => {
      expect(sanitize('  one\n\ntwo    three  ')).toBe('one two three');
    });
  });

  describe('formatPlainMentions', () => {
    it('returns an empty string for empty or absent text without consulting the users', () => {
      expect(formatMentions('', [user('u1', 'Alice')])).toBe('');
      expect(formatMentions(undefined, [user('u1', 'Alice')])).toBe('');
    });

    it('replaces a uid tag with the mentioned user display name', () => {
      expect(formatMentions('hi <@uid:u1>', [user('u1', 'Alice')])).toBe('hi @Alice');
    });

    it('falls back to the uid when the mentioned user is not hydrated', () => {
      expect(formatMentions('hi <@uid:u1>', [])).toBe('hi @u1');
    });

    it('falls back to the uid when the hydrated user has a blank name', () => {
      expect(formatMentions('hi <@uid:u1>', [user('u1', '')])).toBe('hi @u1');
    });

    it('replaces two different uid tags independently', () => {
      expect(
        formatMentions('<@uid:u1> and <@uid:u2>', [user('u1', 'Alice'), user('u2', 'Bob')])
      ).toBe('@Alice and @Bob');
    });

    it('replaces the same uid tag everywhere it appears', () => {
      expect(formatMentions('<@uid:u1> ping <@uid:u1>', [user('u1', 'Alice')])).toBe(
        '@Alice ping @Alice'
      );
    });

    it('resolves one uid and falls back on the other in the same string', () => {
      expect(formatMentions('<@uid:u1> <@uid:u9>', [user('u1', 'Alice')])).toBe('@Alice @u9');
    });

    it('turns an all tag into @everyone using its label', () => {
      expect(formatMentions('<@all:everyone>', [])).toBe('@everyone');
    });

    it('uses whatever label the all tag carries', () => {
      expect(formatMentions('ping <@all:here> now', [])).toBe('ping @here now');
    });

    it('replaces a uid tag and an all tag in the same string', () => {
      expect(formatMentions('<@uid:u1> told <@all:everyone>', [user('u1', 'Alice')])).toBe(
        '@Alice told @everyone'
      );
    });

    it('returns text with no mention tags unchanged', () => {
      expect(formatMentions('plain text with no tags', [user('u1', 'Alice')])).toBe(
        'plain text with no tags'
      );
    });

    it('leaves surrounding punctuation and spacing intact', () => {
      expect(formatMentions('Hey, <@uid:u1>! Ready?', [user('u1', 'Alice')])).toBe(
        'Hey, @Alice! Ready?'
      );
    });
  });

  describe('getMessageSubtitleContent — text messages', () => {
    it('returns plain text as-is', () => {
      expect(component.getMessageSubtitleContent(textMessage('hello there'))).toBe('hello there');
    });

    it('reduces a markdown link to its label', () => {
      expect(
        component.getMessageSubtitleContent(textMessage('see [the docs](https://example.com/a)'))
      ).toBe('see the docs');
    });

    it('reduces every markdown link in the text', () => {
      expect(
        component.getMessageSubtitleContent(
          textMessage('[one](https://a.test) then [two](https://b.test)')
        )
      ).toBe('one then two');
    });

    it('converts a mention tag to the display name', () => {
      expect(
        component.getMessageSubtitleContent(
          textMessage('hi <@uid:u1>', { mentionedUsers: [user('u1', 'Alice')] })
        )
      ).toBe('hi @Alice');
    });

    it('converts a mention tag and strips a link in one message', () => {
      expect(
        component.getMessageSubtitleContent(
          textMessage('<@uid:u1> sent [a file](https://x.test/f)', {
            mentionedUsers: [user('u1', 'Alice')],
          })
        )
      ).toBe('@Alice sent a file');
    });

    it('falls back to the uid when the message cannot report mentioned users', () => {
      expect(
        component.getMessageSubtitleContent(textMessage('hi <@uid:u1>', { omitMentionAccessor: true }))
      ).toBe('hi @u1');
    });

    it('returns an empty string when the text message has no text', () => {
      expect(component.getMessageSubtitleContent(textMessage(undefined))).toBe('');
    });
  });

  describe('getMessageSubtitleContent — media captions', () => {
    it('returns the caption of a single image', () => {
      expect(
        component.getMessageSubtitleContent(mediaMessage({ type: 'image', caption: 'at the beach' }))
      ).toBe('at the beach');
    });

    it('treats a whitespace-only caption as none and falls back to the filename', () => {
      expect(
        component.getMessageSubtitleContent(
          mediaMessage({ type: 'image', dataText: '   \n  ', attachmentNames: ['holiday.jpg'] })
        )
      ).toBe('holiday.jpg');
    });

    it('reduces a markdown link in the caption to its label', () => {
      expect(
        component.getMessageSubtitleContent(
          mediaMessage({ type: 'image', caption: 'see [the map](https://maps.test/x)' })
        )
      ).toBe('see the map');
    });

    it('strips rich-text formatting from the caption', () => {
      expect(
        component.getMessageSubtitleContent(
          mediaMessage({ type: 'image', caption: '**bold** and `code`' })
        )
      ).toBe('bold and code');
    });

    it('strips rich-text html tags from the caption', () => {
      expect(
        component.getMessageSubtitleContent(
          mediaMessage({ type: 'video', caption: '<p>wrapped <strong>tight</strong></p>' })
        )
      ).toBe('wrapped tight');
    });

    it('converts a mention tag in the caption to the display name', () => {
      expect(
        component.getMessageSubtitleContent(
          mediaMessage({
            type: 'image',
            caption: 'for <@uid:u1>',
            mentionedUsers: [user('u1', 'Alice')],
          })
        )
      ).toBe('for @Alice');
    });

    it('falls back to the uid for an unhydrated mention in the caption', () => {
      expect(
        component.getMessageSubtitleContent(mediaMessage({ type: 'image', caption: 'for <@uid:u9>' }))
      ).toBe('for @u9');
    });

    it('converts an all tag in the caption', () => {
      expect(
        component.getMessageSubtitleContent(mediaMessage({ type: 'video', caption: 'hey <@all:everyone>' }))
      ).toBe('hey @everyone');
    });

    it('collapses whitespace runs and newlines in the caption and trims it', () => {
      expect(
        component.getMessageSubtitleContent(
          mediaMessage({ type: 'image', caption: '  spaced   out\nagain  ' })
        )
      ).toBe('spaced out again');
    });

    it('reads the caption from the data payload when getCaption gives nothing', () => {
      expect(
        component.getMessageSubtitleContent(mediaMessage({ type: 'image', dataText: 'from data' }))
      ).toBe('from data');
    });

    it('returns only the caption for a batch of images, since the count shows as a badge', () => {
      expect(
        component.getMessageSubtitleContent(
          mediaMessage({
            type: 'image',
            caption: 'three shots',
            attachmentNames: ['a.jpg', 'b.jpg', 'c.jpg'],
          })
        )
      ).toBe('three shots');
    });

    it('keeps the counted type label beside the caption for a batch of files', () => {
      const out = component.getMessageSubtitleContent(
        mediaMessage({
          type: 'file',
          caption: 'the **reports**',
          attachmentNames: ['q1.pdf', 'q2.pdf'],
        })
      );
      expect(out).toBe('2 Files · the reports');
    });

    it('falls back to the filename for a single file with no caption', () => {
      expect(
        component.getMessageSubtitleContent(
          mediaMessage({ type: 'file', attachmentNames: ['contract.pdf'] })
        )
      ).toBe('contract.pdf');
    });

    it('leaves a mention tag as the raw uid when the message cannot list mentioned users', () => {
      // Older SDK builds in the peer range ship media messages without
      // getMentionedUsers at all, so the caption has no names to resolve
      // against and the uid has to stand in for one.
      expect(
        component.getMessageSubtitleContent(
          mediaMessage({ type: 'image', caption: 'for <@uid:u9>', omitMentionAccessor: true })
        )
      ).toBe('for @u9');
    });
  });

  describe('getMessageSubtitleContent — other types', () => {
    it('returns the raw type for a message that is neither text nor media', () => {
      expect(
        component.getMessageSubtitleContent({ getType: () => 'extension_whiteboard' } as unknown as CometChat.BaseMessage)
      ).toBe('extension_whiteboard');
    });
  });
});
