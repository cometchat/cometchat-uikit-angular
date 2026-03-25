import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  AfterViewInit,
  ElementRef,
  ViewChildren,
  QueryList, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../resources/CometChatLocalize/translate.pipe';
import { CometChatMessageComposerAction, CometChatActionsView } from '../../../modals';
import {
  isActivationKey,
  isEscapeKey,
  getNextIndex,
  getNavigationDirection,
} from '../../../utils/keyboard-utils';

/**
 * CometChatActionSheet is a composite component used to display a list of action items.
 * It accepts an array of action items as input and emits an event when any action is clicked.
 *
 * @example
 * ```html
 * <cometchat-action-sheet
 *   [actions]="actionItems"
 *   (actionItemClick)="onActionClick($event)"
 * ></cometchat-action-sheet>
 * ```
 */
@Component({
  selector: 'cometchat-action-sheet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './cometchat-action-sheet.component.html',
  styleUrls: ['./cometchat-action-sheet.component.css'],
})
export class CometChatActionSheetComponent implements AfterViewInit {
  /**
   * Array of action items to be displayed in the action sheet.
   * Each action can be either a CometChatMessageComposerAction or CometChatActionsView.
   */
  @Input() actions: (CometChatMessageComposerAction | CometChatActionsView)[] = [];

  /**
   * Emitted when an action item is clicked.
   * The event payload contains the clicked action item.
   */
  @Output() actionItemClick = new EventEmitter<
    CometChatMessageComposerAction | CometChatActionsView
  >();

  /**
   * Emitted when the action sheet should be closed (e.g., Escape key pressed).
   */
  @Output() closeSheet = new EventEmitter<void>();

  /**
   * Reference to all action item elements for keyboard navigation
   */
  @ViewChildren('actionItem') actionItems!: QueryList<ElementRef<HTMLDivElement>>;

  /**
   * Currently focused action index for keyboard navigation
   * Starts at -1 so no item is highlighted by default
   */
  private focusedIndex = -1;

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit(): void {
    // Don't auto-focus first item - let user navigate with keyboard
  }

  /**
   * Handles click on an action item.
   * Emits the actionItemClick event with the clicked action.
   * @param action The action item that was clicked
   */
  onActionClick(action: CometChatMessageComposerAction | CometChatActionsView): void {
    this.actionItemClick.emit(action);
  }

  /**
   * Handles keyboard events for accessibility
   * - Arrow Up/Down: Navigate between actions with wrap-around
   * - Enter/Space: Select action and close sheet
   * - Escape: Close action sheet
   * - Tab: Allow natural tab order (no focus trap)
   */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Handle arrow key navigation
    const direction = getNavigationDirection(event);
    if (direction === 'up' || direction === 'down') {
      event.preventDefault();
      this.navigateToIndex(direction);
      return;
    }

    // Handle activation (Enter/Space)
    if (isActivationKey(event)) {
      event.preventDefault();
      this.selectCurrentAction();
      return;
    }

    // Handle Escape to close
    if (isEscapeKey(event)) {
      event.preventDefault();
      this.closeSheet.emit();
      return;
    }

    // Tab key: Allow natural exit (no focus trap per requirement 3.6)
    // Don't prevent default - let browser handle tab navigation
  }

  /**
   * Navigates to the next or previous action item using keyboard utilities
   * @param direction The navigation direction ('up' or 'down')
   */
  private navigateToIndex(direction: 'up' | 'down'): void {
    if (this.actions.length === 0) return;

    // Use keyboard utility for wrap-around navigation
    const nextIndex = getNextIndex(this.focusedIndex, direction, this.actions.length, {
      wrap: true,
    });

    this.focusedIndex = nextIndex;
    this.setFocusToIndex(this.focusedIndex);
  }

  /**
   * Sets focus to the action item at the specified index
   * @param index The index of the action item to focus
   */
  private setFocusToIndex(index: number): void {
    const items = this.actionItems?.toArray();
    if (items && items[index]) {
      items[index].nativeElement.focus();
    }
  }

  /**
   * Selects the currently focused action
   */
  private selectCurrentAction(): void {
    if (this.actions[this.focusedIndex]) {
      this.onActionClick(this.actions[this.focusedIndex]);
    }
  }

  /**
   * Handles focus event on an action item
   * Updates the focused index when an item receives focus
   * @param index The index of the focused item
   */
  onActionFocus(index: number): void {
    this.focusedIndex = index;
  }

  /**
   * TrackBy function for ngFor to improve rendering performance.
   * @param index The index of the item
   * @param action The action item
   * @returns A unique identifier for the action
   */
  trackByAction(
    index: number,
    action: CometChatMessageComposerAction | CometChatActionsView
  ): string {
    return action.id || `action-${index}`;
  }
}
