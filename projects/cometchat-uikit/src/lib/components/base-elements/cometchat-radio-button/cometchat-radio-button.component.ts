import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  OnInit,
  OnChanges,
  ElementRef,
  Renderer2,
  HostListener, ChangeDetectionStrategy, SimpleChanges} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  getNavigationDirection,
  getNextIndex,
  NavigationDirection,
} from '../../../utils/keyboard-utils';

/**
 * CometChatRadioButton is a generic component for radio button input.
 * It supports grouping, keyboard navigation, and full accessibility.
 */
@Component({
  selector: 'cometchat-radio-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './cometchat-radio-button.component.html',
  styleUrls: ['./cometchat-radio-button.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CometChatRadioButtonComponent),
      multi: true,
    },
  ],
})
export class CometChatRadioButtonComponent implements ControlValueAccessor, OnInit, OnChanges {
  /** Checked state of the radio button */
  @Input() checked = false;

  /** Name for grouping radio buttons */
  @Input() name = 'radio-group';

  /** Label text for the radio button */
  @Input() labelText = '';

  /** Disabled state */
  @Input() disabled = false;

  /** Unique identifier for the radio button */
  @Input() id = '';

  /** Value of the radio button */
  @Input() value: string = '';

  /** Custom aria-label for accessibility */
  @Input() ariaLabel?: string;

  /** Emitted when radio button value changes */
  @Output() radioChanged = new EventEmitter<{ checked: boolean; labelText: string; id: string }>();

  // Internal state
  isChecked = false;

  // ControlValueAccessor implementation
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.isChecked = this.checked;
    if (!this.id) {
      this.id = `radio-${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['checked']) {
      this.isChecked = changes['checked'].currentValue;
      this.updateRadioGroup();
    }
  }

  onRadioChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.isChecked = target.checked;

    // Update all radio buttons in the same group
    this.updateRadioGroup();

    this.onChange(this.value);
    this.onTouched();

    this.radioChanged.emit({
      checked: this.isChecked,
      labelText: this.labelText,
      id: this.id,
    });
  }

  /**
   * Handle keyboard navigation for radio button groups
   * Arrow keys navigate between radio buttons in the same group and select them
   * Space key selects the current radio button
   */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.disabled) {
      return;
    }

    const target = event.target as HTMLInputElement;

    // Handle Space key to select radio button
    if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      if (!this.isChecked) {
        this.selectRadioButton();
      }
      return;
    }

    // Handle Arrow keys for group navigation
    const direction = getNavigationDirection(event);
    if (direction) {
      event.preventDefault();
      this.navigateToNextRadio(target, direction);
    }
  }

  /**
   * Selects this radio button and emits the change event
   */
  private selectRadioButton(): void {
    this.isChecked = true;
    this.updateRadioGroup();
    this.onChange(this.value);
    this.onTouched();
    this.radioChanged.emit({
      checked: this.isChecked,
      labelText: this.labelText,
      id: this.id,
    });
  }

  /**
   * Navigates to the next/previous radio button in the group and selects it
   * Skips disabled radio buttons during navigation
   */
  private navigateToNextRadio(
    currentTarget: HTMLInputElement,
    direction: NavigationDirection
  ): void {
    const radioButtons = Array.from(document.getElementsByName(this.name)) as HTMLInputElement[];

    if (radioButtons.length === 0) {
      return;
    }

    const currentIndex = radioButtons.findIndex(radio => radio === currentTarget);
    if (currentIndex === -1) {
      return;
    }

    // Use getNextIndex with skipDisabled callback to skip disabled radio buttons
    const nextIndex = getNextIndex(currentIndex, direction, radioButtons.length, {
      wrap: true,
      skipDisabled: (index: number) => radioButtons[index]?.disabled ?? false,
    });

    const nextRadio = radioButtons[nextIndex];
    if (nextRadio && !nextRadio.disabled) {
      nextRadio.focus();
      nextRadio.checked = true;

      // Trigger change event on the next radio button
      const changeEvent = new Event('change', { bubbles: true });
      nextRadio.dispatchEvent(changeEvent);
    }
  }

  /**
   * Updates all radio buttons in the same group to ensure only one is checked.
   * Note: In poll bubbles, this is handled by the parent component's data binding,
   * so we don't need to manually update the DOM.
   */
  private updateRadioGroup(): void {
    // Radio button state is managed by Angular's data binding via [checked] input
    // No manual DOM manipulation needed
  }

  /**
   * Gets the accessible label for the radio button.
   * Priority: custom ariaLabel > labelText > default
   */
  get accessibleLabel(): string | undefined {
    if (this.ariaLabel) {
      return this.ariaLabel;
    }
    if (this.labelText) {
      return this.labelText;
    }
    return undefined;
  }

  /**
   * Gets the aria-checked attribute value.
   * Returns "true" or "false" as strings for proper ARIA semantics.
   */
  get ariaCheckedValue(): string {
    return this.isChecked ? 'true' : 'false';
  }

  /**
   * Gets the aria-disabled attribute value.
   * Returns "true" when disabled, null otherwise (to remove the attribute).
   */
  get ariaDisabledValue(): string | null {
    return this.disabled ? 'true' : null;
  }

  // ControlValueAccessor methods
  writeValue(value: string): void {
    this.isChecked = value === this.value;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
