import { Component, EventEmitter, inject, Output, signal, ViewEncapsulation } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  ChatStateService,
  CometChatGroupEvents,
  CometChatGroupMembersComponent,
  CometChatRadioButtonComponent,
  CometChatUIKit,
  SelectionMode,
  TranslatePipe,
} from '@cometchat/chat-uikit-angular';
import { GroupService } from '../../services/group.service';

/**
 * CometChatTransferOwnershipComponent
 *
 * Side panel for transferring group ownership. Uses the UIKit's
 * `<cometchat-group-members>` component internally to render the
 * member list, with a custom trailingView that shows radio buttons
 * for selecting the new owner (excluding the current owner).
 *
 * Follows the same pattern as the React UIKit's TransferOwnership component.
 */
@Component({
  selector: 'cometchat-transfer-ownership',
  standalone: true,
  imports: [
    CometChatGroupMembersComponent,
    CometChatRadioButtonComponent,
    TranslatePipe,
  ],
  templateUrl: './cometchat-transfer-ownership.component.html',
  styleUrls: ['./cometchat-transfer-ownership.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CometChatTransferOwnershipComponent {
  private chatStateService = inject(ChatStateService);
  private groupService = inject(GroupService);

  /** Active group from ChatStateService */
  protected group = this.chatStateService.activeGroup;

  /** Emitted when the user clicks the back/close button */
  @Output() closeClick = new EventEmitter<void>();

  /** Expose SelectionMode for the template */
  protected readonly SelectionMode = SelectionMode;

  /** Currently selected member for ownership transfer */
  protected selectedMember = signal<CometChat.GroupMember | null>(null);

  /** Loading state for transfer action */
  protected transferLoading = signal(false);

  /** Error state for transfer action */
  protected transferError = signal(false);

  /** Close the modal */
  onClose(): void {
    this.closeClick.emit();
  }

  /** Handle radio button selection for a member */
  onSelectMember(member: CometChat.GroupMember): void {
    this.selectedMember.set(member);
  }

  /** Check if a member is the group owner (should be excluded from selection) */
  isOwner(member: CometChat.GroupMember): boolean {
    const g = this.group();
    if (!g) return false;
    return g.getOwner() === member.getUid();
  }

  /** Check if a member is currently selected */
  isSelected(member: CometChat.GroupMember): boolean {
    return this.selectedMember()?.getUid() === member.getUid();
  }

  /** Transfer ownership to the selected member */
  async onTransfer(): Promise<void> {
    const g = this.group();
    const member = this.selectedMember();
    if (!g || !member || this.transferLoading()) return;

    this.transferLoading.set(true);
    this.transferError.set(false);

    try {
      await this.groupService.transferOwnership(g.getGuid(), member.getUid());

      // Emit ccOwnershipChanged event so other components update
      const loggedInUser = CometChatUIKit.getLoggedInUser();
      if (loggedInUser) {
        // Update the in-memory group object with the new owner. The previous
        // owner (the logged-in user) is no longer the owner, so the new owner's
        // member scope is promoted to admin and the group's owner reference is
        // updated. group-details listens to ccOwnershipChanged to refresh the
        // active-group signal so owner-only UI (delete group, add members,
        // transfer-on-leave) stops showing for the previous owner.
        const updatedGroup = g;
        updatedGroup.setOwner(member.getUid());
        member.setScope(CometChat.GROUP_MEMBER_SCOPE.ADMIN as CometChat.GroupMemberScope);

        CometChatGroupEvents.ccOwnershipChanged.next({
          group: updatedGroup,
          newOwner: member,
        });
      }

      this.closeClick.emit();
    } catch {
      this.transferError.set(true);
      // GroupService already shows error toast
    } finally {
      this.transferLoading.set(false);
    }
  }
}
