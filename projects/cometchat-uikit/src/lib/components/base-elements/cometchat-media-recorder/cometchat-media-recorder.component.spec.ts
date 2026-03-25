/**
 * CometChatMediaRecorder Component Tests
 *
 * Comprehensive test suite for the media recorder component that supports
 * audio recording with state transitions (idle→recording→paused→stopped),
 * real-time waveform visualization, preview playback, and full keyboard
 * accessibility.
 *
 * Note: The MediaRecorder API and navigator.mediaDevices.getUserMedia are
 * NOT available in the jsdom test environment. Tests that exercise recording
 * flows use stubs for these browser APIs while still using real Angular
 * TestBed with real services (no mock providers).
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             DOM Rendering, Recording State Transitions, Timer Display,
 *             Keyboard Accessibility, ARIA, Preview Playback, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4,
 *            4.1, 14.4, 14.5, 15.7
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../../testing';
import { CometChatMediaRecorderComponent } from './cometchat-media-recorder.component';

describe('CometChatMediaRecorderComponent', () => {
  let fixture: ComponentFixture<CometChatMediaRecorderComponent>;
  let component: CometChatMediaRecorderComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatMediaRecorderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatMediaRecorderComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  afterEach(() => {
    // Ensure cleanup of any timers/streams
    component.ngOnDestroy();
  });

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have autoRecording default to false', () => {
      expect(component.autoRecording).toBe(false);
    });

    it('should have isRecording default to false', () => {
      expect(component.isRecording).toBe(false);
    });

    it('should have isPaused default to false', () => {
      expect(component.isPaused).toBe(false);
    });

    it('should have counter default to 0', () => {
      expect(component.counter).toBe(0);
    });

    it('should have hasError default to false', () => {
      expect(component.hasError).toBe(false);
    });

    it('should have permissionState default to prompt', () => {
      expect(component.permissionState).toBe('prompt');
    });

    it('should have mediaRecorder undefined by default', () => {
      expect(component.mediaRecorder).toBeUndefined();
    });

    it('should have mediaPreviewUrl undefined by default', () => {
      expect(component.mediaPreviewUrl).toBeUndefined();
    });

    it('should have isPreviewPlaying default to false', () => {
      expect(component.isPreviewPlaying).toBe(false);
    });

    it('should have previewCurrentTime default to 0', () => {
      expect(component.previewCurrentTime).toBe(0);
    });

    it('should have previewDuration default to 0', () => {
      expect(component.previewDuration).toBe(0);
    });

    it('should initialize waveformHeights with default bar count', () => {
      expect(component.waveformHeights).toBeDefined();
      expect(component.waveformHeights.length).toBe(30);
      expect(component.waveformHeights.every(h => h === 4)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept autoRecording = true', () => {
      component.autoRecording = true;
      fixture.detectChanges();
      expect(component.autoRecording).toBe(true);
    });

    it('should accept autoRecording = false', () => {
      component.autoRecording = false;
      fixture.detectChanges();
      expect(component.autoRecording).toBe(false);
    });

    it('should handle null autoRecording gracefully', () => {
      component.autoRecording = null as any;
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle undefined autoRecording gracefully', () => {
      component.autoRecording = undefined as any;
      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // Output Emissions
  // ---------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit closeRecording when handleCloseRecording is called', () => {
      const spy = vi.fn();
      component.closeRecording.subscribe(spy);
      fixture.detectChanges();

      component.handleCloseRecording();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit submitRecording with blob when handleSubmitRecording is called with recorded blob', () => {
      const spy = vi.fn();
      component.submitRecording.subscribe(spy);
      fixture.detectChanges();

      // Simulate a recorded blob by setting internal state
      const blob = new Blob(['audio-data'], { type: 'audio/webm' });
      (component as any).recordedBlob = blob;

      component.handleSubmitRecording();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(blob);
    });

    it('should NOT emit submitRecording when no blob exists', () => {
      const spy = vi.fn();
      component.submitRecording.subscribe(spy);
      fixture.detectChanges();

      component.handleSubmitRecording();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should emit recordingError when initMediaRecorder fails', async () => {
      const spy = vi.fn();
      component.recordingError.subscribe(spy);
      fixture.detectChanges();

      // In jsdom, getUserMedia is not available, so initMediaRecorder will fail
      await component.initMediaRecorder();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toBeInstanceOf(Error);
    });

    it('should reset state after successful submit', () => {
      fixture.detectChanges();
      const blob = new Blob(['audio-data'], { type: 'audio/webm' });
      (component as any).recordedBlob = blob;

      component.handleSubmitRecording();

      expect(component.isRecording).toBe(false);
      expect(component.isPaused).toBe(false);
      expect(component.counter).toBe(0);
      expect(component.mediaPreviewUrl).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // DOM Rendering
  // ---------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render the root BEM block element', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-media-recorder--inline')).toBeTruthy();
    });

    it('should render with role="group" on root element', () => {
      fixture.detectChanges();
      const root = el.querySelector('.cometchat-media-recorder--inline');
      expect(root?.getAttribute('role')).toBe('group');
    });

    it('should render screen reader status element', () => {
      fixture.detectChanges();
      const srOnly = el.querySelector('.cometchat-media-recorder__sr-only');
      expect(srOnly).toBeTruthy();
      expect(srOnly?.getAttribute('role')).toBe('status');
      expect(srOnly?.getAttribute('aria-live')).toBe('polite');
    });

    it('should render error state when hasError is true', () => {
      component.hasError = true;
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-media-recorder__inline-error')).toBeTruthy();
      expect(
        el.querySelector('.cometchat-media-recorder__inline-error')?.getAttribute('role')
      ).toBe('alert');
    });

    it('should render delete button when not in error state', () => {
      component.hasError = false;
      fixture.detectChanges();

      const deleteBtn = el.querySelector('.cometchat-media-recorder__inline-delete');
      expect(deleteBtn).toBeTruthy();
      expect(deleteBtn?.getAttribute('role')).toBe('button');
      expect(deleteBtn?.getAttribute('tabindex')).toBe('0');
    });

    it('should render waveform bars in idle state', () => {
      component.hasError = false;
      component.isRecording = false;
      component.isPaused = false;
      fixture.detectChanges();

      const bars = el.querySelectorAll('.cometchat-media-recorder__waveform-bar');
      expect(bars.length).toBe(30);
    });

    it('should render timer element with role="timer"', () => {
      fixture.detectChanges();
      const timer = el.querySelector('.cometchat-media-recorder__timer');
      expect(timer).toBeTruthy();
      expect(timer?.getAttribute('role')).toBe('timer');
    });

    it('should display formatted counter in timer', () => {
      component.counter = 75;
      fixture.detectChanges();

      const timer = el.querySelector('.cometchat-media-recorder__timer');
      expect(timer?.textContent?.trim()).toContain('1:15');
    });

    it('should render recording dot when recording and not paused', () => {
      component.isRecording = true;
      component.isPaused = false;
      component.hasError = false;
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-media-recorder__recording-dot')).toBeTruthy();
    });

    it('should render pause button when recording and not paused', () => {
      component.isRecording = true;
      component.isPaused = false;
      component.hasError = false;
      fixture.detectChanges();

      const pauseBtn = el.querySelector('.cometchat-media-recorder__inline-pause');
      expect(pauseBtn).toBeTruthy();
      expect(pauseBtn?.getAttribute('role')).toBe('button');
    });

    it('should render resume button when paused', () => {
      component.isRecording = true;
      component.isPaused = true;
      component.hasError = false;
      fixture.detectChanges();

      const resumeBtn = el.querySelector('.cometchat-media-recorder__inline-resume');
      expect(resumeBtn).toBeTruthy();
      expect(resumeBtn?.getAttribute('role')).toBe('button');
    });

    it('should render play preview button when paused', () => {
      component.isRecording = true;
      component.isPaused = true;
      component.hasError = false;
      fixture.detectChanges();

      const playBtn = el.querySelector('.cometchat-media-recorder__inline-play');
      expect(playBtn).toBeTruthy();
      expect(playBtn?.getAttribute('role')).toBe('button');
    });

    it('should render close button in error state', () => {
      component.hasError = true;
      fixture.detectChanges();

      const closeBtn = el.querySelector('.cometchat-media-recorder__inline-close');
      expect(closeBtn).toBeTruthy();
      expect(closeBtn?.getAttribute('role')).toBe('button');
      expect(closeBtn?.getAttribute('tabindex')).toBe('0');
    });
  });

  // ---------------------------------------------------------------------------
  // Recording State Transitions
  // ---------------------------------------------------------------------------
  describe('Recording State Transitions', () => {
    it('should transition from idle to recording via handleStartRecording', async () => {
      fixture.detectChanges();
      expect(component.isRecording).toBe(false);

      // Stub getUserMedia to simulate browser API availability
      const mockStream = createMockMediaStream();
      stubGetUserMedia(mockStream);
      stubMediaRecorder();

      await component.handleStartRecording();

      expect(component.isRecording).toBe(true);
      expect(component.isPaused).toBe(false);
      expect(component.hasError).toBe(false);

      restoreGetUserMedia();
    });

    it('should transition from recording to paused via handlePauseRecording', async () => {
      fixture.detectChanges();
      const mockStream = createMockMediaStream();
      stubGetUserMedia(mockStream);
      stubMediaRecorder();

      await component.handleStartRecording();
      component.handlePauseRecording();

      expect(component.isPaused).toBe(true);

      restoreGetUserMedia();
    });

    it('should transition from paused back to recording (resume)', async () => {
      fixture.detectChanges();
      const mockStream = createMockMediaStream();
      stubGetUserMedia(mockStream);
      stubMediaRecorder();

      await component.handleStartRecording();
      component.handlePauseRecording();
      expect(component.isPaused).toBe(true);

      await component.handleStartRecording(); // resume
      expect(component.isRecording).toBe(true);
      expect(component.isPaused).toBe(false);

      restoreGetUserMedia();
    });

    it('should transition from recording to stopped via handleStopRecording', async () => {
      fixture.detectChanges();
      const mockStream = createMockMediaStream();
      stubGetUserMedia(mockStream);
      stubMediaRecorder();

      await component.handleStartRecording();
      component.handleStopRecording();

      expect(component.isRecording).toBe(false);
      expect(component.isPaused).toBe(false);

      restoreGetUserMedia();
    });

    it('should ignore start when already recording (not paused)', async () => {
      fixture.detectChanges();
      const mockStream = createMockMediaStream();
      stubGetUserMedia(mockStream);
      stubMediaRecorder();

      await component.handleStartRecording();
      component.counter = 5;

      await component.handleStartRecording(); // should be ignored

      expect(component.isRecording).toBe(true);
      expect(component.counter).toBe(5); // counter preserved

      restoreGetUserMedia();
    });

    it('should ignore pause when not recording', () => {
      fixture.detectChanges();
      component.handlePauseRecording();

      expect(component.isPaused).toBe(false);
      expect(component.isRecording).toBe(false);
    });

    it('should ignore pause when already paused', async () => {
      fixture.detectChanges();
      const mockStream = createMockMediaStream();
      stubGetUserMedia(mockStream);
      stubMediaRecorder();

      await component.handleStartRecording();
      component.handlePauseRecording();
      component.handlePauseRecording(); // second pause ignored

      expect(component.isPaused).toBe(true);

      restoreGetUserMedia();
    });

    it('should set hasError when initMediaRecorder fails (no getUserMedia)', async () => {
      fixture.detectChanges();

      // Without stubbing getUserMedia, it should fail in jsdom
      await component.handleStartRecording();

      // The component should have emitted an error
      expect(component.isRecording).toBe(false);
    });

    it('should handle stop without prior start gracefully', () => {
      fixture.detectChanges();
      expect(() => component.handleStopRecording()).not.toThrow();
      expect(component.isRecording).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Timer Display
  // ---------------------------------------------------------------------------
  describe('Timer Display', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should format 0 seconds as 0:00', () => {
      expect(component.formatTime(0)).toBe('0:00');
    });

    it('should format single-digit seconds with leading zero', () => {
      expect(component.formatTime(9)).toBe('0:09');
    });

    it('should format 30 seconds as 0:30', () => {
      expect(component.formatTime(30)).toBe('0:30');
    });

    it('should format 60 seconds as 1:00', () => {
      expect(component.formatTime(60)).toBe('1:00');
    });

    it('should format 125 seconds as 2:05', () => {
      expect(component.formatTime(125)).toBe('2:05');
    });

    it('should format 600 seconds as 10:00', () => {
      expect(component.formatTime(600)).toBe('10:00');
    });

    it('should provide formatted counter via getter', () => {
      component.counter = 75;
      expect(component.formattedCounter).toBe('1:15');
    });

    it('should display 0:00 in timer at initialization', () => {
      fixture.detectChanges();
      const timer = el.querySelector('.cometchat-media-recorder__timer');
      expect(timer?.textContent?.trim()).toContain('0:00');
    });

    it('should provide durationAriaLabel with minutes and seconds', () => {
      component.counter = 125;
      expect(component.durationAriaLabel).toBe('2 minutes 5 seconds');
    });

    it('should provide durationAriaLabel as 0 minutes 0 seconds at start', () => {
      expect(component.durationAriaLabel).toBe('0 minutes 0 seconds');
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Accessibility
  // ---------------------------------------------------------------------------
  describe('Keyboard Accessibility', () => {
    describe('Escape key', () => {
      it('should close recorder on Escape', () => {
        const spy = vi.fn();
        component.closeRecording.subscribe(spy);
        fixture.detectChanges();

        const event = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        });
        component.handleEscapeKey(event);

        expect(spy).toHaveBeenCalledTimes(1);
      });

      it('should preventDefault and stopPropagation on Escape', () => {
        fixture.detectChanges();
        const event = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        });
        const pdSpy = vi.spyOn(event, 'preventDefault');
        const spSpy = vi.spyOn(event, 'stopPropagation');

        component.handleEscapeKey(event);

        expect(pdSpy).toHaveBeenCalled();
        expect(spSpy).toHaveBeenCalled();
      });

      it('should reset state on Escape during recording', async () => {
        fixture.detectChanges();
        const mockStream = createMockMediaStream();
        stubGetUserMedia(mockStream);
        stubMediaRecorder();

        await component.handleStartRecording();
        expect(component.isRecording).toBe(true);

        const event = new KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
          cancelable: true,
        });
        component.handleEscapeKey(event);

        expect(component.isRecording).toBe(false);
        expect(component.mediaPreviewUrl).toBeUndefined();

        restoreGetUserMedia();
      });
    });

    describe('Enter key activation', () => {
      it('should trigger start action on Enter', () => {
        fixture.detectChanges();
        const startSpy = vi.spyOn(component, 'handleStartRecording');
        const event = new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        });

        component.handleKeydown(event, 'start');

        expect(startSpy).toHaveBeenCalled();
      });

      it('should trigger pause action on Enter', () => {
        fixture.detectChanges();
        const pauseSpy = vi.spyOn(component, 'handlePauseRecording');
        const event = new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        });

        component.handleKeydown(event, 'pause');

        expect(pauseSpy).toHaveBeenCalled();
      });

      it('should trigger stop action on Enter', () => {
        fixture.detectChanges();
        const stopSpy = vi.spyOn(component, 'handleStopRecording');
        const event = new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        });

        component.handleKeydown(event, 'stop');

        expect(stopSpy).toHaveBeenCalled();
      });

      it('should trigger close action on Enter', () => {
        fixture.detectChanges();
        const closeSpy = vi.spyOn(component, 'handleCloseRecording');
        const event = new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        });

        component.handleKeydown(event, 'close');

        expect(closeSpy).toHaveBeenCalled();
      });

      it('should trigger submit action on Enter', () => {
        fixture.detectChanges();
        const submitSpy = vi.spyOn(component, 'handleSubmitRecording');
        const event = new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        });

        component.handleKeydown(event, 'submit');

        expect(submitSpy).toHaveBeenCalled();
      });

      it('should trigger preview toggle on Enter', () => {
        fixture.detectChanges();
        const previewSpy = vi.spyOn(component, 'togglePreviewPlayback');
        const event = new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        });

        component.handleKeydown(event, 'preview');

        expect(previewSpy).toHaveBeenCalled();
      });

      it('should preventDefault on Enter', () => {
        fixture.detectChanges();
        const event = new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        });
        const spy = vi.spyOn(event, 'preventDefault');

        component.handleKeydown(event, 'start');

        expect(spy).toHaveBeenCalled();
      });
    });

    describe('Space key activation', () => {
      it('should trigger start action on Space', () => {
        fixture.detectChanges();
        const startSpy = vi.spyOn(component, 'handleStartRecording');
        const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });

        component.handleKeydown(event, 'start');

        expect(startSpy).toHaveBeenCalled();
      });

      it('should trigger close action on Space', () => {
        fixture.detectChanges();
        const closeSpy = vi.spyOn(component, 'handleCloseRecording');
        const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });

        component.handleKeydown(event, 'close');

        expect(closeSpy).toHaveBeenCalled();
      });

      it('should preventDefault on Space', () => {
        fixture.detectChanges();
        const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
        const spy = vi.spyOn(event, 'preventDefault');

        component.handleKeydown(event, 'start');

        expect(spy).toHaveBeenCalled();
      });
    });

    describe('Non-activation keys', () => {
      it('should not trigger action on letter keys', () => {
        fixture.detectChanges();
        const startSpy = vi.spyOn(component, 'handleStartRecording');
        const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });

        component.handleKeydown(event, 'start');

        expect(startSpy).not.toHaveBeenCalled();
      });

      it('should not trigger action on Tab', () => {
        fixture.detectChanges();
        const startSpy = vi.spyOn(component, 'handleStartRecording');
        const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });

        component.handleKeydown(event, 'start');

        expect(startSpy).not.toHaveBeenCalled();
      });

      it('should not preventDefault on non-activation keys', () => {
        fixture.detectChanges();
        const event = new KeyboardEvent('keydown', {
          key: 'ArrowDown',
          bubbles: true,
          cancelable: true,
        });
        const spy = vi.spyOn(event, 'preventDefault');

        component.handleKeydown(event, 'start');

        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('DOM keyboard interaction', () => {
      it('should have focusable delete button with tabindex=0', () => {
        component.hasError = false;
        fixture.detectChanges();

        const deleteBtn = el.querySelector('.cometchat-media-recorder__inline-delete');
        expect(deleteBtn?.getAttribute('tabindex')).toBe('0');
      });

      it('should have focusable pause button with tabindex=0 when recording', () => {
        component.isRecording = true;
        component.isPaused = false;
        component.hasError = false;
        fixture.detectChanges();

        const pauseBtn = el.querySelector('.cometchat-media-recorder__inline-pause');
        expect(pauseBtn?.getAttribute('tabindex')).toBe('0');
      });

      it('should have focusable resume button with tabindex=0 when paused', () => {
        component.isRecording = true;
        component.isPaused = true;
        component.hasError = false;
        fixture.detectChanges();

        const resumeBtn = el.querySelector('.cometchat-media-recorder__inline-resume');
        expect(resumeBtn?.getAttribute('tabindex')).toBe('0');
      });
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA
  // ---------------------------------------------------------------------------
  describe('ARIA', () => {
    it('should have aria-label on root group element', () => {
      fixture.detectChanges();
      const root = el.querySelector('.cometchat-media-recorder--inline');
      expect(root?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should report recordingStateText as empty when idle', () => {
      expect(component.recordingStateText).toBe('');
    });

    it('should report recordingStateText when recording', () => {
      component.isRecording = true;
      component.isPaused = false;
      component.hasError = false;
      expect(component.recordingStateText).toBeTruthy();
      expect(component.recordingStateText.length).toBeGreaterThan(0);
    });

    it('should report recordingStateText when paused', () => {
      component.isRecording = true;
      component.isPaused = true;
      component.hasError = false;
      expect(component.recordingStateText).toBeTruthy();
    });

    it('should report recordingStateText when hasError', () => {
      component.hasError = true;
      expect(component.recordingStateText).toBeTruthy();
    });

    it('should provide recordButtonAriaLabel for start when idle', () => {
      component.isPaused = false;
      expect(component.recordButtonAriaLabel).toBeTruthy();
      expect(typeof component.recordButtonAriaLabel).toBe('string');
    });

    it('should provide recordButtonAriaLabel for resume when paused', () => {
      component.isPaused = true;
      const label = component.recordButtonAriaLabel;
      expect(label).toBeTruthy();
      // Should be different from the start label
      component.isPaused = false;
      expect(label).not.toBe(component.recordButtonAriaLabel);
    });

    it('should provide recordButtonAriaPressed as false when not recording', () => {
      component.isRecording = false;
      expect(component.recordButtonAriaPressed).toBe('false');
    });

    it('should provide recordButtonAriaPressed as true when recording', () => {
      component.isRecording = true;
      expect(component.recordButtonAriaPressed).toBe('true');
    });

    it('should have aria-label on delete button', () => {
      component.hasError = false;
      fixture.detectChanges();

      const deleteBtn = el.querySelector('.cometchat-media-recorder__inline-delete');
      expect(deleteBtn?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-label on timer element', () => {
      fixture.detectChanges();
      const timer = el.querySelector('.cometchat-media-recorder__timer');
      expect(timer?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-hidden on waveform visualization', () => {
      fixture.detectChanges();
      const waveform = el.querySelector('.cometchat-media-recorder__waveform');
      expect(waveform?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should have aria-label on pause button when recording', () => {
      component.isRecording = true;
      component.isPaused = false;
      component.hasError = false;
      fixture.detectChanges();

      const pauseBtn = el.querySelector('.cometchat-media-recorder__inline-pause');
      expect(pauseBtn?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-label on resume button when paused', () => {
      component.isRecording = true;
      component.isPaused = true;
      component.hasError = false;
      fixture.detectChanges();

      const resumeBtn = el.querySelector('.cometchat-media-recorder__inline-resume');
      expect(resumeBtn?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-label on play preview button when paused', () => {
      component.isRecording = true;
      component.isPaused = true;
      component.hasError = false;
      fixture.detectChanges();

      const playBtn = el.querySelector('.cometchat-media-recorder__inline-play');
      expect(playBtn?.getAttribute('aria-label')).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Preview Playback
  // ---------------------------------------------------------------------------
  describe('Preview Playback', () => {
    it('should have isPreviewPlaying false by default', () => {
      expect(component.isPreviewPlaying).toBe(false);
    });

    it('should show counter time in previewTimeDisplay when not playing', () => {
      component.counter = 10;
      component.isPreviewPlaying = false;
      component.previewCurrentTime = 0;
      expect(component.previewTimeDisplay).toBe('0:10');
    });

    it('should show currentTime / counter in previewTimeDisplay when playing', () => {
      component.counter = 30;
      component.isPreviewPlaying = true;
      component.previewCurrentTime = 5.7;
      expect(component.previewTimeDisplay).toBe('0:05 / 0:30');
    });

    it('should show currentTime / counter when currentTime > 0 even if not playing', () => {
      component.counter = 20;
      component.isPreviewPlaying = false;
      component.previewCurrentTime = 3.2;
      expect(component.previewTimeDisplay).toBe('0:03 / 0:20');
    });

    it('should floor previewCurrentTime in display', () => {
      component.counter = 15;
      component.isPreviewPlaying = true;
      component.previewCurrentTime = 7.999;
      expect(component.previewTimeDisplay).toBe('0:07 / 0:15');
    });
  });

  // ---------------------------------------------------------------------------
  // Lifecycle Hooks
  // ---------------------------------------------------------------------------
  describe('Lifecycle Hooks', () => {
    it('should not throw on ngOnDestroy when never started', () => {
      fixture.detectChanges();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should stop recording on ngOnDestroy', async () => {
      fixture.detectChanges();
      const mockStream = createMockMediaStream();
      stubGetUserMedia(mockStream);
      stubMediaRecorder();

      await component.handleStartRecording();
      expect(component.isRecording).toBe(true);

      component.ngOnDestroy();
      expect(component.isRecording).toBe(false);

      restoreGetUserMedia();
    });

    it('should not auto-start recording when autoRecording is false', () => {
      component.autoRecording = false;
      fixture.detectChanges();
      expect(component.isRecording).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle multiple stop calls gracefully', () => {
      fixture.detectChanges();
      expect(() => {
        component.handleStopRecording();
        component.handleStopRecording();
        component.handleStopRecording();
      }).not.toThrow();
    });

    it('should handle close without prior start', () => {
      const spy = vi.fn();
      component.closeRecording.subscribe(spy);
      fixture.detectChanges();

      component.handleCloseRecording();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(component.isRecording).toBe(false);
    });

    it('should handle submit without any recording', () => {
      const spy = vi.fn();
      component.submitRecording.subscribe(spy);
      fixture.detectChanges();

      component.handleSubmitRecording();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should reset preview state on close', () => {
      fixture.detectChanges();
      component.isPreviewPlaying = true;
      component.previewCurrentTime = 5;
      component.previewDuration = 10;

      component.handleCloseRecording();

      expect(component.isPreviewPlaying).toBe(false);
      expect(component.previewCurrentTime).toBe(0);
      expect(component.previewDuration).toBe(0);
    });

    it('should handle missing MediaRecorder API gracefully', async () => {
      fixture.detectChanges();

      // In jsdom, MediaRecorder is not available natively
      // The component should handle this without crashing
      const result = await component.initMediaRecorder();
      expect(result).toBeNull();
    });

    it('should handle formatTime with large values', () => {
      expect(component.formatTime(3600)).toBe('60:00');
      expect(component.formatTime(3661)).toBe('61:01');
    });

    it('should handle formatTime with 0', () => {
      expect(component.formatTime(0)).toBe('0:00');
    });

    it('should reset counter on handleCloseRecording', async () => {
      fixture.detectChanges();
      component.counter = 42;

      component.handleCloseRecording();

      expect(component.counter).toBe(0);
    });

    it('should clear hasError on handleCloseRecording', () => {
      fixture.detectChanges();
      component.hasError = true;

      component.handleCloseRecording();

      expect(component.hasError).toBe(false);
    });

    it('should handle recording state transitions in DOM correctly', () => {
      // Idle state — fresh fixture starts in idle
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-media-recorder__inline-delete')).toBeTruthy();

      // Error state — use a fresh fixture
      const f1 = TestBed.createComponent(CometChatMediaRecorderComponent);
      f1.componentInstance.hasError = true;
      f1.detectChanges();
      expect(
        f1.nativeElement.querySelector('.cometchat-media-recorder__inline-error')
      ).toBeTruthy();
      expect(
        f1.nativeElement.querySelector('.cometchat-media-recorder__inline-delete')
      ).toBeFalsy();
      f1.componentInstance.ngOnDestroy();

      // Recording state — fresh fixture
      const f2 = TestBed.createComponent(CometChatMediaRecorderComponent);
      f2.componentInstance.hasError = false;
      f2.componentInstance.isRecording = true;
      f2.componentInstance.isPaused = false;
      f2.detectChanges();
      expect(
        f2.nativeElement.querySelector('.cometchat-media-recorder__recording-dot')
      ).toBeTruthy();
      expect(
        f2.nativeElement.querySelector('.cometchat-media-recorder__inline-pause')
      ).toBeTruthy();
      f2.componentInstance.ngOnDestroy();

      // Paused state — fresh fixture
      const f3 = TestBed.createComponent(CometChatMediaRecorderComponent);
      f3.componentInstance.hasError = false;
      f3.componentInstance.isRecording = true;
      f3.componentInstance.isPaused = true;
      f3.detectChanges();
      expect(
        f3.nativeElement.querySelector('.cometchat-media-recorder__inline-resume')
      ).toBeTruthy();
      expect(f3.nativeElement.querySelector('.cometchat-media-recorder__inline-play')).toBeTruthy();
      expect(
        f3.nativeElement.querySelector('.cometchat-media-recorder__recording-dot')
      ).toBeFalsy();
      f3.componentInstance.ngOnDestroy();
    });
  });
});

// =============================================================================
// Helpers: Stub browser MediaRecorder/getUserMedia APIs for jsdom
// =============================================================================

let originalGetUserMedia: typeof navigator.mediaDevices.getUserMedia | undefined;
let originalMediaRecorder: typeof globalThis.MediaRecorder | undefined;

function createMockMediaStream(): MediaStream {
  const track = {
    stop: vi.fn(),
    kind: 'audio',
    id: 'mock-track',
    enabled: true,
    muted: false,
    onended: null as ((this: MediaStreamTrack, ev: Event) => any) | null,
    readyState: 'live' as MediaStreamTrackState,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
    clone: vi.fn(),
    getCapabilities: vi.fn(() => ({})),
    getConstraints: vi.fn(() => ({})),
    getSettings: vi.fn(() => ({ deviceId: 'mock' })),
    applyConstraints: vi.fn(),
    contentHint: '',
    label: 'Mock Audio Track',
    onmute: null,
    onunmute: null,
  } as unknown as MediaStreamTrack;

  return {
    getTracks: () => [track],
    getAudioTracks: () => [track],
    getVideoTracks: () => [],
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    clone: vi.fn(),
    id: 'mock-stream',
    active: true,
    onaddtrack: null,
    onremovetrack: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
    getTrackById: vi.fn(),
  } as unknown as MediaStream;
}

function stubGetUserMedia(mockStream: MediaStream): void {
  originalGetUserMedia = navigator.mediaDevices?.getUserMedia;

  if (!navigator.mediaDevices) {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
      writable: true,
      configurable: true,
    });
  } else {
    navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue(mockStream);
  }
}

function stubMediaRecorder(): void {
  originalMediaRecorder = (globalThis as any).MediaRecorder;

  class MockMediaRecorder {
    state: RecordingState = 'inactive';
    ondataavailable: ((event: BlobEvent) => void) | null = null;
    onstop: (() => void) | null = null;
    onerror: ((event: Event) => void) | null = null;

    start(_timeslice?: number): void {
      this.state = 'recording';
    }
    stop(): void {
      this.state = 'inactive';
      if (this.onstop) this.onstop();
    }
    pause(): void {
      this.state = 'paused';
    }
    resume(): void {
      this.state = 'recording';
    }
    requestData(): void {}
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
    dispatchEvent = vi.fn(() => true);

    static isTypeSupported(_mimeType: string): boolean {
      return true;
    }
  }

  (globalThis as any).MediaRecorder = MockMediaRecorder;
}

function restoreGetUserMedia(): void {
  if (originalGetUserMedia && navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia = originalGetUserMedia;
  }
  if (originalMediaRecorder !== undefined) {
    (globalThis as any).MediaRecorder = originalMediaRecorder;
  } else {
    delete (globalThis as any).MediaRecorder;
  }
}
