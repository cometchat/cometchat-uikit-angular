/**
 * Thread subscription — action-sheet option Tests
 *
 * Covers UI Kit change #1: the single `threadSubscription` option whose title
 * flips on state, its two independent gates (shown at zero replies, hidden on a
 * reply), the feature gate, its placement next to Reply in thread, and the
 * handler the option click routes to.
 *
 * @module components/cometchat-message-list/thread-subscription
 */

import { describe, it, expect, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  getMessageOptionsImpl,
  MessageOptionsContext,
} from './cometchat-message-list.option-builders';
import { getThreadRootId } from './cometchat-message-list.option-builders';
import { stampThreadSubscription } from '../../utils/thread-subscription-utils';
import { handleOptionClickImpl } from './cometchat-message-list.option-click';
import { CometChatUIKitConstants } from '../../constants';
import { ContextMenuItem } from '../base-elements/cometchat-context-menu/cometchat-context-menu.component';

const OPTION_ID = CometChatUIKitConstants.MessageOption.threadSubscription;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMessage(
  opts: { id?: number; parentMessageId?: number; replyCount?: number; subscribed?: boolean } = {}
): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('receiver1', 'Hello', CometChat.RECEIVER_TYPE.USER);
  msg.setSender(new CometChat.User('sender1'));
  (msg as any).getId = () => opts.id ?? 100;
  (msg as any).getType = () => 'text';
  (msg as any).getCategory = () => CometChatUIKitConstants.MessageCategory.message;
  (msg as any).getParentMessageId = () => opts.parentMessageId ?? 0;
  (msg as any).getReplyCount = () => opts.replyCount ?? 0;
  // The server's per-viewer flag, stamped on every fetched message in a thread.
  (msg as any).isThreadSubscribed = () => opts.subscribed ?? false;
  return msg as unknown as CometChat.BaseMessage;
}

function ctx(overrides: Partial<MessageOptionsContext> = {}): MessageOptionsContext {
  return {
    loggedInUser: new CometChat.User('loggedIn'),
    // Thread subscription is group-only, so the default context is a group chat.
    group: new CometChat.Group('supergroup', 'Super Group', CometChat.GROUP_TYPE.PUBLIC),
    hideReactionOption: false,
    hideReplyOption: false,
    hideReplyInThreadOption: false,
    hideThreadSubscriptionOption: false,
    threadSubscriptionEnabled: true,
    hidePinMessageOption: false,
    hideUnpinMessageOption: false,
    hideSaveMessageOption: false,
    hideUnsaveMessageOption: false,
    pinMessageEnabled: false,
    saveMessageEnabled: false,
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

const idsOf = (options: { id: string }[]) => options.map(o => o.id);
const findOption = (options: { id: string }[]) => options.find(o => o.id === OPTION_ID);

// ---------------------------------------------------------------------------
// Visibility gates
// ---------------------------------------------------------------------------

describe('threadSubscription option — visibility', () => {
  it('is offered on a message with zero replies', () => {
    const options = getMessageOptionsImpl(ctx(), makeMessage({ replyCount: 0 }));
    expect(idsOf(options)).toContain(OPTION_ID);
  });

  it('is offered on a message that already has replies', () => {
    const options = getMessageOptionsImpl(ctx(), makeMessage({ replyCount: 12 }));
    expect(idsOf(options)).toContain(OPTION_ID);
  });

  it('is offered on a reply too, as a second entry point to the open thread', () => {
    const options = getMessageOptionsImpl(ctx(), makeMessage({ parentMessageId: 55 }));
    expect(idsOf(options)).toContain(OPTION_ID);
  });

  it('outlives Reply in thread on a reply, which is withheld there', () => {
    // The two thread actions diverge on a reply: Reply in thread has nowhere to
    // go (no nested threads), while subscription still applies — to the parent.
    const ids = idsOf(getMessageOptionsImpl(ctx(), makeMessage({ parentMessageId: 55 })));
    expect(ids).toContain(OPTION_ID);
    expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.replyInThread);
  });

  it('is offered in a 1:1 chat too, not just a group', () => {
    // A thread in a direct chat is as easy to lose track of as one in a group,
    // and unsubscribing genuinely silences its replies. The header bell is gated
    // the same way.
    const options = getMessageOptionsImpl(ctx({ group: null }), makeMessage());
    expect(idsOf(options)).toContain(OPTION_ID);
    // The other thread action is unaffected — it works in a 1:1 chat.
    expect(idsOf(options)).toContain(CometChatUIKitConstants.MessageOption.replyInThread);
  });

  it('is hidden when the integrator has not enabled the feature', () => {
    const options = getMessageOptionsImpl(
      ctx({ threadSubscriptionEnabled: false }),
      makeMessage()
    );
    expect(idsOf(options)).not.toContain(OPTION_ID);
  });

  it('is hidden when only this surface is switched off', () => {
    const options = getMessageOptionsImpl(
      ctx({ hideThreadSubscriptionOption: true }),
      makeMessage()
    );
    expect(idsOf(options)).not.toContain(OPTION_ID);
    // The other thread action is untouched — the two flags are independent.
    expect(idsOf(options)).toContain(CometChatUIKitConstants.MessageOption.replyInThread);
  });

  it('sits immediately after Reply in thread on a top-level message', () => {
    const ids = idsOf(getMessageOptionsImpl(ctx(), makeMessage()));
    const replyIndex = ids.indexOf(CometChatUIKitConstants.MessageOption.replyInThread);
    expect(replyIndex).toBeGreaterThanOrEqual(0);
    expect(ids[replyIndex + 1]).toBe(OPTION_ID);
  });

  it('still appears when Reply in thread is hidden', () => {
    const options = getMessageOptionsImpl(ctx({ hideReplyInThreadOption: true }), makeMessage());
    expect(idsOf(options)).toContain(OPTION_ID);
  });

  it('is not offered on a deleted message', () => {
    const msg = makeMessage();
    (msg as any).getDeletedAt = () => 1_700_000_000;
    expect(idsOf(getMessageOptionsImpl(ctx(), msg))).not.toContain(OPTION_ID);
  });
});

// ---------------------------------------------------------------------------
// Title / icon flip
// ---------------------------------------------------------------------------

describe('threadSubscription option — state', () => {
  it('reads as the action to take, not the state, when not following', () => {
    const option = findOption(getMessageOptionsImpl(ctx(), makeMessage()));
    expect(option?.title).toBe('Subscribe to thread');
    expect(option?.iconURL).toBe('assets/thread_notifications.svg');
  });

  it('flips to Unfollow on a thread the user follows', () => {
    const option = findOption(
      getMessageOptionsImpl(ctx(), makeMessage({ subscribed: true }))
    );
    expect(option?.title).toBe('Unsubscribe from thread');
    expect(option?.iconURL).toBe('assets/thread_notifications_off.svg');
  });

  it('uses one option id for both states, so nothing can go stale', () => {
    const following = idsOf(getMessageOptionsImpl(ctx(), makeMessage({ subscribed: true })));
    const notFollowing = idsOf(getMessageOptionsImpl(ctx(), makeMessage()));
    expect(following.filter(id => id === OPTION_ID)).toHaveLength(1);
    expect(notFollowing.filter(id => id === OPTION_ID)).toHaveLength(1);
  });

  it('reads the flag off the message rather than any cache', () => {
    // The server stamps the viewer's flag on every fetched message in a thread,
    // so the object the sheet was opened on already knows the answer.
    const message = makeMessage({ subscribed: true });
    const isThreadSubscribed = vi.spyOn(message as any, 'isThreadSubscribed');

    getMessageOptionsImpl(ctx(), message);

    expect(isThreadSubscribed).toHaveBeenCalled();
  });

  it('reads a reply from its OWN flag, not its parent', () => {
    // Every fetched message in a thread carries the flag, replies included —
    // §5.7. The parent id matters only for matching the cross-surface event.
    const option = findOption(
      getMessageOptionsImpl(ctx(), makeMessage({ id: 999, parentMessageId: 555, subscribed: true }))
    );
    expect(option?.title).toBe('Unsubscribe from thread');
  });

  it('renders the un-followed state on a message with no flag at all', () => {
    // A partial message, or one from an SDK build without the accessor.
    const message = makeMessage();
    delete (message as any).isThreadSubscribed;
    const option = findOption(getMessageOptionsImpl(ctx(), message));
    expect(option?.title).toBe('Subscribe to thread');
  });
});

// ---------------------------------------------------------------------------
// Click routing
// ---------------------------------------------------------------------------

describe('getThreadRootId', () => {
  it('is the message itself on a thread root', () => {
    expect(getThreadRootId(makeMessage({ id: 42 }))).toBe(42);
  });

  it('is the parent on a reply, never the reply', () => {
    expect(getThreadRootId(makeMessage({ id: 42, parentMessageId: 7 }))).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// Cross-surface write-back
// ---------------------------------------------------------------------------

describe('stampThreadSubscription', () => {
  /** A message that actually remembers what was written to it. */
  function stampable(opts: { id?: number; parentMessageId?: number; subscribed?: boolean } = {}) {
    const msg = makeMessage(opts);
    let subscribed = opts.subscribed ?? false;
    (msg as any).isThreadSubscribed = () => subscribed;
    (msg as any).setThreadSubscribed = (value: boolean) => {
      subscribed = value;
    };
    return msg;
  }

  it('writes the flip onto the parent and every reply in that thread', () => {
    const parent = stampable({ id: 42 });
    const replyA = stampable({ id: 43, parentMessageId: 42 });
    const replyB = stampable({ id: 44, parentMessageId: 42 });

    stampThreadSubscription([parent, replyA, replyB], 42, true);

    // Each bubble reads its own flag, so all of them have to be corrected —
    // re-rendering against the parent alone would leave the replies stale.
    expect(parent.isThreadSubscribed()).toBe(true);
    expect(replyA.isThreadSubscribed()).toBe(true);
    expect(replyB.isThreadSubscribed()).toBe(true);
  });

  it('leaves messages from other threads alone', () => {
    const mine = stampable({ id: 42 });
    const other = stampable({ id: 77 });
    const otherReply = stampable({ id: 78, parentMessageId: 77 });

    stampThreadSubscription([mine, other, otherReply], 42, true);

    expect(other.isThreadSubscribed()).toBe(false);
    expect(otherReply.isThreadSubscribed()).toBe(false);
  });

  it('carries an unfollow back too, not just a follow', () => {
    const parent = stampable({ id: 42, subscribed: true });

    stampThreadSubscription([parent], 42, false);

    expect(parent.isThreadSubscribed()).toBe(false);
  });

  it('tolerates nulls and a non-thread id', () => {
    const parent = stampable({ id: 42 });
    // The list passes `[this.parentMessage, ...messages]`, and the parent is
    // absent outside a thread view.
    expect(() => stampThreadSubscription([null, undefined, parent], 42, true)).not.toThrow();
    expect(parent.isThreadSubscribed()).toBe(true);

    stampThreadSubscription([parent], 0, false);
    expect(parent.isThreadSubscribed()).toBe(true);
  });

  it('matches a string id against a numeric one', () => {
    // Some payloads deliver the id as a string; `===` on the raw values would
    // silently no-op every cross-surface update.
    const parent = stampable({ id: 42 });
    (parent as any).getId = () => '42';

    stampThreadSubscription([parent], 42, true);

    expect(parent.isThreadSubscribed()).toBe(true);
  });
});

describe('threadSubscription option — click', () => {
  it('routes to the toggle handler with the message', () => {
    const self = { toggleThreadSubscription: vi.fn() };
    const message = makeMessage();

    handleOptionClickImpl(self, { id: OPTION_ID } as ContextMenuItem, message);

    expect(self.toggleThreadSubscription).toHaveBeenCalledWith(message);
  });

  it('does not open the thread — following is not the same as replying', () => {
    const self = {
      toggleThreadSubscription: vi.fn(),
      threadRepliesClick: { emit: vi.fn() },
    };

    handleOptionClickImpl(self, { id: OPTION_ID } as ContextMenuItem, makeMessage());

    expect(self.threadRepliesClick.emit).not.toHaveBeenCalled();
  });
});
