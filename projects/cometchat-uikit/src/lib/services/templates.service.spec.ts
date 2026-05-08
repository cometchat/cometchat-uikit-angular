/**
 * CometChatTemplatesService Tests
 *
 * Categories: Instantiation, Conversation Template Registration & Retrieval,
 *             Bulk Conversation Template Operations, Default Template Fallback,
 *             Clear Operations, List Template Registration & Retrieval,
 *             Reactive State Propagation, Null Template Handling
 *
 * Validates: Requirements 5.1, 5.2, 5.4, 5.5, 5.6, 5.8, 14.4, 14.5, 15.7
 *
 * Uses real CometChat SDK — NO vi.mock() for chat SDK packages.
 * The calls SDK mock below is required because @cometchat/calls-sdk-javascript
 * has a JitsiMeetJS runtime dependency that doesn't exist in jsdom.
 *
 * @module services/templates
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
  CometChatTemplatesService,
  ConversationTemplates,
  ListTemplates,
} from './templates.service';

// ==================== Helpers ====================

/** Creates a fake TemplateRef for testing — sufficient for identity/reference checks. */
function createFakeTemplateRef(label = 'fake'): TemplateRef<any> {
  return { _label: label } as unknown as TemplateRef<any>;
}

// ==================== Tests ====================

describe('CometChatTemplatesService', () => {
  let service: CometChatTemplatesService;

  beforeAll(async () => {
    await ensureSdkReady();
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 30_000);

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CometChatTemplatesService);
    // Start each test with a clean slate
    service.clearConversationTemplates();
    service.clearListTemplates();
  });

  // ============================================================
  // Instantiation
  // ============================================================
  describe('Instantiation', () => {
    it('should be provided in root', () => {
      expect(service).toBeTruthy();
    });

    it('should be an instance of CometChatTemplatesService', () => {
      expect(service).toBeInstanceOf(CometChatTemplatesService);
    });

    it('should return empty conversation templates by default', () => {
      const templates = service.getConversationTemplates();
      expect(templates).toEqual({});
    });

    it('should return empty list templates by default', () => {
      const templates = service.getListTemplates();
      expect(templates).toEqual({});
    });

    it('should expose conversationTemplates$ observable', () => {
      expect(service.conversationTemplates$).toBeDefined();
    });

    it('should expose listTemplates$ observable', () => {
      expect(service.listTemplates$).toBeDefined();
    });
  });

  // ============================================================
  // Readonly Signal Access
  // ============================================================
  describe('Readonly Signal Access', () => {
    it('should expose conversationTemplates as a readonly signal', () => {
      expect(service.conversationTemplates).toBeDefined();
      expect(typeof service.conversationTemplates).toBe('function');
    });

    it('should expose listTemplates as a readonly signal', () => {
      expect(service.listTemplates).toBeDefined();
      expect(typeof service.listTemplates).toBe('function');
    });

    it('should return empty object from conversationTemplates() by default', () => {
      expect(service.conversationTemplates()).toEqual({});
    });

    it('should return empty object from listTemplates() by default', () => {
      expect(service.listTemplates()).toEqual({});
    });

    it('should update conversationTemplates() when setter is called', () => {
      const tpl = createFakeTemplateRef('item');
      service.setConversationItemTemplate(tpl);
      expect(service.conversationTemplates().itemView).toBe(tpl);
    });

    it('should update listTemplates() when setListTemplates is called', () => {
      const tpl = createFakeTemplateRef('item');
      service.setListTemplates({ itemTemplate: tpl });
      expect(service.listTemplates().itemTemplate).toBe(tpl);
    });

    it('should return same value from signal and getter for conversation templates', () => {
      const tpl = createFakeTemplateRef('item');
      service.setConversationItemTemplate(tpl);
      expect(service.conversationTemplates()).toEqual(service.getConversationTemplates());
    });

    it('should return same value from signal and getter for list templates', () => {
      const tpl = createFakeTemplateRef('item');
      service.setListTemplates({ itemTemplate: tpl });
      expect(service.listTemplates()).toEqual(service.getListTemplates());
    });

    it('should reflect bulk conversation template updates via signal', () => {
      const itemTpl = createFakeTemplateRef('item');
      const loadingTpl = createFakeTemplateRef('loading');
      service.setConversationTemplates({
        itemView: itemTpl,
        loadingView: loadingTpl,
      });
      const signalValue = service.conversationTemplates();
      expect(signalValue.itemView).toBe(itemTpl);
      expect(signalValue.loadingView).toBe(loadingTpl);
    });

    it('should reset conversationTemplates() to empty after clear', () => {
      service.setConversationItemTemplate(createFakeTemplateRef('item'));
      service.clearConversationTemplates();
      expect(service.conversationTemplates()).toEqual({});
    });

    it('should reset listTemplates() to empty after clear', () => {
      service.setListTemplates({ itemTemplate: createFakeTemplateRef('item') });
      service.clearListTemplates();
      expect(service.listTemplates()).toEqual({});
    });
  });

  // ============================================================
  // Conversation Template Registration & Retrieval
  // ============================================================
  describe('Conversation Template Registration & Retrieval', () => {
    it('should register and retrieve itemView template', () => {
      const tpl = createFakeTemplateRef('item');
      service.setConversationItemTemplate(tpl);
      expect(service.getConversationTemplates().itemView).toBe(tpl);
    });

    it('should register and retrieve leadingView template', () => {
      const tpl = createFakeTemplateRef('leading');
      service.setConversationLeadingTemplate(tpl);
      expect(service.getConversationTemplates().leadingView).toBe(tpl);
    });

    it('should register and retrieve titleView template', () => {
      const tpl = createFakeTemplateRef('title');
      service.setConversationTitleTemplate(tpl);
      expect(service.getConversationTemplates().titleView).toBe(tpl);
    });

    it('should register and retrieve subtitleView template', () => {
      const tpl = createFakeTemplateRef('subtitle');
      service.setConversationSubtitleTemplate(tpl);
      expect(service.getConversationTemplates().subtitleView).toBe(tpl);
    });

    it('should register and retrieve trailingView template', () => {
      const tpl = createFakeTemplateRef('trailing');
      service.setConversationTrailingTemplate(tpl);
      expect(service.getConversationTemplates().trailingView).toBe(tpl);
    });

    it('should register and retrieve loadingView template', () => {
      const tpl = createFakeTemplateRef('loading');
      service.setConversationLoadingTemplate(tpl);
      expect(service.getConversationTemplates().loadingView).toBe(tpl);
    });

    it('should register and retrieve emptyView template', () => {
      const tpl = createFakeTemplateRef('empty');
      service.setConversationEmptyTemplate(tpl);
      expect(service.getConversationTemplates().emptyView).toBe(tpl);
    });

    it('should register and retrieve errorView template', () => {
      const tpl = createFakeTemplateRef('error');
      service.setConversationErrorTemplate(tpl);
      expect(service.getConversationTemplates().errorView).toBe(tpl);
    });

    it('should merge templates when setting multiple individually', () => {
      const itemTpl = createFakeTemplateRef('item');
      const leadingTpl = createFakeTemplateRef('leading');

      service.setConversationItemTemplate(itemTpl);
      service.setConversationLeadingTemplate(leadingTpl);

      const templates = service.getConversationTemplates();
      expect(templates.itemView).toBe(itemTpl);
      expect(templates.leadingView).toBe(leadingTpl);
    });

    it('should override a previously set template for the same slot', () => {
      const tpl1 = createFakeTemplateRef('v1');
      const tpl2 = createFakeTemplateRef('v2');

      service.setConversationItemTemplate(tpl1);
      service.setConversationItemTemplate(tpl2);

      expect(service.getConversationTemplates().itemView).toBe(tpl2);
    });
  });

  // ============================================================
  // Bulk Conversation Template Operations
  // ============================================================
  describe('setConversationTemplates (bulk)', () => {
    it('should set multiple templates at once', () => {
      const itemTpl = createFakeTemplateRef('item');
      const loadingTpl = createFakeTemplateRef('loading');
      const emptyTpl = createFakeTemplateRef('empty');

      service.setConversationTemplates({
        itemView: itemTpl,
        loadingView: loadingTpl,
        emptyView: emptyTpl,
      });

      const templates = service.getConversationTemplates();
      expect(templates.itemView).toBe(itemTpl);
      expect(templates.loadingView).toBe(loadingTpl);
      expect(templates.emptyView).toBe(emptyTpl);
    });

    it('should merge with existing templates', () => {
      const existingTpl = createFakeTemplateRef('existing');
      const newTpl = createFakeTemplateRef('new');

      service.setConversationItemTemplate(existingTpl);
      service.setConversationTemplates({ loadingView: newTpl });

      const templates = service.getConversationTemplates();
      expect(templates.itemView).toBe(existingTpl);
      expect(templates.loadingView).toBe(newTpl);
    });

    it('should handle empty partial object', () => {
      service.setConversationTemplates({});
      expect(service.getConversationTemplates()).toEqual({});
    });
  });

  // ============================================================
  // Default Template Fallback
  // ============================================================
  describe('Default Template Fallback', () => {
    it('should return undefined for unset conversation template slots', () => {
      const templates = service.getConversationTemplates();
      expect(templates.itemView).toBeUndefined();
      expect(templates.leadingView).toBeUndefined();
      expect(templates.titleView).toBeUndefined();
      expect(templates.subtitleView).toBeUndefined();
      expect(templates.trailingView).toBeUndefined();
      expect(templates.loadingView).toBeUndefined();
      expect(templates.emptyView).toBeUndefined();
      expect(templates.errorView).toBeUndefined();
    });

    it('should return undefined for unset list template slots', () => {
      const templates = service.getListTemplates();
      expect(templates.itemTemplate).toBeUndefined();
      expect(templates.loadingTemplate).toBeUndefined();
      expect(templates.emptyTemplate).toBeUndefined();
      expect(templates.errorTemplate).toBeUndefined();
      expect(templates.headerTemplate).toBeUndefined();
      expect(templates.footerTemplate).toBeUndefined();
    });

    it('should only have set slots defined after partial registration', () => {
      const tpl = createFakeTemplateRef('loading');
      service.setConversationLoadingTemplate(tpl);

      const templates = service.getConversationTemplates();
      expect(templates.loadingView).toBe(tpl);
      expect(templates.itemView).toBeUndefined();
      expect(templates.errorView).toBeUndefined();
    });
  });

  // ============================================================
  // Clear Operations
  // ============================================================
  describe('clearConversationTemplates', () => {
    it('should reset all conversation templates to empty', () => {
      service.setConversationItemTemplate(createFakeTemplateRef('item'));
      service.setConversationLoadingTemplate(createFakeTemplateRef('loading'));

      service.clearConversationTemplates();

      const templates = service.getConversationTemplates();
      expect(templates).toEqual({});
    });

    it('should allow new registrations after clearing', () => {
      service.setConversationItemTemplate(createFakeTemplateRef('before'));
      service.clearConversationTemplates();

      const newTpl = createFakeTemplateRef('after');
      service.setConversationItemTemplate(newTpl);

      expect(service.getConversationTemplates().itemView).toBe(newTpl);
    });

    it('should not affect list templates', () => {
      const listTpl = createFakeTemplateRef('listItem');
      service.setListTemplates({ itemTemplate: listTpl });
      service.setConversationItemTemplate(createFakeTemplateRef('convItem'));

      service.clearConversationTemplates();

      expect(service.getListTemplates().itemTemplate).toBe(listTpl);
    });
  });

  describe('clearListTemplates', () => {
    it('should reset all list templates to empty', () => {
      service.setListTemplates({
        itemTemplate: createFakeTemplateRef('item'),
        loadingTemplate: createFakeTemplateRef('loading'),
      });

      service.clearListTemplates();

      expect(service.getListTemplates()).toEqual({});
    });

    it('should not affect conversation templates', () => {
      const convTpl = createFakeTemplateRef('convItem');
      service.setConversationItemTemplate(convTpl);
      service.setListTemplates({ itemTemplate: createFakeTemplateRef('listItem') });

      service.clearListTemplates();

      expect(service.getConversationTemplates().itemView).toBe(convTpl);
    });
  });

  // ============================================================
  // List Template Registration & Retrieval
  // ============================================================
  describe('List Template Registration & Retrieval', () => {
    it('should set and retrieve list templates', () => {
      const itemTpl = createFakeTemplateRef('item');
      const loadingTpl = createFakeTemplateRef('loading');

      service.setListTemplates({
        itemTemplate: itemTpl,
        loadingTemplate: loadingTpl,
      });

      const templates = service.getListTemplates();
      expect(templates.itemTemplate).toBe(itemTpl);
      expect(templates.loadingTemplate).toBe(loadingTpl);
    });

    it('should merge with existing list templates', () => {
      const itemTpl = createFakeTemplateRef('item');
      const headerTpl = createFakeTemplateRef('header');

      service.setListTemplates({ itemTemplate: itemTpl });
      service.setListTemplates({ headerTemplate: headerTpl });

      const templates = service.getListTemplates();
      expect(templates.itemTemplate).toBe(itemTpl);
      expect(templates.headerTemplate).toBe(headerTpl);
    });

    it('should override existing list template for the same slot', () => {
      const tpl1 = createFakeTemplateRef('v1');
      const tpl2 = createFakeTemplateRef('v2');

      service.setListTemplates({ itemTemplate: tpl1 });
      service.setListTemplates({ itemTemplate: tpl2 });

      expect(service.getListTemplates().itemTemplate).toBe(tpl2);
    });

    it('should handle empty partial object', () => {
      service.setListTemplates({});
      expect(service.getListTemplates()).toEqual({});
    });

    it('should support all list template slots', () => {
      const templates = {
        itemTemplate: createFakeTemplateRef('item'),
        loadingTemplate: createFakeTemplateRef('loading'),
        emptyTemplate: createFakeTemplateRef('empty'),
        errorTemplate: createFakeTemplateRef('error'),
        headerTemplate: createFakeTemplateRef('header'),
        footerTemplate: createFakeTemplateRef('footer'),
      };

      service.setListTemplates(templates);

      const result = service.getListTemplates();
      expect(result.itemTemplate).toBe(templates.itemTemplate);
      expect(result.loadingTemplate).toBe(templates.loadingTemplate);
      expect(result.emptyTemplate).toBe(templates.emptyTemplate);
      expect(result.errorTemplate).toBe(templates.errorTemplate);
      expect(result.headerTemplate).toBe(templates.headerTemplate);
      expect(result.footerTemplate).toBe(templates.footerTemplate);
    });
  });

  // ============================================================
  // Reactive State Propagation (BehaviorSubject)
  // ============================================================
  describe('Reactive State Propagation', () => {
    it('should emit initial empty conversation templates to subscribers', () => {
      let emitted: ConversationTemplates | undefined;
      service.conversationTemplates$.subscribe(t => (emitted = t));
      expect(emitted).toEqual({});
    });

    it('should emit updated conversation templates when a setter is called', () => {
      const emissions: ConversationTemplates[] = [];
      service.conversationTemplates$.subscribe(t => emissions.push(t));

      const tpl = createFakeTemplateRef('item');
      service.setConversationItemTemplate(tpl);

      // Initial {} + update with itemView
      expect(emissions.length).toBe(2);
      expect(emissions[1].itemView).toBe(tpl);
    });

    it('should emit updated conversation templates on bulk set', () => {
      const emissions: ConversationTemplates[] = [];
      service.conversationTemplates$.subscribe(t => emissions.push(t));

      const tpl = createFakeTemplateRef('loading');
      service.setConversationTemplates({ loadingView: tpl });

      expect(emissions.length).toBe(2);
      expect(emissions[1].loadingView).toBe(tpl);
    });

    it('should emit empty object on clearConversationTemplates', () => {
      service.setConversationItemTemplate(createFakeTemplateRef('item'));

      const emissions: ConversationTemplates[] = [];
      service.conversationTemplates$.subscribe(t => emissions.push(t));

      service.clearConversationTemplates();

      const last = emissions[emissions.length - 1];
      expect(last).toEqual({});
    });

    it('should emit initial empty list templates to subscribers', () => {
      let emitted: ListTemplates<unknown> | undefined;
      service.listTemplates$.subscribe(t => (emitted = t));
      expect(emitted).toEqual({});
    });

    it('should emit updated list templates when setListTemplates is called', () => {
      const emissions: ListTemplates<unknown>[] = [];
      service.listTemplates$.subscribe(t => emissions.push(t));

      const tpl = createFakeTemplateRef('item');
      service.setListTemplates({ itemTemplate: tpl });

      expect(emissions.length).toBe(2);
      expect(emissions[1].itemTemplate).toBe(tpl);
    });

    it('should emit empty object on clearListTemplates', () => {
      service.setListTemplates({ itemTemplate: createFakeTemplateRef('item') });

      const emissions: ListTemplates<unknown>[] = [];
      service.listTemplates$.subscribe(t => emissions.push(t));

      service.clearListTemplates();

      const last = emissions[emissions.length - 1];
      expect(last).toEqual({});
    });
  });

  // ============================================================
  // Null Template Handling
  // ============================================================
  describe('Null Template Handling', () => {
    it('should not throw when setting null as itemView template', () => {
      expect(() =>
        service.setConversationItemTemplate(null as unknown as TemplateRef<any>)
      ).not.toThrow();
    });

    it('should store null and return it for itemView', () => {
      service.setConversationItemTemplate(null as unknown as TemplateRef<any>);
      expect(service.getConversationTemplates().itemView).toBeNull();
    });

    it('should not throw when setting null as loadingView template', () => {
      expect(() =>
        service.setConversationLoadingTemplate(null as unknown as TemplateRef<any>)
      ).not.toThrow();
    });

    it('should not throw when setting null as emptyView template', () => {
      expect(() =>
        service.setConversationEmptyTemplate(null as unknown as TemplateRef<any>)
      ).not.toThrow();
    });

    it('should not throw when setting null as errorView template', () => {
      expect(() =>
        service.setConversationErrorTemplate(null as unknown as TemplateRef<any>)
      ).not.toThrow();
    });

    it('should not throw when bulk setting with null values', () => {
      expect(() =>
        service.setConversationTemplates({
          itemView: null as unknown as TemplateRef<any>,
          loadingView: null as unknown as TemplateRef<any>,
        })
      ).not.toThrow();
    });

    it('should not throw when setting null list templates', () => {
      expect(() =>
        service.setListTemplates({
          itemTemplate: null as unknown as TemplateRef<any>,
          loadingTemplate: null as unknown as TemplateRef<any>,
        })
      ).not.toThrow();
    });

    it('should not throw when clearing already empty conversation templates', () => {
      expect(() => service.clearConversationTemplates()).not.toThrow();
    });

    it('should not throw when clearing already empty list templates', () => {
      expect(() => service.clearListTemplates()).not.toThrow();
    });

    it('should not throw when setting undefined values via bulk set', () => {
      expect(() =>
        service.setConversationTemplates({
          itemView: undefined,
          leadingView: undefined,
        })
      ).not.toThrow();
    });
  });

  // ── Memory Leak: BehaviorSubject completion on destroy (ENG-34638) ─────────

  describe('BehaviorSubject cleanup on service destroy', () => {
    it('should complete sharedTemplates$ when service is destroyed', () => {
      let completed = false;
      service.sharedTemplates$.subscribe({ complete: () => (completed = true) });

      TestBed.resetTestingModule();

      expect(completed).toBe(true);
    });

    it('should complete conversationTemplates$ when service is destroyed', () => {
      let completed = false;
      service.conversationTemplates$.subscribe({ complete: () => (completed = true) });

      TestBed.resetTestingModule();

      expect(completed).toBe(true);
    });

    it('should complete userTemplates$ when service is destroyed', () => {
      let completed = false;
      service.userTemplates$.subscribe({ complete: () => (completed = true) });

      TestBed.resetTestingModule();

      expect(completed).toBe(true);
    });

    it('should complete groupTemplates$ when service is destroyed', () => {
      let completed = false;
      service.groupTemplates$.subscribe({ complete: () => (completed = true) });

      TestBed.resetTestingModule();

      expect(completed).toBe(true);
    });

    it('should complete groupMemberTemplates$ when service is destroyed', () => {
      let completed = false;
      service.groupMemberTemplates$.subscribe({ complete: () => (completed = true) });

      TestBed.resetTestingModule();

      expect(completed).toBe(true);
    });

    it('should complete callLogTemplates$ when service is destroyed', () => {
      let completed = false;
      service.callLogTemplates$.subscribe({ complete: () => (completed = true) });

      TestBed.resetTestingModule();

      expect(completed).toBe(true);
    });

    it('should complete messageListTemplates$ when service is destroyed', () => {
      let completed = false;
      service.messageListTemplates$.subscribe({ complete: () => (completed = true) });

      TestBed.resetTestingModule();

      expect(completed).toBe(true);
    });

    it('should complete searchTemplates$ when service is destroyed', () => {
      let completed = false;
      service.searchTemplates$.subscribe({ complete: () => (completed = true) });

      TestBed.resetTestingModule();

      expect(completed).toBe(true);
    });

    it('should complete listTemplates$ when service is destroyed', () => {
      let completed = false;
      service.listTemplates$.subscribe({ complete: () => (completed = true) });

      TestBed.resetTestingModule();

      expect(completed).toBe(true);
    });
  });
});
