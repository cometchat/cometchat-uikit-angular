/** Swept group actions (README §3.7, UIT-SYNC-13): replayed through the live handlers and the kit's group events. */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Subject } from 'rxjs';
import { CometChatGroupEvents } from '../../events/CometChatGroupEvents';
import { installOfflineSdk, OfflineSdkFake } from '../../testing/offline-sdk-fake';
import { OfflineHub, MessageSyncEvent } from './offline-hub';
import { replayGroupAction, replaySweptGroupActions } from './swept-group-actions';

const person = (uid: string): any => ({ getUid: () => uid });
const team: any = { getGuid: () => 'team', getMembersCount: () => 4 };
function action(
  kind: string,
  on: string,
  by: string,
  id = Math.floor(Math.random() * 1e6),
  extra: Record<string, unknown> = {}
): any {
  return {
    getId: () => id,
    getCategory: () => 'action',
    getType: () => 'groupMember',
    getAction: () => kind,
    getActionOn: () => person(on),
    getActionBy: () => person(by),
    getActionFor: () => team,
    getNewScope: () => extra['newScope'],
    getOldScope: () => extra['oldScope'],
  };
}

describe('replayGroupAction: the SDK listener arguments', () => {
  it('maps every member action to its live callback', () => {
    const calls: [string, unknown[]][] = [];
    const h: any = {};
    for (const n of [
      'onGroupMemberJoined',
      'onGroupMemberLeft',
      'onGroupMemberKicked',
      'onGroupMemberBanned',
      'onGroupMemberUnbanned',
      'onGroupMemberScopeChanged',
      'onMemberAddedToGroup',
    ]) {
      h[n] = (...args: unknown[]) => calls.push([n, args]);
    }
    replayGroupAction(action('kicked', 'sam', 'alex'), h);
    replayGroupAction(
      action('scopeChanged', 'sam', 'alex', 2, { newScope: 'admin', oldScope: 'participant' }),
      h
    );
    replayGroupAction(action('joined', 'x', 'bea'), h);
    replayGroupAction({ getCategory: () => 'message' } as any, h);
    expect(calls.map(c => c[0])).toEqual([
      'onGroupMemberKicked',
      'onGroupMemberScopeChanged',
      'onGroupMemberJoined',
    ]);
    expect((calls[0][1][1] as any).getUid()).toBe('sam');
    expect((calls[0][1][2] as any).getUid()).toBe('alex');
    expect(calls[0][1][3]).toBe(team);
    expect(calls[1][1].slice(2, 4)).toEqual(['admin', 'participant']);
    expect((calls[2][1][1] as any).getUid()).toBe('bea');
  });

  it('replaySweptGroupActions drops events of an older session', () => {
    const sync$ = new Subject<MessageSyncEvent>();
    const kicked = vi.fn();
    const sub = replaySweptGroupActions(sync$, () => 2, { onGroupMemberKicked: kicked });
    sync$.next({ gen: 1, outcome: 'CAUGHT_UP', messages: [action('kicked', 'sam', 'alex')] });
    sync$.next({ gen: 2, outcome: 'CAUGHT_UP', messages: [action('kicked', 'sam', 'alex')] });
    sub.unsubscribe();
    expect(kicked).toHaveBeenCalledTimes(1);
  });
});

describe('OfflineHub: swept group actions on CometChatGroupEvents', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    const hub = OfflineHub.getInstance();
    hub.start();
    hub.onLogin(person('me'));
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('a swept kick, ban and scope change are emitted once each, with the live payload shape', () => {
    const kicked: any[] = [];
    const banned: any[] = [];
    const scope: any[] = [];
    const subs = [
      CometChatGroupEvents.ccGroupMemberKicked.subscribe(e => kicked.push(e)),
      CometChatGroupEvents.ccGroupMemberBanned.subscribe(e => banned.push(e)),
      CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe(e => scope.push(e)),
    ];
    const k = action('kicked', 'me', 'admin', 11);
    const list = [
      k,
      action('banned', 'sam', 'admin', 12),
      action('scopeChanged', 'bea', 'admin', 13, {
        newScope: 'moderator',
        oldScope: 'participant',
      }),
    ];
    fake.fire('sync', 'onMessageSyncCompleted', list, 'CAUGHT_UP');
    fake.fire('sync', 'onMessageSyncCompleted', [k], 'CAUGHT_UP');
    subs.forEach(s => s.unsubscribe());
    expect(kicked).toHaveLength(1);
    expect(kicked[0].kickedUser.getUid()).toBe('me');
    expect(kicked[0].kickedBy.getUid()).toBe('admin');
    expect(kicked[0].kickedFrom).toBe(team);
    expect(kicked[0].message).toBe(k);
    expect(banned).toHaveLength(1);
    expect(scope[0]).toMatchObject({
      scopeChangedTo: 'moderator',
      scopeChangedFrom: 'participant',
      group: team,
    });
  });

  it('a swept leave is emitted only when the signed-in user left', () => {
    const left: any[] = [];
    const sub = CometChatGroupEvents.ccGroupLeft.subscribe(e => left.push(e));
    fake.fire(
      'sync',
      'onMessageSyncCompleted',
      [action('left', '', 'sam', 21), action('left', '', 'me', 22)],
      'CAUGHT_UP'
    );
    sub.unsubscribe();
    expect(left).toHaveLength(1);
    expect(left[0].userLeft.getUid()).toBe('me');
  });

  it('offline off: no sweep, no group event', () => {
    fake.setEnabled(false);
    const kicked = vi.fn();
    const sub = CometChatGroupEvents.ccGroupMemberKicked.subscribe(kicked);
    // The SDK never fires its sync listener with offline off.
    sub.unsubscribe();
    expect(kicked).not.toHaveBeenCalled();
  });

  /**
   * A screen asks wasSwept() while it is handling the event, to keep the group
   * the conversation sync delivered instead of the older one the action
   * carries, so the mark has to be in place before the event goes out.
   */
  describe('wasSwept', () => {
    it('is already true inside the subscriber handling the swept event', () => {
      const hub = OfflineHub.getInstance();
      const seen: boolean[] = [];
      const sub = CometChatGroupEvents.ccGroupMemberKicked.subscribe(e =>
        seen.push(hub.wasSwept(e.message))
      );
      fake.fire('sync', 'onMessageSyncCompleted', [action('kicked', 'sam', 'admin', 31)], 'CAUGHT_UP');
      sub.unsubscribe();
      expect(seen).toEqual([true]);
    });

    it('stays true after the sweep, and is false for anything never swept', () => {
      const hub = OfflineHub.getInstance();
      fake.fire('sync', 'onMessageSyncCompleted', [action('banned', 'sam', 'admin', 41)], 'CAUGHT_UP');
      expect(hub.wasSwept(action('banned', 'sam', 'admin', 41))).toBe(true);
      // A live event, and a payload with no message at all.
      expect(hub.wasSwept(action('banned', 'sam', 'admin', 42))).toBe(false);
      expect(hub.wasSwept(undefined)).toBe(false);
      expect(hub.wasSwept({} as never)).toBe(false);
    });

    it('marks a swept action the hub raises no group event for', () => {
      const hub = OfflineHub.getInstance();
      // A leave by someone else raises nothing, but it is still history.
      fake.fire('sync', 'onMessageSyncCompleted', [action('left', '', 'sam', 51)], 'CAUGHT_UP');
      expect(hub.wasSwept(action('left', '', 'sam', 51))).toBe(true);
    });
  });
});
