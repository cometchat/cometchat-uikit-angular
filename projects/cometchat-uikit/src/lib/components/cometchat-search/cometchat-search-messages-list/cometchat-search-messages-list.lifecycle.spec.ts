// The calls SDK touches JitsiMeetJS at module load, which jsdom has no equivalent for.
// The component pulls it in transitively through CometChatUIKit, so it has to be stubbed
// before any import below runs.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, SimpleChange, SimpleChanges } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSearchMessagesListComponent } from './cometchat-search-messages-list.component';
import { SearchMessagesService } from '../../../services/search-messages.service';
import { CometChatSearchFilter, States } from '../../../Enums/Enums';
import { CometChatUIKit } from '../../../cometchat-uikit';
import { CometChatLocalize } from '../../../resources/CometChatLocalize';

/**
 * Service double that mirrors the surface the component actually consumes:
 * `messages` / `fetchState` / `hasMoreResults` signals and the
 * `search` / `loadMore` / `reset` methods. The two call sites are promise-chained
 * in the component, so both mocks must resolve by default or `.catch` blows up.
 */
class MockSearchMessagesService {
  messages = signal<CometChat.BaseMessage[]>([]);
  fetchState = signal<States>(States.loaded);
  hasMoreResults = signal(false);
  search = vi.fn().mockResolvedValue(undefined);
  loadMore = vi.fn().mockResolvedValue(undefined);
  reset = vi.fn();
}

/** Lets every queued microtask (promise chain) settle before assertions run. */
const flush = (): Promise<void> => new Promise<void>(resolve => setTimeout(resolve, 0));

/** Minimal sender-bearing message; only the accessors the subtitle prefix reads. */
const messageFrom = (uid: string, name: string): CometChat.BaseMessage =>
  ({
    getSender: () => ({ getUid: () => uid, getName: () => name }),
  }) as unknown as CometChat.BaseMessage;

const userWithUid = (uid: string): CometChat.User =>
  ({ getUid: () => uid, getName: () => 'Logged In' }) as unknown as CometChat.User;

describe('CometChatSearchMessagesListComponent — lifecycle, state and pagination', () => {
  let fixture: ComponentFixture<CometChatSearchMessagesListComponent>;
  let component: CometChatSearchMessagesListComponent;
  let service: MockSearchMessagesService;

  beforeEach(async () => {
    // Default to a quiet resolution; the ngOnInit tests override this per case.
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(null as unknown as CometChat.User);

    await TestBed.configureTestingModule({
      imports: [CometChatSearchMessagesListComponent],
      providers: [{ provide: SearchMessagesService, useClass: MockSearchMessagesService }],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatSearchMessagesListComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(SearchMessagesService) as unknown as MockSearchMessagesService;
    // The template is irrelevant to every assertion here, and keeping it out means
    // inputs can still be set without tripping the changed-after-checked guard.
    component.hideSection = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor effect — stateChange output', () => {
    it('emits the current fetch state when change detection first runs', () => {
      const emitted: States[] = [];
      component.stateChange.subscribe(state => emitted.push(state));

      fixture.detectChanges();

      expect(emitted.length).toBeGreaterThan(0);
      expect(emitted[emitted.length - 1]).toBe(States.loaded);
    });

    it('emits the error state through the same output', () => {
      const emitted: States[] = [];
      component.stateChange.subscribe(state => emitted.push(state));
      fixture.detectChanges();

      service.fetchState.set(States.error);
      fixture.detectChanges();

      expect(emitted[emitted.length - 1]).toBe(States.error);
    });

    it('emits every distinct state in the order the service moved through them', () => {
      const emitted: States[] = [];
      component.stateChange.subscribe(state => emitted.push(state));
      fixture.detectChanges();

      service.fetchState.set(States.loading);
      fixture.detectChanges();
      service.fetchState.set(States.empty);
      fixture.detectChanges();
      service.fetchState.set(States.loaded);
      fixture.detectChanges();

      expect(emitted).toEqual([States.loaded, States.loading, States.empty, States.loaded]);
    });

    it('does not re-emit when change detection runs without a state change', () => {
      const emitted: States[] = [];
      component.stateChange.subscribe(state => emitted.push(state));
      fixture.detectChanges();
      const afterFirstRun = emitted.length;

      fixture.detectChanges();
      fixture.detectChanges();

      expect(emitted.length).toBe(afterFirstRun);
    });

  });

  describe('isLoading', () => {
    it('is true while the service reports loading', () => {
      service.fetchState.set(States.loading);
      expect(component.isLoading).toBe(true);
    });

    it('is false once results are loaded', () => {
      service.fetchState.set(States.loaded);
      expect(component.isLoading).toBe(false);
    });

    it('is false in the error state', () => {
      service.fetchState.set(States.error);
      expect(component.isLoading).toBe(false);
    });
  });

  describe('listError', () => {
    it('is an Error carrying the search_error key in the error state', () => {
      service.fetchState.set(States.error);

      const error = component.listError;

      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe('search_error');
    });

    it('is null when results are loaded', () => {
      service.fetchState.set(States.loaded);
      expect(component.listError).toBeNull();
    });

    it('clears back to null when the service leaves the error state', () => {
      service.fetchState.set(States.error);
      expect(component.listError).not.toBeNull();

      service.fetchState.set(States.loaded);

      expect(component.listError).toBeNull();
    });
  });

  describe('useScrollPagination', () => {
    it('is true by default, since alwaysShowSeeMore defaults to false', () => {
      expect(component.alwaysShowSeeMore).toBe(false);
      expect(component.useScrollPagination).toBe(true);
    });

    it('is false when alwaysShowSeeMore is on', () => {
      component.alwaysShowSeeMore = true;
      expect(component.useScrollPagination).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('keeps the user the SDK resolves', async () => {
      const user = userWithUid('sdk-user');
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(user);

      await component.ngOnInit();

      expect((component as never as { loggedInUser: CometChat.User | null }).loggedInUser).toBe(user);
    });

    it('does not consult the UI Kit cache when the SDK resolves', async () => {
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(userWithUid('sdk-user'));
      const uiKitSpy = vi.spyOn(CometChatUIKit, 'getLoggedInUser');

      await component.ngOnInit();

      expect(uiKitSpy).not.toHaveBeenCalled();
    });

    it('marks the resolved user as "you" in the subtitle prefix', async () => {
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(userWithUid('u1'));
      await component.ngOnInit();

      const prefix = component.getSubtitleSenderPrefix(messageFrom('u1', 'Alice'));

      expect(prefix).toBe(`${CometChatLocalize.getLocalizedString('search_message_subtitle_you')}:`);
      expect(prefix).not.toBe('Alice:');
    });

    it('names other senders in the subtitle prefix', async () => {
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(userWithUid('u1'));
      await component.ngOnInit();

      expect(component.getSubtitleSenderPrefix(messageFrom('u2', 'Alice'))).toBe('Alice:');
    });

    it('falls back to the UI Kit cache when the SDK call rejects', async () => {
      const cached = userWithUid('cached-user');
      vi.spyOn(CometChat, 'getLoggedinUser').mockRejectedValue(new Error('not logged in'));
      const uiKitSpy = vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(cached);

      await component.ngOnInit();

      expect(uiKitSpy).toHaveBeenCalled();
      expect((component as never as { loggedInUser: CometChat.User | null }).loggedInUser).toBe(cached);
    });

    it('treats the cached fallback user as "you" in the subtitle prefix', async () => {
      vi.spyOn(CometChat, 'getLoggedinUser').mockRejectedValue(new Error('not logged in'));
      vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(userWithUid('u9'));

      await component.ngOnInit();

      const prefix = component.getSubtitleSenderPrefix(messageFrom('u9', 'Bob'));

      expect(prefix).toBe(`${CometChatLocalize.getLocalizedString('search_message_subtitle_you')}:`);
    });

    it('normalises an undefined cached user to null', async () => {
      vi.spyOn(CometChat, 'getLoggedinUser').mockRejectedValue(new Error('not logged in'));
      vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(
        undefined as unknown as CometChat.User
      );

      await component.ngOnInit();

      expect((component as never as { loggedInUser: CometChat.User | null }).loggedInUser).toBeNull();
    });

    it('marks nobody as "you" when neither source yields a user', async () => {
      vi.spyOn(CometChat, 'getLoggedinUser').mockRejectedValue(new Error('not logged in'));
      vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(null);

      await component.ngOnInit();

      expect(component.getSubtitleSenderPrefix(messageFrom('u1', 'Alice'))).toBe('Alice:');
    });

    it('leaves every sender unprefixed once the search is scoped to one conversation', async () => {
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(userWithUid('u1'));
      component.uid = 'u2';

      await component.ngOnInit();

      expect(component.getSubtitleSenderPrefix(messageFrom('u1', 'Alice'))).toBe('');
    });
  });

  describe('ngOnChanges', () => {
    const change = (value: unknown): SimpleChange => new SimpleChange(null, value, true);

    it('searches when the keyword changes', () => {
      component.searchKeyword = 'hello';

      component.ngOnChanges({ searchKeyword: change('hello') } as SimpleChanges);

      expect(service.search).toHaveBeenCalledTimes(1);
    });

    it('searches when the active filters change', () => {
      component.activeFilters = [CometChatSearchFilter.Messages];

      component.ngOnChanges({ activeFilters: change([CometChatSearchFilter.Messages]) } as SimpleChanges);

      expect(service.search).toHaveBeenCalledTimes(1);
    });

    it('searches when the uid changes', () => {
      component.uid = 'u1';

      component.ngOnChanges({ uid: change('u1') } as SimpleChanges);

      expect(service.search).toHaveBeenCalledTimes(1);
    });

    it('searches when the guid changes', () => {
      component.guid = 'g1';

      component.ngOnChanges({ guid: change('g1') } as SimpleChanges);

      expect(service.search).toHaveBeenCalledTimes(1);
    });

    it('searches once when several search inputs change together', () => {
      component.ngOnChanges({
        searchKeyword: change('hi'),
        activeFilters: change([]),
        uid: change('u1'),
        guid: change('g1'),
      } as SimpleChanges);

      expect(service.search).toHaveBeenCalledTimes(1);
    });

    it('ignores a change to an input that is not part of the search criteria', () => {
      component.ngOnChanges({ alwaysShowSeeMore: change(true) } as SimpleChanges);

      expect(service.search).not.toHaveBeenCalled();
    });

    it('ignores an empty changes object', () => {
      component.ngOnChanges({} as SimpleChanges);

      expect(service.search).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('resets the service', () => {
      component.ngOnDestroy();

      expect(service.reset).toHaveBeenCalledTimes(1);
    });

    it('resets the service when the view is destroyed', () => {
      fixture.detectChanges();

      fixture.destroy();

      expect(service.reset).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleItemClick', () => {
    it('emits the clicked message with the current keyword', () => {
      component.searchKeyword = 'invoice';
      const message = messageFrom('u1', 'Alice');
      const emitted: { message: CometChat.BaseMessage; searchKeyword: string }[] = [];
      component.itemClick.subscribe(payload => emitted.push(payload));

      component.handleItemClick(message);

      expect(emitted).toEqual([{ message, searchKeyword: 'invoice' }]);
    });

    it('emits the keyword as it stands at click time, not at subscription time', () => {
      component.searchKeyword = 'first';
      const emitted: { searchKeyword: string }[] = [];
      component.itemClick.subscribe(payload => emitted.push(payload));

      component.searchKeyword = 'second';
      component.handleItemClick(messageFrom('u1', 'Alice'));

      expect(emitted[0].searchKeyword).toBe('second');
    });

  });

  describe('handleLoadMore', () => {
    let loadComplete: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      loadComplete = vi.fn();
      (component as never as { paginatedList: unknown }).paginatedList = { loadComplete };
    });

    it('asks the service for the next page', async () => {
      component.handleLoadMore();
      await flush();

      expect(service.loadMore).toHaveBeenCalledTimes(1);
    });

    it('tells the paginated list the load finished on success', async () => {
      component.handleLoadMore();
      await flush();

      expect(loadComplete).toHaveBeenCalledTimes(1);
    });

    it('still tells the paginated list the load finished when the page fails', async () => {
      const failure = new Error('page failed');
      service.loadMore.mockRejectedValue(failure);
      const errors: unknown[] = [];
      component.searchError.subscribe(err => errors.push(err));

      component.handleLoadMore();
      await flush();

      expect(loadComplete).toHaveBeenCalledTimes(1);
      expect(errors).toEqual([failure]);
    });

    it('finishes the success path quietly when the paginated list is absent', async () => {
      (component as never as { paginatedList: unknown }).paginatedList = undefined;
      const errors: unknown[] = [];
      component.searchError.subscribe(err => errors.push(err));

      component.handleLoadMore();
      await flush();

      expect(service.loadMore).toHaveBeenCalledTimes(1);
      expect(errors).toEqual([]);
    });

    it('still reports the failure when the paginated list is absent', async () => {
      const failure = new Error('page failed');
      service.loadMore.mockRejectedValue(failure);
      (component as never as { paginatedList: unknown }).paginatedList = undefined;
      const errors: unknown[] = [];
      component.searchError.subscribe(err => errors.push(err));

      component.handleLoadMore();
      await flush();

      expect(errors).toEqual([failure]);
    });
  });

  describe('handleSeeMore', () => {
    let loadComplete: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      loadComplete = vi.fn();
      (component as never as { paginatedList: unknown }).paginatedList = { loadComplete };
    });

    it('asks the service for the next page', async () => {
      component.handleSeeMore();
      await flush();

      expect(service.loadMore).toHaveBeenCalledTimes(1);
    });

    it('emits the failure when the next page fails', async () => {
      const failure = new Error('see more failed');
      service.loadMore.mockRejectedValue(failure);
      const errors: unknown[] = [];
      component.searchError.subscribe(err => errors.push(err));

      component.handleSeeMore();
      await flush();

      expect(errors).toEqual([failure]);
    });

    it('leaves the paginated list alone on success, unlike scroll pagination', async () => {
      component.handleSeeMore();
      await flush();

      expect(loadComplete).not.toHaveBeenCalled();
    });

    it('leaves the paginated list alone on failure, unlike scroll pagination', async () => {
      const failure = new Error('see more failed');
      service.loadMore.mockRejectedValue(failure);
      const errors: unknown[] = [];
      component.searchError.subscribe(err => errors.push(err));

      component.handleSeeMore();
      await flush();

      expect(loadComplete).not.toHaveBeenCalled();
      expect(errors).toEqual([failure]);
    });
  });

  describe('triggerSearch, reached through ngOnChanges', () => {
    const keywordChanged = (): SimpleChanges =>
      ({ searchKeyword: new SimpleChange(null, 'x', true) }) as SimpleChanges;

    it('passes the search criteria in the order the service expects', () => {
      const builder = { setSearchKeyword: vi.fn() } as unknown as CometChat.MessagesRequestBuilder;
      component.searchKeyword = 'invoice';
      component.activeFilters = [CometChatSearchFilter.Messages];
      component.uid = 'u1';
      component.guid = 'g1';
      component.messagesRequestBuilder = builder;
      component.alwaysShowSeeMore = true;

      component.ngOnChanges(keywordChanged());

      expect(service.search).toHaveBeenCalledWith(
        'invoice',
        [CometChatSearchFilter.Messages],
        'u1',
        'g1',
        builder,
        true
      );
    });

    it('passes the undefined scope and builder through untouched when none were set', () => {
      component.searchKeyword = 'invoice';

      component.ngOnChanges(keywordChanged());

      expect(service.search).toHaveBeenCalledWith('invoice', [], undefined, undefined, undefined, false);
    });

    it('routes a failed search to searchError', async () => {
      const failure = new Error('search failed');
      service.search.mockRejectedValue(failure);
      const errors: unknown[] = [];
      component.searchError.subscribe(err => errors.push(err));

      component.ngOnChanges(keywordChanged());
      await flush();

      expect(errors).toEqual([failure]);
    });

  });
});
