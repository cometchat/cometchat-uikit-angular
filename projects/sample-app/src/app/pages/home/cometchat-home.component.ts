import { Component, computed, effect, inject, signal, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  CometChatIncomingCallComponent,
  ChatStateService,
  CometChatGroupEvents,
  CometChatUserEvents,
  CometChatMessageEvents,
  CometChatConversationEvents,
  CometChatCallEvents,
  CometChatUIEvents,
  CometChatUIKit,
  CometChatLocalize,
  IGroupMemberJoined,
  IMouseEvent,
  IMessages,
  IPanel,
  IModal,
  IDialog,
  IShowOngoingCall,
  MessageStatus,
  TranslatePipe,
  LiveAnnouncerService,
  DialogFocusManager,
  CometChatSearchComponent,
  CometChatSearchFilter,
  CometChatSearchScope,
  CallWorkflow,
} from '@cometchat/chat-uikit-angular';
import { NavigationService } from '../../services/navigation.service';
import { AppStateService } from '../../services/app-state.service';
import { ThemeService } from '../../services/theme.service';
import { ViewportService } from '../../services/viewport.service';
import { ToastService } from '../../services/toast.service';
import { CometChatTabsComponent } from '../../components/cometchat-tabs/cometchat-tabs.component';
import { CometChatSelectorComponent } from '../../components/cometchat-selector/cometchat-selector.component';
import { CometChatEmptyStateComponent } from '../../components/cometchat-empty-state/cometchat-empty-state.component';
import { CometChatMessagesComponent } from '../../components/cometchat-messages/cometchat-messages.component';
import { CometChatUserDetailsComponent } from '../../components/cometchat-user-details/cometchat-user-details.component';
import { CometChatGroupDetailsComponent } from '../../components/cometchat-group-details/cometchat-group-details.component';
import { CometChatThreadedMessagesComponent } from '../../components/cometchat-threaded-messages/cometchat-threaded-messages.component';
import { CometChatCreateGroupComponent } from '../../components/cometchat-create-group/cometchat-create-group.component';
import { CometChatJoinGroupComponent } from '../../components/cometchat-join-group/cometchat-join-group.component';
import { CometChatNewChatComponent } from '../../components/cometchat-new-chat/cometchat-new-chat.component';
import { CometChatAddMembersComponent } from '../../components/cometchat-add-members/cometchat-add-members.component';
import { CometChatBannedMembersComponent } from '../../components/cometchat-banned-members/cometchat-banned-members.component';
import { CometChatTransferOwnershipComponent } from '../../components/cometchat-transfer-ownership/cometchat-transfer-ownership.component';
import { CometChatCallLogDetailsComponent } from '../../components/cometchat-call-log-details/cometchat-call-log-details.component';
import { CometChatToastContainerComponent } from '../../components/cometchat-toast-container/cometchat-toast-container.component';

/**
 * CometChatHomeComponent
 *
 * Pure layout component that composes the main chat interface:
 * left panel (tabs + selector), center panel (messages), and
 * right panel (side panel / thread). No business logic — only
 * reads service signals and renders child components accordingly.
 *
 * Desktop: all panels side-by-side via flexbox.
 * Mobile (≤768px): single panel visible based on NavigationService.mobilePanel.
 */
@Component({
  selector: 'cometchat-home',
  standalone: true,
  imports: [CommonModule, CometChatIncomingCallComponent, CometChatTabsComponent, CometChatSelectorComponent, CometChatEmptyStateComponent, CometChatMessagesComponent, CometChatUserDetailsComponent, CometChatGroupDetailsComponent, CometChatThreadedMessagesComponent, CometChatCreateGroupComponent, CometChatJoinGroupComponent, CometChatNewChatComponent, CometChatAddMembersComponent, CometChatBannedMembersComponent, CometChatTransferOwnershipComponent, CometChatCallLogDetailsComponent, CometChatToastContainerComponent, TranslatePipe, CometChatSearchComponent],
  templateUrl: './cometchat-home.component.html',
  styleUrls: ['./cometchat-home.component.css'],
})
export class CometChatHomeComponent implements OnInit, OnDestroy {
  protected navigationService = inject(NavigationService);
  protected appStateService = inject(AppStateService);
  private chatStateService = inject(ChatStateService);
  private toastService = inject(ToastService);
  private liveAnnouncer = inject(LiveAnnouncerService);
  private dialogFocusManager = inject(DialogFocusManager);

  // Inject ThemeService to trigger its constructor (system theme detection)
  private _themeService = inject(ThemeService);

  // Inject ViewportService for visual viewport tracking on mobile
  private viewportService = inject(ViewportService);

  /** RxJS subscriptions for UIKit events — cleaned up in ngOnDestroy */
  private subscriptions: Subscription[] = [];
  
  private groupListenerId = '';
  private loginListenerId = '';
  private messageListenerId = '';

  // ── Computed helpers for template ──

  protected isMobile = this.navigationService.isMobile;
  protected mobilePanel = this.navigationService.mobilePanel;
  protected sidePanelView = this.navigationService.sidePanelView;
  protected showThread = this.navigationService.showThread;

  protected showNewChat = this.appStateService.showNewChat;
  protected showCreateGroup = this.appStateService.showCreateGroup;
  protected showJoinGroup = this.appStateService.showJoinGroup;

  /** Expose CallWorkflow enum for template binding */
  protected readonly CallWorkflow = CallWorkflow;

  /** Whether the search overlay is visible */
  protected showSearchOverlay = signal(false);

  /** Active uid for scoped search (right panel) */
  protected activeUid = computed(() => this.chatStateService.activeUser()?.getUid() ?? '');

  /** Active guid for scoped search (right panel) */
  protected activeGuid = computed(() => this.chatStateService.activeGroup()?.getGuid() ?? '');

  /** Scoped search: messages only */
  readonly scopedSearchIn = [CometChatSearchScope.Messages];

  /** Scoped search: no Unread/Groups filters */
  readonly scopedSearchFilters = [
    CometChatSearchFilter.Photos,
    CometChatSearchFilter.Videos,
    CometChatSearchFilter.Documents,
    CometChatSearchFilter.Audio,
    CometChatSearchFilter.Links,
  ];

  /** Open the search overlay */
  protected openSearch(): void {
    this.showSearchOverlay.set(true);
  }

  /** Close the search overlay */
  protected closeSearch(): void {
    this.showSearchOverlay.set(false);
  }

  /** Handle conversation click from search — navigate to conversation */
  protected onSearchConversationClick(event: {
    conversation: CometChat.Conversation;
    searchKeyword: string;
  }): void {
    this.navigationService.setGotoMessageId(null);
    this.chatStateService.setActiveConversation(event.conversation);
  }

  /** Handle message click from search — navigate to conversation and jump to message */
  protected onSearchMessageClick(event: {
    message: CometChat.BaseMessage;
    searchKeyword: string;
  }): void {
    const message = event.message;
    const messageId = message.getId();

    // Determine the conversation target from the message
    const receiverType = message.getReceiverType();

    // Set goToMessageId FIRST (synchronously) so it's available when handleUserChange/handleGroupChange
    // reads it after the ChatStateService subscription fires.
    // Reset to null first, then set the new value — this ensures ngOnChanges fires

    if (receiverType === CometChat.RECEIVER_TYPE.GROUP) {
      const group = message.getReceiver() as CometChat.Group;
      //  Set goToMessageId BEFORE setting the active group so that
      // handleGroupChangeImpl reads the correct messageId when it runs.
      Promise.resolve().then(() => {
        this.navigationService.setGotoMessageId(messageId);
      }).then(() => {
        this.chatStateService.setActiveGroup(group);
      });
    } else {
      const loggedInUser = CometChatUIKit.getLoggedInUser();
      const sender = message.getSender();
      const receiver = message.getReceiver() as CometChat.User;
      const otherUser =
        loggedInUser && sender.getUid() === loggedInUser.getUid() ? receiver : sender;
      //  Set goToMessageId BEFORE setting the active user so that
      // handleUserChangeImpl reads the correct messageId when it runs.
      Promise.resolve().then(() => {
        this.navigationService.setGotoMessageId(messageId);
      }).then(() => {
        this.chatStateService.setActiveUser(otherUser);
      });
    }

    // Navigate to mobile messages panel if needed
    if (this.navigationService.isMobile()) {
      this.navigationService.navigateToMessages();
    }
    // Close the search overlay after navigating to the message
    this.showSearchOverlay.set(false);
  }

  /** Close the scoped search panel (right panel) */
  protected closeScopedSearch(): void {
    this.navigationService.closeSidePanel();
  }

  /** Handle message click from scoped search — jump to message in current conversation */
  protected onScopedSearchMessageClick(event: {
    message: CometChat.BaseMessage;
    searchKeyword: string;
  }): void {
    const messageId = event.message.getId();

    // Reset goToMessageId first to ensure ngOnChanges fires even if the same message is clicked again
    this.navigationService.setGotoMessageId(null);
    Promise.resolve().then(() => {
      this.navigationService.setGotoMessageId(messageId);
    });
  }
  

  /**
   * On mobile, use the visual viewport height so the layout
   * shrinks when the keyboard opens (Chrome Android doesn't
   * resize fixed elements). On desktop, use 100%.
   */
  protected mobileHeightStyle = computed(() => {
    if (!this.isMobile()) return null;
    return this.viewportService.viewportHeight() + 'px';
  });

  /** Whether an active user or group is selected */
  protected hasActiveEntity = computed(
    () => this.chatStateService.activeUser() !== null || this.chatStateService.activeGroup() !== null
  );

  /** Whether the right panel (side panel or thread) should be visible */
  protected showRightPanel = computed(() => this.sidePanelView() !== 'none' || this.showThread());

  /** Whether call log details is the active side panel (hides center panel) */
  protected isCallLogDetailsActive = computed(() => this.sidePanelView() === 'call-log-details');

  /**
   * Reactively attach/detach the SDK MessageListener for delivery marking.
   * When no message list is open (no active user/group) and the user is not
   * on the chats tab, we mark incoming messages as delivered ourselves.
   * Otherwise the UIKit's message list handles delivery marking.
   */
  private deliveryListenerEffect = effect(() => {
    const tab = this.appStateService.activeTab();
    const hasEntity = !!this.chatStateService.activeUser() || !!this.chatStateService.activeGroup();
    if (tab !== 'chats' && !hasEntity) {
      this.attachDeliveryMarkingListener();
    } else {
      this.removeDeliveryMarkingListener();
    }
  },{ allowSignalWrites: true});

  // ── Accessibility: ViewChild refs for panel focus management ──

  @ViewChild('leftPanel', { read: ElementRef }) leftPanelRef?: ElementRef<HTMLElement>;
  @ViewChild('centerPanel', { read: ElementRef }) centerPanelRef?: ElementRef<HTMLElement>;
  @ViewChild('rightPanel', { read: ElementRef }) rightPanelRef?: ElementRef<HTMLElement>;
  @ViewChild('modalOverlay', { read: ElementRef }) modalOverlayRef?: ElementRef<HTMLElement>;
  @ViewChild('dialogOverlay', { read: ElementRef }) dialogOverlayRef?: ElementRef<HTMLElement>;

  // ── Panel resize state ──

  private static readonly STORAGE_KEY_LEFT = 'cometchat-home-left-width';
  private static readonly STORAGE_KEY_RIGHT = 'cometchat-home-right-width';
  private static readonly MIN_PANEL_WIDTH = 240;
  private static readonly MIN_CENTER_WIDTH = 300;

  /** Which panel handle is being dragged (null = idle) */
  protected resizingPanel = signal<'left' | 'right' | null>(null);

  /** Custom widths in px — null means use CSS defaults */
  protected leftPanelWidth = signal<number | null>(
    this.loadStoredWidth(CometChatHomeComponent.STORAGE_KEY_LEFT)
  );
  protected rightPanelWidth = signal<number | null>(
    this.loadStoredWidth(CometChatHomeComponent.STORAGE_KEY_RIGHT)
  );

  private resizeStartX = 0;
  private resizeStartWidth = 0;
  private boundOnResizeMove = this.onResizeMove.bind(this);
  private boundOnResizeEnd = this.onResizeEnd.bind(this);

  /** Tab mapping for Alt+N keyboard shortcuts */
  private readonly tabShortcuts: Record<string, 'chats' | 'calls' | 'users' | 'groups'> = {
    '1': 'chats',
    '2': 'calls',
    '3': 'users',
    '4': 'groups',
  };

  /**
   * Keyboard shortcut handler for the home page.
   * - Escape: close side panel/thread/overlay, return focus to center panel
   * - Alt+1-4: switch tabs
   * Suppressed when focus is in input, textarea, or contenteditable.
   */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.isComposing) return;

    const target = event.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || target.isContentEditable) {
      return;
    }

    if (event.key === 'Escape') {
      this.handleEscapeKey();
      return;
    }

    if (event.altKey && this.tabShortcuts[event.key]) {
      event.preventDefault();
      this.appStateService.setActiveTab(this.tabShortcuts[event.key]);
      return;
    }
  }

  private handleEscapeKey(): void {
    // Close overlays first
    if (this.appStateService.modalContent()) {
      this.appStateService.modalContent.set(null);
      return;
    }
    if (this.appStateService.dialogContent()) {
      this.appStateService.dialogContent.set(null);
      return;
    }
    if (this.showCreateGroup()) {
      this.appStateService.showCreateGroup.set(false);
      this.focusCenterPanel();
      return;
    }
    if (this.showJoinGroup()) {
      this.appStateService.showJoinGroup.set(false);
      this.focusCenterPanel();
      return;
    }

    // Close thread or side panel
    if (this.showThread()) {
      this.navigationService.closeThreadPanel();
      this.focusCenterPanel();
      return;
    }
    if (this.sidePanelView() !== 'none') {
      this.navigationService.closeSidePanel();
      this.focusCenterPanel();
      return;
    }
  }

  private focusCenterPanel(): void {
    setTimeout(() => this.centerPanelRef?.nativeElement?.focus(), 0);
  }

  /**
   * Mobile panel focus management.
   * When on mobile and the visible panel changes, move focus to the new panel container.
   */
  private mobilePanelFocusEffect = effect(() => {
    const panel = this.mobilePanel();
    const mobile = this.isMobile();
    if (!mobile) return;

    // Use setTimeout to let the DOM update before focusing
    setTimeout(() => {
      switch (panel) {
        case 'selector':
          this.leftPanelRef?.nativeElement?.focus();
          break;
        case 'messages':
          this.centerPanelRef?.nativeElement?.focus();
          break;
        case 'side-panel':
          this.rightPanelRef?.nativeElement?.focus();
          break;
      }
    }, 0);
  },{ allowSignalWrites: true});

  /** Announce tab changes to screen readers */
  private tabAnnouncementEffect = effect(() => {
    const tab = this.appStateService.activeTab();
    const tabName = CometChatLocalize.getLocalizedString(tab);
    this.liveAnnouncer.announce(tabName);
  },{ allowSignalWrites: true});

  /** Announce mobile panel transitions to screen readers */
  private panelAnnouncementKeys: Record<string, string> = {
    'selector': 'panel_selector_announcement',
    'messages': 'panel_messages_announcement',
    'side-panel': 'panel_details_announcement',
  };

  private mobilePanelAnnouncementEffect = effect(() => {
    const panel = this.mobilePanel();
    const mobile = this.isMobile();
    if (!mobile) return;
    const key = this.panelAnnouncementKeys[panel];
    if (key) {
      this.liveAnnouncer.announce(CometChatLocalize.getLocalizedString(key));
    }
  },{ allowSignalWrites: true});

  /**
   * Track the last known container for modal overlay so we can
   * call closeDialog() when the signal becomes null (element is destroyed).
   */
  private lastModalContainer: HTMLElement | null = null;
  private lastDialogContainer: HTMLElement | null = null;

  /**
   * Modal overlay focus management.
   * When modalContent becomes non-null, open dialog focus trap on the modal container.
   * When it becomes null, close the dialog focus trap.
   */
  private modalFocusEffect = effect(() => {
    const modal = this.appStateService.modalContent();
    if (modal) {
      // Content just appeared — wait for DOM render, then open dialog
      setTimeout(() => {
        const container = this.modalOverlayRef?.nativeElement;
        if (container) {
          this.lastModalContainer = container;
          this.dialogFocusManager.openDialog({
            container,
            closeOnEscape: true,
            onEscape: () => this.appStateService.modalContent.set(null),
          });
        }
      }, 0);
    } else {
      // Content removed — close dialog on the last known container
      if (this.lastModalContainer) {
        this.dialogFocusManager.closeDialog(this.lastModalContainer);
        this.lastModalContainer = null;
      }
    }
  },{ allowSignalWrites: true});

  /**
   * Dialog overlay focus management.
   * When dialogContent becomes non-null, open dialog focus trap on the dialog container.
   * When it becomes null, close the dialog focus trap.
   */
  private dialogFocusEffect = effect(() => {
    const dialog = this.appStateService.dialogContent();
    if (dialog) {
      // Content just appeared — wait for DOM render, then open dialog
      setTimeout(() => {
        const container = this.dialogOverlayRef?.nativeElement;
        if (container) {
          this.lastDialogContainer = container;
          this.dialogFocusManager.openDialog({
            container,
            closeOnEscape: true,
            onEscape: () => this.appStateService.dialogContent.set(null),
          });
        }
      }, 0);
    } else {
      // Content removed — close dialog on the last known container
      if (this.lastDialogContainer) {
        this.dialogFocusManager.closeDialog(this.lastDialogContainer);
        this.lastDialogContainer = null;
      }
    }
  },{ allowSignalWrites: true});

  // ── Panel resize methods ──

  private loadStoredWidth(key: string): number | null {
    try {
      const val = sessionStorage.getItem(key);
      return val ? Number(val) : null;
    } catch {
      return null;
    }
  }

  private saveWidth(key: string, width: number): void {
    try {
      sessionStorage.setItem(key, String(Math.round(width)));
    } catch { /* storage full / unavailable */ }
  }

  protected onResizeStart(event: MouseEvent, panel: 'left' | 'right'): void {
    event.preventDefault();
    this.resizingPanel.set(panel);
    this.resizeStartX = event.clientX;

    const panelEl = panel === 'left'
      ? this.leftPanelRef?.nativeElement
      : this.rightPanelRef?.nativeElement;
    this.resizeStartWidth = panelEl?.getBoundingClientRect().width ?? 300;

    document.addEventListener('mousemove', this.boundOnResizeMove);
    document.addEventListener('mouseup', this.boundOnResizeEnd);
  }

  private onResizeMove(event: MouseEvent): void {
    const panel = this.resizingPanel();
    if (!panel) return;

    const containerWidth = this.leftPanelRef?.nativeElement?.parentElement?.clientWidth ?? window.innerWidth;
    const delta = event.clientX - this.resizeStartX;

    // Left handle: dragging right = wider left panel
    // Right handle: dragging left = wider right panel
    const newWidth = panel === 'left'
      ? this.resizeStartWidth + delta
      : this.resizeStartWidth - delta;

    // Get the other panel's current width
    const otherPanelEl = panel === 'left'
      ? this.rightPanelRef?.nativeElement
      : this.leftPanelRef?.nativeElement;
    const otherWidth = otherPanelEl?.getBoundingClientRect().width ?? 0;

    // Ensure center panel keeps minimum width (account for 2 resize handles = ~8px)
    const maxWidth = containerWidth - otherWidth - CometChatHomeComponent.MIN_CENTER_WIDTH - 8;

    const clamped = Math.max(
      CometChatHomeComponent.MIN_PANEL_WIDTH,
      Math.min(newWidth, maxWidth)
    );

    if (panel === 'left') {
      this.leftPanelWidth.set(clamped);
    } else {
      this.rightPanelWidth.set(clamped);
    }
  }

  private onResizeEnd(): void {
    const panel = this.resizingPanel();
    if (panel === 'left' && this.leftPanelWidth() !== null) {
      this.saveWidth(CometChatHomeComponent.STORAGE_KEY_LEFT, this.leftPanelWidth()!);
    } else if (panel === 'right' && this.rightPanelWidth() !== null) {
      this.saveWidth(CometChatHomeComponent.STORAGE_KEY_RIGHT, this.rightPanelWidth()!);
    }

    this.resizingPanel.set(null);
    document.removeEventListener('mousemove', this.boundOnResizeMove);
    document.removeEventListener('mouseup', this.boundOnResizeEnd);
  }

  // ── Lifecycle ──

  ngOnInit(): void {
    this.subscribeToGroupEvents();
    this.subscribeToUserEvents();
    this.subscribeToMessageEvents();
    this.subscribeToConversationEvents();
    this.subscribeToUIEvents();
    this.attachSDKGroupListener();
    this.attachLoginListener();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
    if (this.groupListenerId) {
      CometChat.removeGroupListener(this.groupListenerId);
    }
    if (this.loginListenerId) {
      CometChat.removeLoginListener(this.loginListenerId);
    }
    this.removeDeliveryMarkingListener();
    // Clean up resize listeners in case destroy happens mid-drag
    document.removeEventListener('mousemove', this.boundOnResizeMove);
    document.removeEventListener('mouseup', this.boundOnResizeEnd);
  }

  // ── Event subscriptions ──

  /**
   * Subscribe to CometChatGroupEvents:
   * - Group deleted → clear active chat if it was the affected group
   * - Group left → clear active chat if it was the affected group
   * - Group member joined → update active group state
   * - Toast notifications for member added/removed/banned/unbanned/scope changed/ownership changed
   */
  private subscribeToGroupEvents(): void {
    this.subscriptions.push(
      CometChatGroupEvents.ccGroupDeleted.subscribe((group: CometChat.Group) => {
        const activeGroup = this.chatStateService.getActiveGroup();
        if (activeGroup && activeGroup.getGuid() === group.getGuid()) {
          this.chatStateService.clearActiveChat();
          this.navigationService.reset();
        }
      })
    );

    this.subscriptions.push(
      CometChatGroupEvents.ccGroupLeft.subscribe((data) => {
        const activeGroup = this.chatStateService.getActiveGroup();
        if (activeGroup && activeGroup.getGuid() === data.leftGroup.getGuid()) {
          this.chatStateService.clearActiveChat();
          this.navigationService.reset();
        }
      })
    );

    // When a user joins a group, update the active group state
    this.subscriptions.push(
      CometChatGroupEvents.ccGroupMemberJoined.subscribe((data: IGroupMemberJoined) => {
        const activeGroup = this.chatStateService.getActiveGroup();
        if (activeGroup && activeGroup.getGuid() === data.joinedGroup.getGuid()) {
          this.chatStateService.setActiveGroup(data.joinedGroup);
        }
      })
    );

    // Toast notifications for group member events (matches React pattern)
    this.subscriptions.push(
      CometChatGroupEvents.ccOwnershipChanged.subscribe(() => {
        this.toastService.showSuccess(
          CometChatLocalize.getLocalizedString('ownership_transferred_successfully')
        );
      })
    );

    this.subscriptions.push(
      CometChatGroupEvents.ccGroupMemberScopeChanged.subscribe(() => {
        this.toastService.showSuccess(
          CometChatLocalize.getLocalizedString('permissions_updated_successfully')
        );
      })
    );

    this.subscriptions.push(
      CometChatGroupEvents.ccGroupMemberAdded.subscribe(() => {
        this.toastService.showSuccess(
          CometChatLocalize.getLocalizedString('member_added_toast')
        );
      })
    );

    this.subscriptions.push(
      CometChatGroupEvents.ccGroupMemberBanned.subscribe(() => {
        this.toastService.showSuccess(
          CometChatLocalize.getLocalizedString('member_banned_toast')
        );
      })
    );

    this.subscriptions.push(
      CometChatGroupEvents.ccGroupMemberUnbanned.subscribe(() => {
        this.toastService.showSuccess(
          CometChatLocalize.getLocalizedString('member_unbanned_toast')
        );
      })
    );

    this.subscriptions.push(
      CometChatGroupEvents.ccGroupMemberKicked.subscribe(() => {
        this.toastService.showSuccess(
          CometChatLocalize.getLocalizedString('member_removed_toast')
        );
      })
    );

    // ccGroupCreated — no-op at home level. The conversations list component
    // handles new-group display internally. Subscribed for completeness to
    // match React reference and allow future home-level handling if needed.
    this.subscriptions.push(
      CometChatGroupEvents.ccGroupCreated.subscribe(() => {}),
    );
  }

  /**
   * Subscribe to CometChatUserEvents:
   * - User blocked/unblocked → re-set the active user so the composer
   *   visibility computed signal re-evaluates with updated blockedByMe state
   */
  private subscribeToUserEvents(): void {
    this.subscriptions.push(
      CometChatUserEvents.ccUserBlocked.subscribe((user: CometChat.User) => {
        const activeUser = this.chatStateService.getActiveUser();
        if (activeUser && activeUser.getUid() === user.getUid()) {
          this.chatStateService.setActiveUser(user);
        }
      })
    );

    this.subscriptions.push(
      CometChatUserEvents.ccUserUnblocked.subscribe((user: CometChat.User) => {
        const activeUser = this.chatStateService.getActiveUser();
        if (activeUser && activeUser.getUid() === user.getUid()) {
          this.chatStateService.setActiveUser(user);
        }
      })
    );
  }

  /**
   * Subscribe to CometChatMessageEvents:
   * - Message sent → update fresh-chat state
   * - Message deleted → close thread panel if the deleted message was the thread parent
   * - SDK wrapper events → mark as delivered + update fresh-chat state for incoming messages
   * - No-op subscriptions for future use
   *
   * ── CometChatCallEvents ──
   * ccOutgoingCall, ccCallAccepted, ccCallRejected, ccCallEnded are UIKit-internal
   * events only. The sample app does NOT subscribe to them.
   *
   * ── AI Events (Future Work) ──
   * onAIAssistantMessageReceived, onAIToolResultReceived, onAIToolArgumentsReceived
   * are deferred to a future milestone when AI features are implemented.
   */
  private subscribeToMessageEvents(): void {
    this.subscriptions.push(
      // ── UI-level message events ──

      CometChatMessageEvents.ccMessageSent.subscribe((data: IMessages) => {
        this.updateFreshChatState(data);
      }),

      CometChatMessageEvents.ccMessageDeleted.subscribe((message: CometChat.BaseMessage) => {
        const threadMessage = this.navigationService.threadMessage();
        if (threadMessage && threadMessage.getId() === message.getId()) {
          this.navigationService.closeThreadPanel();
        }
      }),

      // No-op — future use
      CometChatMessageEvents.ccMessageEdited.subscribe(() => { /* future use */ }),
      CometChatMessageEvents.ccReplyToMessage.subscribe(() => { /* future use */ }),
      CometChatMessageEvents.ccMessageTranslated.subscribe(() => { /* future use */ }),
      CometChatMessageEvents.ccMessageRead.subscribe(() => { /* future use */ }),

      // ── SDK wrapper message events — incoming message handling ──

      CometChatMessageEvents.onTextMessageReceived.subscribe((msg: CometChat.TextMessage) => {
        this.markAsDeliveredIfNeeded(msg);
        this.updateFreshChatState(msg);
      }),
      CometChatMessageEvents.onMediaMessageReceived.subscribe((msg: CometChat.MediaMessage) => {
        this.markAsDeliveredIfNeeded(msg);
        this.updateFreshChatState(msg);
      }),
      CometChatMessageEvents.onCustomMessageReceived.subscribe((msg: CometChat.CustomMessage) => {
        this.markAsDeliveredIfNeeded(msg);
        this.updateFreshChatState(msg);
      }),

      // ── SDK wrapper message events — no-op (future use / UIKit handles internally) ──

      CometChatMessageEvents.onMessageModerated.subscribe(() => { /* future use */ }),
      CometChatMessageEvents.onTypingStarted.subscribe(() => { /* UIKit handles internally */ }),
      CometChatMessageEvents.onTypingEnded.subscribe(() => { /* UIKit handles internally */ }),
      CometChatMessageEvents.onMessagesDelivered.subscribe(() => { /* future use */ }),
      CometChatMessageEvents.onMessagesRead.subscribe(() => { /* future use */ }),
      CometChatMessageEvents.onMessagesDeliveredToAll.subscribe(() => { /* future use */ }),
      CometChatMessageEvents.onMessagesReadByAll.subscribe(() => { /* future use */ }),
      CometChatMessageEvents.onMessageEdited.subscribe(() => { /* future use */ }),
      CometChatMessageEvents.onMessageDeleted.subscribe(() => { /* future use */ }),
      CometChatMessageEvents.onMessageReactionAdded.subscribe(() => { /* future use */ }),
      CometChatMessageEvents.onMessageReactionRemoved.subscribe(() => { /* future use */ }),
      CometChatMessageEvents.onCustomInteractiveMessageReceived.subscribe(() => { /* future use */ }),
      CometChatMessageEvents.onFormMessageReceived.subscribe(() => { /* future use */ }),
      CometChatMessageEvents.onCardMessageReceived.subscribe(() => { /* future use */ }),
      CometChatMessageEvents.onSchedulerMessageReceived.subscribe(() => { /* future use */ }),
    );
  }

  /**
   * Marks an incoming message as delivered if:
   * 1. The sender is not the logged-in user
   * 2. The message has no deliveredAt timestamp
   * 3. No message list is currently open for that sender
   *    (i.e., the active user/group doesn't match the message sender/receiver)
   *
   * Matches React's onMessageReceived delivery marking pattern.
   */
  private markAsDeliveredIfNeeded(message: CometChat.BaseMessage): void {
    const loggedInUser = CometChatUIKit.getLoggedInUser();
    if (!loggedInUser) return;

    const senderUid = message.getSender()?.getUid();
    if (senderUid === loggedInUser.getUid()) return;
    if (message.getDeliveredAt()) return;

    // Check if a message list is open for the sender's conversation
    const activeUser = this.chatStateService.getActiveUser();
    const activeGroup = this.chatStateService.getActiveGroup();
    const receiverType = message.getReceiverType();

    if (receiverType === 'user' && activeUser && senderUid === activeUser.getUid()) {
      return; // Message list is open for this sender — UIKit handles delivery
    }
    if (receiverType === 'group' && activeGroup && message.getReceiverId() === activeGroup.getGuid()) {
      return; // Message list is open for this group — UIKit handles delivery
    }

    CometChat.markAsDelivered(message).catch(console.error);
  }

  /**
   * Subscribe to CometChatConversationEvents:
   * - Conversation deleted → clear active chat if it was the affected conversation
   *
   * ── Missing Conversation Events (Future Work) ──
   * ccUpdateConversation and ccMarkConversationAsRead are not yet defined in the
   * Angular UIKit's CometChatConversationEvents class. Wire when available.
   */
  private subscribeToConversationEvents(): void {
    this.subscriptions.push(
      CometChatConversationEvents.ccConversationDeleted.subscribe(
        (conversation: CometChat.Conversation) => {
          const activeUser = this.chatStateService.getActiveUser();
          const activeGroup = this.chatStateService.getActiveGroup();
          const conversationWith = conversation.getConversationWith();

          const isAffected =
            (activeUser && conversationWith instanceof CometChat.User &&
              activeUser.getUid() === conversationWith.getUid()) ||
            (activeGroup && conversationWith instanceof CometChat.Group &&
              activeGroup.getGuid() === conversationWith.getGuid());

          if (isAffected) {
            this.chatStateService.clearActiveChat();
            this.navigationService.reset();
          }
        }
      )
    );
  }

  /**
   * Subscribe to CometChatUIEvents:
   * - Active chat changed → update active entity
   * - Open chat → set active user or group (fired from "message privately" in message list)
   * - Mouse event → handle mention clicks / group member clicks to open DM
   * - Show/hide panel, modal, dialog, ongoing call → update AppStateService signals
   * - Compose message, mentions warning, active popover → no-op (UIKit handles internally)
   */
  private subscribeToUIEvents(): void {
    this.subscriptions.push(
      CometChatUIEvents.ccActiveChatChanged.subscribe((data) => {
        this.navigationService.setGotoMessageId(null);
        //  Only close the side panel if the active entity actually changed.
        // If the same user/group is already active, messages just finished loading —
        // don't close the info/details panel in that case.
        const currentUser = this.chatStateService.getActiveUser();
        const currentGroup = this.chatStateService.getActiveGroup();
        const entityChanged =
          (data.user && currentUser?.getUid() !== data.user.getUid()) ||
          (data.group && currentGroup?.getGuid() !== data.group.getGuid()) ||
          (!data.user && !data.group);
        if (data.user) {
          this.chatStateService.setActiveUser(data.user);
        } else if (data.group) {
          this.chatStateService.setActiveGroup(data.group);
        }
        this.navigationService.closeThreadPanel();
        if (entityChanged) {
          this.navigationService.closeSidePanel();
        }
      })
    );

    this.subscriptions.push(
      CometChatUIEvents.ccOpenChat.subscribe((data) => {
        this.navigationService.setGotoMessageId(null);
        if (data.user) {
          this.openChatForUser(data.user);
        } else if (data.group) {
          this.chatStateService.setActiveGroup(data.group);
          this.navigationService.closeThreadPanel();
          this.navigationService.closeSidePanel();
        }
      })
    );

    // Handle mention clicks and group member clicks to open DM
    // (matches React's ccMouseEvent → CometChatUserGroupMembersObject pattern)
    this.subscriptions.push(
      CometChatUIEvents.ccMouseEvent.subscribe((mouseEvent: IMouseEvent) => {
        if (
          mouseEvent.event.type === 'click' &&
          mouseEvent.body?.['CometChatUserGroupMembersObject']
        ) {
          this.openChatForUser(
            mouseEvent.body['CometChatUserGroupMembersObject'] as CometChat.User
          );
        }
      })
    );

    // ── Panel / Modal / Dialog / Ongoing Call overlays ──

    this.subscriptions.push(
      CometChatUIEvents.ccShowPanel.subscribe((panel: IPanel) => {
        this.appStateService.panelContent.set(panel);
      }),
      CometChatUIEvents.ccHidePanel.subscribe(() => {
        this.appStateService.panelContent.set(null);
      }),
      CometChatUIEvents.ccShowModal.subscribe((modal: IModal) => {
        this.appStateService.modalContent.set(modal);
      }),
      CometChatUIEvents.ccHideModal.subscribe(() => {
        this.appStateService.modalContent.set(null);
      }),
      CometChatUIEvents.ccShowDialog.subscribe((dialog: IDialog) => {
        this.appStateService.dialogContent.set(dialog);
      }),
      CometChatUIEvents.ccHideDialog.subscribe(() => {
        this.appStateService.dialogContent.set(null);
      }),
      CometChatUIEvents.ccShowOngoingCall.subscribe((data: IShowOngoingCall) => {
        this.appStateService.ongoingCallContent.set(data);
      }),
      CometChatCallEvents.ccCallEnded.subscribe(() => {
        this.appStateService.ongoingCallContent.set(null);
      }),
    );

    // ── No-op subscriptions — UIKit handles internally / future use ──

    this.subscriptions.push(
      CometChatUIEvents.ccComposeMessage.subscribe(() => { /* UIKit composer handles internally */ }),
      CometChatUIEvents.ccShowMentionsCountWarning.subscribe(() => { /* UIKit composer handles internally */ }),
      CometChatUIEvents.ccActivePopover.subscribe(() => { /* future use */ }),
    );
  }

  /**
   * Opens a DM chat with the given user.
   * Matches React's openChatForUser logic:
   * - Skips if the user is the logged-in user
   * - On chats tab: fetches conversation and sets it, or opens fresh chat
   * - On users tab: sets user directly
   * - On groups tab: sets user as new chat target
   */
  private openChatForUser(user?: CometChat.User): void {
    if (!user) return;
    const loggedInUser = CometChatUIKit.getLoggedInUser();
    if (loggedInUser && user.getUid() === loggedInUser.getUid()) return;

    this.navigationService.setGotoMessageId(null);
    this.navigationService.closeThreadPanel();
    this.navigationService.closeSidePanel();
    this.appStateService.showNewChat.set(false);

    this.appStateService.setSelectedUser(user);
  }

  /**
   * Attach SDK GroupListener for real-time group member events.
   *
   * Kicked/banned: shows alert when the logged-in user is removed from the active group.
   * Scope changed / added / joined / left: keeps the active group object in sync
   * (matches React's SideComponentGroup + BannedOrKickedMembers patterns).
   */
  private attachSDKGroupListener(): void {
    this.groupListenerId = `HomeGroupListener_${Date.now()}`;
    const loggedInUser = CometChatUIKit.getLoggedInUser();

    CometChat.addGroupListener(
      this.groupListenerId,
      new CometChat.GroupListener({
        onGroupMemberBanned: (
          _message: CometChat.Action,
          bannedUser: CometChat.User,
          _bannedBy: CometChat.User,
          bannedFrom: CometChat.Group
        ) => {
          this.updateActiveGroupIfMatch(bannedFrom);

          if (!loggedInUser || bannedUser.getUid() !== loggedInUser.getUid()) return;
          if (!this.isActiveGroup(bannedFrom)) return;

          this.toastService.showError(
            `${CometChatLocalize.getLocalizedString('you_have_been')} ${CometChatLocalize.getLocalizedString('member_banned_toast')} ${CometChatLocalize.getLocalizedString('removed_by_admin')}`
          );
          this.chatStateService.clearActiveChat();
          this.navigationService.reset();
        },
        onGroupMemberKicked: (
          _message: CometChat.Action,
          kickedUser: CometChat.User,
          _kickedBy: CometChat.User,
          kickedFrom: CometChat.Group
        ) => {
          this.updateActiveGroupIfMatch(kickedFrom);

          if (!loggedInUser || kickedUser.getUid() !== loggedInUser.getUid()) return;
          if (!this.isActiveGroup(kickedFrom)) return;

          this.toastService.showError(
            `${CometChatLocalize.getLocalizedString('you_have_been')} ${CometChatLocalize.getLocalizedString('member_removed_toast')} ${CometChatLocalize.getLocalizedString('removed_by_admin')}`
          );
          this.chatStateService.clearActiveChat();
          this.navigationService.reset();
        },
        onGroupMemberScopeChanged: (
          _message: CometChat.Action,
          _changedUser: CometChat.User,
          _newScope: CometChat.GroupMemberScope,
          _oldScope: CometChat.GroupMemberScope,
          changedGroup: CometChat.Group
        ) => {
          this.updateActiveGroupIfMatch(changedGroup);
        },
        onMemberAddedToGroup: (
          _message: CometChat.Action,
          _userAdded: CometChat.User,
          _userAddedBy: CometChat.User,
          userAddedIn: CometChat.Group
        ) => {
          this.updateActiveGroupIfMatch(userAddedIn);
        },
        onGroupMemberJoined: (
          _message: CometChat.Action,
          _joinedUser: CometChat.User,
          joinedGroup: CometChat.Group
        ) => {
          this.updateActiveGroupIfMatch(joinedGroup);
        },
        onGroupMemberLeft: (
          _message: CometChat.Action,
          _leavingUser: CometChat.User,
          group: CometChat.Group
        ) => {
          this.updateActiveGroupIfMatch(group);
        },
      })
    );
  }

  /**
   * If the given group matches the currently active group,
   * update the ChatStateService so all consumers get the latest
   * member count, scope, owner, etc.
   */
  private updateActiveGroupIfMatch(group: CometChat.Group): void {
    if (this.isActiveGroup(group)) {
      this.chatStateService.setActiveGroup(group);
    }
  }

  /**
   * Attach SDK LoginListener to clear state on logout.
   * Matches React's HomeLoginListener pattern.
   */
  private attachLoginListener(): void {
    this.loginListenerId = `HomeLoginListener_${Date.now()}`;
    CometChat.addLoginListener(
      this.loginListenerId,
      new CometChat.LoginListener({
        logoutSuccess: () => {
          this.chatStateService.clearActiveChat();
          this.navigationService.reset();
          this.appStateService.reset();
        },
      })
    );
  }

  /**
   * Attach SDK MessageListener when no message list is open.
   * Marks incoming messages as delivered so the sender sees delivery receipts
   * even when the recipient is on a different tab.
   *
   * Managed reactively by the deliveryListenerEffect — attached when
   * activeTab !== 'chats' AND no active user/group; removed otherwise.
   */
  private attachDeliveryMarkingListener(): void {
    this.removeDeliveryMarkingListener();
    this.messageListenerId = `HomeDeliveryListener_${Date.now()}`;

    CometChat.addMessageListener(
      this.messageListenerId,
      new CometChat.MessageListener({
        onTextMessageReceived: (msg: CometChat.TextMessage) =>
          this.markAsDelivered(msg),
        onMediaMessageReceived: (msg: CometChat.MediaMessage) =>
          this.markAsDelivered(msg),
        onCustomMessageReceived: (msg: CometChat.CustomMessage) =>
          this.markAsDelivered(msg),
      })
    );
  }

  private removeDeliveryMarkingListener(): void {
    if (this.messageListenerId) {
      CometChat.removeMessageListener(this.messageListenerId);
      this.messageListenerId = '';
    }
  }

  /**
   * Marks a message as delivered if the sender is not the logged-in user
   * and the message hasn't been delivered yet.
   * Used by the SDK delivery marking listener.
   */
  private markAsDelivered(message: CometChat.BaseMessage): void {
    const loggedInUser = CometChatUIKit.getLoggedInUser();
    if (
      message.getSender()?.getUid() !== loggedInUser?.getUid() &&
      !message.getDeliveredAt()
    ) {
      CometChat.markAsDelivered(message).catch(console.error);
    }
  }

  /**
   * Handles click on the modal backdrop — hides the modal.
   * Called from the template when the user clicks outside the modal content.
   */
  protected onModalBackdropClick(): void {
    this.appStateService.modalContent.set(null);
  }

  /** Called when the ongoing call ends (from the ongoing-call component output). */
  protected onOngoingCallEnded(): void {
    this.appStateService.ongoingCallContent.set(null);
  }

  /** Extracts the session ID from the ongoing call event data. */
  protected getOngoingCallSessionId(data: IShowOngoingCall): string {
    const child = data?.child;
    // For 1:1 calls: child is a CometChat.Call with getSessionId()
    if (child && typeof (child as any).getSessionId === 'function') {
      return (child as any).getSessionId() || '';
    }
    // For group calls initiated from call-buttons: child is a CometChat.Group with getGuid()
    if (child && typeof (child as any).getGuid === 'function') {
      return (child as any).getGuid() || '';
    }
    // For meeting joins: child is null — the call-buttons component handles this inline
    return '';
  }

  /** Check if the given group is the currently active group. */
  private isActiveGroup(group: CometChat.Group): boolean {
    const activeGroup = this.chatStateService.getActiveGroup();
    return !!activeGroup && activeGroup.getGuid() === group.getGuid();
  }

  /**
   * Updates fresh-chat state when a message is sent or received.
   * When the first message arrives for a fresh conversation,
   * fetches the conversation object and updates ChatStateService.
   *
   * Matches React's updateisFirstChat pattern.
   */
  private updateFreshChatState(data: IMessages | CometChat.BaseMessage): void {
    if (!this.appStateService.isFreshChat()) return;

    const message = (data as IMessages)?.message ?? (data as CometChat.BaseMessage);
    const status = (data as IMessages)?.status;

    // Only process successful sends (ignore inprogress/error)
    if (status !== undefined && status !== MessageStatus.success) return;

    const activeUser = this.chatStateService.getActiveUser();
    const activeGroup = this.chatStateService.getActiveGroup();
    const receiverId = message.getReceiverId?.();
    const senderId = message.getSender?.()?.getUid?.();
    const loggedInUid = CometChatUIKit.getLoggedInUser()?.getUid();

    const isRelevant =
      (activeUser &&
        (activeUser.getUid() === receiverId ||
          (senderId === activeUser.getUid() && receiverId === loggedInUid))) ||
      (activeGroup &&
        (activeGroup.getGuid() === receiverId || loggedInUid === receiverId));

    if (!isRelevant) return;

    this.appStateService.isFreshChat.set(false);

    const convWith = activeUser?.getUid() ?? activeGroup?.getGuid();
    const convType = activeUser ? 'user' : 'group';
    if (!convWith) return;

    CometChat.getConversation(convWith, convType).then(
      (conversation) => this.chatStateService.setActiveConversation(conversation)
    ).catch(console.error);
  }
}
