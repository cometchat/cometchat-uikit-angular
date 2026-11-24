/**
 * Group events in the open group, against the real message list component.
 *
 * A kick, ban, scope change, ownership change or member add in the open group
 * (live from the members panel, or replayed by the offline hub on reconnect)
 * updates the list's group in place and adds the action row. It used to call a
 * `setGroup` the component does not have, which threw a TypeError and dropped
 * the row; the handler spec stubbed `setGroup`, so it never showed.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroupEvents } from '../../events/CometChatGroupEvents';
import { CometChatMessageListComponent } from './cometchat-message-list.component';

const GUID = 'open-group';

function group(guid = GUID, members = 3): CometChat.Group {
  const g = new CometChat.Group(guid, 'Open group', 'public');
  g.setMembersCount(members);
  return g;
}

function action(id: number): CometChat.Action {
  const a = new CometChat.Action(GUID, 'groupMember', 'group', 'action' as CometChat.MessageCategory);
  a.setId(id);
  return a;
}

describe('message list: group events in the open group (real component)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CometChatMessageListComponent] }).compileComponents();
  });
  afterEach(() => TestBed.resetTestingModule());

  function list(options: { hideGroupActionMessages?: boolean; parentMessageId?: number } = {}) {
    const fixture = TestBed.createComponent(CometChatMessageListComponent);
    const component = fixture.componentInstance as any;
    component.group = group();
    if (options.hideGroupActionMessages) component.hideGroupActionMessages = true;
    if (options.parentMessageId) component.parentMessageId = options.parentMessageId;
    const service = component.messageListService;
    const added = vi.spyOn(service, 'addMessage').mockImplementation(() => undefined);
    const reset = vi.spyOn(service, 'setGroup');
    component.subscribeToGroupEvents();
    return { component, added, reset };
  }

  const kickedBanned = (kickedFrom: CometChat.Group, id: number) => ({
    message: action(id),
    kickedFrom,
    kickedUser: new CometChat.User('x'),
    kickedBy: new CometChat.User('admin'),
  });

  it('a kick updates the group in place and adds the action row, with no TypeError', () => {
    const { component, added, reset } = list();
    const updated = group(GUID, 2);
    expect(() => CometChatGroupEvents.ccGroupMemberKicked.next(kickedBanned(updated, 1))).not.toThrow();
    expect(component.group).toBe(updated);
    expect(added).toHaveBeenCalledTimes(1);
    // The list is not reset: the service's setGroup clears every message.
    expect(reset).not.toHaveBeenCalled();
  });

  it('a ban updates the group and adds the row', () => {
    const { component, added } = list();
    const updated = group(GUID, 2);
    CometChatGroupEvents.ccGroupMemberBanned.next(kickedBanned(updated, 2));
    expect(component.group).toBe(updated);
    expect(added).toHaveBeenCalledTimes(1);
  });

  it('a scope change updates the group and adds the row', () => {
    const { component, added } = list();
    const updated = group();
    CometChatGroupEvents.ccGroupMemberScopeChanged.next({
      message: action(3),
      updatedUser: new CometChat.GroupMember('x', 'admin'),
      scopeChangedTo: 'admin',
      scopeChangedFrom: 'participant',
      group: updated,
    });
    expect(component.group).toBe(updated);
    expect(added).toHaveBeenCalledTimes(1);
  });

  it('an ownership change and a member add update the group', () => {
    const { component, added } = list();
    const owned = group();
    CometChatGroupEvents.ccOwnershipChanged.next({ group: owned, newOwner: new CometChat.GroupMember('y', 'admin') });
    expect(component.group).toBe(owned);
    const grown = group(GUID, 4);
    CometChatGroupEvents.ccGroupMemberAdded.next({
      messages: [action(4)],
      usersAdded: [new CometChat.User('z')],
      userAddedIn: grown,
      userAddedBy: new CometChat.User('admin'),
    });
    expect(component.group).toBe(grown);
    expect(added).toHaveBeenCalledTimes(1);
  });

  it('with hideGroupActionMessages the group still updates but no action row is added', () => {
    const { component, added } = list({ hideGroupActionMessages: true });
    const updated = group(GUID, 2);
    CometChatGroupEvents.ccGroupMemberKicked.next(kickedBanned(updated, 5));
    CometChatGroupEvents.ccGroupMemberBanned.next(kickedBanned(updated, 6));
    CometChatGroupEvents.ccGroupMemberScopeChanged.next({
      message: action(7),
      updatedUser: new CometChat.GroupMember('x', 'admin'),
      scopeChangedTo: 'admin',
      scopeChangedFrom: 'participant',
      group: updated,
    });
    CometChatGroupEvents.ccGroupMemberAdded.next({
      messages: [action(8)],
      usersAdded: [new CometChat.User('z')],
      userAddedIn: updated,
      userAddedBy: new CometChat.User('admin'),
    });
    CometChatGroupEvents.ccGroupLeft.next({
      message: action(9),
      leftGroup: updated,
      userLeft: new CometChat.User('x'),
    } as any);
    expect(component.group).toBe(updated);
    expect(added).not.toHaveBeenCalled();
  });

  it('an event of another group changes nothing', () => {
    const { component, added } = list();
    const before = component.group;
    CometChatGroupEvents.ccGroupMemberKicked.next(kickedBanned(group('other'), 10));
    expect(component.group).toBe(before);
    expect(added).not.toHaveBeenCalled();
  });
});
