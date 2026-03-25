import { Injectable, signal } from '@angular/core';

/**
 * Represents a mention suggestion in the autocomplete panel
 */
export interface MentionSuggestion {
  /** Unique identifier for the suggestion */
  id: string;
  /** Display name for the suggestion */
  name: string;
  /** Optional avatar URL */
  avatar?: string;
}

/**
 * Callbacks for mentions navigation events
 */
export interface MentionsNavigationCallbacks {
  /** Called when a suggestion is selected */
  onSelect: (suggestion: MentionSuggestion) => void;
  /** Called when the mentions panel should close */
  onClose: () => void;
}

/**
 * MentionsNavigationService provides keyboard navigation for mentions autocomplete.
 *
 * Implements the combobox pattern with aria-activedescendant for accessible
 * mentions autocomplete. Supports ArrowUp/Down navigation, Enter/Tab selection,
 * and Escape to close.
 *
 * Uses Angular signals for reactive state management of the highlighted index.
 *
 * @example
 * ```typescript
 * // In a message composer component
 * private mentionsService = inject(MentionsNavigationService);
 *
 * onComposerKeyDown(event: KeyboardEvent): void {
 *   if (this.isMentionsPanelOpen()) {
 *     const handled = this.mentionsService.handleKeyDown(
 *       event,
 *       this.suggestions(),
 *       {
 *         onSelect: (suggestion) => this.insertMention(suggestion),
 *         onClose: () => this.closeMentionsPanel()
 *       }
 *     );
 *
 *     if (handled) return;
 *   }
 *   // Handle other keys...
 * }
 *
 * // In template, use aria-activedescendant
 * <input
 *   [attr.aria-activedescendant]="mentionsService.getActiveDescendantId('mentions-list')"
 *   [attr.aria-controls]="isMentionsPanelOpen() ? 'mentions-list' : null"
 * />
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MentionsNavigationService {
  /**
   * Signal tracking the currently highlighted suggestion index.
   * -1 indicates no suggestion is highlighted.
   */
  private highlightedIndex = signal(-1);

  /**
   * Handles keyboard navigation in the mentions panel.
   * Returns true if the event was handled, false otherwise.
   *
   * Supported keys:
   * - ArrowDown: Move to next suggestion (wraps to first)
   * - ArrowUp: Move to previous suggestion (wraps to last)
   * - Enter/Tab: Select the highlighted suggestion
   * - Escape: Close the mentions panel
   *
   * @param event - The keyboard event to handle
   * @param suggestions - Array of available suggestions
   * @param callbacks - Callbacks for selection and close events
   * @returns boolean - true if the event was handled
   */
  handleKeyDown(
    event: KeyboardEvent,
    suggestions: MentionSuggestion[],
    callbacks: MentionsNavigationCallbacks
  ): boolean {
    if (!event || !suggestions || !callbacks || suggestions.length === 0) return false;

    const currentIndex = this.highlightedIndex();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = currentIndex < suggestions.length - 1 ? currentIndex + 1 : 0;
        this.highlightedIndex.set(nextIndex);
        return true;

      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : suggestions.length - 1;
        this.highlightedIndex.set(prevIndex);
        return true;

      case 'Enter':
      case 'Tab':
        if (currentIndex >= 0 && currentIndex < suggestions.length) {
          event.preventDefault();
          callbacks.onSelect(suggestions[currentIndex]);
          this.reset();
          return true;
        }
        return false;

      case 'Escape':
        event.preventDefault();
        callbacks.onClose();
        this.reset();
        return true;

      default:
        return false;
    }
  }

  /**
   * Gets the currently highlighted index.
   *
   * @returns number - The highlighted index, or -1 if none
   */
  getHighlightedIndex(): number {
    return this.highlightedIndex();
  }

  /**
   * Sets the highlighted index.
   * Use this to programmatically highlight a suggestion,
   * for example when the suggestions list changes.
   *
   * @param index - The index to highlight (-1 for none)
   */
  setHighlightedIndex(index: number): void {
    this.highlightedIndex.set(index);
  }

  /**
   * Resets the highlighted index to -1 (no selection).
   * Call this when closing the mentions panel or when
   * the suggestions list is cleared.
   */
  reset(): void {
    this.highlightedIndex.set(-1);
  }

  /**
   * Gets the ID for aria-activedescendant attribute.
   * Returns null if no suggestion is highlighted.
   *
   * The returned ID follows the pattern: `{baseId}-option-{index}`
   *
   * @param baseId - The base ID for the suggestions list
   * @returns string | null - The active descendant ID, or null if none
   *
   * @example
   * ```html
   * <input
   *   role="combobox"
   *   [attr.aria-activedescendant]="mentionsService.getActiveDescendantId('mentions-list')"
   * />
   * <ul id="mentions-list" role="listbox">
   *   <li *ngFor="let s of suggestions; let i = index"
   *       [id]="'mentions-list-option-' + i"
   *       role="option">
   *     {{ s.name }}
   *   </li>
   * </ul>
   * ```
   */
  getActiveDescendantId(baseId: string): string | null {
    const index = this.highlightedIndex();
    return index >= 0 ? `${baseId}-option-${index}` : null;
  }
}
