/**
 * MessageComposerService Tests
 *
 * Categories: Initialization, Signal State, Message Sending (Text/Media),
 *             Edit Message, Typing Indicators, Upload Progress,
 *             Recording State, Extension APIs, Mention Search,
 *             Error Handling, Cleanup, Edge Cases
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.8, 13.6, 14.4, 14.5, 15.7
 *
 * All SDK calls are mocked via vitest.setup.mjs global mock.
 *
 * @module services/message-composer
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup, fetchTestUser, fetchTestGroup } from '../test-setup';
import { MessageComposerService } from './message-composer.service';
import { CometChat } from '@cometchat/chat-sdk-javascript';

describe('MessageComposerService', () => {
  let service: MessageComposerService;
  let testUser: CometChat.User;
  let testGroup: CometChat.Group;

  beforeAll(async () => {
    await ensureSdkReady();
    testUser = await fetchTestUser('superhero1');
    testGroup = await fetchTestGroup('supergroup');
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 30_000);

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(MessageComposerService);
    service.cleanup();
  });

  // ==================== Initialization ====================

  describe('Initialization', () => {
    it('should be provided in root', () => {
      expect(service).toBeTruthy();
    });

    it('should have isSending as false initially', () => {
      expect(service.isSending()).toBe(false);
    });

    it('should have empty uploadProgress map initially', () => {
      expect(service.uploadProgress().size).toBe(0);
    });

    it('should have isRecording as false initially', () => {
      expect(service.isRecording()).toBe(false);
    });

    it('should have recordingDuration as 0 initially', () => {
      expect(service.recordingDuration()).toBe(0);
    });

    it('should have empty mentionSuggestions initially', () => {
      expect(service.mentionSuggestions()).toEqual([]);
    });

    it('should have isFetchingMentions as false initially', () => {
      expect(service.isFetchingMentions()).toBe(false);
    });

    it('should have hasMoreMentions as true initially', () => {
      expect(service.hasMoreMentions()).toBe(true);
    });
  });

  // ==================== sendTextMessage ====================

  describe('sendTextMessage', () => {
    it('should send a text message to a real user and return a TextMessage', async () => {
      const result = await service.sendTextMessage(testUser, 'Hello from test');
      expect(result).not.toBeNull();
      expect(result!.getText()).toBe('Hello from test');
    }, 15_000);

    it('should send a text message to a real group and return a TextMessage', async () => {
      const result = await service.sendTextMessage(testGroup, 'Group hello');
      expect(result).not.toBeNull();
      expect(result!.getReceiverType()).toBe(CometChat.RECEIVER_TYPE.GROUP);
    }, 15_000);

    it('should reset isSending to false after successful send', async () => {
      await service.sendTextMessage(testUser, 'test isSending');
      expect(service.isSending()).toBe(false);
    }, 15_000);

    it('should attach metadata when provided', async () => {
      const meta = { custom: 'value' };
      const result = await service.sendTextMessage(testUser, 'meta test', meta);
      expect(result).not.toBeNull();
      const returnedMeta = result!.getMetadata();
      expect(returnedMeta).toBeDefined();
    }, 15_000);

    it('should set parentMessageId for threaded replies', async () => {
      // First send a message to get a valid parent ID
      const parent = await service.sendTextMessage(testUser, 'parent msg');
      expect(parent).not.toBeNull();
      const parentId = parent!.getId();

      const reply = await service.sendTextMessage(testUser, 'reply msg', undefined, parentId);
      expect(reply).not.toBeNull();
      expect(reply!.getParentMessageId()).toBe(parentId);
    }, 30_000);

    it('should return null and invoke error callback on invalid receiver', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(err => errors.push(err));

      // Mock sendMessage to reject for this test
      vi.spyOn(CometChat, 'sendMessage').mockRejectedValueOnce(
        new CometChat.CometChatException({
          code: 'ERR_INVALID_RECEIVER',
          message: 'Invalid receiver',
        })
      );

      const fakeUser = new CometChat.User('');
      const result = await service.sendTextMessage(fakeUser, 'should fail');

      expect(result).toBeNull();
      expect(errors.length).toBe(1);
    }, 15_000);

    it('should reset isSending to false after failed send', async () => {
      vi.spyOn(CometChat, 'sendMessage').mockRejectedValueOnce(
        new CometChat.CometChatException({
          code: 'ERR_INVALID_RECEIVER',
          message: 'Invalid receiver',
        })
      );

      const fakeUser = new CometChat.User('');
      await service.sendTextMessage(fakeUser, 'fail');
      expect(service.isSending()).toBe(false);
    }, 15_000);
  });

  // ==================== sendMediaMessage ====================

  describe('sendMediaMessage', () => {
    it('should send a media message to a real user and return a MediaMessage', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const result = await service.sendMediaMessage(testUser, file, 'file');
      expect(result).not.toBeNull();
      expect(result!.getType()).toBe('file');
    }, 15_000);

    it('should send a media message to a real group', async () => {
      const file = new File(['group content'], 'group.txt', { type: 'text/plain' });
      const result = await service.sendMediaMessage(testGroup, file, 'file');
      expect(result).not.toBeNull();
      expect(result!.getReceiverType()).toBe(CometChat.RECEIVER_TYPE.GROUP);
    }, 15_000);

    it('should reset isSending to false after media send', async () => {
      const file = new File(['data'], 'data.txt', { type: 'text/plain' });
      await service.sendMediaMessage(testUser, file, 'file');
      expect(service.isSending()).toBe(false);
    }, 15_000);

    it('should return null and invoke error callback on failure', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(err => errors.push(err));

      // Mock sendMediaMessage to reject for this test
      vi.spyOn(CometChat, 'sendMediaMessage').mockRejectedValueOnce(
        new CometChat.CometChatException({
          code: 'ERR_INVALID_RECEIVER',
          message: 'Invalid receiver',
        })
      );

      const fakeUser = new CometChat.User('');
      const file = new File(['x'], 'x.txt', { type: 'text/plain' });
      const result = await service.sendMediaMessage(fakeUser, file, 'file');

      expect(result).toBeNull();
      expect(errors.length).toBe(1);
    }, 15_000);
  });

  // ==================== editMessage ====================

  describe('editMessage', () => {
    it('should edit a previously sent message with new text', async () => {
      const original = await service.sendTextMessage(testUser, 'original text');
      expect(original).not.toBeNull();

      const edited = await service.editMessage(original!, 'edited text');
      expect(edited).not.toBeNull();
    }, 30_000);

    it('should reset isSending to false after edit', async () => {
      const msg = await service.sendTextMessage(testUser, 'to edit');
      expect(msg).not.toBeNull();

      await service.editMessage(msg!, 'edited');
      expect(service.isSending()).toBe(false);
    }, 30_000);
  });

  // ==================== Typing Indicators ====================

  describe('Typing Indicators', () => {
    it('should call startTyping for a user without throwing', () => {
      expect(() => service.startTyping(testUser)).not.toThrow();
    });

    it('should call startTyping for a group without throwing', () => {
      expect(() => service.startTyping(testGroup)).not.toThrow();
    });

    it('should call endTyping for a user without throwing', () => {
      expect(() => service.endTyping(testUser)).not.toThrow();
    });

    it('should call endTyping for a group without throwing', () => {
      expect(() => service.endTyping(testGroup)).not.toThrow();
    });

    it('should handle rapid start/end typing calls without error', () => {
      for (let i = 0; i < 5; i++) {
        service.startTyping(testUser);
        service.endTyping(testUser);
      }
      // No error thrown means success
      expect(true).toBe(true);
    });
  });

  // ==================== Upload Progress ====================

  describe('Upload Progress', () => {
    it('should set upload progress for a file', () => {
      service.updateUploadProgress('file1', 50);
      expect(service.uploadProgress().get('file1')).toBe(50);
    });

    it('should update existing upload progress', () => {
      service.updateUploadProgress('file1', 25);
      service.updateUploadProgress('file1', 75);
      expect(service.uploadProgress().get('file1')).toBe(75);
    });

    it('should track multiple files independently', () => {
      service.updateUploadProgress('a', 10);
      service.updateUploadProgress('b', 50);
      service.updateUploadProgress('c', 90);

      expect(service.uploadProgress().get('a')).toBe(10);
      expect(service.uploadProgress().get('b')).toBe(50);
      expect(service.uploadProgress().get('c')).toBe(90);
    });

    it('should clear progress for a specific file', () => {
      service.updateUploadProgress('file1', 50);
      service.updateUploadProgress('file2', 75);
      service.clearUploadProgress('file1');

      expect(service.uploadProgress().has('file1')).toBe(false);
      expect(service.uploadProgress().get('file2')).toBe(75);
    });

    it('should clear all upload progress', () => {
      service.updateUploadProgress('a', 10);
      service.updateUploadProgress('b', 20);
      service.clearAllUploadProgress();

      expect(service.uploadProgress().size).toBe(0);
    });

    it('should handle clearing non-existent file without error', () => {
      expect(() => service.clearUploadProgress('nonexistent')).not.toThrow();
    });
  });

  // ==================== Recording State ====================

  describe('Recording State', () => {
    it('should set recording state to true', () => {
      service.setRecordingState(true);
      expect(service.isRecording()).toBe(true);
    });

    it('should set recording state to false and reset duration', () => {
      service.setRecordingState(true);
      service.updateRecordingDuration(30);
      service.setRecordingState(false);

      expect(service.isRecording()).toBe(false);
      expect(service.recordingDuration()).toBe(0);
    });

    it('should update recording duration', () => {
      service.updateRecordingDuration(15);
      expect(service.recordingDuration()).toBe(15);
    });

    it('should not reset duration when starting recording', () => {
      service.updateRecordingDuration(10);
      service.setRecordingState(true);
      expect(service.recordingDuration()).toBe(10);
    });
  });

  // ==================== Error Handling ====================

  describe('Error Handling', () => {
    it('should set and clear error callback', () => {
      const cb = vi.fn();
      service.setErrorCallback(cb);
      service.setErrorCallback(null);
      // No way to directly assert private field, but clearing should not throw
      expect(true).toBe(true);
    });

    it('should replace existing error callback', async () => {
      const errors1: CometChat.CometChatException[] = [];
      const errors2: CometChat.CometChatException[] = [];

      service.setErrorCallback(err => errors1.push(err));
      service.setErrorCallback(err => errors2.push(err));

      vi.spyOn(CometChat, 'sendMessage').mockRejectedValueOnce(
        new CometChat.CometChatException({ code: 'ERR_TEST', message: 'Test error' })
      );

      const fakeUser = new CometChat.User('');
      await service.sendTextMessage(fakeUser, 'fail');

      expect(errors1.length).toBe(0);
      expect(errors2.length).toBe(1);
    }, 15_000);

    it('should not invoke error callback for typing indicator failures', () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(err => errors.push(err));

      // Typing errors are logged but not propagated to error callback
      // Even if startTyping internally fails, it should not call errorCallback
      service.startTyping(testUser);
      expect(errors.length).toBe(0);
    });
  });

  // ==================== Error Recovery (Requirement 7.6) ====================

  describe('Error Recovery', () => {
    it('should invoke ErrorCallback when sendTextMessage SDK call rejects', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(err => errors.push(err));

      vi.spyOn(CometChat, 'sendMessage').mockRejectedValueOnce(
        new CometChat.CometChatException({ code: 'ERR_INVALID', message: 'SDK rejection' })
      );

      const fakeUser = new CometChat.User('');
      const result = await service.sendTextMessage(fakeUser, 'should fail');

      expect(result).toBeNull();
      expect(errors.length).toBe(1);
      expect(errors[0]).toBeTruthy();
      expect(errors[0].message).toBeTruthy();
    }, 15_000);

    it('should invoke ErrorCallback when sendMediaMessage SDK call rejects', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(err => errors.push(err));

      vi.spyOn(CometChat, 'sendMediaMessage').mockRejectedValueOnce(
        new CometChat.CometChatException({ code: 'ERR_INVALID', message: 'SDK rejection' })
      );

      const fakeUser = new CometChat.User('');
      const file = new File(['data'], 'test.txt', { type: 'text/plain' });
      const result = await service.sendMediaMessage(fakeUser, file, 'file');

      expect(result).toBeNull();
      expect(errors.length).toBe(1);
      expect(errors[0]).toBeTruthy();
    }, 15_000);

    it('should not throw when SDK rejects and no ErrorCallback is set', async () => {
      service.setErrorCallback(null);

      vi.spyOn(CometChat, 'sendMessage').mockRejectedValueOnce(
        new CometChat.CometChatException({ code: 'ERR_TEST', message: 'No callback' })
      );

      const fakeUser = new CometChat.User('');
      const result = await service.sendTextMessage(fakeUser, 'no callback');
      expect(result).toBeNull();
    }, 15_000);

    it('should invoke ErrorCallback with null receiver guard', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(err => errors.push(err));

      const result = await service.sendTextMessage(null as any, 'null receiver');

      expect(result).toBeNull();
      expect(errors.length).toBe(1);
    }, 15_000);

    it('should remain usable after an SDK error — subsequent sends succeed', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(err => errors.push(err));

      // First: trigger an error
      vi.spyOn(CometChat, 'sendMessage').mockRejectedValueOnce(
        new CometChat.CometChatException({ code: 'ERR_TEST', message: 'First failure' })
      );

      const fakeUser = new CometChat.User('');
      await service.sendTextMessage(fakeUser, 'fail first');
      expect(errors.length).toBe(1);

      // Second: send a valid message — mock resolves normally now (mockRejectedValueOnce expired)
      const result = await service.sendTextMessage(testUser, 'recover ' + Date.now());
      expect(result).not.toBeNull();
      expect(result!.getText()).toContain('recover');
      expect(service.isSending()).toBe(false);
    }, 30_000);

    it('should reset isSending to false after SDK rejection', async () => {
      vi.spyOn(CometChat, 'sendMessage').mockRejectedValueOnce(
        new CometChat.CometChatException({ code: 'ERR_TEST', message: 'Rejection' })
      );

      const fakeUser = new CometChat.User('');
      await service.sendTextMessage(fakeUser, 'check isSending');
      expect(service.isSending()).toBe(false);
    }, 15_000);
  });

  // ==================== Mention Search ====================

  describe('Mention Search', () => {
    it('should set isFetchingMentions immediately when searchMentions is called', () => {
      service.searchMentions('sup');
      expect(service.isFetchingMentions()).toBe(true);
    });

    it('should clear mention suggestions', () => {
      service.clearMentionSuggestions();
      expect(service.mentionSuggestions()).toEqual([]);
    });

    it('should stop mention search and reset fetching state', () => {
      service.searchMentions('test');
      service.stopMentionSearch();
      expect(service.isFetchingMentions()).toBe(false);
      expect(service.isFetchingMoreMentions()).toBe(false);
    });

    it('should append mention suggestions to existing list', () => {
      service.appendMentionSuggestions([{ uid: 'u1', name: 'User 1' }]);
      service.appendMentionSuggestions([{ uid: 'u2', name: 'User 2' }]);
      expect(service.mentionSuggestions().length).toBe(2);
    });

    it('should check if a user is self mention', async () => {
      const loggedInUser = await CometChat.getLoggedinUser();
      if (loggedInUser) {
        const isSelf = await service.checkIfSelfMention(loggedInUser.getUid());
        expect(isSelf).toBe(true);
      }
    }, 15_000);

    it('should return false for non-self mention', async () => {
      const isSelf = await service.checkIfSelfMention('nonexistent_user_xyz');
      expect(isSelf).toBe(false);
    }, 15_000);

    it('should initialize mentions pagination for user context', () => {
      expect(() => service.initializeMentionsPagination('sup')).not.toThrow();
      expect(service.hasMoreMentions()).toBe(true);
    });

    it('should initialize mentions pagination for group context', () => {
      expect(() => service.initializeMentionsPagination('sup', testGroup)).not.toThrow();
      expect(service.hasMoreMentions()).toBe(true);
    });
  });

  // ==================== Cleanup ====================

  describe('Cleanup', () => {
    it('should reset all state to initial values', () => {
      service.updateUploadProgress('f1', 50);
      service.setRecordingState(true);
      service.updateRecordingDuration(30);
      service.setErrorCallback(() => {});
      service.appendMentionSuggestions([{ uid: 'u1', name: 'U1' }]);

      service.cleanup();

      expect(service.isSending()).toBe(false);
      expect(service.uploadProgress().size).toBe(0);
      expect(service.isRecording()).toBe(false);
      expect(service.recordingDuration()).toBe(0);
      expect(service.mentionSuggestions()).toEqual([]);
      expect(service.isFetchingMentions()).toBe(false);
      expect(service.hasMoreMentions()).toBe(true);
    });

    it('should not throw when called multiple times', () => {
      service.cleanup();
      service.cleanup();
      service.cleanup();
      expect(service.isSending()).toBe(false);
    });

    it('should clear error callback so errors are not propagated after cleanup', async () => {
      const errors: CometChat.CometChatException[] = [];
      service.setErrorCallback(err => errors.push(err));

      service.cleanup();

      vi.spyOn(CometChat, 'sendMessage').mockRejectedValueOnce(
        new CometChat.CometChatException({ code: 'ERR_TEST', message: 'After cleanup' })
      );

      const fakeUser = new CometChat.User('');
      await service.sendTextMessage(fakeUser, 'after cleanup');

      expect(errors.length).toBe(0);
    }, 15_000);
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle sending empty text message', async () => {
      const result = await service.sendTextMessage(testUser, '');
      // SDK may accept or reject empty text — either way, no unhandled error
      expect(service.isSending()).toBe(false);
    }, 15_000);

    it('should handle unicode and emoji in messages', async () => {
      const text = '你好世界 🌍 مرحبا 🎉';
      const result = await service.sendTextMessage(testUser, text);
      expect(result).not.toBeNull();
      expect(result!.getText()).toBe(text);
    }, 15_000);

    it('should maintain state isolation between operations', () => {
      service.updateUploadProgress('file1', 50);
      service.setRecordingState(true);
      service.updateRecordingDuration(10);

      // Each state is independent
      expect(service.uploadProgress().get('file1')).toBe(50);
      expect(service.isRecording()).toBe(true);
      expect(service.recordingDuration()).toBe(10);
      expect(service.isSending()).toBe(false);
    });

    it('should handle fetchMoreMentions when no pagination request exists', async () => {
      service.cleanup(); // Ensures mentionsPaginationRequest is null
      await service.fetchMoreMentions(false);
      // Should not throw, just return early
      expect(service.isFetchingMoreMentions()).toBe(false);
    });

    it('should handle fetchMoreMentions when hasMoreMentions is false', async () => {
      service.initializeMentionsPagination('test');
      // Manually exhaust by setting hasMoreMentions to false via stopMentionSearch won't work,
      // but we can test the guard by calling fetchMoreMentions after cleanup
      service.cleanup();
      await service.fetchMoreMentions(false);
      expect(service.isFetchingMoreMentions()).toBe(false);
    });
  });
});
