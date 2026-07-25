/**
 * cometchat-message-list.option-builders Tests
 *
 * Covers: getMessageOptionsImpl — all option inclusion/exclusion rules,
 *         deleted messages, own vs other messages, optionsOverride.
 *
 * @module components/cometchat-message-list/option-builders
 */

import { describe, it, expect, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { getMessageOptionsImpl, MessageOptionsContext } from './cometchat-message-list.option-builders';
import { CometChatUIKitConstants } from '../../constants';
import { CometChatActionsIcon } from '../../modals/CometChatActionsIcon';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(uid: string): CometChat.User {
  const u = new CometChat.User(uid);
  u.setName(`User ${uid}`);
  return u;
}

function makeGroup(guid: string): CometChat.Group {
  return new CometChat.Group(guid, `Group ${guid}`, CometChat.GROUP_TYPE.PUBLIC, '');
}

function makeTextMessage(senderUid: string, opts: { deletedAt?: number } = {}): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('receiver1', 'Hello', CometChat.RECEIVER_TYPE.USER);
  msg.setSender(makeUser(senderUid));
  (msg as any).getType = () => 'text';
  (msg as any).getCategory = () => CometChatUIKitConstants.MessageCategory.message;
  if (opts.deletedAt) {
    (msg as any).deletedAt = opts.deletedAt;
    (msg as any).getDeletedAt = () => opts.deletedAt;
  }
  return msg as unknown as CometChat.BaseMessage;
}

function makeImageMessage(senderUid: string): CometChat.BaseMessage {
  const msg = new CometChat.MediaMessage('receiver1', {} as File, 'image', CometChat.RECEIVER_TYPE.USER);
  msg.setSender(makeUser(senderUid));
  (msg as any).getType = () => 'image';
  (msg as any).getCategory = () => CometChatUIKitConstants.MessageCategory.message;
  return msg as unknown as CometChat.BaseMessage;
}

function defaultCtx(overrides: Partial<MessageOptionsContext> = {}): MessageOptionsContext {
  return {
    loggedInUser: makeUser('loggedIn'),
    group: null,
    hideReactionOption: false,
    hideReplyOption: false,
    hideReplyInThreadOption: false,
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

// ---------------------------------------------------------------------------
// Multi-attachment: captioned-media Copy/Edit + moderation (React parity)
// ---------------------------------------------------------------------------

const ME = { getUid: () => 'me' } as any;

function ctx(over: Partial<MessageOptionsContext> = {}): MessageOptionsContext {
  return {
    loggedInUser: ME,
    group: null,
    hideReactionOption: false,
    hideReplyOption: false,
    hideReplyInThreadOption: false,
    hideCopyMessageOption: false,
    hideEditMessageOption: false,
    hideDeleteMessageOption: false,
    hideTranslateMessageOption: false,
    hideMessageInfoOption: false,
    hideFlagMessageOption: false,
    hideMessagePrivatelyOption: false,
    showMarkAsUnreadOption: false,
    additionalOptions: [],
    ...over,
  } as MessageOptionsContext;
}

function mkMessage(over: { type?: string; caption?: string; ownedByMe?: boolean; moderationStatus?: string } = {}): any {
  const message: any = {
    getType: () => over.type ?? 'image',
    getCategory: () => 'message',
    getDeletedAt: () => undefined,
    getSender: () => ({ getUid: () => (over.ownedByMe === false ? 'other' : 'me') }),
    getCaption: () => over.caption ?? '',
    getData: () => undefined,
    getMetadata: () => null,
  };
  if (over.moderationStatus !== undefined) {
    message.getModerationStatus = () => over.moderationStatus;
  }
  return message;
}

const ids = (message: any, c = ctx()) => getMessageOptionsImpl(c, message).map(o => o.id);

describe('getMessageOptionsImpl — Copy/Edit on captioned media (React parity)', () => {
  it('offers Copy and Edit on a media message WITH a caption', () => {
    const options = ids(mkMessage({ type: 'image', caption: 'nice trip' }));
    expect(options).toContain('copy');
    expect(options).toContain('edit');
  });

  it('offers neither on a media message WITHOUT a caption', () => {
    const options = ids(mkMessage({ type: 'image', caption: '' }));
    expect(options).not.toContain('copy');
    expect(options).not.toContain('edit');
  });

  it('treats a blank-only caption as no caption', () => {
    const options = ids(mkMessage({ type: 'image', caption: '   ' }));
    expect(options).not.toContain('copy');
    expect(options).not.toContain('edit');
  });

  it('applies to every media type', () => {
    for (const type of ['image', 'video', 'audio', 'file']) {
      const options = ids(mkMessage({ type, caption: 'hi' }));
      expect(options, type).toContain('copy');
      expect(options, type).toContain('edit');
    }
  });

  it('Edit stays sender-only; Copy does not', () => {
    const notMine = mkMessage({ type: 'image', caption: 'hi', ownedByMe: false });
    const options = ids(notMine);
    expect(options).toContain('copy');
    expect(options).not.toContain('edit');
  });

  it('still honours the hide flags', () => {
    const message = mkMessage({ type: 'image', caption: 'hi' });
    expect(ids(message, ctx({ hideCopyMessageOption: true }))).not.toContain('copy');
    expect(ids(message, ctx({ hideEditMessageOption: true }))).not.toContain('edit');
  });

  it('does not leak Translate onto media (text-only, as before)', () => {
    expect(ids(mkMessage({ type: 'image', caption: 'hi' }))).not.toContain('translate');
    expect(ids(mkMessage({ type: 'text', caption: '' }))).toContain('translate');
  });

  it('text messages keep Copy and Edit regardless of caption', () => {
    const options = ids(mkMessage({ type: 'text' }));
    expect(options).toContain('copy');
    expect(options).toContain('edit');
  });
});

describe('getMessageOptionsImpl — disapproved collapses to Delete + Copy (React parity)', () => {
  const M = CometChatUIKitConstants.moderationStatus;
  const PARTICIPANT = CometChatUIKitConstants.groupMemberScope.participant;
  const group = (scope: string) => ({ getScope: () => scope }) as any;

  it('a disapproved text message (mine) yields EXACTLY Delete + Copy — nothing else', () => {
    const options = ids(mkMessage({ type: 'text', moderationStatus: M.disapproved }));
    expect(options.sort()).toEqual(['copy', 'delete']);
  });

  it('strips every other action (react / reply / thread / translate / info / flag / mark-unread)', () => {
    const options = ids(
      mkMessage({ type: 'text', moderationStatus: M.disapproved }),
      ctx({ showMarkAsUnreadOption: true }),
    );
    for (const gone of ['react', 'reply', 'replyInThread', 'edit', 'translate', 'info', 'flagMessage', 'markAsUnread']) {
      expect(options, gone).not.toContain(gone);
    }
  });

  it('Copy appears only for text — captioned media disapproved gives Delete only', () => {
    const options = ids(mkMessage({ type: 'image', caption: 'hi', moderationStatus: M.disapproved }));
    expect(options).toEqual(['delete']);
    expect(options).not.toContain('copy');
  });

  it('Copy is not sender-gated — a disapproved text from someone else still offers Copy', () => {
    const options = ids(mkMessage({ type: 'text', ownedByMe: false, moderationStatus: M.disapproved }));
    expect(options).toContain('copy');
  });

  describe('Delete visibility mirrors React (isSentByMe || (!isParticipant && group))', () => {
    it('shown for my own message (no group)', () => {
      expect(ids(mkMessage({ type: 'text', moderationStatus: M.disapproved }))).toContain('delete');
    });

    it('hidden for another user in a 1:1 (not mine, no group)', () => {
      const options = ids(mkMessage({ type: 'image', ownedByMe: false, moderationStatus: M.disapproved }));
      expect(options).not.toContain('delete');
    });

    it('shown for another user when I am a non-participant (moderator/admin) in a group', () => {
      const c = ctx({ group: group('admin') });
      const options = ids(mkMessage({ type: 'image', ownedByMe: false, moderationStatus: M.disapproved }), c);
      expect(options).toContain('delete');
    });

    it('hidden for another user when I am only a participant in a group', () => {
      const c = ctx({ group: group(PARTICIPANT) });
      const options = ids(mkMessage({ type: 'image', ownedByMe: false, moderationStatus: M.disapproved }), c);
      expect(options).not.toContain('delete');
    });
  });

  it('honours hideDeleteMessageOption / hideCopyMessageOption', () => {
    const message = mkMessage({ type: 'text', moderationStatus: M.disapproved });
    expect(ids(message, ctx({ hideDeleteMessageOption: true }))).not.toContain('delete');
    expect(ids(message, ctx({ hideCopyMessageOption: true }))).not.toContain('copy');
  });

  it('does NOT restrict approved / pending / unmoderated messages', () => {
    for (const status of [M.approved, M.pending, M.unmoderated]) {
      const options = ids(mkMessage({ type: 'text', moderationStatus: status }));
      expect(options, String(status)).toContain('edit');
      expect(options, String(status)).toContain('react');
    }
  });
});

describe('cometchat-message-list.option-builders', () => {

  // ==================== Deleted messages ====================

  describe('deleted messages', () => {
    it('should return empty array for a deleted message', () => {
      const ctx = defaultCtx();
      const msg = makeTextMessage('loggedIn', { deletedAt: Date.now() });
      expect(getMessageOptionsImpl(ctx, msg)).toEqual([]);
    });
  });

  // ==================== Reaction option ====================

  describe('reaction option', () => {
    it('should include react option by default', () => {
      const ctx = defaultCtx();
      const msg = makeTextMessage('other');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).toContain(CometChatUIKitConstants.MessageOption.reactToMessage);
    });

    it('should exclude react option when hideReactionOption=true', () => {
      const ctx = defaultCtx({ hideReactionOption: true });
      const msg = makeTextMessage('other');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.reactToMessage);
    });
  });

  // ==================== Reply option ====================

  describe('reply option', () => {
    it('should include reply option by default', () => {
      const ctx = defaultCtx();
      const msg = makeTextMessage('other');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).toContain(CometChatUIKitConstants.MessageOption.replyMessage);
    });

    it('should exclude reply option when hideReplyOption=true', () => {
      const ctx = defaultCtx({ hideReplyOption: true });
      const msg = makeTextMessage('other');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.replyMessage);
    });
  });

  // ==================== Reply in thread option ====================

  describe('reply in thread option', () => {
    it('should include reply-in-thread option by default', () => {
      const ctx = defaultCtx();
      const msg = makeTextMessage('other');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).toContain(CometChatUIKitConstants.MessageOption.replyInThread);
    });

    it('should exclude reply-in-thread when hideReplyInThreadOption=true', () => {
      const ctx = defaultCtx({ hideReplyInThreadOption: true });
      const msg = makeTextMessage('other');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.replyInThread);
    });
  });

  // ==================== Copy option ====================

  describe('copy option', () => {
    it('should include copy option for text messages', () => {
      const ctx = defaultCtx();
      const msg = makeTextMessage('other');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).toContain(CometChatUIKitConstants.MessageOption.copyMessage);
    });

    it('should exclude copy option for non-text messages', () => {
      const ctx = defaultCtx();
      const msg = makeImageMessage('other');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.copyMessage);
    });

    it('should exclude copy option when hideCopyMessageOption=true', () => {
      const ctx = defaultCtx({ hideCopyMessageOption: true });
      const msg = makeTextMessage('other');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.copyMessage);
    });
  });

  // ==================== Edit option ====================

  describe('edit option', () => {
    it('should include edit option for own text messages', () => {
      const ctx = defaultCtx();
      const msg = makeTextMessage('loggedIn');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).toContain('edit');
    });

    it('should exclude edit option for other users messages', () => {
      const ctx = defaultCtx();
      const msg = makeTextMessage('other');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).not.toContain('edit');
    });

    it('should exclude edit option for own non-text messages', () => {
      const ctx = defaultCtx();
      const msg = makeImageMessage('loggedIn');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).not.toContain('edit');
    });

    it('should exclude edit option when hideEditMessageOption=true', () => {
      const ctx = defaultCtx({ hideEditMessageOption: true });
      const msg = makeTextMessage('loggedIn');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).not.toContain('edit');
    });
  });

  // ==================== Delete option ====================

  describe('delete option', () => {
    it('should include delete option for own messages', () => {
      const ctx = defaultCtx();
      const msg = makeTextMessage('loggedIn');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).toContain(CometChatUIKitConstants.MessageOption.deleteMessage);
    });

    it('should exclude delete option for other users messages', () => {
      const ctx = defaultCtx();
      const msg = makeTextMessage('other');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.deleteMessage);
    });

    it('should exclude delete option when hideDeleteMessageOption=true', () => {
      const ctx = defaultCtx({ hideDeleteMessageOption: true });
      const msg = makeTextMessage('loggedIn');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.deleteMessage);
    });
  });

  // ==================== Translate option ====================

  describe('translate option', () => {
    it('should include translate option for text messages', () => {
      const ctx = defaultCtx();
      const msg = makeTextMessage('other');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).toContain(CometChatUIKitConstants.MessageOption.translateMessage);
    });

    it('should exclude translate option for non-text messages', () => {
      const ctx = defaultCtx();
      const msg = makeImageMessage('other');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.translateMessage);
    });

    it('should exclude translate option when hideTranslateMessageOption=true', () => {
      const ctx = defaultCtx({ hideTranslateMessageOption: true });
      const msg = makeTextMessage('other');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.translateMessage);
    });
  });

  // ==================== Message info option ====================

  describe('message info option', () => {
    it('should include info option for own messages', () => {
      const ctx = defaultCtx();
      const msg = makeTextMessage('loggedIn');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).toContain('info');
    });

    it('should exclude info option for other users messages', () => {
      const ctx = defaultCtx();
      const msg = makeTextMessage('other');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).not.toContain('info');
    });

    it('should exclude info option when hideMessageInfoOption=true', () => {
      const ctx = defaultCtx({ hideMessageInfoOption: true });
      const msg = makeTextMessage('loggedIn');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).not.toContain('info');
    });
  });

  // ==================== Flag option ====================

  describe('flag option', () => {
    it('should include flag option for other users messages', () => {
      const ctx = defaultCtx();
      const msg = makeTextMessage('other');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).toContain(CometChatUIKitConstants.MessageOption.flagMessage);
    });

    it('should exclude flag option for own messages', () => {
      const ctx = defaultCtx();
      const msg = makeTextMessage('loggedIn');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.flagMessage);
    });

    it('should exclude flag option when hideFlagMessageOption=true', () => {
      const ctx = defaultCtx({ hideFlagMessageOption: true });
      const msg = makeTextMessage('other');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.flagMessage);
    });
  });

  // ==================== Message privately option ====================

  describe('message privately option', () => {
    it('should include message-privately option in group context for other users', () => {
      const ctx = defaultCtx({ group: makeGroup('group1') });
      const msg = makeTextMessage('other');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).toContain(CometChatUIKitConstants.MessageOption.sendMessagePrivately);
    });

    it('should exclude message-privately option when no group', () => {
      const ctx = defaultCtx({ group: null });
      const msg = makeTextMessage('other');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.sendMessagePrivately);
    });

    it('should exclude message-privately option for own messages', () => {
      const ctx = defaultCtx({ group: makeGroup('group1') });
      const msg = makeTextMessage('loggedIn');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.sendMessagePrivately);
    });

    it('should exclude message-privately when hideMessagePrivatelyOption=true', () => {
      const ctx = defaultCtx({ group: makeGroup('group1'), hideMessagePrivatelyOption: true });
      const msg = makeTextMessage('other');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.sendMessagePrivately);
    });
  });

  // ==================== Mark as unread option ====================

  describe('mark as unread option', () => {
    it('should include mark-as-unread when showMarkAsUnreadOption=true for receiver messages', () => {
      const ctx = defaultCtx({ showMarkAsUnreadOption: true });
      const msg = makeTextMessage('other');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).toContain(CometChatUIKitConstants.MessageOption.markAsUnread);
    });

    it('should exclude mark-as-unread for own messages', () => {
      const ctx = defaultCtx({ showMarkAsUnreadOption: true });
      const msg = makeTextMessage('loggedIn');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.markAsUnread);
    });

    it('should exclude mark-as-unread when showMarkAsUnreadOption=false', () => {
      const ctx = defaultCtx({ showMarkAsUnreadOption: false });
      const msg = makeTextMessage('other');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.markAsUnread);
    });
  });

  // ==================== additionalOptions ====================

  describe('additionalOptions', () => {
    it('should append additional options to the list', () => {
      const extra = new CometChatActionsIcon({ id: 'custom-action', title: 'Custom', iconURL: '', onClick: () => {} });
      const ctx = defaultCtx({ additionalOptions: [extra] });
      const msg = makeTextMessage('other');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map((o: any) => o.id);
      expect(ids).toContain('custom-action');
    });
  });

  // ==================== optionsOverride ====================

  describe('optionsOverride', () => {
    it('should call optionsOverride and return its result', () => {
      const override = vi.fn().mockReturnValue([]);
      const ctx = defaultCtx({ optionsOverride: override });
      const msg = makeTextMessage('other');
      const result = getMessageOptionsImpl(ctx, msg);
      expect(override).toHaveBeenCalledTimes(1);
      expect(override).toHaveBeenCalledWith(msg, expect.any(Array));
      expect(result).toEqual([]);
    });

    it('should pass the built options array to optionsOverride', () => {
      const capturedOptions: any[] = [];
      const override = vi.fn().mockImplementation((_msg: any, opts: any[]) => {
        capturedOptions.push(...opts);
        return opts;
      });
      const ctx = defaultCtx({ optionsOverride: override });
      const msg = makeTextMessage('other');
      getMessageOptionsImpl(ctx, msg);
      expect(capturedOptions.length).toBeGreaterThan(0);
    });
  });

  // ==================== Agentic messages ====================

  describe('agentic messages', () => {
    function makeAgenticMessage(senderUid: string, opts: { deletedAt?: number } = {}): CometChat.BaseMessage {
      const msg = new CometChat.TextMessage('receiver1', '', CometChat.RECEIVER_TYPE.GROUP);
      msg.setSender(makeUser(senderUid));
      (msg as any).getType = () => CometChatUIKitConstants.MessageTypes.assistant;
      (msg as any).getCategory = () => CometChatUIKitConstants.MessageCategory.agentic;
      if (opts.deletedAt) {
        (msg as any).deletedAt = opts.deletedAt;
        (msg as any).getDeletedAt = () => opts.deletedAt;
      }
      return msg as unknown as CometChat.BaseMessage;
    }

    it('should return only copy option for agentic messages', () => {
      const ctx = defaultCtx();
      const msg = makeAgenticMessage('agent-bot');
      const options = getMessageOptionsImpl(ctx, msg);
      expect(options).toHaveLength(1);
      expect(options[0].id).toBe(CometChatUIKitConstants.MessageOption.copyMessage);
    });

    it('should return empty array for agentic messages when hideCopyMessageOption=true', () => {
      const ctx = defaultCtx({ hideCopyMessageOption: true });
      const msg = makeAgenticMessage('agent-bot');
      const options = getMessageOptionsImpl(ctx, msg);
      expect(options).toEqual([]);
    });

    it('should return empty array for deleted agentic messages', () => {
      const ctx = defaultCtx();
      const msg = makeAgenticMessage('agent-bot', { deletedAt: Date.now() });
      const options = getMessageOptionsImpl(ctx, msg);
      expect(options).toEqual([]);
    });

    it('should not include reaction, reply, thread, or other options for agentic messages', () => {
      const ctx = defaultCtx({ group: makeGroup('group1') });
      const msg = makeAgenticMessage('agent-bot');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.reactToMessage);
      expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.replyMessage);
      expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.replyInThread);
      expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.translateMessage);
      expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.sendMessagePrivately);
    });
  });

  // ==================== loggedInUser null ====================

  describe('loggedInUser null', () => {
    it('should not include own-message options when loggedInUser is null', () => {
      const ctx = defaultCtx({ loggedInUser: null });
      const msg = makeTextMessage('loggedIn');
      const options = getMessageOptionsImpl(ctx, msg);
      const ids = options.map(o => o.id);
      expect(ids).not.toContain('edit');
      expect(ids).not.toContain(CometChatUIKitConstants.MessageOption.deleteMessage);
    });
  });
});
