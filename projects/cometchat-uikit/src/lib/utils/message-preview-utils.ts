/**
 * Shared last-message-preview text for media messages, used by the conversation list and by
 * search. Mirrors the React kit's per-plugin `getLastMessagePreview()` and its search subtitle.
 *
 * The two surfaces deliberately differ, so the caller picks a `style`:
 *
 * | case                        | 'conversation'      | 'search'                    |
 * |-----------------------------|---------------------|-----------------------------|
 * | 1 attachment, no caption    | "Image"             | "holiday.jpg" (filename)    |
 * | N attachments, no caption   | "3 Images"          | "3 Images"                  |
 * | 1 attachment + caption      | "Image · <caption>" | "<caption>"                 |
 * | N images/videos + caption   | "3 Images · <cap>"  | "<caption>" (count = badge) |
 * | N audio/files + caption     | "3 Files · <cap>"   | "3 Files · <caption>"       |
 * | voice note                  | "Voice Note"        | (audio rules apply)         |
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from '../resources/CometChatLocalize/cometchat-localize';
import { getMediaCaption, isVoiceNote } from './message-metadata-utils';

/** Which surface the preview is being rendered on — the branching differs between the two. */
export type MediaPreviewStyle = 'conversation' | 'search';

/** The four media types this helper covers. */
export type MediaPreviewType = 'image' | 'video' | 'audio' | 'file';

/** Whether `type` is one this helper knows how to preview. */
export function isMediaPreviewType(type: string): type is MediaPreviewType {
  return type === 'image' || type === 'video' || type === 'audio' || type === 'file';
}

/** Number of attachments on a media message; at least 1, since a message always shows something. */
export function getAttachmentCount(message: CometChat.BaseMessage): number {
  try {
    const attachments = (message as CometChat.MediaMessage).getAttachments?.() ?? [];
    return Math.max(attachments.length, 1);
  } catch {
    return 1;
  }
}

/** Name of the first attachment, or `''` when unavailable. */
export function getFirstAttachmentName(message: CometChat.BaseMessage): string {
  try {
    const attachments = (message as CometChat.MediaMessage).getAttachments?.() ?? [];
    return attachments[0]?.getName?.() ?? '';
  } catch {
    return '';
  }
}

/**
 * The type label for a media message: singular ("Image") for one attachment, pluralized with a
 * count ("3 Images") for several.
 *
 * A missing `_plural` key would make `getLocalizedString` return `''`; falling back to
 * `"3 Image"` is wrong but legible, and is what React does when the key is absent.
 */
export function getMediaTypeLabel(type: MediaPreviewType, count: number): string {
  const singular = CometChatLocalize.getLocalizedString(`conversation_subtitle_${type}`);
  if (count <= 1) {
    return singular;
  }
  const plural = CometChatLocalize.getLocalizedString(`media_edit_preview_${type}_plural`);
  return `${count} ${plural || singular}`;
}

/** Hooks that let each surface decide how the caption and the label are rendered. */
export interface MediaPreviewOptions {
  /**
   * Receives the raw caption, returns the display string; `''` suppresses it. A surface that
   * renders sanitized HTML can return HTML here.
   */
  formatCaption?: (caption: string) => string;
  /**
   * Applied to the type label ("3 Images") just before it is joined to the caption. A surface
   * whose caption is HTML must escape the label here, so the two are the same flavour of string.
   * Always called AFTER `formatCaption`, so it may branch on what that produced.
   */
  formatLabel?: (label: string) => string;
}

/**
 * Preview text for a media message.
 *
 * Voice notes short-circuit to "Voice Note": they carry no filename worth showing, and a count is
 * meaningless for a recording.
 */
export function getMediaPreview(
  message: CometChat.BaseMessage,
  style: MediaPreviewStyle,
  options: MediaPreviewOptions = {}
): string {
  const formatCaption = options.formatCaption ?? ((c: string) => c.trim());
  const formatLabel = options.formatLabel ?? ((l: string) => l);

  const type = message.getType();
  if (!isMediaPreviewType(type)) {
    return type;
  }

  if (type === 'audio' && isVoiceNote(message)) {
    return CometChatLocalize.getLocalizedString('conversation_subtitle_voice_note');
  }

  const count = getAttachmentCount(message);
  // Caption first: formatLabel may need to know what it produced (e.g. whether to escape).
  const caption = formatCaption(getMediaCaption(message));
  const hasCaption = caption.length > 0;
  const label = getMediaTypeLabel(type, count);

  if (style === 'search') {
    // One attachment and nothing to say about it -> the filename is the most useful thing.
    if (count === 1 && !hasCaption) {
      return formatLabel(getFirstAttachmentName(message) || label);
    }
    if (!hasCaption) {
      return formatLabel(label);
    }
    // A caption always wins for a single item, and for image/video batches the count is already
    // visible as a "+N" badge on the thumbnail — repeating it in the subtitle is noise.
    if (count === 1 || type === 'image' || type === 'video') {
      return caption;
    }
    return `${formatLabel(label)} · ${caption}`;
  }

  return hasCaption ? `${formatLabel(label)} · ${caption}` : formatLabel(label);
}
