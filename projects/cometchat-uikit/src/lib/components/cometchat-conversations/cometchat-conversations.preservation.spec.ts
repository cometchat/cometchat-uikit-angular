/**
 * Preservation Property Tests
 *
 * Property 2: Preservation — 3-tier priority system and public API unchanged
 *
 * These tests capture the EXISTING correct behavior of the cometchat-conversations
 * component that must be preserved after the bugfix. They run on UNFIXED code
 * and verify:
 *
 * 1. The 3-tier priority system resolves correctly at initialization:
 *    - Tier 1: Explicit @Input value (highest priority)
 *    - Tier 2: Global config value
 *    - Tier 3: Internal default value (lowest priority)
 *
 * 2. Public getter returns a plain value (not a WritableSignal object)
 *
 * 3. @Output events continue to emit with the same event names
 *
 * EXPECTED: All tests PASS on unfixed code (confirms baseline behavior to preserve).
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { TestBed } from '@angular/core/testing';
import { EventEmitter } from '@angular/core';
import { CometChatConversationsComponent } from './cometchat-conversations.component';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';

// ============================================
// Helper: Create component with optional global config
// ============================================

function createComponent(globalConfig?: Partial<GlobalConfig>): CometChatConversationsComponent {
  TestBed.resetTestingModule();
  const providers: any[] = [];
  if (globalConfig !== undefined) {
    providers.push({ provide: COMETCHAT_GLOBAL_CONFIG, useValue: globalConfig });
  }
  TestBed.configureTestingModule({ providers });

  let comp!: CometChatConversationsComponent;
  TestBed.runInInjectionContext(() => {
    comp = new CometChatConversationsComponent();
  });
  return comp;
}

// ============================================
// 3-tier priority reference implementation
// ============================================

/**
 * Reference implementation of the 3-tier priority system.
 * Used to verify the component's computed signals produce identical results.
 */
function resolvePriority<T>(
  explicitlySet: boolean,
  explicitValue: T,
  globalConfigValue: T | undefined,
  defaultValue: T
): T {
  if (explicitlySet) return explicitValue;
  if (globalConfigValue !== undefined) return globalConfigValue;
  return defaultValue;
}


// ============================================
// Test Suite 1: Property-Based Test — 3-Tier Priority System
// ============================================

describe('Preservation: 3-tier priority system and public API unchanged', () => {

  describe('Property-based test: 3-tier priority resolves identically to spec', () => {
    /**
     * **Validates: Requirements 3.1, 3.2, 3.3**
     *
     * For all combinations of (explicitValue present/absent, globalConfigValue present/absent),
     * the effectiveXxx computed resolves identically to the 3-tier priority spec:
     *   1. Explicit @Input → use explicit value
     *   2. Global config set → use global config value
     *   3. Neither → use default
     *
     * NOTE: We only test initial values (single read) because runtime changes
     * are broken on unfixed code. This captures the priority logic itself.
     */
    it('effectiveHideReceipts resolves per 3-tier priority for all (explicit, globalConfig) combos', () => {
      fc.assert(
        fc.property(
          fc.record({
            setExplicit: fc.boolean(),
            explicitValue: fc.boolean(),
            setGlobalConfig: fc.boolean(),
            globalConfigValue: fc.boolean(),
          }),
          ({ setExplicit, explicitValue, setGlobalConfig, globalConfigValue }) => {
            const globalConfig: Partial<GlobalConfig> = {};
            if (setGlobalConfig) {
              globalConfig.hideReceipts = globalConfigValue;
            }

            const comp = createComponent(
              setGlobalConfig ? globalConfig : undefined
            );

            if (setExplicit) {
              comp.hideReceipts = explicitValue;
            }

            const expected = resolvePriority(
              setExplicit,
              explicitValue,
              setGlobalConfig ? globalConfigValue : undefined,
              false // default for hideReceipts
            );

            expect(comp.effectiveHideReceipts()).toBe(expected);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('effectiveCustomSoundForMessages resolves per 3-tier priority for all (explicit, globalConfig) combos', () => {
      fc.assert(
        fc.property(
          fc.record({
            setExplicit: fc.boolean(),
            explicitValue: fc.string({ minLength: 0, maxLength: 30 }),
            setGlobalConfig: fc.boolean(),
            globalConfigValue: fc.string({ minLength: 1, maxLength: 30 }),
          }),
          ({ setExplicit, explicitValue, setGlobalConfig, globalConfigValue }) => {
            const globalConfig: Partial<GlobalConfig> = {};
            if (setGlobalConfig) {
              globalConfig.customSoundForMessages = globalConfigValue;
            }

            const comp = createComponent(
              setGlobalConfig ? globalConfig : undefined
            );

            if (setExplicit) {
              comp.customSoundForMessages = explicitValue;
            }

            const expected = resolvePriority(
              setExplicit,
              explicitValue,
              setGlobalConfig ? globalConfigValue : undefined,
              '' // default for customSoundForMessages
            );

            expect(comp.effectiveCustomSoundForMessages()).toBe(expected);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('effectiveDisableDefaultContextMenu resolves per 3-tier priority (default=true)', () => {
      fc.assert(
        fc.property(
          fc.record({
            setExplicit: fc.boolean(),
            explicitValue: fc.boolean(),
            setGlobalConfig: fc.boolean(),
            globalConfigValue: fc.boolean(),
          }),
          ({ setExplicit, explicitValue, setGlobalConfig, globalConfigValue }) => {
            const globalConfig: Partial<GlobalConfig> = {};
            if (setGlobalConfig) {
              globalConfig.disableDefaultContextMenu = globalConfigValue;
            }

            const comp = createComponent(
              setGlobalConfig ? globalConfig : undefined
            );

            if (setExplicit) {
              comp.disableDefaultContextMenu = explicitValue;
            }

            const expected = resolvePriority(
              setExplicit,
              explicitValue,
              setGlobalConfig ? globalConfigValue : undefined,
              true // default for disableDefaultContextMenu is true
            );

            expect(comp.effectiveDisableDefaultContextMenu()).toBe(expected);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ============================================
  // Test Suite 2: Getter returns plain value, NOT a WritableSignal
  // ============================================

  describe('Public getter returns plain boolean, not a WritableSignal object', () => {
    /**
     * **Validates: Requirements 3.4**
     *
     * The public getter `component.hideReceipts` must return a plain boolean value,
     * NOT a WritableSignal<boolean> object. This ensures backward compatibility
     * for parent components that read the property imperatively.
     *
     * A WritableSignal is a function (typeof === 'function'), so we verify
     * the getter returns a primitive boolean (typeof === 'boolean').
     */
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
    });

    it('hideReceipts getter returns typeof boolean, not function', () => {
      const comp = createComponent();
      // Default value
      expect(typeof comp.hideReceipts).toBe('boolean');
      expect(typeof comp.hideReceipts).not.toBe('function');

      // After setting a value
      comp.hideReceipts = true;
      expect(typeof comp.hideReceipts).toBe('boolean');
      expect(typeof comp.hideReceipts).not.toBe('function');
      expect(comp.hideReceipts).toBe(true);
    });

    it('hideError getter returns typeof boolean, not function', () => {
      const comp = createComponent();
      expect(typeof comp.hideError).toBe('boolean');
      expect(typeof comp.hideError).not.toBe('function');
    });

    it('showScrollbar getter returns typeof boolean, not function', () => {
      const comp = createComponent();
      expect(typeof comp.showScrollbar).toBe('boolean');
      expect(typeof comp.showScrollbar).not.toBe('function');
    });

    it('customSoundForMessages getter returns typeof string, not function', () => {
      const comp = createComponent();
      expect(typeof comp.customSoundForMessages).toBe('string');
      expect(typeof comp.customSoundForMessages).not.toBe('function');
    });

    it('textFormatters getter returns an array, not a function', () => {
      const comp = createComponent();
      expect(Array.isArray(comp.textFormatters)).toBe(true);
      expect(typeof comp.textFormatters).not.toBe('function');
    });
  });

  // ============================================
  // Test Suite 3: @Output events continue to emit with same event names
  // ============================================

  describe('@Output events continue to emit with same event names', () => {
    /**
     * **Validates: Requirements 3.6**
     *
     * Verify that all @Output event emitters exist on the component instance
     * and are EventEmitter instances. This ensures the public API surface
     * for event binding is preserved after the fix.
     */
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
    });

    it('all expected @Output event emitters exist and are EventEmitter instances', () => {
      const comp = createComponent();

      const expectedOutputs = [
        'itemClick',
        'select',
        'error',
        'searchBarClick',
        'contextMenuOpen',
        'contextMenuClose',
        'scrollToTop',
        'scrollToBottom',
        'selectionChange',
      ] as const;

      for (const outputName of expectedOutputs) {
        const emitter = (comp as any)[outputName];
        expect(emitter).toBeDefined();
        expect(emitter).toBeInstanceOf(EventEmitter);
      }
    });

    it('itemClick emits the value passed to emit()', () => {
      const comp = createComponent();
      const emitted: any[] = [];
      comp.itemClick.subscribe((val: any) => emitted.push(val));

      const mockConversation = { id: 'test-123' } as any;
      comp.itemClick.emit(mockConversation);

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toBe(mockConversation);
    });

    it('error emits the value passed to emit()', () => {
      const comp = createComponent();
      const emitted: any[] = [];
      comp.error.subscribe((val: any) => emitted.push(val));

      const mockError = { code: 'ERR', message: 'test' } as any;
      comp.error.emit(mockError);

      expect(emitted).toHaveLength(1);
      expect(emitted[0]).toBe(mockError);
    });
  });
});
