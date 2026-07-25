/**
 * Utility helpers for CometChatFullScreenViewer component.
 * Contains file size formatting, filename generation, body scroll management,
 * and download helpers.
 */

import type { FullscreenViewerMediaType } from './cometchat-fullscreen-viewer.types';
import type { MediaAttachment } from '../../../modals/MediaAttachment';

// ── File Helpers ──────────────────────────────────────────────────────────

/**
 * Formats a file size in bytes to a human-readable string (e.g. "1.2 MB").
 */
export function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) { size /= 1024; unitIndex++; }
  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

/**
 * Extracts the uppercased file extension from a filename.
 */
export function getFileExtension(fileName: string | undefined): string {
  if (!fileName) return '';
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
}

/**
 * Generates a default filename with timestamp for a given media type.
 */
export function generateDefaultFilename(mediaType: string): string {
  const timestamp = Date.now();
  const extensions: Record<string, string> = { image: 'jpg', video: 'mp4', audio: 'mp3', file: 'bin' };
  return `download_${timestamp}.${extensions[mediaType] || 'bin'}`;
}

// ── Body Scroll ───────────────────────────────────────────────────────────

/**
 * Prevents body scroll by setting overflow to hidden.
 * Returns the original overflow value for later restoration.
 */
export function preventBodyScroll(): string {
  const original = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  return original;
}

/**
 * Restores the original body overflow value.
 */
export function restoreBodyScroll(originalOverflow: string): void {
  document.body.style.overflow = originalOverflow;
}

// ── Download ──────────────────────────────────────────────────────────────

/**
 * The viewer's download button. Re-exported from the shared implementation so every download
 * affordance in the kit behaves identically — see `utils/media-download.ts` for why a plain
 * anchor is not enough and why the fetch must stay a simple request.
 */
export { triggerMediaDownload } from '../../../utils/media-download';
export type { MediaDownloadOutcome } from '../../../utils/media-download';

/**
 * Resolves the media URL and filename for download in both gallery and single mode.
 */
export function resolveDownloadTarget(
  isGalleryMode: boolean,
  currentAttachment: MediaAttachment | null,
  url: string,
  fileName: string,
  mediaType: FullscreenViewerMediaType
): { mediaUrl: string; filename: string; currentMedia: MediaAttachment | string } | null {
  if (isGalleryMode && currentAttachment) {
    return {
      mediaUrl: currentAttachment.url,
      filename: currentAttachment.name || generateDefaultFilename(currentAttachment.type || 'image'),
      currentMedia: currentAttachment,
    };
  }
  if (url) {
    return {
      mediaUrl: url,
      filename: fileName || generateDefaultFilename(mediaType),
      currentMedia: url,
    };
  }
  return null;
}

// ── Aria Labels ───────────────────────────────────────────────────────────

import { getLocalizedString } from '../../../resources/CometChatLocalize/cometchat-localize';

/**
 * Gets the appropriate aria-label for the viewer based on media type.
 */
export function getViewerAriaLabel(mediaType: FullscreenViewerMediaType): string {
  switch (mediaType) {
    case 'video': return getLocalizedString('full_screen_viewer_video');
    case 'audio': return getLocalizedString('full_screen_viewer_audio');
    case 'file': return getLocalizedString('full_screen_viewer_file');
    default: return getLocalizedString('message_list_full_screen_viewer');
  }
}

/**
 * Gets the appropriate alt text for the media based on type and sender.
 */
export function getMediaAltText(
  mediaType: string | undefined,
  senderName: string,
  fileName: string
): string {
  const sender = senderName || getLocalizedString('unknown');
  if (mediaType === 'video') {
    return getLocalizedString('fullscreen_viewer_video_alt').replace('{sender}', sender);
  }
  if (mediaType === 'image') {
    return getLocalizedString('fullscreen_viewer_image_alt').replace('{sender}', sender);
  }
  return fileName || getLocalizedString('message_list_full_screen_viewer');
}

/**
 * Gets the gallery position announcement text.
 */
export function getGalleryPositionText(current: number, total: number): string {
  return (
    getLocalizedString('fullscreen_viewer_index')
      ?.replace('{current}', current.toString())
      ?.replace('{total}', total.toString()) ||
    `${current} of ${total}`
  );
}

// ── Picture-in-Picture ────────────────────────────────────────────────────

import { CometChatLogger } from '../../../utils/CometChatLogger';

/**
 * Waits for a video element to be ready to play (readyState >= 2).
 */
export async function waitForVideoReady(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= 2) return;
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
      reject(new Error('Video load timeout'));
    }, 5000);
    const onCanPlay = () => { clearTimeout(timeout); video.removeEventListener('canplay', onCanPlay); video.removeEventListener('error', onError); resolve(); };
    const onError = () => { clearTimeout(timeout); video.removeEventListener('canplay', onCanPlay); video.removeEventListener('error', onError); reject(new Error('Video load error')); };
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('error', onError);
    if (video.readyState === 0) { video.load(); }
  });
}

/**
 * Enters Picture-in-Picture mode for a video element.
 * Returns true on success, false on failure.
 */
export async function enterPip(video: HTMLVideoElement): Promise<boolean> {
  try {
    await waitForVideoReady(video);
    if (video.paused) { try { await video.play(); } catch { /* continue */ } }
    await new Promise(resolve => setTimeout(resolve, 100));
    await video.requestPictureInPicture();
    return true;
  } catch (error) {
    CometChatLogger.error('CometChatFullscreenViewer', 'Failed to enter PIP:', error);
    return false;
  }
}

/**
 * Exits Picture-in-Picture mode if currently active.
 */
export async function exitPip(): Promise<void> {
  if (!(document as any).pictureInPictureElement) return;
  try { await (document as any).exitPictureInPicture(); } catch (error) {
    CometChatLogger.error('CometChatFullscreenViewer', 'Failed to exit PIP:', error);
  }
}

// ── Legacy Image Download ─────────────────────────────────────────────────

/**
 * Downloads an image via XHR with retry logic (max 5 attempts for 403 errors).
 * Calls onSuccess with the object URL when done, or onFallback with the original URL on error.
 */
export function downloadImageWithRetry(
  imgUrl: string,
  onProgress: (percent: number) => void,
  onSuccess: (objectUrl: string) => void,
  onFallback: (url: string) => void,
  attemptCount = 0,
  maxAttempts = 5
): void {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', imgUrl, true);
  xhr.responseType = 'blob';
  xhr.onprogress = event => { if (event.lengthComputable) { onProgress((event.loaded / event.total) * 100); } };
  xhr.onload = () => {
    if (xhr.readyState !== 4) return;
    if (xhr.status === 200) {
      const objectUrl = URL.createObjectURL(xhr.response);
      const img = new Image();
      img.src = objectUrl;
      img.onload = () => onSuccess(objectUrl);
    } else if (xhr.status === 403 && attemptCount < maxAttempts) {
      setTimeout(() => downloadImageWithRetry(imgUrl, onProgress, onSuccess, onFallback, attemptCount + 1, maxAttempts), 800);
    } else { onFallback(imgUrl); }
  };
  xhr.onerror = () => onFallback(imgUrl);
  xhr.ontimeout = () => onFallback(imgUrl);
  xhr.send();
}
