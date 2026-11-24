/** No presence while the SDK is not connected (offline on only). */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { installOfflineSdk, OfflineSdkFake } from '../testing/offline-sdk-fake';
import { OfflineHub } from '../utils/offline/offline-hub';
import { OfflineHubService } from './offline-hub.service';
import { ConnectionStateService } from './connection-state.service';
import { CometChatUserItemComponent } from '../components/cometchat-user-item/cometchat-user-item.component';
import { CometChatMessageHeaderComponent } from '../components/cometchat-message-header/cometchat-message-header.component';
import { MessageHeaderService } from './message-header.service';
import { CometChatUsersComponent } from '../components/cometchat-users/cometchat-users.component';
import { CometChatConversationItemComponent } from '../components/cometchat-conversation-item/cometchat-conversation-item.component';
import { CometChatGroupMemberItemComponent } from '../components/cometchat-group-member-item/cometchat-group-member-item.component';

describe('presence hidden while not connected', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    TestBed.configureTestingModule({});
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('is hidden while disconnected and comes back when the connection does', () => {
    fake.connected = false;
    const hub = TestBed.inject(OfflineHubService);
    const connection = TestBed.inject(ConnectionStateService) as any;
    expect(hub.presenceHidden()).toBe(true);
    fake.connected = true;
    connection._connected.set(true);
    expect(hub.presenceHidden()).toBe(false);
    fake.connected = false;
    connection._connected.set(false);
    expect(hub.presenceHidden()).toBe(true);
  });

  /**
   * `presenceHidden` is a computed, so it only re-reads the gate when something
   * reactive changes. The gate cannot answer before the SDK has a session, and
   * a run that signs in with no connection - the app opened offline on a cached
   * session - changes nothing else, so the first `false` stuck and the last
   * presence heard stayed on screen as though it were current
   * (Prajwal 2026-11-20T11:54Z on #674).
   */
  describe('a sign-in re-reads the gate', () => {
    it('hides presence after a sign-in with no connection, offline having turned on', () => {
      // Before the session: the gate says offline is off, and that is cached.
      fake.setEnabled(false);
      fake.connected = false;
      const hub = TestBed.inject(OfflineHubService);
      expect(hub.presenceHidden()).toBe(false);

      // The app signs in on a cached session, still with no connection.
      fake.setEnabled(true);
      OfflineHub.getInstance().onLogin(new CometChat.User('sam'));

      expect(hub.presenceHidden()).toBe(true);
    });

    it('a sign-in while connected leaves presence showing', () => {
      fake.setEnabled(false);
      fake.connected = true;
      const hub = TestBed.inject(OfflineHubService);
      expect(hub.presenceHidden()).toBe(false);

      fake.setEnabled(true);
      OfflineHub.getInstance().onLogin(new CometChat.User('sam'));

      expect(hub.presenceHidden()).toBe(false);
    });

    it('a user switch re-reads it too', () => {
      fake.connected = false;
      const hub = TestBed.inject(OfflineHubService);
      OfflineHub.getInstance().onLogin(new CometChat.User('sam'));
      expect(hub.presenceHidden()).toBe(true);

      fake.setEnabled(false);
      OfflineHub.getInstance().onLogin(new CometChat.User('other'));

      expect(hub.presenceHidden()).toBe(false);
    });
  });

  it('offline off: never hidden, and the connection service is not even created', () => {
    fake.setEnabled(false);
    fake.connected = false;
    const add = vi.spyOn(CometChat as any, 'addConnectionListener');
    add.mockClear();
    const hub = TestBed.inject(OfflineHubService);
    expect(hub.presenceHidden()).toBe(false);
    expect(add).not.toHaveBeenCalled();
  });

  it('a user row shows its online dot connected and none while disconnected', () => {
    const online = Object.assign(Object.create(CometChat.User.prototype), {
      getUid: () => 'sam',
      getName: () => 'Sam',
      getAvatar: () => '',
      getStatus: () => 'online',
    });
    fake.connected = true;
    const fixture = TestBed.createComponent(CometChatUserItemComponent);
    fixture.componentRef.setInput('user', online);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cometchat-user-item__status')).not.toBeNull();

    fake.connected = false;
    (TestBed.inject(ConnectionStateService) as any)._connected.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cometchat-user-item__status')).toBeNull();

    fake.connected = true;
    (TestBed.inject(ConnectionStateService) as any)._connected.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cometchat-user-item__status')).not.toBeNull();
  });

  it('D84 rule 10: the users list does not announce anyone as online while disconnected', () => {
    const sam = Object.assign(Object.create(CometChat.User.prototype), {
      getUid: () => 'sam',
      getName: () => 'Sam',
      getAvatar: () => '',
      getStatus: () => 'online',
    });
    fake.connected = true;
    const fixture = TestBed.createComponent(CometChatUsersComponent);
    const list = fixture.componentInstance;
    expect(list.getUserAriaLabel(sam)).toBe('Sam, online');
    fake.connected = false;
    (TestBed.inject(ConnectionStateService) as any)._connected.set(false);
    expect(list.getUserAriaLabel(sam)).toBe('Sam');
    fake.connected = true;
    (TestBed.inject(ConnectionStateService) as any)._connected.set(true);
    expect(list.getUserAriaLabel(sam)).toBe('Sam, online');
  });

  it('D84 rule 10: a conversation row hides the online dot while disconnected, and shows it again', () => {
    fake.connected = true;
    const fixture = TestBed.createComponent(CometChatConversationItemComponent);
    const row = fixture.componentInstance;
    expect(row.effectiveHideUserStatus()).toBe(false);
    fake.connected = false;
    (TestBed.inject(ConnectionStateService) as any)._connected.set(false);
    expect(row.effectiveHideUserStatus()).toBe(true);
    fake.connected = true;
    (TestBed.inject(ConnectionStateService) as any)._connected.set(true);
    expect(row.effectiveHideUserStatus()).toBe(false);
  });

  it('D84 rule 10: a group member row hides its online dot while disconnected', () => {
    const online = Object.assign(Object.create(CometChat.GroupMember.prototype), {
      getUid: () => 'sam',
      getName: () => 'Sam',
      getAvatar: () => '',
      getStatus: () => 'online',
      getScope: () => 'participant',
    });
    fake.connected = true;
    const fixture = TestBed.createComponent(CometChatGroupMemberItemComponent);
    fixture.componentRef.setInput('member', online);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.cometchat-group-member-item__status')
    ).not.toBeNull();
    fake.connected = false;
    (TestBed.inject(ConnectionStateService) as any)._connected.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cometchat-group-member-item__status')).toBeNull();
  });

  it('the message header shows no dot, "Online" or typing for the peer while disconnected', () => {
    const peer = Object.assign(Object.create(CometChat.User.prototype), {
      getUid: () => 'sam',
      getName: () => 'Sam',
      getAvatar: () => '',
      getStatus: () => 'online',
      getLastActiveAt: () => 0,
    });
    fake.connected = true;
    const fixture = TestBed.createComponent(CometChatMessageHeaderComponent);
    fixture.componentRef.setInput('user', peer);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.cometchat-message-header__status-indicator')).not.toBeNull();
    expect(el.querySelector('.cometchat-message-header__subtitle--online')).not.toBeNull();

    fake.connected = false;
    (TestBed.inject(ConnectionStateService) as any)._connected.set(false);
    fixture.detectChanges();
    expect(el.querySelector('.cometchat-message-header__status-indicator')).toBeNull();
    expect(el.querySelector('.cometchat-message-header__subtitle--online')).toBeNull();
    // A typing indicator cannot arrive without a connection; one that did is ignored.
    const headerService = fixture.debugElement.injector.get(MessageHeaderService);
    headerService.setTypingIndicator({ getSender: () => peer } as any);
    fixture.detectChanges();
    expect(el.querySelector('.cometchat-message-header__subtitle--typing')).toBeNull();

    // Connected again: presence shows as before.
    headerService.setTypingIndicator(null);
    fake.connected = true;
    (TestBed.inject(ConnectionStateService) as any)._connected.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.cometchat-message-header__status-indicator')).not.toBeNull();
    expect(el.querySelector('.cometchat-message-header__subtitle--online')).not.toBeNull();
  });
});
