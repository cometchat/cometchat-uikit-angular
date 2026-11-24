/**
 * Swept group actions and the groups list (README §3.7, UIT-SYNC-13).
 *
 * replaySweptGroupActions runs the live GroupListener handlers, which hand over
 * the group the action carries. Live that snapshot is current; swept it can be
 * hours old, so it must not take the place of the row the list just refreshed
 * from the server (Prajwal 2026-11-20T13:00Z on #674, groups.service.ts:247).
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { installOfflineSdk, OfflineSdkFake } from '../testing/offline-sdk-fake';
import { OfflineHub } from '../utils/offline/offline-hub';
import { GroupsService } from './groups.service';

const me = { getUid: () => 'me' } as CometChat.User;
const other = { getUid: () => 'sam' } as CometChat.User;

/** A group row as the server refreshed it on reconnect. */
function fresh(guid: string): any {
  let count = 12;
  let scope = 'participant';
  let joined = true;
  return {
    getGuid: () => guid,
    getName: () => 'Design Team',
    getIcon: () => 'https://cdn/new-icon.png',
    getMembersCount: () => count,
    setMembersCount: (n: number) => (count = n),
    getScope: () => scope,
    setScope: (s: string) => (scope = s),
    getHasJoined: () => joined,
    setHasJoined: (v: boolean) => (joined = v),
  };
}

/** The group as the action carried it, hours ago. */
function stale(guid: string, count = 7): any {
  return {
    getGuid: () => guid,
    getName: () => 'Old Name',
    getIcon: () => 'https://cdn/old-icon.png',
    getMembersCount: () => count,
    setMembersCount: () => undefined,
    getScope: () => 'participant',
    setScope: () => undefined,
    getHasJoined: () => true,
    setHasJoined: () => undefined,
  };
}

function action(kind: string, on: CometChat.User, by: CometChat.User, group: any, extra: Record<string, unknown> = {}): any {
  return {
    getId: () => Math.floor(Math.random() * 1e6),
    getCategory: () => 'action',
    getType: () => 'groupMember',
    getAction: () => kind,
    getActionOn: () => on,
    getActionBy: () => by,
    getActionFor: () => group,
    getNewScope: () => extra['newScope'],
    getOldScope: () => extra['oldScope'],
  };
}

describe('GroupsService: swept group actions', () => {
  let fake: OfflineSdkFake;
  let service: GroupsService;
  let row: any;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(me as never);
    TestBed.configureTestingModule({ providers: [GroupsService] });
    service = TestBed.inject(GroupsService);
    (service as any).loggedInUser = me;
    row = fresh('design');
    service.appendGroupsWithoutDuplicates([row]);
    service.attachListeners();
  });
  afterEach(() => {
    service.detachListeners();
    fake.restore();
    OfflineHub.resetForTests();
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  function sweep(messages: any[]): void {
    const hub = OfflineHub.getInstance();
    hub.messageSync$.next({ gen: hub.gen, outcome: 'CAUGHT_UP', messages });
  }

  it('keeps the refreshed name, icon and identity of the row', () => {
    sweep([action('added', other, other, stale('design'))]);
    const listed: any = service.groups()[0];
    expect(listed.getName()).toBe('Design Team');
    expect(listed.getIcon()).toBe('https://cdn/new-icon.png');
    // Still one row, still the object the list already held.
    expect(service.groups()).toHaveLength(1);
    expect(listed).toBe(row);
  });

  it("applies the action's own member count, which is what the action is about", () => {
    sweep([action('joined', other, other, stale('design', 9))]);
    expect((service.groups()[0] as any).getMembersCount()).toBe(9);
  });

  it("applies the signed-in user's new scope and nothing else", () => {
    sweep([action('scopeChanged', me, other, stale('design'), { newScope: 'admin', oldScope: 'participant' })]);
    const listed: any = service.groups()[0];
    expect(listed.getScope()).toBe('admin');
    expect(listed.getName()).toBe('Design Team');
  });

  it("another member's scope change leaves the row alone", () => {
    sweep([action('scopeChanged', other, me, stale('design'), { newScope: 'admin' })]);
    const listed: any = service.groups()[0];
    expect(listed.getScope()).toBe('participant');
    expect(listed.getName()).toBe('Design Team');
  });

  it('still removes the group when the signed-in user was kicked, banned or left while away', () => {
    sweep([action('kicked', me, other, stale('design'))]);
    expect(service.groups()).toHaveLength(0);
  });

  it('still adds a group the signed-in user was added to while away', () => {
    const added = stale('new-group');
    sweep([action('added', me, other, added)]);
    expect(service.groups().map((g: any) => g.getGuid())).toContain('new-group');
  });

  it('ignores an action for a group that is not listed', () => {
    sweep([action('joined', other, other, stale('not-listed'))]);
    expect(service.groups().map((g: any) => g.getGuid())).toEqual(['design']);
  });

  it('drops a sweep from an ended session', () => {
    const hub = OfflineHub.getInstance();
    hub.messageSync$.next({
      gen: hub.gen - 1,
      outcome: 'CAUGHT_UP',
      messages: [action('joined', other, other, stale('design', 3))],
    });
    expect((service.groups()[0] as any).getMembersCount()).toBe(12);
  });

  it('a live event still replaces the row with the SDK snapshot', () => {
    // The live listener keeps its old behaviour: its snapshot is current.
    const liveGroup = stale('design', 15);
    (service as any).updateGroupForSDKEvents({ group: liveGroup, newCount: 15 });
    expect(service.groups()[0]).toBe(liveGroup);
  });
});
