/**
 * SearchConversationsService — coverage tests
 *
 * Covers: search, loadMore (pagination + de-duplication + re-entrancy guard),
 *         attachListeners / detachListeners / reset, and every real-time
 *         callback the service registers (message, user, group, call, typing,
 *         delivery/read receipts).
 *
 * The companion spec drives the service against the globally stubbed SDK
 * request builder, whose `fetchNext()` always resolves `[]`. Every result-
 * handling branch and every listener callback therefore never ran. Here the
 * request is replaced with a stub whose pages the test chooses, and each
 * listener callback is pulled off the object the service hands to
 * `CometChat.add*Listener` and invoked directly — so nothing can pass without
 * the service body actually executing.
 *
 * @module services/search-conversations.service
 */

// The Calls SDK reaches for JitsiMeetJS at import time; jsdom has no such global.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { SearchConversationsService } from './search-conversations.service';
import { CometChatSearchFilter, States } from '../Enums/Enums';
import { CometChatUIKitConstants } from '../constants';
import { CometChatMessageEvents } from '../events/CometChatMessageEvents';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_TYPE = CometChatUIKitConstants.MessageReceiverType.user;
const GROUP_TYPE = CometChatUIKitConstants.MessageReceiverType.group;

function makeUser(uid: string, name = `User ${uid}`): CometChat.User {
  const user = new CometChat.User(uid);
  user.setName(name);
  return user;
}

function makeGroup(guid: string): CometChat.Group {
  return new CometChat.Group(guid, `Group ${guid}`, CometChat.GROUP_TYPE.PUBLIC, '');
}

/**
 * A real SDK message, so `CometChatUIKitUtility.clone` keeps the prototype and
 * the receipt setters still exist on the cloned copy.
 */
function makeMessage(
  id: number,
  convId: string,
  senderUid?: string,
  text = `text-${id}`
): CometChat.BaseMessage {
  const message = new CometChat.TextMessage('receiver-1', text, CometChat.RECEIVER_TYPE.USER);
  message.setId(id);
  message.setConversationId(convId);
  if (senderUid) {
    message.setSender(makeUser(senderUid));
  }
  return message;
}

interface ConversationOpts {
  lastMessage?: CometChat.BaseMessage | null;
  /** `undefined` leaves the count unset, which is how the SDK reports "never counted". */
  unread?: number | undefined;
}

/**
 * A real `CometChat.Conversation`. Private fields are written directly rather
 * than through the constructor so the fixture does not depend on the SDK's
 * argument order, and so `unreadMessageCount` can genuinely be absent.
 */
function makeConversation(
  convId: string,
  convWith: CometChat.User | CometChat.Group,
  opts: ConversationOpts = {}
): CometChat.Conversation {
  const isGroup = convWith instanceof CometChat.Group;
  const conv = new CometChat.Conversation(
    convId,
    isGroup ? GROUP_TYPE : USER_TYPE,
    opts.lastMessage ?? null,
    convWith,
    0,
    [],
    0,
    ''
  );
  const raw = conv as unknown as Record<string, unknown>;
  raw['conversationId'] = convId;
  raw['conversationType'] = isGroup ? GROUP_TYPE : USER_TYPE;
  raw['conversationWith'] = convWith;
  raw['lastMessage'] = opts.lastMessage ?? undefined;
  raw['unreadMessageCount'] = 'unread' in opts ? opts.unread : 0;
  return conv;
}

function makeTypingIndicator(
  receiverId: string | undefined,
  receiverType: string,
  sender?: CometChat.User
): CometChat.TypingIndicator {
  const indicator = new CometChat.TypingIndicator(receiverId, receiverType);
  const raw = indicator as unknown as Record<string, unknown>;
  raw['receiverId'] = receiverId;
  raw['receiverType'] = receiverType;
  raw['sender'] = sender;
  return indicator;
}

interface ReceiptOpts {
  messageId?: string;
  receiverType?: string;
  readAt?: number;
  deliveredAt?: number;
  /** Drop `getMessageId` entirely — the SDK omits it on some receipt shapes. */
  withoutMessageId?: boolean;
}

function makeReceipt(opts: ReceiptOpts = {}): CometChat.MessageReceipt {
  const receipt: Record<string, unknown> = {
    getReceiverType: () => opts.receiverType ?? USER_TYPE,
    getReadAt: () => opts.readAt ?? 0,
    getDeliveredAt: () => opts.deliveredAt ?? 0,
  };
  if (!opts.withoutMessageId) {
    receipt['getMessageId'] = () => opts.messageId ?? '';
  }
  return receipt as unknown as CometChat.MessageReceipt;
}

/** A `ConversationsRequest` stand-in that serves the pages the test lists. */
interface StubRequest {
  fetchNext: Mock;
}

function makeStubRequest(pages: (CometChat.Conversation[] | Error)[]): StubRequest {
  let page = 0;
  return {
    fetchNext: vi.fn(async () => {
      const next = pages[page++];
      if (next instanceof Error) {
        throw next;
      }
      return next ?? [];
    }),
  };
}

interface StubBuilder {
  setLimit: Mock;
  setSearchKeyword: Mock;
  setUnread: Mock;
  setConversationType: Mock;
  build: Mock;
}

function makeStubBuilder(request: StubRequest): StubBuilder {
  const builder: Partial<StubBuilder> = {};
  builder.setLimit = vi.fn(() => builder);
  builder.setSearchKeyword = vi.fn(() => builder);
  builder.setUnread = vi.fn(() => builder);
  builder.setConversationType = vi.fn(() => builder);
  builder.build = vi.fn(() => request);
  return builder as StubBuilder;
}

/** The object the service handed to each `CometChat.add*Listener` call. */
interface Listeners {
  message: Record<string, (...args: unknown[]) => void>;
  typing: Record<string, (...args: unknown[]) => void>;
  user: Record<string, (...args: unknown[]) => void>;
  group: Record<string, (...args: unknown[]) => void>;
  call: Record<string, (...args: unknown[]) => void>;
  ids: {
    message: string;
    typing: string;
    user: string;
    group: string;
    call: string;
  };
}

describe('SearchConversationsService — coverage', () => {
  let service: SearchConversationsService;
  /** Restored in afterEach whenever a test swaps the default builder. */
  let realBuilderCtor: unknown = null;

  const addMessageListener = () => CometChat.addMessageListener as unknown as Mock;
  const addUserListener = () => CometChat.addUserListener as unknown as Mock;
  const addGroupListener = () => CometChat.addGroupListener as unknown as Mock;
  const addCallListener = () => CometChat.addCallListener as unknown as Mock;
  const removeMessageListener = () => CometChat.removeMessageListener as unknown as Mock;
  const removeUserListener = () => CometChat.removeUserListener as unknown as Mock;
  const removeGroupListener = () => CometChat.removeGroupListener as unknown as Mock;
  const removeCallListener = () => CometChat.removeCallListener as unknown as Mock;

  /** Replace the builder the service constructs when no custom one is supplied. */
  function installDefaultBuilder(request: StubRequest): StubBuilder {
    const builder = makeStubBuilder(request);
    const sdk = CometChat as unknown as Record<string, unknown>;
    realBuilderCtor = sdk['ConversationsRequestBuilder'];
    sdk['ConversationsRequestBuilder'] = function StubConversationsRequestBuilder() {
      return builder;
    };
    return builder;
  }

  /** Attach the real-time listeners and hand back the registered callbacks. */
  function attach(loggedInUser: CometChat.User | null): Listeners {
    service.attachListeners(loggedInUser as CometChat.User);
    const messageCalls = addMessageListener().mock.calls;
    return {
      message: messageCalls[0][1],
      typing: messageCalls[1][1],
      user: addUserListener().mock.calls[0][1],
      group: addGroupListener().mock.calls[0][1],
      call: addCallListener().mock.calls[0][1],
      ids: {
        message: messageCalls[0][0],
        typing: messageCalls[1][0],
        user: addUserListener().mock.calls[0][0],
        group: addGroupListener().mock.calls[0][0],
        call: addCallListener().mock.calls[0][0],
      },
    };
  }

  function ids(): string[] {
    return service.conversations().map(c => c.getConversationId());
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SearchConversationsService] });
    service = TestBed.inject(SearchConversationsService);

    // The listener statics are module-level mocks shared by every spec in this
    // file; stale calls would be read as this test's registrations.
    [
      addMessageListener(),
      addUserListener(),
      addGroupListener(),
      addCallListener(),
      removeMessageListener(),
      removeUserListener(),
      removeGroupListener(),
      removeCallListener(),
    ].forEach(m => m.mockClear());
  });

  afterEach(() => {
    // The receipt subscriptions live on static Subjects; leaving one attached
    // makes an earlier test's handler fire during a later one.
    service.reset();
    if (realBuilderCtor) {
      (CometChat as unknown as Record<string, unknown>)['ConversationsRequestBuilder'] =
        realBuilderCtor;
      realBuilderCtor = null;
    }
    TestBed.resetTestingModule();
  });

  // =========================================================================
  // search
  // =========================================================================

  describe('search', () => {
    it('should report loading and drop the previous results before the page arrives', async () => {
      let release: (value: CometChat.Conversation[]) => void = () => undefined;
      installDefaultBuilder({
        fetchNext: vi.fn(
          () => new Promise<CometChat.Conversation[]>(resolve => (release = resolve))
        ),
      });
      service.conversations.set([makeConversation('stale', makeUser('u9'))]);
      service.fetchState.set(States.error);
      service.hasMoreResults.set(true);

      const pending = service.search('hello', []);

      // The stale list must not stay on screen behind the spinner.
      expect(service.fetchState()).toBe(States.loading);
      expect(service.conversations()).toEqual([]);
      expect(service.hasMoreResults()).toBe(false);

      release([makeConversation('c1', makeUser('u1'))]);
      await pending;

      expect(service.fetchState()).toBe(States.loaded);
      expect(ids()).toEqual(['c1']);
    });

    it('should load results, mark loaded and flag more pages when the page is full', async () => {
      const page = [
        makeConversation('c1', makeUser('u1')),
        makeConversation('c2', makeUser('u2')),
        makeConversation('c3', makeUser('u3')),
      ];
      const builder = installDefaultBuilder(makeStubRequest([page]));

      await service.search('hello', []);

      expect(ids()).toEqual(['c1', 'c2', 'c3']);
      expect(service.fetchState()).toBe(States.loaded);
      // No filters means the preview limit of 3, and a full page means more exist.
      expect(builder.setLimit).toHaveBeenCalledWith(3);
      expect(service.hasMoreResults()).toBe(true);
      expect(builder.setSearchKeyword).toHaveBeenCalledWith('hello');
      expect(builder.setUnread).not.toHaveBeenCalled();
      expect(builder.setConversationType).not.toHaveBeenCalled();
    });

    it('should not flag more pages when the page comes back short of the limit', async () => {
      const page = [makeConversation('c1', makeUser('u1')), makeConversation('c2', makeUser('u2'))];
      installDefaultBuilder(makeStubRequest([page]));

      await service.search('hello', []);

      expect(ids()).toEqual(['c1', 'c2']);
      expect(service.fetchState()).toBe(States.loaded);
      expect(service.hasMoreResults()).toBe(false);
    });

    it('should apply the filter limit and both conversation filters, and skip the keyword when blank', async () => {
      const builder = installDefaultBuilder(
        makeStubRequest([[makeConversation('c1', makeGroup('g1'))]])
      );

      await service.search('   ', [CometChatSearchFilter.Unread, CometChatSearchFilter.Groups]);

      expect(builder.setLimit).toHaveBeenCalledWith(30);
      expect(builder.setSearchKeyword).not.toHaveBeenCalled();
      expect(builder.setUnread).toHaveBeenCalledWith(true);
      expect(builder.setConversationType).toHaveBeenCalledWith(GROUP_TYPE);
      expect(service.fetchState()).toBe(States.loaded);
      // One result against a limit of 30 — there is no further page.
      expect(service.hasMoreResults()).toBe(false);
    });

    it('should report empty when the SDK returns no conversations', async () => {
      installDefaultBuilder(makeStubRequest([[]]));
      service.hasMoreResults.set(true);

      await service.search('nothing', []);

      expect(service.conversations()).toEqual([]);
      expect(service.fetchState()).toBe(States.empty);
      expect(service.hasMoreResults()).toBe(false);
    });

    it('should set the error state and rethrow when fetchNext rejects', async () => {
      const failure = new Error('fetch failed');
      installDefaultBuilder(makeStubRequest([failure]));

      await expect(service.search('boom', [])).rejects.toBe(failure);

      expect(service.fetchState()).toBe(States.error);
      expect(service.conversations()).toEqual([]);
    });

    it('should clear previous results and report empty without touching the SDK for invalid criteria', async () => {
      const request = makeStubRequest([[makeConversation('c1', makeUser('u1'))]]);
      installDefaultBuilder(request);
      service.conversations.set([makeConversation('old', makeUser('u9'))]);
      service.hasMoreResults.set(true);

      await service.search('   ', []);

      expect(service.conversations()).toEqual([]);
      expect(service.hasMoreResults()).toBe(false);
      expect(service.fetchState()).toBe(States.empty);
      expect(request.fetchNext).not.toHaveBeenCalled();
    });

    it('should use a supplied builder instead of constructing the default one', async () => {
      const defaultRequest = makeStubRequest([[makeConversation('default', makeUser('u0'))]]);
      const defaultBuilder = installDefaultBuilder(defaultRequest);
      const customBuilder = makeStubBuilder(
        makeStubRequest([[makeConversation('custom', makeUser('u1'))]])
      );

      await service.search(
        'hello',
        [CometChatSearchFilter.Conversations],
        customBuilder as unknown as CometChat.ConversationsRequestBuilder
      );

      expect(ids()).toEqual(['custom']);
      expect(defaultBuilder.build).not.toHaveBeenCalled();
      expect(defaultRequest.fetchNext).not.toHaveBeenCalled();
      expect(customBuilder.setLimit).toHaveBeenCalledWith(30);
    });
  });

  // =========================================================================
  // loadMore
  // =========================================================================

  describe('loadMore', () => {
    it('should do nothing once reset has dropped the request', async () => {
      const request = makeStubRequest([[makeConversation('c1', makeUser('u1'))]]);
      installDefaultBuilder(request);
      await service.search('hello', []);
      expect(request.fetchNext).toHaveBeenCalledTimes(1);

      service.reset();
      await service.loadMore();

      expect(request.fetchNext).toHaveBeenCalledTimes(1);
      expect(service.conversations()).toEqual([]);
    });

    it('should ignore a second call while the first page is still in flight', async () => {
      let release: (value: CometChat.Conversation[]) => void = () => undefined;
      const request: StubRequest = {
        fetchNext: vi.fn(
          () => new Promise<CometChat.Conversation[]>(resolve => (release = resolve))
        ),
      };
      (service as any).searchRequest = request;

      const first = service.loadMore();
      await service.loadMore();

      expect(request.fetchNext).toHaveBeenCalledTimes(1);

      release([makeConversation('c1', makeUser('u1'))]);
      await first;

      expect(ids()).toEqual(['c1']);
    });

    it('should append only conversations it does not already hold', async () => {
      const existing = [
        makeConversation('c1', makeUser('u1')),
        makeConversation('c2', makeUser('u2')),
      ];
      service.conversations.set(existing);
      (service as any).searchRequest = makeStubRequest([
        [makeConversation('c2', makeUser('u2')), makeConversation('c3', makeUser('u3'))],
      ]);

      await service.loadMore();

      expect(ids()).toEqual(['c1', 'c2', 'c3']);
      expect(service.hasMoreResults()).toBe(false);
    });

    it('should flag another page when a full page of 30 arrives', async () => {
      const page = Array.from({ length: 30 }, (_, i) =>
        makeConversation(`c${i}`, makeUser(`u${i}`))
      );
      (service as any).searchRequest = makeStubRequest([page]);

      await service.loadMore();

      expect(service.conversations()).toHaveLength(30);
      expect(service.hasMoreResults()).toBe(true);
    });

    it('should clear the more-pages flag and keep the list when an empty page arrives', async () => {
      service.conversations.set([makeConversation('c1', makeUser('u1'))]);
      service.hasMoreResults.set(true);
      (service as any).searchRequest = makeStubRequest([[]]);

      await service.loadMore();

      expect(service.hasMoreResults()).toBe(false);
      expect(ids()).toEqual(['c1']);
    });

    it('should release the in-flight guard when fetchNext rejects', async () => {
      const failure = new Error('page failed');
      const request = makeStubRequest([failure, [makeConversation('c2', makeUser('u2'))]]);
      service.conversations.set([makeConversation('c1', makeUser('u1'))]);
      (service as any).searchRequest = request;

      await expect(service.loadMore()).rejects.toBe(failure);
      // A stuck guard would make this second call a no-op.
      await service.loadMore();

      expect(ids()).toEqual(['c1', 'c2']);
      expect(request.fetchNext).toHaveBeenCalledTimes(2);
    });
  });

  // =========================================================================
  // Listener registration and teardown
  // =========================================================================

  describe('attachListeners / detachListeners', () => {
    it('should remove every registered listener and stop honouring receipts', () => {
      const lastMessage = makeMessage(7, 'c1', 'u1');
      const listeners = attach(makeUser('me'));
      service.conversations.set([
        makeConversation('c1', makeUser('u1'), { lastMessage, unread: 4 }),
      ]);

      // The message and typing listeners share one SDK registration channel, so
      // a collision between their two ids would leave one of them attached.
      expect(addMessageListener()).toHaveBeenCalledTimes(2);
      expect(listeners.ids.typing).not.toBe(listeners.ids.message);
      expect(addUserListener()).toHaveBeenCalledTimes(1);
      expect(addGroupListener()).toHaveBeenCalledTimes(1);
      expect(addCallListener()).toHaveBeenCalledTimes(1);

      service.detachListeners();

      expect(removeMessageListener().mock.calls.map(c => c[0])).toEqual([
        listeners.ids.message,
        listeners.ids.typing,
      ]);
      expect(removeUserListener()).toHaveBeenCalledWith(listeners.ids.user);
      expect(removeGroupListener()).toHaveBeenCalledWith(listeners.ids.group);
      expect(removeCallListener()).toHaveBeenCalledWith(listeners.ids.call);

      CometChatMessageEvents.onMessagesRead.next(makeReceipt({ messageId: '7', readAt: 999 }));

      expect(service.conversations()[0].getUnreadMessageCount()).toBe(4);
    });

    it('should remove nothing when no listener was ever attached', () => {
      service.detachListeners();

      expect(removeMessageListener()).not.toHaveBeenCalled();
      expect(removeUserListener()).not.toHaveBeenCalled();
      expect(removeGroupListener()).not.toHaveBeenCalled();
      expect(removeCallListener()).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should detach listeners, clear every signal and forget the logged-in user', () => {
      const listeners = attach(makeUser('me'));
      service.conversations.set([makeConversation('c1', makeUser('u1'))]);
      service.fetchState.set(States.error);
      service.hasMoreResults.set(true);
      service.typingIndicatorMap.set(
        new Map([['u1', makeTypingIndicator('me', USER_TYPE, makeUser('u1'))]])
      );

      service.reset();

      expect(removeUserListener()).toHaveBeenCalledWith(listeners.ids.user);
      expect(service.conversations()).toEqual([]);
      expect(service.fetchState()).toBe(States.loaded);
      expect(service.hasMoreResults()).toBe(false);
      expect(service.typingIndicatorMap().size).toBe(0);
      expect((service as any).loggedInUser).toBeNull();
      expect((service as any).searchRequest).toBeNull();
    });
  });

  // =========================================================================
  // Message listener
  // =========================================================================

  describe('message listener', () => {
    it('should move the conversation to the top, store the message and bump the unread count', () => {
      const listeners = attach(makeUser('me'));
      service.conversations.set([
        makeConversation('c1', makeUser('u1'), { unread: 0 }),
        makeConversation('c2', makeUser('u2'), { unread: 2 }),
      ]);

      listeners.message['onTextMessageReceived'](makeMessage(10, 'c2', 'u2', 'ping'));

      expect(ids()).toEqual(['c2', 'c1']);
      const moved = service.conversations()[0];
      expect(moved.getLastMessage().getId()).toBe(10);
      expect(moved.getUnreadMessageCount()).toBe(3);
    });

    it('should treat media and custom messages the same way as text messages', () => {
      const listeners = attach(makeUser('me'));
      service.conversations.set([makeConversation('c1', makeUser('u1'), { unread: 0 })]);

      listeners.message['onMediaMessageReceived'](makeMessage(11, 'c1', 'u1'));
      expect(service.conversations()[0].getLastMessage().getId()).toBe(11);
      expect(service.conversations()[0].getUnreadMessageCount()).toBe(1);

      listeners.message['onCustomMessageReceived'](makeMessage(12, 'c1', 'u1'));
      expect(service.conversations()[0].getLastMessage().getId()).toBe(12);
      expect(service.conversations()[0].getUnreadMessageCount()).toBe(2);
    });

    it('should leave the list untouched for a conversation it is not showing', () => {
      const listeners = attach(makeUser('me'));
      const original = [makeConversation('c1', makeUser('u1'), { unread: 0 })];
      service.conversations.set(original);

      listeners.message['onTextMessageReceived'](makeMessage(13, 'unknown-conv', 'u1'));

      // The handler returns the same array, so the signal never changes value.
      expect(service.conversations()).toBe(original);
    });

    it('should not bump the unread count for a message the logged-in user sent', () => {
      const listeners = attach(makeUser('me'));
      service.conversations.set([makeConversation('c1', makeUser('u1'), { unread: 5 })]);

      listeners.message['onTextMessageReceived'](makeMessage(14, 'c1', 'me'));

      expect(service.conversations()[0].getUnreadMessageCount()).toBe(5);
      expect(service.conversations()[0].getLastMessage().getId()).toBe(14);
    });

    it('should start the unread count at one when the conversation has never had a count', () => {
      const listeners = attach(makeUser('me'));
      service.conversations.set([makeConversation('c1', makeUser('u1'), { unread: undefined })]);
      expect(service.conversations()[0].getUnreadMessageCount()).toBeUndefined();

      listeners.message['onTextMessageReceived'](makeMessage(15, 'c1', 'u1'));

      expect(service.conversations()[0].getUnreadMessageCount()).toBe(1);
    });

    it('should bump the unread count for a senderless message while a user is logged in', () => {
      const listeners = attach(makeUser('me'));
      service.conversations.set([makeConversation('c1', makeUser('u1'), { unread: 1 })]);

      listeners.message['onTextMessageReceived'](makeMessage(16, 'c1'));

      expect(service.conversations()[0].getUnreadMessageCount()).toBe(2);
    });

    it('should not bump the unread count when neither the message nor the service knows a user', () => {
      const listeners = attach(null);
      service.conversations.set([makeConversation('c1', makeUser('u1'), { unread: 1 })]);

      listeners.message['onTextMessageReceived'](makeMessage(17, 'c1'));

      // Both sides resolve to undefined, so the sender reads as the logged-in user.
      expect(service.conversations()[0].getUnreadMessageCount()).toBe(1);
      expect(service.conversations()[0].getLastMessage().getId()).toBe(17);
    });

    it('should replace the last message in place when an edit arrives for it', () => {
      const listeners = attach(makeUser('me'));
      service.conversations.set([
        makeConversation('c1', makeUser('u1'), {
          lastMessage: makeMessage(20, 'c1', 'u1', 'before'),
        }),
        makeConversation('c2', makeUser('u2'), {
          lastMessage: makeMessage(21, 'c2', 'u2', 'other'),
        }),
      ]);

      listeners.message['onMessageEdited'](makeMessage(20, 'c1', 'u1', 'after'));

      expect(ids()).toEqual(['c1', 'c2']);
      expect((service.conversations()[0].getLastMessage() as CometChat.TextMessage).getText()).toBe(
        'after'
      );
      expect((service.conversations()[1].getLastMessage() as CometChat.TextMessage).getText()).toBe(
        'other'
      );
    });

    it('should leave conversations alone when an update targets another message or none at all', () => {
      const listeners = attach(makeUser('me'));
      const withoutLast = makeConversation('c1', makeUser('u1'), { lastMessage: null });
      const otherLast = makeConversation('c2', makeUser('u2'), {
        lastMessage: makeMessage(31, 'c2', 'u2', 'kept'),
      });
      service.conversations.set([withoutLast, otherLast]);

      listeners.message['onMessageEdited'](makeMessage(99, 'c1', 'u1', 'gone'));

      expect(service.conversations()[0]).toBe(withoutLast);
      expect(service.conversations()[1]).toBe(otherLast);
      expect((service.conversations()[1].getLastMessage() as CometChat.TextMessage).getText()).toBe(
        'kept'
      );
    });

    // Deletes run through the same updater as edits, but via a separate SDK
    // callback; without a positive assertion here a no-op wiring would pass.
    it('should swap in the deleted message when it is the conversation last message', () => {
      const listeners = attach(makeUser('me'));
      service.conversations.set([
        makeConversation('c1', makeUser('u1'), {
          lastMessage: makeMessage(40, 'c1', 'u1', 'live'),
        }),
      ]);

      listeners.message['onMessageDeleted'](makeMessage(40, 'c1', 'u1', 'deleted'));

      expect((service.conversations()[0].getLastMessage() as CometChat.TextMessage).getText()).toBe(
        'deleted'
      );
    });
  });

  // =========================================================================
  // User listener
  // =========================================================================

  describe('user listener', () => {
    it('should refresh the matching one-to-one conversation when a user comes online', () => {
      const listeners = attach(makeUser('me'));
      const groupConv = makeConversation('g1', makeGroup('g1'));
      const otherConv = makeConversation('c2', makeUser('u2'));
      service.conversations.set([
        makeConversation('c1', makeUser('u1', 'Old Name')),
        groupConv,
        otherConv,
      ]);

      listeners.user['onUserOnline'](makeUser('u1', 'New Name'));

      expect((service.conversations()[0].getConversationWith() as CometChat.User).getName()).toBe(
        'New Name'
      );
      // Group conversations and other users are not instanceof-matched or uid-matched.
      expect(service.conversations()[1]).toBe(groupConv);
      expect(service.conversations()[2]).toBe(otherConv);
    });

    it('should refresh the matching conversation when a user goes offline', () => {
      const listeners = attach(makeUser('me'));
      service.conversations.set([makeConversation('c1', makeUser('u1', 'Online Name'))]);

      listeners.user['onUserOffline'](makeUser('u1', 'Offline Name'));

      expect((service.conversations()[0].getConversationWith() as CometChat.User).getName()).toBe(
        'Offline Name'
      );
    });
  });

  // =========================================================================
  // Group listener
  // =========================================================================

  describe('group listener', () => {
    it('should fold joins, additions and scope changes into the conversation as a new last message', () => {
      const listeners = attach(makeUser('me'));
      service.conversations.set([makeConversation('g1', makeGroup('g1'), { unread: 0 })]);

      listeners.group['onGroupMemberJoined'](makeMessage(50, 'g1', 'u1'));
      expect(service.conversations()[0].getLastMessage().getId()).toBe(50);

      // The SDK's GroupListener re-keys the `onMemberAddedToGroup` callback as
      // `onGroupMemberAddedToGroup` on the instance it builds.
      listeners.group['onGroupMemberAddedToGroup'](makeMessage(51, 'g1', 'u1'));
      expect(service.conversations()[0].getLastMessage().getId()).toBe(51);

      listeners.group['onGroupMemberScopeChanged'](makeMessage(52, 'g1', 'u1'));
      expect(service.conversations()[0].getLastMessage().getId()).toBe(52);
      expect(service.conversations()[0].getUnreadMessageCount()).toBe(3);
    });

    it('should drop the conversation and report empty when the logged-in user leaves the last group', () => {
      const listeners = attach(makeUser('me'));
      service.conversations.set([makeConversation('g1', makeGroup('g1'))]);
      service.fetchState.set(States.loaded);

      listeners.group['onGroupMemberLeft'](makeMessage(60, 'g1', 'me'), makeUser('me'));

      expect(service.conversations()).toEqual([]);
      expect(service.fetchState()).toBe(States.empty);
    });

    it('should drop only the left group and keep the state loaded when others remain', () => {
      const listeners = attach(makeUser('me'));
      service.conversations.set([
        makeConversation('g1', makeGroup('g1')),
        makeConversation('g2', makeGroup('g2')),
      ]);
      service.fetchState.set(States.loaded);

      listeners.group['onGroupMemberLeft'](makeMessage(61, 'g1', 'me'), makeUser('me'));

      expect(ids()).toEqual(['g2']);
      expect(service.fetchState()).toBe(States.loaded);
    });

    it('should keep the conversation and record the action when somebody else leaves', () => {
      const listeners = attach(makeUser('me'));
      service.conversations.set([makeConversation('g1', makeGroup('g1'), { unread: 0 })]);

      listeners.group['onGroupMemberLeft'](makeMessage(62, 'g1', 'u1'), makeUser('u1'));

      expect(ids()).toEqual(['g1']);
      expect(service.conversations()[0].getLastMessage().getId()).toBe(62);
    });

    it('should drop the conversation when the logged-in user is kicked, and keep it for anyone else', () => {
      const listeners = attach(makeUser('me'));
      service.conversations.set([
        makeConversation('g1', makeGroup('g1')),
        makeConversation('g2', makeGroup('g2'), { unread: 0 }),
      ]);

      listeners.group['onGroupMemberKicked'](makeMessage(70, 'g2', 'admin'), null, makeUser('u1'));
      expect(ids()).toEqual(['g2', 'g1']);
      expect(service.conversations()[0].getLastMessage().getId()).toBe(70);

      listeners.group['onGroupMemberKicked'](makeMessage(71, 'g1', 'admin'), null, makeUser('me'));
      expect(ids()).toEqual(['g2']);
    });

    it('should drop the conversation when the logged-in user is banned, and keep it for anyone else', () => {
      const listeners = attach(makeUser('me'));
      service.conversations.set([
        makeConversation('g1', makeGroup('g1')),
        makeConversation('g2', makeGroup('g2'), { unread: 0 }),
      ]);

      listeners.group['onGroupMemberBanned'](makeMessage(80, 'g2', 'admin'), makeUser('u1'));
      expect(ids()).toEqual(['g2', 'g1']);
      expect(service.conversations()[0].getLastMessage().getId()).toBe(80);

      listeners.group['onGroupMemberBanned'](makeMessage(81, 'g1', 'admin'), makeUser('me'));
      expect(ids()).toEqual(['g2']);
    });

    it('should keep every group conversation when no user is logged in', () => {
      const listeners = attach(null);
      service.conversations.set([makeConversation('g1', makeGroup('g1'), { unread: 0 })]);

      listeners.group['onGroupMemberLeft'](makeMessage(90, 'g1', 'u1'), makeUser('u1'));
      expect(ids()).toEqual(['g1']);
      expect(service.conversations()[0].getLastMessage().getId()).toBe(90);

      listeners.group['onGroupMemberKicked'](makeMessage(91, 'g1', 'admin'), null, makeUser('u1'));
      expect(ids()).toEqual(['g1']);
      expect(service.conversations()[0].getLastMessage().getId()).toBe(91);

      listeners.group['onGroupMemberBanned'](makeMessage(92, 'g1', 'admin'), makeUser('u1'));
      expect(ids()).toEqual(['g1']);
      expect(service.conversations()[0].getLastMessage().getId()).toBe(92);
    });
  });

  // =========================================================================
  // Call listener
  // =========================================================================

  describe('call listener', () => {
    it('should record every call event as the conversation last message', () => {
      const listeners = attach(makeUser('me'));
      service.conversations.set([makeConversation('c1', makeUser('u1'), { unread: 0 })]);

      const events = [
        'onIncomingCallReceived',
        'onOutgoingCallAccepted',
        'onOutgoingCallRejected',
        'onIncomingCallCancelled',
      ];
      events.forEach((event, index) => {
        listeners.call[event](makeMessage(100 + index, 'c1', 'u1'));
        expect(service.conversations()[0].getLastMessage().getId()).toBe(100 + index);
      });

      expect(service.conversations()[0].getUnreadMessageCount()).toBe(events.length);
    });
  });

  // =========================================================================
  // Typing listener
  // =========================================================================

  describe('typing listener', () => {
    it('should key a one-to-one indicator by the sender uid', () => {
      const listeners = attach(makeUser('me'));
      const indicator = makeTypingIndicator('me', USER_TYPE, makeUser('u1'));

      listeners.typing['onTypingStarted'](indicator);

      expect(service.typingIndicatorMap().get('u1')).toBe(indicator);
      expect(service.typingIndicatorMap().size).toBe(1);
    });

    it('should key a group indicator by the receiver id', () => {
      const listeners = attach(makeUser('me'));
      const indicator = makeTypingIndicator('g1', GROUP_TYPE, makeUser('u1'));

      listeners.typing['onTypingStarted'](indicator);

      expect(service.typingIndicatorMap().get('g1')).toBe(indicator);
      expect(service.typingIndicatorMap().has('u1')).toBe(false);
    });

    it('should ignore an indicator with no resolvable key', () => {
      const listeners = attach(makeUser('me'));
      const before = service.typingIndicatorMap();

      // One-to-one with no sender at all.
      listeners.typing['onTypingStarted'](makeTypingIndicator('me', USER_TYPE, undefined));
      // Group with no receiver id.
      listeners.typing['onTypingStarted'](
        makeTypingIndicator(undefined, GROUP_TYPE, makeUser('u1'))
      );

      expect(service.typingIndicatorMap()).toBe(before);
      expect(service.typingIndicatorMap().size).toBe(0);
    });

    it('should drop the entry when typing ends', () => {
      const listeners = attach(makeUser('me'));
      const indicator = makeTypingIndicator('me', USER_TYPE, makeUser('u1'));
      listeners.typing['onTypingStarted'](indicator);
      expect(service.typingIndicatorMap().size).toBe(1);

      listeners.typing['onTypingEnded'](indicator);

      expect(service.typingIndicatorMap().has('u1')).toBe(false);
      expect(service.typingIndicatorMap().size).toBe(0);
    });

    it('should leave the map untouched when typing ends for an entry it never held', () => {
      const listeners = attach(makeUser('me'));
      const tracked = makeTypingIndicator('me', USER_TYPE, makeUser('u1'));
      listeners.typing['onTypingStarted'](tracked);
      const before = service.typingIndicatorMap();

      listeners.typing['onTypingEnded'](makeTypingIndicator('me', USER_TYPE, makeUser('u2')));

      expect(service.typingIndicatorMap()).toBe(before);
      expect(service.typingIndicatorMap().get('u1')).toBe(tracked);
    });

    it('should leave the map untouched when a typing-ended indicator has no resolvable key', () => {
      const listeners = attach(makeUser('me'));
      const tracked = makeTypingIndicator('me', USER_TYPE, makeUser('u1'));
      listeners.typing['onTypingStarted'](tracked);
      const before = service.typingIndicatorMap();

      listeners.typing['onTypingEnded'](makeTypingIndicator(undefined, GROUP_TYPE, undefined));

      expect(service.typingIndicatorMap()).toBe(before);
      expect(service.typingIndicatorMap().get('u1')).toBe(tracked);
    });
  });

  // =========================================================================
  // Receipt subscriptions
  // =========================================================================

  describe('receipt subscriptions', () => {
    it('should stamp deliveredAt on the matching conversation last message', () => {
      attach(makeUser('me'));
      service.conversations.set([
        makeConversation('c1', makeUser('u1'), {
          lastMessage: makeMessage(200, 'c1', 'u1'),
          unread: 3,
        }),
      ]);

      CometChatMessageEvents.onMessagesDelivered.next(
        makeReceipt({ messageId: '200', deliveredAt: 1234 })
      );

      const conv = service.conversations()[0];
      expect(conv.getLastMessage().getDeliveredAt()).toBe(1234);
      expect(conv.getLastMessage().getReadAt()).toBeFalsy();
      expect(conv.getUnreadMessageCount()).toBe(3);
    });

    it('should stamp readAt and clear the unread count on a read receipt', () => {
      attach(makeUser('me'));
      service.conversations.set([
        makeConversation('c1', makeUser('u1'), {
          lastMessage: makeMessage(201, 'c1', 'u1'),
          unread: 7,
        }),
      ]);

      CometChatMessageEvents.onMessagesRead.next(makeReceipt({ messageId: '201', readAt: 5678 }));

      const conv = service.conversations()[0];
      expect(conv.getLastMessage().getReadAt()).toBe(5678);
      expect(conv.getUnreadMessageCount()).toBe(0);
    });

    it('should ignore group receipts on both subjects', () => {
      attach(makeUser('me'));
      const original = [
        makeConversation('c1', makeUser('u1'), {
          lastMessage: makeMessage(202, 'c1', 'u1'),
          unread: 2,
        }),
      ];
      service.conversations.set(original);

      CometChatMessageEvents.onMessagesDelivered.next(
        makeReceipt({ messageId: '202', receiverType: GROUP_TYPE, deliveredAt: 11 })
      );
      CometChatMessageEvents.onMessagesRead.next(
        makeReceipt({ messageId: '202', receiverType: GROUP_TYPE, readAt: 22 })
      );

      expect(service.conversations()).toBe(original);
      expect(original[0].getUnreadMessageCount()).toBe(2);
    });

    it('should match nothing when the receipt carries no message id accessor', () => {
      attach(makeUser('me'));
      service.conversations.set([
        makeConversation('c1', makeUser('u1'), {
          lastMessage: makeMessage(203, 'c1', 'u1'),
          unread: 2,
        }),
      ]);

      CometChatMessageEvents.onMessagesRead.next(
        makeReceipt({ withoutMessageId: true, readAt: 33 })
      );

      const conv = service.conversations()[0];
      expect(conv.getLastMessage().getReadAt()).toBeFalsy();
      expect(conv.getUnreadMessageCount()).toBe(2);
    });

    it('should skip conversations with no last message, a different id, or a group partner', () => {
      attach(makeUser('me'));
      const noLastMessage = makeConversation('c1', makeUser('u1'), {
        lastMessage: null,
        unread: 1,
      });
      const differentId = makeConversation('c2', makeUser('u2'), {
        lastMessage: makeMessage(300, 'c2', 'u2'),
        unread: 1,
      });
      const groupConv = makeConversation('g1', makeGroup('g1'), {
        lastMessage: makeMessage(204, 'g1', 'u3'),
        unread: 1,
      });
      service.conversations.set([noLastMessage, differentId, groupConv]);

      CometChatMessageEvents.onMessagesRead.next(makeReceipt({ messageId: '204', readAt: 44 }));

      // Only the group conversation shares the receipt id, and it is filtered
      // out by the user-conversation check, so nothing is replaced.
      expect(service.conversations()[0]).toBe(noLastMessage);
      expect(service.conversations()[1]).toBe(differentId);
      expect(service.conversations()[2]).toBe(groupConv);
      expect(groupConv.getLastMessage().getReadAt()).toBeFalsy();
      expect(groupConv.getUnreadMessageCount()).toBe(1);
    });
  });
});
