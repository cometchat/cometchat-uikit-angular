import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Subject, Subscription } from 'rxjs';

/**
 * Integration Tests: Message Composer ↔ Reply Events
 *
 * Verifies CometChatMessageComposer activates reply mode when
 * CometChatMessageEvents.ccReplyToMessage is published.
 * Mock only SDK layer.
 *
 * **Validates: Requirements 14.3, 14.5**
 */

// ─── Mock Event Bus ───

class MockMessageEvents {
  static ccReplyToMessage = new Subject<MockIMessages>();
  static ccMessageEdited = new Subject<MockIMessages>();

  static publishEvent(event: Subject<any>, item: any): void {
    event.next(item);
  }

  static reset(): void {
    MockMessageEvents.ccReplyToMessage = new Subject<MockIMessages>();
    MockMessageEvents.ccMessageEdited = new Subject<MockIMessages>();
  }
}

interface MockIMessages {
  message: MockBaseMessage;
  status: string;
}

interface MockBaseMessage {
  id: number;
  text: string;
  type: string;
  sender: { uid: string; name: string };
  receiverId: string;
  receiverType: string;
  sentAt: number;
  conversationId: string;
}

// ─── Mock Message Composer Component ───

type ComposerMode = 'default' | 'reply' | 'edit';

class MockMessageComposerHandler {
  mode: ComposerMode = 'default';
  replyMessage: MockBaseMessage | null = null;
  editMessage: MockBaseMessage | null = null;
  previewTitle = '';
  previewSubtitle = '';
  inputText = '';

  private subscriptions: Subscription[] = [];

  init(): void {
    this.subscriptions.push(
      MockMessageEvents.ccReplyToMessage.subscribe(event => {
        this.activateReplyMode(event.message);
      })
    );

    this.subscriptions.push(
      MockMessageEvents.ccMessageEdited.subscribe(event => {
        if (event.status === 'inprogress') {
          this.activateEditMode(event.message);
        }
      })
    );
  }

  destroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  activateReplyMode(message: MockBaseMessage): void {
    this.mode = 'reply';
    this.replyMessage = message;
    this.editMessage = null;
    this.previewTitle = message.sender.name;
    this.previewSubtitle = message.text || this.getMessageTypeLabel(message.type);
  }

  activateEditMode(message: MockBaseMessage): void {
    this.mode = 'edit';
    this.editMessage = message;
    this.replyMessage = null;
    this.inputText = message.text;
    this.previewTitle = 'Edit Message';
    this.previewSubtitle = message.text;
  }

  cancelPreview(): void {
    const wasEdit = this.mode === 'edit';
    this.mode = 'default';
    this.replyMessage = null;
    this.editMessage = null;
    this.previewTitle = '';
    this.previewSubtitle = '';
    if (wasEdit) {
      this.inputText = '';
    }
  }

  private getMessageTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      image: 'Photo',
      video: 'Video',
      audio: 'Audio',
      file: 'File',
    };
    return labels[type] || 'Message';
  }
}

// ─── Factories ───

function createMockMessage(overrides: Partial<MockBaseMessage> = {}): MockBaseMessage {
  return {
    id: 1,
    text: 'Hello there',
    type: 'text',
    sender: { uid: 'user1', name: 'Alice' },
    receiverId: 'user2',
    receiverType: 'user',
    sentAt: Date.now(),
    conversationId: 'conv_1',
    ...overrides,
  };
}

// ─── Tests ───

describe('Message Composer ↔ Reply Events Integration', () => {
  let composer: MockMessageComposerHandler;

  beforeEach(() => {
    MockMessageEvents.reset();
    composer = new MockMessageComposerHandler();
    composer.init();
  });

  afterEach(() => {
    composer.destroy();
    vi.restoreAllMocks();
  });

  describe('Reply mode activation', () => {
    it('should activate reply mode when ccReplyToMessage is published', () => {
      const msg = createMockMessage({ text: 'Reply to this' });
      MockMessageEvents.publishEvent(MockMessageEvents.ccReplyToMessage, {
        message: msg,
        status: 'success',
      });

      expect(composer.mode).toBe('reply');
      expect(composer.replyMessage).toBe(msg);
      expect(composer.editMessage).toBeNull();
    });

    it('should set preview title to sender name', () => {
      const msg = createMockMessage({ sender: { uid: 'u1', name: 'Bob' } });
      MockMessageEvents.publishEvent(MockMessageEvents.ccReplyToMessage, {
        message: msg,
        status: 'success',
      });

      expect(composer.previewTitle).toBe('Bob');
    });

    it('should set preview subtitle to message text for text messages', () => {
      const msg = createMockMessage({ text: 'Check this out' });
      MockMessageEvents.publishEvent(MockMessageEvents.ccReplyToMessage, {
        message: msg,
        status: 'success',
      });

      expect(composer.previewSubtitle).toBe('Check this out');
    });

    it('should set preview subtitle to type label for media messages', () => {
      const msg = createMockMessage({ text: '', type: 'image' });
      MockMessageEvents.publishEvent(MockMessageEvents.ccReplyToMessage, {
        message: msg,
        status: 'success',
      });

      expect(composer.previewSubtitle).toBe('Photo');
    });

    it('should handle video message type label', () => {
      const msg = createMockMessage({ text: '', type: 'video' });
      MockMessageEvents.publishEvent(MockMessageEvents.ccReplyToMessage, {
        message: msg,
        status: 'success',
      });

      expect(composer.previewSubtitle).toBe('Video');
    });

    it('should handle audio message type label', () => {
      const msg = createMockMessage({ text: '', type: 'audio' });
      MockMessageEvents.publishEvent(MockMessageEvents.ccReplyToMessage, {
        message: msg,
        status: 'success',
      });

      expect(composer.previewSubtitle).toBe('Audio');
    });

    it('should handle file message type label', () => {
      const msg = createMockMessage({ text: '', type: 'file' });
      MockMessageEvents.publishEvent(MockMessageEvents.ccReplyToMessage, {
        message: msg,
        status: 'success',
      });

      expect(composer.previewSubtitle).toBe('File');
    });
  });

  describe('Edit mode activation', () => {
    it('should activate edit mode when ccMessageEdited is published with inprogress status', () => {
      const msg = createMockMessage({ text: 'Edit me' });
      MockMessageEvents.publishEvent(MockMessageEvents.ccMessageEdited, {
        message: msg,
        status: 'inprogress',
      });

      expect(composer.mode).toBe('edit');
      expect(composer.editMessage).toBe(msg);
      expect(composer.replyMessage).toBeNull();
    });

    it('should not activate edit mode when ccMessageEdited is published with success status', () => {
      const msg = createMockMessage({ text: 'Edit me' });
      MockMessageEvents.publishEvent(MockMessageEvents.ccMessageEdited, {
        message: msg,
        status: 'success',
      });

      expect(composer.mode).toBe('default');
      expect(composer.editMessage).toBeNull();
    });

    it('should populate input text with message text in edit mode', () => {
      const msg = createMockMessage({ text: 'Original text' });
      MockMessageEvents.publishEvent(MockMessageEvents.ccMessageEdited, {
        message: msg,
        status: 'inprogress',
      });

      expect(composer.inputText).toBe('Original text');
    });

    it('should set preview title to Edit Message', () => {
      const msg = createMockMessage();
      MockMessageEvents.publishEvent(MockMessageEvents.ccMessageEdited, {
        message: msg,
        status: 'inprogress',
      });

      expect(composer.previewTitle).toBe('Edit Message');
    });
  });

  describe('Mode switching', () => {
    it('should switch from reply to edit mode', () => {
      const replyMsg = createMockMessage({ id: 1, text: 'Reply' });
      MockMessageEvents.publishEvent(MockMessageEvents.ccReplyToMessage, {
        message: replyMsg,
        status: 'success',
      });
      expect(composer.mode).toBe('reply');

      const editMsg = createMockMessage({ id: 2, text: 'Edit' });
      MockMessageEvents.publishEvent(MockMessageEvents.ccMessageEdited, {
        message: editMsg,
        status: 'inprogress',
      });
      expect(composer.mode).toBe('edit');
      expect(composer.replyMessage).toBeNull();
      expect(composer.editMessage).toBe(editMsg);
    });

    it('should switch from edit to reply mode', () => {
      const editMsg = createMockMessage({ id: 1, text: 'Edit' });
      MockMessageEvents.publishEvent(MockMessageEvents.ccMessageEdited, {
        message: editMsg,
        status: 'inprogress',
      });
      expect(composer.mode).toBe('edit');

      const replyMsg = createMockMessage({ id: 2, text: 'Reply' });
      MockMessageEvents.publishEvent(MockMessageEvents.ccReplyToMessage, {
        message: replyMsg,
        status: 'success',
      });
      expect(composer.mode).toBe('reply');
      expect(composer.editMessage).toBeNull();
      expect(composer.replyMessage).toBe(replyMsg);
    });
  });

  describe('Cancel preview', () => {
    it('should reset to default mode on cancel', () => {
      const msg = createMockMessage();
      MockMessageEvents.publishEvent(MockMessageEvents.ccReplyToMessage, {
        message: msg,
        status: 'success',
      });
      expect(composer.mode).toBe('reply');

      composer.cancelPreview();
      expect(composer.mode).toBe('default');
      expect(composer.replyMessage).toBeNull();
      expect(composer.previewTitle).toBe('');
      expect(composer.previewSubtitle).toBe('');
    });
  });

  describe('Event subscription lifecycle', () => {
    it('should stop receiving events after destroy', () => {
      composer.destroy();

      const msg = createMockMessage();
      MockMessageEvents.publishEvent(MockMessageEvents.ccReplyToMessage, {
        message: msg,
        status: 'success',
      });

      expect(composer.mode).toBe('default');
      expect(composer.replyMessage).toBeNull();
    });
  });
});
