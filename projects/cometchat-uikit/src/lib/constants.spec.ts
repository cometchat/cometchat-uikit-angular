/**
 * CometChatUIKitConstants Tests
 *
 * Categories: Frozen Objects, Key Completeness, Value Correctness,
 *             Immutability, Type Validation, Property-Based Tests
 * Validates: Requirements 8.1, 14.4, 14.5, 15.7
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fc from 'fast-check';
import { ensureSdkReady, sdkCleanup } from './test-setup';
import { CometChatUIKitConstants } from './constants';

beforeAll(async () => {
  await ensureSdkReady();
});

afterAll(async () => {
  await sdkCleanup();
});

describe('CometChatUIKitConstants', () => {
  it('should be defined as a class', () => {
    expect(CometChatUIKitConstants).toBeDefined();
    expect(typeof CometChatUIKitConstants).toBe('function');
  });

  describe('MessageCategory', () => {
    it('should be a frozen object', () => {
      expect(Object.isFrozen(CometChatUIKitConstants.MessageCategory)).toBe(true);
    });

    it('should have all expected keys', () => {
      const keys = Object.keys(CometChatUIKitConstants.MessageCategory);
      expect(keys).toEqual(
        expect.arrayContaining(['message', 'custom', 'action', 'call', 'interactive', 'agentic'])
      );
      expect(keys).toHaveLength(6);
    });

    it('should have string values for all entries', () => {
      for (const val of Object.values(CometChatUIKitConstants.MessageCategory)) {
        expect(typeof val).toBe('string');
      }
    });

    it('should not allow modification', () => {
      expect(() => {
        (CometChatUIKitConstants.MessageCategory as any).message = 'modified';
      }).toThrow(TypeError);
    });
  });

  describe('moderationStatus', () => {
    it('should be a frozen object with 4 keys', () => {
      expect(Object.isFrozen(CometChatUIKitConstants.moderationStatus)).toBe(true);
      expect(Object.keys(CometChatUIKitConstants.moderationStatus)).toEqual(
        expect.arrayContaining(['pending', 'approved', 'disapproved', 'unmoderated'])
      );
      expect(Object.keys(CometChatUIKitConstants.moderationStatus)).toHaveLength(4);
    });
  });

  describe('MessageTypes', () => {
    it('should be a frozen object', () => {
      expect(Object.isFrozen(CometChatUIKitConstants.MessageTypes)).toBe(true);
    });

    it('should have all 15 expected keys', () => {
      const keys = Object.keys(CometChatUIKitConstants.MessageTypes);
      expect(keys).toEqual(
        expect.arrayContaining([
          'text',
          'file',
          'image',
          'audio',
          'video',
          'delete',
          'edited',
          'groupMember',
          'form',
          'card',
          'customInteractive',
          'scheduler',
          'assistant',
          'toolArguments',
          'toolResults',
        ])
      );
      expect(keys).toHaveLength(15);
    });

    it('should have correct hardcoded string values', () => {
      expect(CometChatUIKitConstants.MessageTypes.delete).toBe('delete');
      expect(CometChatUIKitConstants.MessageTypes.edited).toBe('edited');
      expect(CometChatUIKitConstants.MessageTypes.groupMember).toBe('groupMember');
      expect(CometChatUIKitConstants.MessageTypes.form).toBe('form');
      expect(CometChatUIKitConstants.MessageTypes.card).toBe('card');
      expect(CometChatUIKitConstants.MessageTypes.customInteractive).toBe('customInteractive');
      expect(CometChatUIKitConstants.MessageTypes.scheduler).toBe('scheduler');
    });

    it('should not allow modification', () => {
      expect(() => {
        (CometChatUIKitConstants.MessageTypes as any).text = 'modified';
      }).toThrow(TypeError);
    });
  });

  describe('groupMemberAction', () => {
    it('should be a frozen object', () => {
      expect(Object.isFrozen(CometChatUIKitConstants.groupMemberAction)).toBe(true);
    });

    it('should have all 11 expected keys', () => {
      const keys = Object.keys(CometChatUIKitConstants.groupMemberAction);
      expect(keys).toEqual(
        expect.arrayContaining([
          'ROLE',
          'BLOCK',
          'REMOVE',
          'JOINED',
          'LEFT',
          'ADDED',
          'BANNED',
          'UNBANNED',
          'KICKED',
          'INVITED',
          'SCOPE_CHANGE',
        ])
      );
      expect(keys).toHaveLength(11);
    });

    it('should have correct hardcoded values', () => {
      expect(CometChatUIKitConstants.groupMemberAction.ROLE).toBe('role');
      expect(CometChatUIKitConstants.groupMemberAction.BLOCK).toBe('block');
      expect(CometChatUIKitConstants.groupMemberAction.REMOVE).toBe('remove');
    });
  });

  describe('MessageReceiverType', () => {
    it('should be a frozen object with user and group keys', () => {
      expect(Object.isFrozen(CometChatUIKitConstants.MessageReceiverType)).toBe(true);
      const keys = Object.keys(CometChatUIKitConstants.MessageReceiverType);
      expect(keys).toEqual(expect.arrayContaining(['user', 'group']));
      expect(keys).toHaveLength(2);
    });
  });

  describe('userStatusType', () => {
    it('should be a frozen object with online and offline keys', () => {
      expect(Object.isFrozen(CometChatUIKitConstants.userStatusType)).toBe(true);
      const keys = Object.keys(CometChatUIKitConstants.userStatusType);
      expect(keys).toEqual(expect.arrayContaining(['online', 'offline']));
      expect(keys).toHaveLength(2);
    });
  });

  describe('MessageOption', () => {
    it('should be a frozen object', () => {
      expect(Object.isFrozen(CometChatUIKitConstants.MessageOption)).toBe(true);
    });

    it('should have all 13 expected keys', () => {
      const keys = Object.keys(CometChatUIKitConstants.MessageOption);
      expect(keys).toEqual(
        expect.arrayContaining([
          'editMessage',
          'deleteMessage',
          'replyMessage',
          'replyInThread',
          'translateMessage',
          'reactToMessage',
          'messageInformation',
          'flagMessage',
          'copyMessage',
          'shareMessage',
          'forwardMessage',
          'sendMessagePrivately',
          'replyMessagePrivately',
        ])
      );
      expect(keys).toHaveLength(13);
    });

    it('should have correct string values', () => {
      expect(CometChatUIKitConstants.MessageOption.editMessage).toBe('edit');
      expect(CometChatUIKitConstants.MessageOption.deleteMessage).toBe('delete');
      expect(CometChatUIKitConstants.MessageOption.replyMessage).toBe('reply');
      expect(CometChatUIKitConstants.MessageOption.replyInThread).toBe('replyInThread');
      expect(CometChatUIKitConstants.MessageOption.translateMessage).toBe('translate');
      expect(CometChatUIKitConstants.MessageOption.reactToMessage).toBe('react');
      expect(CometChatUIKitConstants.MessageOption.messageInformation).toBe('messageInformation');
      expect(CometChatUIKitConstants.MessageOption.flagMessage).toBe('flagMessage');
      expect(CometChatUIKitConstants.MessageOption.copyMessage).toBe('copy');
      expect(CometChatUIKitConstants.MessageOption.shareMessage).toBe('share');
      expect(CometChatUIKitConstants.MessageOption.forwardMessage).toBe('forward');
      expect(CometChatUIKitConstants.MessageOption.sendMessagePrivately).toBe(
        'sendMessagePrivately'
      );
      expect(CometChatUIKitConstants.MessageOption.replyMessagePrivately).toBe(
        'replyMessagePrivately'
      );
    });
  });

  describe('GroupOptions', () => {
    it('should be a frozen object with correct values', () => {
      expect(Object.isFrozen(CometChatUIKitConstants.GroupOptions)).toBe(true);
      expect(CometChatUIKitConstants.GroupOptions.leave).toBe('leave');
      expect(CometChatUIKitConstants.GroupOptions.delete).toBe('delete');
      expect(CometChatUIKitConstants.GroupOptions.viewMembers).toBe('viewMembers');
      expect(CometChatUIKitConstants.GroupOptions.addMembers).toBe('addMembers');
      expect(CometChatUIKitConstants.GroupOptions.bannedMembers).toBe('bannedMembers');
    });
  });

  describe('GroupMemberOptions', () => {
    it('should be a frozen object with correct values', () => {
      expect(Object.isFrozen(CometChatUIKitConstants.GroupMemberOptions)).toBe(true);
      expect(CometChatUIKitConstants.GroupMemberOptions.kick).toBe('kick');
      expect(CometChatUIKitConstants.GroupMemberOptions.ban).toBe('ban');
      expect(CometChatUIKitConstants.GroupMemberOptions.unban).toBe('unban');
      expect(CometChatUIKitConstants.GroupMemberOptions.changeScope).toBe('changeScope');
    });

    it('should not allow modification', () => {
      expect(() => {
        (CometChatUIKitConstants.GroupMemberOptions as any).kick = 'modified';
      }).toThrow(TypeError);
    });
  });

  describe('groupMemberScope', () => {
    it('should be a frozen object with 4 keys', () => {
      expect(Object.isFrozen(CometChatUIKitConstants.groupMemberScope)).toBe(true);
      const keys = Object.keys(CometChatUIKitConstants.groupMemberScope);
      expect(keys).toEqual(expect.arrayContaining(['owner', 'admin', 'participant', 'moderator']));
      expect(keys).toHaveLength(4);
    });

    it('should have correct owner value', () => {
      expect(CometChatUIKitConstants.groupMemberScope.owner).toBe('owner');
    });
  });

  describe('UserOptions', () => {
    it('should be a frozen object with correct values', () => {
      expect(Object.isFrozen(CometChatUIKitConstants.UserOptions)).toBe(true);
      expect(CometChatUIKitConstants.UserOptions.block).toBe('block');
      expect(CometChatUIKitConstants.UserOptions.unblock).toBe('unblock');
      expect(CometChatUIKitConstants.UserOptions.viewProfile).toBe('viewProfile');
    });
  });

  describe('ConversationOptions', () => {
    it('should be a frozen object with delete key', () => {
      expect(Object.isFrozen(CometChatUIKitConstants.ConversationOptions)).toBe(true);
      expect(CometChatUIKitConstants.ConversationOptions.delete).toBe('delete');
      expect(Object.keys(CometChatUIKitConstants.ConversationOptions)).toHaveLength(1);
    });
  });

  describe('GroupTypes', () => {
    it('should be a frozen object with 3 keys', () => {
      expect(Object.isFrozen(CometChatUIKitConstants.GroupTypes)).toBe(true);
      const keys = Object.keys(CometChatUIKitConstants.GroupTypes);
      expect(keys).toEqual(expect.arrayContaining(['private', 'password', 'public']));
      expect(keys).toHaveLength(3);
    });
  });

  describe('liveReaction', () => {
    it('should be a frozen object with correct timeout', () => {
      expect(Object.isFrozen(CometChatUIKitConstants.liveReaction)).toBe(true);
      expect(CometChatUIKitConstants.liveReaction.timeout).toBe(1500);
      expect(typeof CometChatUIKitConstants.liveReaction.timeout).toBe('number');
    });
  });

  describe('messages', () => {
    it('should be a frozen object', () => {
      expect(Object.isFrozen(CometChatUIKitConstants.messages)).toBe(true);
    });

    it('should have all 15 expected keys', () => {
      const keys = Object.keys(CometChatUIKitConstants.messages);
      expect(keys).toEqual(
        expect.arrayContaining([
          'MESSAGE_DELIVERED',
          'MESSAGE_READ',
          'MESSAGE_DELETED',
          'MESSAGE_EDITED',
          'MESSAGE_SENT',
          'TEXT_MESSAGE_RECEIVED',
          'MEDIA_MESSAGE_RECEIVED',
          'CUSTOM_MESSAGE_RECEIVED',
          'TRANSIENT_MESSAGE_RECEIVED',
          'INTERACTIVE_MESSAGE_RECEIVED',
          'DELIVERY',
          'READ',
          'APP_SYSTEM',
          'MESSAGE_REACTION_ADDED',
          'MESSAGE_REACTION_REMOVED',
        ])
      );
      expect(keys).toHaveLength(15);
    });

    it('should have correct hardcoded values', () => {
      expect(CometChatUIKitConstants.messages.MESSAGE_DELIVERED).toBe('onMessagesDelivered');
      expect(CometChatUIKitConstants.messages.MESSAGE_READ).toBe('onMessagesRead');
      expect(CometChatUIKitConstants.messages.MESSAGE_DELETED).toBe('onMessageDeleted');
      expect(CometChatUIKitConstants.messages.MESSAGE_EDITED).toBe('onMessageEdited');
      expect(CometChatUIKitConstants.messages.MESSAGE_SENT).toBe('messageSent');
      expect(CometChatUIKitConstants.messages.DELIVERY).toBe('delivery');
      expect(CometChatUIKitConstants.messages.READ).toBe('read');
      expect(CometChatUIKitConstants.messages.APP_SYSTEM).toBe('app_system');
    });

    it('should not allow modification', () => {
      expect(() => {
        (CometChatUIKitConstants.messages as any).MESSAGE_SENT = 'modified';
      }).toThrow(TypeError);
    });
  });

  describe('details', () => {
    it('should be a frozen object with correct values', () => {
      expect(Object.isFrozen(CometChatUIKitConstants.details)).toBe(true);
      expect(CometChatUIKitConstants.details.primary).toBe('primary');
      expect(CometChatUIKitConstants.details.secondary).toBe('secondary');
    });
  });

  describe('calls', () => {
    it('should be a frozen object', () => {
      expect(Object.isFrozen(CometChatUIKitConstants.calls)).toBe(true);
    });

    it('should have all 14 expected keys', () => {
      const keys = Object.keys(CometChatUIKitConstants.calls);
      expect(keys).toEqual(
        expect.arrayContaining([
          'meeting',
          'ongoing',
          'ended',
          'initiated',
          'cancelled',
          'rejected',
          'unanswered',
          'busy',
          'activecall',
          'default',
          'grid',
          'single',
          'spotlight',
          'tile',
        ])
      );
      expect(keys).toHaveLength(14);
    });

    it('should have correct hardcoded values', () => {
      expect(CometChatUIKitConstants.calls.meeting).toBe('meeting');
      expect(CometChatUIKitConstants.calls.activecall).toBe('cometchat:activecall');
    });
  });

  describe('goalType', () => {
    it('should be a frozen object with 4 keys', () => {
      expect(Object.isFrozen(CometChatUIKitConstants.goalType)).toBe(true);
      const keys = Object.keys(CometChatUIKitConstants.goalType);
      expect(keys).toEqual(expect.arrayContaining(['allOf', 'anyOf', 'anyAction', 'none']));
      expect(keys).toHaveLength(4);
    });
  });

  describe('requestBuilderLimits', () => {
    it('should be a frozen object', () => {
      expect(Object.isFrozen(CometChatUIKitConstants.requestBuilderLimits)).toBe(true);
    });

    it('should have correct numeric values', () => {
      expect(CometChatUIKitConstants.requestBuilderLimits.reactionListLimit).toBe(10);
      expect(CometChatUIKitConstants.requestBuilderLimits.reactionInfoLimit).toBe(10);
      expect(CometChatUIKitConstants.requestBuilderLimits.messageListLimit).toBe(30);
      expect(CometChatUIKitConstants.requestBuilderLimits.usersLimit).toBe(30);
      expect(CometChatUIKitConstants.requestBuilderLimits.groupsLimit).toBe(30);
    });

    it('should have all values as numbers', () => {
      for (const val of Object.values(CometChatUIKitConstants.requestBuilderLimits)) {
        expect(typeof val).toBe('number');
      }
    });

    it('should not allow modification', () => {
      expect(() => {
        (CometChatUIKitConstants.requestBuilderLimits as any).messageListLimit = 999;
      }).toThrow(TypeError);
    });
  });

  describe('radioNames', () => {
    it('should be a frozen object with correct values', () => {
      expect(Object.isFrozen(CometChatUIKitConstants.radioNames)).toBe(true);
      expect(CometChatUIKitConstants.radioNames.conversations).toBe('conversations');
      expect(CometChatUIKitConstants.radioNames.users).toBe('users');
      expect(CometChatUIKitConstants.radioNames.groups).toBe('groups');
      expect(CometChatUIKitConstants.radioNames.changeScope).toBe('changeScope');
      expect(CometChatUIKitConstants.radioNames.groupMembers).toBe('groupMembers');
    });
  });

  describe('mimeTypes', () => {
    it('should be a frozen object with 3 keys', () => {
      expect(Object.isFrozen(CometChatUIKitConstants.mimeTypes)).toBe(true);
      const keys = Object.keys(CometChatUIKitConstants.mimeTypes);
      expect(keys).toEqual(expect.arrayContaining(['audio', 'video', 'image']));
      expect(keys).toHaveLength(3);
    });

    it('should contain wildcard mime type prefixes', () => {
      expect(CometChatUIKitConstants.mimeTypes.audio).toContain('audio/*');
      expect(CometChatUIKitConstants.mimeTypes.video).toContain('video/*');
      expect(CometChatUIKitConstants.mimeTypes.image).toContain('image/*');
    });

    it('should contain common file extensions', () => {
      expect(CometChatUIKitConstants.mimeTypes.audio).toContain('.mp3');
      expect(CometChatUIKitConstants.mimeTypes.audio).toContain('.wav');
      expect(CometChatUIKitConstants.mimeTypes.video).toContain('.mp4');
      expect(CometChatUIKitConstants.mimeTypes.video).toContain('.mov');
      expect(CometChatUIKitConstants.mimeTypes.image).toContain('.jpg');
      expect(CometChatUIKitConstants.mimeTypes.image).toContain('.png');
      expect(CometChatUIKitConstants.mimeTypes.image).toContain('.gif');
      expect(CometChatUIKitConstants.mimeTypes.image).toContain('.webp');
    });

    it('should have string values', () => {
      for (const val of Object.values(CometChatUIKitConstants.mimeTypes)) {
        expect(typeof val).toBe('string');
        expect(val.length).toBeGreaterThan(0);
      }
    });
  });

  describe('streamMessageTypes', () => {
    it('should be a frozen object', () => {
      expect(Object.isFrozen(CometChatUIKitConstants.streamMessageTypes)).toBe(true);
    });

    it('should have all 9 expected keys', () => {
      const keys = Object.keys(CometChatUIKitConstants.streamMessageTypes);
      expect(keys).toEqual(
        expect.arrayContaining([
          'run_started',
          'text_message_start',
          'text_message_content',
          'text_message_end',
          'run_finished',
          'tool_call_start',
          'tool_call_end',
          'tool_call_args',
          'tool_call_result',
        ])
      );
      expect(keys).toHaveLength(9);
    });
  });

  describe('all constant groups are frozen', () => {
    const constantGroups = [
      'MessageCategory',
      'moderationStatus',
      'MessageTypes',
      'groupMemberAction',
      'MessageReceiverType',
      'userStatusType',
      'MessageOption',
      'GroupOptions',
      'GroupMemberOptions',
      'groupMemberScope',
      'UserOptions',
      'ConversationOptions',
      'GroupTypes',
      'liveReaction',
      'messages',
      'details',
      'calls',
      'goalType',
      'requestBuilderLimits',
      'radioNames',
      'mimeTypes',
      'streamMessageTypes',
    ] as const;

    constantGroups.forEach(group => {
      it(`${group} should be a defined frozen object`, () => {
        const value = (CometChatUIKitConstants as any)[group];
        expect(value).toBeDefined();
        expect(typeof value).toBe('object');
        expect(Object.isFrozen(value)).toBe(true);
      });
    });
  });

  describe('all constant values are non-null and non-undefined', () => {
    const constantGroups = [
      'MessageCategory',
      'moderationStatus',
      'MessageTypes',
      'groupMemberAction',
      'MessageReceiverType',
      'userStatusType',
      'MessageOption',
      'GroupOptions',
      'GroupMemberOptions',
      'groupMemberScope',
      'UserOptions',
      'ConversationOptions',
      'GroupTypes',
      'liveReaction',
      'messages',
      'details',
      'calls',
      'goalType',
      'requestBuilderLimits',
      'radioNames',
      'mimeTypes',
      'streamMessageTypes',
    ] as const;

    constantGroups.forEach(group => {
      it(`${group} values should all be non-null and non-undefined`, () => {
        const obj = (CometChatUIKitConstants as any)[group];
        for (const [key, val] of Object.entries(obj)) {
          expect(val, `${group}.${key} should not be null`).not.toBeNull();
          expect(val, `${group}.${key} should not be undefined`).not.toBeUndefined();
        }
      });
    });
  });
});

describe('CometChatUIKitConstants - Property-Based Tests', () => {
  const constantGroupKeys = Object.getOwnPropertyNames(CometChatUIKitConstants).filter(key => {
    if (key === 'prototype' || key === 'length' || key === 'name') return false;
    const val = (CometChatUIKitConstants as any)[key];
    return typeof val === 'object' && val !== null;
  });

  it('should have at least one constant group to test', () => {
    expect(constantGroupKeys.length).toBeGreaterThan(0);
  });

  it('every randomly selected constant group should be frozen', () => {
    fc.assert(
      fc.property(fc.constantFrom(...constantGroupKeys), groupKey => {
        const group = (CometChatUIKitConstants as any)[groupKey];
        expect(Object.isFrozen(group)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('modification attempts on any randomly selected constant group should have no effect', () => {
    fc.assert(
      fc.property(fc.constantFrom(...constantGroupKeys), groupKey => {
        const group = (CometChatUIKitConstants as any)[groupKey];
        const keys = Object.keys(group);
        if (keys.length === 0) return;

        const firstKey = keys[0];
        const originalValue = group[firstKey];

        try {
          group[firstKey] = '__modified__';
        } catch {
          // Expected: TypeError in strict mode
        }

        expect(group[firstKey]).toBe(originalValue);
      }),
      { numRuns: 100 }
    );
  });

  it('adding new properties to any randomly selected constant group should have no effect', () => {
    fc.assert(
      fc.property(fc.constantFrom(...constantGroupKeys), groupKey => {
        const group = (CometChatUIKitConstants as any)[groupKey];
        const keysBefore = Object.keys(group);

        try {
          group['__pbt_new_prop__'] = 'test';
        } catch {
          // Expected: TypeError in strict mode
        }

        const keysAfter = Object.keys(group);
        expect(keysAfter).toEqual(keysBefore);
      }),
      { numRuns: 100 }
    );
  });
});
