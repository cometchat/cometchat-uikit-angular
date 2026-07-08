/**
 * ConversationSubtitleService Tests
 *
 * Covers: registerSubtitleFormatter, unregisterSubtitleFormatter,
 *         registerSubtitleIconOverride, getSubtitle, getIconOverride,
 *         hasFormatter, error handling in formatters.
 *
 * @module services/conversation-subtitle
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ConversationSubtitleService } from './conversation-subtitle.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockMessage(type = 'text', text = 'Hello'): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('uid1', text, CometChat.RECEIVER_TYPE.USER);
  return msg as unknown as CometChat.BaseMessage;
}

describe('ConversationSubtitleService', () => {
  let service: ConversationSubtitleService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConversationSubtitleService);
  });

  // ==================== Initialization ====================

  describe('Initialization', () => {
    it('should be injectable via TestBed (providedIn root)', () => {
      expect(service).toBeTruthy();
    });

    it('should start with no formatters registered', () => {
      expect(service.hasFormatter('message_text')).toBe(false);
    });

    it('should return null for getSubtitle when no formatter registered', () => {
      const msg = makeMockMessage();
      expect(service.getSubtitle('message_text', msg)).toBeNull();
    });

    it('should return null for getIconOverride when none registered', () => {
      expect(service.getIconOverride('message_text')).toBeNull();
    });
  });

  // ==================== registerSubtitleFormatter ====================

  describe('registerSubtitleFormatter', () => {
    it('should register a formatter and hasFormatter returns true', () => {
      service.registerSubtitleFormatter('message_text', () => 'Text message');
      expect(service.hasFormatter('message_text')).toBe(true);
    });

    it('should replace an existing formatter on re-registration', () => {
      service.registerSubtitleFormatter('message_text', () => 'First');
      service.registerSubtitleFormatter('message_text', () => 'Second');
      const msg = makeMockMessage();
      expect(service.getSubtitle('message_text', msg)).toBe('Second');
    });

    it('should register formatters for multiple type keys independently', () => {
      service.registerSubtitleFormatter('message_text', () => 'Text');
      service.registerSubtitleFormatter('message_image', () => 'Image');
      const msg = makeMockMessage();
      expect(service.getSubtitle('message_text', msg)).toBe('Text');
      expect(service.getSubtitle('message_image', msg)).toBe('Image');
    });
  });

  // ==================== unregisterSubtitleFormatter ====================

  describe('unregisterSubtitleFormatter', () => {
    it('should remove a registered formatter', () => {
      service.registerSubtitleFormatter('message_text', () => 'Text');
      service.unregisterSubtitleFormatter('message_text');
      expect(service.hasFormatter('message_text')).toBe(false);
    });

    it('should return null from getSubtitle after unregistering', () => {
      service.registerSubtitleFormatter('message_text', () => 'Text');
      service.unregisterSubtitleFormatter('message_text');
      const msg = makeMockMessage();
      expect(service.getSubtitle('message_text', msg)).toBeNull();
    });

    it('should not throw when unregistering a non-existent formatter', () => {
      expect(() => service.unregisterSubtitleFormatter('nonexistent_type')).not.toThrow();
    });

    it('should only remove the specified formatter, leaving others intact', () => {
      service.registerSubtitleFormatter('message_text', () => 'Text');
      service.registerSubtitleFormatter('message_image', () => 'Image');
      service.unregisterSubtitleFormatter('message_text');
      expect(service.hasFormatter('message_text')).toBe(false);
      expect(service.hasFormatter('message_image')).toBe(true);
    });
  });

  // ==================== getSubtitle ====================

  describe('getSubtitle', () => {
    it('should call the registered formatter with the message', () => {
      const formatter = vi.fn().mockReturnValue('Custom subtitle');
      service.registerSubtitleFormatter('message_text', formatter);
      const msg = makeMockMessage();
      const result = service.getSubtitle('message_text', msg);
      expect(formatter).toHaveBeenCalledWith(msg);
      expect(result).toBe('Custom subtitle');
    });

    it('should return the formatted string from the formatter', () => {
      service.registerSubtitleFormatter('message_image', () => '📷 Photo');
      const msg = makeMockMessage('image');
      expect(service.getSubtitle('message_image', msg)).toBe('📷 Photo');
    });

    it('should return null and not throw when formatter throws', () => {
      service.registerSubtitleFormatter('message_text', () => {
        throw new Error('Formatter error');
      });
      const msg = makeMockMessage();
      expect(() => service.getSubtitle('message_text', msg)).not.toThrow();
      expect(service.getSubtitle('message_text', msg)).toBeNull();
    });

    it('should return null for an unregistered type key', () => {
      const msg = makeMockMessage();
      expect(service.getSubtitle('message_video', msg)).toBeNull();
    });

    it('should pass the message object to the formatter correctly', () => {
      const capturedMessages: CometChat.BaseMessage[] = [];
      service.registerSubtitleFormatter('message_text', (m) => {
        capturedMessages.push(m);
        return 'ok';
      });
      const msg = makeMockMessage();
      service.getSubtitle('message_text', msg);
      expect(capturedMessages[0]).toBe(msg);
    });

    it('should support formatters that return empty string', () => {
      service.registerSubtitleFormatter('message_text', () => '');
      const msg = makeMockMessage();
      expect(service.getSubtitle('message_text', msg)).toBe('');
    });
  });

  // ==================== registerSubtitleIconOverride ====================

  describe('registerSubtitleIconOverride', () => {
    it('should register an icon override', () => {
      service.registerSubtitleIconOverride('message_image', 'camera-icon');
      expect(service.getIconOverride('message_image')).toBe('camera-icon');
    });

    it('should replace an existing icon override on re-registration', () => {
      service.registerSubtitleIconOverride('message_image', 'old-icon');
      service.registerSubtitleIconOverride('message_image', 'new-icon');
      expect(service.getIconOverride('message_image')).toBe('new-icon');
    });

    it('should register icon overrides for multiple type keys independently', () => {
      service.registerSubtitleIconOverride('message_image', 'camera');
      service.registerSubtitleIconOverride('message_audio', 'microphone');
      expect(service.getIconOverride('message_image')).toBe('camera');
      expect(service.getIconOverride('message_audio')).toBe('microphone');
    });
  });

  // ==================== getIconOverride ====================

  describe('getIconOverride', () => {
    it('should return the registered icon name', () => {
      service.registerSubtitleIconOverride('message_video', 'video-icon');
      expect(service.getIconOverride('message_video')).toBe('video-icon');
    });

    it('should return null when no icon override is registered', () => {
      expect(service.getIconOverride('message_file')).toBeNull();
    });

    it('should return null after registering for a different type key', () => {
      service.registerSubtitleIconOverride('message_image', 'camera');
      expect(service.getIconOverride('message_video')).toBeNull();
    });
  });

  // ==================== hasFormatter ====================

  describe('hasFormatter', () => {
    it('should return false when no formatter is registered', () => {
      expect(service.hasFormatter('message_text')).toBe(false);
    });

    it('should return true after registering a formatter', () => {
      service.registerSubtitleFormatter('message_text', () => 'Text');
      expect(service.hasFormatter('message_text')).toBe(true);
    });

    it('should return false after unregistering', () => {
      service.registerSubtitleFormatter('message_text', () => 'Text');
      service.unregisterSubtitleFormatter('message_text');
      expect(service.hasFormatter('message_text')).toBe(false);
    });

    it('should return false for a different type key', () => {
      service.registerSubtitleFormatter('message_text', () => 'Text');
      expect(service.hasFormatter('message_image')).toBe(false);
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle custom type keys (e.g., location_custom)', () => {
      service.registerSubtitleFormatter('location_custom', () => '📍 Location');
      const msg = makeMockMessage();
      expect(service.getSubtitle('location_custom', msg)).toBe('📍 Location');
    });

    it('should handle formatter that uses message data', () => {
      service.registerSubtitleFormatter('message_text', (msg) => {
        return `Message: ${(msg as any).getText?.() ?? 'unknown'}`;
      });
      const msg = new CometChat.TextMessage('uid1', 'Hello world', CometChat.RECEIVER_TYPE.USER);
      const result = service.getSubtitle('message_text', msg as unknown as CometChat.BaseMessage);
      expect(result).toContain('Hello world');
    });

    it('should handle multiple registrations and unregistrations without state corruption', () => {
      service.registerSubtitleFormatter('message_text', () => 'A');
      service.registerSubtitleFormatter('message_image', () => 'B');
      service.unregisterSubtitleFormatter('message_text');
      service.registerSubtitleFormatter('message_text', () => 'C');
      const msg = makeMockMessage();
      expect(service.getSubtitle('message_text', msg)).toBe('C');
      expect(service.getSubtitle('message_image', msg)).toBe('B');
    });
  });
});
