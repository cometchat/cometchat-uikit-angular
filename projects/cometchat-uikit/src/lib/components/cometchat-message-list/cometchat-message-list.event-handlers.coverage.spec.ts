/**
 * cometchat-message-list.event-handlers Tests
 *
 * Covers: subscribeToMessageEventsImpl, subscribeToGroupEventsImpl,
 *         subscribeToCallEventsImpl, subscribeToUIDialogEventsImpl.
 *
 * These are plain context-driven subscribers, so every test wires a stub
 * context, emits on the real static event subject and asserts what the handler
 * did to the context. No TestBed and no live SDK session are involved.
 *
 * @module components/cometchat-message-list/event-handlers
 */

// The calls SDK reaches for JitsiMeetJS at import time, which jsdom has no
// equivalent for; stub it so importing the kit's module graph stays cheap.
import { vi } from 'vitest';
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { ChangeDetectorRef, DestroyRef } from '@angular/core';
import type { Subject } from 'rxjs';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  subscribeToMessageEventsImpl,
  subscribeToGroupEventsImpl,
  subscribeToCallEventsImpl,
  subscribeToUIDialogEventsImpl,
  MessageEventContext,
  GroupEventContext,
  CallEventContext,
  UIDialogEventContext,
} from './cometchat-message-list.event-handlers';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import {
  CometChatGroupEvents,
  IGroupLeft,
  IGroupMemberAdded,
  IGroupMemberKickedBanned,
  IGroupMemberScopeChanged,
  IOwnershipChanged,
} from '../../events/CometChatGroupEvents';
import { CometChatCallEvents } from '../../events/CometChatCallEvents';
import { CometChatUIEvents, IDialog, IShowOngoingCall } from '../../events/CometChatUIEvents';
import { MessageStatus } from '../../Enums/Enums';
import { CometChatUIKitConstants } from '../../constants';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface FakeDestroyRef {
  ref: DestroyRef;
  destroy(): void;
}

/**
 * Stand-in for Angular's DestroyRef. takeUntilDestroyed() reads `destroyed`
 * and registers through onDestroy(), so the fake has to honour both for the
 * subscriptions to stay alive for the length of a test.
 */
function makeDestroyRef(): FakeDestroyRef {
  const callbacks: (() => void)[] = [];
  const ref = {
    destroyed: false,
    onDestroy(cb: () => void): () => void {
      callbacks.push(cb);
      return () => {
        const i = callbacks.indexOf(cb);
        if (i !== -1) {
          callbacks.splice(i, 1);
        }
      };
    },
  };
  return {
    ref: ref as unknown as DestroyRef,
    destroy(): void {
      ref.destroyed = true;
      callbacks.splice(0).forEach(cb => cb());
    },
  };
}

// The event subjects are static and therefore shared between tests. Every
// context registers its destroy ref here so afterEach can tear the
// subscriptions down; without that, handlers from earlier tests keep firing.
const liveRefs: FakeDestroyRef[] = [];

function newDestroyRef(): DestroyRef {
  const fake = makeDestroyRef();
  liveRefs.push(fake);
  return fake.ref;
}

function makeCdr(): ChangeDetectorRef {
  return { markForCheck: vi.fn(), detectChanges: vi.fn() } as unknown as ChangeDetectorRef;
}

/** A setter stub matching the `{ set(v) }` shape the contexts declare for signals. */
function makeSetter() {
  return { set: vi.fn() };
}

interface MessageStubOptions {
  id?: number;
  parentMessageId?: number;
  deletedAt?: number;
  receiverType?: string;
}

function makeMessageStub(options: MessageStubOptions = {}) {
  return {
    getId: vi.fn(() => options.id ?? 1),
    getParentMessageId: vi.fn(() => options.parentMessageId ?? 0),
    getDeletedAt: vi.fn(() => options.deletedAt),
    getReceiverType: vi.fn(
      () => options.receiverType ?? CometChatUIKitConstants.MessageReceiverType.user
    ),
  };
}

function asMessage(stub: ReturnType<typeof makeMessageStub>): CometChat.BaseMessage {
  return stub as unknown as CometChat.BaseMessage;
}

function makeGroupStub(guid: string) {
  return { getGuid: vi.fn(() => guid) };
}

function asGroup(stub: ReturnType<typeof makeGroupStub>): CometChat.Group {
  return stub as unknown as CometChat.Group;
}

/** A distinguishable marker standing in for a CometChat.Call payload. */
function makeCall(id = 'call-1'): CometChat.Call {
  return { sessionId: id } as unknown as CometChat.Call;
}

beforeEach(() => {
  // Resolve i18n keys to themselves so a test can assert WHICH key a handler
  // chose without depending on the shipped English copy.
  vi.spyOn(CometChatLocalize, 'getLocalizedString').mockImplementation(
    (key: string) => `i18n:${key}`
  );
});

afterEach(() => {
  liveRefs.splice(0).forEach(fake => fake.destroy());
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// subscribeToMessageEventsImpl
// ---------------------------------------------------------------------------

interface MessageCtxOptions {
  parentMessageId?: number | null;
  user?: CometChat.User | null;
  group?: CometChat.Group | null;
  isMessageForCurrentConversation?: boolean;
}

function makeMessageCtx(options: MessageCtxOptions = {}) {
  const messageListService = {
    getMessageById: vi.fn(() => undefined as CometChat.BaseMessage | undefined),
    deleteMessage: vi.fn(),
    updateMessageById: vi.fn(),
    addMessage: vi.fn(),
  };
  const ctx = {
    destroyRef: newDestroyRef(),
    cdr: makeCdr(),
    parentMessageId: options.parentMessageId ?? null,
    user: options.user ?? null,
    group: options.group ?? null,
    messageListService,
    isMessageForCurrentConversation: vi.fn(() => options.isMessageForCurrentConversation ?? true),
    scrollToBottom: vi.fn(),
    showInlineToast: vi.fn(),
    subscribeToGroupEvents: vi.fn(),
    subscribeToCallEvents: vi.fn(),
    subscribeToUIDialogEvents: vi.fn(),
  };
  subscribeToMessageEventsImpl(ctx as unknown as MessageEventContext);
  return ctx;
}

/**
 * Replaces requestAnimationFrame with a queue so a test can prove the work was
 * deferred and then run the frame itself.
 */
function stubAnimationFrame(): FrameRequestCallback[] {
  const queued: FrameRequestCallback[] = [];
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    queued.push(cb);
    return queued.length;
  });
  return queued;
}

describe('cometchat-message-list.event-handlers', () => {
  describe('subscribeToMessageEventsImpl', () => {
    it('delegates group, call and UI-dialog subscription to the context', () => {
      const ctx = makeMessageCtx();

      expect(ctx.subscribeToGroupEvents).toHaveBeenCalledTimes(1);
      expect(ctx.subscribeToCallEvents).toHaveBeenCalledTimes(1);
      expect(ctx.subscribeToUIDialogEvents).toHaveBeenCalledTimes(1);
    });

    it('stops reacting to ccMessageSent once the destroy ref fires', () => {
      const frames = stubAnimationFrame();
      const ctx = makeMessageCtx();

      liveRefs.splice(0).forEach(fake => fake.destroy());
      CometChatMessageEvents.ccMessageSent.next({
        message: asMessage(makeMessageStub()),
        status: MessageStatus.inprogress,
      });

      expect(frames).toHaveLength(0);
      expect(ctx.scrollToBottom).not.toHaveBeenCalled();
    });

    // ==================== ccMessageSent ====================

    it('ccMessageSent defers the scroll to the next animation frame in the main list', () => {
      const frames = stubAnimationFrame();
      const ctx = makeMessageCtx({ parentMessageId: null });

      CometChatMessageEvents.ccMessageSent.next({
        message: asMessage(makeMessageStub({ parentMessageId: 0 })),
        status: MessageStatus.inprogress,
      });

      // The scroll must wait for layout, so nothing may have happened yet.
      expect(ctx.scrollToBottom).not.toHaveBeenCalled();
      expect(frames).toHaveLength(1);

      frames[0](0);
      expect(ctx.scrollToBottom).toHaveBeenCalledWith(false);
    });

    it('ccMessageSent ignores a message whose status is not in-progress', () => {
      const frames = stubAnimationFrame();
      const ctx = makeMessageCtx();

      CometChatMessageEvents.ccMessageSent.next({
        message: asMessage(makeMessageStub()),
        status: MessageStatus.success,
      });

      expect(frames).toHaveLength(0);
      expect(ctx.scrollToBottom).not.toHaveBeenCalled();
    });

    it('ccMessageSent ignores a threaded message while showing the main list', () => {
      const frames = stubAnimationFrame();
      makeMessageCtx({ parentMessageId: null });

      CometChatMessageEvents.ccMessageSent.next({
        message: asMessage(makeMessageStub({ parentMessageId: 77 })),
        status: MessageStatus.inprogress,
      });

      expect(frames).toHaveLength(0);
    });

    it('ccMessageSent scrolls a thread list for its own parent', () => {
      const frames = stubAnimationFrame();
      const ctx = makeMessageCtx({ parentMessageId: 42 });

      CometChatMessageEvents.ccMessageSent.next({
        message: asMessage(makeMessageStub({ parentMessageId: 42 })),
        status: MessageStatus.inprogress,
      });

      expect(frames).toHaveLength(1);
      frames[0](0);
      expect(ctx.scrollToBottom).toHaveBeenCalledWith(false);
    });

    it('ccMessageSent ignores another thread while showing a thread list', () => {
      const frames = stubAnimationFrame();
      makeMessageCtx({ parentMessageId: 42 });

      CometChatMessageEvents.ccMessageSent.next({
        message: asMessage(makeMessageStub({ parentMessageId: 7 })),
        status: MessageStatus.inprogress,
      });

      expect(frames).toHaveLength(0);
    });

    // ==================== ccMessageDeleted ====================

    it('ccMessageDeleted removes a message that is not already tombstoned', () => {
      const ctx = makeMessageCtx();
      const existing = makeMessageStub({ id: 31, deletedAt: undefined });
      ctx.messageListService.getMessageById.mockReturnValue(asMessage(existing));

      CometChatMessageEvents.ccMessageDeleted.next(asMessage(makeMessageStub({ id: 31 })));

      expect(ctx.messageListService.getMessageById).toHaveBeenCalledWith(31);
      expect(ctx.messageListService.deleteMessage).toHaveBeenCalledWith(31);
      expect(ctx.cdr.markForCheck).toHaveBeenCalled();
    });

    it('ccMessageDeleted leaves an already-tombstoned message alone', () => {
      const ctx = makeMessageCtx();
      const existing = makeMessageStub({ id: 31, deletedAt: 1710000000 });
      ctx.messageListService.getMessageById.mockReturnValue(asMessage(existing));

      CometChatMessageEvents.ccMessageDeleted.next(asMessage(makeMessageStub({ id: 31 })));

      expect(ctx.messageListService.deleteMessage).not.toHaveBeenCalled();
      // The list still re-renders: the tombstone may need repainting.
      expect(ctx.cdr.markForCheck).toHaveBeenCalledTimes(1);
    });

    it('ccMessageDeleted skips deletion when the message is not in this list', () => {
      const ctx = makeMessageCtx();
      ctx.messageListService.getMessageById.mockReturnValue(undefined);

      CometChatMessageEvents.ccMessageDeleted.next(asMessage(makeMessageStub({ id: 55 })));

      expect(ctx.messageListService.deleteMessage).not.toHaveBeenCalled();
      expect(ctx.cdr.markForCheck).toHaveBeenCalledTimes(1);
    });

    it('ccMessageDeleted does nothing for a message with no id yet', () => {
      const ctx = makeMessageCtx();

      CometChatMessageEvents.ccMessageDeleted.next(asMessage(makeMessageStub({ id: 0 })));

      expect(ctx.messageListService.getMessageById).not.toHaveBeenCalled();
      expect(ctx.messageListService.deleteMessage).not.toHaveBeenCalled();
      expect(ctx.cdr.markForCheck).not.toHaveBeenCalled();
    });

    // ==================== ccMessageTranslated ====================

    it('ccMessageTranslated replaces the message when it belongs to this conversation', () => {
      const ctx = makeMessageCtx({ isMessageForCurrentConversation: true });
      const translated = makeMessageStub({ id: 12 });

      CometChatMessageEvents.ccMessageTranslated.next({
        message: asMessage(translated),
        status: MessageStatus.success,
      });

      expect(ctx.isMessageForCurrentConversation).toHaveBeenCalledWith(asMessage(translated));
      expect(ctx.messageListService.updateMessageById).toHaveBeenCalledWith(
        12,
        asMessage(translated)
      );
      expect(ctx.cdr.markForCheck).toHaveBeenCalledTimes(1);
    });

    it('ccMessageTranslated ignores a message from another conversation', () => {
      const ctx = makeMessageCtx({ isMessageForCurrentConversation: false });

      CometChatMessageEvents.ccMessageTranslated.next({
        message: asMessage(makeMessageStub({ id: 12 })),
        status: MessageStatus.success,
      });

      expect(ctx.messageListService.updateMessageById).not.toHaveBeenCalled();
      expect(ctx.cdr.markForCheck).not.toHaveBeenCalled();
    });

    it('ccMessageTranslated ignores a failed translation', () => {
      const ctx = makeMessageCtx();

      CometChatMessageEvents.ccMessageTranslated.next({
        message: asMessage(makeMessageStub({ id: 12 })),
        status: MessageStatus.error,
      });

      expect(ctx.isMessageForCurrentConversation).not.toHaveBeenCalled();
      expect(ctx.messageListService.updateMessageById).not.toHaveBeenCalled();
    });

    it('ccMessageTranslated ignores a success payload that carries no message', () => {
      const ctx = makeMessageCtx();

      CometChatMessageEvents.ccMessageTranslated.next({
        message: null as unknown as CometChat.BaseMessage,
        status: MessageStatus.success,
      });

      expect(ctx.isMessageForCurrentConversation).not.toHaveBeenCalled();
      expect(ctx.messageListService.updateMessageById).not.toHaveBeenCalled();
    });

    // ==================== ccMessageEdited ====================

    it('ccMessageEdited toasts the edited copy on success', () => {
      const ctx = makeMessageCtx({ parentMessageId: null });

      CometChatMessageEvents.ccMessageEdited.next({
        message: asMessage(makeMessageStub()),
        status: MessageStatus.success,
      });

      expect(ctx.showInlineToast).toHaveBeenCalledWith('i18n:message_list_message_edited');
      // Success leans on the default toast duration, so no extra arguments.
      expect(ctx.showInlineToast.mock.calls[0]).toHaveLength(1);
    });

    it('ccMessageEdited toasts the error copy for three seconds on failure', () => {
      const ctx = makeMessageCtx({ parentMessageId: null });

      CometChatMessageEvents.ccMessageEdited.next({
        message: asMessage(makeMessageStub()),
        status: MessageStatus.error,
      });

      expect(ctx.showInlineToast).toHaveBeenCalledWith('i18n:message_edit_error', undefined, 3000);
    });

    it('ccMessageEdited stays quiet for a status it has no copy for', () => {
      const ctx = makeMessageCtx({ parentMessageId: null });

      CometChatMessageEvents.ccMessageEdited.next({
        message: asMessage(makeMessageStub()),
        status: MessageStatus.cancelled,
      });

      expect(ctx.showInlineToast).not.toHaveBeenCalled();
    });

    it('ccMessageEdited ignores a thread edit while showing the main list', () => {
      const ctx = makeMessageCtx({ parentMessageId: null });

      CometChatMessageEvents.ccMessageEdited.next({
        message: asMessage(makeMessageStub()),
        status: MessageStatus.success,
        parentMessageId: 9,
      });

      expect(ctx.showInlineToast).not.toHaveBeenCalled();
    });

    it('ccMessageEdited toasts in a thread list for its own parent', () => {
      const ctx = makeMessageCtx({ parentMessageId: 9 });

      CometChatMessageEvents.ccMessageEdited.next({
        message: asMessage(makeMessageStub()),
        status: MessageStatus.success,
        parentMessageId: 9,
      });

      expect(ctx.showInlineToast).toHaveBeenCalledWith('i18n:message_list_message_edited');
    });

    it('ccMessageEdited ignores another thread while showing a thread list', () => {
      const ctx = makeMessageCtx({ parentMessageId: 9 });

      CometChatMessageEvents.ccMessageEdited.next({
        message: asMessage(makeMessageStub()),
        status: MessageStatus.error,
        parentMessageId: 4,
      });

      expect(ctx.showInlineToast).not.toHaveBeenCalled();
    });

    // ==================== ccMessageRead ====================

    // This handler is inert: its only statement is a guard whose `return` and
    // whose fall-through both do nothing, so there is no per-shape outcome to
    // assert. What is worth locking down is that no receipt shape can make it
    // mutate the list - the guard walks every arm below. (The missing
    // read-receipt update is called out in the audit summary, not fixed here.)
    const readReceiptShapes: [string, MessageCtxOptions, MessageStubOptions][] = [
      ['no user conversation open', { user: null }, { parentMessageId: 5 }],
      [
        'a group receipt',
        { user: {} as CometChat.User },
        { parentMessageId: 5, receiverType: CometChatUIKitConstants.MessageReceiverType.group },
      ],
      [
        'a thread receipt in the main list',
        { user: {} as CometChat.User, parentMessageId: null },
        { parentMessageId: 5 },
      ],
      [
        'a main-conversation receipt',
        { user: {} as CometChat.User, parentMessageId: null },
        { parentMessageId: 0 },
      ],
      [
        'a thread receipt in its own thread list',
        { user: {} as CometChat.User, parentMessageId: 5 },
        { parentMessageId: 5 },
      ],
    ];

    it('ccMessageRead never mutates the list, whatever the receipt looks like', () => {
      const touched = readReceiptShapes.map(([label, ctxOptions, stubOptions]) => {
        const ctx = makeMessageCtx(ctxOptions);

        CometChatMessageEvents.ccMessageRead.next(asMessage(makeMessageStub(stubOptions)));

        const calls = {
          updateMessageById: ctx.messageListService.updateMessageById.mock.calls.length,
          deleteMessage: ctx.messageListService.deleteMessage.mock.calls.length,
          addMessage: ctx.messageListService.addMessage.mock.calls.length,
          scrollToBottom: ctx.scrollToBottom.mock.calls.length,
          showInlineToast: ctx.showInlineToast.mock.calls.length,
          markForCheck: (ctx.cdr.markForCheck as unknown as { mock: { calls: unknown[] } }).mock
            .calls.length,
        };
        // Tear this context down before the next shape so each row is isolated
        // on the shared static subject.
        liveRefs.splice(0).forEach(fake => fake.destroy());
        return { label, ...calls };
      });

      expect(touched).toEqual(
        readReceiptShapes.map(([label]) => ({
          label,
          updateMessageById: 0,
          deleteMessage: 0,
          addMessage: 0,
          scrollToBottom: 0,
          showInlineToast: 0,
          markForCheck: 0,
        }))
      );
    });
  });

  // -------------------------------------------------------------------------
  // subscribeToGroupEventsImpl
  // -------------------------------------------------------------------------

  describe('subscribeToGroupEventsImpl', () => {
    const OPEN_GUID = 'guid-open';

    function makeGroupCtx(
      options: { parentMessageId?: number | null; group?: CometChat.Group | null } = {}
    ) {
      const ctx = {
        destroyRef: newDestroyRef(),
        cdr: makeCdr(),
        parentMessageId: options.parentMessageId ?? null,
        group: options.group === undefined ? asGroup(makeGroupStub(OPEN_GUID)) : options.group,
        messageListService: { addMessage: vi.fn() },
        scrollToBottom: vi.fn(),
        setGroup: vi.fn(),
      };
      subscribeToGroupEventsImpl(ctx as unknown as GroupEventContext);
      return ctx;
    }

    function actionStub(id: number) {
      return makeMessageStub({ id }) as unknown as CometChat.Action;
    }

    // ==================== ccOwnershipChanged ====================

    it('ccOwnershipChanged swaps in the updated group when it is the open one', () => {
      const ctx = makeGroupCtx();
      const updated = makeGroupStub(OPEN_GUID);

      CometChatGroupEvents.ccOwnershipChanged.next({
        group: asGroup(updated),
        newOwner: {} as CometChat.GroupMember,
      } as IOwnershipChanged);

      expect(ctx.setGroup).toHaveBeenCalledWith(asGroup(updated));
      expect(ctx.cdr.markForCheck).toHaveBeenCalledTimes(1);
    });

    it('ccOwnershipChanged ignores a different group', () => {
      const ctx = makeGroupCtx();

      CometChatGroupEvents.ccOwnershipChanged.next({
        group: asGroup(makeGroupStub('guid-other')),
        newOwner: {} as CometChat.GroupMember,
      } as IOwnershipChanged);

      expect(ctx.setGroup).not.toHaveBeenCalled();
      expect(ctx.cdr.markForCheck).not.toHaveBeenCalled();
    });

    // ==================== ccGroupMemberScopeChanged ====================

    it('ccGroupMemberScopeChanged appends the action message in the main list', () => {
      const ctx = makeGroupCtx({ parentMessageId: null });
      const updated = makeGroupStub(OPEN_GUID);
      const action = actionStub(101);

      CometChatGroupEvents.ccGroupMemberScopeChanged.next({
        group: asGroup(updated),
        message: action,
      } as IGroupMemberScopeChanged);

      expect(ctx.setGroup).toHaveBeenCalledWith(asGroup(updated));
      expect(ctx.messageListService.addMessage).toHaveBeenCalledWith(action);
      expect(ctx.scrollToBottom).toHaveBeenCalledWith(false);
      expect(ctx.cdr.markForCheck).toHaveBeenCalledTimes(1);
    });

    it('ccGroupMemberScopeChanged updates the group but adds no action message in a thread', () => {
      const ctx = makeGroupCtx({ parentMessageId: 12 });
      const updated = makeGroupStub(OPEN_GUID);

      CometChatGroupEvents.ccGroupMemberScopeChanged.next({
        group: asGroup(updated),
        message: actionStub(101),
      } as IGroupMemberScopeChanged);

      expect(ctx.setGroup).toHaveBeenCalledWith(asGroup(updated));
      expect(ctx.messageListService.addMessage).not.toHaveBeenCalled();
      expect(ctx.scrollToBottom).not.toHaveBeenCalled();
      expect(ctx.cdr.markForCheck).toHaveBeenCalledTimes(1);
    });

    it('ccGroupMemberScopeChanged ignores a different group', () => {
      const ctx = makeGroupCtx();

      CometChatGroupEvents.ccGroupMemberScopeChanged.next({
        group: asGroup(makeGroupStub('guid-other')),
        message: actionStub(101),
      } as IGroupMemberScopeChanged);

      expect(ctx.setGroup).not.toHaveBeenCalled();
      expect(ctx.messageListService.addMessage).not.toHaveBeenCalled();
    });

    // ==================== ccGroupMemberAdded ====================

    it('ccGroupMemberAdded appends every action message once in the main list', () => {
      const ctx = makeGroupCtx({ parentMessageId: null });
      const updated = makeGroupStub(OPEN_GUID);
      const first = actionStub(201);
      const second = actionStub(202);

      CometChatGroupEvents.ccGroupMemberAdded.next({
        userAddedIn: asGroup(updated),
        messages: [first, second],
      } as IGroupMemberAdded);

      expect(ctx.setGroup).toHaveBeenCalledWith(asGroup(updated));
      expect(ctx.messageListService.addMessage.mock.calls).toEqual([[first], [second]]);
      // One scroll for the whole batch, not one per member.
      expect(ctx.scrollToBottom).toHaveBeenCalledTimes(1);
      expect(ctx.scrollToBottom).toHaveBeenCalledWith(false);
    });

    it('ccGroupMemberAdded updates the group but adds no action messages in a thread', () => {
      const ctx = makeGroupCtx({ parentMessageId: 12 });
      const updated = makeGroupStub(OPEN_GUID);

      CometChatGroupEvents.ccGroupMemberAdded.next({
        userAddedIn: asGroup(updated),
        messages: [actionStub(201)],
      } as IGroupMemberAdded);

      expect(ctx.setGroup).toHaveBeenCalledWith(asGroup(updated));
      expect(ctx.messageListService.addMessage).not.toHaveBeenCalled();
      expect(ctx.scrollToBottom).not.toHaveBeenCalled();
      expect(ctx.cdr.markForCheck).toHaveBeenCalledTimes(1);
    });

    it('ccGroupMemberAdded ignores a different group', () => {
      const ctx = makeGroupCtx();

      CometChatGroupEvents.ccGroupMemberAdded.next({
        userAddedIn: asGroup(makeGroupStub('guid-other')),
        messages: [actionStub(201)],
      } as IGroupMemberAdded);

      expect(ctx.setGroup).not.toHaveBeenCalled();
      expect(ctx.messageListService.addMessage).not.toHaveBeenCalled();
    });

    // ==================== ccGroupMemberBanned / ccGroupMemberKicked ====================

    const kickBanSubjects: [string, Subject<IGroupMemberKickedBanned>][] = [
      ['ccGroupMemberBanned', CometChatGroupEvents.ccGroupMemberBanned],
      ['ccGroupMemberKicked', CometChatGroupEvents.ccGroupMemberKicked],
    ];

    describe.each(kickBanSubjects)('%s', (_label, subject) => {
      it('appends the action message in the main list', () => {
        const ctx = makeGroupCtx({ parentMessageId: null });
        const updated = makeGroupStub(OPEN_GUID);
        const action = actionStub(301);

        subject.next({ kickedFrom: asGroup(updated), message: action } as IGroupMemberKickedBanned);

        expect(ctx.setGroup).toHaveBeenCalledWith(asGroup(updated));
        expect(ctx.messageListService.addMessage).toHaveBeenCalledWith(action);
        expect(ctx.scrollToBottom).toHaveBeenCalledWith(false);
        expect(ctx.cdr.markForCheck).toHaveBeenCalledTimes(1);
      });

      it('updates the group but adds no action message in a thread', () => {
        const ctx = makeGroupCtx({ parentMessageId: 12 });
        const updated = makeGroupStub(OPEN_GUID);

        subject.next({
          kickedFrom: asGroup(updated),
          message: actionStub(301),
        } as IGroupMemberKickedBanned);

        expect(ctx.setGroup).toHaveBeenCalledWith(asGroup(updated));
        expect(ctx.messageListService.addMessage).not.toHaveBeenCalled();
        expect(ctx.scrollToBottom).not.toHaveBeenCalled();
        expect(ctx.cdr.markForCheck).toHaveBeenCalledTimes(1);
      });

      it('ignores a different group', () => {
        const ctx = makeGroupCtx();

        subject.next({
          kickedFrom: asGroup(makeGroupStub('guid-other')),
          message: actionStub(301),
        } as IGroupMemberKickedBanned);

        expect(ctx.setGroup).not.toHaveBeenCalled();
        expect(ctx.messageListService.addMessage).not.toHaveBeenCalled();
      });
    });

    // ==================== ccGroupLeft ====================

    it('ccGroupLeft appends the action message without re-setting the group', () => {
      const ctx = makeGroupCtx({ parentMessageId: null });
      const action = actionStub(401);

      CometChatGroupEvents.ccGroupLeft.next({
        leftGroup: asGroup(makeGroupStub(OPEN_GUID)),
        message: action,
      } as IGroupLeft);

      expect(ctx.messageListService.addMessage).toHaveBeenCalledWith(action);
      expect(ctx.scrollToBottom).toHaveBeenCalledWith(false);
      // Leaving does not change the group object the list renders against.
      expect(ctx.setGroup).not.toHaveBeenCalled();
      expect(ctx.cdr.markForCheck).toHaveBeenCalledTimes(1);
    });

    it('ccGroupLeft only re-renders in a thread list', () => {
      const ctx = makeGroupCtx({ parentMessageId: 12 });

      CometChatGroupEvents.ccGroupLeft.next({
        leftGroup: asGroup(makeGroupStub(OPEN_GUID)),
        message: actionStub(401),
      } as IGroupLeft);

      expect(ctx.messageListService.addMessage).not.toHaveBeenCalled();
      expect(ctx.scrollToBottom).not.toHaveBeenCalled();
      expect(ctx.cdr.markForCheck).toHaveBeenCalledTimes(1);
    });

    it('ccGroupLeft ignores a different group', () => {
      const ctx = makeGroupCtx();

      CometChatGroupEvents.ccGroupLeft.next({
        leftGroup: asGroup(makeGroupStub('guid-other')),
        message: actionStub(401),
      } as IGroupLeft);

      expect(ctx.messageListService.addMessage).not.toHaveBeenCalled();
      expect(ctx.cdr.markForCheck).not.toHaveBeenCalled();
    });

    // ==================== no group open ====================

    // A group event can arrive while a 1:1 conversation is open. Every one of
    // these six handlers has to leave the list alone in that state, so the rule
    // is pinned down once for all of them rather than six near-identical times.
    const everyGroupSubject: [string, { next(value: any): void }, () => any][] = [
      [
        'ccOwnershipChanged',
        CometChatGroupEvents.ccOwnershipChanged,
        () => ({ group: asGroup(makeGroupStub(OPEN_GUID)), newOwner: {} as CometChat.GroupMember }),
      ],
      [
        'ccGroupMemberScopeChanged',
        CometChatGroupEvents.ccGroupMemberScopeChanged,
        () => ({ group: asGroup(makeGroupStub(OPEN_GUID)), message: actionStub(501) }),
      ],
      [
        'ccGroupMemberAdded',
        CometChatGroupEvents.ccGroupMemberAdded,
        () => ({ userAddedIn: asGroup(makeGroupStub(OPEN_GUID)), messages: [actionStub(502)] }),
      ],
      [
        'ccGroupMemberBanned',
        CometChatGroupEvents.ccGroupMemberBanned,
        () => ({ kickedFrom: asGroup(makeGroupStub(OPEN_GUID)), message: actionStub(503) }),
      ],
      [
        'ccGroupMemberKicked',
        CometChatGroupEvents.ccGroupMemberKicked,
        () => ({ kickedFrom: asGroup(makeGroupStub(OPEN_GUID)), message: actionStub(504) }),
      ],
      [
        'ccGroupLeft',
        CometChatGroupEvents.ccGroupLeft,
        () => ({ leftGroup: asGroup(makeGroupStub(OPEN_GUID)), message: actionStub(505) }),
      ],
    ];

    it.each(everyGroupSubject)(
      '%s leaves the list alone when no group is open',
      (_label, subject, makePayload) => {
        const ctx = makeGroupCtx({ group: null });

        subject.next(makePayload());

        expect(ctx.setGroup).not.toHaveBeenCalled();
        expect(ctx.messageListService.addMessage).not.toHaveBeenCalled();
        expect(ctx.scrollToBottom).not.toHaveBeenCalled();
        expect(ctx.cdr.markForCheck).not.toHaveBeenCalled();
      }
    );
  });

  // -------------------------------------------------------------------------
  // subscribeToCallEventsImpl
  // -------------------------------------------------------------------------

  describe('subscribeToCallEventsImpl', () => {
    function makeCallCtx(
      options: { parentMessageId?: number | null; isCallForCurrentConversation?: boolean } = {}
    ) {
      const ctx = {
        destroyRef: newDestroyRef(),
        cdr: makeCdr(),
        parentMessageId: options.parentMessageId ?? null,
        messageListService: { addMessage: vi.fn() },
        isCallForCurrentConversation: vi.fn(() => options.isCallForCurrentConversation ?? true),
        scrollToBottom: vi.fn(),
        showCallScreen: makeSetter(),
        ongoingCallView: makeSetter(),
      };
      subscribeToCallEventsImpl(ctx as unknown as CallEventContext);
      return ctx;
    }

    // ==================== ccCallEnded ====================

    it('ccCallEnded tears down the call screen and logs the call in the main list', () => {
      const ctx = makeCallCtx({ parentMessageId: null });
      const call = makeCall();

      CometChatCallEvents.ccCallEnded.next(call);

      expect(ctx.showCallScreen.set).toHaveBeenCalledWith(false);
      expect(ctx.ongoingCallView.set).toHaveBeenCalledWith(null);
      expect(ctx.isCallForCurrentConversation).toHaveBeenCalledWith(call);
      expect(ctx.messageListService.addMessage).toHaveBeenCalledWith(call);
      expect(ctx.scrollToBottom).toHaveBeenCalledWith(false);
      expect(ctx.cdr.markForCheck).toHaveBeenCalledTimes(1);
    });

    it('ccCallEnded still tears down the call screen when there is no call object', () => {
      const ctx = makeCallCtx();

      CometChatCallEvents.ccCallEnded.next(null as unknown as CometChat.Call);

      expect(ctx.showCallScreen.set).toHaveBeenCalledWith(false);
      expect(ctx.ongoingCallView.set).toHaveBeenCalledWith(null);
      expect(ctx.isCallForCurrentConversation).not.toHaveBeenCalled();
      expect(ctx.messageListService.addMessage).not.toHaveBeenCalled();
    });

    it('ccCallEnded does not log the call in a thread list', () => {
      const ctx = makeCallCtx({ parentMessageId: 12 });

      CometChatCallEvents.ccCallEnded.next(makeCall());

      expect(ctx.showCallScreen.set).toHaveBeenCalledWith(false);
      expect(ctx.isCallForCurrentConversation).not.toHaveBeenCalled();
      expect(ctx.messageListService.addMessage).not.toHaveBeenCalled();
    });

    it('ccCallEnded does not log a call from another conversation', () => {
      const ctx = makeCallCtx({ isCallForCurrentConversation: false });

      CometChatCallEvents.ccCallEnded.next(makeCall());

      expect(ctx.isCallForCurrentConversation).toHaveBeenCalled();
      expect(ctx.messageListService.addMessage).not.toHaveBeenCalled();
      expect(ctx.scrollToBottom).not.toHaveBeenCalled();
      expect(ctx.cdr.markForCheck).not.toHaveBeenCalled();
    });

    // ==================== ccCallRejected / ccOutgoingCall / ccCallAccepted ====================

    const logOnlySubjects: [string, Subject<CometChat.Call>][] = [
      ['ccCallRejected', CometChatCallEvents.ccCallRejected],
      ['ccOutgoingCall', CometChatCallEvents.ccOutgoingCall],
      ['ccCallAccepted', CometChatCallEvents.ccCallAccepted],
    ];

    describe.each(logOnlySubjects)('%s', (_label, subject) => {
      it('logs the call in the main list without touching the call screen', () => {
        const ctx = makeCallCtx({ parentMessageId: null });
        const call = makeCall();

        subject.next(call);

        expect(ctx.messageListService.addMessage).toHaveBeenCalledWith(call);
        expect(ctx.scrollToBottom).toHaveBeenCalledWith(false);
        expect(ctx.cdr.markForCheck).toHaveBeenCalledTimes(1);
        // Only ccCallEnded dismisses the ongoing-call UI.
        expect(ctx.showCallScreen.set).not.toHaveBeenCalled();
        expect(ctx.ongoingCallView.set).not.toHaveBeenCalled();
      });

      it('ignores an empty call payload', () => {
        const ctx = makeCallCtx();

        subject.next(null as unknown as CometChat.Call);

        expect(ctx.isCallForCurrentConversation).not.toHaveBeenCalled();
        expect(ctx.messageListService.addMessage).not.toHaveBeenCalled();
      });

      it('does not log the call in a thread list', () => {
        const ctx = makeCallCtx({ parentMessageId: 12 });

        subject.next(makeCall());

        expect(ctx.isCallForCurrentConversation).not.toHaveBeenCalled();
        expect(ctx.messageListService.addMessage).not.toHaveBeenCalled();
      });

      it('does not log a call from another conversation', () => {
        const ctx = makeCallCtx({ isCallForCurrentConversation: false });

        subject.next(makeCall());

        expect(ctx.isCallForCurrentConversation).toHaveBeenCalled();
        expect(ctx.messageListService.addMessage).not.toHaveBeenCalled();
        expect(ctx.cdr.markForCheck).not.toHaveBeenCalled();
      });
    });
  });

  // -------------------------------------------------------------------------
  // subscribeToUIDialogEventsImpl
  // -------------------------------------------------------------------------

  describe('subscribeToUIDialogEventsImpl', () => {
    function makeDialogCtx(options: { parentMessageId?: number | null } = {}) {
      const ctx = {
        destroyRef: newDestroyRef(),
        cdr: makeCdr(),
        parentMessageId: options.parentMessageId ?? null,
        imageModerationDialogContent: makeSetter(),
        showImageModerationDialog: makeSetter(),
        showCallScreen: makeSetter(),
        ongoingCallView: makeSetter(),
      };
      subscribeToUIDialogEventsImpl(ctx as unknown as UIDialogEventContext);
      return ctx;
    }

    it('ccShowDialog opens the moderation dialog with the published content', () => {
      const ctx = makeDialogCtx();
      const child = { template: 'moderation' } as unknown as IDialog['child'];

      CometChatUIEvents.ccShowDialog.next({ child, confirmCallback: vi.fn() } as IDialog);

      expect(ctx.imageModerationDialogContent.set).toHaveBeenCalledWith(child);
      expect(ctx.showImageModerationDialog.set).toHaveBeenCalledWith(true);
      expect(ctx.cdr.markForCheck).toHaveBeenCalledTimes(1);
    });

    it('ccHideDialog closes the moderation dialog and drops its content', () => {
      const ctx = makeDialogCtx();

      CometChatUIEvents.ccHideDialog.next();

      expect(ctx.imageModerationDialogContent.set).toHaveBeenCalledWith(null);
      expect(ctx.showImageModerationDialog.set).toHaveBeenCalledWith(false);
      expect(ctx.cdr.markForCheck).toHaveBeenCalledTimes(1);
    });

    it('ccShowOngoingCall shows a call with no message scope at all', () => {
      const ctx = makeDialogCtx();
      const child = { template: 'call' } as unknown as IShowOngoingCall['child'];

      CometChatUIEvents.ccShowOngoingCall.next({ child });

      expect(ctx.showCallScreen.set).toHaveBeenCalledWith(true);
      expect(ctx.ongoingCallView.set).toHaveBeenCalledWith(child);
      expect(ctx.cdr.markForCheck).toHaveBeenCalledTimes(1);
    });

    it('ccShowOngoingCall shows a main-conversation call in the main list', () => {
      const ctx = makeDialogCtx({ parentMessageId: null });
      const child = { template: 'call' } as unknown as IShowOngoingCall['child'];

      CometChatUIEvents.ccShowOngoingCall.next({
        child,
        message: makeMessageStub({ parentMessageId: 0 }) as unknown as CometChat.CustomMessage,
      });

      expect(ctx.showCallScreen.set).toHaveBeenCalledWith(true);
      expect(ctx.ongoingCallView.set).toHaveBeenCalledWith(child);
    });

    it('ccShowOngoingCall hides the call screen when the payload carries no view', () => {
      const ctx = makeDialogCtx({ parentMessageId: null });

      CometChatUIEvents.ccShowOngoingCall.next({
        child: null,
        message: makeMessageStub({ parentMessageId: 0 }) as unknown as CometChat.CustomMessage,
      });

      expect(ctx.showCallScreen.set).toHaveBeenCalledWith(false);
      expect(ctx.ongoingCallView.set).toHaveBeenCalledWith(null);
      expect(ctx.cdr.markForCheck).toHaveBeenCalledTimes(1);
    });

    it('ccShowOngoingCall shows a thread call in its own thread list', () => {
      const ctx = makeDialogCtx({ parentMessageId: 42 });
      const child = { template: 'call' } as unknown as IShowOngoingCall['child'];

      CometChatUIEvents.ccShowOngoingCall.next({
        child,
        message: makeMessageStub({ parentMessageId: 42 }) as unknown as CometChat.CustomMessage,
      });

      expect(ctx.showCallScreen.set).toHaveBeenCalledWith(true);
      expect(ctx.ongoingCallView.set).toHaveBeenCalledWith(child);
    });

    it('ccShowOngoingCall ignores a thread call while showing the main list', () => {
      const ctx = makeDialogCtx({ parentMessageId: null });

      CometChatUIEvents.ccShowOngoingCall.next({
        child: { template: 'call' } as unknown as IShowOngoingCall['child'],
        message: makeMessageStub({ parentMessageId: 7 }) as unknown as CometChat.CustomMessage,
      });

      expect(ctx.showCallScreen.set).not.toHaveBeenCalled();
      expect(ctx.ongoingCallView.set).not.toHaveBeenCalled();
      expect(ctx.cdr.markForCheck).not.toHaveBeenCalled();
    });

    it('ccShowOngoingCall ignores another thread while showing a thread list', () => {
      const ctx = makeDialogCtx({ parentMessageId: 42 });

      CometChatUIEvents.ccShowOngoingCall.next({
        child: { template: 'call' } as unknown as IShowOngoingCall['child'],
        message: makeMessageStub({ parentMessageId: 7 }) as unknown as CometChat.CustomMessage,
      });

      expect(ctx.showCallScreen.set).not.toHaveBeenCalled();
      expect(ctx.ongoingCallView.set).not.toHaveBeenCalled();
      expect(ctx.cdr.markForCheck).not.toHaveBeenCalled();
    });

    it('ccShowOngoingCall ignores a main-conversation call while showing a thread list', () => {
      const ctx = makeDialogCtx({ parentMessageId: 42 });

      CometChatUIEvents.ccShowOngoingCall.next({
        child: { template: 'call' } as unknown as IShowOngoingCall['child'],
        message: makeMessageStub({ parentMessageId: 0 }) as unknown as CometChat.CustomMessage,
      });

      expect(ctx.showCallScreen.set).not.toHaveBeenCalled();
      expect(ctx.ongoingCallView.set).not.toHaveBeenCalled();
      expect(ctx.cdr.markForCheck).not.toHaveBeenCalled();
    });
  });
});
