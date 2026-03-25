import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  signal, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CometChatButtonComponent } from '../cometchat-button/cometchat-button.component';
import { TranslatePipe } from '../../../resources/CometChatLocalize/translate.pipe';

/**
 * Link data interface for add/edit operations
 */
export interface LinkData {
  /** Display text for the link */
  text: string;
  /** URL for the link */
  url: string;
}

/**
 * CometChatLinkDialog is a dialog component for adding and editing links in rich text.
 * It includes input fields for link text and URL, with validation and action buttons.
 *
 * @example
 * ```html
 * <!-- Add Link Mode -->
 * <cometchat-link-dialog
 *   [mode]="'add'"
 *   [selectedText]="'Click here'"
 *   (save)="onSaveLink($event)"
 *   (cancel)="onCancelLink()"
 * ></cometchat-link-dialog>
 *
 * <!-- Edit Link Mode -->
 * <cometchat-link-dialog
 *   [mode]="'edit'"
 *   [initialText]="'Example'"
 *   [initialUrl]="'https://example.com'"
 *   (save)="onSaveLink($event)"
 *   (remove)="onRemoveLink()"
 *   (cancel)="onCancelLink()"
 * ></cometchat-link-dialog>
 * ```
 */
@Component({
  selector: 'cometchat-link-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, CometChatButtonComponent, TranslatePipe],
  templateUrl: './cometchat-link-dialog.component.html',
  styleUrls: ['./cometchat-link-dialog.component.css'],
})
export class CometChatLinkDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  /** @internal Timer references for cleanup */
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  /**
   * Dialog mode - 'add' for new links, 'edit' for existing links
   * @default 'add'
   */
  @Input() mode: 'add' | 'edit' = 'add';

  /**
   * Initial text value (for edit mode or pre-filled add mode)
   */
  @Input() initialText = '';

  /**
   * Initial URL value (for edit mode)
   */
  @Input() initialUrl = '';

  /**
   * Selected text from editor (used as default text in add mode)
   */
  @Input() selectedText = '';

  /**
   * Emitted when save button is clicked with valid link data
   */
  @Output() save = new EventEmitter<LinkData>();

  /**
   * Emitted when cancel button is clicked
   */
  @Output() cancel = new EventEmitter<void>();

  /**
   * Emitted when remove button is clicked (edit mode only)
   */
  @Output() remove = new EventEmitter<void>();

  /** Reference to the dialog container element */
  @ViewChild('dialogContainer', { static: false }) dialogContainer!: ElementRef<HTMLDivElement>;

  /** Reference to the text input element */
  @ViewChild('textInput', { static: false }) textInput!: ElementRef<HTMLInputElement>;

  /** Reference to the URL input element */
  @ViewChild('urlInput', { static: false }) urlInput!: ElementRef<HTMLInputElement>;

  /** Unique ID for the title element for aria-labelledby */
  titleId = `cometchat-link-dialog-title-${Math.random().toString(36).substr(2, 9)}`;

  /** Unique ID for the error message element for aria-describedby */
  errorId = `cometchat-link-dialog-error-${Math.random().toString(36).substr(2, 9)}`;

  /** Link text value */
  linkText = signal<string>('');

  /** Link URL value */
  linkUrl = signal<string>('');

  /** Validation error message */
  errorMessage = signal<string>('');

  /** Store the previously focused element for restoration */
  private previouslyFocusedElement: HTMLElement | null = null;

  /** Store all focusable elements within the dialog */
  private focusableElements: HTMLElement[] = [];

  /** Keyboard event listener reference for cleanup */
  private keydownListener: ((event: KeyboardEvent) => void) | null = null;

  /** URL validation regex */
  private urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;

  ngOnInit(): void {
    // Initialize values based on mode
    if (this.mode === 'edit') {
      this.linkText.set(this.initialText);
      this.linkUrl.set(this.initialUrl);
    } else {
      // Add mode - use selected text or initial text
      this.linkText.set(this.selectedText || this.initialText);
      this.linkUrl.set(this.initialUrl);
    }

    // Store the currently focused element to restore later
    this.previouslyFocusedElement = document.activeElement as HTMLElement;

    // Add keyboard event listener for Escape key
    this.keydownListener = this.handleKeydown.bind(this);
    document.addEventListener('keydown', this.keydownListener);
  }

  ngAfterViewInit(): void {
    // Set up focus trapping after view is initialized
    this.setupFocusTrap();

    // Focus the appropriate input field
    this.pendingTimers.push(setTimeout(() => {
      if (this.mode === 'add' && !this.linkText()) {
        // Add mode with no text - focus text input
        this.textInput?.nativeElement.focus();
      } else {
        // Edit mode or add mode with text - focus URL input
        this.urlInput?.nativeElement.focus();
        // Select all text in URL input for easy replacement
        this.urlInput?.nativeElement.select();
      }
    }, 0));
  }

  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
    // Remove keyboard event listener
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener);
    }

    // Restore focus to the previously focused element
    this.restoreFocus();
  }

  /**
   * Sets up focus trapping within the dialog.
   * Finds all focusable elements and adds Tab key handling.
   */
  private setupFocusTrap(): void {
    if (!this.dialogContainer) {
      return;
    }

    // Find all focusable elements within the dialog
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];

    const elements = this.dialogContainer.nativeElement.querySelectorAll(
      focusableSelectors.join(', ')
    );

    this.focusableElements = Array.from(elements) as HTMLElement[];
  }

  /**
   * Handles keyboard events for accessibility.
   * - Escape key: closes the dialog
   * - Tab key: traps focus within the dialog
   * - Enter key: saves the link (if valid)
   */
  private handleKeydown(event: KeyboardEvent): void {
    // Handle Escape key to close dialog
    if (event.key === 'Escape') {
      event.preventDefault();
      this.handleCancelClick();
      return;
    }

    // Handle Enter key to save (if not in a button)
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      this.handleSaveClick();
      return;
    }

    // Handle Tab key for focus trapping
    if (event.key === 'Tab' && this.focusableElements.length > 0) {
      const firstElement = this.focusableElements[0];
      const lastElement = this.focusableElements[this.focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      // If Shift+Tab on first element, move to last element
      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
      // If Tab on last element, move to first element
      else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Restores focus to the element that was focused before the dialog opened.
   */
  private restoreFocus(): void {
    if (
      this.previouslyFocusedElement &&
      typeof this.previouslyFocusedElement.focus === 'function'
    ) {
      // Use setTimeout to ensure the dialog is fully removed from DOM
      this.pendingTimers.push(setTimeout(() => {
        this.previouslyFocusedElement?.focus();
      }, 0));
    }
  }

  /**
   * Validates the URL format
   */
  private validateUrl(url: string): boolean {
    if (!url || url.trim() === '') {
      return false;
    }
    // Accept any non-empty URL string (Req 2.20)
    return true;
  }

  /**
   * Normalizes URL by adding protocol if missing
   */
  private normalizeUrl(url: string): string {
    const trimmedUrl = url.trim();

    // Check if URL already has any protocol
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(trimmedUrl) || /^mailto:/i.test(trimmedUrl)) {
      return trimmedUrl;
    }

    return `https://${trimmedUrl}`;
  }

  /**
   * Handles save button click.
   * Validates inputs and emits save event with link data.
   */
  handleSaveClick(): void {
    // Clear previous error
    this.errorMessage.set('');

    const text = this.linkText().trim();
    const url = this.linkUrl().trim();

    // Validate text (required in add mode, optional in edit mode)
    if (this.mode === 'add' && !text) {
      this.errorMessage.set('message_composer_link_text_required');
      this.textInput?.nativeElement.focus();
      return;
    }

    // Validate URL (required)
    if (!url) {
      this.errorMessage.set('message_composer_link_url_required');
      this.urlInput?.nativeElement.focus();
      return;
    }

    if (!this.validateUrl(url)) {
      this.errorMessage.set('message_composer_link_url_invalid');
      this.urlInput?.nativeElement.focus();
      return;
    }

    // Normalize URL and emit save event
    const normalizedUrl = this.normalizeUrl(url);
    this.save.emit({
      text: text || normalizedUrl, // Use URL as text if text is empty
      url: normalizedUrl,
    });
  }

  /**
   * Handles cancel button click.
   * Emits cancel event.
   */
  handleCancelClick(): void {
    this.cancel.emit();
  }

  /**
   * Handles remove button click (edit mode only).
   * Emits remove event.
   */
  handleRemoveClick(): void {
    this.remove.emit();
  }

  /**
   * Handles text input change
   */
  onTextChange(value: string): void {
    this.linkText.set(value);
    // Clear error when user starts typing
    if (this.errorMessage()) {
      this.errorMessage.set('');
    }
  }

  /**
   * Handles URL input change
   */
  onUrlChange(value: string): void {
    this.linkUrl.set(value);
    // Clear error when user starts typing
    if (this.errorMessage()) {
      this.errorMessage.set('');
    }
  }
}
