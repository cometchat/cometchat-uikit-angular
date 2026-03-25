import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ElementRef,
  ViewChild,
  OnChanges,
  SimpleChanges, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChatAvatarComponent } from '../cometchat-avatar/cometchat-avatar.component';

/**
 * CometChatListItem is a composite component used to display a list item with avatar, title, subtitle, and customizable views.
 * It accepts inputs related to the avatar and title, as well as a callback function that is triggered when the list item is clicked.
 * It supports template projection for leading, trailing, menu, title, and subtitle views.
 *
 * @example
 * ```html
 * <cometchat-list-item
 *   [id]="user.id"
 *   [avatarURL]="user.avatar"
 *   [avatarName]="user.name"
 *   [title]="user.name"
 *   (listItemClick)="onUserClick($event)">
 * </cometchat-list-item>
 * ```
 */
@Component({
  selector: 'cometchat-list-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CometChatAvatarComponent],
  templateUrl: './cometchat-list-item.component.html',
  styleUrls: ['./cometchat-list-item.component.css'],
})
export class CometChatListItemComponent implements OnChanges {
  /** Unique ID for the list item */
  @Input() id = '';

  /** URL of the image for avatar */
  @Input() avatarURL = '';

  /** Name initials for avatar if URL not provided */
  @Input() avatarName = '';

  /** Title text for list item */
  @Input() title = '';

  /** Subtitle text for accessibility (used in aria-label) */
  @Input() subtitle = '';

  /**
   * Normalizes null/undefined inputs to their default values.
   * Prevents NG0100 ExpressionChangedAfterItHasBeenCheckedError.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['id'] && changes['id'].currentValue == null) {
      this.id = '';
    }
    if (changes['avatarURL'] && changes['avatarURL'].currentValue == null) {
      this.avatarURL = '';
    }
    if (changes['avatarName'] && changes['avatarName'].currentValue == null) {
      this.avatarName = '';
    }
    if (changes['title'] && changes['title'].currentValue == null) {
      this.title = '';
    }
    if (changes['subtitle'] && changes['subtitle'].currentValue == null) {
      this.subtitle = '';
    }
  }

  /** Template for menu view (shown on hover/focus, replaces trailingView) */
  @Input() menuView: TemplateRef<any> | null = null;

  /** Template for subtitle view */
  @Input() subtitleView: TemplateRef<any> | null = null;

  /** Template for trailing view (right side) */
  @Input() trailingView: TemplateRef<any> | null = null;

  /** Template for custom title view */
  @Input() titleView: TemplateRef<any> | null = null;

  /** Template for leading view (replaces avatar) */
  @Input() leadingView: TemplateRef<any> | null = null;

  /** Stop event propagation on click */
  @Input() stopEventPropagation = false;

  /** Custom ARIA label (overrides default) */
  @Input() ariaLabel?: string;

  /** Whether to disable the tabindex on the list item (when parent manages focus) */
  @Input() disableTabIndex = false;

  /** Whether the list item is currently focused (managed by parent) */
  @Input() isFocused = false;

  /**
   * Keyboard shortcut key for toggling menu visibility.
   * Set to empty string or null to disable the shortcut.
   * Default is 'M' (case-insensitive).
   * Per WCAG 2.1.4, single-character shortcuts must be configurable.
   */
  @Input() menuShortcutKey: string | null = 'M';

  /** Emitted when list item is clicked */
  @Output() listItemClick = new EventEmitter<{ id: string }>();

  // Internal state
  isHovering = false;
  isMenuVisible = false;
  isListItemFocused = false;

  @ViewChild('trailingViewContainer', { read: ElementRef }) trailingViewContainer?: ElementRef;
  @ViewChild('menuViewContainer', { read: ElementRef }) menuViewContainer?: ElementRef;

  /**
   * Determines if avatar should be shown.
   * Shows avatar when avatarURL or avatarName is provided and no leadingView template.
   */
  get showAvatar(): boolean {
    return !this.leadingView && (!!this.avatarURL?.trim() || !!this.avatarName?.trim());
  }

  /**
   * Determines if trailing view should be visible.
   * Hides when hovering/focused and menuView is present.
   */
  get showTrailingView(): boolean {
    return (
      !(this.isHovering || this.isMenuVisible || this.isFocused) ||
      ((this.isHovering || this.isMenuVisible || this.isFocused) && !this.menuView)
    );
  }

  /**
   * Determines if menu view should be visible.
   * Shows when hovering/focused and menuView template is provided.
   */
  get showMenuView(): boolean {
    return (this.isHovering || this.isMenuVisible || this.isFocused) && !!this.menuView;
  }

  /**
   * Generates an accessible label for screen readers.
   * Combines title and subtitle for complete context.
   */
  get computedAriaLabel(): string {
    if (this.ariaLabel) {
      return this.ariaLabel;
    }

    if (this.subtitle) {
      return `${this.title}, ${this.subtitle}`;
    }

    return this.title;
  }

  /**
   * Generates unique ID for subtitle element (for aria-describedby)
   */
  get subtitleId(): string {
    return `${this.id}-subtitle`;
  }

  /**
   * Handles mouse enter event.
   * Shows menu view and hides trailing view.
   */
  onMouseEnter(): void {
    this.isHovering = true;
  }

  /**
   * Handles mouse leave event.
   * Hides menu view and shows trailing view.
   */
  onMouseLeave(): void {
    this.isHovering = false;
    // Only hide menu if list item doesn't have focus
    if (!this.isListItemFocused) {
      this.isMenuVisible = false;
    }
  }

  /**
   * Handles list item focus event.
   * Shows menu view when list item receives focus.
   */
  onListItemFocus(): void {
    this.isListItemFocused = true;
    if (this.menuView) {
      this.isMenuVisible = true;
    }
  }

  /**
   * Handles list item blur event.
   * Hides menu view when list item loses focus.
   */
  onListItemBlur(): void {
    this.isListItemFocused = false;
    // Only hide menu if not hovering
    if (!this.isHovering) {
      this.isMenuVisible = false;
    }
  }

  /**
   * Handles list item click event.
   * Emits listItemClick event with the item ID.
   * Only triggers if the click target is the list item itself, not nested elements.
   */
  handleListItemClick(event: MouseEvent): void {
    // Check if the click originated from the list item container itself
    // and not from nested interactive elements
    const target = event.target as HTMLElement;
    const listItemElement = event.currentTarget as HTMLElement;

    // If the target is a button, link, or has tabindex, it's an interactive element
    const isInteractiveElement =
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.hasAttribute('tabindex') ||
      target.closest('button, a, [tabindex]');

    // Only emit if clicking the list item itself, not nested interactive elements
    if (!isInteractiveElement || target === listItemElement) {
      this.listItemClick.emit({ id: this.id });
    }
  }

  /**
   * Handles trailing view click event.
   * Stops propagation if stopEventPropagation is true.
   */
  onTrailingViewClick(event: MouseEvent): void {
    if (this.stopEventPropagation) {
      event.stopPropagation();
    }
  }

  /**
   * Handles menu view click event.
   * Always stops propagation to prevent list item click.
   */
  onMenuViewClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  /**
   * Handles keyboard events for accessibility.
   * Activates list item on Enter or Space key press.
   * Shows menu on configurable shortcut key (default: M for "Menu").
   * Per WCAG 2.1.4, the shortcut can be disabled by setting menuShortcutKey to null/empty.
   */
  onKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const listItemElement = event.currentTarget as HTMLElement;

    // Only handle keys if focus is on the list item itself, not nested elements
    if (target !== listItemElement) {
      return;
    }

    switch (event.key) {
      case 'Enter':
      case ' ': // Space key
        event.preventDefault();
        this.listItemClick.emit({ id: this.id });
        break;

      default:
        // Handle configurable menu shortcut key (WCAG 2.1.4 compliant)
        if (this.menuShortcutKey && this.menuView) {
          const pressedKey = event.key.toLowerCase();
          const shortcutKey = this.menuShortcutKey.toLowerCase();
          if (pressedKey === shortcutKey) {
            event.preventDefault();
            this.isMenuVisible = !this.isMenuVisible;
          }
        }
        break;
    }
  }
}
