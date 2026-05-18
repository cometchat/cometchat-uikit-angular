import { Component, computed, DestroyRef, effect, inject, OnInit, OnDestroy, signal, ViewChild, ViewEncapsulation } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  ChatStateService,
  CometChatMessageHeaderComponent,
  CometChatMessageListComponent,
  CometChatMessageComposerComponent,
  CometChatUserEvents,
  CometChatLocalize,
  TranslatePipe,
} from '@cometchat/chat-uikit-angular';
import { Subscription } from 'rxjs';
import { NavigationService } from '../../services/navigation.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { CometChatAIStreamingService } from '../../../../../cometchat-uikit/src/lib/services/cometchat-ai-streaming.service';
import { CometChatAIAssistantChat } from '../../../../../cometchat-uikit/src/lib/components/cometchat-ai-assistant-chat/cometchat-ai-assistant-chat.component';

/**
 * CometChatMessagesComponent
 *
 * Composes UIKit's MessageHeader, MessageList, and MessageComposer
 * into a single messages view. Reads active user/group from
 * ChatStateService and wires navigation events to NavigationService.
 *
 * - Hides composer when the active user has blocked the logged-in user
 * - Header click → details panel
 * - Thread reply → thread panel
 * - Search icon → search panel
 * - Call buttons in header handle calls and overlays directly
 * - Supports goToMessageId for navigating to specific messages
 */
@Component({
  selector: 'cometchat-messages',
  standalone: true,
  imports: [
    CometChatMessageHeaderComponent,
    CometChatMessageListComponent,
    CometChatMessageComposerComponent,
    CometChatAIAssistantChat,
    TranslatePipe,
  ],
  templateUrl: './cometchat-messages.component.html',
  styleUrls: ['./cometchat-messages.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CometChatMessagesComponent implements OnInit, OnDestroy {
  private chatStateService = inject(ChatStateService);
  protected navigationService = inject(NavigationService);
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private streamingService = inject(CometChatAIStreamingService);
  private destroyRef = inject(DestroyRef);

  private subscriptions: Subscription[] = [];

  /** Unique listener ID for the SDK AI event listener */
  private readonly aiListenerId = `messages-ai-listener-${Date.now()}`;

  /** Reference to the UIKit message header for manual change detection */
  @ViewChild('messageHeader') messageHeaderRef?: CometChatMessageHeaderComponent;

  /** Active user from ChatStateService */
  protected activeUser = this.chatStateService.activeUser;

  /** Active group from ChatStateService */
  protected activeGroup = this.chatStateService.activeGroup;

  /** True when the active user has the @agentic role — renders AI assistant chat instead */
  protected isAgenticUser = computed(() => this.activeUser()?.getRole() === '@agentic');

  /** Show back button on mobile */
  protected showBackButton = computed(() => this.navigationService.isMobile());

  /**
   * Force the UIKit message header to re-evaluate when isMobile changes.
   * The UIKit's showBackButton is a plain @Input (not signal-backed),
   * so its internal computed doesn't track changes. We manually trigger
   * change detection on the child component to pick up the new value.
   */
  private showBackButtonSync = effect(() => {
    // Track the signal so the effect re-runs on change
    this.navigationService.isMobile();
    // Nudge the UIKit component's change detector
    this.messageHeaderRef?.['cdr']?.detectChanges();
  },{ allowSignalWrites: true});

  /** Whether the composer should be hidden (user blocked by me) — local signal for realtime updates */
  protected isBlockedByMe = signal(false);

  /** Sync isBlockedByMe when the active user changes (switching conversations) */
  private activeUserSync = effect(() => {
    const user = this.activeUser();
    this.isBlockedByMe.set(user?.getBlockedByMe?.() ?? false);
  },{ allowSignalWrites: true});

  /** goToMessageId from NavigationService, converted to string for the UIKit input */
  protected goToMessageId = computed(() => {
    const id = this.navigationService.goToMessageId();
    const result = id !== null ? String(id) : undefined;
    return result;
  });

  // ── Lifecycle ──

  ngOnInit(): void {
    const u = this.activeUser();
    this.isBlockedByMe.set(u?.getBlockedByMe?.() ?? false);
    this.subscribeToUserEvents();
    this._attachAIListener();
    this.destroyRef.onDestroy(() => this._detachAIListener());
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions = [];
  }

  private subscribeToUserEvents(): void {
    this.subscriptions.push(
      CometChatUserEvents.ccUserBlocked.subscribe((user: CometChat.User) => {
        const active = this.chatStateService.getActiveUser();
        if (active && active.getUid() === user.getUid()) {
          this.isBlockedByMe.set(true);
        }
      }),
      CometChatUserEvents.ccUserUnblocked.subscribe((user: CometChat.User) => {
        const active = this.chatStateService.getActiveUser();
        if (active && active.getUid() === user.getUid()) {
          this.isBlockedByMe.set(false);
        }
      }),
    );
  }

  // ── AI streaming listener ──

  private _attachAIListener(): void {
    CometChat.addAIAssistantListener(
      this.aiListenerId,
      new CometChat.AIAssistantListener({
        onAIAssistantEventReceived: (event: CometChat.AIAssistantBaseEvent) => {
          const user = this.activeUser();
          if (!user) return;
          this.streamingService.handleWebsocketMessage(event, user.getUid());
        },
      })
    );
  }

  private _detachAIListener(): void {
    CometChat.removeAIAssistantListener(this.aiListenerId);
  }

  /** Unblock the active user — called from the blocked banner */
  async onUnblockUser(): Promise<void> {
    const u = this.activeUser();
    if (!u) return;
    try {
      await this.userService.unblockUser(u.getUid());
      u.setBlockedByMe(false);
      CometChatUserEvents.ccUserUnblocked.next(u);
      this.toastService.showSuccess(
        CometChatLocalize.getLocalizedString('unblocked_successfully')
      );
    } catch {
      this.toastService.showError(
        CometChatLocalize.getLocalizedString('SOMETHING_WRONG')
      );
    }
  }

  // ── Event handlers ──

  /** Header back button click → clear active chat and go back to selector on mobile */
  onBackClick(): void {
    if (this.navigationService.isMobile()) {
      this.chatStateService.clearActiveChat();
      this.navigationService.closeSidePanel();
      this.navigationService.closeThreadPanel();
      this.navigationService.navigateToSelector();
    }
  }

  /** Header item click → show details panel */
  onHeaderItemClick(): void {
    this.navigationService.showDetailsPanel();
    if (this.navigationService.isMobile()) {
      this.navigationService.navigateToSidePanel();
    }
  }

  /** Header search click → show search panel */
  onSearchClick(): void {
    this.navigationService.showSearchPanel();
    if (this.navigationService.isMobile()) {
      this.navigationService.navigateToSidePanel();
    }
  }

  /** Thread reply click → show thread panel */
  onThreadRepliesClick(message: CometChat.BaseMessage): void {
    this.navigationService.showThreadPanel(message);
    if (this.navigationService.isMobile()) {
      this.navigationService.navigateToSidePanel();
    }
  }

}
