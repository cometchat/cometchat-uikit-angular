/**
 * Pin & Save — action-sheet option Tests
 *
 * Covers the four option ids and the two gates that decide whether they render:
 * eligibility (what kind of message can carry a pin or save at all) and SBAC
 * (who is allowed to pin in this conversation). Save deliberately has no scope
 * gate — it is private to the acting user.
 *
 * @module components/cometchat-message-list/pin-save
 */

import { describe, it, expect, vi } from 'vitest';

import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  getMessageOptionsImpl,
  MessageOptionsContext,
} from './cometchat-message-list.option-builders';
import { handleOptionClickImpl } from './cometchat-message-list.option-click';
import { CometChatUIKitConstants } from '../../constants';
import { ContextMenuItem } from '../base-elements/cometchat-context-menu/cometchat-context-menu.component';

const PIN = CometChatUIKitConstants.MessageOption.pinMessage;
const UNPIN = CometChatUIKitConstants.MessageOption.unpinMessage;
const SAVE = CometChatUIKitConstants.MessageOption.saveMessage;
const UNSAVE = CometChatUIKitConstants.MessageOption.unsaveMessage;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMessage(
  opts: {
    id?: number;
    pinnedAt?: number;
    savedAt?: number;
    category?: string;
    deletedAt?: number;
    parentMessageId?: number;
    pinnedBy?: string;
    systemPinned?: boolean;
  } = {}
): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('receiver1', 'Hello', CometChat.RECEIVER_TYPE.GROUP);
  msg.setSender(new CometChat.User('sender1'));
  (msg as any).getId = () => opts.id ?? 100;
  (msg as any).getType = () => 'text';
  (msg as any).getCategory = () => opts.category ?? CometChatUIKitConstants.MessageCategory.message;
  (msg as any).getParentMessageId = () => opts.parentMessageId ?? 0;
  (msg as any).getDeletedAt = () => opts.deletedAt;
  (msg as any).getPinnedAt = () => opts.pinnedAt;
  (msg as any).getSavedAt = () => opts.savedAt;
  (msg as any).getPinnedBy = () => opts.pinnedBy;
  // The presence of the timestamp IS the boolean, so the predicates are faked
  // from the same source rather than left reading the real message's state.
  (msg as any).isPinned = () => opts.pinnedAt !== undefined;
  (msg as any).isSaved = () => opts.savedAt !== undefined;
  // `undefined` stands for an SDK build without the accessor, which sends
  // isSystemPinned() down its `app_system` fallback.
  (msg as any).isSystemPinned =
    opts.systemPinned === undefined ? undefined : () => opts.systemPinned;
  return msg as unknown as CometChat.BaseMessage;
}

function makeGroup(scope: string): CometChat.Group {
  const g = new CometChat.Group('guid1', 'Group', CometChat.GROUP_TYPE.PUBLIC, '');
  (g as any).getScope = () => scope;
  return g;
}

function ctx(overrides: Partial<MessageOptionsContext> = {}): MessageOptionsContext {
  return {
    loggedInUser: new CometChat.User('loggedIn'),
    group: null,
    hideReactionOption: false,
    hideReplyOption: false,
    hideReplyInThreadOption: false,
    hideThreadSubscriptionOption: false,
    threadSubscriptionEnabled: false,
    hidePinMessageOption: false,
    hideUnpinMessageOption: false,
    hideSaveMessageOption: false,
    hideUnsaveMessageOption: false,
    pinMessageEnabled: true,
    saveMessageEnabled: true,
    hideCopyMessageOption: false,
    hideEditMessageOption: false,
    hideDeleteMessageOption: false,
    hideTranslateMessageOption: false,
    hideMessageInfoOption: false,
    hideFlagMessageOption: false,
    hideMessagePrivatelyOption: false,
    showMarkAsUnreadOption: false,
    additionalOptions: [],
    optionsOverride: null,
    ...overrides,
  };
}

const ORGANISE = CometChatUIKitConstants.MessageOption.organise;

/** Top-level option ids. */
const idsOf = (options: { id: string }[]) => options.map(o => o.id);

/**
 * Ids inside the Organise flyout. Pin and Save are nested, so a test that
 * looked only at the top level would see neither.
 */
function organiseIds(options: any[]): string[] {
  const group = options.find(o => o.id === ORGANISE);
  return (group?.children ?? []).map((c: { id: string }) => c.id);
}

// ---------------------------------------------------------------------------
// The Organise group
// ---------------------------------------------------------------------------

describe('a pin the app placed', () => {
  const PINNED = { pinnedAt: 1_700_000_000 };

  it('offers no Unpin — the server refuses it for everyone', () => {
    const message = makeMessage({ ...PINNED, systemPinned: true });
    expect(organiseIds(getMessageOptionsImpl(ctx(), message))).not.toContain(UNPIN);
  });

  it('recognises one on an SDK build without isSystemPinned()', () => {
    const message = makeMessage({ ...PINNED, pinnedBy: 'app_system' });
    expect(organiseIds(getMessageOptionsImpl(ctx(), message))).not.toContain(UNPIN);
  });

  it('still offers Unpin on a pin a member placed', () => {
    const message = makeMessage({ ...PINNED, pinnedBy: 'sender1', systemPinned: false });
    expect(organiseIds(getMessageOptionsImpl(ctx(), message))).toContain(UNPIN);
  });

  it('leaves Save alone — saving is private and nothing to do with who pinned it', () => {
    const message = makeMessage({ ...PINNED, systemPinned: true });
    expect(organiseIds(getMessageOptionsImpl(ctx(), message))).toContain(SAVE);
  });
});

describe('Organise group', () => {
  it('nests Pin and Save rather than adding them to the top level', () => {
    const options = getMessageOptionsImpl(ctx(), makeMessage());

    expect(idsOf(options)).toContain(ORGANISE);
    // The actions live inside; the menu gains one row, not two.
    expect(idsOf(options)).not.toContain(PIN);
    expect(idsOf(options)).not.toContain(SAVE);
    expect(organiseIds(options)).toEqual([PIN, SAVE]);
  });

  it('sits before Translate, matching the design', () => {
    const ids = idsOf(getMessageOptionsImpl(ctx(), makeMessage()));
    const organiseIdx = ids.indexOf(ORGANISE);
    const translateIdx = ids.indexOf(CometChatUIKitConstants.MessageOption.translateMessage);

    expect(organiseIdx).toBeGreaterThanOrEqual(0);
    expect(translateIdx).toBeGreaterThan(organiseIdx);
  });

  it('is omitted entirely when it would open onto nothing', () => {
    const options = getMessageOptionsImpl(
      ctx({ pinMessageEnabled: false, saveMessageEnabled: false }),
      makeMessage()
    );
    expect(idsOf(options)).not.toContain(ORGANISE);
  });

  it('is omitted when both features are off, whatever the scope', () => {
    const options = getMessageOptionsImpl(
      ctx({
        group: makeGroup(CometChatUIKitConstants.groupMemberScope.participant),
        pinMessageEnabled: false,
        saveMessageEnabled: false,
      }),
      makeMessage()
    );
    expect(idsOf(options)).not.toContain(ORGANISE);
  });

  it('carries no action of its own — a group opens, it does not act', () => {
    const options = getMessageOptionsImpl(ctx(), makeMessage());
    const group = options.find(o => o.id === ORGANISE);
    expect(group?.children).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Which state shows which option
// ---------------------------------------------------------------------------

describe('pin/save options — state', () => {
  it('offers Pin on an unpinned message and Unpin on a pinned one', () => {
    expect(organiseIds(getMessageOptionsImpl(ctx(), makeMessage()))).toContain(PIN);
    expect(organiseIds(getMessageOptionsImpl(ctx(), makeMessage({ pinnedAt: 1_700_000_000 })))).toContain(UNPIN);
  });

  it('never offers both Pin and Unpin at once', () => {
    const ids = organiseIds(getMessageOptionsImpl(ctx(), makeMessage({ pinnedAt: 1_700_000_000 })));
    expect(ids).toContain(UNPIN);
    expect(ids).not.toContain(PIN);
  });

  it('offers Save on an unsaved message and Unsave on a saved one', () => {
    expect(organiseIds(getMessageOptionsImpl(ctx(), makeMessage()))).toContain(SAVE);
    expect(organiseIds(getMessageOptionsImpl(ctx(), makeMessage({ savedAt: 1_700_000_000 })))).toContain(UNSAVE);
  });

  it('treats the presence of the timestamp as the boolean, not its value', () => {
    // 0 is what an "absent" field coerces to; it must read as not pinned.
    expect(organiseIds(getMessageOptionsImpl(ctx(), makeMessage({ pinnedAt: 0 })))).toContain(PIN);
  });
});

// ---------------------------------------------------------------------------
// Permissions — the SERVER decides, not the client
// ---------------------------------------------------------------------------

describe('pin/save options — permissions', () => {
  it.each([['owner'], ['admin'], ['moderator'], ['participant']])(
    'offers Pin to a group %s',
    scope => {
      // No client-side scope gate: every member is offered Pin and an
      // unauthorised attempt comes back as ERR_ACTION_NOT_ALLOWED, which reverts
      // the optimistic flip. A client-side allow-list also hid Pin from members
      // who DID have the permission, because a Group taken from a conversation
      // often carries no scope at all.
      const options = getMessageOptionsImpl(ctx({ group: makeGroup(scope) }), makeMessage());
      expect(organiseIds(options)).toContain(PIN);
    }
  );

  it('offers Unpin to a participant too', () => {
    const options = getMessageOptionsImpl(
      ctx({ group: makeGroup(CometChatUIKitConstants.groupMemberScope.participant) }),
      makeMessage({ pinnedAt: 1_700_000_000 })
    );
    expect(organiseIds(options)).toContain(UNPIN);
  });

  it('offers Save to a participant — saving is private and was never scoped', () => {
    const options = getMessageOptionsImpl(
      ctx({ group: makeGroup(CometChatUIKitConstants.groupMemberScope.participant) }),
      makeMessage()
    );
    expect(organiseIds(options)).toContain(SAVE);
  });

  it('offers Pin in a 1-1, where there is no scope to read at all', () => {
    const options = getMessageOptionsImpl(ctx({ group: null }), makeMessage());
    expect(organiseIds(options)).toContain(PIN);
  });

  it('offers Pin when the scope has not loaded', () => {
    // `getScope()` is undefined on a Group taken from a conversation.
    const g = makeGroup(undefined as unknown as string);
    expect(organiseIds(getMessageOptionsImpl(ctx({ group: g }), makeMessage()))).toContain(PIN);
  });
});

// ---------------------------------------------------------------------------
// Eligibility
// ---------------------------------------------------------------------------

describe('pin/save options — eligibility', () => {
  it('offers neither on an action message', () => {
    const ids = idsOf(
      getMessageOptionsImpl(
        ctx(),
        makeMessage({ category: CometChatUIKitConstants.MessageCategory.action })
      )
    );
    expect(ids).not.toContain(PIN);
    expect(ids).not.toContain(SAVE);
  });

  it('offers neither on a deleted message', () => {
    const ids = organiseIds(getMessageOptionsImpl(ctx(), makeMessage({ deletedAt: 1_700_000_000 })));
    expect(ids).not.toContain(PIN);
    expect(ids).not.toContain(SAVE);
  });

  it('offers both on a thread reply — the backend accepts them', () => {
    const ids = organiseIds(getMessageOptionsImpl(ctx(), makeMessage({ parentMessageId: 55 })));
    expect(ids).toContain(PIN);
    expect(ids).toContain(SAVE);
  });
});

// ---------------------------------------------------------------------------
// Feature flags and per-option hide flags
// ---------------------------------------------------------------------------

describe('pin/save options — gating', () => {
  it('hides pin options when the app flag is off, leaving save alone', () => {
    const ids = organiseIds(getMessageOptionsImpl(ctx({ pinMessageEnabled: false }), makeMessage()));
    expect(ids).not.toContain(PIN);
    expect(ids).toContain(SAVE);
  });

  it('hides save options when the app flag is off, leaving pin alone', () => {
    const ids = organiseIds(getMessageOptionsImpl(ctx({ saveMessageEnabled: false }), makeMessage()));
    expect(ids).not.toContain(SAVE);
    expect(ids).toContain(PIN);
  });

  it.each([
    ['hidePinMessageOption', PIN, {}],
    ['hideSaveMessageOption', SAVE, {}],
    ['hideUnpinMessageOption', UNPIN, { pinnedAt: 1_700_000_000 }],
    ['hideUnsaveMessageOption', UNSAVE, { savedAt: 1_700_000_000 }],
  ])('respects %s', (flag, id, msgOpts) => {
    const options = getMessageOptionsImpl(
      ctx({ [flag]: true } as Partial<MessageOptionsContext>),
      makeMessage(msgOpts as Record<string, number>)
    );
    expect(organiseIds(options)).not.toContain(id);
  });
});

// ---------------------------------------------------------------------------
// Click routing
// ---------------------------------------------------------------------------

describe('pin/save options — click', () => {
  it.each([
    [PIN, 'pin'],
    [UNPIN, 'unpin'],
    [SAVE, 'save'],
    [UNSAVE, 'unsave'],
  ])('routes %s to requestPinSave(%s)', (optionId, action) => {
    const self = { requestPinSave: vi.fn() };
    const message = makeMessage();

    handleOptionClickImpl(self, { id: optionId } as ContextMenuItem, message);

    expect(self.requestPinSave).toHaveBeenCalledWith(action, message);
  });
});
