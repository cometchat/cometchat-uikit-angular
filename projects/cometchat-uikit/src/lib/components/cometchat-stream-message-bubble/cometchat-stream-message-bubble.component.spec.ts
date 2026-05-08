import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Subject } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatStreamMessageBubble } from './cometchat-stream-message-bubble.component';
import {
  CometChatAIStreamingService,
  IAIStreamEvent,
} from '../../services/cometchat-ai-streaming.service';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeEvent(
  type: string,
  runId: string,
  chatId: string,
  extra: Partial<IAIStreamEvent> = {}
): IAIStreamEvent {
  const message = {
    getType: () => type,
    getMessageId: () => runId,
    getExecutionText: () => '',
    getDelta: () => '',
  } as unknown as CometChat.AIAssistantBaseEvent;

  return { message, chatId, runId, ...extra };
}

function makeToolStartEvent(
  runId: string,
  chatId: string,
  execText: string
): IAIStreamEvent {
  const message = {
    getType: () => 'tool_call_start',
    getMessageId: () => runId,
    getExecutionText: () => execText,
  } as unknown as CometChat.AIAssistantBaseEvent;
  return { message, chatId, runId };
}

// ── Mock service ─────────────────────────────────────────────────────────────

function createMockService() {
  const stream$ = new Subject<IAIStreamEvent>();
  const stopSpy = vi.fn();

  const service = {
    messageStream$: stream$.asObservable(),
    stopStreamingMessage: stopSpy,
  } as unknown as CometChatAIStreamingService;

  return { service, stream$, stopSpy };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CometChatStreamMessageBubble', () => {
  let fixture: ComponentFixture<CometChatStreamMessageBubble>;
  let component: CometChatStreamMessageBubble;
  let stream$: Subject<IAIStreamEvent>;
  let stopSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const { service, stream$: s, stopSpy: sp } = createMockService();
    stream$ = s;
    stopSpy = sp;

    await TestBed.configureTestingModule({
      imports: [CometChatStreamMessageBubble],
      providers: [{ provide: CometChatAIStreamingService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatStreamMessageBubble);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('runId', 'run-1');
    fixture.componentRef.setInput('chatId', 'chat-1');
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Initial state ────────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('isThinking should start true', () => {
      expect(component.isThinking()).toBe(true);
    });

    it('isExecutingTool should start false', () => {
      expect(component.isExecutingTool()).toBe(false);
    });

    it('hasError should start false', () => {
      expect(component.hasError()).toBe(false);
    });

    it('streamedText should start empty', () => {
      expect(component.streamedText()).toBe('');
    });

    it('hasStreamedContent should start false', () => {
      expect(component.hasStreamedContent()).toBe(false);
    });
  });

  // ── Event filtering ──────────────────────────────────────────────────────────

  describe('event filtering by chatId', () => {
    it('should ignore events for a different chatId', () => {
      stream$.next(makeEvent('text_message_content', 'run-1', 'other-chat', { streamedContent: 'hello' }));
      fixture.detectChanges();

      expect(component.streamedText()).toBe('');
      expect(component.isThinking()).toBe(true);
    });

    it('should process events matching its own chatId', () => {
      stream$.next(makeEvent('text_message_content', 'run-1', 'chat-1', { streamedContent: 'hello' }));
      fixture.detectChanges();

      expect(component.streamedText()).toBe('hello');
    });
  });

  // ── State transitions ────────────────────────────────────────────────────────

  describe('run_started event', () => {
    it('should set isThinking to true and reset state', () => {
      // First get some streamed text
      stream$.next(makeEvent('text_message_content', 'run-1', 'chat-1', { streamedContent: 'some text' }));
      fixture.detectChanges();
      expect(component.streamedText()).toBe('some text');

      // Now run_started resets
      stream$.next(makeEvent('run_started', 'run-1', 'chat-1'));
      fixture.detectChanges();

      expect(component.isThinking()).toBe(true);
      expect(component.isExecutingTool()).toBe(false);
      expect(component.streamedText()).toBe('');
    });
  });

  describe('tool_call_start event', () => {
    it('should set isExecutingTool to true and isThinking to false', () => {
      stream$.next(makeToolStartEvent('run-1', 'chat-1', 'Searching...'));
      fixture.detectChanges();

      expect(component.isExecutingTool()).toBe(true);
      expect(component.isThinking()).toBe(false);
    });

    it('should set toolExecutionText from event', () => {
      stream$.next(makeToolStartEvent('run-1', 'chat-1', 'Fetching data...'));
      fixture.detectChanges();

      expect(component.toolExecutionText()).toBe('Fetching data...');
    });
  });

  describe('text_message_content event', () => {
    it('should update streamedText with accumulated content', () => {
      stream$.next(makeEvent('text_message_content', 'run-1', 'chat-1', { streamedContent: 'Hello' }));
      fixture.detectChanges();
      expect(component.streamedText()).toBe('Hello');

      stream$.next(makeEvent('text_message_content', 'run-1', 'chat-1', { streamedContent: 'Hello world' }));
      fixture.detectChanges();
      expect(component.streamedText()).toBe('Hello world');
    });

    it('should set isThinking to false when text arrives', () => {
      expect(component.isThinking()).toBe(true);
      stream$.next(makeEvent('text_message_content', 'run-1', 'chat-1', { streamedContent: 'Hi' }));
      fixture.detectChanges();
      expect(component.isThinking()).toBe(false);
    });

    it('should update hasStreamedContent to true', () => {
      expect(component.hasStreamedContent()).toBe(false);
      stream$.next(makeEvent('text_message_content', 'run-1', 'chat-1', { streamedContent: 'text' }));
      fixture.detectChanges();
      expect(component.hasStreamedContent()).toBe(true);
    });
  });

  // ── run_finished and re-subscription ────────────────────────────────────────

  describe('run_finished event', () => {
    it('should re-subscribe after run_finished so subsequent events are processed', () => {
      // First run
      stream$.next(makeEvent('text_message_content', 'run-1', 'chat-1', { streamedContent: 'first' }));
      fixture.detectChanges();
      expect(component.streamedText()).toBe('first');

      // Finish the run
      stream$.next(makeEvent('run_finished', 'run-1', 'chat-1'));
      fixture.detectChanges();

      // After re-subscription, new events should be processed
      stream$.next(makeEvent('text_message_content', 'run-1', 'chat-1', { streamedContent: 'second' }));
      fixture.detectChanges();
      expect(component.streamedText()).toBe('second');
    });

    it('should not process events for a different chatId after run_finished', () => {
      stream$.next(makeEvent('run_finished', 'run-1', 'chat-1'));
      fixture.detectChanges();

      // Events for a different chatId should be ignored
      stream$.next(makeEvent('text_message_content', 'other-run', 'other-chat', { streamedContent: 'other' }));
      fixture.detectChanges();
      expect(component.streamedText()).toBe('');
    });
  });

  // ── Offline detection ────────────────────────────────────────────────────────

  describe('offline detection', () => {
    it('should set hasError to true when browser goes offline', () => {
      expect(component.hasError()).toBe(false);

      window.dispatchEvent(new Event('offline'));
      fixture.detectChanges();

      expect(component.hasError()).toBe(true);
    });

    it('should call stopStreamingMessage with chatId when offline', () => {
      window.dispatchEvent(new Event('offline'));
      fixture.detectChanges();

      expect(stopSpy).toHaveBeenCalledWith('chat-1');
    });

    it('should remove offline listener on destroy', () => {
      const removeListenerSpy = vi.spyOn(window, 'removeEventListener');
      fixture.destroy();
      expect(removeListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  // ── aria-live region DOM node identity ──────────────────────────────────────

  describe('aria-live region persists across state transitions', () => {
    it('should keep the same aria-live container DOM node across state changes', () => {
      const ariaContainer = fixture.nativeElement.querySelector('[aria-live="polite"]');
      expect(ariaContainer).toBeTruthy();

      // Transition through multiple states
      stream$.next(makeToolStartEvent('run-1', 'chat-1', 'Working...'));
      fixture.detectChanges();

      stream$.next(makeEvent('text_message_content', 'run-1', 'chat-1', { streamedContent: 'result' }));
      fixture.detectChanges();

      // The same DOM node should still be present (not swapped)
      const ariaContainerAfter = fixture.nativeElement.querySelector('[aria-live="polite"]');
      expect(ariaContainerAfter).toBe(ariaContainer);
    });

    it('should have aria-atomic="true" on the live region', () => {
      const ariaContainer = fixture.nativeElement.querySelector('[aria-live="polite"]');
      expect(ariaContainer?.getAttribute('aria-atomic')).toBe('true');
    });
  });

  // ── Template rendering ───────────────────────────────────────────────────────

  describe('template rendering', () => {
    it('should show thinking text initially', () => {
      const el = fixture.nativeElement.querySelector('.cometchat-stream-message-bubble__thinking');
      expect(el).toBeTruthy();
    });

    it('should show tool execution text when isExecutingTool is true', () => {
      stream$.next(makeToolStartEvent('run-1', 'chat-1', 'Searching...'));
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('.cometchat-stream-message-bubble__tool-execution');
      expect(el).toBeTruthy();
      expect(el.textContent.trim()).toBe('Searching...');
    });

    it('should show error text when hasError is true', () => {
      window.dispatchEvent(new Event('offline'));
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('.cometchat-stream-message-bubble__error');
      expect(el).toBeTruthy();
    });

    it('should hide thinking indicator once text content arrives', () => {
      stream$.next(makeEvent('text_message_content', 'run-1', 'chat-1', { streamedContent: 'hi' }));
      fixture.detectChanges();

      const thinkingEl = fixture.nativeElement.querySelector('.cometchat-stream-message-bubble__thinking');
      expect(thinkingEl).toBeNull();
    });
  });
});
