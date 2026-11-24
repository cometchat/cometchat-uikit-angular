/**
 * ENG-57333: a chat that was opened with no connection must load when the connection arrives,
 * even when the SDK never reported a disconnect before it, and even when the only row the list
 * holds is the user's own message queued from the "Connect to load messages" screen.
 *
 * The SDK fires `onDisconnected` only when the socket closes while its status is neither
 * DISCONNECTED nor CONNECTING (`CometChat.js`, WS ready-state CLOSED branch), so an app opened
 * with no network - and a drop inside the launch connect window, while the status is still
 * CONNECTING - is never reported. `ConnectionStateService` takes a reconnect from the SDK events
 * (a connect that follows a disconnect, `connection-state.service.ts:66-85`), so nothing reaches
 * `reconnected$` in those runs: the connect itself is the list's only signal.
 *
 * Android reloads an empty list once per connection from `onConnected`
 * (`MessageListOfflineSync.kt:60-73`), not once per reconnect.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKit } from '../cometchat-uikit';
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

describe('offline: the first connection loads a chat opened with no connection (ENG-57333)', () => {
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
    vi.restoreAllMocks();
    fake.restore();
    OfflineHub.resetForTests();
    TestBed.resetTestingModule();
  });

  /**
   * The app opened with no connection: the SDK reported nothing at all, so the connect that
   * follows is not a "reconnect". Before the fix the list stayed on "Connect to load messages"
   * for the rest of the session and only a reopen loaded it.
   */
  it('loads the first page on a connect that no disconnect was reported before', async () => {
    await service.fetchPreviousMessages();
    expect(service.errorState()).not.toBeNull();
    expect(service.allMessagesSignal()).toHaveLength(0);
    expect(read.state.reads).toBe(1);

    fake.connected = true;
    read.state.online = true;
    // The session's first connection event: `disconnectedSinceConnect` is still false, so
    // `reconnected$` does not emit.
    setConnection(connection, true);
    TestBed.tick();

    await vi.waitFor(() => expect(service.allMessagesSignal()).toHaveLength(1));
    expect(read.state.reads).toBe(2);
    expect(service.errorState()).toBeNull();
  });

  /**
   * A message queued from the "Connect to load messages" screen is a row in the list, but not one
   * the server has. Before the fix it counted as "this list has content", so the reload on
   * reconnect gave up and the error view stayed up until the chat was reopened.
   */
  it('loads the first page on reconnect when the only row is an own queued message', async () => {
    setConnection(connection, false);
    await service.fetchPreviousMessages();
    expect(service.errorState()).not.toBeNull();

    vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue({ getUid: () => 'me' } as any);
    const queued = offlineMessage(textMessage('sent while offline', 'bea'), {
      muid: 'muid-1',
      localMessageId: 'local-1',
      status: 'pending',
      sentAt: 50,
    });
    queued.setSender({ getUid: () => 'me' } as any);
    fake.fire('offline', 'onOutboxMessagePending', queued);
    expect(service.allMessagesSignal()).toHaveLength(1);

    fake.connected = true;
    read.state.online = true;
    setConnection(connection, true);
    TestBed.tick();

    await vi.waitFor(() => expect(read.state.reads).toBe(2));
    // The queued row is never dropped by the server page it does not belong to.
    await vi.waitFor(() => expect(service.allMessagesSignal()).toHaveLength(2));
    expect(service.errorState()).toBeNull();
  });

  /**
   * The run Aanshi reported on qa.5 (ENG-57333, Angular QA 5 major 2): sign in, go offline the
   * moment the home screen appears, open a chat that was never opened, come back online. The
   * list stayed on "Connect to load messages" for over a minute, 3 runs out of 3, while live
   * messages still arrived; reopening the chat loaded it.
   *
   * What the two tests above miss is the state the connect lands on. They start from "the SDK
   * reported nothing at all", so the state is still `null` and the connect that ends the outage
   * changes it - which is enough for a stream built on the state to emit, and the reload ran.
   * In this run the sign-in connect was reported first, so the state already held `true`; the
   * drop inside the connect window was not reported; and the connect that ended the outage set
   * `true` over `true`. Nothing changed, so watching the state emitted nothing and the reload
   * this file was written for was unreachable in exactly the run it was written for. The list
   * follows `connects$` instead: the connect itself, change or not.
   */
  it('loads the first page when the drop went unreported and the connect changes nothing', async () => {
    // Signing in connected, and the SDK reported it.
    fake.connected = true;
    setConnection(connection, true);
    TestBed.tick();
    expect(connection.connected()).toBe(true);

    // Offline the moment the home screen appears: the socket was still connecting, so the SDK
    // reports no disconnect and the state keeps the `true` above.
    fake.connected = false;
    const reconnects: boolean[] = [];
    const sub = connection.reconnected$.subscribe(v => reconnects.push(v));

    // A chat that was never opened: nothing cached, the read fails. The list subscribes to the
    // connection as this read starts, and a stream built on the state hands over its current
    // value - the stale `true` - as soon as effects run, which is before this read has failed.
    // That emission finds no error view and does nothing, and it is the only one that run ever
    // produced: the flush is forced here so the ordering is the app's and not the scheduler's.
    const reading = service.fetchPreviousMessages();
    TestBed.tick();
    await reading;
    expect(service.errorState()).not.toBeNull();
    expect(service.allMessagesSignal()).toHaveLength(0);
    expect(read.state.reads).toBe(1);

    // Back online. `onConnected` sets `true` over `true`.
    fake.connected = true;
    read.state.online = true;
    setConnection(connection, true);
    TestBed.tick();

    await vi.waitFor(() => expect(service.allMessagesSignal()).toHaveLength(1));
    expect(read.state.reads).toBe(2);
    expect(service.errorState()).toBeNull();
    // The state never changed and no disconnect was reported, so neither of the other two
    // streams could have driven this read.
    expect(connection.connected()).toBe(true);
    expect(reconnects).toEqual([]);
    sub.unsubscribe();
  });
});
