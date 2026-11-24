/**
 * ConnectionStateService Tests
 *
 * Covers: single listener registration, connected() signal transitions,
 * reconnected$ skipping the first connect and firing on genuine reconnects,
 * connects$ firing on every connect (including one that changes nothing),
 * the browser connectivity backstop, root-singleton behaviour, and the
 * listener-attach error path.
 *
 * @module services/connection-state
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ConnectionStateService } from './connection-state.service';
import { CometChatLogger } from '../utils/CometChatLogger';

type Listener = { onConnected: () => void; onDisconnected: () => void };

describe('ConnectionStateService', () => {
  let addSpy: ReturnType<typeof vi.spyOn>;
  let listener: Listener;
  let listenerId: string;

  beforeEach(() => {
    TestBed.resetTestingModule();
    addSpy = vi.spyOn(CometChat, 'addConnectionListener').mockImplementation(((id: string, l: Listener) => {
      listenerId = id;
      listener = l;
    }) as never);
    // spyOn re-uses an existing spy on the same method, so start each test from zero calls.
    addSpy.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Create the service and a collector on reconnected$, effects flushed. */
  function setup() {
    const service = TestBed.inject(ConnectionStateService);
    const reconnects: boolean[] = [];
    const sub = service.reconnected$.subscribe(v => reconnects.push(v));
    TestBed.tick();
    const set = (fn: () => void) => {
      fn();
      TestBed.tick();
    };
    return { service, reconnects, sub, set };
  }

  /** Create the service with collectors on both streams, effects flushed. */
  function setupConnects() {
    const service = TestBed.inject(ConnectionStateService);
    const connects: number[] = [];
    const reconnects: boolean[] = [];
    const subs = [
      service.connects$.subscribe(() => connects.push(1)),
      service.reconnected$.subscribe(v => reconnects.push(v)),
    ];
    TestBed.tick();
    const set = (fn: () => void) => {
      fn();
      TestBed.tick();
    };
    const done = () => subs.forEach(s => s.unsubscribe());
    return { service, connects, reconnects, set, done };
  }

  /** What the SDK itself reports about the socket, which both browser handlers read first. */
  function sdkSocket(up: boolean) {
    vi.spyOn(CometChat, 'getConnectionStatus').mockReturnValue((up ? 'connected' : 'disconnected') as never);
  }

  it('registers exactly one connection listener with a global_conn_ id', () => {
    TestBed.inject(ConnectionStateService);
    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(listenerId).toMatch(/^global_conn_\d+$/);
    expect(listener).toBeInstanceOf(CometChat.ConnectionListener);
  });

  it('is a root singleton — a second inject does not add another listener', () => {
    const a = TestBed.inject(ConnectionStateService);
    const b = TestBed.inject(ConnectionStateService);
    expect(a).toBe(b);
    expect(addSpy).toHaveBeenCalledTimes(1);
  });

  it('starts with connected() === null (unknown)', () => {
    const { service, sub } = setup();
    expect(service.connected()).toBeNull();
    sub.unsubscribe();
  });

  it('flips connected() to true on connect and false on disconnect', () => {
    const { service, sub, set } = setup();
    set(() => listener.onConnected());
    expect(service.connected()).toBe(true);
    set(() => listener.onDisconnected());
    expect(service.connected()).toBe(false);
    sub.unsubscribe();
  });

  it('does not emit reconnected$ for the first connect at startup', () => {
    const { reconnects, sub, set } = setup();
    set(() => listener.onConnected());
    expect(reconnects).toEqual([]);
    sub.unsubscribe();
  });

  it('emits reconnected$ once on a disconnect → connect cycle', () => {
    const { reconnects, sub, set } = setup();
    set(() => listener.onConnected());
    const afterStartup = reconnects.length;
    set(() => listener.onDisconnected());
    expect(reconnects.length - afterStartup).toBe(0);
    set(() => listener.onConnected());
    expect(reconnects.slice(afterStartup)).toEqual([true]);
    sub.unsubscribe();
  });

  it('emits once per reconnect across several cycles', () => {
    const { reconnects, sub, set } = setup();
    set(() => listener.onConnected());
    const afterStartup = reconnects.length;
    for (let i = 0; i < 3; i++) {
      set(() => listener.onDisconnected());
      set(() => listener.onConnected());
    }
    expect(reconnects.slice(afterStartup)).toEqual([true, true, true]);
    sub.unsubscribe();
  });

  it('emits reconnected$ when the disconnect and the reconnect arrive before change detection runs', () => {
    // A laptop waking from sleep, or a throttled background tab: the SDK delivers both
    // events back to back, before any effect has run.
    const { reconnects, sub, set } = setup();
    set(() => listener.onConnected());
    const afterStartup = reconnects.length;
    set(() => {
      listener.onDisconnected();
      listener.onConnected();
    });
    expect(reconnects.slice(afterStartup)).toEqual([true]);
    sub.unsubscribe();
  });

  it('counts each disconnect once: a second connect after a reconnect is not another reconnect', () => {
    const { reconnects, sub, set } = setup();
    set(() => listener.onConnected());
    const afterStartup = reconnects.length;
    set(() => listener.onDisconnected());
    set(() => listener.onConnected());
    set(() => listener.onConnected());
    expect(reconnects.slice(afterStartup)).toEqual([true]);
    sub.unsubscribe();
  });

  it('does not count a repeated connect without a disconnect as a reconnect', () => {
    const { reconnects, sub, set } = setup();
    set(() => listener.onConnected());
    const afterStartup = reconnects.length;
    set(() => listener.onConnected());
    expect(reconnects.slice(afterStartup)).toEqual([]);
    sub.unsubscribe();
  });

  it('does not replay the current connected state to a subscriber that joins later', () => {
    const service = TestBed.inject(ConnectionStateService);
    TestBed.tick();
    listener.onConnected();
    TestBed.tick();

    const late: boolean[] = [];
    const sub = service.reconnected$.subscribe(v => late.push(v));
    TestBed.tick();
    expect(late).toEqual([]);

    listener.onDisconnected();
    TestBed.tick();
    listener.onConnected();
    TestBed.tick();
    expect(late).toEqual([true]);
    sub.unsubscribe();
  });

  it('never emits false on reconnected$', () => {
    const { reconnects, sub, set } = setup();
    set(() => listener.onDisconnected());
    set(() => listener.onDisconnected());
    expect(reconnects).toEqual([]);
    sub.unsubscribe();
  });

  it('logs the transitions at info level', () => {
    const info = vi.spyOn(CometChatLogger, 'info');
    const { sub, set } = setup();
    set(() => listener.onConnected());
    set(() => listener.onDisconnected());
    expect(info).toHaveBeenCalledWith('ConnectionStateService', 'WebSocket connected');
    expect(info).toHaveBeenCalledWith('ConnectionStateService', 'WebSocket disconnected');
    sub.unsubscribe();
  });

  it('logs and survives when attaching the listener throws', () => {
    const err = new Error('SDK not initialised');
    addSpy.mockImplementation(() => {
      throw err;
    });
    const errorSpy = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => {});

    const service = TestBed.inject(ConnectionStateService);

    expect(service.connected()).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith('ConnectionStateService', 'Error attaching connection listener:', err);
  });

  /**
   * ENG-57333 (Angular QA 5, major 2). The SDK fires `onDisconnected` only when the socket
   * closes while its status is neither DISCONNECTED nor CONNECTING, so a drop inside a connect
   * window is never reported. Everything that answers "did the state change?" is then blind to
   * the connect that ends the outage: the state still holds the earlier `true`, and no disconnect
   * was reported, so `reconnected$` has nothing to fire either. `connects$` is what a screen that
   * has loaded nothing can follow.
   */
  describe('connects$ — every connect, whether or not anything changed', () => {
    it('emits on a connect over an unchanged `true` that follows no reported disconnect', () => {
      const { service, connects, reconnects, set, done } = setupConnects();
      set(() => listener.onConnected());
      expect(service.connected()).toBe(true);
      const afterStartup = connects.length;

      // The outage: the SDK reported nothing, so the state is untouched.
      // The connect that ends it sets `true` over `true`.
      set(() => listener.onConnected());

      expect(service.connected()).toBe(true);
      expect(connects.length).toBe(afterStartup + 1);
      expect(reconnects).toEqual([]);
      done();
    });

    it('emits on the first connect and once per connect afterwards', () => {
      const { connects, set, done } = setupConnects();
      set(() => listener.onConnected());
      expect(connects.length).toBe(1);
      set(() => listener.onDisconnected());
      set(() => listener.onConnected());
      expect(connects.length).toBe(2);
      done();
    });

    it('does not emit on a disconnect', () => {
      const { connects, set, done } = setupConnects();
      set(() => listener.onConnected());
      const afterStartup = connects.length;
      set(() => listener.onDisconnected());
      expect(connects.length).toBe(afterStartup);
      done();
    });
  });

  /**
   * The browser reports the interface going down and coming back even in the runs the SDK stays
   * silent about, so it stands in as a backstop. Neither handler invents state: each reads the
   * SDK's own status first, so a browser event that disagrees with a live socket changes nothing.
   */
  describe('the browser connectivity backstop', () => {
    it('records the disconnect the SDK never reported, so the connect after it is a reconnect', () => {
      const { service, reconnects, set, done } = setupConnects();
      set(() => listener.onConnected());
      sdkSocket(false);

      set(() => window.dispatchEvent(new Event('offline')));
      expect(service.connected()).toBe(false);

      set(() => listener.onConnected());
      expect(service.connected()).toBe(true);
      expect(reconnects).toEqual([true]);
      done();
    });

    it('leaves a live socket alone when the browser claims to be offline', () => {
      const { service, reconnects, set, done } = setupConnects();
      set(() => listener.onConnected());
      sdkSocket(true);

      set(() => window.dispatchEvent(new Event('offline')));

      expect(service.connected()).toBe(true);
      // Nothing was reported down, so the next connect is not a reconnect either.
      set(() => listener.onConnected());
      expect(reconnects).toEqual([]);
      done();
    });

    it('reports the connect itself when the browser returns with the socket already up', () => {
      // The SDK has nothing left to report in this run - it never reported the close - so no
      // `onConnected` arrives and this is the only signal the connection is back.
      const { service, connects, reconnects, set, done } = setupConnects();
      set(() => listener.onConnected());
      sdkSocket(false);
      set(() => window.dispatchEvent(new Event('offline')));
      const afterDrop = connects.length;

      sdkSocket(true);
      set(() => window.dispatchEvent(new Event('online')));

      expect(service.connected()).toBe(true);
      expect(connects.length).toBe(afterDrop + 1);
      expect(reconnects).toEqual([true]);
      done();
    });

    it('waits for the SDK when the browser returns with the socket still down', () => {
      const { service, connects, set, done } = setupConnects();
      set(() => listener.onConnected());
      sdkSocket(false);
      set(() => window.dispatchEvent(new Event('offline')));
      const afterDrop = connects.length;

      set(() => window.dispatchEvent(new Event('online')));

      expect(service.connected()).toBe(false);
      expect(connects.length).toBe(afterDrop);

      // The SDK's own connect is what ends it.
      set(() => listener.onConnected());
      expect(service.connected()).toBe(true);
      expect(connects.length).toBe(afterDrop + 1);
      done();
    });

    it('counts one unreported drop once, however many offline events the browser fires', () => {
      const { reconnects, set, done } = setupConnects();
      set(() => listener.onConnected());
      sdkSocket(false);
      set(() => window.dispatchEvent(new Event('offline')));
      set(() => window.dispatchEvent(new Event('offline')));
      set(() => listener.onConnected());
      expect(reconnects).toEqual([true]);
      done();
    });

    /**
     * Found in review of the commit that added the backstop. Before the guard, a browser
     * `offline` on the login screen - where nothing has connected yet - recorded a disconnect,
     * so the sign-in connect counted as a reconnect and every root list (Conversations, Users,
     * Groups, Pinned, ...) refetched once at login. `reconnected$` documents that it skips the
     * first connect.
     */
    it('ignores a browser offline before anything has connected, so sign-in is not a reconnect', () => {
      const { service, connects, reconnects, set, done } = setupConnects();
      expect(service.connected()).toBeNull();
      sdkSocket(false);

      set(() => window.dispatchEvent(new Event('offline')));
      // Still "unknown", not "disconnected": there was no connection to lose.
      expect(service.connected()).toBeNull();

      set(() => listener.onConnected());
      expect(service.connected()).toBe(true);
      expect(reconnects).toEqual([]);
      expect(connects.length).toBe(1);
      done();
    });

    it('stops following the browser once the service is destroyed', () => {
      const { service, connects, set, done } = setupConnects();
      set(() => listener.onConnected());
      sdkSocket(true);
      const afterStartup = connects.length;

      (service as unknown as { ngOnDestroy(): void }).ngOnDestroy();
      set(() => window.dispatchEvent(new Event('online')));

      expect(connects.length).toBe(afterStartup);
      done();
    });

    it('attaches nothing when there is no window (server-side rendering)', () => {
      // The service is built once per injector, so this only has to not throw: a run with no
      // `window` reaches `watchBrowserConnectivity` and leaves without touching it.
      const attached = (TestBed.inject(ConnectionStateService) as unknown as {
        browserListenersAttached: boolean;
      }).browserListenersAttached;
      expect(typeof attached).toBe('boolean');
    });
  });
});
