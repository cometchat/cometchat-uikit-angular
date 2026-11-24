/**
 * Offline E2E build only: records every public kit event (name and payload) in
 * `globalThis.__ccEvents`, for the offline-OFF baseline (offline TEST-PLAN §5,
 * UIT-OFF-01). Never installed in a normal sample build; nothing from here ships
 * in the kit. It reads the event classes generically, so the same file runs on
 * the baseline kit and on this branch.
 */
import {
  CometChatCallEvents, CometChatConversationEvents, CometChatGroupEvents, CometChatMessageEvents,
  CometChatPinSaveEvents, CometChatThreadEvents, CometChatUIEvents, CometChatUserEvents,
} from '@cometchat/chat-uikit-angular';

/** UI plumbing that fires on pointer moves and focus changes, not behaviour under test. */
const IGNORED = new Set(['ccMouseEvent', 'ccActivePopover']);

const MAX_DEPTH = 5;

/** A stable, JSON-safe view of a payload: SDK objects by their getters, no functions. */
function view(value: any, depth = 0): unknown {
  if (value === null || value === undefined) return value ?? null;
  if (typeof value !== 'object') return typeof value === 'function' ? undefined : value;
  if (depth >= MAX_DEPTH) return '[deep]';
  if (Array.isArray(value)) return value.map(item => view(item, depth + 1));
  if (typeof value.getCategory === 'function') {
    return {
      kind: 'message',
      id: value.getId?.(),
      category: value.getCategory(),
      type: value.getType?.(),
      text: value.getText?.(),
      action: value.getAction?.(),
      receiverId: value.getReceiverId?.(),
      receiverType: value.getReceiverType?.(),
      sender: value.getSender?.()?.getUid?.(),
      parentMessageId: value.getParentMessageId?.(),
      quotedMessageId: value.getQuotedMessageId?.(),
      metadata: view(value.getMetadata?.(), depth + 1),
      muid: value.getMuid?.(),
      deletedAt: value.getDeletedAt?.() ? 'set' : null,
      editedAt: value.getEditedAt?.() ? 'set' : null,
    };
  }
  if (typeof value.getGuid === 'function') return { kind: 'group', guid: value.getGuid(), scope: value.getScope?.(), hasJoined: value.getHasJoined?.(), membersCount: value.getMembersCount?.() };
  if (typeof value.getUid === 'function') return { kind: 'user', uid: value.getUid(), scope: value.getScope?.() };
  if (typeof value.getConversationId === 'function') return { kind: 'conversation', id: value.getConversationId(), with: view(value.getConversationWith?.(), depth + 1), unread: value.getUnreadMessageCount?.() };
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    const item = value[key];
    if (typeof item !== 'function') out[key] = view(item, depth + 1);
  }
  return out;
}

export function installEventRecorder(): void {
  const events: { name: string; payload: unknown }[] = [];
  (globalThis as any).__ccEvents = events;
  const classes: Record<string, any> = {
    CometChatMessageEvents, CometChatConversationEvents, CometChatGroupEvents, CometChatUserEvents,
    CometChatCallEvents, CometChatPinSaveEvents, CometChatThreadEvents, CometChatUIEvents,
  };
  for (const [className, eventClass] of Object.entries(classes)) {
    for (const name of Object.getOwnPropertyNames(eventClass)) {
      const subject = eventClass[name];
      if (!name.startsWith('cc') || IGNORED.has(name) || typeof subject?.subscribe !== 'function') continue;
      subject.subscribe((payload: unknown) => {
        let safe: unknown;
        try { safe = view(payload); } catch { safe = '[unserializable]'; }
        events.push({ name: `${className}.${name}`, payload: safe });
      });
    }
  }
}
