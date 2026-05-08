import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { Subject } from 'rxjs';
import { DestroyRef, EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';

vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    endSession: vi.fn().mockResolvedValue(true),
    leaveSession: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
    startSession: vi.fn().mockResolvedValue(true),
    joinSession: vi.fn().mockResolvedValue(true),
    CallSettingsBuilder: vi.fn().mockImplementation(function(this: any) {
      this.enableDefaultLayout = vi.fn().mockReturnThis();
      this.setIsAudioOnlyCall = vi.fn().mockReturnThis();
      this.setCallListener = vi.fn().mockReturnThis();
      this.build = vi.fn().mockReturnValue({});
    }),
    OngoingCallListener: vi.fn().mockImplementation(function(this: any, cb: any) {
      Object.assign(this, cb);
    }),
  },
}));

import { CometChatCallEvents } from '../../events/CometChatCallEvents';
import { OngoingCallService } from '../../services/ongoing-call.service';
import { CallWorkflow } from '../../Enums/Enums';
import { CometChatOngoingCallComponent } from './cometchat-ongoing-call.component';

/**
 * Property-Based Tests for CometChatOngoingCallComponent
 *
 * These tests verify universal properties of the component
 * using fast-check for property-based testing.
 */

// ==================== Helpers ====================

/**
 * Creates a component instance without calling the constructor
 * (which requires Angular's injection context for inject()).
 * Manually wires the service and initializes default field values.
 */
function createComponentWithService(svc: OngoingCallService): CometChatOngoingCallComponent {
  const comp = Object.create(
    CometChatOngoingCallComponent.prototype
  ) as CometChatOngoingCallComponent;
  (comp as any).ongoingCallService = svc;
  (comp as any).callAnnouncer = { announceCallEnded: () => {} };
  (comp as any).pendingTimers = [];
  // Inject a real DestroyRef from TestBed for takeUntilDestroyed compatibility
  (comp as any).destroyRef = TestBed.inject(DestroyRef);
  comp.sessionID = '';
  comp.callSettingsBuilder = null;
  comp.callWorkflow = CallWorkflow.defaultCalling;
  comp.onError = null;
  comp.callScreenView = null;
  comp.callEnded = new EventEmitter<void>();
  comp.error = new EventEmitter<CometChat.CometChatException>();
  (comp as any).callEndedSub = null;
  return comp;
}

// ==================== Generators ====================

/** Arbitrary for non-empty session ID strings (component inputs) */
const sessionIdArb = fc.string({ minLength: 1, maxLength: 200 });

/** Arbitrary for "pre-existing" service session IDs (can be empty or non-empty) */
const preExistingSessionIdArb = fc.string({ minLength: 0, maxLength: 200 });

/** Arbitrary for CallWorkflow enum values */
const callWorkflowArb = fc.constantFrom(CallWorkflow.defaultCalling, CallWorkflow.directCalling);

/** Arbitrary for callSettingsBuilder (any object or null) */
const callSettingsBuilderArb = fc.oneof(
  fc.constant(null),
  fc.record({
    enableDefaultLayout: fc.boolean(),
    isAudioOnlyCall: fc.boolean(),
    customId: fc.string({ minLength: 0, maxLength: 50 }),
  }),
  fc.string(),
  fc.integer()
);

// ==================== Test Suite ====================

/**
 * **Feature: ongoing-call-component, Property 2: Input priority over service state**
 *
 * *For any* component input value provided (`sessionID`, `callWorkflow`,
 * `callSettingsBuilder`), the effective value used by the component should
 * equal the input value, regardless of the service's internal state.
 *
 * **Validates: Requirements 5.2**
 */
describe('Property 2: Input priority over service state', () => {
  let origCcCallEnded: Subject<CometChat.Call>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    origCcCallEnded = CometChatCallEvents.ccCallEnded;
    CometChatCallEvents.ccCallEnded = new Subject<CometChat.Call>();
  });

  afterEach(() => {
    CometChatCallEvents.ccCallEnded = origCcCallEnded;
    TestBed.resetTestingModule();
  });

  it('component input sessionID takes priority over pre-existing service sessionID after ngOnInit', () => {
    fc.assert(
      fc.property(sessionIdArb, preExistingSessionIdArb, (inputSessionID, preExistingSessionID) => {
        const service = new OngoingCallService();
        const component = createComponentWithService(service);

        // Set pre-existing service state
        service.setSessionID(preExistingSessionID);
        expect(service.sessionID()).toBe(preExistingSessionID);

        // Set component input
        component.sessionID = inputSessionID;

        // ngOnInit syncs inputs to service — inputs take priority
        component.ngOnInit();

        expect(service.sessionID()).toBe(inputSessionID);

        // Cleanup
        component.ngOnDestroy();
      }),
      { numRuns: 100 }
    );
  });

  it('component input callWorkflow takes priority over pre-existing service callWorkflow after ngOnInit', () => {
    fc.assert(
      fc.property(callWorkflowArb, callWorkflowArb, (inputWorkflow, preExistingWorkflow) => {
        const service = new OngoingCallService();
        const component = createComponentWithService(service);

        // Set pre-existing service state
        service.setCallWorkflow(preExistingWorkflow);
        expect(service.callWorkflow()).toBe(preExistingWorkflow);

        // Set component input
        component.callWorkflow = inputWorkflow;

        // ngOnInit syncs inputs to service — inputs take priority
        component.ngOnInit();

        expect(service.callWorkflow()).toBe(inputWorkflow);

        // Cleanup
        component.ngOnDestroy();
      }),
      { numRuns: 100 }
    );
  });

  it('component input callSettingsBuilder takes priority over pre-existing service callSettingsBuilder after ngOnInit', () => {
    fc.assert(
      fc.property(
        callSettingsBuilderArb,
        callSettingsBuilderArb,
        (inputBuilder, preExistingBuilder) => {
          const service = new OngoingCallService();
          const component = createComponentWithService(service);

          // Set pre-existing service state
          service.setCallSettingsBuilder(preExistingBuilder);
          expect(service.callSettingsBuilder()).toBe(preExistingBuilder);

          // Set component input
          component.callSettingsBuilder = inputBuilder;

          // ngOnInit syncs inputs to service — inputs take priority
          component.ngOnInit();

          expect(service.callSettingsBuilder()).toBe(inputBuilder);

          // Cleanup
          component.ngOnDestroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all three inputs simultaneously take priority over all pre-existing service state after ngOnInit', () => {
    fc.assert(
      fc.property(
        sessionIdArb,
        callWorkflowArb,
        callSettingsBuilderArb,
        preExistingSessionIdArb,
        callWorkflowArb,
        callSettingsBuilderArb,
        (inputSessionID, inputWorkflow, inputBuilder, preSessionID, preWorkflow, preBuilder) => {
          const service = new OngoingCallService();
          const component = createComponentWithService(service);

          // Set pre-existing service state for all signals
          service.setSessionID(preSessionID);
          service.setCallWorkflow(preWorkflow);
          service.setCallSettingsBuilder(preBuilder);

          // Set component inputs
          component.sessionID = inputSessionID;
          component.callWorkflow = inputWorkflow;
          component.callSettingsBuilder = inputBuilder;

          // ngOnInit syncs all inputs to service — inputs take priority
          component.ngOnInit();

          expect(service.sessionID()).toBe(inputSessionID);
          expect(service.callWorkflow()).toBe(inputWorkflow);
          expect(service.callSettingsBuilder()).toBe(inputBuilder);

          // Cleanup
          component.ngOnDestroy();
        }
      ),
      { numRuns: 100 }
    );
  });
});
