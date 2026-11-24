/**
 * The one place the kit asks the Chat SDK whether offline support is on.
 *
 * Every offline-dependent decision reads {@link isOfflineOn} once, at the moment
 * of the decision (one fetch, one send, one reconnect event, one Retry tap), and
 * passes the answer down that operation. Nothing caches it: the SDK can switch
 * offline off mid-session (kill switch) or on at the next login, and the next
 * operation must see the new value.
 *
 * The peer dependency stays `^4.2.0`, and SDKs before the offline release have
 * none of these symbols, so every offline SDK member is reached through
 * {@link offlineSdk} and feature-detected with {@link hasSdkFunction}. On an SDK
 * without them `isOfflineOn()` answers `false` and the kit runs today's code.
 *
 * @internal
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Untyped view of the SDK's static surface. The kit's public declarations must
 * not name an SDK-4.3-only type, so offline members are reached through this
 * accessor instead of typed references.
 *
 * @internal
 */
export function offlineSdk(): any {
  return CometChat as any;
}

/** Whether the installed SDK has a static function called `name`. @internal */
export function hasSdkFunction(name: string): boolean {
  try {
    return typeof offlineSdk()?.[name] === 'function';
  } catch {
    return false;
  }
}

/**
 * Whether the installed SDK is one the kit runs offline on: Chat SDK 4.3.1 or
 * later. Published 4.3.0 already has `isOfflineEnabled` and the rest of the
 * offline surface, but not the 4.3.1 fixes the kit relies on, so the floor also
 * needs `OfflineCacheResetReason.SCHEMA_RESET`, which first ships in 4.3.1. On
 * an older SDK the kit runs online only, as with 4.2.x.
 *
 * @internal
 */
export function hasOfflineSdk(): boolean {
  try {
    const sdk = offlineSdk();
    return (
      typeof sdk?.isOfflineEnabled === 'function' &&
      sdk?.OfflineCacheResetReason?.SCHEMA_RESET === 'SCHEMA_RESET'
    );
  } catch {
    return false;
  }
}

/**
 * `CometChat.isOfflineEnabled()`; `false` when the SDK is older than the
 * offline floor ({@link hasOfflineSdk}) or the call throws.
 *
 * @internal
 */
export function isOfflineOn(): boolean {
  try {
    if (!hasOfflineSdk()) return false;
    return offlineSdk().isOfflineEnabled() === true;
  } catch {
    return false;
  }
}

/**
 * Whether the SDK's realtime connection is up right now; `false` when the SDK
 * cannot say. Read at the decision, like the gate, and only on the offline path.
 *
 * @internal
 */
export function sdkConnected(): boolean {
  try {
    const sdk = offlineSdk();
    if (typeof sdk?.getConnectionStatus !== 'function') return false;
    return sdk.getConnectionStatus() === (sdk.CONNECTION_STATUS?.CONNECTED ?? 'connected');
  } catch {
    return false;
  }
}

/**
 * A callback handed to one of the SDK's listener classes. The SDK calls it with
 * whatever arguments that callback carries, so the kit's handlers each declare
 * their own parameters.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OfflineCallback = (...args: any[]) => unknown;
