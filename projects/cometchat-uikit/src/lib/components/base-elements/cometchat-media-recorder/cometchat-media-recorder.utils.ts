/**
 * Utility functions for CometChatMediaRecorder component.
 */

/**
 * Formats a duration in seconds to MM:SS display string.
 */
export function formatRecordingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Checks the current microphone permission state.
 * Falls back to attempting getUserMedia if the Permissions API is unavailable.
 */
export async function checkMicrophonePermission(): Promise<PermissionState> {
  try {
    const permission = await navigator.permissions.query({
      name: 'microphone' as PermissionName,
    });
    return permission.state;
  } catch {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return 'granted';
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return 'denied';
      }
      return 'prompt';
    }
  }
}

/**
 * Starts a real-time waveform analysis loop using Web Audio API AnalyserNode.
 * Returns the animation frame ID so the caller can cancel it.
 *
 * @param analyser - The AnalyserNode to read frequency data from
 * @param barCount - Number of waveform bars to compute
 * @param isRecordingFn - Predicate returning whether recording is active
 * @param isPausedFn - Predicate returning whether recording is paused
 * @param onUpdate - Callback invoked with the new bar heights array on each frame
 * @returns The requestAnimationFrame ID (use cancelAnimationFrame to stop)
 */
export function startWaveformLoop(
  analyser: AnalyserNode,
  barCount: number,
  isRecordingFn: () => boolean,
  isPausedFn: () => boolean,
  onUpdate: (heights: number[]) => void
): number {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  const heights = new Array(barCount).fill(4);

  let frameId: number;

  const tick = () => {
    if (!isRecordingFn() || isPausedFn()) return;
    analyser.getByteFrequencyData(dataArray);
    const step = Math.max(1, Math.floor(bufferLength / barCount));
    for (let i = 0; i < barCount; i++) {
      const index = Math.min(i * step, bufferLength - 1);
      heights[i] = Math.max(4, Math.round((dataArray[index] / 255) * 24));
    }
    onUpdate([...heights]);
    frameId = requestAnimationFrame(tick);
  };

  frameId = requestAnimationFrame(tick);
  return frameId;
}

/**
 * WaveSurfer creation options derived from CSS variables.
 */
export function buildWaveSurferOptions(container: HTMLElement): Record<string, unknown> {
  const root = document.documentElement;
  const progressColor = getComputedStyle(root).getPropertyValue('--cometchat-primary-color').trim();
  const waveColor = getComputedStyle(root).getPropertyValue('--cometchat-icon-color-secondary').trim();
  const barRadiusStr = getComputedStyle(root).getPropertyValue('--cometchat-radius-max').trim();
  const barRadius = parseInt(barRadiusStr.replace('px', ''), 10) || 1000;

  return {
    container,
    height: 24,
    normalize: false,
    waveColor,
    progressColor,
    cursorWidth: 0,
    barWidth: 3,
    barGap: 2,
    barRadius,
    barHeight: 1.2,
    fillParent: true,
    mediaControls: false,
    interact: true,
    dragToSeek: true,
    hideScrollbar: true,
    audioRate: 1,
    sampleRate: 17000,
  };
}

/**
 * Wires up MediaRecorder event handlers.
 * Extracted to keep the component class lean.
 */
export function setupMediaRecorderHandlers(
  audioRecorder: MediaRecorder,
  stream: MediaStream,
  callbacks: {
    onDataAvailable: (chunk: Blob) => void;
    onStop: () => void;
    onError: (event: Event) => void;
    onTrackEnded: () => void;
  }
): void {
  audioRecorder.ondataavailable = (e: BlobEvent) => {
    if (e.data.size > 0) callbacks.onDataAvailable(e.data);
  };
  audioRecorder.onstop = callbacks.onStop;
  audioRecorder.onerror = callbacks.onError;
  stream.getTracks().forEach(track => {
    track.onended = callbacks.onTrackEnded;
  });
}

/**
 * Wires WaveSurfer event listeners, running callbacks inside NgZone.
 */
export function wireWaveSurferEvents(
  waveSurfer: any,
  ngZoneRun: (fn: () => void) => void,
  callbacks: {
    onReady: (duration: number) => void;
    onTimeUpdate: (currentTime: number) => void;
    onFinish: () => void;
    onPlay: () => void;
    onPause: () => void;
  }
): void {
  waveSurfer.on('ready', (d: number) => ngZoneRun(() => callbacks.onReady(d)));
  waveSurfer.on('timeupdate', (t: number) => ngZoneRun(() => callbacks.onTimeUpdate(t)));
  waveSurfer.on('finish', () => ngZoneRun(() => callbacks.onFinish()));
  waveSurfer.on('play', () => ngZoneRun(() => callbacks.onPlay()));
  waveSurfer.on('pause', () => ngZoneRun(() => callbacks.onPause()));
}
