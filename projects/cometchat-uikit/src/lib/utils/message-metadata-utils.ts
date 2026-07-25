/**
 * Helpers for the UI Kit-owned message metadata keys (`batchId`, `audioType`).
 *
 * These are the ONLY places the raw key/value strings should appear — routing, sending and
 * grouping all go through here so the wire format stays consistent with the React, iOS and
 * Android kits.
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKitConstants } from '../constants';

type MetadataBearer = { getMetadata?: () => Record<string, unknown> | null };

/** Read a message's metadata object, tolerating messages that predate/lack the method. */
export function readMetadata(
  message: CometChat.BaseMessage | null | undefined
): Record<string, unknown> | null {
  if (!message) {
    return null;
  }
  try {
    return (message as unknown as MetadataBearer).getMetadata?.() ?? null;
  } catch {
    return null;
  }
}

/** Read the `batchId` grouping key, or `null` when the message is not part of a batch. */
export function getBatchId(message: CometChat.BaseMessage | null | undefined): string | null {
  const value = readMetadata(message)?.[CometChatUIKitConstants.MetadataKeys.batchId];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** Read the raw `audioType` tag, or `undefined` when absent. */
export function getAudioType(
  message: CometChat.BaseMessage | null | undefined
): string | undefined {
  const value = readMetadata(message)?.[CometChatUIKitConstants.MetadataKeys.audioType];
  return typeof value === 'string' ? value : undefined;
}

/**
 * Whether an audio message should render as a voice note (waveform) rather than a plain
 * audio bubble.
 *
 * Accepts BOTH the cross-platform `voice_note` value and the legacy camelCase `voiceNote`
 * this kit used to write, so voice notes already persisted in a conversation keep rendering
 * correctly. Absence of the tag is NOT a voice note.
 */
export function isVoiceNote(message: CometChat.BaseMessage | null | undefined): boolean {
  const value = getAudioType(message);
  return (
    value === CometChatUIKitConstants.AudioType.voiceNote ||
    value === CometChatUIKitConstants.AudioType.legacyVoiceNote
  );
}

/** The four media message types that can carry a caption. */
const MEDIA_TYPES: readonly string[] = [
  CometChatUIKitConstants.MessageTypes.image,
  CometChatUIKitConstants.MessageTypes.video,
  CometChatUIKitConstants.MessageTypes.audio,
  CometChatUIKitConstants.MessageTypes.file,
];

/** Whether the message is an image/video/audio/file message in the `message` category. */
export function isMediaMessage(message: CometChat.BaseMessage | null | undefined): boolean {
  if (!message) {
    return false;
  }
  return (
    message.getCategory() === CometChatUIKitConstants.MessageCategory.message &&
    MEDIA_TYPES.includes(message.getType())
  );
}

/**
 * The caption of a media message, or `''` when it has none. Mirrors the React kit: `getCaption()`
 * first, then `getData().text` for messages whose caption only round-trips through `data`.
 */
export function getMediaCaption(message: CometChat.BaseMessage | null | undefined): string {
  if (!message) {
    return '';
  }
  try {
    const mediaMessage = message as CometChat.MediaMessage;
    const caption = mediaMessage.getCaption?.();
    if (typeof caption === 'string' && caption.trim().length > 0) {
      return caption;
    }
    const data = mediaMessage.getData?.() as { text?: unknown } | null | undefined;
    const text = data?.text;
    return typeof text === 'string' ? text : '';
  } catch {
    return '';
  }
}

/** True when the message is media AND carries a non-blank caption (gates Copy/Edit, per React). */
export function hasMediaCaption(message: CometChat.BaseMessage | null | undefined): boolean {
  return isMediaMessage(message) && getMediaCaption(message).trim().length > 0;
}

/**
 * Merge UI Kit metadata onto a message without dropping keys the SDK or the app already set
 * (a bare `setMetadata({ batchId })` would clobber them). Sets the caption via `setCaption`.
 */
/**
 * Record a send failure ON the message, so the bubble can render it.
 *
 * The message bubble decides its error tick (and the permission-denied notice) from
 * `message.error` — see its `messageError`/`hasMessageError` getters. Emitting
 * `ccMessageSent` with `MessageStatus.error` is NOT enough on its own: the list swaps the pending
 * bubble for this same object, so an unmarked message re-renders identically and sits on the
 * pending clock forever.
 *
 * `error` is not part of BaseMessage's public shape, hence the cast — the bubble reads it the same
 * loose way (`m.error || m.getMetadata?.()?.error`).
 */
export function markMessageFailed(message: CometChat.BaseMessage, error: unknown): void {
  const err = error as { code?: string; message?: string } | undefined;
  (message as unknown as { error: { code?: string; message?: string } }).error = {
    code: err?.code ?? 'ERR_MESSAGE_SEND_FAILED',
    message: err?.message ?? String(error ?? ''),
  };
}

export function stampBatchMetadata(
  message: CometChat.BaseMessage,
  options: { batchId?: string; audioType?: string; caption?: string }
): void {
  const mediaMessage = message as CometChat.MediaMessage;
  const metadata: Record<string, unknown> = { ...(readMetadata(message) ?? {}) };

  if (options.batchId !== undefined) {
    metadata[CometChatUIKitConstants.MetadataKeys.batchId] = options.batchId;
  }
  if (options.audioType !== undefined) {
    metadata[CometChatUIKitConstants.MetadataKeys.audioType] = options.audioType;
  }
  mediaMessage.setMetadata(metadata);

  if (options.caption !== undefined) {
    mediaMessage.setCaption(options.caption);
  }
}
