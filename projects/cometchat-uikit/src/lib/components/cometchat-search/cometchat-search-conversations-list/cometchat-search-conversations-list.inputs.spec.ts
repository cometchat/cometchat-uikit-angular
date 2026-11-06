/**
 * CometChatSearchConversationsListComponent input tests.
 *
 * Every input is set and checked against what it changes: the search it runs,
 * which states and templates render, and what each result row is given. The
 * search service is a signal-backed double, and the row and paginated-list
 * children are stubs that only record their inputs. The real child classes are
 * deliberately not named here: the prop-coverage gate credits a spec that names
 * a class, and these tests exercise only this component's props.
 *
 * @module components/cometchat-search
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewChild,
  Type,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSearchConversationsListComponent } from './cometchat-search-conversations-list.component';
import { SearchConversationsService } from '../../../services/search-conversations.service';
import { TranslatePipe } from '../../../resources/CometChatLocalize/translate.pipe';
import { CometChatSearchFilter, States } from '../../../Enums/Enums';
import { CometChatTextFormatter } from '../../../formatters/cometchat-text-formatter';

// ---------------------------------------------------------------------------
// Doubles
// ---------------------------------------------------------------------------

class SearchServiceDouble {
  conversations = signal<CometChat.Conversation[]>([]);
  fetchState = signal<States>(States.loaded);
  hasMoreResults = signal(false);
  typingIndicatorMap = signal(new Map<string, CometChat.TypingIndicator>());
  search = vi.fn(() => Promise.resolve());
  loadMore = vi.fn(() => Promise.resolve());
  attachListeners = vi.fn();
  reset = vi.fn();
}

@Component({ selector: 'cometchat-conversation-item', standalone: true, template: '' })
class ConversationItemStub {
  @Input() conversation: unknown;
  @Input() tabIndex: unknown;
  @Input() loggedInUser: unknown;
  @Input() typingIndicator: unknown;
  @Input() hideReceipts: unknown;
  @Input() hideUserStatus: unknown;
  @Input() hideGroupType: unknown;
  @Input() textFormatters: unknown;
  @Input() dateFormat: unknown;
  @Input() leadingView: unknown;
  @Input() titleView: unknown;
  @Input() subtitleView: unknown;
  @Input() trailingView: unknown;
  @Input() contextMenuOptions: unknown;
  @Output() itemClick = new EventEmitter<unknown>();
}

@Component({ selector: 'cometchat-paginated-list', standalone: true, template: '' })
class PaginatedListStub {
  @Input() items: unknown;
  @Input() trackByFn: unknown;
  @Input() isLoading: unknown;
  @Input() hasMore: unknown;
  @Input() error: unknown;
  @Input() hideError: unknown;
  @Input() itemTemplate: unknown;
  @Input() loadingTemplate: unknown;
  @Input() emptyTemplate: unknown;
  @Input() errorTemplate: unknown;
  @Input() enableKeyboardNavigation: unknown;
  @Input() observeScrollFromViewport: unknown;
  @Input() ariaLabel: unknown;
  @Output() loadMore = new EventEmitter<void>();
  loadComplete = vi.fn();
}

/** Supplies distinct TemplateRefs; the row template prints the conversation it was given. */
@Component({
  standalone: true,
  template: `
    <ng-template #row let-c><div class="custom-row">{{ c.getConversationId() }}</div></ng-template>
    <ng-template #a><div class="custom-a">A</div></ng-template>
    <ng-template #b><div class="custom-b">B</div></ng-template>
    <ng-template #c><div class="custom-c">C</div></ng-template>
    <ng-template #d><div class="custom-d">D</div></ng-template>
  `,
})
class TemplatesHost {
  @ViewChild('row', { static: true }) row!: TemplateRef<{ $implicit: CometChat.Conversation }>;
  @ViewChild('a', { static: true }) a!: TemplateRef<any>;
  @ViewChild('b', { static: true }) b!: TemplateRef<any>;
  @ViewChild('c', { static: true }) c!: TemplateRef<any>;
  @ViewChild('d', { static: true }) d!: TemplateRef<any>;
}

function conversation(id: string): CometChat.Conversation {
  return {
    getConversationId: () => id,
    getConversationWith: () => ({ getGuid: () => `group-${id}`, getName: () => id }),
  } as unknown as CometChat.Conversation;
}

describe('CometChatSearchConversationsListComponent inputs', () => {
  let fixture: ComponentFixture<CometChatSearchConversationsListComponent>;
  let component: CometChatSearchConversationsListComponent;
  let service: SearchServiceDouble;
  let tpl: TemplatesHost;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [CometChatSearchConversationsListComponent, TemplatesHost],
      providers: [{ provide: SearchConversationsService, useClass: SearchServiceDouble }],
    });
    TestBed.overrideComponent(CometChatSearchConversationsListComponent, {
      set: { imports: [CommonModule, TranslatePipe, ConversationItemStub, PaginatedListStub] },
    });
    await TestBed.compileComponents();

    const host = TestBed.createComponent(TemplatesHost);
    host.detectChanges();
    tpl = host.componentInstance;

    fixture = TestBed.createComponent(CometChatSearchConversationsListComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(SearchConversationsService) as unknown as SearchServiceDouble;
  });

  const q = (selector: string): HTMLElement | null => fixture.nativeElement.querySelector(selector);
  const all = <T>(type: Type<T>): T[] =>
    fixture.debugElement.queryAll(By.directive(type)).map((d) => d.componentInstance as T);

  function showResults(...ids: string[]): void {
    service.conversations.set(ids.map(conversation));
    service.fetchState.set(States.loaded);
    fixture.detectChanges();
  }

  function showState(state: States): void {
    service.fetchState.set(state);
    fixture.detectChanges();
  }

  // -------------------------------------------------------------------------
  // The search it runs
  // -------------------------------------------------------------------------

  describe('search', () => {
    it('activeFilters runs a search with those filters', () => {
      const filters = [CometChatSearchFilter.Unread];
      fixture.componentRef.setInput('activeFilters', filters);
      fixture.detectChanges();

      expect(service.search).toHaveBeenCalledWith('', filters, undefined);
    });

    it('conversationsRequestBuilder is handed to the search', () => {
      const builder = { kind: 'builder' } as unknown as CometChat.ConversationsRequestBuilder;
      fixture.componentRef.setInput('conversationsRequestBuilder', builder);
      fixture.componentRef.setInput('searchKeyword', 'ann');
      fixture.detectChanges();

      expect(service.search).toHaveBeenCalledWith('ann', [], builder);
    });

    it('a failed search is emitted as searchError', async () => {
      const failure = { code: 'ERR_SEARCH' };
      service.search.mockReturnValueOnce(Promise.reject(failure));
      const spy = vi.fn();
      component.searchError.subscribe(spy);

      fixture.componentRef.setInput('searchKeyword', 'ann');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(spy).toHaveBeenCalledWith(failure);
    });

    it('a failed "See more" is emitted as searchError', async () => {
      const failure = { code: 'ERR_MORE' };
      service.loadMore.mockReturnValueOnce(Promise.reject(failure));
      service.hasMoreResults.set(true);
      const spy = vi.fn();
      component.searchError.subscribe(spy);
      showResults('c1');

      q('[data-testid="search-conversations-see-more"]')!.click();
      await fixture.whenStable();

      expect(spy).toHaveBeenCalledWith(failure);
    });
  });

  // -------------------------------------------------------------------------
  // Layout and states
  // -------------------------------------------------------------------------

  it('hideSection removes the whole section, header included', () => {
    showResults('c1');
    expect(q('.cometchat-search__conversations')).not.toBeNull();

    fixture.componentRef.setInput('hideSection', true);
    fixture.detectChanges();
    expect(q('.cometchat-search__conversations')).toBeNull();
  });

  it('useScrollPagination switches from the "See more" list to the paginated list', () => {
    service.hasMoreResults.set(true);
    showResults('c1', 'c2');
    expect(all(PaginatedListStub)).toHaveLength(0);
    expect(q('[data-testid="search-conversations-see-more"]')).not.toBeNull();

    fixture.componentRef.setInput('useScrollPagination', true);
    fixture.detectChanges();

    const [list] = all(PaginatedListStub);
    expect(list.items).toEqual(service.conversations());
    expect(q('.cometchat-search__conversations-full')).not.toBeNull();
    expect(q('[data-testid="search-conversations-see-more"]')).toBeNull();
  });

  describe('suppressEmptyErrorView', () => {
    it('hides the empty and error views so the parent can show one for both lists', () => {
      showState(States.empty);
      expect(q('.cometchat-search__empty-view')).not.toBeNull();

      fixture.componentRef.setInput('suppressEmptyErrorView', true);
      fixture.detectChanges();
      expect(q('.cometchat-search__empty-view')).toBeNull();

      showState(States.error);
      expect(q('.cometchat-search__error-view')).toBeNull();
    });

    it('withholds the empty and error templates from the paginated list', () => {
      fixture.componentRef.setInput('useScrollPagination', true);
      fixture.componentRef.setInput('suppressEmptyErrorView', true);
      showState(States.error);

      const [list] = all(PaginatedListStub);
      expect(list.hideError).toBe(true);
      expect(list.error).toBeNull();
      expect(list.emptyTemplate).toBeUndefined();
      expect(list.errorTemplate).toBeUndefined();
    });
  });

  describe('state views', () => {
    it('loadingView replaces the shimmer', () => {
      fixture.componentRef.setInput('loadingView', tpl.a);
      showState(States.loading);
      expect(q('.custom-a')).not.toBeNull();
      expect(q('.cometchat-search__shimmer')).toBeNull();
    });

    it('emptyView replaces the built-in empty view', () => {
      fixture.componentRef.setInput('emptyView', tpl.b);
      showState(States.empty);
      expect(q('.custom-b')).not.toBeNull();
      expect(q('.cometchat-search__empty-view')).toBeNull();
    });

    it('errorView replaces the built-in error view', () => {
      fixture.componentRef.setInput('errorView', tpl.c);
      showState(States.error);
      expect(q('.custom-c')).not.toBeNull();
      expect(q('.cometchat-search__error-view')).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // What each row is given
  // -------------------------------------------------------------------------

  describe('rows', () => {
    it('itemTemplate replaces the whole row and receives the conversation', () => {
      fixture.componentRef.setInput('itemTemplate', tpl.row);
      showResults('c1', 'c2');

      const rows = Array.from(fixture.nativeElement.querySelectorAll('.custom-row')) as HTMLElement[];
      expect(rows.map((r) => r.textContent)).toEqual(['c1', 'c2']);
      expect(all(ConversationItemStub)).toHaveLength(0);
    });

    it('hands the visibility flags to every row', () => {
      fixture.componentRef.setInput('hideUserStatus', true);
      fixture.componentRef.setInput('hideGroupType', true);
      fixture.componentRef.setInput('hideReceipts', true);
      showResults('c1', 'c2');

      const rows = all(ConversationItemStub);
      expect(rows).toHaveLength(2);
      for (const row of rows) {
        expect(row.hideUserStatus).toBe(true);
        expect(row.hideGroupType).toBe(true);
        expect(row.hideReceipts).toBe(true);
      }
    });

    it('hands textFormatters to every row', () => {
      const formatters = [{} as CometChatTextFormatter];
      fixture.componentRef.setInput('textFormatters', formatters);
      showResults('c1');

      expect(all(ConversationItemStub)[0].textFormatters).toBe(formatters);
    });

    it('hands each slot template to every row', () => {
      fixture.componentRef.setInput('leadingView', tpl.a);
      fixture.componentRef.setInput('titleView', tpl.b);
      fixture.componentRef.setInput('subtitleView', tpl.c);
      fixture.componentRef.setInput('trailingView', tpl.d);
      showResults('c1');

      const [row] = all(ConversationItemStub);
      expect(row.leadingView).toBe(tpl.a);
      expect(row.titleView).toBe(tpl.b);
      expect(row.subtitleView).toBe(tpl.c);
      expect(row.trailingView).toBe(tpl.d);
    });

    it('conversationOptions builds each row its own menu', () => {
      const options = vi.fn((c: CometChat.Conversation) => [{ id: `menu-${c.getConversationId()}` }]);
      fixture.componentRef.setInput('conversationOptions', options);
      showResults('c1', 'c2');

      expect(all(ConversationItemStub).map((r) => r.contextMenuOptions)).toEqual([
        [{ id: 'menu-c1' }],
        [{ id: 'menu-c2' }],
      ]);
    });

    it('gives rows no menu without conversationOptions', () => {
      showResults('c1');
      expect(all(ConversationItemStub)[0].contextMenuOptions).toBeUndefined();
    });
  });
});
