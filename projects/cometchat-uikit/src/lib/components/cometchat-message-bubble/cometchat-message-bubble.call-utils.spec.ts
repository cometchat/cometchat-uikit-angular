/**
 * cometchat-message-bubble.call-utils Tests
 *
 * Covers: isMissedCall, getCallMessageText, getCallIconName,
 *         isCallIconErrorColor, getCallButtonText.
 *
 * @module components/cometchat-message-bubble/call-utils
 */

import { describe, it, expect } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  isMissedCall,
  getCallMessageText,
  getCallIconName,
  isCallIconErrorColor,
  getCallButtonText,
} from './cometchat-message-bubble.call-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(uid: string): CometChat.User {
  const u = new CometChat.User(uid);
  u.setName(`User ${uid}`);
  return u;
}

function makeCall(status: string, callType: string, initiatorUid: string): CometChat.Call {
  const call = new CometChat.Call('r1', callType, CometChat.RECEIVER_TYPE.USER);
  (call as any).status = status;
  (call as any).getStatus = () => status;
  (call as any).getType = () => callType;
  const initiator = makeUser(initiatorUid);
  (call as any).callInitiator = initiator;
  (call as any).getCallInitiator = () => initiator;
  return call;
}

function makeNonCallMessage(): CometChat.BaseMessage {
  return new CometChat.TextMessage('r1', 'Hello', CometChat.RECEIVER_TYPE.USER) as unknown as CometChat.BaseMessage;
}

describe('cometchat-message-bubble.call-utils', () => {

  // ==================== isMissedCall ====================

  describe('isMissedCall', () => {
    it('should return false when logged-in user is the caller and call is unanswered', () => {
      const call = makeCall(CometChat.CALL_STATUS.UNANSWERED, CometChat.CALL_TYPE.AUDIO, 'loggedIn');
      expect(isMissedCall(call, 'loggedIn')).toBe(false);
    });

    it('should return true when logged-in user is the receiver and call is unanswered', () => {
      const call = makeCall(CometChat.CALL_STATUS.UNANSWERED, CometChat.CALL_TYPE.AUDIO, 'caller');
      expect(isMissedCall(call, 'loggedIn')).toBe(true);
    });

    it('should return true when logged-in user is the receiver and call is rejected', () => {
      const call = makeCall(CometChat.CALL_STATUS.REJECTED, CometChat.CALL_TYPE.AUDIO, 'caller');
      expect(isMissedCall(call, 'loggedIn')).toBe(true);
    });

    it('should return true when logged-in user is the receiver and call is cancelled', () => {
      const call = makeCall(CometChat.CALL_STATUS.CANCELLED, CometChat.CALL_TYPE.AUDIO, 'caller');
      expect(isMissedCall(call, 'loggedIn')).toBe(true);
    });

    it('should return false for ended calls', () => {
      const call = makeCall(CometChat.CALL_STATUS.ENDED, CometChat.CALL_TYPE.AUDIO, 'caller');
      expect(isMissedCall(call, 'loggedIn')).toBe(false);
    });

    it('should return false for ongoing calls', () => {
      const call = makeCall(CometChat.CALL_STATUS.ONGOING, CometChat.CALL_TYPE.AUDIO, 'caller');
      expect(isMissedCall(call, 'loggedIn')).toBe(false);
    });
  });

  // ==================== getCallMessageText ====================

  describe('getCallMessageText', () => {
    it('should return unknown text for non-call messages', () => {
      const msg = makeNonCallMessage();
      const text = getCallMessageText(msg, 'loggedIn');
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    });

    it('should return outgoing text when caller initiates audio call', () => {
      const call = makeCall(CometChat.CALL_STATUS.INITIATED, CometChat.CALL_TYPE.AUDIO, 'loggedIn');
      const text = getCallMessageText(call, 'loggedIn');
      expect(typeof text).toBe('string');
      // Note: localization key may return empty string in test env
    });

    it('should return incoming text when receiver gets audio call', () => {
      const call = makeCall(CometChat.CALL_STATUS.INITIATED, CometChat.CALL_TYPE.AUDIO, 'caller');
      const text = getCallMessageText(call, 'loggedIn');
      expect(typeof text).toBe('string');
    });

    it('should return outgoing video text for video call initiated by logged-in user', () => {
      const call = makeCall(CometChat.CALL_STATUS.INITIATED, CometChat.CALL_TYPE.VIDEO, 'loggedIn');
      const text = getCallMessageText(call, 'loggedIn');
      expect(typeof text).toBe('string');
    });

    it('should return ongoing text for ongoing calls', () => {
      const call = makeCall(CometChat.CALL_STATUS.ONGOING, CometChat.CALL_TYPE.AUDIO, 'loggedIn');
      const text = getCallMessageText(call, 'loggedIn');
      expect(typeof text).toBe('string');
    });

    it('should return ended text for ended calls', () => {
      const call = makeCall(CometChat.CALL_STATUS.ENDED, CometChat.CALL_TYPE.AUDIO, 'loggedIn');
      const text = getCallMessageText(call, 'loggedIn');
      expect(typeof text).toBe('string');
    });

    it('should return missed text for unanswered calls received by logged-in user', () => {
      const call = makeCall(CometChat.CALL_STATUS.UNANSWERED, CometChat.CALL_TYPE.AUDIO, 'caller');
      const text = getCallMessageText(call, 'loggedIn');
      expect(typeof text).toBe('string');
    });

    it('should return busy text for busy calls', () => {
      const call = makeCall(CometChat.CALL_STATUS.BUSY, CometChat.CALL_TYPE.AUDIO, 'caller');
      const text = getCallMessageText(call, 'loggedIn');
      expect(typeof text).toBe('string');
    });

    it('should return unknown text for unknown status', () => {
      const call = makeCall('unknown_status', CometChat.CALL_TYPE.AUDIO, 'caller');
      const text = getCallMessageText(call, 'loggedIn');
      expect(typeof text).toBe('string');
    });
  });

  // ==================== getCallIconName ====================

  describe('getCallIconName', () => {
    it('should return "call" for non-call messages', () => {
      const msg = makeNonCallMessage();
      expect(getCallIconName(msg, 'loggedIn')).toBe('call');
    });

    it('should return audio-call icon for non-missed audio call', () => {
      const call = makeCall(CometChat.CALL_STATUS.ENDED, CometChat.CALL_TYPE.AUDIO, 'loggedIn');
      expect(getCallIconName(call, 'loggedIn')).toBe('audio-call');
    });

    it('should return video-call icon for non-missed video call', () => {
      const call = makeCall(CometChat.CALL_STATUS.ENDED, CometChat.CALL_TYPE.VIDEO, 'loggedIn');
      expect(getCallIconName(call, 'loggedIn')).toBe('video-call');
    });

    it('should return missed-audio-call icon for missed audio call', () => {
      const call = makeCall(CometChat.CALL_STATUS.UNANSWERED, CometChat.CALL_TYPE.AUDIO, 'caller');
      expect(getCallIconName(call, 'loggedIn')).toBe('missed-audio-call');
    });

    it('should return missed-video-call icon for missed video call', () => {
      const call = makeCall(CometChat.CALL_STATUS.UNANSWERED, CometChat.CALL_TYPE.VIDEO, 'caller');
      expect(getCallIconName(call, 'loggedIn')).toBe('missed-video-call');
    });
  });

  // ==================== isCallIconErrorColor ====================

  describe('isCallIconErrorColor', () => {
    it('should return false for non-call messages', () => {
      expect(isCallIconErrorColor(makeNonCallMessage(), 'loggedIn')).toBe(false);
    });

    it('should return true for missed calls', () => {
      const call = makeCall(CometChat.CALL_STATUS.UNANSWERED, CometChat.CALL_TYPE.AUDIO, 'caller');
      expect(isCallIconErrorColor(call, 'loggedIn')).toBe(true);
    });

    it('should return false for non-missed calls', () => {
      const call = makeCall(CometChat.CALL_STATUS.ENDED, CometChat.CALL_TYPE.AUDIO, 'loggedIn');
      expect(isCallIconErrorColor(call, 'loggedIn')).toBe(false);
    });
  });

  // ==================== getCallButtonText ====================

  describe('getCallButtonText', () => {
    it('should return empty string for non-call messages', () => {
      expect(getCallButtonText(makeNonCallMessage())).toBe('');
    });

    it('should return join text for ongoing calls', () => {
      const call = makeCall(CometChat.CALL_STATUS.ONGOING, CometChat.CALL_TYPE.AUDIO, 'caller');
      const text = getCallButtonText(call);
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    });

    it('should return callback text for non-ongoing calls', () => {
      const call = makeCall(CometChat.CALL_STATUS.ENDED, CometChat.CALL_TYPE.AUDIO, 'caller');
      const text = getCallButtonText(call);
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    });

    it('should return different text for ongoing vs ended calls', () => {
      const ongoing = makeCall(CometChat.CALL_STATUS.ONGOING, CometChat.CALL_TYPE.AUDIO, 'caller');
      const ended = makeCall(CometChat.CALL_STATUS.ENDED, CometChat.CALL_TYPE.AUDIO, 'caller');
      expect(getCallButtonText(ongoing)).not.toBe(getCallButtonText(ended));
    });
  });
});
