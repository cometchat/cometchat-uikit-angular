vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { installOfflineSdk, OfflineSdkFake } from '../testing/offline-sdk-fake';
import { OfflineHub } from '../utils/offline/offline-hub';
import { ConversationsService } from './conversations.service';

const conv = (id: string): any => ({
  getConversationId: () => id,
  getConversationType: () => 'user',
  // A real User: the entity id of a 1:1 chat is told from a group's by instanceof.
  getConversationWith: () => Object.assign(Object.create(CometChat.User.prototype), { getUid: () => id }),
  getLastMessage: () => undefined,
  isPinned: () => false,
  getUnreadMessageCount: () => 0,
});
const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

describe('conversation list: a load-more asked for while page one is still being read (offline on)', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    TestBed.configureTestingModule({});
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    TestBed.resetTestingModule();
  });

  it('waits for page one, then loads the next page without losing its rows', async () => {
    const service = TestBed.inject(ConversationsService);
    const listeners: any[] = [];
    const request = {
      fetchNext: vi.fn((listener: any) => {
        listeners.push(listener);
        return new Promise(() => undefined);
      }),
    };
    const first = service.fetchConversations({ build: () => request } as any);
    // The cached page paints and ends the loading state; the server read is still running.
    listeners[0].onCachedConversations([conv('a'), conv('b')]);
    expect(service.getConversations().map(c => c.getConversationId())).toEqual(['a', 'b']);

    await service.fetchNextConversations();
    expect(request.fetchNext).toHaveBeenCalledTimes(1);

    listeners[0].onServerConversations([conv('a'), conv('b')]);
    await first;
    await flush();
    // The deferred load-more ran once page one landed.
    expect(request.fetchNext).toHaveBeenCalledTimes(2);
    listeners[1].onServerConversations([conv('c')]);
    await flush();
    expect(service.getConversations().map(c => c.getConversationId())).toEqual(['a', 'b', 'c']);
  });

  it('a logout drops the deferred load-more', async () => {
    const service = TestBed.inject(ConversationsService);
    const listeners: any[] = [];
    const request = {
      fetchNext: vi.fn((listener: any) => {
        listeners.push(listener);
        return new Promise(() => undefined);
      }),
    };
    void service.fetchConversations({ build: () => request } as any);
    listeners[0].onCachedConversations([conv('a')]);
    await service.fetchNextConversations();
    OfflineHub.getInstance().endSession();
    listeners[0].onServerConversations([conv('a')]);
    await flush();
    expect(request.fetchNext).toHaveBeenCalledTimes(1);
  });
});
