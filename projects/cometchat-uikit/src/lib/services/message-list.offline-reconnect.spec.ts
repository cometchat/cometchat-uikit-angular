/**
 * Offline (D83): a chat opened offline with nothing saved shows the error view; when the
 * connection returns, the list reads its first page once by itself. This goes through the real
 * `ConnectionStateService` (a reconnect is taken from the SDK's connect events), not through
 * `handleReconnectionImpl` called by hand, so a list that nothing wires to the reconnect fails here.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  installOfflineSdk,
  OfflineSdkFake,
  offlineMessage,
  textMessage,
} from '../testing/offline-sdk-fake';
import { setConnection } from '../testing/connection-driver';
import { OfflineHub } from '../utils/offline/offline-hub';
import { ConnectionStateService } from './connection-state.service';
import { MessageListService } from './message-list.service';

const NOT_CONNECTED = { code: 'ERROR_INTERNET_UNAVAILABLE' };
const row = (text: string, id: number) => offlineMessage(textMessage(text), { id, sentAt: id });

/** A request that fails offline with nothing saved, then answers one server page once online. */
function request() {
  const state = { online: false, reads: 0 };
  return {
    state,
    fetchPrevious(listener: any) {
      state.reads++;
      if (state.online) listener.onServerMessages([row('message 1', 11)]);
      else {
        listener.onCachedMessages([]);
        listener.onError(NOT_CONNECTED);
      }
      return Promise.reject({});
    },
    fetchNext: () => Promise.reject({}),
  } as any;
}

describe('offline: the connection returning reloads a chat that was opened offline (D83)', () => {
  let fake: OfflineSdkFake;
  let service: any;
  let connection: ConnectionStateService;
  let read: ReturnType<typeof request>;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    fake.connected = false;
    OfflineHub.getInstance().start();
    TestBed.configureTestingModule({ providers: [MessageListService] });
    service = TestBed.inject(MessageListService);
    connection = TestBed.inject(ConnectionStateService);
    read = request();
    service.setUser(new CometChat.User('bea'));
    service.buildMessagesRequest = () => read;
    service.buildNextMessagesRequest = () => read;
    service.messagesRequest = read;
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    TestBed.resetTestingModule();
  });

  it('shows the error view offline, then loads the first page by itself on reconnect, with nothing to tap', async () => {
    setConnection(connection, false);
    await service.fetchPreviousMessages();
    expect(service.errorState()).not.toBeNull();
    expect(service.allMessagesSignal()).toHaveLength(0);
    expect(read.state.reads).toBe(1);

    fake.connected = true;
    read.state.online = true;
    setConnection(connection, true);
    await vi.waitFor(() => expect(service.allMessagesSignal()).toHaveLength(1));
    expect(service.errorState()).toBeNull();
    expect(read.state.reads).toBe(2);
  });

  it('reads once per reconnect: a second reconnect over the loaded messages makes no read', async () => {
    setConnection(connection, false);
    await service.fetchPreviousMessages();
    fake.connected = true;
    read.state.online = true;
    setConnection(connection, true);
    await vi.waitFor(() => expect(service.allMessagesSignal()).toHaveLength(1));
    setConnection(connection, false);
    setConnection(connection, true);
    await Promise.resolve();
    expect(read.state.reads).toBe(2);
  });

  it('a chat closed before the connection returns is not reopened by it', async () => {
    setConnection(connection, false);
    await service.fetchPreviousMessages();
    service.clearConversation();
    fake.connected = true;
    read.state.online = true;
    setConnection(connection, true);
    await Promise.resolve();
    expect(read.state.reads).toBe(1);
    expect(service.allMessagesSignal()).toHaveLength(0);
  });
});

/**
 * ENG-57322: a jump to a message that is not saved, made while the SDK has not yet noticed the
 * lost connection, keeps the rows; when the connection returns the blocked edge loads once and
 * the jump is not retried (Android MessageListOfflineReads.kt @ca5b4e18 :919-933).
 */
describe('offline: a jump to a message that is not saved, then the connection returns (ENG-57322)', () => {
  let fake: OfflineSdkFake;
  let service: any;
  let connection: ConnectionStateService;

  /** Offline reads: the newest page has rows 11-12 saved; around any other message nothing is saved. */
  const offlineRead = (saved: CometChat.BaseMessage[]) =>
    ({
      fetchPrevious(listener: any) {
        listener.onCachedMessages(saved);
        listener.onError(NOT_CONNECTED);
        return Promise.reject({});
      },
      fetchNext(listener: any) {
        return this.fetchPrevious(listener);
      },
    }) as any;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    fake.connected = false;
    OfflineHub.getInstance().start();
    TestBed.configureTestingModule({ providers: [MessageListService] });
    service = TestBed.inject(MessageListService);
    connection = TestBed.inject(ConnectionStateService);
    service.setUser(new CometChat.User('bea'));
    const newest = offlineRead([row('message 11', 11), row('message 12', 12)]);
    service.buildMessagesRequest = (id?: number) => (id ? offlineRead([]) : newest);
    service.buildNextMessagesRequest = () => offlineRead([]);
    service.messagesRequest = newest;
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    TestBed.resetTestingModule();
  });

  it('keeps the rows and the "Connect to load more" edge, then loads that edge once on reconnect without retrying the jump', async () => {
    setConnection(connection, false);
    await service.fetchPreviousMessages();
    const rows = service.allMessagesSignal();
    expect(rows).toHaveLength(2);
    expect(service.offlineBlockedEdges()).toEqual({ previous: true, next: false });

    // The SDK has not noticed the lost connection yet (~15-18 s on the JS SDK).
    fake.connected = true;
    fake.singleReads.push(l => l.onError({ code: 'FAILED_TO_FETCH' }));
    const errors: unknown[] = [];
    service.loadError$.subscribe((e: unknown) => errors.push(e));
    await service.fetchMessagesAroundId(99);
    expect(service.allMessagesSignal()).toBe(rows);
    expect(service.errorState()).toBeNull();
    expect(service.loadingState()).toBe(false);
    expect(service.offlineBlockedEdges()).toEqual({ previous: true, next: false });
    expect(errors).toEqual([]);

    let edgeReloads = 0;
    service.edgeReload$.subscribe(() => edgeReloads++);
    setConnection(connection, true);
    await vi.waitFor(() => expect(edgeReloads).toBe(1));
    expect(fake.callsTo('getMessageDetails')).toHaveLength(1);
    expect(service.allMessagesSignal()).toBe(rows);
  });
});

describe('offline off: the list does not watch the connection', () => {
  afterEach(() => {
    OfflineHub.resetForTests();
    TestBed.resetTestingModule();
  });

  it('a list that never read through the offline path adds no connection listener', async () => {
    OfflineHub.resetForTests();
    const fake = installOfflineSdk({ enabled: false });
    const add = vi.spyOn(CometChat, 'addConnectionListener');
    add.mockClear();
    TestBed.configureTestingModule({ providers: [MessageListService] });
    const service: any = TestBed.inject(MessageListService);
    service.setUser(new CometChat.User('bea'));
    service.messagesRequest = { fetchPrevious: () => Promise.resolve([]) };
    await service.fetchPreviousMessages();
    expect(add).not.toHaveBeenCalled();
    add.mockRestore();
    fake.restore();
  });
});
