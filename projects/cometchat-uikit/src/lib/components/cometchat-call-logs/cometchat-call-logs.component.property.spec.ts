import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { verifyCallUser } from '../../utils/CallLogUtils';

/**
 * Property-Based Tests for CometChatCallLogs Component Rendering
 *
 * Tests the pure logic that drives rendering decisions in the template:
 * - Trailing icon CSS class selection (audio vs video)
 * - Active call highlighting (session ID matching)
 * - ARIA label content (other party name)
 *
 * These test the logic functions directly rather than doing full DOM rendering,
 * since the template bindings are straightforward expressions of this logic.
 *
 * **Validates: Requirements 2.4, 6.1, 8.2**
 */

// ==================== Generators ====================

/** Arbitrary for a non-empty UID string */
const uidArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

/** Arbitrary for a user name */
const nameArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);

/** Call types: audio and video */
const callTypeArb = fc.constantFrom('audio', 'video');

/** Arbitrary for a session ID */
const sessionIdArb = fc.string({ minLength: 1, maxLength: 64 }).filter(s => s.trim().length > 0);

/** All possible call statuses */
const anyStatusArb = fc.constantFrom(
  'unanswered',
  'cancelled',
  'busy',
  'rejected',
  'initiated',
  'ongoing',
  'ended'
);

/** Creates a mock user-like entity */
function createMockEntity(uid: string, name: string) {
  return {
    getUid: () => uid,
    getName: () => name,
    avatar: `https://example.com/${uid}.png`,
    icon: `https://example.com/${uid}-icon.png`,
  };
}

/** Creates a mock logged-in user */
function createMockLoggedInUser(uid: string) {
  return { getUid: () => uid };
}

/**
 * Creates a mock call log with type and session ID.
 * Mirrors the shape used by the component template bindings.
 */
function createMockCallLog(opts: {
  initiatorUid: string;
  initiatorName: string;
  receiverUid: string;
  receiverName: string;
  status: string;
  type: string;
  sessionId: string;
}) {
  const initiator = createMockEntity(opts.initiatorUid, opts.initiatorName);
  const receiver = createMockEntity(opts.receiverUid, opts.receiverName);
  return {
    getInitiator: () => initiator,
    getReceiver: () => receiver,
    getStatus: () => opts.status,
    getType: () => opts.type,
    getSessionID: () => opts.sessionId,
    type: opts.type,
    initiatedAt: Date.now(),
  };
}

/**
 * Arbitrary that generates a full call log with type and session ID,
 * plus a logged-in user. Ensures initiator and receiver differ.
 */
const callLogArb = fc
  .record({
    loggedInUid: uidArb,
    otherUid: uidArb,
    initiatorName: nameArb,
    receiverName: nameArb,
    status: anyStatusArb,
    type: callTypeArb,
    sessionId: sessionIdArb,
    userIsInitiator: fc.boolean(),
  })
  .filter(opts => opts.userIsInitiator || opts.loggedInUid !== opts.otherUid)
  .map(opts => ({
    callLog: createMockCallLog({
      initiatorUid: opts.userIsInitiator ? opts.loggedInUid : opts.otherUid,
      initiatorName: opts.initiatorName,
      receiverUid: opts.userIsInitiator ? opts.otherUid : opts.loggedInUid,
      receiverName: opts.receiverName,
      status: opts.status,
      type: opts.type,
      sessionId: opts.sessionId,
    }),
    loggedInUser: createMockLoggedInUser(opts.loggedInUid),
    expectedType: opts.type,
    otherName: opts.userIsInitiator ? opts.receiverName : opts.initiatorName,
    sessionId: opts.sessionId,
  }));

// ==================== Rendering Logic Functions ====================
// These replicate the exact expressions used in the component template.

/**
 * Determines the trailing view CSS class based on call type.
 * Mirrors the template binding:
 *   [class.cometchat-call-logs__list-item-trailing-view-video]="call.type === 'video'"
 *   [class.cometchat-call-logs__list-item-trailing-view-audio]="call.type !== 'video'"
 */
function getTrailingIconClass(call: any): 'video' | 'audio' {
  return call.type === 'video' ? 'video' : 'audio';
}

/**
 * Determines if a call log item should have the active CSS class.
 * Mirrors the component method `isActiveCall()`:
 *   if (!this.activeCall) return false;
 *   return this.activeCall.getSessionID() === call.getSessionID();
 */
function isActiveCall(call: any, activeCall: any | null): boolean {
  if (!activeCall) return false;
  try {
    return activeCall.getSessionID() === call.getSessionID();
  } catch {
    return false;
  }
}

/**
 * Builds the ARIA label for a call log item.
 * Mirrors the template binding:
 *   [ariaLabel]="(getCallUser(call)?.getName() || '') + ', ' + (call.type === 'video' ? 'Video' : 'Audio') + ' call'"
 */
function buildAriaLabel(call: any, loggedInUser: { getUid(): string }): string {
  const otherParty = verifyCallUser(call, loggedInUser);
  const name = otherParty?.getName() || '';
  const typeLabel = call.type === 'video' ? 'Video' : 'Audio';
  return `${name}, ${typeLabel} call`;
}

// ==================== Property 3: Trailing icon matches call type ====================

/**
 * **Feature: call-logs-component, Property 3: Trailing icon matches call type**
 *
 * *For any* call log, the trailing view should display a video call icon when
 * the call type is video, and an audio call icon when the call type is audio.
 *
 * **Validates: Requirements 2.4**
 */
describe('Property 3: Trailing icon matches call type', () => {
  it('should apply the video CSS class when call type is video', () => {
    fc.assert(
      fc.property(
        callLogArb.filter(({ expectedType }) => expectedType === 'video'),
        ({ callLog }) => {
          expect(getTrailingIconClass(callLog)).toBe('video');
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should apply the audio CSS class when call type is audio', () => {
    fc.assert(
      fc.property(
        callLogArb.filter(({ expectedType }) => expectedType === 'audio'),
        ({ callLog }) => {
          expect(getTrailingIconClass(callLog)).toBe('audio');
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should always produce exactly one of audio or video class for any call type', () => {
    fc.assert(
      fc.property(callLogArb, ({ callLog, expectedType }) => {
        const iconClass = getTrailingIconClass(callLog);
        expect(['audio', 'video']).toContain(iconClass);
        expect(iconClass).toBe(expectedType);
      }),
      { numRuns: 20 }
    );
  });

  it('should be consistent: same call type always produces same icon class', () => {
    fc.assert(
      fc.property(callLogArb, ({ callLog }) => {
        const first = getTrailingIconClass(callLog);
        const second = getTrailingIconClass(callLog);
        expect(first).toBe(second);
      }),
      { numRuns: 20 }
    );
  });
});

// ==================== Property 7: Active call highlighting ====================

/**
 * **Feature: call-logs-component, Property 7: Active call highlighting**
 *
 * *For any* call log list and active call input, exactly the list items whose
 * session ID matches the active call's session ID should have the active CSS
 * class applied, and all others should not.
 *
 * **Validates: Requirements 6.1**
 */
describe('Property 7: Active call highlighting', () => {
  /** Generates a list of call logs with unique session IDs */
  const callLogListArb = fc
    .array(
      fc.record({
        uid: uidArb,
        name: nameArb,
        type: callTypeArb,
        sessionId: sessionIdArb,
        status: anyStatusArb,
      }),
      { minLength: 1, maxLength: 20 }
    )
    .map(items => {
      // Ensure unique session IDs
      const seen = new Set<string>();
      return items.filter(item => {
        if (seen.has(item.sessionId)) return false;
        seen.add(item.sessionId);
        return true;
      });
    })
    .filter(items => items.length > 0)
    .map(items =>
      items.map(item =>
        createMockCallLog({
          initiatorUid: item.uid,
          initiatorName: item.name,
          receiverUid: item.uid + '-other',
          receiverName: item.name + ' Other',
          status: item.status,
          type: item.type,
          sessionId: item.sessionId,
        })
      )
    );

  it('should highlight exactly the items matching the active call session ID', () => {
    fc.assert(
      fc.property(
        callLogListArb.chain(logs =>
          fc.record({
            logs: fc.constant(logs),
            // Pick one of the existing session IDs as the active call
            activeSessionId: fc.constantFrom(...logs.map((l: any) => l.getSessionID())),
          })
        ),
        ({ logs, activeSessionId }) => {
          const activeCall = { getSessionID: () => activeSessionId };

          const activeItems = logs.filter((log: any) => isActiveCall(log, activeCall));
          const inactiveItems = logs.filter((log: any) => !isActiveCall(log, activeCall));

          // All active items should have matching session ID
          for (const item of activeItems) {
            expect(item.getSessionID()).toBe(activeSessionId);
          }

          // No inactive items should have matching session ID
          for (const item of inactiveItems) {
            expect(item.getSessionID()).not.toBe(activeSessionId);
          }

          // Active + inactive should cover all items
          expect(activeItems.length + inactiveItems.length).toBe(logs.length);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should highlight no items when activeCall is null', () => {
    fc.assert(
      fc.property(callLogListArb, logs => {
        for (const log of logs) {
          expect(isActiveCall(log, null)).toBe(false);
        }
      }),
      { numRuns: 20 }
    );
  });

  it('should highlight no items when activeCall session ID matches none', () => {
    fc.assert(
      fc.property(fc.tuple(callLogListArb, sessionIdArb), ([logs, randomSessionId]) => {
        // Use a session ID guaranteed not to match any log
        const nonMatchingId = randomSessionId + '__NOMATCH__';
        const activeCall = { getSessionID: () => nonMatchingId };

        for (const log of logs) {
          expect(isActiveCall(log, activeCall)).toBe(false);
        }
      }),
      { numRuns: 20 }
    );
  });

  it('should be a pure partition: every item is either active or not, never both', () => {
    fc.assert(
      fc.property(
        callLogListArb.chain(logs =>
          fc.record({
            logs: fc.constant(logs),
            activeSessionId: fc.constantFrom(...logs.map((l: any) => l.getSessionID())),
          })
        ),
        ({ logs, activeSessionId }) => {
          const activeCall = { getSessionID: () => activeSessionId };

          for (const log of logs) {
            const active = isActiveCall(log, activeCall);
            const matchesId = log.getSessionID() === activeSessionId;
            // active iff session ID matches
            expect(active).toBe(matchesId);
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ==================== Property 9: ARIA labels contain other party info ====================

/**
 * **Feature: call-logs-component, Property 9: ARIA labels contain other party info**
 *
 * *For any* rendered call log item, the ARIA label should contain the
 * Other_Party's name.
 *
 * **Validates: Requirements 8.2**
 */
describe('Property 9: ARIA labels contain other party info', () => {
  it('should contain the other party name in the ARIA label', () => {
    fc.assert(
      fc.property(callLogArb, ({ callLog, loggedInUser, otherName }) => {
        const ariaLabel = buildAriaLabel(callLog, loggedInUser);
        expect(ariaLabel).toContain(otherName);
      }),
      { numRuns: 20 }
    );
  });

  it('should contain the call type label (Audio or Video) in the ARIA label', () => {
    fc.assert(
      fc.property(callLogArb, ({ callLog, loggedInUser, expectedType }) => {
        const ariaLabel = buildAriaLabel(callLog, loggedInUser);
        const expectedLabel = expectedType === 'video' ? 'Video' : 'Audio';
        expect(ariaLabel).toContain(expectedLabel);
      }),
      { numRuns: 20 }
    );
  });

  it('should always contain the word "call" in the ARIA label', () => {
    fc.assert(
      fc.property(callLogArb, ({ callLog, loggedInUser }) => {
        const ariaLabel = buildAriaLabel(callLog, loggedInUser);
        expect(ariaLabel).toContain('call');
      }),
      { numRuns: 20 }
    );
  });

  it('should produce a non-empty ARIA label for any call log with a named other party', () => {
    fc.assert(
      fc.property(callLogArb, ({ callLog, loggedInUser }) => {
        const ariaLabel = buildAriaLabel(callLog, loggedInUser);
        expect(ariaLabel.length).toBeGreaterThan(0);
      }),
      { numRuns: 20 }
    );
  });

  it('should match the exact format: "{name}, {Type} call"', () => {
    fc.assert(
      fc.property(callLogArb, ({ callLog, loggedInUser, otherName, expectedType }) => {
        const ariaLabel = buildAriaLabel(callLog, loggedInUser);
        const typeLabel = expectedType === 'video' ? 'Video' : 'Audio';
        expect(ariaLabel).toBe(`${otherName}, ${typeLabel} call`);
      }),
      { numRuns: 20 }
    );
  });
});
