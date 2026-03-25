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
  computed,
  signal,
  ViewChild,
  ElementRef,
  booleanAttribute,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatAvatarComponent } from '../base-elements/cometchat-avatar/cometchat-avatar.component';
import { CometChatButtonComponent } from '../base-elements/cometchat-button/cometchat-button.component';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { OutgoingCallService } from '../../services/outgoing-call.service';
import { CallAnnouncerService } from '../../services/call-announcer.service';
import { DialogFocusManager } from '../../services/dialog-focus-manager.service';
import { GlobalConfig, COMETCHAT_GLOBAL_CONFIG } from '../../services/global-config.service';
import { handleCallError } from '../../utils/call-error-handler';

/**
 * Template context passed to all template overrides.
 */
export interface OutgoingCallTemplateContext {
  call: CometChat.Call;
  receiverName: string;
  receiverAvatar: string;
}

/**
 * CometChatOutgoingCallComponent displays an outgoing call overlay
 * when a user initiates a voice or video call.
 *
 * It renders a card with the receiver's name, a "Calling..." subtitle,
 * the receiver's avatar, and a cancel button. The component is a thin UI
 * layer that reads state from `OutgoingCallService`, with component inputs
 * taking priority over service state.
 *
 * @example
 * ```html
 * <cometchat-outgoing-call
 *   [call]="outgoingCall"
 *   (callCanceled)="onCallCanceled()">
 * </cometchat-outgoing-call>
 * ```
 *

 */
@Component({
  selector: 'cometchat-outgoing-call',
  standalone: true,
  imports: [CommonModule, CometChatAvatarComponent, CometChatButtonComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cometchat-outgoing-call.component.html',
  styleUrls: ['./cometchat-outgoing-call.component.css'],
})
export class CometChatOutgoingCallComponent implements OnInit, OnDestroy, AfterViewInit {
  // ==================== Service Injection ====================

  private outgoingCallService = inject(OutgoingCallService);
  private callAnnouncer = inject(CallAnnouncerService);
  private dialogFocusManager = inject(DialogFocusManager);
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, {
    optional: true,
  });

  // ==================== ExplicitlySet Flags & Backing Fields (GlobalConfig Priority System) ====================
  private disableSoundForCallsExplicitlySet = signal(false);
  private customSoundForCallsExplicitlySet = signal(false);

  private _disableSoundForCalls = signal(false);
  private _customSoundForCalls = signal('');

  // ==================== View Children ====================

  /** Reference to the dialog container for focus management */
  @ViewChild('dialogContainer') dialogContainer!: ElementRef<HTMLElement>;

  /** Reference to the cancel button for initial focus */
  @ViewChild('cancelButton') cancelButton!: ElementRef<HTMLElement>;

  // ==================== Inputs ====================

  /** The outgoing call object. Overrides service state when provided. */
  @Input() call: CometChat.Call | null = null;

  /** Disables the outgoing call ringtone when true. */
  @Input({ transform: booleanAttribute })
  set disableSoundForCalls(value: boolean) {
    this._disableSoundForCalls.set(value);
    this.disableSoundForCallsExplicitlySet.set(true);
  }
  get disableSoundForCalls(): boolean {
    return this._disableSoundForCalls();
  }

  /** Custom sound URL for the outgoing call ringtone. */
  @Input()
  set customSoundForCalls(value: string) {
    this._customSoundForCalls.set(value);
    this.customSoundForCallsExplicitlySet.set(true);
  }
  get customSoundForCalls(): string {
    return this._customSoundForCalls();
  }

  /** Error callback invoked for any error during sound or cancel. */
  @Input() onError: ((error: CometChat.CometChatException) => void) | null = null;

  // ==================== Template Override Inputs ====================

  /** Replaces the default receiver name title. */
  @Input() titleView: TemplateRef<any> | null = null;

  /** Replaces the default "Calling..." subtitle. */
  @Input() subtitleView: TemplateRef<any> | null = null;

  /** Replaces the default CometChatAvatar. */
  @Input() avatarView: TemplateRef<any> | null = null;

  /** Replaces the default cancel button. */
  @Input() cancelButtonView: TemplateRef<any> | null = null;

  // ==================== Outputs ====================

  /** Emitted when the user cancels the outgoing call. */
  @Output() callCanceled = new EventEmitter<void>();

  /** Emitted on any error during sound playback or cancellation. */
  @Output() error = new EventEmitter<CometChat.CometChatException>();

  // ==================== Public Properties ====================

  /** Icon URL for the end-call button. */
  readonly endCallIconUrl = 'assets/call_end.svg';

  // ==================== Effective Values (GlobalConfig Priority System) ====================

  /**
   * Resolved disableSoundForCalls value using 3-tier priority:
   * 1. Explicitly set @Input value
   * 2. GlobalConfig value (if defined)
   * 3. Component default (false)
   */
  effectiveDisableSoundForCalls = computed(() => {
    if (this.disableSoundForCallsExplicitlySet()) return this._disableSoundForCalls();
    if (this.globalConfig?.disableSoundForCalls !== undefined)
      return this.globalConfig.disableSoundForCalls;
    return false;
  });

  /**
   * Resolved customSoundForCalls value using 3-tier priority:
   * 1. Explicitly set @Input value
   * 2. GlobalConfig value (if defined)
   * 3. Component default ('')
   */
  effectiveCustomSoundForCalls = computed(() => {
    if (this.customSoundForCallsExplicitlySet()) return this._customSoundForCalls();
    if (this.globalConfig?.customSoundForCalls !== undefined)
      return this.globalConfig.customSoundForCalls;
    return '';
  });

  // ==================== Computed Getters ====================

  /**
   * Returns the effective call object.
   * Component input takes priority over service state.
   *
   * @see Requirement 5.4 - Input priority over service state
   */
  get effectiveCall(): CometChat.Call | null {
    return this.call ?? this.outgoingCallService.activeCall();
  }

  /**
   * Returns the receiver's display name from the call object.
   * Handles both user and group receiver types.
   *
   * @see Requirement 1.2 - User receiver name
   * @see Requirement 1.3 - Group receiver name
   */
  get receiverName(): string {
    const call = this.effectiveCall;
    if (!call) return '';
    const receiver = call.getReceiver();
    return (receiver as any)?.getName?.() || '';
  }

  /**
   * Returns the receiver's avatar/icon URL from the call object.
   * Uses `getAvatar()` for user receivers and `getIcon()` for group receivers.
   *
   * @see Requirement 1.2 - User avatar
   * @see Requirement 1.3 - Group icon
   */
  get receiverAvatar(): string {
    const call = this.effectiveCall;
    if (!call) return '';
    const receiver = call.getReceiver();
    const receiverType = call.getReceiverType();

    if (receiverType === 'group') {
      return (receiver as CometChat.Group)?.getIcon?.() || '';
    }
    return (receiver as CometChat.User)?.getAvatar?.() || '';
  }

  /**
   * Returns the template context for custom template overrides.
   */
  get templateContext(): { $implicit: OutgoingCallTemplateContext } {
    const call = this.effectiveCall;
    return {
      $implicit: {
        call: call!,
        receiverName: this.receiverName,
        receiverAvatar: this.receiverAvatar,
      },
    };
  }

  // ==================== Lifecycle ====================

  /**
   * Plays the outgoing call ringtone when a call is set (if sound is not disabled).
   * Announces the outgoing call for screen readers.
   *
   * @see Requirement 2.1 - Play ringtone when call is set
   * @see Requirement 2.3 - Skip when sound is disabled
   */
  ngOnInit(): void {
    const call = this.effectiveCall;
    if (call && !this.effectiveDisableSoundForCalls()) {
      try {
        this.outgoingCallService.setDisableSoundForCalls(this.effectiveDisableSoundForCalls());
        this.outgoingCallService.setCustomSoundForCalls(this.effectiveCustomSoundForCalls());
        this.outgoingCallService.playOutgoingSound();
      } catch (err: unknown) {
        this.handleError(err);
      }
    }

    // Announce outgoing call for screen readers
    if (call) {
      this.callAnnouncer.announceOutgoingCall(this.receiverName);
    }
  }

  /**
   * Sets up focus trap and initial focus after view is initialized.
   */
  ngAfterViewInit(): void {
    if (this.effectiveCall && this.dialogContainer?.nativeElement) {
      // Set up dialog focus management with Escape to cancel
      this.dialogFocusManager.openDialog({
        container: this.dialogContainer.nativeElement,
        initialFocus: this.cancelButton?.nativeElement,
        labelledById: 'outgoing-call-title',
        closeOnEscape: true,
        onEscape: () => this.onCancelClick(),
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
      this.outgoingCallService.stopOutgoingSound();
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
   * Handles the cancel button click.
   * Pauses the ringtone and emits `callCanceled`.
   *
   * @see Requirement 3.1 - Pause sound and emit callCanceled
   * @see Requirement 3.3 - Error handling during cancel
   */
  onCancelClick(): void {
    try {
      this.outgoingCallService.stopOutgoingSound();
      this.callCanceled.emit();
    } catch (err: unknown) {
      this.handleError(err);
    }
  }

  // ==================== Private Helpers ====================

  /**
   * Handles errors by emitting the `error` output and invoking the `onError` callback.
   *
   * @param err - The error to handle
   * @see Requirement 8.1, 8.2, 8.3 - Error handling
   */
  private handleError(err: unknown): void {
    handleCallError(err, 'OUTGOING_CALL_ERROR', 'CometChatOutgoingCall', this.error, this.onError);
  }
}
