import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  booleanAttribute,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatButtonComponent } from '../base-elements/cometchat-button/cometchat-button.component';
import { CometChatOutgoingCallComponent } from '../cometchat-outgoing-call/cometchat-outgoing-call.component';
import { CometChatOngoingCallComponent } from '../cometchat-ongoing-call/cometchat-ongoing-call.component';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CallButtonsService } from '../../services/call-buttons.service';
import { CallAnnouncerService } from '../../services/call-announcer.service';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';
import { handleCallError } from '../../utils/call-error-handler';
import { CallWorkflow } from '../../Enums/Enums';
import { CometChatUIKitConstants } from '../../constants';
import { CometChatCalls } from '@cometchat/calls-sdk-javascript';
import { CometChatUIKitCalls } from '../../CometChatCalls';
import { CometChatUIKit } from '../../cometchat-uikit';

/**
 * CometChatCallButtonsComponent provides voice and video call initiation
 * buttons for both user-to-user and group calls.
 *
 * It is a thin UI layer that delegates call state management, call initiation,
 * call listener registration, and event subscriptions to `CallButtonsService`.
 * For user calls, it displays the existing `cometchat-outgoing-call` overlay.
 * For group calls, it emits `ccShowOngoingCall` via `CometChatUIEvents`.
 *
 * @example
 * ```html
 * <cometchat-call-buttons
 *   [user]="activeUser"
 *   (error)="onError($event)">
 * </cometchat-call-buttons>
 * ```
 *

 */
@Component({
  selector: 'cometchat-call-buttons',
  standalone: true,
  imports: [
    CommonModule,
    CometChatButtonComponent,
    CometChatOutgoingCallComponent,
    CometChatOngoingCallComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cometchat-call-buttons.component.html',
  styleUrls: ['./cometchat-call-buttons.component.css'],
})
export class CometChatCallButtonsComponent implements OnInit, OnChanges, OnDestroy {
  // ==================== Service Injection ====================

  private callButtonsService = inject(CallButtonsService);
  private callAnnouncer = inject(CallAnnouncerService);
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, {
    optional: true,
  });

  // ==================== ExplicitlySet Flags & Backing Fields (GlobalConfig Priority System) ====================
  private hideVoiceCallButtonExplicitlySet = signal(false);
  private hideVideoCallButtonExplicitlySet = signal(false);
  private outgoingCallDisableSoundForCallsExplicitlySet = signal(false);
  private outgoingCallCustomSoundForCallsExplicitlySet = signal(false);

  private _hideVoiceCallButton = signal(false);
  private _hideVideoCallButton = signal(false);
  private _outgoingCallDisableSoundForCalls = signal(false);
  private _outgoingCallCustomSoundForCalls = signal('');

  // ==================== Inputs ====================

  /** The user to call. Mutually exclusive with group. */
  @Input() user: CometChat.User | null = null;

  /** The group to call. Mutually exclusive with user. */
  @Input() group: CometChat.Group | null = null;

  /** Hides the voice call button when true. */
  @Input({ transform: booleanAttribute })
  set hideVoiceCallButton(value: boolean) {
    this._hideVoiceCallButton.set(value);
    this.hideVoiceCallButtonExplicitlySet.set(true);
  }
  get hideVoiceCallButton(): boolean {
    return this._hideVoiceCallButton();
  }

  /** Hides the video call button when true. */
  @Input({ transform: booleanAttribute })
  set hideVideoCallButton(value: boolean) {
    this._hideVideoCallButton.set(value);
    this.hideVideoCallButtonExplicitlySet.set(true);
  }
  get hideVideoCallButton(): boolean {
    return this._hideVideoCallButton();
  }

  /** Custom voice call click handler. Overrides default call initiation. */
  @Input() onVoiceCallClick: (() => void) | null = null;

  /** Custom video call click handler. Overrides default call initiation. */
  @Input() onVideoCallClick: (() => void) | null = null;

  /** Error callback invoked for any error during call operations. */
  @Input() onError: ((error: CometChat.CometChatException) => void) | null = null;

  // ==================== Outgoing Call Configuration Inputs ====================

  /** Disables sound for the outgoing call overlay. */
  @Input({ transform: booleanAttribute })
  set outgoingCallDisableSoundForCalls(value: boolean) {
    this._outgoingCallDisableSoundForCalls.set(value);
    this.outgoingCallDisableSoundForCallsExplicitlySet.set(true);
  }
  get outgoingCallDisableSoundForCalls(): boolean {
    return this._outgoingCallDisableSoundForCalls();
  }

  /** Custom sound URL for the outgoing call overlay. */
  @Input()
  set outgoingCallCustomSoundForCalls(value: string) {
    this._outgoingCallCustomSoundForCalls.set(value);
    this.outgoingCallCustomSoundForCallsExplicitlySet.set(true);
  }
  get outgoingCallCustomSoundForCalls(): string {
    return this._outgoingCallCustomSoundForCalls();
  }

  // ==================== Template Override Inputs ====================

  /** Replaces the default voice call button with a custom template. */
  @Input() voiceCallButtonView: TemplateRef<any> | null = null;

  /** Replaces the default video call button with a custom template. */
  @Input() videoCallButtonView: TemplateRef<any> | null = null;

  /**
   * Custom CallSettingsBuilder to override the default call settings.
   * When provided, this builder is forwarded to the ongoing-call component.
   * Priority: @Input > GlobalConfig > default (built internally by OngoingCallService).
   */
  @Input() callSettingsBuilder!: typeof CometChatUIKitCalls.CallSettingsBuilder;

  /**
   * When true, suppresses rendering of the outgoing-call and ongoing-call overlays.
   * Use this when another instance of CometChatCallButtons already renders overlays
   * (e.g. the message header instance defers to the messages-level instance).
   */
  @Input({ transform: booleanAttribute }) hideOverlays = false;

  // ==================== Outputs ====================

  /** Emitted on any error during call operations. */
  @Output() error = new EventEmitter<CometChat.CometChatException>();

  // ==================== Public Properties ====================

  /** Icon URL for the voice call button. */
  readonly voiceCallIconUrl = 'assets/call.svg';

  /** Icon URL for the video call button. */
  readonly videoCallIconUrl = 'assets/video_call_button.svg';

  // ==================== Effective Values (GlobalConfig Priority System) ====================

  /**
   * Resolved hideVoiceCallButton value using priority:
   * 1. Explicitly set @Input value
   * 2. GlobalConfig value (if defined)
   * 3. `true` when calling is not enabled via `CometChatUIKit.isCallingEnabled()`
   * 4. Component default (`false` — visible when calling is enabled)
   */
  effectiveHideVoiceCallButton = computed(() => {
    if (this.hideVoiceCallButtonExplicitlySet()) return this._hideVoiceCallButton();
    return !CometChatUIKit.isCallingEnabled();
  });

  /**
   * Resolved hideVideoCallButton value using priority:
   * 1. Explicitly set @Input value
   * 2. GlobalConfig value (if defined)
   * 3. `true` when calling is not enabled via `CometChatUIKit.isCallingEnabled()`
   * 4. Component default (`false` — visible when calling is enabled)
   */
  effectiveHideVideoCallButton = computed(() => {
    if (this.hideVideoCallButtonExplicitlySet()) return this._hideVideoCallButton();
    return !CometChatUIKit.isCallingEnabled();
  });

  /**
   * Resolved outgoingCallDisableSoundForCalls value using 3-tier priority:
   * 1. Explicitly set @Input value
   * 2. GlobalConfig.disableSoundForCalls value (if defined) — name mapping
   * 3. Component default (false)
   */
  effectiveOutgoingCallDisableSoundForCalls = computed(() => {
    if (this.outgoingCallDisableSoundForCallsExplicitlySet())
      return this._outgoingCallDisableSoundForCalls();
    if (this.globalConfig?.disableSoundForCalls !== undefined)
      return this.globalConfig.disableSoundForCalls;
    return false;
  });

  /**
   * Resolved outgoingCallCustomSoundForCalls value using 3-tier priority:
   * 1. Explicitly set @Input value
   * 2. GlobalConfig.customSoundForCalls value (if defined) — name mapping
   * 3. Component default ('')
   */
  effectiveOutgoingCallCustomSoundForCalls = computed(() => {
    if (this.outgoingCallCustomSoundForCallsExplicitlySet())
      return this._outgoingCallCustomSoundForCalls();
    if (this.globalConfig?.customSoundForCalls !== undefined)
      return this.globalConfig.customSoundForCalls;
    return '';
  });

  // ==================== Computed Signals ====================

  /**
   * Whether a user or group target is set.
   * The component renders nothing when no target is provided.
   * Note: user/group are plain @Input properties, not signals, so this
   * getter is fine — it's only evaluated when change detection runs.
   *
   * @see Requirement 1.1, 1.2
   */
  get hasTarget(): boolean {
    return !!this.user || !!this.group;
  }

  /**
   * Whether the call buttons are disabled.
   * Reads from the service's buttonsDisabled signal.
   *
   * @see Requirement 4.6
   */
  readonly isDisabled = computed(() => this.callButtonsService.buttonsDisabled());

  /**
   * Whether to show the outgoing call overlay (user calls only).
   * True when the service indicates the outgoing call screen should be shown
   * and there is an active call object.
   *
   * @see Requirement 5.1
   */
  readonly showOutgoingCall = computed(
    () => this.callButtonsService.showOutgoingCallScreen() && !!this.callButtonsService.activeCall()
  );

  /**
   * The active call object from the service.
   *
   * @see Requirement 2.3
   */
  readonly activeCallObject = computed(() => this.callButtonsService.activeCall());

  /**
   * Whether to show the ongoing call screen.
   * True after outgoing call is accepted or group call is initiated.
   */
  readonly showOngoingCall = computed(
    () => this.callButtonsService.showOngoingCall() && !!this.callButtonsService.sessionId()
  );

  /**
   * The current session ID for the ongoing call.
   */
  readonly ongoingCallSessionId = computed(() => this.callButtonsService.sessionId());

  /**
   * The call workflow for the ongoing call.
   * Reads from the service's isDirectCalling signal.
   * Group calls and meeting joins use directCalling, user calls use defaultCalling.
   */
  readonly ongoingCallWorkflow = computed(() =>
    this.callButtonsService.isDirectCalling()
      ? CallWorkflow.directCalling
      : CallWorkflow.defaultCalling
  );

  /**
   * Resolved callSettingsBuilder using 3-tier priority:
   * 1. Explicitly set @Input value (not undefined)
   * 2. GlobalConfig.callSettingsBuilder (if defined)
   * 3. null (OngoingCallService creates default internally)
   */
  get effectiveCallSettingsBuilder(): any {
    if (this.callSettingsBuilder !== undefined) return this.callSettingsBuilder;
    if (this.globalConfig?.callSettingsBuilder !== undefined) return this.globalConfig.callSettingsBuilder;
    return null;
  }

  /**
   * Whether the ongoing call is audio-only.
   * For user calls: determined from the active call object's type.
   * For group calls: determined from the isGroupAudioCall signal.
   * Matches the React `getCallBuilder()` pattern for determining audioOnlyCall.
   */
  readonly ongoingCallIsAudioOnly = computed(() => {
    if (this.callButtonsService.activeUser()) {
      return this.callButtonsService.activeCall()?.getType() === CometChatUIKitConstants.MessageTypes.audio;
    }
    return this.callButtonsService.isGroupAudioCall();
  });

  // ==================== Lifecycle ====================

  /**
   * Initializes the service and syncs user/group inputs.
   *
   * @see Requirement 9.4
   */
  ngOnInit(): void {
    this.callButtonsService.initialize();

    if (this.user) {
      this.callButtonsService.setActiveUser(this.user);
    }
    if (this.group) {
      this.callButtonsService.setActiveGroup(this.group);
    }
  }

  /**
   * Syncs user/group input changes to the service.
   *
   * @see Requirement 6.3
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user']) {
      this.callButtonsService.setActiveUser(this.user);
    }
    if (changes['group']) {
      this.callButtonsService.setActiveGroup(this.group);
    }
  }

  /**
   * Cleans up component-specific resources.
   * Note: Service cleanup is handled by Angular's DI when the service is destroyed.
   */
  ngOnDestroy(): void {
    // Service is a singleton - don't call its ngOnDestroy here
    // as other components may still be using it
  }

  // ==================== Actions ====================

  /**
   * Handles voice call button click.
   * If a custom handler is provided, invokes it.
   * Otherwise, delegates to the service's initiateAudioCall().
   *
   * @see Requirement 7.1, 7.3
   */
  async onVoiceCallButtonClick(): Promise<void> {
    if (this.isDisabled() || !CometChatUIKit.isCallingEnabled()) return;

    try {
      if (this.onVoiceCallClick) {
        this.onVoiceCallClick();
      } else {
        // Announce call initiation for screen readers
        this.callAnnouncer.announceCallInitiation('audio');
        await this.callButtonsService.initiateAudioCall();
      }
    } catch (err: unknown) {
      this.handleError(err);
    }
  }

  /**
   * Handles video call button click.
   * If a custom handler is provided, invokes it.
   * Otherwise, delegates to the service's initiateVideoCall().
   *
   * @see Requirement 7.2, 7.3
   */
  async onVideoCallButtonClick(): Promise<void> {
    if (this.isDisabled() || !CometChatUIKit.isCallingEnabled()) return;

    try {
      if (this.onVideoCallClick) {
        this.onVideoCallClick();
      } else {
        // Announce call initiation for screen readers
        this.callAnnouncer.announceCallInitiation('video');
        await this.callButtonsService.initiateVideoCall();
      }
    } catch (err: unknown) {
      this.handleError(err);
    }
  }

  /**
   * Handles outgoing call cancellation from the outgoing call overlay.
   *
   * @see Requirement 5.2, 11.3
   */
  async onOutgoingCallCanceled(): Promise<void> {
    try {
      await this.callButtonsService.cancelOutgoingCall();
    } catch (err: unknown) {
      this.handleError(err);
    }
  }

  // ==================== Private Helpers ====================

  /**
   * Handles errors by emitting the `error` output and invoking the `onError` callback.
   *
   * @param err - The error to handle
   * @see Requirement 11.1, 11.2, 11.3, 11.4
   */
  private handleError(err: unknown): void {
    handleCallError(err, 'CALL_BUTTONS_ERROR', 'CometChatCallButtons', this.error, this.onError);
  }
}
