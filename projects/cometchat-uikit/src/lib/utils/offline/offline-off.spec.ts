/**
 * Offline OFF is today's kit (P1): L1 checks behind UIT-OFF-04/06/07.
 * The E2E side (UIT-OFF-01/02/03) is in e2e/offline/offline-messaging.spec.ts.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import { installOfflineSdk, OfflineSdkFake, textMessage } from '../../testing/offline-sdk-fake';
import { isOfflineOn } from './offline-gate';
import { OfflineHub } from './offline-hub';
import { CometChatUIKit } from '../../cometchat-uikit';

describe('offline OFF: the hub is inert (UIT-OFF-04)', () => {
  let fake: OfflineSdkFake;
  afterEach(() => {
    fake?.restore();
    OfflineHub.resetForTests();
    vi.restoreAllMocks();
  });

  it('on an SDK without offline support, starting the hub registers nothing', () => {
    fake = installOfflineSdk({ bare: true });
    OfflineHub.resetForTests();
    OfflineHub.getInstance().start();
    const registrations = fake.calls.filter(c => /^add.*Listener$/.test(c.name));
    expect(registrations).toEqual([]);
  });

  it('starting the hub creates no timer, on either SDK', () => {
    for (const options of [{ bare: true }, { enabled: false }]) {
      fake = installOfflineSdk(options);
      OfflineHub.resetForTests();
      const timeout = vi.spyOn(globalThis, 'setTimeout');
      const interval = vi.spyOn(globalThis, 'setInterval');
      OfflineHub.getInstance().start();
      expect(timeout).not.toHaveBeenCalled();
      expect(interval).not.toHaveBeenCalled();
      vi.restoreAllMocks();
      fake.restore();
    }
  });

  it('with offline off, no hub stream emits and no extra public event fires for a send', async () => {
    fake = installOfflineSdk({ enabled: false });
    OfflineHub.resetForTests();
    const hub = OfflineHub.getInstance();
    hub.start();
    const seen: string[] = [];
    const subs = [
      hub.sendState$.subscribe(() => seen.push('sendState')),
      hub.messageSync$.subscribe(() => seen.push('messageSync')),
      hub.conversationSync$.subscribe(() => seen.push('conversationSync')),
      hub.cacheReset$.subscribe(() => seen.push('cacheReset')),
      hub.notice$.subscribe(() => seen.push('notice')),
      CometChatMessageEvents.ccMessageSendStateChanged.subscribe(() =>
        seen.push('ccMessageSendStateChanged')
      ),
      CometChatMessageEvents.ccOfflineCacheReset.subscribe(() => seen.push('ccOfflineCacheReset')),
    ];
    expect(isOfflineOn()).toBe(false);
    // Today's statics path: the Promise form, no listener, nothing through the hub.
    await CometChatUIKit.sendTextMessage(textMessage('x')).catch(() => undefined);
    const [, listener] = fake.callsTo('sendMessage')[0] ?? [];
    expect(listener).toBeUndefined();
    subs.forEach(s => s.unsubscribe());
    expect(seen).toEqual([]);
  });
});

describe('the gate (UIT-OFF-06)', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    fake = installOfflineSdk({ enabled: false });
  });
  afterEach(() => fake.restore());

  it('is read on every call and never stored', () => {
    expect(isOfflineOn()).toBe(false);
    fake.setEnabled(true);
    expect(isOfflineOn()).toBe(true);
    fake.setEnabled(false);
    expect(isOfflineOn()).toBe(false);
  });
});

describe('an SDK before offline support (UIT-OFF-07)', () => {
  let fake: OfflineSdkFake;
  afterEach(() => fake.restore());

  it("reports offline off and keeps the kit on today's path", () => {
    fake = installOfflineSdk({ bare: true });
    expect(isOfflineOn()).toBe(false);
  });
});
