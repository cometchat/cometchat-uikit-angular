/**
 * cometchat-message-composer.send-utils Tests
 *
 * Covers: extractMentionedUsersImpl, applyTextFormattersImpl,
 *         buildMessageMetadataImpl, handleEditMessageImpl,
 *         handleSendNewMessageImpl (text, media, reply, error paths).
 *
 * @module components/cometchat-message-composer/send-utils
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  extractMentionedUsersImpl,
  applyTextFormattersImpl,
  buildMessageMetadataImpl,
  handleEditMessageImpl,
  handleSendNewMessageImpl,
  SendUtilsContext,
} from './cometchat-message-composer.send-utils';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import { MessageStatus } from '../../Enums/Enums';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(uid: string, name = `User ${uid}`): CometChat.User {
  const u = new CometChat.User(uid);
  u.setName(name);
  return u;
}

function makeTextMessage(text = 'Hello'): CometChat.TextMessage {
  return new CometChat.TextMessage('receiver1', text, CometChat.RECEIVER_TYPE.USER);
}

function makeBaseCtx(overrides: Partial<SendUtilsContext> = {}): SendUtilsContext {
  const composerTextSignal = { value: 'Hello', set: vi.fn((v: string) => { composerTextSignal.value = v; }) };
  const mockService = {
    sendTextMessage: vi.fn().mockResolvedValue(makeTextMessage()),
    sendMediaMessage: vi.fn().mockResolvedValue(new CometChat.MediaMessage('r1', {} as File, 'image', CometChat.RECEIVER_TYPE.USER)),
    editMessage: vi.fn().mockResolvedValue(makeTextMessage('Edited')),
  };

  return {
    parentMessageId: undefined,
    disableMentions: false,
    mentionedUsersMap: new Map(),
    mentionSuggestions: vi.fn().mockReturnValue([]),
    customRichTextEditor: null,
    richTextEditorService: { getUniqueMentionUids: vi.fn().mockReturnValue(new Set()) },
    plainTextMentionUids: new Set(),
    composerText: vi.fn().mockReturnValue('Hello'),
    messageToReplySignal: vi.fn().mockReturnValue(null),
    messageToEdit: null,
    textMessageToEdit: vi.fn().mockReturnValue(null),
    isInEditMode: vi.fn().mockReturnValue(false),
    isEditMode: { set: vi.fn() },
    textFormatterArray: vi.fn().mockReturnValue([]),
    messageComposerService: mockService as any,
    clearComposer: vi.fn(),
    resetMentionsFormatter: vi.fn(),
    exitReplyMode: vi.fn(),
    playOutgoingMessageSound: vi.fn(),
    emitError: vi.fn(),
    getMediaMessageType: vi.fn().mockReturnValue('image'),
    sendButtonClick: { emit: vi.fn() },
    announceMessageSent: vi.fn(),
    closePreview: { emit: vi.fn() },
    textChange: { emit: vi.fn() },
    ...overrides,
  };
}

describe('cometchat-message-composer.send-utils', () => {

  // ==================== buildMessageMetadataImpl ====================

  describe('buildMessageMetadataImpl', () => {
    it('should return undefined', () => {
      const ctx = makeBaseCtx();
      expect(buildMessageMetadataImpl(ctx)).toBeUndefined();
    });
  });

  // ==================== extractMentionedUsersImpl ====================

  describe('extractMentionedUsersImpl', () => {
    it('should return empty array when disableMentions=true', () => {
      const ctx = makeBaseCtx({ disableMentions: true });
      expect(extractMentionedUsersImpl(ctx)).toEqual([]);
    });

    it('should return empty array when no mentions in text', () => {
      const ctx = makeBaseCtx({ composerText: vi.fn().mockReturnValue('Hello world') });
      expect(extractMentionedUsersImpl(ctx)).toEqual([]);
    });

    it('should extract users from mentionedUsersMap when UIDs appear in text', () => {
      const user = makeUser('uid1', 'Alice');
      const ctx = makeBaseCtx({
        mentionedUsersMap: new Map([['uid1', user]]),
        composerText: vi.fn().mockReturnValue('<@uid:uid1>'),
        plainTextMentionUids: new Set(['uid1']),
      });
      const result = extractMentionedUsersImpl(ctx);
      expect(result.length).toBe(1);
      expect(result[0].getUid()).toBe('uid1');
    });

    it('should extract users from plainTextMentionUids', () => {
      const user = makeUser('uid2', 'Bob');
      const ctx = makeBaseCtx({
        mentionedUsersMap: new Map([['uid2', user]]),
        plainTextMentionUids: new Set(['uid2']),
        composerText: vi.fn().mockReturnValue('Hello @Bob'),
      });
      const result = extractMentionedUsersImpl(ctx);
      expect(result.length).toBe(1);
      expect(result[0].getUid()).toBe('uid2');
    });

    it('should not duplicate users mentioned multiple times', () => {
      const user = makeUser('uid1', 'Alice');
      const ctx = makeBaseCtx({
        mentionedUsersMap: new Map([['uid1', user]]),
        plainTextMentionUids: new Set(['uid1']),
        composerText: vi.fn().mockReturnValue('<@uid:uid1> <@uid:uid1>'),
      });
      const result = extractMentionedUsersImpl(ctx);
      expect(result.length).toBe(1);
    });

    it('should extract users from mentionSuggestions entities', () => {
      const user = makeUser('uid3', 'Charlie');
      const ctx = makeBaseCtx({
        mentionSuggestions: vi.fn().mockReturnValue([{ uid: 'uid3', entity: user }]),
        composerText: vi.fn().mockReturnValue('<@uid:uid3>'),
      });
      const result = extractMentionedUsersImpl(ctx);
      expect(result.length).toBe(1);
      expect(result[0].getUid()).toBe('uid3');
    });

    it('should use rich text editor UIDs when customRichTextEditor is set', () => {
      const user = makeUser('uid4', 'Dave');
      const mockEditor = {};
      const ctx = makeBaseCtx({
        customRichTextEditor: mockEditor,
        richTextEditorService: { getUniqueMentionUids: vi.fn().mockReturnValue(new Set(['uid4'])) },
        mentionedUsersMap: new Map([['uid4', user]]),
        composerText: vi.fn().mockReturnValue(''),
      });
      const result = extractMentionedUsersImpl(ctx);
      expect(result.length).toBe(1);
      expect(result[0].getUid()).toBe('uid4');
    });
  });

  // ==================== applyTextFormattersImpl ====================

  describe('applyTextFormattersImpl', () => {
    it('should return the message unchanged when no formatters', () => {
      const ctx = makeBaseCtx({ textFormatterArray: vi.fn().mockReturnValue([]) });
      const msg = makeTextMessage('Hello');
      const result = applyTextFormattersImpl(ctx, msg);
      expect(result).toBe(msg);
    });

    it('should apply formatters that have formatMessageForSending', () => {
      const formattedMsg = makeTextMessage('Formatted');
      const formatter = { formatMessageForSending: vi.fn().mockReturnValue(formattedMsg) };
      const ctx = makeBaseCtx({ textFormatterArray: vi.fn().mockReturnValue([formatter]) });
      const msg = makeTextMessage('Hello');
      const result = applyTextFormattersImpl(ctx, msg);
      expect(formatter.formatMessageForSending).toHaveBeenCalledWith(msg);
      expect(result).toBe(formattedMsg);
    });

    it('should skip formatters without formatMessageForSending', () => {
      const formatter = {}; // no formatMessageForSending
      const ctx = makeBaseCtx({ textFormatterArray: vi.fn().mockReturnValue([formatter]) });
      const msg = makeTextMessage('Hello');
      const result = applyTextFormattersImpl(ctx, msg);
      expect(result).toBe(msg);
    });

    it('should chain multiple formatters', () => {
      const msg1 = makeTextMessage('Step1');
      const msg2 = makeTextMessage('Step2');
      const f1 = { formatMessageForSending: vi.fn().mockReturnValue(msg1) };
      const f2 = { formatMessageForSending: vi.fn().mockReturnValue(msg2) };
      const ctx = makeBaseCtx({ textFormatterArray: vi.fn().mockReturnValue([f1, f2]) });
      const original = makeTextMessage('Hello');
      const result = applyTextFormattersImpl(ctx, original);
      expect(f1.formatMessageForSending).toHaveBeenCalledWith(original);
      expect(f2.formatMessageForSending).toHaveBeenCalledWith(msg1);
      expect(result).toBe(msg2);
    });
  });

  // ==================== handleEditMessageImpl ====================

  describe('handleEditMessageImpl', () => {
    it('should call editMessage on the service', async () => {
      const ctx = makeBaseCtx();
      const msgToEdit = makeTextMessage('Original');
      await handleEditMessageImpl(ctx, 'Edited text', msgToEdit);
      expect(ctx.messageComposerService.editMessage).toHaveBeenCalledWith(msgToEdit, 'Edited text');
    });

    it('should emit sendButtonClick with the edited message', async () => {
      const ctx = makeBaseCtx();
      const msgToEdit = makeTextMessage('Original');
      await handleEditMessageImpl(ctx, 'Edited', msgToEdit);
      expect(ctx.sendButtonClick.emit).toHaveBeenCalledTimes(1);
    });

    it('should call announceMessageSent after successful edit', async () => {
      const ctx = makeBaseCtx();
      const msgToEdit = makeTextMessage('Original');
      await handleEditMessageImpl(ctx, 'Edited', msgToEdit);
      expect(ctx.announceMessageSent).toHaveBeenCalledTimes(1);
    });

    it('should call playOutgoingMessageSound after successful edit', async () => {
      const ctx = makeBaseCtx();
      const msgToEdit = makeTextMessage('Original');
      await handleEditMessageImpl(ctx, 'Edited', msgToEdit);
      expect(ctx.playOutgoingMessageSound).toHaveBeenCalledTimes(1);
    });

    it('should emit error event when editMessage fails', async () => {
      const error = new Error('Edit failed');
      const ctx = makeBaseCtx({
        messageComposerService: {
          editMessage: vi.fn().mockRejectedValue(error),
        } as any,
      });
      const msgToEdit = makeTextMessage('Original');
      await handleEditMessageImpl(ctx, 'Edited', msgToEdit);
      expect(ctx.emitError).toHaveBeenCalledWith(error);
    });

    it('should return early when messageToEdit is null/undefined', async () => {
      const ctx = makeBaseCtx();
      await handleEditMessageImpl(ctx, 'Edited', null as any);
      expect(ctx.messageComposerService.editMessage).not.toHaveBeenCalled();
    });

    it('should emit ccMessageEdited success event', async () => {
      const ctx = makeBaseCtx();
      const msgToEdit = makeTextMessage('Original');
      const eventSpy = vi.fn();
      const sub = CometChatMessageEvents.ccMessageEdited.subscribe(eventSpy);
      await handleEditMessageImpl(ctx, 'Edited', msgToEdit);
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: MessageStatus.success })
      );
      sub.unsubscribe();
    });

    it('should emit ccMessageEdited error event when edit fails', async () => {
      const ctx = makeBaseCtx({
        messageComposerService: {
          editMessage: vi.fn().mockRejectedValue(new Error('fail')),
        } as any,
      });
      const msgToEdit = makeTextMessage('Original');
      const eventSpy = vi.fn();
      const sub = CometChatMessageEvents.ccMessageEdited.subscribe(eventSpy);
      await handleEditMessageImpl(ctx, 'Edited', msgToEdit);
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: MessageStatus.error })
      );
      sub.unsubscribe();
    });
  });

  // ==================== handleSendNewMessageImpl ====================

  describe('handleSendNewMessageImpl', () => {
    it('should send a text message when text is non-empty', async () => {
      const ctx = makeBaseCtx();
      const receiver = makeUser('receiver1');
      await handleSendNewMessageImpl(ctx, receiver, 'Hello', []);
      expect(ctx.messageComposerService.sendTextMessage).toHaveBeenCalledTimes(1);
    });

    it('should call clearComposer after sending text', async () => {
      const ctx = makeBaseCtx();
      const receiver = makeUser('receiver1');
      await handleSendNewMessageImpl(ctx, receiver, 'Hello', []);
      expect(ctx.clearComposer).toHaveBeenCalled();
    });

    it('should call resetMentionsFormatter after sending text', async () => {
      const ctx = makeBaseCtx();
      const receiver = makeUser('receiver1');
      await handleSendNewMessageImpl(ctx, receiver, 'Hello', []);
      expect(ctx.resetMentionsFormatter).toHaveBeenCalled();
    });

    it('should emit ccMessageSent inprogress then success events', async () => {
      const ctx = makeBaseCtx();
      const receiver = makeUser('receiver1');
      const events: any[] = [];
      const sub = CometChatMessageEvents.ccMessageSent.subscribe(e => events.push(e));
      await handleSendNewMessageImpl(ctx, receiver, 'Hello', []);
      sub.unsubscribe();
      expect(events.some(e => e.status === MessageStatus.inprogress)).toBe(true);
      expect(events.some(e => e.status === MessageStatus.success)).toBe(true);
    });

    it('should emit ccMessageSent error when sendTextMessage fails', async () => {
      const ctx = makeBaseCtx({
        messageComposerService: {
          sendTextMessage: vi.fn().mockRejectedValue(new Error('Send failed')),
          sendMediaMessage: vi.fn(),
        } as any,
      });
      const receiver = makeUser('receiver1');
      const events: any[] = [];
      const sub = CometChatMessageEvents.ccMessageSent.subscribe(e => events.push(e));
      await expect(handleSendNewMessageImpl(ctx, receiver, 'Hello', [])).rejects.toThrow();
      sub.unsubscribe();
      expect(events.some(e => e.status === MessageStatus.error)).toBe(true);
    });

    it('should not call sendTextMessage when text is empty', async () => {
      const ctx = makeBaseCtx();
      const receiver = makeUser('receiver1');
      await handleSendNewMessageImpl(ctx, receiver, '', []);
      expect(ctx.messageComposerService.sendTextMessage).not.toHaveBeenCalled();
    });

    it('should send media message for each attachment', async () => {
      const ctx = makeBaseCtx();
      const receiver = makeUser('receiver1');
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const attachments = [{ file, type: 'image' as const, thumbnailUrl: null }];
      await handleSendNewMessageImpl(ctx, receiver, '', attachments as any);
      expect(ctx.messageComposerService.sendMediaMessage).toHaveBeenCalledTimes(1);
    });

    it('should call playOutgoingMessageSound after sending', async () => {
      const ctx = makeBaseCtx();
      const receiver = makeUser('receiver1');
      await handleSendNewMessageImpl(ctx, receiver, 'Hello', []);
      expect(ctx.playOutgoingMessageSound).toHaveBeenCalled();
    });

    it('should emit sendButtonClick with the sent message', async () => {
      const ctx = makeBaseCtx();
      const receiver = makeUser('receiver1');
      await handleSendNewMessageImpl(ctx, receiver, 'Hello', []);
      expect(ctx.sendButtonClick.emit).toHaveBeenCalledTimes(1);
    });

    it('should send to group receiver correctly', async () => {
      const ctx = makeBaseCtx();
      const group = new CometChat.Group('group1', 'Test Group', CometChat.GROUP_TYPE.PUBLIC, '');
      await handleSendNewMessageImpl(ctx, group, 'Hello group', []);
      expect(ctx.messageComposerService.sendTextMessage).toHaveBeenCalledTimes(1);
    });

    it('should set parentMessageId on message when provided', async () => {
      const ctx = makeBaseCtx({ parentMessageId: 42 });
      const receiver = makeUser('receiver1');
      await handleSendNewMessageImpl(ctx, receiver, 'Thread reply', []);
      expect(ctx.messageComposerService.sendTextMessage).toHaveBeenCalledTimes(1);
    });
  });
});
