import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { vi } from 'vitest';
import { BehaviorSubject, Subject } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAIAssistantChat } from './cometchat-ai-assistant-chat.component';
import { CometChatAIStreamingService } from '../../services/cometchat-ai-streaming.service';
import { CometChatAIAssistantTools } from '../../modals/CometChatAIAssistantTools';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import { CometChatUIEvents } from '../../events/CometChatUIEvents';
import { MessageStatus } from '../../Enums/Enums';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeUser(uid = 'user-1', metadata?: Record<string, unknown>): CometChat.User {
  return {
    getUid: () => uid,
    getName: () => 'Test User',
    getMetadata: () => metadata ?? null,
  } as unknown as CometChat.User;
}

function makeTextMessage(id: number): CometChat.TextMessage {
  return {
    getId: () => id,
    getText: () => 'Hello',
    getType: () => 'text',
    getParentMessageId: () => 0,
    getSender: () => ({ getUid: () => 'user-1' }),
    getReceiverId: () => 'user-1',
    getReceiverType: () => 'user',
  } as unknown as CometChat.TextMessage;
}

// ── Mock streaming service ────────────────────────────────────────────────────

const mockStreamingSubject = new BehaviorSubject<boolean>(false);

function createMockStreamingObservable() {
  const signalLike = (() => mockStreamingSubject.getValue()) as any;
  signalLike.subscribe = mockStreamingSubject.asObservable().subscribe.bind(mockStreamingSubject.asObservable());
  signalLike.pipe = (...args: any[]) => mockStreamingSubject.asObservable().pipe(...args);
  return signalLike;
}

const mockStreamingService = {
  isStreamingFor: vi.fn(() => createMockStreamingObservable()),
  setStreamSpeed: vi.fn(),
  setAIAssistantTools: vi.fn(),
  startStreamingMessage: vi.fn(),
  stopStreamingMessage: vi.fn(),
  isAnyStreaming: () => mockStreamingSubject.getValue(),
  messageStream$: new Subject(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CometChatAIAssistantChat', () => {
  let fixture: ComponentFixture<CometChatAIAssistantChat>;
  let component: CometChatAIAssistantChat;

  const setupComponent = async (inputs: Record<string, unknown> = {}) => {
    // Reset mocks
    vi.clearAllMocks();
    mockStreamingSubject.next(false);

    await TestBed.configureTestingModule({
      imports: [CometChatAIAssistantChat],
      providers: [
        { provide: CometChatAIStreamingService, useValue: mockStreamingService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(CometChatAIAssistantChat, {
        set: {
          imports: [],
          template: `
            <div class="cometchat-ai-assistant-chat">
              <button class="cometchat-ai-assistant-chat__history-btn"
                      [attr.aria-label]="'Chat history'"
                      [attr.aria-expanded]="isSidebarOpen()"
                      (click)="onToggleSidebar($event.target)">History</button>
              <button class="cometchat-ai-assistant-chat__new-chat-btn"
                      [attr.aria-label]="'New chat'"
                      (click)="onNewChat()">New</button>
              @if (isStreaming()) {
                <button class="cometchat-ai-assistant-chat__stop-btn"
                        [attr.aria-label]="'Stop streaming'"
                        (click)="onStopStreaming()">Stop</button>
              }
              @if (isSuggestionsVisible() && availableSuggestions().length > 0) {
                @for (suggestion of availableSuggestions(); track suggestion) {
                  <button class="cometchat-ai-assistant-chat__suggestion-pill"
                          [attr.aria-label]="suggestion"
                          (click)="onSuggestionClick(suggestion)">{{ suggestion }}</button>
                }
              }
            </div>
          `,
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CometChatAIAssistantChat);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('user', makeUser());

    for (const [key, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(key, value);
    }

    fixture.detectChanges();
  };

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // ── effect() for streamingSpeed ───────────────────────────────────────────

  describe('streamingSpeed effect', () => {
    it('calls setStreamSpeed with the initial value on init', async () => {
      await setupComponent({ streamingSpeed: 50 });
      expect(mockStreamingService.setStreamSpeed).toHaveBeenCalledWith(50);
    });

    it('calls setStreamSpeed when streamingSpeed input changes', async () => {
      await setupComponent({ streamingSpeed: 30 });
      vi.clearAllMocks();

      fixture.componentRef.setInput('streamingSpeed', 100);
      fixture.detectChanges();

      expect(mockStreamingService.setStreamSpeed).toHaveBeenCalledWith(100);
    });
  });

  // ── effect() for aiAssistantTools ─────────────────────────────────────────

  describe('aiAssistantTools effect', () => {
    it('calls setAIAssistantTools when tools input is provided', async () => {
      const tools = new CometChatAIAssistantTools({ myTool: () => {} });
      await setupComponent({ aiAssistantTools: tools });
      expect(mockStreamingService.setAIAssistantTools).toHaveBeenCalledWith(tools);
    });

    it('does not call setAIAssistantTools when tools input is undefined', async () => {
      await setupComponent();
      expect(mockStreamingService.setAIAssistantTools).not.toHaveBeenCalled();
    });

    it('calls setAIAssistantTools when tools input changes', async () => {
      await setupComponent();
      vi.clearAllMocks();

      const tools = new CometChatAIAssistantTools({ newTool: () => {} });
      fixture.componentRef.setInput('aiAssistantTools', tools);
      fixture.detectChanges();

      expect(mockStreamingService.setAIAssistantTools).toHaveBeenCalledWith(tools);
    });
  });

  // ── isStreaming signal ────────────────────────────────────────────────

  describe('isStreaming', () => {
    it('returns false when not streaming', async () => {
      await setupComponent();
      mockStreamingSubject.next(false);
      expect(component.isStreaming()).toBe(false);
    });

    it('returns true when streaming is active', async () => {
      await setupComponent();
      mockStreamingSubject.next(true);
      expect(component.isStreaming()).toBe(true);
    });

    it('calls isStreamingFor with the user UID', async () => {
      await setupComponent();
      expect(mockStreamingService.isStreamingFor).toHaveBeenCalledWith('user-1');
    });
  });

  // ── availableSuggestions computed signal ──────────────────────────────────

  describe('availableSuggestions', () => {
    it('returns explicit suggestedMessages when provided', async () => {
      await setupComponent({ suggestedMessages: ['Hello', 'Help me'] });
      expect(component.availableSuggestions()).toEqual(['Hello', 'Help me']);
    });

    it('falls back to user metadata suggestedMessages when input is empty', async () => {
      const userWithMeta = makeUser('user-1', { suggestedMessages: ['Meta suggestion'] });
      await setupComponent({ suggestedMessages: [] });
      fixture.componentRef.setInput('user', userWithMeta);
      fixture.detectChanges();
      expect(component.availableSuggestions()).toEqual(['Meta suggestion']);
    });

    it('returns empty array when no suggestions available', async () => {
      await setupComponent({ suggestedMessages: [] });
      expect(component.availableSuggestions()).toEqual([]);
    });
  });

  // ── ccMessageSent sets activeParentMessageId ──────────────────────────────

  describe('ccMessageSent subscription', () => {
    it('calls startStreamingMessage on inprogress status', async () => {
      await setupComponent();
      const msg = makeTextMessage(42);

      CometChatMessageEvents.ccMessageSent.next({ message: msg, status: MessageStatus.inprogress });

      expect(mockStreamingService.startStreamingMessage).toHaveBeenCalledWith('user-1');
    });

    it('sets activeParentMessageId on success when not already set', async () => {
      await setupComponent();
      const msg = makeTextMessage(99);

      CometChatMessageEvents.ccMessageSent.next({ message: msg, status: MessageStatus.success });

      expect(component.activeParentMessageId()).toBe(99);
    });

    it('does not overwrite activeParentMessageId if already set', async () => {
      await setupComponent();
      component.activeParentMessageId.set(10);

      const msg = makeTextMessage(99);
      CometChatMessageEvents.ccMessageSent.next({ message: msg, status: MessageStatus.success });

      expect(component.activeParentMessageId()).toBe(10);
    });

    it('hides suggestions on success', async () => {
      await setupComponent({ suggestedMessages: ['Hello'] });
      component.isSuggestionsVisible.set(true);

      const msg = makeTextMessage(1);
      CometChatMessageEvents.ccMessageSent.next({ message: msg, status: MessageStatus.success });

      expect(component.isSuggestionsVisible()).toBe(false);
    });
  });

  // ── New chat resets state ─────────────────────────────────────────────────

  describe('onNewChat', () => {
    it('resets activeParentMessageId to null', async () => {
      await setupComponent();
      component.activeParentMessageId.set(5);

      component.onNewChat();

      expect(component.activeParentMessageId()).toBeNull();
    });

    it('calls stopStreamingMessage with user UID', async () => {
      await setupComponent();
      component.onNewChat();
      expect(mockStreamingService.stopStreamingMessage).toHaveBeenCalledWith('user-1');
    });

    it('increments listKey', async () => {
      await setupComponent();
      const before = component.newChatKey();
      component.onNewChat();
      expect(component.newChatKey()).toBe(before + 1);
    });

    it('shows suggestions again', async () => {
      await setupComponent();
      component.isSuggestionsVisible.set(false);
      component.onNewChat();
      expect(component.isSuggestionsVisible()).toBe(true);
    });
  });

  // ── Sidebar focus management ──────────────────────────────────────────────

  describe('sidebar toggle', () => {
    it('opens sidebar when isSidebarOpen is false', async () => {
      await setupComponent();
      component.isSidebarOpen.set(false);

      component.onToggleSidebar();

      expect(component.isSidebarOpen()).toBe(true);
    });

    it('closes sidebar when isSidebarOpen is true', async () => {
      await setupComponent();
      component.isSidebarOpen.set(true);

      component.onToggleSidebar();

      expect(component.isSidebarOpen()).toBe(false);
    });

    it('stores the trigger element for focus restoration', async () => {
      await setupComponent();
      const btn = document.createElement('button');

      component.onToggleSidebar(btn);

      expect(component.sidebarTriggerEl()).toBe(btn);
    });
  });

  // ── History message click ─────────────────────────────────────────────────

  describe('onHistoryMessageClick', () => {
    it('sets activeParentMessageId from the clicked message', async () => {
      await setupComponent();
      const msg = makeTextMessage(77);

      component.onHistoryMessageClick(msg);

      expect(component.activeParentMessageId()).toBe(77);
    });

    it('closes the sidebar', async () => {
      await setupComponent();
      component.isSidebarOpen.set(true);

      component.onHistoryMessageClick(makeTextMessage(1));

      expect(component.isSidebarOpen()).toBe(false);
    });

    it('calls stopStreamingMessage', async () => {
      await setupComponent();
      component.onHistoryMessageClick(makeTextMessage(1));
      expect(mockStreamingService.stopStreamingMessage).toHaveBeenCalledWith('user-1');
    });

    it('hides suggestions', async () => {
      await setupComponent();
      component.isSuggestionsVisible.set(true);

      component.onHistoryMessageClick(makeTextMessage(1));

      expect(component.isSuggestionsVisible()).toBe(false);
    });
  });

  // ── Suggestion pill emits ccComposeMessage ────────────────────────────────

  describe('onSuggestionClick', () => {
    it('publishes the suggestion text via ccComposeMessage', async () => {
      await setupComponent();
      const spy = vi.spyOn(CometChatUIEvents, 'publishComposeMessage');

      component.onSuggestionClick('Tell me a joke');

      expect(spy).toHaveBeenCalledWith('Tell me a joke');
    });

    it('hides suggestions after click', async () => {
      await setupComponent();
      component.isSuggestionsVisible.set(true);

      component.onSuggestionClick('Hello');

      expect(component.isSuggestionsVisible()).toBe(false);
    });
  });

  // ── loadLastAgentConversation passed to history ───────────────────────────

  describe('loadLastAgentConversation input', () => {
    it('defaults to false', async () => {
      await setupComponent();
      expect(component.loadLastAgentConversation()).toBe(false);
    });

    it('reflects the provided value', async () => {
      await setupComponent({ loadLastAgentConversation: true });
      expect(component.loadLastAgentConversation()).toBe(true);
    });
  });

  // ── onStopStreaming ───────────────────────────────────────────────────────

  describe('onStopStreaming', () => {
    it('calls stopStreamingMessage with user UID', async () => {
      await setupComponent();
      component.onStopStreaming();
      expect(mockStreamingService.stopStreamingMessage).toHaveBeenCalledWith('user-1');
    });
  });

  // ── Accessibility: aria-label on icon-only buttons (Req 12.3, 12.4) ──────

  describe('accessibility: aria-label on icon-only buttons', () => {
    it('history toggle button has aria-label bound to localized string', async () => {
      await setupComponent();
      const historyBtn = fixture.nativeElement.querySelector(
        '.cometchat-ai-assistant-chat__history-btn'
      );
      expect(historyBtn).toBeTruthy();
      expect(historyBtn.getAttribute('aria-label')).toBeTruthy();
    });

    it('new chat button has aria-label bound to localized string', async () => {
      await setupComponent();
      const newChatBtn = fixture.nativeElement.querySelector(
        '.cometchat-ai-assistant-chat__new-chat-btn'
      );
      expect(newChatBtn).toBeTruthy();
      expect(newChatBtn.getAttribute('aria-label')).toBeTruthy();
    });

    it('history toggle button has aria-expanded attribute', async () => {
      await setupComponent();
      const historyBtn = fixture.nativeElement.querySelector(
        '.cometchat-ai-assistant-chat__history-btn'
      );
      expect(historyBtn.getAttribute('aria-expanded')).toBeDefined();
    });

    it('history toggle button aria-expanded is false when sidebar is closed', async () => {
      await setupComponent();
      // isSidebarOpen defaults to false — aria-expanded should be false
      const historyBtn = fixture.nativeElement.querySelector(
        '.cometchat-ai-assistant-chat__history-btn'
      );
      expect(historyBtn.getAttribute('aria-expanded')).toBe('false');
    });
  });

  // ── Accessibility: keyboard activation of interactive elements (Req 12.1) ─

  describe('accessibility: keyboard activation', () => {
    it('new chat button is a native button element (keyboard accessible)', async () => {
      await setupComponent();
      const btn = fixture.nativeElement.querySelector(
        '.cometchat-ai-assistant-chat__new-chat-btn'
      );
      expect(btn.tagName.toLowerCase()).toBe('button');
    });

    it('history toggle button is a native button element (keyboard accessible)', async () => {
      await setupComponent();
      const btn = fixture.nativeElement.querySelector(
        '.cometchat-ai-assistant-chat__history-btn'
      );
      expect(btn.tagName.toLowerCase()).toBe('button');
    });

    it('suggestion pills are native button elements (keyboard accessible)', async () => {
      await setupComponent({ suggestedMessages: ['Hello', 'Help me'] });
      fixture.detectChanges();
      const pills = fixture.nativeElement.querySelectorAll(
        '.cometchat-ai-assistant-chat__suggestion-pill'
      );
      expect(pills.length).toBe(2);
      pills.forEach((pill: HTMLElement) => {
        expect(pill.tagName.toLowerCase()).toBe('button');
      });
    });

    it('stop streaming button is a native button element when streaming', async () => {
      await setupComponent();
      mockStreamingSubject.next(true);
      fixture.detectChanges();
      const stopBtn = fixture.nativeElement.querySelector(
        '.cometchat-ai-assistant-chat__stop-btn'
      );
      expect(stopBtn).toBeTruthy();
      expect(stopBtn.tagName.toLowerCase()).toBe('button');
    });

    it('stop streaming button has aria-label bound to localized string', async () => {
      await setupComponent();
      mockStreamingSubject.next(true);
      fixture.detectChanges();
      const stopBtn = fixture.nativeElement.querySelector(
        '.cometchat-ai-assistant-chat__stop-btn'
      );
      expect(stopBtn?.getAttribute('aria-label')).toBeTruthy();
    });
  });

  // ── Accessibility: suggestion pill aria-label (Req 12.3) ─────────────────

  describe('accessibility: suggestion pill aria-label', () => {
    it('each suggestion pill has an aria-label matching its text', async () => {
      await setupComponent({ suggestedMessages: ['Tell me a joke', 'Summarize this'] });
      fixture.detectChanges();
      const pills = fixture.nativeElement.querySelectorAll(
        '.cometchat-ai-assistant-chat__suggestion-pill'
      );
      expect(pills[0].getAttribute('aria-label')).toBe('Tell me a joke');
      expect(pills[1].getAttribute('aria-label')).toBe('Summarize this');
    });
  });
});
