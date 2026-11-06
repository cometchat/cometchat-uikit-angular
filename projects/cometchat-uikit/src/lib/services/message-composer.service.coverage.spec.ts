/**
 * MessageComposerService — guard, fallback and failure-path coverage.
 *
 * The older suite for this service drives it against a live CometChat session.
 * Without one the receivers it fetches come back null, the early guards fire and
 * most method bodies never run, so whole features (stickers, the extension
 * endpoints, caption editing, mention pagination) were never exercised at all.
 *
 * These tests replace the data layer instead of depending on it: every SDK
 * static the service touches is swapped for a local double in `patchSdk`, and
 * ThreadSubscriptionService is stubbed, so each guard arm, catch block and
 * `??` / `?.` fallback can be reached deliberately and its observable effect
 * asserted.
 *
 * @module services/message-composer/coverage
 */

// The real Calls SDK reaches for JitsiMeetJS at import time, which jsdom lacks.
vi.mock('@cometchat/calls-sdk-javascript', () => {
  const CallSettingsBuilder = vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    this['enableDefaultLayout'] = vi.fn().mockReturnThis();
    this['setIsAudioOnlyCall'] = vi.fn().mockReturnThis();
    this['setCallListener'] = vi.fn().mockReturnThis();
    this['build'] = vi.fn().mockReturnValue({});
  });
  const OngoingCallListener = vi.fn().mockImplementation(function (this: Record<string, unknown>, callbacks: unknown) {
    this['callbacks'] = callbacks;
  });
  return {
    CometChatCalls: {
      init: vi.fn().mockResolvedValue(true),
      generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
      startSession: vi.fn(),
      endSession: vi.fn(),
      CallSettingsBuilder,
      OngoingCallListener,
    },
  };
});

import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { MessageComposerService } from './message-composer.service';
import { ThreadSubscriptionService } from './thread-subscription.service';
import { CometChatUIKitConstants } from '../constants';
import { CometChatLogger } from '../utils/CometChatLogger';
import type { MentionSuggestion } from './message-composer.types';

const PARENT_ID = 4242;

/** Records mirrors without touching the event bus or the network. */
class ThreadSubscriptionStub {
  session = 11;
  mirrored: Array<{ parentMessageId: number; capturedSession?: number }> = [];
  captureSession = vi.fn(() => this.session);
  mirrorSubscribed = vi.fn((parentMessageId: number, capturedSession?: number) => {
    this.mirrored.push({ parentMessageId, capturedSession });
  });
}

/** A message object the composer can hand to the SDK. Only what the kit touches. */
function outgoing(parentMessageId = 0): CometChat.BaseMessage {
  let subscribed = false;
  return {
    getParentMessageId: () => parentMessageId,
    isThreadSubscribed: () => subscribed,
    setThreadSubscribed: (value: boolean) => {
      subscribed = value;
    },
  } as unknown as CometChat.BaseMessage;
}

function fakeUser(uid: string): CometChat.User {
  return {
    getUid: () => uid,
    getName: () => `Name ${uid}`,
    getAvatar: () => `${uid}.png`,
  } as unknown as CometChat.User;
}

/**
 * A stand-in for a SDK request builder. `setSearchKeyword` returns the builder
 * so the fluent chain in the utils keeps working, and `build()` always hands
 * back the same request so the test can drive `fetchNext` after the fact.
 */
function fakeBuilder(fetchNext: ReturnType<typeof vi.fn>) {
  const request = { fetchNext };
  const builder = {
    setSearchKeyword: vi.fn(() => builder),
    build: vi.fn(() => request),
  };
  return builder;
}

describe('MessageComposerService — guards, fallbacks and failure paths', () => {
  let service: MessageComposerService;
  let threads: ThreadSubscriptionStub;
  let logger: MockInstance;
  const restores: Array<() => void> = [];

  /** Swap one CometChat static for a double, restoring it after the test. */
  function patchSdk(name: string, value: unknown): void {
    const sdk = CometChat as unknown as Record<string, unknown>;
    const original = sdk[name];
    sdk[name] = value;
    restores.push(() => {
      sdk[name] = original;
    });
  }

  /** Accepts whatever message it is handed and echoes it back, recording it. */
  function captureSend(name: 'sendMessage' | 'sendMediaMessage' | 'sendCustomMessage' | 'editMessage') {
    const seen: any[] = [];
    patchSdk(
      name,
      vi.fn(async (message: unknown) => {
        seen.push(message);
        return message;
      })
    );
    return seen;
  }

  /** Lets the debounced mention pipeline fire and its promise chain settle. */
  const settleMentionSearch = () => new Promise<void>(resolve => setTimeout(resolve, 250));

  beforeEach(() => {
    threads = new ThreadSubscriptionStub();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [MessageComposerService, { provide: ThreadSubscriptionService, useValue: threads }],
    });
    service = TestBed.inject(MessageComposerService);
    // Every failure path here logs; silence it and keep the calls assertable.
    logger = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    while (restores.length) restores.pop()!();
    logger.mockRestore();
  });

  // ==================== sendTextMessage ====================

  describe('sendTextMessage', () => {
    it('refuses to build a message when neither a receiver nor a prebuilt message is given', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(error => errors.push(error));
      const sent = captureSend('sendMessage');

      const result = await service.sendTextMessage(null as unknown as CometChat.User, 'orphan');

      expect(result).toBeNull();
      expect(sent).toHaveLength(0);
      expect(errors.map(error => error.message)).toEqual(['sendTextMessage: Receiver is required']);
      expect(service.isSending()).toBe(false);
    });

    it('sends a prebuilt message even with no receiver — the second guard term', async () => {
      const prebuilt = outgoing();
      const sent = captureSend('sendMessage');

      const result = await service.sendTextMessage(
        null as unknown as CometChat.User,
        'ignored',
        undefined,
        undefined,
        undefined,
        prebuilt as unknown as CometChat.TextMessage
      );

      expect(sent).toEqual([prebuilt]);
      expect(result).toBe(prebuilt);
    });

    it('builds a user-addressed message carrying metadata, parent id and quote', async () => {
      const quoted = { getId: () => 99 } as unknown as CometChat.BaseMessage;
      const sent = captureSend('sendMessage');

      await service.sendTextMessage(new CometChat.User('u1'), 'hello', { tone: 'warm' }, PARENT_ID, quoted);

      expect(sent).toHaveLength(1);
      const message = sent[0] as CometChat.TextMessage;
      expect(message.getText()).toBe('hello');
      expect(message.getReceiverId()).toBe('u1');
      expect(message.getReceiverType()).toBe(CometChat.RECEIVER_TYPE.USER);
      expect(message.getMetadata()).toEqual({ tone: 'warm' });
      expect(message.getParentMessageId()).toBe(PARENT_ID);
      expect(message.getQuotedMessageId()).toBe(99);
    });

    it('leaves metadata, parent id and quote unset when they are not supplied', async () => {
      const sent = captureSend('sendMessage');

      await service.sendTextMessage(new CometChat.Group('g1', 'Group One'), 'plain');

      const message = sent[0] as CometChat.TextMessage;
      expect(message.getReceiverId()).toBe('g1');
      expect(message.getReceiverType()).toBe(CometChat.RECEIVER_TYPE.GROUP);
      expect(message.getMetadata()).toBeFalsy();
      expect(message.getParentMessageId()).toBeFalsy();
      expect(message.getQuotedMessageId()).toBeFalsy();
    });

    it('holds isSending up for the whole flight and drops it when the send lands', async () => {
      let land!: (message: unknown) => void;
      patchSdk(
        'sendMessage',
        vi.fn((message: unknown) => new Promise(resolve => (land = () => resolve(message))))
      );

      const pending = service.sendTextMessage(new CometChat.User('u1'), 'slow');
      expect(service.isSending()).toBe(true);

      land(outgoing());
      await pending;
      expect(service.isSending()).toBe(false);
    });

    it('reports a rejected send through the error callback and clears isSending', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(error => errors.push(error));
      patchSdk('sendMessage', vi.fn(() => Promise.reject(new Error('socket closed'))));

      const result = await service.sendTextMessage(new CometChat.User('u1'), 'doomed');

      expect(result).toBeNull();
      expect(errors.map(error => error.message)).toEqual(['Error sending text message: socket closed']);
      expect(service.isSending()).toBe(false);
    });

    it('stamps and mirrors a threaded reply with the session token captured before the send', async () => {
      const confirmed = outgoing(PARENT_ID);
      let flagOnTheWire = false;
      patchSdk(
        'sendMessage',
        vi.fn((message: CometChat.BaseMessage) => {
          flagOnTheWire = message.isThreadSubscribed();
          // Stand in for a logout mid-flight. The mirror has to carry the token
          // from before the send, so asserting 11 here — and not 99 — is what
          // actually pins the capture to the right side of the await.
          threads.session = 99;
          return Promise.resolve(confirmed);
        })
      );

      await service.sendTextMessage(
        new CometChat.User('u1'),
        'reply',
        undefined,
        undefined,
        undefined,
        outgoing(PARENT_ID) as unknown as CometChat.TextMessage
      );

      expect(flagOnTheWire).toBe(true);
      expect(confirmed.isThreadSubscribed()).toBe(true);
      expect(threads.mirrored).toEqual([{ parentMessageId: PARENT_ID, capturedSession: 11 }]);
    });

    it('does not mirror a top-level send', async () => {
      patchSdk('sendMessage', vi.fn((message: unknown) => Promise.resolve(message)));

      await service.sendTextMessage(new CometChat.User('u1'), 'top level');

      expect(threads.mirrorSubscribed).not.toHaveBeenCalled();
    });
  });

  // ==================== sendMediaMessage ====================

  describe('sendMediaMessage', () => {
    const file = () => new File(['bytes'], 'shot.png', { type: 'image/png' });

    it('refuses to build a media message with neither receiver nor prebuilt message', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(error => errors.push(error));
      const sent = captureSend('sendMediaMessage');

      const result = await service.sendMediaMessage(null as unknown as CometChat.User, file(), 'image');

      expect(result).toBeNull();
      expect(sent).toHaveLength(0);
      expect(errors.map(error => error.message)).toEqual(['sendMediaMessage: Receiver is required']);
    });

    it('sends a prebuilt media message with no receiver — the second guard term', async () => {
      const prebuilt = outgoing();
      const sent = captureSend('sendMediaMessage');

      const result = await service.sendMediaMessage(
        null as unknown as CometChat.User,
        file(),
        'image',
        undefined,
        undefined,
        undefined,
        prebuilt as unknown as CometChat.MediaMessage
      );

      expect(sent).toEqual([prebuilt]);
      expect(result).toBe(prebuilt);
    });

    it('builds a media message carrying metadata, parent id and quote', async () => {
      const quoted = { getId: () => 77 } as unknown as CometChat.BaseMessage;
      const sent = captureSend('sendMediaMessage');

      await service.sendMediaMessage(new CometChat.User('u2'), file(), 'image', { batchId: 'b1' }, PARENT_ID, quoted);

      const message = sent[0] as CometChat.MediaMessage;
      expect(message.getReceiverId()).toBe('u2');
      expect(message.getType()).toBe('image');
      expect(message.getMetadata()).toEqual({ batchId: 'b1' });
      expect(message.getParentMessageId()).toBe(PARENT_ID);
      expect(message.getQuotedMessageId()).toBe(77);
    });

    it('leaves the optional fields unset when they are not supplied', async () => {
      const sent = captureSend('sendMediaMessage');

      await service.sendMediaMessage(new CometChat.Group('g2', 'Group Two'), file(), 'file');

      const message = sent[0] as CometChat.MediaMessage;
      expect(message.getReceiverType()).toBe(CometChat.RECEIVER_TYPE.GROUP);
      expect(message.getMetadata()).toBeFalsy();
      expect(message.getParentMessageId()).toBeFalsy();
      expect(message.getQuotedMessageId()).toBeFalsy();
    });

    it('reports a rejected media send and clears isSending', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(error => errors.push(error));
      patchSdk('sendMediaMessage', vi.fn(() => Promise.reject(new Error('upload failed'))));

      const result = await service.sendMediaMessage(new CometChat.User('u2'), file(), 'image');

      expect(result).toBeNull();
      expect(errors.map(error => error.message)).toEqual(['Error sending media message: upload failed']);
      expect(service.isSending()).toBe(false);
    });

    it('mirrors a threaded media reply', async () => {
      const confirmed = outgoing(PARENT_ID);
      patchSdk('sendMediaMessage', vi.fn(() => Promise.resolve(confirmed)));

      await service.sendMediaMessage(
        new CometChat.User('u2'),
        file(),
        'image',
        undefined,
        undefined,
        undefined,
        outgoing(PARENT_ID) as unknown as CometChat.MediaMessage
      );

      expect(confirmed.isThreadSubscribed()).toBe(true);
      expect(threads.mirrored).toEqual([{ parentMessageId: PARENT_ID, capturedSession: 11 }]);
    });
  });

  // ==================== editMessage ====================

  describe('editMessage', () => {
    /** A media message as the kit sees it — only the accessors the edit path reads. */
    function mediaOriginal(id: number, mentioned?: CometChat.User[] | 'no-accessor'): CometChat.BaseMessage {
      const message: Record<string, unknown> = {
        getId: () => id,
        getCategory: () => CometChatUIKitConstants.MessageCategory.message,
        getType: () => CometChatUIKitConstants.MessageTypes.image,
      };
      if (mentioned !== 'no-accessor') {
        message['getMentionedUsers'] = () => mentioned ?? [];
      }
      return message as unknown as CometChat.BaseMessage;
    }

    it('edits a media message as a caption-only shell that carries its id, not its text', async () => {
      const setMentions = watchShellMentions();
      const edited = captureSend('editMessage');

      const result = await service.editMessage(mediaOriginal(501, []), 'new caption');

      expect(edited).toHaveLength(1);
      const shell = edited[0] as CometChat.MediaMessage;
      expect(shell).toBeInstanceOf(CometChat.MediaMessage);
      expect(shell.getId()).toBe(501);
      expect(shell.getCaption()).toBe('new caption');
      expect(result).toBe(shell);
      expect(service.isSending()).toBe(false);
      // Writing an empty list would blank the message's mentions server-side, so
      // with none on the original the setter has to stay unused rather than be
      // called with `[]`.
      expect(setMentions).not.toHaveBeenCalled();
    });

    /** Watches the shell's own setter, which the test cannot otherwise reach. */
    function watchShellMentions(): MockInstance {
      const spy = vi.spyOn(CometChat.MediaMessage.prototype, 'setMentionedUsers');
      restores.push(() => spy.mockRestore());
      return spy;
    }

    it('carries the original mentions onto the caption shell', async () => {
      const mentions = [fakeUser('m1'), fakeUser('m2')];
      const setMentions = watchShellMentions();
      const edited = captureSend('editMessage');

      await service.editMessage(mediaOriginal(502, mentions), 'tagged caption');

      expect(setMentions).toHaveBeenCalledWith(mentions);
      expect((edited[0] as CometChat.MediaMessage).getMentionedUsers()).toEqual(mentions);
    });

    it('still edits a caption when the message predates getMentionedUsers', async () => {
      const setMentions = watchShellMentions();
      const edited = captureSend('editMessage');

      const result = await service.editMessage(mediaOriginal(504, 'no-accessor'), 'legacy caption');

      // Without the `?? []` fallback the length read would throw on `undefined`
      // and the edit would be swallowed as an error instead of reaching the SDK.
      expect(result).not.toBeNull();
      expect(setMentions).not.toHaveBeenCalled();
      expect((edited[0] as CometChat.MediaMessage).getCaption()).toBe('legacy caption');
    });

    it('edits a text message in place rather than building a shell', async () => {
      const original = new CometChat.TextMessage('u1', 'before', CometChat.RECEIVER_TYPE.USER);
      const edited = captureSend('editMessage');

      const result = await service.editMessage(original, 'after');

      expect(edited).toEqual([original]);
      expect(original.getText()).toBe('after');
      expect(result).toBe(original);
      expect(service.isSending()).toBe(false);
    });

    it('reports a rejected edit and clears isSending', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(error => errors.push(error));
      patchSdk('editMessage', vi.fn(() => Promise.reject(new Error('message gone'))));

      const original = new CometChat.TextMessage('u1', 'before', CometChat.RECEIVER_TYPE.USER);
      const result = await service.editMessage(original, 'after');

      expect(result).toBeNull();
      expect(errors.map(error => error.message)).toEqual(['Error editing message: message gone']);
      expect(service.isSending()).toBe(false);
    });
  });

  // ==================== sendStickerMessage ====================

  describe('sendStickerMessage', () => {
    it('refuses to build a sticker with neither receiver nor prebuilt message', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(error => errors.push(error));
      const sent = captureSend('sendCustomMessage');

      const result = await service.sendStickerMessage(null as unknown as CometChat.User, 'url', 'name');

      expect(result).toBeNull();
      expect(sent).toHaveLength(0);
      expect(errors.map(error => error.message)).toEqual(['sendStickerMessage: Receiver is required']);
    });

    it('builds an extension_sticker custom message from the url and name', async () => {
      const sent = captureSend('sendCustomMessage');

      await service.sendStickerMessage(new CometChat.User('u3'), 'https://cdn/sticker.png', 'wave');

      const message = sent[0] as CometChat.CustomMessage;
      expect(message.getType()).toBe(CometChatUIKitConstants.ExtensionTypes.sticker);
      expect(message.getReceiverId()).toBe('u3');
      expect(message.getCustomData()).toEqual({
        sticker_url: 'https://cdn/sticker.png',
        sticker_name: 'wave',
      });
      expect(message.getParentMessageId()).toBeFalsy();
      expect(message.getQuotedMessageId()).toBeFalsy();
    });

    it('threads and quotes a sticker when both are supplied', async () => {
      const quoted = { getId: () => 55 } as unknown as CometChat.BaseMessage;
      const sent = captureSend('sendCustomMessage');

      await service.sendStickerMessage(new CometChat.Group('g3', 'Group Three'), 'url', 'hi', PARENT_ID, quoted);

      const message = sent[0] as CometChat.CustomMessage;
      expect(message.getReceiverType()).toBe(CometChat.RECEIVER_TYPE.GROUP);
      expect(message.getParentMessageId()).toBe(PARENT_ID);
      expect(message.getQuotedMessageId()).toBe(55);
    });

    it('sends a prebuilt sticker with no receiver and mirrors its thread', async () => {
      const confirmed = outgoing(PARENT_ID);
      patchSdk('sendCustomMessage', vi.fn(() => Promise.resolve(confirmed)));

      const result = await service.sendStickerMessage(
        null as unknown as CometChat.User,
        'url',
        'name',
        undefined,
        undefined,
        outgoing(PARENT_ID) as unknown as CometChat.CustomMessage
      );

      expect(result).toBe(confirmed);
      expect(confirmed.isThreadSubscribed()).toBe(true);
      expect(threads.mirrored).toEqual([{ parentMessageId: PARENT_ID, capturedSession: 11 }]);
    });

    it('reports a rejected sticker send and clears isSending', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(error => errors.push(error));
      patchSdk('sendCustomMessage', vi.fn(() => Promise.reject(new Error('extension off'))));

      const result = await service.sendStickerMessage(new CometChat.User('u3'), 'url', 'name');

      expect(result).toBeNull();
      expect(errors.map(error => error.message)).toEqual(['Error sending sticker message: extension off']);
      expect(service.isSending()).toBe(false);
    });
  });

  // ==================== Extension endpoints ====================

  describe('Extension endpoints', () => {
    function captureExtension(result: unknown = { success: true }) {
      const calls: unknown[][] = [];
      patchSdk(
        'callExtension',
        vi.fn(async (...args: unknown[]) => {
          calls.push(args);
          return result;
        })
      );
      return calls;
    }

    it('posts a poll without a quote', async () => {
      const calls = captureExtension({ id: 'poll-1' });

      const result = await service.createPoll('Tea or coffee?', ['Tea', 'Coffee'], 'g4', 'group');

      expect(result).toEqual({ id: 'poll-1' });
      expect(calls).toEqual([
        [
          'polls',
          'POST',
          'v2/create',
          { question: 'Tea or coffee?', options: ['Tea', 'Coffee'], receiver: 'g4', receiverType: 'group' },
        ],
      ]);
    });

    it('adds quotedMessageId to the poll payload when replying', async () => {
      const calls = captureExtension();

      await service.createPoll('Q', ['a', 'b'], 'u4', 'user', 909);

      expect(calls[0][3]).toEqual({
        question: 'Q',
        options: ['a', 'b'],
        receiver: 'u4',
        receiverType: 'user',
        quotedMessageId: 909,
      });
    });

    it('reports a failed poll creation', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(error => errors.push(error));
      patchSdk('callExtension', vi.fn(() => Promise.reject(new Error('polls disabled'))));

      const result = await service.createPoll('Q', ['a'], 'u4', 'user');

      expect(result).toBeNull();
      expect(errors.map(error => error.message)).toEqual(['Error creating poll: polls disabled']);
    });

    it('posts a collaborative document without a quote', async () => {
      const calls = captureExtension({ document: 'doc-1' });

      const result = await service.createCollaborativeDocument('g5', 'group');

      expect(result).toEqual({ document: 'doc-1' });
      expect(calls).toEqual([['document', 'POST', 'v1/create', { receiver: 'g5', receiverType: 'group' }]]);
    });

    it('adds quotedMessageId to the document payload when replying', async () => {
      const calls = captureExtension();

      await service.createCollaborativeDocument('u5', 'user', 808);

      expect(calls[0][3]).toEqual({ receiver: 'u5', receiverType: 'user', quotedMessageId: 808 });
    });

    it('reports a failed document creation', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(error => errors.push(error));
      patchSdk('callExtension', vi.fn(() => Promise.reject(new Error('document disabled'))));

      const result = await service.createCollaborativeDocument('u5', 'user');

      expect(result).toBeNull();
      expect(errors.map(error => error.message)).toEqual([
        'Error creating collaborative document: document disabled',
      ]);
    });

    it('posts a collaborative whiteboard without a quote', async () => {
      const calls = captureExtension({ board: 'wb-1' });

      const result = await service.createCollaborativeWhiteboard('g6', 'group');

      expect(result).toEqual({ board: 'wb-1' });
      expect(calls).toEqual([['whiteboard', 'POST', 'v1/create', { receiver: 'g6', receiverType: 'group' }]]);
    });

    it('adds quotedMessageId to the whiteboard payload when replying', async () => {
      const calls = captureExtension();

      await service.createCollaborativeWhiteboard('u6', 'user', 707);

      expect(calls[0][3]).toEqual({ receiver: 'u6', receiverType: 'user', quotedMessageId: 707 });
    });

    it('reports a failed whiteboard creation', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(error => errors.push(error));
      patchSdk('callExtension', vi.fn(() => Promise.reject(new Error('whiteboard disabled'))));

      const result = await service.createCollaborativeWhiteboard('u6', 'user');

      expect(result).toBeNull();
      expect(errors.map(error => error.message)).toEqual([
        'Error creating collaborative whiteboard: whiteboard disabled',
      ]);
    });
  });

  // ==================== Typing indicators ====================

  describe('Typing indicators', () => {
    it('addresses a typing indicator at whichever receiver it is given', () => {
      const started: CometChat.TypingIndicator[] = [];
      patchSdk('startTyping', vi.fn((indicator: CometChat.TypingIndicator) => started.push(indicator)));

      service.startTyping(new CometChat.User('u7'));
      service.startTyping(new CometChat.Group('g7', 'Group Seven'));

      expect(started).toHaveLength(2);
      expect(started[0].getReceiverId()).toBe('u7');
      expect(started[0].getReceiverType()).toBe(CometChat.RECEIVER_TYPE.USER);
      expect(started[1].getReceiverId()).toBe('g7');
      expect(started[1].getReceiverType()).toBe(CometChat.RECEIVER_TYPE.GROUP);
    });

    it('logs and sends nothing when startTyping has no receiver', () => {
      const startTyping = vi.fn();
      patchSdk('startTyping', startTyping);

      service.startTyping(null as unknown as CometChat.User);

      expect(startTyping).not.toHaveBeenCalled();
      expect(logger).toHaveBeenCalledWith('MessageComposerService', 'startTyping: Receiver is required');
    });

    it('swallows a throwing startTyping so a keystroke cannot break the composer', () => {
      const boom = new Error('not connected');
      patchSdk(
        'startTyping',
        vi.fn(() => {
          throw boom;
        })
      );

      service.startTyping(new CometChat.User('u7'));

      expect(logger).toHaveBeenCalledWith('MessageComposerService', 'Error starting typing:', boom);
    });

    it('addresses an end-typing indicator at the receiver', () => {
      const ended: CometChat.TypingIndicator[] = [];
      patchSdk('endTyping', vi.fn((indicator: CometChat.TypingIndicator) => ended.push(indicator)));

      service.endTyping(new CometChat.Group('g8', 'Group Eight'));

      expect(ended).toHaveLength(1);
      expect(ended[0].getReceiverId()).toBe('g8');
      expect(ended[0].getReceiverType()).toBe(CometChat.RECEIVER_TYPE.GROUP);
    });

    it('logs and sends nothing when endTyping has no receiver', () => {
      const endTyping = vi.fn();
      patchSdk('endTyping', endTyping);

      service.endTyping(null as unknown as CometChat.User);

      expect(endTyping).not.toHaveBeenCalled();
      expect(logger).toHaveBeenCalledWith('MessageComposerService', 'endTyping: Receiver is required');
    });

    it('swallows a throwing endTyping', () => {
      const boom = new Error('not connected');
      patchSdk(
        'endTyping',
        vi.fn(() => {
          throw boom;
        })
      );

      service.endTyping(new CometChat.User('u8'));

      expect(logger).toHaveBeenCalledWith('MessageComposerService', 'Error ending typing:', boom);
    });
  });

  // ==================== Upload progress and recording ====================

  describe('Upload progress and recording state', () => {
    it('replaces the progress map rather than mutating the one already read', () => {
      service.updateUploadProgress('a', 10);
      const first = service.uploadProgress();

      service.updateUploadProgress('b', 40);

      expect(first.has('b')).toBe(false);
      expect(service.uploadProgress().get('a')).toBe(10);
      expect(service.uploadProgress().get('b')).toBe(40);
    });

    it('drops one file from the progress map and leaves the rest', () => {
      service.updateUploadProgress('a', 10);
      service.updateUploadProgress('b', 40);

      service.clearUploadProgress('a');

      expect(service.uploadProgress().has('a')).toBe(false);
      expect(service.uploadProgress().get('b')).toBe(40);
    });

    it('empties the progress map wholesale', () => {
      service.updateUploadProgress('a', 10);
      service.updateUploadProgress('b', 40);

      service.clearAllUploadProgress();

      expect([...service.uploadProgress().keys()]).toEqual([]);
    });

    it('keeps the elapsed duration when recording starts', () => {
      service.updateRecordingDuration(12);

      service.setRecordingState(true);

      expect(service.isRecording()).toBe(true);
      expect(service.recordingDuration()).toBe(12);
    });

    it('zeroes the elapsed duration when recording stops', () => {
      service.setRecordingState(true);
      service.updateRecordingDuration(12);

      service.setRecordingState(false);

      expect(service.isRecording()).toBe(false);
      expect(service.recordingDuration()).toBe(0);
    });
  });

  // ==================== Mention search ====================

  describe('Mention search', () => {
    it('maps fetched users onto suggestions and lowers the fetching flag', async () => {
      const user = fakeUser('alice');
      const builder = fakeBuilder(vi.fn().mockResolvedValue([user]));

      service.searchMentions('ali', undefined, builder as unknown as CometChat.UsersRequestBuilder);
      expect(service.isFetchingMentions()).toBe(true);
      await settleMentionSearch();

      expect(builder.setSearchKeyword).toHaveBeenCalledWith('ali');
      expect(service.mentionSuggestions()).toEqual([
        { uid: 'alice', name: 'Name alice', avatar: 'alice.png', isAllMention: false, entity: user },
      ]);
      expect(service.isFetchingMentions()).toBe(false);
    });

    it('fetches group members and offers @all first when a group is in context', async () => {
      const member = fakeUser('bob');
      const builder = fakeBuilder(vi.fn().mockResolvedValue([member]));
      const group = { getGuid: () => 'g9' } as unknown as CometChat.Group;

      service.searchMentions(
        'al',
        group,
        undefined,
        builder as unknown as CometChat.GroupMembersRequestBuilder,
        false,
        'all'
      );
      await settleMentionSearch();

      const suggestions = service.mentionSuggestions();
      expect(suggestions[0]).toEqual({ uid: 'all', name: 'all', isAllMention: true });
      expect(suggestions[1].uid).toBe('bob');
      expect(service.isFetchingMentions()).toBe(false);
    });

    it('empties the suggestion list and reports when the group-member fetch fails', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(error => errors.push(error));
      service.appendMentionSuggestions([{ uid: 'stale', name: 'Stale' }]);
      const builder = fakeBuilder(vi.fn().mockRejectedValue(new Error('no access')));
      const group = { getGuid: () => 'g9' } as unknown as CometChat.Group;

      service.searchMentions('x', group, undefined, builder as unknown as CometChat.GroupMembersRequestBuilder);
      await settleMentionSearch();

      expect(service.mentionSuggestions()).toEqual([]);
      expect(service.isFetchingMentions()).toBe(false);
      expect(errors.map(error => error.message)).toEqual([
        'Error fetching group members for mention: no access',
      ]);
    });

    it('empties the suggestion list and reports when the user fetch fails', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(error => errors.push(error));
      service.appendMentionSuggestions([{ uid: 'stale', name: 'Stale' }]);
      const builder = fakeBuilder(vi.fn().mockRejectedValue(new Error('rate limited')));

      service.searchMentions('x', undefined, builder as unknown as CometChat.UsersRequestBuilder);
      await settleMentionSearch();

      expect(service.mentionSuggestions()).toEqual([]);
      expect(service.isFetchingMentions()).toBe(false);
      expect(errors.map(error => error.message)).toEqual(['Error fetching users for mention: rate limited']);
    });

    it('collapses a burst of keystrokes into the last search', async () => {
      const first = fakeBuilder(vi.fn().mockResolvedValue([fakeUser('early')]));
      const last = fakeBuilder(vi.fn().mockResolvedValue([fakeUser('late')]));

      service.searchMentions('e', undefined, first as unknown as CometChat.UsersRequestBuilder);
      service.searchMentions('l', undefined, last as unknown as CometChat.UsersRequestBuilder);
      await settleMentionSearch();

      expect(first.build).not.toHaveBeenCalled();
      expect(service.mentionSuggestions().map(s => s.uid)).toEqual(['late']);
    });

    it('stopMentionSearch lowers both fetching flags without clearing the list', () => {
      service.appendMentionSuggestions([{ uid: 'keep', name: 'Keep' }]);
      // Both flags have to be up first, or "lowers them" asserts nothing: they
      // are false by default.
      (service as any).isFetchingMentionsSignal.set(true);
      (service as any).isFetchingMoreMentionsSignal.set(true);

      service.stopMentionSearch();

      expect(service.isFetchingMentions()).toBe(false);
      expect(service.isFetchingMoreMentions()).toBe(false);
      expect(service.mentionSuggestions().map(s => s.uid)).toEqual(['keep']);
    });

    it('clearMentionSuggestions drops the list but leaves hasMore alone', () => {
      service.appendMentionSuggestions([{ uid: 'a', name: 'A' }]);
      // Parked at the non-default value, so a clear that also reset pagination
      // would show up here instead of hiding behind the initial `true`.
      (service as any).hasMoreMentionsSignal.set(false);

      service.clearMentionSuggestions();

      expect(service.mentionSuggestions()).toEqual([]);
      expect(service.hasMoreMentions()).toBe(false);
    });

    it('appends to the end of the existing list, preserving order', () => {
      const firstBatch: MentionSuggestion[] = [{ uid: 'a', name: 'A' }];
      const secondBatch: MentionSuggestion[] = [{ uid: 'b', name: 'B' }, { uid: 'c', name: 'C' }];

      service.appendMentionSuggestions(firstBatch);
      service.appendMentionSuggestions(secondBatch);

      expect(service.mentionSuggestions().map(s => s.uid)).toEqual(['a', 'b', 'c']);
    });
  });

  // ==================== Mention pagination ====================

  describe('Mention pagination', () => {
    function page(count: number, prefix = 'p'): CometChat.User[] {
      return Array.from({ length: count }, (_, index) => fakeUser(`${prefix}${index}`));
    }

    it('resets the pagination flags when a new request is initialized', () => {
      const builder = fakeBuilder(vi.fn().mockResolvedValue([]));
      (service as any).hasMoreMentionsSignal.set(false);
      (service as any).isFetchingMoreMentionsSignal.set(true);

      service.initializeMentionsPagination('q', undefined, builder as unknown as CometChat.UsersRequestBuilder);

      expect(builder.setSearchKeyword).toHaveBeenCalledWith('q');
      expect(builder.build).toHaveBeenCalled();
      expect(service.hasMoreMentions()).toBe(true);
      expect(service.isFetchingMoreMentions()).toBe(false);
    });

    it('appends a short user page and marks the list exhausted', async () => {
      const fetchNext = vi.fn().mockResolvedValue(page(2));
      service.appendMentionSuggestions([{ uid: 'first', name: 'First' }]);
      service.initializeMentionsPagination(
        'q',
        undefined,
        fakeBuilder(fetchNext) as unknown as CometChat.UsersRequestBuilder
      );

      await service.fetchMoreMentions(false);

      expect(service.mentionSuggestions().map(s => s.uid)).toEqual(['first', 'p0', 'p1']);
      expect(service.hasMoreMentions()).toBe(false);
      expect(service.isFetchingMoreMentions()).toBe(false);
    });

    it('keeps hasMore true when a full page of 20 comes back', async () => {
      const fetchNext = vi.fn().mockResolvedValue(page(20));
      service.initializeMentionsPagination(
        '',
        undefined,
        fakeBuilder(fetchNext) as unknown as CometChat.UsersRequestBuilder
      );

      await service.fetchMoreMentions(false);

      expect(service.mentionSuggestions()).toHaveLength(20);
      expect(service.hasMoreMentions()).toBe(true);
    });

    it('maps a group-context page through the member shape', async () => {
      const members = page(1, 'member');
      const fetchNext = vi.fn().mockResolvedValue(members);
      const group = { getGuid: () => 'g10' } as unknown as CometChat.Group;
      service.initializeMentionsPagination(
        'q',
        group,
        undefined,
        fakeBuilder(fetchNext) as unknown as CometChat.GroupMembersRequestBuilder
      );

      await service.fetchMoreMentions(true);

      expect(service.mentionSuggestions()).toEqual([
        { uid: 'member0', name: 'Name member0', avatar: 'member0.png', isAllMention: false, entity: members[0] },
      ]);
    });

    it('stops paginating and reports when the next page fails', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(error => errors.push(error));
      const fetchNext = vi.fn().mockRejectedValue(new Error('page gone'));
      service.initializeMentionsPagination(
        'q',
        undefined,
        fakeBuilder(fetchNext) as unknown as CometChat.UsersRequestBuilder
      );

      await service.fetchMoreMentions(false);

      expect(service.hasMoreMentions()).toBe(false);
      expect(service.isFetchingMoreMentions()).toBe(false);
      expect(errors.map(error => error.message)).toEqual(['Error fetching more mentions: page gone']);
    });

    it('does not ask for another page once the list is exhausted', async () => {
      const fetchNext = vi.fn().mockResolvedValue(page(1));
      service.initializeMentionsPagination(
        'q',
        undefined,
        fakeBuilder(fetchNext) as unknown as CometChat.UsersRequestBuilder
      );

      // Reach exhaustion the way the composer does — a short page — rather than
      // by setting the signal, so this also pins that the state latches.
      await service.fetchMoreMentions(false);
      expect(fetchNext).toHaveBeenCalledTimes(1);

      await service.fetchMoreMentions(false);

      expect(fetchNext).toHaveBeenCalledTimes(1);
      expect(service.mentionSuggestions().map(s => s.uid)).toEqual(['p0']);
    });

    it('ignores a second page request while the first is still in flight', async () => {
      let land!: (users: CometChat.User[]) => void;
      const fetchNext = vi
        .fn()
        .mockImplementationOnce(() => new Promise<CometChat.User[]>(resolve => (land = resolve)))
        .mockResolvedValue(page(1, 'second'));
      service.initializeMentionsPagination(
        'q',
        undefined,
        fakeBuilder(fetchNext) as unknown as CometChat.UsersRequestBuilder
      );

      const inFlight = service.fetchMoreMentions(false);
      expect(service.isFetchingMoreMentions()).toBe(true);

      await service.fetchMoreMentions(false);
      expect(fetchNext).toHaveBeenCalledTimes(1);

      land(page(1, 'first'));
      await inFlight;
      expect(service.isFetchingMoreMentions()).toBe(false);
      expect(service.mentionSuggestions().map(s => s.uid)).toEqual(['first0']);
    });

    it('does nothing when no pagination request has been initialized', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(error => errors.push(error));
      // Deliberately never calling initializeMentionsPagination: the request is
      // null on a fresh service, which is the state the guard exists for.

      await service.fetchMoreMentions(false);

      // Returning early — rather than dereferencing null and landing in the
      // catch — is what keeps hasMore true and the error callback quiet.
      expect(service.mentionSuggestions()).toEqual([]);
      expect(service.hasMoreMentions()).toBe(true);
      expect(errors).toEqual([]);
      expect(service.isFetchingMoreMentions()).toBe(false);
    });
  });

  // ==================== Self mention ====================

  describe('checkIfSelfMention', () => {
    it('recognises the logged-in user', async () => {
      patchSdk('getLoggedinUser', vi.fn().mockResolvedValue(fakeUser('me')));

      await expect(service.checkIfSelfMention('me')).resolves.toBe(true);
    });

    it('rejects a different uid', async () => {
      patchSdk('getLoggedinUser', vi.fn().mockResolvedValue(fakeUser('me')));

      await expect(service.checkIfSelfMention('someone-else')).resolves.toBe(false);
    });

    it('answers false rather than throwing when nobody is logged in', async () => {
      patchSdk('getLoggedinUser', vi.fn().mockResolvedValue(null));

      await expect(service.checkIfSelfMention('me')).resolves.toBe(false);
    });

    it('reports a failed lookup and answers false', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(error => errors.push(error));
      patchSdk('getLoggedinUser', vi.fn(() => Promise.reject(new Error('no session'))));

      await expect(service.checkIfSelfMention('me')).resolves.toBe(false);
      expect(errors.map(error => error.message)).toEqual(['Error checking self mention: no session']);
    });
  });

  // ==================== Error callback plumbing ====================

  describe('Error callback', () => {
    it('stops reporting once the callback is cleared', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(error => errors.push(error));
      patchSdk('sendMessage', vi.fn(() => Promise.reject(new Error('first'))));

      await service.sendTextMessage(new CometChat.User('u1'), 'a');
      service.setErrorCallback(null);
      await service.sendTextMessage(new CometChat.User('u1'), 'b');

      expect(errors.map(error => error.message)).toEqual(['Error sending text message: first']);
      // Both failures still reach the log, only the consumer callback stops.
      expect(logger.mock.calls.filter(call => call[1] === 'Error sending text message:')).toHaveLength(2);
    });

    it('wraps a non-Error rejection into an UNKNOWN_ERROR exception', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(error => errors.push(error));
      patchSdk('sendMessage', vi.fn(() => Promise.reject('plain string failure')));

      await service.sendTextMessage(new CometChat.User('u1'), 'a');

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('UNKNOWN_ERROR');
      expect(errors[0].message).toBe('Error sending text message: plain string failure');
    });
  });

  // ==================== Cleanup ====================

  describe('cleanup', () => {
    it('returns every signal to its initial value and forgets the callback', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(error => errors.push(error));
      service.updateUploadProgress('a', 50);
      service.setRecordingState(true);
      service.updateRecordingDuration(30);
      service.appendMentionSuggestions([{ uid: 'a', name: 'A' }]);
      (service as any).hasMoreMentionsSignal.set(false);
      (service as any).isFetchingMentionsSignal.set(true);
      (service as any).isFetchingMoreMentionsSignal.set(true);

      service.cleanup();

      expect(service.isSending()).toBe(false);
      expect(service.uploadProgress().size).toBe(0);
      expect(service.isRecording()).toBe(false);
      expect(service.recordingDuration()).toBe(0);
      expect(service.mentionSuggestions()).toEqual([]);
      expect(service.isFetchingMentions()).toBe(false);
      expect(service.isFetchingMoreMentions()).toBe(false);
      expect(service.hasMoreMentions()).toBe(true);

      patchSdk('sendMessage', vi.fn(() => Promise.reject(new Error('after cleanup'))));
      await service.sendTextMessage(new CometChat.User('u1'), 'a');
      expect(errors).toEqual([]);
    });

    it('logs and stops rather than throwing when a reset step fails midway', () => {
      const callbackErrors: CometChat.CometChatException[] = [];
      service.setErrorCallback(error => callbackErrors.push(error));
      service.updateUploadProgress('a', 50);
      service.updateRecordingDuration(30);
      // A composer torn down while a signal write throws must not take the host
      // component's destroy sequence with it.
      (service as any).isRecordingSignal = {
        set: () => {
          throw new Error('signal detached');
        },
      };

      service.cleanup();

      expect(logger).toHaveBeenCalledWith(
        'MessageComposerService',
        'Error during cleanup:',
        expect.objectContaining({ message: 'signal detached' })
      );
      // The steps before the failure landed; the ones after it did not.
      expect(service.uploadProgress().size).toBe(0);
      expect(service.recordingDuration()).toBe(30);
      expect((service as any).errorCallback).not.toBeNull();
    });
  });
});
