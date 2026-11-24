/**
 * D84 in the list components, offline on: with nothing on screen and no connection the kit's offline
 * state ("Connect to load ...", no Retry; the app's error view instead if it passed one) with one `error`;
 * a keyword search is "Connect to search" plus its second line with no `error`; rows on screen stay and
 * report nothing offline; the list loads by itself on reconnect.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { installOfflineSdk, OfflineSdkFake } from '../../testing/offline-sdk-fake';
import { NOT_CONNECTED, twoPhaseRequest } from '../../testing/two-phase-request-fake';
import { OfflineHub } from '../../utils/offline/offline-hub';
import { ConnectionStateService } from '../../services/connection-state.service';
import { setConnection } from '../../testing/connection-driver';
import { CometChatUsersComponent } from '../cometchat-users/cometchat-users.component';
import { CometChatGroupsComponent } from '../cometchat-groups/cometchat-groups.component';
import { CometChatGroupMembersComponent } from '../cometchat-group-members/cometchat-group-members.component';
import { CometChatConversationsComponent } from '../cometchat-conversations/cometchat-conversations.component';

const SERVER_ERROR = { code: 'ERR_SERVER', message: 'boom' };
const user = (uid: string): any => ({
  getUid: () => uid,
  getName: () => uid,
  getAvatar: () => '',
  getStatus: () => 'offline',
});
const group = (guid: string): any => ({
  getGuid: () => guid,
  getName: () => guid,
  getIcon: () => '',
  getType: () => 'public',
  getMembersCount: () => 1,
});
const member = (uid: string): any => ({
  getUid: () => uid,
  getName: () => uid,
  getAvatar: () => '',
  getStatus: () => 'offline',
  getScope: () => 'participant',
});
const conv = (id: string): any => ({
  getConversationId: () => id,
  getConversationType: () => 'user',
  getConversationWith: () =>
    Object.assign(Object.create(CometChat.User.prototype), {
      getUid: () => id,
      getName: () => id,
      getAvatar: () => '',
      getStatus: () => 'offline',
    }),
  getLastMessage: () => undefined,
  isPinned: () => false,
  getUnreadMessageCount: () => 0,
});
const builderOf = (request: unknown): any => ({
  build: () => request,
  setSearchKeyword: () => ({ build: () => request }),
});
/** A request that carries a search keyword, as one built by `setSearchKeyword` does. */
const withKeyword = <T extends object>(request: T, keyword: string): T =>
  Object.assign(request, { getSearchKeyword: () => keyword });

/** The connection drops and comes back, as the SDK reports it. */
function reconnect(): void {
  const connection = TestBed.inject(ConnectionStateService) as any;
  for (const value of [false, true]) {
    setConnection(connection, value);
    TestBed.tick();
  }
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  for (let i = 0; i < 4; i++) {
    fixture.detectChanges();
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 5));
  }
  fixture.detectChanges();
}

@Component({
  standalone: true,
  imports: [CometChatUsersComponent],
  template: `
    <ng-template #appError><div class="app-error-view">app error</div></ng-template>
    <cometchat-users
      [usersRequestBuilder]="builder"
      [errorView]="appError"
      (error)="errors.push($event)"
    />
  `,
})
class UsersWithAppErrorView {
  @ViewChild('appError') appError!: TemplateRef<unknown>;
  builder: any;
  errors: unknown[] = [];
}

describe('D84 list components (offline on)', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    fake.connected = false;
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(user('alex'));
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  const text = (fixture: ComponentFixture<unknown>) =>
    (fixture.nativeElement as HTMLElement).textContent ?? '';
  const q = (fixture: ComponentFixture<unknown>, selector: string) =>
    (fixture.nativeElement as HTMLElement).querySelector(selector);

  describe('users', () => {
    const open = (calls: Parameters<typeof twoPhaseRequest>[1]) => {
      const request = twoPhaseRequest('Users', calls);
      const fixture = TestBed.createComponent(CometChatUsersComponent);
      fixture.componentInstance.usersRequestBuilder = builderOf(request) as any;
      const errors: unknown[] = [];
      fixture.componentInstance.error.subscribe(e => errors.push(e));
      return { fixture, request, errors };
    };

    it('rule 3: offline with nothing saved shows "Connect to load users" with no Retry, and fires error once', async () => {
      const { fixture, errors } = open([{ error: NOT_CONNECTED }]);
      await settle(fixture);
      const state = q(fixture, '[data-cc-reason="connect-to-load"]');
      expect(state).not.toBeNull();
      expect(state!.textContent).toContain('Connect to load users');
      expect(q(fixture, '.cometchat-users__error-state-view')).toBeNull();
      expect(q(fixture, '.cometchat-users__error-state-view-retry-button')).toBeNull();
      expect(errors.length).toBe(1);
    });

    it('rule 4: a real error with nothing on screen is the kit error view with Retry and one error', async () => {
      const { fixture, errors } = open([{ error: SERVER_ERROR }]);
      await settle(fixture);
      expect(q(fixture, '.cometchat-users__error-state-view')).not.toBeNull();
      expect(q(fixture, '.cometchat-users__error-state-view-retry-button')).not.toBeNull();
      expect(q(fixture, '[data-cc-reason="connect-to-load"]')).toBeNull();
      expect(errors.length).toBe(1);
    });

    it('rule 7 and addition A: an offline keyword search shows "Connect to search" and its second line, with no error', async () => {
      const request = withKeyword(twoPhaseRequest('Users', [{ error: NOT_CONNECTED }]), 'sam');
      const fixture = TestBed.createComponent(CometChatUsersComponent);
      fixture.componentInstance.usersRequestBuilder = builderOf(request) as any;
      const errors: unknown[] = [];
      fixture.componentInstance.error.subscribe(e => errors.push(e));
      await settle(fixture);
      const state = q(fixture, '[data-cc-reason="connect-to-search"]');
      expect(state).not.toBeNull();
      expect(state!.textContent).toContain('Connect to search');
      expect(state!.textContent).toContain('Search needs an internet connection.');
      expect(q(fixture, '[data-cc-reason="connect-to-load"]')).toBeNull();
      expect(errors.length).toBe(0);
    });

    it('addition B: a filter-only list (no keyword) offline with nothing saved is "Connect to load users", not "Connect to search"', async () => {
      const request = withKeyword(twoPhaseRequest('Users', [{ error: NOT_CONNECTED }]), '');
      const fixture = TestBed.createComponent(CometChatUsersComponent);
      fixture.componentInstance.usersRequestBuilder = builderOf(request) as any;
      await settle(fixture);
      expect(text(fixture)).toContain('Connect to load users');
      expect(text(fixture)).not.toContain('Connect to search');
      expect(text(fixture)).not.toContain('Search needs an internet connection.');
    });

    it("rule 3: the app's own error view is shown instead of the kit's offline state", async () => {
      const request = twoPhaseRequest('Users', [{ error: NOT_CONNECTED }]);
      const fixture = TestBed.createComponent(UsersWithAppErrorView);
      fixture.componentInstance.builder = builderOf(request);
      await settle(fixture);
      expect(q(fixture, '.app-error-view')).not.toBeNull();
      expect(q(fixture, '.cometchat-users__error-state-view')).toBeNull();
      expect(q(fixture, '[data-cc-reason="connect-to-load"]')).toBeNull();
      expect(fixture.componentInstance.errors.length).toBe(1);
    });

    it('rule 2: offline with cached rows on screen, the rows stay with no state over them and error does not fire', async () => {
      const { fixture, errors } = open([{ cached: [user('sam')], error: NOT_CONNECTED }]);
      await settle(fixture);
      expect(text(fixture)).toContain('sam');
      expect(q(fixture, '.cometchat-users__error-state-view')).toBeNull();
      expect(q(fixture, '[data-cc-reason="connect-to-load"]')).toBeNull();
      expect(errors.length).toBe(0);
    });

    it('rule 5: an online error over cached rows keeps the rows and fires error once', async () => {
      const { fixture, errors } = open([{ cached: [user('sam')], error: SERVER_ERROR }]);
      await settle(fixture);
      expect(text(fixture)).toContain('sam');
      expect(q(fixture, '.cometchat-users__error-state-view')).toBeNull();
      expect(errors.length).toBe(1);
    });

    it('rule 8: the offline state is replaced by the list when the connection returns', async () => {
      const { fixture, errors } = open([{ error: NOT_CONNECTED }, { server: [user('sam')] }]);
      await settle(fixture);
      expect(q(fixture, '[data-cc-reason="connect-to-load"]')).not.toBeNull();
      fake.connected = true;
      reconnect();
      await vi.waitFor(async () => {
        await settle(fixture);
        expect(text(fixture)).toContain('sam');
      });
      expect(q(fixture, '[data-cc-reason="connect-to-load"]')).toBeNull();
      expect(errors.length).toBe(1);
    });

    it('rule 6: an empty server list is the empty view', async () => {
      const { fixture, errors } = open([{ server: [] }]);
      await settle(fixture);
      expect(q(fixture, '.cometchat-users__empty-state-view')).not.toBeNull();
      expect(q(fixture, '.cometchat-users__error-state-view')).toBeNull();
      expect(errors.length).toBe(0);
    });

    it('the retry button reads again and shows the list', async () => {
      const { fixture } = open([{ error: SERVER_ERROR }, { server: [user('sam')] }]);
      await settle(fixture);
      (q(fixture, '.cometchat-users__error-state-view-retry-button') as HTMLButtonElement).click();
      await vi.waitFor(async () => {
        await settle(fixture);
        expect(text(fixture)).toContain('sam');
      });
    });
  });

  describe('groups', () => {
    it('rules 3 and 8: nothing saved is "Connect to load groups" with no Retry and one error; the list loads on reconnect', async () => {
      const request = twoPhaseRequest('Groups', [
        { error: NOT_CONNECTED },
        { server: [group('crew')] },
      ]);
      const fixture = TestBed.createComponent(CometChatGroupsComponent);
      fixture.componentInstance.groupsRequestBuilder = builderOf(request) as any;
      const errors: unknown[] = [];
      fixture.componentInstance.error.subscribe(e => errors.push(e));
      await settle(fixture);
      expect(q(fixture, '[data-cc-reason="connect-to-load"]')).not.toBeNull();
      expect(text(fixture)).toContain('Connect to load groups');
      expect(q(fixture, '.cometchat-groups__error-state-view-retry-button')).toBeNull();
      expect(errors.length).toBe(1);
      fake.connected = true;
      reconnect();
      await vi.waitFor(async () => {
        await settle(fixture);
        expect(text(fixture)).toContain('crew');
      });
      expect(q(fixture, '[data-cc-reason="connect-to-load"]')).toBeNull();
    });

    it('rule 2: offline with cached rows on screen, the rows stay and error does not fire', async () => {
      const request = twoPhaseRequest('Groups', [
        { cached: [group('crew')], error: NOT_CONNECTED },
      ]);
      const fixture = TestBed.createComponent(CometChatGroupsComponent);
      fixture.componentInstance.groupsRequestBuilder = builderOf(request) as any;
      const errors: unknown[] = [];
      fixture.componentInstance.error.subscribe(e => errors.push(e));
      await settle(fixture);
      expect(text(fixture)).toContain('crew');
      expect(q(fixture, '.cometchat-groups__error-state-view')).toBeNull();
      expect(errors.length).toBe(0);
    });

    it('rule 7 and addition A: an offline keyword search is "Connect to search" with its second line and no error', async () => {
      const request = withKeyword(twoPhaseRequest('Groups', [{ error: NOT_CONNECTED }]), 'crew');
      const fixture = TestBed.createComponent(CometChatGroupsComponent);
      fixture.componentInstance.groupsRequestBuilder = builderOf(request) as any;
      const errors: unknown[] = [];
      fixture.componentInstance.error.subscribe(e => errors.push(e));
      await settle(fixture);
      expect(text(fixture)).toContain('Connect to search');
      expect(text(fixture)).toContain('Search needs an internet connection.');
      expect(errors.length).toBe(0);
    });

    it('addition B: a filter-only list offline with nothing saved is "Connect to load groups"', async () => {
      const request = withKeyword(twoPhaseRequest('Groups', [{ error: NOT_CONNECTED }]), '');
      const fixture = TestBed.createComponent(CometChatGroupsComponent);
      fixture.componentInstance.groupsRequestBuilder = builderOf(request) as any;
      await settle(fixture);
      expect(text(fixture)).toContain('Connect to load groups');
      expect(text(fixture)).not.toContain('Connect to search');
    });
  });

  describe('group members', () => {
    const open = (calls: Parameters<typeof twoPhaseRequest>[1]) => {
      const request = twoPhaseRequest('GroupMembers', calls);
      const fixture = TestBed.createComponent(CometChatGroupMembersComponent);
      fixture.componentInstance.group = {
        getGuid: () => 'g',
        getOwner: () => 'x',
        getScope: () => 'participant',
      } as any;
      fixture.componentInstance.groupMemberRequestBuilder = builderOf(request) as any;
      const errors: unknown[] = [];
      fixture.componentInstance.error.subscribe(e => errors.push(e));
      return { fixture, errors };
    };

    it('rules 3 and 8: nothing saved is "Connect to load members" with no Retry and one error; the list loads on reconnect', async () => {
      const { fixture, errors } = open([{ error: NOT_CONNECTED }, { server: [member('m1')] }]);
      await settle(fixture);
      expect(q(fixture, '[data-cc-reason="connect-to-load"]')).not.toBeNull();
      expect(text(fixture)).toContain('Connect to load members');
      expect(q(fixture, '.cometchat-group-members__error-state-view-retry-button')).toBeNull();
      expect(errors.length).toBe(1);
      fake.connected = true;
      reconnect();
      await vi.waitFor(async () => {
        await settle(fixture);
        expect(text(fixture)).toContain('m1');
      });
      expect(q(fixture, '[data-cc-reason="connect-to-load"]')).toBeNull();
    });

    it('rule 2: offline with cached rows on screen, the rows stay and error does not fire', async () => {
      const { fixture, errors } = open([{ cached: [member('m1')], error: NOT_CONNECTED }]);
      await settle(fixture);
      expect(text(fixture)).toContain('m1');
      expect(q(fixture, '.cometchat-group-members__error-state-view')).toBeNull();
      expect(errors.length).toBe(0);
    });

    it('rule 5: an online error over cached rows keeps them and fires error once', async () => {
      const { fixture, errors } = open([{ cached: [member('m1')], error: SERVER_ERROR }]);
      await settle(fixture);
      expect(text(fixture)).toContain('m1');
      expect(errors.length).toBe(1);
    });
  });

  describe('conversations', () => {
    const open = (calls: Parameters<typeof twoPhaseRequest>[1]) => {
      const request = twoPhaseRequest('Conversations', calls);
      const fixture = TestBed.createComponent(CometChatConversationsComponent);
      fixture.componentInstance.conversationsRequestBuilder = builderOf(request) as any;
      const errors: unknown[] = [];
      fixture.componentInstance.error.subscribe(e => errors.push(e));
      return { fixture, errors };
    };

    it('rule 3: nothing saved is "Connect to load chats" with no Retry and one error', async () => {
      const { fixture, errors } = open([{ error: NOT_CONNECTED }]);
      await settle(fixture);
      const state = q(fixture, '[data-cc-reason="connect-to-load"]');
      expect(state).not.toBeNull();
      expect(state!.textContent).toContain('Connect to load chats');
      expect(q(fixture, '.cometchat-conversations__error-content')).toBeNull();
      expect(q(fixture, '.cometchat-conversations__error-retry-button')).toBeNull();
      expect(errors.length).toBe(1);
    });

    it('rule 4: a real error with nothing on screen is the kit error view with Retry', async () => {
      const { fixture, errors } = open([{ error: SERVER_ERROR }]);
      await settle(fixture);
      expect(q(fixture, '.cometchat-conversations__error-content')).not.toBeNull();
      expect(q(fixture, '[data-cc-reason="connect-to-load"]')).toBeNull();
      expect(errors.length).toBe(1);
    });

    it('rule 2: offline with saved chats on screen, they stay and error does not fire', async () => {
      const { fixture, errors } = open([{ cached: [conv('a')], error: NOT_CONNECTED }]);
      await settle(fixture);
      expect(q(fixture, '.cometchat-conversations__error-content')).toBeNull();
      expect(q(fixture, '[data-cc-reason="connect-to-load"]')).toBeNull();
      expect(errors.length).toBe(0);
    });

    it('rule 5: an online error over saved chats keeps them and fires error once', async () => {
      const { fixture, errors } = open([{ cached: [conv('a')], error: SERVER_ERROR }]);
      await settle(fixture);
      expect(q(fixture, '.cometchat-conversations__error-content')).toBeNull();
      expect(errors.length).toBe(1);
    });

    it('rule 7 and addition A: a keyword request offline with nothing saved is "Connect to search" with its second line and no error', async () => {
      const request = withKeyword(twoPhaseRequest('Conversations', [{ error: NOT_CONNECTED }]), 'al');
      const fixture = TestBed.createComponent(CometChatConversationsComponent);
      fixture.componentInstance.conversationsRequestBuilder = builderOf(request) as any;
      const errors: unknown[] = [];
      fixture.componentInstance.error.subscribe(e => errors.push(e));
      await settle(fixture);
      const state = q(fixture, '[data-cc-reason="connect-to-search"]');
      expect(state).not.toBeNull();
      expect(state!.textContent).toContain('Connect to search');
      expect(state!.textContent).toContain('Search needs an internet connection.');
      expect(errors.length).toBe(0);
    });

    it('addition B: a filter-only request offline with nothing saved is "Connect to load chats"', async () => {
      const request = withKeyword(twoPhaseRequest('Conversations', [{ error: NOT_CONNECTED }]), '');
      const fixture = TestBed.createComponent(CometChatConversationsComponent);
      fixture.componentInstance.conversationsRequestBuilder = builderOf(request) as any;
      await settle(fixture);
      expect(text(fixture)).toContain('Connect to load chats');
      expect(text(fixture)).not.toContain('Connect to search');
    });
  });
});
