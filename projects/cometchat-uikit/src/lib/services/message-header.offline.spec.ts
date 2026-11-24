vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { installOfflineSdk, OfflineSdkFake } from '../testing/offline-sdk-fake';
import { OfflineHub } from '../utils/offline/offline-hub';
import { MessageHeaderService } from './message-header.service';

interface ActionOptions {
  /** The member count the action's group snapshot carries. */
  count?: number;
  sentAt?: number;
  id?: number;
}

function action(kind: string, guid: string, options: ActionOptions = {}): any {
  const group: any = { getGuid: () => guid };
  if (options.count !== undefined) group.getMembersCount = () => options.count;
  return {
    getId: () => options.id ?? 0,
    getSentAt: () => options.sentAt ?? 0,
    getCategory: () => 'action',
    getType: () => 'groupMember',
    getAction: () => kind,
    getActionFor: () => group,
  };
}

/**
 * Swept group actions and the header's member count (UIT-SYNC-13).
 *
 * A swept action is history: the conversation sync has already handed the open
 * header the group as the server has it now. Moving the count by one per
 * replayed action drifts, so the swept path leaves a count that is on screen
 * alone (Prajwal 2026-11-20T13:00Z on #674).
 */
describe('message header: swept group actions (UIT-SYNC-13)', () => {
  let fake: OfflineSdkFake;
  let service: MessageHeaderService;

  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    TestBed.configureTestingModule({ providers: [MessageHeaderService] });
    service = TestBed.inject(MessageHeaderService);
    (service as any).currentGroupId = 'team';
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    TestBed.resetTestingModule();
  });

  function sweep(messages: any[], gen?: number): void {
    const hub = OfflineHub.getInstance();
    hub.messageSync$.next({
      gen: gen ?? hub.gen,
      outcome: 'CAUGHT_UP',
      messages,
    });
  }

  it('leaves the synced count alone instead of counting each action again', () => {
    // The conversation sync set 12, which already includes all three actions.
    service.updateGroupMemberCount(12);
    sweep([action('kicked', 'team'), action('banned', 'team'), action('left', 'team')]);
    expect(service.groupMemberCount()).toBe(12);
  });

  it('does not drift when the same sweep runs again (a repeated or PARTIAL sweep)', () => {
    service.updateGroupMemberCount(12);
    const joined = action('joined', 'team', { count: 11, sentAt: 100, id: 1 });
    sweep([joined]);
    sweep([joined]);
    sweep([joined]);
    expect(service.groupMemberCount()).toBe(12);
  });

  it("takes the newest action's snapshot when the header has no count yet", () => {
    sweep([
      action('joined', 'team', { count: 7, sentAt: 100, id: 1 }),
      action('joined', 'team', { count: 9, sentAt: 300, id: 3 }),
      action('left', 'team', { count: 8, sentAt: 200, id: 2 }),
    ]);
    expect(service.groupMemberCount()).toBe(9);
  });

  it('breaks a sentAt tie on the higher id', () => {
    sweep([
      action('joined', 'team', { count: 4, sentAt: 100, id: 1 }),
      action('joined', 'team', { count: 6, sentAt: 100, id: 2 }),
    ]);
    expect(service.groupMemberCount()).toBe(6);
  });

  it('an older snapshot arriving later cannot move the count back', () => {
    sweep([action('joined', 'team', { count: 9, sentAt: 300, id: 3 })]);
    expect(service.groupMemberCount()).toBe(9);
    sweep([action('joined', 'team', { count: 4, sentAt: 100, id: 1 })]);
    expect(service.groupMemberCount()).toBe(9);
  });

  it('ignores a sweep that belongs to an ended session (gen)', () => {
    service.updateGroupMemberCount(0);
    sweep([action('joined', 'team', { count: 9, sentAt: 300, id: 3 })], OfflineHub.getInstance().gen - 1);
    expect(service.groupMemberCount()).toBe(0);
  });

  it('ignores other groups and non-member actions', () => {
    service.updateGroupMemberCount(5);
    sweep([
      action('kicked', 'other', { count: 99 }),
      { getCategory: () => 'message', getType: () => 'text' } as any,
    ]);
    expect(service.groupMemberCount()).toBe(5);
  });

  it('ignores a snapshot with no usable count', () => {
    sweep([action('joined', 'team', { sentAt: 100, id: 1 })]);
    expect(service.groupMemberCount()).toBe(0);
  });

  it('does nothing when no group is open', () => {
    (service as any).currentGroupId = null;
    sweep([action('joined', 'team', { count: 9, sentAt: 1, id: 1 })]);
    expect(service.groupMemberCount()).toBe(0);
  });
});
