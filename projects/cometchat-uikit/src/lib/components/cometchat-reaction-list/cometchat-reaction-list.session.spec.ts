vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChatReactionListComponent } from './cometchat-reaction-list.component';
import { installOfflineSdk, OfflineSdkFake } from '../../testing/offline-sdk-fake';
import { NOT_CONNECTED, twoPhaseRequest } from '../../testing/two-phase-request-fake';
import { OfflineHub } from '../../utils/offline/offline-hub';

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));
const reaction = (emoji: string, uid: string): any => ({ getReaction: () => emoji, getUid: () => uid, getReactedBy: () => ({ getUid: () => uid, getName: () => uid, getAvatar: () => '' }) });

/** UIK-LIFE-01/02 for the reactions list. */
describe('CometChatReactionListComponent: session lifecycle', () => {
  let fake: OfflineSdkFake;
  let hub: OfflineHub;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    hub = OfflineHub.getInstance();
    hub.start();
    hub.onLogin({ getUid: () => 'alice' } as any);
  });
  afterEach(() => { fake.restore(); OfflineHub.resetForTests(); });

  function open(calls: Parameters<typeof twoPhaseRequest>[1]) {
    const request = twoPhaseRequest('Reactions', calls);
    const comp = TestBed.createComponent(CometChatReactionListComponent).componentInstance;
    comp.reactionsRequestBuilder = { build: () => request } as any;
    comp.message = { getId: () => 1 } as any;
    return { comp, request };
  }

  it('clears on a user switch', async () => {
    const { comp } = open([{ server: [reaction('a', 'u1')] }]);
    await comp.fetchReactions();
    expect(comp.filteredReactions()).toHaveLength(1);
    hub.onLogin({ getUid: () => 'bob' } as any);
    expect(comp.filteredReactions()).toEqual([]);
  });

  it('ENG-57325: a user switch drops the "Connect to load" state, so the cleared list shows no counts from the old message', async () => {
    const { comp } = open([{ error: NOT_CONNECTED }]);
    comp.message = { getId: () => 1, getReactions: () => [{ getReaction: () => 'a', getCount: () => 2 }] } as any;
    await comp.fetchReactions();
    expect(comp.offlineConnectToLoad()).toBe(true);
    expect(comp.totalReactionCount()).toBe(2);
    hub.onLogin({ getUid: () => 'bob' } as any);
    expect(comp.offlineConnectToLoad()).toBe(false);
    expect(comp.totalReactionCount()).toBe(0);
    expect(comp.emojiTabs()).toEqual([]);
  });

  it('reloads two-phase on a cache reset', async () => {
    const { comp, request } = open([{ server: [reaction('a', 'u1')] }, { cached: [reaction('a', 'u2')], server: [reaction('a', 'u2')] }]);
    await comp.fetchReactions();
    fake.fire('cacheReset', 'onOfflineCacheReset', 'CORRUPT', 0);
    await flush();
    expect(request.fetchNext).toHaveBeenCalledTimes(2);
    expect(comp.filteredReactions().map(r => r.getUid())).toEqual(['u2']);
  });

  it('offline off: a session event leaves the list alone (P1)', async () => {
    fake.setEnabled(false);
    const { comp } = open([{ server: [reaction('a', 'u1')] }]);
    await comp.fetchReactions();
    hub.onLogin({ getUid: () => 'bob' } as any);
    expect(comp.filteredReactions()).toHaveLength(1);
  });
});
