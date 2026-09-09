/**
 * Message composer — thread subscription (Case 4) Tests
 *
 * Sending a reply in a thread subscribes the sender server-side. The kit mirrors
 * that: it stamps the message objects it holds and publishes the flip, and it
 * must never re-issue the write the server already made.
 *
 * @module services/message-composer/thread-subscription
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { MessageComposerService } from './message-composer.service';
import { ThreadSubscriptionService } from './thread-subscription.service';

const PARENT_ID = 808;

/** Records the mirrors without touching the bus or the network. */
class ThreadSubscriptionStub {
  mirrored: number[] = [];
  /** Records the token each mirror was handed, so the guard can be asserted. */
  sessions: (number | undefined)[] = [];
  session = 1;
  captureSession = vi.fn(() => this.session);
  mirrorSubscribed = vi.fn((parentMessageId: number, capturedSession?: number) => {
    if (capturedSession !== undefined && capturedSession !== this.session) return;
    this.mirrored.push(parentMessageId);
    this.sessions.push(capturedSession);
  });
}

/**
 * A message the composer hands to the SDK. Only what the mirror touches; the
 * setter writes locally, exactly like the SDK's.
 */
function makeOutgoing(parentMessageId = 0): CometChat.BaseMessage {
  let subscribed = false;
  return {
    getParentMessageId: () => parentMessageId,
    setParentMessageId: vi.fn(),
    isThreadSubscribed: () => subscribed,
    setThreadSubscribed: (value: boolean) => {
      subscribed = value;
    },
  } as unknown as CometChat.BaseMessage;
}

const receiver = { getUid: () => 'someone' } as unknown as CometChat.User;

describe('MessageComposerService — Case 4 mirror', () => {
  let service: MessageComposerService;
  let stub: ThreadSubscriptionStub;

  beforeEach(() => {
    stub = new ThreadSubscriptionStub();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        MessageComposerService,
        { provide: ThreadSubscriptionService, useValue: stub },
      ],
    });
    service = TestBed.inject(MessageComposerService);
    (CometChat as any).subscribeToThread = vi.fn();
  });

  it('stamps the optimistic message before the send leaves', async () => {
    const outgoing = makeOutgoing(PARENT_ID);
    let flagAtSendTime = false;
    (CometChat as any).sendMessage = vi.fn((message: CometChat.BaseMessage) => {
      flagAtSendTime = message.isThreadSubscribed();
      return Promise.resolve(message);
    });

    await service.sendTextMessage(receiver, '', undefined, undefined, undefined, outgoing as any);

    // The optimistic bubble renders from this object long before any response,
    // so its own action sheet has to read "Unsubscribe" from the first frame.
    expect(flagAtSendTime).toBe(true);
  });

  it('stamps the confirmed message and mirrors once the send lands', async () => {
    const confirmed = makeOutgoing(PARENT_ID);
    (CometChat as any).sendMessage = vi.fn(() => Promise.resolve(confirmed));

    await service.sendTextMessage(receiver, '', undefined, undefined, undefined, makeOutgoing(PARENT_ID) as any);

    expect(confirmed.isThreadSubscribed()).toBe(true);
    expect(stub.mirrored).toEqual([PARENT_ID]);
  });

  it('never re-issues the subscribe the server already made', async () => {
    const confirmed = makeOutgoing(PARENT_ID);
    (CometChat as any).sendMessage = vi.fn(() => Promise.resolve(confirmed));

    await service.sendTextMessage(receiver, '', undefined, undefined, undefined, makeOutgoing(PARENT_ID) as any);

    expect((CometChat as any).subscribeToThread).not.toHaveBeenCalled();
  });

  it('leaves a non-threaded send alone', async () => {
    const confirmed = makeOutgoing(0);
    (CometChat as any).sendMessage = vi.fn(() => Promise.resolve(confirmed));

    await service.sendTextMessage(receiver, '', undefined, undefined, undefined, makeOutgoing(0) as any);

    expect(confirmed.isThreadSubscribed()).toBe(false);
    expect(stub.mirrorSubscribed).not.toHaveBeenCalled();
  });

  it('does not mirror when the send fails', async () => {
    (CometChat as any).sendMessage = vi.fn(() => Promise.reject(new Error('offline')));

    const sent = await service.sendTextMessage(
      receiver, '', undefined, undefined, undefined, makeOutgoing(PARENT_ID) as any
    );

    // Nothing reached the server, so nothing subscribed the sender either.
    expect(sent).toBeNull();
    expect(stub.mirrorSubscribed).not.toHaveBeenCalled();
  });

  it('mirrors a threaded media reply too', async () => {
    const confirmed = makeOutgoing(PARENT_ID);
    (CometChat as any).sendMediaMessage = vi.fn(() => Promise.resolve(confirmed));

    await service.sendMediaMessage(
      receiver, new File([''], 'a.png'), 'image', undefined, undefined, undefined,
      makeOutgoing(PARENT_ID) as any
    );

    expect(confirmed.isThreadSubscribed()).toBe(true);
    expect(stub.mirrored).toEqual([PARENT_ID]);
  });

  it('mirrors a threaded sticker too', async () => {
    const confirmed = makeOutgoing(PARENT_ID);
    (CometChat as any).sendCustomMessage = vi.fn(() => Promise.resolve(confirmed));

    await service.sendStickerMessage(
      receiver, 'url', 'name', undefined, undefined, makeOutgoing(PARENT_ID) as any
    );

    expect(confirmed.isThreadSubscribed()).toBe(true);
    expect(stub.mirrored).toEqual([PARENT_ID]);
  });
});
