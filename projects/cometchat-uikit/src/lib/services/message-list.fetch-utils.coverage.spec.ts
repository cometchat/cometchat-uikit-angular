/**
 * message-list.fetch-utils Tests
 *
 * Covers: fetchPreviousMessagesImpl, fetchNextMessagesImpl,
 *         fetchMessagesAroundIdImpl, handleReceiptImpl and the batch
 *         de-duplication they share.
 *
 * These helpers are pure functions over a context object, so every test drives
 * them directly with a hand-built context and real Angular signals — no live
 * SDK session, no component, nothing that can pass vacuously.
 *
 * @module services/message-list.fetch-utils
 */

// The UI Kit entry point pulls in the Calls SDK, which needs JitsiMeetJS at
// import time; jsdom has no such global.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signal, WritableSignal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  fetchPreviousMessagesImpl,
  fetchNextMessagesImpl,
  fetchMessagesAroundIdImpl,
  handleReceiptImpl,
  FetchContext,
  ReceiptContext,
} from './message-list.fetch-utils';
import { handleSentMessageImpl } from './message-list.sent-handler';
import {
  handleScrollToTopImpl,
  handleScrollToBottomImpl,
} from '../components/cometchat-message-list/cometchat-message-list.scroll-handlers';
import { MessageStatus } from '../Enums/Enums';
import { CometChatLogger } from '../utils/CometChatLogger';
import { CometChatUIKit } from '../cometchat-uikit';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(uid: string): CometChat.User {
  const user = new CometChat.User(uid);
  user.setName(`User ${uid}`);
  return user;
}

interface MessageOpts {
  senderUid?: string;
  muid?: string;
  readAt?: number;
  deliveredAt?: number;
}

/** A real SDK message, so `clone()` keeps the prototype and the setters work. */
function makeMessage(id: number, opts: MessageOpts = {}): CometChat.BaseMessage {
  const message = new CometChat.TextMessage('receiver-1', `text ${id}`, CometChat.RECEIVER_TYPE.USER);
  message.setId(id);
  // An empty MUID is the realistic "server message, never sent from here" case
  // and keeps the falsy-MUID arm of the loops honest.
  message.setMuid(opts.muid ?? '');
  if (opts.senderUid) { message.setSender(makeUser(opts.senderUid)); }
  if (opts.readAt) { message.setReadAt(opts.readAt); }
  if (opts.deliveredAt) { message.setDeliveredAt(opts.deliveredAt); }
  return message as unknown as CometChat.BaseMessage;
}

/**
 * A message object with no `getMuid` at all.
 *
 * Partial payloads and older SDK builds reach the kit without that accessor,
 * which is why the production loops call it optionally. Methods live on the
 * prototype so a deep clone of this still carries them.
 */
class MuidlessMessage {
  id: number;
  readAt?: number;
  deliveredAt?: number;
  sender: CometChat.User | null;

  constructor(id: number, senderUid?: string, opts: { readAt?: number; deliveredAt?: number } = {}) {
    this.id = id;
    this.sender = senderUid ? makeUser(senderUid) : null;
    this.readAt = opts.readAt;
    this.deliveredAt = opts.deliveredAt;
  }

  getId(): number { return this.id; }
  getSender(): CometChat.User { return this.sender as CometChat.User; }
  getReadAt(): number { return this.readAt as number; }
  setReadAt(value: number): void { this.readAt = value; }
  getDeliveredAt(): number { return this.deliveredAt as number; }
  setDeliveredAt(value: number): void { this.deliveredAt = value; }
}

function makeMuidlessMessage(id: number, senderUid?: string, opts: { readAt?: number; deliveredAt?: number } = {}): CometChat.BaseMessage {
  return new MuidlessMessage(id, senderUid, opts) as unknown as CometChat.BaseMessage;
}

type RequestStub = {
  fetchPrevious: ReturnType<typeof vi.fn>;
  fetchNext: ReturnType<typeof vi.fn>;
};

function makeRequest(): RequestStub & CometChat.MessagesRequest {
  return {
    fetchPrevious: vi.fn().mockResolvedValue([]),
    fetchNext: vi.fn().mockResolvedValue([]),
  } as unknown as RequestStub & CometChat.MessagesRequest;
}

type TestFetchContext = FetchContext & {
  DEFAULT_MESSAGE_LIMIT: number;
  markInitialMessagesAsRead: ReturnType<typeof vi.fn>;
  buildMessagesRequest: ReturnType<typeof vi.fn>;
  buildNextMessagesRequest: ReturnType<typeof vi.fn>;
  clearMessagesAndState: ReturnType<typeof vi.fn>;
  loadingStateSignal: WritableSignal<boolean>;
  errorStateSignal: WritableSignal<Error | null>;
  prevMessageIdSignal: WritableSignal<number>;
  nextMessageIdSignal: WritableSignal<number>;
  allMessagesSignal: WritableSignal<CometChat.BaseMessage[]>;
  messagesSignal: WritableSignal<CometChat.BaseMessage[]>;
};

function makeFetchCtx(overrides: Partial<FetchContext> = {}): TestFetchContext {
  const ctx = {
    messagesRequest: null,
    nextMessagesRequest: null,
    fetchGeneration: 0,
    isAgentChatMode: false,
    parentMessageId: null,
    currentUser: null,
    currentGroup: null,
    errorCallback: null,
    DEFAULT_MESSAGE_LIMIT: 30,
    loadingStateSignal: signal(false),
    errorStateSignal: signal<Error | null>(null),
    prevMessageIdSignal: signal(0),
    nextMessageIdSignal: signal(0),
    allMessagesSignal: signal<CometChat.BaseMessage[]>([]),
    messagesSignal: signal<CometChat.BaseMessage[]>([]),
    messageIdMap: new Map<number, CometChat.BaseMessage>(),
    messageMuidMap: new Map<string, CometChat.BaseMessage>(),
    normalizeMessageId: (id: string | number) => Number(id),
    markInitialMessagesAsRead: vi.fn().mockResolvedValue(undefined),
    buildMessagesRequest: vi.fn(() => makeRequest()),
    buildNextMessagesRequest: vi.fn(() => makeRequest()),
    clearMessagesAndState: vi.fn(),
    ...overrides,
  };
  return ctx as unknown as TestFetchContext;
}

function ids(messages: CometChat.BaseMessage[]): number[] {
  return messages.map(m => m.getId());
}

function makeReceipt(messageId: string, opts: { readAt?: number; deliveredAt?: number } = {}): CometChat.MessageReceipt {
  return {
    getMessageId: () => messageId,
    getReadAt: () => opts.readAt as number,
    getDeliveredAt: () => opts.deliveredAt as number,
  } as unknown as CometChat.MessageReceipt;
}

type TestReceiptContext = ReceiptContext & {
  allMessagesSignal: WritableSignal<CometChat.BaseMessage[]>;
  messagesSignal: WritableSignal<CometChat.BaseMessage[]>;
};

function makeReceiptCtx(messages: CometChat.BaseMessage[], overrides: Partial<ReceiptContext> = {}): TestReceiptContext {
  const ctx = {
    currentGroup: null,
    currentUser: makeUser('other'),
    allMessagesSignal: signal<CometChat.BaseMessage[]>([...messages]),
    messagesSignal: signal<CometChat.BaseMessage[]>([...messages]),
    messageIdMap: new Map<number, CometChat.BaseMessage>(),
    messageMuidMap: new Map<string, CometChat.BaseMessage>(),
    normalizeMessageId: (id: string | number) => Number(id),
    ...overrides,
  };
  return ctx as unknown as TestReceiptContext;
}

describe('message-list.fetch-utils', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(CometChatLogger, 'warn').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ==================== fetchPreviousMessagesImpl ====================

  describe('fetchPreviousMessagesImpl', () => {
    it('should refuse to fetch and leave the loading flag alone when no conversation is set', async () => {
      const ctx = makeFetchCtx();

      const result = await fetchPreviousMessagesImpl(ctx);

      expect(result).toBe(false);
      expect(ctx.loadingStateSignal()).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith('MessageListService', expect.stringContaining('No conversation context set'));
    });

    it('should not hit the server in agent chat mode outside a historical thread', async () => {
      const request = makeRequest();
      const ctx = makeFetchCtx({ messagesRequest: request, isAgentChatMode: true, parentMessageId: null });

      const result = await fetchPreviousMessagesImpl(ctx);

      expect(result).toBe(false);
      expect(request.fetchPrevious).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith('MessageListService', expect.stringContaining('agent chat mode'));
    });

    it('should fetch in agent chat mode once a parent message anchors the thread', async () => {
      const request = makeRequest();
      request.fetchPrevious.mockResolvedValue([makeMessage(10)]);
      const ctx = makeFetchCtx({ messagesRequest: request, isAgentChatMode: true, parentMessageId: 99 });

      await fetchPreviousMessagesImpl(ctx);

      expect(request.fetchPrevious).toHaveBeenCalled();
      expect(ids(ctx.allMessagesSignal())).toEqual([10]);
    });

    it('should share one fetch between overlapping callers, so the SDK never refuses a second one', async () => {
      // The SDK rejects a fetchPrevious() while one is running (REQUEST_IN_PROGRESS); before this
      // the refusal set the error state and the list showed "Something went wrong" over messages
      // that had loaded fine.
      let resolveFetch!: (messages: CometChat.BaseMessage[]) => void;
      const request = makeRequest();
      request.fetchPrevious.mockImplementation(() => new Promise((resolve) => { resolveFetch = resolve; }));
      const ctx = makeFetchCtx({ messagesRequest: request });

      const first = fetchPreviousMessagesImpl(ctx);
      const second = fetchPreviousMessagesImpl(ctx);
      resolveFetch([makeMessage(10), makeMessage(11)]);

      expect(second).toBe(first);
      await expect(Promise.all([first, second])).resolves.toEqual([false, false]);
      expect(request.fetchPrevious).toHaveBeenCalledTimes(1);
      expect(ids(ctx.allMessagesSignal())).toEqual([10, 11]);
      expect(ctx.errorStateSignal()).toBeNull();
    });

    it('should start a new fetch once the previous one on the request has finished', async () => {
      const request = makeRequest();
      request.fetchPrevious.mockResolvedValueOnce([makeMessage(20)]).mockResolvedValueOnce([makeMessage(10)]);
      const ctx = makeFetchCtx({ messagesRequest: request });

      await fetchPreviousMessagesImpl(ctx);
      await fetchPreviousMessagesImpl(ctx);

      expect(request.fetchPrevious).toHaveBeenCalledTimes(2);
      expect(ids(ctx.allMessagesSignal())).toEqual([10, 20]);
    });

    it('should not make a new conversation wait on the previous conversation\'s fetch', async () => {
      const oldRequest = makeRequest();
      oldRequest.fetchPrevious.mockImplementation(() => new Promise(() => undefined));
      const newRequest = makeRequest();
      newRequest.fetchPrevious.mockResolvedValue([makeMessage(30)]);
      const ctx = makeFetchCtx({ messagesRequest: oldRequest });

      const stale = fetchPreviousMessagesImpl(ctx);
      ctx.messagesRequest = newRequest;
      ctx.fetchGeneration++;
      const fresh = fetchPreviousMessagesImpl(ctx);

      expect(fresh).not.toBe(stale);
      await fresh;
      expect(newRequest.fetchPrevious).toHaveBeenCalledTimes(1);
      expect(ids(ctx.allMessagesSignal())).toEqual([30]);
    });

    it('should prepend the batch, seed both cursors and index the messages', async () => {
      const request = makeRequest();
      request.fetchPrevious.mockResolvedValue([
        makeMessage(10, { muid: 'm-10' }),
        makeMessage(11, { muid: 'm-11' }),
        makeMessage(12),
      ]);
      const rebuiltNext = makeRequest();
      const ctx = makeFetchCtx({
        messagesRequest: request,
        allMessagesSignal: signal<CometChat.BaseMessage[]>([makeMessage(20)]),
        messagesSignal: signal<CometChat.BaseMessage[]>([makeMessage(20)]),
        buildNextMessagesRequest: vi.fn(() => rebuiltNext),
      });

      const result = await fetchPreviousMessagesImpl(ctx);

      expect(ids(ctx.allMessagesSignal())).toEqual([10, 11, 12, 20]);
      expect(ids(ctx.messagesSignal())).toEqual([10, 11, 12, 20]);
      expect(ctx.prevMessageIdSignal()).toBe(10);
      expect(ctx.nextMessageIdSignal()).toBe(12);
      expect(ctx.buildNextMessagesRequest).toHaveBeenCalledWith(12);
      expect(ctx.nextMessagesRequest).toBe(rebuiltNext);
      expect([...ctx.messageIdMap.keys()]).toEqual([10, 11, 12]);
      expect([...ctx.messageMuidMap.keys()]).toEqual(['m-10', 'm-11']);
      expect(ctx.loadingStateSignal()).toBe(false);
      // Three messages is short of the page limit, so there is nothing older.
      expect(result).toBe(false);
    });

    it('should report more pages when the batch exactly fills the page limit', async () => {
      const request = makeRequest();
      request.fetchPrevious.mockResolvedValue([makeMessage(1), makeMessage(2)]);
      const ctx = makeFetchCtx({ messagesRequest: request, DEFAULT_MESSAGE_LIMIT: 2 } as Partial<FetchContext>);

      await expect(fetchPreviousMessagesImpl(ctx)).resolves.toBe(true);
    });

    it('should leave an existing next cursor and its request untouched', async () => {
      const request = makeRequest();
      request.fetchPrevious.mockResolvedValue([makeMessage(5)]);
      const existingNext = makeRequest();
      const ctx = makeFetchCtx({
        messagesRequest: request,
        nextMessagesRequest: existingNext,
        prevMessageIdSignal: signal(9),
        nextMessageIdSignal: signal(40),
      });

      await fetchPreviousMessagesImpl(ctx);

      expect(ctx.nextMessageIdSignal()).toBe(40);
      expect(ctx.buildNextMessagesRequest).not.toHaveBeenCalled();
      expect(ctx.nextMessagesRequest).toBe(existingNext);
    });

    it('should mark the first batch as read, and only the first', async () => {
      vi.useFakeTimers();
      const request = makeRequest();
      request.fetchPrevious.mockResolvedValue([makeMessage(10)]);
      const ctx = makeFetchCtx({ messagesRequest: request });

      await fetchPreviousMessagesImpl(ctx);
      expect(ctx.markInitialMessagesAsRead).not.toHaveBeenCalled();
      vi.advanceTimersByTime(100);
      expect(ctx.markInitialMessagesAsRead).toHaveBeenCalledTimes(1);

      // The cursor is now set, so a second page must not re-mark the thread.
      request.fetchPrevious.mockResolvedValue([makeMessage(8)]);
      await fetchPreviousMessagesImpl(ctx);
      vi.advanceTimersByTime(100);
      expect(ctx.markInitialMessagesAsRead).toHaveBeenCalledTimes(1);
    });

    it('should advance the cursor without touching the list when the whole page is already on screen', async () => {
      const onScreen = [makeMessage(10), makeMessage(11)];
      const request = makeRequest();
      request.fetchPrevious.mockResolvedValue(onScreen);
      const listBefore = [makeMessage(10), makeMessage(11), makeMessage(12)];
      const ctx = makeFetchCtx({
        messagesRequest: request,
        allMessagesSignal: signal<CometChat.BaseMessage[]>(listBefore),
        messagesSignal: signal<CometChat.BaseMessage[]>(listBefore),
        nextMessageIdSignal: signal(12),
      });
      ctx.messageIdMap.set(10, onScreen[0]);
      ctx.messageIdMap.set(11, onScreen[1]);

      await fetchPreviousMessagesImpl(ctx);

      expect(ctx.allMessagesSignal()).toBe(listBefore);
      expect(ids(ctx.messagesSignal())).toEqual([10, 11, 12]);
      expect(ctx.prevMessageIdSignal()).toBe(10);
    });

    it('should report more pages after a page that deduplicated down to nothing', async () => {
      // Reconnect case: the whole page is already on screen. The has-more result
      // has to follow the server's page size, or the list stops loading history
      // the moment one page round-trips as a full set of duplicates.
      const onScreen = [makeMessage(10), makeMessage(11)];
      const request = makeRequest();
      request.fetchPrevious.mockResolvedValue(onScreen);
      const ctx = makeFetchCtx({
        messagesRequest: request,
        allMessagesSignal: signal<CometChat.BaseMessage[]>([...onScreen]),
        messagesSignal: signal<CometChat.BaseMessage[]>([...onScreen]),
        DEFAULT_MESSAGE_LIMIT: 2,
      } as Partial<FetchContext>);
      ctx.messageIdMap.set(10, onScreen[0]);
      ctx.messageIdMap.set(11, onScreen[1]);

      await expect(fetchPreviousMessagesImpl(ctx)).resolves.toBe(true);
      expect(ctx.prevMessageIdSignal()).toBe(10);
    });

    it('should drop a message repeated inside one batch', async () => {
      const request = makeRequest();
      request.fetchPrevious.mockResolvedValue([makeMessage(10), makeMessage(10), makeMessage(11)]);
      const ctx = makeFetchCtx({ messagesRequest: request });

      await fetchPreviousMessagesImpl(ctx);

      expect(ids(ctx.allMessagesSignal())).toEqual([10, 11]);
    });

    it('should drop a message whose MUID is already held even when its id is new', async () => {
      const held = makeMessage(0, { muid: 'pending-7' });
      const request = makeRequest();
      request.fetchPrevious.mockResolvedValue([makeMessage(31, { muid: 'pending-7' }), makeMessage(32)]);
      const ctx = makeFetchCtx({ messagesRequest: request });
      ctx.messageMuidMap.set('pending-7', held);

      await fetchPreviousMessagesImpl(ctx);

      expect(ids(ctx.allMessagesSignal())).toEqual([32]);
      // The cursor follows the server's page, not the surviving rows: 31 was
      // dropped from the list but it is still the oldest row the server
      // returned, so the next page has to continue from it.
      expect(ctx.prevMessageIdSignal()).toBe(31);
    });

    it('should keep an unsent message that has no id and index it under zero', async () => {
      const request = makeRequest();
      // A message with no id yet and no getMuid accessor at all.
      request.fetchPrevious.mockResolvedValue([makeMuidlessMessage(0), makeMessage(11)]);
      const ctx = makeFetchCtx({ messagesRequest: request });

      await fetchPreviousMessagesImpl(ctx);

      expect(ids(ctx.allMessagesSignal())).toEqual([0, 11]);
      expect([...ctx.messageIdMap.keys()]).toEqual([0, 11]);
      expect(ctx.messageMuidMap.size).toBe(0);
    });

    it('should do nothing on an empty page', async () => {
      const request = makeRequest();
      request.fetchPrevious.mockResolvedValue([]);
      const ctx = makeFetchCtx({ messagesRequest: request });

      const result = await fetchPreviousMessagesImpl(ctx);

      expect(result).toBe(false);
      expect(ctx.allMessagesSignal()).toEqual([]);
      expect(ctx.prevMessageIdSignal()).toBe(0);
      expect(ctx.loadingStateSignal()).toBe(false);
    });

    it('should discard the page and keep the loading flag when a newer fetch has started', async () => {
      const request = makeRequest();
      const ctx = makeFetchCtx({ messagesRequest: request });
      // A setUser()/setGroup() switch lands while the page is in flight.
      request.fetchPrevious.mockImplementation(async () => {
        ctx.fetchGeneration += 1;
        return [makeMessage(10)];
      });

      const result = await fetchPreviousMessagesImpl(ctx);

      expect(result).toBe(false);
      expect(ctx.allMessagesSignal()).toEqual([]);
      expect(ctx.prevMessageIdSignal()).toBe(0);
      // The newer fetch owns the flag now.
      expect(ctx.loadingStateSignal()).toBe(true);
    });

    it('should record the failure and notify the error callback', async () => {
      const failure = new Error('fetch previous blew up');
      const request = makeRequest();
      request.fetchPrevious.mockRejectedValue(failure);
      const errorCallback = vi.fn();
      const ctx = makeFetchCtx({ messagesRequest: request, errorCallback });

      const result = await fetchPreviousMessagesImpl(ctx);

      expect(result).toBe(false);
      expect(ctx.errorStateSignal()).toBe(failure);
      expect(ctx.loadingStateSignal()).toBe(false);
      expect(errorCallback).toHaveBeenCalledWith(failure);
      expect(errorSpy).toHaveBeenCalledWith('MessageListService', 'Error fetching previous messages:', failure);
    });

    it('should still record the failure when no error callback is registered', async () => {
      const failure = new Error('no callback');
      const request = makeRequest();
      request.fetchPrevious.mockRejectedValue(failure);
      const ctx = makeFetchCtx({ messagesRequest: request, errorCallback: null });

      const result = await fetchPreviousMessagesImpl(ctx);

      expect(result).toBe(false);
      expect(ctx.errorStateSignal()).toBe(failure);
    });

    it('keeps loaded messages on screen when a page of older messages fails (no error view)', async () => {
      // Scrolling up while the connection drops: the chat must stay, not turn into the error view.
      const failure = new Error('offline');
      const request = makeRequest();
      request.fetchPrevious.mockRejectedValue(failure);
      const errorCallback = vi.fn();
      const loaded = [makeMessage(40), makeMessage(41)];
      const ctx = makeFetchCtx({
        messagesRequest: request,
        errorCallback,
        allMessagesSignal: signal<CometChat.BaseMessage[]>(loaded),
        messagesSignal: signal<CometChat.BaseMessage[]>(loaded),
      });

      const result = await fetchPreviousMessagesImpl(ctx);

      // Not the end of the history: the caller keeps hasMorePrevious on, so scrolling retries.
      expect(result).toBe(true);
      expect(ctx.errorStateSignal()).toBeNull();
      expect(ids(ctx.messagesSignal())).toEqual([40, 41]);
      expect(ctx.loadingStateSignal()).toBe(false);
      expect(errorCallback).toHaveBeenCalledWith(failure);
      expect(errorSpy).toHaveBeenCalledWith('MessageListService', 'Error fetching previous messages:', failure);
    });

    it('should swallow a failure that belongs to a superseded fetch', async () => {
      const request = makeRequest();
      const errorCallback = vi.fn();
      const ctx = makeFetchCtx({ messagesRequest: request, errorCallback });
      request.fetchPrevious.mockImplementation(async () => {
        ctx.fetchGeneration += 1;
        throw new Error('stale failure');
      });

      const result = await fetchPreviousMessagesImpl(ctx);

      expect(result).toBe(false);
      expect(ctx.errorStateSignal()).toBeNull();
      expect(errorCallback).not.toHaveBeenCalled();
      expect(ctx.loadingStateSignal()).toBe(true);
    });

    it('should end in an error state when the SDK resolves a page of null', async () => {
      const request = makeRequest();
      // Some SDK error shapes resolve without a payload.
      request.fetchPrevious.mockResolvedValue(null);
      const ctx = makeFetchCtx({ messagesRequest: request });

      const result = await fetchPreviousMessagesImpl(ctx);

      expect(result).toBe(false);
      expect(ctx.allMessagesSignal()).toEqual([]);
      expect(ctx.errorStateSignal()).toBeInstanceOf(TypeError);
    });

    it('should flush sent messages that were queued while the first page loaded', async () => {
      const request = makeRequest();
      request.fetchPrevious.mockResolvedValue([makeMessage(10, { muid: 'm-10' })]);
      const ctx = makeFetchCtx({ messagesRequest: request });
      const sendCtx = ctx as unknown as Record<string, unknown>;
      sendCtx['isMessageForCurrentConversation'] = () => true;
      sendCtx['addMessage'] = vi.fn();
      const queued = makeMessage(0, { muid: 'pending-1' });
      ctx.loadingStateSignal.set(true);
      handleSentMessageImpl(ctx, { message: queued, status: MessageStatus.inprogress } as never);
      expect(sendCtx['addMessage']).not.toHaveBeenCalled();

      await fetchPreviousMessagesImpl(ctx);

      expect(sendCtx['addMessage']).toHaveBeenCalledWith(queued);
    });

    it('should flush queued sent messages even when the page fails', async () => {
      const request = makeRequest();
      request.fetchPrevious.mockRejectedValue(new Error('page failed'));
      const ctx = makeFetchCtx({ messagesRequest: request });
      const sendCtx = ctx as unknown as Record<string, unknown>;
      sendCtx['isMessageForCurrentConversation'] = () => true;
      sendCtx['addMessage'] = vi.fn();
      const queued = makeMessage(0, { muid: 'pending-2' });
      ctx.loadingStateSignal.set(true);
      handleSentMessageImpl(ctx, { message: queued, status: MessageStatus.inprogress } as never);

      await fetchPreviousMessagesImpl(ctx);

      expect(sendCtx['addMessage']).toHaveBeenCalledWith(queued);
    });
  });

  // ==================== fetchNextMessagesImpl ====================

  describe('fetchNextMessagesImpl', () => {
    it('should refuse to fetch forward when no conversation is set', async () => {
      const ctx = makeFetchCtx();

      const result = await fetchNextMessagesImpl(ctx);

      expect(result).toBe(false);
      expect(ctx.loadingStateSignal()).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith('MessageListService', expect.stringContaining('Cannot fetch next messages'));
    });

    it('should append the batch, index it and seed both cursors', async () => {
      const request = makeRequest();
      request.fetchNext.mockResolvedValue([
        makeMessage(21, { muid: 'm-21' }),
        makeMuidlessMessage(22),
      ]);
      const existing = [makeMessage(20)];
      const ctx = makeFetchCtx({
        nextMessagesRequest: request,
        allMessagesSignal: signal<CometChat.BaseMessage[]>([...existing]),
        messagesSignal: signal<CometChat.BaseMessage[]>([...existing]),
      });

      const result = await fetchNextMessagesImpl(ctx);

      expect(ids(ctx.allMessagesSignal())).toEqual([20, 21, 22]);
      expect(ids(ctx.messagesSignal())).toEqual([20, 21, 22]);
      expect(ctx.nextMessageIdSignal()).toBe(22);
      expect(ctx.prevMessageIdSignal()).toBe(21);
      expect([...ctx.messageIdMap.keys()]).toEqual([21, 22]);
      expect([...ctx.messageMuidMap.keys()]).toEqual(['m-21']);
      expect(ctx.loadingStateSignal()).toBe(false);
      expect(result).toBe(false);
    });

    it('should leave an existing previous cursor in place', async () => {
      const request = makeRequest();
      request.fetchNext.mockResolvedValue([makeMessage(21)]);
      const ctx = makeFetchCtx({ nextMessagesRequest: request, prevMessageIdSignal: signal(3) });

      await fetchNextMessagesImpl(ctx);

      expect(ctx.prevMessageIdSignal()).toBe(3);
      expect(ctx.nextMessageIdSignal()).toBe(21);
    });

    it('should report more pages when the forward batch fills the page limit', async () => {
      const request = makeRequest();
      request.fetchNext.mockResolvedValue([makeMessage(21), makeMessage(22)]);
      const ctx = makeFetchCtx({ nextMessagesRequest: request, DEFAULT_MESSAGE_LIMIT: 2 } as Partial<FetchContext>);

      await expect(fetchNextMessagesImpl(ctx)).resolves.toBe(true);
    });

    it('should advance the forward cursor without re-appending messages already on screen', async () => {
      const socketDelivered = [makeMessage(21, { muid: 'm-21' }), makeMessage(22)];
      const request = makeRequest();
      request.fetchNext.mockResolvedValue(socketDelivered);
      const listBefore = [...socketDelivered];
      const ctx = makeFetchCtx({
        nextMessagesRequest: request,
        allMessagesSignal: signal<CometChat.BaseMessage[]>(listBefore),
        messagesSignal: signal<CometChat.BaseMessage[]>(listBefore),
        prevMessageIdSignal: signal(21),
      });
      ctx.messageMuidMap.set('m-21', socketDelivered[0]);
      ctx.messageIdMap.set(22, socketDelivered[1]);

      await fetchNextMessagesImpl(ctx);

      expect(ctx.allMessagesSignal()).toBe(listBefore);
      expect(ids(ctx.messagesSignal())).toEqual([21, 22]);
      expect(ctx.nextMessageIdSignal()).toBe(22);
    });

    it('should advance the forward cursor to the server page even when its newest row was a duplicate', async () => {
      const alreadyHeld = makeMessage(22);
      const request = makeRequest();
      request.fetchNext.mockResolvedValue([makeMessage(21), alreadyHeld]);
      const ctx = makeFetchCtx({ nextMessagesRequest: request, DEFAULT_MESSAGE_LIMIT: 2 } as Partial<FetchContext>);
      ctx.messageIdMap.set(22, alreadyHeld);

      await expect(fetchNextMessagesImpl(ctx)).resolves.toBe(true);

      // 22 never joined the list again, but it is still the newest row the
      // server returned, so it is where the forward cursor belongs.
      expect(ids(ctx.allMessagesSignal())).toEqual([21]);
      expect(ctx.nextMessageIdSignal()).toBe(22);
      expect(ctx.prevMessageIdSignal()).toBe(21);
    });

    it('should do nothing on an empty forward page', async () => {
      const request = makeRequest();
      request.fetchNext.mockResolvedValue([]);
      const ctx = makeFetchCtx({ nextMessagesRequest: request });

      const result = await fetchNextMessagesImpl(ctx);

      expect(result).toBe(false);
      expect(ctx.allMessagesSignal()).toEqual([]);
      expect(ctx.nextMessageIdSignal()).toBe(0);
      expect(ctx.loadingStateSignal()).toBe(false);
    });

    it('should discard a forward page from a superseded fetch', async () => {
      const request = makeRequest();
      const ctx = makeFetchCtx({ nextMessagesRequest: request });
      request.fetchNext.mockImplementation(async () => {
        ctx.fetchGeneration += 1;
        return [makeMessage(21)];
      });

      const result = await fetchNextMessagesImpl(ctx);

      expect(result).toBe(false);
      expect(ctx.allMessagesSignal()).toEqual([]);
      expect(ctx.nextMessageIdSignal()).toBe(0);
      expect(ctx.loadingStateSignal()).toBe(true);
    });

    it('should record a forward failure and notify the error callback', async () => {
      const failure = new Error('fetch next blew up');
      const request = makeRequest();
      request.fetchNext.mockRejectedValue(failure);
      const errorCallback = vi.fn();
      const ctx = makeFetchCtx({ nextMessagesRequest: request, errorCallback });

      const result = await fetchNextMessagesImpl(ctx);

      expect(result).toBe(false);
      expect(ctx.errorStateSignal()).toBe(failure);
      expect(ctx.loadingStateSignal()).toBe(false);
      expect(errorCallback).toHaveBeenCalledWith(failure);
      expect(errorSpy).toHaveBeenCalledWith('MessageListService', 'Error fetching next messages:', failure);
    });

    it('should record a forward failure with no error callback registered', async () => {
      const failure = new Error('forward, no callback');
      const request = makeRequest();
      request.fetchNext.mockRejectedValue(failure);
      const ctx = makeFetchCtx({ nextMessagesRequest: request, errorCallback: null });

      await expect(fetchNextMessagesImpl(ctx)).resolves.toBe(false);
      expect(ctx.errorStateSignal()).toBe(failure);
    });

    it('keeps loaded messages on screen when a page of newer messages fails (no error view)', async () => {
      const failure = new Error('offline');
      const request = makeRequest();
      request.fetchNext.mockRejectedValue(failure);
      const errorCallback = vi.fn();
      const loaded = [makeMessage(40), makeMessage(41)];
      const ctx = makeFetchCtx({
        nextMessagesRequest: request,
        errorCallback,
        allMessagesSignal: signal<CometChat.BaseMessage[]>(loaded),
        messagesSignal: signal<CometChat.BaseMessage[]>(loaded),
      });

      await expect(fetchNextMessagesImpl(ctx)).resolves.toBe(true);
      expect(ctx.errorStateSignal()).toBeNull();
      expect(ids(ctx.messagesSignal())).toEqual([40, 41]);
      expect(ctx.loadingStateSignal()).toBe(false);
      expect(errorCallback).toHaveBeenCalledWith(failure);
    });

    it('should swallow a forward failure that belongs to a superseded fetch', async () => {
      const request = makeRequest();
      const errorCallback = vi.fn();
      const ctx = makeFetchCtx({ nextMessagesRequest: request, errorCallback });
      request.fetchNext.mockImplementation(async () => {
        ctx.fetchGeneration += 1;
        throw new Error('stale forward failure');
      });

      const result = await fetchNextMessagesImpl(ctx);

      expect(result).toBe(false);
      expect(ctx.errorStateSignal()).toBeNull();
      expect(errorCallback).not.toHaveBeenCalled();
    });

    it('should end in an error state when the SDK resolves a forward page of undefined', async () => {
      const request = makeRequest();
      request.fetchNext.mockResolvedValue(undefined);
      const ctx = makeFetchCtx({ nextMessagesRequest: request });

      const result = await fetchNextMessagesImpl(ctx);

      expect(result).toBe(false);
      expect(ctx.errorStateSignal()).toBeInstanceOf(TypeError);
    });

    it('should flush sent messages queued while the forward page loaded', async () => {
      const request = makeRequest();
      request.fetchNext.mockResolvedValue([makeMessage(21)]);
      const ctx = makeFetchCtx({ nextMessagesRequest: request });
      const sendCtx = ctx as unknown as Record<string, unknown>;
      sendCtx['isMessageForCurrentConversation'] = () => true;
      sendCtx['addMessage'] = vi.fn();
      const queued = makeMessage(0, { muid: 'pending-3' });
      ctx.loadingStateSignal.set(true);
      handleSentMessageImpl(ctx, { message: queued, status: MessageStatus.inprogress } as never);

      await fetchNextMessagesImpl(ctx);

      expect(sendCtx['addMessage']).toHaveBeenCalledWith(queued);
    });
  });

  // ==================== fetchMessagesAroundIdImpl ====================

  describe('fetchMessagesAroundIdImpl', () => {
    it('should throw and record an error when no conversation is set', async () => {
      const ctx = makeFetchCtx();

      await expect(fetchMessagesAroundIdImpl(ctx, 50)).rejects.toThrow('Cannot fetch messages around ID');

      expect(ctx.errorStateSignal()).toBeInstanceOf(Error);
      expect(ctx.clearMessagesAndState).not.toHaveBeenCalled();
      expect(ctx.loadingStateSignal()).toBe(false);
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should load both sides around the anchor and rebuild the paging requests', async () => {
      const beforeRequest = makeRequest();
      beforeRequest.fetchPrevious.mockResolvedValue([makeMessage(48), makeMessage(49, { muid: 'm-49' })]);
      const afterRequest = makeRequest();
      afterRequest.fetchNext.mockResolvedValue([makeMessage(50), makeMuidlessMessage(51)]);
      const rebuiltPrev = makeRequest();
      const rebuiltNext = makeRequest();
      const ctx = makeFetchCtx({
        currentUser: makeUser('other'),
        buildMessagesRequest: vi.fn()
          .mockReturnValueOnce(beforeRequest)
          .mockReturnValueOnce(rebuiltPrev),
        buildNextMessagesRequest: vi.fn()
          .mockReturnValueOnce(afterRequest)
          .mockReturnValueOnce(rebuiltNext),
      });

      await fetchMessagesAroundIdImpl(ctx, 50);

      expect(ctx.clearMessagesAndState).toHaveBeenCalled();
      expect(ctx.buildMessagesRequest).toHaveBeenNthCalledWith(1, 50);
      // The forward leg is anchored on the newest message of the backward leg.
      expect(ctx.buildNextMessagesRequest).toHaveBeenNthCalledWith(1, 49);
      expect(ids(ctx.allMessagesSignal())).toEqual([48, 49, 50, 51]);
      expect(ids(ctx.messagesSignal())).toEqual([48, 49, 50, 51]);
      expect(ctx.prevMessageIdSignal()).toBe(48);
      expect(ctx.nextMessageIdSignal()).toBe(51);
      expect([...ctx.messageIdMap.keys()]).toEqual([48, 49, 50, 51]);
      expect([...ctx.messageMuidMap.keys()]).toEqual(['m-49']);
      expect(ctx.buildMessagesRequest).toHaveBeenNthCalledWith(2, 48);
      expect(ctx.buildNextMessagesRequest).toHaveBeenNthCalledWith(2, 51);
      expect(ctx.messagesRequest).toBe(rebuiltPrev);
      expect(ctx.nextMessagesRequest).toBe(rebuiltNext);
      expect(ctx.loadingStateSignal()).toBe(false);
    });

    it('should fetch the anchor message itself when nothing precedes it', async () => {
      const beforeRequest = makeRequest();
      beforeRequest.fetchPrevious.mockResolvedValue([]);
      const afterRequest = makeRequest();
      afterRequest.fetchNext.mockResolvedValue([makeMessage(100)]);
      const target = makeMessage(99, { muid: 'm-99' });
      const detailsSpy = vi.spyOn(CometChat, 'getMessageDetails').mockResolvedValue(target as never);
      const ctx = makeFetchCtx({
        currentGroup: new CometChat.Group('g1', 'Group One'),
        buildMessagesRequest: vi.fn(() => beforeRequest),
        buildNextMessagesRequest: vi.fn(() => afterRequest),
      });

      await fetchMessagesAroundIdImpl(ctx, 99);

      expect(detailsSpy).toHaveBeenCalledWith(99);
      // With no backward page the forward leg is anchored on the target itself.
      expect(ctx.buildNextMessagesRequest).toHaveBeenNthCalledWith(1, 99);
      expect(ids(ctx.allMessagesSignal())).toEqual([99, 100]);
      expect(ctx.messageMuidMap.get('m-99')).toBe(target);
    });

    it('should carry on with the forward page when the anchor message cannot be fetched', async () => {
      const beforeRequest = makeRequest();
      beforeRequest.fetchPrevious.mockResolvedValue([]);
      const afterRequest = makeRequest();
      afterRequest.fetchNext.mockResolvedValue([makeMessage(100), makeMessage(101)]);
      const failure = new Error('message not found');
      vi.spyOn(CometChat, 'getMessageDetails').mockRejectedValue(failure);
      const ctx = makeFetchCtx({
        currentUser: makeUser('other'),
        buildMessagesRequest: vi.fn(() => beforeRequest),
        buildNextMessagesRequest: vi.fn(() => afterRequest),
      });

      await fetchMessagesAroundIdImpl(ctx, 99);

      expect(errorSpy).toHaveBeenCalledWith('MessageListService', 'Failed to fetch target message:', failure);
      expect(ids(ctx.allMessagesSignal())).toEqual([100, 101]);
      expect(ctx.errorStateSignal()).toBeNull();
    });

    it('should collapse a message returned by both legs', async () => {
      const beforeRequest = makeRequest();
      beforeRequest.fetchPrevious.mockResolvedValue([makeMessage(48), makeMessage(49)]);
      const afterRequest = makeRequest();
      afterRequest.fetchNext.mockResolvedValue([makeMessage(49), makeMessage(50)]);
      const ctx = makeFetchCtx({
        currentUser: makeUser('other'),
        buildMessagesRequest: vi.fn(() => beforeRequest),
        buildNextMessagesRequest: vi.fn(() => afterRequest),
      });

      await fetchMessagesAroundIdImpl(ctx, 49);

      expect(ids(ctx.allMessagesSignal())).toEqual([48, 49, 50]);
    });

    it('should rebuild unanchored paging requests when neither leg returns anything', async () => {
      const beforeRequest = makeRequest();
      beforeRequest.fetchPrevious.mockResolvedValue([]);
      const afterRequest = makeRequest();
      afterRequest.fetchNext.mockResolvedValue([]);
      vi.spyOn(CometChat, 'getMessageDetails').mockResolvedValue(null as never);
      const ctx = makeFetchCtx({
        currentUser: makeUser('other'),
        buildMessagesRequest: vi.fn(() => beforeRequest),
        buildNextMessagesRequest: vi.fn(() => afterRequest),
      });

      await fetchMessagesAroundIdImpl(ctx, 99);

      expect(ctx.allMessagesSignal()).toEqual([]);
      expect(ctx.prevMessageIdSignal()).toBe(0);
      expect(ctx.buildMessagesRequest).toHaveBeenNthCalledWith(2, undefined);
      expect(ctx.buildNextMessagesRequest).toHaveBeenNthCalledWith(2, undefined);
      expect(ctx.loadingStateSignal()).toBe(false);
    });

    it('should abandon the jump when the conversation changes during the backward leg', async () => {
      const beforeRequest = makeRequest();
      const ctx = makeFetchCtx({
        currentUser: makeUser('other'),
        buildMessagesRequest: vi.fn(() => beforeRequest),
      });
      beforeRequest.fetchPrevious.mockImplementation(async () => {
        ctx.fetchGeneration += 1;
        return [makeMessage(48)];
      });

      await fetchMessagesAroundIdImpl(ctx, 50);

      expect(ctx.buildNextMessagesRequest).not.toHaveBeenCalled();
      expect(ctx.allMessagesSignal()).toEqual([]);
      expect(ctx.messagesRequest).toBeNull();
      expect(ctx.loadingStateSignal()).toBe(true);
    });

    it('should abandon the jump when the conversation changes during the forward leg', async () => {
      const beforeRequest = makeRequest();
      beforeRequest.fetchPrevious.mockResolvedValue([makeMessage(48)]);
      const afterRequest = makeRequest();
      const ctx = makeFetchCtx({
        currentUser: makeUser('other'),
        buildMessagesRequest: vi.fn(() => beforeRequest),
        buildNextMessagesRequest: vi.fn(() => afterRequest),
      });
      afterRequest.fetchNext.mockImplementation(async () => {
        ctx.fetchGeneration += 1;
        return [makeMessage(50)];
      });

      await fetchMessagesAroundIdImpl(ctx, 50);

      expect(ctx.allMessagesSignal()).toEqual([]);
      expect(ctx.messagesRequest).toBeNull();
      expect(ctx.nextMessagesRequest).toBeNull();
    });

    it('should record a jump failure and notify the error callback', async () => {
      const failure = new Error('jump blew up');
      const beforeRequest = makeRequest();
      beforeRequest.fetchPrevious.mockRejectedValue(failure);
      const errorCallback = vi.fn();
      const ctx = makeFetchCtx({
        currentUser: makeUser('other'),
        errorCallback,
        buildMessagesRequest: vi.fn(() => beforeRequest),
      });

      await fetchMessagesAroundIdImpl(ctx, 50);

      expect(ctx.errorStateSignal()).toBe(failure);
      expect(ctx.loadingStateSignal()).toBe(false);
      expect(errorCallback).toHaveBeenCalledWith(failure);
      expect(errorSpy).toHaveBeenCalledWith('MessageListService', 'Error fetching messages around ID:', failure);
    });

    it('should record a jump failure with no error callback registered', async () => {
      const failure = new Error('jump, no callback');
      const beforeRequest = makeRequest();
      beforeRequest.fetchPrevious.mockRejectedValue(failure);
      const ctx = makeFetchCtx({
        currentUser: makeUser('other'),
        errorCallback: null,
        buildMessagesRequest: vi.fn(() => beforeRequest),
      });

      await fetchMessagesAroundIdImpl(ctx, 50);

      expect(ctx.errorStateSignal()).toBe(failure);
    });

    it('should swallow a jump failure that belongs to a superseded fetch', async () => {
      const beforeRequest = makeRequest();
      const errorCallback = vi.fn();
      const ctx = makeFetchCtx({
        currentUser: makeUser('other'),
        errorCallback,
        buildMessagesRequest: vi.fn(() => beforeRequest),
      });
      beforeRequest.fetchPrevious.mockImplementation(async () => {
        ctx.fetchGeneration += 1;
        throw new Error('stale jump failure');
      });

      await fetchMessagesAroundIdImpl(ctx, 50);

      expect(ctx.errorStateSignal()).toBeNull();
      expect(errorCallback).not.toHaveBeenCalled();
      expect(ctx.loadingStateSignal()).toBe(true);
    });

    it('should flush sent messages queued while the jump loaded', async () => {
      const beforeRequest = makeRequest();
      beforeRequest.fetchPrevious.mockResolvedValue([makeMessage(48)]);
      const afterRequest = makeRequest();
      afterRequest.fetchNext.mockResolvedValue([]);
      const ctx = makeFetchCtx({
        currentUser: makeUser('other'),
        buildMessagesRequest: vi.fn(() => beforeRequest),
        buildNextMessagesRequest: vi.fn(() => afterRequest),
      });
      const sendCtx = ctx as unknown as Record<string, unknown>;
      sendCtx['isMessageForCurrentConversation'] = () => true;
      sendCtx['addMessage'] = vi.fn();
      const queued = makeMessage(0, { muid: 'pending-4' });
      ctx.loadingStateSignal.set(true);
      handleSentMessageImpl(ctx, { message: queued, status: MessageStatus.inprogress } as never);

      await fetchMessagesAroundIdImpl(ctx, 48);

      expect(sendCtx['addMessage']).toHaveBeenCalledWith(queued);
    });
  });

  // ==================== handleReceiptImpl ====================

  describe('handleReceiptImpl', () => {
    const ME = 'me';

    beforeEach(() => {
      vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(makeUser(ME));
    });

    it('should ignore a one-to-one receipt while a group is open', () => {
      const own = makeMessage(5, { senderUid: ME });
      const ctx = makeReceiptCtx([own], { currentGroup: new CometChat.Group('g1', 'Group One'), currentUser: null });

      handleReceiptImpl(ctx, makeReceipt('5', { readAt: 1700 }), false);

      expect(ctx.allMessagesSignal()[0].getReadAt()).toBeFalsy();
    });

    it('should ignore a group receipt while a one-to-one chat is open', () => {
      const own = makeMessage(5, { senderUid: ME });
      const ctx = makeReceiptCtx([own], { currentUser: makeUser('other') });

      handleReceiptImpl(ctx, makeReceipt('5', { readAt: 1700 }), true);

      expect(ctx.allMessagesSignal()[0].getReadAt()).toBeFalsy();
    });

    it('should accept a group receipt while a group is open', () => {
      const own = makeMessage(5, { senderUid: ME });
      const ctx = makeReceiptCtx([own], { currentGroup: new CometChat.Group('g1', 'Group One'), currentUser: null });

      handleReceiptImpl(ctx, makeReceipt('5', { readAt: 1700 }), true);

      expect(ctx.allMessagesSignal()[0].getReadAt()).toBe(1700);
    });

    it('should warn and do nothing on a receipt with a non-numeric message id', () => {
      const own = makeMessage(5, { senderUid: ME });
      const ctx = makeReceiptCtx([own]);
      const listBefore = ctx.allMessagesSignal();

      handleReceiptImpl(ctx, makeReceipt('not-a-number', { readAt: 1700 }), false);

      expect(warnSpy).toHaveBeenCalledWith('MessageListService', 'Invalid message ID in receipt:', 'not-a-number');
      expect(ctx.allMessagesSignal()).toBe(listBefore);
    });

    it('should do nothing when there is no logged-in user', () => {
      vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(null);
      const own = makeMessage(5, { senderUid: ME });
      const ctx = makeReceiptCtx([own]);

      handleReceiptImpl(ctx, makeReceipt('5', { readAt: 1700 }), false);

      expect(ctx.allMessagesSignal()[0].getReadAt()).toBeFalsy();
    });

    it('should mark own messages up to the receipt as read and skip the other party', () => {
      const messages = [
        makeMessage(1, { senderUid: ME, muid: 'm-1' }),
        makeMessage(2, { senderUid: 'other' }),
        makeMessage(3, { senderUid: ME }),
        makeMessage(4, { senderUid: ME }),
      ];
      const ctx = makeReceiptCtx(messages);

      handleReceiptImpl(ctx, makeReceipt('3', { readAt: 1700 }), false);

      const all = ctx.allMessagesSignal();
      expect(all.map(m => m.getReadAt() ?? 0)).toEqual([1700, 0, 1700, 0]);
      // A read receipt implies delivery, so both stamps land together.
      expect(all[0].getDeliveredAt()).toBe(1700);
      expect(all[2].getDeliveredAt()).toBe(1700);
      // The rendered list must see the same updated objects.
      expect(ctx.messagesSignal().map(m => m.getReadAt() ?? 0)).toEqual([1700, 0, 1700, 0]);
      expect(ctx.messageIdMap.get(1)).toBe(all[0]);
      expect(ctx.messageIdMap.get(3)).toBe(all[2]);
      expect(ctx.messageMuidMap.get('m-1')).toBe(all[0]);
      // Clones, so the originals are untouched and change detection sees new refs.
      expect(messages[0].getReadAt()).toBeFalsy();
    });

    it('should keep an earlier delivery timestamp when a read receipt arrives', () => {
      const messages = [makeMessage(5, { senderUid: ME, deliveredAt: 1600 })];
      const ctx = makeReceiptCtx(messages);

      handleReceiptImpl(ctx, makeReceipt('5', { readAt: 1700 }), false);

      const updated = ctx.allMessagesSignal()[0];
      expect(updated.getReadAt()).toBe(1700);
      expect(updated.getDeliveredAt()).toBe(1600);
    });

    it('should stop walking back at the first already-read message', () => {
      const messages = [
        makeMessage(1, { senderUid: ME }),
        makeMessage(2, { senderUid: ME, readAt: 1500 }),
        makeMessage(3, { senderUid: ME }),
      ];
      const ctx = makeReceiptCtx(messages);

      handleReceiptImpl(ctx, makeReceipt('3', { readAt: 1700 }), false);

      const all = ctx.allMessagesSignal();
      expect(all[2].getReadAt()).toBe(1700);
      expect(all[1].getReadAt()).toBe(1500);
      // Everything below an already-read message is read too, so the walk stops.
      expect(all[0].getReadAt()).toBeFalsy();
      expect(ctx.messagesSignal()[0].getReadAt()).toBeFalsy();
    });

    it('should stamp delivery only, leaving the read flag clear', () => {
      const messages = [makeMessage(5, { senderUid: ME, muid: 'm-5' })];
      const ctx = makeReceiptCtx(messages);

      handleReceiptImpl(ctx, makeReceipt('5', { deliveredAt: 1650 }), false);

      const updated = ctx.allMessagesSignal()[0];
      expect(updated.getDeliveredAt()).toBe(1650);
      expect(updated.getReadAt()).toBeFalsy();
      expect(ctx.messagesSignal()[0]).toBe(updated);
      expect(ctx.messageMuidMap.get('m-5')).toBe(updated);
    });

    it('should stop walking back at the first already-delivered message', () => {
      const messages = [
        makeMessage(1, { senderUid: ME }),
        makeMessage(2, { senderUid: ME, deliveredAt: 1500 }),
        makeMessage(3, { senderUid: ME }),
      ];
      const ctx = makeReceiptCtx(messages);

      handleReceiptImpl(ctx, makeReceipt('3', { deliveredAt: 1650 }), false);

      const all = ctx.allMessagesSignal();
      expect(all[2].getDeliveredAt()).toBe(1650);
      expect(all[1].getDeliveredAt()).toBe(1500);
      expect(all[0].getDeliveredAt()).toBeFalsy();
      expect(ctx.messagesSignal()[0].getDeliveredAt()).toBeFalsy();
    });

    it('should walk back from the tail when the receipted id is not on screen, leaving newer messages alone', () => {
      const messages = [
        makeMessage(3, { senderUid: ME }),
        makeMessage(7, { senderUid: ME }),
      ];
      const ctx = makeReceiptCtx(messages);

      handleReceiptImpl(ctx, makeReceipt('5', { readAt: 1700 }), false);

      const all = ctx.allMessagesSignal();
      expect(all[0].getReadAt()).toBe(1700);
      expect(all[1].getReadAt()).toBeFalsy();
      expect(ctx.messagesSignal()[1].getReadAt()).toBeFalsy();
    });

    it('should skip a message with no sender and keep going', () => {
      const messages = [
        makeMessage(1, { senderUid: ME }),
        makeMessage(2),
      ];
      const ctx = makeReceiptCtx(messages);

      handleReceiptImpl(ctx, makeReceipt('2', { readAt: 1700 }), false);

      const all = ctx.allMessagesSignal();
      expect(all[1].getReadAt()).toBeFalsy();
      expect(all[0].getReadAt()).toBe(1700);
      expect(ctx.messagesSignal()[0].getReadAt()).toBe(1700);
    });

    it('should mark a still-unsent message read without indexing it under a zero id', () => {
      // An optimistic bubble has no server id yet, so it must not land in the id map.
      const messages = [makeMuidlessMessage(0, ME)];
      const ctx = makeReceiptCtx(messages);

      handleReceiptImpl(ctx, makeReceipt('7', { readAt: 1700 }), false);

      expect(ctx.allMessagesSignal()[0].getReadAt()).toBe(1700);
      expect(ctx.messageIdMap.size).toBe(0);
      expect(ctx.messageMuidMap.size).toBe(0);
      // The rendered list has no indexed clone to reuse, so it clones again.
      const rendered = ctx.messagesSignal()[0];
      expect(rendered.getReadAt()).toBe(1700);
      expect(rendered).not.toBe(messages[0]);
      expect(messages[0].getReadAt()).toBeFalsy();
    });

    it('should add the read stamp to an unsent message that was already delivered', () => {
      // No server id, so the rendered list cannot reuse an indexed clone and has
      // to re-apply the receipt itself without clobbering the delivery stamp.
      const messages = [makeMuidlessMessage(0, ME, { deliveredAt: 1600 })];
      const ctx = makeReceiptCtx(messages);

      handleReceiptImpl(ctx, makeReceipt('7', { readAt: 1700 }), false);

      const rendered = ctx.messagesSignal()[0];
      expect(rendered.getReadAt()).toBe(1700);
      expect(rendered.getDeliveredAt()).toBe(1600);
      expect(ctx.allMessagesSignal()[0].getReadAt()).toBe(1700);
      expect(ctx.allMessagesSignal()[0].getDeliveredAt()).toBe(1600);
      expect(messages[0].getReadAt()).toBeFalsy();
    });

    it('should mark a still-unsent message delivered without indexing it', () => {
      const messages = [makeMuidlessMessage(0, ME)];
      const ctx = makeReceiptCtx(messages);

      handleReceiptImpl(ctx, makeReceipt('7', { deliveredAt: 1650 }), false);

      expect(ctx.allMessagesSignal()[0].getDeliveredAt()).toBe(1650);
      expect(ctx.messageIdMap.size).toBe(0);
      const rendered = ctx.messagesSignal()[0];
      expect(rendered.getDeliveredAt()).toBe(1650);
      expect(rendered).not.toBe(messages[0]);
    });

    it('should leave both lists untouched for a receipt carrying no timestamps', () => {
      const messages = [makeMessage(5, { senderUid: ME })];
      const ctx = makeReceiptCtx(messages);
      const allBefore = ctx.allMessagesSignal();
      const renderedBefore = ctx.messagesSignal();

      handleReceiptImpl(ctx, makeReceipt('5'), false);

      expect(ctx.allMessagesSignal()).toBe(allBefore);
      expect(ctx.messagesSignal()).toBe(renderedBefore);
      expect(ctx.messageIdMap.size).toBe(0);
    });
  });

  describe('a failed page, wired through the real scroll handlers', () => {
    /** The list's scroll context, its service backed by the real fetch functions over `fetchCtx`. */
    function scrollCtx(fetchCtx: TestFetchContext) {
      return {
        listContainer: undefined,
        isFetchingPrevious: signal(false),
        hasMorePrevious: signal(true),
        isFetchingNext: signal(false),
        hasMoreNext: signal(true),
        messageListService: {
          fetchPreviousMessages: () => fetchPreviousMessagesImpl(fetchCtx),
          fetchNextMessages: () => fetchNextMessagesImpl(fetchCtx),
        },
      } as any;
    }

    it('scrolling up again after a failed page of older messages fetches it again', async () => {
      const request = makeRequest();
      request.fetchPrevious
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce([makeMessage(38), makeMessage(39)]);
      const loaded = [makeMessage(40), makeMessage(41)];
      const fetchCtx = makeFetchCtx({
        messagesRequest: request,
        allMessagesSignal: signal<CometChat.BaseMessage[]>(loaded),
        messagesSignal: signal<CometChat.BaseMessage[]>(loaded),
      });
      const ctx = scrollCtx(fetchCtx);

      await handleScrollToTopImpl(ctx);
      expect(ctx.hasMorePrevious()).toBe(true);
      expect(fetchCtx.errorStateSignal()).toBeNull();

      await handleScrollToTopImpl(ctx);
      expect(request.fetchPrevious).toHaveBeenCalledTimes(2);
      expect(ids(fetchCtx.allMessagesSignal())).toEqual([38, 39, 40, 41]);
    });

    it('scrolling down again after a failed page of newer messages fetches it again', async () => {
      const request = makeRequest();
      request.fetchNext.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([makeMessage(42)]);
      const loaded = [makeMessage(40), makeMessage(41)];
      const fetchCtx = makeFetchCtx({
        nextMessagesRequest: request,
        allMessagesSignal: signal<CometChat.BaseMessage[]>(loaded),
        messagesSignal: signal<CometChat.BaseMessage[]>(loaded),
      });
      const ctx = scrollCtx(fetchCtx);

      handleScrollToBottomImpl(ctx);
      await vi.waitFor(() => expect(ctx.isFetchingNext()).toBe(false));
      expect(ctx.hasMoreNext()).toBe(true);

      handleScrollToBottomImpl(ctx);
      await vi.waitFor(() => expect(request.fetchNext).toHaveBeenCalledTimes(2));
      await vi.waitFor(() => expect(ids(fetchCtx.allMessagesSignal())).toContain(42));
    });
  });
});
