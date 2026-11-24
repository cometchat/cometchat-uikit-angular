vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { installOfflineSdk, OfflineSdkFake } from '../testing/offline-sdk-fake';
import { OfflineHub } from '../utils/offline/offline-hub';
import { CometChatUIKit } from '../cometchat-uikit';
import { ConversationsService } from './conversations.service';

/** A row as the list loaded it: named, with an avatar, a last message and unread messages. */
function loadedRow(uid: string, name: string, unread: number): CometChat.Conversation {
  const user = new CometChat.User(uid);
  user.setName(name);
  user.setAvatar(`https://cdn.example.com/${uid}.png`);
  const last = new CometChat.TextMessage(uid, `hello from ${name}`, CometChat.RECEIVER_TYPE.USER);
  return new CometChat.Conversation(`me_user_${uid}`, CometChat.RECEIVER_TYPE.USER, last, user, unread, [], 0, '', '');
}

/**
 * What another device's pin event delivers (captured live): the user carries only its uid, there is
 * no last message and no unread count. Only the pin state is real.
 */
function partialPinEvent(uid: string, pinnedAt?: number): CometChat.Conversation {
  const event = new CometChat.Conversation(
    `me_user_${uid}`, CometChat.RECEIVER_TYPE.USER, undefined, new CometChat.User(uid), 0, [], 0, '', ''
  );
  event.setPinnedAt(pinnedAt);
  event.setPinnedBy(pinnedAt ? 'me' : undefined);
  return event;
}

describe('conversation list: a pin event from another device keeps the row (BUG-11)', () => {
  let fake: OfflineSdkFake;
  let service: ConversationsService;
  let getConversation: ReturnType<typeof vi.fn>;
  const rows = () => (service as any).allConversationsSignal() as CometChat.Conversation[];
  const shown = () => service.conversations();
  const set = (list: CometChat.Conversation[]) => {
    (service as any).allConversationsSignal.set(list);
    (service as any).conversationsSignal.set(list);
  };
  const expectRowKept = (row: CometChat.Conversation, name: string, uid: string, unread: number) => {
    const user = row.getConversationWith() as CometChat.User;
    expect(user.getName()).toBe(name);
    expect(user.getAvatar()).toBe(`https://cdn.example.com/${uid}.png`);
    expect((row.getLastMessage() as CometChat.TextMessage).getText()).toBe(`hello from ${name}`);
    expect(row.getUnreadMessageCount()).toBe(unread);
  };

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    getConversation = vi.fn();
    Object.defineProperty(CometChat, 'getConversation', { value: getConversation, configurable: true, writable: true });
    vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue({ getUid: () => 'me' } as any);
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConversationsService);
    set([loadedRow('bea', 'Bea', 0), loadedRow('susan', 'Susan Marie', 3)]);
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('offline off: a partial pin event keeps the name, avatar, last message and unread count, and sorts the row first', () => {
    const loaded = rows()[1];
    expect(service.applyPinState(partialPinEvent('susan', 1795000000000))).toBe(true);

    const first = shown()[0];
    expect(first.getConversationId()).toBe('me_user_susan');
    expect(first.isPinned()).toBe(true);
    expect(first.getPinnedAt()).toBe(1795000000000);
    expectRowKept(first, 'Susan Marie', 'susan', 3);
    // A new object, so OnPush rows repaint; the loaded one is left as it was.
    expect(first).toBeInstanceOf(CometChat.Conversation);
    expect(first).not.toBe(loaded);
    expect(loaded.isPinned()).toBe(false);
  });

  it('offline off: a partial unpin event clears the pin and keeps the row', () => {
    service.applyPinState(partialPinEvent('susan', 1795000000000));
    expect(service.applyPinState(partialPinEvent('susan'))).toBe(true);

    const row = rows().find(r => r.getConversationId() === 'me_user_susan')!;
    expect(row.isPinned()).toBe(false);
    expect(row.getPinnedBy()).toBeUndefined();
    expectRowKept(row, 'Susan Marie', 'susan', 3);
    // Back in recency order: second, after Bea.
    expect(shown().map(r => r.getConversationId())).toEqual(['me_user_bea', 'me_user_susan']);
  });

  it('offline off: an event for a chat not in the list changes nothing', () => {
    const before = rows();
    expect(service.applyPinState(partialPinEvent('nobody', 1795000000000))).toBe(false);
    expect(rows()).toBe(before);
  });

  it('offline on: a partial pin event keeps the row and makes no fetch', async () => {
    await service.applyPinEvent(partialPinEvent('susan', 1795000000000));

    const first = shown()[0];
    expect(first.isPinned()).toBe(true);
    expectRowKept(first, 'Susan Marie', 'susan', 3);
    expect(getConversation).not.toHaveBeenCalled();
  });

  it("the acting device's own echo (the call's answer, already swapped in) is applied idempotently", () => {
    const answer = loadedRow('susan', 'Susan Marie', 3);
    answer.setPinnedAt(1795000000000);
    service.replaceConversation(answer); // what handlePinConversationClick does with the call result
    service.applyPinState(answer); // then its own published event reaches the same listener

    const first = shown()[0];
    expect(first.isPinned()).toBe(true);
    expectRowKept(first, 'Susan Marie', 'susan', 3);
    expect(rows()).toHaveLength(2);
  });
});
