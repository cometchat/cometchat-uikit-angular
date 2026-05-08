import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  ViewChild,
  ElementRef,
  HostBinding,
  booleanAttribute,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatListItemComponent } from '../base-elements/cometchat-list-item/cometchat-list-item.component';
import { CometChatAvatarComponent } from '../base-elements/cometchat-avatar/cometchat-avatar.component';
import { CometChatButtonComponent } from '../base-elements/cometchat-button/cometchat-button.component';
import { CometChatOngoingCallComponent } from '../cometchat-ongoing-call/cometchat-ongoing-call.component';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatErrorBoundaryComponent } from '../base-elements/cometchat-error-boundary/cometchat-error-boundary.component';
import { IncomingCallService } from '../../services/incoming-call.service';
import { CometChatCallEvents } from '../../events/CometChatCallEvents';
import { CallWorkflow } from '../../Enums/Enums';
import { CallAnnouncerService } from '../../services/call-announcer.service';
import { handleCallError } from '../../utils/call-error-handler';
import { DialogFocusManager } from '../../services/dialog-focus-manager.service';
import { GlobalConfig, COMETCHAT_GLOBAL_CONFIG } from '../../services/global-config.service';
import { IncomingCallTemplateContext } from './cometchat-incoming-call.types';

export type { IncomingCallTemplateContext };

/**
 * CometChatIncomingCallComponent displays an incoming call notification card
 * when a user receives a voice or video call.
 *
 * It renders a `CometChatListItem` with the caller's name, avatar, and call type,
 * along with Accept and Decline buttons. The component is a thin UI layer that
 * reads state from `IncomingCallService`, with component inputs taking priority
 * over service state.
 *
 * @example
 * ```html
 * <cometchat-incoming-call
 *   [call]="incomingCall"
 *   (callAccepted)="onCallAccepted($event)"
 *   (callDeclined)="onCallDeclined($event)">
 * </cometchat-incoming-call>
 * ```
 */
@Component({
  selector: 'cometchat-incoming-call',
  standalone: true,
  imports: [CommonModule, CometChatListItemComponent, CometChatAvatarComponent, CometChatButtonComponent, CometChatOngoingCallComponent, CometChatErrorBoundaryComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cometchat-incoming-call.component.html',
  styleUrls: ['./cometchat-incoming-call.component.css'],
})
export class CometChatIncomingCallComponent implements OnInit, OnDestroy, AfterViewInit {
  @HostBinding('class.cometchat-incoming-call--ongoing')
  get isOngoingCallActive(): boolean { return this.showOngoingCallScreen() && !!this.ongoingCallSessionId(); }

  private incomingCallService = inject(IncomingCallService);
  private callAnnouncer = inject(CallAnnouncerService);
  private dialogFocusManager = inject(DialogFocusManager);
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, { optional: true });

  private disableSoundForCallsExplicitlySet = signal(false);
  private customSoundForCallsExplicitlySet = signal(false);
  private _disableSoundForCalls = signal(false);
  private _customSoundForCalls = signal('');

  @ViewChild('dialogContainer') dialogContainer!: ElementRef<HTMLElement>;
  @ViewChild('acceptButton') acceptButton!: ElementRef<HTMLElement>;

  @Input() call: CometChat.Call | null = null;

  @Input({ transform: booleanAttribute })
  set disableSoundForCalls(value: boolean) { this._disableSoundForCalls.set(value); this.disableSoundForCallsExplicitlySet.set(true); }
  get disableSoundForCalls(): boolean { return this._disableSoundForCalls(); }

  @Input()
  set customSoundForCalls(value: string) { this._customSoundForCalls.set(value); this.customSoundForCallsExplicitlySet.set(true); }
  get customSoundForCalls(): string { return this._customSoundForCalls(); }

  @Input() onAccept: ((call: CometChat.Call) => void) | null = null;
  @Input() onDecline: ((call: CometChat.Call) => void) | null = null;
  @Input() onError: ((error: CometChat.CometChatException) => void) | null = null;

  @Input() itemView: TemplateRef<any> | null = null;
  @Input() titleView: TemplateRef<any> | null = null;
  @Input() subtitleView: TemplateRef<any> | null = null;
  @Input() leadingView: TemplateRef<any> | null = null;
  @Input() trailingView: TemplateRef<any> | null = null;
  @Input() acceptButtonView: TemplateRef<any> | null = null;
  @Input() declineButtonView: TemplateRef<any> | null = null;

  @Output() callAccepted = new EventEmitter<CometChat.Call>();
  @Output() callDeclined = new EventEmitter<CometChat.Call>();
  @Output() error = new EventEmitter<CometChat.CometChatException>();

  showOngoingCallScreen = signal<boolean>(false);
  ongoingCallSessionId = signal<string>('');

  private readonly destroyRef = inject(DestroyRef);
  readonly defaultCallingWorkflow = CallWorkflow.defaultCalling;
  private _incomingCallIsAudioOnly = signal<boolean>(false);
  get incomingCallIsAudioOnly(): boolean { return this._incomingCallIsAudioOnly(); }

  effectiveDisableSoundForCalls = computed(() => {
    if (this.disableSoundForCallsExplicitlySet()) return this._disableSoundForCalls();
    if (this.globalConfig?.disableSoundForCalls !== undefined) return this.globalConfig.disableSoundForCalls;
    return false;
  });

  effectiveCustomSoundForCalls = computed(() => {
    if (this.customSoundForCallsExplicitlySet()) return this._customSoundForCalls();
    if (this.globalConfig?.customSoundForCalls !== undefined) return this.globalConfig.customSoundForCalls;
    return '';
  });

  get effectiveCall(): CometChat.Call | null { return this.call ?? this.incomingCallService.incomingCall(); }
  get callerName(): string { const call = this.effectiveCall; if (!call) return ''; return call.getCallInitiator()?.getName?.() || ''; }
  get callerAvatar(): string { const call = this.effectiveCall; if (!call) return ''; return call.getCallInitiator()?.getAvatar?.() || ''; }

  get callTypeIconUrl(): string {
    const call = this.effectiveCall;
    if (!call) return '';
    const callType = call.getType?.() || '';
    return callType === 'video' ? 'assets/video_call.svg' : 'assets/call.svg';
  }

  /**
   * Returns the template context for custom template overrides.
   */
  get templateContext(): { $implicit: IncomingCallTemplateContext } {
    const call = this.effectiveCall;
    return {
      $implicit: {
        call: call!,
        callerName: this.callerName,
        callerAvatar: this.callerAvatar,
        callType: call?.getType?.() || '',
      },
    };
  }

  // ==================== Lifecycle ====================

  /**
   * Plays the incoming call ringtone when a call is set (if sound is not disabled).
   * Announces the incoming call for screen readers.
   *
   * @see Requirement 2.1 - Play ringtone when call is set
   * @see Requirement 2.3 - Skip when sound is disabled
   */
  ngOnInit(): void {
    const call = this.effectiveCall;
    if (call && !this.effectiveDisableSoundForCalls()) {
      try {
        this.incomingCallService.setDisableSoundForCalls(this.effectiveDisableSoundForCalls());
        this.incomingCallService.setCustomSoundForCalls(this.effectiveCustomSoundForCalls());
        this.incomingCallService.playIncomingSound();
      } catch (err: unknown) {
        this.handleError(err);
      }
    }

    // Announce incoming call for screen readers
    if (call) {
      const callType = call.getType?.() === 'video' ? 'video' : 'audio';
      this.callAnnouncer.announceIncomingCall(this.callerName, callType);
    }

    // Subscribe to call ended to hide ongoing call screen
    CometChatCallEvents.ccCallEnded.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.showOngoingCallScreen.set(false);
      this.ongoingCallSessionId.set('');
    });
  }

  /**
   * Sets up focus trap and initial focus after view is initialized.
   */
  ngAfterViewInit(): void {
    if (this.effectiveCall && this.dialogContainer?.nativeElement) {
      // Set up dialog focus management with Escape to decline
      this.dialogFocusManager.openDialog({
        container: this.dialogContainer.nativeElement,
        initialFocus: this.acceptButton?.nativeElement,
        labelledById: 'incoming-call-title',
        closeOnEscape: true,
        onEscape: () => this.onDeclineClick(),
      });
    }
  }

  /**
   * Pauses the ringtone and cleans up focus trap on component destruction.
   *
   * @see Requirement 2.4 - Pause ringtone on destroy
   */
  ngOnDestroy(): void {
    try {
      this.incomingCallService.stopIncomingSound();
    } catch (err: unknown) {
      this.handleError(err);
    }

    // Close dialog focus management
    if (this.dialogContainer?.nativeElement) {
      this.dialogFocusManager.closeDialog(this.dialogContainer.nativeElement);
    }
  }

  // ==================== Actions ====================

  /**
   * Handles the Accept button click.
   *
   * If an `onAccept` callback is provided, invokes it.
   * Otherwise, calls `incomingCallService.acceptCall()` (default SDK behavior).
   * Pauses the ringtone and emits `callAccepted`.
   *
   * @see Requirement 3.1 - Pause sound and emit callAccepted
   * @see Requirement 3.3 - Default accept via SDK
   * @see Requirement 3.4 - Error handling
   */
  async onAcceptClick(): Promise<void> {
    const call = this.effectiveCall;
    if (!call) return;

    try {
      this.incomingCallService.stopIncomingSound();

      // Capture call type before accepting — the incoming call state is
      // cleared after accept, so we must read it now.
      this._incomingCallIsAudioOnly.set(call.getType?.() === 'audio');

      if (this.onAccept) {
        this.onAccept(call);
      } else {
        await this.incomingCallService.acceptCall(call.getSessionId());
        // Show the ongoing call screen after successful accept
        this.ongoingCallSessionId.set(call.getSessionId());
        this.showOngoingCallScreen.set(true);
      }

      this.callAccepted.emit(call);
    } catch (err: unknown) {
      this.handleError(err);
    }
  }

  /**
   * Handles the Decline button click.
   *
   * If an `onDecline` callback is provided, invokes it.
   * Otherwise, calls `incomingCallService.declineCall()` (default SDK behavior).
   * Pauses the ringtone and emits `callDeclined`.
   *
   * @see Requirement 4.1 - Pause sound and emit callDeclined
   * @see Requirement 4.3 - Default decline via SDK
   * @see Requirement 4.4 - Error handling
   */
  async onDeclineClick(): Promise<void> {
    const call = this.effectiveCall;
    if (!call) return;

    try {
      this.incomingCallService.stopIncomingSound();

      if (this.onDecline) {
        this.onDecline(call);
      } else {
        await this.incomingCallService.declineCall(call.getSessionId());
      }

      this.callDeclined.emit(call);
    } catch (err: unknown) {
      this.handleError(err);
    }
  }

  // ==================== Private Helpers ====================

  /**
   * Handles errors by emitting the `error` output and invoking the `onError` callback.
   *
   * @param err - The error to handle
   * @see Requirement 9.1, 9.2, 9.3 - Error handling
   */
  private handleError(err: unknown): void {
    handleCallError(err, 'INCOMING_CALL_ERROR', 'CometChatIncomingCall', this.error, this.onError);
  }

  /** No-op retry handler — incoming calls are transient and cannot be retried. */
  handleRetryClick(): void {}
}
