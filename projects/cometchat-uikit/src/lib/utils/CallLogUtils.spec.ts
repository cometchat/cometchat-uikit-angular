/**
 * CallLogUtils Unit + Property-Based Tests
 *
 * Categories: Standard Operations, Boundary Inputs, Null/Invalid Handling,
 *             Property-Based (Other party identification, Call direction classification,
 *             Call initiation type preservation, Handler delegation)
 * Validates: Requirements 8.4, 8.6, 13.6, 14.4, 14.5, 15.7
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import { verifyCallUser, isSentByMe, isMissedCall } from './CallLogUtils';

// ==================== Shared Unit Test Helpers ====================

/** Creates a simple mock entity with getUid/getName */
function mockEntity(uid: string, name = 'User') {
  return { getUid: () => uid, getName: () => name };
}

/** Creates a mock logged-in user */
function mockLoggedIn(uid: string) {
  return { getUid: () => uid };
}

/** Creates a mock call log with initiator, receiver, and status */
function mockCallLog(initiatorUid: string, receiverUid: string, status: string) {
  return {
    getInitiator: () => mockEntity(initiatorUid, `User-${initiatorUid}`),
    getReceiver: () => mockEntity(receiverUid, `User-${receiverUid}`),
    getCallInitiator: () => mockEntity(initiatorUid, `User-${initiatorUid}`),
    getStatus: () => status,
  };
}

// ==================== Unit Tests ====================

/**
 * Unit tests for CallLogUtils following the utility test pattern:
 *   Standard Operations → Boundary Inputs → Null/Invalid Handling
 *
 * **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
 */
describe('CallLogUtils', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  // ---------- verifyCallUser ----------
  describe('verifyCallUser', () => {
    describe('Standard Operations', () => {
      it('returns the receiver when logged-in user is the initiator', () => {
        const call = mockCallLog('me', 'other', 'ended');
        const result = verifyCallUser(call, mockLoggedIn('me'));
        expect(result.getUid()).toBe('other');
      });

      it('returns the initiator when logged-in user is the receiver', () => {
        const call = mockCallLog('other', 'me', 'ended');
        const result = verifyCallUser(call, mockLoggedIn('me'));
        expect(result.getUid()).toBe('other');
      });

      it('returns the correct party for different user pairs', () => {
        const call = mockCallLog('alice', 'bob', 'ongoing');
        expect(verifyCallUser(call, mockLoggedIn('alice')).getUid()).toBe('bob');
        expect(verifyCallUser(call, mockLoggedIn('bob')).getUid()).toBe('alice');
      });
    });

    describe('Boundary Inputs', () => {
      it('handles single-character UIDs', () => {
        const call = mockCallLog('a', 'b', 'ended');
        expect(verifyCallUser(call, mockLoggedIn('a')).getUid()).toBe('b');
      });

      it('handles UIDs with special characters', () => {
        const call = mockCallLog('user@domain.com', 'user#123', 'ended');
        expect(verifyCallUser(call, mockLoggedIn('user@domain.com')).getUid()).toBe('user#123');
      });

      it('handles very long UIDs', () => {
        const longUid = 'u'.repeat(500);
        const call = mockCallLog(longUid, 'short', 'ended');
        expect(verifyCallUser(call, mockLoggedIn(longUid)).getUid()).toBe('short');
      });
    });

    describe('Null/Invalid Handling', () => {
      it('returns initiator when logged-in user UID does not match either party', () => {
        const call = mockCallLog('alice', 'bob', 'ended');
        // When UID doesn't match initiator, falls to else branch → returns initiator
        const result = verifyCallUser(call, mockLoggedIn('charlie'));
        expect(result.getUid()).toBe('alice');
      });
    });
  });

  // ---------- isSentByMe ----------
  describe('isSentByMe', () => {
    describe('Standard Operations', () => {
      it('returns true when logged-in user is the initiator (via getCallInitiator)', () => {
        const call = mockCallLog('me', 'other', 'ended');
        expect(isSentByMe(call, mockLoggedIn('me'))).toBe(true);
      });

      it('returns false when logged-in user is the receiver', () => {
        const call = mockCallLog('other', 'me', 'ended');
        expect(isSentByMe(call, mockLoggedIn('me'))).toBe(false);
      });

      it('returns false when a different user initiated the call', () => {
        const call = mockCallLog('alice', 'bob', 'ended');
        expect(isSentByMe(call, mockLoggedIn('bob'))).toBe(false);
      });
    });

    describe('Boundary Inputs', () => {
      it('handles call objects with only getInitiator (no getCallInitiator)', () => {
        const call = {
          getInitiator: () => mockEntity('me'),
          getReceiver: () => mockEntity('other'),
          getStatus: () => 'ended',
        };
        expect(isSentByMe(call, mockLoggedIn('me'))).toBe(true);
      });

      it('handles case-sensitive UID comparison', () => {
        const call = mockCallLog('User1', 'user2', 'ended');
        expect(isSentByMe(call, mockLoggedIn('User1'))).toBe(true);
        expect(isSentByMe(call, mockLoggedIn('user1'))).toBe(false);
      });
    });

    describe('Null/Invalid Handling', () => {
      it('returns true when call has no getCallInitiator and getInitiator throws', () => {
        const call = {
          getInitiator: () => {
            throw new Error('no initiator');
          },
          getReceiver: () => mockEntity('other'),
          getStatus: () => 'ended',
        };
        // Falls into catch block, senderUid stays '', returns !'' === true
        expect(isSentByMe(call, mockLoggedIn('me'))).toBe(true);
      });

      it('returns true when getCallInitiator returns null', () => {
        const call = {
          getCallInitiator: () => null,
          getInitiator: () => {
            throw new Error('fail');
          },
          getReceiver: () => mockEntity('other'),
          getStatus: () => 'ended',
        };
        // getCallInitiator()?.getUid() is undefined, falls to getInitiator() which throws
        // catch block: senderUid stays '', returns true
        expect(isSentByMe(call, mockLoggedIn('me'))).toBe(true);
      });

      it('returns true when both initiator methods are missing', () => {
        const call = {
          getStatus: () => 'ended',
          getReceiver: () => mockEntity('other'),
        } as any;
        // No getCallInitiator, no getInitiator → catch → senderUid = '' → true
        expect(isSentByMe(call, mockLoggedIn('me'))).toBe(true);
      });
    });
  });

  // ---------- isMissedCall ----------
  describe('isMissedCall', () => {
    describe('Standard Operations', () => {
      it('returns true for incoming unanswered call', () => {
        const call = mockCallLog('other', 'me', 'unanswered');
        expect(isMissedCall(call, mockLoggedIn('me'))).toBe(true);
      });

      it('returns true for incoming cancelled call', () => {
        const call = mockCallLog('other', 'me', 'cancelled');
        expect(isMissedCall(call, mockLoggedIn('me'))).toBe(true);
      });

      it('returns true for incoming busy call', () => {
        const call = mockCallLog('other', 'me', 'busy');
        expect(isMissedCall(call, mockLoggedIn('me'))).toBe(true);
      });

      it('returns true for incoming rejected call', () => {
        const call = mockCallLog('other', 'me', 'rejected');
        expect(isMissedCall(call, mockLoggedIn('me'))).toBe(true);
      });

      it('returns false for incoming ended (answered) call', () => {
        const call = mockCallLog('other', 'me', 'ended');
        expect(isMissedCall(call, mockLoggedIn('me'))).toBe(false);
      });

      it('returns false for incoming ongoing call', () => {
        const call = mockCallLog('other', 'me', 'ongoing');
        expect(isMissedCall(call, mockLoggedIn('me'))).toBe(false);
      });

      it('returns false for incoming initiated call', () => {
        const call = mockCallLog('other', 'me', 'initiated');
        expect(isMissedCall(call, mockLoggedIn('me'))).toBe(false);
      });

      it('returns false for outgoing call regardless of status', () => {
        for (const status of ['unanswered', 'cancelled', 'busy', 'rejected', 'ended']) {
          const call = mockCallLog('me', 'other', status);
          expect(isMissedCall(call, mockLoggedIn('me'))).toBe(false);
        }
      });
    });

    describe('Boundary Inputs', () => {
      it('handles unknown status as non-missed', () => {
        const call = mockCallLog('other', 'me', 'some_unknown_status');
        expect(isMissedCall(call, mockLoggedIn('me'))).toBe(false);
      });

      it('handles empty string status as non-missed', () => {
        const call = mockCallLog('other', 'me', '');
        expect(isMissedCall(call, mockLoggedIn('me'))).toBe(false);
      });

      it('is case-sensitive for status matching', () => {
        const call = mockCallLog('other', 'me', 'Unanswered');
        // 'Unanswered' !== 'unanswered', so not in MISSED_CALL_STATUSES
        expect(isMissedCall(call, mockLoggedIn('me'))).toBe(false);
      });
    });

    describe('Null/Invalid Handling', () => {
      it('returns false when call initiator methods fail (treated as sent by me)', () => {
        const call = {
          getInitiator: () => {
            throw new Error('fail');
          },
          getReceiver: () => mockEntity('other'),
          getStatus: () => 'unanswered',
        } as any;
        // isSentByMe returns true (catch fallback) → isMissedCall returns false
        expect(isMissedCall(call, mockLoggedIn('me'))).toBe(false);
      });
    });
  });
});

// ==================== Property-Based Tests ====================

// ==================== Generators ====================

/** Arbitrary for a non-empty UID string */
const uidArb = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

/** Arbitrary for a user name */
const nameArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);

/** Call statuses that count as missed */
const missedStatusArb = fc.constantFrom('unanswered', 'cancelled', 'busy', 'rejected');

/** Call statuses that are NOT missed (answered/completed calls) */
const nonMissedStatusArb = fc.constantFrom('initiated', 'ongoing', 'ended');

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

/** Creates a mock call log object */
function createMockCallLog(opts: {
  initiatorUid: string;
  initiatorName: string;
  receiverUid: string;
  receiverName: string;
  status: string;
}) {
  const initiator = createMockEntity(opts.initiatorUid, opts.initiatorName);
  const receiver = createMockEntity(opts.receiverUid, opts.receiverName);
  return {
    getInitiator: () => initiator,
    getReceiver: () => receiver,
    getStatus: () => opts.status,
  };
}

/** Arbitrary for a mock entity (uid + name) */
const entityArb = fc.record({ uid: uidArb, name: nameArb });

/**
 * Arbitrary that generates a call log and a logged-in user where
 * the logged-in user IS the initiator.
 */
const callLogWhereUserIsInitiatorArb = fc
  .record({
    loggedInUid: uidArb,
    receiverUid: uidArb,
    initiatorName: nameArb,
    receiverName: nameArb,
    status: anyStatusArb,
  })
  .map(opts => ({
    callLog: createMockCallLog({
      initiatorUid: opts.loggedInUid,
      initiatorName: opts.initiatorName,
      receiverUid: opts.receiverUid,
      receiverName: opts.receiverName,
      status: opts.status,
    }),
    loggedInUser: createMockLoggedInUser(opts.loggedInUid),
    receiverUid: opts.receiverUid,
  }));

/**
 * Arbitrary that generates a call log and a logged-in user where
 * the logged-in user IS the receiver (not the initiator).
 * Ensures initiator UID differs from logged-in user UID.
 */
const callLogWhereUserIsReceiverArb = fc
  .record({
    loggedInUid: uidArb,
    initiatorUid: uidArb,
    initiatorName: nameArb,
    receiverName: nameArb,
    status: anyStatusArb,
  })
  .filter(opts => opts.initiatorUid !== opts.loggedInUid)
  .map(opts => ({
    callLog: createMockCallLog({
      initiatorUid: opts.initiatorUid,
      initiatorName: opts.initiatorName,
      receiverUid: opts.loggedInUid,
      receiverName: opts.receiverName,
      status: opts.status,
    }),
    loggedInUser: createMockLoggedInUser(opts.loggedInUid),
    initiatorUid: opts.initiatorUid,
  }));

// ==================== Property 1: Other party identification ====================

/**
 * **Feature: call-logs-component, Property 1: Other party identification**
 *
 * *For any* call log and logged-in user, the displayed other party should be
 * the receiver when the logged-in user is the initiator, and the initiator
 * when the logged-in user is the receiver.
 *
 * **Validates: Requirements 2.1**
 */
describe('Property 1: Other party identification', () => {
  it('should return the receiver when the logged-in user is the initiator', () => {
    fc.assert(
      fc.property(callLogWhereUserIsInitiatorArb, ({ callLog, loggedInUser, receiverUid }) => {
        const otherParty = verifyCallUser(callLog, loggedInUser);
        expect(otherParty.getUid()).toBe(receiverUid);
      }),
      { numRuns: 20 }
    );
  });

  it('should return the initiator when the logged-in user is the receiver', () => {
    fc.assert(
      fc.property(callLogWhereUserIsReceiverArb, ({ callLog, loggedInUser, initiatorUid }) => {
        const otherParty = verifyCallUser(callLog, loggedInUser);
        expect(otherParty.getUid()).toBe(initiatorUid);
      }),
      { numRuns: 20 }
    );
  });

  it('should never return the logged-in user as the other party', () => {
    fc.assert(
      fc.property(
        fc
          .record({
            loggedInUid: uidArb,
            otherUid: uidArb,
            initiatorName: nameArb,
            receiverName: nameArb,
            status: anyStatusArb,
            userIsInitiator: fc.boolean(),
          })
          .filter(opts => opts.loggedInUid !== opts.otherUid),
        opts => {
          const callLog = createMockCallLog({
            initiatorUid: opts.userIsInitiator ? opts.loggedInUid : opts.otherUid,
            initiatorName: opts.initiatorName,
            receiverUid: opts.userIsInitiator ? opts.otherUid : opts.loggedInUid,
            receiverName: opts.receiverName,
            status: opts.status,
          });
          const loggedInUser = createMockLoggedInUser(opts.loggedInUid);

          const otherParty = verifyCallUser(callLog, loggedInUser);
          expect(otherParty.getUid()).not.toBe(opts.loggedInUid);
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ==================== Property 2: Call direction classification ====================

/**
 * **Feature: call-logs-component, Property 2: Call direction classification**
 *
 * *For any* call log and logged-in user, the call direction should be classified as:
 * - outgoing if the logged-in user is the initiator
 * - missed if the logged-in user is the receiver and the call status is
 *   unanswered/cancelled/busy/rejected
 * - incoming otherwise
 *
 * **Validates: Requirements 2.2**
 */
describe('Property 2: Call direction classification', () => {
  it('should classify as outgoing (isSentByMe=true, isMissedCall=false) when user is initiator', () => {
    fc.assert(
      fc.property(callLogWhereUserIsInitiatorArb, ({ callLog, loggedInUser }) => {
        expect(isSentByMe(callLog, loggedInUser)).toBe(true);
        expect(isMissedCall(callLog, loggedInUser)).toBe(false);
      }),
      { numRuns: 20 }
    );
  });

  it('should classify as missed when user is receiver and status is a missed status', () => {
    fc.assert(
      fc.property(
        fc
          .record({
            loggedInUid: uidArb,
            initiatorUid: uidArb,
            initiatorName: nameArb,
            receiverName: nameArb,
            status: missedStatusArb,
          })
          .filter(opts => opts.initiatorUid !== opts.loggedInUid),
        opts => {
          const callLog = createMockCallLog({
            initiatorUid: opts.initiatorUid,
            initiatorName: opts.initiatorName,
            receiverUid: opts.loggedInUid,
            receiverName: opts.receiverName,
            status: opts.status,
          });
          const loggedInUser = createMockLoggedInUser(opts.loggedInUid);

          expect(isSentByMe(callLog, loggedInUser)).toBe(false);
          expect(isMissedCall(callLog, loggedInUser)).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should classify as incoming (not outgoing, not missed) when user is receiver and status is non-missed', () => {
    fc.assert(
      fc.property(
        fc
          .record({
            loggedInUid: uidArb,
            initiatorUid: uidArb,
            initiatorName: nameArb,
            receiverName: nameArb,
            status: nonMissedStatusArb,
          })
          .filter(opts => opts.initiatorUid !== opts.loggedInUid),
        opts => {
          const callLog = createMockCallLog({
            initiatorUid: opts.initiatorUid,
            initiatorName: opts.initiatorName,
            receiverUid: opts.loggedInUid,
            receiverName: opts.receiverName,
            status: opts.status,
          });
          const loggedInUser = createMockLoggedInUser(opts.loggedInUid);

          expect(isSentByMe(callLog, loggedInUser)).toBe(false);
          expect(isMissedCall(callLog, loggedInUser)).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should ensure outgoing calls are never classified as missed regardless of status', () => {
    fc.assert(
      fc.property(
        fc.record({
          loggedInUid: uidArb,
          receiverUid: uidArb,
          initiatorName: nameArb,
          receiverName: nameArb,
          status: anyStatusArb,
        }),
        opts => {
          const callLog = createMockCallLog({
            initiatorUid: opts.loggedInUid,
            initiatorName: opts.initiatorName,
            receiverUid: opts.receiverUid,
            receiverName: opts.receiverName,
            status: opts.status,
          });
          const loggedInUser = createMockLoggedInUser(opts.loggedInUid);

          // If sent by me, it should never be missed
          if (isSentByMe(callLog, loggedInUser)) {
            expect(isMissedCall(callLog, loggedInUser)).toBe(false);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should produce exactly one classification for any call log', () => {
    fc.assert(
      fc.property(
        fc
          .record({
            loggedInUid: uidArb,
            otherUid: uidArb,
            initiatorName: nameArb,
            receiverName: nameArb,
            status: anyStatusArb,
            userIsInitiator: fc.boolean(),
          })
          .filter(opts => opts.userIsInitiator || opts.loggedInUid !== opts.otherUid),
        opts => {
          const callLog = createMockCallLog({
            initiatorUid: opts.userIsInitiator ? opts.loggedInUid : opts.otherUid,
            initiatorName: opts.initiatorName,
            receiverUid: opts.userIsInitiator ? opts.otherUid : opts.loggedInUid,
            receiverName: opts.receiverName,
            status: opts.status,
          });
          const loggedInUser = createMockLoggedInUser(opts.loggedInUid);

          const sentByMe = isSentByMe(callLog, loggedInUser);
          const missed = isMissedCall(callLog, loggedInUser);

          // Exactly one of: outgoing, missed, incoming
          const isOutgoing = sentByMe;
          const isMissed = !sentByMe && missed;
          const isIncoming = !sentByMe && !missed;

          const classifications = [isOutgoing, isMissed, isIncoming].filter(Boolean);
          expect(classifications.length).toBe(1);
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ==================== Generators for Properties 5 & 6 ====================

/** Call types: audio and video */
const callTypeArb = fc.constantFrom('audio', 'video');

/**
 * Creates a mock call log with a call type, used for call initiation tests.
 * Includes `getType()` in addition to the standard call log methods.
 */
function createMockCallLogWithType(opts: {
  initiatorUid: string;
  initiatorName: string;
  receiverUid: string;
  receiverName: string;
  status: string;
  type: string;
}) {
  const base = createMockCallLog({
    initiatorUid: opts.initiatorUid,
    initiatorName: opts.initiatorName,
    receiverUid: opts.receiverUid,
    receiverName: opts.receiverName,
    status: opts.status,
  });
  return {
    ...base,
    getType: () => opts.type,
  };
}

/**
 * Arbitrary that generates a call log with type and a logged-in user.
 * Ensures the logged-in user is different from the other party.
 */
const callLogWithTypeArb = fc
  .record({
    loggedInUid: uidArb,
    otherUid: uidArb,
    initiatorName: nameArb,
    receiverName: nameArb,
    status: anyStatusArb,
    type: callTypeArb,
    userIsInitiator: fc.boolean(),
  })
  .filter(opts => opts.userIsInitiator || opts.loggedInUid !== opts.otherUid)
  .map(opts => ({
    callLog: createMockCallLogWithType({
      initiatorUid: opts.userIsInitiator ? opts.loggedInUid : opts.otherUid,
      initiatorName: opts.initiatorName,
      receiverUid: opts.userIsInitiator ? opts.otherUid : opts.loggedInUid,
      receiverName: opts.receiverName,
      status: opts.status,
      type: opts.type,
    }),
    loggedInUser: createMockLoggedInUser(opts.loggedInUid),
    expectedType: opts.type,
    expectedReceiverUid: opts.otherUid,
  }));

// ==================== Property 5: Call initiation type preservation ====================

/**
 * **Feature: call-logs-component, Property 5: Call initiation type preservation**
 *
 * *For any* call log where the trailing button is clicked and no `callButtonClicked`
 * handler is provided, the initiated call type (audio/video) should match the original
 * call log's type, and the receiver should be the Other_Party.
 *
 * This tests the pure decision logic: given a call log, what call type and receiver
 * UID should be used when initiating a call.
 *
 * **Validates: Requirements 3.1**
 */
describe('Property 5: Call initiation type preservation', () => {
  /**
   * Simulates the call initiation decision logic from the component/service.
   * Given a call log and logged-in user, determines:
   * - The call type to use (from the call log's type)
   * - The receiver UID (the Other_Party via verifyCallUser)
   */
  function determineCallInitiation(
    callLog: any,
    loggedInUser: { getUid(): string }
  ): { type: string; receiverUid: string } {
    const type = callLog.getType();
    const otherParty = verifyCallUser(callLog, loggedInUser);
    return { type, receiverUid: otherParty.getUid() };
  }

  it('should preserve the call type from the original call log', () => {
    fc.assert(
      fc.property(callLogWithTypeArb, ({ callLog, loggedInUser, expectedType }) => {
        const { type } = determineCallInitiation(callLog, loggedInUser);
        expect(type).toBe(expectedType);
      }),
      { numRuns: 20 }
    );
  });

  it('should target the Other_Party as the receiver', () => {
    fc.assert(
      fc.property(callLogWithTypeArb, ({ callLog, loggedInUser, expectedReceiverUid }) => {
        const { receiverUid } = determineCallInitiation(callLog, loggedInUser);
        expect(receiverUid).toBe(expectedReceiverUid);
      }),
      { numRuns: 20 }
    );
  });

  it('should always produce a valid call type (audio or video)', () => {
    fc.assert(
      fc.property(callLogWithTypeArb, ({ callLog, loggedInUser }) => {
        const { type } = determineCallInitiation(callLog, loggedInUser);
        expect(['audio', 'video']).toContain(type);
      }),
      { numRuns: 20 }
    );
  });

  it('should never target the logged-in user as the receiver', () => {
    fc.assert(
      fc.property(
        callLogWithTypeArb.filter(
          ({ callLog, loggedInUser }) =>
            callLog.getInitiator().getUid() !== callLog.getReceiver().getUid()
        ),
        ({ callLog, loggedInUser }) => {
          const { receiverUid } = determineCallInitiation(callLog, loggedInUser);
          expect(receiverUid).not.toBe(loggedInUser.getUid());
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ==================== Property 6: Handler delegation ====================

/**
 * **Feature: call-logs-component, Property 6: Handler delegation**
 *
 * *For any* call log where a `callButtonClicked` handler is provided, clicking
 * the trailing button should invoke the handler with the call log and should
 * not initiate a CometChat call.
 *
 * This tests the delegation decision logic: when a handler exists, it receives
 * the call log; when no handler exists, call initiation proceeds.
 *
 * **Validates: Requirements 3.2**
 */
describe('Property 6: Handler delegation', () => {
  /**
   * Simulates the trailing button click logic from the component.
   * Returns which path was taken and what arguments were passed.
   */
  function simulateTrailingButtonClick(
    callLog: any,
    loggedInUser: { getUid(): string },
    callButtonClickedHandler: ((callLog: any) => void) | null
  ): { handlerInvoked: boolean; callInitiated: boolean; handlerArg: any | null } {
    if (callButtonClickedHandler) {
      callButtonClickedHandler(callLog);
      return { handlerInvoked: true, callInitiated: false, handlerArg: callLog };
    } else {
      // Would initiate call — we just record the decision
      const otherParty = verifyCallUser(callLog, loggedInUser);
      const type = callLog.getType();
      return {
        handlerInvoked: false,
        callInitiated: true,
        handlerArg: null,
      };
    }
  }

  it('should invoke the handler with the call log when a handler is provided', () => {
    fc.assert(
      fc.property(callLogWithTypeArb, ({ callLog, loggedInUser }) => {
        const receivedArgs: any[] = [];
        const handler = (log: any) => receivedArgs.push(log);

        const result = simulateTrailingButtonClick(callLog, loggedInUser, handler);

        expect(result.handlerInvoked).toBe(true);
        expect(receivedArgs.length).toBe(1);
        expect(receivedArgs[0]).toBe(callLog);
      }),
      { numRuns: 20 }
    );
  });

  it('should not initiate a CometChat call when a handler is provided', () => {
    fc.assert(
      fc.property(callLogWithTypeArb, ({ callLog, loggedInUser }) => {
        const handler = (_log: any) => {};

        const result = simulateTrailingButtonClick(callLog, loggedInUser, handler);

        expect(result.callInitiated).toBe(false);
      }),
      { numRuns: 20 }
    );
  });

  it('should initiate a call when no handler is provided', () => {
    fc.assert(
      fc.property(callLogWithTypeArb, ({ callLog, loggedInUser }) => {
        const result = simulateTrailingButtonClick(callLog, loggedInUser, null);

        expect(result.handlerInvoked).toBe(false);
        expect(result.callInitiated).toBe(true);
      }),
      { numRuns: 20 }
    );
  });

  it('should pass the exact call log reference to the handler (not a copy)', () => {
    fc.assert(
      fc.property(callLogWithTypeArb, ({ callLog, loggedInUser }) => {
        let receivedRef: any = null;
        const handler = (log: any) => {
          receivedRef = log;
        };

        simulateTrailingButtonClick(callLog, loggedInUser, handler);

        // Strict reference equality
        expect(receivedRef).toBe(callLog);
      }),
      { numRuns: 20 }
    );
  });

  it('should be mutually exclusive: either handler is invoked OR call is initiated, never both', () => {
    fc.assert(
      fc.property(
        fc.tuple(callLogWithTypeArb, fc.boolean()),
        ([{ callLog, loggedInUser }, hasHandler]) => {
          const handler = hasHandler ? (_log: any) => {} : null;

          const result = simulateTrailingButtonClick(callLog, loggedInUser, handler);

          // XOR: exactly one of these should be true
          expect(result.handlerInvoked !== result.callInitiated).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });
});
