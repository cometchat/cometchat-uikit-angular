/**
 * What a failed send leaves on the message, with offline ON and OFF
 * (Prajwal 2026-11-20T11:54Z on #674).
 *
 * The offline-off `send*` statics stamp the error on the message as
 * `metadata.error` before they reject, and app code reads it to tell why a
 * send failed. The offline path goes straight to the offline send helper, so
 * it has to stamp it too or that metadata is simply missing with offline on.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKit } from './cometchat-uikit';
import { OfflineHub } from './utils/offline/offline-hub';
import {
  installOfflineSdk,
  offlineMessage,
  OfflineSdkFake,
  sendScripts,
  textMessage,
} from './testing/offline-sdk-fake';

/** The error the statics put on a message, whichever path failed. */
function stampedError(message: CometChat.BaseMessage): unknown {
  // `BaseMessage` does not declare the metadata accessors; its concrete
  // message types do, and the kit reads them off the message at runtime.
  const carrier = message as unknown as { getMetadata?: () => unknown };
  const metadata = carrier.getMetadata?.() as Record<string, unknown> | undefined;
  return metadata?.['error'];
}

describe('a failed send stamps metadata.error', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    OfflineHub.getInstance().start();
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    vi.restoreAllMocks();
  });

  it('with offline ON, a refused send carries the error app code reads', async () => {
    // The outbox refuses the send outright: a final failure, not a queue.
    fake.scriptSend(sendScripts.queueFull('L1'));
    const message = textMessage('no room');

    await expect(CometChatUIKit.sendTextMessage(message)).rejects.toBeDefined();

    const error = stampedError(message) as { code?: string } | undefined;
    expect(error).toBeDefined();
    expect(error?.code).toBe('ERROR_PENDING_QUEUE_LIMIT');
  });

  it('keeps metadata the integrator set on the message', async () => {
    fake.scriptSend(sendScripts.queueFull('L2'));
    const message = textMessage('mine');
    message.setMetadata({ myKey: 'keep me' });

    await expect(CometChatUIKit.sendTextMessage(message)).rejects.toBeDefined();

    const metadata = message.getMetadata() as Record<string, unknown>;
    expect(metadata['myKey']).toBe('keep me');
    expect(metadata['error']).toBeDefined();
  });

  it('a media send that is refused carries it too', async () => {
    fake.scriptSend(sendScripts.byteOverflow('L3'));
    const media = new CometChat.MediaMessage(
      'peer',
      { name: 'clip.mp4', type: 'video/mp4', size: 99 } as unknown as File,
      'video',
      CometChat.RECEIVER_TYPE.USER
    );

    await expect(CometChatUIKit.sendMediaMessage(media)).rejects.toBeDefined();

    expect(stampedError(media)).toBeDefined();
  });

  it('a send that succeeds stamps nothing', async () => {
    fake.scriptSend((listener, sending) =>
      listener.onMessageSent?.(offlineMessage(sending, { id: 11, localMessageId: 'L4' }))
    );
    const message = textMessage('fine');

    await CometChatUIKit.sendTextMessage(message);

    expect(stampedError(message)).toBeUndefined();
  });

  it('with offline OFF the error is stamped as before (parity)', async () => {
    fake.restore();
    fake = installOfflineSdk({ enabled: false });
    const failure = { code: 'ERR_NO_NET', message: 'no network' };
    vi.spyOn(CometChat, 'sendMessage').mockRejectedValue(failure as never);
    const message = textMessage('offline off');

    await expect(CometChatUIKit.sendTextMessage(message)).rejects.toBe(failure);

    expect(stampedError(message)).toBe(failure);
  });
});
