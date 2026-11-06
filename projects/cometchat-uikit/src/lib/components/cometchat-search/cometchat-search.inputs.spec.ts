/**
 * CometChatSearchComponent input tests.
 *
 * Every input is set and checked against what it changes: the filter bar, the
 * back button and the initial/empty/error views Search renders itself, and the
 * values it hands to its two result lists. The lists are replaced with stubs
 * that only record their inputs, so these tests stay on Search and off the SDK;
 * the lists' own behaviour is covered by their specs.
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
} from '@angular/core';
import { ComponentFixture, DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CometChatSearchComponent } from './cometchat-search.component';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatSearchFilter, CometChatSearchScope, States } from '../../Enums/Enums';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';

// ---------------------------------------------------------------------------
// Result-list stubs: same selectors and bindings, no behaviour
// ---------------------------------------------------------------------------

@Component({ selector: 'cometchat-search-conversations-list', standalone: true, template: '' })
class ConversationsListStub {
  @Input() searchKeyword: unknown;
  @Input() activeFilters: unknown;
  @Input() useScrollPagination: unknown;
  @Input() conversationsRequestBuilder: unknown;
  @Input() hideUserStatus: unknown;
  @Input() hideGroupType: unknown;
  @Input() hideReceipts: unknown;
  @Input() textFormatters: unknown;
  @Input() itemTemplate: unknown;
  @Input() leadingView: unknown;
  @Input() titleView: unknown;
  @Input() subtitleView: unknown;
  @Input() trailingView: unknown;
  @Input() loadingView: unknown;
  @Input() emptyView: unknown;
  @Input() errorView: unknown;
  @Input() conversationOptions: unknown;
  @Input() hideSection: unknown;
  @Input() suppressEmptyErrorView: unknown;
  @Output() stateChange = new EventEmitter<States>();
  @Output() itemClick = new EventEmitter<unknown>();
  @Output() searchError = new EventEmitter<unknown>();
}

@Component({ selector: 'cometchat-search-messages-list', standalone: true, template: '' })
class MessagesListStub {
  @Input() searchKeyword: unknown;
  @Input() activeFilters: unknown;
  @Input() uid: unknown;
  @Input() guid: unknown;
  @Input() alwaysShowSeeMore: unknown;
  @Input() messagesRequestBuilder: unknown;
  @Input() textFormatters: unknown;
  @Input() messageDateTimeFormat: unknown;
  @Input() itemTemplate: unknown;
  @Input() leadingView: unknown;
  @Input() titleView: unknown;
  @Input() subtitleView: unknown;
  @Input() trailingView: unknown;
  @Input() loadingView: unknown;
  @Input() emptyView: unknown;
  @Input() errorView: unknown;
  @Input() hideSection: unknown;
  @Input() suppressEmptyErrorView: unknown;
  @Output() stateChange = new EventEmitter<States>();
  @Output() itemClick = new EventEmitter<unknown>();
  @Output() searchError = new EventEmitter<unknown>();
}

/** Supplies distinct TemplateRefs to pass into Search. */
@Component({
  standalone: true,
  template: `
    <ng-template #a><div class="custom-a">A</div></ng-template>
    <ng-template #b><div class="custom-b">B</div></ng-template>
    <ng-template #c><div class="custom-c">C</div></ng-template>
    <ng-template #d><div class="custom-d">D</div></ng-template>
    <ng-template #e><div class="custom-e">E</div></ng-template>
  `,
})
class TemplatesHost {
  @ViewChild('a', { static: true }) a!: TemplateRef<unknown>;
  @ViewChild('b', { static: true }) b!: TemplateRef<unknown>;
  @ViewChild('c', { static: true }) c!: TemplateRef<unknown>;
  @ViewChild('d', { static: true }) d!: TemplateRef<unknown>;
  @ViewChild('e', { static: true }) e!: TemplateRef<unknown>;
}

describe('CometChatSearchComponent inputs', () => {
  let fixture: ComponentFixture<CometChatSearchComponent>;
  let component: CometChatSearchComponent;
  let tpl: TemplatesHost;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [CometChatSearchComponent, TemplatesHost],
      deferBlockBehavior: DeferBlockBehavior.Manual,
    });
    // Search's own imports with the two result lists swapped for stubs. The real list
    // classes are deliberately not named in this file: the prop-coverage gate credits
    // a spec that names a class, and these tests exercise only Search's props.
    TestBed.overrideComponent(CometChatSearchComponent, {
      set: { imports: [CommonModule, TranslatePipe, ConversationsListStub, MessagesListStub] },
    });
    await TestBed.compileComponents();

    const host = TestBed.createComponent(TemplatesHost);
    host.detectChanges();
    tpl = host.componentInstance;

    fixture = TestBed.createComponent(CometChatSearchComponent);
    component = fixture.componentInstance;
  });

  const q = (selector: string): HTMLElement | null => fixture.nativeElement.querySelector(selector);
  const filterIds = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('[data-testid^="search-filter-"]')).map((b) =>
      (b as HTMLElement).dataset['testid']!.replace('search-filter-', '')
    );

  /** Render, completing the result lists' @defer blocks (they wait for idle, which never comes here). */
  async function render(): Promise<void> {
    fixture.detectChanges();
    for (const block of await fixture.getDeferBlocks()) {
      await block.render(DeferBlockState.Complete);
    }
    fixture.detectChanges();
  }

  /** Render with a search keyword so the result lists are shown. */
  async function renderSearching(): Promise<void> {
    fixture.componentRef.setInput('defaultSearchText', 'hello');
    await render();
  }

  function child<T>(type: Type<T>): T | undefined {
    return fixture.debugElement.query(By.directive(type))?.componentInstance as T | undefined;
  }

  // -------------------------------------------------------------------------
  // What Search renders itself
  // -------------------------------------------------------------------------

  describe('filter bar', () => {
    it('searchFilters limits the filter chips to the ones given, in that order', async () => {
      fixture.componentRef.setInput('searchFilters', [
        CometChatSearchFilter.Videos,
        CometChatSearchFilter.Unread,
      ]);
      await render();
      expect(filterIds()).toEqual(['videos', 'unread']);
    });

    it('shows the conversation filters when searching everywhere', async () => {
      await render();
      expect(filterIds()).toContain('unread');
      expect(filterIds()).toContain('groups');
    });

    it('searchIn=[messages] drops the conversation-only filters', async () => {
      fixture.componentRef.setInput('searchIn', [CometChatSearchScope.Messages]);
      await render();

      expect(filterIds()).not.toContain('unread');
      expect(filterIds()).not.toContain('groups');
      expect(filterIds()).toContain('photos');
    });

    it('follows searchIn when it changes after the first render', async () => {
      await render();
      expect(filterIds()).toContain('unread');

      fixture.componentRef.setInput('searchIn', [CometChatSearchScope.Messages]);
      fixture.detectChanges();

      expect(filterIds()).not.toContain('unread');
      expect(filterIds()).toContain('photos');
    });

    it('follows searchFilters when it changes after the first render', async () => {
      await render();
      fixture.componentRef.setInput('searchFilters', [CometChatSearchFilter.Links]);
      fixture.detectChanges();
      expect(filterIds()).toEqual(['links']);
    });

    it('searchIn=[conversations] shows conversation results only', async () => {
      fixture.componentRef.setInput('searchIn', [CometChatSearchScope.Conversations]);
      await renderSearching();
      expect(child(ConversationsListStub)).toBeDefined();
      expect(child(MessagesListStub)).toBeUndefined();
    });

    it('initialSearchFilter starts with that filter pressed and results shown', async () => {
      fixture.componentRef.setInput('initialSearchFilter', CometChatSearchFilter.Photos);
      await render();

      expect(q('[data-testid="search-filter-photos"]')!.getAttribute('aria-pressed')).toBe('true');
      expect(q('.cometchat-search__initial-view')).toBeNull();
      expect(child(MessagesListStub)!.activeFilters).toEqual([CometChatSearchFilter.Photos]);
    });
  });

  it('hideBackButton removes the back button', async () => {
    await render();
    expect(q('[data-testid="search-back-button"]')).not.toBeNull();

    fixture.componentRef.setInput('hideBackButton', true);
    fixture.detectChanges();
    expect(q('[data-testid="search-back-button"]')).toBeNull();
  });

  describe('state views', () => {
    it('initialView replaces the built-in initial view', async () => {
      fixture.componentRef.setInput('initialView', tpl.a);
      await render();
      expect(q('.custom-a')?.textContent).toBe('A');
      expect(q('.cometchat-search__initial-view')).toBeNull();
    });

    it('emptyView replaces the unified empty view when both lists are empty', async () => {
      fixture.componentRef.setInput('emptyView', tpl.b);
      await renderSearching();
      child(ConversationsListStub)!.stateChange.emit(States.empty);
      child(MessagesListStub)!.stateChange.emit(States.empty);
      fixture.detectChanges();

      expect(q('.custom-b')?.textContent).toBe('B');
      expect(q('.cometchat-search__empty-view')).toBeNull();
    });

    it('errorView replaces the unified error view when both lists fail', async () => {
      fixture.componentRef.setInput('errorView', tpl.c);
      await renderSearching();
      child(ConversationsListStub)!.stateChange.emit(States.error);
      child(MessagesListStub)!.stateChange.emit(States.error);
      fixture.detectChanges();

      expect(q('.custom-c')?.textContent).toBe('C');
      expect(q('.cometchat-search__error-view')).toBeNull();
    });

    it('shows the built-in empty and error views without custom ones', async () => {
      await renderSearching();
      child(ConversationsListStub)!.stateChange.emit(States.empty);
      child(MessagesListStub)!.stateChange.emit(States.empty);
      fixture.detectChanges();
      expect(q('.cometchat-search__empty-view')).not.toBeNull();
    });

    it('loadingView, emptyView and errorView are also handed to both lists', async () => {
      fixture.componentRef.setInput('loadingView', tpl.a);
      fixture.componentRef.setInput('emptyView', tpl.b);
      fixture.componentRef.setInput('errorView', tpl.c);
      await renderSearching();

      for (const list of [child(ConversationsListStub)!, child(MessagesListStub)!]) {
        expect(list.loadingView).toBe(tpl.a);
        expect(list.emptyView).toBe(tpl.b);
        expect(list.errorView).toBe(tpl.c);
      }
    });
  });

  // -------------------------------------------------------------------------
  // What Search hands to the conversations list
  // -------------------------------------------------------------------------

  describe('conversations list', () => {
    it('receives the visibility flags', async () => {
      fixture.componentRef.setInput('hideGroupType', true);
      fixture.componentRef.setInput('hideUserStatus', true);
      fixture.componentRef.setInput('hideReceipts', true);
      await renderSearching();

      const list = child(ConversationsListStub)!;
      expect(list.hideGroupType).toBe(true);
      expect(list.hideUserStatus).toBe(true);
      expect(list.hideReceipts).toBe(true);
    });

    it('receives the request builder and the options callback unchanged', async () => {
      const builder = { kind: 'conversations' };
      const options = vi.fn(() => []);
      fixture.componentRef.setInput('conversationsRequestBuilder', builder);
      fixture.componentRef.setInput('conversationOptions', options);
      await renderSearching();

      const list = child(ConversationsListStub)!;
      expect(list.conversationsRequestBuilder).toBe(builder);
      expect(list.conversationOptions).toBe(options);
    });

    it('receives each conversation template in its slot', async () => {
      fixture.componentRef.setInput('conversationItemView', tpl.a);
      fixture.componentRef.setInput('conversationLeadingView', tpl.b);
      fixture.componentRef.setInput('conversationTitleView', tpl.c);
      fixture.componentRef.setInput('conversationSubtitleView', tpl.d);
      fixture.componentRef.setInput('conversationTrailingView', tpl.e);
      await renderSearching();

      const list = child(ConversationsListStub)!;
      expect(list.itemTemplate).toBe(tpl.a);
      expect(list.leadingView).toBe(tpl.b);
      expect(list.titleView).toBe(tpl.c);
      expect(list.subtitleView).toBe(tpl.d);
      expect(list.trailingView).toBe(tpl.e);
    });
  });

  // -------------------------------------------------------------------------
  // What Search hands to the messages list
  // -------------------------------------------------------------------------

  describe('messages list', () => {
    it('receives the request builder and the date format unchanged', async () => {
      const builder = { kind: 'messages' };
      const format = { today: 'HH:mm', yesterday: '[Yesterday]', otherDays: 'DD/MM' };
      fixture.componentRef.setInput('messagesRequestBuilder', builder);
      fixture.componentRef.setInput('messageSentAtDateTimeFormat', format);
      await renderSearching();

      const list = child(MessagesListStub)!;
      expect(list.messagesRequestBuilder).toBe(builder);
      expect(list.messageDateTimeFormat).toBe(format);
    });

    it('receives each message template in its slot', async () => {
      fixture.componentRef.setInput('messageItemView', tpl.a);
      fixture.componentRef.setInput('messageLeadingView', tpl.b);
      fixture.componentRef.setInput('messageTitleView', tpl.c);
      fixture.componentRef.setInput('messageSubtitleView', tpl.d);
      fixture.componentRef.setInput('messageTrailingView', tpl.e);
      await renderSearching();

      const list = child(MessagesListStub)!;
      expect(list.itemTemplate).toBe(tpl.a);
      expect(list.leadingView).toBe(tpl.b);
      expect(list.titleView).toBe(tpl.c);
      expect(list.subtitleView).toBe(tpl.d);
      expect(list.trailingView).toBe(tpl.e);
    });

    it('uid scopes the search to that user: messages only, conversation filters hidden', async () => {
      fixture.componentRef.setInput('uid', 'user-1');
      await renderSearching();

      expect(child(ConversationsListStub)).toBeUndefined();
      expect(child(MessagesListStub)!.uid).toBe('user-1');
      expect(filterIds()).not.toContain('unread');
      expect(filterIds()).not.toContain('groups');
    });

    it('guid scopes the search to that group: messages only, conversation filters hidden', async () => {
      fixture.componentRef.setInput('guid', 'group-1');
      await renderSearching();

      expect(child(ConversationsListStub)).toBeUndefined();
      expect(child(MessagesListStub)!.guid).toBe('group-1');
      expect(filterIds()).not.toContain('unread');
      expect(filterIds()).not.toContain('groups');
    });
  });

  it('follows uid when it changes while Search is open (switching chats)', async () => {
    await renderSearching();
    expect(child(ConversationsListStub)).toBeDefined();
    expect(filterIds()).toContain('unread');

    fixture.componentRef.setInput('uid', 'user-2');
    await render();

    expect(child(ConversationsListStub)).toBeUndefined();
    expect(child(MessagesListStub)!.uid).toBe('user-2');
    expect(filterIds()).not.toContain('unread');
  });

  it('follows guid when it changes while Search is open', async () => {
    fixture.componentRef.setInput('guid', 'group-1');
    await renderSearching();
    fixture.componentRef.setInput('guid', undefined);
    await render();

    expect(child(ConversationsListStub)).toBeDefined();
    expect(filterIds()).toContain('unread');
  });

  it('textFormatters replaces the default formatters on both lists', async () => {
    const formatters = [{} as CometChatTextFormatter];
    fixture.componentRef.setInput('textFormatters', formatters);
    await renderSearching();

    expect(child(ConversationsListStub)!.textFormatters).toBe(formatters);
    expect(child(MessagesListStub)!.textFormatters).toBe(formatters);
  });

  it('re-emits a search error from either list as searchError', async () => {
    await renderSearching();
    const spy = vi.fn();
    component.searchError.subscribe(spy);
    const fromConversations = { code: 'C' };
    const fromMessages = { code: 'M' };

    child(ConversationsListStub)!.searchError.emit(fromConversations);
    child(MessagesListStub)!.searchError.emit(fromMessages);

    expect(spy.mock.calls).toEqual([[fromConversations], [fromMessages]]);
  });
});

