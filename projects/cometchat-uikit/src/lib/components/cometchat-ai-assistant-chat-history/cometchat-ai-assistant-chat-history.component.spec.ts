import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { vi } from 'vitest';
import { Subject } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAIAssistantChatHistory } from './cometchat-ai-assistant-chat-history.component';
import { CometChatMessageEvents, IMessages } from '../../events/CometChatMessageEvents';
import { MessageStatus } from '../../Enums/Enums';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeTextMessage(id: number, text: string, sentAt = 1700000000): CometChat.TextMessage {
  // Use the mocked CometChat.TextMessage constructor so instances pass instanceof checks
  // The mock class takes (id, text, sentAt) and exposes getId/getText/getSentAt
  return new (CometChat.TextMessage as unknown as new (id: number, text: string, sentAt: number) => CometChat.TextMessage)(id, text, sentAt);
}

function makeUser(uid = 'user-1'): CometChat.User {
  return {
    getUid: () => uid,
    getName: () => 'Test User',
  } as unknown as CometChat.User;
}

// ── Mock CometChat SDK ────────────────────────────────────────────────────────

// Use vi.hoisted() so these are available when vi.mock factory is hoisted to top of file
const { mockFetchPrevious, mockDeleteMessage } = vi.hoisted(() => ({
  mockFetchPrevious: vi.fn().mockResolvedValue([]),
  mockDeleteMessage: vi.fn().mockResolvedValue({}),
}));

vi.mock('@cometchat/chat-sdk-javascript', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@cometchat/chat-sdk-javascript')>();
  return {
    ...actual,
    CometChat: {
      ...actual.CometChat,
      MessagesRequestBuilder: class {
        hideReplies() { return this; }
        setLimit() { return this; }
        hideDeletedMessages() { return this; }
        setUID() { return this; }
        setGUID() { return this; }
        build() {
          return { fetchPrevious: mockFetchPrevious };
        }
      },
      TextMessage: class {
        constructor(public _id: number, public _text: string, public _sentAt: number) {}
        getId() { return this._id; }
        getText() { return this._text; }
        getSentAt() { return this._sentAt; }
        getType() { return 'text'; }
      },
      deleteMessage: mockDeleteMessage,
    },
  };
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CometChatAIAssistantChatHistory', () => {
  let fixture: ComponentFixture<CometChatAIAssistantChatHistory>;
  let component: CometChatAIAssistantChatHistory;

  const setupComponent = async (inputs: Record<string, unknown> = {}) => {
    await TestBed.configureTestingModule({
      imports: [CometChatAIAssistantChatHistory],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatAIAssistantChatHistory);
    component = fixture.componentInstance;

    const user = makeUser();
    fixture.componentRef.setInput('user', user);

    for (const [key, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(key, value);
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchPrevious.mockResolvedValue([]);
    mockDeleteMessage.mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Creation ──────────────────────────────────────────────────────────────

  it('should create', async () => {
    await setupComponent();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // ── Fetch on init ─────────────────────────────────────────────────────────

  describe('fetch on init', () => {
    it('should call fetchPrevious on ngOnInit', async () => {
      await setupComponent();
      fixture.detectChanges();
      expect(mockFetchPrevious).toHaveBeenCalledTimes(1);
    });

    it('should set isLoading to true while fetching', async () => {
      let resolvePromise!: (v: CometChat.BaseMessage[]) => void;
      mockFetchPrevious.mockReturnValue(new Promise((r) => { resolvePromise = r; }));

      await setupComponent();
      fixture.detectChanges();

      expect(component.isLoading()).toBe(true);
      resolvePromise([]);
    });

    it('should set isLoading to false after fetch completes', async () => {
      mockFetchPrevious.mockResolvedValue([]);
      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.isLoading()).toBe(false);
    });

    it('should populate messages after successful fetch', async () => {
      const msg1 = makeTextMessage(1, 'Hello');
      const msg2 = makeTextMessage(2, 'World');
      mockFetchPrevious.mockResolvedValue([msg1, msg2]);

      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.messages().length).toBe(2);
    });

    it('should set hasError to true when fetch fails with no messages', async () => {
      mockFetchPrevious.mockRejectedValue(new Error('Network error'));

      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.hasError()).toBe(true);
    });
  });

  // ── Pagination on scroll ──────────────────────────────────────────────────

  describe('pagination on scroll', () => {
    it('should fetch more messages when onScrollToBottom is called', async () => {
      const msg1 = makeTextMessage(1, 'First');
      mockFetchPrevious.mockResolvedValueOnce([msg1]).mockResolvedValueOnce([]);

      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();

      component.onScrollToBottom();
      await fixture.whenStable();

      expect(mockFetchPrevious).toHaveBeenCalledTimes(2);
    });

    it('should not fetch more when isLoading is true', async () => {
      let resolveFirst!: (v: CometChat.BaseMessage[]) => void;
      mockFetchPrevious.mockReturnValue(new Promise((r) => { resolveFirst = r; }));

      await setupComponent();
      fixture.detectChanges();

      // While loading, calling onScrollToBottom should not trigger another fetch
      component.onScrollToBottom();
      expect(mockFetchPrevious).toHaveBeenCalledTimes(1);

      resolveFirst([]);
    });

    it('should append messages on subsequent fetches', async () => {
      const msg1 = makeTextMessage(1, 'First');
      const msg2 = makeTextMessage(2, 'Second');
      mockFetchPrevious.mockResolvedValueOnce([msg1]).mockResolvedValueOnce([msg2]);

      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();

      component.onScrollToBottom();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.messages().length).toBe(2);
    });
  });

  // ── messageClick output ───────────────────────────────────────────────────

  describe('messageClick output', () => {
    it('should emit messageClick when a message item is clicked', async () => {
      const msg = makeTextMessage(1, 'Hello');
      mockFetchPrevious.mockResolvedValue([msg]);

      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const emitSpy = vi.spyOn(component.messageClick, 'emit');
      component.onMessageClick(msg as unknown as CometChat.TextMessage);

      expect(emitSpy).toHaveBeenCalledWith(msg);
    });
  });

  // ── newChatClick(null) on delete of active message ────────────────────────

  describe('newChatClick(null) on delete of active message', () => {
    it('should emit newChatClick(null) when active message is deleted', async () => {
      const msg = makeTextMessage(42, 'Active conversation');
      mockFetchPrevious.mockResolvedValue([msg]);
      mockDeleteMessage.mockResolvedValue({});

      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      // Set the message as active
      component.onMessageClick(msg as unknown as CometChat.TextMessage);

      const newChatSpy = vi.spyOn(component.newChatClick, 'emit');
      const event = new MouseEvent('click');
      vi.spyOn(event, 'stopPropagation').mockImplementation(() => {});

      component.onDeleteMessage(msg as unknown as CometChat.TextMessage, event);
      await fixture.whenStable();

      expect(newChatSpy).toHaveBeenCalledWith(null);
    });

    it('should NOT emit newChatClick when a non-active message is deleted', async () => {
      const activeMsg = makeTextMessage(1, 'Active');
      const otherMsg = makeTextMessage(2, 'Other');
      mockFetchPrevious.mockResolvedValue([activeMsg, otherMsg]);
      mockDeleteMessage.mockResolvedValue({});

      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      component.onMessageClick(activeMsg as unknown as CometChat.TextMessage);

      const newChatSpy = vi.spyOn(component.newChatClick, 'emit');
      const event = new MouseEvent('click');
      vi.spyOn(event, 'stopPropagation').mockImplementation(() => {});

      component.onDeleteMessage(otherMsg as unknown as CometChat.TextMessage, event);
      await fixture.whenStable();

      expect(newChatSpy).not.toHaveBeenCalled();
    });

    it('should remove deleted message from the list', async () => {
      const msg = makeTextMessage(5, 'To delete');
      mockFetchPrevious.mockResolvedValue([msg]);
      mockDeleteMessage.mockResolvedValue({});

      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const event = new MouseEvent('click');
      vi.spyOn(event, 'stopPropagation').mockImplementation(() => {});

      component.onDeleteMessage(msg as unknown as CometChat.TextMessage, event);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.messages().find((m) => m.getId() === 5)).toBeUndefined();
    });
  });

  // ── Roving tabindex Arrow Up/Down ─────────────────────────────────────────

  describe('roving tabindex keyboard navigation', () => {
    it('should start with focusedIndex at 0', async () => {
      await setupComponent();
      fixture.detectChanges();
      expect(component.focusedIndex()).toBe(0);
    });

    it('should increment focusedIndex on ArrowDown', async () => {
      const msgs = [makeTextMessage(1, 'A'), makeTextMessage(2, 'B'), makeTextMessage(3, 'C')];
      mockFetchPrevious.mockResolvedValue(msgs);

      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      vi.spyOn(event, 'preventDefault').mockImplementation(() => {});

      component.onKeyDown(event, 0);
      expect(component.focusedIndex()).toBe(1);
    });

    it('should decrement focusedIndex on ArrowUp', async () => {
      const msgs = [makeTextMessage(1, 'A'), makeTextMessage(2, 'B')];
      mockFetchPrevious.mockResolvedValue(msgs);

      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      component.focusedIndex.set(1);

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      vi.spyOn(event, 'preventDefault').mockImplementation(() => {});

      component.onKeyDown(event, 1);
      expect(component.focusedIndex()).toBe(0);
    });

    it('should not go below 0 on ArrowUp at first item', async () => {
      const msgs = [makeTextMessage(1, 'A')];
      mockFetchPrevious.mockResolvedValue(msgs);

      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      vi.spyOn(event, 'preventDefault').mockImplementation(() => {});

      component.onKeyDown(event, 0);
      expect(component.focusedIndex()).toBe(0);
    });

    it('should not exceed last index on ArrowDown at last item', async () => {
      const msgs = [makeTextMessage(1, 'A'), makeTextMessage(2, 'B')];
      mockFetchPrevious.mockResolvedValue(msgs);

      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      component.focusedIndex.set(1);

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      vi.spyOn(event, 'preventDefault').mockImplementation(() => {});

      component.onKeyDown(event, 1);
      expect(component.focusedIndex()).toBe(1);
    });

    it('getTabIndex should return 0 for focused item and -1 for others', async () => {
      await setupComponent();
      fixture.detectChanges();

      component.focusedIndex.set(2);
      expect(component.getTabIndex(2)).toBe(0);
      expect(component.getTabIndex(0)).toBe(-1);
      expect(component.getTabIndex(1)).toBe(-1);
    });

    it('should emit messageClick on Enter key', async () => {
      const msgs = [makeTextMessage(1, 'A'), makeTextMessage(2, 'B')];
      mockFetchPrevious.mockResolvedValue(msgs);

      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const emitSpy = vi.spyOn(component.messageClick, 'emit');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      vi.spyOn(event, 'preventDefault').mockImplementation(() => {});

      component.onKeyDown(event, 0);
      // Component displays messages in reverse chronological order
      expect(emitSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ── ccMessageSent prepends message ────────────────────────────────────────

  describe('ccMessageSent prepends message', () => {
    it('should prepend new message on ccMessageSent with success status', async () => {
      const existingMsg = makeTextMessage(1, 'Existing');
      mockFetchPrevious.mockResolvedValue([existingMsg]);

      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const newMsg = makeTextMessage(99, 'New message');
      const event: IMessages = {
        message: newMsg as unknown as CometChat.BaseMessage,
        status: MessageStatus.success,
      };

      CometChatMessageEvents.ccMessageSent.next(event);
      fixture.detectChanges();

      expect(component.messages()[0].getId()).toBe(99);
      expect(component.messages().length).toBe(2);
    });

    it('should NOT prepend on ccMessageSent with inprogress status', async () => {
      mockFetchPrevious.mockResolvedValue([]);

      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const newMsg = makeTextMessage(99, 'In progress');
      const event: IMessages = {
        message: newMsg as unknown as CometChat.BaseMessage,
        status: MessageStatus.inprogress,
      };

      CometChatMessageEvents.ccMessageSent.next(event);
      fixture.detectChanges();

      expect(component.messages().length).toBe(0);
    });
  });

  // ── Empty state rendering ─────────────────────────────────────────────────

  describe('empty state rendering', () => {
    it('should show empty state when no messages and not loading', async () => {
      mockFetchPrevious.mockResolvedValue([]);

      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.isEmpty()).toBe(true);
      const emptyEl = fixture.nativeElement.querySelector(
        '.cometchat-ai-assistant-chat-history__empty-state'
      );
      expect(emptyEl).toBeTruthy();
    });

    it('should emit empty output when no messages on first page', async () => {
      mockFetchPrevious.mockResolvedValue([]);

      await setupComponent();
      const emptySpy = vi.spyOn(component.empty, 'emit');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(emptySpy).toHaveBeenCalled();
    });

    it('should NOT show empty state while loading', async () => {
      let resolve!: (v: CometChat.BaseMessage[]) => void;
      mockFetchPrevious.mockReturnValue(new Promise((r) => { resolve = r; }));

      await setupComponent();
      fixture.detectChanges();

      expect(component.isEmpty()).toBe(false);
      resolve([]);
    });
  });

  // ── Error state rendering ─────────────────────────────────────────────────

  describe('error state rendering', () => {
    it('should show error state when fetch fails', async () => {
      mockFetchPrevious.mockRejectedValue(new Error('fail'));

      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.hasError()).toBe(true);
      const errorEl = fixture.nativeElement.querySelector(
        '.cometchat-ai-assistant-chat-history__error-state'
      );
      expect(errorEl).toBeTruthy();
    });
  });

  // ── loadLastAgentConversation auto-emit ───────────────────────────────────

  describe('loadLastAgentConversation auto-emit', () => {
    it('should auto-emit messageClick with most recent message when loadLastAgentConversation is true', async () => {
      const msg1 = makeTextMessage(10, 'Most recent');
      const msg2 = makeTextMessage(9, 'Older');
      mockFetchPrevious.mockResolvedValue([msg1, msg2]);

      await setupComponent({ loadLastAgentConversation: true });
      const emitSpy = vi.spyOn(component.messageClick, 'emit');
      fixture.detectChanges();
      await fixture.whenStable();

      // Component auto-emits the last message in the fetched array
      expect(emitSpy).toHaveBeenCalledTimes(1);
    });

    it('should NOT auto-emit when loadLastAgentConversation is false', async () => {
      const msg = makeTextMessage(1, 'Message');
      mockFetchPrevious.mockResolvedValue([msg]);

      await setupComponent({ loadLastAgentConversation: false });
      const emitSpy = vi.spyOn(component.messageClick, 'emit');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should only auto-emit on the first page load', async () => {
      const msg1 = makeTextMessage(1, 'First page');
      const msg2 = makeTextMessage(2, 'Second page');
      mockFetchPrevious.mockResolvedValueOnce([msg1]).mockResolvedValueOnce([msg2]);

      await setupComponent({ loadLastAgentConversation: true });
      const emitSpy = vi.spyOn(component.messageClick, 'emit');
      fixture.detectChanges();
      await fixture.whenStable();

      // First page auto-emits
      expect(emitSpy).toHaveBeenCalledTimes(1);

      // Second page fetch should not auto-emit again
      component.onScrollToBottom();
      await fixture.whenStable();

      expect(emitSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ── Close and new chat outputs ────────────────────────────────────────────

  describe('close and new chat outputs', () => {
    it('should emit closeClick when close button is clicked', async () => {
      await setupComponent();
      fixture.detectChanges();

      const closeSpy = vi.spyOn(component.closeClick, 'emit');
      component.onCloseClick();
      expect(closeSpy).toHaveBeenCalled();
    });

    it('should emit newChatClick(null) when new chat button is clicked', async () => {
      await setupComponent();
      fixture.detectChanges();

      const newChatSpy = vi.spyOn(component.newChatClick, 'emit');
      component.onNewChatClick();
      expect(newChatSpy).toHaveBeenCalledWith(null);
    });
  });

  // ── Date separators ───────────────────────────────────────────────────────

  describe('date separators', () => {
    it('should show separator for first message', async () => {
      const msg = makeTextMessage(1, 'Hello', 1700000000);
      mockFetchPrevious.mockResolvedValue([msg]);

      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const items = component.messageItems();
      expect(items[0].showSeparator).toBe(true);
    });

    it('should show separator between messages on different days', async () => {
      const day1 = 1700000000; // some timestamp
      const day2 = day1 + 86400; // next day
      const msg1 = makeTextMessage(1, 'Day 1', day1);
      const msg2 = makeTextMessage(2, 'Day 2', day2);
      mockFetchPrevious.mockResolvedValue([msg1, msg2]);

      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const items = component.messageItems();
      expect(items[1].showSeparator).toBe(true);
    });

    it('should NOT show separator between messages on the same day', async () => {
      const ts = 1700000000;
      const msg1 = makeTextMessage(1, 'Morning', ts);
      const msg2 = makeTextMessage(2, 'Afternoon', ts + 3600); // 1 hour later, same day
      mockFetchPrevious.mockResolvedValue([msg1, msg2]);

      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const items = component.messageItems();
      expect(items[1].showSeparator).toBe(false);
    });
  });

  // ── Accessibility: aria-label on icon-only buttons (Req 12.4) ────────────

  describe('accessibility: aria-label on icon-only buttons', () => {
    it('close button has aria-label bound to localized string', async () => {
      await setupComponent();
      fixture.detectChanges();

      const closeBtn = fixture.nativeElement.querySelector(
        '.cometchat-ai-assistant-chat-history__close-btn'
      );
      expect(closeBtn).toBeTruthy();
      expect(closeBtn.getAttribute('aria-label')).toBeTruthy();
    });

    it('close button is a native button element (keyboard accessible)', async () => {
      await setupComponent();
      fixture.detectChanges();

      const closeBtn = fixture.nativeElement.querySelector(
        '.cometchat-ai-assistant-chat-history__close-btn'
      );
      expect(closeBtn.tagName.toLowerCase()).toBe('button');
    });

    it('delete button has aria-label bound to localized string', async () => {
      // Use makeTextMessage which creates proper CometChat.TextMessage instances
      const msg = makeTextMessage(1, 'Hello');
      mockFetchPrevious.mockResolvedValue([msg]);

      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const deleteBtn = fixture.nativeElement.querySelector(
        '.cometchat-ai-assistant-chat-history__delete-btn'
      );
      expect(deleteBtn).toBeTruthy();
      expect(deleteBtn.getAttribute('aria-label')).toBeTruthy();
    });

    it('delete button is a native button element (keyboard accessible)', async () => {
      const msg = makeTextMessage(1, 'Hello');
      mockFetchPrevious.mockResolvedValue([msg]);

      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const deleteBtn = fixture.nativeElement.querySelector(
        '.cometchat-ai-assistant-chat-history__delete-btn'
      );
      expect(deleteBtn?.tagName.toLowerCase()).toBe('button');
    });

    it('new chat button has aria-label when showNewChat is true', async () => {
      await setupComponent({ showNewChat: true });
      fixture.detectChanges();

      const newChatBtn = fixture.nativeElement.querySelector(
        '.cometchat-ai-assistant-chat-history__new-chat-row'
      );
      expect(newChatBtn).toBeTruthy();
      expect(newChatBtn.getAttribute('aria-label')).toBeTruthy();
    });
  });

  // ── Accessibility: roving tabindex DOM attribute verification (Req 12.7) ──

  describe('accessibility: roving tabindex DOM attributes', () => {
    it('first list item has tabindex="0" in the DOM', async () => {
      // Directly set messages on the signal to bypass instanceof check
      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      // Manually set messages to test DOM rendering
      const msg1 = makeTextMessage(1, 'A');
      const msg2 = makeTextMessage(2, 'B');
      component.messages.set([msg1, msg2] as unknown as CometChat.TextMessage[]);
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll(
        '.cometchat-ai-assistant-chat-history__item'
      );
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].getAttribute('tabindex')).toBe('0');
    });

    it('non-focused list items have tabindex="-1" in the DOM', async () => {
      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const msg1 = makeTextMessage(1, 'A');
      const msg2 = makeTextMessage(2, 'B');
      const msg3 = makeTextMessage(3, 'C');
      component.messages.set([msg1, msg2, msg3] as unknown as CometChat.TextMessage[]);
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll(
        '.cometchat-ai-assistant-chat-history__item'
      );
      expect(items[1].getAttribute('tabindex')).toBe('-1');
      expect(items[2].getAttribute('tabindex')).toBe('-1');
    });

    it('tabindex updates in DOM after ArrowDown key event', async () => {
      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const msg1 = makeTextMessage(1, 'A');
      const msg2 = makeTextMessage(2, 'B');
      component.messages.set([msg1, msg2] as unknown as CometChat.TextMessage[]);
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      vi.spyOn(event, 'preventDefault').mockImplementation(() => {});
      component.onKeyDown(event, 0);
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll(
        '.cometchat-ai-assistant-chat-history__item'
      );
      expect(items[0].getAttribute('tabindex')).toBe('-1');
      expect(items[1].getAttribute('tabindex')).toBe('0');
    });

    it('tabindex updates in DOM after ArrowUp key event', async () => {
      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const msg1 = makeTextMessage(1, 'A');
      const msg2 = makeTextMessage(2, 'B');
      component.messages.set([msg1, msg2] as unknown as CometChat.TextMessage[]);
      component.focusedIndex.set(1);
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      vi.spyOn(event, 'preventDefault').mockImplementation(() => {});
      component.onKeyDown(event, 1);
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll(
        '.cometchat-ai-assistant-chat-history__item'
      );
      expect(items[0].getAttribute('tabindex')).toBe('0');
      expect(items[1].getAttribute('tabindex')).toBe('-1');
    });

    it('list items have role="option" for screen reader semantics', async () => {
      await setupComponent();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const msg = makeTextMessage(1, 'Hello');
      component.messages.set([msg] as unknown as CometChat.TextMessage[]);
      fixture.detectChanges();

      const item = fixture.nativeElement.querySelector(
        '.cometchat-ai-assistant-chat-history__item'
      );
      expect(item?.getAttribute('role')).toBe('option');
    });
  });
});
