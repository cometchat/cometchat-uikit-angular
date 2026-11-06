/**
 * cometchat-media-recorder.utils Tests
 *
 * Covers: formatRecordingTime, checkMicrophonePermission, startWaveformLoop,
 *         buildWaveSurferOptions, setupMediaRecorderHandlers, wireWaveSurferEvents.
 *
 * @module components/base-elements/cometchat-media-recorder/utils
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatRecordingTime,
  checkMicrophonePermission,
  startWaveformLoop,
  buildWaveSurferOptions,
  setupMediaRecorderHandlers,
  wireWaveSurferEvents,
} from './cometchat-media-recorder.utils';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// formatRecordingTime
// ---------------------------------------------------------------------------

describe('formatRecordingTime', () => {
  it.each([
    [0, '0:00'],
    [5, '0:05'],
    [9, '0:09'],
    [10, '0:10'],
    [59, '0:59'],
    [60, '1:00'],
    [61, '1:01'],
    [125, '2:05'],
    [600, '10:00'],
    [3599, '59:59'],
  ])('formats %i seconds as %s', (input, expected) => {
    expect(formatRecordingTime(input)).toBe(expected);
  });

  it('zero-pads only the seconds, never the minutes', () => {
    expect(formatRecordingTime(65)).toBe('1:05');
    expect(formatRecordingTime(605)).toBe('10:05');
  });

  it('keeps counting past an hour rather than rolling over', () => {
    expect(formatRecordingTime(3660)).toBe('61:00');
  });
});

// ---------------------------------------------------------------------------
// checkMicrophonePermission
// ---------------------------------------------------------------------------

describe('checkMicrophonePermission', () => {
  function stubPermissions(query: unknown) {
    vi.stubGlobal('navigator', {
      ...navigator,
      permissions: { query },
      mediaDevices: (navigator as Navigator).mediaDevices,
    });
  }

  function stubMediaDevices(getUserMedia: unknown) {
    vi.stubGlobal('navigator', {
      ...navigator,
      permissions: {
        query: vi.fn().mockRejectedValue(new Error('Permissions API unavailable')),
      },
      mediaDevices: { getUserMedia },
    });
  }

  it.each(['granted', 'denied', 'prompt'] as PermissionState[])(
    'returns "%s" straight from the Permissions API',
    async (state) => {
      stubPermissions(vi.fn().mockResolvedValue({ state }));
      await expect(checkMicrophonePermission()).resolves.toBe(state);
    }
  );

  it('queries specifically for the microphone', async () => {
    const query = vi.fn().mockResolvedValue({ state: 'granted' });
    stubPermissions(query);

    await checkMicrophonePermission();
    expect(query).toHaveBeenCalledWith({ name: 'microphone' });
  });

  describe('when the Permissions API is unavailable', () => {
    it('falls back to getUserMedia and reports granted on success', async () => {
      const stop = vi.fn();
      const getUserMedia = vi
        .fn()
        .mockResolvedValue({ getTracks: () => [{ stop }, { stop }] });
      stubMediaDevices(getUserMedia);

      await expect(checkMicrophonePermission()).resolves.toBe('granted');
      expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    });

    it('releases the probe stream so the mic indicator does not stay on', async () => {
      const stop = vi.fn();
      stubMediaDevices(
        vi.fn().mockResolvedValue({ getTracks: () => [{ stop }, { stop }] })
      );

      await checkMicrophonePermission();
      expect(stop).toHaveBeenCalledTimes(2);
    });

    it.each(['NotAllowedError', 'PermissionDeniedError'])(
      'reports denied for %s',
      async (name) => {
        stubMediaDevices(vi.fn().mockRejectedValue({ name }));
        await expect(checkMicrophonePermission()).resolves.toBe('denied');
      }
    );

    it('reports prompt for any other failure', async () => {
      stubMediaDevices(vi.fn().mockRejectedValue({ name: 'NotFoundError' }));
      await expect(checkMicrophonePermission()).resolves.toBe('prompt');
    });

    it('reports prompt when the rejection carries no name', async () => {
      stubMediaDevices(vi.fn().mockRejectedValue(new Error('boom')));
      await expect(checkMicrophonePermission()).resolves.toBe('prompt');
    });
  });
});

// ---------------------------------------------------------------------------
// startWaveformLoop
// ---------------------------------------------------------------------------

describe('startWaveformLoop', () => {
  /** Runs rAF callbacks synchronously, up to `maxFrames`, then stops. */
  function stubRaf(maxFrames: number) {
    let frames = 0;
    const raf = vi.fn((cb: FrameRequestCallback) => {
      if (frames++ < maxFrames) cb(0);
      return frames;
    });
    vi.stubGlobal('requestAnimationFrame', raf);
    return raf;
  }

  function makeAnalyser(values: number[]): AnalyserNode {
    return {
      frequencyBinCount: values.length,
      getByteFrequencyData: (arr: Uint8Array) => arr.set(values),
    } as unknown as AnalyserNode;
  }

  it('returns a frame id the caller can cancel', () => {
    stubRaf(0);
    const id = startWaveformLoop(makeAnalyser([0, 0, 0, 0]), 4, () => true, () => false, vi.fn());
    expect(typeof id).toBe('number');
  });

  it('emits one height per bar', () => {
    stubRaf(1);
    const onUpdate = vi.fn();
    startWaveformLoop(makeAnalyser([255, 255, 255, 255]), 4, () => true, () => false, onUpdate);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate.mock.calls[0][0]).toHaveLength(4);
  });

  it('scales a full-amplitude bin to the maximum bar height', () => {
    stubRaf(1);
    const onUpdate = vi.fn();
    startWaveformLoop(makeAnalyser([255, 255, 255, 255]), 4, () => true, () => false, onUpdate);
    expect(onUpdate.mock.calls[0][0]).toEqual([24, 24, 24, 24]);
  });

  it('floors silence at the minimum bar height rather than zero', () => {
    stubRaf(1);
    const onUpdate = vi.fn();
    startWaveformLoop(makeAnalyser([0, 0, 0, 0]), 4, () => true, () => false, onUpdate);
    expect(onUpdate.mock.calls[0][0]).toEqual([4, 4, 4, 4]);
  });

  it('emits a fresh array each frame so callers can retain them', () => {
    stubRaf(2);
    const onUpdate = vi.fn();
    startWaveformLoop(makeAnalyser([128, 128, 128, 128]), 4, () => true, () => false, onUpdate);

    expect(onUpdate).toHaveBeenCalledTimes(2);
    expect(onUpdate.mock.calls[0][0]).not.toBe(onUpdate.mock.calls[1][0]);
  });

  it('does not emit while paused', () => {
    stubRaf(3);
    const onUpdate = vi.fn();
    startWaveformLoop(makeAnalyser([255, 255]), 2, () => true, () => true, onUpdate);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('does not emit once recording has stopped', () => {
    stubRaf(3);
    const onUpdate = vi.fn();
    startWaveformLoop(makeAnalyser([255, 255]), 2, () => false, () => false, onUpdate);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('handles more bars than frequency bins without reading past the buffer', () => {
    stubRaf(1);
    const onUpdate = vi.fn();
    startWaveformLoop(makeAnalyser([255, 255]), 8, () => true, () => false, onUpdate);

    const heights = onUpdate.mock.calls[0][0];
    expect(heights).toHaveLength(8);
    expect(heights.every((h: number) => Number.isFinite(h))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildWaveSurferOptions
// ---------------------------------------------------------------------------

describe('buildWaveSurferOptions', () => {
  function stubTokens(tokens: Record<string, string>) {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (p: string) => tokens[p] ?? '',
    } as unknown as CSSStyleDeclaration);
  }

  it('passes the container straight through', () => {
    stubTokens({});
    const container = document.createElement('div');
    expect(buildWaveSurferOptions(container)['container']).toBe(container);
  });

  it('reads the wave and progress colours from design tokens', () => {
    stubTokens({
      '--cometchat-primary-color': ' #6852D6 ',
      '--cometchat-icon-color-secondary': ' #A1A1A1 ',
    });

    const opts = buildWaveSurferOptions(document.createElement('div'));
    expect(opts['progressColor']).toBe('#6852D6');
    expect(opts['waveColor']).toBe('#A1A1A1');
  });

  it('parses a px bar radius token', () => {
    stubTokens({ '--cometchat-radius-max': '12px' });
    expect(buildWaveSurferOptions(document.createElement('div'))['barRadius']).toBe(12);
  });

  it('falls back to 1000 when the radius token is missing', () => {
    stubTokens({});
    expect(buildWaveSurferOptions(document.createElement('div'))['barRadius']).toBe(1000);
  });

  it('falls back to 1000 when the radius token is not a number', () => {
    stubTokens({ '--cometchat-radius-max': 'max' });
    expect(buildWaveSurferOptions(document.createElement('div'))['barRadius']).toBe(1000);
  });

  it('keeps the recorder non-interactive chrome off', () => {
    stubTokens({});
    const opts = buildWaveSurferOptions(document.createElement('div'));
    expect(opts['cursorWidth']).toBe(0);
    expect(opts['mediaControls']).toBe(false);
    expect(opts['hideScrollbar']).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// setupMediaRecorderHandlers
// ---------------------------------------------------------------------------

describe('setupMediaRecorderHandlers', () => {
  function makeRecorder() {
    return {} as unknown as MediaRecorder & Record<string, unknown>;
  }

  function makeStream(trackCount = 1) {
    const tracks = Array.from({ length: trackCount }, () => ({}) as MediaStreamTrack);
    return { getTracks: () => tracks } as unknown as MediaStream;
  }

  function callbacks() {
    return {
      onDataAvailable: vi.fn(),
      onStop: vi.fn(),
      onError: vi.fn(),
      onTrackEnded: vi.fn(),
    };
  }

  it('forwards a non-empty data chunk', () => {
    const recorder = makeRecorder();
    const cbs = callbacks();
    setupMediaRecorderHandlers(recorder, makeStream(), cbs);

    const data = { size: 10 } as Blob;
    (recorder.ondataavailable as (e: BlobEvent) => void)({ data } as BlobEvent);
    expect(cbs.onDataAvailable).toHaveBeenCalledWith(data);
  });

  it('drops an empty data chunk', () => {
    const recorder = makeRecorder();
    const cbs = callbacks();
    setupMediaRecorderHandlers(recorder, makeStream(), cbs);

    (recorder.ondataavailable as (e: BlobEvent) => void)({
      data: { size: 0 } as Blob,
    } as BlobEvent);
    expect(cbs.onDataAvailable).not.toHaveBeenCalled();
  });

  it('wires stop and error straight through', () => {
    const recorder = makeRecorder();
    const cbs = callbacks();
    setupMediaRecorderHandlers(recorder, makeStream(), cbs);

    expect(recorder.onstop).toBe(cbs.onStop);
    expect(recorder.onerror).toBe(cbs.onError);
  });

  it('wires track-ended on every track', () => {
    const stream = makeStream(3);
    const cbs = callbacks();
    setupMediaRecorderHandlers(makeRecorder(), stream, cbs);

    stream.getTracks().forEach(t => {
      expect((t as unknown as Record<string, unknown>)['onended']).toBe(cbs.onTrackEnded);
    });
  });

  it('copes with a stream that has no tracks', () => {
    expect(() =>
      setupMediaRecorderHandlers(makeRecorder(), makeStream(0), callbacks())
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// wireWaveSurferEvents
// ---------------------------------------------------------------------------

describe('wireWaveSurferEvents', () => {
  function makeWaveSurfer() {
    const handlers: Record<string, (arg?: unknown) => void> = {};
    return {
      on: vi.fn((event: string, cb: (arg?: unknown) => void) => {
        handlers[event] = cb;
      }),
      emit: (event: string, arg?: unknown) => handlers[event]?.(arg),
      handlers,
    };
  }

  function callbacks() {
    return {
      onReady: vi.fn(),
      onTimeUpdate: vi.fn(),
      onFinish: vi.fn(),
      onPlay: vi.fn(),
      onPause: vi.fn(),
    };
  }

  it('subscribes to every playback event', () => {
    const ws = makeWaveSurfer();
    wireWaveSurferEvents(ws, fn => fn(), callbacks());

    expect(Object.keys(ws.handlers).sort()).toEqual(
      ['finish', 'pause', 'play', 'ready', 'timeupdate'].sort()
    );
  });

  it('forwards the duration from ready', () => {
    const ws = makeWaveSurfer();
    const cbs = callbacks();
    wireWaveSurferEvents(ws, fn => fn(), cbs);

    ws.emit('ready', 42);
    expect(cbs.onReady).toHaveBeenCalledWith(42);
  });

  it('forwards the current time from timeupdate', () => {
    const ws = makeWaveSurfer();
    const cbs = callbacks();
    wireWaveSurferEvents(ws, fn => fn(), cbs);

    ws.emit('timeupdate', 3.5);
    expect(cbs.onTimeUpdate).toHaveBeenCalledWith(3.5);
  });

  it.each(['finish', 'play', 'pause'])('forwards %s', (event) => {
    const ws = makeWaveSurfer();
    const cbs = callbacks();
    wireWaveSurferEvents(ws, fn => fn(), cbs);

    ws.emit(event);
    const spy = { finish: cbs.onFinish, play: cbs.onPlay, pause: cbs.onPause }[event]!;
    expect(spy).toHaveBeenCalled();
  });

  it('runs every callback through the supplied zone wrapper', () => {
    const ws = makeWaveSurfer();
    const ngZoneRun = vi.fn((fn: () => void) => fn());
    wireWaveSurferEvents(ws, ngZoneRun, callbacks());

    ws.emit('ready', 1);
    ws.emit('timeupdate', 2);
    ws.emit('finish');
    ws.emit('play');
    ws.emit('pause');

    expect(ngZoneRun).toHaveBeenCalledTimes(5);
  });

  it('does not invoke a callback when the zone wrapper withholds it', () => {
    const ws = makeWaveSurfer();
    const cbs = callbacks();
    wireWaveSurferEvents(ws, () => undefined, cbs);

    ws.emit('play');
    expect(cbs.onPlay).not.toHaveBeenCalled();
  });
});
