/**
 * ConnectionStateService Tests
 *
 * Covers: single listener registration, connected() signal transitions,
 * reconnected$ skipping the first connect and firing on genuine reconnects,
 * root-singleton behaviour, and the listener-attach error path.
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
});
