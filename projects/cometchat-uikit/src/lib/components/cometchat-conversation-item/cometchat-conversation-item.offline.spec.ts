/** The conversation preview of an own unsent message (offline support; UIT-CONV-02/03). */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  installOfflineSdk,
  OfflineSdkFake,
  offlineMessage,
  textMessage,
} from '../../testing/offline-sdk-fake';
import { OfflineHub } from '../../utils/offline/offline-hub';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatConversationItemComponent } from './cometchat-conversation-item.component';
import { getReceiptStatus, isPreviewSendFailed } from './cometchat-conversation-item.utils';

describe('conversation preview receipt (offline path)', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('a waiting own preview shows the clock, never a sent tick', () => {
    const m = offlineMessage(textMessage('x'), {
      localMessageId: 'L',
      status: 'PENDING',
      sentAt: 100,
    });
    expect(getReceiptStatus(m, true)).toBe('wait');
    expect(isPreviewSendFailed(m, true)).toBe(false);
  });

  it("a failed own preview shows the error mark; receiptStatus keeps today's members (README P2)", () => {
    const outbox = offlineMessage(textMessage('x'), {
      localMessageId: 'L',
      status: 'FAILED',
      sentAt: 100,
    });
    expect(isPreviewSendFailed(outbox, true)).toBe(true);
    expect(getReceiptStatus(outbox, true)).toBeNull();
    const direct = offlineMessage(textMessage('y'), { muid: 'M', sentAt: 100 });
    OfflineHub.getInstance().reportSendState(direct, 'failed', {
      direct: true,
      reason: 'QUEUE_FULL',
    });
    expect(isPreviewSendFailed(direct, true)).toBe(true);
  });

  it("offline off: today's receipt, no failed mark", () => {
    fake.setEnabled(false);
    const m = offlineMessage(textMessage('x'), {
      localMessageId: 'L',
      status: 'FAILED',
      sentAt: 100,
    });
    expect(isPreviewSendFailed(m, true)).toBe(false);
    expect(getReceiptStatus(m, true)).toBe('sent');
  });
});

/**
 * A failed own preview is in the row's screen-reader label: the red mark itself is aria-hidden.
 * Android announces it too (CometChatReceipts: ERROR -> `cometchat_a11y_message_error`).
 */
describe('conversation row label names a failed preview', () => {
  const label = (self: Record<string, unknown>): string =>
    (
      Object.getOwnPropertyDescriptor(
        CometChatConversationItemComponent.prototype,
        'accessibleLabel'
      )!.get as () => string
    ).call({
      conversationWith: Object.assign(new CometChat.User('sam'), { name: 'Sam' }),
      subtitleText: 'Hello',
      unreadCount: 0,
      isPinned: false,
      previewSendFailed: false,
      ...self,
    });

  it('adds "message failed to send" when the preview failed', () => {
    const failed = CometChatLocalize.getLocalizedString('accessibility_message_failed');
    expect(failed).not.toBe('accessibility_message_failed');
    expect(label({ previewSendFailed: true })).toContain(failed);
  });

  it('leaves the label as it was when the preview did not fail', () => {
    expect(label({ previewSendFailed: false })).not.toContain(
      CometChatLocalize.getLocalizedString('accessibility_message_failed')
    );
  });
});
