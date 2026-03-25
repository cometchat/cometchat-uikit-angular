import { Injectable, inject } from '@angular/core';
import { LiveAnnouncerService } from './live-announcer.service';
import { CometChatLocalize } from '../resources/CometChatLocalize/cometchat-localize';

/**
 * Call type for announcements
 */
export type CallType = 'audio' | 'video';

/**
 * Call status for announcements
 */
export type CallStatus =
  | 'incoming'
  | 'outgoing'
  | 'connected'
  | 'ended'
  | 'declined'
  | 'canceled'
  | 'failed';

/**
 * CallAnnouncerService provides screen reader announcements for call events.
 *
 * Uses assertive announcements for time-sensitive call events to ensure
 * screen reader users are immediately notified of incoming calls,
 * call status changes, and call termination.
 *
 * @example
 * ```typescript
 * // In an incoming call component
 * private callAnnouncer = inject(CallAnnouncerService);
 *
 * ngOnInit(): void {
 *   this.callAnnouncer.announceIncomingCall(this.callerName, 'video');
 * }
 *
 * onCallAccepted(): void {
 *   this.callAnnouncer.announceCallConnected();
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class CallAnnouncerService {
  private liveAnnouncer = inject(LiveAnnouncerService);

  /**
   * Announces an incoming call (assertive - immediate).
   *
   * @param callerName - Name of the caller
   * @param callType - Type of call ('audio' or 'video')
   */
  announceIncomingCall(callerName: string, callType: CallType): void {
    const typeKey = callType === 'video' ? 'video' : 'voice';
    const typeLabel = CometChatLocalize.getLocalizedString(`accessibility_${typeKey}_call`);
    const message = CometChatLocalize.getLocalizedString('accessibility_incoming_call')
      .replace('{type}', typeLabel)
      .replace('{name}', callerName);

    this.liveAnnouncer.announce(message, 'assertive', 3000);
  }

  /**
   * Announces outgoing call initiation.
   *
   * @param receiverName - Name of the call recipient
   */
  announceOutgoingCall(receiverName: string): void {
    const message = CometChatLocalize.getLocalizedString('accessibility_calling').replace(
      '{name}',
      receiverName
    );

    this.liveAnnouncer.announce(message, 'assertive', 2000);
  }

  /**
   * Announces call connected.
   */
  announceCallConnected(): void {
    this.liveAnnouncer.announce(
      CometChatLocalize.getLocalizedString('accessibility_call_connected'),
      'assertive',
      2000
    );
  }

  /**
   * Announces call ended.
   */
  announceCallEnded(): void {
    this.liveAnnouncer.announce(
      CometChatLocalize.getLocalizedString('accessibility_call_ended'),
      'assertive',
      2000
    );
  }

  /**
   * Announces call declined.
   */
  announceCallDeclined(): void {
    this.liveAnnouncer.announce(
      CometChatLocalize.getLocalizedString('accessibility_call_declined'),
      'assertive',
      2000
    );
  }

  /**
   * Announces call canceled.
   */
  announceCallCanceled(): void {
    this.liveAnnouncer.announce(
      CometChatLocalize.getLocalizedString('accessibility_call_canceled'),
      'assertive',
      2000
    );
  }

  /**
   * Announces call failed with optional reason.
   *
   * @param reason - Optional reason for call failure
   */
  announceCallFailed(reason?: string): void {
    let message = CometChatLocalize.getLocalizedString('accessibility_call_failed');
    if (reason) {
      message += `: ${reason}`;
    }
    this.liveAnnouncer.announce(message, 'assertive', 3000);
  }

  /**
   * Announces call initiation (starting voice/video call).
   *
   * @param callType - Type of call being initiated
   */
  announceCallInitiation(callType: CallType): void {
    const typeKey = callType === 'video' ? 'video' : 'voice';
    const typeLabel = CometChatLocalize.getLocalizedString(`accessibility_${typeKey}_call`);
    const message = CometChatLocalize.getLocalizedString('accessibility_starting_call').replace(
      '{type}',
      typeLabel
    );

    this.liveAnnouncer.announce(message, 'polite', 2000);
  }
}
