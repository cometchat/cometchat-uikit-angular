vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSavedMessagesComponent } from './cometchat-saved-messages.component';
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

function saved(id: number, sentAt = 1_700_000_000 + id): any {
  return new Proxy(
    {
      getId: () => id,
      getSentAt: () => sentAt,
      getReceiverId: () => 'bob',
      getReceiverType: () => 'user',
      getSender: () => ({ getUid: () => 'bob' }),
    },
    {
      get(target: any, prop) {
        if (prop in target) return target[prop];
        if (typeof prop !== 'string') return undefined;
        return prop.startsWith('is') || prop.startsWith('has') ? () => false : () => undefined;
      },
    }
  );
}

const scrollToEnd = () =>
  ({ target: { scrollHeight: 1000, scrollTop: 900, clientHeight: 100 } }) as unknown as Event;

/** Saved panel, offline path: cached then server, server order, "load more" never repeats (UIT-LIST-03, -10). */
describe('CometChatSavedMessagesComponent: two-phase', () => {
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
      setSaved() {
        return this;
      }
      build() {
        return request;
      }
    };
    await TestBed.configureTestingModule({
      imports: [CometChatSavedMessagesComponent],
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

  const open = () => TestBed.createComponent(CometChatSavedMessagesComponent).componentInstance;
  const idsOf = (c: CometChatSavedMessagesComponent) => c.rows().map(r => r.message.getId());

  it('shows the cached list at once, then the server list replaces it (a row unsaved elsewhere goes away)', async () => {
    request = twoPhaseRequest('Messages', [
      { cached: [saved(1), saved(2)], server: [saved(2), saved(3)] },
    ]);
    const comp = open();
    const painted: number[][] = [];
    const rows = comp.rows;
    const set = rows.set.bind(rows);
    rows.set = (value: any) => {
      painted.push(value.map((r: any) => r.message.getId()));
      set(value);
    };
    await (comp as any).load();
    expect(painted[0]).toEqual([2, 1]);
    expect(idsOf(comp)).toEqual([3, 2]);
    expect(comp.state()).toBe(States.loaded);
  });

  it('D84 rule 2: offline with a cached list keeps the rows, no error view, and reports nothing', async () => {
    request = twoPhaseRequest('Messages', [{ cached: [saved(1)], error: NOT_CONNECTED }]);
    const comp = open();
    const errors = vi.fn();
    comp.error.subscribe(errors);
    await (comp as any).load();
    expect(idsOf(comp)).toEqual([1]);
    expect(comp.state()).toBe(States.loaded);
    expect(comp.offlineConnectToLoad()).toBe(false);
    expect(errors).not.toHaveBeenCalled();
  });

  it('D84 rule 5: a reload the kit starts (cache reset) stays quiet while rows are shown', async () => {
    request = twoPhaseRequest('Messages', [{ cached: [saved(1)], error: NOT_CONNECTED }]);
    const comp = open();
    const errors = vi.fn();
    comp.error.subscribe(errors);
    await (comp as any).load(true);
    expect(comp.state()).toBe(States.loaded);
    expect(errors).not.toHaveBeenCalled();
  });

  it('D84 rule 3: offline with nothing cached is "Connect to load messages" (the error state), no Retry, and one onError', async () => {
    request = twoPhaseRequest('Messages', [{ cached: [], error: NOT_CONNECTED }]);
    const fixture = TestBed.createComponent(CometChatSavedMessagesComponent);
    const comp = fixture.componentInstance;
    const errors = vi.fn();
    comp.error.subscribe(errors);
    fixture.detectChanges();
    await vi.waitFor(() => expect(comp.state()).toBe(States.error));
    fixture.detectChanges();
    expect(comp.offlineConnectToLoad()).toBe(true);
    expect(errors).toHaveBeenCalledTimes(1);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-cc-reason="connect-to-load"]')?.textContent).toContain('Connect to load messages');
    expect(el.querySelector('.cometchat-saved-messages__retry')).toBeNull();
  });

  it('D84 rule 4: a real error with nothing cached is the error view with Retry, not the offline state', async () => {
    request = twoPhaseRequest('Messages', [{ error: { code: 'ERR_X' } }]);
    const fixture = TestBed.createComponent(CometChatSavedMessagesComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    await vi.waitFor(() => expect(comp.state()).toBe(States.error));
    fixture.detectChanges();
    expect(comp.offlineConnectToLoad()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).querySelector('.cometchat-saved-messages__retry')).not.toBeNull();
  });

  it('D84 rule 5: a server error over cached rows keeps them and reports once', async () => {
    request = twoPhaseRequest('Messages', [{ cached: [saved(1)], error: { code: 'ERR_X' } }]);
    const comp = open();
    const errors = vi.fn();
    comp.error.subscribe(errors);
    await (comp as any).load();
    expect(idsOf(comp)).toEqual([1]);
    expect(comp.state()).toBe(States.loaded);
    expect(errors).toHaveBeenCalledTimes(1);
  });

  it('D84 rule 8: that offline state reads once more by itself on reconnect; a non-network error does not', async () => {
    request = twoPhaseRequest('Messages', [
      { cached: [], error: NOT_CONNECTED },
      { server: [saved(1)] },
    ]);
    const fixture = TestBed.createComponent(CometChatSavedMessagesComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    await vi.waitFor(() => expect(comp.state()).toBe(States.error));
    reconnect();
    await vi.waitFor(() => expect(idsOf(comp)).toEqual([1]));
    expect(comp.state()).toBe(States.loaded);
    reconnect();
    await Promise.resolve();
    expect(request.fetchPrevious).toHaveBeenCalledTimes(2);

    request = twoPhaseRequest('Messages', [{ error: { code: 'ERR_X' } }, { server: [saved(2)] }]);
    const other = TestBed.createComponent(CometChatSavedMessagesComponent);
    other.detectChanges();
    await vi.waitFor(() => expect(other.componentInstance.state()).toBe(States.error));
    reconnect();
    await Promise.resolve();
    expect(request.fetchPrevious).toHaveBeenCalledTimes(1);
  });

  it('D84 rule 6: an empty server list is the empty view', async () => {
    request = twoPhaseRequest('Messages', [{ server: [] }]);
    const comp = open();
    await (comp as any).load();
    expect(comp.state()).toBe(States.empty);
  });

  it('"load more" never repeats or skips a row', async () => {
    const page1 = Array.from({ length: 30 }, (_, i) => saved(100 - i));
    request = twoPhaseRequest('Messages', [
      { server: page1 },
      { cached: [saved(70), saved(69)], server: [saved(70), saved(69), saved(68)] },
    ]);
    const comp = open();
    await (comp as any).load();
    await comp.onListScroll(scrollToEnd());
    const ids = idsOf(comp);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.slice(-3)).toEqual([70, 69, 68]);
    expect(ids).toHaveLength(33);
  });

  it('offline "load more" past the cache keeps the rows and tries again on the next scroll', async () => {
    request = twoPhaseRequest('Messages', [
      { server: Array.from({ length: 30 }, (_, i) => saved(100 - i)) },
      { error: NOT_CONNECTED },
    ]);
    const comp = open();
    await (comp as any).load();
    await comp.onListScroll(scrollToEnd());
    expect(comp.rows()).toHaveLength(30);
    expect((comp as any).hasMore()).toBe(true);
  });

  it('offline off: one plain read per page (P1)', async () => {
    fake.setEnabled(false);
    request = twoPhaseRequest('Messages', [{ server: [saved(1)] }]);
    const comp = open();
    await (comp as any).load();
    expect(request.fetchPrevious).toHaveBeenCalledWith();
    expect(idsOf(comp)).toEqual([1]);
  });

  /**
   * How a page decides there is another one (Prajwal 2026-11-20T11:54Z on #674).
   *
   * A two-phase page paints its cached half first, so by the time the server
   * half lands its rows are already on screen. Reading "how many rows were
   * new" as "is there more" therefore ended a warm-cache list at the first
   * scroll, with 30 of 100 saves shown and no way to reach the rest.
   */
  describe('deciding whether another page exists', () => {
    it('a full page the cached half already painted does not end the list', async () => {
      const page1 = Array.from({ length: 30 }, (_, i) => saved(100 - i));
      const page2 = Array.from({ length: 30 }, (_, i) => saved(70 - i));
      request = twoPhaseRequest('Messages', [
        { server: page1 },
        // The cache holds this whole page, so the server half brings no new row.
        { cached: page2, server: page2 },
      ]);
      const comp = open();
      await (comp as any).load();
      await comp.onListScroll(scrollToEnd());

      expect(comp.rows()).toHaveLength(60);
      expect((comp as any).hasMore()).toBe(true);
      expect(comp.hasMoreToShow()).toBe(true);
    });

    it('a short page ends the list even when every row of it is new', async () => {
      request = twoPhaseRequest('Messages', [
        { server: Array.from({ length: 30 }, (_, i) => saved(100 - i)) },
        { server: [saved(70), saved(69)] },
      ]);
      const comp = open();
      await (comp as any).load();
      await comp.onListScroll(scrollToEnd());

      expect(comp.rows()).toHaveLength(32);
      expect((comp as any).hasMore()).toBe(false);
    });

    it('the same page arriving again ends the list, full or not', async () => {
      const page1 = Array.from({ length: 30 }, (_, i) => saved(100 - i));
      // A cursor that cannot advance: the server hands back the page it just gave.
      request = twoPhaseRequest('Messages', [{ server: page1 }, { server: [...page1] }]);
      const comp = open();
      await (comp as any).load();
      await comp.onListScroll(scrollToEnd());

      expect(comp.rows()).toHaveLength(30);
      expect((comp as any).hasMore()).toBe(false);
    });

    it('a reload forgets the last page, so the list is pageable again', async () => {
      const page1 = Array.from({ length: 30 }, (_, i) => saved(100 - i));
      request = twoPhaseRequest('Messages', [{ server: page1 }, { server: [...page1] }]);
      const comp = open();
      await (comp as any).load();
      await comp.onListScroll(scrollToEnd());
      expect((comp as any).hasMore()).toBe(false);

      request = twoPhaseRequest('Messages', [{ server: page1 }]);
      await (comp as any).load();
      expect((comp as any).hasMore()).toBe(true);
    });
  });
});
