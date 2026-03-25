/**
 * FormatterConfigService Tests
 *
 * Categories: Instantiation, Default Formatter Chain, Formatter Registration,
 *             Pipeline Configuration, resetToDefaults, getFormattersWithContext,
 *             Null Formatter Handling
 *
 * Validates: Requirements 5.1, 5.2, 5.4, 5.5, 5.6, 5.8, 14.4, 14.5, 15.7
 *
 * @module services/formatter-config
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup, fetchTestUser } from '../test-setup';
import { FormatterConfigService } from './formatter-config.service';
import { CometChatTextFormatter } from '../formatters/cometchat-text-formatter';
import { CometChatMentionsFormatter } from '../formatters/cometchat-mentions-formatter';
import { CometChatUrlFormatter } from '../formatters/cometchat-url-formatter';
import { CometChatMarkdownFormatter } from '../formatters/cometchat-markdown-formatter';
import { MessageBubbleAlignment } from '../Enums/Enums';
import type { CometChat } from '@cometchat/chat-sdk-javascript';

// ==================== Helpers ====================

/** Minimal concrete formatter for testing custom registration. */
class StubFormatter extends CometChatTextFormatter {
  readonly id: string;
  constructor(id = 'stub', prio = 50) {
    super();
    this.id = id;
    this.priority = prio;
  }
  getRegex(): RegExp {
    return /stub/g;
  }
  format(text: string): string {
    this.originalText = text;
    this.formattedText = text;
    return text;
  }
}

// ==================== Tests ====================

describe('FormatterConfigService', () => {
  let service: FormatterConfigService;
  let realUser: CometChat.User;

  beforeAll(async () => {
    await ensureSdkReady();
    realUser = await fetchTestUser('superhero1');
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormatterConfigService],
    });
    service = TestBed.inject(FormatterConfigService);
  });

  // ============================================================
  // Instantiation
  // ============================================================
  describe('Instantiation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should be a singleton (providedIn root)', () => {
      const second = TestBed.inject(FormatterConfigService);
      expect(second).toBe(service);
    });
  });

  // ============================================================
  // Default Formatter Chain
  // ============================================================
  describe('Default Formatter Chain', () => {
    it('should return three built-in formatters by default', () => {
      const formatters = service.getDefaultFormatters();
      expect(formatters).toHaveLength(3);
    });

    it('should include CometChatMentionsFormatter as first default', () => {
      const formatters = service.getDefaultFormatters();
      expect(formatters[0]).toBeInstanceOf(CometChatMentionsFormatter);
    });

    it('should include CometChatMarkdownFormatter as second default', () => {
      const formatters = service.getDefaultFormatters();
      expect(formatters[1]).toBeInstanceOf(CometChatMarkdownFormatter);
    });

    it('should include CometChatUrlFormatter as third default', () => {
      const formatters = service.getDefaultFormatters();
      expect(formatters[2]).toBeInstanceOf(CometChatUrlFormatter);
    });

    it('should return new array instances on each call (defensive copy)', () => {
      const first = service.getDefaultFormatters();
      const second = service.getDefaultFormatters();
      expect(first).not.toBe(second);
    });

    it('should reuse the same formatter instances across calls (singletons)', () => {
      const first = service.getDefaultFormatters();
      const second = service.getDefaultFormatters();
      expect(first[0]).toBe(second[0]);
      expect(first[1]).toBe(second[1]);
      expect(first[2]).toBe(second[2]);
    });
  });

  // ============================================================
  // Formatter Registration (setDefaultFormatters)
  // ============================================================
  describe('Formatter Registration (setDefaultFormatters)', () => {
    it('should replace defaults with custom formatters', () => {
      const custom = [new StubFormatter('custom-a'), new StubFormatter('custom-b')];
      service.setDefaultFormatters(custom);

      const result = service.getDefaultFormatters();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('custom-a');
      expect(result[1].id).toBe('custom-b');
    });

    it('should not return built-in formatters after custom set', () => {
      service.setDefaultFormatters([new StubFormatter()]);

      const result = service.getDefaultFormatters();
      const hasMentions = result.some(f => f instanceof CometChatMentionsFormatter);
      const hasUrl = result.some(f => f instanceof CometChatUrlFormatter);
      expect(hasMentions).toBe(false);
      expect(hasUrl).toBe(false);
    });

    it('should store a defensive copy (mutating original array has no effect)', () => {
      const custom = [new StubFormatter('a')];
      service.setDefaultFormatters(custom);

      custom.push(new StubFormatter('b'));

      const result = service.getDefaultFormatters();
      expect(result).toHaveLength(1);
    });

    it('should allow setting an empty array', () => {
      service.setDefaultFormatters([]);
      expect(service.getDefaultFormatters()).toHaveLength(0);
    });

    it('should allow overwriting previously set custom formatters', () => {
      service.setDefaultFormatters([new StubFormatter('first')]);
      service.setDefaultFormatters([new StubFormatter('second')]);

      const result = service.getDefaultFormatters();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('second');
    });
  });

  // ============================================================
  // Pipeline Configuration (addFormatters)
  // ============================================================
  describe('Pipeline Configuration (addFormatters)', () => {
    it('should append formatters to the default chain', () => {
      const extra = new StubFormatter('extra');
      service.addFormatters([extra]);

      const result = service.getDefaultFormatters();
      // 3 built-in + 1 extra
      expect(result).toHaveLength(4);
      expect(result[3].id).toBe('extra');
    });

    it('should accumulate multiple addFormatters calls', () => {
      service.addFormatters([new StubFormatter('a')]);
      service.addFormatters([new StubFormatter('b')]);

      const result = service.getDefaultFormatters();
      expect(result).toHaveLength(5); // 3 built-in + 2
    });

    it('should have no effect when custom formatters are set (custom takes precedence)', () => {
      service.addFormatters([new StubFormatter('extra')]);
      service.setDefaultFormatters([new StubFormatter('custom')]);

      const result = service.getDefaultFormatters();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('custom');
    });

    it('should handle adding an empty array', () => {
      service.addFormatters([]);
      expect(service.getDefaultFormatters()).toHaveLength(3);
    });
  });

  // ============================================================
  // resetToDefaults
  // ============================================================
  describe('resetToDefaults', () => {
    it('should clear custom formatters and restore built-in defaults', () => {
      service.setDefaultFormatters([new StubFormatter()]);
      service.resetToDefaults();

      const result = service.getDefaultFormatters();
      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(CometChatMentionsFormatter);
    });

    it('should clear additional formatters', () => {
      service.addFormatters([new StubFormatter()]);
      service.resetToDefaults();

      expect(service.getDefaultFormatters()).toHaveLength(3);
    });

    it('should be safe to call multiple times', () => {
      service.resetToDefaults();
      service.resetToDefaults();
      expect(service.getDefaultFormatters()).toHaveLength(3);
    });

    it('should allow new customization after reset', () => {
      service.setDefaultFormatters([new StubFormatter('old')]);
      service.resetToDefaults();
      service.addFormatters([new StubFormatter('new')]);

      const result = service.getDefaultFormatters();
      expect(result).toHaveLength(4);
      expect(result[3].id).toBe('new');
    });
  });

  // ============================================================
  // getFormattersWithContext
  // ============================================================
  describe('getFormattersWithContext', () => {
    it('should return formatters when called with no arguments', () => {
      const result = service.getFormattersWithContext();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should clone MentionsFormatter instances (not reuse singletons)', () => {
      const defaults = service.getDefaultFormatters();
      const withContext = service.getFormattersWithContext();

      const defaultMentions = defaults.find(f => f instanceof CometChatMentionsFormatter);
      const contextMentions = withContext.find(f => f instanceof CometChatMentionsFormatter);

      expect(contextMentions).not.toBe(defaultMentions);
    });

    it('should pass through non-mentions formatters as-is', () => {
      const defaults = service.getDefaultFormatters();
      const withContext = service.getFormattersWithContext();

      const defaultUrl = defaults.find(f => f instanceof CometChatUrlFormatter);
      const contextUrl = withContext.find(f => f instanceof CometChatUrlFormatter);

      expect(contextUrl).toBe(defaultUrl);
    });

    it('should configure loggedInUser on cloned mentions formatter using real SDK user', () => {
      const result = service.getFormattersWithContext(realUser);

      const mentions = result.find(
        f => f instanceof CometChatMentionsFormatter
      ) as CometChatMentionsFormatter;
      expect(mentions.getLoggedInUser()).toBe(realUser);
    });

    it('should configure alignment on cloned mentions formatter', () => {
      const result = service.getFormattersWithContext(undefined, MessageBubbleAlignment.left);

      const mentions = result.find(
        f => f instanceof CometChatMentionsFormatter
      ) as CometChatMentionsFormatter;
      expect(mentions.getMessageBubbleAlignment()).toBe(MessageBubbleAlignment.left);
    });

    it('should clear alignment when undefined is passed', () => {
      const result = service.getFormattersWithContext(undefined, undefined);

      const mentions = result.find(
        f => f instanceof CometChatMentionsFormatter
      ) as CometChatMentionsFormatter;
      expect(mentions.getMessageBubbleAlignment()).toBeUndefined();
    });

    it('should configure both user and alignment with real SDK user', () => {
      const result = service.getFormattersWithContext(realUser, MessageBubbleAlignment.right);

      const mentions = result.find(
        f => f instanceof CometChatMentionsFormatter
      ) as CometChatMentionsFormatter;
      expect(mentions.getLoggedInUser()).toBe(realUser);
      expect(mentions.getMessageBubbleAlignment()).toBe(MessageBubbleAlignment.right);
    });

    it('should work with custom formatters that include a MentionsFormatter', () => {
      const customMentions = new CometChatMentionsFormatter();
      service.setDefaultFormatters([customMentions, new StubFormatter()]);

      const result = service.getFormattersWithContext(realUser, MessageBubbleAlignment.right);

      expect(result).toHaveLength(2);
      const mentions = result.find(
        f => f instanceof CometChatMentionsFormatter
      ) as CometChatMentionsFormatter;
      expect(mentions).not.toBe(customMentions); // cloned
      expect(mentions.getLoggedInUser()).toBe(realUser);
      expect(mentions.getMessageBubbleAlignment()).toBe(MessageBubbleAlignment.right);
    });

    it('should work when custom formatters have no MentionsFormatter', () => {
      service.setDefaultFormatters([new StubFormatter('a'), new StubFormatter('b')]);

      const result = service.getFormattersWithContext(undefined, MessageBubbleAlignment.left);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('a');
      expect(result[1].id).toBe('b');
    });

    it('should preserve formatter count from defaults', () => {
      service.addFormatters([new StubFormatter('extra')]);
      const result = service.getFormattersWithContext(realUser);
      // 3 built-in + 1 extra
      expect(result).toHaveLength(4);
    });
  });

  // ============================================================
  // Null Formatter Handling
  // ============================================================
  describe('Null Formatter Handling', () => {
    it('should not throw when setDefaultFormatters receives null entries', () => {
      expect(() =>
        service.setDefaultFormatters([null as unknown as CometChatTextFormatter])
      ).not.toThrow();
    });

    it('should not throw when addFormatters receives null entries', () => {
      expect(() =>
        service.addFormatters([null as unknown as CometChatTextFormatter])
      ).not.toThrow();
    });

    it('should not throw when getFormattersWithContext receives null user', () => {
      expect(() => service.getFormattersWithContext(null as any)).not.toThrow();
    });

    it('should not throw when getFormattersWithContext receives null alignment', () => {
      expect(() => service.getFormattersWithContext(undefined, null as any)).not.toThrow();
    });

    it('should handle mixed null and valid formatters in setDefaultFormatters', () => {
      const valid = new StubFormatter('valid');
      service.setDefaultFormatters([null as any, valid, undefined as any]);

      const result = service.getDefaultFormatters();
      expect(result).toHaveLength(3);
      expect(result[1].id).toBe('valid');
    });
  });
});
