/**
 * Unit + Property-Based Tests for Specialized Message Factories (mock-messages.ts)
 *
 * NOTE: CometChat.MESSAGE_TYPE, CometChat.MESSAGE_CATEGORY, and CometChat.CALL_TYPE
 * are nested objects that don't survive the shallow copy in vitest.setup.mjs.
 * We use string literals matching the actual SDK values instead.
 *
 * @module testing/__tests__/mock-messages.spec
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { createMockFileMessage, resetCustomMessageIdCounter } from '../mock-messages';
import { resetMockMessageIdCounter } from '../mock-sdk';

describe('Property 12: Specialized message factories produce correct type and structure', () => {
  beforeEach(() => {
    resetMockMessageIdCounter();
    resetCustomMessageIdCounter();
  });

  it('createMockFileMessage produces type FILE with attachment data', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        resetMockMessageIdCounter();
        const msg = createMockFileMessage();
        expect(msg.getType()).toBe('file');
        expect(msg.getCategory()).toBe('message');
        expect(typeof msg.getId()).toBe('number');
        expect(msg.getSender()).toBeDefined();
        expect(msg.getSentAt()).toBeGreaterThan(0);
        expect(msg.getAttachment()).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });
});
