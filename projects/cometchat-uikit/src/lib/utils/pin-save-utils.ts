/**
 * Shared helpers for Pin Message and Save Message.
 *
 * Two rules from the SDK's PIN_SAVE_CONTRACT govern everything here:
 *
 *   1. The PRESENCE of `pinnedAt` / `savedAt` IS the boolean. The fields are
 *      absent when unset and CLEARED (not zeroed) on unpin/unsave, so
 *      `getPinnedAt() === 0` is never a valid test.
 *   2. `pinnedAt`/`pinnedBy` are global — identical for everyone in the
 *      conversation. `savedAt` is per-viewer and only ever populated on the
 *      acting user's own copy.
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKitConstants } from '../constants';

/*
 * There is deliberately NO client-side scope gate on pinning.
 *
 * Pin is offered to every member and the SERVER decides: an unauthorised pin
 * comes back as `ERR_ACTION_NOT_ALLOWED`, which reverts the optimistic flip and
 * surfaces a toast. A client-side allow-list was tried and removed — a group's
 * `getScope()` is a membership property that is frequently absent on a Group
 * derived from a conversation, so any allow-list also hid Pin from members who
 * genuinely had the permission, and the two kits disagreed about who could see
 * it. One authority, server-side, is the whole point.
 */

/** The pinner the backend reports for a pin the app placed, not a person. */
const SYSTEM_PINNER = 'app_system';

/**
 * Was this pin placed by the app rather than by a member?
 *
 * Nobody may take a system pin down from the client — the server refuses, so
 * offering Unpin on one only produces an error toast. `isSystemPinned()` is the
 * SDK's own answer where the build has it; the `app_system` sentinel is what
 * older builds put in `pinnedBy` and is checked as the fallback.
 */
export function isSystemPinned(message: CometChat.BaseMessage | null | undefined): boolean {
  if (!message?.isPinned?.()) return false;
  const probe = message as unknown as { isSystemPinned?: () => boolean };
  if (typeof probe.isSystemPinned === 'function') return probe.isSystemPinned();
  return message.getPinnedBy?.() === SYSTEM_PINNER;
}

/**
 * Copy pin/save attributes from the row already on screen onto its replacement.
 *
 * An edit, moderation or reaction payload describes THAT change; it carries no
 * promise of also carrying `pinnedAt`/`savedAt`. Swapping it in wholesale would
 * silently clear the indicators — and in the pinned panel, erase the very reason
 * the row is there.
 *
 * Only ever fills gaps: a replacement that does assert pin/save state keeps it,
 * and a genuine unpin/unsave arrives as its own event.
 */
export function carryPinSaveForward(
  previous: CometChat.BaseMessage,
  next: CometChat.BaseMessage
): void {
  const target = next as unknown as {
    setPinnedAt?: (value: number | undefined) => void;
    setPinnedBy?: (value: string | undefined) => void;
    setSavedAt?: (value: number | undefined) => void;
  };

  if (previous.isPinned?.() && !next.isPinned?.()) {
    target.setPinnedAt?.(previous.getPinnedAt?.());
    target.setPinnedBy?.(previous.getPinnedBy?.());
  }

  if (previous.isSaved?.() && !next.isSaved?.()) {
    target.setSavedAt?.(previous.getSavedAt?.());
  }
}

/**
 * Bring a pin/save change onto the row already on screen, keeping that row's own
 * message object.
 *
 * The counterpart to {@link carryPinSaveForward}. There the REPLACEMENT is
 * authoritative and only its missing pin/save state is filled in. Here the
 * pin/save payload is authoritative about those three attributes and about
 * NOTHING else: the save response carries no quoted message, so swapping it in
 * erased the reply preview from any bubble that had one — it reappeared only on
 * the refetch a conversation switch triggers. Reactions and moderation state were
 * exposed to the same loss.
 *
 * All three attributes are copied unconditionally, `undefined` included, so an
 * unpin or unsave still clears the marker rather than leaving a stale one.
 */
export function applyPinSaveFrom(
  held: CometChat.BaseMessage,
  incoming: CometChat.BaseMessage
): void {
  applyPinSave(held, {
    pinnedAt: incoming.getPinnedAt?.(),
    pinnedBy: incoming.getPinnedBy?.(),
    savedAt: incoming.getSavedAt?.(),
  });
}

/** Snapshot of the three pin/save attributes, for revert-on-error. */
export interface PinSaveAttrs {
  pinnedAt: number | undefined;
  pinnedBy: string | undefined;
  savedAt: number | undefined;
}

export function snapshotPinSave(message: CometChat.BaseMessage): PinSaveAttrs {
  return {
    pinnedAt: message.getPinnedAt?.(),
    pinnedBy: message.getPinnedBy?.(),
    savedAt: message.getSavedAt?.(),
  };
}

/**
 * Apply attributes to a message. Passing `undefined` CLEARS the field rather
 * than zeroing it — presence is what "is pinned"/"is saved" means, so a stale 0
 * would read as pinned-at-the-epoch.
 */
export function applyPinSave(
  message: CometChat.BaseMessage,
  attrs: Partial<PinSaveAttrs>
): void {
  const target = message as unknown as {
    setPinnedAt?: (value: number | undefined) => void;
    setPinnedBy?: (value: string | undefined) => void;
    setSavedAt?: (value: number | undefined) => void;
  };
  if ('pinnedAt' in attrs) target.setPinnedAt?.(attrs.pinnedAt);
  if ('pinnedBy' in attrs) target.setPinnedBy?.(attrs.pinnedBy);
  if ('savedAt' in attrs) target.setSavedAt?.(attrs.savedAt);
}

/**
 * Selectors for things interactive in their own right.
 *
 * A click landing inside one of these belongs to that control — opening the
 * options menu, playing audio, following a link — and must NOT also navigate to
 * the message. The panels make the whole row a hit target, so without this the
 * row swallows every control inside its bubble.
 */
export const PIN_SAVE_INTERACTIVE_SELECTOR = [
  'button',
  'a',
  'input',
  'audio',
  'video',
  '[role="button"]',
  '[role="menu"]',
  '[role="menuitem"]',
  '[class*="message-bubble__options"]',
  '[class*="context-menu"]',
  '[class*="cometchat-audio-bubble"]',
  '[class*="cometchat-video-bubble"]',
  '[class*="reactions"]',
].join(',');

/**
 * Did the click land on a control that owns it?
 *
 * The search stops at the element the handler is bound to — the row. Rows are
 * themselves `role="button"`, which is in the list above, so an unbounded
 * `closest()` matches the row on EVERY click and swallows the lot: the panel
 * looks dead because nothing it contains is ever treated as a plain click.
 * Only a match strictly INSIDE the row is a control that owns the click.
 */
export function isInteractiveTarget(event: Event): boolean {
  const target = event.target as HTMLElement | null;
  const match = target?.closest?.(PIN_SAVE_INTERACTIVE_SELECTOR) ?? null;
  if (!match) return false;

  const row = event.currentTarget as HTMLElement | null;
  if (!row) return true;

  // The row itself, or something outside it, is not an inner control.
  return match !== row && row.contains(match);
}

/**
 * Is this message eligible to be pinned or saved at all?
 *
 * Excludes action and call bubbles, deleted messages, messages the server has
 * not acknowledged yet, and anything held or rejected by moderation. Thread
 * replies ARE eligible: the backend accepts them and returns the parent for
 * context, so the option belongs inside the thread view too.
 *
 * Runs for every bubble on every render, so a message-like object missing an
 * accessor must yield "not eligible" rather than throw — a throw here would
 * take the whole context menu down, not just Pin and Save.
 */
export function isPinSaveEligible(
  message: CometChat.BaseMessage,
  loggedInUserUid: string
): boolean {
  const probe = message as unknown as Partial<Record<string, () => unknown>>;
  const call = (name: string): unknown =>
    typeof probe[name] === 'function' ? probe[name]!() : undefined;

  // Optimistic or unsent — there is no server-side id to act against.
  if (!call('getId')) return false;
  if (call('getDeletedAt')) return false;

  const category = call('getCategory');
  if (
    category === CometChatUIKitConstants.MessageCategory.action ||
    category === CometChatUIKitConstants.MessageCategory.call
  ) {
    return false;
  }

  if (isPendingModeration(message)) return false;
  if (isModeratedForUser(message, loggedInUserUid)) return false;
  if (isPermissionDeniedMessage(message, loggedInUserUid)) return false;

  return true;
}

/** Still awaiting a moderation decision. */
function isPendingModeration(message: CometChat.BaseMessage): boolean {
  const getStatus = (message as unknown as { getModerationStatus?: () => unknown })
    .getModerationStatus;
  if (typeof getStatus !== 'function') return false;
  return getStatus.call(message) === CometChatUIKitConstants.moderationStatus.pending;
}

/**
 * Disapproved AND authored by this user.
 *
 * Narrowed to the sender deliberately: only they see the moderation state, so
 * only their options should change. Everyone else sees an ordinary message and
 * should get the ordinary options.
 */
function isModeratedForUser(message: CometChat.BaseMessage, loggedInUserUid: string): boolean {
  const getStatus = (message as unknown as { getModerationStatus?: () => unknown })
    .getModerationStatus;
  if (typeof getStatus !== 'function') return false;
  if (getStatus.call(message) !== CometChatUIKitConstants.moderationStatus.disapproved) return false;
  return message.getSender?.()?.getUid?.() === loggedInUserUid;
}

/**
 * Rejected by the server with a permission failure.
 *
 * The code arrives in one of three shapes depending on where the rejection was
 * caught, so all three are checked. A message rejected before it reached the
 * server may carry no sender at all — that one is ours by definition.
 */
function isPermissionDeniedMessage(
  message: CometChat.BaseMessage,
  loggedInUserUid: string
): boolean {
  const shape = message as unknown as {
    _ccError?: { code?: string };
    error?: { code?: string };
    getMetadata?: () => { error?: { code?: string } } | null | undefined;
  };

  let code: string | undefined;
  try {
    code =
      shape._ccError?.code ??
      shape.error?.code ??
      (typeof shape.getMetadata === 'function' ? shape.getMetadata()?.error?.code : undefined);
  } catch {
    return false;
  }

  if (code !== 'ERR_PERMISSION_DENIED' && code !== 'ERR_FILE_TYPE_NOT_ALLOWED') return false;

  const senderUid = message.getSender?.()?.getUid?.();
  return !senderUid || senderUid === loggedInUserUid;
}

/** Message strings worth searching, across the shapes an error can arrive in. */
function collectErrorText(error: unknown): string[] {
  if (typeof error === 'string') return [error];
  if (!error || typeof error !== 'object') return [];

  const shape = error as {
    message?: unknown;
    devMessage?: unknown;
    error?: { message?: unknown; devMessage?: unknown };
  };

  return [shape.message, shape.devMessage, shape.error?.message, shape.error?.devMessage].filter(
    (value): value is string => typeof value === 'string' && value.length > 0
  );
}

/**
 * Was a pin/save rejected because a cap was reached?
 *
 * Asked so that the cap is only ever quoted back when it is actually the
 * reason. Without this check every non-permission failure — a dropped
 * connection, a deleted message, anything at all — was answered with "you can
 * pin up to N messages", telling the user to unpin something that would not
 * have helped and hiding what really went wrong.
 *
 * The backend signals it by code where it can, and by prose where it cannot;
 * both are accepted, and anything else is not a limit failure.
 */
export function isLimitError(error: unknown): boolean {
  const shape = error as { code?: unknown } | null | undefined;
  const code = String(shape?.code ?? '');
  if (/LIMIT|EXCEED|MAX/i.test(code)) return true;

  return collectErrorText(error).some(text =>
    /\blimit\b|\bexceed(?:ed|s)?\b|\bmaximum\b|\bmax(?:imum)?\s+of\b|only\s+(?:pin|save)\s+\d/i.test(text)
  );
}

/**
 * Was a pin/save rejected because the user is not allowed to?
 *
 * Classified here rather than by comparing a code at the call site, so a second
 * permission code can be recognised in one place instead of several.
 */
export function isPermissionError(error: unknown): boolean {
  const code = String(
    (error as { code?: unknown } | null | undefined)?.code ?? ''
  );
  return code === 'ERR_ACTION_NOT_ALLOWED' || code === 'ERR_PERMISSION_DENIED';
}

