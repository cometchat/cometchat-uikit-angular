import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * CometChatAvatar displays an avatar image or initials derived from a name.
 * If an image URL is provided, the component displays the image.
 * If the image fails to load or no image is provided, it shows initials from the name.
 *
 * @example
 * ```html
 * <cometchat-avatar [image]="user.avatar" [name]="user.name"></cometchat-avatar>
 * ```
 */
@Component({
  selector: 'cometchat-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './cometchat-avatar.component.html',
  styleUrls: ['./cometchat-avatar.component.css'],
})
export class CometChatAvatarComponent implements OnChanges {
  /** URL of the avatar image to be displayed */
  @Input() image = '';

  /** Name used for displaying initials in the avatar */
  @Input() name = '';

  /** Controls image loading strategy. Use 'eager' for above-the-fold avatars. */
  @Input() loading: 'lazy' | 'eager' = 'lazy';

  /** Internal state to track if image failed to load */
  imageError = false;

  /**
   * Normalizes null/undefined inputs to their default values.
   * Prevents NG0100 ExpressionChangedAfterItHasBeenCheckedError.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['image'] && changes['image'].currentValue == null) {
      this.image = '';
    }
    if (changes['name'] && changes['name'].currentValue == null) {
      this.name = '';
    }
    if (changes['image']) {
      this.imageError = false;
    }
  }

  /**
   * Generates initials from the name.
   * - If name has multiple words: first char of first word + first char of second word (uppercase)
   * - If name is single word: first two characters (uppercase)
   * - If name is empty: empty string
   */
  get initials(): string {
    if (!this.name) return '';

    const splitName = this.name
      .trim()
      .split(' ')
      .filter(part => part.length > 0);

    if (splitName.length > 1) {
      return (splitName[0].substring(0, 1) + splitName[1].substring(0, 1)).toUpperCase();
    }

    return this.name.substring(0, 2).toUpperCase();
  }

  /**
   * Determines if the image should be shown.
   * Shows image only if image URL exists and no error occurred.
   */
  get showImage(): boolean {
    return !!this.image && !this.imageError;
  }

  /**
   * Generates an accessible label for screen readers.
   * Describes the avatar content for assistive technologies.
   */
  get ariaLabel(): string {
    if (this.name) {
      return `Avatar for ${this.name}`;
    }
    return 'Avatar';
  }

  /**
   * Handles image load error by setting imageError flag.
   * This triggers fallback to initials display.
   */
  onImageError(): void {
    this.imageError = true;
  }

  /**
   * Resets error state when image input changes.
   * Called via ngOnChanges or can be triggered manually.
   */
  resetImageError(): void {
    this.imageError = false;
  }
}
