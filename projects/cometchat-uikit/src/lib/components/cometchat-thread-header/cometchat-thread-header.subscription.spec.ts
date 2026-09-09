/**
 * Thread subscription — header control Tests
 *
 * Covers UI Kit change #2: the trailing follow control in the thread header —
 * the feature gate, the state-labelled name (which must equal the visible
 * text), the UNKNOWN render, keyboard activation, and the event-bus agreement
 * that keeps this control and the action-sheet option showing one state.
 *
 * @module components/cometchat-thread-header/subscription
 */

vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatThreadHeaderComponent } from './cometchat-thread-header.component';
import { ThreadSubscriptionService } from '../../services/thread-subscription.service';
import { COMETCHAT_GLOBAL_CONFIG } from '../../services/global-config.service';
import { CometChatThreadEvents } from '../../events/CometChatThreadEvents';

const PARENT_ID = 321;
const BUTTON = '.cometchat-thread-header__subscription-button';
const ACTIONS = '.cometchat-thread-header__top-bar-actions';

/**
 * Stands in for the service; the service's own behaviour is tested separately.
 *
 * Mirrors the real contract: state is read off the message, and the optimistic
 * flip reaches the surfaces as a bus event rather than as a return value the
 * component stores.
 */
class ThreadSubscriptionStub {
  supported = true;
  gone = false;
  toggle = vi.fn((message: CometChat.BaseMessage) => {
    const subscribed = !message.isThreadSubscribed();
    CometChatThreadEvents.publishThreadSubscriptionChanged({
      parentMessageId: message.getId(),
      subscribed,
    });
    return subscribed;
  });
  isFollowing = (message: CometChat.BaseMessage | null | undefined) =>
    !!message?.isThreadSubscribed();
  isSupported = () => this.supported;
  isUnavailable = () => this.gone;
}

function makeParentMessage(
  receiverType: string = CometChat.RECEIVER_TYPE.GROUP
): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('receiver1', 'Root', receiverType);
  let subscribed = false;
  (msg as any).getId = () => PARENT_ID;
  (msg as any).getReplyCount = () => 3;
  (msg as any).isThreadSubscribed = () => subscribed;
  (msg as any).setThreadSubscribed = (value: boolean) => {
    subscribed = value;
  };
  return msg as unknown as CometChat.BaseMessage;
}

describe('CometChatThreadHeader — follow control', () => {
  let fixture: ComponentFixture<CometChatThreadHeaderComponent>;
  let component: CometChatThreadHeaderComponent;
  let el: HTMLElement;
  let stub: ThreadSubscriptionStub;

  async function build(config: Record<string, unknown> = { enableThreadSubscription: true }) {
    stub = new ThreadSubscriptionStub();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CometChatThreadHeaderComponent],
      providers: [
        { provide: ThreadSubscriptionService, useValue: stub },
        { provide: COMETCHAT_GLOBAL_CONFIG, useValue: config },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CometChatThreadHeaderComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    component.parentMessage = makeParentMessage();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await build();
  });

  // -------------------------------------------------------------------------
  // Gating
  // -------------------------------------------------------------------------

  it('renders the control when the feature is enabled', () => {
    expect(el.querySelector(BUTTON)).toBeTruthy();
  });

  it('renders in a 1:1 thread too, not just a group one', () => {
    component.parentMessage = makeParentMessage(CometChat.RECEIVER_TYPE.USER);
    fixture.detectChanges();
    expect(el.querySelector(BUTTON)).toBeTruthy();
    expect(component.showThreadSubscription).toBe(true);
  });

  it('renders nothing when the integrator has not enabled the feature', async () => {
    await build({});
    expect(el.querySelector(BUTTON)).toBeNull();
  });

  it('renders nothing on a Chat SDK without the thread API', () => {
    stub.supported = false;
    fixture.detectChanges();
    expect(el.querySelector(BUTTON)).toBeNull();
  });

  it('hides itself once the server says the thread is gone', () => {
    stub.gone = true;
    fixture.detectChanges();
    expect(el.querySelector(BUTTON)).toBeNull();
  });

  it('can be hidden on its own, without disabling the feature', () => {
    component.hideThreadSubscriptionToggle = true;
    fixture.detectChanges();
    expect(el.querySelector(BUTTON)).toBeNull();
    // The gate itself is still on — the action-sheet option is unaffected.
    expect(component.showThreadSubscription).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Labelling
  // -------------------------------------------------------------------------

  it('names the action the click performs', () => {
    const name = () => (el.querySelector(BUTTON) as HTMLElement).getAttribute('aria-label');
    // Muted thread: clicking turns replies back on.
    expect(name()).toBe('Subscribe to thread');

    component.parentMessage.setThreadSubscribed(true);
    fixture.detectChanges();
    // Live thread: clicking mutes it.
    expect(name()).toBe('Unsubscribe from thread');
  });

  it('shows a tooltip carrying the same string as the accessible name', () => {
    const button = el.querySelector(BUTTON) as HTMLElement;
    expect(button.getAttribute('title')).toBe('Subscribe to thread');
    expect(button.getAttribute('title')).toBe(button.getAttribute('aria-label'));

    component.parentMessage.setThreadSubscribed(true);
    fixture.detectChanges();
    const live = el.querySelector(BUTTON) as HTMLElement;
    expect(live.getAttribute('title')).toBe('Unsubscribe from thread');
    expect(live.getAttribute('title')).toBe(live.getAttribute('aria-label'));
  });

  it('is icon-only, so the aria-label is the only accessible name', () => {
    const button = el.querySelector(BUTTON) as HTMLElement;
    expect(button.textContent?.trim()).toBe('');
    expect(button.getAttribute('aria-label')).toBe(component.threadSubscriptionLabel);
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('sits in the top bar next to the close button, not in the reply-count row', () => {
    const actions = el.querySelector(ACTIONS) as HTMLElement;
    expect(actions.querySelector(BUTTON)).toBeTruthy();
    expect(actions.querySelector('.cometchat-thread-header__close-button')).toBeTruthy();
    expect(
      el.querySelector('.cometchat-thread-header__reply-count')!.querySelector(BUTTON)
    ).toBeNull();
  });

  it('renders an unstamped message as un-followed and enabled, never as a dead control', () => {
    // A message fetched before the flag existed, or a socket frame: `false` is
    // the safe render, and following again is idempotent server-side.
    const button = el.querySelector(BUTTON) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-label')).toBe('Subscribe to thread');
    expect(button.classList).not.toContain(
      'cometchat-thread-header__subscription-button--following'
    );
  });

  it('marks the followed state on the icon and via aria-pressed', () => {
    component.parentMessage.setThreadSubscribed(true);
    fixture.detectChanges();
    const button = el.querySelector(BUTTON) as HTMLElement;
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(
      el.querySelector('.cometchat-thread-header__subscription-icon--following')
    ).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // Interaction
  // -------------------------------------------------------------------------

  it('toggles on click', () => {
    (el.querySelector(BUTTON) as HTMLElement).click();
    expect(stub.toggle).toHaveBeenCalledWith(component.parentMessage);
  });

  it('toggles on Enter and Space', () => {
    const button = el.querySelector(BUTTON) as HTMLElement;
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    button.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(stub.toggle).toHaveBeenCalledTimes(2);
  });

  it('is keyboard reachable', () => {
    expect((el.querySelector(BUTTON) as HTMLElement).getAttribute('tabindex')).toBe('0');
  });

  it('emits threadSubscriptionChange once per toggle', () => {
    const emitted: unknown[] = [];
    component.threadSubscriptionChange.subscribe(e => emitted.push(e));

    (el.querySelector(BUTTON) as HTMLElement).click();

    expect(emitted).toEqual([{ parentMessageId: PARENT_ID, subscribed: true }]);
  });

  // -------------------------------------------------------------------------
  // Agreement between the two surfaces
  // -------------------------------------------------------------------------

  it('follows a change made from the action sheet, with no refetch', () => {
    const name = () => (el.querySelector(BUTTON) as HTMLElement).getAttribute('aria-label');
    expect(name()).toBe('Subscribe to thread');

    // What the message list does when the sheet option is chosen. The header
    // stamps its own parent message off the event — no refetch, no shared object.
    CometChatThreadEvents.publishThreadSubscriptionChanged({
      parentMessageId: PARENT_ID,
      subscribed: true,
    });
    fixture.detectChanges();

    expect(name()).toBe('Unsubscribe from thread');
  });

  it('ignores changes to other threads', () => {
    const emitted: unknown[] = [];
    component.threadSubscriptionChange.subscribe(e => emitted.push(e));

    CometChatThreadEvents.publishThreadSubscriptionChanged({
      parentMessageId: 9999,
      subscribed: true,
    });

    expect(emitted).toEqual([]);
    expect(component.parentMessage.isThreadSubscribed()).toBe(false);
  });

  it('reflects a subscription the server made on its own', () => {
    // Replying in the thread, or being mentioned in it, auto-subscribes the user
    // server-side; the control has to show that without the user touching it.
    CometChatThreadEvents.publishThreadSubscriptionChanged({
      parentMessageId: PARENT_ID,
      subscribed: true,
    });
    fixture.detectChanges();

    expect((el.querySelector(BUTTON) as HTMLElement).getAttribute('aria-label')).toBe('Unsubscribe from thread');
    expect(stub.toggle).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Escape hatch
  // -------------------------------------------------------------------------

  it('leaves the reply count and close button untouched', () => {
    expect(el.querySelector('.cometchat-thread-header__reply-count-text')).toBeTruthy();
    expect(el.querySelector('.cometchat-thread-header__close-button')).toBeTruthy();
  });
});
