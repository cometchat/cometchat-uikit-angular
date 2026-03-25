/**
 * Property-Based Tests for CometChatAIAssistantTools
 *
 * **Feature: ai-features**
 *
 * Tests the AI Assistant Tools class that maps tool function names to handler
 * functions, enabling the AI assistant to invoke client-side actions.
 *
 * Properties tested:
 * - Property 14: getAction lookup
 * - Property 15: getActions returns independent copy
 * - Property 16: Direct property access
 */
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  CometChatAIAssistantTools,
  ICometChatAIAssistantToolsMap,
} from '../CometChatAIAssistantTools';

// ==================== Generators ====================

/**
 * Generates valid JS identifier strings that don't conflict with class
 * built-in methods/properties (`getAction`, `getActions`, `actionsMap`).
 */
const RESERVED_NAMES = new Set([
  'getAction',
  'getActions',
  'actionsMap',
  'constructor',
  'prototype',
]);

const validFunctionName = fc
  .stringMatching(/^[a-zA-Z_$][a-zA-Z0-9_$]{0,19}$/)
  .filter(name => !RESERVED_NAMES.has(name));

/**
 * Generates a non-empty map of unique function names to vi.fn() handlers.
 */
const actionsMapArb = fc
  .uniqueArray(validFunctionName, { minLength: 1, maxLength: 10 })
  .map(names => {
    const map: ICometChatAIAssistantToolsMap = {};
    for (const name of names) {
      map[name] = vi.fn();
    }
    return map;
  });

/**
 * Generates a function name guaranteed NOT to be in a given set.
 */
function unregisteredName(registeredNames: string[]): fc.Arbitrary<string> {
  return validFunctionName.filter(name => !registeredNames.includes(name));
}

// ==================== Tests ====================

describe('Feature: ai-features, Property 14: AI Assistant Tools getAction lookup', () => {
  /**
   * **Validates: Requirements 10.2**
   *
   * For any map of function names to handlers, `getAction(name)` returns the
   * handler for registered names and `undefined` for unregistered names.
   */
  it('should return the handler for registered names and undefined for unregistered names', () => {
    fc.assert(
      fc.property(actionsMapArb, actionsMap => {
        const tools = new CometChatAIAssistantTools(actionsMap);
        const registeredNames = Object.keys(actionsMap);

        // Every registered name returns its handler
        for (const name of registeredNames) {
          expect(tools.getAction(name)).toBe(actionsMap[name]);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should return undefined for unregistered names', () => {
    fc.assert(
      fc.property(actionsMapArb, validFunctionName, (actionsMap, candidateName) => {
        const registeredNames = Object.keys(actionsMap);
        fc.pre(!registeredNames.includes(candidateName));

        const tools = new CometChatAIAssistantTools(actionsMap);
        expect(tools.getAction(candidateName)).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: ai-features, Property 15: AI Assistant Tools getActions returns independent copy', () => {
  /**
   * **Validates: Requirements 10.3**
   *
   * `getActions()` returns a shallow copy; mutating the returned object does
   * not affect subsequent calls.
   */
  it('should return a shallow copy that is independent from internal state', () => {
    fc.assert(
      fc.property(actionsMapArb, actionsMap => {
        const tools = new CometChatAIAssistantTools(actionsMap);
        const registeredNames = Object.keys(actionsMap);

        // Get first copy and mutate it
        const copy1 = tools.getActions();

        // Verify it contains all registered actions
        for (const name of registeredNames) {
          expect(copy1[name]).toBe(actionsMap[name]);
        }

        // Mutate the returned copy: delete a key and add a new one
        if (registeredNames.length > 0) {
          delete copy1[registeredNames[0]];
        }
        copy1['__injected__'] = vi.fn();

        // Get second copy — should be unaffected by mutations
        const copy2 = tools.getActions();

        // The deleted key should still be present
        for (const name of registeredNames) {
          expect(copy2[name]).toBe(actionsMap[name]);
        }

        // The injected key should not be present
        expect(copy2['__injected__']).toBeUndefined();

        // getAction should still work for all registered names
        for (const name of registeredNames) {
          expect(tools.getAction(name)).toBe(actionsMap[name]);
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: ai-features, Property 16: AI Assistant Tools direct property access', () => {
  /**
   * **Validates: Requirements 10.4**
   *
   * Each function name is directly accessible as a property on the instance,
   * invoking the same handler as `getAction(name)`.
   */
  it('should expose each registered function as a direct property matching getAction', () => {
    fc.assert(
      fc.property(actionsMapArb, actionsMap => {
        const tools = new CometChatAIAssistantTools(actionsMap);
        const registeredNames = Object.keys(actionsMap);

        for (const name of registeredNames) {
          // Property exists and is the same reference as getAction
          expect(tools[name]).toBe(tools.getAction(name));

          // Calling the property invokes the handler
          const testArg = { test: name };
          tools[name](testArg);
          expect(actionsMap[name]).toHaveBeenCalledWith(testArg);
        }
      }),
      { numRuns: 100 }
    );
  });
});
