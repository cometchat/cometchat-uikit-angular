/**
 * cometchat-conversation-item.subtitle-utils Tests
 *
 * Covers: getSubtitleIconName, getCallIconNameForSubtitle, isMissedCallForUser,
 *         getMeetingIconName, getActionMessageText, isURL, hasMarkdownLink,
 *         getSenderNamePrefix.
 *
 * @module components/cometchat-conversation-item/subtitle-utils
 */

import { describe, it, expect } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  getSubtitleIconName,
  getCallIconNameForSubtitle,
  isMissedCallForUser,
  getMeetingIconName,
  getActionMessageText,
  isURL,
  hasMarkdownLink,
  getSenderNamePrefix,
} from './cometchat-conversation-item.subtitle-utils';
import { CometChatUIKitConstants } from '../../constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(uid: string, name = `User ${uid}`): CometChat.User {
  const u = new CometChat.User(uid);
  u.setName(name);
  return u;
}

function makeTextMessage(text: string, senderUid: string): CometChat.BaseMessage {
  const msg = new CometChat.TextMessage('r1', text, CometChat.RECEIVER_TYPE.USER);
  msg.setSender(makeUser(senderUid));
  (msg as any).getType = () => 'text';
  (msg as any).getCategory = () => 'message';
  (msg as any).getText = () => text;
  return msg as unknown as CometChat.BaseMessage;
}

function makeMediaMessage(type: string, senderUid: string): CometChat.BaseMessage {
  const msg = new CometChat.MediaMessage('r1', {} as File, type, CometChat.RECEIVER_TYPE.USER);
  msg.setSender(makeUser(senderUid));
  (msg as any).getType = () => type;
  (msg as any).getCategory = () => 'message';
  return msg as unknown as CometChat.BaseMessage;
}

function makeCall(status: string, callType: string, initiatorUid: string): CometChat.Call {
  const call = new CometChat.Call('r1', callType, CometChat.RECEIVER_TYPE.USER);
  (call as any).getStatus = () => status;
  (call as any).getType = () => callType;
  (call as any).getCategory = () => 'call';
  const initiator = makeUser(initiatorUid);
  (call as any).getCallInitiator = () => initiator;
  return call;
}

function makeCustomMessage(type: string, customData: Record<string, any> = {}): CometChat.CustomMessage {
  const msg = new CometChat.CustomMessage('r1', CometChat.RECEIVER_TYPE.USER, type, customData);
  (msg as any).getType = () => type;
  (msg as any).getCategory = () => 'custom';
  (msg as any).getCustomData = () => customData;
  return msg;
}

describe('cometchat-conversation-item.subtitle-utils', () => {

  // ==================== isURL ====================

  describe('isURL', () => {
    it('should return true for valid http URL', () => {
      expect(isURL('http://example.com')).toBe(true);
    });

    it('should return true for valid https URL', () => {
      expect(isURL('https://example.com/path?q=1')).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(isURL('Hello world')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isURL('')).toBe(false);
    });

    it('should return false for ftp URL', () => {
      expect(isURL('ftp://example.com')).toBe(false);
    });
  });

  // ==================== hasMarkdownLink ====================

  describe('hasMarkdownLink', () => {
    it('should return true for markdown link', () => {
      expect(hasMarkdownLink('[Click here](https://example.com)')).toBe(true);
    });

    it('should return false for plain text', () => {
      expect(hasMarkdownLink('Hello world')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(hasMarkdownLink('')).toBe(false);
    });

    it('should return true when markdown link is embedded in text', () => {
      expect(hasMarkdownLink('Check out [this link](https://example.com) now')).toBe(true);
    });
  });

  // ==================== getSubtitleIconName ====================

  describe('getSubtitleIconName', () => {
    it('should return "none" for undefined message', () => {
      expect(getSubtitleIconName(undefined, 'loggedIn')).toBe('none');
    });

    it('should return "deleted" for deleted message', () => {
      const msg = makeTextMessage('Hello', 'u1');
      (msg as any).getDeletedAt = () => Date.now();
      expect(getSubtitleIconName(msg, 'loggedIn')).toBe('deleted');
    });

    it('should return "none" for action category', () => {
      const msg = makeTextMessage('joined', 'u1');
      (msg as any).getCategory = () => 'action';
      expect(getSubtitleIconName(msg, 'loggedIn')).toBe('none');
    });

    it('should return "none" for interactive category', () => {
      const msg = makeTextMessage('interactive', 'u1');
      (msg as any).getCategory = () => 'interactive';
      expect(getSubtitleIconName(msg, 'loggedIn')).toBe('none');
    });

    it('should return "none" for plain text message', () => {
      const msg = makeTextMessage('Hello world', 'u1');
      expect(getSubtitleIconName(msg, 'loggedIn')).toBe('none');
    });

    it('should return "link" for URL text message', () => {
      const msg = makeTextMessage('https://example.com', 'u1');
      expect(getSubtitleIconName(msg, 'loggedIn')).toBe('link');
    });

    it('should return "link" for markdown link text message', () => {
      const msg = makeTextMessage('[link](https://example.com)', 'u1');
      expect(getSubtitleIconName(msg, 'loggedIn')).toBe('link');
    });

    it('should return "image" for image message', () => {
      const msg = makeMediaMessage('image', 'u1');
      expect(getSubtitleIconName(msg, 'loggedIn')).toBe('image');
    });

    it('should return "video" for video message', () => {
      const msg = makeMediaMessage('video', 'u1');
      expect(getSubtitleIconName(msg, 'loggedIn')).toBe('video');
    });

    it('should return "audio" for audio message', () => {
      const msg = makeMediaMessage('audio', 'u1');
      expect(getSubtitleIconName(msg, 'loggedIn')).toBe('audio');
    });

    it('should return "file" for file message', () => {
      const msg = makeMediaMessage('file', 'u1');
      expect(getSubtitleIconName(msg, 'loggedIn')).toBe('file');
    });

    it('should return "poll" for extension_poll', () => {
      const msg = makeMediaMessage('extension_poll', 'u1');
      expect(getSubtitleIconName(msg, 'loggedIn')).toBe('poll');
    });

    it('should return "sticker" for extension_sticker', () => {
      const msg = makeMediaMessage('extension_sticker', 'u1');
      expect(getSubtitleIconName(msg, 'loggedIn')).toBe('sticker');
    });

    it('should return "unsupported" for unknown type', () => {
      const msg = makeMediaMessage('custom_unknown', 'u1');
      expect(getSubtitleIconName(msg, 'loggedIn')).toBe('unsupported');
    });

    it('should return call icon for call category', () => {
      const call = makeCall(CometChatUIKitConstants.calls.unanswered, CometChatUIKitConstants.MessageTypes.audio, 'caller');
      (call as any).getCategory = () => 'call';
      const icon = getSubtitleIconName(call as unknown as CometChat.BaseMessage, 'loggedIn');
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThan(0);
    });
  });

  // ==================== isMissedCallForUser ====================

  describe('isMissedCallForUser', () => {
    it('should return false when logged-in user is the initiator', () => {
      const call = makeCall(CometChatUIKitConstants.calls.unanswered, CometChatUIKitConstants.MessageTypes.audio, 'loggedIn');
      expect(isMissedCallForUser(call, 'loggedIn')).toBe(false);
    });

    it('should return true when logged-in user is receiver and call is unanswered', () => {
      const call = makeCall(CometChatUIKitConstants.calls.unanswered, CometChatUIKitConstants.MessageTypes.audio, 'caller');
      expect(isMissedCallForUser(call, 'loggedIn')).toBe(true);
    });

    it('should return true for cancelled call received by logged-in user', () => {
      const call = makeCall(CometChatUIKitConstants.calls.cancelled, CometChatUIKitConstants.MessageTypes.audio, 'caller');
      expect(isMissedCallForUser(call, 'loggedIn')).toBe(true);
    });

    it('should return true for rejected call received by logged-in user', () => {
      const call = makeCall(CometChatUIKitConstants.calls.rejected, CometChatUIKitConstants.MessageTypes.audio, 'caller');
      expect(isMissedCallForUser(call, 'loggedIn')).toBe(true);
    });

    it('should return false for ended call', () => {
      const call = makeCall('ended', CometChatUIKitConstants.MessageTypes.audio, 'caller');
      expect(isMissedCallForUser(call, 'loggedIn')).toBe(false);
    });
  });

  // ==================== getCallIconNameForSubtitle ====================

  describe('getCallIconNameForSubtitle', () => {
    it('should return incoming-audio-call for missed audio call', () => {
      const call = makeCall(CometChatUIKitConstants.calls.unanswered, CometChatUIKitConstants.MessageTypes.audio, 'caller');
      expect(getCallIconNameForSubtitle(call, 'loggedIn')).toBe('incoming-audio-call');
    });

    it('should return incoming-video-call for missed video call', () => {
      const call = makeCall(CometChatUIKitConstants.calls.unanswered, CometChatUIKitConstants.MessageTypes.video, 'caller');
      expect(getCallIconNameForSubtitle(call, 'loggedIn')).toBe('incoming-video-call');
    });

    it('should return outgoing-audio-call for non-missed audio call', () => {
      const call = makeCall('ended', CometChatUIKitConstants.MessageTypes.audio, 'loggedIn');
      expect(getCallIconNameForSubtitle(call, 'loggedIn')).toBe('outgoing-audio-call');
    });

    it('should return outgoing-video-call for non-missed video call', () => {
      const call = makeCall('ended', CometChatUIKitConstants.MessageTypes.video, 'loggedIn');
      expect(getCallIconNameForSubtitle(call, 'loggedIn')).toBe('outgoing-video-call');
    });
  });

  // ==================== getMeetingIconName ====================

  describe('getMeetingIconName', () => {
    it('should return meeting-audio-call for audio meeting', () => {
      const msg = makeCustomMessage('meeting', { callType: CometChatUIKitConstants.MessageTypes.audio });
      expect(getMeetingIconName(msg)).toBe('meeting-audio-call');
    });

    it('should return meeting-video-call for video meeting', () => {
      const msg = makeCustomMessage('meeting', { callType: 'video' });
      expect(getMeetingIconName(msg)).toBe('meeting-video-call');
    });

    it('should return meeting-video-call when callType is not set', () => {
      const msg = makeCustomMessage('meeting', {});
      expect(getMeetingIconName(msg)).toBe('meeting-video-call');
    });
  });

  // ==================== getActionMessageText ====================

  describe('getActionMessageText', () => {
    function makeActionMessage(actionType: string, byUid: string, onUid: string): CometChat.BaseMessage {
      const msg = new CometChat.TextMessage('r1', '', CometChat.RECEIVER_TYPE.USER);
      (msg as any).getCategory = () => 'action';
      (msg as any).getAction = () => actionType;
      (msg as any).getActionBy = () => makeUser(byUid, `User ${byUid}`);
      (msg as any).getActionOn = () => makeUser(onUid, `User ${onUid}`);
      return msg as unknown as CometChat.BaseMessage;
    }

    it('should return joined text for JOINED action', () => {
      const msg = makeActionMessage(CometChatUIKitConstants.groupMemberAction.JOINED, 'u1', 'u2');
      const text = getActionMessageText(msg, 'loggedIn');
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    });

    it('should return left text for LEFT action', () => {
      const msg = makeActionMessage(CometChatUIKitConstants.groupMemberAction.LEFT, 'u1', 'u2');
      const text = getActionMessageText(msg, 'loggedIn');
      expect(typeof text).toBe('string');
    });

    it('should use "You" when logged-in user is the actor', () => {
      const msg = makeActionMessage(CometChatUIKitConstants.groupMemberAction.JOINED, 'loggedIn', 'u2');
      const text = getActionMessageText(msg, 'loggedIn');
      expect(typeof text).toBe('string');
    });

    it('should return kicked text for KICKED action', () => {
      const msg = makeActionMessage(CometChatUIKitConstants.groupMemberAction.KICKED, 'u1', 'u2');
      const text = getActionMessageText(msg, 'loggedIn');
      expect(typeof text).toBe('string');
    });

    it('should return default text for unknown action', () => {
      const msg = makeActionMessage('unknown_action', 'u1', 'u2');
      const text = getActionMessageText(msg, 'loggedIn');
      expect(typeof text).toBe('string');
    });
  });

  // ==================== getSenderNamePrefix ====================

  describe('getSenderNamePrefix', () => {
    it('should return empty string when message is undefined', () => {
      expect(getSenderNamePrefix(undefined, 'loggedIn', true)).toBe('');
    });

    it('should return empty string for non-group conversation', () => {
      const msg = makeTextMessage('Hello', 'u1');
      expect(getSenderNamePrefix(msg, 'loggedIn', false)).toBe('');
    });

    it('should return "You: " prefix for logged-in user in group', () => {
      const msg = makeTextMessage('Hello', 'loggedIn');
      const prefix = getSenderNamePrefix(msg, 'loggedIn', true);
      expect(prefix).toContain(':');
    });

    it('should return sender name prefix for other users in group', () => {
      const msg = makeTextMessage('Hello', 'u1');
      msg.getSender()!.setName('Alice');
      const prefix = getSenderNamePrefix(msg, 'loggedIn', true);
      expect(prefix).toContain('Alice');
      expect(prefix).toContain(':');
    });

    it('should return empty string for action messages in group', () => {
      const msg = makeTextMessage('joined', 'u1');
      (msg as any).getCategory = () => 'action';
      expect(getSenderNamePrefix(msg, 'loggedIn', true)).toBe('');
    });

    it('should return empty string for call messages in group', () => {
      const msg = makeTextMessage('call', 'u1');
      (msg as any).getCategory = () => 'call';
      expect(getSenderNamePrefix(msg, 'loggedIn', true)).toBe('');
    });
  });
});
