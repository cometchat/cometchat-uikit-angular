let callsSDK: any = null;
try {
  callsSDK = await import('@cometchat/calls-sdk-javascript');
  console.log(callsSDK)
} catch (e) {
  // Calls SDK is optional — not available in test/jsdom environments
}

export var CometChatUIKitCalls: any = callsSDK?.CometChatCalls;

/**
 * Test-only helper: inject a mock Calls SDK so property-based tests
 * can exercise OngoingCallService without loading the real SDK
 * (which depends on JitsiMeetJS / browser globals).
 *
 * Pass `null` to restore the original value.
 */
export function _setCallsSDKForTesting(mock: any): void {
  CometChatUIKitCalls = mock;
}
