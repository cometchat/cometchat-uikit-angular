/**
 * MessageBubbleConfigService Tests
 *
 * Categories: Instantiation, setBubbleView, setGlobalView, setGlobalViews,
 *             getView (Priority Resolution), setMessageTemplates,
 *             clearAll, clearType, clearGlobalViews, Null/Edge Cases
 *
 * Validates: Requirements 5.1, 5.2, 5.4, 5.6, 5.8, 14.4, 14.5, 15.7
 *
 * Uses real CometChat SDK — NO vi.mock() for chat SDK packages.
 * The calls SDK mock below is required because @cometchat/calls-sdk-javascript
 * has a JitsiMeetJS runtime dependency that doesn't exist in jsdom.
 *
 * @module services/message-bubble-config
 */

// ==================== Calls SDK Mock (JitsiMeetJS workaround) ====================
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TemplateRef } from '@angular/core';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import {
  MessageBubbleConfigService,
  BubblePart,
  BubblePartMap,
} from './message-bubble-config.service';

// ==================== Helpers ====================

/** Creates a fake TemplateRef for testing — sufficient for identity/reference checks. */
function createFakeTemplateRef(label = 'fake'): TemplateRef<any> {
  return { _label: label } as unknown as TemplateRef<any>;
}

// ==================== Tests ====================

describe('MessageBubbleConfigService', () => {
  let service: MessageBubbleConfigService;

  beforeAll(async () => {
    await ensureSdkReady();
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 30_000);

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(MessageBubbleConfigService);
    // Start each test with a clean slate
    service.clearAll();
  });

  // ============================================================
  // Instantiation
  // ============================================================
  describe('Instantiation', () => {
    it('should be provided in root', () => {
      expect(service).toBeTruthy();
    });

    it('should be an instance of MessageBubbleConfigService', () => {
      expect(service).toBeInstanceOf(MessageBubbleConfigService);
    });

    it('should return null for any unconfigured type and part', () => {
      expect(service.getView('text_message', 'contentView')).toBeNull();
      expect(service.getView('image_message', 'footerView')).toBeNull();
    });
  });

  // ============================================================
  // setBubbleView
  // ============================================================
  describe('setBubbleView', () => {
    it('should store a view for a specific message type and part', () => {
      const tpl = createFakeTemplateRef('textContent');
      service.setBubbleView('text_message', { contentView: tpl });
      expect(service.getView('text_message', 'contentView')).toBe(tpl);
    });

    it('should not affect other message types', () => {
      const tpl = createFakeTemplateRef('textContent');
      service.setBubbleView('text_message', { contentView: tpl });
      expect(service.getView('image_message', 'contentView')).toBeNull();
    });

    it('should not affect other parts of the same message type', () => {
      const tpl = createFakeTemplateRef('textContent');
      service.setBubbleView('text_message', { contentView: tpl });
      expect(service.getView('text_message', 'footerView')).toBeNull();
    });

    it('should merge with existing configuration for the same type', () => {
      const contentTpl = createFakeTemplateRef('content');
      const footerTpl = createFakeTemplateRef('footer');

      service.setBubbleView('text_message', { contentView: contentTpl });
      service.setBubbleView('text_message', { footerView: footerTpl });

      expect(service.getView('text_message', 'contentView')).toBe(contentTpl);
      expect(service.getView('text_message', 'footerView')).toBe(footerTpl);
    });

    it('should override a previously set part for the same type', () => {
      const tpl1 = createFakeTemplateRef('v1');
      const tpl2 = createFakeTemplateRef('v2');

      service.setBubbleView('text_message', { contentView: tpl1 });
      service.setBubbleView('text_message', { contentView: tpl2 });

      expect(service.getView('text_message', 'contentView')).toBe(tpl2);
    });

    it('should support setting multiple parts at once', () => {
      const contentTpl = createFakeTemplateRef('content');
      const headerTpl = createFakeTemplateRef('header');

      service.setBubbleView('image_message', {
        contentView: contentTpl,
        headerView: headerTpl,
      });

      expect(service.getView('image_message', 'contentView')).toBe(contentTpl);
      expect(service.getView('image_message', 'headerView')).toBe(headerTpl);
    });
  });

  // ============================================================
  // setGlobalView
  // ============================================================
  describe('setGlobalView', () => {
    it('should store a global view accessible from any message type', () => {
      const tpl = createFakeTemplateRef('globalFooter');
      service.setGlobalView('footerView', tpl);

      expect(service.getView('text_message', 'footerView')).toBe(tpl);
      expect(service.getView('image_message', 'footerView')).toBe(tpl);
    });

    it('should override a previously set global view', () => {
      const tpl1 = createFakeTemplateRef('v1');
      const tpl2 = createFakeTemplateRef('v2');

      service.setGlobalView('footerView', tpl1);
      service.setGlobalView('footerView', tpl2);

      expect(service.getView('text_message', 'footerView')).toBe(tpl2);
    });

    it('should clear a global view when null is passed', () => {
      const tpl = createFakeTemplateRef('globalFooter');
      service.setGlobalView('footerView', tpl);
      service.setGlobalView('footerView', null);

      expect(service.getView('text_message', 'footerView')).toBeNull();
    });

    it('should not affect other global parts', () => {
      const tpl = createFakeTemplateRef('globalFooter');
      service.setGlobalView('footerView', tpl);
      expect(service.getView('text_message', 'headerView')).toBeNull();
    });
  });

  // ============================================================
  // setGlobalViews
  // ============================================================
  describe('setGlobalViews', () => {
    it('should set multiple global views at once', () => {
      const footerTpl = createFakeTemplateRef('footer');
      const statusTpl = createFakeTemplateRef('status');

      service.setGlobalViews({
        footerView: footerTpl,
        statusInfoView: statusTpl,
      });

      expect(service.getView('text_message', 'footerView')).toBe(footerTpl);
      expect(service.getView('text_message', 'statusInfoView')).toBe(statusTpl);
    });

    it('should merge with existing global views', () => {
      const footerTpl = createFakeTemplateRef('footer');
      const headerTpl = createFakeTemplateRef('header');

      service.setGlobalViews({ footerView: footerTpl });
      service.setGlobalViews({ headerView: headerTpl });

      expect(service.getView('text_message', 'footerView')).toBe(footerTpl);
      expect(service.getView('text_message', 'headerView')).toBe(headerTpl);
    });

    it('should override existing global views for the same part', () => {
      const tpl1 = createFakeTemplateRef('v1');
      const tpl2 = createFakeTemplateRef('v2');

      service.setGlobalViews({ footerView: tpl1 });
      service.setGlobalViews({ footerView: tpl2 });

      expect(service.getView('text_message', 'footerView')).toBe(tpl2);
    });
  });

  // ============================================================
  // getView — Priority Resolution
  // ============================================================
  describe('getView (priority resolution)', () => {
    it('should return type-specific view over global view', () => {
      const globalTpl = createFakeTemplateRef('global');
      const typeTpl = createFakeTemplateRef('type');

      service.setGlobalView('contentView', globalTpl);
      service.setBubbleView('text_message', { contentView: typeTpl });

      expect(service.getView('text_message', 'contentView')).toBe(typeTpl);
    });

    it('should fall back to global view when no type-specific view exists', () => {
      const globalTpl = createFakeTemplateRef('global');
      service.setGlobalView('contentView', globalTpl);

      expect(service.getView('text_message', 'contentView')).toBe(globalTpl);
    });

    it('should return null when neither type-specific nor global view exists', () => {
      expect(service.getView('text_message', 'contentView')).toBeNull();
    });

    it('should return null for type-specific null even when global is set', () => {
      const globalTpl = createFakeTemplateRef('global');
      service.setGlobalView('contentView', globalTpl);
      service.setBubbleView('text_message', { contentView: null });

      // Type-specific is explicitly null — should NOT fall through to global
      expect(service.getView('text_message', 'contentView')).toBeNull();
    });

    it('should use global for other types when only one type has specific config', () => {
      const globalTpl = createFakeTemplateRef('global');
      const typeTpl = createFakeTemplateRef('type');

      service.setGlobalView('contentView', globalTpl);
      service.setBubbleView('text_message', { contentView: typeTpl });

      // image_message has no type-specific, should fall back to global
      expect(service.getView('image_message', 'contentView')).toBe(globalTpl);
    });
  });

  // ============================================================
  // setMessageTemplates
  // ============================================================
  describe('setMessageTemplates', () => {
    it('should configure multiple message types at once', () => {
      const textTpl = createFakeTemplateRef('textContent');
      const imageTpl = createFakeTemplateRef('imageContent');

      service.setMessageTemplates({
        text_message: { contentView: textTpl },
        image_message: { contentView: imageTpl },
      });

      expect(service.getView('text_message', 'contentView')).toBe(textTpl);
      expect(service.getView('image_message', 'contentView')).toBe(imageTpl);
    });

    it('should merge with existing type-specific configurations', () => {
      const existingTpl = createFakeTemplateRef('existing');
      const newTpl = createFakeTemplateRef('new');

      service.setBubbleView('text_message', { footerView: existingTpl });
      service.setMessageTemplates({
        text_message: { contentView: newTpl },
      });

      expect(service.getView('text_message', 'footerView')).toBe(existingTpl);
      expect(service.getView('text_message', 'contentView')).toBe(newTpl);
    });

    it('should handle empty templates record', () => {
      service.setMessageTemplates({});
      expect(service.getView('text_message', 'contentView')).toBeNull();
    });

    it('should support all bubble parts in batch', () => {
      const parts: BubblePart[] = [
        'bubbleView',
        'contentView',
        'bottomView',
        'footerView',
        'leadingView',
        'headerView',
        'statusInfoView',
        'replyView',
        'threadView',
      ];
      const tplMap: Record<string, TemplateRef<any>> = {};
      for (const part of parts) {
        tplMap[part] = createFakeTemplateRef(part);
      }

      service.setMessageTemplates({ text_message: tplMap as BubblePartMap });

      for (const part of parts) {
        expect(service.getView('text_message', part as BubblePart)).toBe(tplMap[part]);
      }
    });
  });

  // ============================================================
  // clearAll
  // ============================================================
  describe('clearAll', () => {
    it('should clear all type-specific and global views', () => {
      const typeTpl = createFakeTemplateRef('type');
      const globalTpl = createFakeTemplateRef('global');

      service.setBubbleView('text_message', { contentView: typeTpl });
      service.setGlobalView('footerView', globalTpl);

      service.clearAll();

      expect(service.getView('text_message', 'contentView')).toBeNull();
      expect(service.getView('text_message', 'footerView')).toBeNull();
    });

    it('should allow new configurations after clearing', () => {
      const tpl1 = createFakeTemplateRef('before');
      const tpl2 = createFakeTemplateRef('after');

      service.setBubbleView('text_message', { contentView: tpl1 });
      service.clearAll();
      service.setBubbleView('text_message', { contentView: tpl2 });

      expect(service.getView('text_message', 'contentView')).toBe(tpl2);
    });
  });

  // ============================================================
  // clearType
  // ============================================================
  describe('clearType', () => {
    it('should clear only the specified message type', () => {
      const textTpl = createFakeTemplateRef('text');
      const imageTpl = createFakeTemplateRef('image');

      service.setBubbleView('text_message', { contentView: textTpl });
      service.setBubbleView('image_message', { contentView: imageTpl });

      service.clearType('text_message');

      expect(service.getView('text_message', 'contentView')).toBeNull();
      expect(service.getView('image_message', 'contentView')).toBe(imageTpl);
    });

    it('should not affect global views', () => {
      const globalTpl = createFakeTemplateRef('global');
      const typeTpl = createFakeTemplateRef('type');

      service.setGlobalView('footerView', globalTpl);
      service.setBubbleView('text_message', { contentView: typeTpl });

      service.clearType('text_message');

      expect(service.getView('text_message', 'footerView')).toBe(globalTpl);
    });

    it('should handle clearing a type that was never configured', () => {
      expect(() => service.clearType('nonexistent_type')).not.toThrow();
    });

    it('should fall back to global after type is cleared', () => {
      const globalTpl = createFakeTemplateRef('global');
      const typeTpl = createFakeTemplateRef('type');

      service.setGlobalView('contentView', globalTpl);
      service.setBubbleView('text_message', { contentView: typeTpl });

      expect(service.getView('text_message', 'contentView')).toBe(typeTpl);

      service.clearType('text_message');

      expect(service.getView('text_message', 'contentView')).toBe(globalTpl);
    });
  });

  // ============================================================
  // clearGlobalViews
  // ============================================================
  describe('clearGlobalViews', () => {
    it('should clear all global views', () => {
      const globalTpl = createFakeTemplateRef('global');
      service.setGlobalView('footerView', globalTpl);
      service.setGlobalView('headerView', globalTpl);

      service.clearGlobalViews();

      expect(service.getView('text_message', 'footerView')).toBeNull();
      expect(service.getView('text_message', 'headerView')).toBeNull();
    });

    it('should not affect type-specific views', () => {
      const typeTpl = createFakeTemplateRef('type');
      const globalTpl = createFakeTemplateRef('global');

      service.setBubbleView('text_message', { contentView: typeTpl });
      service.setGlobalView('footerView', globalTpl);

      service.clearGlobalViews();

      expect(service.getView('text_message', 'contentView')).toBe(typeTpl);
      expect(service.getView('text_message', 'footerView')).toBeNull();
    });
  });

  // ============================================================
  // Null / Edge Cases
  // ============================================================
  describe('Null / Edge Cases', () => {
    it('should handle setting a view with an empty BubblePartMap', () => {
      service.setBubbleView('text_message', {});
      expect(service.getView('text_message', 'contentView')).toBeNull();
    });

    it('should handle getView with arbitrary string as message type', () => {
      expect(service.getView('completely_random_type', 'contentView')).toBeNull();
    });

    it('should handle setGlobalViews with empty object', () => {
      service.setGlobalViews({});
      expect(service.getView('text_message', 'contentView')).toBeNull();
    });

    it('should handle setMessageTemplates with empty part maps', () => {
      service.setMessageTemplates({
        text_message: {},
        image_message: {},
      });
      expect(service.getView('text_message', 'contentView')).toBeNull();
      expect(service.getView('image_message', 'contentView')).toBeNull();
    });

    it('should handle rapid set/clear cycles without errors', () => {
      const tpl = createFakeTemplateRef('rapid');
      expect(() => {
        for (let i = 0; i < 50; i++) {
          service.setBubbleView('text_message', { contentView: tpl });
          service.clearAll();
        }
      }).not.toThrow();
      expect(service.getView('text_message', 'contentView')).toBeNull();
    });

    it('should handle setting views for many different message types', () => {
      const types = [
        'text_message',
        'image_message',
        'video_message',
        'audio_message',
        'file_message',
        'delete_action',
        'groupMember_action',
        'audio_call',
        'video_call',
        'extension_poll_custom',
      ];
      for (const type of types) {
        const tpl = createFakeTemplateRef(type);
        service.setBubbleView(type, { contentView: tpl });
      }
      for (const type of types) {
        const view = service.getView(type, 'contentView');
        expect(view).not.toBeNull();
        expect((view as any)._label).toBe(type);
      }
    });
  });
});
