import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChatSearchConversationsListComponent } from './cometchat-search-conversations-list.component';

describe('CometChatSearchConversationsListComponent', () => {
  let component: CometChatSearchConversationsListComponent;
  let fixture: ComponentFixture<CometChatSearchConversationsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatSearchConversationsListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatSearchConversationsListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default empty search keyword', () => {
    expect(component.searchKeyword).toBe('');
  });

  it('should have default empty active filters', () => {
    expect(component.activeFilters).toEqual([]);
  });

  it('should have default useScrollPagination as false', () => {
    expect(component.useScrollPagination).toBe(false);
  });

  describe('trackByConversation', () => {
    it('should return conversation id', () => {
      const mockConv = { getConversationId: () => 'conv_123' } as any;
      expect(component.trackByConversation(0, mockConv)).toBe('conv_123');
    });
  });

  describe('getConversationName', () => {
    it('should return name from conversationWith', () => {
      const mockConv = {
        getConversationWith: () => ({ getName: () => 'Test User' }),
      } as any;
      expect(component.getConversationName(mockConv)).toBe('Test User');
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', () => {
      const mockConv = { getUnreadMessageCount: () => 5 } as any;
      expect(component.getUnreadCount(mockConv)).toBe(5);
    });

    it('should return 0 when null', () => {
      const mockConv = { getUnreadMessageCount: () => null } as any;
      expect(component.getUnreadCount(mockConv)).toBe(0);
    });
  });

  describe('itemClick output', () => {
    it('should emit conversation and keyword on handleItemClick', () => {
      const spy = vi.fn();
      component.itemClick.subscribe(spy);
      component.searchKeyword = 'hello';

      const mockConv = { getConversationId: () => 'conv_1' } as any;
      component.handleItemClick(mockConv);

      expect(spy).toHaveBeenCalledWith({
        conversation: mockConv,
        searchKeyword: 'hello',
      });
    });
  });

  describe('stateChange output', () => {
    it('should emit when service fetchState changes', async () => {
      const spy = vi.fn();
      component.stateChange.subscribe(spy);
      fixture.detectChanges(); // trigger initial effect
      spy.mockClear(); // clear the initial emission
      component.service.fetchState.set(1); // States.empty
      fixture.detectChanges(); // trigger change detection so effect runs
      await new Promise(r => setTimeout(r, 0)); // let microtask queue flush
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('hideSection input', () => {
    it('should default to false', () => {
      expect(component.hideSection).toBe(false);
    });
  });

  describe('suppressEmptyErrorView input', () => {
    it('should default to false', () => {
      expect(component.suppressEmptyErrorView).toBe(false);
    });
  });

  describe('getLastMessageText', () => {
    it('should return text for text messages', () => {
      const mockConv = {
        getLastMessage: () => ({
          getType: () => 'text',
          getText: () => 'Hello world',
        }),
      } as any;
      expect(component.getLastMessageText(mockConv)).toBe('Hello world');
    });

    it('should return type for non-text messages', () => {
      const mockConv = {
        getLastMessage: () => ({
          getType: () => 'image',
        }),
      } as any;
      expect(component.getLastMessageText(mockConv)).toBe('image');
    });

    it('should return empty string when no last message', () => {
      const mockConv = { getLastMessage: () => null } as any;
      expect(component.getLastMessageText(mockConv)).toBe('');
    });
  });

  describe('effectiveDateFormat', () => {
    it('should return input format when provided', () => {
      const custom = { today: 'HH:mm', yesterday: 'Yesterday', otherDays: 'DD/MM' };
      component.lastMessageDateTimeFormat = custom;
      expect(component.effectiveDateFormat).toBe(custom);
    });

    it('should return search default format when no input', () => {
      component.lastMessageDateTimeFormat = undefined;
      const format = component.effectiveDateFormat;
      expect(format.today).toBe('DD/MM/YYYY');
      expect(format.yesterday).toBe('DD/MM/YYYY');
      expect(format.otherDays).toBe('DD/MM/YYYY');
    });
  });
});
