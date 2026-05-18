import { Component, computed, effect, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { NgClass } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  TranslatePipe,
  CometChatAvatarComponent,
  CometChatDateComponent,
  CometChatLocalize,
  CometChatUIKitConstants,
  CometChatCallButtonsComponent,
  CalendarObject,
  CometChatUIKitCalls,
} from '@cometchat/chat-uikit-angular';
import { CometChatCalls } from '@cometchat/calls-sdk-javascript';
import { NavigationService } from '../../services/navigation.service';

/** Missed call statuses */
const MISSED_CALL_STATUSES = ['unanswered', 'cancelled', 'busy', 'rejected'];

function callIsSentByMe(call: any, loggedInUser: { getUid(): string }): boolean {
  let senderUid = '';
  try {
    senderUid =
      (call.getCallInitiator && call.getCallInitiator()?.getUid()) ||
      call?.getInitiator()?.getUid();
  } catch { /* fallback */ }
  return !senderUid || senderUid === loggedInUser.getUid();
}

function callIsMissed(call: any, loggedInUser: { getUid(): string }): boolean {
  if (callIsSentByMe(call, loggedInUser)) return false;
  const status: string = call.getStatus?.() ?? '';
  return MISSED_CALL_STATUSES.includes(status);
}

function callVerifyUser(call: any, loggedInUser: { getUid(): string }): any {
  if (call.getInitiator().getUid() === loggedInUser.getUid()) {
    return call.getReceiver();
  }
  return call.getInitiator();
}

@Component({
  selector: 'cometchat-call-log-details',
  standalone: true,
  imports: [TranslatePipe, NgClass, CometChatAvatarComponent, CometChatDateComponent, CometChatCallButtonsComponent],
  templateUrl: './cometchat-call-log-details.component.html',
  styleUrls: ['./cometchat-call-log-details.component.css'],
})
export class CometChatCallLogDetailsComponent implements OnInit, OnDestroy {
  private navigationService = inject(NavigationService);

  protected callLog = this.navigationService.selectedCallLog;
  protected activeTab = signal<'participants' | 'recording' | 'history'>('participants');

  private loggedInUser: CometChat.User | null = null;
  private userListenerId = '';

  /** The resolved other-party user (fetched fresh for online status) */
  protected otherUser = signal<CometChat.User | null>(null);
  protected subtitleText = signal<string>('');

  /** Call history list fetched from CometChatUIKitCalls */
  protected callHistory = signal<any[]>([]);
  protected callHistoryLoading = signal(false);
  private historyRequestBuilder: any = null;
  private historyFetched = false;

  /** React to callLog signal changes (when user picks a different call log) */
  private callLogEffect = effect(() => {
    const call = this.callLog();
    if (!call || !this.loggedInUser) return;
    this.resetState();
    this.resolveOtherUser();
  },{ allowSignalWrites: true});

  async ngOnInit(): Promise<void> {
    try {
      this.loggedInUser = await CometChat.getLoggedinUser();
    } catch {
      console.error("Couldn't get logged in user");
    }
    this.resolveOtherUser();
  }

  ngOnDestroy(): void {
    if (this.userListenerId) {
      CometChat.removeUserListener(this.userListenerId);
    }
  }

  /** Reset state when switching between call logs */
  private resetState(): void {
    this.activeTab.set('participants');
    this.callHistory.set([]);
    this.callHistoryLoading.set(false);
    this.historyFetched = false;
    this.historyRequestBuilder = null;
    if (this.userListenerId) {
      CometChat.removeUserListener(this.userListenerId);
      this.userListenerId = '';
    }
  }

  /** Resolve the other party user and listen for status changes */
  private resolveOtherUser(): void {
    const call = this.callLog();
    if (!call || !this.loggedInUser) return;

    const callUser = callVerifyUser(call, this.loggedInUser);
    if (!callUser?.uid && !callUser?.getUid?.()) return;

    const uid = callUser.getUid?.() ?? callUser.uid;
    CometChat.getUser(uid).then((user: CometChat.User) => {
      this.otherUser.set(user);
      this.subtitleText.set(
        CometChatLocalize.getLocalizedString(
          `message_header_status_${user.getStatus()?.toLowerCase()}`
        )
      );
      this.setupUserListener(user);
    });
  }

  private setupUserListener(user: CometChat.User): void {
    this.userListenerId = 'call_details_user_' + Date.now();
    CometChat.addUserListener(
      this.userListenerId,
      new CometChat.UserListener({
        onUserOnline: (onlineUser: CometChat.User) => {
          if (user.getUid() === onlineUser.getUid()) {
            this.subtitleText.set(
              CometChatLocalize.getLocalizedString('message_header_status_online')
            );
          }
        },
        onUserOffline: (offlineUser: CometChat.User) => {
          if (user.getUid() === offlineUser.getUid()) {
            this.subtitleText.set(
              CometChatLocalize.getLocalizedString('message_header_status_offline')
            );
          }
        },
      })
    );
  }

  /** Fetch call history for the other party */
  private async fetchCallHistory(): Promise<void> {
    const call = this.callLog();
    if (!call || !this.loggedInUser) {
      this.callHistoryLoading.set(false);
      return;
    }

    try {
      const otherUser = callVerifyUser(call, this.loggedInUser);
      const callUserId = otherUser?.getUid?.() ?? otherUser?.uid;
      const authToken = this.loggedInUser.getAuthToken() || '';

      let builder: any = new CometChatUIKitCalls.CallLogRequestBuilder()
        .setLimit(30)
        .setCallCategory('call')
        .setAuthToken(authToken);

      if (callUserId) {
        builder = builder.setUid(callUserId);
      }

      this.historyRequestBuilder = builder.build();
      const calls = await this.historyRequestBuilder.fetchNext();
      this.callHistory.set(calls ?? []);
      this.historyFetched = true;
    } catch (e) {
      console.error('Error fetching call history', e);
    } finally {
      this.callHistoryLoading.set(false);
    }
  }

  protected participants = computed(() => {
    const call = this.callLog();
    if (!call) return [];
    try {
      const list = call.getParticipants?.() ?? [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  });

  protected recordings = computed(() => {
    const call = this.callLog();
    if (!call) return [];
    try {
      const list = call.getRecordings?.() ?? [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  });

  protected initiatedAt = computed(() => {
    const call = this.callLog();
    if (!call) return null;
    try {
      return call.getInitiatedAt?.() ?? null;
    } catch {
      return null;
    }
  });

  protected callType = computed(() => {
    const call = this.callLog();
    if (!call) return '';
    try {
      return call.getType?.() ?? call?.type ?? '';
    } catch {
      return '';
    }
  });

  /** Get call status label (Outgoing Call / Incoming Call / Missed Call) */
  getCallStatusLabel(call: any): string {
    if (!call || !this.loggedInUser) return '';
    const sentByMe = callIsSentByMe(call, this.loggedInUser);
    const status: string = call.getStatus?.() ?? '';

    switch (status) {
      case CometChatUIKitConstants.calls.initiated:
      case CometChatUIKitConstants.calls.ongoing:
      case CometChatUIKitConstants.calls.ended:
        return sentByMe
          ? CometChatLocalize.getLocalizedString('calls_outgoing_call')
          : CometChatLocalize.getLocalizedString('calls_incoming_call');
      case CometChatUIKitConstants.calls.cancelled:
      case CometChatUIKitConstants.calls.rejected:
      case CometChatUIKitConstants.calls.busy:
      case CometChatUIKitConstants.calls.unanswered:
        return sentByMe
          ? CometChatLocalize.getLocalizedString('calls_outgoing_call')
          : CometChatLocalize.getLocalizedString('calls_missed_call');
      default:
        return sentByMe
          ? CometChatLocalize.getLocalizedString('calls_outgoing_call')
          : CometChatLocalize.getLocalizedString('calls_incoming_call');
    }
  }

  /** Get the icon class for a call status */
  getCallIconClass(call: any): string {
    if (!call || !this.loggedInUser) return 'cometchat-call-log-details__call-icon--outgoing';
    const sentByMe = callIsSentByMe(call, this.loggedInUser);
    const missed = callIsMissed(call, this.loggedInUser);

    if (missed) return 'cometchat-call-log-details__call-icon--missed';
    if (sentByMe) return 'cometchat-call-log-details__call-icon--outgoing';
    return 'cometchat-call-log-details__call-icon--incoming';
  }

  /** Duration from minutes to human-readable */
  getCallDuration(call: any): string {
    try {
      const minutes = call?.getTotalDurationInMinutes?.();
      if (!minutes) return '00:00';
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.floor(minutes % 60);
      const seconds = Math.floor((minutes - Math.floor(minutes)) * 60);
      let result = '';
      if (hours > 0) result += `${hours}h `;
      if (remainingMinutes > 0) result += `${remainingMinutes}m `;
      if (seconds >= 0) result += `${seconds}s`;
      return result.trim() || '00:00';
    } catch {
      return '00:00';
    }
  }

  /** Whether a call has a valid duration */
  hasCallDuration(call: any): boolean {
    try {
      return !!call?.getTotalDurationInMinutes?.();
    } catch {
      return false;
    }
  }

  /** Participant duration */
  getParticipantDuration(participant: any): string {
    try {
      if (participant?.getHasJoined?.() || participant?.getJoinedAt?.()) {
        return this.getCallDuration(participant);
      }
      return '0h 0m 0s';
    } catch {
      return '0h 0m 0s';
    }
  }

  hasParticipantDuration(participant: any): boolean {
    try {
      return !!(participant?.getHasJoined?.() || participant?.getJoinedAt?.());
    } catch {
      return false;
    }
  }

  /** Date format for CometChatDate */
  getDateFormat(): CalendarObject {
    return {
      yesterday: 'DD MMM, hh:mm A',
      otherDays: 'DD MMM, hh:mm A',
      today: 'DD MMM, hh:mm A',
    };
  }

  /** Get recording start time */
  getRecordingStartTime(recording: any): number {
    try {
      return recording?.getStartTime?.() ?? 0;
    } catch {
      return 0;
    }
  }

  /** Download recording */
  handleDownloadRecording(recording: any): void {
    try {
      const url = recording?.getRecordingURL?.();
      if (!url) return;
      fetch(url)
        .then((response) => response.blob())
        .then((blob) => {
          const blobURL = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobURL;
          a.download = 'recording.mp4';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobURL);
        });
    } catch (e) {
      console.error('Error downloading recording', e);
    }
  }

  getOtherParty(call: any): any {
    if (!this.loggedInUser) return call?.getInitiator?.();
    return callVerifyUser(call, this.loggedInUser);
  }

  onClose(): void {
    this.navigationService.closeSidePanel();
    if (this.navigationService.isMobile()) {
      this.navigationService.navigateToSelector();
    }
  }

  onTabChange(tab: 'participants' | 'recording' | 'history'): void {
    this.activeTab.set(tab);
    if (tab === 'history' && !this.historyFetched && !this.callHistoryLoading()) {
      this.callHistoryLoading.set(true);
      this.fetchCallHistory();
    }
  }

}
