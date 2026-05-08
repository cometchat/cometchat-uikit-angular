import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChatSearchComponent } from './cometchat-search.component';
import { CometChatSearchFilter, States } from '../../Enums/Enums';

describe('CometChatSearchComponent', () => {
  let component: CometChatSearchComponent;
  let fixture: ComponentFixture<CometChatSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatSearchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatSearchComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default search filters', () => {
    expect(component.searchFilters.length).toBe(7);
  });

  it('should have default empty searchIn', () => {
    expect(component.searchIn).toEqual([]);
  });

  it('should have hideBackButton default false', () => {
    expect(component.hideBackButton).toBe(false);
  });

  describe('handleClearSearch', () => {
    it('should reset search value and text', () => {
      component.searchValue.set('test');
      component.searchText.set('test');
      component.activeFilters.set([CometChatSearchFilter.Photos]);

      component.handleClearSearch();

      expect(component.searchValue()).toBe('');
      expect(component.searchText()).toBe('');
      expect(component.activeFilters()).toEqual([]);
    });
  });

  describe('handleFilterToggle', () => {
    it('should add filter when not active', () => {
      component.handleFilterToggle(CometChatSearchFilter.Photos);
      expect(component.activeFilters()).toContain(CometChatSearchFilter.Photos);
    });

    it('should remove filter when already active', () => {
      component.activeFilters.set([CometChatSearchFilter.Photos]);
      component.handleFilterToggle(CometChatSearchFilter.Photos);
      expect(component.activeFilters()).not.toContain(CometChatSearchFilter.Photos);
    });
  });

  describe('isFilterActive', () => {
    it('should return true for active filter', () => {
      component.activeFilters.set([CometChatSearchFilter.Groups]);
      expect(component.isFilterActive(CometChatSearchFilter.Groups)).toBe(true);
    });

    it('should return false for inactive filter', () => {
      expect(component.isFilterActive(CometChatSearchFilter.Groups)).toBe(false);
    });
  });

  describe('showInitialView', () => {
    it('should be true when no search text and no filters', () => {
      expect(component.showInitialView()).toBe(true);
    });

    it('should be false when search text exists', () => {
      component.searchText.set('hello');
      expect(component.showInitialView()).toBe(false);
    });

    it('should be false when filters are active', () => {
      component.activeFilters.set([CometChatSearchFilter.Unread]);
      expect(component.showInitialView()).toBe(false);
    });
  });

  describe('outputs', () => {
    it('should emit backClick', () => {
      const spy = vi.fn();
      component.backClick.subscribe(spy);
      component.handleBackClick();
      expect(spy).toHaveBeenCalled();
    });

    it('should emit conversationClick', () => {
      const spy = vi.fn();
      component.conversationClick.subscribe(spy);
      const event = { conversation: {} as any, searchKeyword: 'test' };
      component.handleConversationClick(event);
      expect(spy).toHaveBeenCalledWith(event);
    });

    it('should emit messageClick', () => {
      const spy = vi.fn();
      component.messageClick.subscribe(spy);
      const event = { message: {} as any, searchKeyword: 'test' };
      component.handleMessageClick(event);
      expect(spy).toHaveBeenCalledWith(event);
    });
  });

  describe('getFilterLabel', () => {
    it('should return a string for known filters', () => {
      const label = component.getFilterLabel(CometChatSearchFilter.Photos);
      expect(typeof label).toBe('string');
    });
  });

  describe('defaultSearchText', () => {
    it('should seed searchValue and searchText on init', () => {
      component.defaultSearchText = 'hello';
      component.ngOnInit();
      expect(component.searchValue()).toBe('hello');
      expect(component.searchText()).toBe('hello');
    });

    it('should make showInitialView return false', () => {
      component.defaultSearchText = 'hello';
      component.ngOnInit();
      expect(component.showInitialView()).toBe(false);
    });
  });

  describe('unified state signals', () => {
    it('should default conversationsState to States.loaded', () => {
      expect(component.conversationsState()).toBe(States.loaded);
    });

    it('should default messagesState to States.loaded', () => {
      expect(component.messagesState()).toBe(States.loaded);
    });

    it('should update conversationsState via handler', () => {
      component.handleConversationsStateChange(States.empty);
      expect(component.conversationsState()).toBe(States.empty);
    });

    it('should update messagesState via handler', () => {
      component.handleMessagesStateChange(States.error);
      expect(component.messagesState()).toBe(States.error);
    });
  });

  describe('bothScopesActive', () => {
    it('should return true when both showConversations and showMessages are true', () => {
      component.searchText.set('hello');
      component.activeFilters.set([]);
      expect(component.showConversations()).toBe(true);
      expect(component.showMessages()).toBe(true);
      expect(component.bothScopesActive()).toBe(true);
    });

    it('should return false when only conversations scope is active', () => {
      component.activeFilters.set([CometChatSearchFilter.Unread]);
      expect(component.showConversations()).toBe(true);
      expect(component.showMessages()).toBe(false);
      expect(component.bothScopesActive()).toBe(false);
    });
  });

  describe('showUnifiedEmpty', () => {
    it('should return true when both states are empty and both scopes active', () => {
      component.searchText.set('hello');
      component.handleConversationsStateChange(States.empty);
      component.handleMessagesStateChange(States.empty);
      expect(component.showUnifiedEmpty()).toBe(true);
    });

    it('should return false when only one state is empty', () => {
      component.searchText.set('hello');
      component.handleConversationsStateChange(States.empty);
      component.handleMessagesStateChange(States.loaded);
      expect(component.showUnifiedEmpty()).toBe(false);
    });

    it('should return false when bothScopesActive is false', () => {
      component.activeFilters.set([CometChatSearchFilter.Unread]);
      component.handleConversationsStateChange(States.empty);
      component.handleMessagesStateChange(States.empty);
      expect(component.showUnifiedEmpty()).toBe(false);
    });
  });

  describe('showUnifiedError', () => {
    it('should return true when both states are error and both scopes active', () => {
      component.searchText.set('hello');
      component.handleConversationsStateChange(States.error);
      component.handleMessagesStateChange(States.error);
      expect(component.showUnifiedError()).toBe(true);
    });

    it('should return false when only one state is error', () => {
      component.searchText.set('hello');
      component.handleConversationsStateChange(States.error);
      component.handleMessagesStateChange(States.loaded);
      expect(component.showUnifiedError()).toBe(false);
    });
  });

  describe('hideConversationsSection', () => {
    it('should return true when both empty', () => {
      component.searchText.set('hello');
      component.handleConversationsStateChange(States.empty);
      component.handleMessagesStateChange(States.empty);
      expect(component.hideConversationsSection()).toBe(true);
    });

    it('should return true when conversations empty and messages loaded', () => {
      component.searchText.set('hello');
      component.handleConversationsStateChange(States.empty);
      component.handleMessagesStateChange(States.loaded);
      expect(component.hideConversationsSection()).toBe(true);
    });

    it('should return false when conversations loaded', () => {
      component.searchText.set('hello');
      component.handleConversationsStateChange(States.loaded);
      component.handleMessagesStateChange(States.loaded);
      expect(component.hideConversationsSection()).toBe(false);
    });

    it('should return true when both error', () => {
      component.searchText.set('hello');
      component.handleConversationsStateChange(States.error);
      component.handleMessagesStateChange(States.error);
      expect(component.hideConversationsSection()).toBe(true);
    });
  });

  describe('hideMessagesSection', () => {
    it('should return true when both empty', () => {
      component.searchText.set('hello');
      component.handleConversationsStateChange(States.empty);
      component.handleMessagesStateChange(States.empty);
      expect(component.hideMessagesSection()).toBe(true);
    });

    it('should return true when messages empty and conversations loaded', () => {
      component.searchText.set('hello');
      component.handleConversationsStateChange(States.loaded);
      component.handleMessagesStateChange(States.empty);
      expect(component.hideMessagesSection()).toBe(true);
    });

    it('should return false when messages loaded', () => {
      component.searchText.set('hello');
      component.handleConversationsStateChange(States.loaded);
      component.handleMessagesStateChange(States.loaded);
      expect(component.hideMessagesSection()).toBe(false);
    });

    it('should return true when both error', () => {
      component.searchText.set('hello');
      component.handleConversationsStateChange(States.error);
      component.handleMessagesStateChange(States.error);
      expect(component.hideMessagesSection()).toBe(true);
    });
  });
});
