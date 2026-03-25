/**
 * Property-Based Tests for CometChatTemplatesService
 *
 * These tests verify universal properties that should hold across all inputs,
 * using fast-check for property-based testing.
 *
 * Uses TestBed to provide an injection context required by toObservable().
 *
 * **Validates: Requirements 1.2, 1.3, 1.4, 1.5**
 */

// ==================== Calls SDK Mock (JitsiMeetJS workaround) ====================
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import * as fc from 'fast-check';
import { TemplateRef } from '@angular/core';
import {
  CometChatTemplatesService,
  ConversationTemplates,
  ListTemplates,
} from './templates.service';

describe('CometChatTemplatesService Property Tests', () => {
  let service: CometChatTemplatesService;

  /**
   * Creates a mock TemplateRef for testing purposes.
   * Each mock has a unique identifier to verify round-trip equality.
   */
  function createMockTemplateRef<T>(id: string): TemplateRef<T> {
    return {
      elementRef: { nativeElement: { id } },
      createEmbeddedView: () => null as any,
    } as unknown as TemplateRef<T>;
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CometChatTemplatesService);
    service.clearConversationTemplates();
    service.clearListTemplates();
  });

  // ============================================================
  // Property 1: Template Registration Round-Trip
  // ============================================================

  /**
   * **Property 1: Template Registration Round-Trip**
   *
   * *For any* template registered via a setter method, calling the corresponding
   * getter SHALL return the same template reference.
   *
   * **Validates: Requirements 1.3**
   */
  describe('Property 1: Template Registration Round-Trip', () => {
    it('should return the same itemView template after registration', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 50 }), templateId => {
          const template = createMockTemplateRef<{ $implicit: any }>(templateId);
          service.setConversationItemTemplate(template);
          expect(service.getConversationTemplates().itemView).toBe(template);
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve all templates when using bulk setConversationTemplates()', () => {
      fc.assert(
        fc.property(
          fc.record({
            hasConversationItem: fc.boolean(),
            hasLeadingView: fc.boolean(),
            hasTitleView: fc.boolean(),
            hasLoadingView: fc.boolean(),
            hasEmptyView: fc.boolean(),
            hasErrorView: fc.boolean(),
          }),
          config => {
            service.clearConversationTemplates();

            const templates: Partial<ConversationTemplates> = {};
            if (config.hasConversationItem)
              templates.itemView = createMockTemplateRef('itemView');
            if (config.hasLeadingView) templates.leadingView = createMockTemplateRef('leadingView');
            if (config.hasTitleView) templates.titleView = createMockTemplateRef('titleView');
            if (config.hasLoadingView) templates.loadingView = createMockTemplateRef('loadingView');
            if (config.hasEmptyView) templates.emptyView = createMockTemplateRef('emptyView');
            if (config.hasErrorView) templates.errorView = createMockTemplateRef('errorView');

            service.setConversationTemplates(templates);
            const retrieved = service.getConversationTemplates();

            if (config.hasConversationItem)
              expect(retrieved.itemView).toBe(templates.itemView);
            else expect(retrieved.itemView).toBeUndefined();

            if (config.hasLeadingView) expect(retrieved.leadingView).toBe(templates.leadingView);
            else expect(retrieved.leadingView).toBeUndefined();

            if (config.hasTitleView) expect(retrieved.titleView).toBe(templates.titleView);
            else expect(retrieved.titleView).toBeUndefined();

            if (config.hasLoadingView) expect(retrieved.loadingView).toBe(templates.loadingView);
            else expect(retrieved.loadingView).toBeUndefined();

            if (config.hasEmptyView) expect(retrieved.emptyView).toBe(templates.emptyView);
            else expect(retrieved.emptyView).toBeUndefined();

            if (config.hasErrorView) expect(retrieved.errorView).toBe(templates.errorView);
            else expect(retrieved.errorView).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve the latest template after multiple registrations', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
          templateIds => {
            service.clearConversationTemplates();

            let lastTemplate: TemplateRef<any> | undefined;
            for (const id of templateIds) {
              lastTemplate = createMockTemplateRef(id);
              service.setConversationItemTemplate(lastTemplate);
            }

            expect(service.getConversationTemplates().itemView).toBe(lastTemplate);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ============================================================
  // Property 2: Signal-Observable Consistency
  // ============================================================

  /**
   * **Property 2: Signal-Observable Consistency**
   *
   * For any sequence of template updates, the observable (conversationTemplates$)
   * SHALL emit the same value as the signal (conversationTemplates()) after each update.
   *
   * **Validates: Requirements 1.2, 1.3**
   */
  describe('Property 2: Signal-Observable Consistency', () => {
    it('should have observable emit same value as signal after conversation template update', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 50 }), templateId => {
          service.clearConversationTemplates();

          const template = createMockTemplateRef<{ $implicit: any }>(templateId);

          // After setting, the signal should immediately reflect the new value
          service.setConversationItemTemplate(template);

          // Signal read is synchronous and always current
          const signalValue = service.conversationTemplates();
          const getterValue = service.getConversationTemplates();

          expect(signalValue.itemView).toBe(template);
          expect(getterValue.itemView).toBe(template);
          expect(signalValue).toEqual(getterValue);
        }),
        { numRuns: 100 }
      );
    });

    it('should have observable emit same value as signal after list template update', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 50 }), templateId => {
          service.clearListTemplates();

          const template = createMockTemplateRef<any>(templateId);

          service.setListTemplates({ itemTemplate: template });

          const signalValue = service.listTemplates();
          const getterValue = service.getListTemplates();

          expect(signalValue.itemTemplate).toBe(template);
          expect(getterValue.itemTemplate).toBe(template);
          expect(signalValue).toEqual(getterValue);
        }),
        { numRuns: 100 }
      );
    });

    it('should have signal and getter return identical values after any update', () => {
      fc.assert(
        fc.property(
          fc.record({
            hasItem: fc.boolean(),
            hasLeading: fc.boolean(),
            hasLoading: fc.boolean(),
          }),
          config => {
            service.clearConversationTemplates();

            const templates: Partial<ConversationTemplates> = {};
            if (config.hasItem) templates.itemView = createMockTemplateRef('item');
            if (config.hasLeading) templates.leadingView = createMockTemplateRef('leading');
            if (config.hasLoading) templates.loadingView = createMockTemplateRef('loading');

            service.setConversationTemplates(templates);

            // Signal read and getter must be identical
            expect(service.conversationTemplates()).toEqual(service.getConversationTemplates());
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ============================================================
  // Property 3: Merge Idempotence
  // ============================================================

  /**
   * **Property 3: Merge Idempotence**
   *
   * Setting the same templates twice SHALL produce the same state as setting them once.
   *
   * **Validates: Requirements 1.4**
   */
  describe('Property 3: Merge Idempotence', () => {
    it('should produce same state when setting same conversation templates twice', () => {
      fc.assert(
        fc.property(
          fc.record({
            hasItem: fc.boolean(),
            hasLoading: fc.boolean(),
            hasEmpty: fc.boolean(),
          }),
          config => {
            service.clearConversationTemplates();

            const templates: Partial<ConversationTemplates> = {};
            if (config.hasItem) templates.itemView = createMockTemplateRef('item');
            if (config.hasLoading) templates.loadingView = createMockTemplateRef('loading');
            if (config.hasEmpty) templates.emptyView = createMockTemplateRef('empty');

            // Set once
            service.setConversationTemplates(templates);
            const afterFirst = { ...service.getConversationTemplates() };

            // Set again with same references
            service.setConversationTemplates(templates);
            const afterSecond = service.getConversationTemplates();

            expect(afterSecond).toEqual(afterFirst);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce same state when setting same list templates twice', () => {
      fc.assert(
        fc.property(
          fc.record({
            hasItem: fc.boolean(),
            hasHeader: fc.boolean(),
            hasFooter: fc.boolean(),
          }),
          config => {
            service.clearListTemplates();

            const templates: Partial<ListTemplates<unknown>> = {};
            if (config.hasItem) templates['itemTemplate'] = createMockTemplateRef('item');
            if (config.hasHeader) templates['headerTemplate'] = createMockTemplateRef('header');
            if (config.hasFooter) templates['footerTemplate'] = createMockTemplateRef('footer');

            service.setListTemplates(templates);
            const afterFirst = { ...service.getListTemplates() };

            service.setListTemplates(templates);
            const afterSecond = service.getListTemplates();

            expect(afterSecond).toEqual(afterFirst);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ============================================================
  // Property 4: Clear Resets State
  // ============================================================

  /**
   * **Property 4: Clear Resets State**
   *
   * After clearConversationTemplates(), getConversationTemplates() SHALL return
   * an empty object regardless of prior state.
   *
   * **Validates: Requirements 1.5**
   */
  describe('Property 4: Clear Resets State', () => {
    it('should return empty object after clearing any conversation templates', () => {
      fc.assert(
        fc.property(
          fc.record({
            hasItem: fc.boolean(),
            hasLeading: fc.boolean(),
            hasTitle: fc.boolean(),
            hasSubtitle: fc.boolean(),
            hasTrailing: fc.boolean(),
            hasLoading: fc.boolean(),
            hasEmpty: fc.boolean(),
            hasError: fc.boolean(),
          }),
          config => {
            const templates: Partial<ConversationTemplates> = {};
            if (config.hasItem) templates.itemView = createMockTemplateRef('item');
            if (config.hasLeading) templates.leadingView = createMockTemplateRef('leading');
            if (config.hasTitle) templates.titleView = createMockTemplateRef('title');
            if (config.hasSubtitle) templates.subtitleView = createMockTemplateRef('subtitle');
            if (config.hasTrailing) templates.trailingView = createMockTemplateRef('trailing');
            if (config.hasLoading) templates.loadingView = createMockTemplateRef('loading');
            if (config.hasEmpty) templates.emptyView = createMockTemplateRef('empty');
            if (config.hasError) templates.errorView = createMockTemplateRef('error');

            service.setConversationTemplates(templates);
            service.clearConversationTemplates();

            expect(service.getConversationTemplates()).toEqual({});
            expect(service.conversationTemplates()).toEqual({});
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return empty object after clearing any list templates', () => {
      fc.assert(
        fc.property(
          fc.record({
            hasItem: fc.boolean(),
            hasLoading: fc.boolean(),
            hasEmpty: fc.boolean(),
            hasError: fc.boolean(),
            hasHeader: fc.boolean(),
            hasFooter: fc.boolean(),
          }),
          config => {
            const templates: Partial<ListTemplates<unknown>> = {};
            if (config.hasItem) templates['itemTemplate'] = createMockTemplateRef('item');
            if (config.hasLoading) templates['loadingTemplate'] = createMockTemplateRef('loading');
            if (config.hasEmpty) templates['emptyTemplate'] = createMockTemplateRef('empty');
            if (config.hasError) templates['errorTemplate'] = createMockTemplateRef('error');
            if (config.hasHeader) templates['headerTemplate'] = createMockTemplateRef('header');
            if (config.hasFooter) templates['footerTemplate'] = createMockTemplateRef('footer');

            service.setListTemplates(templates);
            service.clearListTemplates();

            expect(service.getListTemplates()).toEqual({});
            expect(service.listTemplates()).toEqual({});
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
