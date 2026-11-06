/**
 * CometChatAudioBubble — behavioural coverage suite.
 *
 * The sibling specs drive this component against a real SDK session and a real
 * WaveSurfer, so the interesting half of the component never runs: WaveSurfer
 * cannot decode audio under jsdom, so no `ready`/`play`/`finish` event ever
 * fires, `state.waveSurfer` stays null and every playback, keyboard and
 * download path exits at its first guard.
 *
 * This suite replaces the audio layer with a scriptable fake instead. The
 * WaveSurfer *factory*, the streaming download and the anchor-click download
 * trigger are the only things mocked — event wiring, attachment extraction and
 * every accessibility helper stay real, so the assertions below are about the
 * component's own state machine rather than about the mocks.
 *
 * Methods are called directly on the instance rather than through the rendered
 * template: the template is already exercised by the sibling specs, and
 * rendering it here would drag in child bubbles that have nothing to do with
 * the branches under test.
 *
 * @module components/cometchat-audio-bubble
 */

// The calls SDK pulls in JitsiMeetJS at module scope, which jsdom has no DOM for.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

const utilMocks = vi.hoisted(() => ({
  createWaveSurferInstance: vi.fn(),
  downloadAudioWithProgress: vi.fn(),
  triggerFileDownload: vi.fn(),
}));

// Only the three browser-bound helpers are swapped out. `attachWaveSurferEvents`,
// `extractAudioAttachments`, `hasAudioCaption` and the aria/announce helpers stay
// real so the wiring between them and the component is what gets tested.
vi.mock('./cometchat-audio-bubble.utils', async importOriginal => {
  const actual = await importOriginal<typeof import('./cometchat-audio-bubble.utils')>();
  return {
    ...actual,
    createWaveSurferInstance: utilMocks.createWaveSurferInstance,
    downloadAudioWithProgress: utilMocks.downloadAudioWithProgress,
    triggerFileDownload: utilMocks.triggerFileDownload,
  };
});

import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { MockInstance } from 'vitest';

import {
  CometChatAudioBubbleComponent,
  currentAudioPlayer,
  closeCurrentMediaPlayer,
} from './cometchat-audio-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { LiveAnnouncerService } from '../../services/live-announcer.service';
import { MediaControlsService } from '../../services/media-controls.service';
import { CometChatLogger } from '../../utils/CometChatLogger';
import type { AudioState } from '../../modals';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

/** A scriptable stand-in for WaveSurfer: records listeners so tests can fire them. */
interface FakeWaveSurfer {
  on: MockInstance;
  unAll: MockInstance;
  destroy: MockInstance;
  play: MockInstance;
  pause: MockInstance;
  stop: MockInstance;
  seekTo: MockInstance;
  getCurrentTime: MockInstance;
  load: MockInstance;
  /** Fires every listener registered for `event`. */
  emit(event: string, ...args: unknown[]): void;
}

function makeWaveSurfer(): FakeWaveSurfer {
  const handlers = new Map<string, Array<(...args: unknown[]) => void>>();
  return {
    on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      const list = handlers.get(event) ?? [];
      list.push(cb);
      handlers.set(event, list);
      return () => undefined;
    }),
    unAll: vi.fn(() => handlers.clear()),
    destroy: vi.fn(),
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    stop: vi.fn(),
    seekTo: vi.fn(),
    getCurrentTime: vi.fn(() => 0),
    load: vi.fn().mockResolvedValue(undefined),
    emit(event: string, ...args: unknown[]) {
      [...(handlers.get(event) ?? [])].forEach(cb => cb(...args));
    },
  } as unknown as FakeWaveSurfer;
}

function audioMessage(attachmentCount: number, caption = ''): any {
  const attachments = Array.from({ length: attachmentCount }, (_, i) => ({
    name: `audio-${i + 1}.mp3`,
    url: `https://example.test/audio-${i + 1}.mp3`,
    mimeType: 'audio/mpeg',
    extension: 'mp3',
    size: 2048 * (i + 1),
  }));
  return {
    getAttachments: () => attachments,
    getText: () => caption,
    getData: () => ({ text: caption }),
    getId: () => 7001,
    getType: () => 'audio',
  };
}

function keydown(key: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
}

/** Lets a chain of already-resolved promises settle without real timers. */
async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('CometChatAudioBubbleComponent — behavioural coverage', () => {
  let fixture: ComponentFixture<CometChatAudioBubbleComponent>;
  let component: CometChatAudioBubbleComponent;
  /** Private/protected member access — the convention in this repo. */
  let c: any;
  let announce: MockInstance;
  let logError: MockInstance;
  let logWarn: MockInstance;
  let mediaControls: MediaControlsService;

  /** Installs `count` waveform containers so `initializeWaveSurfer` can find one. */
  function stubContainers(count: number): HTMLDivElement[] {
    const divs = Array.from({ length: count }, () => document.createElement('div'));
    c.waveformContainers = { toArray: () => divs.map(nativeElement => ({ nativeElement })) };
    return divs;
  }

  /**
   * Runs `act` with `setTimeout` stubbed out and returns the callbacks it
   * scheduled, so a test can run deferred work synchronously.
   *
   * Letting a real timer elapse hands control back to Angular, which runs a
   * change-detection pass: that re-resolves the view queries (replacing the
   * stubbed collapse button and waveform containers) and fires
   * ngAfterViewInit, so the assertions would be measuring a second,
   * unrelated initialisation pass.
   */
  function captureScheduledWork(act: () => void): Array<() => void> {
    const scheduled: Array<() => void> = [];
    const timeout = vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: () => void) => {
      scheduled.push(fn);
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as unknown as typeof setTimeout);
    try {
      act();
    } finally {
      timeout.mockRestore();
    }
    return scheduled;
  }

  /** Puts a ready-to-play fake player into the state map at `index`. */
  function primeReadyPlayer(index: number, patch: Partial<AudioState> = {}): FakeWaveSurfer {
    const ws = makeWaveSurfer();
    const state: AudioState = c.getAudioState(index);
    state.waveSurfer = ws as any;
    state.isLoading = false;
    state.duration = 30;
    Object.assign(state, patch);
    return ws;
  }

  beforeEach(async () => {
    currentAudioPlayer.instance = null;
    currentAudioPlayer.setIsPlaying = null;

    utilMocks.createWaveSurferInstance.mockReset().mockImplementation(() => makeWaveSurfer());
    utilMocks.downloadAudioWithProgress.mockReset().mockResolvedValue(new Blob(['audio']));
    utilMocks.triggerFileDownload.mockReset().mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [CometChatAudioBubbleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatAudioBubbleComponent);
    component = fixture.componentInstance;
    c = component as any;

    mediaControls = TestBed.inject(MediaControlsService);
    announce = vi
      .spyOn(TestBed.inject(LiveAnnouncerService), 'announce')
      .mockImplementation(() => undefined);
    logError = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
    logWarn = vi.spyOn(CometChatLogger, 'warn').mockImplementation(() => undefined);

    component.message = audioMessage(3);
    component.ngOnInit();
  });

  afterEach(() => {
    // The fixture owns pending timers; leaking it across tests re-runs handlers
    // and drifts the shared `currentAudioPlayer` singleton.
    fixture?.destroy();
    currentAudioPlayer.instance = null;
    currentAudioPlayer.setIsPlaying = null;
    announce.mockRestore();
    logError.mockRestore();
    logWarn.mockRestore();
  });

  // -------------------------------------------------------------------------
  // closeCurrentMediaPlayer — the cross-bubble singleton
  // -------------------------------------------------------------------------
  describe('closeCurrentMediaPlayer', () => {
    it('leaves a registered callback in place when nothing is playing', () => {
      const setIsPlaying = vi.fn();
      currentAudioPlayer.instance = null;
      currentAudioPlayer.setIsPlaying = setIsPlaying;

      closeCurrentMediaPlayer();

      expect(setIsPlaying).not.toHaveBeenCalled();
      expect(currentAudioPlayer.setIsPlaying).toBe(setIsPlaying);
    });

    it('pauses the active player and notifies it by default', () => {
      const ws = makeWaveSurfer();
      const setIsPlaying = vi.fn();
      currentAudioPlayer.instance = ws as any;
      currentAudioPlayer.setIsPlaying = setIsPlaying;

      closeCurrentMediaPlayer();

      expect(ws.pause).toHaveBeenCalledTimes(1);
      expect(setIsPlaying).toHaveBeenCalledWith(false);
      expect(currentAudioPlayer.instance).toBeNull();
      expect(currentAudioPlayer.setIsPlaying).toBeNull();
    });

    it('pauses silently when emitEvent is false', () => {
      const ws = makeWaveSurfer();
      const setIsPlaying = vi.fn();
      currentAudioPlayer.instance = ws as any;
      currentAudioPlayer.setIsPlaying = setIsPlaying;

      closeCurrentMediaPlayer(false);

      expect(ws.pause).toHaveBeenCalledTimes(1);
      expect(setIsPlaying).not.toHaveBeenCalled();
      expect(currentAudioPlayer.instance).toBeNull();
    });

    it('still clears the singleton when no callback was registered', () => {
      const ws = makeWaveSurfer();
      currentAudioPlayer.instance = ws as any;
      currentAudioPlayer.setIsPlaying = null;

      closeCurrentMediaPlayer(true);

      expect(ws.pause).toHaveBeenCalledTimes(1);
      expect(currentAudioPlayer.instance).toBeNull();
      expect(currentAudioPlayer.setIsPlaying).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // ngOnChanges
  // -------------------------------------------------------------------------
  describe('ngOnChanges', () => {
    it('ignores change sets that touch neither message nor alignment', () => {
      const seeded: AudioState = c.getAudioState(0);
      seeded.duration = 42;
      const attachmentsBefore = c.attachments;

      component.ngOnChanges({ textFormatters: new SimpleChange(undefined, [], true) });

      expect(c.getAudioState(0)).toBe(seeded);
      expect(c.getAudioState(0).duration).toBe(42);
      expect(c.attachments).toBe(attachmentsBefore);
      expect(c.pendingTimers).toHaveLength(0);
    });

    it('processes the first message change without scheduling a deferred init', () => {
      const msg = audioMessage(2);
      component.message = msg;

      component.ngOnChanges({ message: new SimpleChange(undefined, msg, true) });

      expect(c.attachments).toHaveLength(2);
      expect(c.isExpanded).toBe(false);
      expect(c.pendingTimers).toHaveLength(0);
    });

    it('collapses and re-initialises the first player on a subsequent message change', () => {
      const previous = component.message;
      const msg = audioMessage(2);
      c.isExpanded = true;
      component.message = msg;
      stubContainers(2);

      const scheduled = captureScheduledWork(() =>
        component.ngOnChanges({ message: new SimpleChange(previous, msg, false) })
      );

      expect(c.isExpanded).toBe(false);
      expect(c.attachments).toHaveLength(2);
      expect(scheduled).toHaveLength(1);

      // The deferred work is the point of the timer: run it and prove the new
      // message got a player. Collapsing also means only the first one does.
      scheduled[0]();
      expect(utilMocks.createWaveSurferInstance).toHaveBeenCalledTimes(1);
      expect(c.getAudioState(0).waveSurfer).not.toBeNull();
      expect(c.audioStates.has(1)).toBe(false);
    });

    it('recomputes the outgoing flag when only alignment changes', () => {
      component.alignment = MessageBubbleAlignment.right;

      component.ngOnChanges({
        alignment: new SimpleChange(MessageBubbleAlignment.left, MessageBubbleAlignment.right, false),
      });

      expect(c.isOutgoing).toBe(true);
      expect(c.pendingTimers).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // Teardown / cleanup
  // -------------------------------------------------------------------------
  describe('cleanupWaveSurferInstances', () => {
    it('tears down its own players but leaves another bubble as the active one', () => {
      const foreign = makeWaveSurfer();
      const setIsPlaying = vi.fn();
      currentAudioPlayer.instance = foreign as any;
      currentAudioPlayer.setIsPlaying = setIsPlaying;

      const mine = primeReadyPlayer(0);
      const abort = new AbortController();
      c.getAudioState(0).abortController = abort;

      c.cleanupWaveSurferInstances();

      expect(currentAudioPlayer.instance).toBe(foreign);
      expect(currentAudioPlayer.setIsPlaying).toBe(setIsPlaying);
      expect(mine.unAll).toHaveBeenCalledTimes(1);
      expect(mine.destroy).toHaveBeenCalledTimes(1);
      expect(abort.signal.aborted).toBe(true);
      expect(c.audioStates.size).toBe(0);
    });

    it('releases the singleton when the active player is one of its own', () => {
      const mine = primeReadyPlayer(1);
      currentAudioPlayer.instance = mine as any;
      currentAudioPlayer.setIsPlaying = vi.fn();

      c.cleanupWaveSurferInstances();

      expect(currentAudioPlayer.instance).toBeNull();
      expect(currentAudioPlayer.setIsPlaying).toBeNull();
      expect(mine.destroy).toHaveBeenCalledTimes(1);
    });

    it('swallows a destroy() that throws and still clears the state map', () => {
      const ws = primeReadyPlayer(0);
      ws.destroy.mockImplementation(() => {
        throw new Error('already destroyed');
      });

      c.cleanupWaveSurferInstances();

      expect(ws.unAll).toHaveBeenCalledTimes(1);
      expect(c.audioStates.size).toBe(0);
    });

    it('clears pending timers on destroy so deferred inits never fire', () => {
      const clear = vi.spyOn(globalThis, 'clearTimeout');
      c.isExpanded = false;
      c.toggleExpanded();
      expect(c.pendingTimers).toHaveLength(1);

      component.ngOnDestroy();

      expect(clear).toHaveBeenCalled();
      expect(c.pendingTimers).toHaveLength(0);
      clear.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  // WaveSurfer construction
  // -------------------------------------------------------------------------
  describe('initializeWaveSurfer', () => {
    it('builds a player for the first attachment only while collapsed', () => {
      stubContainers(3);

      c.initializeAllWaveSurfers();

      expect(utilMocks.createWaveSurferInstance).toHaveBeenCalledTimes(1);
      expect(c.getAudioState(0).waveSurfer).not.toBeNull();
      expect(c.audioStates.has(1)).toBe(false);
    });

    it('builds a player for every attachment once expanded', () => {
      stubContainers(3);
      c.isExpanded = true;

      c.initializeAllWaveSurfers();

      expect(utilMocks.createWaveSurferInstance).toHaveBeenCalledTimes(3);
      const loaded = [0, 1, 2].map(i => {
        const ws = c.getAudioState(i).waveSurfer as unknown as FakeWaveSurfer;
        expect(ws).not.toBeNull();
        return ws.load.mock.calls[0][0];
      });
      expect(loaded).toEqual([
        'https://example.test/audio-1.mp3',
        'https://example.test/audio-2.mp3',
        'https://example.test/audio-3.mp3',
      ]);
    });

    it('does nothing when there are no attachments at all', () => {
      c.attachments = [];

      c.initializeAllWaveSurfers();

      expect(utilMocks.createWaveSurferInstance).not.toHaveBeenCalled();
    });

    it('skips an index that has no attachment', () => {
      stubContainers(3);

      c.initializeWaveSurfer(7);

      expect(utilMocks.createWaveSurferInstance).not.toHaveBeenCalled();
      expect(c.audioStates.has(7)).toBe(false);
    });

    it('skips an attachment whose url is empty', () => {
      stubContainers(1);
      c.attachments = [{ name: 'silent.mp3', url: '', mimeType: 'audio/mpeg', extension: 'mp3', size: 0 }];

      c.initializeWaveSurfer(0);

      expect(utilMocks.createWaveSurferInstance).not.toHaveBeenCalled();
      expect(c.audioStates.has(0)).toBe(false);
    });

    it('skips an index whose container has not been rendered yet', () => {
      stubContainers(1);

      c.initializeWaveSurfer(1);

      expect(utilMocks.createWaveSurferInstance).not.toHaveBeenCalled();
    });

    it('does not rebuild a player that already exists', () => {
      stubContainers(3);
      const existing = primeReadyPlayer(0);

      c.initializeWaveSurfer(0);

      expect(utilMocks.createWaveSurferInstance).not.toHaveBeenCalled();
      expect(c.getAudioState(0).waveSurfer).toBe(existing);
    });

    it('marks the state as errored when load() rejects', async () => {
      stubContainers(1);
      const ws = makeWaveSurfer();
      ws.load.mockRejectedValue(new Error('404'));
      utilMocks.createWaveSurferInstance.mockReturnValue(ws);

      c.initializeWaveSurfer(0);
      await flush();

      const state: AudioState = c.getAudioState(0);
      expect(state.hasError).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.waveSurfer).toBeNull();
      expect(logError).toHaveBeenCalledWith(
        'CometChatAudioBubble',
        'Failed to load audio at index 0:',
        expect.any(Error)
      );
    });

    it('resolves receiver colours from the document and forwards them to the factory', () => {
      stubContainers(1);

      c.initializeWaveSurfer(0);

      const [container, colors] = utilMocks.createWaveSurferInstance.mock.calls[0];
      expect(container).toBeInstanceOf(HTMLDivElement);
      // jsdom resolves no CSS custom properties, so the parseInt fallback applies.
      expect(colors.barRadius).toBe(1000);
      expect(c.getAudioState(0).isLoading).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // WaveSurfer event wiring
  // -------------------------------------------------------------------------
  describe('setupWaveSurferEvents', () => {
    let ws: FakeWaveSurfer;

    beforeEach(() => {
      ws = makeWaveSurfer();
      c.setupWaveSurferEvents(ws, 0);
    });

    it('clears the loading flag and records duration on ready', () => {
      expect(c.getAudioState(0).isLoading).toBe(true);

      ws.emit('ready', 97.5);

      const state: AudioState = c.getAudioState(0);
      expect(state.isLoading).toBe(false);
      expect(state.duration).toBe(97.5);
    });

    it('tracks playback position from audioprocess and timeupdate', () => {
      ws.emit('audioprocess', 3.25);
      expect(c.getAudioState(0).currentTime).toBe(3.25);

      ws.emit('timeupdate', 11);
      expect(c.getAudioState(0).currentTime).toBe(11);
    });

    it('reads the position straight off the player after a drag', () => {
      ws.getCurrentTime.mockReturnValue(18.5);

      ws.emit('dragend');

      expect(c.getAudioState(0).currentTime).toBe(18.5);
    });

    it('flips the playing flag on play and pause', () => {
      ws.emit('play');
      expect(c.getAudioState(0).isPlaying).toBe(true);

      ws.emit('pause');
      expect(c.getAudioState(0).isPlaying).toBe(false);
    });

    it('rewinds, announces and emits on finish, releasing the singleton it owns', () => {
      const state: AudioState = c.getAudioState(0);
      state.isPlaying = true;
      state.currentTime = 29;
      currentAudioPlayer.instance = ws as any;
      currentAudioPlayer.setIsPlaying = vi.fn();
      const emitted: Array<{ isPlaying: boolean; attachment: unknown }> = [];
      component.playStateChange.subscribe(e => emitted.push(e));

      ws.emit('finish');

      expect(ws.stop).toHaveBeenCalledTimes(1);
      expect(ws.seekTo).toHaveBeenCalledWith(0);
      expect(state.isPlaying).toBe(false);
      expect(state.currentTime).toBe(0);
      expect(currentAudioPlayer.instance).toBeNull();
      expect(currentAudioPlayer.setIsPlaying).toBeNull();
      expect(announce).toHaveBeenCalledWith(expect.any(String), 'polite');
      expect(emitted).toEqual([{ isPlaying: false, attachment: c.attachments[0] }]);
    });

    it('leaves a foreign singleton alone and emits nothing when the index has no attachment', () => {
      const foreign = makeWaveSurfer();
      currentAudioPlayer.instance = foreign as any;
      currentAudioPlayer.setIsPlaying = null;

      const orphan = makeWaveSurfer();
      c.setupWaveSurferEvents(orphan, 9);
      const emitted: unknown[] = [];
      component.playStateChange.subscribe(e => emitted.push(e));

      orphan.emit('finish');

      expect(currentAudioPlayer.instance).toBe(foreign);
      expect(orphan.stop).toHaveBeenCalledTimes(1);
      expect(emitted).toEqual([]);
      expect(c.getAudioState(9).currentTime).toBe(0);
    });

    it('routes a player error into the error state', () => {
      const failure = new Error('decode failed');

      ws.emit('error', failure);

      const state: AudioState = c.getAudioState(0);
      expect(state.hasError).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(logError).toHaveBeenCalledWith(
        'CometChatAudioBubble',
        'Failed to load audio at index 0:',
        failure
      );
    });
  });

  // -------------------------------------------------------------------------
  // Playback
  // -------------------------------------------------------------------------
  describe('onPlayPause', () => {
    it('does nothing before a player exists', () => {
      c.onPlayPause(0);

      expect(c.getAudioState(0).isPlaying).toBe(false);
      expect(currentAudioPlayer.instance).toBeNull();
    });

    it('does nothing while the player is still loading', () => {
      const ws = primeReadyPlayer(0, { isLoading: true });

      c.onPlayPause(0);

      expect(ws.play).not.toHaveBeenCalled();
      expect(ws.pause).not.toHaveBeenCalled();
    });

    it('does nothing when the index has a player but no attachment', () => {
      const ws = primeReadyPlayer(4);

      c.onPlayPause(4);

      expect(ws.play).not.toHaveBeenCalled();
      expect(ws.pause).not.toHaveBeenCalled();
      expect(c.getAudioState(4).isPlaying).toBe(false);
    });

    it('pauses and releases the singleton it owns', () => {
      const ws = primeReadyPlayer(0, { isPlaying: true });
      currentAudioPlayer.instance = ws as any;
      currentAudioPlayer.setIsPlaying = vi.fn();
      const emitted: Array<{ isPlaying: boolean }> = [];
      component.playStateChange.subscribe(e => emitted.push(e));

      c.onPlayPause(0);

      expect(ws.pause).toHaveBeenCalledTimes(1);
      expect(c.getAudioState(0).isPlaying).toBe(false);
      expect(currentAudioPlayer.instance).toBeNull();
      expect(currentAudioPlayer.setIsPlaying).toBeNull();
      expect(emitted).toEqual([{ isPlaying: false, attachment: c.attachments[0] }]);
    });

    it('pauses without disturbing a singleton owned by another player', () => {
      const foreign = makeWaveSurfer();
      const foreignCallback = vi.fn();
      currentAudioPlayer.instance = foreign as any;
      currentAudioPlayer.setIsPlaying = foreignCallback;
      const ws = primeReadyPlayer(0, { isPlaying: true });

      c.onPlayPause(0);

      expect(ws.pause).toHaveBeenCalledTimes(1);
      expect(currentAudioPlayer.instance).toBe(foreign);
      expect(currentAudioPlayer.setIsPlaying).toBe(foreignCallback);
      expect(foreign.pause).not.toHaveBeenCalled();
    });

    it('stops the other bubble, claims the singleton and exposes a working setter', async () => {
      const foreign = makeWaveSurfer();
      const foreignCallback = vi.fn();
      currentAudioPlayer.instance = foreign as any;
      currentAudioPlayer.setIsPlaying = foreignCallback;
      const ws = primeReadyPlayer(0);
      const emitted: Array<{ isPlaying: boolean }> = [];
      component.playStateChange.subscribe(e => emitted.push(e));

      c.onPlayPause(0);
      await flush();

      expect(foreign.pause).toHaveBeenCalledTimes(1);
      expect(foreignCallback).toHaveBeenCalledWith(false);
      expect(ws.play).toHaveBeenCalledTimes(1);
      expect(c.getAudioState(0).isPlaying).toBe(true);
      expect(currentAudioPlayer.instance).toBe(ws);
      expect(emitted).toEqual([{ isPlaying: true, attachment: c.attachments[0] }]);

      // The setter the bubble publishes is what another bubble calls to stop this one.
      currentAudioPlayer.setIsPlaying!(false);
      expect(c.getAudioState(0).isPlaying).toBe(false);
    });

    it('plays without touching the singleton when nothing else is playing', async () => {
      const ws = primeReadyPlayer(0);

      c.onPlayPause(0);
      await flush();

      expect(ws.play).toHaveBeenCalledTimes(1);
      expect(currentAudioPlayer.instance).toBe(ws);
      expect(c.getAudioState(0).isPlaying).toBe(true);
    });

    it('stays paused and logs when play() rejects', async () => {
      const ws = primeReadyPlayer(0);
      ws.play.mockRejectedValue(new Error('NotAllowedError'));
      const emitted: unknown[] = [];
      component.playStateChange.subscribe(e => emitted.push(e));

      c.onPlayPause(0);
      await flush();

      expect(c.getAudioState(0).isPlaying).toBe(false);
      expect(emitted).toEqual([]);
      expect(logError).toHaveBeenCalledWith(
        'CometChatAudioBubble',
        'Failed to play audio:',
        expect.any(Error)
      );
    });
  });

  // -------------------------------------------------------------------------
  // Download
  // -------------------------------------------------------------------------
  describe('onDownload', () => {
    it('reports progress, saves the blob and resets on success', async () => {
      let reportProgress!: (percent: number) => void;
      let settle!: (blob: Blob) => void;
      utilMocks.downloadAudioWithProgress.mockImplementation(
        (_url: string, onProgress: (percent: number) => void) => {
          reportProgress = onProgress;
          return new Promise<Blob>(resolve => {
            settle = resolve;
          });
        }
      );
      const started: unknown[] = [];
      const completed: unknown[] = [];
      component.downloadStart.subscribe(a => started.push(a));
      component.downloadComplete.subscribe(a => completed.push(a));

      c.onDownload(0);

      const state: AudioState = c.getAudioState(0);
      expect(state.isDownloading).toBe(true);
      expect(state.abortController).toBeInstanceOf(AbortController);
      expect(started).toEqual([c.attachments[0]]);
      expect(utilMocks.downloadAudioWithProgress.mock.calls[0][0]).toBe(
        'https://example.test/audio-1.mp3'
      );

      reportProgress(25);
      expect(state.downloadProgress).toBe(25);
      expect(c.getProgressDashArray(0)).toBe('15.7 62.8');

      const blob = new Blob(['audio-bytes']);
      settle(blob);
      await flush();

      expect(utilMocks.triggerFileDownload).toHaveBeenCalledWith(blob, 'audio-1.mp3');
      expect(state.isDownloading).toBe(false);
      expect(state.downloadProgress).toBe(0);
      expect(state.abortController).toBeNull();
      expect(completed).toEqual([c.attachments[0]]);
    });

    it('ignores an index with no attachment', () => {
      c.onDownload(9);

      expect(utilMocks.downloadAudioWithProgress).not.toHaveBeenCalled();
      expect(c.audioStates.has(9)).toBe(false);
    });

    it('ignores a second request while one is already in flight', async () => {
      utilMocks.downloadAudioWithProgress.mockImplementation(() => new Promise<Blob>(() => undefined));

      c.onDownload(0);
      c.onDownload(0);

      expect(utilMocks.downloadAudioWithProgress).toHaveBeenCalledTimes(1);
    });

    it('resets quietly when the download is aborted', async () => {
      const abortError = new Error('aborted');
      abortError.name = 'AbortError';
      utilMocks.downloadAudioWithProgress.mockRejectedValue(abortError);
      const errors: unknown[] = [];
      component.downloadError.subscribe(e => errors.push(e));

      c.onDownload(0);
      await flush();

      const state: AudioState = c.getAudioState(0);
      expect(state.isDownloading).toBe(false);
      expect(state.downloadProgress).toBe(0);
      expect(state.abortController).toBeNull();
      expect(errors).toEqual([]);
      expect(logError).not.toHaveBeenCalled();
    });

    it('emits downloadError and logs on a real failure', async () => {
      const failure = new Error('HTTP error! status: 403');
      utilMocks.downloadAudioWithProgress.mockRejectedValue(failure);
      const errors: Array<{ attachment: unknown; error: Error }> = [];
      component.downloadError.subscribe(e => errors.push(e));

      c.onDownload(0);
      await flush();

      const state: AudioState = c.getAudioState(0);
      expect(state.isDownloading).toBe(false);
      expect(state.abortController).toBeNull();
      expect(errors).toEqual([{ attachment: c.attachments[0], error: failure }]);
      expect(logError).toHaveBeenCalledWith(
        'CometChatAudioBubble',
        'Download failed for index 0:',
        failure
      );
    });

    it('resets state but emits nothing when the failing index has no attachment', () => {
      const failure = new Error('gone');
      const state: AudioState = c.getAudioState(6);
      state.isDownloading = true;
      state.downloadProgress = 70;
      const errors: unknown[] = [];
      component.downloadError.subscribe(e => errors.push(e));

      c.handleDownloadError(failure, 6);

      expect(state.isDownloading).toBe(false);
      expect(state.downloadProgress).toBe(0);
      expect(errors).toEqual([]);
      expect(logError).toHaveBeenCalledWith(
        'CometChatAudioBubble',
        'Download failed for index 6:',
        failure
      );
    });
  });

  describe('onCancelDownload', () => {
    it('aborts the in-flight request and clears the state', () => {
      utilMocks.downloadAudioWithProgress.mockImplementation(() => new Promise<Blob>(() => undefined));
      c.onDownload(0);
      const controller: AbortController = c.getAudioState(0).abortController;

      c.onCancelDownload(0);

      expect(controller.signal.aborted).toBe(true);
      expect(c.getAudioState(0).isDownloading).toBe(false);
      expect(c.getAudioState(0).abortController).toBeNull();
    });

    it('clears a stale downloading flag even with no controller to abort', () => {
      const state: AudioState = c.getAudioState(0);
      state.isDownloading = true;
      state.downloadProgress = 80;
      state.abortController = null;

      c.onCancelDownload(0);

      expect(state.isDownloading).toBe(false);
      expect(state.downloadProgress).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Expand / collapse
  // -------------------------------------------------------------------------
  describe('toggleExpanded', () => {
    /** Toggles, then runs the single callback the toggle defers to a timer. */
    function toggleAndRunDeferredWork(): void {
      const scheduled = captureScheduledWork(() => c.toggleExpanded());
      expect(scheduled).toHaveLength(1);
      scheduled[0]();
    }

    it('expands, builds the remaining players and moves focus to collapse', () => {
      stubContainers(3);
      const focus = vi.fn();
      c.collapseButton = { nativeElement: { focus } };
      const expands: boolean[] = [];
      component.expandChange.subscribe(v => expands.push(v));

      toggleAndRunDeferredWork();

      expect(c.isExpanded).toBe(true);
      expect(expands).toEqual([true]);
      expect(utilMocks.createWaveSurferInstance).toHaveBeenCalledTimes(2);
      expect(c.getAudioState(1).waveSurfer).not.toBeNull();
      expect(c.getAudioState(2).waveSurfer).not.toBeNull();
      expect(c.audioStates.has(0)).toBe(false);
      expect(focus).toHaveBeenCalledTimes(1);
    });

    it('collapses and returns focus to the expand indicator', () => {
      const focus = vi.fn();
      c.expandIndicator = { nativeElement: { focus } };
      c.isExpanded = true;
      const expands: boolean[] = [];
      component.expandChange.subscribe(v => expands.push(v));

      toggleAndRunDeferredWork();

      expect(c.isExpanded).toBe(false);
      expect(expands).toEqual([false]);
      expect(focus).toHaveBeenCalledTimes(1);
      expect(utilMocks.createWaveSurferInstance).not.toHaveBeenCalled();
    });

    it('tolerates a missing collapse button when expanding', () => {
      stubContainers(3);
      c.collapseButton = undefined;

      toggleAndRunDeferredWork();

      expect(c.isExpanded).toBe(true);
      expect(c.getAudioState(1).waveSurfer).not.toBeNull();
    });

    it('tolerates a missing expand indicator when collapsing', () => {
      c.isExpanded = true;
      c.expandIndicator = undefined;
      const expands: boolean[] = [];
      component.expandChange.subscribe(v => expands.push(v));

      // The deferred focus hand-off runs with no indicator to focus: the
      // optional chain must absorb it rather than throw inside the timer.
      expect(() => toggleAndRunDeferredWork()).not.toThrow();

      expect(c.isExpanded).toBe(false);
      expect(expands).toEqual([false]);
    });

    it('re-reads the expanded flag after emitting, so a listener that collapses mid-toggle gets no focus hand-off', () => {
      // `toggleExpanded` snapshots the old flag, negates the field, then emits
      // before testing both. The emit is synchronous, so a listener is the one
      // seam where the field can move again — and it is the only way the
      // snapshot and the field end up false together, which schedules neither
      // the expand-side nor the collapse-side focus hand-off.
      const collapseFocus = vi.fn();
      const indicatorFocus = vi.fn();
      c.collapseButton = { nativeElement: { focus: collapseFocus } };
      c.expandIndicator = { nativeElement: { focus: indicatorFocus } };
      component.expandChange.subscribe(() => {
        c.isExpanded = false;
      });

      const scheduled = captureScheduledWork(() => c.toggleExpanded());

      expect(c.isExpanded).toBe(false);
      expect(scheduled).toEqual([]);
      expect(c.pendingTimers).toEqual([]);
      expect(collapseFocus).not.toHaveBeenCalled();
      expect(indicatorFocus).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Keyboard media controls
  // -------------------------------------------------------------------------
  describe('onWaveformKeydown', () => {
    let handleKeyDown: MockInstance;

    beforeEach(() => {
      handleKeyDown = vi.spyOn(mediaControls, 'handleKeyDown');
    });

    afterEach(() => {
      handleKeyDown.mockRestore();
    });

    it('ignores keys before a player exists', () => {
      c.onWaveformKeydown(keydown('ArrowRight'), 0);

      expect(handleKeyDown).not.toHaveBeenCalled();
    });

    it('ignores keys while still loading', () => {
      primeReadyPlayer(0, { isLoading: true });

      c.onWaveformKeydown(keydown('ArrowRight'), 0);

      expect(handleKeyDown).not.toHaveBeenCalled();
    });

    it('ignores keys once the audio has errored', () => {
      primeReadyPlayer(0, { hasError: true });

      c.onWaveformKeydown(keydown('ArrowRight'), 0);

      expect(handleKeyDown).not.toHaveBeenCalled();
    });

    it('ignores keys while the duration is still unknown', () => {
      primeReadyPlayer(0, { duration: 0 });

      c.onWaveformKeydown(keydown('ArrowRight'), 0);

      expect(handleKeyDown).not.toHaveBeenCalled();
    });

    it('starts playback on Space when paused', async () => {
      const ws = primeReadyPlayer(0);

      c.onWaveformKeydown(keydown(' '), 0);
      await flush();

      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(ws.play).toHaveBeenCalledTimes(1);
      expect(c.getAudioState(0).isPlaying).toBe(true);
    });

    it('pauses on Space when playing', () => {
      const ws = primeReadyPlayer(0, { isPlaying: true });

      c.onWaveformKeydown(keydown(' '), 0);

      expect(ws.pause).toHaveBeenCalledTimes(1);
      expect(c.getAudioState(0).isPlaying).toBe(false);
    });

    it('seeks forward on ArrowRight and announces the new position', () => {
      const ws = primeReadyPlayer(0, { currentTime: 10 });

      c.onWaveformKeydown(keydown('ArrowRight'), 0);

      expect(ws.seekTo).toHaveBeenCalledWith(0.5);
      expect(c.getAudioState(0).currentTime).toBe(15);
      expect(announce).toHaveBeenCalledWith(
        mediaControls.formatTimeForAnnouncement(15),
        'polite'
      );
    });

    it('seeks backward on ArrowLeft, clamped at zero', () => {
      const ws = primeReadyPlayer(0, { currentTime: 2 });

      c.onWaveformKeydown(keydown('ArrowLeft'), 0);

      expect(ws.seekTo).toHaveBeenCalledWith(0);
      expect(c.getAudioState(0).currentTime).toBe(0);
    });

    it('does not seek when the resolved action carries no time', () => {
      const ws = primeReadyPlayer(0, { currentTime: 7 });
      handleKeyDown.mockReturnValue({ action: 'seek' });

      c.onWaveformKeydown(keydown('ArrowRight'), 0);

      expect(ws.seekTo).not.toHaveBeenCalled();
      expect(c.getAudioState(0).currentTime).toBe(7);
      expect(announce).not.toHaveBeenCalled();
    });

    it('jumps to the start on Home', () => {
      const ws = primeReadyPlayer(0, { currentTime: 22 });

      c.onWaveformKeydown(keydown('Home'), 0);

      expect(ws.seekTo).toHaveBeenCalledWith(0);
      expect(c.getAudioState(0).currentTime).toBe(0);
      expect(announce).toHaveBeenCalledWith(expect.any(String), 'polite');
    });

    it('jumps to the end on End', () => {
      const ws = primeReadyPlayer(0, { currentTime: 4 });

      c.onWaveformKeydown(keydown('End'), 0);

      expect(ws.seekTo).toHaveBeenCalledWith(1);
      expect(c.getAudioState(0).currentTime).toBe(30);
      expect(announce).toHaveBeenCalledWith(expect.any(String), 'polite');
    });

    it('leaves playback untouched for an unmapped key', () => {
      const ws = primeReadyPlayer(0, { currentTime: 9 });

      c.onWaveformKeydown(keydown('Tab'), 0);

      expect(ws.seekTo).not.toHaveBeenCalled();
      expect(ws.play).not.toHaveBeenCalled();
      expect(c.getAudioState(0).currentTime).toBe(9);
    });
  });

  // -------------------------------------------------------------------------
  // Button keyboard activation
  // -------------------------------------------------------------------------
  describe('button keyboard activation', () => {
    it('toggles playback from the play button on Enter', async () => {
      const ws = primeReadyPlayer(0);
      const event = keydown('Enter');
      const prevent = vi.spyOn(event, 'preventDefault');

      c.onPlayPauseKeydown(event, 0);
      await flush();

      expect(prevent).toHaveBeenCalledTimes(1);
      expect(ws.play).toHaveBeenCalledTimes(1);
    });

    it('starts a download from the download button on Space', () => {
      utilMocks.downloadAudioWithProgress.mockImplementation(() => new Promise<Blob>(() => undefined));
      const event = keydown(' ');
      const prevent = vi.spyOn(event, 'preventDefault');

      c.onDownloadKeydown(event, 0);

      expect(prevent).toHaveBeenCalledTimes(1);
      expect(c.getAudioState(0).isDownloading).toBe(true);
    });

    it('cancels a download from the cancel button on Enter', () => {
      utilMocks.downloadAudioWithProgress.mockImplementation(() => new Promise<Blob>(() => undefined));
      c.onDownload(0);
      const controller: AbortController = c.getAudioState(0).abortController;
      const event = keydown('Enter');
      const prevent = vi.spyOn(event, 'preventDefault');

      c.onCancelDownloadKeydown(event, 0);

      expect(prevent).toHaveBeenCalledTimes(1);
      expect(controller.signal.aborted).toBe(true);
      expect(c.getAudioState(0).isDownloading).toBe(false);
    });

    it('expands from the indicator on Space', () => {
      const event = keydown(' ');
      const prevent = vi.spyOn(event, 'preventDefault');

      c.onExpandCollapseKeydown(event);

      expect(prevent).toHaveBeenCalledTimes(1);
      expect(c.isExpanded).toBe(true);
    });

    it('leaves every keyboard-activated button alone for keys other than Space and Enter', () => {
      // All four handlers share one guard, so one pass over all of them is
      // what proves the guard — including the download button, which the
      // per-button tests never exercised on the negative path.
      const ws = primeReadyPlayer(0, { isDownloading: true });
      const state: AudioState = c.getAudioState(0);

      for (const key of ['a', 'Escape', 'ArrowDown', 'Tab']) {
        const event = keydown(key);
        const prevent = vi.spyOn(event, 'preventDefault');
        c.onPlayPauseKeydown(event, 0);
        c.onDownloadKeydown(event, 0);
        c.onCancelDownloadKeydown(event, 0);
        c.onExpandCollapseKeydown(event);
        expect(prevent, key).not.toHaveBeenCalled();
      }

      expect(ws.play).not.toHaveBeenCalled();
      expect(utilMocks.downloadAudioWithProgress).not.toHaveBeenCalled();
      expect(state.isDownloading).toBe(true);
      expect(c.isExpanded).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Template-facing helpers
  // -------------------------------------------------------------------------
  describe('template helpers', () => {
    it('creates a fresh default state the first time an index is read', () => {
      const state: AudioState = c.getAudioState(2);

      expect(state).toEqual({
        waveSurfer: null,
        isPlaying: false,
        isLoading: true,
        hasError: false,
        currentTime: 0,
        duration: 0,
        isDownloading: false,
        downloadProgress: 0,
        abortController: null,
      });
      expect(c.getAudioState(2)).toBe(state);
    });

    it('builds the region label from the resolved duration', () => {
      c.getAudioState(0).duration = 125;

      const label = c.getAudioRegionAriaLabel(0);

      expect(label).toContain(mediaControls.formatTimeForAnnouncement(125));
      expect(label).not.toContain('{duration}');
    });

    it('swaps the play/pause label with the playing state', () => {
      const paused = c.getPlayPauseAriaLabel(0);
      c.getAudioState(0).isPlaying = true;
      const playing = c.getPlayPauseAriaLabel(0);

      expect(paused).not.toBe(playing);
      // An unresolved localisation key would come back as the key itself.
      expect(paused).not.toBe('audio_bubble_play');
      expect(playing).not.toBe('audio_bubble_pause');
    });

    it('describes progress through the media controls service', () => {
      const state: AudioState = c.getAudioState(0);
      state.currentTime = 30;
      state.duration = 90;

      expect(c.getProgressValueText(0)).toBe(mediaControls.getProgressValueText(30, 90));
    });

    it('formats times and falls back to 0:00 for unusable values', () => {
      expect(c.formatTime(0)).toBe('0:00');
      expect(c.formatTime(-5)).toBe('0:00');
      expect(c.formatTime(Infinity)).toBe('0:00');
      expect(c.formatTime(9)).toBe('0:09');
      expect(c.formatTime(125)).toBe('2:05');
    });

    it('counts the hidden attachments and names them in the expand label', () => {
      expect(c.getRemainingAudiosCount()).toBe(2);
      expect(c.getExpandAriaLabel()).toContain('2');
      expect(c.getExpandAriaLabel()).not.toContain('{count}');
    });
  });

  // -------------------------------------------------------------------------
  // Message processing
  // -------------------------------------------------------------------------
  describe('processMessage', () => {
    it('warns and empties the bubble when the message is missing', () => {
      c.attachments = [{ name: 'a.mp3', url: 'x', mimeType: 'm', extension: 'mp3', size: 1 }];
      c.hasCaption = true;
      component.message = undefined as any;

      component.ngOnInit();

      expect(c.attachments).toEqual([]);
      expect(c.hasCaption).toBe(false);
      expect(logWarn).toHaveBeenCalledWith(
        'CometChatAudioBubble',
        'Message is null or undefined'
      );
    });

    it('detects a caption and marks right-aligned messages outgoing', () => {
      component.message = audioMessage(1, 'listen to this');
      component.alignment = MessageBubbleAlignment.right;

      component.ngOnInit();

      expect(c.hasCaption).toBe(true);
      expect(c.isOutgoing).toBe(true);
      expect(c.attachments[0].name).toBe('audio-1.mp3');
    });

    it('initialises the first player from ngAfterViewInit', () => {
      stubContainers(3);

      component.ngAfterViewInit();

      expect(utilMocks.createWaveSurferInstance).toHaveBeenCalledTimes(1);
      expect(c.getAudioState(0).waveSurfer).not.toBeNull();
    });
  });
});
