/**
 * Utility functions for CometChatVideoBubble component.
 */

import { CometChatLogger } from '../../utils/CometChatLogger';

/**
 * Formats video duration in seconds to display format (M:SS or H:MM:SS).
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration string, e.g. "2:05" or "1:01:05"
 */
export function formatVideoDuration(seconds: number): string {
  if (!seconds || seconds < 0 || !isFinite(seconds)) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Cleans up Picture-in-Picture resources when the component is destroyed.
 *
 * @param isPipActive - Whether PIP mode is currently active
 * @param videoElement - The hidden PIP video element (or null)
 * @param pipEnterListener - The enterpictureinpicture event listener (or null)
 * @param pipLeaveListener - The leavepictureinpicture event listener (or null)
 */
export function cleanupPipResources(
  isPipActive: boolean,
  videoElement: HTMLVideoElement | null,
  pipEnterListener: (() => void) | null,
  pipLeaveListener: (() => void) | null
): void {
  if (isPipActive && (document as any).pictureInPictureElement) {
    try {
      (document as any).exitPictureInPicture();
    } catch (error) {
      CometChatLogger.warn('CometChatVideoBubble', 'Error exiting PIP on cleanup:', error);
    }
  }

  if (videoElement) {
    if (pipEnterListener) {
      videoElement.removeEventListener('enterpictureinpicture', pipEnterListener);
    }
    if (pipLeaveListener) {
      videoElement.removeEventListener('leavepictureinpicture', pipLeaveListener);
    }
  }
}
