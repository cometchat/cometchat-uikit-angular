/** The identifiers the offline conformance runners read from the DOM. */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { offlineMessage, textMessage } from '../testing/offline-sdk-fake';
import { OfflineHub } from './offline/offline-hub';
import { contractMessageState, contractServerId } from './state-contract';

describe('state contract', () => {
  beforeEach(() => OfflineHub.resetForTests());
  afterEach(() => OfflineHub.resetForTests());

  it('a message with no server id is sending', () => {
    expect(contractMessageState(offlineMessage(textMessage('a'), { localMessageId: 'L' }))).toBe('sending');
  });

  it('an outbox-failed message, or one carrying an error, is failed', () => {
    expect(contractMessageState(offlineMessage(textMessage('a'), { status: 'FAILED' }))).toBe('failed');
    const withError: any = offlineMessage(textMessage('b'), { id: 4 });
    withError.error = { code: 'X' };
    expect(contractMessageState(withError)).toBe('failed');
  });

  it('an acked message is sent, delivered or read by its receipts', () => {
    const acked: any = offlineMessage(textMessage('a'), { id: 5, status: 'SENT' });
    expect(contractMessageState(acked)).toBe('sent');
    acked.getDeliveredAt = () => 10;
    expect(contractMessageState(acked)).toBe('delivered');
    acked.getReadAt = () => 11;
    expect(contractMessageState(acked)).toBe('read');
  });

  it('contractServerId is empty while the row has no server id', () => {
    expect(contractServerId(textMessage('a'))).toBe('');
    expect(contractServerId(offlineMessage(textMessage('a'), { id: 12 }))).toBe('12');
  });
});
