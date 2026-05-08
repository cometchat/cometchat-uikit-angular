import * as fc from 'fast-check';
import { CometChatAIAssistantTools } from './CometChatAIAssistantTools';

/**
 * Property-based tests for CometChatAIAssistantTools
 * Feature: ai-assistant-chat
 */

describe('CometChatAIAssistantTools — Property Tests', () => {
  /**
   * Property 1: Tool action round-trip
   * For any CometChatAIAssistantTools instance constructed with a map of named handlers,
   * calling getAction(name) for every registered name should return the same function reference.
   *
   * Validates: Requirements 1.2, 1.4, 1.5
   */
  it('Property 1: getAction(name) returns same function reference for every registered name', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 }),
        (names) => {
          const handlers: Record<string, (...args: unknown[]) => unknown> = {};
          for (const name of names) {
            handlers[name] = () => name;
          }

          const tools = new CometChatAIAssistantTools(handlers);

          for (const name of names) {
            expect(tools.getAction(name)).toBe(handlers[name]);
          }
        }
      ),
      { numRuns: 25 }
    );
  });

  /**
   * Property 2: Tool actions map isolation
   * Mutating the object returned by getActions() should not affect subsequent calls
   * to getActions() or getAction().
   *
   * Validates: Requirements 1.5
   */
  it('Property 2: mutating getActions() result does not affect subsequent calls', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 }),
        (names) => {
          const handlers: Record<string, (...args: unknown[]) => unknown> = {};
          for (const name of names) {
            handlers[name] = () => name;
          }

          const tools = new CometChatAIAssistantTools(handlers);

          // Get a copy and mutate it
          const copy = tools.getActions();
          for (const name of names) {
            delete (copy as Record<string, unknown>)[name];
          }
          (copy as Record<string, unknown>)['__injected__'] = () => 'injected';

          // Original should be unaffected
          for (const name of names) {
            expect(tools.getAction(name)).toBe(handlers[name]);
          }

          const copy2 = tools.getActions();
          expect(copy2['__injected__']).toBeUndefined();
          for (const name of names) {
            expect(copy2[name]).toBe(handlers[name]);
          }
        }
      ),
      { numRuns: 25 }
    );
  });
});
