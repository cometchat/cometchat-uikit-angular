/** Helpers of the offline send path: which SDK send a message uses, and why a send failed. */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { describe, expect, it } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { textMessage } from '../../testing/offline-sdk-fake';
import { OfflineFailureReason } from './identity';
import { failureReasonFromError, isRetryInFlight, QUEUED_ANSWER_WAIT_MS, sendKindOf } from './send';

describe('sendKindOf', () => {
  it('routes text, custom, interactive and media messages to their SDK send', () => {
    expect(sendKindOf(textMessage('a'))).toBe('text');
    expect(sendKindOf(new CometChat.CustomMessage('peer', 'user', 'poll', {}))).toBe('custom');
    expect(sendKindOf({ getCategory: () => 'interactive', getType: () => 'form' } as any)).toBe('interactive');
    expect(sendKindOf({ getCategory: () => 'message', getType: () => 'image' } as any)).toBe('media');
  });
});

describe('failureReasonFromError', () => {
  it('takes a known reason from the argument, the error reason, the code or its details', () => {
    expect(failureReasonFromError({}, OfflineFailureReason.byteOverflow)).toBe('BYTE_OVERFLOW');
    expect(failureReasonFromError({ reason: 'QUEUE_FULL' })).toBe('QUEUE_FULL');
    expect(failureReasonFromError({ code: 'TRANSIENT' })).toBe('TRANSIENT');
    expect(failureReasonFromError({ details: { reason: 'PERMANENT' } })).toBe('PERMANENT');
  });

  it("maps the outbox's queue-limit error code to QUEUE_FULL", () => {
    expect(failureReasonFromError({ code: 'ERROR_PENDING_QUEUE_LIMIT' })).toBe('QUEUE_FULL');
  });

  it('is empty for an error that carries no known reason', () => {
    expect(failureReasonFromError({ code: 'ERR_SOMETHING' })).toBe('');
    expect(failureReasonFromError(null)).toBe('');
  });
});

describe('retry bookkeeping', () => {
  it('a message with no Retry under way is not in flight', () => {
    expect(isRetryInFlight(null)).toBe(false);
    expect(isRetryInFlight(textMessage('a'))).toBe(false);
  });

  it('a send the SDK accepted while connected waits a bounded time for its answer', () => {
    expect(QUEUED_ANSWER_WAIT_MS).toBe(15_000);
  });
});
