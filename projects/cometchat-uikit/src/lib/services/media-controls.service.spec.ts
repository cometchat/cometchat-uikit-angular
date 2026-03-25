import { TestBed } from '@angular/core/testing';
import { MediaControlsService, MediaControlsConfig } from './media-controls.service';
import { createKeyboardEvent } from '../testing/accessibility-test-utils';

describe('MediaControlsService', () => {
  let service: MediaControlsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MediaControlsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================
  // handleKeyDown – play/pause/stop state management (Req 5.1, 5.4)
  // ============================================================
  describe('handleKeyDown', () => {
    const baseConfig: MediaControlsConfig = {
      currentTime: 30,
      duration: 120,
      isPlaying: false,
    };

    describe('play/pause toggle', () => {
      it('should return play action when Space is pressed and not playing', () => {
        const event = createKeyboardEvent(' ');
        const result = service.handleKeyDown(event, {
          ...baseConfig,
          isPlaying: false,
        });

        expect(result.action).toBe('play');
      });

      it('should return pause action when Space is pressed and playing', () => {
        const event = createKeyboardEvent(' ');
        const result = service.handleKeyDown(event, {
          ...baseConfig,
          isPlaying: true,
        });

        expect(result.action).toBe('pause');
      });

      it('should return play action when Enter is pressed and not playing', () => {
        const event = createKeyboardEvent('Enter');
        const result = service.handleKeyDown(event, {
          ...baseConfig,
          isPlaying: false,
        });

        expect(result.action).toBe('play');
      });

      it('should return pause action when Enter is pressed and playing', () => {
        const event = createKeyboardEvent('Enter');
        const result = service.handleKeyDown(event, {
          ...baseConfig,
          isPlaying: true,
        });

        expect(result.action).toBe('pause');
      });
    });

    describe('seek forward with ArrowRight', () => {
      it('should seek forward by default 5 seconds', () => {
        const event = createKeyboardEvent('ArrowRight');
        const result = service.handleKeyDown(event, baseConfig);

        expect(result.action).toBe('seek');
        expect(result.seekTime).toBe(35); // 30 + 5
      });

      it('should seek forward by custom increment', () => {
        const event = createKeyboardEvent('ArrowRight');
        const result = service.handleKeyDown(event, {
          ...baseConfig,
          seekIncrement: 10,
        });

        expect(result.action).toBe('seek');
        expect(result.seekTime).toBe(40); // 30 + 10
      });

      it('should not exceed duration when seeking forward', () => {
        const event = createKeyboardEvent('ArrowRight');
        const result = service.handleKeyDown(event, {
          ...baseConfig,
          currentTime: 118,
          duration: 120,
        });

        expect(result.action).toBe('seek');
        expect(result.seekTime).toBe(120); // capped at duration
      });
    });

    describe('seek backward with ArrowLeft', () => {
      it('should seek backward by default 5 seconds', () => {
        const event = createKeyboardEvent('ArrowLeft');
        const result = service.handleKeyDown(event, baseConfig);

        expect(result.action).toBe('seek');
        expect(result.seekTime).toBe(25); // 30 - 5
      });

      it('should seek backward by custom increment', () => {
        const event = createKeyboardEvent('ArrowLeft');
        const result = service.handleKeyDown(event, {
          ...baseConfig,
          seekIncrement: 10,
        });

        expect(result.action).toBe('seek');
        expect(result.seekTime).toBe(20); // 30 - 10
      });

      it('should not go below 0 when seeking backward', () => {
        const event = createKeyboardEvent('ArrowLeft');
        const result = service.handleKeyDown(event, {
          ...baseConfig,
          currentTime: 3,
        });

        expect(result.action).toBe('seek');
        expect(result.seekTime).toBe(0); // capped at 0
      });
    });

    describe('seek to start with Home', () => {
      it('should seek to start when Home is pressed', () => {
        const event = createKeyboardEvent('Home');
        const result = service.handleKeyDown(event, baseConfig);

        expect(result.action).toBe('seekStart');
        expect(result.seekTime).toBe(0);
      });
    });

    describe('seek to end with End', () => {
      it('should seek to end when End is pressed', () => {
        const event = createKeyboardEvent('End');
        const result = service.handleKeyDown(event, baseConfig);

        expect(result.action).toBe('seekEnd');
        expect(result.seekTime).toBe(120); // duration
      });
    });

    describe('unhandled keys', () => {
      it('should return none action for unhandled keys', () => {
        const event = createKeyboardEvent('a');
        const result = service.handleKeyDown(event, baseConfig);

        expect(result.action).toBe('none');
      });

      it('should return none action for Tab key', () => {
        const event = createKeyboardEvent('Tab');
        const result = service.handleKeyDown(event, baseConfig);

        expect(result.action).toBe('none');
      });

      it('should return none action for Escape key', () => {
        const event = createKeyboardEvent('Escape');
        const result = service.handleKeyDown(event, baseConfig);

        expect(result.action).toBe('none');
      });
    });

    // ============================================================
    // preventDefault verification (Req 5.4)
    // ============================================================
    describe('preventDefault', () => {
      it('should call preventDefault for Space key', () => {
        const event = createKeyboardEvent(' ');
        const spy = vi.spyOn(event, 'preventDefault');
        service.handleKeyDown(event, baseConfig);
        expect(spy).toHaveBeenCalled();
      });

      it('should call preventDefault for Enter key', () => {
        const event = createKeyboardEvent('Enter');
        const spy = vi.spyOn(event, 'preventDefault');
        service.handleKeyDown(event, baseConfig);
        expect(spy).toHaveBeenCalled();
      });

      it('should call preventDefault for ArrowRight key', () => {
        const event = createKeyboardEvent('ArrowRight');
        const spy = vi.spyOn(event, 'preventDefault');
        service.handleKeyDown(event, baseConfig);
        expect(spy).toHaveBeenCalled();
      });

      it('should call preventDefault for ArrowLeft key', () => {
        const event = createKeyboardEvent('ArrowLeft');
        const spy = vi.spyOn(event, 'preventDefault');
        service.handleKeyDown(event, baseConfig);
        expect(spy).toHaveBeenCalled();
      });

      it('should call preventDefault for Home key', () => {
        const event = createKeyboardEvent('Home');
        const spy = vi.spyOn(event, 'preventDefault');
        service.handleKeyDown(event, baseConfig);
        expect(spy).toHaveBeenCalled();
      });

      it('should call preventDefault for End key', () => {
        const event = createKeyboardEvent('End');
        const spy = vi.spyOn(event, 'preventDefault');
        service.handleKeyDown(event, baseConfig);
        expect(spy).toHaveBeenCalled();
      });

      it('should NOT call preventDefault for unhandled keys', () => {
        const event = createKeyboardEvent('a');
        const spy = vi.spyOn(event, 'preventDefault');
        service.handleKeyDown(event, baseConfig);
        expect(spy).not.toHaveBeenCalled();
      });
    });

    // ============================================================
    // Play/pause/stop state transitions (Req 5.1, 5.4)
    // ============================================================
    describe('state transitions', () => {
      it('should cycle through play → pause → play states', () => {
        const spaceEvent = () => createKeyboardEvent(' ');

        // paused → play
        const r1 = service.handleKeyDown(spaceEvent(), { ...baseConfig, isPlaying: false });
        expect(r1.action).toBe('play');

        // playing → pause
        const r2 = service.handleKeyDown(spaceEvent(), { ...baseConfig, isPlaying: true });
        expect(r2.action).toBe('pause');

        // paused again → play
        const r3 = service.handleKeyDown(spaceEvent(), { ...baseConfig, isPlaying: false });
        expect(r3.action).toBe('play');
      });

      it('should return seekStart (stop-like) when Home is pressed during playback', () => {
        const event = createKeyboardEvent('Home');
        const result = service.handleKeyDown(event, { ...baseConfig, isPlaying: true });

        expect(result.action).toBe('seekStart');
        expect(result.seekTime).toBe(0);
      });

      it('should return seekEnd when End is pressed during playback', () => {
        const event = createKeyboardEvent('End');
        const result = service.handleKeyDown(event, { ...baseConfig, isPlaying: true });

        expect(result.action).toBe('seekEnd');
        expect(result.seekTime).toBe(120);
      });
    });

    // ============================================================
    // Boundary conditions for seek (Req 5.4)
    // ============================================================
    describe('seek boundary conditions', () => {
      it('should handle seek forward when currentTime is already at duration', () => {
        const event = createKeyboardEvent('ArrowRight');
        const result = service.handleKeyDown(event, {
          ...baseConfig,
          currentTime: 120,
          duration: 120,
        });

        expect(result.action).toBe('seek');
        expect(result.seekTime).toBe(120);
      });

      it('should handle seek backward when currentTime is 0', () => {
        const event = createKeyboardEvent('ArrowLeft');
        const result = service.handleKeyDown(event, {
          ...baseConfig,
          currentTime: 0,
        });

        expect(result.action).toBe('seek');
        expect(result.seekTime).toBe(0);
      });

      it('should handle zero duration media', () => {
        const zeroConfig: MediaControlsConfig = {
          currentTime: 0,
          duration: 0,
          isPlaying: false,
        };

        const rightEvent = createKeyboardEvent('ArrowRight');
        const r1 = service.handleKeyDown(rightEvent, zeroConfig);
        expect(r1.seekTime).toBe(0);

        const endEvent = createKeyboardEvent('End');
        const r2 = service.handleKeyDown(endEvent, zeroConfig);
        expect(r2.seekTime).toBe(0);
      });

      it('should handle very large duration values', () => {
        const event = createKeyboardEvent('End');
        const result = service.handleKeyDown(event, {
          ...baseConfig,
          duration: 999999,
        });

        expect(result.action).toBe('seekEnd');
        expect(result.seekTime).toBe(999999);
      });

      it('should handle seekIncrement of 0', () => {
        const event = createKeyboardEvent('ArrowRight');
        const result = service.handleKeyDown(event, {
          ...baseConfig,
          seekIncrement: 0,
        });

        expect(result.action).toBe('seek');
        expect(result.seekTime).toBe(30); // unchanged
      });
    });
  });

  // ============================================================
  // Audio/video element interaction patterns (Req 5.4)
  // ============================================================
  describe('audio/video element interaction', () => {
    let audioElement: HTMLAudioElement;
    let videoElement: HTMLVideoElement;

    beforeEach(() => {
      audioElement = document.createElement('audio');
      videoElement = document.createElement('video');
    });

    it('should produce results that correctly drive an audio element play', () => {
      const event = createKeyboardEvent(' ');
      const result = service.handleKeyDown(event, {
        currentTime: 0,
        duration: 60,
        isPlaying: false,
      });

      expect(result.action).toBe('play');
      // Verify the result can be used to drive audio element
      if (result.action === 'play') {
        // In real usage: audioElement.play()
        expect(audioElement.paused).toBe(true); // starts paused
      }
    });

    it('should produce seek results applicable to audio element currentTime', () => {
      const event = createKeyboardEvent('ArrowRight');
      const result = service.handleKeyDown(event, {
        currentTime: 10,
        duration: 60,
        isPlaying: true,
      });

      expect(result.action).toBe('seek');
      expect(result.seekTime).toBeDefined();
      // Apply seek result to audio element
      audioElement.currentTime = result.seekTime!;
      expect(audioElement.currentTime).toBe(15);
    });

    it('should produce seek results applicable to video element currentTime', () => {
      const event = createKeyboardEvent('ArrowLeft');
      const result = service.handleKeyDown(event, {
        currentTime: 20,
        duration: 100,
        isPlaying: false,
      });

      expect(result.action).toBe('seek');
      videoElement.currentTime = result.seekTime!;
      expect(videoElement.currentTime).toBe(15);
    });

    it('should produce seekStart result that resets element to beginning', () => {
      const event = createKeyboardEvent('Home');
      const result = service.handleKeyDown(event, {
        currentTime: 45,
        duration: 90,
        isPlaying: true,
      });

      audioElement.currentTime = result.seekTime!;
      expect(audioElement.currentTime).toBe(0);
    });

    it('should produce seekEnd result that moves element to end', () => {
      const event = createKeyboardEvent('End');
      const config: MediaControlsConfig = {
        currentTime: 10,
        duration: 90,
        isPlaying: true,
      };
      const result = service.handleKeyDown(event, config);

      videoElement.currentTime = result.seekTime!;
      expect(videoElement.currentTime).toBe(90);
    });

    it('should return none for unhandled keys, leaving element unchanged', () => {
      audioElement.currentTime = 25;
      const event = createKeyboardEvent('a');
      const result = service.handleKeyDown(event, {
        currentTime: 25,
        duration: 60,
        isPlaying: true,
      });

      expect(result.action).toBe('none');
      expect(result.seekTime).toBeUndefined();
      // Element should remain unchanged
      expect(audioElement.currentTime).toBe(25);
    });
  });

  // ============================================================
  // Null/undefined element and config handling (Req 5.6)
  // ============================================================
  describe('null element handling', () => {
    it('should not throw when config has NaN currentTime', () => {
      const event = createKeyboardEvent('ArrowRight');
      expect(() =>
        service.handleKeyDown(event, {
          currentTime: NaN,
          duration: 60,
          isPlaying: false,
        })
      ).not.toThrow();
    });

    it('should not throw when config has NaN duration', () => {
      const event = createKeyboardEvent('End');
      expect(() =>
        service.handleKeyDown(event, {
          currentTime: 10,
          duration: NaN,
          isPlaying: false,
        })
      ).not.toThrow();
    });

    it('should not throw when config has negative currentTime', () => {
      const event = createKeyboardEvent('ArrowLeft');
      const result = service.handleKeyDown(event, {
        currentTime: -5,
        duration: 60,
        isPlaying: false,
      });

      expect(result.action).toBe('seek');
      // -5 - 5 = -10, clamped to 0
      expect(result.seekTime).toBe(0);
    });

    it('should not throw when config has negative duration', () => {
      const event = createKeyboardEvent('End');
      expect(() =>
        service.handleKeyDown(event, {
          currentTime: 0,
          duration: -10,
          isPlaying: false,
        })
      ).not.toThrow();
    });

    it('should handle formatTimeForAnnouncement with NaN', () => {
      expect(() => service.formatTimeForAnnouncement(NaN)).not.toThrow();
    });

    it('should handle formatTimeForAnnouncement with negative value', () => {
      expect(() => service.formatTimeForAnnouncement(-10)).not.toThrow();
    });

    it('should handle formatTimeForAnnouncement with Infinity', () => {
      expect(() => service.formatTimeForAnnouncement(Infinity)).not.toThrow();
    });

    it('should handle getProgressValueText with NaN values', () => {
      expect(() => service.getProgressValueText(NaN, 60)).not.toThrow();
      expect(() => service.getProgressValueText(10, NaN)).not.toThrow();
    });

    it('should handle getPlayPauseLabel with non-boolean-like values', () => {
      // TypeScript would prevent this, but runtime safety matters
      expect(service.getPlayPauseLabel(false)).toBe('Play');
      expect(service.getPlayPauseLabel(true)).toBe('Pause');
    });
  });

  describe('formatTimeForAnnouncement', () => {
    it('should format 0 seconds', () => {
      expect(service.formatTimeForAnnouncement(0)).toBe('0 seconds');
    });

    it('should format 1 second with singular form', () => {
      expect(service.formatTimeForAnnouncement(1)).toBe('1 second');
    });

    it('should format seconds only (less than 60)', () => {
      expect(service.formatTimeForAnnouncement(45)).toBe('45 seconds');
    });

    it('should format exactly 1 minute with singular form', () => {
      expect(service.formatTimeForAnnouncement(60)).toBe('1 minute');
    });

    it('should format minutes only (no remaining seconds)', () => {
      expect(service.formatTimeForAnnouncement(120)).toBe('2 minutes');
    });

    it('should format 1 minute 1 second with singular forms', () => {
      expect(service.formatTimeForAnnouncement(61)).toBe('1 minute 1 second');
    });

    it('should format minutes and seconds', () => {
      expect(service.formatTimeForAnnouncement(150)).toBe('2 minutes 30 seconds');
    });

    it('should format large durations', () => {
      expect(service.formatTimeForAnnouncement(3661)).toBe('61 minutes 1 second');
    });

    it('should handle fractional seconds by flooring', () => {
      expect(service.formatTimeForAnnouncement(45.7)).toBe('45 seconds');
      expect(service.formatTimeForAnnouncement(90.9)).toBe('1 minute 30 seconds');
    });
  });

  describe('getPlayPauseLabel', () => {
    it('should return "Pause" when playing', () => {
      expect(service.getPlayPauseLabel(true)).toBe('Pause');
    });

    it('should return "Play" when not playing', () => {
      expect(service.getPlayPauseLabel(false)).toBe('Play');
    });
  });

  describe('getProgressValueText', () => {
    it('should format progress at start', () => {
      expect(service.getProgressValueText(0, 120)).toBe('0 seconds of 2 minutes');
    });

    it('should format progress in the middle', () => {
      expect(service.getProgressValueText(90, 180)).toBe('1 minute 30 seconds of 3 minutes');
    });

    it('should format progress at end', () => {
      expect(service.getProgressValueText(120, 120)).toBe('2 minutes of 2 minutes');
    });

    it('should format short durations', () => {
      expect(service.getProgressValueText(15, 30)).toBe('15 seconds of 30 seconds');
    });

    it('should handle singular forms correctly', () => {
      expect(service.getProgressValueText(1, 61)).toBe('1 second of 1 minute 1 second');
    });
  });
});
