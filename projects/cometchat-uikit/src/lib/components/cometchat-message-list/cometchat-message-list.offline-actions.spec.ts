/**
 * Message actions on an own unsent message with offline support on
 * (BEH-SEND-36/37 as rewritten by ruling R162 / S73, 2026-11-03): which options
 * the menu offers for each send state, and what Retry and Delete do for each
 * SDK answer, `ERROR_OFFLINE_MESSAGE_IN_FLIGHT` included.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKitConstants } from '../../constants';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import {
  installOfflineSdk,
  OfflineSdkFake,
  offlineMessage,
  sendScripts,
  textMessage,
} from '../../testing/offline-sdk-fake';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { OfflineHub, OfflineNotice } from '../../utils/offline/offline-hub';
import { offlineNoticeText } from '../../utils/offline/notices';
import { unsentActionsOf } from '../../utils/offline/unsent-actions';
import {
  discardUnsentMessage,
  isRetryInFlight,
  retryFailedMessage,
  sendWithState,
} from '../../utils/offline/send';
import {
  getMessageOptionsImpl,
  MessageOptionsContext,
} from './cometchat-message-list.option-builders';
import { handleOptionClickImpl } from './cometchat-message-list.option-click';
import {
  discardOfflineMessageImpl,
  OfflineActionsContext,
  retryOfflineMessageImpl,
} from './cometchat-message-list.offline-actions';
import { OfflineReplyCount } from '../../utils/offline/reply-count';

const RETRY = CometChatUIKitConstants.MessageOption.retryMessage;
const DISCARD = CometChatUIKitConstants.MessageOption.discardMessage;
const ME = 'alex';

function own(
  text: string,
  state: Parameters<typeof offlineMessage>[1] = {}
): CometChat.TextMessage {
  const m = offlineMessage(textMessage(text, 'sam'), { muid: `muid-${text}`, ...state });
  m.setSender(new CometChat.User(ME));
  return m;
}

function ctx(overrides: Partial<MessageOptionsContext> = {}): MessageOptionsContext {
  return {
    loggedInUser: new CometChat.User(ME),
    group: null,
    hideReactionOption: false,
    hideReplyOption: false,
    hideReplyInThreadOption: false,
    hideThreadSubscriptionOption: false,
    threadSubscriptionEnabled: true,
    hidePinMessageOption: false,
    hideUnpinMessageOption: false,
    hideSaveMessageOption: false,
    hideUnsaveMessageOption: false,
    pinMessageEnabled: true,
    saveMessageEnabled: true,
    hideCopyMessageOption: false,
    hideEditMessageOption: false,
    hideDeleteMessageOption: false,
    hideTranslateMessageOption: false,
    hideMessageInfoOption: false,
    hideFlagMessageOption: false,
    hideMessagePrivatelyOption: false,
    showMarkAsUnreadOption: true,
    additionalOptions: [],
    optionsOverride: null,
    ...overrides,
  };
}

const ids = (message: CometChat.BaseMessage, c = ctx()) =>
  getMessageOptionsImpl(c, message).map(o => o.id);

describe('R162: the menu of an own unsent message', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('PENDING offers Retry and Delete only', () => {
    expect(ids(own('p', { localMessageId: 'L1', status: 'PENDING' }))).toEqual([RETRY, DISCARD]);
  });

  it('SENDING offers Retry and Delete too (the SDK answers IN_FLIGHT if it cannot)', () => {
    expect(ids(own('s', { localMessageId: 'L2', status: 'SENDING' }))).toEqual([RETRY, DISCARD]);
  });

  it('FAILED + TRANSIENT offers Retry and Delete', () => {
    expect(
      ids(own('t', { localMessageId: 'L3', status: 'FAILED', failureReason: 'TRANSIENT' }))
    ).toEqual([RETRY, DISCARD]);
  });

  it.each([
    'PERMANENT',
    'DISCARDED',
    'QUEUE_OVERFLOW',
    'QUEUE_FULL',
    'BYTE_OVERFLOW',
    'SOMETHING_NEW',
  ])('FAILED + %s offers Retry and Delete (any reason)', reason => {
    expect(
      ids(own('x', { localMessageId: 'L4', status: 'FAILED', failureReason: reason }))
    ).toEqual([RETRY, DISCARD]);
  });

  it('FAILED with no reason (unknown after a restart, R95) is treated as TRANSIENT', () => {
    expect(ids(own('r', { localMessageId: 'L5', status: 'FAILED' }))).toEqual([RETRY, DISCARD]);
  });

  it('a FAILED row the outbox reported PERMANENT still offers Retry and Delete', () => {
    const hub = OfflineHub.getInstance();
    const m = own('h', { localMessageId: 'L6', status: 'FAILED' });
    hub.reportSendState(m, 'failed', { reason: 'PERMANENT' });
    expect(ids(m)).toEqual([RETRY, DISCARD]);
  });

  it('a row the hub has seen send, whose model carries no status yet, offers Retry and Delete', () => {
    const m = own('n', { localMessageId: 'L10' });
    OfflineHub.getInstance().reportSendState(m, 'sending');
    expect(ids(m)).toEqual([RETRY, DISCARD]);
  });

  it("the composer's optimistic row, before the SDK has queued it, has nothing to retry or delete yet", () => {
    expect(ids(own('o', {}))).toEqual([]);
  });

  it('a failed (direct) row kept in memory offers Retry and Delete', () => {
    const m = own('d', { localMessageId: 'L7' });
    OfflineHub.getInstance().reportSendState(m, 'failed', { reason: 'QUEUE_FULL', direct: true });
    expect(ids(m)).toEqual([RETRY, DISCARD]);
  });

  it('never offers Copy, reply, thread, react, edit, pin, save, unread, info, translate, report or forward', () => {
    for (const m of [
      own('a', { localMessageId: 'A', status: 'PENDING' }),
      own('b', { localMessageId: 'B', status: 'SENDING' }),
      own('c', { localMessageId: 'C', status: 'FAILED', failureReason: 'PERMANENT' }),
    ]) {
      const offered = ids(m);
      for (const id of offered) expect([RETRY, DISCARD]).toContain(id);
    }
  });

  it('hideDeleteMessageOption also hides Delete on unsent rows', () => {
    expect(
      ids(
        own('p', { localMessageId: 'L1', status: 'PENDING' }),
        ctx({ hideDeleteMessageOption: true })
      )
    ).toEqual([RETRY]);
  });

  it("a sent own message keeps today's full menu with offline on", () => {
    const sent = own('sent', { id: 42, localMessageId: 'L8', status: 'SENT' });
    const offered = ids(sent);
    expect(offered).toContain(CometChatUIKitConstants.MessageOption.reactToMessage);
    expect(offered).toContain(CometChatUIKitConstants.MessageOption.replyMessage);
    expect(offered).toContain(CometChatUIKitConstants.MessageOption.copyMessage);
    expect(offered).toContain(CometChatUIKitConstants.MessageOption.deleteMessage);
    expect(offered).not.toContain(RETRY);
    expect(offered).not.toContain(DISCARD);
  });

  it("offline off: an unsent-looking row gets exactly today's menu (no Retry, no device-only Delete)", () => {
    fake.setEnabled(false);
    const offered = ids(own('off', { status: 'PENDING', localMessageId: 'L9' }));
    expect(offered).not.toContain(RETRY);
    expect(offered).not.toContain(DISCARD);
    expect(offered).toContain(CometChatUIKitConstants.MessageOption.copyMessage);
  });

  it('unsentActionsOf answers null for a sent message', () => {
    expect(unsentActionsOf(own('s', { id: 9, status: 'SENT' }))).toBeNull();
  });

  it("choosing Delete opens today's confirmation for the discard, never the server delete directly", () => {
    const self = {
      requestOfflineDiscard: vi.fn(),
      showDeleteConfirmation: vi.fn(),
      retryOfflineMessage: vi.fn(),
    };
    const m = own('p', { localMessageId: 'L1', status: 'PENDING' });
    handleOptionClickImpl(self, { id: DISCARD } as any, m);
    handleOptionClickImpl(self, { id: RETRY } as any, m);
    expect(self.requestOfflineDiscard).toHaveBeenCalledWith(m);
    expect(self.showDeleteConfirmation).not.toHaveBeenCalled();
    expect(self.retryOfflineMessage).toHaveBeenCalledWith(m);
  });
});

describe('Retry (user-invoked only)', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('a PENDING row asks the SDK to retry it now (retryMessage with its local id)', async () => {
    await retryFailedMessage(own('p', { localMessageId: 'L1', status: 'PENDING' }), 'text');
    expect(fake.callsTo('retryMessage').map(c => c[0])).toEqual(['L1']);
    expect(fake.callsTo('sendMessage')).toHaveLength(0);
  });

  it('a SENDING row is retried by the SDK too, never sent again as a duplicate (R162)', async () => {
    const m = own('s', { localMessageId: 'L11', status: 'SENDING' });
    expect(await retryFailedMessage(m, 'text')).toBe('handed-over');
    expect(fake.callsTo('retryMessage').map(c => c[0])).toEqual(['L11']);
    expect(fake.callsTo('sendMessage')).toHaveLength(0);
  });

  it('a FAILED row with a permanent reason is retried by the SDK (R162)', async () => {
    const m = own('p', { localMessageId: 'L12', status: 'FAILED', failureReason: 'PERMANENT' });
    expect(await retryFailedMessage(m, 'text')).toBe('handed-over');
    expect(fake.callsTo('retryMessage').map(c => c[0])).toEqual(['L12']);
  });

  describe('ERROR_OFFLINE_MESSAGE_IN_FLIGHT', () => {
    let notices: OfflineNotice[];
    beforeEach(() => {
      notices = [];
      OfflineHub.getInstance().notice$.subscribe(n => notices.push(n));
      (CometChat as any).retryMessage = () =>
        Promise.reject({ code: 'ERROR_OFFLINE_MESSAGE_IN_FLIGHT' });
    });

    it('raises the "Sending... try again" notice for the row, once per tap, and changes nothing', async () => {
      const m = own('s', { localMessageId: 'L13', status: 'SENDING' });
      expect(await retryFailedMessage(m, 'text')).toBe('in-flight');
      expect(notices.map(n => n.kind)).toEqual(['send_in_flight']);
      expect(notices[0].message).toBe(m);
      expect(OfflineHub.getInstance().directFailureOf(m)).toBeUndefined();
      expect(fake.callsTo('sendMessage')).toHaveLength(0);
      expect(await retryFailedMessage(m, 'text')).toBe('in-flight');
      expect(notices.map(n => n.kind)).toEqual(['send_in_flight', 'send_in_flight']);
    });

    it('the notice reads "Sending... try again in a moment" (localized key)', async () => {
      await retryFailedMessage(own('s', { localMessageId: 'L14', status: 'SENDING' }), 'text');
      expect(offlineNoticeText(notices[0])).toBe(
        CometChatLocalize.getLocalizedString('message_list_send_in_flight')
      );
      expect(offlineNoticeText(notices[0])).not.toBe('');
      expect(offlineNoticeText(notices[0])).not.toBe('message_list_send_in_flight');
    });
  });

  describe('ERROR_OFFLINE_MESSAGE_NOT_FOUND (the SDK no longer holds it)', () => {
    let removed: string[];
    beforeEach(() => {
      removed = [];
      OfflineHub.getInstance().sendState$.subscribe(e => {
        if (e.state === 'discarded') removed.push(e.localMessageId);
      });
      (CometChat as any).retryMessage = () =>
        Promise.reject({ code: 'ERROR_OFFLINE_MESSAGE_NOT_FOUND' });
    });

    it.each([false, true])(
      'a row with no server id is removed like a discard (connected: %s)',
      async connected => {
        fake.connected = connected;
        const m = own('purged', { localMessageId: 'L15', status: 'FAILED' });
        expect(await retryFailedMessage(m, 'text')).toBe('not-found');
        expect(removed).toEqual(['L15']);
      }
    );

    it('the row in the list is removed through the list action too', async () => {
      fake.connected = false;
      const m = own('purged2', { localMessageId: 'L16', status: 'FAILED' });
      const list = { allMessages: () => [m], checkKillSwitch: vi.fn() };
      await retryOfflineMessageImpl({ messageListService: list } as any, m);
      expect(removed).toEqual(['L16']);
    });

    it('a row with a server id is sent: it stays', async () => {
      const m = own('sent', { id: 91, localMessageId: 'L17', status: 'FAILED' });
      expect(await retryFailedMessage(m, 'text')).toBe('not-found');
      expect(removed).toEqual([]);
    });
  });

  // Android's rule (`OfflineSend.kt:228-233`): ERROR_NOT_CONNECTED means the retried row is
  // queued again and sends on reconnect, so the retrying overlay STAYS and the row keeps reading
  // "Not sent yet" — Android clears the overlay only for a real failure, in-flight or not-found.
  // The kit reports `sending` for that overlay because the SDK fires no pending callback for a
  // retry; `applySendState` then draws the row as PENDING, which `offlineSendState` renders as
  // "Not sent yet" (`cometchat-message-bubble.component.ts:408`). Nothing is removed and nothing
  // is announced, which is what "silent" means here.
  it('a retry answered not-connected leaves the row queued on "Not sent yet" (silent)', async () => {
    fake.connected = false;
    const removed: string[] = [];
    OfflineHub.getInstance().sendState$.subscribe(e => {
      if (e.state === 'discarded') removed.push(e.localMessageId);
    });
    (CometChat as any).retryMessage = () =>
      Promise.reject({ code: 'ERROR_INTERNET_UNAVAILABLE' });
    const m = own('q', { localMessageId: 'L18', status: 'FAILED', failureReason: 'TRANSIENT' });
    expect(await retryFailedMessage(m, 'text')).toBe('handed-over');
    expect(removed).toEqual([]);
    expect(OfflineHub.getInstance().stateOf('L18')).toBe('sending');
    // The row is not put back to FAILED, so it does not flip to "Not sent. Tap to retry":
    // reporting `sending` clears the stored reason (the hub keeps '' for "none").
    expect(OfflineHub.getInstance().failureReasonOf(m)).toBeFalsy();
  });

  it('ignores further taps while a retry is in flight', async () => {
    let answer!: () => void;
    (CometChat as any).retryMessage = (id: string) => {
      fake.calls.push({ name: 'retryMessage', args: [id] });
      return new Promise<void>(r => {
        answer = r;
      });
    };
    const m = own('f', { localMessageId: 'L2', status: 'FAILED', failureReason: 'TRANSIENT' });
    const first = retryFailedMessage(m, 'text');
    expect(isRetryInFlight(m)).toBe(true);
    expect(await retryFailedMessage(m, 'text')).toBe('ignored');
    expect(await retryFailedMessage(m, 'text')).toBe('ignored');
    answer();
    await first;
    expect(isRetryInFlight(m)).toBe(false);
    expect(fake.callsTo('retryMessage')).toHaveLength(1);
  });

  it('a direct failure retries as a fresh send through the send helper', async () => {
    fake.scriptSend(sendScripts.queueFull('LQ'));
    const m = own('d');
    await sendWithState(m, 'text');
    fake.scriptSend((l, mm) =>
      l.onMessagePending(offlineMessage(mm, { localMessageId: 'NEW', status: 'PENDING' }))
    );
    expect(await retryFailedMessage(m, 'text')).toBe('handed-over');
    expect(fake.callsTo('sendMessage')).toHaveLength(2);
    expect(fake.callsTo('retryMessage')).toHaveLength(0);
  });

  it('ERROR_OFFLINE_DISABLED (kill switch) turns the row failed (direct) and checks the list', async () => {
    (CometChat as any).retryMessage = () => Promise.reject({ code: 'ERROR_OFFLINE_DISABLED' });
    const m = own('k', { localMessageId: 'L3', status: 'PENDING' });
    const list = { allMessages: () => [m], checkKillSwitch: vi.fn() };
    await retryOfflineMessageImpl({ messageListService: list } as any, m);
    expect(OfflineHub.getInstance().directFailureOf(m)).toBe('');
    expect(list.checkKillSwitch).toHaveBeenCalled();
  });
});

describe('Delete = discardLocalMessage', () => {
  let fake: OfflineSdkFake;
  let toasts: string[];
  let errors: unknown[];
  let rows: CometChat.BaseMessage[];
  let actx: OfflineActionsContext & {
    handleDeleteConfirm: ReturnType<typeof vi.fn>;
    deleting: CometChat.BaseMessage | null;
    dialog: boolean;
  };

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk({ enabled: true });
    toasts = [];
    errors = [];
    rows = [];
    actx = {
      deleting: null,
      dialog: true,
      messageListService: { allMessages: () => rows, checkKillSwitch: vi.fn() },
      messageToDelete: {
        set: (m: any) => {
          actx.deleting = m;
        },
      },
      showDeleteConfirmDialog: {
        set: (v: boolean) => {
          actx.dialog = v;
        },
      },
      error: { emit: (e: unknown) => errors.push(e) },
      showInlineToast: (text: string) => toasts.push(text),
      handleDeleteConfirm: vi.fn(async () => undefined),
    } as any;
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    vi.useRealTimers();
  });

  function removals(): string[] {
    const seen: string[] = [];
    OfflineHub.getInstance().sendState$.subscribe(e => {
      if (e.state === 'discarded') seen.push(e.localMessageId || e.message.getMuid());
    });
    return seen;
  }

  it('discards through the SDK with the local id and removes the row; no ccMessageSent(error)', async () => {
    const seen = removals();
    const sentEvents: unknown[] = [];
    const sub = CometChatMessageEvents.ccMessageSent.subscribe(e => sentEvents.push(e));
    await discardOfflineMessageImpl(actx, own('p', { localMessageId: 'L1', status: 'PENDING' }));
    sub.unsubscribe();
    expect(fake.callsTo('discardLocalMessage').map(c => c[0])).toEqual(['L1']);
    expect(seen).toEqual(['L1']);
    expect(sentEvents).toEqual([]);
    expect(actx.dialog).toBe(false);
  });

  it('a failed (direct) row is removed from the screen only (no SDK call)', async () => {
    const seen = removals();
    const m = own('d');
    OfflineHub.getInstance().reportSendState(m, 'failed', {
      reason: 'BYTE_OVERFLOW',
      direct: true,
    });
    await discardOfflineMessageImpl(actx, m);
    expect(fake.callsTo('discardLocalMessage')).toHaveLength(0);
    expect(seen).toEqual(['muid-d']);
    expect(OfflineHub.getInstance().directFailureOf(m)).toBeUndefined();
  });

  it('ERROR_OFFLINE_MESSAGE_IN_FLIGHT keeps the row, closes the dialog and raises the "Sending..." notice, not the delete-failed toast (R162)', async () => {
    const seen = removals();
    const notices: OfflineNotice[] = [];
    OfflineHub.getInstance().notice$.subscribe(n => notices.push(n));
    fake.discardResult = 'reject';
    const m = own('s', { localMessageId: 'L2', status: 'SENDING' });
    await discardOfflineMessageImpl(actx, m);
    expect(seen).toEqual([]);
    expect(toasts).toEqual([]);
    expect(actx.dialog).toBe(false);
    expect(notices.map(n => n.kind)).toEqual(['send_in_flight']);
    expect(notices[0].message).toBe(m);
  });

  it('a busy store (any other refusal) keeps the row and shows the delete-failed toast', async () => {
    (CometChat as any).discardLocalMessage = () =>
      Promise.reject({ code: 'ERROR_OFFLINE_MESSAGE_PERSIST_FAILED' });
    const notices: OfflineNotice[] = [];
    OfflineHub.getInstance().notice$.subscribe(n => notices.push(n));
    await discardOfflineMessageImpl(actx, own('s', { localMessageId: 'L2b', status: 'PENDING' }));
    expect(toasts).toHaveLength(1);
    expect(notices).toEqual([]);
  });

  it("ERROR_OFFLINE_MESSAGE_NOT_FOUND with a sent copy deletes it on the server through today's path", async () => {
    (CometChat as any).discardLocalMessage = () =>
      Promise.reject({ code: 'ERROR_OFFLINE_MESSAGE_NOT_FOUND' });
    const sent = own('went', { id: 77, localMessageId: 'L3', status: 'SENT' });
    rows = [sent];
    await discardOfflineMessageImpl(actx, own('went', { localMessageId: 'L3', status: 'PENDING' }));
    expect(actx.deleting).toBe(sent);
    expect(actx.handleDeleteConfirm).toHaveBeenCalledTimes(1);
  });

  it('NOT_FOUND on a message that already carries a server id deletes it on the server', async () => {
    (CometChat as any).discardLocalMessage = () =>
      Promise.reject({ code: 'ERROR_OFFLINE_MESSAGE_NOT_FOUND' });
    fake.connected = false;
    const seen = removals();
    const m = own('sent', { id: 79, localMessageId: 'L4', status: 'PENDING' });
    await discardOfflineMessageImpl(actx, m);
    expect(actx.deleting).toBe(m);
    expect(actx.handleDeleteConfirm).toHaveBeenCalledTimes(1);
    expect(seen).toEqual([]);
  });

  it.each([false, true])(
    'NOT_FOUND with no server id removes the row at once, no delete-failed toast (connected: %s)',
    async connected => {
      (CometChat as any).discardLocalMessage = () =>
        Promise.reject({ code: 'ERROR_OFFLINE_MESSAGE_NOT_FOUND' });
      fake.connected = connected;
      const seen = removals();
      const m = own('gone', { localMessageId: 'L5', status: 'FAILED' });
      rows = [m];
      let settled = false;
      void discardOfflineMessageImpl(actx, m).then(() => (settled = true));
      // No wait for a sent copy: done as soon as the SDK has answered.
      await new Promise(r => setTimeout(r, 0));
      expect(settled).toBe(true);
      expect(seen).toEqual(['L5']);
      expect(actx.handleDeleteConfirm).not.toHaveBeenCalled();
      expect(errors).toEqual([]);
      expect(toasts).toEqual([
        CometChatLocalize.getLocalizedString('message_list_message_deleted'),
      ]);
      expect(actx.dialog).toBe(false);
    }
  );

  it('a sent copy that arrives after a NOT_FOUND Delete removed the row is deleted on the server', async () => {
    const deleted = vi.spyOn(CometChat, 'deleteMessage').mockResolvedValue({} as never);
    (CometChat as any).discardLocalMessage = () =>
      Promise.reject({ code: 'ERROR_OFFLINE_MESSAGE_NOT_FOUND' });
    const seen = removals();
    const m = own('late', { localMessageId: 'L6', status: 'PENDING' });
    rows = [m];
    await discardOfflineMessageImpl(actx, m);
    expect(seen).toEqual(['L6']);
    const hub = OfflineHub.getInstance();
    hub.reportSendState(own('late', { id: 78, localMessageId: 'L6', status: 'SENT' }), 'sent');
    hub.reportSendState(own('late', { id: 78, localMessageId: 'L6', status: 'SENT' }), 'sent');
    expect(deleted).toHaveBeenCalledTimes(1);
    expect(deleted).toHaveBeenCalledWith('78');
    expect(actx.handleDeleteConfirm).not.toHaveBeenCalled();
    deleted.mockRestore();
  });

  it.each(['Delete', 'Retry'])(
    '%s answered NOT_FOUND on a pending thread reply takes back its reply count',
    async action => {
      (CometChat as any).discardLocalMessage = () =>
        Promise.reject({ code: 'ERROR_OFFLINE_MESSAGE_NOT_FOUND' });
      (CometChat as any).retryMessage = () =>
        Promise.reject({ code: 'ERROR_OFFLINE_MESSAGE_NOT_FOUND' });
      fake.connected = false;
      const counter = new OfflineReplyCount();
      let shown = 5;
      OfflineHub.getInstance().sendState$.subscribe(e => (shown += counter.apply(e, 1001)));
      const reply = own('reply', { localMessageId: 'LR', status: 'PENDING' });
      reply.setParentMessageId(1001);
      OfflineHub.getInstance().reportSendState(reply, 'sending');
      expect(shown).toBe(6);
      rows = [reply];
      if (action === 'Delete') await discardOfflineMessageImpl(actx, reply);
      else await retryOfflineMessageImpl(actx, reply);
      expect(shown).toBe(5);
    }
  );

  it('ERROR_OFFLINE_DISABLED (kill switch): the row is failed (direct), removed from the screen, and the list checks the rest', async () => {
    (CometChat as any).discardLocalMessage = () =>
      Promise.reject({ code: 'ERROR_OFFLINE_DISABLED' });
    const seen = removals();
    const m = own('k', { localMessageId: 'L7', status: 'PENDING' });
    expect(await discardUnsentMessage(m)).toBe('disabled');
    expect(seen).toEqual(['L7']);
    await discardOfflineMessageImpl(actx, own('k2', { localMessageId: 'L8', status: 'PENDING' }));
    expect(actx.messageListService.checkKillSwitch).toHaveBeenCalled();
  });
});
