import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroupEvents, TranslatePipe } from '@cometchat/chat-uikit-angular';
import { GroupService } from '../../services/group.service';
import { AppStateService } from '../../services/app-state.service';
import { NavigationService } from '../../services/navigation.service';

/**
 * CometChatCreateGroupComponent
 *
 * Dialog form for creating a new group. Supports public, private,
 * and password-protected group types. On success, closes the dialog
 * and selects the newly created group.
 */
@Component({
  selector: 'cometchat-create-group',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './cometchat-create-group.component.html',
  styleUrls: ['./cometchat-create-group.component.css'],
})
export class CometChatCreateGroupComponent {
  private groupService = inject(GroupService);
  private appStateService = inject(AppStateService);
  private navigationService = inject(NavigationService);

  /** Form field: group name */
  protected groupName = signal('');

  /** Form field: group type */
  protected groupType = signal<string>(CometChat.GROUP_TYPE.PUBLIC);

  /** Form field: password (only for password-protected groups) */
  protected password = signal('');

  /** Toggle password visibility */
  protected showPassword = signal(false);

  /** Loading state during group creation */
  protected loading = signal(false);

  /** Whether the password field should be visible */
  protected get showPasswordField(): boolean {
    return this.groupType() === CometChat.GROUP_TYPE.PASSWORD;
  }

  /** Whether the form can be submitted */
  protected get canSubmit(): boolean {
    const name = this.groupName().trim();
    if (!name) return false;
    if (this.showPasswordField && !this.password().trim()) return false;
    return !this.loading();
  }

  /** Available group type options */
  protected readonly groupTypes = [
    { value: CometChat.GROUP_TYPE.PUBLIC, labelKey: 'create_group_type_public' },
    { value: CometChat.GROUP_TYPE.PRIVATE, labelKey: 'create_group_type_private' },
    { value: CometChat.GROUP_TYPE.PASSWORD, labelKey: 'create_group_type_password' },
  ];

  /** Update group name from input */
  onNameChange(value: string): void {
    this.groupName.set(value);
  }

  /** Update group type from select */
  onTypeChange(value: string): void {
    this.groupType.set(value);
    if (value !== CometChat.GROUP_TYPE.PASSWORD) {
      this.password.set('');
    }
  }

  /** Update password from input */
  onPasswordChange(value: string): void {
    this.password.set(value);
  }

  /** Toggle password visibility */
  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  /** Close the create group dialog */
  onClose(): void {
    this.appStateService.showCreateGroup.set(false);
  }

  /** Submit the form to create a new group */
  async onSubmit(): Promise<void> {
    if (!this.canSubmit || this.loading()) return;

    this.loading.set(true);

    try {
      const type = this.groupType();
      const pw = type === CometChat.GROUP_TYPE.PASSWORD ? this.password().trim() : undefined;
      const group = await this.groupService.createGroup(this.groupName().trim(), type, pw);

      // Close dialog and select the new group
      this.appStateService.showCreateGroup.set(false);
      this.appStateService.activeTab.set('groups');
      this.appStateService.setSelectedGroup(group);
      CometChatGroupEvents.publishGroupCreated(group);

      // Navigate to messages on mobile
      if (this.navigationService.isMobile()) {
        this.navigationService.navigateToMessages();
      }
    } catch {
      // GroupService already shows error toast
    } finally {
      this.loading.set(false);
    }
  }
}
