/**
 * Coverage-focused unit tests for CometChatMediaRecorderComponent.
 *
 * jsdom ships none of the browser APIs this component drives —
 * getUserMedia, MediaRecorder, AudioContext, URL.createObjectURL,
 * navigator.permissions, WaveSurfer's audio graph — so every recording path
 * short-circuits into a guard or a catch block unless they are stubbed.
 * This file installs deterministic fakes for all of them (including a
 * hand-pumped requestAnimationFrame) and then calls the component methods
 * directly, which keeps the real audio renderer out of the test and lets each
 * guard, catch block and fallback be driven on purpose.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChatMediaRecorderComponent } from './cometchat-media-recorder.component';
import { LiveAnnouncerService } from '../../../services/live-announcer.service';
import { CometChatLogger } from '../../../utils/CometChatLogger';
import { WaveSurfer } from '../../cometchat-audio-bubble/wavesurfer';

// ---------------------------------------------------------------------------
// Fake media stream
// ---------------------------------------------------------------------------
interface FakeTrack {
  stop: ReturnType<typeof vi.fn>;
  onended: ((event?: Event) => void) | null;
}

function createFakeStream(): { stream: MediaStream; track: FakeTrack } {
  const track: FakeTrack = { stop: vi.fn(), onended: null };
  const stream = { getTracks: () => [track] } as unknown as MediaStream;
  return { stream, track };
}

// ---------------------------------------------------------------------------
// Fake MediaRecorder
// ---------------------------------------------------------------------------
const recorders: FakeMediaRecorder[] = [];

class FakeMediaRecorder {
  state = 'inactive';
  startedWith?: number;
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public readonly sourceStream: MediaStream) {
    recorders.push(this);
  }

  start(timeslice?: number): void {
    this.startedWith = timeslice;
    this.state = 'recording';
  }

  stop(): void {
    this.state = 'inactive';
    this.onstop?.();
  }

  pause(): void {
    this.state = 'paused';
  }

  resume(): void {
    this.state = 'recording';
  }

  emitData(data: Blob): void {
    this.ondataavailable?.({ data });
  }

  emitError(event: unknown): void {
    this.onerror?.(event as Event);
  }
}

function lastRecorder(): FakeMediaRecorder {
  return recorders[recorders.length - 1];
}

// ---------------------------------------------------------------------------
// Fake Web Audio graph
// ---------------------------------------------------------------------------
const audioCfg = {
  throwOnConstruct: false,
  closeRejects: false,
  initialState: 'running' as string,
  byteValue: 255,
};

class FakeAnalyser {
  fftSize = 2048;
  connect = vi.fn();
  disconnect = vi.fn();
  getByteFrequencyData = vi.fn((array: Uint8Array) => array.fill(audioCfg.byteValue));

  get frequencyBinCount(): number {
    return this.fftSize / 2;
  }
}

let lastAudioContext: FakeAudioContext | undefined;

class FakeAudioContext {
  state: string;
  analyser = new FakeAnalyser();
  sourceNode = { connect: vi.fn(), disconnect: vi.fn() };
  mediaStreamArg?: MediaStream;
  close = vi.fn(() => {
    this.state = 'closed';
    return audioCfg.closeRejects ? Promise.reject(new Error('close failed')) : Promise.resolve();
  });

  constructor() {
    if (audioCfg.throwOnConstruct) throw new Error('AudioContext unavailable');
    this.state = audioCfg.initialState;
    lastAudioContext = this;
  }

  createAnalyser(): FakeAnalyser {
    return this.analyser;
  }

  createMediaStreamSource(stream: MediaStream): { connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> } {
    this.mediaStreamArg = stream;
    return this.sourceNode;
  }
}

// ---------------------------------------------------------------------------
// Hand-pumped animation frames
// ---------------------------------------------------------------------------
const frameCallbacks = new Map<number, FrameRequestCallback>();
const cancelledFrames: number[] = [];
let nextFrameId = 0;

function flushFrames(times = 1): void {
  for (let i = 0; i < times; i++) {
    const pending = [...frameCallbacks.entries()];
    frameCallbacks.clear();
    pending.forEach(([, cb]) => cb(0));
  }
}

// ---------------------------------------------------------------------------
// Fake WaveSurfer instance
// ---------------------------------------------------------------------------
interface FakeWaveSurfer {
  handlers: Record<string, Array<(...args: unknown[]) => void>>;
  on: ReturnType<typeof vi.fn>;
  load: ReturnType<typeof vi.fn>;
  playPause: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  seekTo: ReturnType<typeof vi.fn>;
  emit(event: string, ...args: unknown[]): void;
}

function createFakeWaveSurfer(): FakeWaveSurfer {
  const handlers: Record<string, Array<(...args: unknown[]) => void>> = {};
  return {
    handlers,
    on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      (handlers[event] ||= []).push(cb);
    }),
    load: vi.fn(() => Promise.resolve()),
    playPause: vi.fn(),
    pause: vi.fn(),
    destroy: vi.fn(),
    seekTo: vi.fn(),
    emit(event: string, ...args: unknown[]) {
      (handlers[event] || []).forEach(cb => cb(...args));
    },
  };
}

/**
 * Fake only the clock APIs. Sinon's default set also replaces
 * requestAnimationFrame, which would swap out the hand-pumped frame queue the
 * waveform assertions rely on.
 */
function useClockFakes(): void {
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
  });
}

const flushMicrotasks = async (): Promise<void> => {
  for (let i = 0; i < 6; i++) await Promise.resolve();
};

describe('CometChatMediaRecorderComponent — recording internals', () => {
  const fixtures: ComponentFixture<CometChatMediaRecorderComponent>[] = [];

  let fixture: ComponentFixture<CometChatMediaRecorderComponent>;
  let component: CometChatMediaRecorderComponent;
  let priv: Record<string, any>;

  let stream: MediaStream;
  let track: FakeTrack;
  let getUserMedia: ReturnType<typeof vi.fn>;
  let permissionStatus: { state: PermissionState; onchange: (() => void) | null };
  let permissionsQuery: ReturnType<typeof vi.fn>;
  let announce: ReturnType<typeof vi.fn>;
  let loggerError: ReturnType<typeof vi.fn>;
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let waveSurferCreate: ReturnType<typeof vi.fn>;

  const originals: Record<string, unknown> = {};

  function newFixture(): ComponentFixture<CometChatMediaRecorderComponent> {
    const created = TestBed.createComponent(CometChatMediaRecorderComponent);
    fixtures.push(created);
    return created;
  }

  function setPermissionsQuery(impl: () => Promise<unknown>): void {
    permissionsQuery = vi.fn(impl);
    Object.defineProperty(navigator, 'permissions', {
      value: { query: permissionsQuery },
      writable: true,
      configurable: true,
    });
  }

  /** Attaches the fake container the WaveSurfer preview needs. */
  function attachWaveformContainer(): HTMLDivElement {
    const element = document.createElement('div');
    component.waveformContainer = { nativeElement: element } as any;
    return element;
  }

  beforeEach(async () => {
    recorders.length = 0;
    cancelledFrames.length = 0;
    frameCallbacks.clear();
    nextFrameId = 0;
    lastAudioContext = undefined;
    audioCfg.throwOnConstruct = false;
    audioCfg.closeRejects = false;
    audioCfg.initialState = 'running';
    audioCfg.byteValue = 255;

    originals['MediaRecorder'] = (globalThis as any).MediaRecorder;
    originals['AudioContext'] = (globalThis as any).AudioContext;
    originals['requestAnimationFrame'] = globalThis.requestAnimationFrame;
    originals['cancelAnimationFrame'] = globalThis.cancelAnimationFrame;
    originals['mediaDevices'] = (navigator as any).mediaDevices;
    originals['permissions'] = (navigator as any).permissions;
    originals['createObjectURL'] = (URL as any).createObjectURL;
    originals['revokeObjectURL'] = (URL as any).revokeObjectURL;

    (globalThis as any).MediaRecorder = FakeMediaRecorder;
    (globalThis as any).AudioContext = FakeAudioContext;

    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      nextFrameId += 1;
      frameCallbacks.set(nextFrameId, cb);
      return nextFrameId;
    }) as typeof globalThis.requestAnimationFrame;
    globalThis.cancelAnimationFrame = ((id: number) => {
      cancelledFrames.push(id);
      frameCallbacks.delete(id);
    }) as typeof globalThis.cancelAnimationFrame;

    const fake = createFakeStream();
    stream = fake.stream;
    track = fake.track;
    getUserMedia = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia },
      writable: true,
      configurable: true,
    });

    permissionStatus = { state: 'prompt', onchange: null };
    setPermissionsQuery(() => Promise.resolve(permissionStatus));

    let urlCounter = 0;
    createObjectURL = vi.fn(() => `blob:fake/${++urlCounter}`);
    revokeObjectURL = vi.fn();
    (URL as any).createObjectURL = createObjectURL;
    (URL as any).revokeObjectURL = revokeObjectURL;

    loggerError = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => {}) as any;
    waveSurferCreate = vi
      .spyOn(WaveSurfer, 'create')
      .mockImplementation(() => createFakeWaveSurfer() as any) as any;

    await TestBed.configureTestingModule({
      imports: [CometChatMediaRecorderComponent],
    }).compileComponents();

    announce = vi
      .spyOn(TestBed.inject(LiveAnnouncerService), 'announce')
      .mockImplementation(() => {}) as any;

    fixture = newFixture();
    component = fixture.componentInstance;
    priv = component as unknown as Record<string, any>;
    fixture.detectChanges();
    await flushMicrotasks();
  });

  afterEach(() => {
    fixtures.forEach(f => f.destroy());
    fixtures.length = 0;
    vi.useRealTimers();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();

    (globalThis as any).MediaRecorder = originals['MediaRecorder'];
    (globalThis as any).AudioContext = originals['AudioContext'];
    globalThis.requestAnimationFrame = originals['requestAnimationFrame'] as typeof globalThis.requestAnimationFrame;
    globalThis.cancelAnimationFrame = originals['cancelAnimationFrame'] as typeof globalThis.cancelAnimationFrame;
    Object.defineProperty(navigator, 'mediaDevices', {
      value: originals['mediaDevices'],
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'permissions', {
      value: originals['permissions'],
      writable: true,
      configurable: true,
    });
    (URL as any).createObjectURL = originals['createObjectURL'];
    (URL as any).revokeObjectURL = originals['revokeObjectURL'];
  });

  // -------------------------------------------------------------------------
  // initMediaRecorder
  // -------------------------------------------------------------------------
  describe('initMediaRecorder', () => {
    it('acquires a stream, starts the recorder with a 250ms timeslice and clears the error flag', async () => {
      component.hasError = true;

      const recorder = await component.initMediaRecorder();

      expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
      expect(recorder).toBe(lastRecorder());
      expect(lastRecorder().state).toBe('recording');
      expect(lastRecorder().startedWith).toBe(250);
      expect(priv['stream']).toBe(stream);
      expect(priv['hasInitialized']).toBe(true);
      expect(component.hasError).toBe(false);
    });

    it('stops the tracks of a previously held stream before acquiring a new one', async () => {
      priv['stream'] = stream;

      await component.initMediaRecorder();

      expect(track.stop).toHaveBeenCalledTimes(1);
    });

    it('returns null without touching getUserMedia when already initialized', async () => {
      priv['hasInitialized'] = true;

      const recorder = await component.initMediaRecorder();

      expect(recorder).toBeNull();
      expect(getUserMedia).not.toHaveBeenCalled();
      expect(recorders).toHaveLength(0);
    });

    it('marks the permission denied and emits the error for NotAllowedError', async () => {
      const denial = Object.assign(new Error('nope'), { name: 'NotAllowedError' });
      getUserMedia.mockRejectedValue(denial);
      const emitted: Error[] = [];
      component.recordingError.subscribe(e => emitted.push(e));

      const recorder = await component.initMediaRecorder();

      expect(recorder).toBeNull();
      expect(component.hasError).toBe(true);
      expect(component.permissionState).toBe('denied');
      expect(priv['hasInitialized']).toBe(false);
      expect(emitted).toEqual([denial]);
    });

    it('marks the permission denied for the legacy PermissionDeniedError name', async () => {
      getUserMedia.mockRejectedValue({ name: 'PermissionDeniedError' });

      await component.initMediaRecorder();

      expect(component.hasError).toBe(true);
      expect(component.permissionState).toBe('denied');
    });

    it('leaves the permission state alone for a non-permission failure but still emits', async () => {
      const failure = Object.assign(new Error('busy'), { name: 'NotReadableError' });
      getUserMedia.mockRejectedValue(failure);
      const emitted: Error[] = [];
      component.recordingError.subscribe(e => emitted.push(e));

      await component.initMediaRecorder();

      expect(component.hasError).toBe(false);
      expect(component.permissionState).toBe('prompt');
      expect(emitted).toEqual([failure]);
    });
  });

  // -------------------------------------------------------------------------
  // MediaRecorder event handlers
  // -------------------------------------------------------------------------
  describe('MediaRecorder handlers', () => {
    beforeEach(async () => {
      await component.handleStartRecording();
    });

    it('collects non-empty data chunks and ignores empty ones', () => {
      lastRecorder().emitData(new Blob([new Uint8Array(4)], { type: 'audio/webm' }));
      lastRecorder().emitData(new Blob([], { type: 'audio/webm' }));

      expect(priv['audioChunks']).toHaveLength(1);
      expect(priv['audioChunks'][0].size).toBe(4);
    });

    it('does nothing on stop when no chunk was ever collected', () => {
      lastRecorder().stop();

      expect(createObjectURL).not.toHaveBeenCalled();
      expect(component.mediaPreviewUrl).toBeUndefined();
      expect(priv['recordedBlob']).toBeUndefined();
    });

    it('builds a preview URL from the collected chunks and keeps their mime type', () => {
      lastRecorder().emitData(new Blob([new Uint8Array(2)], { type: 'audio/ogg' }));

      lastRecorder().stop();

      expect(priv['recordedBlob'].type).toBe('audio/ogg');
      expect(priv['audioChunks']).toEqual([]);
      expect(createObjectURL).toHaveBeenCalledWith(priv['recordedBlob']);
      expect(component.mediaPreviewUrl).toBe('blob:fake/1');
    });

    it('falls back to audio/webm when the first chunk carries no mime type', () => {
      lastRecorder().emitData(new Blob([new Uint8Array(2)]));

      lastRecorder().stop();

      expect(priv['recordedBlob'].type).toBe('audio/webm');
    });

    it('submits and resets instead of building a preview when an inline send is pending', () => {
      const emitted: Blob[] = [];
      component.submitRecording.subscribe(b => emitted.push(b));
      lastRecorder().emitData(new Blob([new Uint8Array(3)], { type: 'audio/webm' }));
      priv['pendingInlineSend'] = true;

      lastRecorder().stop();

      expect(emitted).toHaveLength(1);
      expect(emitted[0].size).toBe(3);
      expect(component.mediaPreviewUrl).toBeUndefined();
      expect(createObjectURL).not.toHaveBeenCalled();
      expect(priv['pendingInlineSend']).toBe(false);
      expect(component.mediaRecorder).toBeUndefined();
    });

    it('tears down the session and re-emits the recorder error', () => {
      const failure = new Error('recorder blew up');
      const emitted: Error[] = [];
      component.recordingError.subscribe(e => emitted.push(e));

      lastRecorder().emitError({ error: failure });

      expect(component.hasError).toBe(true);
      expect(component.isRecording).toBe(false);
      expect(component.isPaused).toBe(false);
      expect(track.stop).toHaveBeenCalled();
      expect(priv['stream']).toBeUndefined();
      expect(priv['hasInitialized']).toBe(false);
      expect(priv['animationFrameId']).toBeUndefined();
      expect(emitted).toEqual([failure]);
    });

    it('tears down the session without emitting when the error event carries no error', () => {
      const emitted: Error[] = [];
      component.recordingError.subscribe(e => emitted.push(e));

      lastRecorder().emitError({});

      expect(component.hasError).toBe(true);
      expect(component.isRecording).toBe(false);
      expect(emitted).toEqual([]);
    });

    it('flags an error and stops the waveform when the microphone track ends', () => {
      expect(track.onended).toBeTypeOf('function');

      track.onended!();

      expect(component.hasError).toBe(true);
      expect(component.isRecording).toBe(false);
      expect(priv['animationFrameId']).toBeUndefined();
      expect(component.waveformHeights.every(h => h === 4)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Waveform analysis
  // -------------------------------------------------------------------------
  describe('waveform analysis', () => {
    it('wires an analyser with a 64-sample FFT onto the captured stream', async () => {
      await component.handleStartRecording();

      expect(lastAudioContext).toBeDefined();
      expect(lastAudioContext!.analyser.fftSize).toBe(64);
      expect(lastAudioContext!.mediaStreamArg).toBe(stream);
      expect(lastAudioContext!.sourceNode.connect).toHaveBeenCalledWith(lastAudioContext!.analyser);
      expect(frameCallbacks.has(priv['animationFrameId'])).toBe(true);
    });

    it('logs and keeps recording when the audio graph cannot be created', async () => {
      audioCfg.throwOnConstruct = true;

      await component.handleStartRecording();

      expect(loggerError).toHaveBeenCalledWith(
        'CometChatMediaRecorder',
        'Failed to initialize audio analysis:',
        expect.any(Error)
      );
      expect(component.isRecording).toBe(true);
      expect(priv['animationFrameId']).toBeUndefined();
    });

    it('maps analyser data onto the bar heights on every frame while recording', async () => {
      audioCfg.byteValue = 255;
      await component.handleStartRecording();

      flushFrames();

      expect(lastAudioContext!.analyser.getByteFrequencyData).toHaveBeenCalled();
      expect(component.waveformHeights).toHaveLength(30);
      expect(component.waveformHeights.every(h => h === 24)).toBe(true);
    });

    it('cancels the frame, disconnects the source, closes the context and resets the bars', async () => {
      await component.handleStartRecording();
      const context = lastAudioContext!;
      const frameId = priv['animationFrameId'];
      const cancelledBefore = cancelledFrames.length;

      component.handleStopRecording();

      expect(cancelledFrames.slice(cancelledBefore)).toContain(frameId);
      expect(context.sourceNode.disconnect).toHaveBeenCalledTimes(1);
      expect(context.close).toHaveBeenCalledTimes(1);
      expect(priv['audioContext']).toBeUndefined();
      expect(priv['analyser']).toBeUndefined();
      expect(component.waveformHeights.every(h => h === 4)).toBe(true);
    });

    it('keeps an already-closed context instead of closing it twice', async () => {
      audioCfg.initialState = 'closed';
      await component.handleStartRecording();
      const context = lastAudioContext!;

      component.handleStopRecording();

      expect(context.close).not.toHaveBeenCalled();
      expect(priv['audioContext']).toBe(context);
    });

    it('swallows a rejected context close without producing an unhandled rejection', async () => {
      audioCfg.closeRejects = true;
      await component.handleStartRecording();
      const unhandled: unknown[] = [];
      const onUnhandled = (reason: unknown): void => {
        unhandled.push(reason);
      };
      process.on('unhandledRejection', onUnhandled);

      component.handleStopRecording();
      await new Promise(resolve => setTimeout(resolve, 0));
      process.off('unhandledRejection', onUnhandled);

      expect(lastAudioContext!.close).toHaveBeenCalledTimes(1);
      expect(unhandled).toEqual([]);
      expect(priv['audioContext']).toBeUndefined();
    });

    it('does not restart the frame loop when there is no analyser to resume', () => {
      priv['analyser'] = undefined;

      priv['resumeWaveformAnalysis']();

      expect(priv['animationFrameId']).toBeUndefined();
      expect(frameCallbacks.size).toBe(0);
    });

    it('stops ticking once recording is no longer active', async () => {
      await component.handleStartRecording();
      flushFrames();
      const callsWhileRecording = lastAudioContext!.analyser.getByteFrequencyData.mock.calls.length;

      component.isRecording = false;
      flushFrames();

      expect(lastAudioContext!.analyser.getByteFrequencyData).toHaveBeenCalledTimes(callsWhileRecording);
      expect(frameCallbacks.size).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Start / pause / resume
  // -------------------------------------------------------------------------
  describe('start, pause and resume', () => {
    it('announces the recording state and resets the counter on a fresh start', async () => {
      component.counter = 42;
      component.mediaPreviewUrl = 'blob:stale';

      await component.handleStartRecording();

      expect(component.isRecording).toBe(true);
      expect(component.isPaused).toBe(false);
      expect(component.counter).toBe(0);
      expect(component.mediaPreviewUrl).toBeUndefined();
      expect(announce).toHaveBeenCalledWith('Recording');
    });

    it('does not start a second recorder while already recording', async () => {
      await component.handleStartRecording();

      await component.handleStartRecording();

      expect(recorders).toHaveLength(1);
      expect(getUserMedia).toHaveBeenCalledTimes(1);
    });

    it('leaves the state untouched when the recorder could not be created', async () => {
      getUserMedia.mockRejectedValue({ name: 'NotAllowedError' });

      await component.handleStartRecording();

      expect(component.isRecording).toBe(false);
      expect(component.mediaRecorder).toBeUndefined();
    });

    it('cancels the running frame and schedules the preview when pausing', async () => {
      useClockFakes();
      await component.handleStartRecording();
      const frameId = priv['animationFrameId'];
      const cancelledBefore = cancelledFrames.length;
      lastRecorder().emitData(new Blob([new Uint8Array(8)], { type: 'audio/webm' }));
      attachWaveformContainer();

      component.handlePauseRecording();

      expect(component.isPaused).toBe(true);
      expect(lastRecorder().state).toBe('paused');
      expect(cancelledFrames.slice(cancelledBefore)).toContain(frameId);
      expect(priv['animationFrameId']).toBeUndefined();
      expect(priv['timerInterval']).toBeUndefined();
      expect(announce).toHaveBeenCalledWith('Recording paused');
      expect(waveSurferCreate).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);

      expect(waveSurferCreate).toHaveBeenCalledTimes(1);
    });

    it('pauses without cancelling a frame when the audio graph never started', async () => {
      audioCfg.throwOnConstruct = true;
      await component.handleStartRecording();
      expect(priv['animationFrameId']).toBeUndefined();
      const cancelledBefore = [...cancelledFrames];

      component.handlePauseRecording();

      expect(component.isPaused).toBe(true);
      expect(cancelledFrames).toEqual(cancelledBefore);
    });

    it('ignores a pause request when the recorder is not recording', () => {
      component.isRecording = true;
      component.mediaRecorder = { state: 'inactive' } as MediaRecorder;

      component.handlePauseRecording();

      expect(component.isPaused).toBe(false);
      expect(announce).not.toHaveBeenCalled();
    });

    it('resumes the recorder, restarts the frame loop and drops the preview', async () => {
      await component.handleStartRecording();
      component.handlePauseRecording();
      const wave = createFakeWaveSurfer();
      priv['waveSurfer'] = wave;
      component.isPreviewPlaying = true;
      component.previewDuration = 7;
      priv['animationFrameId'] = undefined;

      await component.handleStartRecording();

      expect(lastRecorder().state).toBe('recording');
      expect(component.isRecording).toBe(true);
      expect(component.isPaused).toBe(false);
      expect(wave.pause).toHaveBeenCalledTimes(1);
      expect(wave.destroy).toHaveBeenCalledTimes(1);
      expect(priv['waveSurfer']).toBeUndefined();
      expect(component.previewDuration).toBe(0);
      expect(priv['animationFrameId']).toBeDefined();
      expect(recorders).toHaveLength(1);
    });

    it('does not resume the frame loop when the analyser is gone', async () => {
      await component.handleStartRecording();
      component.handlePauseRecording();
      priv['analyser'] = undefined;
      priv['animationFrameId'] = undefined;
      frameCallbacks.clear();

      await component.handleStartRecording();

      expect(component.isRecording).toBe(true);
      expect(priv['animationFrameId']).toBeUndefined();
      expect(frameCallbacks.size).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Inline send
  // -------------------------------------------------------------------------
  describe('handleInlineSend', () => {
    it('stops a live recording and submits the resulting blob', async () => {
      await component.handleStartRecording();
      lastRecorder().emitData(new Blob([new Uint8Array(5)], { type: 'audio/webm' }));
      const emitted: Blob[] = [];
      component.submitRecording.subscribe(b => emitted.push(b));

      component.handleInlineSend();

      expect(emitted).toHaveLength(1);
      expect(emitted[0].size).toBe(5);
      expect(component.isRecording).toBe(false);
      expect(component.isPaused).toBe(false);
      expect(priv['timerInterval']).toBeUndefined();
      expect(priv['audioContext']).toBeUndefined();
    });

    it('stops a paused recording and tears the preview down before submitting', async () => {
      await component.handleStartRecording();
      lastRecorder().emitData(new Blob([new Uint8Array(6)], { type: 'audio/webm' }));
      component.handlePauseRecording();
      const wave = createFakeWaveSurfer();
      priv['waveSurfer'] = wave;
      component.isPreviewPlaying = true;
      const emitted: Blob[] = [];
      component.submitRecording.subscribe(b => emitted.push(b));

      component.handleInlineSend();

      expect(emitted).toHaveLength(1);
      expect(wave.pause).toHaveBeenCalledTimes(1);
      expect(wave.destroy).toHaveBeenCalledTimes(1);
      expect(component.isPreviewPlaying).toBe(false);
    });

    it('keeps the pending flag set when a live recording produced no chunks', async () => {
      await component.handleStartRecording();
      const emitted: Blob[] = [];
      component.submitRecording.subscribe(b => emitted.push(b));

      component.handleInlineSend();

      expect(emitted).toEqual([]);
      expect(priv['pendingInlineSend']).toBe(true);
    });

    it('submits an already recorded blob when the recorder is idle', () => {
      const blob = new Blob([new Uint8Array(9)], { type: 'audio/webm' });
      priv['recordedBlob'] = blob;
      component.counter = 12;
      const emitted: Blob[] = [];
      component.submitRecording.subscribe(b => emitted.push(b));

      component.handleInlineSend();

      expect(emitted).toEqual([blob]);
      expect(component.counter).toBe(0);
      expect(priv['recordedBlob']).toBeUndefined();
    });

    it('does nothing when there is neither an active recorder nor a recorded blob', () => {
      const emitted: Blob[] = [];
      component.submitRecording.subscribe(b => emitted.push(b));

      component.handleInlineSend();

      expect(emitted).toEqual([]);
      expect(priv['pendingInlineSend']).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // WaveSurfer preview
  // -------------------------------------------------------------------------
  describe('WaveSurfer preview', () => {
    it('creates the preview over the container the paused template renders', () => {
      // The #waveformContainer ViewChild only exists in the paused branch of the
      // template, so the paused state has to be in place before the first
      // change detection pass of this fixture.
      const paused = newFixture();
      const pausedComponent = paused.componentInstance;
      const pausedPriv = pausedComponent as unknown as Record<string, any>;
      pausedComponent.isPaused = true;
      paused.detectChanges();

      const container = pausedComponent.waveformContainer!.nativeElement;
      expect(container.classList.contains('cometchat-media-recorder__waveform-preview')).toBe(true);
      pausedPriv['audioChunks'] = [new Blob([new Uint8Array(4)], { type: 'audio/ogg' })];

      pausedPriv['initWaveSurferPreview']();

      expect(waveSurferCreate).toHaveBeenCalledTimes(1);
      const options = waveSurferCreate.mock.calls[0][0] as Record<string, unknown>;
      expect(options['container']).toBe(container);
      expect(options['height']).toBe(24);
      expect(createObjectURL).toHaveBeenCalledTimes(1);
      const previewBlob = createObjectURL.mock.calls[0][0] as Blob;
      expect(previewBlob.type).toBe('audio/ogg');
      const wave = pausedPriv['waveSurfer'] as FakeWaveSurfer;
      expect(wave.load).toHaveBeenCalledWith('blob:fake/1');
    });

    it('falls back to audio/webm for the preview blob when the chunk has no type', () => {
      attachWaveformContainer();
      priv['audioChunks'] = [new Blob([new Uint8Array(4)])];

      priv['initWaveSurferPreview']();

      expect((createObjectURL.mock.calls[0][0] as Blob).type).toBe('audio/webm');
    });

    it('does nothing without a waveform container', () => {
      component.waveformContainer = undefined;
      priv['audioChunks'] = [new Blob([new Uint8Array(4)], { type: 'audio/webm' })];

      priv['initWaveSurferPreview']();

      expect(waveSurferCreate).not.toHaveBeenCalled();
      expect(priv['waveSurfer']).toBeUndefined();
    });

    it('does not create a second instance when a preview already exists', () => {
      attachWaveformContainer();
      const existing = createFakeWaveSurfer();
      priv['waveSurfer'] = existing;
      priv['audioChunks'] = [new Blob([new Uint8Array(4)], { type: 'audio/webm' })];

      priv['initWaveSurferPreview']();

      expect(waveSurferCreate).not.toHaveBeenCalled();
      expect(priv['waveSurfer']).toBe(existing);
    });

    it('does not create a preview for an empty recording', () => {
      attachWaveformContainer();
      priv['audioChunks'] = [];

      priv['initWaveSurferPreview']();

      expect(createObjectURL).not.toHaveBeenCalled();
      expect(waveSurferCreate).not.toHaveBeenCalled();
    });

    it('logs when the preview audio fails to load', async () => {
      attachWaveformContainer();
      const failing = createFakeWaveSurfer();
      const loadError = new Error('decode failed');
      failing.load.mockRejectedValue(loadError);
      waveSurferCreate.mockReturnValue(failing as any);
      priv['audioChunks'] = [new Blob([new Uint8Array(4)], { type: 'audio/webm' })];

      priv['initWaveSurferPreview']();
      await flushMicrotasks();

      expect(loggerError).toHaveBeenCalledWith(
        'CometChatMediaRecorder',
        'Failed to load preview audio:',
        loadError
      );
    });

    it('does not wire events when there is no preview instance', () => {
      attachWaveformContainer();
      priv['audioChunks'] = [new Blob([new Uint8Array(4)], { type: 'audio/webm' })];
      priv['initWaveSurferPreview']();
      const wave = priv['waveSurfer'] as FakeWaveSurfer;
      priv['waveSurfer'] = undefined;
      wave.on.mockClear();

      priv['wireWaveSurferEvents']();

      expect(wave.on).not.toHaveBeenCalled();
      expect(Object.keys(wave.handlers).sort()).toEqual([
        'finish',
        'pause',
        'play',
        'ready',
        'timeupdate',
      ]);
    });

    describe('wired events', () => {
      let wave: FakeWaveSurfer;

      beforeEach(() => {
        attachWaveformContainer();
        priv['audioChunks'] = [new Blob([new Uint8Array(4)], { type: 'audio/webm' })];
        priv['initWaveSurferPreview']();
        wave = priv['waveSurfer'] as FakeWaveSurfer;
      });

      it('stores the duration reported on ready', () => {
        wave.emit('ready', 8.5);

        expect(component.previewDuration).toBe(8.5);
      });

      it('tracks the playback position on timeupdate', () => {
        wave.emit('timeupdate', 3.25);

        expect(component.previewCurrentTime).toBe(3.25);
      });

      it('rewinds to the start on finish', () => {
        component.isPreviewPlaying = true;
        component.previewCurrentTime = 9;

        wave.emit('finish');

        expect(component.isPreviewPlaying).toBe(false);
        expect(component.previewCurrentTime).toBe(0);
        expect(wave.seekTo).toHaveBeenCalledWith(0);
      });

      it('survives a finish event that arrives after the preview was destroyed', () => {
        component.isPreviewPlaying = true;
        priv['waveSurfer'] = undefined;

        wave.emit('finish');

        expect(component.isPreviewPlaying).toBe(false);
        expect(wave.seekTo).not.toHaveBeenCalled();
      });

      it('mirrors the play and pause events onto isPreviewPlaying', () => {
        wave.emit('play');
        expect(component.isPreviewPlaying).toBe(true);

        wave.emit('pause');
        expect(component.isPreviewPlaying).toBe(false);
      });

      it('pauses a playing preview when the recording is stopped', () => {
        component.isPreviewPlaying = true;
        component.previewCurrentTime = 4;

        priv['stopPreviewPlayback']();

        expect(wave.pause).toHaveBeenCalledTimes(1);
        expect(component.isPreviewPlaying).toBe(false);
        expect(component.previewCurrentTime).toBe(0);
      });

      it('does not pause a preview that is not playing', () => {
        component.isPreviewPlaying = false;

        priv['stopPreviewPlayback']();

        expect(wave.pause).not.toHaveBeenCalled();
      });

      it('destroys the instance and clears the preview numbers', () => {
        component.previewDuration = 11;
        component.previewCurrentTime = 5;
        component.isPreviewPlaying = true;

        priv['destroyWaveSurfer']();

        expect(wave.destroy).toHaveBeenCalledTimes(1);
        expect(priv['waveSurfer']).toBeUndefined();
        expect(component.previewDuration).toBe(0);
        expect(component.previewCurrentTime).toBe(0);
        expect(component.isPreviewPlaying).toBe(false);
      });
    });

    it('ignores a toggle request after the preview was destroyed', () => {
      attachWaveformContainer();
      priv['audioChunks'] = [new Blob([new Uint8Array(4)], { type: 'audio/webm' })];
      priv['initWaveSurferPreview']();
      const wave = priv['waveSurfer'] as FakeWaveSurfer;
      priv['destroyWaveSurfer']();

      component.togglePreviewPlayback();

      expect(wave.playPause).not.toHaveBeenCalled();
      expect(component.isPreviewPlaying).toBe(false);
    });

    it('shows elapsed over total time once the preview has advanced', () => {
      component.counter = 95;
      component.previewCurrentTime = 12.8;
      component.isPreviewPlaying = true;

      expect(component.previewTimeDisplay).toBe('0:12 / 1:35');
    });

    it('shows only the recorded length while the preview is idle', () => {
      component.counter = 95;
      component.previewCurrentTime = 0;
      component.isPreviewPlaying = false;

      expect(component.previewTimeDisplay).toBe('1:35');
    });
  });

  // -------------------------------------------------------------------------
  // Timers
  // -------------------------------------------------------------------------
  describe('timers', () => {
    it('increments the counter once per second while recording', async () => {
      useClockFakes();

      await component.handleStartRecording();
      vi.advanceTimersByTime(3000);

      expect(component.counter).toBe(3);
      expect(component.formattedCounter).toBe('0:03');
    });

    it('announces the elapsed duration on the announcement interval', async () => {
      useClockFakes();

      await component.handleStartRecording();
      vi.advanceTimersByTime(10000);

      expect(announce).toHaveBeenCalledWith('10 seconds');
    });

    it('stops the counter but leaves the duration announcements running after stop', async () => {
      // Documents current behaviour, which looks like a defect: handleStopRecording
      // clears the counter interval but not the duration announcement interval, so a
      // screen reader keeps hearing the frozen elapsed time every 10s after Stop.
      // Only reset() and ngOnDestroy clear it.
      useClockFakes();
      await component.handleStartRecording();
      vi.advanceTimersByTime(1000);

      component.handleStopRecording();
      const announceCalls = announce.mock.calls.length;
      vi.advanceTimersByTime(30000);

      expect(component.counter).toBe(1);
      expect(priv['timerInterval']).toBeUndefined();
      expect(priv['durationAnnouncementInterval']).toBeDefined();
      expect(announce.mock.calls.length).toBe(announceCalls + 3);
      expect(announce).toHaveBeenLastCalledWith('1 second');
    });

    it('stops both intervals once the recorder is reset', async () => {
      useClockFakes();
      await component.handleStartRecording();
      vi.advanceTimersByTime(1000);

      component.handleCloseRecording();
      const announceCalls = announce.mock.calls.length;
      vi.advanceTimersByTime(30000);

      expect(priv['timerInterval']).toBeUndefined();
      expect(priv['durationAnnouncementInterval']).toBeUndefined();
      expect(announce).toHaveBeenCalledTimes(announceCalls);
      expect(component.counter).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // reset / close
  // -------------------------------------------------------------------------
  describe('reset and close', () => {
    it('clears every piece of recording state and emits closeRecording', async () => {
      await component.handleStartRecording();
      lastRecorder().emitData(new Blob([new Uint8Array(4)], { type: 'audio/webm' }));
      lastRecorder().stop();
      expect(component.mediaPreviewUrl).toBe('blob:fake/1');
      const closed: void[] = [];
      component.closeRecording.subscribe(() => closed.push(undefined));

      component.handleCloseRecording();

      expect(closed).toHaveLength(1);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake/1');
      expect(component.mediaPreviewUrl).toBeUndefined();
      expect(component.isRecording).toBe(false);
      expect(component.counter).toBe(0);
      expect(component.hasError).toBe(false);
      expect(priv['audioChunks']).toEqual([]);
      expect(priv['hasInitialized']).toBe(false);
      expect(component.mediaRecorder).toBeUndefined();
      expect(track.stop).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Permission monitoring
  // -------------------------------------------------------------------------
  describe('permission monitoring', () => {
    it('delegates checkMicrophonePermission to the Permissions API', async () => {
      permissionStatus.state = 'denied';

      await expect(component.checkMicrophonePermission()).resolves.toBe('denied');
      expect(permissionsQuery).toHaveBeenCalledWith({ name: 'microphone' });
    });

    it('tears the session down when the permission flips to denied', async () => {
      await component.handleStartRecording();
      const frameId = priv['animationFrameId'];
      const cancelledBefore = cancelledFrames.length;
      permissionStatus.state = 'denied';

      permissionStatus.onchange!();

      expect(component.permissionState).toBe('denied');
      expect(component.hasError).toBe(true);
      expect(component.isRecording).toBe(false);
      expect(component.isPaused).toBe(false);
      expect(track.stop).toHaveBeenCalled();
      expect(priv['timerInterval']).toBeUndefined();
      expect(cancelledFrames.slice(cancelledBefore)).toContain(frameId);
    });

    it('clears the error flag when the permission flips to granted', () => {
      component.hasError = true;
      permissionStatus.state = 'granted';

      permissionStatus.onchange!();

      expect(component.permissionState).toBe('granted');
      expect(component.hasError).toBe(false);
    });

    it('leaves the error flag alone when the permission goes back to prompt', () => {
      component.hasError = true;
      permissionStatus.state = 'prompt';

      permissionStatus.onchange!();

      expect(component.permissionState).toBe('prompt');
      expect(component.hasError).toBe(true);
    });

    it('logs instead of throwing when the Permissions API is unavailable', async () => {
      setPermissionsQuery(() => Promise.reject(new Error('unsupported')));

      const other = newFixture();
      other.detectChanges();
      await flushMicrotasks();

      expect(loggerError).toHaveBeenCalledWith(
        'CometChatMediaRecorder',
        'Permission monitoring setup failed:',
        expect.any(Error)
      );
      expect(other.componentInstance.hasError).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------
  describe('lifecycle', () => {
    it('starts recording shortly after init when autoRecording is set', async () => {
      useClockFakes();

      const auto = newFixture();
      auto.componentInstance.autoRecording = true;
      auto.detectChanges();

      expect(auto.componentInstance.isRecording).toBe(false);

      await vi.advanceTimersByTimeAsync(100);

      expect(auto.componentInstance.isRecording).toBe(true);
      expect(recorders).toHaveLength(1);
    });

    it('drops the pending auto-start timer on destroy', async () => {
      useClockFakes();
      const auto = newFixture();
      auto.componentInstance.autoRecording = true;
      auto.detectChanges();

      auto.destroy();
      await vi.advanceTimersByTimeAsync(100);

      expect(recorders).toHaveLength(0);
      expect(auto.componentInstance.isRecording).toBe(false);
    });

    it('releases the stream, the intervals and the audio graph on destroy', async () => {
      await component.handleStartRecording();
      const context = lastAudioContext!;

      fixture.destroy();

      expect(lastRecorder().state).toBe('inactive');
      expect(track.stop).toHaveBeenCalled();
      expect(priv['timerInterval']).toBeUndefined();
      expect(priv['durationAnnouncementInterval']).toBeUndefined();
      expect(context.close).toHaveBeenCalledTimes(1);
      expect(priv['pendingTimers']).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Keyboard dispatch
  // -------------------------------------------------------------------------
  describe('keyboard dispatch', () => {
    function keyEvent(key: string): KeyboardEvent {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      vi.spyOn(event, 'preventDefault');
      vi.spyOn(event, 'stopPropagation');
      return event;
    }

    it('routes the preview action to the preview instance', () => {
      attachWaveformContainer();
      priv['audioChunks'] = [new Blob([new Uint8Array(4)], { type: 'audio/webm' })];
      priv['initWaveSurferPreview']();
      const wave = priv['waveSurfer'] as FakeWaveSurfer;
      const event = keyEvent(' ');

      component.handleKeydown(event, 'preview');

      expect(wave.playPause).toHaveBeenCalledTimes(1);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('routes the stop action through handleStopRecording', async () => {
      await component.handleStartRecording();

      component.handleKeydown(keyEvent('Enter'), 'stop');

      expect(component.isRecording).toBe(false);
      expect(lastRecorder().state).toBe('inactive');
    });

    it('ignores keys other than Enter and Space', async () => {
      await component.handleStartRecording();
      const event = keyEvent('Tab');

      component.handleKeydown(event, 'stop');

      expect(component.isRecording).toBe(true);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('closes the recorder on Escape', () => {
      const closed: void[] = [];
      component.closeRecording.subscribe(() => closed.push(undefined));
      const event = keyEvent('Escape');

      component.handleEscapeKey(event);

      expect(closed).toHaveLength(1);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('routes the start action through handleStartRecording', async () => {
      component.handleKeydown(keyEvent(' '), 'start');
      await flushMicrotasks();

      expect(component.isRecording).toBe(true);
      expect(recorders).toHaveLength(1);
    });

    it('routes the pause action through handlePauseRecording', async () => {
      await component.handleStartRecording();

      component.handleKeydown(keyEvent('Enter'), 'pause');

      expect(component.isPaused).toBe(true);
      expect(lastRecorder().state).toBe('paused');
    });

    it('routes the close action through handleCloseRecording', () => {
      const closed: void[] = [];
      component.closeRecording.subscribe(() => closed.push(undefined));

      component.handleKeydown(keyEvent('Enter'), 'close');

      expect(closed).toHaveLength(1);
    });

    it('routes the submit action through handleSubmitRecording', () => {
      const blob = new Blob([new Uint8Array(7)], { type: 'audio/webm' });
      priv['recordedBlob'] = blob;
      const emitted: Blob[] = [];
      component.submitRecording.subscribe(b => emitted.push(b));

      component.handleKeydown(keyEvent(' '), 'submit');

      expect(emitted).toEqual([blob]);
    });

    it('ignores an unknown action', async () => {
      await component.handleStartRecording();

      component.handleKeydown(keyEvent('Enter'), 'rewind');

      expect(component.isRecording).toBe(true);
      expect(component.isPaused).toBe(false);
      expect(lastRecorder().state).toBe('recording');
    });
  });

  // -------------------------------------------------------------------------
  // Submit, display helpers and ARIA
  // -------------------------------------------------------------------------
  describe('submit and display helpers', () => {
    it('emits the recorded blob and resets on submit', () => {
      const blob = new Blob([new Uint8Array(4)], { type: 'audio/webm' });
      priv['recordedBlob'] = blob;
      component.counter = 30;
      component.mediaPreviewUrl = 'blob:fake/old';
      const emitted: Blob[] = [];
      component.submitRecording.subscribe(b => emitted.push(b));

      component.handleSubmitRecording();

      expect(emitted).toEqual([blob]);
      expect(component.counter).toBe(0);
      expect(priv['recordedBlob']).toBeUndefined();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake/old');
    });

    it('does not emit or reset when nothing was recorded', () => {
      component.counter = 30;
      const emitted: Blob[] = [];
      component.submitRecording.subscribe(b => emitted.push(b));

      component.handleSubmitRecording();

      expect(emitted).toEqual([]);
      expect(component.counter).toBe(30);
    });

    it('formats arbitrary second counts as MM:SS', () => {
      expect(component.formatTime(0)).toBe('0:00');
      expect(component.formatTime(9)).toBe('0:09');
      expect(component.formatTime(605)).toBe('10:05');
    });

    it('labels the record button as resume only while paused', () => {
      component.isPaused = true;
      expect(component.recordButtonAriaLabel).toBe('Resume recording');

      component.isPaused = false;
      expect(component.recordButtonAriaLabel).toBe('Start recording');
    });

    it('reports the record button pressed state as a string', () => {
      component.isRecording = true;
      expect(component.recordButtonAriaPressed).toBe('true');

      component.isRecording = false;
      expect(component.recordButtonAriaPressed).toBe('false');
    });

    it('reports the state text for error, paused, recording and idle', () => {
      component.hasError = true;
      component.isRecording = true;
      expect(component.recordingStateText).toBe('Microphone Access Needed');

      component.hasError = false;
      component.isPaused = true;
      expect(component.recordingStateText).toBe('Recording paused');

      component.isPaused = false;
      expect(component.recordingStateText).toBe('Recording');

      component.isRecording = false;
      expect(component.recordingStateText).toBe('');
    });

    it('spells the elapsed time out in words rather than as MM:SS', () => {
      component.counter = 65;

      expect(component.durationAriaLabel).toBe('1 minute 5 seconds');
      expect(component.formattedCounter).toBe('1:05');
    });
  });
});
