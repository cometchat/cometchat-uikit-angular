import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, CometChatAvatarComponent } from '@cometchat/chat-uikit-angular';
import { GroupService } from '../../services/group.service';
import { AppStateService } from '../../services/app-state.service';
import { NavigationService } from '../../services/navigation.service';

/**
 * CometChatJoinGroupComponent
 *
 * Dialog for joining a password-protected group. Reads the pending
 * group from AppStateService, accepts a password, and delegates
 * to GroupService.joinGroup(). On success, closes the dialog and
 * selects the joined group.
 */
@Component({
  selector: 'cometchat-join-group',
  standalone: true,
  imports: [FormsModule, TranslatePipe, CometChatAvatarComponent],
  templateUrl: './cometchat-join-group.component.html',
  styleUrls: ['./cometchat-join-group.component.css'],
})
export class CometChatJoinGroupComponent {
  private groupService = inject(GroupService);
  private appStateService = inject(AppStateService);
  private navigationService = inject(NavigationService);

  /** The group pending join (read from AppStateService) */
  protected pendingGroup = this.appStateService.pendingJoinGroup;

  /** Form field: password */
  protected password = signal('');

  /** Toggle password visibility */
  protected showPassword = signal(false);

  /** Loading state during join */
  protected loading = signal(false);

  /** Whether the form can be submitted */
  protected get canSubmit(): boolean {
    return !!this.password().trim() && !this.loading();
  }

  /** Update password from input */
  onPasswordChange(value: string): void {
    this.password.set(value);
  }

  /** Toggle password visibility */
  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  /** Close the join group dialog */
  onClose(): void {
    this.appStateService.showJoinGroup.set(false);
    this.appStateService.pendingJoinGroup.set(null);
  }

  /** Submit the form to join the group */
  async onSubmit(): Promise<void> {
    const group = this.pendingGroup();
    if (!this.canSubmit || this.loading() || !group) return;

    this.loading.set(true);

    try {
      const joined = await this.groupService.joinGroup(
        group.getGuid(),
        group.getType(),
        this.password().trim()
      );

      // Close dialog and select the joined group
      this.appStateService.showJoinGroup.set(false);
      this.appStateService.pendingJoinGroup.set(null);
      this.appStateService.setSelectedGroup(joined);
      this.appStateService.setActiveTab('groups');

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
