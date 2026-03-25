/**
 * CometChatCallBubble Component
 *
 * A standalone component for rendering call messages within the chat interface.
 * This component displays call information including call type (audio/video),
 * call status, duration, and an optional action button.
 *
 * Features:
 * - Call type icon display (audio/video, incoming/outgoing)
 * - Call title (Voice Call / Video Call)
 * - Call subtitle (duration or status)
 * - Optional action button (e.g., "Call Back")
 * - Sender/receiver styling variants
 * - Full accessibility support
 * - CSS variable-based theming
 *
 * @module components/cometchat-call-bubble
 * @see Requirements 10.1
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

/**
 * Possible call status values from CometChat.Call.getStatus().
 * Represents all possible states a call can be in.
 *
 * @see Requirements 1.4
 */
export type CallBubbleStatus =
  | 'initiated'
  | 'ongoing'
  | 'ended'
  | 'missed'
  | 'cancelled'
  | 'rejected'
  | 'busy'
  | 'unanswered';

/**
 * Event emitted when the action button is clicked.
 * Contains the session ID and the call message object for handling call-back
 * or other call-related actions.
 *
 * @see Requirements 12.2, 12.3
 */
export interface CallButtonClickEvent {
  /** The session ID of the call */
  sessionId: string;
  /** The call message object */
  message: CometChat.Call;
}

/**
 * CometChatCallBubble is a standalone Angular component that renders
 * call messages with sender/receiver styling variants.
 *
 * @example
 * ```html
 * <!-- Basic usage with call message -->
 * <cometchat-call-bubble [message]="callMessage"></cometchat-call-bubble>
 *
 * <!-- Sender variant -->
 * <cometchat-call-bubble
 *   [message]="callMessage"
 *   [alignment]="'right'">
 * </cometchat-call-bubble>
 *
 * <!-- With action button -->
 * <cometchat-call-bubble
 *   [message]="callMessage"
 *   [buttonText]="'Call Back'"
 *   (buttonClick)="onCallBack($event)">
 * </cometchat-call-bubble>
 * ```
 *
 * @see Requirements 10.1 - THE Call_Bubble SHALL be a standalone Angular component
 * @see Requirements 10.7 - THE Call_Bubble SHALL use OnPush change detection strategy
 */
@Component({
  selector: 'cometchat-call-bubble',
  standalone: true,
  templateUrl: './cometchat-call-bubble.component.html',
  styleUrls: ['./cometchat-call-bubble.component.css'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatCallBubbleComponent implements OnInit, OnChanges {
  // ============================================
  // Primary Inputs
  // ============================================

  /**
   * The CometChat.Call message object containing call information.
   * The component extracts call type, status, duration, and session ID from this object.
   *
   * @see Requirements 1.1
   */
  @Input() message!: CometChat.Call;

  /**
   * Determines sender (right) or receiver (left) styling.
   * 'right' applies primary color background with white text.
   * 'left' applies neutral background with neutral text.
   *
   * @see Requirements 1.2, 6.1
   */
  @Input() alignment: 'left' | 'right' = 'left';

  // ============================================
  // Optional Override Inputs
  // ============================================

  /**
   * Optional custom icon URL to override the default call type icon.
   *
   * @see Requirements 13.1
   */
  @Input() iconUrl?: string;

  /**
   * Optional custom title to override the default call type title.
   *
   * @see Requirements 13.2
   */
  @Input() title?: string;

  /**
   * Optional custom subtitle to override the default status/duration.
   *
   * @see Requirements 13.3
   */
  @Input() subtitle?: string;

  /**
   * Optional button text for the action button.
   * If provided and non-empty, the button will be displayed.
   *
   * @see Requirements 5.2, 13.4
   */
  @Input() buttonText?: string;

  /**
   * When true, disables all interactive elements (action button).
   * Used in thread header to prevent interaction with the parent message.
   * @default false
   */
  @Input() disableInteraction = false;

  // ============================================
  // Outputs
  // ============================================

  /**
   * Emitted when the action button is clicked.
   * Contains the session ID and the call message object.
   *
   * @see Requirements 5.11, 12.1, 12.2, 12.3
   */
  @Output() buttonClick = new EventEmitter<CallButtonClickEvent>();

  // ============================================
  // Computed State
  // ============================================

  /** The type of call: 'audio' or 'video' */
  protected callType: 'audio' | 'video' = 'audio';

  /** The status of the call */
  protected callStatus: CallBubbleStatus = 'ended';

  /** Whether the call is outgoing (sender) */
  protected isOutgoing = false;

  /** The session ID of the call */
  protected sessionId = '';

  /** The computed icon URL based on call type and direction */
  protected computedIconUrl = '';

  /** The computed title based on call type */
  protected computedTitle = '';

  /** The computed subtitle based on status/duration */
  protected computedSubtitle = '';

  /** Whether to show the action button */
  protected showButton = false;

  // ============================================
  // Lifecycle Hooks
  // ============================================

  ngOnInit(): void {
    this.processMessage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message'] || changes['alignment']) {
      this.processMessage();
    }
    // Handle changes to override inputs (iconUrl, title, subtitle)
    // Re-compute display values when these inputs change
    // @see Requirements 13.5, 13.6
    if (changes['iconUrl'] || changes['title'] || changes['subtitle']) {
      this.updateOverrideValues();
    }
    if (changes['buttonText']) {
      this.updateButtonVisibility();
    }
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Processes the message and computes display values.
   * Handles null/undefined message gracefully by setting fallback state.
   *
   * @see Requirements 1.8
   */
  private processMessage(): void {
    if (!this.message) {
      console.warn('[CometChatCallBubble] Message is null or undefined');
      this.setFallbackState();
      return;
    }

    try {
      this.extractCallData();
    } catch (error) {
      console.error('[CometChatCallBubble] Error processing message:', error);
      this.setFallbackState();
    }

    this.isOutgoing = this.alignment === 'right';
    this.updateButtonVisibility();
  }

  /**
   * Extracts call data from the message object with safe fallbacks.
   * Uses optional chaining to handle missing getter methods gracefully.
   *
   * @see Requirements 1.3, 1.4, 1.5, 1.6, 1.8
   */
  private extractCallData(): void {
    // Safe extraction with fallbacks for missing methods
    // Cast message to any to safely access methods that may not be in type definitions
    const callMessage = this.message as CometChat.Call & {
      getDuration?: () => number;
      getCustomData?: () => Record<string, any>;
    };

    // Extract call type: 'audio' or 'video'
    // For group meeting messages (CometChat.CustomMessage), getType() returns 'meeting'
    // and the actual call type is in customData.callType
    let rawType = callMessage.getType?.();
    if (rawType === 'meeting' && typeof callMessage.getCustomData === 'function') {
      const customData = callMessage.getCustomData();
      if (customData?.['callType']) {
        rawType = customData['callType'];
      }
    }
    this.callType = (rawType === 'video' ? 'video' : 'audio') as 'audio' | 'video';

    // Extract call status with fallback to 'ended'
    const rawStatus = callMessage.getStatus?.();
    this.callStatus = this.normalizeCallStatus(rawStatus);

    // Extract session ID — for meeting (CustomMessage) messages, the session ID
    // is stored in customData rather than on the message object itself
    if (rawType === 'meeting' && typeof callMessage.getCustomData === 'function') {
      const customData = callMessage.getCustomData();
      this.sessionId = customData?.['sessionID'] || customData?.['sessionId'] || '';
    }
    if (!this.sessionId) {
      this.sessionId = callMessage.getSessionId?.() || '';
    }

    // Extract duration for ended calls
    // Note: getDuration may not be available in all SDK versions
    const duration =
      typeof callMessage.getDuration === 'function' ? callMessage.getDuration() || 0 : 0;

    // Compute display values based on extracted data
    this.computeDisplayValues(duration);
  }

  /**
   * Normalizes the raw call status to a valid CallBubbleStatus value.
   * Handles various status formats and provides fallback for unknown statuses.
   *
   * @param rawStatus - The raw status value from the message
   * @returns A valid CallBubbleStatus value
   */
  private normalizeCallStatus(rawStatus: string | undefined | null): CallBubbleStatus {
    if (!rawStatus) {
      return 'ended';
    }

    const validStatuses: CallBubbleStatus[] = [
      'initiated',
      'ongoing',
      'ended',
      'missed',
      'cancelled',
      'rejected',
      'busy',
      'unanswered',
    ];

    const normalizedStatus = rawStatus.toLowerCase() as CallBubbleStatus;
    return validStatuses.includes(normalizedStatus) ? normalizedStatus : 'ended';
  }

  /**
   * Computes display values (icon URL, title, subtitle) based on extracted call data.
   * Uses custom input values if provided, otherwise derives from message data.
   *
   * @param duration - The call duration in seconds
   */
  private computeDisplayValues(duration: number): void {
    // Compute icon URL (use custom if provided, else derive from call data)
    this.computedIconUrl = this.iconUrl ?? this.getCallIconUrl();

    // Compute title (use custom if provided, else derive from call type)
    this.computedTitle = this.title ?? this.getCallTitle();

    // Compute subtitle (use custom if provided, else derive from status/duration)
    this.computedSubtitle = this.subtitle ?? this.getCallSubtitle(duration);
  }

  /**
   * Generates the call title based on call type.
   * Returns "Voice Call" for audio calls and "Video Call" for video calls.
   * Uses localization keys for internationalization support.
   *
   * @returns The localized call title string
   * @see Requirements 3.2, 3.3
   */
  private getCallTitle(): string {
    return this.callType === 'audio'
      ? CometChatLocalize.getLocalizedString('message_list_voice_call')
      : CometChatLocalize.getLocalizedString('message_list_video_call');
  }

  /**
   * Selects the appropriate icon URL based on call type, status, and direction.
   *
   * Icon selection logic:
   * - For incoming missed/unanswered/cancelled/rejected/busy calls: use incoming icon variant
   * - For outgoing calls or completed calls: use outgoing icon variant
   * - Audio calls use phone icons, video calls use video icons
   *
   * @returns The icon URL for the call type and direction
   * @see Requirements 2.2, 2.3, 2.4, 2.5
   */
  private getCallIconUrl(): string {
    // Statuses that indicate a missed/failed incoming call
    const missedStatuses: CallBubbleStatus[] = [
      'unanswered',
      'missed',
      'cancelled',
      'rejected',
      'busy',
    ];

    const isMissed = missedStatuses.includes(this.callStatus);

    // For incoming missed calls, use incoming icon variant
    if (isMissed && !this.isOutgoing) {
      return this.callType === 'audio'
        ? 'assets/conversations_incoming-voice-call.svg'
        : 'assets/conversations_incoming-video-call.svg';
    }

    // For outgoing calls or completed calls, use outgoing icon variant
    return this.callType === 'audio'
      ? 'assets/conversations_outgoing-voice-call.svg'
      : 'assets/conversations_outgoing-video-call.svg';
  }

  /**
   * Generates the call subtitle based on the message timestamp.
   * Shows the date and time when the call was made (e.g., "28 Feb, 01:15 PM").
   *
   * @param duration - The call duration in seconds (unused, kept for API compatibility)
   * @returns The formatted date/time string
   * @see Requirements 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 11.3
   */
  private getCallSubtitle(duration: number): string {
    // Get the message timestamp and format it as date/time
    const sentAt = this.message?.getSentAt?.();
    if (sentAt) {
      return this.formatCallDateTime(sentAt);
    }

    // Fallback to call status if no timestamp available
    return CometChatLocalize.getLocalizedString('message_list_ended_call');
  }

  /**
   * Formats the call timestamp as a readable date/time string.
   * Format: "DD MMM, hh:mm A" (e.g., "28 Feb, 01:15 PM")
   *
   * @param timestamp - Unix timestamp in seconds
   * @returns Formatted date/time string
   */
  private formatCallDateTime(timestamp: number): string {
    // Convert to milliseconds if needed (CometChat returns seconds)
    const timestampMs = timestamp > 9999999999 ? timestamp : timestamp * 1000;
    const date = new Date(timestampMs);

    // Format: "DD MMM, hh:mm A"
    const day = date.getDate();
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const month = monthNames[date.getMonth()];

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const hoursStr = hours.toString().padStart(2, '0');

    return `${day} ${month}, ${hoursStr}:${minutes} ${ampm}`;
  }

  /**
   * Formats call duration in human-readable format.
   *
   * Format rules:
   * - Duration < 1 hour: "M:SS" (e.g., "2:30", "45:09")
   * - Duration >= 1 hour: "H:MM:SS" (e.g., "1:02:30", "2:15:45")
   * - Invalid inputs (0, null, undefined, negative, NaN, Infinity): "0:00"
   *
   * @param durationInSeconds - Duration in seconds
   * @returns Formatted string (M:SS or H:MM:SS)
   * @see Requirements 11.1, 11.2, 11.4
   */
  private formatDuration(durationInSeconds: number): string {
    // Handle edge cases: null, undefined, negative, NaN, Infinity, or 0
    if (!durationInSeconds || durationInSeconds < 0 || !isFinite(durationInSeconds)) {
      return '0:00';
    }

    // Calculate hours, minutes, and seconds
    const totalSeconds = Math.floor(durationInSeconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Format based on whether duration is 1 hour or longer
    if (hours > 0) {
      // H:MM:SS format for durations >= 1 hour
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // M:SS format for durations < 1 hour
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Sets fallback state when message is invalid or processing fails.
   * Provides safe default values for all computed properties.
   * This ensures the component renders gracefully even with null/undefined/malformed input.
   *
   * @see Requirements 1.8
   */
  private setFallbackState(): void {
    this.callType = 'audio';
    this.callStatus = 'ended';
    this.sessionId = '';
    this.isOutgoing = this.alignment === 'right';
    // Use outgoing audio icon as default fallback
    this.computedIconUrl = 'assets/conversations_outgoing-voice-call.svg';
    // Use localized voice call title as fallback
    this.computedTitle = CometChatLocalize.getLocalizedString('message_list_voice_call');
    // Use localized "Call Ended" as fallback subtitle
    this.computedSubtitle = CometChatLocalize.getLocalizedString('message_list_ended_call');
    // Hide button in fallback state since we don't have valid session data
    this.showButton = false;
  }

  /**
   * Updates the button visibility based on buttonText.
   */
  private updateButtonVisibility(): void {
    this.showButton =
      this.buttonText !== undefined &&
      this.buttonText !== null &&
      this.buttonText.trim().length > 0;
  }

  /**
   * Updates computed values when override inputs (iconUrl, title, subtitle) change.
   * Uses custom input values if provided, otherwise derives from message data.
   *
   * @see Requirements 13.1, 13.2, 13.3, 13.5, 13.6
   */
  private updateOverrideValues(): void {
    // Only update if we have a valid message to derive fallback values from
    if (!this.message) {
      return;
    }

    // Extract duration for subtitle computation
    const callMessage = this.message as CometChat.Call & {
      getDuration?: () => number;
    };
    const duration =
      typeof callMessage.getDuration === 'function' ? callMessage.getDuration() || 0 : 0;

    // Update icon URL (use custom if provided, else derive from call data)
    this.computedIconUrl = this.iconUrl ?? this.getCallIconUrl();

    // Update title (use custom if provided, else derive from call type)
    this.computedTitle = this.title ?? this.getCallTitle();

    // Update subtitle (use custom if provided, else derive from status/duration)
    this.computedSubtitle = this.subtitle ?? this.getCallSubtitle(duration);
  }

  // ============================================
  // Event Handlers
  // ============================================

  /**
   * Handles the action button click.
   * Emits the buttonClick event with session ID and message.
   *
   * @see Requirements 5.11, 12.1, 12.2, 12.3
   */
  onButtonClick(): void {
    this.buttonClick.emit({
      sessionId: this.sessionId,
      message: this.message,
    });
  }

  // ============================================
  // Accessibility
  // ============================================

  /**
   * Returns the aria-label for the call bubble.
   *
   * @see Requirements 7.1
   */
  getAriaLabel(): string {
    return `${this.computedTitle} - ${this.computedSubtitle || this.callStatus}`;
  }
}
