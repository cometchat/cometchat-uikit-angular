import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { WaveSurfer } from '../components/cometchat-audio-bubble/wavesurfer';

/**
 * Audio Attachment Data Structure
 *
 * Represents an audio attachment extracted from a CometChat.MediaMessage.
 * This interface normalizes the audio attachment data for consistent handling
 * across audio-related components.
 *
 * @remarks
 * Used by CometChatAudioBubbleComponent to process and display audio attachments
 * from messages. Includes audio-specific metadata like duration.
 *
 * @see Requirements 1.4
 */
export interface AudioAttachment {
  /** URL of the audio file */
  url: string;

  /** Display name of the audio file */
  name: string;

  /** File size in bytes */
  size: number;

  /** MIME type (e.g., 'audio/mpeg', 'audio/wav') */
  mimeType: string;

  /** File extension (e.g., 'mp3', 'wav') */
  extension: string;

  /** Duration in seconds (if available from metadata) */
  duration?: number;

  /** The original attachment object from CometChat SDK (optional) */
  raw?: CometChat.Attachment;
}

/**
 * Audio State Data Structure
 *
 * Tracks the state of an individual audio player instance.
 * Used internally by CometChatAudioBubbleComponent to manage
 * playback, loading, and download states for each audio attachment.
 *
 * @see Requirements 5.1, 5.2, 7.1, 13.1
 */
export interface AudioState {
  /** WaveSurfer instance for this audio */
  waveSurfer: WaveSurfer | null;

  /** Whether audio is currently playing */
  isPlaying: boolean;

  /** Whether audio is loading/decoding */
  isLoading: boolean;

  /** Whether audio failed to load */
  hasError: boolean;

  /** Current playback time in seconds */
  currentTime: number;

  /** Total duration in seconds */
  duration: number;

  /** Whether download is in progress */
  isDownloading: boolean;

  /** Download progress (0-100) */
  downloadProgress: number;

  /** AbortController for canceling downloads */
  abortController: AbortController | null;
}
