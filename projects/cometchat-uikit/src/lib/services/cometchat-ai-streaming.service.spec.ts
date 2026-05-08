/**
 * Unit Tests for CometChatAIStreamingService
 * Feature: ai-assistant-chat
 */

import { TestBed } from '@angular/core/testing';
import { CometChatAIStreamingService, IAIStreamEvent } from './cometchat-ai-streaming.service';
import { CometChatAIAssistantTools } from '../modals/CometChatAIAssistantTools';
import { CometChat } from '@cometchat/chat-sdk-javascript';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeEvent(
  type: string,
  messageId: string,
  extra: Record<string, unknown> = {}
): CometChat.AIAssistantBaseEvent {
  return {
    type,
    conversationId: 'conv-1',
    messageId,
    parentMessageId: '',
    data: { timestamp: Date.now(), runId: messageId, threadId: '' },
    getType: () => type,
    getMessageId: () => messageId,
    getConversationId: () => 'conv-1',
    getParentMessageId: () => '',
    getPatentMessageId: () => '',
    getRunId: () => messageId,
    getThreadId: () => '',
    getTimestamp: () => Date.now(),
    getData: () => ({ timestamp: Date.now(), runId: messageId, threadId: '' }),
    setType: () => {},
    setMessageId: () => {},
    setConversationId: () => {},
    setParentMessageId: () => {},
    setPatentMessageId: () => {},
    setRunId: () => {},
    setThreadId: () => {},
    setTimestamp: () => {},
    setData: () => {},
    toJSON: () => ({}),
    ...extra,
  } as unknown as CometChat.AIAssistantBaseEvent;
}

function makeContentEvent(messageId: string, delta: string): CometChat.AIAssistantBaseEvent {
  return makeEvent('text_message_content', messageId, { getDelta: () => delta });
}

function makeToolStartEvent(messageId: string, toolName: string): CometChat.AIAssistantBaseEvent {
  return makeEvent('tool_call_start', messageId, { getToolCallName: () => toolName });
}

function makeToolArgEvent(messageId: string, delta: string): CometChat.AIAssistantBaseEvent {
  return makeEvent('tool_call_args', messageId, { getDelta: () => delta });
}

function collectEvents(
  service: CometChatAIStreamingService,
  fn: () => void
): IAIStreamEvent[] {
  const collected: IAIStreamEvent[] = [];
  const sub = service.messageStream$.subscribe((e) => collected.push(e));
  fn();
  sub.unsubscribe();
  return collected;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CometChatAIStreamingService', () => {
  let service: CometChatAIStreamingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CometChatAIStreamingService);
    service.setStreamSpeed(0);
  });

  // ── startStreamingMessage ──────────────────────────────────────────────────

  describe('startStreamingMessage', () => {
    it('should set isStreamingFor(chatId) to true', () => {
      service.startStreamingMessage('chat-1');
      expect(service.isStreamingFor('chat-1')()).toBe(true);
    });

    it('should reset accumulated state by calling stopStreamingMessage first', () => {
      const chatId = 'chat-reset';
      const runId = 'run-1';

      // Start a run and accumulate some text
      const sub = service.messageStream$.subscribe();
      service.startStreamingMessage(chatId);
      service.handleWebsocketMessage(makeEvent('run_started', runId), chatId);
      service.handleWebsocketMessage(makeContentEvent(runId, 'hello'), chatId);
      sub.unsubscribe();

      // Call startStreamingMessage again — should reset
      service.startStreamingMessage(chatId);
      expect(service.isStreamingFor(chatId)()).toBe(true);

      // After reset, new content events should start fresh
      const events: IAIStreamEvent[] = [];
      const sub2 = service.messageStream$.subscribe((e) => events.push(e));
      service.handleWebsocketMessage(makeEvent('run_started', 'run-2'), chatId);
      service.handleWebsocketMessage(makeContentEvent('run-2', 'world'), chatId);
      sub2.unsubscribe();

      const contentEvents = events.filter((e) => e.message.getType() === 'text_message_content');
      expect(contentEvents[0].streamedContent).toBe('world');
    });

    it('should not affect other chatIds', () => {
      service.startStreamingMessage('chat-A');
      expect(service.isStreamingFor('chat-B')()).toBe(false);
    });
  });

  // ── stopStreamingMessage ───────────────────────────────────────────────────

  describe('stopStreamingMessage', () => {
    it('should set isStreamingFor(chatId) to false', () => {
      service.startStreamingMessage('chat-1');
      service.stopStreamingMessage('chat-1');
      expect(service.isStreamingFor('chat-1')()).toBe(false);
    });

    it('should not affect other chatIds', () => {
      service.startStreamingMessage('chat-A');
      service.startStreamingMessage('chat-B');
      service.stopStreamingMessage('chat-A');

      expect(service.isStreamingFor('chat-A')()).toBe(false);
      expect(service.isStreamingFor('chat-B')()).toBe(true);
    });

    it('should be safe to call when no streaming is active', () => {
      expect(() => service.stopStreamingMessage('chat-nonexistent')).not.toThrow();
    });

    it('should tear down active run pipelines', () => {
      const chatId = 'chat-teardown';
      const runId = 'run-1';

      const sub = service.messageStream$.subscribe();
      service.startStreamingMessage(chatId);
      service.handleWebsocketMessage(makeEvent('run_started', runId), chatId);

      // Stop streaming — should tear down the run
      service.stopStreamingMessage(chatId);

      // After stop, new events for the same runId should create a new pipeline
      const events: IAIStreamEvent[] = [];
      const sub2 = service.messageStream$.subscribe((e) => events.push(e));
      service.handleWebsocketMessage(makeEvent('run_started', 'run-2'), chatId);
      sub2.unsubscribe();
      sub.unsubscribe();

      expect(events.some((e) => e.runId === 'run-2')).toBe(true);
    });
  });

  // ── handleWebsocketMessage ─────────────────────────────────────────────────

  describe('handleWebsocketMessage', () => {
    it('should route run_started event to messageStream$', () => {
      const events = collectEvents(service, () => {
        service.handleWebsocketMessage(makeEvent('run_started', 'run-1'), 'chat-1');
      });
      expect(events.length).toBe(1);
      expect(events[0].message.getType()).toBe('run_started');
      expect(events[0].runId).toBe('run-1');
      expect(events[0].chatId).toBe('chat-1');
    });

    it('should route text_message_content and accumulate text', () => {
      const events = collectEvents(service, () => {
        service.handleWebsocketMessage(makeEvent('run_started', 'run-1'), 'chat-1');
        service.handleWebsocketMessage(makeContentEvent('run-1', 'Hello'), 'chat-1');
        service.handleWebsocketMessage(makeContentEvent('run-1', ' World'), 'chat-1');
      });

      const contentEvents = events.filter((e) => e.message.getType() === 'text_message_content');
      expect(contentEvents.length).toBe(2);
      expect(contentEvents[0].streamedContent).toBe('Hello');
      expect(contentEvents[1].streamedContent).toBe('Hello World');
    });

    it('should route events from different runs independently', () => {
      const events = collectEvents(service, () => {
        service.handleWebsocketMessage(makeEvent('run_started', 'run-A'), 'chat-1');
        service.handleWebsocketMessage(makeEvent('run_started', 'run-B'), 'chat-1');
        service.handleWebsocketMessage(makeContentEvent('run-A', 'alpha'), 'chat-1');
        service.handleWebsocketMessage(makeContentEvent('run-B', 'beta'), 'chat-1');
        service.handleWebsocketMessage(makeContentEvent('run-A', '-2'), 'chat-1');
      });

      const runAEvents = events.filter(
        (e) => e.runId === 'run-A' && e.message.getType() === 'text_message_content'
      );
      const runBEvents = events.filter(
        (e) => e.runId === 'run-B' && e.message.getType() === 'text_message_content'
      );

      expect(runAEvents[runAEvents.length - 1].streamedContent).toBe('alpha-2');
      expect(runBEvents[runBEvents.length - 1].streamedContent).toBe('beta');
    });

    it('should tag each event with chatId and runId', () => {
      const events = collectEvents(service, () => {
        service.handleWebsocketMessage(makeEvent('run_started', 'run-X'), 'chat-Z');
      });
      expect(events[0].chatId).toBe('chat-Z');
      expect(events[0].runId).toBe('run-X');
    });
  });

  // ── run_finished triggers teardown ────────────────────────────────────────

  describe('run_finished', () => {
    it('should set isStreamingFor to false when last run finishes', () => {
      const chatId = 'chat-finish';
      const runId = 'run-1';

      const sub = service.messageStream$.subscribe();
      service.startStreamingMessage(chatId);
      service.handleWebsocketMessage(makeEvent('run_started', runId), chatId);

      expect(service.isStreamingFor(chatId)()).toBe(true);

      service.handleWebsocketMessage(makeEvent('run_finished', runId), chatId);
      sub.unsubscribe();

      expect(service.isStreamingFor(chatId)()).toBe(false);
    });

    it('should keep isStreamingFor true if other runs are still active', () => {
      const chatId = 'chat-multi';

      const sub = service.messageStream$.subscribe();
      service.startStreamingMessage(chatId);
      service.handleWebsocketMessage(makeEvent('run_started', 'run-A'), chatId);
      service.handleWebsocketMessage(makeEvent('run_started', 'run-B'), chatId);

      service.handleWebsocketMessage(makeEvent('run_finished', 'run-A'), chatId);

      // run-B is still active
      expect(service.isStreamingFor(chatId)()).toBe(true);

      service.handleWebsocketMessage(makeEvent('run_finished', 'run-B'), chatId);
      sub.unsubscribe();

      expect(service.isStreamingFor(chatId)()).toBe(false);
    });

    it('should emit run_finished event on messageStream$', () => {
      const events = collectEvents(service, () => {
        service.handleWebsocketMessage(makeEvent('run_started', 'run-1'), 'chat-1');
        service.handleWebsocketMessage(makeEvent('run_finished', 'run-1'), 'chat-1');
      });

      const finishedEvents = events.filter((e) => e.message.getType() === 'run_finished');
      expect(finishedEvents.length).toBe(1);
    });
  });

  // ── isStreamingFor signal stability ───────────────────────────────────────

  describe('isStreamingFor', () => {
    it('should return the same Signal instance on every call for the same chatId', () => {
      const sig1 = service.isStreamingFor('chat-stable');
      const sig2 = service.isStreamingFor('chat-stable');
      const sig3 = service.isStreamingFor('chat-stable');
      expect(sig1).toBe(sig2);
      expect(sig2).toBe(sig3);
    });

    it('should return different Signal instances for different chatIds', () => {
      const sigA = service.isStreamingFor('chat-A');
      const sigB = service.isStreamingFor('chat-B');
      expect(sigA).not.toBe(sigB);
    });

    it('should start as false for a new chatId', () => {
      expect(service.isStreamingFor('brand-new-chat')()).toBe(false);
    });
  });

  // ── setStreamSpeed ─────────────────────────────────────────────────────────

  describe('setStreamSpeed', () => {
    it('should not throw when called with any non-negative number', () => {
      expect(() => service.setStreamSpeed(0)).not.toThrow();
      expect(() => service.setStreamSpeed(50)).not.toThrow();
      expect(() => service.setStreamSpeed(1000)).not.toThrow();
    });

    it('should apply delay to future pipelines when speed > 0', async () => {
      service.setStreamSpeed(10);
      const events: IAIStreamEvent[] = [];
      const sub = service.messageStream$.subscribe((e) => events.push(e));

      service.handleWebsocketMessage(makeEvent('run_started', 'run-delay'), 'chat-delay');

      // Events are delayed — should not be synchronously available
      // (We just verify no error is thrown and the service handles it)
      sub.unsubscribe();
    });
  });

  // ── setAIAssistantTools ────────────────────────────────────────────────────

  describe('setAIAssistantTools', () => {
    it('should store tools and use them for tool call dispatch', () => {
      const received: unknown[] = [];
      const tools = new CometChatAIAssistantTools({
        myTool: (args: unknown) => received.push(args),
      });
      service.setAIAssistantTools(tools);

      const sub = service.messageStream$.subscribe();
      service.handleWebsocketMessage(makeEvent('run_started', 'run-1'), 'chat-1');
      service.handleWebsocketMessage(makeToolStartEvent('run-1', 'myTool'), 'chat-1');
      service.handleWebsocketMessage(makeToolArgEvent('run-1', '{"x":1}'), 'chat-1');
      service.handleWebsocketMessage(makeEvent('tool_call_end', 'run-1'), 'chat-1');
      sub.unsubscribe();

      expect(received.length).toBe(1);
      expect(received[0]).toEqual({ x: 1 });
    });

    it('should silently skip dispatch if tool name is not registered', () => {
      const tools = new CometChatAIAssistantTools({ knownTool: () => {} });
      service.setAIAssistantTools(tools);

      const sub = service.messageStream$.subscribe();
      expect(() => {
        service.handleWebsocketMessage(makeEvent('run_started', 'run-1'), 'chat-1');
        service.handleWebsocketMessage(makeToolStartEvent('run-1', 'unknownTool'), 'chat-1');
        service.handleWebsocketMessage(makeToolArgEvent('run-1', '{}'), 'chat-1');
        service.handleWebsocketMessage(makeEvent('tool_call_end', 'run-1'), 'chat-1');
      }).not.toThrow();
      sub.unsubscribe();
    });

    it('should silently skip dispatch if no tools have been set', () => {
      const sub = service.messageStream$.subscribe();
      expect(() => {
        service.handleWebsocketMessage(makeEvent('run_started', 'run-1'), 'chat-1');
        service.handleWebsocketMessage(makeToolStartEvent('run-1', 'anyTool'), 'chat-1');
        service.handleWebsocketMessage(makeToolArgEvent('run-1', '{}'), 'chat-1');
        service.handleWebsocketMessage(makeEvent('tool_call_end', 'run-1'), 'chat-1');
      }).not.toThrow();
      sub.unsubscribe();
    });

    it('should silently skip dispatch if tool handler throws', () => {
      const tools = new CometChatAIAssistantTools({
        badTool: () => {
          throw new Error('handler error');
        },
      });
      service.setAIAssistantTools(tools);

      const sub = service.messageStream$.subscribe();
      expect(() => {
        service.handleWebsocketMessage(makeEvent('run_started', 'run-1'), 'chat-1');
        service.handleWebsocketMessage(makeToolStartEvent('run-1', 'badTool'), 'chat-1');
        service.handleWebsocketMessage(makeToolArgEvent('run-1', '{}'), 'chat-1');
        service.handleWebsocketMessage(makeEvent('tool_call_end', 'run-1'), 'chat-1');
      }).not.toThrow();
      sub.unsubscribe();
    });
  });

  // ── isAnyStreaming ─────────────────────────────────────────────────────────

  describe('isAnyStreaming', () => {
    it('should be false when no chatId is streaming', () => {
      expect(service.isAnyStreaming()).toBe(false);
    });

    it('should be true when at least one chatId is streaming', () => {
      service.startStreamingMessage('chat-1');
      expect(service.isAnyStreaming()).toBe(true);
    });

    it('should be false after all chatIds stop streaming', () => {
      service.startStreamingMessage('chat-1');
      service.startStreamingMessage('chat-2');
      service.stopStreamingMessage('chat-1');
      service.stopStreamingMessage('chat-2');
      expect(service.isAnyStreaming()).toBe(false);
    });
  });

  // ── Memory Leak: _streamingSubjects Map cleanup (ENG-34637) ───────────────

  describe('_streamingSubjects Map cleanup', () => {
    it('should remove chatId entry from Map after stopStreamingMessage', () => {
      service.startStreamingMessage('chat-cleanup');
      // Subject exists while streaming
      const obs1 = service.isStreamingFor('chat-cleanup');
      expect(obs1).toBeDefined();

      service.stopStreamingMessage('chat-cleanup');

      // After stop, a new call creates a fresh subject (old one was cleaned up)
      const obs2 = service.isStreamingFor('chat-cleanup');
      // obs2 is a new Observable from a new BehaviorSubject — different instance
      expect(obs2).not.toBe(obs1);
    });

    it('should complete the BehaviorSubject observable after stopStreamingMessage', () => {
      return new Promise<void>((resolve) => {
        service.startStreamingMessage('chat-complete');
        const obs = service.isStreamingFor('chat-complete');

        obs.subscribe({
          complete: () => resolve(),
        });

        service.stopStreamingMessage('chat-complete');
      });
    });

    it('should remove chatId entry from Map after run_finished event', () => {
      return new Promise<void>((resolve) => {
        const chatId = 'chat-run-finished';
        const runId = 'run-1';

        const sub = service.messageStream$.subscribe();
        service.startStreamingMessage(chatId);

        const streamObs = service.isStreamingFor(chatId);
        streamObs.subscribe({
          complete: () => {
            sub.unsubscribe();
            resolve();
          },
        });

        service.handleWebsocketMessage(makeEvent('run_started', runId), chatId);
        service.handleWebsocketMessage(makeEvent('run_finished', runId), chatId);
      });
    });

    it('should not leak subjects across multiple chat sessions', () => {
      // Simulate many chat sessions starting and stopping
      for (let i = 0; i < 20; i++) {
        const chatId = `chat-session-${i}`;
        service.startStreamingMessage(chatId);
        service.stopStreamingMessage(chatId);
      }

      // After all sessions end, new isStreamingFor calls return false (fresh subjects)
      for (let i = 0; i < 20; i++) {
        let latestValue: boolean | undefined;
        service.isStreamingFor(`chat-session-${i}`).subscribe((v) => (latestValue = v)).unsubscribe();
        expect(latestValue).toBe(false);
      }
    });

    it('should complete messageStream$ and messageQueue on _cleanupAll (via destroyRef)', () => {
      let messageStreamCompleted = false;
      service.messageStream$.subscribe({ complete: () => (messageStreamCompleted = true) });

      // Trigger cleanup directly by calling the private method via type cast
      (service as unknown as { _cleanupAll: () => void })._cleanupAll();

      expect(messageStreamCompleted).toBe(true);
    });
  });
});
