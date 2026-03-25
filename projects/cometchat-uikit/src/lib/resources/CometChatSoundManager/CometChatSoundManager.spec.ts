/**
 * CometChatSoundManager Tests
 *
 * Categories: Class Structure, Sound Playback Triggers, Mute/Unmute (Pause),
 *             Null Audio Handling, Custom Sound URLs, User Interaction Gating, Edge Cases
 * Validates: Requirements 8.1, 8.6, 14.4, 14.5, 15.7
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { ensureSdkReady, sdkCleanup } from '../../test-setup';
import { CometChatSoundManager } from './CometChatSoundManager';

// ---------------------------------------------------------------------------
// Audio mock infrastructure
// ---------------------------------------------------------------------------

let audioInstances: MockAudioInstance[];

interface MockAudioInstance {
  src: string;
  currentTime: number;
  loop: boolean;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
}

function createAudioMockClass() {
  audioInstances = [];

  function MockAudio(this: MockAudioInstance, src?: string) {
    this.src = src || '';
    this.currentTime = 0;
    this.loop = false;
    this.play = vi.fn().mockResolvedValue(undefined);
    this.pause = vi.fn();
    this.addEventListener = vi.fn();
    audioInstances.push(this);
  }

  return MockAudio as unknown as typeof Audio;
}

function getLastAudioInstance(): MockAudioInstance {
  return audioInstances[audioInstances.length - 1];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CometChatSoundManager', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(() => {
    vi.stubGlobal('Audio', createAudioMockClass());
    vi.spyOn(CometChatSoundManager, 'hasInteracted').mockReturnValue(true);
    CometChatSoundManager.audio = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    CometChatSoundManager.audio = null;
  });

  // ─── Class Structure ───

  describe('Class Structure', () => {
    it('should exist and be accessible', () => {
      expect(CometChatSoundManager).toBeDefined();
    });

    it('should have Sound enum with all expected keys', () => {
      expect(CometChatSoundManager.Sound).toBeDefined();
      expect(CometChatSoundManager.Sound.incomingCall).toBe('incomingCall');
      expect(CometChatSoundManager.Sound.incomingMessage).toBe('incomingMessage');
      expect(CometChatSoundManager.Sound.incomingMessageFromOther).toBe('incomingMessageFromOther');
      expect(CometChatSoundManager.Sound.outgoingCall).toBe('outgoingCall');
      expect(CometChatSoundManager.Sound.outgoingMessage).toBe('outgoingMessage');
    });

    it('should have Sound object frozen', () => {
      expect(Object.isFrozen(CometChatSoundManager.Sound)).toBe(true);
    });

    it('should have handlers mapped to the correct static methods', () => {
      expect(CometChatSoundManager.handlers.incomingCall).toBe(
        CometChatSoundManager.onIncomingCall
      );
      expect(CometChatSoundManager.handlers.outgoingCall).toBe(
        CometChatSoundManager.onOutgoingCall
      );
      expect(CometChatSoundManager.handlers.incomingMessage).toBe(
        CometChatSoundManager.onIncomingMessage
      );
      expect(CometChatSoundManager.handlers.incomingMessageFromOther).toBe(
        CometChatSoundManager.onIncomingOtherMessage
      );
      expect(CometChatSoundManager.handlers.outgoingMessage).toBe(
        CometChatSoundManager.onOutgoingMessage
      );
    });
  });

  // ─── Incoming Message Sound ───

  describe('onIncomingMessage', () => {
    it('should create Audio with default URL when no custom sound provided', () => {
      CometChatSoundManager.onIncomingMessage();
      expect(getLastAudioInstance().src).toBe(
        'https://assets.cc-cluster-2.io/uikits/static/audio/incomingmessage.wav'
      );
    });

    it('should create Audio with custom URL when provided', () => {
      CometChatSoundManager.onIncomingMessage('https://example.com/custom.mp3');
      expect(getLastAudioInstance().src).toBe('https://example.com/custom.mp3');
    });

    it('should reset currentTime to 0', () => {
      CometChatSoundManager.onIncomingMessage();
      expect(getLastAudioInstance().currentTime).toBe(0);
    });

    it('should call play when user has interacted', () => {
      CometChatSoundManager.onIncomingMessage();
      expect(getLastAudioInstance().play).toHaveBeenCalled();
    });

    it('should not call play when user has not interacted', () => {
      vi.spyOn(CometChatSoundManager, 'hasInteracted').mockReturnValue(false);
      CometChatSoundManager.onIncomingMessage();
      expect(getLastAudioInstance().play).not.toHaveBeenCalled();
    });

    it('should store audio instance on the class', () => {
      CometChatSoundManager.onIncomingMessage();
      expect(CometChatSoundManager.audio).toBe(getLastAudioInstance());
    });

    it('should use default URL when null is passed explicitly', () => {
      CometChatSoundManager.onIncomingMessage(null);
      expect(getLastAudioInstance().src).toBe(
        'https://assets.cc-cluster-2.io/uikits/static/audio/incomingmessage.wav'
      );
    });
  });

  // ─── Incoming Other Message Sound ───

  describe('onIncomingOtherMessage', () => {
    it('should create Audio with default URL', () => {
      CometChatSoundManager.onIncomingOtherMessage();
      expect(getLastAudioInstance().src).toBe(
        'https://assets.cc-cluster-2.io/uikits/static/audio/incomingothermessage.wav'
      );
    });

    it('should create Audio with custom URL when provided', () => {
      CometChatSoundManager.onIncomingOtherMessage('https://example.com/other.mp3');
      expect(getLastAudioInstance().src).toBe('https://example.com/other.mp3');
    });

    it('should call play when user has interacted', () => {
      CometChatSoundManager.onIncomingOtherMessage();
      expect(getLastAudioInstance().play).toHaveBeenCalled();
    });

    it('should not call play when user has not interacted', () => {
      vi.spyOn(CometChatSoundManager, 'hasInteracted').mockReturnValue(false);
      CometChatSoundManager.onIncomingOtherMessage();
      expect(getLastAudioInstance().play).not.toHaveBeenCalled();
    });
  });

  // ─── Outgoing Message Sound ───

  describe('onOutgoingMessage', () => {
    it('should create Audio with default URL', () => {
      CometChatSoundManager.onOutgoingMessage();
      expect(getLastAudioInstance().src).toBe(
        'https://assets.cc-cluster-2.io/uikits/static/audio/outgoingmessage.wav'
      );
    });

    it('should create Audio with custom URL when provided', () => {
      CometChatSoundManager.onOutgoingMessage('https://example.com/outgoing.mp3');
      expect(getLastAudioInstance().src).toBe('https://example.com/outgoing.mp3');
    });

    it('should call play when user has interacted', () => {
      CometChatSoundManager.onOutgoingMessage();
      expect(getLastAudioInstance().play).toHaveBeenCalled();
    });
  });

  // ─── Incoming Call Sound ───

  describe('onIncomingCall', () => {
    it('should create Audio with default URL', () => {
      CometChatSoundManager.onIncomingCall();
      expect(getLastAudioInstance().src).toBe(
        'https://assets.cc-cluster-2.io/uikits/static/audio/incomingcall.wav'
      );
    });

    it('should create Audio with custom URL when provided', () => {
      CometChatSoundManager.onIncomingCall('https://example.com/ring.mp3');
      expect(getLastAudioInstance().src).toBe('https://example.com/ring.mp3');
    });

    it('should set loop to true when loop property is boolean', () => {
      CometChatSoundManager.onIncomingCall();
      expect(getLastAudioInstance().loop).toBe(true);
    });

    it('should call play when user has interacted', () => {
      CometChatSoundManager.onIncomingCall();
      expect(getLastAudioInstance().play).toHaveBeenCalled();
    });

    it('should not throw when Audio constructor throws', () => {
      vi.stubGlobal('Audio', function () {
        throw new Error('Audio not supported');
      });
      expect(() => CometChatSoundManager.onIncomingCall()).not.toThrow();
    });
  });

  // ─── Outgoing Call Sound ───

  describe('onOutgoingCall', () => {
    it('should create Audio with default URL', () => {
      CometChatSoundManager.onOutgoingCall();
      expect(getLastAudioInstance().src).toBe(
        'https://assets.cc-cluster-2.io/uikits/static/audio/outgoingcall.wav'
      );
    });

    it('should create Audio with custom URL when provided', () => {
      CometChatSoundManager.onOutgoingCall('https://example.com/dial.mp3');
      expect(getLastAudioInstance().src).toBe('https://example.com/dial.mp3');
    });

    it('should set loop to true', () => {
      CometChatSoundManager.onOutgoingCall();
      expect(getLastAudioInstance().loop).toBe(true);
    });

    it('should call play when user has interacted', () => {
      CometChatSoundManager.onOutgoingCall();
      expect(getLastAudioInstance().play).toHaveBeenCalled();
    });

    it('should not throw when Audio constructor throws', () => {
      vi.stubGlobal('Audio', function () {
        throw new Error('Audio not supported');
      });
      expect(() => CometChatSoundManager.onOutgoingCall()).not.toThrow();
    });
  });

  // ─── play() Dispatcher ───

  describe('play()', () => {
    it('should dispatch incomingMessage to the correct handler', () => {
      CometChatSoundManager.play('incomingMessage');
      expect(getLastAudioInstance().src).toBe(
        'https://assets.cc-cluster-2.io/uikits/static/audio/incomingmessage.wav'
      );
    });

    it('should dispatch outgoingMessage to the correct handler', () => {
      CometChatSoundManager.play('outgoingMessage');
      expect(getLastAudioInstance().src).toBe(
        'https://assets.cc-cluster-2.io/uikits/static/audio/outgoingmessage.wav'
      );
    });

    it('should dispatch incomingCall to the correct handler', () => {
      CometChatSoundManager.play('incomingCall');
      expect(getLastAudioInstance().src).toBe(
        'https://assets.cc-cluster-2.io/uikits/static/audio/incomingcall.wav'
      );
    });

    it('should dispatch outgoingCall to the correct handler', () => {
      CometChatSoundManager.play('outgoingCall');
      expect(getLastAudioInstance().src).toBe(
        'https://assets.cc-cluster-2.io/uikits/static/audio/outgoingcall.wav'
      );
    });

    it('should dispatch incomingMessageFromOther to the correct handler', () => {
      CometChatSoundManager.play('incomingMessageFromOther');
      expect(getLastAudioInstance().src).toBe(
        'https://assets.cc-cluster-2.io/uikits/static/audio/incomingothermessage.wav'
      );
    });

    it('should pass custom sound URL to handler', () => {
      CometChatSoundManager.play('incomingMessage', 'https://example.com/custom.mp3');
      expect(getLastAudioInstance().src).toBe('https://example.com/custom.mp3');
    });

    it('should return early when user has not interacted', () => {
      vi.spyOn(CometChatSoundManager, 'hasInteracted').mockReturnValue(false);
      const countBefore = audioInstances.length;
      CometChatSoundManager.play('incomingMessage');
      expect(audioInstances.length).toBe(countBefore);
    });
  });

  // ─── pause() — Mute/Unmute ───

  describe('pause()', () => {
    it('should pause and reset audio when audio is playing', () => {
      CometChatSoundManager.onIncomingMessage();
      const instance = getLastAudioInstance();
      expect(CometChatSoundManager.audio).toBe(instance);

      CometChatSoundManager.pause();
      expect(instance.pause).toHaveBeenCalled();
      expect(instance.currentTime).toBe(0);
      expect(CometChatSoundManager.audio).toBeNull();
    });

    it('should do nothing when no audio is playing (null audio)', () => {
      CometChatSoundManager.audio = null;
      expect(() => CometChatSoundManager.pause()).not.toThrow();
    });

    it('should allow replaying after pause', () => {
      CometChatSoundManager.onIncomingCall();
      CometChatSoundManager.pause();
      expect(CometChatSoundManager.audio).toBeNull();

      CometChatSoundManager.onIncomingCall();
      const newInstance = getLastAudioInstance();
      expect(newInstance.play).toHaveBeenCalled();
      expect(CometChatSoundManager.audio).toBe(newInstance);
    });
  });

  // ─── hasInteracted() ───

  describe('hasInteracted()', () => {
    beforeEach(() => {
      vi.spyOn(CometChatSoundManager, 'hasInteracted').mockRestore();
    });

    it('should return true when userActivation.isActive is true', () => {
      Object.defineProperty(window.navigator, 'userActivation', {
        value: { isActive: true, hasBeenActive: false },
        configurable: true,
      });
      expect(CometChatSoundManager.hasInteracted()).toBe(true);
    });

    it('should return true when userActivation.hasBeenActive is true', () => {
      Object.defineProperty(window.navigator, 'userActivation', {
        value: { isActive: false, hasBeenActive: true },
        configurable: true,
      });
      expect(CometChatSoundManager.hasInteracted()).toBe(true);
    });

    it('should return false when both isActive and hasBeenActive are false', () => {
      Object.defineProperty(window.navigator, 'userActivation', {
        value: { isActive: false, hasBeenActive: false },
        configurable: true,
      });
      expect(CometChatSoundManager.hasInteracted()).toBe(false);
    });
  });

  // ─── Null Audio Handling ───

  describe('Null Audio Handling', () => {
    it('should not throw when onIncomingMessage is called with null', () => {
      expect(() => CometChatSoundManager.onIncomingMessage(null)).not.toThrow();
    });

    it('should not throw when onOutgoingMessage is called with null', () => {
      expect(() => CometChatSoundManager.onOutgoingMessage(null)).not.toThrow();
    });

    it('should not throw when onIncomingCall is called with null', () => {
      expect(() => CometChatSoundManager.onIncomingCall(null)).not.toThrow();
    });

    it('should not throw when onOutgoingCall is called with null', () => {
      expect(() => CometChatSoundManager.onOutgoingCall(null)).not.toThrow();
    });

    it('should not throw when onIncomingOtherMessage is called with null', () => {
      expect(() => CometChatSoundManager.onIncomingOtherMessage(null)).not.toThrow();
    });

    it('should not throw when play is called with null custom sound', () => {
      expect(() => CometChatSoundManager.play('incomingMessage', null)).not.toThrow();
    });
  });

  // ─── Custom Sound URL Support ───

  describe('Custom Sound URL Support', () => {
    const customUrl = 'https://cdn.example.com/sounds/notification.mp3';

    it('should use custom URL for incoming message', () => {
      CometChatSoundManager.onIncomingMessage(customUrl);
      expect(getLastAudioInstance().src).toBe(customUrl);
    });

    it('should use custom URL for outgoing message', () => {
      CometChatSoundManager.onOutgoingMessage(customUrl);
      expect(getLastAudioInstance().src).toBe(customUrl);
    });

    it('should use custom URL for incoming call', () => {
      CometChatSoundManager.onIncomingCall(customUrl);
      expect(getLastAudioInstance().src).toBe(customUrl);
    });

    it('should use custom URL for outgoing call', () => {
      CometChatSoundManager.onOutgoingCall(customUrl);
      expect(getLastAudioInstance().src).toBe(customUrl);
    });

    it('should use custom URL for incoming other message', () => {
      CometChatSoundManager.onIncomingOtherMessage(customUrl);
      expect(getLastAudioInstance().src).toBe(customUrl);
    });

    it('should use custom URL via play() method', () => {
      CometChatSoundManager.play('outgoingMessage', customUrl);
      expect(getLastAudioInstance().src).toBe(customUrl);
    });
  });
});
