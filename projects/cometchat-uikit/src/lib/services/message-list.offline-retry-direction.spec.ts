/**
 * Offline "Connect to load more": the tap retries the edge that was blocked
 * (Android `retryLoadMore`: the older edge first, else the newer one), not
 * always the older one.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  installOfflineSdk,
  OfflineSdkFake,
  offlineMessage,
  textMessage,
} from '../testing/offline-sdk-fake';
import { OfflineHub } from '../utils/offline/offline-hub';
import { MessageListService } from './message-list.service';

const row = (text: string, id: number) => offlineMessage(textMessage(text), { id, sentAt: id });

/** A request whose reads fail offline (after one cached row), or answer a server page. */
function request() {
  const reads: string[] = [];
  let online = false;
  return {
    reads,
    goOnline: () => (online = true),
    fetchPrevious(listener: any) {
      reads.push('previous');
      return this.answer(listener);
    },
    fetchNext(listener: any) {
      reads.push('next');
      return this.answer(listener);
    },
    answer(listener: any) {
      if (online) listener.onServerMessages([row('server', 40)]);
      else {
        listener.onCachedMessages([row('cached', 7)]);
        listener.onError({ code: 'FAILED_TO_FETCH' });
      }
      return Promise.reject({});
    },
  } as any;
}

describe('"Connect to load more" retries the blocked edge', () => {
  let fake: OfflineSdkFake;
  let service: any;
  let older: ReturnType<typeof request>;
  let newer: ReturnType<typeof request>;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    fake.connected = false;
    OfflineHub.getInstance().start();
    TestBed.configureTestingModule({ providers: [MessageListService] });
    service = TestBed.inject(MessageListService);
    older = request();
    newer = request();
    // A read moves the cursors and rebuilds both requests: hand back the same scripted ones.
    service.buildMessagesRequest = () => older;
    service.buildNextMessagesRequest = () => newer;
    service.messagesRequest = older;
    service.nextMessagesRequest = newer;
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    TestBed.resetTestingModule();
  });

  it('a failed read of newer messages is retried as a read of newer messages', async () => {
    await service.fetchNextMessages();
    expect(service.offlineFooter()).toBe('connect_to_load_more');
    fake.connected = true;
    older.goOnline();
    newer.goOnline();
    await service.retryOfflineRead();
    expect(newer.reads).toEqual(['next', 'next']);
    expect(older.reads).toEqual([]);
  });

  it('a failed read of older messages is still retried as older', async () => {
    await service.fetchPreviousMessages();
    fake.connected = true;
    older.goOnline();
    await service.retryOfflineRead();
    expect(older.reads).toEqual(['previous', 'previous']);
    expect(newer.reads).toEqual([]);
  });

  it('with both edges blocked the older edge is retried first', async () => {
    await service.fetchNextMessages();
    await service.fetchPreviousMessages();
    fake.connected = true;
    older.goOnline();
    await service.retryOfflineRead();
    expect(older.reads).toEqual(['previous', 'previous']);
    expect(newer.reads).toEqual(['next']);
  });

  it('says which edge a tap will read, so the list updates the right paging flag', async () => {
    await service.fetchNextMessages();
    expect(service.offlineRetryDirection()).toBe('next');
    await service.fetchPreviousMessages();
    expect(service.offlineRetryDirection()).toBe('previous');
  });
});
