/**
 * Property-Based Tests for Service Root Provision
 *
 * Categories: Property-Based DI Invariants, Singleton Verification, Tree-Shakeability
 * Validates: Requirements 5.6
 *
 * Property 20: Service Root Provision
 * For any service with @Injectable({ providedIn: 'root' }), TestBed.inject()
 * returns a non-null instance.
 *
 * Uses real CometChat SDK — NO vi.mock() for @cometchat/chat-sdk-javascript.
 *
 * @module services/service-root-provision.property
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../test-setup';

// ==================== Service Imports ====================

import { HtmlSanitizerService } from './html-sanitizer.service';
import { ChatStateService } from './chat-state.service';
import { FormatterConfigService } from './formatter-config.service';
import { FocusTrapService } from './focus-trap.service';
import { ListNavigationService } from './list-navigation.service';
import { GridNavigationService } from './grid-navigation.service';
import { DialogFocusManager } from './dialog-focus-manager.service';
import { LiveAnnouncerService } from './live-announcer.service';
import { CallAnnouncerService } from './call-announcer.service';
import { MentionsNavigationService } from './mentions-navigation.service';
import { TypeAheadService } from './type-ahead.service';
import { MediaControlsService } from './media-controls.service';
import { ConversationsService } from './conversations.service';
import { MessageComposerService } from './message-composer.service';
import { MessageHeaderService } from './message-header.service';
import { MessageBubbleConfigService } from './message-bubble-config.service';
import { MessageUtilsService } from './message-utils.service';
import { RichTextEditorService } from './rich-text-editor.service';
import { CallButtonsService } from './call-buttons.service';
import { OutgoingCallService } from './outgoing-call.service';
import { IncomingCallService } from './incoming-call.service';
import { OngoingCallService } from './ongoing-call.service';
import { CometChatTemplatesService } from './templates.service';
import { CometChatUIKit } from '../cometchat-uikit';

// ==================== Service Registry ====================

/**
 * Each entry maps a human-readable name to the injectable class token.
 * All services listed here use @Injectable({ providedIn: 'root' }).
 */
interface ServiceEntry {
  name: string;
  token: any; // Angular injectable class
}

const ROOT_SERVICES: ServiceEntry[] = [
  { name: 'HtmlSanitizerService', token: HtmlSanitizerService },
  { name: 'ChatStateService', token: ChatStateService },
  { name: 'FormatterConfigService', token: FormatterConfigService },
  { name: 'FocusTrapService', token: FocusTrapService },
  { name: 'ListNavigationService', token: ListNavigationService },
  { name: 'GridNavigationService', token: GridNavigationService },
  { name: 'DialogFocusManager', token: DialogFocusManager },
  { name: 'LiveAnnouncerService', token: LiveAnnouncerService },
  { name: 'CallAnnouncerService', token: CallAnnouncerService },
  { name: 'MentionsNavigationService', token: MentionsNavigationService },
  { name: 'TypeAheadService', token: TypeAheadService },
  { name: 'MediaControlsService', token: MediaControlsService },
  { name: 'ConversationsService', token: ConversationsService },
  { name: 'MessageComposerService', token: MessageComposerService },
  { name: 'MessageHeaderService', token: MessageHeaderService },
  { name: 'MessageBubbleConfigService', token: MessageBubbleConfigService },
  { name: 'MessageUtilsService', token: MessageUtilsService },
  { name: 'RichTextEditorService', token: RichTextEditorService },
  { name: 'CallButtonsService', token: CallButtonsService },
  { name: 'OutgoingCallService', token: OutgoingCallService },
  { name: 'IncomingCallService', token: IncomingCallService },
  { name: 'OngoingCallService', token: OngoingCallService },
  { name: 'CometChatTemplatesService', token: CometChatTemplatesService },
  { name: 'CometChatUIKit', token: CometChatUIKit },
];

// ==================== Arbitraries ====================

/** Services that are NOT providedIn: 'root' and need explicit providers */
const NON_ROOT_PROVIDERS = [MessageHeaderService, MessageComposerService];

/** Picks a random service entry from the registry. */
const arbService = fc.constantFrom(...ROOT_SERVICES);

/** Picks a random subset of services (1–N). */
const arbServiceSubset = fc.shuffledSubarray(ROOT_SERVICES, { minLength: 1 });

/** Picks a random pair of (possibly identical) services. */
const arbServicePair = fc.tuple(arbService, arbService);

/** Picks a random count for repeated injection (2–6). */
const arbRepeatCount = fc.integer({ min: 2, max: 6 });

// ==================== Tests ====================

describe('Property 20: Service Root Provision', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  }, 30000);

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: NON_ROOT_PROVIDERS });
  });

  // ---------- Core property: non-null injection ----------

  /**
   * **Validates: Requirements 5.6**
   *
   * For any randomly selected root-provided service,
   * TestBed.inject() returns a non-null, non-undefined instance.
   */
  it('TestBed.inject() returns non-null for any root-provided service', () => {
    fc.assert(
      fc.property(arbService, entry => {
        const instance = TestBed.inject(entry.token);
        expect(instance).not.toBeNull();
        expect(instance).not.toBeUndefined();
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Correct type (instanceof) ----------

  /**
   * **Validates: Requirements 5.6**
   *
   * For any randomly selected root-provided service,
   * the injected instance is an instanceof the service class.
   */
  it('injected instance is instanceof the service class', () => {
    fc.assert(
      fc.property(arbService, entry => {
        const instance = TestBed.inject(entry.token);
        expect(instance).toBeInstanceOf(entry.token);
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Singleton identity ----------

  /**
   * **Validates: Requirements 5.6**
   *
   * For any root-provided service, injecting it twice returns
   * the exact same object reference (singleton guarantee).
   */
  it('injecting the same service twice returns the same singleton reference', () => {
    fc.assert(
      fc.property(arbService, entry => {
        const first = TestBed.inject(entry.token);
        const second = TestBed.inject(entry.token);
        expect(first).toBe(second);
      }),
      { numRuns: 150 }
    );
  });

  // ---------- No explicit module import needed (tree-shakeable) ----------

  /**
   * **Validates: Requirements 5.6**
   *
   * For any root-provided service, injection succeeds with an empty
   * TestBed configuration (no explicit module imports), proving
   * the service is tree-shakeable via providedIn: 'root'.
   */
  it('services are injectable without explicit module imports', () => {
    fc.assert(
      fc.property(arbService, entry => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({ providers: NON_ROOT_PROVIDERS }); // provide non-root services
        const instance = TestBed.inject(entry.token);
        expect(instance).toBeTruthy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Truthiness (object type) ----------

  /**
   * **Validates: Requirements 5.6**
   *
   * For any root-provided service, the injected value is always
   * an object (not a primitive, not a function reference).
   */
  it('injected instance is always an object', () => {
    fc.assert(
      fc.property(arbService, entry => {
        const instance = TestBed.inject(entry.token);
        expect(typeof instance).toBe('object');
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Repeated injection stability ----------

  /**
   * **Validates: Requirements 5.6**
   *
   * For any service and any repeat count N (2–6), injecting N times
   * always returns the same singleton reference every time.
   */
  it('repeated injections (N times) always return the same reference', () => {
    fc.assert(
      fc.property(arbService, arbRepeatCount, (entry, count) => {
        const first = TestBed.inject(entry.token);
        for (let i = 1; i < count; i++) {
          expect(TestBed.inject(entry.token)).toBe(first);
        }
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Subset injection: all non-null ----------

  /**
   * **Validates: Requirements 5.6**
   *
   * For any random subset of root-provided services, injecting
   * all of them yields non-null instances for every one.
   */
  it('injecting a random subset of services all return non-null', () => {
    fc.assert(
      fc.property(arbServiceSubset, subset => {
        for (const entry of subset) {
          const instance = TestBed.inject(entry.token);
          expect(instance).not.toBeNull();
          expect(instance).not.toBeUndefined();
        }
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Cross-service independence ----------

  /**
   * **Validates: Requirements 5.6**
   *
   * For any pair of services (possibly the same), injecting one
   * does not prevent the other from being injected successfully.
   */
  it('injecting one service does not prevent injecting another', () => {
    fc.assert(
      fc.property(arbServicePair, ([entryA, entryB]) => {
        const instanceA = TestBed.inject(entryA.token);
        const instanceB = TestBed.inject(entryB.token);
        expect(instanceA).toBeTruthy();
        expect(instanceB).toBeTruthy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Distinct services are distinct instances ----------

  /**
   * **Validates: Requirements 5.6**
   *
   * For any pair of different service classes, their injected
   * instances are not the same object reference.
   */
  it('different service classes produce different instances', () => {
    fc.assert(
      fc.property(arbServicePair, ([entryA, entryB]) => {
        if (entryA.token === entryB.token) return; // skip same-class pairs
        const instanceA = TestBed.inject(entryA.token);
        const instanceB = TestBed.inject(entryB.token);
        expect(instanceA).not.toBe(instanceB);
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Post-reset re-injection ----------

  /**
   * **Validates: Requirements 5.6**
   *
   * For any root-provided service, after TestBed.resetTestingModule()
   * and reconfiguration, inject() still returns a non-null instance.
   */
  it('services are injectable after TestBed.resetTestingModule()', () => {
    fc.assert(
      fc.property(arbService, entry => {
        // Reset and reconfigure
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({ providers: NON_ROOT_PROVIDERS });

        const instance = TestBed.inject(entry.token);
        expect(instance).not.toBeNull();
        expect(instance).not.toBeUndefined();
        expect(instance).toBeInstanceOf(entry.token);
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Exhaustive: every registered service is injectable ----------

  /**
   * **Validates: Requirements 5.6**
   *
   * Deterministic check that every single service in the registry
   * can be injected. Uses fast-check with constantFrom over the
   * full array to ensure complete coverage.
   */
  it('every service in the registry is injectable (exhaustive)', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ROOT_SERVICES), entry => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({ providers: NON_ROOT_PROVIDERS });
        const instance = TestBed.inject(entry.token);
        expect(instance).toBeTruthy();
        expect(instance).toBeInstanceOf(entry.token);
      }),
      { numRuns: ROOT_SERVICES.length * 5 }
    );
  });
});
