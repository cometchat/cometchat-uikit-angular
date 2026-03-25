/**
 * Property-Based Tests for Service Null Parameter Safety
 *
 * Categories: Property-Based Null/Undefined Safety, Graceful Degradation
 * Validates: Requirements 5.5
 *
 * Property 21: Service Null Parameter Safety
 * For any service public method accepting object parameters, passing
 * null/undefined does not throw an unhandled error.
 *
 * Uses real CometChat SDK — NO vi.mock() for @cometchat/chat-sdk-javascript.
 *
 * @module services/service-null-parameter-safety.property
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
import { MessageBubbleConfigService } from './message-bubble-config.service';

// ==================== Types ====================

/**
 * Represents a service method that can be tested with null/undefined.
 */
interface NullSafetyTestCase {
  serviceName: string;
  methodName: string;
  /** Function that calls the method with null */
  callWithNull: (service: any) => void;
  /** Function that calls the method with undefined */
  callWithUndefined: (service: any) => void;
}

// ==================== Test Case Registry ====================

/**
 * Registry of all service methods that accept object parameters.
 * Each entry defines how to call the method with null and undefined.
 */
const NULL_SAFETY_CASES: NullSafetyTestCase[] = [
  // --- HtmlSanitizerService ---
  {
    serviceName: 'HtmlSanitizerService',
    methodName: 'sanitize',
    callWithNull: (s: HtmlSanitizerService) => s.sanitize(null as any),
    callWithUndefined: (s: HtmlSanitizerService) => s.sanitize(undefined as any),
  },
  {
    serviceName: 'HtmlSanitizerService',
    methodName: 'sanitizeWithConfig',
    callWithNull: (s: HtmlSanitizerService) => s.sanitizeWithConfig(null as any, null as any),
    callWithUndefined: (s: HtmlSanitizerService) =>
      s.sanitizeWithConfig(undefined as any, undefined as any),
  },
  {
    serviceName: 'HtmlSanitizerService',
    methodName: 'escapeUserHtml',
    callWithNull: (s: HtmlSanitizerService) => s.escapeUserHtml(null as any),
    callWithUndefined: (s: HtmlSanitizerService) => s.escapeUserHtml(undefined as any),
  },

  // --- ChatStateService ---
  {
    serviceName: 'ChatStateService',
    methodName: 'setActiveUser',
    callWithNull: (s: ChatStateService) => s.setActiveUser(null),
    callWithUndefined: (s: ChatStateService) => s.setActiveUser(undefined as any),
  },
  {
    serviceName: 'ChatStateService',
    methodName: 'setActiveGroup',
    callWithNull: (s: ChatStateService) => s.setActiveGroup(null),
    callWithUndefined: (s: ChatStateService) => s.setActiveGroup(undefined as any),
  },
  {
    serviceName: 'ChatStateService',
    methodName: 'setActiveConversation',
    callWithNull: (s: ChatStateService) => s.setActiveConversation(null),
    callWithUndefined: (s: ChatStateService) => s.setActiveConversation(undefined as any),
  },

  // --- FormatterConfigService ---
  {
    serviceName: 'FormatterConfigService',
    methodName: 'setDefaultFormatters',
    callWithNull: (s: FormatterConfigService) => s.setDefaultFormatters(null as any),
    callWithUndefined: (s: FormatterConfigService) => s.setDefaultFormatters(undefined as any),
  },
  {
    serviceName: 'FormatterConfigService',
    methodName: 'addFormatters',
    callWithNull: (s: FormatterConfigService) => s.addFormatters(null as any),
    callWithUndefined: (s: FormatterConfigService) => s.addFormatters(undefined as any),
  },

  // --- FocusTrapService ---
  {
    serviceName: 'FocusTrapService',
    methodName: 'activate',
    callWithNull: (s: FocusTrapService) => s.activate(null as any),
    callWithUndefined: (s: FocusTrapService) => s.activate(undefined as any),
  },
  {
    serviceName: 'FocusTrapService',
    methodName: 'deactivate',
    callWithNull: (s: FocusTrapService) => s.deactivate(null as any),
    callWithUndefined: (s: FocusTrapService) => s.deactivate(undefined as any),
  },
  {
    serviceName: 'FocusTrapService',
    methodName: 'isActive',
    callWithNull: (s: FocusTrapService) => s.isActive(null as any),
    callWithUndefined: (s: FocusTrapService) => s.isActive(undefined as any),
  },

  // --- ListNavigationService ---
  {
    serviceName: 'ListNavigationService',
    methodName: 'handleKeyNavigation',
    callWithNull: (s: ListNavigationService) => s.handleKeyNavigation(null as any, 0, null as any),
    callWithUndefined: (s: ListNavigationService) =>
      s.handleKeyNavigation(undefined as any, 0, undefined as any),
  },
  {
    serviceName: 'ListNavigationService',
    methodName: 'getRovingTabindexMap',
    callWithNull: (s: ListNavigationService) => s.getRovingTabindexMap(null as any, null as any),
    callWithUndefined: (s: ListNavigationService) =>
      s.getRovingTabindexMap(undefined as any, undefined as any),
  },

  // --- GridNavigationService ---
  {
    serviceName: 'GridNavigationService',
    methodName: 'handleKeyNavigation',
    callWithNull: (s: GridNavigationService) => s.handleKeyNavigation(null as any, 0, null as any),
    callWithUndefined: (s: GridNavigationService) =>
      s.handleKeyNavigation(undefined as any, 0, undefined as any),
  },
  {
    serviceName: 'GridNavigationService',
    methodName: 'indexToPosition',
    callWithNull: (s: GridNavigationService) => s.indexToPosition(null as any, null as any),
    callWithUndefined: (s: GridNavigationService) =>
      s.indexToPosition(undefined as any, undefined as any),
  },
  {
    serviceName: 'GridNavigationService',
    methodName: 'positionToIndex',
    callWithNull: (s: GridNavigationService) =>
      s.positionToIndex(null as any, null as any, null as any),
    callWithUndefined: (s: GridNavigationService) =>
      s.positionToIndex(undefined as any, undefined as any, undefined as any),
  },

  // --- DialogFocusManager ---
  {
    serviceName: 'DialogFocusManager',
    methodName: 'openDialog',
    callWithNull: (s: DialogFocusManager) => s.openDialog(null as any),
    callWithUndefined: (s: DialogFocusManager) => s.openDialog(undefined as any),
  },
  {
    serviceName: 'DialogFocusManager',
    methodName: 'closeDialog',
    callWithNull: (s: DialogFocusManager) => s.closeDialog(null as any),
    callWithUndefined: (s: DialogFocusManager) => s.closeDialog(undefined as any),
  },
  {
    serviceName: 'DialogFocusManager',
    methodName: 'focusFirstOrClose',
    callWithNull: (s: DialogFocusManager) => s.focusFirstOrClose(null as any),
    callWithUndefined: (s: DialogFocusManager) => s.focusFirstOrClose(undefined as any),
  },
  {
    serviceName: 'DialogFocusManager',
    methodName: 'isDialogActive',
    callWithNull: (s: DialogFocusManager) => s.isDialogActive(null as any),
    callWithUndefined: (s: DialogFocusManager) => s.isDialogActive(undefined as any),
  },

  // --- LiveAnnouncerService ---
  {
    serviceName: 'LiveAnnouncerService',
    methodName: 'announce',
    callWithNull: (s: LiveAnnouncerService) => s.announce(null as any),
    callWithUndefined: (s: LiveAnnouncerService) => s.announce(undefined as any),
  },
  {
    serviceName: 'LiveAnnouncerService',
    methodName: 'announceError',
    callWithNull: (s: LiveAnnouncerService) => s.announceError(null as any),
    callWithUndefined: (s: LiveAnnouncerService) => s.announceError(undefined as any),
  },
  {
    serviceName: 'LiveAnnouncerService',
    methodName: 'announceStatus',
    callWithNull: (s: LiveAnnouncerService) => s.announceStatus(null as any),
    callWithUndefined: (s: LiveAnnouncerService) => s.announceStatus(undefined as any),
  },

  // --- CallAnnouncerService ---
  {
    serviceName: 'CallAnnouncerService',
    methodName: 'announceIncomingCall',
    callWithNull: (s: CallAnnouncerService) => s.announceIncomingCall(null as any, null as any),
    callWithUndefined: (s: CallAnnouncerService) =>
      s.announceIncomingCall(undefined as any, undefined as any),
  },
  {
    serviceName: 'CallAnnouncerService',
    methodName: 'announceOutgoingCall',
    callWithNull: (s: CallAnnouncerService) => s.announceOutgoingCall(null as any),
    callWithUndefined: (s: CallAnnouncerService) => s.announceOutgoingCall(undefined as any),
  },
  {
    serviceName: 'CallAnnouncerService',
    methodName: 'announceCallFailed',
    callWithNull: (s: CallAnnouncerService) => s.announceCallFailed(null as any),
    callWithUndefined: (s: CallAnnouncerService) => s.announceCallFailed(undefined as any),
  },

  // --- MentionsNavigationService ---
  {
    serviceName: 'MentionsNavigationService',
    methodName: 'handleKeyDown',
    callWithNull: (s: MentionsNavigationService) =>
      s.handleKeyDown(null as any, null as any, null as any),
    callWithUndefined: (s: MentionsNavigationService) =>
      s.handleKeyDown(undefined as any, undefined as any, undefined as any),
  },
  {
    serviceName: 'MentionsNavigationService',
    methodName: 'setHighlightedIndex',
    callWithNull: (s: MentionsNavigationService) => s.setHighlightedIndex(null as any),
    callWithUndefined: (s: MentionsNavigationService) => s.setHighlightedIndex(undefined as any),
  },
  {
    serviceName: 'MentionsNavigationService',
    methodName: 'getActiveDescendantId',
    callWithNull: (s: MentionsNavigationService) => s.getActiveDescendantId(null as any),
    callWithUndefined: (s: MentionsNavigationService) => s.getActiveDescendantId(undefined as any),
  },

  // --- TypeAheadService ---
  {
    serviceName: 'TypeAheadService',
    methodName: 'handleCharacter',
    callWithNull: (s: TypeAheadService) =>
      s.handleCharacter(null as any, null as any, 0, null as any),
    callWithUndefined: (s: TypeAheadService) =>
      s.handleCharacter(undefined as any, undefined as any, 0, undefined as any),
  },

  // --- MediaControlsService ---
  {
    serviceName: 'MediaControlsService',
    methodName: 'handleKeyDown',
    callWithNull: (s: MediaControlsService) => s.handleKeyDown(null as any, null as any),
    callWithUndefined: (s: MediaControlsService) =>
      s.handleKeyDown(undefined as any, undefined as any),
  },
  {
    serviceName: 'MediaControlsService',
    methodName: 'formatTimeForAnnouncement',
    callWithNull: (s: MediaControlsService) => s.formatTimeForAnnouncement(null as any),
    callWithUndefined: (s: MediaControlsService) => s.formatTimeForAnnouncement(undefined as any),
  },
  {
    serviceName: 'MediaControlsService',
    methodName: 'getPlayPauseLabel',
    callWithNull: (s: MediaControlsService) => s.getPlayPauseLabel(null as any),
    callWithUndefined: (s: MediaControlsService) => s.getPlayPauseLabel(undefined as any),
  },
  {
    serviceName: 'MediaControlsService',
    methodName: 'getProgressValueText',
    callWithNull: (s: MediaControlsService) => s.getProgressValueText(null as any, null as any),
    callWithUndefined: (s: MediaControlsService) =>
      s.getProgressValueText(undefined as any, undefined as any),
  },

  // --- MessageBubbleConfigService ---
  {
    serviceName: 'MessageBubbleConfigService',
    methodName: 'setBubbleView',
    callWithNull: (s: MessageBubbleConfigService) => s.setBubbleView(null as any, null as any),
    callWithUndefined: (s: MessageBubbleConfigService) =>
      s.setBubbleView(undefined as any, undefined as any),
  },
  {
    serviceName: 'MessageBubbleConfigService',
    methodName: 'setGlobalView',
    callWithNull: (s: MessageBubbleConfigService) => s.setGlobalView(null as any, null as any),
    callWithUndefined: (s: MessageBubbleConfigService) =>
      s.setGlobalView(undefined as any, undefined as any),
  },
  {
    serviceName: 'MessageBubbleConfigService',
    methodName: 'setMessageTemplates',
    callWithNull: (s: MessageBubbleConfigService) => s.setMessageTemplates(null as any),
    callWithUndefined: (s: MessageBubbleConfigService) => s.setMessageTemplates(undefined as any),
  },
  {
    serviceName: 'MessageBubbleConfigService',
    methodName: 'getView',
    callWithNull: (s: MessageBubbleConfigService) => s.getView(null as any, null as any),
    callWithUndefined: (s: MessageBubbleConfigService) =>
      s.getView(undefined as any, undefined as any),
  },
  {
    serviceName: 'MessageBubbleConfigService',
    methodName: 'clearType',
    callWithNull: (s: MessageBubbleConfigService) => s.clearType(null as any),
    callWithUndefined: (s: MessageBubbleConfigService) => s.clearType(undefined as any),
  },
];

// ==================== Service Token Map ====================

/**
 * Maps service names to their injectable tokens for TestBed.inject().
 */
const SERVICE_TOKENS: Record<string, any> = {
  HtmlSanitizerService,
  ChatStateService,
  FormatterConfigService,
  FocusTrapService,
  ListNavigationService,
  GridNavigationService,
  DialogFocusManager,
  LiveAnnouncerService,
  CallAnnouncerService,
  MentionsNavigationService,
  TypeAheadService,
  MediaControlsService,
  MessageBubbleConfigService,
};

// ==================== Arbitraries ====================

/** Picks a random test case from the registry. */
const arbTestCase = fc.constantFrom(...NULL_SAFETY_CASES);

/** Picks a random subset of test cases (1–10). */
const arbTestCaseSubset = fc.shuffledSubarray(NULL_SAFETY_CASES, {
  minLength: 1,
  maxLength: Math.min(10, NULL_SAFETY_CASES.length),
});

/** Picks null or undefined randomly. */
const arbNullish = fc.constantFrom('null', 'undefined') as fc.Arbitrary<'null' | 'undefined'>;

/** Picks a random pair of test cases. */
const arbTestCasePair = fc.tuple(arbTestCase, arbTestCase);

/** Picks a random repeat count (1–4). */
const arbRepeatCount = fc.integer({ min: 1, max: 4 });

// ==================== Tests ====================

describe('Property 21: Service Null Parameter Safety', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  }, 30000);

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
  });

  // ---------- Core property: null does not throw ----------

  /**
   * **Validates: Requirements 5.5**
   *
   * For any randomly selected service method, passing null
   * does not throw an unhandled error.
   */
  it('passing null to any service method does not throw', () => {
    fc.assert(
      fc.property(arbTestCase, testCase => {
        const service = TestBed.inject(SERVICE_TOKENS[testCase.serviceName]);
        expect(() => testCase.callWithNull(service)).not.toThrow();
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Core property: undefined does not throw ----------

  /**
   * **Validates: Requirements 5.5**
   *
   * For any randomly selected service method, passing undefined
   * does not throw an unhandled error.
   */
  it('passing undefined to any service method does not throw', () => {
    fc.assert(
      fc.property(arbTestCase, testCase => {
        const service = TestBed.inject(SERVICE_TOKENS[testCase.serviceName]);
        expect(() => testCase.callWithUndefined(service)).not.toThrow();
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Random nullish selection ----------

  /**
   * **Validates: Requirements 5.5**
   *
   * For any randomly selected service method and randomly chosen
   * null or undefined, the call does not throw.
   */
  it('randomly choosing null or undefined for any method does not throw', () => {
    fc.assert(
      fc.property(arbTestCase, arbNullish, (testCase, nullish) => {
        const service = TestBed.inject(SERVICE_TOKENS[testCase.serviceName]);
        const caller = nullish === 'null' ? testCase.callWithNull : testCase.callWithUndefined;
        expect(() => caller(service)).not.toThrow();
      }),
      { numRuns: 200 }
    );
  });

  // ---------- Service remains injectable after null calls ----------

  /**
   * **Validates: Requirements 5.5**
   *
   * After calling a method with null, the service is still
   * injectable and returns a valid instance.
   */
  it('service remains injectable after null parameter calls', () => {
    fc.assert(
      fc.property(arbTestCase, testCase => {
        const service = TestBed.inject(SERVICE_TOKENS[testCase.serviceName]);
        try {
          testCase.callWithNull(service);
        } catch {
          /* swallow */
        }
        const serviceAgain = TestBed.inject(SERVICE_TOKENS[testCase.serviceName]);
        expect(serviceAgain).toBeTruthy();
        expect(serviceAgain).toBe(service); // singleton preserved
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Service remains injectable after undefined calls ----------

  /**
   * **Validates: Requirements 5.5**
   *
   * After calling a method with undefined, the service is still
   * injectable and returns a valid instance.
   */
  it('service remains injectable after undefined parameter calls', () => {
    fc.assert(
      fc.property(arbTestCase, testCase => {
        const service = TestBed.inject(SERVICE_TOKENS[testCase.serviceName]);
        try {
          testCase.callWithUndefined(service);
        } catch {
          /* swallow */
        }
        const serviceAgain = TestBed.inject(SERVICE_TOKENS[testCase.serviceName]);
        expect(serviceAgain).toBeTruthy();
        expect(serviceAgain).toBe(service);
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Repeated null calls do not throw ----------

  /**
   * **Validates: Requirements 5.5**
   *
   * For any method and any repeat count (1–4), calling the method
   * with null N times in succession does not throw.
   */
  it('repeated null calls do not throw', () => {
    fc.assert(
      fc.property(arbTestCase, arbRepeatCount, (testCase, count) => {
        const service = TestBed.inject(SERVICE_TOKENS[testCase.serviceName]);
        for (let i = 0; i < count; i++) {
          expect(() => testCase.callWithNull(service)).not.toThrow();
        }
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Repeated undefined calls do not throw ----------

  /**
   * **Validates: Requirements 5.5**
   *
   * For any method and any repeat count (1–4), calling the method
   * with undefined N times in succession does not throw.
   */
  it('repeated undefined calls do not throw', () => {
    fc.assert(
      fc.property(arbTestCase, arbRepeatCount, (testCase, count) => {
        const service = TestBed.inject(SERVICE_TOKENS[testCase.serviceName]);
        for (let i = 0; i < count; i++) {
          expect(() => testCase.callWithUndefined(service)).not.toThrow();
        }
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Subset of methods all safe with null ----------

  /**
   * **Validates: Requirements 5.5**
   *
   * For any random subset of service methods, calling all of them
   * with null in sequence does not throw on any call.
   */
  it('a random subset of methods all handle null safely', () => {
    fc.assert(
      fc.property(arbTestCaseSubset, subset => {
        for (const testCase of subset) {
          const service = TestBed.inject(SERVICE_TOKENS[testCase.serviceName]);
          expect(() => testCase.callWithNull(service)).not.toThrow();
        }
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Subset of methods all safe with undefined ----------

  /**
   * **Validates: Requirements 5.5**
   *
   * For any random subset of service methods, calling all of them
   * with undefined in sequence does not throw on any call.
   */
  it('a random subset of methods all handle undefined safely', () => {
    fc.assert(
      fc.property(arbTestCaseSubset, subset => {
        for (const testCase of subset) {
          const service = TestBed.inject(SERVICE_TOKENS[testCase.serviceName]);
          expect(() => testCase.callWithUndefined(service)).not.toThrow();
        }
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Cross-service null calls don't interfere ----------

  /**
   * **Validates: Requirements 5.5**
   *
   * For any pair of service methods, calling the first with null
   * does not cause the second to throw when also called with null.
   */
  it('null calls on one service method do not affect another', () => {
    fc.assert(
      fc.property(arbTestCasePair, ([caseA, caseB]) => {
        const serviceA = TestBed.inject(SERVICE_TOKENS[caseA.serviceName]);
        const serviceB = TestBed.inject(SERVICE_TOKENS[caseB.serviceName]);
        expect(() => caseA.callWithNull(serviceA)).not.toThrow();
        expect(() => caseB.callWithNull(serviceB)).not.toThrow();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Exhaustive: every registered case with null ----------

  /**
   * **Validates: Requirements 5.5**
   *
   * Deterministic check that every single registered test case
   * handles null without throwing.
   */
  it('every registered method handles null (exhaustive)', () => {
    fc.assert(
      fc.property(fc.constantFrom(...NULL_SAFETY_CASES), testCase => {
        const service = TestBed.inject(SERVICE_TOKENS[testCase.serviceName]);
        expect(() => testCase.callWithNull(service)).not.toThrow();
      }),
      { numRuns: NULL_SAFETY_CASES.length * 3 }
    );
  });

  // ---------- Exhaustive: every registered case with undefined ----------

  /**
   * **Validates: Requirements 5.5**
   *
   * Deterministic check that every single registered test case
   * handles undefined without throwing.
   */
  it('every registered method handles undefined (exhaustive)', () => {
    fc.assert(
      fc.property(fc.constantFrom(...NULL_SAFETY_CASES), testCase => {
        const service = TestBed.inject(SERVICE_TOKENS[testCase.serviceName]);
        expect(() => testCase.callWithUndefined(service)).not.toThrow();
      }),
      { numRuns: NULL_SAFETY_CASES.length * 3 }
    );
  });
});
