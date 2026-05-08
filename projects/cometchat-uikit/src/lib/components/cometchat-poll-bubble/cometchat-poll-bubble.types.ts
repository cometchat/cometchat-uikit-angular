/**
 * Types, interfaces, and constants for CometChatPollBubble component.
 */
import { CometChat } from '@cometchat/chat-sdk-javascript';

// ============================================================================
// Constants
// ============================================================================

/**
 * Constants for accessing poll data from message metadata.
 * Poll data is stored at the path `@injected.extensions.polls`.
 */
export const POLLS_CONSTANTS = {
  INJECTED_KEY: '@injected',
  EXTENSION_KEY: 'extensions',
  POLLS_KEY: 'polls',
};

// ============================================================================
// Poll Data Interfaces
// ============================================================================

/** Voter information for a poll option. */
export interface VoterInfo {
  name: string;
  avatar?: string;
}

/** Vote result for a single poll option. */
export interface PollOptionResult {
  count: number;
  voters: Record<string, VoterInfo>;
}

/** Complete poll results including total votes and per-option results. */
export interface PollResults {
  total: number;
  options: Record<string, PollOptionResult>;
}

/** Complete poll data extracted from message metadata. */
export interface PollData {
  id: string | number;
  question: string;
  options: Record<string, string>;
  results: PollResults;
}

/** Processed poll option ready for display in the poll bubble. */
export interface PollBubbleOption {
  id: string;
  text: string;
  count: number;
  percent: string;
  selectedByLoggedInUser: boolean;
  voters: VoterInfo[];
}

// ============================================================================
// Event Interfaces
// ============================================================================

/** Event emitted when a vote is successfully submitted. */
export interface PollVoteEvent {
  pollId: string | number;
  optionId: string;
  optionText: string;
  message: CometChat.CustomMessage;
}

/** Event emitted when vote submission fails. */
export interface PollVoteErrorEvent {
  pollId: string | number;
  optionId: string;
  error: Error;
  message: CometChat.CustomMessage;
}
