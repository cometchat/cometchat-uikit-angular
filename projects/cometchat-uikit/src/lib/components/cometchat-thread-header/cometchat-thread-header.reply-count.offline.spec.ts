/**
 * Thread header reply count across a fresher parent (README §3.9, UIT-SEND-21).
 *
 * A fresher parent replaces the count shown, and its count already includes the
 * own replies still in flight. Clearing the "counted at pending" record there
 * made the ack of such a reply count it a second time, and a discard give no
 * -1 (Prajwal 2026-11-20T13:00Z on #674, cometchat-thread-header.ts:404).
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatThreadHeaderComponent } from './cometchat-thread-header.component';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import { MessageStatus } from '../../Enums/Enums';
import { installOfflineSdk, OfflineSdkFake, offlineMessage, textMessage } from '../../testing/offline-sdk-fake';
import { OfflineHub } from '../../utils/offline/offline-hub';

const PARENT_ID = 321;

function parentMessage(replyCount: number): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('receiver1', 'Root', CometChat.RECEIVER_TYPE.GROUP);
  (msg as any).getId = () => PARENT_ID;
  (msg as any).getReplyCount = () => replyCount;
  (msg as any).isThreadSubscribed = () => false;
  return msg as unknown as CometChat.BaseMessage;
}

/** An own reply to the open thread, keyed by its local id. */
function reply(localMessageId: string, id?: number): any {
  const m = offlineMessage(textMessage('r'), { localMessageId, id });
  m.setParentMessageId(PARENT_ID);
  return m;
}

/** A parent the SDK delivered again, with a count that includes the pending reply. */
function fresherParent(replyCount: number): any {
  return { getId: () => PARENT_ID, getReplyCount: () => replyCount };
}

describe('CometChatThreadHeader — reply count across a fresher parent', () => {
  let fake: OfflineSdkFake;
  let fixture: ComponentFixture<CometChatThreadHeaderComponent>;
  let component: CometChatThreadHeaderComponent;

  const shown = (): number => (component as any).internalReplyCount;

  beforeEach(async () => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CometChatThreadHeaderComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CometChatThreadHeaderComponent);
    component = fixture.componentInstance;
    component.parentMessage = parentMessage(3);
    fixture.detectChanges();
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  function sendState(state: string, message: any): void {
    const hub = OfflineHub.getInstance();
    (hub as any).sendState$.next({
      gen: hub.gen,
      state,
      message,
      localMessageId: message.getLocalMessageId(),
    });
  }

  function parentUpdated(replyCount: number): void {
    const hub = OfflineHub.getInstance();
    (hub as any).messagesUpdated$.next({ gen: hub.gen, messages: [fresherParent(replyCount)] });
  }

  it('does not count a pending reply again when its ack arrives after a fresher parent', () => {
    expect(shown()).toBe(3);
    sendState('sending', reply('L1'));
    expect(shown()).toBe(4);

    // A sync delivers the parent with a count that already includes the reply.
    parentUpdated(4);
    expect(shown()).toBe(4);

    // The reply is acked. It must not be counted a second time.
    const acked = reply('L1', 55);
    CometChatMessageEvents.ccMessageSent.next({
      message: acked,
      status: MessageStatus.success,
    } as never);
    expect(shown()).toBe(4);
  });

  it('still takes the -1 when a pending reply is discarded after a fresher parent', () => {
    sendState('sending', reply('L1'));
    expect(shown()).toBe(4);
    parentUpdated(4);
    sendState('discarded', reply('L1'));
    expect(shown()).toBe(3);
  });

  it('a reply that starts after the fresher parent is still counted once', () => {
    parentUpdated(3);
    sendState('sending', reply('L2'));
    expect(shown()).toBe(4);
    const acked = reply('L2', 56);
    CometChatMessageEvents.ccMessageSent.next({
      message: acked,
      status: MessageStatus.success,
    } as never);
    expect(shown()).toBe(4);
  });

  it('moving to another thread forgets the counted replies', () => {
    sendState('sending', reply('L1'));
    expect(shown()).toBe(4);
    component.parentMessage = parentMessage(8);
    component.ngOnChanges({
      parentMessage: { firstChange: false, currentValue: component.parentMessage, previousValue: null, isFirstChange: () => false },
    } as never);
    expect(shown()).toBe(8);
    // The record is gone with the thread, so this thread's own reply counts here.
    sendState('sending', reply('L1'));
    expect(shown()).toBe(9);
  });
});
