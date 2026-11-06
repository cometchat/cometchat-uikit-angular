// The calls SDK reaches for JitsiMeetJS at import time, which jsdom has no window for.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

/**
 * CometChatSearchMessagesListComponent input tests: the state views, the
 * row and slot templates, and suppressEmptyErrorView, each set and checked
 * against what renders. The paginated-list child is a stub that records its
 * inputs; the real class is deliberately not named here, because the
 * prop-coverage gate credits a spec that names a class.
 *
 * @module components/cometchat-search
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Component, EventEmitter, Input, Output, TemplateRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSearchMessagesListComponent } from './cometchat-search-messages-list.component';
import { SearchMessagesService } from '../../../services/search-messages.service';
import { TranslatePipe } from '../../../resources/CometChatLocalize/translate.pipe';
import { States } from '../../../Enums/Enums';

class SearchServiceDouble {
  messages = signal<CometChat.BaseMessage[]>([]);
  fetchState = signal<States>(States.loaded);
  hasMoreResults = signal(false);
  search = vi.fn().mockResolvedValue(undefined);
  loadMore = vi.fn().mockResolvedValue(undefined);
  reset = vi.fn();
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

/** Distinct TemplateRefs; each slot template prints the id of the message it was given. */
@Component({
  standalone: true,
  template: `
    <ng-template #row let-m><div class="custom-row">row {{ m.getId() }}</div></ng-template>
    <ng-template #leading let-m><div class="custom-leading">leading {{ m.getId() }}</div></ng-template>
    <ng-template #title let-m><div class="custom-title">title {{ m.getId() }}</div></ng-template>
    <ng-template #subtitle let-m><div class="custom-subtitle">subtitle {{ m.getId() }}</div></ng-template>
    <ng-template #trailing let-m><div class="custom-trailing">trailing {{ m.getId() }}</div></ng-template>
    <ng-template #loading><div class="custom-loading">Loading</div></ng-template>
    <ng-template #empty><div class="custom-empty">Empty</div></ng-template>
    <ng-template #failed><div class="custom-error">Error</div></ng-template>
  `,
})
class TemplatesHost {
  @ViewChild('row', { static: true }) row!: TemplateRef<any>;
  @ViewChild('leading', { static: true }) leading!: TemplateRef<any>;
  @ViewChild('title', { static: true }) title!: TemplateRef<any>;
  @ViewChild('subtitle', { static: true }) subtitle!: TemplateRef<any>;
  @ViewChild('trailing', { static: true }) trailing!: TemplateRef<any>;
  @ViewChild('loading', { static: true }) loading!: TemplateRef<any>;
  @ViewChild('empty', { static: true }) empty!: TemplateRef<any>;
  @ViewChild('failed', { static: true }) failed!: TemplateRef<any>;
}

/** A plain text result from another user. */
function textMessage(id: number): CometChat.BaseMessage {
  return {
    getId: () => id,
    getType: () => 'text',
    getCategory: () => 'message',
    getText: () => `hello ${id}`,
    getSentAt: () => Date.UTC(2024, 0, id) / 1000,
    getSender: () => ({ getUid: () => 'other', getName: () => 'Other' }),
    getReceiverType: () => 'user',
    getReceiver: () => ({ getName: () => 'Me' }),
    getMetadata: () => undefined,
    getParentMessageId: () => undefined,
    getMentionedUsers: () => [],
  } as unknown as CometChat.BaseMessage;
}

describe('CometChatSearchMessagesListComponent inputs', () => {
  let fixture: ComponentFixture<CometChatSearchMessagesListComponent>;
  let service: SearchServiceDouble;
  let tpl: TemplatesHost;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [CometChatSearchMessagesListComponent, TemplatesHost],
      providers: [{ provide: SearchMessagesService, useClass: SearchServiceDouble }],
    });
    TestBed.overrideComponent(CometChatSearchMessagesListComponent, {
      set: { imports: [CommonModule, TranslatePipe, PaginatedListStub] },
    });
    await TestBed.compileComponents();

    const host = TestBed.createComponent(TemplatesHost);
    host.detectChanges();
    tpl = host.componentInstance;

    fixture = TestBed.createComponent(CometChatSearchMessagesListComponent);
    service = TestBed.inject(SearchMessagesService) as unknown as SearchServiceDouble;
    // The "See more" layout renders rows itself; the default scroll layout hands them to the list.
    fixture.componentRef.setInput('alwaysShowSeeMore', true);
  });

  const q = (selector: string): HTMLElement | null => fixture.nativeElement.querySelector(selector);
  const texts = (selector: string): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll(selector)).map((e) => (e as HTMLElement).textContent!.trim());

  function showResults(...ids: number[]): void {
    service.messages.set(ids.map(textMessage));
    service.fetchState.set(States.loaded);
    fixture.detectChanges();
  }

  function showState(state: States): void {
    service.fetchState.set(state);
    fixture.detectChanges();
  }

  describe('rows', () => {
    it('renders the built-in row parts without custom templates', () => {
      showResults(1);
      expect(q('.cometchat-search-messages__list-item')).not.toBeNull();
      expect(texts('.cometchat-search-messages__list-item-subtitle')[0]).toContain('hello 1');
      expect(q('.cometchat-search__messages-trailing-view-date')).not.toBeNull();
    });

    it('itemTemplate replaces each whole row and receives its message', () => {
      fixture.componentRef.setInput('itemTemplate', tpl.row);
      showResults(1, 2);

      expect(texts('.custom-row')).toEqual(['row 1', 'row 2']);
      expect(q('.cometchat-search-messages__list-item')).toBeNull();
    });

    it('leadingView fills the leading slot of each row', () => {
      fixture.componentRef.setInput('leadingView', tpl.leading);
      showResults(1, 2);
      expect(texts('.custom-leading')).toEqual(['leading 1', 'leading 2']);
    });

    it('titleView replaces the built-in title', () => {
      showResults(1);
      const builtInTitle = texts('.cometchat-search-messages__list-item-title')[0];

      fixture.componentRef.setInput('titleView', tpl.title);
      fixture.detectChanges();

      expect(texts('.cometchat-search-messages__list-item-title')).toEqual(['title 1']);
      expect(builtInTitle).not.toBe('title 1');
    });

    it('subtitleView replaces the built-in subtitle', () => {
      fixture.componentRef.setInput('subtitleView', tpl.subtitle);
      showResults(1);

      expect(texts('.cometchat-search-messages__list-item-subtitle')).toEqual(['subtitle 1']);
    });

    it('trailingView replaces the built-in date', () => {
      fixture.componentRef.setInput('trailingView', tpl.trailing);
      showResults(1);

      expect(texts('.custom-trailing')).toEqual(['trailing 1']);
      expect(q('.cometchat-search__messages-trailing-view-date')).toBeNull();
    });
  });

  describe('messageDateTimeFormat', () => {
    it('formats the date shown on each row', () => {
      showResults(15);
      const builtIn = texts('.cometchat-search__messages-trailing-view-date')[0];

      fixture.componentRef.setInput('messageDateTimeFormat', {
        today: '[sent today]',
        yesterday: '[sent yesterday]',
        lastWeek: '[sent this week]',
        otherDays: '[sent] YYYY',
      });
      fixture.detectChanges();

      // The result is from 15 January 2024 in any time zone, so it falls under otherDays.
      expect(texts('.cometchat-search__messages-trailing-view-date')).toEqual(['sent 2024']);
      expect(builtIn).not.toBe('sent 2024');
    });
  });

  describe('state views', () => {
    it('loadingView replaces the shimmer', () => {
      fixture.componentRef.setInput('loadingView', tpl.loading);
      showState(States.loading);
      expect(q('.custom-loading')).not.toBeNull();
      expect(q('.cometchat-search__shimmer')).toBeNull();
    });

    it('emptyView replaces the built-in empty view', () => {
      fixture.componentRef.setInput('emptyView', tpl.empty);
      showState(States.empty);
      expect(q('.custom-empty')).not.toBeNull();
      expect(q('.cometchat-search__empty-view')).toBeNull();
    });

    it('errorView replaces the built-in error view', () => {
      fixture.componentRef.setInput('errorView', tpl.failed);
      showState(States.error);
      expect(q('.custom-error')).not.toBeNull();
      expect(q('.cometchat-search__error-view')).toBeNull();
    });
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
      fixture.componentRef.setInput('alwaysShowSeeMore', false);
      fixture.componentRef.setInput('suppressEmptyErrorView', true);
      showState(States.error);

      const list = fixture.debugElement.query(By.directive(PaginatedListStub))
        .componentInstance as PaginatedListStub;
      expect(list.hideError).toBe(true);
      expect(list.error).toBeNull();
      expect(list.emptyTemplate).toBeUndefined();
      expect(list.errorTemplate).toBeUndefined();
    });
  });
});
