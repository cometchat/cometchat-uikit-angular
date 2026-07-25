/**
 * Utility helpers for CometChatAudioBubble component.
 * Contains WaveSurfer configuration helpers and accessibility helpers.
 */

import { WaveSurfer } from './wavesurfer';
import type { AudioAttachment } from '../../modals/AudioAttachment';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { MediaControlsService } from '../../services/media-controls.service';
import { LiveAnnouncerService } from '../../services/live-announcer.service';
import { CometChatLogger } from '../../utils/CometChatLogger';

// ── WaveSurfer Config ─────────────────────────────────────────────────────

/**
 * Resolved color configuration for WaveSurfer based on sender/receiver variant.
 */
export interface WaveSurferColors {
  progressColor: string;
  waveColor: string;
  barRadius: number;
}

/**
 * Reads CSS variables from the document root to resolve WaveSurfer colors.
 * @param isOutgoing - Whether the message is outgoing (sender)
 */
export function resolveWaveSurferColors(isOutgoing: boolean): WaveSurferColors {
  const root = document.documentElement;
  const progressColor = isOutgoing
    ? getComputedStyle(root).getPropertyValue('--cometchat-static-white').trim()
    : getComputedStyle(root).getPropertyValue('--cometchat-primary-color').trim();
  const waveColor = isOutgoing
    ? getComputedStyle(root).getPropertyValue('--cometchat-neutral-color-500').trim()
    : getComputedStyle(root).getPropertyValue('--cometchat-extended-primary-color-300').trim();
  const barRadiusStr = getComputedStyle(root).getPropertyValue('--cometchat-radius-max').trim();
  const barRadius = parseInt(barRadiusStr.replace('px', ''), 10) || 1000;
  return { progressColor, waveColor, barRadius };
}

/**
 * Creates a WaveSurfer instance with standard audio bubble configuration.
 * @param container - The DOM element to render the waveform into
 * @param colors - Resolved color configuration
 */
export function createWaveSurferInstance(
  container: HTMLDivElement,
  colors: WaveSurferColors
): WaveSurfer {
  return WaveSurfer.create({
    container,
    height: 16,
    normalize: false,
    waveColor: colors.waveColor,
    progressColor: colors.progressColor,
    cursorWidth: 0,
    barWidth: 2,
    barGap: 3,
    barRadius: colors.barRadius,
    barHeight: 1.2,
    minPxPerSec: 26,
    fillParent: true,
    mediaControls: false,
    interact: true,
    dragToSeek: true,
    hideScrollbar: true,
    audioRate: 1,
    autoScroll: true,
    autoCenter: true,
    sampleRate: 17000,
    width: 140,
  });
}

// ── Download Helpers ──────────────────────────────────────────────────────

/**
 * Downloads an audio file with progress tracking via ReadableStream.
 * @param url - The URL of the audio file
 * @param onProgress - Callback for progress updates (0-100)
 * @param signal - Optional AbortSignal for cancellation
 */
export async function downloadAudioWithProgress(
  url: string,
  onProgress: (percent: number) => void,
  signal?: AbortSignal
): Promise<Blob> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  if (!response.body) {
    const blob = await response.blob();
    onProgress(100);
    return blob;
  }
  const reader = response.body.getReader();
  const contentLength = parseInt(response.headers.get('Content-Length') || '0', 10);
  let receivedLength = 0;
  const chunks: BlobPart[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    receivedLength += value.length;
    if (contentLength > 0) {
      onProgress(Math.floor((receivedLength / contentLength) * 100));
    } else {
      onProgress(Math.min(90, Math.floor(Math.log10(receivedLength + 1) * 20)));
    }
  }
  onProgress(100);
  const contentType = response.headers.get('Content-Type') || 'audio/mpeg';
  return new Blob(chunks, { type: contentType });
}

/**
 * Triggers a browser file download from a Blob.
 * @param blob - The file data
 * @param filename - The filename for the download
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename || 'audio.mp3';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Release the blob after the click has had a chance to start the download. Revoking synchronously
  // races the browser for anything large enough that the save doesn't begin within the same tick.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ── Accessibility Helpers ─────────────────────────────────────────────────

/**
 * Gets the ARIA label for the audio region, including duration.
 */
export function getAudioRegionAriaLabel(
  duration: number,
  mediaControlsService: MediaControlsService
): string {
  const durationText = mediaControlsService.formatTimeForAnnouncement(duration);
  return CometChatLocalize.getLocalizedString('audio_bubble_region').replace(
    '{duration}',
    durationText
  );
}

/**
 * Gets the ARIA label for the play/pause button based on current state.
 */
export function getPlayPauseAriaLabel(isPlaying: boolean): string {
  return isPlaying
    ? CometChatLocalize.getLocalizedString('audio_bubble_pause')
    : CometChatLocalize.getLocalizedString('audio_bubble_play');
}

/**
 * Announces the current seek position to screen readers.
 */
export function announceSeekPosition(
  time: number,
  mediaControlsService: MediaControlsService,
  liveAnnouncer: LiveAnnouncerService
): void {
  const formattedTime = mediaControlsService.formatTimeForAnnouncement(time);
  liveAnnouncer.announce(formattedTime, 'polite');
}

/**
 * Announces audio playback completion to screen readers.
 */
export function announcePlaybackComplete(liveAnnouncer: LiveAnnouncerService): void {
  liveAnnouncer.announce(
    CometChatLocalize.getLocalizedString('accessibility_audio_playback_complete'),
    'polite'
  );
}

/**
 * Announces seek to start position.
 */
export function announceSeekStart(liveAnnouncer: LiveAnnouncerService): void {
  liveAnnouncer.announce(
    CometChatLocalize.getLocalizedString('audio_bubble_seek_start'),
    'polite'
  );
}

/**
 * Announces seek to end position.
 */
export function announceSeekEnd(liveAnnouncer: LiveAnnouncerService): void {
  liveAnnouncer.announce(
    CometChatLocalize.getLocalizedString('audio_bubble_seek_end'),
    'polite'
  );
}

/**
 * Gets the SVG strokeDasharray value for download progress indicator.
 */
export function getProgressDashArray(downloadProgress: number): string {
  return `${downloadProgress * 0.628} 62.8`;
}

/**
 * Formats time in seconds to M:SS display format.
 */
export function formatAudioTime(timeInSeconds: number): string {
  if (!timeInSeconds || timeInSeconds < 0 || !isFinite(timeInSeconds)) return '0:00';
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

/**
 * Gets the ARIA label for the expand indicator button.
 */
export function getExpandAriaLabel(remainingCount: number): string {
  const template = CometChatLocalize.getLocalizedString('audio_bubble_show_more');
  return template.replace('{count}', remainingCount.toString());
}

// ── WaveSurfer Event Setup ────────────────────────────────────────────────

import type { AudioState } from '../../modals/AudioAttachment';

/**
 * Callbacks used by WaveSurfer event handlers to update component state.
 */
export interface WaveSurferEventCallbacks {
  onReady: (index: number, duration: number) => void;
  onTimeUpdate: (index: number, currentTime: number) => void;
  onFinish: (index: number) => void;
  onPlay: (index: number) => void;
  onPause: (index: number) => void;
  onError: (index: number, error: Error) => void;
}

/**
 * Attaches all standard WaveSurfer event listeners for an audio bubble.
 */
export function attachWaveSurferEvents(
  waveSurfer: WaveSurfer,
  index: number,
  callbacks: WaveSurferEventCallbacks
): void {
  waveSurfer.on('ready', (duration: number) => callbacks.onReady(index, duration));
  waveSurfer.on('audioprocess', (currentTime: number) => callbacks.onTimeUpdate(index, currentTime));
  waveSurfer.on('timeupdate', (currentTime: number) => callbacks.onTimeUpdate(index, currentTime));
  waveSurfer.on('dragend', () => callbacks.onTimeUpdate(index, waveSurfer.getCurrentTime()));
  waveSurfer.on('finish', () => callbacks.onFinish(index));
  waveSurfer.on('play', () => callbacks.onPlay(index));
  waveSurfer.on('pause', () => callbacks.onPause(index));
  waveSurfer.on('error', (error: Error) => callbacks.onError(index, error));
}

// ── Message Extraction Helpers ────────────────────────────────────────────

/**
 * Extracts audio attachments from a CometChat.MediaMessage.
 */
export function extractAudioAttachments(message: CometChat.MediaMessage): AudioAttachment[] {
  if (!message) return [];
  try {
    const rawAttachments = message.getAttachments?.();
    if (!rawAttachments || !Array.isArray(rawAttachments)) return [];
    const result: AudioAttachment[] = [];
    for (const attachment of rawAttachments) {
      if (!attachment || typeof attachment !== 'object') continue;
      const url = (attachment as any).url || (attachment as any).getUrl?.() || '';
      if (!url || typeof url !== 'string' || url.length === 0) continue;
      const name = (attachment as any).name || (attachment as any).getName?.() ||
        CometChatLocalize.getLocalizedString('audio_bubble_audio');
      const mimeType = (attachment as any).mimeType || (attachment as any).getMimeType?.() || 'audio/mpeg';
      const extension = (attachment as any).extension || (attachment as any).getExtension?.() || 'mp3';
      const size = (attachment as any).size || (attachment as any).getSize?.() || 0;
      result.push({
        name: typeof name === 'string' ? name : CometChatLocalize.getLocalizedString('audio_bubble_audio'),
        url,
        mimeType: typeof mimeType === 'string' ? mimeType : 'audio/mpeg',
        extension: typeof extension === 'string' ? extension : 'mp3',
        size: typeof size === 'number' ? size : 0,
      });
    }
    return result;
  } catch (error) {
    CometChatLogger.error('CometChatAudioBubble', 'Error extracting attachments:', error);
    return [];
  }
}

/**
 * Checks whether a CometChat.MediaMessage has caption text.
 */
export function hasAudioCaption(message: CometChat.MediaMessage): boolean {
  if (!message) return false;
  try {
    const textFromGetText = (message as any)?.getText?.();
    if (textFromGetText && typeof textFromGetText === 'string' && textFromGetText.trim().length > 0) return true;
    const data = (message as any)?.getData?.();
    if (data && typeof data === 'object') {
      const textFromData = data.text;
      if (textFromData && typeof textFromData === 'string' && textFromData.trim().length > 0) return true;
    }
    return false;
  } catch (error) {
    CometChatLogger.warn('CometChatAudioBubble', 'Error extracting caption:', error);
    return false;
  }
}
