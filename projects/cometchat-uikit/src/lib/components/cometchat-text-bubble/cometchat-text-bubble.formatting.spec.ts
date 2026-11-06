/**
 * CometChatTextBubble — formatter initialization and formatting pipelines
 *
 * Covers the three private members that do the formatting work:
 *   - initializeTextFormatters(): logged-in user resolution, the
 *     FormatterConfigService fallback, and mentions-formatter priming.
 *   - applyTextFormatters(): the plain-text pipeline (escape -> formatters ->
 *     strip invalid mentions -> sanitize).
 *   - applyFormattersToParsedHtml(): the rich-text pipeline, plus the
 *     sanitizeHtml() guard both pipelines share.
 *
 * The component is constructed directly (no fixture) because this region is
 * pure logic: the template adds nothing to it and rendering would only make
 * the required `message` input and OnPush change detection get in the way.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatTextBubbleComponent } from './cometchat-text-bubble.component';
import { CometChatMentionsFormatter } from '../../formatters/cometchat-mentions-formatter';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';
import { FormatterConfigService } from '../../services/formatter-config.service';
import { HtmlSanitizerService } from '../../services/html-sanitizer.service';
import { COMETCHAT_GLOBAL_CONFIG } from '../../services/global-config.service';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { CometChatLogger } from '../../utils/CometChatLogger';

// ---------------------------------------------------------------------------
// Doubles and helpers
// ---------------------------------------------------------------------------

type Mock = ReturnType<typeof vi.fn>;

/**
 * A formatter that is NOT a CometChatMentionsFormatter — the component only
 * ever checks `instanceof`, so a plain object with the four members it touches
 * is enough, and it keeps the assertions about which setter ran readable.
 */
interface FakeFormatter {
  id: string;
  priority: number;
  shouldFormat: Mock;
  format: Mock;
  setLoggedInUser: Mock;
  setMessageBubbleAlignment: Mock;
  setUsers: Mock;
}

function fakeFormatter(
  id: string,
  format: (text: string) => unknown = text => text,
  shouldFormat: (text: string, message?: unknown) => boolean = () => true
): FakeFormatter {
  return {
    id,
    priority: 100,
    shouldFormat: vi.fn(shouldFormat),
    format: vi.fn(format),
    setLoggedInUser: vi.fn(),
    setMessageBubbleAlignment: vi.fn(),
    setUsers: vi.fn(),
  };
}

function asFormatters(...formatters: unknown[]): CometChatTextFormatter[] {
  return formatters as unknown as CometChatTextFormatter[];
}

/** Only the accessors the extraction utilities actually call. */
function messageDouble(options: {
  text?: string;
  metadata?: unknown;
  mentionedUsers?: unknown[];
  withoutMentionedUsers?: boolean;
} = {}): CometChat.TextMessage {
  const double: Record<string, unknown> = {
    getText: () => options.text ?? '',
    getMetadata: () => options.metadata,
  };
  if (!options.withoutMentionedUsers) {
    double['getMentionedUsers'] = () => options.mentionedUsers ?? [];
  }
  return double as unknown as CometChat.TextMessage;
}

function userDouble(uid: string, name = uid): CometChat.User {
  return { getUid: () => uid, getName: () => name } as unknown as CometChat.User;
}

interface Harness {
  comp: CometChatTextBubbleComponent;
  formatterConfig: FormatterConfigService;
  htmlSanitizer: HtmlSanitizerService;
  markForCheck: Mock;
}

/**
 * Builds the component inside an injection context so the field-level
 * inject(COMETCHAT_GLOBAL_CONFIG) resolves. Call once per test — TestBed can
 * only be configured before it is first used.
 */
function createHarness(providers: unknown[] = []): Harness {
  TestBed.configureTestingModule({
    providers: [FormatterConfigService, HtmlSanitizerService, ...(providers as never[])],
  });

  const sanitizer = TestBed.inject(DomSanitizer);
  const formatterConfig = TestBed.inject(FormatterConfigService);
  const htmlSanitizer = TestBed.inject(HtmlSanitizerService);
  const markForCheck = vi.fn();
  const cdr = { markForCheck, detectChanges: vi.fn() } as never;

  let comp!: CometChatTextBubbleComponent;
  TestBed.runInInjectionContext(() => {
    comp = new CometChatTextBubbleComponent(sanitizer, cdr, formatterConfig, htmlSanitizer);
  });

  return { comp, formatterConfig, htmlSanitizer, markForCheck };
}

/** Makes the sanitizer step observable in the returned string. */
function stubSanitize(htmlSanitizer: HtmlSanitizerService): Mock {
  return vi
    .spyOn(htmlSanitizer, 'sanitize')
    .mockImplementation((html: string) => `[S]${html}`) as unknown as Mock;
}

function globalConfigWith(formatters: unknown[]): unknown {
  return {
    provide: COMETCHAT_GLOBAL_CONFIG,
    useValue: { textFormatters: asFormatters(...formatters) },
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('CometChatTextBubbleComponent — formatting', () => {
  let getLoggedinUser: Mock;
  let warn: Mock;

  beforeEach(() => {
    getLoggedinUser = vi
      .spyOn(CometChat, 'getLoggedinUser')
      .mockResolvedValue(null as never) as unknown as Mock;
    warn = vi.spyOn(CometChatLogger, 'warn').mockImplementation(() => {}) as unknown as Mock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // initializeTextFormatters — resolving the logged-in user
  // -------------------------------------------------------------------------
  describe('initializeTextFormatters — logged-in user', () => {
    it('warns and carries on when the logged-in user cannot be resolved', async () => {
      getLoggedinUser.mockRejectedValue(new Error('not logged in'));
      const { comp } = createHarness();
      comp.message = messageDouble({ text: 'hi' });

      await (comp as any).initializeTextFormatters();

      expect(warn).toHaveBeenCalledWith(
        'CometChatTextBubble',
        'Could not get logged-in user for formatter context'
      );
      // "Carries on" is the point of the catch — the message still got processed.
      expect((comp as any).messageText).toBe('hi');
    });

    it('does not warn when the logged-in user resolves', async () => {
      getLoggedinUser.mockResolvedValue(userDouble('alice') as never);
      const { comp } = createHarness();
      comp.message = messageDouble({ text: 'hi' });

      await (comp as any).initializeTextFormatters();

      expect(warn).not.toHaveBeenCalled();
    });

    it('does not ask the config service for formatters when the user is missing', async () => {
      getLoggedinUser.mockResolvedValue(null as never);
      const { comp, formatterConfig } = createHarness();
      const getFormattersWithContext = vi.spyOn(formatterConfig, 'getFormattersWithContext');
      comp.message = messageDouble({ text: 'hi' });

      await (comp as any).initializeTextFormatters();

      expect(getFormattersWithContext).not.toHaveBeenCalled();
      expect(comp.textFormatters).toEqual([]);
    });

    it('leaves the formatter list empty when resolving the user fails', async () => {
      getLoggedinUser.mockRejectedValue(new Error('offline'));
      const { comp, formatterConfig } = createHarness();
      const getFormattersWithContext = vi.spyOn(formatterConfig, 'getFormattersWithContext');
      comp.message = messageDouble({ text: 'hi' });

      await (comp as any).initializeTextFormatters();

      expect(getFormattersWithContext).not.toHaveBeenCalled();
      expect(comp.textFormatters).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // initializeTextFormatters — FormatterConfigService fallback
  // -------------------------------------------------------------------------
  describe('initializeTextFormatters — config service fallback', () => {
    it('adopts the context formatters returned by the config service', async () => {
      const user = userDouble('alice');
      getLoggedinUser.mockResolvedValue(user as never);
      const { comp, formatterConfig } = createHarness();
      const defaults = asFormatters(fakeFormatter('from-service'));
      vi.spyOn(formatterConfig, 'getFormattersWithContext').mockReturnValue(defaults);
      comp.message = messageDouble({ text: 'hi' });

      await (comp as any).initializeTextFormatters();

      expect(comp.textFormatters).toBe(defaults);
    });

    it('passes the logged-in user and left alignment as the formatter context', async () => {
      const user = userDouble('alice');
      getLoggedinUser.mockResolvedValue(user as never);
      const { comp, formatterConfig } = createHarness();
      const getFormattersWithContext = vi
        .spyOn(formatterConfig, 'getFormattersWithContext')
        .mockReturnValue([]);
      comp.alignment = MessageBubbleAlignment.left;
      comp.message = messageDouble({ text: 'hi' });

      await (comp as any).initializeTextFormatters();

      expect(getFormattersWithContext).toHaveBeenCalledWith(user, MessageBubbleAlignment.left);
    });

    it('passes right alignment through to the formatter context', async () => {
      const user = userDouble('alice');
      getLoggedinUser.mockResolvedValue(user as never);
      const { comp, formatterConfig } = createHarness();
      const getFormattersWithContext = vi
        .spyOn(formatterConfig, 'getFormattersWithContext')
        .mockReturnValue([]);
      comp.alignment = MessageBubbleAlignment.right;
      comp.message = messageDouble({ text: 'hi' });

      await (comp as any).initializeTextFormatters();

      expect(getFormattersWithContext).toHaveBeenCalledWith(user, MessageBubbleAlignment.right);
    });

    it('uses the adopted service formatters for subsequent formatting', async () => {
      // The fallback writes _textFormatters without flipping the "explicitly
      // set" flag, so this also pins down which of the two sources wins later.
      const user = userDouble('alice');
      getLoggedinUser.mockResolvedValue(user as never);
      const { comp, formatterConfig, htmlSanitizer } = createHarness();
      const shouty = fakeFormatter('shouty', text => text.toUpperCase());
      vi.spyOn(formatterConfig, 'getFormattersWithContext').mockReturnValue(
        asFormatters(shouty)
      );
      stubSanitize(htmlSanitizer);
      comp.message = messageDouble({ text: 'hi' });

      await (comp as any).initializeTextFormatters();

      expect(shouty.format).toHaveBeenCalled();
      expect((comp as any).formattedText).toBe('[S]HI');
    });
  });

  // -------------------------------------------------------------------------
  // initializeTextFormatters — priming configured formatters
  // -------------------------------------------------------------------------
  describe('initializeTextFormatters — configured formatters', () => {
    it('always sets the bubble alignment on a mentions formatter', async () => {
      getLoggedinUser.mockResolvedValue(userDouble('alice') as never);
      const { comp } = createHarness();
      const mentions = new CometChatMentionsFormatter();
      comp.alignment = MessageBubbleAlignment.right;
      comp.textFormatters = asFormatters(mentions);
      comp.message = messageDouble({ text: 'hi' });

      await (comp as any).initializeTextFormatters();

      expect(mentions.getMessageBubbleAlignment()).toBe(MessageBubbleAlignment.right);
    });

    it('sets the logged-in user on a mentions formatter when one resolved', async () => {
      const user = userDouble('alice');
      getLoggedinUser.mockResolvedValue(user as never);
      const { comp } = createHarness();
      const mentions = new CometChatMentionsFormatter();
      comp.textFormatters = asFormatters(mentions);
      comp.message = messageDouble({ text: 'hi' });

      await (comp as any).initializeTextFormatters();

      expect(mentions.getLoggedInUser()).toBe(user);
    });

    it('leaves the logged-in user unset when none resolved but still sets alignment', async () => {
      getLoggedinUser.mockResolvedValue(null as never);
      const { comp } = createHarness();
      const mentions = new CometChatMentionsFormatter();
      const setLoggedInUser = vi.spyOn(mentions, 'setLoggedInUser');
      comp.alignment = MessageBubbleAlignment.left;
      comp.textFormatters = asFormatters(mentions);
      comp.message = messageDouble({ text: 'hi' });

      await (comp as any).initializeTextFormatters();

      expect(setLoggedInUser).not.toHaveBeenCalled();
      expect(mentions.getMessageBubbleAlignment()).toBe(MessageBubbleAlignment.left);
    });

    it('hands the mentioned users to a mentions formatter when the message has some', async () => {
      getLoggedinUser.mockResolvedValue(userDouble('alice') as never);
      const { comp } = createHarness();
      const mentions = new CometChatMentionsFormatter();
      const setUsers = vi.spyOn(mentions, 'setUsers');
      const mentioned = [userDouble('bob', 'Bob')];
      comp.textFormatters = asFormatters(mentions);
      comp.message = messageDouble({ text: 'hey @Bob', mentionedUsers: mentioned });

      await (comp as any).initializeTextFormatters();

      expect(setUsers).toHaveBeenCalledWith(mentioned);
    });

    it('does not call setUsers when the message reports an empty mention list', async () => {
      getLoggedinUser.mockResolvedValue(userDouble('alice') as never);
      const { comp } = createHarness();
      const mentions = new CometChatMentionsFormatter();
      const setUsers = vi.spyOn(mentions, 'setUsers');
      comp.textFormatters = asFormatters(mentions);
      comp.message = messageDouble({ text: 'hi', mentionedUsers: [] });

      await (comp as any).initializeTextFormatters();

      expect(setUsers).not.toHaveBeenCalled();
    });

    it('tolerates a message without getMentionedUsers at all', async () => {
      getLoggedinUser.mockResolvedValue(userDouble('alice') as never);
      const { comp } = createHarness();
      const mentions = new CometChatMentionsFormatter();
      const setUsers = vi.spyOn(mentions, 'setUsers');
      comp.textFormatters = asFormatters(mentions);
      comp.message = messageDouble({ text: 'hi', withoutMentionedUsers: true });

      await expect((comp as any).initializeTextFormatters()).resolves.toBeUndefined();

      expect(setUsers).not.toHaveBeenCalled();
      expect(mentions.getMessageBubbleAlignment()).toBe(MessageBubbleAlignment.left);
    });

    it('still primes the alignment when there is no message yet', async () => {
      getLoggedinUser.mockResolvedValue(userDouble('alice') as never);
      const { comp } = createHarness();
      const mentions = new CometChatMentionsFormatter();
      const setUsers = vi.spyOn(mentions, 'setUsers');
      comp.alignment = MessageBubbleAlignment.right;
      comp.textFormatters = asFormatters(mentions);

      await (comp as any).initializeTextFormatters();

      expect(setUsers).not.toHaveBeenCalled();
      expect(mentions.getMessageBubbleAlignment()).toBe(MessageBubbleAlignment.right);
    });

    it('leaves a non-mentions formatter completely untouched', async () => {
      getLoggedinUser.mockResolvedValue(userDouble('alice') as never);
      const { comp } = createHarness();
      const other = fakeFormatter('other');
      comp.textFormatters = asFormatters(other);
      comp.message = messageDouble({ text: 'hi', mentionedUsers: [userDouble('bob')] });

      await (comp as any).initializeTextFormatters();

      expect(other.setLoggedInUser).not.toHaveBeenCalled();
      expect(other.setMessageBubbleAlignment).not.toHaveBeenCalled();
      expect(other.setUsers).not.toHaveBeenCalled();
    });

    it('primes only the mentions formatters in a mixed list', async () => {
      const user = userDouble('alice');
      getLoggedinUser.mockResolvedValue(user as never);
      const { comp } = createHarness();
      const mentions = new CometChatMentionsFormatter();
      const other = fakeFormatter('other');
      comp.textFormatters = asFormatters(other, mentions);
      comp.message = messageDouble({ text: 'hi' });

      await (comp as any).initializeTextFormatters();

      expect(mentions.getLoggedInUser()).toBe(user);
      expect(other.setLoggedInUser).not.toHaveBeenCalled();
    });

    it('does not consult the config service when formatters are already configured', async () => {
      getLoggedinUser.mockResolvedValue(userDouble('alice') as never);
      const { comp, formatterConfig } = createHarness();
      const getFormattersWithContext = vi.spyOn(formatterConfig, 'getFormattersWithContext');
      const configured = asFormatters(fakeFormatter('configured'));
      comp.textFormatters = configured;
      comp.message = messageDouble({ text: 'hi' });

      await (comp as any).initializeTextFormatters();

      expect(getFormattersWithContext).not.toHaveBeenCalled();
      expect(comp.textFormatters).toBe(configured);
    });

    it('processes the message exactly once at the end of initialization', async () => {
      getLoggedinUser.mockResolvedValue(userDouble('alice') as never);
      const { comp } = createHarness();
      const processMessage = vi.spyOn(comp as any, 'processMessage');
      comp.message = messageDouble({ text: 'hi' });

      await (comp as any).initializeTextFormatters();

      expect(processMessage).toHaveBeenCalledTimes(1);
    });

    it('processes the message after priming the formatters', async () => {
      getLoggedinUser.mockResolvedValue(userDouble('alice') as never);
      const { comp, htmlSanitizer } = createHarness();
      const shouty = fakeFormatter('shouty', text => text.toUpperCase());
      stubSanitize(htmlSanitizer);
      comp.textFormatters = asFormatters(shouty);
      comp.message = messageDouble({ text: 'hi' });

      await (comp as any).initializeTextFormatters();

      expect((comp as any).formattedText).toBe('[S]HI');
    });
  });

  // -------------------------------------------------------------------------
  // processMessage
  // -------------------------------------------------------------------------
  describe('processMessage', () => {
    const richMetadata = (html: string, hasFormatting = true, extra: object = {}) => ({
      richText: { hasFormatting, html },
      ...extra,
    });

    it('flags rich text when the message carries formatted html instead of text', () => {
      const { comp } = createHarness();
      comp.message = messageDouble({ text: '', metadata: richMetadata('<p>hello</p>') });

      (comp as any).processMessage();

      expect((comp as any).isRichText).toBe(true);
    });

    it('detects a single emoji inside rich text', () => {
      const { comp } = createHarness();
      comp.message = messageDouble({ text: '', metadata: richMetadata('<p>😀</p>') });

      (comp as any).processMessage();

      expect((comp as any).isSingleEmoji).toBe(true);
    });

    it('does not flag a single emoji for multi-word rich text', () => {
      const { comp } = createHarness();
      comp.message = messageDouble({ text: '', metadata: richMetadata('<p>hello there</p>') });

      (comp as any).processMessage();

      expect((comp as any).isSingleEmoji).toBe(false);
    });

    it('sanitizes the rich html before any formatter sees it', () => {
      const { comp, htmlSanitizer } = createHarness();
      const sanitize = stubSanitize(htmlSanitizer);
      comp.message = messageDouble({ text: '', metadata: richMetadata('<p>hello</p>') });

      (comp as any).processMessage();

      expect(sanitize).toHaveBeenCalledWith('<p>hello</p>');
    });

    it('passes the sanitized html through the parsed-html pipeline and keeps its result', () => {
      const { comp, htmlSanitizer } = createHarness();
      stubSanitize(htmlSanitizer);
      const applyToParsed = vi
        .spyOn(comp as any, 'applyFormattersToParsedHtml')
        .mockReturnValue('PARSED');
      comp.message = messageDouble({ text: '', metadata: richMetadata('<p>hello</p>') });

      (comp as any).processMessage();

      expect(applyToParsed).toHaveBeenCalledWith('[S]<p>hello</p>');
      expect((comp as any).formattedText).toBe('PARSED');
    });

    it('takes the plain-text pipeline when the message has text', () => {
      const { comp, htmlSanitizer } = createHarness();
      stubSanitize(htmlSanitizer);
      const applyToParsed = vi.spyOn(comp as any, 'applyFormattersToParsedHtml');
      comp.message = messageDouble({ text: 'plain words' });

      (comp as any).processMessage();

      expect((comp as any).isRichText).toBe(false);
      expect(applyToParsed).not.toHaveBeenCalled();
      expect((comp as any).formattedText).toBe('[S]plain words');
    });

    it('detects a single emoji in plain text', () => {
      const { comp } = createHarness();
      comp.message = messageDouble({ text: '😀' });

      (comp as any).processMessage();

      expect((comp as any).isRichText).toBe(false);
      expect((comp as any).isSingleEmoji).toBe(true);
    });

    it('ignores rich text metadata that is not flagged as formatted', () => {
      const { comp } = createHarness();
      comp.message = messageDouble({ text: '', metadata: richMetadata('<p>hello</p>', false) });

      (comp as any).processMessage();

      expect((comp as any).isRichText).toBe(false);
    });

    it('formats the translation through the plain-text pipeline', () => {
      const { comp, htmlSanitizer } = createHarness();
      stubSanitize(htmlSanitizer);
      const shouty = fakeFormatter('shouty', text => text.toUpperCase());
      comp.textFormatters = asFormatters(shouty);
      comp.message = messageDouble({ text: 'hi', metadata: { translated_message: 'hola' } });

      (comp as any).processMessage();

      expect((comp as any).formattedTranslatedText).toBe('[S]HOLA');
      expect((comp as any).formattedText).toBe('[S]HI');
    });

    it('leaves the formatted translation empty when there is no translation', () => {
      const { comp, htmlSanitizer } = createHarness();
      stubSanitize(htmlSanitizer);
      comp.message = messageDouble({ text: 'hi' });

      (comp as any).processMessage();

      expect((comp as any).formattedTranslatedText).toBe('');
    });

    it('formats an overridden translation', () => {
      const { comp, htmlSanitizer } = createHarness();
      stubSanitize(htmlSanitizer);
      comp.message = messageDouble({ text: 'hi' });
      comp.translatedTextOverride = 'bonjour';

      (comp as any).processMessage();

      expect((comp as any).formattedTranslatedText).toBe('[S]bonjour');
    });

    it('returns early and changes nothing when there is no message', () => {
      const { comp, markForCheck } = createHarness();
      (comp as any).messageText = 'untouched';
      (comp as any).formattedText = 'untouched';

      (comp as any).processMessage();

      expect((comp as any).messageText).toBe('untouched');
      expect((comp as any).formattedText).toBe('untouched');
      expect(markForCheck).not.toHaveBeenCalled();
    });

    it('marks the view for check after processing', () => {
      const { comp, markForCheck } = createHarness();
      comp.message = messageDouble({ text: 'hi' });

      (comp as any).processMessage();

      expect(markForCheck).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // applyTextFormatters
  // -------------------------------------------------------------------------
  describe('applyTextFormatters', () => {
    it('returns an empty string for empty text', () => {
      const { comp } = createHarness();
      expect((comp as any).applyTextFormatters('')).toBe('');
    });

    it('returns an empty string for undefined text', () => {
      const { comp } = createHarness();
      expect((comp as any).applyTextFormatters(undefined)).toBe('');
    });

    it('returns an empty string for a non-string value', () => {
      const { comp } = createHarness();
      expect((comp as any).applyTextFormatters(42)).toBe('');
      expect((comp as any).applyTextFormatters({ text: 'hi' })).toBe('');
    });

    it('escapes the raw text before formatting it', () => {
      const { comp, htmlSanitizer } = createHarness();
      const escapeUserHtml = vi.spyOn(htmlSanitizer, 'escapeUserHtml');
      stubSanitize(htmlSanitizer);

      (comp as any).applyTextFormatters('<b>hi</b>');

      expect(escapeUserHtml).toHaveBeenCalledWith('<b>hi</b>');
    });

    it('hands the escaped text, not the raw text, to the formatters', () => {
      const { comp, htmlSanitizer } = createHarness();
      stubSanitize(htmlSanitizer);
      const spy = fakeFormatter('spy');
      comp.textFormatters = asFormatters(spy);

      (comp as any).applyTextFormatters('<b>hi</b>');

      expect(spy.format).toHaveBeenCalledWith('&lt;b&gt;hi&lt;/b&gt;');
    });

    it('sanitizes the escaped text directly when no formatters are configured', () => {
      const { comp, htmlSanitizer } = createHarness();
      stubSanitize(htmlSanitizer);

      const result = (comp as any).applyTextFormatters('<b>hi</b>');

      expect(result).toBe('[S]&lt;b&gt;hi&lt;/b&gt;');
    });

    it('strips invalid mention markup out of the formatter output', () => {
      const { comp, htmlSanitizer } = createHarness();
      stripOnly(htmlSanitizer);
      // A formatter may emit the legacy "<@name:Display>" shape; only the SDK
      // forms (<@uid:..>, <@all:..>) are allowed to survive.
      const injector = fakeFormatter('injector', () => 'hi <@john:John> <@uid:bob>');
      comp.textFormatters = asFormatters(injector);

      const result = (comp as any).applyTextFormatters('hi');

      expect(result).toBe('hi  <@uid:bob>');
    });

    it('prefers the explicitly set formatters over the global config ones', () => {
      const fromConfig = fakeFormatter('from-config');
      const { comp, htmlSanitizer } = createHarness([globalConfigWith([fromConfig])]);
      stubSanitize(htmlSanitizer);
      const explicit = fakeFormatter('explicit', text => `${text}!`);
      comp.textFormatters = asFormatters(explicit);

      const result = (comp as any).applyTextFormatters('hi');

      expect(result).toBe('[S]hi!');
      expect(fromConfig.format).not.toHaveBeenCalled();
    });

    it('falls back to the global config formatters when none were set on the input', () => {
      const fromConfig = fakeFormatter('from-config', text => `${text}?`);
      const { comp, htmlSanitizer } = createHarness([globalConfigWith([fromConfig])]);
      stubSanitize(htmlSanitizer);

      const result = (comp as any).applyTextFormatters('hi');

      expect(fromConfig.format).toHaveBeenCalledWith('hi');
      expect(result).toBe('[S]hi?');
    });

    it('skips a formatter whose shouldFormat says no', () => {
      const { comp, htmlSanitizer } = createHarness();
      stubSanitize(htmlSanitizer);
      const skipped = fakeFormatter('skipped', text => `${text}-ran`, () => false);
      comp.textFormatters = asFormatters(skipped);

      const result = (comp as any).applyTextFormatters('hi');

      expect(skipped.format).not.toHaveBeenCalled();
      expect(result).toBe('[S]hi');
    });

    it('offers the message to shouldFormat so formatters can opt out per message', () => {
      const { comp, htmlSanitizer } = createHarness();
      stubSanitize(htmlSanitizer);
      const spy = fakeFormatter('spy');
      const message = messageDouble({ text: 'hi' });
      comp.message = message;
      comp.textFormatters = asFormatters(spy);

      (comp as any).applyTextFormatters('hi');

      expect(spy.shouldFormat).toHaveBeenCalledWith('hi', message);
    });

    it('uses formatSdkMentions when the text carries SDK mentions', () => {
      const { comp, htmlSanitizer } = createHarness();
      stubSanitize(htmlSanitizer);
      const mentions = new CometChatMentionsFormatter();
      const formatSdkMentions = vi
        .spyOn(mentions, 'formatSdkMentions')
        .mockReturnValue('SDK-MENTIONS');
      const format = vi.spyOn(mentions, 'format');
      const mentioned = [userDouble('bob', 'Bob')];
      (comp as any).mentionedUsers = mentioned;
      comp.textFormatters = asFormatters(mentions);

      const result = (comp as any).applyTextFormatters('hey <@uid:bob>');

      expect(formatSdkMentions).toHaveBeenCalledWith('hey <@uid:bob>', mentioned);
      expect(format).not.toHaveBeenCalled();
      expect(result).toBe('[S]SDK-MENTIONS');
    });

    it('uses plain format when the mentions formatter finds no SDK mentions', () => {
      const { comp, htmlSanitizer } = createHarness();
      stubSanitize(htmlSanitizer);
      const mentions = new CometChatMentionsFormatter();
      const formatSdkMentions = vi.spyOn(mentions, 'formatSdkMentions');
      const format = vi.spyOn(mentions, 'format').mockReturnValue('PLAIN-MENTIONS');
      comp.textFormatters = asFormatters(mentions);

      const result = (comp as any).applyTextFormatters('hey @bob');

      expect(format).toHaveBeenCalledWith('hey @bob');
      expect(formatSdkMentions).not.toHaveBeenCalled();
      expect(result).toBe('[S]PLAIN-MENTIONS');
    });

    it('keeps the previous text when a mentions formatter returns a non-string', () => {
      const { comp, htmlSanitizer } = createHarness();
      stubSanitize(htmlSanitizer);
      const mentions = new CometChatMentionsFormatter();
      vi.spyOn(mentions, 'format').mockReturnValue(undefined as never);
      comp.textFormatters = asFormatters(mentions);

      const result = (comp as any).applyTextFormatters('hey @bob');

      expect(result).toBe('[S]hey @bob');
    });

    it('keeps the previous text when a plain formatter returns a non-string', () => {
      const { comp, htmlSanitizer } = createHarness();
      stubSanitize(htmlSanitizer);
      const shouty = fakeFormatter('shouty', text => text.toUpperCase());
      const broken = fakeFormatter('broken', () => ({ not: 'a string' }));
      comp.textFormatters = asFormatters(shouty, broken);

      const result = (comp as any).applyTextFormatters('hi');

      // The uppercase result must survive the formatter that returned an object.
      expect(result).toBe('[S]HI');
    });

    it('carries a plain formatter result forward', () => {
      const { comp, htmlSanitizer } = createHarness();
      stubSanitize(htmlSanitizer);
      const linkify = fakeFormatter('linkify', text => `<a>${text}</a>`);
      comp.textFormatters = asFormatters(linkify);

      const result = (comp as any).applyTextFormatters('hi');

      expect(result).toBe('[S]<a>hi</a>');
    });

    it('warns when a formatter throws', () => {
      const { comp, htmlSanitizer } = createHarness();
      stubSanitize(htmlSanitizer);
      const exploding = fakeFormatter('exploding', () => {
        throw new Error('boom');
      });
      comp.textFormatters = asFormatters(exploding);

      (comp as any).applyTextFormatters('hi');

      expect(warn).toHaveBeenCalledWith(
        'CometChatTextBubble',
        'Error applying text formatter',
        expect.any(Error)
      );
    });

    it('keeps running the remaining formatters after one throws', () => {
      const { comp, htmlSanitizer } = createHarness();
      stubSanitize(htmlSanitizer);
      const exploding = fakeFormatter('exploding', () => {
        throw new Error('boom');
      });
      const survivor = fakeFormatter('survivor', text => `${text}-ok`);
      comp.textFormatters = asFormatters(exploding, survivor);

      const result = (comp as any).applyTextFormatters('hi');

      expect(survivor.format).toHaveBeenCalledWith('hi');
      expect(result).toBe('[S]hi-ok');
    });

    it('swallows a throw from shouldFormat as well', () => {
      const { comp, htmlSanitizer } = createHarness();
      stubSanitize(htmlSanitizer);
      const exploding = fakeFormatter('exploding', text => text, () => {
        throw new Error('bad predicate');
      });
      const survivor = fakeFormatter('survivor', text => `${text}-ok`);
      comp.textFormatters = asFormatters(exploding, survivor);

      const result = (comp as any).applyTextFormatters('hi');

      expect(warn).toHaveBeenCalled();
      expect(result).toBe('[S]hi-ok');
    });

    it('chains formatters in order, feeding each one the previous result', () => {
      const { comp, htmlSanitizer } = createHarness();
      stubSanitize(htmlSanitizer);
      const first = fakeFormatter('first', text => `${text}-one`);
      const second = fakeFormatter('second', text => `${text}-two`);
      comp.textFormatters = asFormatters(first, second);

      const result = (comp as any).applyTextFormatters('x');

      expect(second.format).toHaveBeenCalledWith('x-one');
      expect(result).toBe('[S]x-one-two');
    });
  });

  // -------------------------------------------------------------------------
  // applyFormattersToParsedHtml
  // -------------------------------------------------------------------------
  describe('applyFormattersToParsedHtml', () => {
    it('returns the html untouched when no formatters are configured', () => {
      const { comp } = createHarness();

      expect((comp as any).applyFormattersToParsedHtml('<b>keep</b>')).toBe('<b>keep</b>');
    });

    it('returns the html untouched when only mentions formatters are configured', () => {
      const { comp } = createHarness();
      const mentions = new CometChatMentionsFormatter();
      const format = vi.spyOn(mentions, 'format');
      comp.textFormatters = asFormatters(mentions);

      const result = (comp as any).applyFormattersToParsedHtml('<b>keep</b>');

      // Rich text already has its mentions rendered, so the mentions formatter
      // must not run over it a second time.
      expect(result).toBe('<b>keep</b>');
      expect(format).not.toHaveBeenCalled();
    });

    it('applies a non-mentions formatter alongside a mentions formatter', () => {
      const { comp } = createHarness();
      const mentions = new CometChatMentionsFormatter();
      const mentionsFormat = vi.spyOn(mentions, 'format');
      const shouty = fakeFormatter('shouty', text => text.toUpperCase());
      comp.textFormatters = asFormatters(mentions, shouty);

      const result = (comp as any).applyFormattersToParsedHtml('<b>keep</b>plain');

      expect(result).toContain('KEEP');
      expect(result).toContain('PLAIN');
      expect(mentionsFormat).not.toHaveBeenCalled();
    });

    it('formats the text content of the html', () => {
      const { comp } = createHarness();
      const shouty = fakeFormatter('shouty', text => text.toUpperCase());
      comp.textFormatters = asFormatters(shouty);

      const result = (comp as any).applyFormattersToParsedHtml('<b>keep</b>plain');

      expect(result).toContain('KEEP');
      expect(result).toContain('PLAIN');
    });

    it('hands tag markup to the formatter along with the text it precedes', () => {
      // Characterization of today's segmentation: the regex splits on "<"
      // only, so each segment still carries the tag name and the closing ">"
      // of the tag that opened it. A formatter that rewrites such characters
      // will therefore rewrite markup, which the doc comment says it cannot.
      const { comp } = createHarness();
      const shouty = fakeFormatter('shouty', text => text.toUpperCase());
      comp.textFormatters = asFormatters(shouty);

      const result = (comp as any).applyFormattersToParsedHtml('<b>keep</b>plain');

      expect(shouty.format).toHaveBeenCalledWith('b>keep');
      expect(shouty.format).toHaveBeenCalledWith('/b>plain');
      expect(result).toBe('<B>KEEP</B>PLAIN');
    });

    it('skips a formatter whose shouldFormat says no', () => {
      const { comp } = createHarness();
      const skipped = fakeFormatter('skipped', text => text.toUpperCase(), () => false);
      comp.textFormatters = asFormatters(skipped);

      const result = (comp as any).applyFormattersToParsedHtml('<b>keep</b>');

      expect(skipped.format).not.toHaveBeenCalled();
      expect(result).toBe('<b>keep</b>');
    });

    it('asks shouldFormat about the segment, without a message argument', () => {
      const { comp } = createHarness();
      const spy = fakeFormatter('spy');
      comp.message = messageDouble({ text: '' });
      comp.textFormatters = asFormatters(spy);

      (comp as any).applyFormattersToParsedHtml('<b>keep</b>');

      expect(spy.shouldFormat).toHaveBeenCalledWith('b>keep');
    });

    it('leaves a segment as-is when the formatter returns a non-string', () => {
      const { comp } = createHarness();
      const broken = fakeFormatter('broken', () => 7);
      comp.textFormatters = asFormatters(broken);

      const result = (comp as any).applyFormattersToParsedHtml('<b>keep</b>');

      expect(broken.format).toHaveBeenCalled();
      expect(result).toBe('<b>keep</b>');
    });

    it('swallows a formatter error silently and runs the remaining formatters', () => {
      const { comp } = createHarness();
      const exploding = fakeFormatter('exploding', () => {
        throw new Error('boom');
      });
      const survivor = fakeFormatter('survivor', text => text.toUpperCase());
      comp.textFormatters = asFormatters(exploding, survivor);

      const result = (comp as any).applyFormattersToParsedHtml('<b>keep</b>');

      expect(survivor.format).toHaveBeenCalledWith('b>keep');
      // The survivor's work reaches the output, so the catch sits inside the loop.
      expect(result).toContain('KEEP');
      // Unlike the plain-text pipeline, this one does not log.
      expect(warn).not.toHaveBeenCalled();
    });

    it('falls back to the global config formatters when none were set on the input', () => {
      const fromConfig = fakeFormatter('from-config', text => text.toUpperCase());
      const { comp } = createHarness([globalConfigWith([fromConfig])]);

      const result = (comp as any).applyFormattersToParsedHtml('<b>keep</b>');

      expect(fromConfig.format).toHaveBeenCalled();
      expect(result).toContain('KEEP');
    });

    it('prefers the explicitly set formatters over the global config ones', () => {
      const fromConfig = fakeFormatter('from-config', text => `${text}!`);
      const { comp } = createHarness([globalConfigWith([fromConfig])]);
      const explicit = fakeFormatter('explicit', text => text.toUpperCase());
      comp.textFormatters = asFormatters(explicit);

      const result = (comp as any).applyFormattersToParsedHtml('<b>keep</b>');

      expect(fromConfig.format).not.toHaveBeenCalled();
      expect(result).toContain('KEEP');
      expect(result).not.toContain('!');
    });
  });

  // -------------------------------------------------------------------------
  // sanitizeHtml
  // -------------------------------------------------------------------------
  describe('sanitizeHtml', () => {
    it('returns an empty string for empty html without calling the sanitizer', () => {
      const { comp, htmlSanitizer } = createHarness();
      const sanitize = vi.spyOn(htmlSanitizer, 'sanitize');

      expect((comp as any).sanitizeHtml('')).toBe('');
      expect(sanitize).not.toHaveBeenCalled();
    });

    it('returns an empty string for undefined html', () => {
      const { comp } = createHarness();

      expect((comp as any).sanitizeHtml(undefined)).toBe('');
    });

    it('returns an empty string for a non-string value', () => {
      const { comp } = createHarness();

      expect((comp as any).sanitizeHtml(123)).toBe('');
      expect((comp as any).sanitizeHtml({})).toBe('');
    });

    it('returns an empty string for whitespace-only html', () => {
      const { comp, htmlSanitizer } = createHarness();
      const sanitize = vi.spyOn(htmlSanitizer, 'sanitize');

      expect((comp as any).sanitizeHtml('   \n\t ')).toBe('');
      expect(sanitize).not.toHaveBeenCalled();
    });

    it('delegates real html to the sanitizer service', () => {
      const { comp, htmlSanitizer } = createHarness();
      const sanitize = stubSanitize(htmlSanitizer);

      expect((comp as any).sanitizeHtml('<b>hi</b>')).toBe('[S]<b>hi</b>');
      expect(sanitize).toHaveBeenCalledWith('<b>hi</b>');
    });
  });
});

/**
 * Makes the sanitizer a pass-through so a test can assert on what the
 * mention-stripping step produced, with no sanitizer rewriting on top.
 */
function stripOnly(htmlSanitizer: HtmlSanitizerService): void {
  vi.spyOn(htmlSanitizer, 'sanitize').mockImplementation((html: string) => html);
}
