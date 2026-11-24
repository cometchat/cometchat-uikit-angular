/** Offline support: the bubble's row states (README §3.4): "Not sent yet" next to the clock, Retry only where it can work. */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageBubbleComponent } from './cometchat-message-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { installOfflineSdk, OfflineSdkFake, offlineMessage } from '../../testing/offline-sdk-fake';
import { OfflineHub } from '../../utils/offline/offline-hub';
import { CometChatUIKit } from '../../cometchat-uikit';

function own(state: Parameters<typeof offlineMessage>[1]): CometChat.TextMessage {
  const m = new CometChat.TextMessage('sam', 'hello', 'user');
  const sender = new CometChat.User('alex');
  sender.setName('Alex');
  m.setSender(sender);
  return offlineMessage(m, { sentAt: 1_700_000_000, ...state });
}

describe('message bubble: offline row states', () => {
  let fake: OfflineSdkFake;
  let fixture: ComponentFixture<CometChatMessageBubbleComponent>;

  beforeEach(async () => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(new CometChat.User('alex'));
    await TestBed.configureTestingModule({
      imports: [CometChatMessageBubbleComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CometChatMessageBubbleComponent);
    fixture.componentInstance.alignment = MessageBubbleAlignment.right;
    fixture.componentInstance.loggedInUser = new CometChat.User('alex');
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  const render = (message: CometChat.BaseMessage) => {
    fixture.componentRef.setInput('message', message);
    fixture.componentInstance.loggedInUser = new CometChat.User('alex');
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('a pending own message shows "Not sent yet" next to the clock (hidden from screen readers; the clock carries it)', () => {
    const el = render(own({ localMessageId: 'L1', status: 'PENDING' }));
    const caption = el.querySelector('[data-testid="offline-pending"]');
    expect(caption).not.toBeNull();
    expect(caption!.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('.cometchat-receipts-wait')).not.toBeNull();
    expect(el.querySelector('[data-testid="offline-retry"]')).toBeNull();
  });

  it('a failed message offers the inline Retry whatever the reason (R162)', () => {
    let el = render(own({ localMessageId: 'L2', status: 'FAILED', failureReason: 'TRANSIENT' }));
    expect(el.querySelector('[data-testid="offline-retry"]')).not.toBeNull();
    expect(el.querySelector('[data-testid="offline-pending"]')).toBeNull();
    for (const reason of ['PERMANENT', 'DISCARDED', 'QUEUE_OVERFLOW', '']) {
      el = render(own({ localMessageId: 'L3', status: 'FAILED', failureReason: reason }));
      expect(el.querySelector('[data-testid="offline-retry"]'), reason).not.toBeNull();
      expect(el.querySelector('.cometchat-receipts-error'), reason).not.toBeNull();
    }
  });

  it("offline off: no caption, no Retry, today's receipt", () => {
    fake.setEnabled(false);
    const el = render(own({ localMessageId: 'L4', status: 'PENDING', id: 5 }));
    expect(el.querySelector('[data-testid="offline-pending"]')).toBeNull();
    expect(el.querySelector('[data-testid="offline-retry"]')).toBeNull();
  });
});
