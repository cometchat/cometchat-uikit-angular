import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  HostListener,
  OnInit,
  OnChanges,
  inject,
  ViewChild,
  AfterViewInit, ChangeDetectionStrategy, SimpleChanges} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  isActivationKey,
  isEscapeKey,
  isHomeKey,
  isEndKey,
  getNavigationDirection,
  getNextIndex,
} from '../../../utils/keyboard-utils';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';

@Component({
  selector: 'cometchat-dropdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './cometchat-dropdown.component.html',
  styleUrls: ['./cometchat-dropdown.component.css'],
})
export class CometChatDropDownComponent implements OnInit, OnChanges, AfterViewInit {
  /** List of options to display */
  @Input() options: string[] = [];
  /** Currently selected option */
  @Input() selectedOption = '';
  /** Placeholder text when no option is selected */
  @Input() placeholder = '';
  /** Custom ARIA label for the dropdown button */
  @Input() ariaLabel?: string;

  /** Emitted when an option is selected */
  @Output() optionsChanged = new EventEmitter<{ value: string }>();

  // Internal state
  dropdownVisible = false;
  selectedOptionState = '';
  focusedIndex = -1;
  typeAheadBuffer = '';
  typeAheadTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Unique ID for the listbox element */
  readonly listboxId = `cometchat-dropdown-listbox-${Math.random().toString(36).substring(2, 9)}`;

  @ViewChild('dropdownButton', { static: false }) dropdownButton?: ElementRef<HTMLButtonElement>;

  private elementRef = inject(ElementRef);
  private previousFocusElement: HTMLElement | null = null;

  ngOnInit(): void {
    if (!this.placeholder) {
      this.placeholder = CometChatLocalize.getLocalizedString('dropdown_placeholder');
    }
    // Guard against null/undefined options
    if (!this.options) {
      this.options = [];
    }
    this.selectedOptionState =
      this.selectedOption || (this.options.length > 0 ? this.options[0] : '');
  }

  ngAfterViewInit(): void {
    // Component initialized
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedOption']) {
      this.selectedOptionState = changes['selectedOption'].currentValue;
    }
  }

  onButtonClick(): void {
    if (!this.dropdownVisible) {
      // Save current focus before opening
      this.previousFocusElement = document.activeElement as HTMLElement;
    }

    this.dropdownVisible = !this.dropdownVisible;
    if (this.dropdownVisible) {
      // Set focused index to selected option when opening
      this.focusedIndex = this.options.indexOf(this.selectedOptionState);
      if (this.focusedIndex === -1 && this.options.length > 0) {
        this.focusedIndex = 0;
      }
    } else {
      // Restore focus to button when closing
      this.restoreFocus();
    }
  }

  onOptionClick(option: string): void {
    this.selectedOptionState = option;
    this.dropdownVisible = false;
    this.optionsChanged.emit({ value: option });
    // Restore focus to button after selection
    this.restoreFocus();
  }

  private restoreFocus(): void {
    // Restore focus to the dropdown button
    setTimeout(() => {
      if (this.dropdownButton?.nativeElement) {
        this.dropdownButton.nativeElement.focus();
      } else if (this.previousFocusElement) {
        this.previousFocusElement.focus();
      }
    }, 0);
  }

  private closeDropdown(): void {
    this.dropdownVisible = false;
    this.restoreFocus();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.dropdownVisible) {
        this.closeDropdown();
      }
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Handle Space and Enter to open dropdown when closed
    if (!this.dropdownVisible && isActivationKey(event)) {
      this.onButtonClick();
      event.preventDefault();
      return;
    }

    if (!this.dropdownVisible) {
      return;
    }

    // Handle Escape to close
    if (isEscapeKey(event)) {
      this.closeDropdown();
      event.preventDefault();
      return;
    }

    // Handle Enter/Space to select
    if (isActivationKey(event)) {
      if (this.focusedIndex >= 0 && this.focusedIndex < this.options.length) {
        this.onOptionClick(this.options[this.focusedIndex]);
      }
      event.preventDefault();
      return;
    }

    // Handle Home key
    if (isHomeKey(event)) {
      this.focusedIndex = 0;
      event.preventDefault();
      return;
    }

    // Handle End key
    if (isEndKey(event)) {
      this.focusedIndex = this.options.length - 1;
      event.preventDefault();
      return;
    }

    // Handle arrow key navigation
    const direction = getNavigationDirection(event);
    if (direction === 'down' || direction === 'up') {
      this.focusedIndex = getNextIndex(this.focusedIndex, direction, this.options.length, {
        wrap: true,
      });
      event.preventDefault();
      return;
    }

    // Type-ahead search
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      this.handleTypeAhead(event.key);
      event.preventDefault();
    }
  }

  private handleTypeAhead(char: string): void {
    // Clear previous timeout
    if (this.typeAheadTimeout) {
      clearTimeout(this.typeAheadTimeout);
    }

    // Add character to buffer
    this.typeAheadBuffer += char.toLowerCase();

    // Find matching option
    const matchIndex = this.options.findIndex(option =>
      option.toLowerCase().startsWith(this.typeAheadBuffer)
    );

    if (matchIndex !== -1) {
      this.focusedIndex = matchIndex;
    }

    // Clear buffer after 500ms of no typing
    this.typeAheadTimeout = setTimeout(() => {
      this.typeAheadBuffer = '';
    }, 500);
  }

  get displayValue(): string {
    return this.selectedOptionState || this.placeholder;
  }

  isOptionFocused(index: number): boolean {
    return this.focusedIndex === index;
  }

  isOptionSelected(option: string): boolean {
    return this.selectedOptionState === option;
  }

  /**
   * Gets the unique ID for an option element
   * @param index - The index of the option
   * @returns string - The unique ID for the option
   */
  getOptionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  /**
   * Gets the ID of the currently focused option for aria-activedescendant
   * @returns string | null - The ID of the focused option or null if none focused
   */
  get activeDescendantId(): string | null {
    if (
      !this.dropdownVisible ||
      this.focusedIndex < 0 ||
      this.focusedIndex >= this.options.length
    ) {
      return null;
    }
    return this.getOptionId(this.focusedIndex);
  }
}
