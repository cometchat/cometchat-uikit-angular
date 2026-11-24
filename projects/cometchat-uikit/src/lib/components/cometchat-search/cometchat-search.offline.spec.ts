/**
 * D84 in the Search component, offline on:
 * - Rule 7 and addition A: a search that cannot reach the server and finds nothing saved is "Connect to search"
 *   with the second line "Search needs an internet connection." It is an offline state, so `searchError` does
 *   not fire; it searches again once by itself when the connection returns (rule 8).
 * - Mixed failures: "Connect to search" is only for a search whose every failure was a not-connected one. If
 *   the other scope failed with a real error, the search takes the normal error path.
 * - Rule 2: results on screen stay.
 * - Android's final state: a scope that fails with a real error while it shows nothing waits for the other
 *   scope. Both failing is the error view with the failures reported; results in the other scope stay and the
 *   failure is reported; no results anywhere is the plain empty state, with no report.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { CometChatSearchComponent } from './cometchat-search.component';
import { CometChatSearchFilter } from '../../Enums/Enums';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { installOfflineSdk, OfflineSdkFake } from '../../testing/offline-sdk-fake';
import { NOT_CONNECTED, stubBuild, twoPhaseRequest } from '../../testing/two-phase-request-fake';
import { ConnectionStateService } from '../../services/connection-state.service';
import { setConnection } from '../../testing/connection-driver';

const SERVER_ERROR = { code: 'ERR_SERVER', message: 'boom' };
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
  getUnreadMessageCount: () => 0,
  getLastReadMessageId: () => 0,
  getPlayerId: () => '',
});

function reconnect(): void {
  const connection = TestBed.inject(ConnectionStateService) as any;
  for (const value of [false, true]) {
    setConnection(connection, value);
    TestBed.tick();
  }
}

@Component({
  standalone: true,
  imports: [CometChatSearchComponent],
  template: `
    <ng-template #appError><div class="app-error-view">my own error</div></ng-template>
    <cometchat-search [defaultSearchText]="'hello'" [errorView]="appError" [emptyView]="appEmpty2" />
    <ng-template #appEmpty2><div class="app-empty-view">my own empty</div></ng-template>
  `,
})
class SearchWithAppViews {}

@Component({
  standalone: true,
  imports: [CometChatSearchComponent],
  template: `
    <ng-template #appEmpty><div class="app-empty-view">my own empty</div></ng-template>
    <cometchat-search [defaultSearchText]="'hello'" [searchIn]="scopes" [emptyView]="appEmpty" />
  `,
})
class SearchWithAppEmptyView {
  @ViewChild('appEmpty') appEmpty!: TemplateRef<unknown>;
  scopes: any[] = [];
}

describe('CometChatSearch: offline states (D84)', () => {
  let fake: OfflineSdkFake;
  let fixture: ComponentFixture<CometChatSearchComponent>;
  let component: CometChatSearchComponent;
  let conversationsRequest: { fetchNext: ReturnType<typeof vi.fn> };
  let messagesRequest: { fetchPrevious: ReturnType<typeof vi.fn> };
  let errors: unknown[];

  beforeEach(async () => {
    fake = installOfflineSdk();
    fake.connected = false;
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue({ getUid: () => 'alex' } as any);
    conversationsRequest = { fetchNext: vi.fn().mockRejectedValue(NOT_CONNECTED) };
    messagesRequest = { fetchPrevious: vi.fn().mockRejectedValue(NOT_CONNECTED) };
    stubBuild(CometChat, 'ConversationsRequestBuilder').mockReturnValue(conversationsRequest as any);
    stubBuild(CometChat, 'MessagesRequestBuilder').mockReturnValue(messagesRequest as any);
    await TestBed.configureTestingModule({ imports: [CometChatSearchComponent] }).compileComponents();
    fixture = TestBed.createComponent(CometChatSearchComponent);
    component = fixture.componentInstance;
    errors = [];
    component.searchError.subscribe(e => errors.push(e));
  });
  afterEach(() => {
    fake.restore();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  const root = () => fixture.nativeElement as HTMLElement;
  async function searchFor(text: string): Promise<void> {
    fixture.detectChanges();
    component.searchText.set(text);
    for (let i = 0; i < 6; i++) {
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    fixture.detectChanges();
  }

  it('rule 7 and addition A: both scopes offline with nothing saved is one "Connect to search" with its second line, and no searchError', async () => {
    await searchFor('hello');
    const state = root().querySelector('[data-testid="cc-empty"][data-cc-reason="connect-to-search"]');
    expect(state).not.toBeNull();
    expect(state!.textContent).toContain('Connect to search');
    expect(state!.textContent).toContain('Search needs an internet connection.');
    expect(root().querySelector('.cometchat-search__error-view')).toBeNull();
    expect(errors).toEqual([]);
  });

  it('rule 8: it searches again once by itself when the connection returns, and shows the results', async () => {
    conversationsRequest.fetchNext.mockRejectedValueOnce(NOT_CONNECTED).mockResolvedValue([conv('hello-co')]);
    messagesRequest.fetchPrevious.mockRejectedValueOnce(NOT_CONNECTED).mockResolvedValue([]);
    await searchFor('hello');
    expect(root().querySelector('[data-cc-reason="connect-to-search"]')).not.toBeNull();
    fake.connected = true;
    reconnect();
    for (let i = 0; i < 6; i++) {
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    fixture.detectChanges();
    expect(root().querySelector('[data-cc-reason="connect-to-search"]')).toBeNull();
    expect(conversationsRequest.fetchNext).toHaveBeenCalledTimes(2);
    expect(messagesRequest.fetchPrevious).toHaveBeenCalledTimes(2);
    expect(errors).toEqual([]);
  });

  it('mixed failures: one scope offline and the other a real error takes the normal error path, not "Connect to search"', async () => {
    messagesRequest.fetchPrevious.mockRejectedValue(SERVER_ERROR);
    await searchFor('hello');
    expect(root().querySelector('[data-cc-reason="connect-to-search"]')).toBeNull();
    expect(root().querySelector('.cometchat-search__error-view')).not.toBeNull();
    // The real failure still reaches the app; the offline one never does.
    expect(errors).toEqual([SERVER_ERROR]);
  });

  it('rule 4: both scopes failing for real is the error view with the failures reported', async () => {
    conversationsRequest.fetchNext.mockRejectedValue(SERVER_ERROR);
    messagesRequest.fetchPrevious.mockRejectedValue(SERVER_ERROR);
    await searchFor('hello');
    expect(root().querySelector('[data-cc-reason="connect-to-search"]')).toBeNull();
    expect(root().querySelector('.cometchat-search__error-view')).not.toBeNull();
    expect(errors.length).toBe(2);
  });

  it('rule 2: offline in one scope with results from the other keeps the results, with no state over them and no searchError', async () => {
    conversationsRequest.fetchNext.mockResolvedValue([conv('hello-co')]);
    await searchFor('hello');
    expect(root().querySelector('[data-cc-reason="connect-to-search"]')).toBeNull();
    expect(root().querySelector('.cometchat-search__error-view')).toBeNull();
    expect(root().textContent).toContain('hello-co');
    expect(errors).toEqual([]);
  });

  // ---- Android's rules for the Search screen (CometChatSearchViewModel.updateFinalStateIfCompleted) ----

  it('Android: a filter alone (one scope) that cannot reach the server is the plain empty state: not "Connect to search", and no searchError', async () => {
    messagesRequest.fetchPrevious = twoPhaseRequest('Messages', [{ cached: [], error: NOT_CONNECTED }]).fetchPrevious;
    component.initialSearchFilter = CometChatSearchFilter.Photos;
    await searchFor('');
    expect(root().querySelector('[data-cc-reason="connect-to-search"]')).toBeNull();
    expect(root().querySelector('.cometchat-search__error-view')).toBeNull();
    expect(root().textContent).toContain('No Results');
    expect(root().textContent).not.toContain('Connect to search');
    expect(root().textContent).not.toContain('Connect to load');
    expect(errors).toEqual([]);
  });

  it('Android: one scope searched by keyword that cannot reach the server is "Connect to search" with its second line, and no searchError', async () => {
    component.searchIn = ['messages' as any];
    await searchFor('hello');
    const state = root().querySelector('[data-testid="cc-empty"][data-cc-reason="connect-to-search"]');
    expect(state).not.toBeNull();
    expect(state!.textContent).toContain('Connect to search');
    expect(state!.textContent).toContain('Search needs an internet connection.');
    expect(errors).toEqual([]);
  });

  it('Android: the search screen reads its own text (cometchat_connect_to_search_messages), not the lists\'', async () => {
    CometChatLocalize.init({ language: 'de', fallbackLanguage: 'en-US' });
    try {
      await searchFor('hello');
      const state = root().querySelector('[data-cc-reason="connect-to-search"]');
      expect(state).not.toBeNull();
      expect(state!.textContent).toContain('Zum Suchen verbinden');
      expect(state!.textContent).not.toContain('Verbinden, um zu suchen');
      expect(state!.textContent).toContain('Die Suche benötigt eine Internetverbindung.');
    } finally {
      CometChatLocalize.init({ language: 'en-US', fallbackLanguage: 'en-US' });
    }
  });

  it("Android: the app's own empty view wins over \"Connect to search\", for both scopes and for one", async () => {
    for (const scopes of [[], ['messages']]) {
      const host = TestBed.createComponent(SearchWithAppEmptyView);
      host.componentInstance.scopes = scopes;
      for (let i = 0; i < 6; i++) {
        host.detectChanges();
        await host.whenStable();
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      host.detectChanges();
      const el = host.nativeElement as HTMLElement;
      expect(el.querySelector('.app-empty-view')).not.toBeNull();
      expect(el.querySelector('[data-cc-reason="connect-to-search"]')).toBeNull();
      host.destroy();
    }
  });

  // ---- Android: one scope fails with a real error and nothing is shown (updateFinalStateIfCompleted) ----

  describe('one scope fails with a real error and nothing is shown', () => {
    it('messages fail and conversations find nothing: the plain empty state, no searchError, and no search again on reconnect', async () => {
      conversationsRequest.fetchNext.mockResolvedValue([]);
      messagesRequest.fetchPrevious.mockRejectedValue(SERVER_ERROR);
      await searchFor('hello');
      expect(root().querySelector('.cometchat-search__error-view')).toBeNull();
      expect(root().querySelector('[data-cc-reason="connect-to-search"]')).toBeNull();
      expect(root().textContent).toContain('No Results');
      expect(errors).toEqual([]);
      fake.connected = true;
      reconnect();
      for (let i = 0; i < 4; i++) {
        fixture.detectChanges();
        await fixture.whenStable();
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      expect(messagesRequest.fetchPrevious).toHaveBeenCalledTimes(1);
      expect(conversationsRequest.fetchNext).toHaveBeenCalledTimes(1);
      expect(errors).toEqual([]);
    });

    it('conversations fail and messages find nothing: the same', async () => {
      conversationsRequest.fetchNext.mockRejectedValue(SERVER_ERROR);
      messagesRequest.fetchPrevious.mockResolvedValue([]);
      await searchFor('hello');
      expect(root().querySelector('.cometchat-search__error-view')).toBeNull();
      expect(root().textContent).toContain('No Results');
      expect(errors).toEqual([]);
    });

    it("the app's own empty view is shown, never its own error view", async () => {
      conversationsRequest.fetchNext.mockResolvedValue([]);
      messagesRequest.fetchPrevious.mockRejectedValue(SERVER_ERROR);
      const host = TestBed.createComponent(SearchWithAppViews);
      for (let i = 0; i < 6; i++) {
        host.detectChanges();
        await host.whenStable();
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      host.detectChanges();
      const el = host.nativeElement as HTMLElement;
      expect(el.querySelector('.app-empty-view')).not.toBeNull();
      expect(el.querySelector('.app-error-view')).toBeNull();
      host.destroy();
    });

    it('one scope searched by keyword that fails is the plain empty state, no searchError', async () => {
      component.searchIn = ['messages' as any];
      messagesRequest.fetchPrevious.mockRejectedValue(SERVER_ERROR);
      await searchFor('hello');
      expect(root().querySelector('.cometchat-search__error-view')).toBeNull();
      expect(root().textContent).toContain('No Results');
      expect(errors).toEqual([]);
    });

    it('a filter alone on messages that fails with a real error is the plain empty state, no searchError', async () => {
      messagesRequest.fetchPrevious = twoPhaseRequest('Messages', [{ cached: [], error: SERVER_ERROR }]).fetchPrevious;
      component.initialSearchFilter = CometChatSearchFilter.Photos;
      await searchFor('');
      expect(root().querySelector('.cometchat-search__error-view')).toBeNull();
      expect(root().textContent).toContain('No Results');
      expect(errors).toEqual([]);
    });

    it('a filter alone on conversations that fails with a real error is the plain empty state, no searchError', async () => {
      conversationsRequest.fetchNext = twoPhaseRequest('Conversations', [{ cached: [], error: SERVER_ERROR }]).fetchNext;
      component.initialSearchFilter = CometChatSearchFilter.Unread;
      await searchFor('');
      expect(root().querySelector('.cometchat-search__error-view')).toBeNull();
      expect(root().textContent).toContain('No Results');
      expect(errors).toEqual([]);
    });

    it('results in the other scope stay, and the failure is still reported once (rule 5)', async () => {
      conversationsRequest.fetchNext.mockRejectedValue(SERVER_ERROR);
      messagesRequest.fetchPrevious.mockResolvedValue([
        Object.assign(Object.create(CometChat.TextMessage.prototype), {
          getId: () => 1,
          getText: () => 'found it',
          getType: () => 'text',
          getCategory: () => 'message',
          getSentAt: () => 1,
          getSender: () => ({ getUid: () => 'alex', getName: () => 'Alex', getAvatar: () => '' }),
          getReceiver: () => ({ getUid: () => 'bob', getName: () => 'Bob', getAvatar: () => '' }),
          getReceiverType: () => 'user',
          getDeletedAt: () => 0,
          getMentionedUsers: () => [],
          getMetadata: () => undefined,
        }),
      ]);
      await searchFor('hello');
      expect(root().querySelector('.cometchat-search__error-view')).toBeNull();
      expect(root().textContent).not.toContain('No Results');
      expect(errors).toEqual([SERVER_ERROR]);
    });

    it('offline OFF: the same one-scope failure is reported, as today', async () => {
      fake.setEnabled(false);
      conversationsRequest.fetchNext.mockResolvedValue([]);
      messagesRequest.fetchPrevious.mockRejectedValue(SERVER_ERROR);
      await searchFor('hello');
      expect(errors).toEqual([SERVER_ERROR]);
    });
  });
});
