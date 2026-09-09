/**
 * Extracted getMessageOptions logic for CometChatMessageListComponent.
 */
import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatActionsIcon} from '../../modals/CometChatActionsIcon';
import {CometChatUIKitConstants} from '../../constants';
import {CometChatLocalize} from '../../resources/CometChatLocalize/cometchat-localize';
import {hasMediaCaption} from '../../utils/message-metadata-utils';
import {isPinSaveEligible, isSystemPinned} from '../../utils/pin-save-utils';
import {getSubscriptionTargetId, readThreadSubscribed, toThreadId} from '../../utils/thread-subscription-utils';

/**
 * A message disapproved by moderation shows an error indicator on its bubble and must not be
 * editable — editing would let the sender slip a rejected message back into an approved state.
 * Mirrors the bubble's `isDisapprovedByModeration` getter, guarding the SDK method in case an
 * older Chat SDK build doesn't expose `getModerationStatus`.
 */
function isDisapprovedByModeration(message: CometChat.BaseMessage): boolean {
  const getStatus = (message as any).getModerationStatus;
  if (typeof getStatus !== 'function') return false;
  return getStatus.call(message) === CometChatUIKitConstants.moderationStatus.disapproved;
}

/**
 * A locally-rejected message can have no sender yet, in which case it was authored by the logged-in
 * user — so a missing sender counts as "mine". Mirrors the React kit's `isSentByMe`.
 */
function isSentByMe(loggedInUser: CometChat.User | null, message: CometChat.BaseMessage): boolean {
  const sender = message.getSender();
  return !sender || sender.getUid() === loggedInUser?.getUid();
}

/**
 * Options for a message disapproved by moderation. Matches the React kit's `getMessageOptions`
 * whitelist: a rejected message collapses to at most Delete + Copy — every other action
 * (react/reply/thread/edit/translate/info/flag/message-privately/mark-unread) is stripped so the
 * message can't be re-shared or re-surfaced. Returned directly (no `optionsOverride`), exactly as
 * React returns this list early.
 */
function getModeratedMessageOptions(ctx: MessageOptionsContext, message: CometChat.BaseMessage): CometChatActionsIcon[] {
  const options: CometChatActionsIcon[] = [];
  const isParticipant = ctx.group?.getScope() === CometChatUIKitConstants.groupMemberScope.participant;

  // Delete: the sender can always remove it; in a group a non-participant (moderator/admin/owner)
  // can too. Mirrors React's `(isSentByMe || (!isParticipant && group))`.
  if ((isSentByMe(ctx.loggedInUser, message) || (!isParticipant && !!ctx.group)) && !ctx.hideDeleteMessageOption) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.deleteMessage, title: CometChatLocalize.getLocalizedString('message_list_option_delete'), iconURL: 'assets/delete.svg', onClick: () => {} }));
  }

  // Copy: text messages only (captioned media is NOT copyable here), matching React.
  if (message.getType() === 'text' && !ctx.hideCopyMessageOption) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.copyMessage, title: CometChatLocalize.getLocalizedString('message_list_option_copy'), iconURL: 'assets/Copy.svg', onClick: () => {} }));
  }

  return options;
}

/**
 * The thread a subscription action on this message refers to.
 *
 * On a top-level message that is the message itself — it is the thread's root.
 * On a reply it is the reply's PARENT, never the reply's own id. That
 * distinction is the whole safety property here: CometChat has no nested
 * threads, but the server has no guard either, so subscribing to a reply id
 * returns 200 and writes a row into the user's thread list pointing at a thread
 * that cannot be opened. Resolving to the parent means the option on a reply
 * toggles the thread the user is actually reading.
 */
export function getThreadRootId(message: CometChat.BaseMessage): number {
  return getSubscriptionTargetId(message);
}

/**
 * Whether a thread-subscription option belongs on this message's sheet.
 *
 * Offered in a 1:1 chat as well as a group. A subscription is what decides
 * whether replies in a thread reach you, and unsubscribing genuinely silences
 * them in a 1:1 too — a thread there is just as easy to lose track of as one in
 * a group. The thread header's control is gated the same way.
 *
 * Deliberately NOT gated on `replyCount`: following a message with no replies
 * yet is the point of the option — it is how a user says "tell me when someone
 * answers this" — and the server allows it.
 *
 * Nor is it gated on `parentMessageId`. A reply gets the option too, as a
 * second entry point to the thread the user already has open; what keeps that
 * safe is `getThreadRootId`, which routes the action to the parent thread
 * rather than minting a subscription rooted at the reply.
 */
function canSubscribeToThread(ctx: MessageOptionsContext, _message: CometChat.BaseMessage): boolean {
  return ctx.threadSubscriptionEnabled && !ctx.hideThreadSubscriptionOption;
}

/**
 * Is this message itself a reply inside a thread?
 *
 * Read defensively: this runs while the option list is being built, so a caller
 * passing a partial message must not take the whole list down.
 */
function isThreadReply(message: CometChat.BaseMessage): boolean {
  return toThreadId(
    typeof message?.getParentMessageId === 'function' ? message.getParentMessageId() : 0
  ) > 0;
}

/**
 * Whether this message can carry a pin or a save at all.
 *
 * Excludes the `action` category — a "X joined the group" line is not a message
 * anyone can pin — and anything the user cannot meaningfully act on: a deleted
 * message, one still in flight, or one held by moderation. Thread replies ARE
 * eligible: the backend accepts them and returns the parent for context in the
 * pinned list, so the option belongs inside the thread view too.
 */


/**
 * The Pin/Save actions available on this message, as the children of
 * "Organise". Empty when neither applies — the group is then omitted entirely
 * rather than opening onto nothing.
 *
 * Neither action is scope-gated on the client: Pin is offered to every member
 * and the server decides, refusing with ERR_ACTION_NOT_ALLOWED where the user
 * lacks the permission. Saving is private to the acting user, so it never had a
 * gate to begin with.
 */
function buildOrganiseChildren(
  ctx: MessageOptionsContext,
  message: CometChat.BaseMessage
): CometChatActionsIcon[] {
  if (!ctx.pinMessageEnabled && !ctx.saveMessageEnabled) return [];
  if (!isPinSaveEligible(message, ctx.loggedInUser?.getUid() ?? '')) return [];

  const children: CometChatActionsIcon[] = [];
  const pinned = !!message.getPinnedAt?.();
  const saved = !!message.getSavedAt?.();

  if (ctx.pinMessageEnabled) {
    if (!pinned && !ctx.hidePinMessageOption) {
      children.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.pinMessage, title: CometChatLocalize.getLocalizedString('message_list_option_pin_message'), iconURL: 'assets/keep.svg', onClick: () => {} }));
    } else if (pinned && !ctx.hideUnpinMessageOption && !isSystemPinned(message)) {
      // Anyone may unpin, not just whoever pinned it — but a pin the app placed
      // belongs to no member, and the server refuses to lift it for ANY of them,
      // so that one option is withheld rather than offered to fail.
      children.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.unpinMessage, title: CometChatLocalize.getLocalizedString('message_list_option_unpin_message'), iconURL: 'assets/keep_off.svg', onClick: () => {} }));
    }
  }

  if (ctx.saveMessageEnabled) {
    if (!saved && !ctx.hideSaveMessageOption) {
      children.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.saveMessage, title: CometChatLocalize.getLocalizedString('message_list_option_save_message'), iconURL: 'assets/bookmark.svg', onClick: () => {} }));
    } else if (saved && !ctx.hideUnsaveMessageOption) {
      children.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.unsaveMessage, title: CometChatLocalize.getLocalizedString('message_list_option_unsave_message'), iconURL: 'assets/bookmark_remove.svg', onClick: () => {} }));
    }
  }

  return children;
}

export interface MessageOptionsContext {
  loggedInUser: CometChat.User | null;
  group: CometChat.Group | null | undefined;
  hideReactionOption: boolean;
  hideReplyOption: boolean;
  hideReplyInThreadOption: boolean;
  hideThreadSubscriptionOption: boolean;
  /** The feature gate (§ global config). Off means the option never renders. */
  threadSubscriptionEnabled: boolean;
  hidePinMessageOption: boolean;
  hideUnpinMessageOption: boolean;
  hideSaveMessageOption: boolean;
  hideUnsaveMessageOption: boolean;
  /** App-level feature flags, resolved from the SDK settings. */
  pinMessageEnabled: boolean;
  saveMessageEnabled: boolean;
  hideCopyMessageOption: boolean;
  hideEditMessageOption: boolean;
  hideDeleteMessageOption: boolean;
  hideTranslateMessageOption: boolean;
  hideMessageInfoOption: boolean;
  hideFlagMessageOption: boolean;
  hideMessagePrivatelyOption: boolean;
  showMarkAsUnreadOption: boolean;
  additionalOptions: CometChatActionsIcon[];
  optionsOverride?: ((message: CometChat.BaseMessage, options: CometChatActionsIcon[]) => CometChatActionsIcon[]) | null;
}

export function getMessageOptionsImpl(ctx: MessageOptionsContext, message: CometChat.BaseMessage): CometChatActionsIcon[] {
  if (message.getDeletedAt()) return [];
  // A moderation-rejected message gets the restricted (Delete + Copy) set, matching the React kit.
  if (isDisapprovedByModeration(message)) return getModeratedMessageOptions(ctx, message);

  // Agentic messages (AI agent in group) get copy-only context menu
  if (message.getCategory() === CometChatUIKitConstants.MessageCategory.agentic) {
    if (ctx.hideCopyMessageOption) return [];
    return [
      new CometChatActionsIcon({
        id: CometChatUIKitConstants.MessageOption.copyMessage,
        title: CometChatLocalize.getLocalizedString('message_list_option_copy'),
        iconURL: 'assets/Copy.svg',
        onClick: () => {},
      }),
    ];
  }

  const options: CometChatActionsIcon[] = [];
  if (!ctx.hideReactionOption) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.reactToMessage, title: CometChatLocalize.getLocalizedString('message_list_option_react'), iconURL: 'assets/add_reaction_icon.svg', onClick: () => {} }));
  }
  if (!ctx.hideReplyOption && !message.getDeletedAt()) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.replyMessage, title: CometChatLocalize.getLocalizedString('message_list_option_reply_to_message'), iconURL: 'assets/reply.svg', onClick: () => {} }));
  }
  // Withheld on a message that is ALREADY a thread reply: CometChat has no
  // nested threads, so the action has nowhere to go — it would either reopen the
  // thread the user is reading or mint a second one rooted at a reply. Thread
  // subscription below is deliberately NOT gated this way; inside a thread it
  // still applies, to the parent.
  if (!ctx.hideReplyInThreadOption && !isThreadReply(message)) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.replyInThread, title: CometChatLocalize.getLocalizedString('message_list_option_reply_in_thread'), iconURL: 'assets/reply_in_thread.svg', onClick: () => {} }));
  }
  // Sits immediately after Reply in thread so the two thread actions stay together.
  // One option id whose title flips on state — two ids would need the same state
  // lookup anyway and add a class of stale-id bugs.
  if (canSubscribeToThread(ctx, message)) {
    // Read off the message itself: the server stamps the flag on every fetched
    // message in a thread, and a bus flip is written back onto the held objects,
    // so this is current without consulting anything else.
    const following = readThreadSubscribed(message);
    options.push(new CometChatActionsIcon({
      id: CometChatUIKitConstants.MessageOption.threadSubscription,
      // Names what tapping does, and uses the same wording as the thread
      // header's control so the two surfaces read alike.
      title: CometChatLocalize.getLocalizedString(
        following ? 'thread_subscription_unsubscribe' : 'thread_subscription_subscribe'
      ),
      iconURL: following ? 'assets/thread_notifications_off.svg' : 'assets/thread_notifications.svg',
      onClick: () => {},
    }));
  }
  // Copy and Edit act on the message's TEXT. A text message always has one; a media message has
  // one only when it carries a caption — so captioned media gets both options too (matching the
  // React kit's getMediaMessageOptions).
  const isTextual = message.getType() === 'text' || hasMediaCaption(message);
  if (!ctx.hideCopyMessageOption && isTextual) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.copyMessage, title: CometChatLocalize.getLocalizedString('message_list_option_copy'), iconURL: 'assets/Copy.svg', onClick: () => {} }));
  }
  const sender = message.getSender();
  const isOwnMessage = ctx.loggedInUser && sender?.getUid() === ctx.loggedInUser.getUid();
  if (!ctx.hideEditMessageOption && isOwnMessage && isTextual) {
    options.push(new CometChatActionsIcon({ id: 'edit', title: CometChatLocalize.getLocalizedString('message_list_option_edit'), iconURL: 'assets/edit_icon.svg', onClick: () => {} }));
  }
  if (!ctx.hideDeleteMessageOption && isOwnMessage) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.deleteMessage, title: CometChatLocalize.getLocalizedString('message_list_option_delete'), iconURL: 'assets/delete.svg', onClick: () => {} }));
  }
  // "Organise ▸" gathers Pin and Save into one flyout, so two related actions
  // cost one row in an already long menu. It sits before Translate, matching
  // the design. Each child is a single action rather than a toggling title:
  // `pinnedAt` being present IS the boolean, so the menu shows Pin OR Unpin
  // and there is no third "unknown" state to render.
  const organiseChildren = buildOrganiseChildren(ctx, message);
  if (organiseChildren.length) {
    options.push(new CometChatActionsIcon({
      id: CometChatUIKitConstants.MessageOption.organise,
      title: CometChatLocalize.getLocalizedString('message_list_option_organise'),
      iconURL: 'assets/archive.svg',
      // A group opens its children; it never acts on its own.
      onClick: () => {},
      children: organiseChildren,
    }));
  }

  if (!ctx.hideTranslateMessageOption && message.getType() === 'text') {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.translateMessage, title: CometChatLocalize.getLocalizedString('message_list_option_translate'), iconURL: 'assets/translate.svg', onClick: () => {} }));
  }
  if (!ctx.hideMessageInfoOption && isOwnMessage) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.messageInformation, title: CometChatLocalize.getLocalizedString('message_list_option_info'), iconURL: 'assets/info_icon.svg', onClick: () => {} }));
  }
  // Developer cards get the same option set as text *minus* edit + copy
  // (both already gated to type==='text' above, so cards naturally exclude them).
  // flag / mark-as-unread are message-category-gated; include the card category so
  // a card matches the text option set, preserving the existing per-option conditions.
  const isMessageOrCard =
    message.getCategory() === CometChatUIKitConstants.MessageCategory.message ||
    message.getCategory() === CometChatUIKitConstants.MessageCategory.card;
  if (!ctx.hideFlagMessageOption && !isOwnMessage && isMessageOrCard) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.flagMessage, title: CometChatLocalize.getLocalizedString('message_list_option_flag_message'), iconURL: 'assets/flags.svg', onClick: () => {} }));
  }
  if (!ctx.hideMessagePrivatelyOption && ctx.group && !isOwnMessage) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.sendMessagePrivately, title: CometChatLocalize.getLocalizedString('message_list_option_message_privately'), iconURL: 'assets/send_message_privately.svg', onClick: () => {} }));
  }
  if (ctx.showMarkAsUnreadOption && !isOwnMessage && !message.getDeletedAt() && isMessageOrCard) {
    options.push(new CometChatActionsIcon({ id: CometChatUIKitConstants.MessageOption.markAsUnread, title: CometChatLocalize.getLocalizedString('message_list_option_mark_as_unread'), iconURL: 'assets/mark_as_unread.svg', onClick: () => {} }));
  }
  if (ctx.additionalOptions.length > 0) { options.push(...ctx.additionalOptions); }
  if (ctx.optionsOverride) { return ctx.optionsOverride(message, options); }
  return options;
}
