/**
 * Test double for the Chat SDK's offline surface (SDK 4.3+), installed on top
 * of the real SDK package the suite runs against (4.2.x, which has none of it).
 *
 * It patches the static members the kit feature-detects, records every call,
 * captures the listeners the kit registers so a test can fire outbox, sync and
 * cache-reset events, and restores the SDK exactly on `restore()`.
 *
 * @module testing/offline-sdk-fake
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';

export interface OfflineSdkFakeOptions {
  /** What `isOfflineEnabled()` answers; change it later with `setEnabled`. */
  enabled?: boolean;
  /** Leave these statics absent, to model a partial SDK. */
  omit?: string[];
  /** Remove every offline static: an SDK before offline support (4.2.x), whatever is installed. */
  bare?: boolean;
}

export interface OfflineSdkFake {
  calls: { name: string; args: unknown[] }[];
  listeners: Record<string, Record<string, any>>;
  setEnabled(enabled: boolean): void;
  /** Make the next `send*` call run this script with the per-send listener. */
  scriptSend(script: (listener: any, message: any) => void): void;
  /** Answer to the next `discardLocalMessage` / `retryMessage`. */
  discardResult: 'ok' | 'reject';
  /** What `getConnectionStatus()` reports: `true` = connected (the default). */
  connected: boolean;
  /** `getCachedMediaObjectURL` answers by remote URL; a URL not in the map has no cached copy. */
  cachedMedia: Map<string, string>;
  /** What `getMediaCachingMode()` reports. */
  mediaCachingMode: 'AUTO' | 'OFF';
  /** What `getExistingUploadFileRequest` resolves with (a restored batch, or null). */
  existingUpload: unknown;
  /** Scripts for the next two-phase `getMessageDetails` / `getConversation` listener reads. */
  singleReads: ((listener: any) => void)[];
  restore(): void;
  /** Fire a callback on every listener of one kind, e.g. ('offline', 'onOutboxMessageSent', m). */
  fire(
    kind: 'offline' | 'sync' | 'cacheReset' | 'media' | 'message' | 'login',
    method: string,
    ...args: unknown[]
  ): void;
  callsTo(name: string): unknown[][];
}

const PATCHED = [
  'isOfflineEnabled',
  'addOfflineMessageListener',
  'removeOfflineMessageListener',
  'addSyncListener',
  'removeSyncListener',
  'addOfflineCacheResetListener',
  'addMediaDownloadListener',
  'retryMessage',
  'discardLocalMessage',
  'getPendingMessages',
  'sendMessage',
  'sendMediaMessage',
  'sendCustomMessage',
  'sendInteractiveMessage',
  'addMessageListener',
  'addLoginListener',
  'markConversationAsRead',
  'MessageSentListener',
  'OfflineMessageListener',
  'SyncListener',
  'OfflineCacheResetListener',
  'MediaDownloadListener',
  'MessageFetchListener',
  'ConversationFetchListener',
  'getConnectionStatus',
  'getCachedMediaObjectURL',
  'getMediaCachingMode',
  'getExistingUploadFileRequest',
  'UserFetchListener',
  'GroupFetchListener',
  'GroupMemberFetchListener',
  'BannedMemberFetchListener',
  'ReactionFetchListener',
  'NotificationFeedFetchListener',
  'ThreadFetchListener',
  'downloadMedia',
  'MediaCallbackListener',
  'ConversationDetailsListener',
  'MessageDetailsListener',
  'getConversation',
  'getMessageDetails',
  'OfflineCacheResetReason',
];

/** A real SDK message with the offline getters the 4.3 SDK adds. */
export function offlineMessage<T extends CometChat.BaseMessage>(
  message: T,
  state: {
    id?: number;
    localMessageId?: string;
    status?: string;
    source?: string;
    failureReason?: string;
    muid?: string;
    sentAt?: number;
    updatedAt?: number;
  } = {}
): T {
  const m: any = message;
  let status = state.status;
  if (state.id !== undefined) m.setId(state.id);
  if (state.muid !== undefined) m.setMuid(state.muid);
  if (state.sentAt !== undefined) m.setSentAt(state.sentAt);
  if (state.updatedAt !== undefined) m.getUpdatedAt = () => state.updatedAt;
  m.getLocalMessageId = () => state.localMessageId ?? '';
  m.getStatus = () => status ?? '';
  m.setStatus = (value: string) => {
    status = value;
  };
  m.getSource = () => state.source ?? '';
  m.getFailureReason = () => state.failureReason ?? '';
  return message;
}

export function textMessage(
  text: string,
  receiverId = 'peer',
  receiverType = 'user'
): CometChat.TextMessage {
  return new CometChat.TextMessage(receiverId, text, receiverType);
}

export function installOfflineSdk(options: OfflineSdkFakeOptions = {}): OfflineSdkFake {
  const sdk = CometChat as any;
  const saved = new Map<string, PropertyDescriptor | undefined>();
  for (const name of PATCHED) saved.set(name, Object.getOwnPropertyDescriptor(sdk, name));
  let enabled = options.enabled ?? true;
  const omit = new Set(
    options.bare
      ? PATCHED.filter(
          n =>
            ![
              'sendMessage',
              'sendMediaMessage',
              'sendCustomMessage',
              'sendInteractiveMessage',
              'addMessageListener',
              'addLoginListener',
              'markConversationAsRead',
              'getPendingMessages',
              'getConnectionStatus',
            ].includes(n)
        )
      : (options.omit ?? [])
  );
  const scripts: ((listener: any, message: any) => void)[] = [];
  const fake: OfflineSdkFake = {
    calls: [],
    listeners: { offline: {}, sync: {}, cacheReset: {}, media: {}, message: {}, login: {} },
    discardResult: 'ok',
    connected: true,
    cachedMedia: new Map(),
    mediaCachingMode: 'AUTO',
    existingUpload: null,
    singleReads: [],
    setEnabled(value) {
      enabled = value;
    },
    scriptSend(script) {
      scripts.push(script);
    },
    restore() {
      for (const [name, descriptor] of saved) {
        if (descriptor) Object.defineProperty(sdk, name, descriptor);
        else delete sdk[name];
      }
    },
    fire(kind, method, ...args) {
      for (const listener of Object.values(fake.listeners[kind])) listener?.[method]?.(...args);
    },
    callsTo(name) {
      return fake.calls.filter(c => c.name === name).map(c => c.args);
    },
  };
  const record = (name: string, args: unknown[]) => fake.calls.push({ name, args });
  const define = (name: string, value: unknown) => {
    if (omit.has(name)) {
      delete sdk[name];
      return;
    }
    Object.defineProperty(sdk, name, { value, configurable: true, writable: true });
  };
  class Holder {
    constructor(handlers: Record<string, unknown>) {
      Object.assign(this, handlers);
    }
  }
  for (const name of [
    'MessageSentListener',
    'OfflineMessageListener',
    'SyncListener',
    'OfflineCacheResetListener',
    'MediaDownloadListener',
    'MessageFetchListener',
    'ConversationFetchListener',
    'UserFetchListener',
    'GroupFetchListener',
    'GroupMemberFetchListener',
    'BannedMemberFetchListener',
    'ReactionFetchListener',
    'NotificationFeedFetchListener',
    'ThreadFetchListener',
    'MediaCallbackListener',
    'ConversationDetailsListener',
    'MessageDetailsListener',
  ]) {
    define(name, Holder);
  }
  define('isOfflineEnabled', () => enabled);
  // The 4.3.1 shape: SCHEMA_RESET is the member the kit's SDK floor checks for. Omit it to model 4.3.0.
  define('OfflineCacheResetReason', {
    KEY_LOST: 'KEY_LOST',
    WRONG_KEY: 'WRONG_KEY',
    CORRUPTED: 'CORRUPTED',
    ESCALATED: 'ESCALATED',
    ENCRYPTION_CHANGED: 'ENCRYPTION_CHANGED',
    SCHEMA_RESET: 'SCHEMA_RESET',
  });
  define('addOfflineMessageListener', (id: string, l: any) => {
    record('addOfflineMessageListener', [id]);
    fake.listeners['offline'][id] = l;
  });
  define('removeOfflineMessageListener', (id: string) => {
    record('removeOfflineMessageListener', [id]);
    delete fake.listeners['offline'][id];
  });
  define('addSyncListener', (id: string, l: any) => {
    record('addSyncListener', [id]);
    fake.listeners['sync'][id] = l;
  });
  define('removeSyncListener', (id: string) => {
    record('removeSyncListener', [id]);
    delete fake.listeners['sync'][id];
  });
  define('addOfflineCacheResetListener', (id: string, l: any) => {
    record('addOfflineCacheResetListener', [id]);
    fake.listeners['cacheReset'][id] = l;
  });
  define('addMediaDownloadListener', (id: string, l: any) => {
    record('addMediaDownloadListener', [id]);
    fake.listeners['media'][id] = l;
  });
  define('addMessageListener', (id: string, l: any) => {
    record('addMessageListener', [id]);
    fake.listeners['message'][id] = l;
  });
  define('addLoginListener', (id: string, l: any) => {
    record('addLoginListener', [id]);
    fake.listeners['login'][id] = l;
  });
  define('markConversationAsRead', (id: string, type: string) => {
    record('markConversationAsRead', [id, type]);
    return Promise.resolve();
  });
  define('getCachedMediaObjectURL', (attachment: any) => {
    record('getCachedMediaObjectURL', [attachment]);
    return Promise.resolve(fake.cachedMedia.get(attachment?.url ?? attachment?.getUrl?.()) ?? null);
  });
  define('getMediaCachingMode', () => fake.mediaCachingMode);
  define('getExistingUploadFileRequest', (...args: unknown[]) => {
    record('getExistingUploadFileRequest', args);
    return Promise.resolve(fake.existingUpload ?? null);
  });
  define('getPendingMessages', () => Promise.resolve([]));
  define('downloadMedia', (attachment: any, callback?: any) => {
    record('downloadMedia', [attachment, callback]);
  });
  define('getMessageDetails', (id: unknown, listener?: any) => {
    record('getMessageDetails', [id, listener]);
    const script = fake.singleReads.shift();
    if (script && listener) script(listener);
    return Promise.reject({ code: 'FAILED_TO_FETCH' });
  });
  define('getConversation', (id: unknown, type: unknown, listener?: any) => {
    record('getConversation', [id, type, listener]);
    const script = fake.singleReads.shift();
    if (script && listener) script(listener);
    return Promise.reject({ code: 'FAILED_TO_FETCH' });
  });
  define('getConnectionStatus', () => (fake.connected ? 'connected' : 'disconnected'));
  define('retryMessage', (localId: string, listener?: any) => {
    record('retryMessage', [localId, listener]);
    return fake.discardResult === 'ok'
      ? Promise.resolve()
      : Promise.reject({ code: 'ERROR_OFFLINE_MESSAGE_NOT_FOUND' });
  });
  define('discardLocalMessage', (localId: string) => {
    record('discardLocalMessage', [localId]);
    return fake.discardResult === 'ok'
      ? Promise.resolve()
      : Promise.reject({ code: 'ERROR_OFFLINE_MESSAGE_IN_FLIGHT' });
  });
  const send = (name: string) => (message: any, listener?: any) => {
    record(name, [message, listener]);
    const script = scripts.shift();
    if (script) script(listener, message);
    // The SDK's Promise: offline it rejects even for a queued send.
    return Promise.reject({ code: 'FAILED_TO_FETCH' });
  };
  define('sendMessage', send('sendMessage'));
  define('sendMediaMessage', send('sendMediaMessage'));
  define('sendCustomMessage', send('sendCustomMessage'));
  define('sendInteractiveMessage', send('sendInteractiveMessage'));
  return fake;
}

/**
 * Per-send scripts for `OfflineSdkFake.scriptSend` that answer exactly as the
 * Chat SDK 4.3 does, so a test cannot pass on an error code the real SDK never
 * sends (the queue-full refusal came as `QUEUE_FULL` in a fake and as
 * `ERROR_PENDING_QUEUE_LIMIT` from the SDK).
 */
export const sendScripts = {
  /**
   * The outbox refuses a send because `maxPendingMessages` are already waiting:
   * the message is stamped with its local id, there is no pending callback, and
   * the per-send `onError` gets Android's code (`ERROR_PENDING_QUEUE_LIMIT`),
   * not the `QUEUE_FULL` reason. The global `onOutboxMessageFailed(message,
   * 'QUEUE_FULL')` follows; fire it with
   * `fake.fire('offline', 'onOutboxMessageFailed', message, 'QUEUE_FULL')`.
   * With `pendingFirst` the pending callback comes first (iOS, SDK ask A7).
   */
  queueFull(
    localMessageId: string,
    options: { cap?: number; pendingFirst?: boolean } = {}
  ): (listener: any, message: any) => void {
    const cap = options.cap ?? 2;
    return (listener, message) => {
      if (options.pendingFirst)
        listener.onMessagePending?.(offlineMessage(message, { localMessageId, status: 'PENDING' }));
      offlineMessage(message, { localMessageId, status: 'FAILED', failureReason: 'QUEUE_FULL' });
      listener.onError?.({
        code: 'ERROR_PENDING_QUEUE_LIMIT',
        name: 'ERROR_PENDING_QUEUE_LIMIT',
        message: `The message was not queued: ${cap} messages are already waiting to send (maxPendingMessages). Nothing queued was lost.`,
        details: { maxPendingMessages: cap },
      });
    };
  },
  /** A media send over the byte budget: the per-send `onError` carries `{ code: 'BYTE_OVERFLOW' }`. */
  byteOverflow(localMessageId: string): (listener: any, message: any) => void {
    return (listener, message) => {
      offlineMessage(message, { localMessageId, status: 'FAILED', failureReason: 'BYTE_OVERFLOW' });
      listener.onError?.({ code: 'BYTE_OVERFLOW' });
    };
  },
};
