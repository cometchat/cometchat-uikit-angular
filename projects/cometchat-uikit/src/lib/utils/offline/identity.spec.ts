/** Row identity and send state helpers of the offline path. */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { describe, expect, it } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { offlineMessage, textMessage } from '../../testing/offline-sdk-fake';
import {
  failureReasonOf,
  isOutboxFailed,
  isSending,
  isSyncDelivered,
  isUnsent,
  localIdOf,
  muidOf,
  OfflineFailureReason,
  OfflineMessageStatus,
  renderKey,
  rowKey,
  serverIdOf,
  statusOf,
} from './identity';

describe('offline identity helpers', () => {
  it('serverIdOf is 0 until the server has acked the message', () => {
    expect(serverIdOf(null)).toBe(0);
    expect(serverIdOf(textMessage('a'))).toBe(0);
    expect(serverIdOf(offlineMessage(textMessage('a'), { id: 42 }))).toBe(42);
  });

  it('localIdOf reads the handle, then falls back to data.localMessageId', () => {
    expect(localIdOf(null)).toBe('');
    expect(localIdOf(offlineMessage(textMessage('a'), { localMessageId: 'L1' }))).toBe('L1');
    const parsed: any = textMessage('b');
    parsed.getData = () => ({ localMessageId: 'L2' });
    expect(localIdOf(parsed)).toBe('L2');
  });

  it('muidOf is the message muid, or empty', () => {
    expect(muidOf(null)).toBe('');
    expect(muidOf(offlineMessage(textMessage('a'), { muid: 'M1' }))).toBe('M1');
  });

  it('statusOf never reports a call status as a send state', () => {
    const call: any = { getCategory: () => 'call', getStatus: () => 'ongoing' };
    expect(statusOf(call)).toBe('');
    expect(statusOf(offlineMessage(textMessage('a'), { status: 'SENDING' }))).toBe('SENDING');
  });

  it('failureReasonOf and isSyncDelivered read the SDK accessors', () => {
    const failed = offlineMessage(textMessage('a'), { status: 'FAILED', failureReason: OfflineFailureReason.queueFull, source: 'SYNC' });
    expect(failureReasonOf(failed)).toBe('QUEUE_FULL');
    expect(isSyncDelivered(failed)).toBe(true);
    expect(isSyncDelivered(textMessage('b'))).toBe(false);
  });

  it('isUnsent: PENDING, SENDING and FAILED rows, and a row with no server id but a handle', () => {
    for (const status of ['PENDING', 'SENDING', 'FAILED']) {
      expect(isUnsent(offlineMessage(textMessage('a'), { status }))).toBe(true);
    }
    expect(isUnsent(offlineMessage(textMessage('a'), { id: 5, status: OfflineMessageStatus.sent }))).toBe(false);
    expect(isUnsent(offlineMessage(textMessage('a'), { localMessageId: 'L' }))).toBe(true);
    expect(isUnsent(null)).toBe(false);
  });

  it('isSending and isOutboxFailed tell the states apart', () => {
    expect(isSending(offlineMessage(textMessage('a'), { status: 'PENDING' }))).toBe(true);
    expect(isSending(offlineMessage(textMessage('a'), { status: 'FAILED' }))).toBe(false);
    expect(isOutboxFailed(offlineMessage(textMessage('a'), { status: 'FAILED' }))).toBe(true);
  });

  it('rowKey prefers the server id, then the local handle, then the muid', () => {
    expect(rowKey(offlineMessage(textMessage('a'), { id: 7, localMessageId: 'L', muid: 'M' }))).toBe('s:7');
    expect(rowKey(offlineMessage(textMessage('a'), { localMessageId: 'L', muid: 'M' }))).toBe('l:L');
    expect(rowKey(offlineMessage(textMessage('a'), { muid: 'M' }))).toBe('m:M');
  });

  it('renderKey keeps an own message on one key and keys another sender by server id', () => {
    const own = offlineMessage(textMessage('a'), { id: 9, localMessageId: 'L', muid: 'M' });
    own.setSender(new CometChat.User('me'));
    expect(renderKey(own, 'me')).toBe('l:L');
    const theirs = offlineMessage(textMessage('b'), { id: 10, muid: 'M' });
    theirs.setSender(new CometChat.User('peer'));
    expect(renderKey(theirs, 'me')).toBe('s:10');
  });
});
