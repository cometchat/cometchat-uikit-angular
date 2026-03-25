/**
 * CometChatPollBubble Public API
 *
 * Exports the CometChatPollBubble component and related interfaces for use in other modules.
 *
 * @module components/cometchat-poll-bubble
 * @see Requirements 11.1
 */

export { CometChatPollBubbleComponent } from './cometchat-poll-bubble.component';

// Poll data interfaces
export type {
  PollData,
  PollResults,
  PollOptionResult,
  VoterInfo,
  PollBubbleOption,
} from './cometchat-poll-bubble.component';

// Event interfaces
export type { PollVoteEvent, PollVoteErrorEvent } from './cometchat-poll-bubble.component';
