// Calls SDK is optional. We load it lazily on first access so that:
// 1. Apps that don't use calling features don't pay the bundle cost.
// 2. The module works in environments (jsdom, Angular 17-19) that don't
//    support top-level await in esbuild's browser target configuration.

// Stores the resolved CometChatCalls class (not the raw module namespace)
let _callsSDK: any = null;
let _loaded = false;
let _loadPromise: Promise<any> | null = null;

async function loadCallsSDK(): Promise<any> {
  if (_loaded) {
    return _callsSDK;
  }
  // Return the in-flight promise if already loading — prevents concurrent
  // callers from racing and getting null before the first import resolves
  if (_loadPromise) {
    return _loadPromise;
  }
  _loadPromise = (async () => {
    try {
      const mod = await import('@cometchat/calls-sdk-javascript');
      // esbuild wraps UMD modules: named exports may be on the namespace
      // directly or nested under .default depending on bundler version
      _callsSDK = mod?.CometChatCalls ?? mod?.default?.CometChatCalls ?? null;
    } catch (e) {
      // Calls SDK is optional — not available in test/jsdom environments
      _callsSDK = null;
    }
    _loaded = true;
    _loadPromise = null;
    return _callsSDK;
  })();
  return _loadPromise;
}

// Synchronous accessor — returns null until loadCallsSDK() has resolved.
// Components that need the calls SDK should call getCometChatCalls() first.
export var CometChatUIKitCalls: any = null;

// Kick off the load immediately (non-blocking) so it's ready as soon as
// possible, but without using top-level await.
loadCallsSDK().then((CometChatCalls) => {
  CometChatUIKitCalls = CometChatCalls;
});

/**
 * Returns a promise that resolves to the CometChatCalls class once the
 * SDK has loaded, or null if the SDK is not available.
 */
export async function getCometChatCalls(): Promise<any> {
  if (!CometChatUIKitCalls) {
    // Kick off the load immediately (non-blocking) so it's ready as soon as
    // possible, but without using top-level await.
    loadCallsSDK().then((CometChatCalls) => {
      CometChatUIKitCalls = CometChatCalls;
    });
  }
  return loadCallsSDK();
}

/**
 * Test-only helper: inject a mock Calls SDK so property-based tests
 * can exercise OngoingCallService without loading the real SDK
 * (which depends on JitsiMeetJS / browser globals).
 *
 * Pass `null` to restore the original value.
 */
export function _setCallsSDKForTesting(mock: any): void {
  _loaded = true;
  _callsSDK = mock;
  CometChatUIKitCalls = mock;
}
