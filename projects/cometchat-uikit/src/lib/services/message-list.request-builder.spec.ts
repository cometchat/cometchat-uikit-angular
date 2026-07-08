/**
 * message-list.request-builder Tests
 *
 * Covers: getDefaultMessageTypesImpl, getDefaultMessageCategoriesImpl.
 *
 * @module services/message-list.request-builder
 */

import { describe, it, expect } from 'vitest';
import {
  getDefaultMessageTypesImpl,
  getDefaultMessageCategoriesImpl,
} from './message-list.request-builder';
import { CometChatUIKitConstants } from '../constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSelf(overrides: Record<string, any> = {}) {
  return {
    replacedMessageTypes: null,
    replacedMessageCategories: null,
    customMessageTypes: new Set<string>(),
    customMessageCategories: new Set<string>(),
    hideGroupActionMessages: false,
    ...overrides,
  };
}

describe('message-list.request-builder', () => {

  // ==================== getDefaultMessageTypesImpl ====================

  describe('getDefaultMessageTypesImpl', () => {
    it('should return default message types', () => {
      const self = makeSelf();
      const types = getDefaultMessageTypesImpl(self);
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
    });

    it('should include text type', () => {
      const self = makeSelf();
      const types = getDefaultMessageTypesImpl(self);
      expect(types).toContain(CometChatUIKitConstants.MessageTypes.text);
    });

    it('should include image type', () => {
      const self = makeSelf();
      const types = getDefaultMessageTypesImpl(self);
      expect(types).toContain(CometChatUIKitConstants.MessageTypes.image);
    });

    it('should include video type', () => {
      const self = makeSelf();
      const types = getDefaultMessageTypesImpl(self);
      expect(types).toContain(CometChatUIKitConstants.MessageTypes.video);
    });

    it('should include audio type', () => {
      const self = makeSelf();
      const types = getDefaultMessageTypesImpl(self);
      expect(types).toContain(CometChatUIKitConstants.MessageTypes.audio);
    });

    it('should include file type', () => {
      const self = makeSelf();
      const types = getDefaultMessageTypesImpl(self);
      expect(types).toContain(CometChatUIKitConstants.MessageTypes.file);
    });

    it('should use replacedMessageTypes when set', () => {
      const self = makeSelf({ replacedMessageTypes: new Set(['custom_type']) });
      const types = getDefaultMessageTypesImpl(self);
      expect(types).toEqual(['custom_type']);
    });

    it('should merge custom types with defaults', () => {
      const self = makeSelf({ customMessageTypes: new Set(['my_custom_type']) });
      const types = getDefaultMessageTypesImpl(self);
      expect(types).toContain('my_custom_type');
      expect(types).toContain(CometChatUIKitConstants.MessageTypes.text);
    });

    it('should not duplicate types when custom type already in defaults', () => {
      const self = makeSelf({ customMessageTypes: new Set([CometChatUIKitConstants.MessageTypes.text]) });
      const types = getDefaultMessageTypesImpl(self);
      const textCount = types.filter(t => t === CometChatUIKitConstants.MessageTypes.text).length;
      expect(textCount).toBe(1);
    });
  });

  // ==================== getDefaultMessageCategoriesImpl ====================

  describe('getDefaultMessageCategoriesImpl', () => {
    it('should return default message categories', () => {
      const self = makeSelf();
      const cats = getDefaultMessageCategoriesImpl(self);
      expect(Array.isArray(cats)).toBe(true);
      expect(cats.length).toBeGreaterThan(0);
    });

    it('should include message category', () => {
      const self = makeSelf();
      const cats = getDefaultMessageCategoriesImpl(self);
      expect(cats).toContain(CometChatUIKitConstants.MessageCategory.message);
    });

    it('should include custom category', () => {
      const self = makeSelf();
      const cats = getDefaultMessageCategoriesImpl(self);
      expect(cats).toContain(CometChatUIKitConstants.MessageCategory.custom);
    });

    it('should include call category', () => {
      const self = makeSelf();
      const cats = getDefaultMessageCategoriesImpl(self);
      expect(cats).toContain(CometChatUIKitConstants.MessageCategory.call);
    });

    it('should include action category when hideGroupActionMessages=false', () => {
      const self = makeSelf({ hideGroupActionMessages: false });
      const cats = getDefaultMessageCategoriesImpl(self);
      expect(cats).toContain(CometChatUIKitConstants.MessageCategory.action);
    });

    it('should exclude action category when hideGroupActionMessages=true', () => {
      const self = makeSelf({ hideGroupActionMessages: true });
      const cats = getDefaultMessageCategoriesImpl(self);
      expect(cats).not.toContain(CometChatUIKitConstants.MessageCategory.action);
    });

    it('should use replacedMessageCategories when set', () => {
      const self = makeSelf({ replacedMessageCategories: new Set(['custom_cat']) });
      const cats = getDefaultMessageCategoriesImpl(self);
      expect(cats).toEqual(['custom_cat']);
    });

    it('should merge custom categories with defaults', () => {
      const self = makeSelf({ customMessageCategories: new Set(['my_category']) });
      const cats = getDefaultMessageCategoriesImpl(self);
      expect(cats).toContain('my_category');
      expect(cats).toContain(CometChatUIKitConstants.MessageCategory.message);
    });
  });
});
