import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  HostListener,
  ElementRef,
  AfterViewInit,
  inject, OnDestroy, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChatRadioButtonComponent } from '../cometchat-radio-button/cometchat-radio-button.component';
import { CometChatButtonComponent } from '../cometchat-button/cometchat-button.component';
import { TranslatePipe } from '../../../resources/CometChatLocalize/translate.pipe';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';
import { LiveAnnouncerService } from '../../../services/live-announcer.service';

/**
 * CometChatChangeScope component provides a dialog for changing group member roles/scopes.
 * It displays an icon, title, description, radio button list, and action buttons.
 *
 * Accessibility Features:
 * - Full keyboard navigation support (Tab, Shift+Tab, Arrow keys, Enter, Space, Escape)
 * - ARIA attributes for screen reader support
 * - Visible focus indicators
 * - Focus management (auto-focus first radio button)
 *
 * @example
 * ```html
 * <cometchat-change-scope
 *   [title]="'Change Member Role'"
 *   [buttonText]="'Confirm'"
 *   [options]="['admin', 'moderator', 'participant']"
 *   [defaultSelection]="'participant'"
 *   (scopeChanged)="onScopeChange($event)"
 *   (closeClick)="onClose()">
 * </cometchat-change-scope>
 * ```
 */
@Component({
  selector: 'cometchat-change-scope',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CometChatRadioButtonComponent, CometChatButtonComponent, TranslatePipe],
  templateUrl: './cometchat-change-scope.component.html',
  styleUrls: ['./cometchat-change-scope.component.css'],
})
export class CometChatChangeScopeComponent implements OnInit, AfterViewInit, OnDestroy {
  /** @internal Timer references for cleanup */
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  constructor(private elementRef: ElementRef) {}

  // Inject LiveAnnouncerService for accessibility announcements
  private liveAnnouncer = inject(LiveAnnouncerService);

  /** Title of the change scope dialog */
  @Input() title = '';

  /** Text for the confirm button */
  @Input() buttonText = '';

  /** List of available scope options */
  @Input() options: string[] = [];

  /** Default selected scope */
  @Input() defaultSelection = '';

  /** Emitted when scope is changed - parent should handle async operation */
  @Output() scopeChanged = new EventEmitter<string>();

  /** Emitted when close/cancel button is clicked */
  @Output() closeClick = new EventEmitter<void>();

  // Internal state
  selectedValue = '';
  isLoading = false;
  isError = false;

  ngOnInit(): void {
    if (!this.title) {
      this.title = CometChatLocalize.getLocalizedString('change_scope_title');
    }
    if (!this.buttonText) {
      this.buttonText = CometChatLocalize.getLocalizedString('change_scope_confirm_yes');
    }
    this.selectedValue = this.defaultSelection;
  }

  ngAfterViewInit(): void {
    // Auto-focus the first radio button for keyboard accessibility
    this.focusFirstRadioButton();
  }

  /**
   * Handle Escape key to close dialog
   */
  @HostListener('keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.onCancelClick();
    }
  }

  /**
   * Focus the first radio button in the list
   */
  private focusFirstRadioButton(): void {
    this.pendingTimers.push(setTimeout(() => {
      const firstRadio = this.elementRef.nativeElement.querySelector(
        'cometchat-radio-button input[type="radio"]'
      );
      if (firstRadio) {
        firstRadio.focus();
      }
    }, 0));
  }

  /**
   * Handle radio button selection change
   */
  onSelectionChanged(event: { checked: boolean; id: string }): void {
    if (event.checked) {
      this.selectedValue = event.id;
    }
  }

  /**
   * Handle scope change button click
   */
  async onScopeChangeClick(): Promise<void> {
    this.isError = false;
    this.isLoading = true;

    try {
      this.scopeChanged.emit(this.selectedValue);
      // Announce scope change for screen readers
      this.liveAnnouncer.announce(
        CometChatLocalize.getLocalizedString('accessibility_scope_changed').replace(
          '{scope}',
          this.selectedValue
        ),
        'polite'
      );
    } catch (error) {
      this.setError();
    }
  }

  /**
   * Set success state (called by parent after successful operation)
   */
  setSuccess(): void {
    this.isLoading = false;
    this.isError = false;
  }

  /**
   * Set error state (called by parent after failed operation)
   */
  setError(): void {
    this.isError = true;
    this.isLoading = false;
  }

  /**
   * Handle cancel button click
   */
  onCancelClick(): void {
    this.closeClick.emit();
  }

  /**
   * Check if submit button should be disabled
   */
  get isSubmitDisabled(): boolean {
    return this.defaultSelection === this.selectedValue || this.isLoading;
  }
  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
  }

}
