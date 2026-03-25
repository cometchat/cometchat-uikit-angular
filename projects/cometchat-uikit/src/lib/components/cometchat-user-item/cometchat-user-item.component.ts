/**
 * CometChatUserItem Component
 *
 * A standalone component for rendering a single user item.
 * This component is part of the refactoring that decomposes
 * the CometChatUsers component into smaller, focused pieces.
 *
 * Features:
 * - State management (active, selected, focused)
 * - User avatar with online/offline status indicator
 * - Custom template support for all sections
 * - Context menu integration
 * - Full keyboard accessibility with ARIA support
 *
 * @module components/cometchat-user-item
 * @see Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  inject,
  computed,
  signal,
  booleanAttribute, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatAvatarComponent } from '../base-elements/cometchat-avatar/cometchat-avatar.component';
import { CometChatContextMenuComponent } from '../base-elements/cometchat-context-menu/cometchat-context-menu.component';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatOption } from '../../modals/CometChatOption';
import { Placement } from '../../Enums/Enums';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';

/**
 * CometChatUserItem is a standalone Angular component that renders
 * a single user item with support for:
 * - State management (active, selected, focused)
 * - User avatar with online/offline status indicator
 * - Custom templates for leading, title, subtitle, and trailing sections
 * - Context menu integration
 * - Full keyboard accessibility with ARIA support
 *
 * @example
 * ```html
 * <cometchat-user-item
 *   [user]="user"
 *   [isActive]="isActive"
 *   [isSelected]="isSelected"
 *   (itemClick)="onItemClick($event)">
 * </cometchat-user-item>
 * ```
 *
 * @see Requirements 1.1 - THE CometChatUserItem component SHALL be a standalone Angular component
 * @see Requirements 1.2 - THE CometChatUserItem component SHALL accept a CometChat.User object as required @Input
 * @see Requirements 1.3 - THE CometChatUserItem component SHALL accept state inputs
 * @see Requirements 1.4 - THE CometChatUserItem component SHALL accept display configuration inputs
 * @see Requirements 1.5 - THE CometChatUserItem component SHALL accept customization inputs
 * @see Requirements 1.6 - THE CometChatUserItem component SHALL emit events
 */
@Component({
  selector: 'cometchat-user-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CometChatAvatarComponent, CometChatContextMenuComponent],
  templateUrl: './cometchat-user-item.component.html',
  styleUrls: ['./cometchat-user-item.component.css'],
})
export class CometChatUserItemComponent {
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
   * The user object to render.
   * This is the primary data source for the component.
   *
   * @required
   * @see Requirements 1.2
   */
  @Input({ required: true }) user!: CometChat.User;

  // ============================================
  // State Inputs
  // ============================================

  /**
   * Whether this user item is currently active/selected for viewing.
   * When true, applies active styling to the item.
   *
   * @default false
   * @see Requirements 1.3
   */
  @Input() isActive = false;

  /**
   * Whether this user item is selected in selection mode.
   * When true, applies selected styling and shows selection indicator.
   *
   * @default false
   * @see Requirements 1.3
   */
  @Input() isSelected = false;

  /**
   * Whether this user item currently has keyboard focus.
   * When true, applies focus styling for accessibility.
   *
   * @default false
   * @see Requirements 1.3
   */
  @Input() isFocused = false;

  /**
   * The tabindex for this user item.
   * Used for roving tabindex pattern - only focused item should have tabindex=0.
   * When -1, item is not focusable via Tab but can receive programmatic focus.
   *
   * @default -1
   * @see Requirements 1.3
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
   * Whether to hide the user online/offline status indicator.
   *
   * @default false
   * @see Requirements 1.4
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
   * Options for the context menu displayed on hover/right-click.
   * Each option can have an id, title, iconURL, and onClick handler.
   *
   * @see Requirements 1.5
   */
  @Input() contextMenuOptions?: CometChatOption[];

  /**
   * Custom template for the leading section (avatar area).
   * Receives user object as implicit context.
   *
   * @see Requirements 1.5
   */
  @Input() leadingView?: TemplateRef<{ $implicit: CometChat.User }>;

  /**
   * Custom template for the title section.
   * Receives user object as implicit context.
   *
   * @see Requirements 1.5
   */
  @Input() titleView?: TemplateRef<{ $implicit: CometChat.User }>;

  /**
   * Custom template for the subtitle section.
   * Receives user object as implicit context.
   *
   * @see Requirements 1.5
   */
  @Input() subtitleView?: TemplateRef<{ $implicit: CometChat.User }>;

  /**
   * Custom template for the trailing section.
   * Receives user object as implicit context.
   *
   * @see Requirements 1.5
   */
  @Input() trailingView?: TemplateRef<{ $implicit: CometChat.User }>;

  // ============================================
  // Output Events
  // ============================================

  /**
   * Emitted when the user item is clicked.
   *
   * @see Requirements 1.6
   */
  @Output() itemClick = new EventEmitter<CometChat.User>();

  /**
   * Emitted when the user is selected/deselected in selection mode.
   * Includes the user and the new selection state.
   *
   * @see Requirements 1.6
   */
  @Output() itemSelect = new EventEmitter<{
    user: CometChat.User;
    selected: boolean;
  }>();

  /**
   * Emitted when the context menu is opened.
   *
   * @see Requirements 1.6
   */
  @Output() contextMenuOpen = new EventEmitter<CometChat.User>();

  /**
   * Emitted when a context menu option is clicked.
   * Includes the selected option and the user.
   *
   * @see Requirements 1.6
   */
  @Output() contextMenuOptionClick = new EventEmitter<{
    option: CometChatOption;
    user: CometChat.User;
  }>();

  // ============================================
  // Template Exposed Properties
  // ============================================

  /**
   * Expose Placement enum to template for context menu positioning.
   */
  readonly Placement = Placement;

  // ============================================
  // Computed Properties and Getters
  // @see Requirements 1.7, 1.8
  // ============================================

  /**
   * Gets the avatar image URL for the user.
   *
   * @returns The avatar URL or empty string if not available
   * @see Requirements 1.7
   */
  get avatarImage(): string {
    return this.user?.getAvatar() || '';
  }

  /**
   * Gets the display name for the user.
   *
   * @returns The name of the user or empty string
   * @see Requirements 1.8
   */
  get avatarName(): string {
    return this.user?.getName() || '';
  }

  /**
   * Gets the online/offline status for the user.
   *
   * @returns The user's status ('online', 'offline', etc.)
   * @see Requirements 1.7
   */
  get userStatus(): string {
    return this.user?.getStatus() || 'offline';
  }

  /**
   * Computes the accessible label for the user item.
   * Includes user name and online status for screen readers.
   *
   * @returns Accessible label string combining name and status
   * @see Requirements 1.13, 6.1-6.5
   */
  get accessibleLabel(): string {
    const parts: string[] = [this.avatarName];

    // Online status - use accessibility-specific localization keys
    if (!this.effectiveHideUserStatus()) {
      const statusKey =
        this.userStatus === 'online'
          ? 'accessibility_status_online'
          : 'accessibility_status_offline';
      parts.push(CometChatLocalize.getLocalizedString(statusKey));
    }

    return parts.join(', ');
  }

  // ============================================
  // Event Handlers
  // @see Requirements 1.6
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
   * Handles keyboard events on the user item.
   * Supports Enter/Space for activation and Shift+F10/ContextMenu for context menu.
   *
   * @param event - The DOM keyboard event
   * @see Requirements 6.2 - Enter or Space emits itemClick event
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
   * Handles the main item click event.
   * This is the primary click handler for the entire user item.
   *
   * @emits itemClick with the user object
   */
  handleClick(): void {
    this.itemClick.emit(this.user);
  }

  /**
   * Handles the context menu open event.
   * Called when the context menu is triggered (hover or right-click).
   *
   * @emits contextMenuOpen with the user object
   */
  handleContextMenuOpen(): void {
    this.contextMenuOpen.emit(this.user);
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
   * @emits contextMenuOptionClick with the option and user
   */
  handleContextMenuOptionClick(option: CometChatOption): void {
    this.contextMenuOptionClick.emit({ option, user: this.user });
  }
}
