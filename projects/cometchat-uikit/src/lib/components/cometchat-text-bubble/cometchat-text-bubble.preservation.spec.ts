/**
 * Preservation Property Tests
 *
 * Property 2: Preservation - Explicit Formatters and GlobalConfig Behavior Unchanged
 *
 * These tests verify EXISTING behavior on UNFIXED code that must NOT change after the fix.
 * They capture the 3-tier priority system for resolving textFormatters:
 *   1. Explicitly set @Input value (textFormattersExplicitlySet = true)
 *   2. GlobalConfig value (if defined via COMETCHAT_GLOBAL_CONFIG injection token)
 *   3. Component default ([])
 *
 * EXPECTED: All tests PASS on unfixed code (confirms baseline behavior to preserve).
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { TestBed } from '@angular/core/testing';

import { CometChatTextBubbleComponent } from './cometchat-text-bubble.component';
import { FormatterConfigService } from '../../services/formatter-config.service';
import { HtmlSanitizerService } from '../../services/html-sanitizer.service';
import { COMETCHAT_GLOBAL_CONFIG } from '../../services/global-config.service';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';

// ============================================
// Mock Formatter for Testing
// ============================================

/**
 * Minimal concrete CometChatTextFormatter for testing explicit formatter inputs.
 * We only need instances that can be identity-compared — no real formatting logic needed.
 */
class MockTextFormatter extends CometChatTextFormatter {
  readonly id: string;

  constructor(id: string, priority = 100) {
    super();
    this.id = id;
    this.priority = priority;
  }

  getRegex(): RegExp {
    return /mock/g;
  }

  format(text: string): string {
    return text;
  }
}

// ============================================
// Helper: Create component with Angular DI context
// ============================================

/**
 * Create a CometChatTextBubbleComponent instance with proper Angular DI context.
 * Uses TestBed.runInInjectionContext so inject() calls at field level work correctly.
 */
function createTextBubbleComponent(): CometChatTextBubbleComponent {
  const mockSanitizer = {
    bypassSecurityTrustHtml: (html: string) => html,
    sanitize: (_ctx: any, value: any) => value,
  } as any;

  const mockCdr = {
    detectChanges: vi.fn(),
    markForCheck: vi.fn(),
  } as any;

  const formatterConfig = TestBed.inject(FormatterConfigService);
  const htmlSanitizer = TestBed.inject(HtmlSanitizerService);

  let comp!: CometChatTextBubbleComponent;
  TestBed.runInInjectionContext(() => {
    comp = new CometChatTextBubbleComponent(mockSanitizer, mockCdr, formatterConfig, htmlSanitizer);
  });

  return comp;
}

// ============================================
// Generators
// ============================================

/** Generate a random non-empty array of mock formatters (1-5 formatters). */
const nonEmptyFormatterArrayArb = fc.integer({ min: 1, max: 5 }).chain(count =>
  fc
    .tuple(
      ...Array.from({ length: count }, (_, i) =>
        fc.record({
          id: fc.constant(`formatter-${i}`),
          priority: fc.integer({ min: 1, max: 200 }),
        })
      )
    )
    .map(configs => configs.map(cfg => new MockTextFormatter(cfg.id, cfg.priority)))
);

/** Generate a MessageBubbleAlignment value. */
const alignmentArb = fc.constantFrom(MessageBubbleAlignment.left, MessageBubbleAlignment.right);

/** Generate plain text strings (no mentions, URLs, or markdown). */
const plainTextArb = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter(s => !s.includes('<@') && !s.includes('http') && !s.includes('**'));

// ============================================
// Preservation Tests
// ============================================

describe('Preservation: Explicit Formatters and GlobalConfig Behavior Unchanged', () => {
  // ------------------------------------------
  // 1. Explicit Formatters Preservation
  // ------------------------------------------
  describe('Explicit Formatters Preservation (Req 3.1, 3.2)', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [FormatterConfigService, HtmlSanitizerService],
      });
    });

    /**
     * When textFormatters is explicitly set to a NON-EMPTY array,
     * the component must set textFormattersExplicitlySet = true.
     *
     * **Validates: Requirements 3.1, 3.2**
     */
    it('sets textFormattersExplicitlySet = true when given a non-empty formatter array', () => {
      fc.assert(
        fc.property(nonEmptyFormatterArrayArb, alignmentArb, (formatters, _alignment) => {
          const comp = createTextBubbleComponent();

          comp.textFormatters = formatters;

          const explicitlySet = (comp as any).textFormattersExplicitlySet();
          expect(explicitlySet).toBe(true);
        }),
        { numRuns: 30 }
      );
    });

    /**
     * When textFormatters is explicitly set to a NON-EMPTY array,
     * effectiveTextFormatters() must return those exact formatters.
     *
     * **Validates: Requirements 3.1, 3.2**
     */
    it('effectiveTextFormatters() returns the explicitly provided formatters', () => {
      fc.assert(
        fc.property(nonEmptyFormatterArrayArb, alignmentArb, (formatters, _alignment) => {
          const comp = createTextBubbleComponent();

          comp.textFormatters = formatters;

          const effective = comp.effectiveTextFormatters();

          // Must return the same formatter instances
          expect(effective).toHaveLength(formatters.length);
          formatters.forEach((f, i) => {
            expect(effective[i]).toBe(f);
          });
        }),
        { numRuns: 30 }
      );
    });
  });

  // ------------------------------------------
  // 2. GlobalConfig Preservation
  // ------------------------------------------
  describe('GlobalConfig Preservation (Req 3.4)', () => {
    const globalFormatters = [
      new MockTextFormatter('global-mentions', 20),
      new MockTextFormatter('global-url', 100),
    ];

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          FormatterConfigService,
          HtmlSanitizerService,
          {
            provide: COMETCHAT_GLOBAL_CONFIG,
            useValue: { textFormatters: globalFormatters },
          },
        ],
      });
    });

    /**
     * When no explicit textFormatters are set but GlobalConfig.textFormatters
     * is defined, effectiveTextFormatters() must return the GlobalConfig formatters.
     *
     * **Validates: Requirements 3.4**
     */
    it('effectiveTextFormatters() returns GlobalConfig formatters when no explicit input', () => {
      fc.assert(
        fc.property(alignmentArb, _alignment => {
          const comp = createTextBubbleComponent();

          // Do NOT set textFormatters — let GlobalConfig take effect
          const effective = comp.effectiveTextFormatters();

          expect(effective).toHaveLength(globalFormatters.length);
          globalFormatters.forEach((f, i) => {
            expect(effective[i]).toBe(f);
          });
        }),
        { numRuns: 10 }
      );
    });

    /**
     * Explicit formatters must take priority over GlobalConfig formatters.
     * This verifies tier 1 > tier 2 in the priority system.
     *
     * **Validates: Requirements 3.2, 3.4**
     */
    it('explicit formatters take priority over GlobalConfig formatters', () => {
      fc.assert(
        fc.property(nonEmptyFormatterArrayArb, alignmentArb, (explicitFormatters, _alignment) => {
          const comp = createTextBubbleComponent();

          comp.textFormatters = explicitFormatters;

          const effective = comp.effectiveTextFormatters();

          // Must return explicit formatters, NOT GlobalConfig ones
          expect(effective).toHaveLength(explicitFormatters.length);
          explicitFormatters.forEach((f, i) => {
            expect(effective[i]).toBe(f);
          });
        }),
        { numRuns: 20 }
      );
    });
  });

  // ------------------------------------------
  // 3. Plain Text Preservation
  // ------------------------------------------
  describe('Plain Text Preservation (Req 3.3)', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [FormatterConfigService, HtmlSanitizerService],
      });
    });

    /**
     * Plain text messages without special formatting should not be affected
     * by the formatter state. The component should accept plain text regardless
     * of whether formatters are explicitly set or not.
     *
     * We verify the component's internal state is consistent: when no formatters
     * are explicitly set, textFormattersExplicitlySet remains false and
     * effectiveTextFormatters() returns the default empty array.
     *
     * **Validates: Requirements 3.3**
     */
    it('component defaults are correct when no formatters are set (plain text scenario)', () => {
      fc.assert(
        fc.property(plainTextArb, alignmentArb, (_text, _alignment) => {
          const comp = createTextBubbleComponent();

          // Do NOT set textFormatters — simulates plain text rendering
          const explicitlySet = (comp as any).textFormattersExplicitlySet();
          const effective = comp.effectiveTextFormatters();

          expect(explicitlySet).toBe(false);
          expect(effective).toEqual([]);
        }),
        { numRuns: 30 }
      );
    });
  });
});
