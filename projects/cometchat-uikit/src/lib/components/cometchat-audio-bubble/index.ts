/**
 * CometChatAudioBubble Component
 *
 * Public API exports for the audio message bubble component.
 *
 * Related types (exported from modals):
 * - AudioAttachment: Interface for audio attachment data
 * - AudioState: Interface for audio player state
 *
 * @see Requirements 14.1, 14.2
 */

export {
  CometChatAudioBubbleComponent,
  currentAudioPlayer,
  closeCurrentMediaPlayer,
} from './cometchat-audio-bubble.component';
export type { AudioAttachment, AudioState } from '../../modals/AudioAttachment';
