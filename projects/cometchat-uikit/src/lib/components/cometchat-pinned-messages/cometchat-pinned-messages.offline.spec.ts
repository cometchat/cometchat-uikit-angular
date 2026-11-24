vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatPinnedMessagesComponent } from './cometchat-pinned-messages.component';
import { PinSaveService } from '../../services/pin-save.service';
import { States } from '../../Enums/Enums';
import { installOfflineSdk, OfflineSdkFake } from '../../testing/offline-sdk-fake';
import { NOT_CONNECTED, twoPhaseRequest } from '../../testing/two-phase-request-fake';
import { ConnectionStateService } from '../../services/connection-state.service';
import { setConnection } from '../../testing/connection-driver';

/** The connection drops and comes back, as the SDK reports it. */
function reconnect(): void {
  const connection = TestBed.inject(ConnectionStateService) as any;
  for (const value of [false, true]) {
    setConnection(connection, value);
    TestBed.tick();
  }
}

function pinned(id: number, pinnedAt: number): any {
  return new Proxy(
    { getId: () => id, getPinnedAt: () => pinnedAt, getSentAt: () => 1, getReceiverId: () => 'g1' },
    {
      get(target: any, prop) {
        if (prop in target) return target[prop];
        if (typeof prop !== 'string') return undefined;
        return prop.startsWith('is') || prop.startsWith('has') ? () => false : () => undefined;
      },
    }
  );
}

@Component({
  standalone: true,
  imports: [CometChatPinnedMessagesComponent],
  template: `
    <ng-template #appError><div class="app-error-view">app error</div></ng-template>
    <cometchat-pinned-messages [group]="group" [errorView]="appError" />
  `,
})
class AppErrorHost {
  group!: CometChat.Group;
}

/** Pinned panel, offline path: cached then server, newest pin first (UIT-LIST-03). */
describe('CometChatPinnedMessagesComponent: two-phase', () => {
  let fake: OfflineSdkFake;
  let original: unknown;
  let request: ReturnType<typeof twoPhaseRequest>;

  beforeEach(async () => {
    fake = installOfflineSdk();
    original = (CometChat as any).MessagesRequestBuilder;
    (CometChat as any).MessagesRequestBuilder = class {
      setLimit() {
        return this;
      }
      setPinned() {
        return this;
      }
      setGUID() {
        return this;
      }
      setUID() {
        return this;
      }
      build() {
        return request;
      }
    };
    await TestBed.configureTestingModule({
      imports: [CometChatPinnedMessagesComponent],
      providers: [
        {
          provide: PinSaveService,
          useValue: {
            isSaveEnabled: async () => true,
            isPinEnabled: async () => true,
            isSupported: () => true,
            isSystemPin: () => false,
            run: vi.fn(),
          },
        },
      ],
    }).compileComponents();
  });
  afterEach(() => {
    (CometChat as any).MessagesRequestBuilder = original;
    fake.restore();
    vi.restoreAllMocks();
  });

  function open() {
    const comp = TestBed.createComponent(CometChatPinnedMessagesComponent).componentInstance;
    comp.group = { getGuid: () => 'g1' } as unknown as CometChat.Group;
    return comp;
  }
  const idsOf = (c: CometChatPinnedMessagesComponent) => c.messages().map(m => m.getId());

  it('the cached pins show first; the server list then replaces them in the newest-pin-first order', async () => {
    request = twoPhaseRequest('Messages', [
      { cached: [pinned(1, 10), pinned(2, 20)], server: [pinned(3, 30), pinned(2, 20)] },
    ]);
    const comp = open();
    await (comp as any).load(true);
    // 1 was unpinned elsewhere: gone. 3 is new and sits first.
    expect(idsOf(comp)).toEqual([3, 2]);
    expect(comp.state()).toBe(States.loaded);
  });

  it('D84 rule 2: offline, the cached pins stay with no error view and nothing is reported', async () => {
    request = twoPhaseRequest('Messages', [{ cached: [pinned(1, 10)], error: NOT_CONNECTED }]);
    const comp = open();
    const errors = vi.fn();
    comp.error.subscribe(errors);
    await (comp as any).load(true);
    expect(idsOf(comp)).toEqual([1]);
    expect(comp.state()).toBe(States.loaded);
    expect(comp.offlineConnectToLoad()).toBe(false);
    expect(errors).not.toHaveBeenCalled();
  });

  it('D84 rule 5: a reload the kit starts (cache reset) stays quiet while pins are shown, offline or not', async () => {
    request = twoPhaseRequest('Messages', [{ cached: [pinned(1, 10)], error: NOT_CONNECTED }]);
    const comp = open();
    const errors = vi.fn();
    comp.error.subscribe(errors);
    await (comp as any).load(true, true);
    expect(comp.state()).toBe(States.loaded);
    expect(errors).not.toHaveBeenCalled();
  });

  it('D84 rule 3: offline with nothing cached is "Connect to load messages" (the error state), no Retry, and one onError', async () => {
    request = twoPhaseRequest('Messages', [{ cached: [], error: NOT_CONNECTED }]);
    const fixture = TestBed.createComponent(CometChatPinnedMessagesComponent);
    const comp = fixture.componentInstance;
    comp.group = { getGuid: () => 'g1' } as unknown as CometChat.Group;
    const errors = vi.fn();
    comp.error.subscribe(errors);
    fixture.detectChanges();
    await vi.waitFor(() => expect(comp.state()).toBe(States.error));
    fixture.detectChanges();
    expect(comp.offlineConnectToLoad()).toBe(true);
    expect(errors).toHaveBeenCalledTimes(1);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-cc-reason="connect-to-load"]')?.textContent).toContain('Connect to load messages');
    expect(el.querySelector('.cometchat-pinned-messages__retry')).toBeNull();
  });

  it("D84 rule 3: the app's own error view shows instead of the offline state", async () => {
    request = twoPhaseRequest('Messages', [{ cached: [], error: NOT_CONNECTED }]);
    const fixture = TestBed.createComponent(AppErrorHost);
    fixture.componentInstance.group = { getGuid: () => 'g1' } as unknown as CometChat.Group;
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.nativeElement.querySelector('.app-error-view')).not.toBeNull());
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-cc-reason="connect-to-load"]')).toBeNull();
  });

  it('D84 rule 8: that offline state reads once more by itself on reconnect', async () => {
    request = twoPhaseRequest('Messages', [
      { cached: [], error: NOT_CONNECTED },
      { server: [pinned(1, 10)] },
    ]);
    const fixture = TestBed.createComponent(CometChatPinnedMessagesComponent);
    const comp = fixture.componentInstance;
    comp.group = { getGuid: () => 'g1' } as unknown as CometChat.Group;
    fixture.detectChanges();
    await vi.waitFor(() => expect(comp.state()).toBe(States.error));
    reconnect();
    await vi.waitFor(() => expect(idsOf(comp)).toEqual([1]));
    expect(comp.state()).toBe(States.loaded);
    reconnect();
    await Promise.resolve();
    expect(request.fetchPrevious).toHaveBeenCalledTimes(2);
  });

  it('D84 rule 8: a non-network error is not read again on reconnect', async () => {
    request = twoPhaseRequest('Messages', [{ error: { code: 'ERR_X' } }, { server: [pinned(1, 10)] }]);
    const fixture = TestBed.createComponent(CometChatPinnedMessagesComponent);
    const comp = fixture.componentInstance;
    comp.group = { getGuid: () => 'g1' } as unknown as CometChat.Group;
    fixture.detectChanges();
    await vi.waitFor(() => expect(comp.state()).toBe(States.error));
    reconnect();
    await Promise.resolve();
    expect(request.fetchPrevious).toHaveBeenCalledTimes(1);
  });

  it('D84 rule 6: an empty server list is the empty view', async () => {
    request = twoPhaseRequest('Messages', [{ server: [] }]);
    const comp = open();
    await (comp as any).load(true);
    expect(comp.state()).toBe(States.empty);
  });

  it('D84 rule 5: a server error over cached pins keeps them and reports once', async () => {
    request = twoPhaseRequest('Messages', [{ cached: [pinned(1, 10)], error: { code: 'ERR_X' } }]);
    const comp = open();
    const errors = vi.fn();
    comp.error.subscribe(errors);
    await (comp as any).load(true);
    expect(idsOf(comp)).toEqual([1]);
    expect(comp.state()).toBe(States.loaded);
    expect(errors).toHaveBeenCalledTimes(1);
  });

  it('D84 rule 4: a real error with nothing shown is the error state with Retry, not the offline state', async () => {
    request = twoPhaseRequest('Messages', [{ error: { code: 'ERR_X' } }]);
    const fixture = TestBed.createComponent(CometChatPinnedMessagesComponent);
    const comp = fixture.componentInstance;
    comp.group = { getGuid: () => 'g1' } as unknown as CometChat.Group;
    fixture.detectChanges();
    await vi.waitFor(() => expect(comp.state()).toBe(States.error));
    fixture.detectChanges();
    expect(comp.offlineConnectToLoad()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).querySelector('.cometchat-pinned-messages__retry')).not.toBeNull();
  });

  it('offline off: one plain read (P1)', async () => {
    fake.setEnabled(false);
    request = twoPhaseRequest('Messages', [{ server: [pinned(1, 10)] }]);
    const comp = open();
    await (comp as any).load(true);
    expect(request.fetchPrevious).toHaveBeenCalledWith();
    expect(idsOf(comp)).toEqual([1]);
  });
});
