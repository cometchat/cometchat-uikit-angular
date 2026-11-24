/**
 * A group action updates a conversation row's preview and order only when it
 * is newer than what the row shows.
 *
 * The offline hub replays kicks, bans and scope changes swept on reconnect on
 * the public CometChatGroupEvents, after the conversation sync and the message
 * catch-up. A kick at T1 replayed after a message at T11 used to become the
 * preview and move the group to the top (Android guards this:
 * ConversationListOffline.kt isOlderThan). A live action is always the newest,
 * so it still updates.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroupEvents } from '../events/CometChatGroupEvents';
import { ConversationsService } from './conversations.service';

const GUID = 'g1';

function groupEntity(): CometChat.Group {
  const g = new CometChat.Group(GUID, 'Group one', 'public');
  g.setMembersCount(3);
  return g;
}

function text(id: number, sentAt: number, receiver = GUID, type = 'group'): CometChat.TextMessage {
  const m = new CometChat.TextMessage(receiver, `hi ${id}`, type);
  m.setId(id);
  m.setSentAt(sentAt);
  m.setSender(new CometChat.User('y'));
  m.setConversationId(type === 'group' ? `group_${receiver}` : `user_${receiver}`);
  return m;
}

function kick(id: number, sentAt: number): CometChat.Action {
  const a = new CometChat.Action(GUID, 'groupMember', 'group', 'action' as CometChat.MessageCategory);
  a.setId(id);
  a.setSentAt(sentAt);
  a.setAction('kicked');
  a.setSender(new CometChat.User('admin'));
  a.setActionBy(new CometChat.User('admin'));
  a.setActionOn(new CometChat.GroupMember('x'));
  a.setActionFor(groupEntity());
  a.setReceiver(groupEntity());
  a.setConversationId(`group_${GUID}`);
  return a;
}

function row(id: string, type: string, withEntity: any, last: CometChat.BaseMessage): CometChat.Conversation {
  return new CometChat.Conversation(id, type, last, withEntity, 0, [], 0, undefined);
}

describe('conversation preview: group actions older than the shown message', () => {
  let service: ConversationsService;
  let groupRow: CometChat.Conversation;
  let userRow: CometChat.Conversation;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConversationsService);
    groupRow = row(`group_${GUID}`, 'group', groupEntity(), text(110, 11_000));
    userRow = row('user_peer', 'user', new CometChat.User('peer'), text(120, 12_000, 'peer', 'user'));
    // The user chat is on top; the group, whose newest message is T11, is second.
    (service as any).allConversationsSignal.set([userRow, groupRow]);
    (service as any).conversationsSignal.set([userRow, groupRow]);
  });
  afterEach(() => TestBed.resetTestingModule());

  const order = () => (service as any).allConversationsSignal().map((c: CometChat.Conversation) => c.getConversationId());

  it('a kick at T1 replayed after a newer preview at T11 leaves the preview and the order unchanged', () => {
    CometChatGroupEvents.ccGroupMemberKicked.next({
      message: kick(10, 1_000),
      kickedFrom: groupEntity(),
      kickedUser: new CometChat.User('x'),
      kickedBy: new CometChat.User('admin'),
    });
    expect(groupRow.getLastMessage()?.getId()).toBe(110);
    expect(order()).toEqual(['user_peer', `group_${GUID}`]);
  });

  it('an older ban and an older scope change leave the row alone too', () => {
    CometChatGroupEvents.ccGroupMemberBanned.next({
      message: kick(11, 2_000),
      kickedFrom: groupEntity(),
      kickedUser: new CometChat.User('x'),
      kickedBy: new CometChat.User('admin'),
    });
    CometChatGroupEvents.ccGroupMemberScopeChanged.next({
      message: kick(12, 3_000),
      updatedUser: new CometChat.GroupMember('x', 'admin'),
      scopeChangedTo: 'admin',
      scopeChangedFrom: 'participant',
      group: groupEntity(),
    });
    expect(groupRow.getLastMessage()?.getId()).toBe(110);
    expect(order()).toEqual(['user_peer', `group_${GUID}`]);
  });

  it('a newer action (a live one) still becomes the preview and moves the row to the top', () => {
    const live = kick(130, 13_000);
    CometChatGroupEvents.ccGroupMemberKicked.next({
      message: live,
      kickedFrom: groupEntity(),
      kickedUser: new CometChat.User('x'),
      kickedBy: new CometChat.User('admin'),
    });
    expect(groupRow.getLastMessage()?.getId()).toBe(130);
    expect(order()).toEqual([`group_${GUID}`, 'user_peer']);
  });

  it('with the same sentAt the higher id is newer', () => {
    const same = kick(111, 11_000);
    CometChatGroupEvents.ccGroupMemberKicked.next({
      message: same,
      kickedFrom: groupEntity(),
      kickedUser: new CometChat.User('x'),
      kickedBy: new CometChat.User('admin'),
    });
    expect(groupRow.getLastMessage()?.getId()).toBe(111);
  });
});
