/**
 * CometChatGroupMemberItem Component
 *
 * A standalone component for rendering a single group member item.
 * Follows the same pattern as CometChatUserItem and CometChatGroupItem.
 *
 * Features:
 * - State management (active, selected, focused)
 * - Member avatar with online/offline status indicator
 * - Role badge (owner, admin, moderator)
 * - Custom template support for all sections
 * - Context menu integration (kick, ban, change scope)
 * - Full keyboard accessibility with ARIA support
 *
 * @module components/cometchat-group-member-item
 * @see Requirements 10.1-10.6
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  inject,
  computed,
  booleanAttribute,
  signal, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatAvatarComponent } from '../base-elements/cometchat-avatar/cometchat-avatar.component';
import { CometChatContextMenuComponent } from '../base-elements/cometchat-context-menu/cometchat-context-menu.component';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatOption } from '../../modals/CometChatOption';
import { Placement } from '../../Enums/Enums';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';

/**
 * CometChatGroupMemberItem is a standalone Angular component that renders
 * a single group member item with support for:
 * - State management (active, selected, focused)
 * - Member avatar with online/offline status indicator
 * - Role badge (owner, admin, moderator)
 * - Custom templates for leading, title, subtitle, and trailing sections
 * - Context menu integration (kick, ban, change scope)
 * - Full keyboard accessibility with ARIA support
 *
 * @example
 * ```html
 * <cometchat-group-member-item
 *   [member]="member"
 *   [isActive]="isActive"
 *   [isSelected]="isSelected"
 *   (itemClick)="onItemClick($event)">
 * </cometchat-group-member-item>
 * ```
 *
 * @see Requirements 10.1 - Focus indicator with minimum 3:1 contrast ratio
 * @see Requirements 10.2 - Enter or Space emits itemClick event
 * @see Requirements 10.3 - aria-selected attribute reflecting selection state
 * @see Requirements 10.4 - role="option" attribute
 * @see Requirements 10.5 - Scope badge has aria-hidden="true"
 * @see Requirements 10.6 - Scope change control is focusable via Tab
 */
@Component({
  selector: 'cometchat-group-member-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CometChatAvatarComponent, CometChatContextMenuComponent],
  templateUrl: './cometchat-group-member-item.component.html',
  styleUrls: ['./cometchat-group-member-item.component.css'],
})
export class CometChatGroupMemberItemComponent {
  // ============================================
  // Global Config Injection
  // ============================================

  /** Global config injected via token (static configuration) */
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, {
    optional: true,
  });

  // ============================================
  // Required Inputs
  // ============================================

  /**
   * The group member object to render.
   * This is the primary data source for the component.
   *
   * @required
   */
  @Input({ required: true }) member!: CometChat.GroupMember;

  // ============================================
  // State Inputs
  // ============================================

  /**
   * Whether this member item is currently active/selected for viewing.
   * When true, applies active styling to the item.
   *
   * @default false
   */
  @Input() isActive = false;

  /**
   * Whether this member item is selected in selection mode.
   * When true, applies selected styling and shows selection indicator.
   *
   * @default false
   */
  @Input() isSelected = false;

  /**
   * Whether this member item currently has keyboard focus.
   * When true, applies focus styling for accessibility.
   *
   * @default false
   */
  @Input() isFocused = false;

  /**
   * The tabindex for this member item.
   * Used for roving tabindex pattern - only focused item should have tabindex=0.
   * When -1, item is not focusable via Tab but can receive programmatic focus.
   *
   * @default -1
   */
  @Input() tabIndex = -1;

  // ============================================
  // Display Configuration Inputs (GlobalConfig Priority System)
  // ============================================

  // Track if @Input was explicitly set (for global config priority system)
  private hideUserStatusExplicitlySet = signal(false);
  private disableDefaultContextMenuExplicitlySet = signal(false);

  // Private backing fields for tracked @Input properties
  private _hideUserStatus = signal(false);
  private _disableDefaultContextMenu = signal(true);

  /**
   * Whether to hide the member online/offline status indicator.
   *
   * @default false
   */
  @Input({ transform: booleanAttribute })
  set hideUserStatus(value: boolean) {
    this._hideUserStatus.set(value);
    this.hideUserStatusExplicitlySet.set(true);
  }
  get hideUserStatus(): boolean {
    return this._hideUserStatus();
  }

  /**
   * Whether to disable the browser's default context menu (tooltip) on long press/right-click.
   * When true (default), the browser's context menu is disabled to show only the custom menu.
   * Set to false to allow the browser's default context menu behavior.
   *
   * @default true
   */
  @Input({ transform: booleanAttribute })
  set disableDefaultContextMenu(value: boolean) {
    this._disableDefaultContextMenu.set(value);
    this.disableDefaultContextMenuExplicitlySet.set(true);
  }
  get disableDefaultContextMenu(): boolean {
    return this._disableDefaultContextMenu();
  }

  // ============================================
  // Effective Value Computed Signals (Priority System)
  // ============================================
  /**
   * Computed effective values implementing the priority system:
   * 1. If @Input was explicitly set → use @Input value
   * 2. Else if global config is set (not undefined) → use global config value
   * 3. Else → use internal default value
   */
  effectiveHideUserStatus = computed(() => {
    if (this.hideUserStatusExplicitlySet()) return this._hideUserStatus();
    if (this.globalConfig?.hideUserStatus !== undefined) return this.globalConfig.hideUserStatus;
    return false;
  });

  effectiveDisableDefaultContextMenu = computed(() => {
    if (this.disableDefaultContextMenuExplicitlySet()) return this._disableDefaultContextMenu();
    if (this.globalConfig?.disableDefaultContextMenu !== undefined)
      return this.globalConfig.disableDefaultContextMenu;
    return true;
  });

  // ============================================
  // Customization Inputs
  // ============================================

  /**
   * Options for the context menu (kick, ban, change scope).
   * Each option can have an id, title, iconURL, and onClick handler.
   */
  @Input() contextMenuOptions?: CometChatOption[];

  /**
   * Custom template for the leading section (avatar area).
   * Receives member object as implicit context.
   */
  @Input() leadingView?: TemplateRef<{ $implicit: CometChat.GroupMember }>;

  /**
   * Custom template for the title section.
   * Receives member object as implicit context.
   */
  @Input() titleView?: TemplateRef<{ $implicit: CometChat.GroupMember }>;

  /**
   * Custom template for the subtitle section.
   * Receives member object as implicit context.
   */
  @Input() subtitleView?: TemplateRef<{ $implicit: CometChat.GroupMember }>;

  /**
   * Custom template for the trailing section.
   * Receives member object as implicit context.
   */
  @Input() trailingView?: TemplateRef<{ $implicit: CometChat.GroupMember }>;

  // ============================================
  // Output Events
  // ============================================

  /**
   * Emitted when the member item is clicked.
   */
  @Output() itemClick = new EventEmitter<CometChat.GroupMember>();

  /**
   * Emitted when the member item's inner container receives native focus.
   * This is needed because the native `focus` event does not bubble,
   * so the parent GroupMembers component cannot detect focus via DOM event bubbling.
   * The parent listens to this output to update the focusedIndex.
   */
  @Output() itemFocus = new EventEmitter<void>();

  /**
   * Emitted when a context menu option is clicked.
   * Includes the selected option and the member.
   */
  @Output() contextMenuOptionClick = new EventEmitter<{
    option: CometChatOption;
    member: CometChat.GroupMember;
  }>();

  // ============================================
  // Template Exposed Properties
  // ============================================

  /**
   * Expose Placement enum to template for context menu positioning.
   */
  readonly Placement = Placement;

  // ============================================
  // Computed Properties
  // ============================================

  /**
   * Gets the avatar image URL for the member.
   *
   * @returns The avatar URL or empty string if not available
   */
  get avatarImage(): string {
    return this.member?.getAvatar() || '';
  }

  /**
   * Gets the display name for the member.
   *
   * @returns The name of the member or empty string
   */
  get avatarName(): string {
    return this.member?.getName() || '';
  }

  /**
   * Gets the online/offline status for the member.
   *
   * @returns The member's status ('online', 'offline', etc.)
   */
  get memberStatus(): string {
    return this.member?.getStatus() || 'offline';
  }

  /**
   * Gets the member's scope/role in the group.
   *
   * @returns The member's scope ('owner', 'admin', 'moderator', 'participant')
   */
  get memberScope(): string {
    return this.member?.getScope() || 'participant';
  }

  /**
   * Gets the localized scope label for display.
   *
   * @returns Localized scope string (e.g., "Admin", "Moderator")
   */
  get scopeLabel(): string {
    const scope = this.memberScope;
    return CometChatLocalize.getLocalizedString(`member_scope_${scope}`);
  }

  /**
   * Computes the accessible label for the member item.
   * Includes member name, role/scope, and online status for screen readers.
   * Uses accessibility-specific localization keys for proper internationalization.
   *
   * @returns Accessible label string combining name, scope, and status
   * @see Requirements 9.5, 10.1-10.6
   */
  get accessibleLabel(): string {
    const parts: string[] = [this.avatarName];

    // Role/scope - use accessibility-specific localization keys for admin/moderator
    const scope = this.memberScope;
    if (scope === 'admin') {
      parts.push(CometChatLocalize.getLocalizedString('accessibility_member_scope_admin'));
    } else if (scope === 'moderator') {
      parts.push(CometChatLocalize.getLocalizedString('accessibility_member_scope_moderator'));
    } else if (scope === 'owner') {
      // Owner uses the standard scope label
      parts.push(this.scopeLabel);
    }
    // Participants don't need scope announced

    // Online status - use accessibility-specific localization keys
    if (!this.effectiveHideUserStatus()) {
      const statusKey =
        this.memberStatus === 'online'
          ? 'accessibility_status_online'
          : 'accessibility_status_offline';
      parts.push(CometChatLocalize.getLocalizedString(statusKey));
    }

    return parts.join(', ');
  }

  // ============================================
  // Event Handlers
  // ============================================

  /**
   * Handles mousedown event to prevent focus outline on mouse click.
   * This ensures that focus ring only appears for keyboard navigation,
   * not for mouse clicks. The active state styling will still be applied
   * via the isActive input.
   *
   * @param event - The DOM mousedown event
   */
  handleMouseDown(event: MouseEvent): void {
    // Prevent the element from receiving focus on mouse click
    // This ensures focus ring only appears for keyboard navigation
    // The click event will still fire and handle the selection
    event.preventDefault();
  }

  /**
   * Handles the main item click event.
   * This is the primary click handler for the entire member item.
   *
   * @emits itemClick with the member object
   */
  handleClick(): void {
    this.itemClick.emit(this.member);
  }

  /**
   * Handles the native focus event on the inner container element.
   * Since the native `focus` event does not bubble through the DOM,
   * this method explicitly emits the `itemFocus` output so the parent
   * GroupMembers component can update the focusedIndex for keyboard navigation.
   *
   * @emits itemFocus
   */
  onItemFocus(): void {
    this.itemFocus.emit();
  }

  /**
   * Handles keyboard events on the member item.
   * Supports Enter/Space for activation and Shift+F10/ContextMenu for context menu.
   *
   * @param event - The DOM keyboard event
   * @see Requirements 10.2 - Enter or Space emits itemClick event
   */
  onKeyDown(event: KeyboardEvent): void {
    // Enter or Space: Activate item
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.handleClick();
    }

    // Shift+F10 or Context Menu key: Open context menu
    if ((event.key === 'F10' && event.shiftKey) || event.key === 'ContextMenu') {
      event.preventDefault();
      this.handleContextMenuOpen();
    }
  }

  /**
   * Handles the context menu open event.
   * Called when the context menu is triggered (hover or right-click).
   */
  handleContextMenuOpen(): void {
    // Context menu is handled by the CometChatContextMenu component
    // This method can be extended if needed for programmatic opening
  }

  /**
   * Handles the browser's native context menu event (right-click / long-press).
   * Prevents the default browser context menu when disableDefaultContextMenu is true.
   *
   * @param event - The DOM contextmenu event
   */
  handleContextMenu(event: MouseEvent): void {
    if (this.effectiveDisableDefaultContextMenu()) {
      event.preventDefault();
    }
  }

  /**
   * Handles click on a context menu option.
   * Called when the user selects an option from the context menu.
   *
   * @param option - The selected CometChatOption
   * @emits contextMenuOptionClick with the option and member
   */
  handleContextMenuOptionClick(option: CometChatOption): void {
    this.contextMenuOptionClick.emit({ option, member: this.member });
  }
}
