/**
 * cometchat-message-composer.typing-handler Tests
 *
 * Covers: handleTypingStartImpl, startTypingImpl, endTypingIndicatorImpl.
 *
 * @module components/cometchat-message-composer/typing-handler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  handleTypingStartImpl,
  startTypingImpl,
  endTypingIndicatorImpl,
  TypingHandlerContext,
} from './cometchat-message-composer.typing-handler';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(uid: string, blocked = false): CometChat.User {
  const u = new CometChat.User(uid);
  u.setName(`User ${uid}`);
  (u as any).getBlockedByMe = () => blocked;
  (u as any).getHasBlockedMe = () => false;
  return u;
}

function makeGroup(guid: string): CometChat.Group {
  return new CometChat.Group(guid, `Group ${guid}`, CometChat.GROUP_TYPE.PUBLIC, '');
}

function makeCtx(overrides: Partial<TypingHandlerContext> = {}): TypingHandlerContext {
  return {
    disableTypingEvents: false,
    typingTimeout: undefined,
    currentUser: vi.fn().mockReturnValue(makeUser('user1')),
    currentGroup: vi.fn().mockReturnValue(null),
    messageComposerService: {
      startTyping: vi.fn(),
      endTyping: vi.fn(),
    },
    TYPING_TIMEOUT_MS: 5000,
    endTypingIndicator: vi.fn(),
    ...overrides,
  };
}

describe('cometchat-message-composer.typing-handler', () => {

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==================== startTypingImpl ====================

  describe('startTypingImpl', () => {
    it('should call messageComposerService.startTyping with user receiver', () => {
      const ctx = makeCtx();
      startTypingImpl(ctx);
      expect(ctx.messageComposerService.startTyping).toHaveBeenCalledWith(expect.any(CometChat.User));
    });

    it('should call messageComposerService.startTyping with group receiver', () => {
      const ctx = makeCtx({
        currentUser: vi.fn().mockReturnValue(null),
        currentGroup: vi.fn().mockReturnValue(makeGroup('group1')),
      });
      startTypingImpl(ctx);
      expect(ctx.messageComposerService.startTyping).toHaveBeenCalledWith(expect.any(CometChat.Group));
    });

    it('should not call startTyping when no receiver', () => {
      const ctx = makeCtx({
        currentUser: vi.fn().mockReturnValue(null),
        currentGroup: vi.fn().mockReturnValue(null),
      });
      startTypingImpl(ctx);
      expect(ctx.messageComposerService.startTyping).not.toHaveBeenCalled();
    });
  });

  // ==================== endTypingIndicatorImpl ====================

  describe('endTypingIndicatorImpl', () => {
    it('should call messageComposerService.endTyping with user receiver', () => {
      const ctx = makeCtx();
      endTypingIndicatorImpl(ctx);
      expect(ctx.messageComposerService.endTyping).toHaveBeenCalledWith(expect.any(CometChat.User));
    });

    it('should call messageComposerService.endTyping with group receiver', () => {
      const ctx = makeCtx({
        currentUser: vi.fn().mockReturnValue(null),
        currentGroup: vi.fn().mockReturnValue(makeGroup('group1')),
      });
      endTypingIndicatorImpl(ctx);
      expect(ctx.messageComposerService.endTyping).toHaveBeenCalledWith(expect.any(CometChat.Group));
    });

    it('should not call endTyping when no receiver', () => {
      const ctx = makeCtx({
        currentUser: vi.fn().mockReturnValue(null),
        currentGroup: vi.fn().mockReturnValue(null),
      });
      endTypingIndicatorImpl(ctx);
      expect(ctx.messageComposerService.endTyping).not.toHaveBeenCalled();
    });
  });

  // ==================== handleTypingStartImpl ====================

  describe('handleTypingStartImpl', () => {
    it('should return early when disableTypingEvents=true', () => {
      const ctx = makeCtx({ disableTypingEvents: true });
      handleTypingStartImpl(ctx);
      expect(ctx.messageComposerService.startTyping).not.toHaveBeenCalled();
    });

    it('should return early when no receiver', () => {
      const ctx = makeCtx({
        currentUser: vi.fn().mockReturnValue(null),
        currentGroup: vi.fn().mockReturnValue(null),
      });
      handleTypingStartImpl(ctx);
      expect(ctx.messageComposerService.startTyping).not.toHaveBeenCalled();
    });

    it('should return early when user has blocked me', () => {
      const blockedUser = makeUser('user1');
      (blockedUser as any).getBlockedByMe = () => false;
      (blockedUser as any).getHasBlockedMe = () => true;
      const ctx = makeCtx({ currentUser: vi.fn().mockReturnValue(blockedUser) });
      handleTypingStartImpl(ctx);
      expect(ctx.messageComposerService.startTyping).not.toHaveBeenCalled();
    });

    it('should return early when I have blocked the user', () => {
      const blockedUser = makeUser('user1', true);
      const ctx = makeCtx({ currentUser: vi.fn().mockReturnValue(blockedUser) });
      handleTypingStartImpl(ctx);
      expect(ctx.messageComposerService.startTyping).not.toHaveBeenCalled();
    });

    it('should call startTyping on first keystroke (no existing timeout)', () => {
      const ctx = makeCtx({ typingTimeout: undefined });
      handleTypingStartImpl(ctx);
      expect(ctx.messageComposerService.startTyping).toHaveBeenCalledTimes(1);
    });

    it('should not call startTyping again when timeout already exists (debounce)', () => {
      const ctx = makeCtx();
      // First call — starts typing
      handleTypingStartImpl(ctx);
      expect(ctx.messageComposerService.startTyping).toHaveBeenCalledTimes(1);
      // Second call — timeout exists, should not call startTyping again
      handleTypingStartImpl(ctx);
      expect(ctx.messageComposerService.startTyping).toHaveBeenCalledTimes(1);
    });

    it('should set a timeout to end typing', () => {
      const ctx = makeCtx({ TYPING_TIMEOUT_MS: 1000 });
      handleTypingStartImpl(ctx);
      expect((ctx as any).typingTimeout).toBeDefined();
    });

    it('should call endTypingIndicator after timeout', () => {
      const ctx = makeCtx({ TYPING_TIMEOUT_MS: 1000 });
      handleTypingStartImpl(ctx);
      vi.advanceTimersByTime(1000);
      expect(ctx.endTypingIndicator).toHaveBeenCalled();
    });

    it('should clear timeout when called again before it fires', () => {
      const ctx = makeCtx({ TYPING_TIMEOUT_MS: 1000 });
      handleTypingStartImpl(ctx);
      vi.advanceTimersByTime(500);
      handleTypingStartImpl(ctx); // resets timer
      vi.advanceTimersByTime(500);
      // endTypingIndicator should NOT have been called yet (timer was reset)
      expect(ctx.endTypingIndicator).not.toHaveBeenCalled();
      vi.advanceTimersByTime(500);
      expect(ctx.endTypingIndicator).toHaveBeenCalledTimes(1);
    });
  });
});
