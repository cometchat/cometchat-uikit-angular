/**
 * D84, as Android does it, offline on: when the app passed its own empty view, "Connect to search" does
 * not replace it; when it passed its own error view, "Connect to load ..." does not replace it. Checked
 * for each list: users, groups, group members and conversations. Android: in each compose list
 * `emptyView?.invoke() ?: if (connectToSearch)` and `errorView?.invoke(...) ?: if (connectToLoad)`; in each
 * kotlin view `customEmptyView` and `customErrorView` are tested before the offline text.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { installOfflineSdk, OfflineSdkFake } from '../../testing/offline-sdk-fake';
import { NOT_CONNECTED, twoPhaseRequest } from '../../testing/two-phase-request-fake';
import { OfflineHub } from '../../utils/offline/offline-hub';
import { CometChatUsersComponent } from '../cometchat-users/cometchat-users.component';
import { CometChatGroupsComponent } from '../cometchat-groups/cometchat-groups.component';
import { CometChatGroupMembersComponent } from '../cometchat-group-members/cometchat-group-members.component';
import { CometChatConversationsComponent } from '../cometchat-conversations/cometchat-conversations.component';

@Component({
  standalone: true,
  imports: [CometChatUsersComponent],
  template: `
    <ng-template #appEmpty><div class="app-empty-view">my own empty</div></ng-template>
    <ng-template #appError><div class="app-error-view">my own error</div></ng-template>
    <cometchat-users [usersRequestBuilder]="builder" [emptyView]="appEmpty" [errorView]="appError" />
  `,
})
class UsersHost {
  builder: any;
}
@Component({
  standalone: true,
  imports: [CometChatGroupsComponent],
  template: `
    <ng-template #appEmpty><div class="app-empty-view">my own empty</div></ng-template>
    <ng-template #appError><div class="app-error-view">my own error</div></ng-template>
    <cometchat-groups [groupsRequestBuilder]="builder" [emptyView]="appEmpty" [errorView]="appError" />
  `,
})
class GroupsHost {
  builder: any;
}
@Component({
  standalone: true,
  imports: [CometChatGroupMembersComponent],
  template: `
    <ng-template #appEmpty><div class="app-empty-view">my own empty</div></ng-template>
    <ng-template #appError><div class="app-error-view">my own error</div></ng-template>
    <cometchat-group-members [group]="group" [groupMemberRequestBuilder]="builder" [emptyView]="appEmpty" [errorView]="appError" />
  `,
})
class MembersHost {
  builder: any;
  group: any = { getGuid: () => 'g', getOwner: () => 'x', getScope: () => 'participant' };
}
@Component({
  standalone: true,
  imports: [CometChatConversationsComponent],
  template: `
    <ng-template #appEmpty><div class="app-empty-view">my own empty</div></ng-template>
    <ng-template #appError><div class="app-error-view">my own error</div></ng-template>
    <cometchat-conversations [conversationsRequestBuilder]="builder" [emptyView]="appEmpty" [errorView]="appError" />
  `,
})
class ConversationsHost {
  builder: any;
}

const builderOf = (request: unknown): any => ({
  build: () => request,
  setSearchKeyword: () => ({ build: () => request }),
});
const withKeyword = <T extends object>(request: T, keyword: string): T =>
  Object.assign(request, { getSearchKeyword: () => keyword });

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  for (let i = 0; i < 4; i++) {
    fixture.detectChanges();
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 5));
  }
  fixture.detectChanges();
}

const LISTS = [
  { name: 'users', host: UsersHost, suffix: 'Users' },
  { name: 'groups', host: GroupsHost, suffix: 'Groups' },
  { name: 'group members', host: MembersHost, suffix: 'GroupMembers' },
  { name: 'conversations', host: ConversationsHost, suffix: 'Conversations' },
] as const;

describe("D84: the app's own views win over the offline text (Android), offline on", () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    fake.connected = false;
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue({ getUid: () => 'alex' } as any);
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  for (const { name, host, suffix } of LISTS) {
    describe(name, () => {
      it('an offline keyword search shows the app\'s empty view, not "Connect to search"', async () => {
        const fixture = TestBed.createComponent(host as any) as ComponentFixture<any>;
        fixture.componentInstance.builder = builderOf(
          withKeyword(twoPhaseRequest(suffix, [{ error: NOT_CONNECTED }]), 'sam')
        );
        await settle(fixture);
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('.app-empty-view')).not.toBeNull();
        expect(el.querySelector('[data-cc-reason="connect-to-search"]')).toBeNull();
        expect(el.textContent).not.toContain('Connect to search');
      });

      it('a list with nothing saved offline shows the app\'s error view, not "Connect to load"', async () => {
        const fixture = TestBed.createComponent(host as any) as ComponentFixture<any>;
        fixture.componentInstance.builder = builderOf(twoPhaseRequest(suffix, [{ error: NOT_CONNECTED }]));
        await settle(fixture);
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('.app-error-view')).not.toBeNull();
        expect(el.querySelector('[data-cc-reason="connect-to-load"]')).toBeNull();
        expect(el.textContent).not.toContain('Connect to load');
      });
    });
  }
});
