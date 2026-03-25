/**
 * CometChatGroupItem Component
 *
 * A standalone component for rendering a single group item.
 * This component is part of the refactoring that decomposes
 * the CometChatGroups component into smaller, focused pieces.
 *
 * Features:
 * - State management (active, selected, focused)
 * - Group icon/avatar with group type indicator
 * - Custom template support for all sections
 * - Context menu integration
 * - Full keyboard accessibility with ARIA support
 *
 * @module components/cometchat-group-item
 * @see Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
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
 * CometChatGroupItem is a standalone Angular component that renders
 * a single group item with support for:
 * - State management (active, selected, focused)
 * - Group icon/avatar with group type indicator
 * - Custom templates for leading, title, subtitle, and trailing sections
 * - Context menu integration
 * - Full keyboard accessibility with ARIA support
 *
 * @example
 * ```html
 * <cometchat-group-item
 *   [group]="group"
 *   [isActive]="isActive"
 *   [isSelected]="isSelected"
 *   (itemClick)="onItemClick($event)">
 * </cometchat-group-item>
 * ```
 *
 * @see Requirements 2.1 - THE CometChatGroupItem component SHALL be a standalone Angular component
 * @see Requirements 2.2 - THE CometChatGroupItem component SHALL accept a CometChat.Group object as required @Input
 * @see Requirements 2.3 - THE CometChatGroupItem component SHALL accept state inputs
 * @see Requirements 2.4 - THE CometChatGroupItem component SHALL accept display configuration inputs
 * @see Requirements 2.5 - THE CometChatGroupItem component SHALL accept customization inputs
 * @see Requirements 2.6 - THE CometChatGroupItem component SHALL emit events
 */
@Component({
  selector: 'cometchat-group-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CometChatAvatarComponent, CometChatContextMenuComponent],
  templateUrl: './cometchat-group-item.component.html',
  styleUrls: ['./cometchat-group-item.component.css'],
})
export class CometChatGroupItemComponent {
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
   * The group object to render.
   * This is the primary data source for the component.
   *
   * @required
   * @see Requirements 2.2
   */
  @Input({ required: true }) group!: CometChat.Group;

  // ============================================
  // State Inputs
  // ============================================

  /**
   * Whether this group item is currently active/selected for viewing.
   * When true, applies active styling to the item.
   *
   * @default false
   * @see Requirements 2.3
   */
  @Input() isActive = false;

  /**
   * Whether this group item is selected in selection mode.
   * When true, applies selected styling and shows selection indicator.
   *
   * @default false
   * @see Requirements 2.3
   */
  @Input() isSelected = false;

  /**
   * Whether this group item currently has keyboard focus.
   * When true, applies focus styling for accessibility.
   *
   * @default false
   * @see Requirements 2.3
   */
  @Input() isFocused = false;

  /**
   * The tabindex for this group item.
   * Used for roving tabindex pattern - only focused item should have tabindex=0.
   * When -1, item is not focusable via Tab but can receive programmatic focus.
   *
   * @default -1
   * @see Requirements 2.3
   */
  @Input() tabIndex = -1;

  // ============================================
  // Display Configuration Inputs (GlobalConfig Priority System)
  // ============================================

  // Track if @Input was explicitly set (for global config priority system)
  private hideGroupTypeExplicitlySet = signal(false);
  private disableDefaultContextMenuExplicitlySet = signal(false);

  // Private backing fields for tracked @Input properties
  private _hideGroupType = signal(false);
  private _disableDefaultContextMenu = signal(true);

  /**
   * Whether to hide the group type indicator (public, private, password).
   *
   * @default false
   * @see Requirements 2.4
   */
  @Input({ transform: booleanAttribute })
  set hideGroupType(value: boolean) {
    this._hideGroupType.set(value);
    this.hideGroupTypeExplicitlySet.set(true);
  }
  get hideGroupType(): boolean {
    return this._hideGroupType();
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
  effectiveHideGroupType = computed(() => {
    if (this.hideGroupTypeExplicitlySet()) return this._hideGroupType();
    if (this.globalConfig?.hideGroupType !== undefined) return this.globalConfig.hideGroupType;
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
   * @see Requirements 2.5
   */
  @Input() contextMenuOptions?: CometChatOption[];

  /**
   * Custom template for the leading section (icon/avatar area).
   * Receives group object as implicit context.
   *
   * @see Requirements 2.5
   */
  @Input() leadingView?: TemplateRef<{ $implicit: CometChat.Group }>;

  /**
   * Custom template for the title section.
   * Receives group object as implicit context.
   *
   * @see Requirements 2.5
   */
  @Input() titleView?: TemplateRef<{ $implicit: CometChat.Group }>;

  /**
   * Custom template for the subtitle section.
   * Receives group object as implicit context.
   *
   * @see Requirements 2.5
   */
  @Input() subtitleView?: TemplateRef<{ $implicit: CometChat.Group }>;

  /**
   * Custom template for the trailing section.
   * Receives group object as implicit context.
   *
   * @see Requirements 2.5
   */
  @Input() trailingView?: TemplateRef<{ $implicit: CometChat.Group }>;

  // ============================================
  // Output Events
  // ============================================

  /**
   * Emitted when the group item is clicked.
   *
   * @see Requirements 2.6
   */
  @Output() itemClick = new EventEmitter<CometChat.Group>();

  /**
   * Emitted when the group is selected/deselected in selection mode.
   * Includes the group and the new selection state.
   *
   * @see Requirements 2.6
   */
  @Output() itemSelect = new EventEmitter<{
    group: CometChat.Group;
    selected: boolean;
  }>();

  /**
   * Emitted when the context menu is opened.
   *
   * @see Requirements 2.6
   */
  @Output() contextMenuOpen = new EventEmitter<CometChat.Group>();

  /**
   * Emitted when a context menu option is clicked.
   * Includes the selected option and the group.
   *
   * @see Requirements 2.6
   */
  @Output() contextMenuOptionClick = new EventEmitter<{
    option: CometChatOption;
    group: CometChat.Group;
  }>();

  /**
   * Emitted when the group item's inner container receives native focus.
   * This is needed because the native `focus` event does not bubble,
   * so the parent Groups component cannot detect focus via DOM event bubbling.
   * The parent listens to this output to update the focusedIndex.
   *
   * @see Requirements 1.5, 1.6
   */
  @Output() itemFocus = new EventEmitter<void>();

  // ============================================
  // Template Exposed Properties
  // ============================================

  /**
   * Expose Placement enum to template for context menu positioning.
   */
  readonly Placement = Placement;

  // ============================================
  // Computed Properties and Getters
  // @see Requirements 2.7, 2.8, 2.9
  // ============================================

  /**
   * Gets the group icon URL.
   *
   * @returns The icon URL or empty string if not available
   * @see Requirements 2.7
   */
  get groupIcon(): string {
    return this.group?.getIcon() || '';
  }

  /**
   * Gets the display name for the group.
   *
   * @returns The name of the group or empty string
   * @see Requirements 2.8
   */
  get groupName(): string {
    return this.group?.getName() || '';
  }

  /**
   * Gets the group type (public, private, password).
   *
   * @returns The group type string
   * @see Requirements 2.7
   */
  get groupType(): string {
    return this.group?.getType() || '';
  }

  /**
   * Gets the member count for the group.
   *
   * @returns The number of members in the group
   * @see Requirements 2.9
   */
  get memberCount(): number {
    return this.group?.getMembersCount() || 0;
  }

  /**
   * Gets the formatted member count text for display.
   *
   * @returns Localized member count string (e.g., "5 members")
   * @see Requirements 2.9
   */
  get memberCountText(): string {
    const count = this.memberCount;
    if (count === 1) {
      return `${count} ${CometChatLocalize.getLocalizedString('group_member')}`;
    } else {
      return `${count} ${CometChatLocalize.getLocalizedString('group_members')}`;
    }
  }

  /**
   * Computes the accessible label for the group item.
   * Includes group name, type, and member count for screen readers.
   * Uses localization keys for proper internationalization.
   *
   * @returns Accessible label string combining name, type, and member count
   * @see Requirements 2.14, 8.1-8.5
   */
  get accessibleLabel(): string {
    const parts: string[] = [this.groupName];

    // Group type - use accessibility-specific localization keys
    if (!this.effectiveHideGroupType() && this.groupType) {
      let typeKey: string;
      switch (this.groupType) {
        case 'public':
          typeKey = 'accessibility_group_type_public';
          break;
        case 'private':
          typeKey = 'accessibility_group_type_private';
          break;
        case 'password':
          typeKey = 'accessibility_group_type_password';
          break;
        default:
          typeKey = '';
      }
      if (typeKey) {
        parts.push(CometChatLocalize.getLocalizedString(typeKey));
      }
    }

    // Member count
    parts.push(this.memberCountText);

    return parts.join(', ');
  }

  // ============================================
  // Event Handlers
  // @see Requirements 2.6
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
   * This is the primary click handler for the entire group item.
   *
   * @emits itemClick with the group object
   */
  handleClick(): void {
    this.itemClick.emit(this.group);
  }

  /**
   * Handles the native focus event on the inner container element.
   * Since the native `focus` event does not bubble through the DOM,
   * this method explicitly emits the `itemFocus` output so the parent
   * Groups component can update the focusedIndex for keyboard navigation.
   *
   * @emits itemFocus
   * @see Requirements 1.5, 1.6
   */
  onItemFocus(): void {
    this.itemFocus.emit();
  }

  /**
   * Handles keyboard events on the group item.
   * Supports Enter/Space for activation and Shift+F10/ContextMenu for context menu.
   *
   * @param event - The DOM keyboard event
   * @see Requirements 8.2 - Enter or Space emits itemClick event
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
   *
   * @emits contextMenuOpen with the group object
   */
  handleContextMenuOpen(): void {
    this.contextMenuOpen.emit(this.group);
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
   * @emits contextMenuOptionClick with the option and group
   */
  handleContextMenuOptionClick(option: CometChatOption): void {
    this.contextMenuOptionClick.emit({ option, group: this.group });
  }
}
