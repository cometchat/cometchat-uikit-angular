import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ViewChild,
  ElementRef,
  OnInit,
  AfterViewInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectionStrategy,
  inject,
  booleanAttribute,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { OngoingCallService } from '../../services/ongoing-call.service';
import { CometChatCallEvents } from '../../events/CometChatCallEvents';
import { CallWorkflow } from '../../Enums/Enums';
import { CallAnnouncerService } from '../../services/call-announcer.service';
import { handleCallError } from '../../utils/call-error-handler';
import { CometChatUIKitCalls } from '../../CometChatCalls';

/**
 * CometChatOngoingCallComponent renders a full-screen container into which
 * the CometChat Calls SDK renders its call UI.
 *
 * This is a thin UI layer that delegates all business logic to `OngoingCallService`.
 * When a non-empty `sessionID` is provided, the component renders a full-screen
 * overlay div and invokes the service to start the call session.
 *
 * @example
 * ```html
 * <cometchat-ongoing-call
 *   [sessionID]="activeSessionId"
 *   [callWorkflow]="workflow"
 *   (callEnded)="onCallEnded()"
 *   (error)="onError($event)">
 * </cometchat-ongoing-call>
 * ```
 *

 */
@Component({
  selector: 'cometchat-ongoing-call',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cometchat-ongoing-call.component.html',
  styleUrls: ['./cometchat-ongoing-call.component.css'],
})
export class CometChatOngoingCallComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  /** @internal Timer references for cleanup */
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  // ==================== Service Injection ====================

  private ongoingCallService = inject(OngoingCallService);
  private callAnnouncer = inject(CallAnnouncerService);

  // ==================== Inputs ====================

  /** Session ID for the call. Required for the call to render. */
  @Input() sessionID = '';

  /** Custom call settings builder. Overrides the default builder when provided. */
  @Input() callSettingsBuilder: typeof CometChatUIKitCalls.CallSettingsBuilder = null;

  /** Call workflow type: defaultCalling or directCalling. */
  @Input() callWorkflow: CallWorkflow = CallWorkflow.defaultCalling;

  /** Whether this is an audio-only call. Passed to OngoingCallService for CallSettings. */
  @Input({ transform: booleanAttribute }) isAudioOnly = false;

  /** Error callback invoked for any error during call operations. */
  @Input() onError: ((error: CometChat.CometChatException) => void) | null = null;

  /** Custom template to replace the entire call screen container. */
  @Input() callScreenView: TemplateRef<any> | null = null;

  // ==================== Outputs ====================

  /** Emitted when the call ends (via listener onCallEnded or onCallEndButtonPressed). */
  @Output() callEnded = new EventEmitter<void>();

  /** Emitted on any error during call operations. */
  @Output() error = new EventEmitter<CometChat.CometChatException>();

  // ==================== ViewChild ====================

  /** Reference to the call screen container div for SDK rendering. */
  @ViewChild('callScreenFrame', { static: false }) callScreenFrame!: ElementRef<HTMLDivElement>;

  // ==================== Computed Getters ====================

  /**
   * Returns the template context for the `callScreenView` template override.
   * Provides the session ID and call workflow to custom templates.
   */
  get templateContext(): { $implicit: { sessionID: string; callWorkflow: CallWorkflow } } {
    return {
      $implicit: {
        sessionID: this.sessionID,
        callWorkflow: this.callWorkflow,
      },
    };
  }

  // ==================== Private State ====================

  /** Guard to prevent double-starting the call session. */
  private readonly destroyRef = inject(DestroyRef);
  private callSessionStarted = false;

  // ==================== Lifecycle ====================

  /**
   * Syncs component inputs to the service and subscribes to call-ended events.
   * Input values take priority over service state.
   *
   * @see Requirement 5.2 - Input values take priority over service state
   */
  ngOnInit(): void {
    this.syncInputsToService();

    CometChatCallEvents.ccCallEnded.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      // Announce call ended for screen readers
      this.callAnnouncer.announceCallEnded();
      this.callEnded.emit();
    });
  }

  /**
   * Once the view is initialized and the #callScreenFrame is available,
   * start the call if we already have a sessionID.
   *
   * This handles the case where the component is created by an @if block
   * with sessionID already set — ngOnChanges fires before the view renders,
   * so the ViewChild isn't available there on first creation.
   *
   * @see Requirement 5.3 - Start call when sessionID is set
   */
  ngAfterViewInit(): void {
    if (this.sessionID && this.callScreenFrame?.nativeElement && !this.callSessionStarted) {
      this.callSessionStarted = true;
      this.startCallSession();
    }
  }

  /**
   * Detects sessionID changes and starts the call when sessionID becomes non-empty.
   * Uses a guard to prevent double-starting when both ngOnChanges and ngAfterViewInit fire.
   *
   * @see Requirement 5.3 - Start call when sessionID changes to non-empty
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sessionID']) {
      this.syncInputsToService();

      // Reset the guard when sessionID changes to allow a new session to start
      if (!changes['sessionID'].firstChange) {
        this.callSessionStarted = false;
      }

      this.pendingTimers.push(setTimeout(() => {
        if (this.callScreenFrame?.nativeElement && this.sessionID && !this.callSessionStarted) {
          this.callSessionStarted = true;
          this.startCallSession();
        }
      }));
    }
  }

  /**
   * Cleans up the call session and unsubscribes from events on destroy.
   *
   * @see Requirement 6.1 - Call endSession() on destroy
   * @see Requirement 6.2 - Reset service state on destroy
   */
  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
    this.callSessionStarted = false;
    this.ongoingCallService.endSession();
  }

  // ==================== Private: Input Sync ====================

  /**
   * Syncs all component inputs to the OngoingCallService.
   * Called on init and when sessionID changes.
   */
  private syncInputsToService(): void {
    this.ongoingCallService.setSessionID(this.sessionID);
    this.ongoingCallService.setCallWorkflow(this.callWorkflow);
    this.ongoingCallService.setCallSettingsBuilder(this.callSettingsBuilder);
    this.ongoingCallService.setIsAudioOnly(this.isAudioOnly);
  }

  // ==================== Private: Call Session ====================

  /**
   * Starts the call session by delegating to the OngoingCallService.
   * Requires the callScreenFrame ViewChild to be available.
   */
  private startCallSession(): void {
    this.ongoingCallService
      .startCall(this.callScreenFrame.nativeElement, (err: CometChat.CometChatException) =>
        this.handleError(err)
      )
      .catch((err: unknown) => this.handleError(err));
  }

  // ==================== Private Helpers ====================

  /**
   * Handles keyboard events on the call container.
   * Prevents Escape from accidentally ending the call.
   *
   * @param event - The keyboard event
   */
  onKeyDown(event: KeyboardEvent): void {
    // Prevent Escape from ending call accidentally - let the SDK handle it
    if (event.key === 'Escape') {
      event.stopPropagation();
    }
  }

  /**
   * Handles errors by emitting the `error` output and invoking the `onError` callback.
   *
   * @param err - The error to handle
   * @see Requirement 7.2, 7.3 - Error handling
   */
  private handleError(err: unknown): void {
    handleCallError(err, 'ONGOING_CALL_ERROR', 'CometChatOngoingCall', this.error, this.onError);
  }
}
