/**
 * Call Log Utility Functions
 *
 * Pure utility functions for call log processing. These are standalone
 * functions (not tied to Angular DI) so they can be tested independently
 * and reused across components and services.
 *
 * Ported from React UIKit: `src/components/Calling/Utils/utils.ts`
 *

 */

/** Missed call statuses — incoming calls with these statuses are classified as missed */
const MISSED_CALL_STATUSES = ['unanswered', 'cancelled', 'busy', 'rejected'];

/**
 * Minimal interface for call log / call objects used by utility functions.
 * Covers both CometChat.Call and CallLog objects from the Calls SDK.
 */
interface CallLogLike {
  getStatus(): string;
  getInitiator(): { getUid(): string };
  getReceiver(): { getUid(): string; getName?(): string };
  getCallInitiator?(): { getUid(): string } | null;
}

/**
 * Determines if the call was initiated by the logged-in user.
 *
 * Checks the call initiator's UID against the logged-in user's UID.
 * Falls back to `getCallInitiator()` first (for CometChat.Call objects),
 * then `getInitiator()` (for CallLog objects from the Calls SDK).
 *
 * @param call - A call log or call object with `getInitiator()` / `getCallInitiator()`
 * @param loggedInUser - The currently logged-in CometChat user
 * @returns `true` if the logged-in user initiated the call
 *
 * @see Requirement 2.2 — Call direction classification
 */
export function isSentByMe(call: CallLogLike, loggedInUser: { getUid(): string }): boolean {
  let senderUid = '';
  try {
    senderUid =
      (call.getCallInitiator && call.getCallInitiator()?.getUid()) ||
      call?.getInitiator()?.getUid();
  } catch {
    // Fallback: if neither method works, treat as sent by me
  }
  return !senderUid || senderUid === loggedInUser.getUid();
}

/**
 * Determines if the call was a missed call for the logged-in user.
 *
 * A call is missed when:
 * 1. The logged-in user did NOT initiate the call (it's incoming), AND
 * 2. The call status is one of: unanswered, cancelled, busy, rejected
 *
 * @param call - A call log or call object with `getStatus()` and `getInitiator()`
 * @param loggedInUser - The currently logged-in CometChat user
 * @returns `true` if the call was missed by the logged-in user
 *
 * @see Requirement 2.2 — Call direction classification
 */
export function isMissedCall(call: CallLogLike, loggedInUser: { getUid(): string }): boolean {
  const sentByMe = isSentByMe(call, loggedInUser);
  if (sentByMe) {
    return false;
  }
  const callStatus: string = call.getStatus();
  return MISSED_CALL_STATUSES.includes(callStatus);
}

/**
 * Returns the other party in a call relative to the logged-in user.
 *
 * - If the logged-in user is the initiator → returns the receiver
 * - If the logged-in user is the receiver → returns the initiator
 *
 * @param call - A call log object with `getInitiator()` and `getReceiver()`
 * @param loggedInUser - The currently logged-in CometChat user
 * @returns The other party object (user entity with `getUid()`, `getName()`, etc.)
 *
 * @see Requirement 2.1 — Other party identification
 */
export function verifyCallUser(call: CallLogLike, loggedInUser: { getUid(): string }): { getUid(): string; getName?(): string } {
  if (call.getInitiator().getUid() === loggedInUser.getUid()) {
    return call.getReceiver();
  } else {
    return call.getInitiator();
  }
}
