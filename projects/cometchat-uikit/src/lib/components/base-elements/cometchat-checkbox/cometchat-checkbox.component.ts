import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  OnInit,
  OnChanges, ChangeDetectionStrategy, SimpleChanges} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';

/**
 * CometChatCheckbox is a generic component for checkbox input.
 * It supports checked, disabled, and indeterminate states with full keyboard accessibility.
 */
@Component({
  selector: 'cometchat-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './cometchat-checkbox.component.html',
  styleUrls: ['./cometchat-checkbox.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CometChatCheckboxComponent),
      multi: true,
    },
  ],
})
export class CometChatCheckboxComponent implements ControlValueAccessor, OnInit, OnChanges {
  /** Checked state of the checkbox */
  @Input() checked = false;

  /** Label text for the checkbox */
  @Input() labelText = '';

  /** Disabled state */
  @Input() disabled = false;

  /** Indeterminate state (for partial selection) */
  @Input() indeterminate = false;

  /** Custom aria-label (overrides labelText for accessibility) */
  @Input() ariaLabel?: string;

  /** Emitted when checkbox value changes */
  @Output() checkboxChanged = new EventEmitter<{ checked: boolean; labelText: string }>();

  // Internal state
  isChecked = false;

  // Unique ID for label association
  readonly checkboxId = `cometchat-checkbox-${Math.random().toString(36).substr(2, 9)}`;

  // ControlValueAccessor implementation
  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.isChecked = this.checked;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['checked']) {
      this.isChecked = changes['checked'].currentValue;
    }
    if (changes['disabled'] && changes['disabled'].currentValue == null) {
      this.disabled = false;
    }
    if (changes['indeterminate'] && changes['indeterminate'].currentValue == null) {
      this.indeterminate = false;
    }
  }

  onCheckboxChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.isChecked = target.checked;
    this.indeterminate = false;

    this.onChange(this.isChecked);
    this.onTouched();

    this.checkboxChanged.emit({
      checked: this.isChecked,
      labelText: this.labelText,
    });
  }

  /**
   * Handles keyboard events for accessibility.
   * Space key toggles the checkbox (native behavior).
   */
  onKeyDown(event: KeyboardEvent): void {
    // Space key is handled natively by checkbox input
    // This method is here for potential future enhancements
    if (event.key === ' ') {
      // Native checkbox handles Space key, but we ensure it's not prevented
      // by any parent handlers
      event.stopPropagation();
    }
  }

  /**
   * Gets the accessible label for the checkbox.
   * Priority: custom ariaLabel > labelText > default
   */
  get accessibleLabel(): string {
    return (
      this.ariaLabel ||
      this.labelText ||
      CometChatLocalize.getLocalizedString('checkbox_aria_label')
    );
  }

  // ControlValueAccessor methods
  writeValue(value: boolean): void {
    this.isChecked = value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
