import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  HostListener,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { getLocalizedString } from '../../../resources/CometChatLocalize/cometchat-localize';
import { handleActivation } from '../../../utils/keyboard-utils';

@Component({
  selector: 'cometchat-search-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './cometchat-search-bar.component.html',
  styleUrls: ['./cometchat-search-bar.component.css'],
})
export class CometChatSearchBarComponent implements OnInit, OnChanges, OnDestroy {
  /** Initial/controlled search text value */
  @Input() searchText = '';
  /** Placeholder text for the search input */
  @Input() placeholderText: string = getLocalizedString('search_placeholder');
  /** Debounce delay in milliseconds (default: 300ms) */
  @Input() debounceDelay = 300;
  /** Custom aria-label for the search input (overrides placeholderText) */
  @Input() ariaLabel?: string;

  /** Emitted when search text changes (debounced) */
  @Output() searchChanged = new EventEmitter<{ value: string }>();
  /** Emitted when clear button is clicked */
  @Output() clearClick = new EventEmitter<void>();
  /**
   * Emitted when ArrowDown is pressed to move focus to the first list item.
   * Parent components should listen to this event and focus the first item in their list.
   * Requirement 12.3: ArrowDown from search bar moves focus to first list item
   */
  @Output() focusFirstListItem = new EventEmitter<void>();

  // Internal state
  searchValue = '';
  private searchSubject = new Subject<string>();
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  ngOnInit(): void {
    this.searchValue = this.searchText;

    // Set up debounced search using takeUntilDestroyed for automatic cleanup
    this.searchSubject
      .pipe(debounceTime(this.debounceDelay), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.searchChanged.emit({ value });
      });
  }

  ngOnChanges(): void {
    if (this.searchValue !== this.searchText) {
      this.searchValue = this.searchText;
    }
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  /**
   * Handle keyboard events for accessibility
   * Implements:
   * - Escape key to clear search (Requirement 12.4)
   * - ArrowDown to move focus to first list item (Requirement 12.3)
   */
  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    // Escape: Clear search text (Requirement 12.4)
    if (event.key === 'Escape' && this.searchValue.length > 0) {
      event.preventDefault();
      this.onClearClick();
      return;
    }

    // ArrowDown: Move focus to first list item (Requirement 12.3)
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.focusFirstListItem.emit();
      return;
    }
  }

  onSearchValueChange(value: string): void {
    this.searchValue = value;
    this.searchSubject.next(value);
  }

  /** @deprecated Use onSearchValueChange instead */
  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchValue = target.value;
    this.searchSubject.next(this.searchValue);
  }

  onClearClick(): void {
    this.searchValue = '';
    this.searchSubject.next('');
    this.clearClick.emit();
    // Maintain cursor focus after clearing
    this.searchInputRef?.nativeElement?.focus();
  }

  get showClearButton(): boolean {
    return this.searchValue.length > 0;
  }

  /**
   * Get the aria-label for the search input
   * Uses custom ariaLabel if provided, otherwise falls back to placeholderText
   */
  get searchAriaLabel(): string {
    return this.ariaLabel || this.placeholderText;
  }

  /**
   * Get the aria-label for the clear button using localization
   * Requirement 6.5: Clear button shall have aria-label for screen reader context
   */
  get clearButtonAriaLabel(): string {
    return getLocalizedString('accessibility_clear_search');
  }

  /**
   * Handle keyboard events on the clear button
   * Requirement 6.6: Clear button shall be activatable via Enter or Space keys
   */
  onClearKeyDown(event: KeyboardEvent): void {
    handleActivation(event, () => this.onClearClick());
  }
}
