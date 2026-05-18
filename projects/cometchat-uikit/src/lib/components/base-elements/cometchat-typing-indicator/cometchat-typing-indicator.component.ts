import { Component, Input, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { TranslatePipe } from '../../../resources/CometChatLocalize/translate.pipe';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';

/**
 * CometChatTypingIndicatorComponent displays a typing indicator when users are typing.
 *
 * This component shows different text based on the context:
 * - 1-on-1 chats: "typing..." or "{name} is typing..."
 * - Group chats with one user: "{name} is typing..."
 * - Group chats with multiple users: "Multiple people are typing..."
 *
 * The component includes animated dots to indicate ongoing typing activity.
 *
 * @example
 * ```html
 * <!-- Basic usage -->
 * <cometchat-typing-indicator
 *   [typingUsers]="typingUsersArray"
 *   [isGroupChat]="false">
 * </cometchat-typing-indicator>
 *
 * <!-- Group chat usage -->
 * <cometchat-typing-indicator
 *   [typingUsers]="typingUsersArray"
 *   [isGroupChat]="true">
 * </cometchat-typing-indicator>
 * ```
 *
 * @see Requirement 1.1 - Display typing indicator when another user is typing
 * @see Requirement 1.2 - Show user's name or "typing..." for 1-on-1 chats
 * @see Requirement 1.3 - Show "{name} is typing..." for group chats
 * @see Requirement 1.4 - Show "Multiple people are typing..." for multiple users
 * @see Requirement 1.6 - Positioned at bottom of message list
 */
@Component({
  selector: 'cometchat-typing-indicator',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './cometchat-typing-indicator.component.html',
  styleUrls: ['./cometchat-typing-indicator.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatTypingIndicatorComponent {
  /**
   * Array of users currently typing.
   * Each TypingIndicator contains information about the user who is typing.
   *
   * @see Requirement 1.1 - Display typing indicator when another user is typing
   */
  @Input()
  set typingUsers(value: CometChat.TypingIndicator[]) {
    this.typingUsersSignal.set(value);
  }
  get typingUsers(): CometChat.TypingIndicator[] {
    return this.typingUsersSignal();
  }

  /**
   * Whether this is a group conversation.
   * Affects how the typing text is displayed.
   *
   * @see Requirement 1.2 - Different display for 1-on-1 vs group chats
   * @see Requirement 1.3 - Show "{name} is typing..." for group chats
   */
  @Input()
  set isGroupChat(value: boolean) {
    this.isGroupChatSignal.set(value);
  }
  get isGroupChat(): boolean {
    return this.isGroupChatSignal();
  }

  /** Internal signal for typing users */
  private typingUsersSignal = signal<CometChat.TypingIndicator[]>([]);

  /** Internal signal for group chat flag */
  private isGroupChatSignal = signal<boolean>(false);

  /**
   * Computed display text based on typing users and chat type.
   *
   * Logic:
   * - No typing users: empty string (component should be hidden)
   * - 1-on-1 chat: "typing..." (uses message_header_typing key)
   * - Group chat with 1 user: "{name} is typing..." (uses message_header_is_typing key)
   * - Group chat with 2 users: "{name1} and {name2} are typing..." (uses message_header_are_typing key)
   * - Group chat with 3+ users: "Multiple people are typing..." (uses message_header_others_typing key)
   *
   * @see Requirement 1.2 - Show "typing..." for 1-on-1 chats
   * @see Requirement 1.3 - Show "{name} is typing..." for group chats
   * @see Requirement 1.4 - Show "Multiple people are typing..." for multiple users
   */
  displayText = computed<string>(() => {
    const users = this.typingUsersSignal();
    const isGroup = this.isGroupChatSignal();

    if (!users || users.length === 0) {
      return '';
    }

    // For 1-on-1 chats, just show "typing..."
    if (!isGroup) {
      return 'message_header_typing';
    }

    // For group chats, show name(s)
    if (users.length === 1) {
      // Single user typing in group: "{name} is typing..."
      return 'message_header_is_typing';
    } else if (users.length === 2) {
      // Two users typing: "{name1} and {name2} are typing..."
      return 'message_header_are_typing';
    } else {
      // Multiple users (3+): "Multiple people are typing..."
      return 'message_header_others_typing';
    }
  });

  /**
   * Get the name of the first typing user.
   * Used for single user typing display.
   */
  get firstTypingUserName(): string {
    const users = this.typingUsersSignal();
    if (users && users.length > 0) {
      const sender = users[0].getSender();
      return sender?.getName() || '';
    }
    return '';
  }

  /**
   * Get the name of the second typing user.
   * Used for two users typing display.
   */
  get secondTypingUserName(): string {
    const users = this.typingUsersSignal();
    if (users && users.length > 1) {
      const sender = users[1].getSender();
      return sender?.getName() || '';
    }
    return '';
  }

  /**
   * Check if there are any typing users.
   * Used to conditionally show/hide the component.
   */
  get hasTypingUsers(): boolean {
    const users = this.typingUsersSignal();
    return users && users.length > 0;
  }

  /**
   * Get the number of typing users.
   * Used for determining display format.
   */
  get typingUsersCount(): number {
    const users = this.typingUsersSignal();
    return users ? users.length : 0;
  }

  /**
   * Generates an accessible label for screen readers.
   * Describes who is typing for assistive technologies.
   */
  get ariaLabel(): string {
    const users = this.typingUsersSignal();
    const isGroup = this.isGroupChatSignal();

    if (!users || users.length === 0) {
      return '';
    }

    if (!isGroup) {
      return CometChatLocalize.getLocalizedString('accessibility_typing');
    }

    if (users.length === 1) {
      const name = this.firstTypingUserName;
      return CometChatLocalize.getLocalizedString('accessibility_user_is_typing').replace('{name}', name);
    } else if (users.length === 2) {
      return CometChatLocalize.getLocalizedString('accessibility_two_users_typing')
        .replace('{name1}', this.firstTypingUserName)
        .replace('{name2}', this.secondTypingUserName);
    } else {
      return CometChatLocalize.getLocalizedString('accessibility_multiple_users_typing');
    }
  }
}
