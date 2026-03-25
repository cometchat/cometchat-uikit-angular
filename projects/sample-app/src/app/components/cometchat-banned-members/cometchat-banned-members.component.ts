import { Component, inject, OnInit, OnDestroy, OnChanges, SimpleChanges, signal, ViewChild, ElementRef, AfterViewInit, Input, booleanAttribute } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  ChatStateService,
  CometChatAvatarComponent,
  CometChatGroupEvents,
  CometChatUIKit,
  CometChatUIKitConstants,
  TranslatePipe,
} from '@cometchat/chat-uikit-angular';
import { GroupService } from '../../services/group.service';
import { NavigationService } from '../../services/navigation.service';

/**
 * CometChatBannedMembersComponent
 *
 * Displays banned members for a group with unban functionality.
 * Can be used as a standalone side panel or embedded inline (with hideHeader).
 * Uses IntersectionObserver for infinite scroll pagination.
 */
@Component({
  selector: 'cometchat-banned-members',
  standalone: true,
  imports: [TranslatePipe, CometChatAvatarComponent],
  templateUrl: './cometchat-banned-members.component.html',
  styleUrls: ['./cometchat-banned-members.component.css'],
})
export class CometChatBannedMembersComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  private chatStateService = inject(ChatStateService);
  private groupService = inject(GroupService);
  private navigationService = inject(NavigationService);

  /** Optional group input - if not provided, uses ChatStateService.activeGroup */
  @Input() group?: CometChat.Group;

  /** Hide the header (back button + title) for inline/embedded usage */
  @Input({ transform: booleanAttribute }) hideHeader = false;

  /** Reference to the scroll bottom anchor for IntersectionObserver */
  @ViewChild('scrollBottomAnchor') scrollBottomAnchor?: ElementRef<HTMLElement>;

  /** Reference to the list container */
  @ViewChild('listContainer') listContainer?: ElementRef<HTMLElement>;

  /** Get the effective group (input or from ChatStateService) */
  protected getGroup(): CometChat.Group | null {
    return this.group ?? this.chatStateService.activeGroup();
  }

  /** List of banned members */
  protected bannedMembers = signal<CometChat.GroupMember[]>([]);

  /** Loading state */
  protected loading = signal(false);

  /** Whether there are more members to load */
  protected hasMore = signal(true);

  /** Error state */
  protected error = signal(false);

  /** Set of UIDs currently being unbanned (for per-item loading state) */
  protected unbanningUids = signal<Set<string>>(new Set());

  /** SDK request builder for paginated fetching */
  private bannedMembersRequest: CometChat.BannedMembersRequest | null = null;

  /** IntersectionObserver for detecting scroll to bottom */
  private scrollBottomObserver?: IntersectionObserver;

  ngOnInit(): void {
    this.initRequest();
    this.fetchBannedMembers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['group'] && !changes['group'].firstChange) {
      // Group changed - reset and refetch
      this.bannedMembers.set([]);
      this.hasMore.set(true);
      this.scrollBottomObserver?.disconnect();
      this.initRequest();
      this.fetchBannedMembers();
      setTimeout(() => this.setupIntersectionObserver(), 0);
    }
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.bannedMembersRequest = null;
    this.scrollBottomObserver?.disconnect();
  }

  /** Close the side panel */
  onClose(): void {
    this.navigationService.closeSidePanel();
  }

  /** Setup IntersectionObserver for infinite scroll */
  private setupIntersectionObserver(): void {
    if (this.scrollBottomAnchor?.nativeElement) {
      this.scrollBottomObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && this.hasMore() && !this.loading()) {
            this.fetchBannedMembers();
          }
        },
        {
          root: this.listContainer?.nativeElement,
          threshold: 0.1,
        }
      );
      this.scrollBottomObserver.observe(this.scrollBottomAnchor.nativeElement);
    }
  }

  /** Unban a member from the group */
  async onUnban(member: CometChat.GroupMember): Promise<void> {
    const g = this.getGroup();
    if (!g) return;

    const uid = member.getUid();

    // Mark this UID as unbanning
    this.unbanningUids.update((current) => {
      const updated = new Set(current);
      updated.add(uid);
      return updated;
    });

    try {
      await this.groupService.unbanMember(g.getGuid(), uid);

      // Emit ccGroupMemberUnbanned so action message appears in message list
      const loggedInUser = CometChatUIKit.getLoggedInUser();
      if (loggedInUser) {
        const action = new CometChat.Action(
          g.getGuid(),
          CometChatUIKitConstants.MessageTypes.groupMember,
          CometChat.RECEIVER_TYPE.GROUP,
          CometChatUIKitConstants.MessageCategory.action as CometChat.MessageCategory
        );
        action.setAction(CometChatUIKitConstants.groupMemberAction.UNBANNED);
        action.setActionBy(loggedInUser);
        action.setActionOn(member);
        action.setActionFor(g);
        action.setReceiver(g);
        action.setSender(loggedInUser);
        action.setConversationId('group_' + g.getGuid());
        action.setMessage(`${loggedInUser.getName()} unbanned ${member.getName()}`);
        action.setSentAt(Math.floor(Date.now() / 1000));

        CometChatGroupEvents.ccGroupMemberUnbanned.next({
          message: action,
          unbannedUser: member,
          unbannedBy: loggedInUser,
          unbannedFrom: g,
        });
      }

      // Remove the unbanned member from the list
      this.bannedMembers.update((current) =>
        current.filter((m) => m.getUid() !== uid)
      );
    } catch {
      // GroupService already shows error toast
    } finally {
      this.unbanningUids.update((current) => {
        const updated = new Set(current);
        updated.delete(uid);
        return updated;
      });
    }
  }

  /** Check if a member is currently being unbanned */
  isUnbanning(member: CometChat.GroupMember): boolean {
    return this.unbanningUids().has(member.getUid());
  }

  /** Initialize the SDK request builder */
  private initRequest(): void {
    const g = this.getGroup();
    if (!g) return;

    this.bannedMembersRequest = new CometChat.BannedMembersRequestBuilder(g.getGuid())
      .setLimit(30)
      .build();
  }

  /** Fetch the next page of banned members */
  private async fetchBannedMembers(): Promise<void> {
    if (!this.bannedMembersRequest) return;

    this.loading.set(true);
    this.error.set(false);

    try {
      const members = await this.bannedMembersRequest.fetchNext();
      if (members.length === 0) {
        this.hasMore.set(false);
      } else {
        this.bannedMembers.update((current) => {
          const existingUids = new Set(current.map((m) => m.getUid()));
          const newMembers = members.filter((m) => !existingUids.has(m.getUid()));
          return [...current, ...newMembers];
        });

        // If fewer than the page size were returned, no more pages available
        if (members.length < 30) {
          this.hasMore.set(false);
        }
      }
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
