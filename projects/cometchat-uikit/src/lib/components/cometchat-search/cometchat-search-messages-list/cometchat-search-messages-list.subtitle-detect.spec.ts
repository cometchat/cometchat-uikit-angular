// The calls SDK touches JitsiMeetJS on import, which does not exist under jsdom.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSearchMessagesListComponent } from './cometchat-search-messages-list.component';
import { SearchMessagesService } from '../../../services/search-messages.service';
import { HtmlSanitizerService } from '../../../services/html-sanitizer.service';
import { FormatterConfigService } from '../../../services/formatter-config.service';
import { CometChatMentionsFormatter } from '../../../formatters/cometchat-mentions-formatter';
import { CometChatTextFormatter } from '../../../formatters/cometchat-text-formatter';

/**
 * Stand-in for the real search service. The method names matter: the component
 * calls `loadMore()` (not `fetchNext()`), and it chains `.then()` off the result,
 * so the double has to hand back a promise.
 */
class MockSearchMessagesService {
  messages = signal<any[]>([]);
  fetchState = signal('loaded');
  hasMore = signal(false);
  search = vi.fn().mockResolvedValue(undefined);
  loadMore = vi.fn().mockResolvedValue(undefined);
  reset = vi.fn();
}

/** Minimal user double — the helpers only ever ask for the uid and the name. */
const asUser = (uid: string, name: string): CometChat.User =>
  ({ getUid: () => uid, getName: () => name }) as unknown as CometChat.User;

/**
 * A text message carrying `text`. Overrides land last so a test can drop an
 * accessor entirely (to exercise the optional-call paths) or swap its answer.
 */
const textMessage = (
  text: string | null | undefined,
  overrides: Record<string, unknown> = {}
): CometChat.BaseMessage =>
  ({
    getType: () => 'text',
    getCategory: () => 'message',
    getText: () => text,
    getSender: () => asUser('u1', 'Alice'),
    getMentionedUsers: () => [],
    ...overrides,
  }) as unknown as CometChat.BaseMessage;

/** A formatter the component must ignore: it is the composer's own, not a display one. */
const tiptapFormatter = (): CometChatTextFormatter =>
  ({
    id: 'tiptap-formatter',
    shouldFormat: () => true,
    format: (t: string) => t,
  }) as unknown as CometChatTextFormatter;

/** Any third-party formatter: neither a mentions formatter nor the tiptap one. */
const customFormatter = (): CometChatTextFormatter =>
  ({
    id: 'hashtag-formatter',
    shouldFormat: () => true,
    format: (t: string) => `${t}#`,
  }) as unknown as CometChatTextFormatter;

describe('CometChatSearchMessagesListComponent — subtitle HTML detection, sender prefix, plain helpers', () => {
  let component: CometChatSearchMessagesListComponent;
  let sanitizer: HtmlSanitizerService;
  let escapeSpy: any;
  let defaultFormatters: CometChatTextFormatter[];
  let getDefaultFormatters: any;

  beforeEach(async () => {
    defaultFormatters = [];
    // Read through the closure so a test can swap the list after the component exists.
    getDefaultFormatters = vi.fn(() => defaultFormatters);

    await TestBed.configureTestingModule({
      imports: [CometChatSearchMessagesListComponent],
      providers: [
        { provide: SearchMessagesService, useClass: MockSearchMessagesService },
        { provide: FormatterConfigService, useValue: { getDefaultFormatters } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CometChatSearchMessagesListComponent);
    component = fixture.componentInstance;
    sanitizer = TestBed.inject(HtmlSanitizerService);
    escapeSpy = vi.spyOn(sanitizer, 'escapeUserHtml');

    // ngOnInit resolves the logged-in user through the SDK. These helpers only
    // read the resolved field, so set it directly and skip the lifecycle hook.
    (component as any).loggedInUser = asUser('me', 'Me');
  });

  describe('subtitleHasHtml — early exits', () => {
    it('returns false for a non-text message type', () => {
      const message = textMessage('**bold**', { getType: () => 'image' });
      expect(component.subtitleHasHtml(message)).toBe(false);
    });

    it('returns false for a text message outside the "message" category', () => {
      const message = textMessage('**bold**', { getCategory: () => 'custom' });
      expect(component.subtitleHasHtml(message)).toBe(false);
    });
  });

  describe('subtitleHasHtml — empty text falls back to richText metadata', () => {
    it('returns true when richText carries both html and hasFormatting', () => {
      const message = textMessage('', {
        getMetadata: () => ({ richText: { html: '<b>hi</b>', hasFormatting: true } }),
      });
      expect(component.subtitleHasHtml(message)).toBe(true);
    });

    it('returns false when richText has html but hasFormatting is false', () => {
      const message = textMessage('', {
        getMetadata: () => ({ richText: { html: '<b>hi</b>', hasFormatting: false } }),
      });
      expect(component.subtitleHasHtml(message)).toBe(false);
    });

    it('returns false when richText has hasFormatting but no html', () => {
      const message = textMessage('', {
        getMetadata: () => ({ richText: { hasFormatting: true } }),
      });
      expect(component.subtitleHasHtml(message)).toBe(false);
    });

    it('returns false when metadata carries no richText entry', () => {
      const message = textMessage('', { getMetadata: () => ({ somethingElse: 1 }) });
      expect(component.subtitleHasHtml(message)).toBe(false);
    });

    it('returns false when getMetadata resolves to undefined', () => {
      const message = textMessage('', { getMetadata: () => undefined });
      expect(component.subtitleHasHtml(message)).toBe(false);
    });

    it('returns false when the message has no getMetadata accessor at all', () => {
      const message = textMessage('');
      expect((message as any).getMetadata).toBeUndefined();
      expect(component.subtitleHasHtml(message)).toBe(false);
    });

    it('swallows a throwing getMetadata and returns false', () => {
      const boom = vi.fn(() => {
        throw new Error('metadata unavailable');
      });
      const message = textMessage('', { getMetadata: boom });
      expect(component.subtitleHasHtml(message)).toBe(false);
      expect(boom).toHaveBeenCalled();
    });

    it('treats a null getText the same as empty text', () => {
      const message = textMessage(null, {
        getMetadata: () => ({ richText: { html: '<i>x</i>', hasFormatting: true } }),
      });
      expect(component.subtitleHasHtml(message)).toBe(true);
    });
  });

  describe('subtitleHasHtml — plain text that must stay plain', () => {
    it('returns false for a bare URL', () => {
      expect(component.subtitleHasHtml(textMessage('https://example.com'))).toBe(false);
    });

    it('returns false for a URL embedded mid-sentence', () => {
      expect(component.subtitleHasHtml(textMessage('see https://example.com/a now'))).toBe(false);
    });

    it('returns false for a markdown link', () => {
      expect(component.subtitleHasHtml(textMessage('[a](b)'))).toBe(false);
    });

    it('returns false for text with no markup and no mentions', () => {
      expect(component.subtitleHasHtml(textMessage('just some words'))).toBe(false);
    });
  });

  describe('subtitleHasHtml — markdown syntax', () => {
    const samples: [string, string][] = [
      ['double-asterisk bold', '**bold**'],
      ['single-asterisk italic', 'an *italic* word'],
      ['double-underscore underline', '__under__'],
      ['tilde strikethrough', '~~gone~~'],
      ['inline code', 'run `npm test` now'],
      ['single-underscore emphasis', '_emphasis_'],
      ['blockquote', '> quoted'],
      ['escaped blockquote', '&gt; quoted'],
      ['dash bullet', '- first item'],
      ['asterisk bullet', '* first item'],
      ['ordered list item', '1. first item'],
    ];

    it.each(samples)('returns true for %s', (_label, raw) => {
      expect(component.subtitleHasHtml(textMessage(raw))).toBe(true);
    });
  });

  describe('subtitleHasHtml — SDK mention tags and formatters', () => {
    it('returns true for a uid mention when a mentions formatter is active', () => {
      component.textFormatters = [new CometChatMentionsFormatter()];
      expect(component.subtitleHasHtml(textMessage('<@uid:u1> hi'))).toBe(true);
    });

    it('returns true for an all mention when a mentions formatter is active', () => {
      component.textFormatters = [new CometChatMentionsFormatter()];
      expect(component.subtitleHasHtml(textMessage('<@all:team> hi'))).toBe(true);
    });

    it('returns false for a mention when only the tiptap formatter is active', () => {
      component.textFormatters = [tiptapFormatter()];
      expect(component.subtitleHasHtml(textMessage('<@uid:u1> hi'))).toBe(false);
    });

    it('returns false for a mention when no formatters are active at all', () => {
      defaultFormatters = [];
      expect(component.subtitleHasHtml(textMessage('<@uid:u1> hi'))).toBe(false);
    });

    it('returns true for a mention when a custom formatter is active without a mentions formatter', () => {
      component.textFormatters = [customFormatter()];
      expect(component.subtitleHasHtml(textMessage('<@uid:u1> hi'))).toBe(true);
    });

    it('returns true with no mentions at all when a custom formatter is active', () => {
      component.textFormatters = [customFormatter()];
      expect(component.subtitleHasHtml(textMessage('plain words here'))).toBe(true);
    });


    it('returns false when a mentions formatter is active but the text has no mention tag', () => {
      component.textFormatters = [new CometChatMentionsFormatter()];
      expect(component.subtitleHasHtml(textMessage('plain words here'))).toBe(false);
    });

    it('picks up a mentions formatter supplied by the global formatter config', () => {
      defaultFormatters = [new CometChatMentionsFormatter()];
      expect(component.subtitleHasHtml(textMessage('<@uid:u1> hi'))).toBe(true);
    });
  });

  describe('getFormattersForSubtitle', () => {
    it('prefers the explicit textFormatters input over the global config', () => {
      const mine = [customFormatter()];
      component.textFormatters = mine;
      expect((component as any).getFormattersForSubtitle()).toBe(mine);
      expect(getDefaultFormatters).not.toHaveBeenCalled();
    });

    it('falls back to the global config when textFormatters is empty', () => {
      component.textFormatters = [];
      defaultFormatters = [customFormatter()];
      expect((component as any).getFormattersForSubtitle()).toBe(defaultFormatters);
      expect(getDefaultFormatters).toHaveBeenCalled();
    });

    it('falls back to the global config when textFormatters is not set', () => {
      (component as any).textFormatters = undefined;
      defaultFormatters = [tiptapFormatter()];
      expect((component as any).getFormattersForSubtitle()).toBe(defaultFormatters);
    });
  });

  describe('prependSenderHtml', () => {
    const html = '<i>hi</i>';

    it('leaves the html untouched when the search is scoped to a user', () => {
      component.uid = 'u9';
      expect((component as any).prependSenderHtml(html, textMessage('hi'))).toBe(html);
    });

    it('leaves the html untouched when the search is scoped to a group', () => {
      component.guid = 'g9';
      expect((component as any).prependSenderHtml(html, textMessage('hi'))).toBe(html);
    });

    it('prefixes "You: " for the logged-in user own message', () => {
      const message = textMessage('hi', { getSender: () => asUser('me', 'Me') });
      expect((component as any).prependSenderHtml(html, message)).toBe(`You: ${html}`);
    });

    it('prefixes the sender name for someone else message', () => {
      expect((component as any).prependSenderHtml(html, textMessage('hi'))).toBe(`Alice: ${html}`);
    });

    it('leaves the html untouched when the sender has no name', () => {
      const message = textMessage('hi', { getSender: () => asUser('u1', '') });
      expect((component as any).prependSenderHtml(html, message)).toBe(html);
    });

    it('leaves the html untouched when there is no sender', () => {
      const message = textMessage('hi', { getSender: () => null });
      expect((component as any).prependSenderHtml(html, message)).toBe(html);
    });

    it('escapes the sender name through the sanitizer before prefixing it', () => {
      const unsafeName = 'Al"ice<b>';
      const message = textMessage('hi', { getSender: () => asUser('u1', unsafeName) });
      const result = (component as any).prependSenderHtml(html, message);
      expect(escapeSpy).toHaveBeenCalledWith(unsafeName);
      expect(result).toBe(`Al&quot;ice&lt;b&gt;: ${html}`);
    });
  });

  describe('getMessageTitle', () => {
    const message = (sender: unknown, receiver: unknown) =>
      ({ getSender: () => sender, getReceiver: () => receiver }) as unknown as CometChat.BaseMessage;

    it('returns the receiver name for an unscoped search', () => {
      expect(component.getMessageTitle(message(asUser('u1', 'Alice'), asUser('u2', 'Bob')))).toBe('Bob');
    });

    it('returns the sender name when scoped to a user', () => {
      component.uid = 'u2';
      expect(component.getMessageTitle(message(asUser('u1', 'Alice'), asUser('u2', 'Bob')))).toBe('Alice');
    });

    it('returns the sender name when scoped to a group', () => {
      component.guid = 'g1';
      expect(component.getMessageTitle(message(asUser('u1', 'Alice'), asUser('u2', 'Bob')))).toBe('Alice');
    });

    it('returns an empty string when a scoped result has no sender', () => {
      component.uid = 'u2';
      expect(component.getMessageTitle(message(null, asUser('u2', 'Bob')))).toBe('');
    });

    it('returns an empty string when the receiver has no getName accessor', () => {
      expect(component.getMessageTitle(message(asUser('u1', 'Alice'), { id: 'x' }))).toBe('');
    });
  });

  describe('getSubtitleSenderPrefix', () => {
    it('returns an empty string when scoped to a user', () => {
      component.uid = 'u9';
      expect(component.getSubtitleSenderPrefix(textMessage('hi'))).toBe('');
    });

    it('returns an empty string when scoped to a group', () => {
      component.guid = 'g9';
      expect(component.getSubtitleSenderPrefix(textMessage('hi'))).toBe('');
    });

    it('returns "You:" for the logged-in user own message', () => {
      const message = textMessage('hi', { getSender: () => asUser('me', 'Me') });
      expect(component.getSubtitleSenderPrefix(message)).toBe('You:');
    });

    it('returns the sender name with a colon for someone else message', () => {
      expect(component.getSubtitleSenderPrefix(textMessage('hi'))).toBe('Alice:');
    });

    it('returns an empty string when the sender has no name', () => {
      const message = textMessage('hi', { getSender: () => asUser('u1', '') });
      expect(component.getSubtitleSenderPrefix(message)).toBe('');
    });

    it('returns an empty string when the sender name resolves to undefined', () => {
      const message = textMessage('hi', {
        getSender: () => ({ getUid: () => 'u1', getName: () => undefined }),
      });
      expect(component.getSubtitleSenderPrefix(message)).toBe('');
    });

    it('returns an empty string when the message has no sender', () => {
      const message = textMessage('hi', { getSender: () => null });
      expect(component.getSubtitleSenderPrefix(message)).toBe('');
    });
  });

  describe('getSubtitleIconType', () => {
    it.each(['image', 'video', 'audio', 'file'])('returns "%s" for a %s message', type => {
      const message = { getType: () => type } as unknown as CometChat.BaseMessage;
      expect(component.getSubtitleIconType(message)).toBe(type);
    });

    it('returns null for a text message', () => {
      expect(component.getSubtitleIconType(textMessage('hi'))).toBeNull();
    });

    it('returns null for an unknown custom type', () => {
      const message = { getType: () => 'poll' } as unknown as CometChat.BaseMessage;
      expect(component.getSubtitleIconType(message)).toBeNull();
    });
  });

  describe('hasThreadReply', () => {
    it('returns true when the message carries a parent id', () => {
      const message = textMessage('hi', { getParentMessageId: () => 77 });
      expect(component.hasThreadReply(message)).toBe(true);
    });

    it('returns false when the parent id is 0', () => {
      const message = textMessage('hi', { getParentMessageId: () => 0 });
      expect(component.hasThreadReply(message)).toBe(false);
    });

    it('returns false when the parent id is undefined', () => {
      const message = textMessage('hi', { getParentMessageId: () => undefined });
      expect(component.hasThreadReply(message)).toBe(false);
    });

    it('returns false when the message has no getParentMessageId accessor', () => {
      const message = textMessage('hi');
      expect((message as any).getParentMessageId).toBeUndefined();
      expect(component.hasThreadReply(message)).toBe(false);
    });
  });

  describe('getMessageSubtitle', () => {
    it('joins the sender prefix and the content with a single space', () => {
      expect(component.getMessageSubtitle(textMessage('hello there'))).toBe('Alice: hello there');
    });

    it('returns the content alone, with no leading space, when there is no prefix', () => {
      component.uid = 'u1';
      expect(component.getMessageSubtitle(textMessage('hello there'))).toBe('hello there');
    });
  });

  describe('getMessageSubtitleHtml — mention path for plain text', () => {
    it('formats SDK mentions and prefixes the sender name', () => {
      component.textFormatters = [new CometChatMentionsFormatter()];
      const message = textMessage('<@uid:u1> ping', {
        getMentionedUsers: () => [asUser('u1', 'Alice')],
      });

      const html = component.getMessageSubtitleHtml(message);

      expect(html.startsWith('Alice: ')).toBe(true);
      expect(html).toContain('@Alice');
      expect(html).toContain('ping');
      expect(html).not.toContain('<@uid:u1>');
    });
  });
});
