/**
 * Unit + Property-Based Tests for installSDKMocks and Providers (mock-providers.ts)
 *
 * Feature: sdk-mock-testing
 *
 * Tests cover:
 * - Property 9: installSDKMocks returns complete spy map (Task 10.1)
 * - Property 4: Listener registration round-trip (Task 10.2)
 * - Property 5: Send-method echo-back (Task 10.3)
 * - Property 7: Mock override isolation (Task 10.4)
 * - Property 10: installSDKMocks idempotence (Task 10.5)
 * - Property 13: MockTranslatePipe identity (Task 10.6)
 * - Property 6: Action mocks resolve with appropriate defaults (Task 10.7)
 *
 * @module testing/__tests__/mock-providers.spec
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { vi } from 'vitest';
import * as fc from 'fast-check';
import {
  installSDKMocks,
  getRegisteredListener,
  clearListenerRegistry,
  MockTranslatePipe,
} from '../mock-providers';
import type { SDKMockSpies } from '../mock-providers';
import { createMockTextMessage, resetMockMessageIdCounter } from '../mock-sdk';

// ─── Helpers ───

/** Safely call a spy by casting to any to avoid MockInstance<Procedure> call-signature errors. */
function callSpy(spy: any, ...args: any[]): any {
  return spy(...args);
}

// ─── Expected SDKMockSpies keys (source of truth for Property 9) ───

const EXPECTED_SPY_KEYS: (keyof SDKMockSpies)[] = [
  'getLoggedinUser',
  'getLoggedInUser',
  'addMessageListener',
  'addCallListener',
  'addUserListener',
  'addGroupListener',
  'addConnectionListener',
  'addLoginListener',
  'removeMessageListener',
  'removeCallListener',
  'removeUserListener',
  'removeGroupListener',
  'removeConnectionListener',
  'removeLoginListener',
  'sendMessage',
  'sendMediaMessage',
  'sendCustomMessage',
  'sendInteractiveMessage',
  'editMessage',
  'deleteMessage',
  'markAsRead',
  'markAsDelivered',
  'markConversationAsRead',
  'markConversationAsDelivered',
  'startTyping',
  'endTyping',
  'initiateCall',
  'acceptCall',
  'rejectCall',
  'endCall',
  'clearActiveCall',
  'getUser',
  'blockUsers',
  'unblockUsers',
  'getGroup',
  'joinGroup',
  'leaveGroup',
  'kickGroupMember',
  'banGroupMember',
  'unbanGroupMember',
  'updateGroupMemberScope',
  'transferGroupOwnership',
  'createGroup',
  'updateGroup',
  'deleteGroup',
  'getConversation',
  'deleteConversation',
  'tagConversation',
  'addReaction',
  'removeReaction',
  'getConversationStarter',
  'getSmartReplies',
  'getConversationSummary',
  'askBot',
  'isAIFeatureEnabled',
  'isExtensionEnabled',
  'callExtension',
  'getConnectionStatus',
  'getAppSettings',
  'isFeatureEnabled',
  'connect',
  'disconnect',
  'setSource',
  'setDemoMetaInfo',
];

// ─── Listener type → add method name mapping ───

const LISTENER_TYPES = ['message', 'call', 'user', 'group', 'connection', 'login'] as const;
type ListenerType = (typeof LISTENER_TYPES)[number];

const LISTENER_ADD_METHOD: Record<ListenerType, keyof SDKMockSpies> = {
  message: 'addMessageListener',
  call: 'addCallListener',
  user: 'addUserListener',
  group: 'addGroupListener',
  connection: 'addConnectionListener',
  login: 'addLoginListener',
};

// ─── Send methods for Property 5 ───

const SEND_METHODS: (keyof SDKMockSpies)[] = [
  'sendMessage',
  'sendMediaMessage',
  'sendCustomMessage',
  'sendInteractiveMessage',
];

// ═══════════════════════════════════════════════════════════════════════════════
// Task 10.1 — Unit test: installSDKMocks() returns all expected spy keys
// Feature: sdk-mock-testing, Property 9: installSDKMocks returns complete spy map
// **Validates: Requirements 8.1, 8.2**
// ═══════════════════════════════════════════════════════════════════════════════

describe('Property 9: installSDKMocks returns complete spy map', () => {
  let spies: SDKMockSpies;

  beforeEach(() => {
    spies = installSDKMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns an object containing every key in the SDKMockSpies interface', () => {
    for (const key of EXPECTED_SPY_KEYS) {
      expect(spies[key], `Missing spy key: ${key}`).toBeDefined();
    }
  });

  it('every returned spy is a valid Vitest MockInstance (has mockImplementation)', () => {
    for (const key of EXPECTED_SPY_KEYS) {
      const spy = spies[key];
      expect(
        typeof spy.mockImplementation,
        `${key} should be a MockInstance with mockImplementation`
      ).toBe('function');
    }
  });

  it('returned object has exactly the expected number of keys', () => {
    const returnedKeys = Object.keys(spies);
    expect(returnedKeys.length).toBe(EXPECTED_SPY_KEYS.length);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Task 10.2 — Property tests: listener round-trip (register → retrieve)
// Feature: sdk-mock-testing, Property 4: Listener registration round-trip
// **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.8**
// ═══════════════════════════════════════════════════════════════════════════════

describe('Property 4: Listener registration round-trip', () => {
  let spies: SDKMockSpies;

  beforeEach(() => {
    spies = installSDKMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  for (const listenerType of LISTENER_TYPES) {
    it(`${listenerType}: register with random name, retrieve same callback`, () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 100 }), name => {
          clearListenerRegistry();

          const callback = { onEvent: () => {} };
          const addMethod = spies[LISTENER_ADD_METHOD[listenerType]];

          // Register the listener via callSpy helper
          callSpy(addMethod, name, callback);

          // Retrieve and verify it's the exact same reference
          const retrieved = getRegisteredListener(listenerType, name);
          expect(retrieved).toBe(callback);
        }),
        { numRuns: 100 }
      );
    });
  }

  it('getRegisteredListener returns undefined for unregistered names', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...LISTENER_TYPES),
        fc.string({ minLength: 1, maxLength: 100 }),
        (type, name) => {
          clearListenerRegistry();
          const result = getRegisteredListener(type, name);
          expect(result).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Task 10.3 — Property tests: send-method echo-back with random message objects
// Feature: sdk-mock-testing, Property 5: Send-method echo-back
// **Validates: Requirements 7.1, 7.2**
// ═══════════════════════════════════════════════════════════════════════════════

describe('Property 5: Send-method echo-back with random message objects', () => {
  let spies: SDKMockSpies;

  beforeEach(() => {
    resetMockMessageIdCounter();
    spies = installSDKMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  for (const method of SEND_METHODS) {
    it(`${method}: resolves with the same message object passed as argument`, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            text: fc.string({ minLength: 1, maxLength: 200 }),
            receiverId: fc.string({ minLength: 1, maxLength: 50 }),
          }),
          async data => {
            resetMockMessageIdCounter();
            const msg = createMockTextMessage({ text: data.text });
            const result = await callSpy(spies[method], msg);
            expect(result).toBe(msg);
          }
        ),
        { numRuns: 100 }
      );
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Task 10.4 — Property tests: mock override isolation
// Feature: sdk-mock-testing, Property 7: Mock override isolation
// **Validates: Requirements 7.11, 15.8**
// ═══════════════════════════════════════════════════════════════════════════════

describe('Property 7: Mock override isolation — override one method, others unchanged', () => {
  let spies: SDKMockSpies;

  beforeEach(() => {
    spies = installSDKMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Async methods that resolve with known defaults (subset for testing isolation)
  const ASYNC_DEFAULTS: { key: keyof SDKMockSpies; expected: any }[] = [
    { key: 'blockUsers', expected: [] },
    { key: 'unblockUsers', expected: [] },
    { key: 'leaveGroup', expected: true },
    { key: 'kickGroupMember', expected: true },
    { key: 'deleteGroup', expected: true },
    { key: 'isFeatureEnabled', expected: true },
    { key: 'getConversationStarter', expected: [] },
    { key: 'getSmartReplies', expected: {} },
    { key: 'getConversationSummary', expected: '' },
    { key: 'isAIFeatureEnabled', expected: false },
  ];

  it('overriding one spy with mockRejectedValue does not affect other spies', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: ASYNC_DEFAULTS.length - 1 }),
        async overrideIdx => {
          // Re-install fresh spies for each iteration
          vi.restoreAllMocks();
          spies = installSDKMocks();

          const overrideEntry = ASYNC_DEFAULTS[overrideIdx];
          const overrideSpy = spies[overrideEntry.key];

          // Override the chosen spy to reject
          overrideSpy.mockRejectedValue(new Error('test-override'));

          // Verify all OTHER spies still resolve with their defaults
          for (const entry of ASYNC_DEFAULTS) {
            if (entry.key === overrideEntry.key) continue;
            const result = await callSpy(spies[entry.key]);
            expect(result).toEqual(entry.expected);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Task 10.5 — Unit test: installSDKMocks() idempotence (call twice, latest active)
// Feature: sdk-mock-testing, Property 10: installSDKMocks is idempotent across calls
// **Validates: Requirements 8.4, 12.3**
// ═══════════════════════════════════════════════════════════════════════════════

describe('Property 10: installSDKMocks idempotence — call twice, latest spies active', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('second call replaces first call spies — latest spies are functional', async () => {
    installSDKMocks();
    const spies2 = installSDKMocks();

    // The latest spies (spies2) should be the active ones
    await callSpy(spies2.getLoggedInUser);
    expect(spies2.getLoggedInUser).toHaveBeenCalled();

    // spies2 references should be valid MockInstances
    for (const key of EXPECTED_SPY_KEYS) {
      expect(
        typeof spies2[key].mockImplementation,
        `spies2.${key} should be a valid MockInstance`
      ).toBe('function');
    }
  });

  it('listener registry is cleared on each installSDKMocks call', () => {
    const spies1 = installSDKMocks();
    // Register a listener with first install
    callSpy(spies1.addMessageListener, 'test-listener', { onTextMessageReceived: () => {} });
    expect(getRegisteredListener('message', 'test-listener')).toBeDefined();

    // Second install should clear the registry
    installSDKMocks();
    expect(getRegisteredListener('message', 'test-listener')).toBeUndefined();
  });

  it('overrides on first install do not persist after second install', async () => {
    const spies1 = installSDKMocks();
    spies1.blockUsers.mockRejectedValue(new Error('should-not-persist'));

    const spies2 = installSDKMocks();
    // blockUsers should resolve with default [] after re-install
    const result = await callSpy(spies2.blockUsers);
    expect(result).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Task 10.6 — Property test: MockTranslatePipe identity across random key strings
// Feature: sdk-mock-testing, Property 13: MockTranslatePipe identity
// **Validates: Requirements 9.1**
// ═══════════════════════════════════════════════════════════════════════════════

describe('Property 13: MockTranslatePipe identity across random key strings', () => {
  const pipe = new MockTranslatePipe();

  it('transform(key) returns key as-is for non-empty strings', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 200 }), key => {
        expect(pipe.transform(key)).toBe(key);
      }),
      { numRuns: 100 }
    );
  });

  it('transform(key, params) returns key[param1=val1,param2=val2]', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.dictionary(
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter(
              s => !s.includes('=') && !s.includes(',') && !s.includes('[') && !s.includes(']')
            ),
          fc.oneof(
            fc
              .string({ minLength: 1, maxLength: 20 })
              .filter(
                s => !s.includes('=') && !s.includes(',') && !s.includes('[') && !s.includes(']')
              ),
            fc.integer({ min: 0, max: 9999 }).map(String)
          ),
          { minKeys: 1, maxKeys: 5 }
        ),
        (key, params) => {
          const result = pipe.transform(key, params);
          const paramStr = Object.entries(params)
            .map(([k, v]) => `${k}=${v}`)
            .join(',');
          expect(result).toBe(`${key}[${paramStr}]`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('transform("") returns ""', () => {
    expect(pipe.transform('')).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Task 10.7 — Unit test: all action mocks resolve with appropriate defaults
// Feature: sdk-mock-testing, Property 6: SDK action mocks resolve with appropriate defaults
// **Validates: Requirements 7.4, 7.5, 7.6, 7.9, 14.1–14.7, 15.1–15.7, 16.1–16.5**
// ═══════════════════════════════════════════════════════════════════════════════

describe('Property 6: All action mocks resolve with appropriate defaults', () => {
  let spies: SDKMockSpies;

  beforeEach(() => {
    spies = installSDKMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Async methods that resolve with undefined ──
  const RESOLVE_UNDEFINED: (keyof SDKMockSpies)[] = [
    'markAsRead',
    'markAsDelivered',
    'markConversationAsRead',
    'markConversationAsDelivered',
    'deleteConversation',
    'tagConversation',
  ];

  for (const method of RESOLVE_UNDEFINED) {
    it(`${method} resolves with undefined`, async () => {
      const result = await callSpy(spies[method]);
      expect(result).toBeUndefined();
    });
  }

  // ── Synchronous no-op methods ──
  const SYNC_NOOPS: (keyof SDKMockSpies)[] = [
    'startTyping',
    'endTyping',
    'connect',
    'disconnect',
    'setSource',
    'setDemoMetaInfo',
    'clearActiveCall',
  ];

  for (const method of SYNC_NOOPS) {
    it(`${method} is synchronous and does not throw`, () => {
      expect(() => callSpy(spies[method])).not.toThrow();
    });
  }

  // ── Group operations that resolve with true ──
  const RESOLVE_TRUE: (keyof SDKMockSpies)[] = [
    'leaveGroup',
    'kickGroupMember',
    'banGroupMember',
    'unbanGroupMember',
    'updateGroupMemberScope',
    'deleteGroup',
  ];

  for (const method of RESOLVE_TRUE) {
    it(`${method} resolves with true`, async () => {
      const result = await callSpy(spies[method]);
      expect(result).toBe(true);
    });
  }

  it('transferGroupOwnership resolves with "success"', async () => {
    const result = await callSpy(spies.transferGroupOwnership);
    expect(result).toBe('success');
  });

  // ── Methods that resolve with empty arrays ──
  const RESOLVE_EMPTY_ARRAY: (keyof SDKMockSpies)[] = [
    'blockUsers',
    'unblockUsers',
    'getConversationStarter',
  ];

  for (const method of RESOLVE_EMPTY_ARRAY) {
    it(`${method} resolves with []`, async () => {
      const result = await callSpy(spies[method]);
      expect(result).toEqual([]);
    });
  }

  it('getSmartReplies resolves with {}', async () => {
    const result = await callSpy(spies.getSmartReplies);
    expect(result).toEqual({});
  });

  // ── Methods that resolve with empty string ──
  const RESOLVE_EMPTY_STRING: (keyof SDKMockSpies)[] = ['getConversationSummary', 'askBot'];

  for (const method of RESOLVE_EMPTY_STRING) {
    it(`${method} resolves with ""`, async () => {
      const result = await callSpy(spies[method]);
      expect(result).toBe('');
    });
  }

  // ── Boolean defaults ──
  it('isAIFeatureEnabled resolves with false', async () => {
    const result = await callSpy(spies.isAIFeatureEnabled);
    expect(result).toBe(false);
  });

  it('isExtensionEnabled resolves with false', async () => {
    const result = await callSpy(spies.isExtensionEnabled);
    expect(result).toBe(false);
  });

  it('isFeatureEnabled resolves with true', async () => {
    const result = await callSpy(spies.isFeatureEnabled);
    expect(result).toBe(true);
  });

  // ── Methods that resolve with {} ──
  const RESOLVE_EMPTY_OBJECT: (keyof SDKMockSpies)[] = ['callExtension', 'getAppSettings'];

  for (const method of RESOLVE_EMPTY_OBJECT) {
    it(`${method} resolves with {}`, async () => {
      const result = await callSpy(spies[method]);
      expect(result).toEqual({});
    });
  }

  // ── getConnectionStatus is synchronous and returns 'connected' ──
  it('getConnectionStatus returns "connected" synchronously', () => {
    const result = callSpy(spies.getConnectionStatus);
    expect(result).toBe('connected');
  });
});
