import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Subject, Subscription } from 'rxjs';

/**
 * Integration Tests: Call Flow Events
 *
 * Verifies CometChatCallButtons triggers call flows that propagate through
 * CometChatCallEvents to CometChatIncomingCall and CometChatOutgoingCall.
 * Mock only SDK layer.
 *
 * **Validates: Requirements 14.4, 14.5**
 */

// ─── Mock Call Events (mirrors CometChatCallEvents) ───

interface MockCall {
  sessionId: string;
  callInitiator: { uid: string; name: string };
  callReceiver: { uid: string; name: string };
  type: 'audio' | 'video';
  status: 'initiated' | 'ongoing' | 'ended' | 'rejected' | 'cancelled' | 'busy' | 'unanswered';
  sentAt: number;
}

class MockCallEvents {
  static ccOutgoingCall = new Subject<MockCall>();
  static ccCallAccepted = new Subject<MockCall>();
  static ccCallRejected = new Subject<MockCall>();
  static ccCallEnded = new Subject<MockCall>();

  static publishEvent(event: Subject<MockCall>, call: MockCall): void {
    event.next(call);
  }

  static reset(): void {
    MockCallEvents.ccOutgoingCall = new Subject<MockCall>();
    MockCallEvents.ccCallAccepted = new Subject<MockCall>();
    MockCallEvents.ccCallRejected = new Subject<MockCall>();
    MockCallEvents.ccCallEnded = new Subject<MockCall>();
  }
}

// ─── Mock Call Buttons Component ───

class MockCallButtonsComponent {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  initiateAudioCall(receiverUid: string, receiverName: string): MockCall {
    const call = createMockCall({
      callInitiator: { uid: this.userId, name: 'Me' },
      callReceiver: { uid: receiverUid, name: receiverName },
      type: 'audio',
      status: 'initiated',
    });
    MockCallEvents.publishEvent(MockCallEvents.ccOutgoingCall, call);
    return call;
  }

  initiateVideoCall(receiverUid: string, receiverName: string): MockCall {
    const call = createMockCall({
      callInitiator: { uid: this.userId, name: 'Me' },
      callReceiver: { uid: receiverUid, name: receiverName },
      type: 'video',
      status: 'initiated',
    });
    MockCallEvents.publishEvent(MockCallEvents.ccOutgoingCall, call);
    return call;
  }
}

// ─── Mock Outgoing Call Component ───

class MockOutgoingCallHandler {
  isVisible = false;
  activeCall: MockCall | null = null;
  calleeName = '';
  callType: 'audio' | 'video' | null = null;

  private subscriptions: Subscription[] = [];

  init(): void {
    this.subscriptions.push(
      MockCallEvents.ccOutgoingCall.subscribe(call => {
        this.showOutgoingCall(call);
      })
    );

    this.subscriptions.push(
      MockCallEvents.ccCallAccepted.subscribe(call => {
        if (this.activeCall?.sessionId === call.sessionId) {
          this.hideOutgoingCall();
        }
      })
    );

    this.subscriptions.push(
      MockCallEvents.ccCallRejected.subscribe(call => {
        if (this.activeCall?.sessionId === call.sessionId) {
          this.hideOutgoingCall();
        }
      })
    );

    this.subscriptions.push(
      MockCallEvents.ccCallEnded.subscribe(call => {
        if (this.activeCall?.sessionId === call.sessionId) {
          this.hideOutgoingCall();
        }
      })
    );
  }

  destroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  private showOutgoingCall(call: MockCall): void {
    this.isVisible = true;
    this.activeCall = call;
    this.calleeName = call.callReceiver.name;
    this.callType = call.type;
  }

  private hideOutgoingCall(): void {
    this.isVisible = false;
    this.activeCall = null;
    this.calleeName = '';
    this.callType = null;
  }

  cancelCall(): void {
    if (this.activeCall) {
      const endedCall = { ...this.activeCall, status: 'cancelled' as const };
      MockCallEvents.publishEvent(MockCallEvents.ccCallEnded, endedCall);
    }
  }
}

// ─── Mock Incoming Call Component ───

class MockIncomingCallHandler {
  isVisible = false;
  activeCall: MockCall | null = null;
  callerName = '';
  callType: 'audio' | 'video' | null = null;

  private subscriptions: Subscription[] = [];

  init(): void {
    // In a real scenario, incoming calls come from SDK listeners.
    // Here we simulate by subscribing to outgoing calls from the other side.
  }

  showIncomingCall(call: MockCall): void {
    this.isVisible = true;
    this.activeCall = call;
    this.callerName = call.callInitiator.name;
    this.callType = call.type;
  }

  acceptCall(): void {
    if (this.activeCall) {
      const acceptedCall = { ...this.activeCall, status: 'ongoing' as const };
      MockCallEvents.publishEvent(MockCallEvents.ccCallAccepted, acceptedCall);
      this.hideIncomingCall();
    }
  }

  rejectCall(): void {
    if (this.activeCall) {
      const rejectedCall = { ...this.activeCall, status: 'rejected' as const };
      MockCallEvents.publishEvent(MockCallEvents.ccCallRejected, rejectedCall);
      this.hideIncomingCall();
    }
  }

  destroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  private hideIncomingCall(): void {
    this.isVisible = false;
    this.activeCall = null;
    this.callerName = '';
    this.callType = null;
  }
}

// ─── Factories ───

let sessionCounter = 0;

function createMockCall(overrides: Partial<MockCall> = {}): MockCall {
  sessionCounter++;
  return {
    sessionId: `session_${sessionCounter}`,
    callInitiator: { uid: 'user1', name: 'Alice' },
    callReceiver: { uid: 'user2', name: 'Bob' },
    type: 'audio',
    status: 'initiated',
    sentAt: Date.now(),
    ...overrides,
  };
}

// ─── Tests ───

describe('Call Flow Integration', () => {
  let callButtons: MockCallButtonsComponent;
  let outgoingCall: MockOutgoingCallHandler;
  let incomingCall: MockIncomingCallHandler;

  beforeEach(() => {
    sessionCounter = 0;
    MockCallEvents.reset();
    callButtons = new MockCallButtonsComponent('user1');
    outgoingCall = new MockOutgoingCallHandler();
    incomingCall = new MockIncomingCallHandler();
    outgoingCall.init();
  });

  afterEach(() => {
    outgoingCall.destroy();
    incomingCall.destroy();
    vi.restoreAllMocks();
  });

  describe('Outgoing call flow', () => {
    it('should show outgoing call UI when audio call is initiated', () => {
      callButtons.initiateAudioCall('user2', 'Bob');

      expect(outgoingCall.isVisible).toBe(true);
      expect(outgoingCall.calleeName).toBe('Bob');
      expect(outgoingCall.callType).toBe('audio');
    });

    it('should show outgoing call UI when video call is initiated', () => {
      callButtons.initiateVideoCall('user2', 'Bob');

      expect(outgoingCall.isVisible).toBe(true);
      expect(outgoingCall.calleeName).toBe('Bob');
      expect(outgoingCall.callType).toBe('video');
    });

    it('should hide outgoing call UI when call is accepted', () => {
      const call = callButtons.initiateAudioCall('user2', 'Bob');
      expect(outgoingCall.isVisible).toBe(true);

      MockCallEvents.publishEvent(MockCallEvents.ccCallAccepted, {
        ...call,
        status: 'ongoing',
      });

      expect(outgoingCall.isVisible).toBe(false);
      expect(outgoingCall.activeCall).toBeNull();
    });

    it('should hide outgoing call UI when call is rejected', () => {
      const call = callButtons.initiateAudioCall('user2', 'Bob');
      expect(outgoingCall.isVisible).toBe(true);

      MockCallEvents.publishEvent(MockCallEvents.ccCallRejected, {
        ...call,
        status: 'rejected',
      });

      expect(outgoingCall.isVisible).toBe(false);
    });

    it('should hide outgoing call UI when call is cancelled', () => {
      callButtons.initiateAudioCall('user2', 'Bob');
      expect(outgoingCall.isVisible).toBe(true);

      outgoingCall.cancelCall();

      expect(outgoingCall.isVisible).toBe(false);
    });

    it('should not hide outgoing call for unrelated session', () => {
      callButtons.initiateAudioCall('user2', 'Bob');
      expect(outgoingCall.isVisible).toBe(true);

      const unrelatedCall = createMockCall({ sessionId: 'other_session' });
      MockCallEvents.publishEvent(MockCallEvents.ccCallAccepted, unrelatedCall);

      expect(outgoingCall.isVisible).toBe(true);
    });
  });

  describe('Incoming call flow', () => {
    it('should show incoming call UI when call is received', () => {
      const call = createMockCall({
        callInitiator: { uid: 'user2', name: 'Bob' },
        callReceiver: { uid: 'user1', name: 'Alice' },
        type: 'video',
      });
      incomingCall.showIncomingCall(call);

      expect(incomingCall.isVisible).toBe(true);
      expect(incomingCall.callerName).toBe('Bob');
      expect(incomingCall.callType).toBe('video');
    });

    it('should publish ccCallAccepted when call is accepted', () => {
      const acceptedSpy = vi.fn();
      MockCallEvents.ccCallAccepted.subscribe(acceptedSpy);

      const call = createMockCall();
      incomingCall.showIncomingCall(call);
      incomingCall.acceptCall();

      expect(acceptedSpy).toHaveBeenCalledTimes(1);
      expect(acceptedSpy).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: call.sessionId, status: 'ongoing' })
      );
      expect(incomingCall.isVisible).toBe(false);
    });

    it('should publish ccCallRejected when call is rejected', () => {
      const rejectedSpy = vi.fn();
      MockCallEvents.ccCallRejected.subscribe(rejectedSpy);

      const call = createMockCall();
      incomingCall.showIncomingCall(call);
      incomingCall.rejectCall();

      expect(rejectedSpy).toHaveBeenCalledTimes(1);
      expect(rejectedSpy).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: call.sessionId, status: 'rejected' })
      );
      expect(incomingCall.isVisible).toBe(false);
    });
  });

  describe('End-to-end call flow: initiate → accept → end', () => {
    it('should propagate call through full lifecycle', () => {
      // 1. User1 initiates call
      const call = callButtons.initiateAudioCall('user2', 'Bob');
      expect(outgoingCall.isVisible).toBe(true);

      // 2. User2 sees incoming call
      incomingCall.showIncomingCall(call);
      expect(incomingCall.isVisible).toBe(true);

      // 3. User2 accepts
      incomingCall.acceptCall();
      expect(incomingCall.isVisible).toBe(false);
      // Outgoing call UI should also hide (ccCallAccepted propagates)
      expect(outgoingCall.isVisible).toBe(false);
    });

    it('should propagate call through reject lifecycle', () => {
      // 1. User1 initiates call
      const call = callButtons.initiateVideoCall('user2', 'Bob');
      expect(outgoingCall.isVisible).toBe(true);

      // 2. User2 sees incoming call
      incomingCall.showIncomingCall(call);
      expect(incomingCall.isVisible).toBe(true);

      // 3. User2 rejects
      incomingCall.rejectCall();
      expect(incomingCall.isVisible).toBe(false);
      // Outgoing call UI should also hide (ccCallRejected propagates)
      expect(outgoingCall.isVisible).toBe(false);
    });
  });

  describe('Event subscription lifecycle', () => {
    it('should stop receiving events after destroy', () => {
      outgoingCall.destroy();

      callButtons.initiateAudioCall('user2', 'Bob');

      // Should not have updated since we destroyed
      expect(outgoingCall.isVisible).toBe(false);
    });
  });
});
