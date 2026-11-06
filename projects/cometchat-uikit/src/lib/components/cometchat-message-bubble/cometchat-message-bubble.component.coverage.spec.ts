/**
 * CometChatMessageBubble — logic coverage
 *
 * The existing bubble suite drives the component through its TEMPLATE against a
 * real SDK session, so most of the class's decision logic — call-status mapping,
 * quoted-message reconstruction, receipt state, accessibility labels, keyboard
 * handling, extension URL extraction — is never reached.
 *
 * These tests go at the instance directly: no `detectChanges`, so no child
 * bubble is instantiated and no live session is needed. Every assertion is on a
 * value the component computes, never on a mock remembering its own arguments.
 *
 * @module components/cometchat-message-bubble
 */

// The calls SDK pulls in a JitsiMeetJS runtime that does not exist in jsdom.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange, TemplateRef } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatMessageBubbleComponent } from './cometchat-message-bubble.component';
import { MessageBubbleAlignment, Placement } from '../../Enums/Enums';
import { CometChatUIKitConstants } from '../../constants';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatUIKit } from '../../cometchat-uikit';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { MessageBubbleConfigService } from '../../services/message-bubble-config.service';
import { MessageUtilsService } from '../../services/message-utils.service';
import { CallButtonsService } from '../../services/call-buttons.service';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';

const CATEGORY = CometChatUIKitConstants.MessageCategory;
const TYPE = CometChatUIKitConstants.MessageTypes;
const EXT = CometChatUIKitConstants.ExtensionTypes;
const CALLS = CometChatUIKitConstants.calls;
const MOD = CometChatUIKitConstants.moderationStatus;
const L = (key: string) => CometChatLocalize.getLocalizedString(key);

/**
 * A message stub carrying only the accessors the class under test reads. Using
 * a stub rather than an SDK instance keeps each test's inputs visible and lets
 * an accessor be absent entirely, which several guards branch on.
 */
function msg(overrides: Record<string, unknown> = {}): CometChat.BaseMessage {
  const base: Record<string, unknown> = {
    getId: () => 101,
    getMuid: () => 'muid-101',
    getType: () => TYPE.text,
    getCategory: () => CATEGORY.message,
    getSender: () => null,
    getDeletedAt: () => undefined,
    getEditedAt: () => undefined,
    getSentAt: () => 0,
    getReadAt: () => undefined,
    getDeliveredAt: () => undefined,
    getReplyCount: () => 0,
    getUnreadRepliesCount: () => 0,
    getReactions: () => [],
  };
  return { ...base, ...overrides } as unknown as CometChat.BaseMessage;
}

/** A call message stub: `callStatus` drives every call-flavoured getter. */
function callMsg(callStatus: string, type: string = TYPE.audio, extras: Record<string, unknown> = {}) {
  return msg({
    getCategory: () => CATEGORY.call,
    getType: () => type,
    getStatus: () => callStatus,
    ...extras,
  });
}

/** A reaction-count stub — only `getCount` is read, by the a11y summary. */
function reaction(count: number): CometChat.ReactionCount {
  return { getCount: () => count } as unknown as CometChat.ReactionCount;
}

function user(uid: string, name = uid): CometChat.User {
  return new CometChat.User({ uid, name });
}

describe('CometChatMessageBubbleComponent — logic coverage', () => {
  let fixture: ComponentFixture<CometChatMessageBubbleComponent>;
  let c: CometChatMessageBubbleComponent;

  function build(providers: unknown[] = []): void {
    TestBed.configureTestingModule({
      imports: [CometChatMessageBubbleComponent],
      providers: providers as never[],
    });
    fixture = TestBed.createComponent(CometChatMessageBubbleComponent);
    c = fixture.componentInstance;
  }

  beforeEach(() => build());

  afterEach(() => {
    vi.useRealTimers();
    fixture?.destroy();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // Lifecycle
  // =========================================================================
  describe('lifecycle', () => {
    it('adopts the signed-in user on init, so outgoing detection has something to compare against', () => {
      const me = user('me');
      vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(me);
      c.message = msg({ getSender: () => me });

      expect(c.isOutgoing).toBe(false); // no logged-in user yet
      c.ngOnInit();

      expect(c.loggedInUser).toBe(me);
      expect(c.isOutgoing).toBe(true);
    });

    it('re-checks the view when the bubble config service publishes a change', () => {
      const cdr = (c as unknown as { cdr: { markForCheck: () => void } }).cdr;
      const mark = vi.spyOn(cdr, 'markForCheck');
      c.ngOnInit();
      mark.mockClear();

      TestBed.inject(MessageBubbleConfigService).configChanged$.next();

      expect(mark).toHaveBeenCalledTimes(1);
    });

    it('stops listening to the config service once destroyed', () => {
      const cdr = (c as unknown as { cdr: { markForCheck: () => void } }).cdr;
      const mark = vi.spyOn(cdr, 'markForCheck');
      c.ngOnInit();
      const service = TestBed.inject(MessageBubbleConfigService);
      fixture.destroy();
      mark.mockClear();

      service.configChanged$.next();

      expect(mark).not.toHaveBeenCalled();
    });

    it('re-checks only when the message itself changed', () => {
      const cdr = (c as unknown as { cdr: { markForCheck: () => void } }).cdr;
      const mark = vi.spyOn(cdr, 'markForCheck');

      c.ngOnChanges({ message: new SimpleChange(null, msg(), true) });
      expect(mark).toHaveBeenCalledTimes(1);

      c.ngOnChanges({ isSelected: new SimpleChange(false, true, false) });
      expect(mark).toHaveBeenCalledTimes(1);
    });

    it('treats a narrow window as mobile and follows later resizes', () => {
      const original = window.innerWidth;
      try {
        Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true, writable: true });
        c.ngOnInit();
        expect((c as unknown as { isMobile: boolean }).isMobile).toBe(false);

        const cdr = (c as unknown as { cdr: { markForCheck: () => void } }).cdr;
        const mark = vi.spyOn(cdr, 'markForCheck');

        Object.defineProperty(window, 'innerWidth', { value: 480, configurable: true, writable: true });
        window.dispatchEvent(new Event('resize'));
        expect((c as unknown as { isMobile: boolean }).isMobile).toBe(true);
        expect(mark).toHaveBeenCalledTimes(1);

        // Same side of the breakpoint — nothing to redraw.
        Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true, writable: true });
        window.dispatchEvent(new Event('resize'));
        expect((c as unknown as { isMobile: boolean }).isMobile).toBe(true);
        expect(mark).toHaveBeenCalledTimes(1);
      } finally {
        Object.defineProperty(window, 'innerWidth', { value: original, configurable: true, writable: true });
      }
    });

    it('drops the resize listener on destroy, so a torn-down bubble stops reacting', () => {
      const original = window.innerWidth;
      try {
        Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true, writable: true });
        c.ngOnInit();
        fixture.destroy();

        Object.defineProperty(window, 'innerWidth', { value: 320, configurable: true, writable: true });
        window.dispatchEvent(new Event('resize'));

        expect((c as unknown as { isMobile: boolean }).isMobile).toBe(false);
      } finally {
        Object.defineProperty(window, 'innerWidth', { value: original, configurable: true, writable: true });
      }
    });
  });

  // =========================================================================
  // Content-view width observation
  // =========================================================================
  describe('content-view width', () => {
    let observers: Array<{ cb: ResizeObserverCallback; disconnect: () => void }>;
    let OriginalResizeObserver: typeof ResizeObserver;

    beforeEach(() => {
      observers = [];
      OriginalResizeObserver = globalThis.ResizeObserver;
      globalThis.ResizeObserver = class {
        constructor(cb: ResizeObserverCallback) {
          observers.push({ cb, disconnect: () => undefined });
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      } as unknown as typeof ResizeObserver;
    });

    afterEach(() => {
      globalThis.ResizeObserver = OriginalResizeObserver;
    });

    function attachContentView(offsetWidth = 0): void {
      const el = document.createElement('div');
      Object.defineProperty(el, 'offsetWidth', { value: offsetWidth, configurable: true });
      (c as unknown as { contentViewRef?: { nativeElement: HTMLElement } }).contentViewRef = {
        nativeElement: el,
      };
    }

    it('skips observation entirely when there is no content view element', () => {
      c.ngAfterViewInit();
      expect(observers).toHaveLength(0);
      expect(c.contentViewWidth()).toBe(0);
    });

    it('seeds the width from the element and updates it when the observer reports a new one', () => {
      attachContentView(312);
      c.ngAfterViewInit();
      expect(c.contentViewWidth()).toBe(312);

      observers[0].cb([{ contentRect: { width: 404 } }] as unknown as ResizeObserverEntry[], {} as ResizeObserver);
      expect(c.contentViewWidth()).toBe(404);

      // An identical measurement must not re-notify; the signal keeps its value.
      observers[0].cb([{ contentRect: { width: 404 } }] as unknown as ResizeObserverEntry[], {} as ResizeObserver);
      expect(c.contentViewWidth()).toBe(404);
    });

    it('ignores a measurement that arrives after the bubble was destroyed', () => {
      attachContentView(200);
      c.ngAfterViewInit();
      const observer = observers[0];
      fixture.destroy();

      observer.cb([{ contentRect: { width: 999 } }] as unknown as ResizeObserverEntry[], {} as ResizeObserver);

      expect(c.contentViewWidth()).toBe(200);
    });

    it('disconnects the observer on destroy', () => {
      attachContentView(200);
      c.ngAfterViewInit();
      const observer = (c as unknown as { contentViewResizeObserver: ResizeObserver }).contentViewResizeObserver;
      const disconnect = vi.spyOn(observer, 'disconnect');

      c.ngOnDestroy();

      expect(disconnect).toHaveBeenCalledTimes(1);
      expect((c as unknown as { contentViewResizeObserver: unknown }).contentViewResizeObserver).toBeNull();
    });

    it('widens the moderation notice to the content, but never below the 240px floor', () => {
      c.contentViewWidth.set(400);
      expect(c.moderationIndicatorWidth()).toBe('calc(400px + var(--cometchat-padding-1) * 2)');

      c.contentViewWidth.set(240);
      expect(c.moderationIndicatorWidth()).toBe('calc(240px + var(--cometchat-padding-1) * 2)');

      c.contentViewWidth.set(239);
      expect(c.moderationIndicatorWidth()).toBe('240px');
    });
  });

  // =========================================================================
  // Inputs backed by signals, and their global-config fallbacks
  // =========================================================================
  describe('signal-backed inputs', () => {
    it('reads back each setter through its own getter', () => {
      c.hideReceipts = true;
      c.hideAvatar = true;
      c.hideModerationView = true;
      const formatter = { format: () => '' };
      c.textFormatters = [formatter] as never;

      expect(c.hideReceipts).toBe(true);
      expect(c.hideAvatar).toBe(true);
      expect(c.hideModerationView).toBe(true);
      expect(c.textFormatters).toEqual([formatter]);
    });

    it('ignores a null textFormatters assignment instead of blanking the list', () => {
      const formatter = { format: () => '' };
      c.textFormatters = [formatter] as never;
      c.textFormatters = undefined;

      expect(c.textFormatters).toEqual([formatter]);
      expect(c.effectiveTextFormatters()).toEqual([formatter]);
    });

    it('falls back to its own defaults when nothing was set and no global config exists', () => {
      expect(c.effectiveHideReceipts()).toBe(false);
      expect(c.effectiveHideAvatar()).toBe(false);
      expect(c.effectiveTextFormatters()).toBeUndefined();
      expect(c.effectiveHideModerationView()).toBe(false);
    });
  });

  describe('signal-backed inputs with a global config', () => {
    const globalFormatter = { format: () => 'global' };
    const config: Partial<GlobalConfig> = {
      hideReceipts: true,
      hideAvatar: true,
      textFormatters: [globalFormatter] as never,
    };

    beforeEach(() => {
      fixture.destroy();
      TestBed.resetTestingModule();
      build([{ provide: COMETCHAT_GLOBAL_CONFIG, useValue: config }]);
    });

    it('takes the app-wide defaults while the host has set nothing', () => {
      expect(c.effectiveHideReceipts()).toBe(true);
      expect(c.effectiveHideAvatar()).toBe(true);
      expect(c.effectiveTextFormatters()).toEqual([globalFormatter]);
    });

    it('lets an explicit input override the app-wide default', () => {
      c.hideReceipts = false;
      c.hideAvatar = false;
      c.textFormatters = [] as never;

      expect(c.effectiveHideReceipts()).toBe(false);
      expect(c.effectiveHideAvatar()).toBe(false);
      expect(c.effectiveTextFormatters()).toEqual([]);
    });

    it('never takes the moderation notice from the global config — it has no such key', () => {
      expect(c.effectiveHideModerationView()).toBe(false);
    });
  });

  describe('signal-backed inputs with an empty global config', () => {
    beforeEach(() => {
      fixture.destroy();
      TestBed.resetTestingModule();
      build([{ provide: COMETCHAT_GLOBAL_CONFIG, useValue: {} }]);
    });

    it('falls through a config that omits the keys', () => {
      expect(c.effectiveHideReceipts()).toBe(false);
      expect(c.effectiveHideAvatar()).toBe(false);
      expect(c.effectiveTextFormatters()).toBeUndefined();
    });
  });

  // =========================================================================
  // Identity getters
  // =========================================================================
  describe('message identity', () => {
    it('prefers the server id, falls back to the muid, then to empty', () => {
      c.message = msg({ getId: () => 77 });
      expect(c.messageId).toBe(77);

      c.message = msg({ getId: () => 0, getMuid: () => 'local-1' });
      expect(c.messageId).toBe('local-1');

      c.message = msg({ getId: () => 0, getMuid: () => '' });
      expect(c.messageId).toBe('');
    });

    it('reports empty identity fields when there is no message at all', () => {
      expect(c.messageId).toBe('');
      expect(c.messageType).toBe('');
      expect(c.messageCategory).toBe('');
      expect(c.messageTypeKey).toBe('');
      expect(c.bubbleTypeClassName).toBe('');
      expect(c.getBubbleType()).toBe('unsupported');
    });

    it('normalises a missing type or category to empty strings', () => {
      c.message = msg({ getType: () => undefined, getCategory: () => undefined });
      expect(c.messageType).toBe('');
      expect(c.messageCategory).toBe('');
      expect(c.messageTypeKey).toBe('_');
    });

    it('builds the type key the view registry is indexed by', () => {
      c.message = msg({ getType: () => TYPE.image, getCategory: () => CATEGORY.message });
      expect(c.messageTypeKey).toBe('image_message');
    });
  });

  // =========================================================================
  // Palette / layout classes
  // =========================================================================
  describe('bubble classes', () => {
    it('maps each alignment to its palette class', () => {
      c.alignment = MessageBubbleAlignment.left;
      expect(c.bubbleClassName).toBe('cometchat-message-bubble-incoming');
      c.alignment = MessageBubbleAlignment.right;
      expect(c.bubbleClassName).toBe('cometchat-message-bubble-outgoing');
      c.alignment = MessageBubbleAlignment.center;
      expect(c.bubbleClassName).toBe('cometchat-message-bubble-action');
    });

    it('falls back to the outgoing palette for an alignment outside the enum', () => {
      c.alignment = 99 as unknown as MessageBubbleAlignment;
      expect(c.bubbleClassName).toBe('cometchat-message-bubble-outgoing');
    });

    it('keys a developer card off its category, so it gets the text-like container', () => {
      c.message = msg({ getCategory: () => CATEGORY.card, getType: () => 'anything-at-all' });
      expect(c.bubbleTypeClassName).toBe('cometchat-message-bubble__card-message');
    });

    it('maps a known type_category pair to its bubble-type class and an unknown one to nothing', () => {
      c.message = msg({ getType: () => TYPE.image, getCategory: () => CATEGORY.message });
      expect(c.bubbleTypeClassName).toBe('cometchat-message-bubble__image-message');

      c.message = msg({ getType: () => 'sonar', getCategory: () => 'ping' });
      expect(c.bubbleTypeClassName).toBe('');
    });
  });

  // =========================================================================
  // Bubble-type routing
  // =========================================================================
  describe('getBubbleType', () => {
    function typeOf(type: string, category: string, extras: Record<string, unknown> = {}): string {
      c.message = msg({ getType: () => type, getCategory: () => category, ...extras });
      return c.getBubbleType();
    }

    it('routes calls and group actions by category alone', () => {
      expect(typeOf(TYPE.audio, CATEGORY.call)).toBe('call');
      expect(typeOf(TYPE.groupMember, CATEGORY.action)).toBe('action');
    });

    it('routes every media type in the message category to its batch bubble', () => {
      expect(typeOf(TYPE.image, CATEGORY.message)).toBe('images-batch');
      expect(typeOf(TYPE.video, CATEGORY.message)).toBe('videos-batch');
      expect(typeOf(TYPE.file, CATEGORY.message)).toBe('files-batch');
      expect(typeOf(TYPE.audio, CATEGORY.message)).toBe('audios-batch');
      expect(typeOf(TYPE.text, CATEGORY.message)).toBe('text');
    });

    it('sends a tagged audio message to the voice-note bubble instead of the audio batch', () => {
      expect(
        typeOf(TYPE.audio, CATEGORY.message, {
          getMetadata: () => ({ [CometChatUIKitConstants.MetadataKeys.audioType]: CometChatUIKitConstants.AudioType.voiceNote }),
        })
      ).toBe('voice-note');

      expect(
        typeOf(TYPE.audio, CATEGORY.message, {
          getMetadata: () => ({ [CometChatUIKitConstants.MetadataKeys.audioType]: CometChatUIKitConstants.AudioType.legacyVoiceNote }),
        })
      ).toBe('voice-note');

      expect(
        typeOf(TYPE.audio, CATEGORY.message, { getMetadata: () => ({ batchId: 'b1' }) })
      ).toBe('audios-batch');
    });

    it('routes each extension type in the custom category', () => {
      expect(typeOf(EXT.poll, CATEGORY.custom)).toBe('poll');
      expect(typeOf(EXT.sticker, CATEGORY.custom)).toBe('sticker');
      expect(typeOf(EXT.document, CATEGORY.custom)).toBe('document');
      expect(typeOf(EXT.whiteboard, CATEGORY.custom)).toBe('whiteboard');
      expect(typeOf(CALLS.meeting, CATEGORY.custom)).toBe('meeting');
    });

    it('calls an unrecognised custom type unsupported rather than guessing', () => {
      expect(typeOf('extension_unknown', CATEGORY.custom)).toBe('unsupported');
    });

    it('routes a developer card and an assistant reply', () => {
      expect(typeOf('whatever', CATEGORY.card)).toBe('card');
      expect(typeOf(TYPE.assistant, CATEGORY.agentic)).toBe('ai-assistant');
    });

    it('does not reach the tool-call bubbles, because the lookup key is spelled with underscores', () => {
      // Current behaviour, and a defect: the SDK's own types are `tool-result`
      // and `tool-arguments` (hyphens), so the key built here is
      // "tool-result_agentic" while the table is keyed "tool_result_agentic".
      // The template has @case arms for both, so they are simply unreachable.
      expect(TYPE.toolResults).toBe('tool-result');
      expect(TYPE.toolArguments).toBe('tool-arguments');
      expect(typeOf(TYPE.toolResults, CATEGORY.agentic)).toBe('unsupported');
      expect(typeOf(TYPE.toolArguments, CATEGORY.agentic)).toBe('unsupported');
    });

    it('falls back to unsupported for a category it knows nothing about', () => {
      expect(typeOf('holo', 'projection')).toBe('unsupported');
    });

    it('marks exactly the four per-type batch bubbles as batches', () => {
      expect(typeOf(TYPE.image, CATEGORY.message)).toBe(c.contentType);
      expect(c.isBatchBubble).toBe(true);

      typeOf(TYPE.video, CATEGORY.message);
      expect(c.isBatchBubble).toBe(true);
      typeOf(TYPE.audio, CATEGORY.message);
      expect(c.isBatchBubble).toBe(true);
      typeOf(TYPE.file, CATEGORY.message);
      expect(c.isBatchBubble).toBe(true);

      typeOf(TYPE.text, CATEGORY.message);
      expect(c.isBatchBubble).toBe(false);
    });
  });

  // =========================================================================
  // Which sub-views show
  // =========================================================================
  describe('sub-view visibility', () => {
    it('hides the leading view for a centred bubble and when the avatar is hidden', () => {
      c.alignment = MessageBubbleAlignment.center;
      expect(c.shouldShowLeadingView).toBe(false);

      c.alignment = MessageBubbleAlignment.left;
      c.hideAvatar = true;
      expect(c.shouldShowLeadingView).toBe(false);
    });

    it('shows the leading view on the left, and anywhere a custom one was supplied', () => {
      c.alignment = MessageBubbleAlignment.left;
      expect(c.shouldShowLeadingView).toBe(true);

      c.alignment = MessageBubbleAlignment.right;
      expect(c.shouldShowLeadingView).toBe(false);

      c.leadingView = {} as TemplateRef<unknown>;
      expect(c.shouldShowLeadingView).toBe(true);
    });

    it('hides the sender name for a centred bubble and when asked to', () => {
      c.alignment = MessageBubbleAlignment.center;
      expect(c.shouldShowHeaderView).toBe(false);

      c.alignment = MessageBubbleAlignment.left;
      c.hideSenderName = true;
      expect(c.shouldShowHeaderView).toBe(false);

      c.hideSenderName = false;
      expect(c.shouldShowHeaderView).toBe(true);

      c.alignment = MessageBubbleAlignment.right;
      expect(c.shouldShowHeaderView).toBe(false);
      c.headerView = {} as TemplateRef<unknown>;
      expect(c.shouldShowHeaderView).toBe(true);
    });

    it('shows the reply preview only for a live, non-action message that quotes one', () => {
      const quoted = msg({ getId: () => 5 });
      c.message = msg({ getQuotedMessage: () => quoted });
      expect(c.shouldShowReplyView).toBe(true);

      c.message = msg({ getQuotedMessage: () => quoted, getDeletedAt: () => 1700000000 });
      expect(c.shouldShowReplyView).toBe(false);

      c.message = msg({ getQuotedMessage: () => quoted, getCategory: () => CATEGORY.action });
      expect(c.shouldShowReplyView).toBe(false);

      c.message = msg();
      expect(c.shouldShowReplyView).toBe(false);
    });

    it('shows the status strip for an ordinary message only', () => {
      c.message = msg();
      expect(c.shouldShowStatusInfoView).toBe(true);

      c.hideStatusInfoView = true;
      expect(c.shouldShowStatusInfoView).toBe(false);
      c.hideStatusInfoView = false;

      c.alignment = MessageBubbleAlignment.center;
      expect(c.shouldShowStatusInfoView).toBe(false);
      c.alignment = MessageBubbleAlignment.right;

      c.message = msg({ getCategory: () => CATEGORY.action });
      expect(c.shouldShowStatusInfoView).toBe(false);

      c.message = msg({ getCategory: () => CATEGORY.call });
      expect(c.shouldShowStatusInfoView).toBe(false);

      c.message = msg({ getCategory: () => CATEGORY.custom, getType: () => 'meeting' });
      expect(c.shouldShowStatusInfoView).toBe(false);

      c.message = msg({ getCategory: () => CATEGORY.custom, getType: () => EXT.poll });
      expect(c.shouldShowStatusInfoView).toBe(true);
    });

    it('shows the thread strip only when a live, non-action message has replies', () => {
      c.message = msg({ getReplyCount: () => 3 });
      expect(c.shouldShowThreadView).toBe(true);

      c.hideThreadView = true;
      expect(c.shouldShowThreadView).toBe(false);
      c.hideThreadView = false;

      c.message = msg({ getReplyCount: () => 3, getDeletedAt: () => 1700000000 });
      expect(c.shouldShowThreadView).toBe(false);

      c.message = msg({ getReplyCount: () => 3, getCategory: () => CATEGORY.action });
      expect(c.shouldShowThreadView).toBe(false);

      c.message = msg({ getReplyCount: () => 0 });
      expect(c.shouldShowThreadView).toBe(false);
    });

    it('shows reactions only on a live, non-action message that has some', () => {
      c.message = msg({ getReactions: () => [reaction(2)] });
      expect(c.hasReactions).toBe(true);
      expect(c.shouldShowReactions).toBe(true);

      c.message = msg({ getReactions: () => [reaction(2)], getDeletedAt: () => 1700000000 });
      expect(c.shouldShowReactions).toBe(false);

      c.message = msg({ getReactions: () => [reaction(2)], getCategory: () => CATEGORY.action });
      expect(c.shouldShowReactions).toBe(false);

      c.message = msg();
      expect(c.shouldShowReactions).toBe(false);
    });
  });

  // =========================================================================
  // Counts and collections
  // =========================================================================
  describe('counts and collections', () => {
    it('reports zero counts and no reactions with no message', () => {
      expect(c.replyCount).toBe(0);
      expect(c.unreadReplyCount).toBe(0);
      expect(c.reactions).toEqual([]);
      expect(c.hasReactions).toBe(false);
    });

    it('passes the SDK counts through, treating a missing count as zero', () => {
      c.message = msg({ getReplyCount: () => 4, getUnreadRepliesCount: () => 2 });
      expect(c.replyCount).toBe(4);
      expect(c.unreadReplyCount).toBe(2);

      c.message = msg({ getReplyCount: () => undefined, getUnreadRepliesCount: () => undefined });
      expect(c.replyCount).toBe(0);
      expect(c.unreadReplyCount).toBe(0);
    });

    it('treats a null reaction list as an empty one', () => {
      c.message = msg({ getReactions: () => null });
      expect(c.reactions).toEqual([]);
      expect(c.hasReactions).toBe(false);
    });
  });

  // =========================================================================
  // Sender, ownership, deletion, edits, pins
  // =========================================================================
  describe('sender and state', () => {
    it('falls back to the signed-in user when the message carries no sender', () => {
      const me = user('me');
      c.loggedInUser = me;

      c.message = msg({ getSender: () => null });
      expect(c.sender).toBe(me);

      const other = user('other');
      c.message = msg({ getSender: () => other });
      expect(c.sender).toBe(other);

      c.loggedInUser = null;
      c.message = msg({ getSender: () => null });
      expect(c.sender).toBeNull();

      c.message = undefined as unknown as CometChat.BaseMessage;
      expect(c.sender).toBeNull();
    });

    it('cannot decide ownership before the signed-in user is known', () => {
      c.message = msg({ getSender: () => user('me') });
      expect(c.isOutgoing).toBe(false);
    });

    it('counts a message with no sender as mine, since it has not left the device yet', () => {
      c.loggedInUser = user('me');
      c.message = msg({ getSender: () => null });
      expect(c.isOutgoing).toBe(true);
    });

    it('compares uids to decide ownership', () => {
      c.loggedInUser = user('me');
      c.message = msg({ getSender: () => user('me') });
      expect(c.isOutgoing).toBe(true);

      c.message = msg({ getSender: () => user('them') });
      expect(c.isOutgoing).toBe(false);
    });

    it('reads deletion from the timestamp, not a flag', () => {
      expect(c.isDeleted).toBe(false);
      c.message = msg({ getDeletedAt: () => undefined });
      expect(c.isDeleted).toBe(false);
      c.message = msg({ getDeletedAt: () => 1700000000 });
      expect(c.isDeleted).toBe(true);
    });

    it('marks only an edited text message as edited', () => {
      expect(c.isEdited).toBe(false);

      c.message = msg({ getEditedAt: () => 1700000000 });
      expect(c.isEdited).toBe(true);

      c.message = msg({ getEditedAt: () => undefined });
      expect(c.isEdited).toBe(false);

      c.message = msg({ getEditedAt: () => 1700000000, getType: () => TYPE.image });
      expect(c.isEdited).toBe(false);

      c.message = msg({ getEditedAt: () => 1700000000, getCategory: () => CATEGORY.custom });
      expect(c.isEdited).toBe(false);
    });

    it('reads the pin and bookmark markers from their timestamps, and drops both once deleted', () => {
      c.message = msg();
      expect(c.isPinned).toBe(false);
      expect(c.isSaved).toBe(false);

      c.message = msg({ getPinnedAt: () => 1700000000, getSavedAt: () => 1700000001 });
      expect(c.isPinned).toBe(true);
      expect(c.isSaved).toBe(true);

      c.message = msg({
        getPinnedAt: () => 1700000000,
        getSavedAt: () => 1700000001,
        getDeletedAt: () => 1700000002,
      });
      expect(c.isPinned).toBe(false);
      expect(c.isSaved).toBe(false);
    });
  });

  // =========================================================================
  // Quoted message
  // =========================================================================
  describe('quoted message', () => {
    it('is absent when the message has no quote accessor at all', () => {
      c.message = msg();
      expect(c.quotedMessage).toBeNull();
    });

    it('is absent with no message, and when the accessor returns nothing', () => {
      expect(c.quotedMessage).toBeNull();
      c.message = msg({ getQuotedMessage: () => null });
      expect(c.quotedMessage).toBeNull();
    });

    it('passes a proper SDK message straight through', () => {
      const quoted = new CometChat.TextMessage('u2', 'hello', CometChat.RECEIVER_TYPE.USER);
      c.message = msg({ getQuotedMessage: () => quoted });
      expect(c.quotedMessage).toBe(quoted);
    });

    it('rebuilds a prototype-less quote the server sent as a plain object', () => {
      c.message = msg({
        getQuotedMessage: () => ({
          id: 42,
          type: 'text',
          text: 'quoted body',
          receiverId: 'u2',
          receiverType: 'user',
          sentAt: 1700000000,
          sender: { uid: 'them', name: 'Them' },
        }),
      });

      const rebuilt = c.quotedMessage as CometChat.TextMessage;
      expect(rebuilt).toBeInstanceOf(CometChat.TextMessage);
      expect(rebuilt.getId()).toBe(42);
      expect(rebuilt.getType()).toBe('text');
      expect(rebuilt.getText()).toBe('quoted body');
      expect(rebuilt.getSentAt()).toBe(1700000000);
      expect(rebuilt.getSender().getUid()).toBe('them');
      expect(rebuilt.getSender().getName()).toBe('Them');
      expect(rebuilt.getDeletedAt()).toBeUndefined();
    });

    it('reads the body out of the nested data object when the top-level text is missing', () => {
      c.message = msg({
        getQuotedMessage: () => ({ type: 'text', data: { text: 'nested body' }, receiverId: 'u2' }),
      });
      expect((c.quotedMessage as CometChat.TextMessage).getText()).toBe('nested body');
    });

    it('leaves the body empty for a text quote with no text anywhere', () => {
      c.message = msg({ getQuotedMessage: () => ({ type: 'text', receiverId: 'u2' }) });
      expect((c.quotedMessage as CometChat.TextMessage).getText()).toBe('');
    });

    it('keeps a non-text quote typed as itself, with no body copied across', () => {
      c.message = msg({
        getQuotedMessage: () => ({ messageType: 'image', text: 'ignored', receiverId: 'u2' }),
      });
      const rebuilt = c.quotedMessage as CometChat.TextMessage;
      expect(rebuilt.getType()).toBe('image');
      expect(rebuilt.getText()).toBe('');
    });

    it('defaults a quote with no type of its own to text', () => {
      c.message = msg({ getQuotedMessage: () => ({ text: 'bare', receiverId: 'u2' }) });
      const rebuilt = c.quotedMessage as CometChat.TextMessage;
      expect(rebuilt.getType()).toBe('text');
      expect(rebuilt.getText()).toBe('bare');
    });

    it('defaults the receiver fields the server left out', () => {
      c.message = msg({ getQuotedMessage: () => ({ type: 'text', text: 'x' }) });
      const rebuilt = c.quotedMessage as CometChat.TextMessage;
      expect(rebuilt.getReceiverId()).toBe('');
      expect(rebuilt.getReceiverType()).toBe('user');
    });

    it('defaults a sender whose uid and name the server omitted', () => {
      c.message = msg({
        getQuotedMessage: () => ({ type: 'text', text: 'x', receiverId: 'u2', sender: {} }),
      });
      const sender = (c.quotedMessage as CometChat.TextMessage).getSender();
      expect(sender.getUid()).toBe('');
      expect(sender.getName()).toBe('');
    });

    it('carries a deleted quote across as deleted', () => {
      c.message = msg({
        getQuotedMessage: () => ({ type: 'text', text: 'gone', receiverId: 'u2', deletedAt: 1700000009 }),
      });
      expect((c.quotedMessage as CometChat.TextMessage).getDeletedAt()).toBe(1700000009);
    });

    it("defers to the SDK's own type once the recorded type is cleared", () => {
      c.message = msg({
        getQuotedMessage: () => ({ messageType: 'video', text: '', receiverId: 'u2' }),
      });
      const rebuilt = c.quotedMessage as unknown as Record<string, unknown>;
      expect((rebuilt as unknown as CometChat.TextMessage).getType()).toBe('video');

      delete rebuilt['_originalType'];
      expect((rebuilt as unknown as CometChat.TextMessage).getType()).toBe('text');
    });

    it('gives up on a quote it cannot rebuild rather than throwing at the view', () => {
      const hostile = {
        type: 'text',
        text: 'boom',
        receiverId: 'u2',
        get sender() {
          throw new Error('corrupt sender payload');
        },
      };
      c.message = msg({ getQuotedMessage: () => hostile });

      expect(c.quotedMessage).toBeNull();
    });
  });

  // =========================================================================
  // Action and call text
  // =========================================================================
  describe('action message text', () => {
    it('is empty with no message and for an ordinary message', () => {
      expect(c.actionMessageText).toBe('');
      c.message = msg();
      expect(c.actionMessageText).toBe('');
    });

    it('renders a group action through the shared action formatter', () => {
      const action = {
        ...(msg({ getCategory: () => CATEGORY.action, getType: () => TYPE.groupMember }) as unknown as Record<string, unknown>),
        action: CometChatUIKitConstants.groupMemberAction.JOINED,
        actionBy: { name: 'Iron Man' },
        actionOn: { name: 'Iron Man' },
      };
      c.message = action as unknown as CometChat.BaseMessage;

      const expected = TestBed.inject(MessageUtilsService).getActionMessage(
        c.message as CometChat.Action
      );
      expect(expected).not.toBe('');
      expect(c.actionMessageText).toBe(expected);
      expect(c.actionMessageText).toContain('Iron Man');
    });

    it('routes a call message to the call subtitle instead', () => {
      c.loggedInUser = user('me');
      c.message = callMsg(CALLS.initiated, TYPE.audio, { getSender: () => user('me') });
      expect(c.actionMessageText).toBe(L('conversation_subtitle_outgoing_call'));
    });
  });

  describe('call subtitle, class and icon', () => {
    /** Outgoing because the sender is the signed-in user. */
    function outgoing(status: string, type: string = TYPE.audio) {
      c.loggedInUser = user('me');
      c.message = callMsg(status, type, { getSender: () => user('me') });
    }

    /** Incoming because someone else sent it. */
    function incoming(status: string, type: string = TYPE.audio) {
      c.loggedInUser = user('me');
      c.message = callMsg(status, type, { getSender: () => user('them') });
    }

    it('has no subtitle without a message', () => {
      expect((c as unknown as { getCallMessageText: () => string }).getCallMessageText()).toBe('');
    });

    it('labels every status of a call I placed', () => {
      const cases: Array<[string, string]> = [
        [CALLS.initiated, 'conversation_subtitle_outgoing_call'],
        [CALLS.cancelled, 'conversation_subtitle_cancelled_call'],
        [CALLS.rejected, 'conversation_subtitle_rejected_call'],
        [CALLS.busy, 'conversation_subtitle_missed_call'],
        [CALLS.ended, 'conversation_subtitle_ended_call'],
        [CALLS.ongoing, 'conversation_subtitle_answered_call'],
        [CALLS.unanswered, 'conversation_subtitle_unasnwered_call'],
        ['some-future-status', 'conversation_subtitle_outgoing_call'],
      ];
      for (const [status, key] of cases) {
        outgoing(status);
        expect(c.actionMessageText).toBe(L(key));
      }
    });

    it('labels every status of a call I received', () => {
      const cases: Array<[string, string]> = [
        [CALLS.initiated, 'conversation_subtitle_incoming_call'],
        [CALLS.ongoing, 'conversation_subtitle_answered_call'],
        [CALLS.ended, 'conversation_subtitle_ended_call'],
        [CALLS.unanswered, 'conversation_subtitle_missed_call'],
        [CALLS.cancelled, 'conversation_subtitle_missed_call'],
        [CALLS.busy, 'conversation_subtitle_busy_call'],
        [CALLS.rejected, 'conversation_subtitle_rejected_call'],
        ['some-future-status', 'conversation_subtitle_outgoing_call'],
      ];
      for (const [status, key] of cases) {
        incoming(status);
        expect(c.actionMessageText).toBe(L(key));
      }
    });

    it('reads a status set as a bare field on messages with no getter', () => {
      c.loggedInUser = user('me');
      c.message = msg({
        getCategory: () => CATEGORY.call,
        getSender: () => user('me'),
        status: CALLS.ended,
      });
      expect(c.actionMessageText).toBe(L('conversation_subtitle_ended_call'));

      c.message = msg({ getCategory: () => CATEGORY.call, getSender: () => user('me') });
      expect(c.actionMessageText).toBe(L('conversation_subtitle_outgoing_call'));
    });

    it('has no status class for anything that is not a call', () => {
      expect(c.callStatusClass).toBe('');
      c.message = msg();
      expect(c.callStatusClass).toBe('');
    });

    it('maps each call subtitle to its own status class', () => {
      outgoing(CALLS.initiated);
      expect(c.callStatusClass).toBe('cometchat-message-bubble__outgoing-call');
      incoming(CALLS.initiated);
      expect(c.callStatusClass).toBe('cometchat-message-bubble__incoming-call');
      outgoing(CALLS.cancelled);
      expect(c.callStatusClass).toBe('cometchat-message-bubble__cancelled-call');
      outgoing(CALLS.rejected);
      expect(c.callStatusClass).toBe('cometchat-message-bubble__rejected-call');
      incoming(CALLS.busy);
      expect(c.callStatusClass).toBe('cometchat-message-bubble__busy-call');
      outgoing(CALLS.ended);
      expect(c.callStatusClass).toBe('cometchat-message-bubble__ended-call');
      outgoing(CALLS.ongoing);
      expect(c.callStatusClass).toBe('cometchat-message-bubble__answered-call');
      outgoing(CALLS.unanswered);
      expect(c.callStatusClass).toBe('cometchat-message-bubble__unanswered-call');
      incoming(CALLS.unanswered);
      expect(c.callStatusClass).toBe('cometchat-message-bubble__missed-call');
    });

    it('asks for no status class when the subtitle is one the class map never learnt', () => {
      // A translation bundle that adds a call state this map predates would land
      // here; the bubble must simply go unstyled rather than pick a wrong class.
      outgoing(CALLS.ended);
      (c as unknown as { getCallMessageText: () => string }).getCallMessageText = () => 'Call Teleported';
      expect(c.callStatusClass).toBe('');
    });

    it('has no icon for anything that is not a call', () => {
      expect(c.callIconUrl).toBe('');
      c.message = msg();
      expect(c.callIconUrl).toBe('');
    });

    it('picks the audio call icon that matches the subtitle', () => {
      outgoing(CALLS.initiated);
      expect(c.callIconUrl).toBe('assets/phone_outgoing_no_fill.svg');
      incoming(CALLS.initiated);
      expect(c.callIconUrl).toBe('assets/phone_incoming_no_fill.svg');
      incoming(CALLS.unanswered);
      expect(c.callIconUrl).toBe('assets/phone_missed_no_fill.svg');
      outgoing(CALLS.ended);
      expect(c.callIconUrl).toBe('assets/call_end_no_fill.svg');
      outgoing(CALLS.ongoing);
      expect(c.callIconUrl).toBe('assets/audio_call_button.svg');
    });

    it('picks the video call icon that matches the subtitle', () => {
      outgoing(CALLS.initiated, TYPE.video);
      expect(c.callIconUrl).toBe('assets/outgoing_video_no_fill.svg');
      incoming(CALLS.initiated, TYPE.video);
      expect(c.callIconUrl).toBe('assets/incoming_video_no_fill.svg');
      incoming(CALLS.unanswered, TYPE.video);
      expect(c.callIconUrl).toBe('assets/missed_video_call_no_fill.svg');
      outgoing(CALLS.ended, TYPE.video);
      expect(c.callIconUrl).toBe('assets/call_end_no_fill.svg');
      outgoing(CALLS.ongoing, TYPE.video);
      expect(c.callIconUrl).toBe('assets/video_call_button.svg');
    });

    it('tints the icon as an error for every unsuccessful outcome only', () => {
      expect(c.callIconErrorColor).toBe(false);
      c.message = msg();
      expect(c.callIconErrorColor).toBe(false);

      for (const status of [CALLS.unanswered, CALLS.cancelled, CALLS.ended, CALLS.busy, CALLS.rejected]) {
        outgoing(status);
        expect(c.callIconErrorColor).toBe(true);
      }

      outgoing(CALLS.ongoing);
      expect(c.callIconErrorColor).toBe(false);
      outgoing(CALLS.initiated);
      expect(c.callIconErrorColor).toBe(false);
    });

    it('reads the error tint from a bare status field too, and ignores a statusless call', () => {
      c.loggedInUser = user('me');
      c.message = msg({ getCategory: () => CATEGORY.call, status: CALLS.busy });
      expect(c.callIconErrorColor).toBe(true);

      c.message = msg({ getCategory: () => CATEGORY.call });
      expect(c.callIconErrorColor).toBe(false);
    });

    it('offers Join while a call is live or ringing, and nothing once it is over for good', () => {
      expect(c.getCallButtonText()).toBe('');

      c.message = callMsg(CALLS.ongoing);
      expect(c.getCallButtonText()).toBe(L('message_list_join_call'));

      c.message = callMsg(CALLS.initiated);
      expect(c.getCallButtonText()).toBe(L('message_list_join_call'));

      c.message = callMsg(CALLS.ended);
      expect(c.getCallButtonText()).toBe(L('message_list_join_call'));

      c.message = callMsg(CALLS.rejected);
      expect(c.getCallButtonText()).toBe('');

      c.message = msg({ getCategory: () => CATEGORY.call });
      expect(c.getCallButtonText()).toBe('');
    });
  });

  // =========================================================================
  // Joining a call from the bubble
  // =========================================================================
  describe('joining a call from the bubble', () => {
    let join: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      join = vi.spyOn(TestBed.inject(CallButtonsService), 'joinMeeting').mockImplementation(() => undefined);
    });

    it('prefers the session id the event carries', () => {
      c.onCallBubbleJoinClick({
        sessionId: 'from-event',
        message: msg({ getCustomData: () => ({ sessionID: 'from-data' }) }),
      } as never);

      expect(join).toHaveBeenCalledWith('from-event', false);
    });

    it('falls back through the custom data, then the message accessor', () => {
      c.onCallBubbleJoinClick({
        message: msg({ getCustomData: () => ({ sessionID: 'upper-id' }) }),
      } as never);
      expect(join).toHaveBeenLastCalledWith('upper-id', false);

      c.onCallBubbleJoinClick({
        message: msg({ getCustomData: () => ({ sessionId: 'lower-id' }) }),
      } as never);
      expect(join).toHaveBeenLastCalledWith('lower-id', false);

      c.onCallBubbleJoinClick({
        message: msg({ getSessionId: () => 'accessor-id' }),
      } as never);
      expect(join).toHaveBeenLastCalledWith('accessor-id', false);
    });

    it('joins audio-only when the call type says audio, whichever source it came from', () => {
      c.onCallBubbleJoinClick({
        sessionId: 's1',
        message: msg({ getCustomData: () => ({ callType: TYPE.audio }) }),
      } as never);
      expect(join).toHaveBeenLastCalledWith('s1', true);

      c.onCallBubbleJoinClick({
        sessionId: 's2',
        message: msg({ getType: () => TYPE.audio }),
      } as never);
      expect(join).toHaveBeenLastCalledWith('s2', true);

      c.onCallBubbleJoinClick({
        sessionId: 's3',
        message: msg({ getType: () => TYPE.video }),
      } as never);
      expect(join).toHaveBeenLastCalledWith('s3', false);
    });

    it('does not attempt to join when no session id can be found anywhere', () => {
      c.onCallBubbleJoinClick({ message: msg() } as never);
      c.onCallBubbleJoinClick({} as never);

      expect(join).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Options, placement and receipts
  // =========================================================================
  describe('options and placement', () => {
    it('puts the menu on the side away from the bubble', () => {
      c.alignment = MessageBubbleAlignment.left;
      expect(c.contextMenuPlacement).toBe(Placement.right);
      c.alignment = MessageBubbleAlignment.right;
      expect(c.contextMenuPlacement).toBe(Placement.left);
      c.alignment = MessageBubbleAlignment.center;
      expect(c.contextMenuPlacement).toBe(Placement.left);
    });

    it('splits the options into quick ones and an overflow at the requested count', () => {
      const a = { title: 'a' };
      const b = { title: 'b' };
      const d = { title: 'd' };
      c.options = [a, b, d] as never;
      c.quickOptionsCount = 2;

      expect(c.effectiveQuickOptionsCount).toBe(2);
      expect(c.distributedOptions).toEqual({ quickOptions: [a, b], overflowOptions: [d] });

      c.quickOptionsCount = 0;
      expect(c.distributedOptions).toEqual({ quickOptions: [], overflowOptions: [a, b, d] });
    });

    it('positions the option row from the alignment', () => {
      c.alignment = MessageBubbleAlignment.left;
      expect(c.optionsPositionClass).toBe('cometchat-message-bubble__options--right');
      c.alignment = MessageBubbleAlignment.right;
      expect(c.optionsPositionClass).toBe('cometchat-message-bubble__options--left');
    });
  });

  describe('receipts', () => {
    it('has no receipt state without a message', () => {
      expect(c.receiptClass).toBe('');
      expect(c.receiptAriaLabel).toBe('');
    });

    it('shows read, then delivered, then sent, then waiting', () => {
      c.message = msg({ getReadAt: () => 3, getDeliveredAt: () => 2, getSentAt: () => 1 });
      expect(c.receiptClass).toBe('cometchat-receipts-read');
      expect(c.receiptAriaLabel).toBe(L('message_status_read'));

      c.message = msg({ getDeliveredAt: () => 2, getSentAt: () => 1 });
      expect(c.receiptClass).toBe('cometchat-receipts-delivered');
      expect(c.receiptAriaLabel).toBe(L('message_status_delivered'));

      c.message = msg({ getSentAt: () => 1 });
      expect(c.receiptClass).toBe('cometchat-receipts-sent');
      expect(c.receiptAriaLabel).toBe(L('message_status_sent'));

      c.message = msg({ getSentAt: () => 0 });
      expect(c.receiptClass).toBe('cometchat-receipts-wait');
      expect(c.receiptAriaLabel).toBe(L('message_status_sending'));
    });

    it('still waits on a message stamped locally but never given a server id', () => {
      c.message = msg({ getSentAt: () => 1, getId: () => 0 });
      expect(c.receiptClass).toBe('cometchat-receipts-wait');
      // The screen reader is told "sent" from the timestamp alone; only the tick waits.
      expect(c.receiptAriaLabel).toBe(L('message_status_sent'));
    });
  });

  describe('timestamp format', () => {
    it('shows only a time, in the locale clock, unless the host supplied a format', () => {
      const time = CometChatLocalize.getTimePattern();
      expect(c.calendarObject).toEqual({ today: time, yesterday: time, otherDays: time });

      const custom = { today: 'HH:mm:ss', otherDays: 'YYYY' };
      c.dateFormat = custom;
      expect(c.calendarObject).toBe(custom);
    });
  });

  // =========================================================================
  // Moderation and errors
  // =========================================================================
  describe('moderation and errors', () => {
    it('treats a message with no moderation accessor as unmoderated', () => {
      expect(c.moderationStatus).toBe(MOD.unmoderated);
      c.message = msg();
      expect(c.moderationStatus).toBe(MOD.unmoderated);
      expect(c.isPendingModeration).toBe(false);
      expect(c.isDisapprovedByModeration).toBe(false);
    });

    it('reads the status the SDK reports, and treats a blank one as unmoderated', () => {
      c.message = msg({ getModerationStatus: () => MOD.pending });
      expect(c.moderationStatus).toBe(MOD.pending);
      expect(c.isPendingModeration).toBe(true);

      c.message = msg({ getModerationStatus: () => MOD.disapproved });
      expect(c.isDisapprovedByModeration).toBe(true);

      c.message = msg({ getModerationStatus: () => '' });
      expect(c.moderationStatus).toBe(MOD.unmoderated);
    });

    it('shows the block notice to the sender of a disapproved message only', () => {
      c.loggedInUser = user('me');
      c.message = msg({ getModerationStatus: () => MOD.disapproved, getSender: () => user('me') });
      expect(c.shouldShowModerationIndicator).toBe(true);

      c.message = msg({ getModerationStatus: () => MOD.disapproved, getSender: () => user('them') });
      expect(c.shouldShowModerationIndicator).toBe(false);
    });

    it('never shows the block notice when hidden, deleted, or on a group action', () => {
      c.loggedInUser = user('me');
      const mine = { getModerationStatus: () => MOD.disapproved, getSender: () => user('me') };

      c.message = msg(mine);
      c.hideModerationView = true;
      expect(c.shouldShowModerationIndicator).toBe(false);
      c.hideModerationView = false;

      c.message = msg({ ...mine, getDeletedAt: () => 1700000000 });
      expect(c.shouldShowModerationIndicator).toBe(false);

      c.message = msg({ ...mine, getCategory: () => CATEGORY.action });
      expect(c.shouldShowModerationIndicator).toBe(false);

      c.message = msg({ getModerationStatus: () => MOD.approved, getSender: () => user('me') });
      expect(c.shouldShowModerationIndicator).toBe(false);
    });

    it('finds a send error on the message itself or stashed in its metadata', () => {
      expect(c.hasMessageError).toBe(false);

      c.message = msg({ error: { code: 'ERR_SOMETHING' } });
      expect(c.hasMessageError).toBe(true);

      c.message = msg({ getMetadata: () => ({ error: { code: 'ERR_NESTED' } }) });
      expect(c.hasMessageError).toBe(true);

      c.message = msg({ getMetadata: () => ({}) });
      expect(c.hasMessageError).toBe(false);

      c.message = msg();
      expect(c.hasMessageError).toBe(false);
    });

    it('shows the file-type notice only to the sender of a refused message', () => {
      c.loggedInUser = user('me');
      expect(c.isPermissionDeniedError).toBe(false);

      c.message = msg({ error: { code: 'ERR_PERMISSION_DENIED' }, getSender: () => user('me') });
      expect(c.isPermissionDeniedError).toBe(true);
      expect(c.shouldShowPermissionDeniedIndicator).toBe(true);
      expect(c.shouldShowBlockNotice).toBe(true);
      expect(c.moderationIndicatorTextKey).toBe('file_type_not_allowed');

      c.message = msg({ error: { code: 'ERR_PERMISSION_DENIED' }, getSender: () => user('them') });
      expect(c.isPermissionDeniedError).toBe(false);

      c.message = msg({ error: { code: 'ERR_OTHER' }, getSender: () => user('me') });
      expect(c.isPermissionDeniedError).toBe(false);
    });

    it('drops the file-type notice on a deleted message or a group action', () => {
      c.loggedInUser = user('me');
      const refused = { error: { code: 'ERR_PERMISSION_DENIED' }, getSender: () => user('me') };

      c.message = msg({ ...refused, getDeletedAt: () => 1700000000 });
      expect(c.shouldShowPermissionDeniedIndicator).toBe(false);

      c.message = msg({ ...refused, getCategory: () => CATEGORY.action });
      expect(c.shouldShowPermissionDeniedIndicator).toBe(false);
    });

    it('prefers the moderation wording when both notices apply', () => {
      c.loggedInUser = user('me');
      c.message = msg({
        getSender: () => user('me'),
        getModerationStatus: () => MOD.disapproved,
        error: { code: 'ERR_PERMISSION_DENIED' },
      });
      expect(c.moderationIndicatorTextKey).toBe('moderation_block_message');
    });

    it('flips the sender receipt to the error tick for a refused or disapproved message', () => {
      c.loggedInUser = user('me');
      c.message = msg({ getSender: () => user('me') });
      expect(c.showErrorReceipt).toBe(false);

      c.showError = true;
      expect(c.showErrorReceipt).toBe(true);
      c.showError = false;

      c.message = msg({ getSender: () => user('me'), getModerationStatus: () => MOD.disapproved });
      expect(c.showErrorReceipt).toBe(true);

      c.message = msg({ getSender: () => user('me'), error: { code: 'ERR_X' } });
      expect(c.showErrorReceipt).toBe(true);

      c.message = msg({ getSender: () => user('them'), error: { code: 'ERR_X' } });
      expect(c.showErrorReceipt).toBe(false);
    });
  });

  // =========================================================================
  // Host-supplied views and the registry fallback
  // =========================================================================
  describe('effective views', () => {
    const parts = [
      ['leadingView', 'effectiveLeadingView'],
      ['headerView', 'effectiveHeaderView'],
      ['replyView', 'effectiveReplyView'],
      ['contentView', 'effectiveContentView'],
      ['bottomView', 'effectiveBottomView'],
      ['footerView', 'effectiveFooterView'],
      ['statusInfoView', 'effectiveStatusInfoView'],
      ['threadView', 'effectiveThreadView'],
      ['bubbleView', 'effectiveBubbleView'],
    ] as const;

    it('is empty for every part when neither an input nor a registered view exists', () => {
      c.message = msg();
      for (const [, getter] of parts) {
        expect(c[getter]).toBeNull();
      }
    });

    it('prefers the input over anything the registry holds', () => {
      c.message = msg();
      const registered = {} as TemplateRef<unknown>;
      const service = TestBed.inject(MessageBubbleConfigService);
      for (const [part] of parts) {
        service.setGlobalView(part as never, registered);
      }

      for (const [part, getter] of parts) {
        const own = {} as TemplateRef<unknown>;
        (c as unknown as Record<string, unknown>)[part] = own;
        expect(c[getter]).toBe(own);
      }
    });

    it('falls back to the view registered for this message type', () => {
      c.message = msg({ getType: () => TYPE.image, getCategory: () => CATEGORY.message });
      const registered = {} as TemplateRef<unknown>;
      const service = TestBed.inject(MessageBubbleConfigService);
      for (const [part] of parts) {
        service.setBubbleView('image_message', { [part]: registered } as never);
      }

      for (const [, getter] of parts) {
        expect(c[getter]).toBe(registered);
      }
    });
  });

  // =========================================================================
  // Hover, clicks and emitted events
  // =========================================================================
  describe('hover and pointer interaction', () => {
    it('shows the options on enter and withdraws them a moment after leaving', () => {
      vi.useFakeTimers();
      c.onMouseEnter();
      expect((c as unknown as { isHovering: boolean }).isHovering).toBe(true);

      c.onMouseLeave();
      expect((c as unknown as { isHovering: boolean }).isHovering).toBe(true);

      vi.advanceTimersByTime(150);
      expect((c as unknown as { isHovering: boolean }).isHovering).toBe(false);
    });

    it('cancels a pending withdrawal when the pointer comes back', () => {
      vi.useFakeTimers();
      c.onMouseEnter();
      c.onMouseLeave();
      c.onMouseEnter();

      vi.advanceTimersByTime(500);
      expect((c as unknown as { isHovering: boolean }).isHovering).toBe(true);
    });

    it('cancels a pending withdrawal on destroy, so nothing fires at a dead view', () => {
      vi.useFakeTimers();
      c.onMouseLeave();
      expect((c as unknown as { hoverTimeoutRef: unknown }).hoverTimeoutRef).not.toBeNull();

      c.ngOnDestroy();
      expect((c as unknown as { hoverTimeoutRef: unknown }).hoverTimeoutRef).toBeNull();

      vi.advanceTimersByTime(500);
      expect((c as unknown as { isHovering: boolean }).isHovering).toBe(false);
    });

    it('toggles the options on tap, but only on a touch-sized screen', () => {
      (c as unknown as { isMobile: boolean }).isMobile = false;
      c.onBodyClick();
      expect((c as unknown as { isHovering: boolean }).isHovering).toBe(false);

      (c as unknown as { isMobile: boolean }).isMobile = true;
      c.onBodyClick();
      expect((c as unknown as { isHovering: boolean }).isHovering).toBe(true);
      c.onBodyClick();
      expect((c as unknown as { isHovering: boolean }).isHovering).toBe(false);
    });

    it('closes the menu, reports the choice and hands focus back to the bubble', () => {
      vi.useFakeTimers();
      const focus = vi.fn();
      (c as unknown as { bubbleWrapperRef: unknown }).bubbleWrapperRef = { nativeElement: { focus } };
      (c as unknown as { isHovering: boolean }).isHovering = true;
      const chosen: unknown[] = [];
      c.optionClick.subscribe(o => chosen.push(o));

      const option = { id: 'delete', title: 'Delete' };
      c.onOptionClick(option as never);

      expect((c as unknown as { isHovering: boolean }).isHovering).toBe(false);
      expect(chosen).toEqual([option]);

      vi.advanceTimersByTime(0);
      expect(focus).toHaveBeenCalledTimes(1);
    });

    it('still reports the choice when there is no wrapper to hand focus back to', () => {
      // The wrapper only exists once the view has rendered; the deferred focus
      // must cope with its absence rather than throw inside the timer.
      vi.useFakeTimers();
      (c as unknown as { isHovering: boolean }).isHovering = true;
      const chosen: unknown[] = [];
      c.optionClick.subscribe(o => chosen.push(o));
      const option = { id: 'copy', title: 'Copy' };

      c.onOptionClick(option as never);
      vi.advanceTimersByTime(0);

      expect(chosen).toEqual([option]);
      expect((c as unknown as { isHovering: boolean }).isHovering).toBe(false);
    });
  });

  describe('emitted interactions', () => {
    it('opens the quoted message on click, and stops the click reaching the bubble body', () => {
      const quoted = new CometChat.TextMessage('u2', 'q', CometChat.RECEIVER_TYPE.USER);
      c.message = msg({ getQuotedMessage: () => quoted });
      const seen: unknown[] = [];
      c.replyPreviewClick.subscribe(m => seen.push(m));

      const stopPropagation = vi.fn();
      c.onReplyPreviewClick({ stopPropagation } as unknown as MouseEvent);
      expect(stopPropagation).toHaveBeenCalledTimes(1);
      expect(seen).toEqual([quoted]);

      c.onReplyPreviewClick();
      expect(seen).toHaveLength(2);
    });

    it('stays silent when there is no quoted message to open', () => {
      c.message = msg();
      const seen: unknown[] = [];
      c.replyPreviewClick.subscribe(m => seen.push(m));

      c.onReplyPreviewClick();
      expect(seen).toEqual([]);
    });

    it('opens the quoted message from the keyboard on Enter and Space only', () => {
      const quoted = new CometChat.TextMessage('u2', 'q', CometChat.RECEIVER_TYPE.USER);
      c.message = msg({ getQuotedMessage: () => quoted });
      const seen: unknown[] = [];
      c.replyPreviewClick.subscribe(m => seen.push(m));

      for (const key of ['Enter', ' ']) {
        const preventDefault = vi.fn();
        const stopPropagation = vi.fn();
        c.onReplyPreviewKeyDown({ key, preventDefault, stopPropagation } as unknown as KeyboardEvent);
        expect(preventDefault).toHaveBeenCalledTimes(1);
        expect(stopPropagation).toHaveBeenCalledTimes(1);
      }
      expect(seen).toEqual([quoted, quoted]);

      const preventDefault = vi.fn();
      c.onReplyPreviewKeyDown({
        key: 'Tab',
        preventDefault,
        stopPropagation: vi.fn(),
      } as unknown as KeyboardEvent);
      expect(preventDefault).not.toHaveBeenCalled();
      expect(seen).toHaveLength(2);
    });

    it('swallows an Enter on a reply preview whose quote has gone', () => {
      c.message = msg();
      const seen: unknown[] = [];
      c.replyPreviewClick.subscribe(m => seen.push(m));
      const preventDefault = vi.fn();

      c.onReplyPreviewKeyDown({
        key: 'Enter',
        preventDefault,
        stopPropagation: vi.fn(),
      } as unknown as KeyboardEvent);

      expect(preventDefault).toHaveBeenCalledTimes(1);
      expect(seen).toEqual([]);
    });

    it('reports the sender behind the avatar, and nothing when there is none', () => {
      const them = user('them');
      c.message = msg({ getSender: () => them });
      const seen: unknown[] = [];
      c.avatarClick.subscribe(u => seen.push(u));

      c.onAvatarClick();
      expect(seen).toEqual([them]);

      c.message = msg({ getSender: () => null });
      c.loggedInUser = null;
      c.onAvatarClick();
      expect(seen).toHaveLength(1);
    });

    it('reports thread, reaction and reaction-list interactions with their payloads', () => {
      const message = msg();
      c.message = message;

      const threads: unknown[] = [];
      const reactions: unknown[] = [];
      const listItems: unknown[] = [];
      c.threadRepliesClick.subscribe(m => threads.push(m));
      c.reactionClick.subscribe(p => reactions.push(p));
      c.reactionListItemClick.subscribe(p => listItems.push(p));

      c.onThreadClick();
      expect(threads).toEqual([message]);

      const count = reaction(3);
      c.onReactionClick(count);
      expect(reactions).toEqual([{ reaction: count, message }]);

      const payload = { reaction: {} as CometChat.Reaction, message };
      c.onReactionListItemClick(payload);
      expect(listItems).toEqual([payload]);
    });
  });

  // =========================================================================
  // Keyboard
  // =========================================================================
  describe('keyboard', () => {
    function key(k: string, extra: Record<string, unknown> = {}) {
      return {
        key: k,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        shiftKey: false,
        ...extra,
      } as unknown as KeyboardEvent & { preventDefault: ReturnType<typeof vi.fn> };
    }

    it('opens the actions menu on Enter when there are options', () => {
      c.message = msg();
      c.options = [{ title: 'Copy' }] as never;
      const opened: unknown[] = [];
      c.messageActionsOpen.subscribe(m => opened.push(m));

      const event = key('Enter');
      c.onKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      expect((c as unknown as { isHovering: boolean }).isHovering).toBe(true);
      expect(opened).toEqual([c.message]);
    });

    it('keeps the menu shut on Enter when the message has no options', () => {
      c.message = msg();
      c.options = [];
      const opened: unknown[] = [];
      c.messageActionsOpen.subscribe(m => opened.push(m));

      c.onKeyDown(key('Enter'));

      expect((c as unknown as { isHovering: boolean }).isHovering).toBe(false);
      expect(opened).toEqual([]);
    });

    it('uses Space to play media, and to toggle the options on anything else', () => {
      const media = msg({ getType: () => TYPE.video });
      c.message = media;
      const toggled: unknown[] = [];
      c.mediaToggle.subscribe(m => toggled.push(m));

      c.onKeyDown(key(' '));
      expect(toggled).toEqual([media]);
      expect((c as unknown as { isHovering: boolean }).isHovering).toBe(false);

      c.message = msg({ getType: () => TYPE.text });
      c.options = [{ title: 'Copy' }] as never;
      c.onKeyDown(key(' '));
      expect((c as unknown as { isHovering: boolean }).isHovering).toBe(true);
      expect(toggled).toHaveLength(1);
    });

    it('does nothing on Space for a text message with no options', () => {
      c.message = msg({ getType: () => TYPE.text });
      c.options = [];
      const toggled: unknown[] = [];
      c.mediaToggle.subscribe(m => toggled.push(m));

      c.onKeyDown(key(' '));

      expect((c as unknown as { isHovering: boolean }).isHovering).toBe(false);
      expect(toggled).toEqual([]);
    });

    it('opens the actions menu on Shift+F10 but not on F10 alone', () => {
      c.message = msg();
      c.options = [{ title: 'Copy' }] as never;
      const opened: unknown[] = [];
      c.messageActionsOpen.subscribe(m => opened.push(m));

      const plain = key('F10');
      c.onKeyDown(plain);
      expect(plain.preventDefault).not.toHaveBeenCalled();
      expect(opened).toEqual([]);

      const shifted = key('F10', { shiftKey: true });
      c.onKeyDown(shifted);
      expect(shifted.preventDefault).toHaveBeenCalledTimes(1);
      expect(opened).toEqual([c.message]);
    });

    it('opens the actions menu on the context-menu key', () => {
      c.message = msg();
      c.options = [{ title: 'Copy' }] as never;
      const opened: unknown[] = [];
      c.messageActionsOpen.subscribe(m => opened.push(m));

      const event = key('ContextMenu');
      c.onKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      expect(opened).toEqual([c.message]);
    });

    it('closes an open menu on Escape and returns focus, and lets Escape through otherwise', () => {
      vi.useFakeTimers();
      const focus = vi.fn();
      (c as unknown as { bubbleWrapperRef: unknown }).bubbleWrapperRef = { nativeElement: { focus } };

      const ignored = key('Escape');
      c.onKeyDown(ignored);
      expect(ignored.preventDefault).not.toHaveBeenCalled();

      (c as unknown as { isHovering: boolean }).isHovering = true;
      const handled = key('Escape');
      c.onKeyDown(handled);

      expect(handled.preventDefault).toHaveBeenCalledTimes(1);
      expect((c as unknown as { isHovering: boolean }).isHovering).toBe(false);
      vi.advanceTimersByTime(0);
      expect(focus).toHaveBeenCalledTimes(1);
    });

    it('ignores keys it has no binding for', () => {
      c.message = msg();
      c.options = [{ title: 'Copy' }] as never;
      const opened: unknown[] = [];
      c.messageActionsOpen.subscribe(m => opened.push(m));

      const event = key('a');
      c.onKeyDown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(opened).toEqual([]);
      expect((c as unknown as { isHovering: boolean }).isHovering).toBe(false);
    });

    it('leaves only media playback working while interaction is disabled', () => {
      c.disableInteraction = true;
      c.options = [{ title: 'Copy' }] as never;
      const media = msg({ getType: () => TYPE.audio });
      c.message = media;
      const toggled: unknown[] = [];
      const opened: unknown[] = [];
      c.mediaToggle.subscribe(m => toggled.push(m));
      c.messageActionsOpen.subscribe(m => opened.push(m));

      const space = key(' ');
      c.onKeyDown(space);
      expect(space.preventDefault).toHaveBeenCalledTimes(1);
      expect(toggled).toEqual([media]);

      c.onKeyDown(key('Enter'));
      expect(opened).toEqual([]);

      c.message = msg({ getType: () => TYPE.text });
      const textSpace = key(' ');
      c.onKeyDown(textSpace);
      expect(textSpace.preventDefault).not.toHaveBeenCalled();
      expect(toggled).toHaveLength(1);
    });

    it('counts image, video and audio as playable media', () => {
      for (const type of [TYPE.image, TYPE.video, TYPE.audio]) {
        c.message = msg({ getType: () => type });
        expect(c.isMediaMessage).toBe(true);
      }
      for (const type of [TYPE.text, TYPE.file]) {
        c.message = msg({ getType: () => type });
        expect(c.isMediaMessage).toBe(false);
      }
    });
  });

  // =========================================================================
  // Accessible label
  // =========================================================================
  describe('accessible label', () => {
    it('names the sender, the type, the body and the time', () => {
      c.message = msg({
        getSender: () => user('them', 'Captain'),
        getType: () => TYPE.text,
        getText: () => 'hello there',
        getSentAt: () => 1700000000,
      });

      const label = c.getAriaLabel();

      expect(label.startsWith('Captain, ')).toBe(true);
      expect(label).toContain(L('accessibility_message_type_text'));
      expect(label).toContain('hello there');
      expect(label).toContain(
        new Date(1700000000 * 1000).toLocaleString(CometChatLocalize.getDateLocaleLanguage(), {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      );
    });

    it('falls back to an unknown sender and a generic type with nothing to go on', () => {
      expect(c.accessibleLabel).toBe(
        `${L('accessibility_unknown_sender')}, ${L('accessibility_message_type_custom')}`
      );
    });

    it('says a message was deleted instead of reading out its old contents', () => {
      c.message = msg({
        getSender: () => user('them', 'Captain'),
        getText: () => 'secret',
        getDeletedAt: () => 1700000000,
      });

      expect(c.getAriaLabel()).toBe(
        L('accessibility_message_deleted_from').replace('{sender}', 'Captain')
      );
      expect(c.getAriaLabel()).not.toContain('secret');
    });

    it('leaves the body out of the label of a deleted message read directly', () => {
      // `getAriaLabel` already swaps in the "deleted" wording, but the label
      // getter is public and is read on its own, so it must not leak the body.
      c.message = msg({
        getSender: () => user('them', 'Captain'),
        getType: () => TYPE.text,
        getText: () => 'secret',
        getDeletedAt: () => 1700000000,
        getSentAt: () => 0,
      });

      expect(c.accessibleLabel).toBe(
        `Captain, ${L('accessibility_message_type_text')}`
      );
    });

    it('names an unknown sender on a deleted message too', () => {
      c.message = msg({ getSender: () => null, getDeletedAt: () => 1700000000 });
      expect(c.getAriaLabel()).toBe(
        L('accessibility_message_deleted_from').replace('{sender}', L('accessibility_unknown_sender'))
      );
    });

    it('describes each media type rather than its payload', () => {
      const cases: Array<[string, string]> = [
        [TYPE.image, 'accessibility_image_message'],
        [TYPE.video, 'accessibility_video_message'],
        [TYPE.audio, 'accessibility_audio_message'],
      ];
      for (const [type, labelKey] of cases) {
        c.message = msg({ getType: () => type });
        expect(c.accessibleLabel).toContain(L(labelKey));
      }
    });

    it('reads a file message by its attachment name, falling back to the word File', () => {
      c.message = msg({
        getType: () => TYPE.file,
        getAttachment: () => ({ getName: () => 'quarterly.pdf' }),
      });
      expect(c.accessibleLabel).toContain('quarterly.pdf');

      c.message = msg({ getType: () => TYPE.file, getAttachment: () => null });
      expect(c.accessibleLabel).toContain(L('accessibility_file_message'));

      c.message = msg({ getType: () => TYPE.file });
      expect(c.accessibleLabel).toContain(L('accessibility_file_message'));
    });

    it('reads a poll out by its question, falling back to the word Poll', () => {
      c.message = msg({
        getType: () => EXT.poll,
        getCategory: () => CATEGORY.custom,
        getCustomData: () => ({ question: 'Tabs or spaces?' }),
      });
      expect(c.accessibleLabel).toContain('Tabs or spaces?');

      c.message = msg({
        getType: () => EXT.poll,
        getCategory: () => CATEGORY.custom,
        getCustomData: () => ({}),
      });
      expect(c.accessibleLabel).toContain(L('accessibility_poll_message'));

      c.message = msg({ getType: () => EXT.poll, getCategory: () => CATEGORY.custom });
      expect(c.accessibleLabel).toContain(L('accessibility_poll_message'));
    });

    it('offers no preview for a type it has no words for', () => {
      c.message = msg({ getType: () => 'hologram', getCategory: () => CATEGORY.custom });
      expect(c.accessibleLabel).toBe(
        `${L('accessibility_unknown_sender')}, ${L('accessibility_message_type_custom')}`
      );
    });

    it('cuts a long body off at 100 characters and marks the cut', () => {
      const body = 'x'.repeat(130);
      c.message = msg({ getType: () => TYPE.text, getText: () => body });

      const label = c.accessibleLabel;
      expect(label).toContain('x'.repeat(100) + '...');
      expect(label).not.toContain('x'.repeat(101));
    });

    it('leaves a short body and an empty body alone', () => {
      c.message = msg({ getType: () => TYPE.text, getText: () => 'short' });
      expect(c.accessibleLabel).toContain('short');

      c.message = msg({ getType: () => TYPE.text, getText: () => '' });
      expect(c.accessibleLabel).toBe(
        `${L('accessibility_unknown_sender')}, ${L('accessibility_message_type_text')}`
      );

      c.message = msg({ getType: () => TYPE.text });
      expect(c.accessibleLabel).toBe(
        `${L('accessibility_unknown_sender')}, ${L('accessibility_message_type_text')}`
      );
    });

    it('counts the reactions, singular and plural', () => {
      c.message = msg({ getType: () => TYPE.text, getReactions: () => [reaction(1)] });
      expect(c.accessibleLabel).toContain(L('accessibility_one_reaction'));

      c.message = msg({
        getType: () => TYPE.text,
        getReactions: () => [reaction(2), reaction(3)],
      });
      expect(c.accessibleLabel).toContain(
        L('accessibility_reactions_count').replace('{count}', '5')
      );

      c.message = msg({ getType: () => TYPE.text, getReactions: () => [reaction(undefined as never)] });
      expect(c.accessibleLabel).toContain(
        L('accessibility_reactions_count').replace('{count}', '0')
      );

      c.message = msg({ getType: () => TYPE.text, getReactions: () => [{} as CometChat.ReactionCount] });
      expect(c.accessibleLabel).toContain(
        L('accessibility_reactions_count').replace('{count}', '0')
      );
    });

    it('says nothing about reactions on a message with none', () => {
      c.message = msg({ getType: () => TYPE.text, getReactions: () => [] });
      expect((c as unknown as { getReactionsSummary: () => string }).getReactionsSummary()).toBe('');
      expect(c.accessibleLabel).toBe(
        `${L('accessibility_unknown_sender')}, ${L('accessibility_message_type_text')}`
      );
    });

    it('drops the reaction clause when the bundle has no wording for it', () => {
      // A host that calls `CometChatLocalize.init` with its own translations can
      // omit the accessibility keys, and `getLocalizedString` answers '' for a
      // key it cannot find. The label must then leave the clause out rather
      // than join an empty fragment, which a screen reader reads as a stray
      // pause between the type and the edit marker.
      const real = CometChatLocalize.getLocalizedString.bind(CometChatLocalize);
      vi.spyOn(CometChatLocalize, 'getLocalizedString').mockImplementation((k: string) =>
        k === 'accessibility_one_reaction' || k === 'accessibility_reactions_count' ? '' : real(k)
      );
      const bare = `${real('accessibility_unknown_sender')}, ${real('accessibility_message_type_text')}`;

      c.message = msg({ getType: () => TYPE.text, getReactions: () => [reaction(1)] });
      expect(c.hasReactions).toBe(true);
      expect(c.accessibleLabel).toBe(bare);

      c.message = msg({ getType: () => TYPE.text, getReactions: () => [reaction(2), reaction(3)] });
      expect(c.accessibleLabel).toBe(bare);

      c.message = msg({
        getType: () => TYPE.text,
        getReactions: () => [reaction(1)],
        getEditedAt: () => 1700000000,
      });
      expect(c.accessibleLabel).toBe(`${bare}, ${real('accessibility_message_edited')}`);
    });

    it('mentions an edit, and omits the time when the message has not been stamped', () => {
      c.message = msg({ getType: () => TYPE.text, getEditedAt: () => 1700000000, getSentAt: () => 0 });

      const label = c.accessibleLabel;
      expect(label).toContain(L('accessibility_message_edited'));
      expect(label).toBe(
        `${L('accessibility_unknown_sender')}, ${L('accessibility_message_type_text')}, ${L('accessibility_message_edited')}`
      );
    });

    it('treats a millisecond timestamp as milliseconds and a second one as seconds', () => {
      const stamp = (c as unknown as { getFormattedTimestamp: () => string });
      const expected = (ms: number) =>
        new Date(ms).toLocaleString(CometChatLocalize.getDateLocaleLanguage(), {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });

      c.message = msg({ getSentAt: () => 1700000000 });
      expect(stamp.getFormattedTimestamp()).toBe(expected(1700000000 * 1000));

      c.message = msg({ getSentAt: () => 1700000000000 });
      expect(stamp.getFormattedTimestamp()).toBe(expected(1700000000000));

      c.message = undefined as unknown as CometChat.BaseMessage;
      expect(stamp.getFormattedTimestamp()).toBe('');
    });

    it('has a short type label for each media type, used by assistive text', () => {
      const label = (c as unknown as { getMessageTypeLabel: () => string });
      const cases: Array<[string, string]> = [
        [TYPE.text, 'accessibility_message_type_text'],
        [TYPE.image, 'accessibility_message_type_image'],
        [TYPE.video, 'accessibility_message_type_video'],
        [TYPE.audio, 'accessibility_message_type_audio'],
        [TYPE.file, 'accessibility_message_type_file'],
        ['hologram', 'accessibility_message_type_custom'],
      ];
      for (const [type, labelKey] of cases) {
        c.message = msg({ getType: () => type });
        expect(label.getMessageTypeLabel()).toBe(L(labelKey));
      }
    });
  });

  // =========================================================================
  // Extension URLs
  // =========================================================================
  describe('extension URLs', () => {
    it('has no URLs without a message', () => {
      expect(c.getDocumentUrl()).toBe('');
      expect(c.getWhiteboardUrl()).toBe('');
    });

    it('has no URLs when the message carries no metadata', () => {
      c.message = msg({ getMetadata: () => null });
      expect(c.getDocumentUrl()).toBe('');
      expect(c.getWhiteboardUrl()).toBe('');

      c.message = msg();
      expect(c.getDocumentUrl()).toBe('');
      expect(c.getWhiteboardUrl()).toBe('');
    });

    it('prefers the injected extension payload', () => {
      c.message = msg({
        getMetadata: () => ({
          '@injected': {
            extensions: {
              document: { document_url: 'https://docs.example/injected' },
              whiteboard: { board_url: 'https://board.example/injected' },
            },
          },
          data: { document_url: 'https://docs.example/data', board_url: 'https://board.example/data' },
        }),
      });

      expect(c.getDocumentUrl()).toBe('https://docs.example/injected');
      expect(c.getWhiteboardUrl()).toBe('https://board.example/injected');
    });

    it('falls back to the metadata data block, then to the custom data', () => {
      c.message = msg({
        getMetadata: () => ({
          data: { document_url: 'https://docs.example/data', board_url: 'https://board.example/data' },
        }),
      });
      expect(c.getDocumentUrl()).toBe('https://docs.example/data');
      expect(c.getWhiteboardUrl()).toBe('https://board.example/data');

      c.message = msg({
        getMetadata: () => ({ '@injected': { extensions: {} } }),
        getCustomData: () => ({
          document_url: 'https://docs.example/custom',
          board_url: 'https://board.example/custom',
        }),
      });
      expect(c.getDocumentUrl()).toBe('https://docs.example/custom');
      expect(c.getWhiteboardUrl()).toBe('https://board.example/custom');
    });

    it('ends up empty when the metadata is present but holds no URL', () => {
      c.message = msg({ getMetadata: () => ({ data: {} }), getCustomData: () => ({}) });
      expect(c.getDocumentUrl()).toBe('');
      expect(c.getWhiteboardUrl()).toBe('');
    });

    it('logs and gives up when the metadata cannot be read', () => {
      const warn = vi.spyOn(CometChatLogger, 'warn').mockImplementation(() => undefined);
      c.message = msg({
        getMetadata: () => {
          throw new Error('corrupt metadata');
        },
      });

      expect(c.getDocumentUrl()).toBe('');
      expect(c.getWhiteboardUrl()).toBe('');
      expect(warn).toHaveBeenCalledTimes(2);
      expect(warn.mock.calls[0][1]).toBe('Error extracting document URL:');
      expect(warn.mock.calls[1][1]).toBe('Error extracting whiteboard URL:');
    });
  });
});
