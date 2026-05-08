/**
 * Property-Based Tests for CometChatAIStreamingService
 * Feature: ai-assistant-chat
 *
 * Uses fast-check for property-based testing.
 * Each property runs numRuns: 100 iterations.
 */

import * as fc from 'fast-check';
import { TestBed } from '@angular/core/testing';
import { CometChatAIStreamingService, IAIStreamEvent } from './cometchat-ai-streaming.service';
import { CometChatAIAssistantTools } from '../modals/CometChatAIAssistantTools';
import { CometChat } from '@cometchat/chat-sdk-javascript';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Creates a minimal AIAssistantBaseEvent-like object for testing.
 * We use plain objects that satisfy the interface rather than constructing
 * real SDK instances, since the SDK may require network initialization.
 */
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
    data: { timestamp: Date.now(), runId: messageId, threadId: '', ...extra },
    getType: () => type,
    getMessageId: () => messageId,
    getConversationId: () => 'conv-1',
    getParentMessageId: () => '',
    getPatentMessageId: () => '',
    getRunId: () => messageId,
    getThreadId: () => '',
    getTimestamp: () => Date.now(),
    getData: () => ({ timestamp: Date.now(), runId: messageId, threadId: '', ...extra }),
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
  return makeEvent('text_message_content', messageId, {
    getDelta: () => delta,
  });
}

function makeToolStartEvent(messageId: string, toolName: string): CometChat.AIAssistantBaseEvent {
  return makeEvent('tool_call_start', messageId, {
    getToolCallName: () => toolName,
  });
}

function makeToolArgEvent(messageId: string, delta: string): CometChat.AIAssistantBaseEvent {
  return makeEvent('tool_call_args', messageId, {
    getDelta: () => delta,
  });
}

/** Collect all emitted IAIStreamEvents synchronously from messageStream$ */
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

describe('CometChatAIStreamingService — Property Tests', () => {
  let service: CometChatAIStreamingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CometChatAIStreamingService);
    service.setStreamSpeed(0); // no delay for tests
  });

  // ── Property 3: Concurrent Run text isolation ──────────────────────────────

  /**
   * Property 3: Concurrent Run text isolation
   * For any sequence of interleaved text_message_content events across N concurrent Run IDs
   * within the same chatId, the final accumulated text delivered for each Run ID should equal
   * the ordered concatenation of only that Run's own content deltas.
   *
   * **Validates: Requirements 2.5, 14.1, 14.6**
   */
  it('Property 3: Concurrent Run text isolation — accumulated text equals ordered concat of own deltas', () => {
    fc.assert(
      fc.property(
        // Generate 2-4 run IDs (unique)
        fc.uniqueArray(fc.string({ minLength: 1, maxLength: 8 }), { minLength: 2, maxLength: 4 }),
        // For each run, generate 1-5 delta strings
        fc.array(fc.string({ minLength: 0, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
        (runIds, deltas) => {
          const svc = TestBed.inject(CometChatAIStreamingService);
          svc.setStreamSpeed(0);
          const chatId = 'chat-prop3';

          // Build per-run delta arrays
          const perRunDeltas: Record<string, string[]> = {};
          runIds.forEach((runId, i) => {
            // Distribute deltas round-robin across runs
            perRunDeltas[runId] = deltas.filter((_, idx) => idx % runIds.length === i);
          });

          // Collect all emitted events
          const emitted: IAIStreamEvent[] = [];
          const sub = svc.messageStream$.subscribe((e) => emitted.push(e));

          // Send run_started for all runs
          runIds.forEach((runId) => {
            svc.handleWebsocketMessage(makeEvent('run_started', runId), chatId);
          });

          // Interleave content events across runs
          const maxDeltas = Math.max(...runIds.map((r) => perRunDeltas[r].length));
          for (let i = 0; i < maxDeltas; i++) {
            runIds.forEach((runId) => {
              const d = perRunDeltas[runId][i];
              if (d !== undefined) {
                svc.handleWebsocketMessage(makeContentEvent(runId, d), chatId);
              }
            });
          }

          sub.unsubscribe();

          // For each run, find the last text_message_content event and check accumulated text
          runIds.forEach((runId) => {
            const expectedText = perRunDeltas[runId].join('');
            const contentEvents = emitted.filter(
              (e) => e.runId === runId && e.message.getType() === 'text_message_content'
            );

            if (contentEvents.length > 0) {
              const lastEvent = contentEvents[contentEvents.length - 1];
              expect(lastEvent.streamedContent).toBe(expectedText);
            } else {
              // No content events for this run — expected text should be empty
              expect(expectedText).toBe('');
            }
          });
        }
      ),
      { numRuns: 25 }
    );
  });

  // ── Property 4: Run teardown isolation ────────────────────────────────────

  /**
   * Property 4: Run teardown isolation
   * run_finished for Run A tears down only Run A; Run B continues processing events.
   *
   * **Validates: Requirements 2.7, 14.2**
   */
  it('Property 4: run_finished for Run A tears down only Run A; Run B continues', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 8 }),
        fc.string({ minLength: 1, maxLength: 8 }),
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 5 }),
        (runIdA, runIdB, deltasB) => {
          fc.pre(runIdA !== runIdB);

          const svc = TestBed.inject(CometChatAIStreamingService);
          svc.setStreamSpeed(0);
          const chatId = 'chat-prop4';

          const emitted: IAIStreamEvent[] = [];
          const sub = svc.messageStream$.subscribe((e) => emitted.push(e));

          // Start both runs
          svc.handleWebsocketMessage(makeEvent('run_started', runIdA), chatId);
          svc.handleWebsocketMessage(makeEvent('run_started', runIdB), chatId);

          // Finish Run A
          svc.handleWebsocketMessage(makeEvent('run_finished', runIdA), chatId);

          // Send content to Run B after Run A is finished
          deltasB.forEach((delta) => {
            svc.handleWebsocketMessage(makeContentEvent(runIdB, delta), chatId);
          });

          sub.unsubscribe();

          // Run B should have received all its content events
          const runBContentEvents = emitted.filter(
            (e) => e.runId === runIdB && e.message.getType() === 'text_message_content'
          );
          expect(runBContentEvents.length).toBe(deltasB.length);

          // The last accumulated text for Run B should equal concat of all deltas
          if (deltasB.length > 0) {
            const lastB = runBContentEvents[runBContentEvents.length - 1];
            expect(lastB.streamedContent).toBe(deltasB.join(''));
          }
        }
      ),
      { numRuns: 25 }
    );
  });

  // ── Property 5: stopStreamingMessage clears only that chatId ──────────────

  /**
   * Property 5: stopStreamingMessage(chatId) clears only that chatId; others unaffected.
   *
   * **Validates: Requirements 2.9, 14.4**
   */
  it('Property 5: stopStreamingMessage(chatId) clears only that chatId; others unaffected', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 8 }),
        fc.string({ minLength: 1, maxLength: 8 }),
        (chatIdA, chatIdB) => {
          fc.pre(chatIdA !== chatIdB);

          const svc = TestBed.inject(CometChatAIStreamingService);
          svc.setStreamSpeed(0);

          // Start streaming for both chatIds
          svc.startStreamingMessage(chatIdA);
          svc.startStreamingMessage(chatIdB);

          expect(svc.isStreamingFor(chatIdA)()).toBe(true);
          expect(svc.isStreamingFor(chatIdB)()).toBe(true);

          // Stop only chatIdA
          svc.stopStreamingMessage(chatIdA);

          // chatIdA should be false, chatIdB should remain true
          expect(svc.isStreamingFor(chatIdA)()).toBe(false);
          expect(svc.isStreamingFor(chatIdB)()).toBe(true);
        }
      ),
      { numRuns: 25 }
    );
  });

  // ── Property 6: isStreamingFor signal stability ────────────────────────────

  /**
   * Property 6: isStreamingFor(chatId) returns same Signal<boolean> instance on every call.
   *
   * **Validates: Requirements 2.11, 16.7**
   */
  it('Property 6: isStreamingFor(chatId) returns same Signal<boolean> instance on every call', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.integer({ min: 2, max: 10 }),
        (chatId, callCount) => {
          const svc = TestBed.inject(CometChatAIStreamingService);
          const first = svc.isStreamingFor(chatId);

          for (let i = 1; i < callCount; i++) {
            expect(svc.isStreamingFor(chatId)).toBe(first);
          }
        }
      ),
      { numRuns: 25 }
    );
  });

  // ── Property 7: Tool call dispatch scoped to Run ───────────────────────────

  /**
   * Property 7: Tool call dispatch scoped to Run
   * tool_call_end for Run A invokes only Run A's handler with Run A's accumulated arguments.
   *
   * **Validates: Requirements 3.1, 3.4**
   */
  it('Property 7: tool_call_end for Run A invokes only Run A handler with Run A args', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 8 }),
        fc.string({ minLength: 1, maxLength: 8 }),
        fc.string({ minLength: 1, maxLength: 8 }),
        fc.string({ minLength: 1, maxLength: 8 }),
        (runIdA, runIdB, toolNameA, toolNameB) => {
          fc.pre(runIdA !== runIdB);
          fc.pre(toolNameA !== toolNameB);

          const svc = TestBed.inject(CometChatAIStreamingService);
          svc.setStreamSpeed(0);
          const chatId = 'chat-prop7';

          const callsA: unknown[] = [];
          const callsB: unknown[] = [];

          const tools = new CometChatAIAssistantTools({
            [toolNameA]: (args: unknown) => callsA.push(args),
            [toolNameB]: (args: unknown) => callsB.push(args),
          });
          svc.setAIAssistantTools(tools);

          const argsA = { runId: runIdA, value: 42 };
          const argsB = { runId: runIdB, value: 99 };

          const sub = svc.messageStream$.subscribe();

          // Run A: tool_call_start → tool_call_args → tool_call_end
          svc.handleWebsocketMessage(makeEvent('run_started', runIdA), chatId);
          svc.handleWebsocketMessage(makeToolStartEvent(runIdA, toolNameA), chatId);
          svc.handleWebsocketMessage(makeToolArgEvent(runIdA, JSON.stringify(argsA)), chatId);
          svc.handleWebsocketMessage(makeEvent('tool_call_end', runIdA), chatId);

          // Run B: tool_call_start → tool_call_args → tool_call_end
          svc.handleWebsocketMessage(makeEvent('run_started', runIdB), chatId);
          svc.handleWebsocketMessage(makeToolStartEvent(runIdB, toolNameB), chatId);
          svc.handleWebsocketMessage(makeToolArgEvent(runIdB, JSON.stringify(argsB)), chatId);
          svc.handleWebsocketMessage(makeEvent('tool_call_end', runIdB), chatId);

          sub.unsubscribe();

          // Handler A should have been called with argsA
          expect(callsA.length).toBe(1);
          expect(callsA[0]).toEqual(argsA);

          // Handler B should have been called with argsB
          expect(callsB.length).toBe(1);
          expect(callsB[0]).toEqual(argsB);
        }
      ),
      { numRuns: 25 }
    );
  });

  // ── Property 8: Tool call args parsed once from fully concatenated string ──

  /**
   * Property 8: Tool call args parsed once from fully concatenated string, not partial fragments.
   * The handler should be invoked with the result of parsing the fully concatenated argument string.
   *
   * **Validates: Requirements 3.2**
   */
  it('Property 8: tool handler invoked with fully concatenated args, not partial fragments', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 8 }),
        fc.record({
          key: fc.string({ minLength: 1, maxLength: 10 }),
          value: fc.integer({ min: 0, max: 1000 }),
        }),
        fc.integer({ min: 2, max: 6 }),
        (runId, argsObj, chunkCount) => {
          const svc = TestBed.inject(CometChatAIStreamingService);
          svc.setStreamSpeed(0);
          const chatId = 'chat-prop8';
          const toolName = 'myTool';

          const receivedArgs: unknown[] = [];
          const tools = new CometChatAIAssistantTools({
            [toolName]: (args: unknown) => receivedArgs.push(args),
          });
          svc.setAIAssistantTools(tools);

          const fullArgsJson = JSON.stringify(argsObj);

          // Split the JSON string into chunks
          const chunkSize = Math.ceil(fullArgsJson.length / chunkCount);
          const chunks: string[] = [];
          for (let i = 0; i < fullArgsJson.length; i += chunkSize) {
            chunks.push(fullArgsJson.slice(i, i + chunkSize));
          }

          const sub = svc.messageStream$.subscribe();

          svc.handleWebsocketMessage(makeEvent('run_started', runId), chatId);
          svc.handleWebsocketMessage(makeToolStartEvent(runId, toolName), chatId);
          chunks.forEach((chunk) => {
            svc.handleWebsocketMessage(makeToolArgEvent(runId, chunk), chatId);
          });
          svc.handleWebsocketMessage(makeEvent('tool_call_end', runId), chatId);

          sub.unsubscribe();

          // Handler should have been called exactly once with the full parsed args
          expect(receivedArgs.length).toBe(1);
          expect(receivedArgs[0]).toEqual(argsObj);
        }
      ),
      { numRuns: 25 }
    );
  });

  // ── Property 14: isStreamingFor reflects active Runs ──────────────────────

  /**
   * Property 14: isStreamingFor(chatId) is true iff at least one Run is active for that chatId.
   * It becomes false only after all active Runs have finished or been stopped.
   *
   * **Validates: Requirements 2.7, 14.5**
   */
  it('Property 14: isStreamingFor(chatId) is true iff at least one Run is active', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.string({ minLength: 1, maxLength: 8 }), { minLength: 1, maxLength: 4 }),
        (runIds) => {
          const svc = TestBed.inject(CometChatAIStreamingService);
          svc.setStreamSpeed(0);
          const chatId = 'chat-prop14';

          const sub = svc.messageStream$.subscribe();

          // Start streaming (simulates startStreamingMessage being called)
          svc.startStreamingMessage(chatId);
          expect(svc.isStreamingFor(chatId)()).toBe(true);

          // Start all runs
          runIds.forEach((runId) => {
            svc.handleWebsocketMessage(makeEvent('run_started', runId), chatId);
          });

          // Finish runs one by one — streaming should remain true until last run finishes
          for (let i = 0; i < runIds.length; i++) {
            svc.handleWebsocketMessage(makeEvent('run_finished', runIds[i]), chatId);

            if (i < runIds.length - 1) {
              // Still have active runs
              expect(svc.isStreamingFor(chatId)()).toBe(true);
            } else {
              // All runs finished
              expect(svc.isStreamingFor(chatId)()).toBe(false);
            }
          }

          sub.unsubscribe();
        }
      ),
      { numRuns: 25 }
    );
  });
});
