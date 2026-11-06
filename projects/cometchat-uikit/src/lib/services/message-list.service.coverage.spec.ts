/**
 * MessageListService coverage tests
 *
 * The existing spec drives this service against a live-looking SDK session, so
 * most of its body never ran. Here the data layer is replaced instead: every
 * sibling `*Impl` module is auto-mocked, which leaves the service's own
 * logic — conversation switching, listener teardown, retry/backoff, the
 * realtime message and reaction handlers — as the only thing under test, and
 * makes each guard reachable from a test.
 *
 * Covers: cleanup/teardown, setUser/setGroup validation, the request-rebuilding
 *         setters, custom type/category bookkeeping, handleErrorWithRetry,
 *         handleNewMessage, applyIncomingReplySubscription, the edit/delete
 *         handlers, handleReactionEvent, and the delegation surface.
 *
 * @module services/message-list
 */

// The UI Kit entry point pulls in the Calls SDK, which needs JitsiMeetJS at
// import time; jsdom has no such global.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

// Auto-mock every module the service delegates to. The service is a thin
// facade over these, so mocking them is what makes its own branches — and only
// its own branches — observable.
vi.mock('./message-list.listeners');
vi.mock('./message-list.fetch-utils');
vi.mock('./message-list.message-ops');
vi.mock('./message-list.reaction-ops');
vi.mock('./message-list.read-ops');
vi.mock('./message-list.typing-utils');
vi.mock('./message-list.translation-utils');
vi.mock('./message-list.sent-handler');
vi.mock('./message-list.request-builder');
vi.mock('./message-list.conversation-utils');

import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { MessageListService } from './message-list.service';
import { ThreadSubscriptionService } from './thread-subscription.service';
import { CometChatUIKit } from '../cometchat-uikit';
import { CometChatUIKitConstants } from '../constants';
import { CometChatLogger } from '../utils/CometChatLogger';
import { CometChatLocalize } from '../resources/CometChatLocalize/cometchat-localize';
import { CometChatMessageEvents, IMessages } from '../events/CometChatMessageEvents';

import {
  setupMessageListener,
  setupGroupListener,
  setupCallListener,
  setupConnectionListener,
} from './message-list.listeners';
import {
  fetchPreviousMessagesImpl,
  fetchNextMessagesImpl,
  fetchMessagesAroundIdImpl,
  handleReceiptImpl,
} from './message-list.fetch-utils';
import {
  addMessageImpl,
  updateMessageByIdImpl,
  updateMessageByMuidImpl,
  deleteMessageImpl,
  editMessageImpl,
  removeMessageImpl,
  getMessageByIdImpl,
  updateReplyCountImpl,
  updateMessageReactionsImpl,
  deduplicateMessagesImpl,
  clearMessagesImpl,
} from './message-list.message-ops';
import { addReactionImpl, removeReactionImpl, fetchReactionsImpl } from './message-list.reaction-ops';
import {
  markAsReadImpl,
  updateLocalReadStatusImpl,
  markInitialMessagesAsReadImpl,
  markConversationAsReadImpl,
  markAsDeliveredImpl,
  markAsUnreadImpl,
  getMessagesInRangeImpl,
  getTotalMessageCountImpl,
} from './message-list.read-ops';
import {
  handleTypingStartedImpl,
  handleTypingEndedImpl,
  clearTypingIndicatorImpl,
  isTypingIndicatorForCurrentConversationImpl,
} from './message-list.typing-utils';
import {
  translateMessageImpl,
  getCachedTranslationImpl,
  clearTranslationCacheImpl,
  flagMessageImpl,
} from './message-list.translation-utils';
import {
  setupSentMessageListenerImpl,
  setupEditedMessageListenerImpl,
  handleSentMessageImpl,
  updateSentMessageByMuidImpl,
  updateSentMessageReplyCountImpl,
  handleEditedMessageImpl,
} from './message-list.sent-handler';
import {
  buildMessagesRequestImpl,
  buildNextMessagesRequestImpl,
  getDefaultMessageTypesImpl,
  getDefaultMessageCategoriesImpl,
} from './message-list.request-builder';
import {
  isMessageForCurrentConversationImpl,
  isThreadReplyForCurrentConversationImpl,
  handleGroupActionImpl,
  handleCallActionImpl,
  handleReconnectionImpl,
} from './message-list.conversation-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * A message stub carrying only the accessors the service itself reads. The
 * handlers under test never touch the SDK prototype — everything that would
 * (adding, updating, scoping) lives in the mocked modules.
 */
function makeMessage(id: number, parentMessageId = 0): CometChat.BaseMessage {
  return {
    getId: () => id,
    getParentMessageId: () => parentMessageId,
  } as unknown as CometChat.BaseMessage;
}

/** A reaction stub for handleReactionEvent, which only reads these three. */
function makeReaction(opts: {
  messageId?: string | number | null;
  emoji?: string | null;
  reactedBy?: CometChat.User | null;
}): unknown {
  return {
    getMessageId: () => opts.messageId,
    getReaction: () => opts.emoji,
    getReactedBy: () => opts.reactedBy,
  };
}

function makeReactionEvent(reaction: unknown): CometChat.ReactionEvent {
  return { getReaction: () => reaction } as unknown as CometChat.ReactionEvent;
}

/** A loaded message whose reaction list the handler reads and replaces. */
function makeReactedMessage(reactions?: CometChat.ReactionCount[]): CometChat.BaseMessage {
  return { getReactions: () => reactions } as unknown as CometChat.BaseMessage;
}

function reactionSummary(reactions: CometChat.ReactionCount[]): Array<[string, number]> {
  return reactions.map(r => [r.getReaction(), r.getCount()]);
}

describe('MessageListService (coverage)', () => {
  let service: MessageListService;
  let threadSubscription: { applyIncomingReply: ReturnType<typeof vi.fn> };
  let loggedInUser: MockInstance<typeof CometChatUIKit.getLoggedInUser>;
  let loggerError: MockInstance<typeof CometChatLogger.error>;
  let loggerWarn: MockInstance<typeof CometChatLogger.warn>;

  /** Distinct objects so an assertion can tell the two requests apart. */
  const prevRequest = { id: 'previous' } as unknown as CometChat.MessagesRequest;
  const nextRequest = { id: 'next' } as unknown as CometChat.MessagesRequest;

  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(buildMessagesRequestImpl).mockReturnValue(prevRequest);
    vi.mocked(buildNextMessagesRequestImpl).mockReturnValue(nextRequest);

    loggedInUser = vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(null);
    loggerError = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
    loggerWarn = vi.spyOn(CometChatLogger, 'warn').mockImplementation(() => undefined);

    threadSubscription = { applyIncomingReply: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        MessageListService,
        { provide: ThreadSubscriptionService, useValue: threadSubscription },
      ],
    });
    service = TestBed.inject(MessageListService);
  });

  afterEach(() => {
    // The static event subjects and the SDK listener mocks are shared, so the
    // service has to be torn down before the next test subscribes again.
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  // ==================== Construction ====================

  describe('construction', () => {
    it('installs the sent, edited and socket message listeners once', () => {
      expect(setupSentMessageListenerImpl).toHaveBeenCalledTimes(1);
      expect(setupSentMessageListenerImpl).toHaveBeenCalledWith(service);
      expect(setupEditedMessageListenerImpl).toHaveBeenCalledTimes(1);
      expect(setupEditedMessageListenerImpl).toHaveBeenCalledWith(service);
      // The socket listener needs the zone so receipts re-enter change detection.
      expect(setupMessageListener).toHaveBeenCalledWith(service, TestBed.inject(NgZone));
    });

    it('starts with empty state and a zero fetch generation', () => {
      expect(service.messages()).toEqual([]);
      expect(service.allMessages()).toEqual([]);
      expect(service.loadingState()).toBe(false);
      expect(service.errorState()).toBeNull();
      expect(service.prevMessageId()).toBe(0);
      expect(service.nextMessageId()).toBe(0);
      expect(service.unreadCount()).toBe(0);
      expect(service.connectionStatus()).toBe('connected');
      expect(service.typingUsers().size).toBe(0);
      expect(service.getFetchGeneration()).toBe(0);
    });
  });

  // ==================== Cleanup / teardown ====================

  describe('cleanup', () => {
    it('removes all four SDK listeners under the ids it exposes', () => {
      const ids = [
        service.getMessageListenerId(),
        service.getGroupListenerId(),
        service.getCallListenerId(),
        service.getConnectionListenerId(),
      ];

      service.cleanup();

      expect(CometChat.removeMessageListener).toHaveBeenCalledWith(ids[0]);
      expect(CometChat.removeGroupListener).toHaveBeenCalledWith(ids[1]);
      expect(CometChat.removeCallListener).toHaveBeenCalledWith(ids[2]);
      expect(CometChat.removeConnectionListener).toHaveBeenCalledWith(ids[3]);
    });

    it('regenerates all four listener ids so a later teardown cannot remove the new listeners', () => {
      const before = service.getMessageListenerId();
      // Date.now() is the only input to the new ids; pinning it keeps the
      // assertion exact even when two cleanups land in the same millisecond.
      vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);

      service.cleanup();

      expect(service.getMessageListenerId()).toBe('message_list_1700000000000');
      expect(service.getGroupListenerId()).toBe('message_list_group_1700000000000');
      expect(service.getCallListenerId()).toBe('message_list_call_1700000000000');
      expect(service.getConnectionListenerId()).toBe('message_list_connection_1700000000000');
      expect(service.getMessageListenerId()).not.toBe(before);
    });

    it('logs and keeps going when the SDK throws while removing each listener', () => {
      vi.mocked(CometChat.removeMessageListener).mockImplementationOnce(() => {
        throw new Error('boom-message');
      });
      vi.mocked(CometChat.removeGroupListener).mockImplementationOnce(() => {
        throw new Error('boom-group');
      });
      vi.mocked(CometChat.removeCallListener).mockImplementationOnce(() => {
        throw new Error('boom-call');
      });
      vi.mocked(CometChat.removeConnectionListener).mockImplementationOnce(() => {
        throw new Error('boom-connection');
      });
      service.setLoadingState(true);

      service.cleanup();

      expect(loggerError).toHaveBeenCalledWith(
        'MessageListService',
        'Error removing message listener:',
        expect.objectContaining({ message: 'boom-message' })
      );
      expect(loggerError).toHaveBeenCalledWith(
        'MessageListService',
        'Error removing group listener:',
        expect.objectContaining({ message: 'boom-group' })
      );
      expect(loggerError).toHaveBeenCalledWith(
        'MessageListService',
        'Error removing call listener:',
        expect.objectContaining({ message: 'boom-call' })
      );
      expect(loggerError).toHaveBeenCalledWith(
        'MessageListService',
        'Error removing connection listener:',
        expect.objectContaining({ message: 'boom-connection' })
      );
      // Every throw was swallowed, so the reset at the end of cleanup still ran.
      expect(service.loadingState()).toBe(false);
    });

    it('unsubscribes the sent and edited subscriptions exactly once', () => {
      const sentUnsubscribe = vi.fn();
      const editedUnsubscribe = vi.fn();
      (service as any).ccMessageSentSubscription = { unsubscribe: sentUnsubscribe };
      (service as any).ccMessageEditedSubscription = { unsubscribe: editedUnsubscribe };

      service.cleanup();
      expect(sentUnsubscribe).toHaveBeenCalledTimes(1);
      expect(editedUnsubscribe).toHaveBeenCalledTimes(1);

      // A second teardown must not reach into the now-dropped subscriptions.
      service.cleanup();
      expect(sentUnsubscribe).toHaveBeenCalledTimes(1);
      expect(editedUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('cancels pending typing timeouts so they cannot fire after teardown', async () => {
      const fired = vi.fn();
      (service as any).typingTimeoutsMap.set('uid-1', setTimeout(fired, 5));
      (service as any).typingTimeoutsMap.set('uid-2', setTimeout(fired, 5));

      service.cleanup();
      await new Promise(resolve => setTimeout(resolve, 30));

      expect(fired).not.toHaveBeenCalled();
      expect((service as any).typingTimeoutsMap.size).toBe(0);
    });

    it('resets every signal and the conversation it was holding', () => {
      service.setLoadingState(true);
      service.setConnectionStatus('disconnected');
      (service as any).messagesSignal.set([makeMessage(1)]);
      (service as any).allMessagesSignal.set([makeMessage(1)]);
      (service as any).errorStateSignal.set(new Error('stale'));
      (service as any).prevMessageIdSignal.set(11);
      (service as any).nextMessageIdSignal.set(22);
      (service as any).unreadCountSignal.set(3);
      (service as any).typingUsersSignal.set(new Map([['uid-1', {}]]));
      (service as any).currentUser = new CometChat.User('uid-1');
      (service as any).parentMessageId = 9;
      (service as any).hideGroupActionMessages = true;
      (service as any).translationCache.set('1-es', 'hola');
      (service as any).retryAttempts.set('fetch', 2);
      (service as any).messageIdMap.set(1, makeMessage(1));
      (service as any).messageMuidMap.set('muid-1', makeMessage(1));

      service.cleanup();

      expect(service.messages()).toEqual([]);
      expect(service.allMessages()).toEqual([]);
      expect(service.loadingState()).toBe(false);
      expect(service.errorState()).toBeNull();
      expect(service.prevMessageId()).toBe(0);
      expect(service.nextMessageId()).toBe(0);
      expect(service.unreadCount()).toBe(0);
      expect(service.connectionStatus()).toBe('connected');
      expect(service.typingUsers().size).toBe(0);
      expect((service as any).currentUser).toBeNull();
      expect((service as any).currentGroup).toBeNull();
      expect((service as any).parentMessageId).toBeNull();
      expect((service as any).hideGroupActionMessages).toBe(false);
      expect((service as any).messagesRequest).toBeNull();
      expect((service as any).nextMessagesRequest).toBeNull();
      expect((service as any).messagesRequestBuilder).toBeNull();
      expect((service as any).translationCache.size).toBe(0);
      expect((service as any).retryAttempts.size).toBe(0);
      expect((service as any).messageIdMap.size).toBe(0);
      expect((service as any).messageMuidMap.size).toBe(0);
    });

    it('drops the error callback, so a later rejected setUser reports to nobody', () => {
      const onError = vi.fn();
      service.setErrorCallback(onError);

      service.cleanup();
      service.setUser(null as unknown as CometChat.User);

      expect(onError).not.toHaveBeenCalled();
      expect(loggerError).toHaveBeenCalledWith(
        'MessageListService',
        '[MessageListService] setUser: User is required'
      );
    });
  });

  // ==================== Conversation selection ====================

  describe('setUser / setGroup / clearConversation', () => {
    it('setUser stores the user, drops any group and builds both requests', () => {
      const group = new CometChat.Group('guid-1', 'Supergroup', CometChat.GROUP_TYPE.PUBLIC, '');
      (service as any).currentGroup = group;
      const user = new CometChat.User('uid-1');

      service.setUser(user);

      expect((service as any).currentUser).toBe(user);
      expect((service as any).currentGroup).toBeNull();
      expect((service as any).messagesRequest).toBe(prevRequest);
      expect((service as any).nextMessagesRequest).toBe(nextRequest);
      // The previous conversation's group/call/connection listeners are torn down.
      expect(CometChat.removeGroupListener).toHaveBeenCalledWith(service.getGroupListenerId());
      expect(CometChat.removeCallListener).toHaveBeenCalledWith(service.getCallListenerId());
      expect(CometChat.removeConnectionListener).toHaveBeenCalledWith(
        service.getConnectionListenerId()
      );
    });

    it('setGroup stores the group, drops any user and builds both requests', () => {
      (service as any).currentUser = new CometChat.User('uid-1');
      const group = new CometChat.Group('guid-1', 'Supergroup', CometChat.GROUP_TYPE.PUBLIC, '');

      service.setGroup(group);

      expect((service as any).currentGroup).toBe(group);
      expect((service as any).currentUser).toBeNull();
      expect((service as any).messagesRequest).toBe(prevRequest);
      expect((service as any).nextMessagesRequest).toBe(nextRequest);
    });

    it('setUser reports a missing user and leaves the loaded conversation intact', () => {
      const onError = vi.fn();
      service.setErrorCallback(onError);
      const existing = new CometChat.User('keep-me');
      (service as any).currentUser = existing;
      (service as any).messagesSignal.set([makeMessage(1)]);

      service.setUser(undefined as unknown as CometChat.User);

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0]).toMatchObject({
        message: '[MessageListService] setUser: User is required',
      });
      expect((service as any).currentUser).toBe(existing);
      expect(service.messages()).toHaveLength(1);
      expect(buildMessagesRequestImpl).not.toHaveBeenCalled();
    });

    it('setGroup reports a missing group and leaves the loaded conversation intact', () => {
      const onError = vi.fn();
      service.setErrorCallback(onError);
      const existing = new CometChat.Group('keep-me', 'G', CometChat.GROUP_TYPE.PUBLIC, '');
      (service as any).currentGroup = existing;

      service.setGroup(null as unknown as CometChat.Group);

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0]).toMatchObject({
        message: '[MessageListService] setGroup: Group is required',
      });
      expect((service as any).currentGroup).toBe(existing);
      expect(buildMessagesRequestImpl).not.toHaveBeenCalled();
    });

    it('setGroup with no error callback still refuses the call', () => {
      const existing = new CometChat.Group('keep-me', 'G', CometChat.GROUP_TYPE.PUBLIC, '');
      (service as any).currentGroup = existing;
      service.setErrorCallback(null);

      service.setGroup(undefined as unknown as CometChat.Group);

      expect((service as any).currentGroup).toBe(existing);
      expect(buildMessagesRequestImpl).not.toHaveBeenCalled();
      expect(loggerError).toHaveBeenCalledWith(
        'MessageListService',
        '[MessageListService] setGroup: Group is required'
      );
    });

    it('every conversation switch bumps the fetch generation and shows the shimmer', () => {
      expect(service.getFetchGeneration()).toBe(0);

      service.setUser(new CometChat.User('uid-1'));
      expect(service.getFetchGeneration()).toBe(1);
      expect(service.loadingState()).toBe(true);

      service.setGroup(new CometChat.Group('guid-1', 'G', CometChat.GROUP_TYPE.PUBLIC, ''));
      expect(service.getFetchGeneration()).toBe(2);
      expect(service.loadingState()).toBe(true);
    });

    it('a conversation switch clears the loaded messages and the id maps', () => {
      (service as any).messagesSignal.set([makeMessage(1)]);
      (service as any).allMessagesSignal.set([makeMessage(1)]);
      (service as any).messageIdMap.set(1, makeMessage(1));
      (service as any).messageMuidMap.set('muid-1', makeMessage(1));
      (service as any).prevMessageIdSignal.set(5);
      (service as any).nextMessageIdSignal.set(6);
      (service as any).unreadCountSignal.set(2);
      (service as any).errorStateSignal.set(new Error('stale'));

      service.setUser(new CometChat.User('uid-1'));

      expect(service.messages()).toEqual([]);
      expect(service.allMessages()).toEqual([]);
      expect((service as any).messageIdMap.size).toBe(0);
      expect((service as any).messageMuidMap.size).toBe(0);
      expect(service.prevMessageId()).toBe(0);
      expect(service.nextMessageId()).toBe(0);
      expect(service.unreadCount()).toBe(0);
      expect(service.errorState()).toBeNull();
    });

    it('clearConversation forgets both participants and both requests', () => {
      service.setUser(new CometChat.User('uid-1'));

      service.clearConversation();

      expect((service as any).currentUser).toBeNull();
      expect((service as any).currentGroup).toBeNull();
      expect((service as any).messagesRequest).toBeNull();
      expect((service as any).nextMessagesRequest).toBeNull();
    });
  });

  // ==================== Request-rebuilding setters ====================

  describe('setters that rebuild the messages request', () => {
    const rebuildingSetters: [string, (s: MessageListService) => void][] = [
      ['setParentMessageId', s => s.setParentMessageId(55)],
      ['updateParentMessageIdInPlace', s => s.updateParentMessageIdInPlace(55)],
      ['setMessagesRequestBuilder', s => s.setMessagesRequestBuilder(null)],
      ['setHideGroupActionMessages', s => s.setHideGroupActionMessages(true)],
    ];

    // Only the group case is parameterised: each setter guards its rebuild on
    // `currentUser || currentGroup`, and a group chat is the only way to reach the
    // second arm. The one-on-one arm is covered by the per-setter tests below,
    // which set a user and assert what each setter does beyond rebuilding.
    it.each(rebuildingSetters)('%s rebuilds both requests in a group chat', (_name, call) => {
      (service as any).currentGroup = new CometChat.Group('guid-1', 'G', CometChat.GROUP_TYPE.PUBLIC, '');

      call(service);

      expect((service as any).messagesRequest).toBe(prevRequest);
      expect((service as any).nextMessagesRequest).toBe(nextRequest);
    });

    it.each(rebuildingSetters)('%s builds nothing with no conversation selected', (_name, call) => {
      call(service);

      expect(buildMessagesRequestImpl).not.toHaveBeenCalled();
      expect(buildNextMessagesRequestImpl).not.toHaveBeenCalled();
      expect((service as any).messagesRequest).toBeNull();
      expect((service as any).nextMessagesRequest).toBeNull();
    });

    it('setParentMessageId clears the loaded messages before rebuilding', () => {
      (service as any).currentUser = new CometChat.User('uid-1');
      (service as any).messagesSignal.set([makeMessage(1)]);
      const generation = service.getFetchGeneration();

      service.setParentMessageId(55);

      expect((service as any).parentMessageId).toBe(55);
      expect(service.messages()).toEqual([]);
      expect(service.getFetchGeneration()).toBe(generation + 1);
      expect((service as any).messagesRequest).toBe(prevRequest);
      expect((service as any).nextMessagesRequest).toBe(nextRequest);
    });

    it('updateParentMessageIdInPlace rebuilds without discarding the loaded messages', () => {
      (service as any).currentUser = new CometChat.User('uid-1');
      (service as any).messagesSignal.set([makeMessage(1)]);
      const generation = service.getFetchGeneration();

      service.updateParentMessageIdInPlace(77);

      expect((service as any).parentMessageId).toBe(77);
      expect(service.messages()).toHaveLength(1);
      expect(service.getFetchGeneration()).toBe(generation);
      expect((service as any).messagesRequest).toBe(prevRequest);
      expect((service as any).nextMessagesRequest).toBe(nextRequest);
    });

    it('setHideGroupActionMessages flips the flag before the rebuild reads it', () => {
      (service as any).currentUser = new CometChat.User('uid-1');
      let flagSeenByBuilder: boolean | undefined;
      vi.mocked(buildMessagesRequestImpl).mockImplementation((ctx: any) => {
        flagSeenByBuilder = ctx.hideGroupActionMessages;
        return prevRequest;
      });

      service.setHideGroupActionMessages(true);

      expect(flagSeenByBuilder).toBe(true);
      expect((service as any).hideGroupActionMessages).toBe(true);
      expect((service as any).messagesRequest).toBe(prevRequest);
      expect((service as any).nextMessagesRequest).toBe(nextRequest);
    });

    it('setMessagesRequestBuilder stores the builder the rebuild will use', () => {
      (service as any).currentUser = new CometChat.User('uid-1');
      const builder = { id: 'custom' } as unknown as CometChat.MessagesRequestBuilder;
      let builderSeenByRebuild: unknown;
      vi.mocked(buildMessagesRequestImpl).mockImplementation((ctx: any) => {
        builderSeenByRebuild = ctx.messagesRequestBuilder;
        return prevRequest;
      });

      service.setMessagesRequestBuilder(builder);

      expect(builderSeenByRebuild).toBe(builder);
      expect((service as any).messagesRequestBuilder).toBe(builder);
      expect((service as any).messagesRequest).toBe(prevRequest);
      expect((service as any).nextMessagesRequest).toBe(nextRequest);
    });
  });

  // ==================== Message type / category bookkeeping ====================

  describe('custom message types and categories', () => {
    it('addCustomMessageTypes keeps only non-empty entries and accumulates them', () => {
      service.addCustomMessageTypes(['poll', '', null as unknown as string, 'sticker']);
      service.addCustomMessageTypes(['poll', undefined as unknown as string, 'gift']);

      expect([...(service as any).customMessageTypes]).toEqual(['poll', 'sticker', 'gift']);
    });

    it('addCustomMessageTypes ignores a missing list', () => {
      service.addCustomMessageTypes(['poll']);

      service.addCustomMessageTypes(null as unknown as string[]);

      expect([...(service as any).customMessageTypes]).toEqual(['poll']);
    });

    it('removeCustomMessageTypes drops the named types and ignores a missing list', () => {
      service.addCustomMessageTypes(['poll', 'sticker']);

      service.removeCustomMessageTypes(['poll', 'never-added']);
      expect([...(service as any).customMessageTypes]).toEqual(['sticker']);

      service.removeCustomMessageTypes(undefined as unknown as string[]);
      expect([...(service as any).customMessageTypes]).toEqual(['sticker']);
    });

    it('addCustomMessageCategories keeps only non-empty entries and accumulates them', () => {
      service.addCustomMessageCategories(['custom', '', null as unknown as string, 'interactive']);
      service.addCustomMessageCategories(['custom', 'call']);

      expect([...(service as any).customMessageCategories]).toEqual([
        'custom',
        'interactive',
        'call',
      ]);
    });

    it('addCustomMessageCategories ignores a missing list', () => {
      service.addCustomMessageCategories(['custom']);

      service.addCustomMessageCategories(null as unknown as string[]);

      expect([...(service as any).customMessageCategories]).toEqual(['custom']);
    });

    it('removeCustomMessageCategories drops the named categories and ignores a missing list', () => {
      service.addCustomMessageCategories(['custom', 'interactive']);

      service.removeCustomMessageCategories(['custom']);
      expect([...(service as any).customMessageCategories]).toEqual(['interactive']);

      service.removeCustomMessageCategories(null as unknown as string[]);
      expect([...(service as any).customMessageCategories]).toEqual(['interactive']);
    });

    it('setMessageTypes replaces the list, filtering blanks, and null restores the default', () => {
      service.setMessageTypes(['text', '', 'image', null as unknown as string]);
      expect([...((service as any).replacedMessageTypes as Set<string>)]).toEqual([
        'text',
        'image',
      ]);

      service.setMessageTypes(['audio']);
      expect([...((service as any).replacedMessageTypes as Set<string>)]).toEqual(['audio']);

      service.setMessageTypes(null);
      expect((service as any).replacedMessageTypes).toBeNull();
    });

    it('setMessageCategories replaces the list, filtering blanks, and null restores the default', () => {
      service.setMessageCategories(['message', '', 'custom', undefined as unknown as string]);
      expect([...((service as any).replacedMessageCategories as Set<string>)]).toEqual([
        'message',
        'custom',
      ]);

      service.setMessageCategories(null);
      expect((service as any).replacedMessageCategories).toBeNull();
    });

    it('getAllMessageTypes and getAllMessageCategories return the resolved defaults', () => {
      vi.mocked(getDefaultMessageTypesImpl).mockReturnValue(['text', 'image']);
      vi.mocked(getDefaultMessageCategoriesImpl).mockReturnValue(['message', 'custom']);

      expect(service.getAllMessageTypes()).toEqual(['text', 'image']);
      expect(service.getAllMessageCategories()).toEqual(['message', 'custom']);
      expect(getDefaultMessageTypesImpl).toHaveBeenCalledWith(service);
      expect(getDefaultMessageCategoriesImpl).toHaveBeenCalledWith(service);
    });
  });

  // ==================== Error classification and retry ====================

  describe('error handling', () => {
    // The classification tables themselves belong to message-list.error-utils and
    // are exhausted in its own spec. What this service owns is only that its five
    // private wrappers reach that module and hand its answer straight back, so
    // that is all this asserts — re-stating the tables here would duplicate them.
    it('forwards error classification, localization and delay to the error utils', async () => {
      vi.spyOn(CometChatLocalize, 'getLocalizedString').mockImplementation(key => `L:${key}`);

      expect((service as any).isRecoverableError(new Error('network glitch'))).toBe(true);
      expect((service as any).isRecoverableError(new Error('message not found'))).toBe(false);

      expect((service as any).isRecoverableErrorMessage('socket closed')).toBe(true);
      expect((service as any).isRetryableError('rate limit exceeded')).toBe(true);

      expect((service as any).getUserFriendlyErrorMessage(new Error('network is down'))).toBe(
        'L:error_network_connection'
      );

      await expect((service as any).delay(0)).resolves.toBeUndefined();
    });

    it('retries a recoverable failure after the first backoff and clears the counter on success', async () => {
      const delaySpy = vi.spyOn(service as any, 'delay').mockResolvedValue(undefined);
      const retry = vi.fn().mockResolvedValue(undefined);
      const onError = vi.fn();
      service.setErrorCallback(onError);

      await (service as any).handleErrorWithRetry(
        new Error('network glitch'),
        'fetchPrevious',
        retry
      );

      expect(retry).toHaveBeenCalledTimes(1);
      expect(delaySpy).toHaveBeenCalledWith(1000);
      expect((service as any).retryAttempts.has('fetchPrevious')).toBe(false);
      // The retry worked, so nothing is surfaced to the host.
      expect(onError).not.toHaveBeenCalled();
    });

    it('backs off three times then surfaces the last failure', async () => {
      const delaySpy = vi.spyOn(service as any, 'delay').mockResolvedValue(undefined);
      const retry = vi.fn().mockRejectedValue(new Error('network still down'));
      const onError = vi.fn();
      service.setErrorCallback(onError);

      await (service as any).handleErrorWithRetry(new Error('network glitch'), 'fetchNext', retry);

      expect(retry).toHaveBeenCalledTimes(3);
      expect(delaySpy.mock.calls.map(call => call[0])).toEqual([1000, 2000, 4000]);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0]).toMatchObject({ message: 'network still down' });
      expect((service as any).retryAttempts.has('fetchNext')).toBe(false);
    });

    it('surfaces a permanent failure immediately without retrying', async () => {
      const delaySpy = vi.spyOn(service as any, 'delay').mockResolvedValue(undefined);
      const retry = vi.fn();
      const onError = vi.fn();
      service.setErrorCallback(onError);
      const error = new Error('message not found');

      await (service as any).handleErrorWithRetry(error, 'editMessage', retry);

      expect(retry).not.toHaveBeenCalled();
      expect(delaySpy).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(error);
      expect(loggerError).toHaveBeenCalledWith(
        'MessageListService',
        'Error in editMessage:',
        error
      );
    });

    it('surfaces a recoverable failure immediately when no retry function is supplied', async () => {
      const delaySpy = vi.spyOn(service as any, 'delay').mockResolvedValue(undefined);
      const onError = vi.fn();
      service.setErrorCallback(onError);

      await (service as any).handleErrorWithRetry(new Error('request timeout'), 'fetchAround');

      expect(delaySpy).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('does not retry a context that already sits at the ceiling, and clears its counter', async () => {
      const delaySpy = vi.spyOn(service as any, 'delay').mockResolvedValue(undefined);
      const retry = vi.fn().mockResolvedValue(undefined);
      const onError = vi.fn();
      service.setErrorCallback(onError);
      (service as any).retryAttempts.set('fetchPrevious', 3);

      await (service as any).handleErrorWithRetry(
        new Error('network glitch'),
        'fetchPrevious',
        retry
      );

      expect(retry).not.toHaveBeenCalled();
      expect(delaySpy).not.toHaveBeenCalled();
      expect((service as any).retryAttempts.has('fetchPrevious')).toBe(false);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('resumes the backoff ladder from the attempt already recorded', async () => {
      const delaySpy = vi.spyOn(service as any, 'delay').mockResolvedValue(undefined);
      const retry = vi.fn().mockResolvedValue(undefined);
      (service as any).retryAttempts.set('fetchPrevious', 1);

      await (service as any).handleErrorWithRetry(
        new Error('network glitch'),
        'fetchPrevious',
        retry
      );

      expect(delaySpy).toHaveBeenCalledWith(2000);
    });

    it('logs and swallows a failure when no error callback is registered', async () => {
      service.setErrorCallback(null);

      await (service as any).handleErrorWithRetry(new Error('message not found'), 'markAsRead');

      expect(loggerError).toHaveBeenCalledWith(
        'MessageListService',
        'Error in markAsRead:',
        expect.objectContaining({ message: 'message not found' })
      );
      // The enhanced error is built but never published, so the signal stays clean.
      expect(service.errorState()).toBeNull();
    });

    it('clearError empties the error signal and setLoadingState drives the loading signal', () => {
      (service as any).errorStateSignal.set(new Error('stale'));

      service.clearError();
      expect(service.errorState()).toBeNull();

      service.setLoadingState(true);
      expect(service.loadingState()).toBe(true);
      service.setLoadingState(false);
      expect(service.loadingState()).toBe(false);
    });
  });

  // ==================== Realtime message handling ====================

  describe('handleNewMessage', () => {
    beforeEach(() => {
      loggedInUser.mockReturnValue(new CometChat.User('me'));
    });

    it('bumps the parent reply count for a thread reply seen from the main list', () => {
      vi.mocked(isThreadReplyForCurrentConversationImpl).mockReturnValue(true);
      const reply = makeMessage(5, 3);

      service.handleNewMessage(reply);

      expect(updateSentMessageReplyCountImpl).toHaveBeenCalledWith(service, reply);
      // The reply itself belongs to the thread view, not this list.
      expect(addMessageImpl).not.toHaveBeenCalled();
      expect(isMessageForCurrentConversationImpl).not.toHaveBeenCalled();
      expect(threadSubscription.applyIncomingReply).toHaveBeenCalledWith({
        reply,
        parentMessage: null,
        loggedInUserUid: 'me',
      });
    });

    it('leaves the reply count alone for a thread reply from another conversation', () => {
      vi.mocked(isThreadReplyForCurrentConversationImpl).mockReturnValue(false);
      const reply = makeMessage(5, 3);

      service.handleNewMessage(reply);

      expect(updateSentMessageReplyCountImpl).not.toHaveBeenCalled();
      // A mention can still subscribe the reader, so reconciliation still runs.
      expect(threadSubscription.applyIncomingReply).toHaveBeenCalledTimes(1);
      expect(addMessageImpl).not.toHaveBeenCalled();
    });

    it('drops a message that belongs to another conversation', () => {
      vi.mocked(isMessageForCurrentConversationImpl).mockReturnValue(false);

      service.handleNewMessage(makeMessage(5));

      expect(addMessageImpl).not.toHaveBeenCalled();
      expect(threadSubscription.applyIncomingReply).not.toHaveBeenCalled();
    });

    it('reconciles the subscription before adding a message for the current conversation', () => {
      vi.mocked(isMessageForCurrentConversationImpl).mockReturnValue(true);
      const order: string[] = [];
      threadSubscription.applyIncomingReply.mockImplementation(() => {
        order.push('reconcile');
      });
      vi.mocked(addMessageImpl).mockImplementation(() => {
        order.push('add');
      });
      const message = makeMessage(5);

      service.handleNewMessage(message);

      expect(addMessageImpl).toHaveBeenCalledWith(service, message);
      // The bubble must not render before it knows its follow state.
      expect(order).toEqual(['reconcile', 'add']);
    });

    it('inherits the held parent message when reconciling a reply inside a thread view', () => {
      vi.mocked(isMessageForCurrentConversationImpl).mockReturnValue(true);
      const parent = makeMessage(10);
      service.setParentMessage(parent);
      (service as any).parentMessageId = 10;
      const reply = makeMessage(11, 10);

      service.handleNewMessage(reply);

      expect(threadSubscription.applyIncomingReply).toHaveBeenCalledWith({
        reply,
        parentMessage: parent,
        loggedInUserUid: 'me',
      });
      expect(addMessageImpl).toHaveBeenCalledWith(service, reply);
    });

    it('setParentMessage(null) hands the reconciler no parent', () => {
      vi.mocked(isMessageForCurrentConversationImpl).mockReturnValue(true);
      service.setParentMessage(makeMessage(10));
      service.setParentMessage(null);

      service.handleNewMessage(makeMessage(11));

      expect(threadSubscription.applyIncomingReply).toHaveBeenCalledWith(
        expect.objectContaining({ parentMessage: null })
      );
    });

    it('skips reconciliation when nobody is logged in, but still adds the message', () => {
      loggedInUser.mockReturnValue(null);
      vi.mocked(isMessageForCurrentConversationImpl).mockReturnValue(true);
      const message = makeMessage(5);

      service.handleNewMessage(message);

      expect(threadSubscription.applyIncomingReply).not.toHaveBeenCalled();
      expect(addMessageImpl).toHaveBeenCalledWith(service, message);
    });

    it('skips reconciliation when the logged-in user has no uid', () => {
      loggedInUser.mockReturnValue({
        getUid: () => undefined,
      } as unknown as CometChat.User);
      vi.mocked(isMessageForCurrentConversationImpl).mockReturnValue(true);

      service.handleNewMessage(makeMessage(5));

      expect(threadSubscription.applyIncomingReply).not.toHaveBeenCalled();
      expect(addMessageImpl).toHaveBeenCalledTimes(1);
    });

    it('skips reconciliation when the logged-in uid is blank', () => {
      loggedInUser.mockReturnValue({ getUid: () => '' } as unknown as CometChat.User);
      vi.mocked(isMessageForCurrentConversationImpl).mockReturnValue(true);

      service.handleNewMessage(makeMessage(5));

      expect(threadSubscription.applyIncomingReply).not.toHaveBeenCalled();
      expect(addMessageImpl).toHaveBeenCalledTimes(1);
    });

    it('agent chat mode keeps a thread reply out of the reply-count path', () => {
      service.setIsAgentChat(true);
      vi.mocked(isMessageForCurrentConversationImpl).mockReturnValue(true);
      (service as any).messagesSignal.set([makeMessage(1)]);
      const reply = makeMessage(5, 3);

      service.handleNewMessage(reply);

      expect(updateSentMessageReplyCountImpl).not.toHaveBeenCalled();
      expect(addMessageImpl).toHaveBeenCalledWith(service, reply);
    });

    it('agent chat mode drops an incoming message while the list is still empty', () => {
      service.setIsAgentChat(true);
      vi.mocked(isMessageForCurrentConversationImpl).mockReturnValue(true);

      service.handleNewMessage(makeMessage(5));

      expect(addMessageImpl).not.toHaveBeenCalled();
      // Reconciliation already ran, which is what makes this a drop and not a reject.
      expect(threadSubscription.applyIncomingReply).toHaveBeenCalledTimes(1);
    });

    it('agent chat mode keeps incoming messages once the conversation has started', () => {
      service.setIsAgentChat(true);
      vi.mocked(isMessageForCurrentConversationImpl).mockReturnValue(true);
      (service as any).messagesSignal.set([makeMessage(1)]);
      const message = makeMessage(5);

      service.handleNewMessage(message);

      expect(addMessageImpl).toHaveBeenCalledWith(service, message);
    });

    it('agent chat mode inside a thread keeps an incoming reply even with an empty list', () => {
      service.setIsAgentChat(true);
      (service as any).parentMessageId = 10;
      vi.mocked(isMessageForCurrentConversationImpl).mockReturnValue(true);
      const reply = makeMessage(11, 10);

      service.handleNewMessage(reply);

      expect(addMessageImpl).toHaveBeenCalledWith(service, reply);
    });
  });

  describe('handleMessageEdited / handleMessageDeleted', () => {
    it('applies an edit for the current conversation and announces it', () => {
      vi.mocked(isMessageForCurrentConversationImpl).mockReturnValue(true);
      const edited = vi.fn();
      const subscription = CometChatMessageEvents.onMessageEdited.subscribe(edited);
      const message = makeMessage(7);

      try {
        service.handleMessageEdited(message);
      } finally {
        subscription.unsubscribe();
      }

      expect(updateMessageByIdImpl).toHaveBeenCalledWith(service, 7, message);
      expect(edited).toHaveBeenCalledWith(message);
    });

    it('ignores an edit for another conversation', () => {
      vi.mocked(isMessageForCurrentConversationImpl).mockReturnValue(false);
      const edited = vi.fn();
      const subscription = CometChatMessageEvents.onMessageEdited.subscribe(edited);

      try {
        service.handleMessageEdited(makeMessage(7));
      } finally {
        subscription.unsubscribe();
      }

      expect(updateMessageByIdImpl).not.toHaveBeenCalled();
      expect(edited).not.toHaveBeenCalled();
    });

    it('applies a delete for the current conversation and announces it', () => {
      vi.mocked(isMessageForCurrentConversationImpl).mockReturnValue(true);
      const deleted = vi.fn();
      const subscription = CometChatMessageEvents.onMessageDeleted.subscribe(deleted);
      const message = makeMessage(8);

      try {
        service.handleMessageDeleted(message);
      } finally {
        subscription.unsubscribe();
      }

      expect(deleteMessageImpl).toHaveBeenCalledWith(service, 8);
      expect(deleted).toHaveBeenCalledWith(message);
    });

    it('ignores a delete for another conversation', () => {
      vi.mocked(isMessageForCurrentConversationImpl).mockReturnValue(false);
      const deleted = vi.fn();
      const subscription = CometChatMessageEvents.onMessageDeleted.subscribe(deleted);

      try {
        service.handleMessageDeleted(makeMessage(8));
      } finally {
        subscription.unsubscribe();
      }

      expect(deleteMessageImpl).not.toHaveBeenCalled();
      expect(deleted).not.toHaveBeenCalled();
    });
  });

  // ==================== Reaction events ====================

  describe('handleReactionEvent', () => {
    const reactor = new CometChat.User('uid-2');

    it('drops an event that carries no reaction', () => {
      service.handleReactionEvent(makeReactionEvent(null), 'added');

      expect(loggerWarn).toHaveBeenCalledWith(
        'MessageListService',
        'handleReactionEvent: No reaction in event'
      );
      expect(getMessageByIdImpl).not.toHaveBeenCalled();
    });

    // An unparseable string and a zero id reach the same guard, so one test covers
    // both; each is reported with the raw id the event carried, not the parsed one.
    it('drops an event whose message id is unparseable or zero', () => {
      for (const messageId of ['not-a-number', 0]) {
        service.handleReactionEvent(
          makeReactionEvent(makeReaction({ messageId, emoji: '👍', reactedBy: reactor })),
          'added'
        );

        expect(loggerWarn).toHaveBeenCalledWith(
          'MessageListService',
          'handleReactionEvent: Invalid message ID:',
          messageId
        );
      }

      expect(getMessageByIdImpl).not.toHaveBeenCalled();
    });

    it('drops an event for a message that is not loaded', () => {
      vi.mocked(getMessageByIdImpl).mockReturnValue(undefined);
      const reaction = makeReaction({ messageId: 7, emoji: '👍', reactedBy: reactor });

      service.handleReactionEvent(makeReactionEvent(reaction), 'added');

      expect(getMessageByIdImpl).toHaveBeenCalledWith(service, 7);
      expect(updateMessageReactionsImpl).not.toHaveBeenCalled();
      expect(loggerWarn).not.toHaveBeenCalled();
    });

    it('drops an event with no emoji', () => {
      vi.mocked(getMessageByIdImpl).mockReturnValue(makeReactedMessage([]));
      const reaction = makeReaction({ messageId: 7, emoji: null, reactedBy: reactor });

      service.handleReactionEvent(makeReactionEvent(reaction), 'added');

      expect(updateMessageReactionsImpl).not.toHaveBeenCalled();
    });

    it('drops an event with no reacting user', () => {
      vi.mocked(getMessageByIdImpl).mockReturnValue(makeReactedMessage([]));
      const reaction = makeReaction({ messageId: 7, emoji: '👍', reactedBy: null });

      service.handleReactionEvent(makeReactionEvent(reaction), 'added');

      expect(updateMessageReactionsImpl).not.toHaveBeenCalled();
    });

    it('adds a first reaction to a message that has none, parsing a string id', () => {
      // getReactions() returning undefined is the real shape of an unreacted message.
      vi.mocked(getMessageByIdImpl).mockReturnValue(makeReactedMessage(undefined));
      const reaction = makeReaction({ messageId: '7', emoji: '👍', reactedBy: reactor });

      service.handleReactionEvent(makeReactionEvent(reaction), 'added');

      const [, messageId, reactions] = vi.mocked(updateMessageReactionsImpl).mock.calls[0];
      expect(messageId).toBe(7);
      expect(reactionSummary(reactions)).toEqual([['👍', 1]]);
    });

    it('increments an existing reaction count for a numeric id', () => {
      vi.mocked(getMessageByIdImpl).mockReturnValue(
        makeReactedMessage([new CometChat.ReactionCount('👍', 2, false)])
      );
      const reaction = makeReaction({ messageId: 7, emoji: '👍', reactedBy: reactor });

      service.handleReactionEvent(makeReactionEvent(reaction), 'added');

      const [, messageId, reactions] = vi.mocked(updateMessageReactionsImpl).mock.calls[0];
      expect(messageId).toBe(7);
      expect(reactionSummary(reactions)).toEqual([['👍', 3]]);
    });

    it('decrements a reaction count on removal', () => {
      vi.mocked(getMessageByIdImpl).mockReturnValue(
        makeReactedMessage([
          new CometChat.ReactionCount('👍', 2, true),
          new CometChat.ReactionCount('🎉', 1, false),
        ])
      );
      const reaction = makeReaction({ messageId: 7, emoji: '👍', reactedBy: reactor });

      service.handleReactionEvent(makeReactionEvent(reaction), 'removed');

      const [, , reactions] = vi.mocked(updateMessageReactionsImpl).mock.calls[0];
      expect(reactionSummary(reactions)).toEqual([
        ['👍', 1],
        ['🎉', 1],
      ]);
    });

    it('drops a reaction entirely when its last count is removed', () => {
      vi.mocked(getMessageByIdImpl).mockReturnValue(
        makeReactedMessage([new CometChat.ReactionCount('👍', 1, true)])
      );
      const reaction = makeReaction({ messageId: 7, emoji: '👍', reactedBy: reactor });

      service.handleReactionEvent(makeReactionEvent(reaction), 'removed');

      const [, , reactions] = vi.mocked(updateMessageReactionsImpl).mock.calls[0];
      expect(reactionSummary(reactions)).toEqual([]);
    });
  });

  // ==================== Read state ====================

  describe('read state', () => {
    it('markConversationAsRead is skipped inside a thread', async () => {
      service.setGroup(new CometChat.Group('guid-1', 'G', CometChat.GROUP_TYPE.PUBLIC, ''));
      (service as any).parentMessageId = 99;

      await service.markConversationAsRead();

      expect(markConversationAsReadImpl).not.toHaveBeenCalled();
    });

    it('markConversationAsRead clears a group conversation by guid', async () => {
      service.setGroup(new CometChat.Group('guid-1', 'G', CometChat.GROUP_TYPE.PUBLIC, ''));

      await service.markConversationAsRead();

      expect(markConversationAsReadImpl).toHaveBeenCalledWith(
        'guid-1',
        CometChatUIKitConstants.MessageReceiverType.group
      );
    });

    it('markConversationAsRead clears a one-on-one conversation by uid', async () => {
      service.setUser(new CometChat.User('uid-1'));

      await service.markConversationAsRead();

      expect(markConversationAsReadImpl).toHaveBeenCalledWith(
        'uid-1',
        CometChatUIKitConstants.MessageReceiverType.user
      );
    });

    it('markConversationAsRead does nothing with no conversation selected', async () => {
      await service.markConversationAsRead();

      expect(markConversationAsReadImpl).not.toHaveBeenCalled();
    });

    it('markInitialMessagesAsRead passes the loaded messages, the reader and working callbacks', async () => {
      const me = new CometChat.User('me');
      loggedInUser.mockReturnValue(me);
      service.setUser(new CometChat.User('uid-1'));
      const loaded = [makeMessage(1), makeMessage(2)];
      (service as any).messagesSignal.set(loaded);

      let seenMessages: CometChat.BaseMessage[] | undefined;
      let seenUser: CometChat.User | null | undefined;
      vi.mocked(markInitialMessagesAsReadImpl).mockImplementation(
        async (_ctx, messages, user, markAsRead, markConversationAsRead) => {
          seenMessages = messages;
          seenUser = user;
          await markAsRead(messages[0]);
          await markConversationAsRead?.();
        }
      );

      await service.markInitialMessagesAsRead();

      expect(seenMessages).toEqual(loaded);
      expect(seenUser).toBe(me);
      // The two closures must reach the service's own methods, not stubs.
      expect(markAsReadImpl).toHaveBeenCalledWith(service, loaded[0]);
      expect(markConversationAsReadImpl).toHaveBeenCalledWith(
        'uid-1',
        CometChatUIKitConstants.MessageReceiverType.user
      );
    });
  });

  // ==================== Delegation surface ====================

  describe('delegation', () => {
    it('forwards the message CRUD surface and returns each helper result', async () => {
      const message = makeMessage(1);
      const editedMessage = makeMessage(2);
      vi.mocked(updateMessageByIdImpl).mockReturnValue(true);
      vi.mocked(updateMessageByMuidImpl).mockReturnValue(false);
      vi.mocked(deleteMessageImpl).mockReturnValue(true);
      vi.mocked(removeMessageImpl).mockReturnValue(false);
      vi.mocked(getMessageByIdImpl).mockReturnValue(message);
      vi.mocked(updateReplyCountImpl).mockReturnValue(true);
      vi.mocked(updateMessageReactionsImpl).mockReturnValue(false);
      vi.mocked(editMessageImpl).mockResolvedValue(editedMessage);

      service.addMessage(message);
      expect(addMessageImpl).toHaveBeenCalledWith(service, message);

      expect(service.updateMessageById(1, message)).toBe(true);
      expect(updateMessageByIdImpl).toHaveBeenCalledWith(service, 1, message);

      expect(service.updateMessageByMuid('muid-1', message)).toBe(false);
      expect(updateMessageByMuidImpl).toHaveBeenCalledWith(service, 'muid-1', message);

      expect(service.deleteMessage(1)).toBe(true);
      expect(service.removeMessage(1)).toBe(false);
      expect(service.getMessageById(1)).toBe(message);
      expect(service.updateReplyCount(9, 4)).toBe(true);
      expect(updateReplyCountImpl).toHaveBeenCalledWith(service, 9, 4);
      expect(service.updateMessageReactions(1, [])).toBe(false);

      await expect(service.editMessage(message, 'new text')).resolves.toBe(editedMessage);
      expect(editMessageImpl).toHaveBeenCalledWith(service, message, 'new text');
    });

    it('forwards de-duplication and returns the filtered list', () => {
      const input = [makeMessage(1), makeMessage(1)];
      const output = [input[0]];
      vi.mocked(deduplicateMessagesImpl).mockReturnValue(output);

      expect((service as any).deduplicateMessages(input)).toBe(output);
      expect(deduplicateMessagesImpl).toHaveBeenCalledWith(service, input);
    });

    it('forwards pagination and receipts, returning whether more messages were loaded', async () => {
      vi.mocked(fetchPreviousMessagesImpl).mockResolvedValue(true);
      vi.mocked(fetchNextMessagesImpl).mockResolvedValue(false);
      vi.mocked(fetchMessagesAroundIdImpl).mockResolvedValue(undefined);

      await expect(service.fetchPreviousMessages()).resolves.toBe(true);
      expect(fetchPreviousMessagesImpl).toHaveBeenCalledWith(service);

      await expect(service.fetchNextMessages()).resolves.toBe(false);
      expect(fetchNextMessagesImpl).toHaveBeenCalledWith(service);

      await service.fetchMessagesAroundId(42);
      expect(fetchMessagesAroundIdImpl).toHaveBeenCalledWith(service, 42);

      const receipt = { id: 'receipt' } as unknown as CometChat.MessageReceipt;
      service.handleReceipt(receipt, true);
      expect(handleReceiptImpl).toHaveBeenCalledWith(service, receipt, true);
    });

    it('forwards the reaction operations and returns the fetched reactions', async () => {
      const reactions = [{ id: 'reaction' } as unknown as CometChat.Reaction];
      vi.mocked(fetchReactionsImpl).mockResolvedValue(reactions);

      await service.addReaction(1, '👍');
      expect(addReactionImpl).toHaveBeenCalledWith(service, 1, '👍');

      await service.removeReaction(1, '👍');
      expect(removeReactionImpl).toHaveBeenCalledWith(service, 1, '👍');

      const builder = { id: 'builder' } as unknown as CometChat.ReactionsRequestBuilder;
      await expect(service.fetchReactions(1, builder)).resolves.toBe(reactions);
      expect(fetchReactionsImpl).toHaveBeenCalledWith(service, 1, builder);

      // The builder is optional, and its absence must reach the helper as such.
      await service.fetchReactions(2);
      expect(fetchReactionsImpl).toHaveBeenLastCalledWith(service, 2, undefined);
    });

    it('forwards the read operations and returns their results', async () => {
      const message = makeMessage(1);
      const inRange = [message];
      const conversation = { id: 'conversation' } as unknown as CometChat.Conversation;
      vi.mocked(getMessagesInRangeImpl).mockReturnValue(inRange);
      vi.mocked(getTotalMessageCountImpl).mockReturnValue(7);
      vi.mocked(markAsUnreadImpl).mockResolvedValue(conversation);

      await service.markAsRead(message);
      expect(markAsReadImpl).toHaveBeenCalledWith(service, message);

      service.updateLocalReadStatus([1, 2]);
      expect(updateLocalReadStatusImpl).toHaveBeenCalledWith(service, [1, 2]);

      await service.markAsDelivered(message);
      expect(markAsDeliveredImpl).toHaveBeenCalledWith(service, message);

      expect(service.getMessagesInRange(0, 1)).toBe(inRange);
      expect(getMessagesInRangeImpl).toHaveBeenCalledWith(service, 0, 1);

      expect(service.getTotalMessageCount()).toBe(7);

      service.clearMessages();
      expect(clearMessagesImpl).toHaveBeenCalledWith(service);

      await expect(service.markAsUnread(message)).resolves.toBe(conversation);
      expect(markAsUnreadImpl).toHaveBeenCalledWith(service, message);
    });

    it('forwards the sent and edited realtime handlers', () => {
      const message = makeMessage(1);
      const data = { message } as unknown as IMessages;

      (service as any).handleSentMessage(data);
      expect(handleSentMessageImpl).toHaveBeenCalledWith(service, data);

      (service as any).handleEditedMessage(message);
      expect(handleEditedMessageImpl).toHaveBeenCalledWith(service, message);

      (service as any).updateSentMessageByMuid(message);
      expect(updateSentMessageByMuidImpl).toHaveBeenCalledWith(service, message);

      (service as any).updateSentMessageReplyCount(message);
      expect(updateSentMessageReplyCountImpl).toHaveBeenCalledWith(service, message);
    });

    it('forwards the conversation-scoping predicates and returns their verdicts', () => {
      const message = makeMessage(1);
      vi.mocked(isMessageForCurrentConversationImpl).mockReturnValue(true);
      vi.mocked(isThreadReplyForCurrentConversationImpl).mockReturnValue(false);

      expect((service as any).isMessageForCurrentConversation(message)).toBe(true);
      expect(isMessageForCurrentConversationImpl).toHaveBeenCalledWith(service, message);

      expect((service as any).isThreadReplyForCurrentConversation(message)).toBe(false);
      expect(isThreadReplyForCurrentConversationImpl).toHaveBeenCalledWith(service, message);
    });

    it('forwards the group, call and connection listener setup', () => {
      (service as any).setupGroupListener();
      expect(setupGroupListener).toHaveBeenCalledWith(service);

      (service as any).setupCallListener();
      expect(setupCallListener).toHaveBeenCalledWith(service);

      (service as any).setupConnectionListener();
      expect(setupConnectionListener).toHaveBeenCalledWith(
        service,
        service.getConnectionListenerId()
      );
    });

    it('forwards group actions, call actions and reconnection', async () => {
      const action = { id: 'action' } as unknown as CometChat.Action;
      const group = new CometChat.Group('guid-1', 'G', CometChat.GROUP_TYPE.PUBLIC, '');
      const call = { id: 'call' } as unknown as CometChat.Call;
      vi.mocked(handleReconnectionImpl).mockResolvedValue(undefined);

      service.handleGroupAction(action, group);
      expect(handleGroupActionImpl).toHaveBeenCalledWith(service, action, group);

      service.handleCallAction(call);
      expect(handleCallActionImpl).toHaveBeenCalledWith(service, call);

      await service.handleReconnection();
      expect(handleReconnectionImpl).toHaveBeenCalledWith(service);
    });

    it('setConnectionStatus drives the connection signal both ways', () => {
      service.setConnectionStatus('disconnected');
      expect(service.connectionStatus()).toBe('disconnected');

      service.setConnectionStatus('connected');
      expect(service.connectionStatus()).toBe('connected');
    });

    it('forwards the typing indicator handlers and returns the scoping verdict', () => {
      const indicator = { id: 'indicator' } as unknown as CometChat.TypingIndicator;
      vi.mocked(isTypingIndicatorForCurrentConversationImpl).mockReturnValue(true);

      service.handleTypingStarted(indicator);
      expect(handleTypingStartedImpl).toHaveBeenCalledWith(service, indicator);

      service.handleTypingEnded(indicator);
      expect(handleTypingEndedImpl).toHaveBeenCalledWith(service, indicator);

      (service as any).clearTypingIndicator('uid-9');
      expect(clearTypingIndicatorImpl).toHaveBeenCalledWith(service, 'uid-9');

      expect((service as any).isTypingIndicatorForCurrentConversation(indicator)).toBe(true);
      expect(isTypingIndicatorForCurrentConversationImpl).toHaveBeenCalledWith(service, indicator);
    });

    it('forwards translation and flagging, returning the translated text', async () => {
      const message = makeMessage(1);
      vi.mocked(translateMessageImpl).mockResolvedValue('hola');
      vi.mocked(getCachedTranslationImpl).mockReturnValue('hola');

      await expect(service.translateMessage(message, 'es')).resolves.toBe('hola');
      expect(translateMessageImpl).toHaveBeenCalledWith(service, message, 'es');

      expect(service.getCachedTranslation(1, 'es')).toBe('hola');
      expect(getCachedTranslationImpl).toHaveBeenCalledWith(service, 1, 'es');

      service.clearTranslationCache();
      expect(clearTranslationCacheImpl).toHaveBeenCalledWith(service);

      await service.flagMessage(message, 'spam', 'unsolicited');
      expect(flagMessageImpl).toHaveBeenCalledWith(service, message, 'spam', 'unsolicited');

      // The remark is optional, and its absence must reach the helper as such.
      await service.flagMessage(message, 'spam');
      expect(flagMessageImpl).toHaveBeenLastCalledWith(service, message, 'spam', undefined);
    });

    it('builds the previous and next requests through their own helpers', () => {
      expect((service as any).buildMessagesRequest(99)).toBe(prevRequest);
      expect(buildMessagesRequestImpl).toHaveBeenCalledWith(service, 99);

      expect((service as any).buildNextMessagesRequest(99)).toBe(nextRequest);
      expect(buildNextMessagesRequestImpl).toHaveBeenCalledWith(service, 99);
    });

    it('normalizeMessageId parses a string id and passes a numeric one through', () => {
      expect((service as any).normalizeMessageId('42')).toBe(42);
      expect((service as any).normalizeMessageId(42)).toBe(42);
    });
  });

});
