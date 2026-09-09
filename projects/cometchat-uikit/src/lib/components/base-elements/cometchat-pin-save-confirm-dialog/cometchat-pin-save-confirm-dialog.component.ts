import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChatConfirmDialogComponent } from '../cometchat-confirm-dialog/cometchat-confirm-dialog.component';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';

/**
 * The pin/save actions that ask before acting.
 *
 * Only the removing directions. Pin and Save are additive and self-evident, so
 * they act immediately; the unpins and the unsave take something away —
 * unpinning removes the marker for everyone in the conversation, and an unsave
 * can drop the only pointer the user had to a message — and are worth a beat.
 */
export type PinSaveConfirmAction = 'unpin' | 'unsave' | 'unpin-conversation';

/**
 * The subset that acts on a MESSAGE.
 *
 * A surface holding a pending message action can hand it straight to
 * {@link PinSaveService.run}, which knows nothing about conversations — so the
 * conversation variant has to be excluded at the type level rather than guarded
 * at each call site.
 */
export type PinSaveConfirmMessageAction = Extract<PinSaveConfirmAction, 'unpin' | 'unsave'>;

/** Copy per action, keyed off the strings the kit already ships. */
const COPY: Record<PinSaveConfirmAction, string> = {
  unpin: 'message_unpin_confirm',
  unsave: 'message_unsave_confirm',
  'unpin-conversation': 'conversation_unpin_confirm',
};

/**
 * Confirmation for unpinning a message or a conversation, and for unsaving.
 *
 * One component for all three because the copy is the only thing that differs,
 * and it was previously duplicated at four call sites — each repeating the same
 * overlay, the same four string bindings and the same block of token overrides.
 * A fifth surface now gets it right by construction.
 *
 * Uses the brand-primary confirm button, not the danger variant: none of these
 * destroys anything, and each is undone by pinning or saving again.
 */
@Component({
  selector: 'cometchat-pin-save-confirm-dialog',
  standalone: true,
  imports: [CommonModule, CometChatConfirmDialogComponent],
  templateUrl: './cometchat-pin-save-confirm-dialog.component.html',
  styleUrls: ['./cometchat-pin-save-confirm-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatPinSaveConfirmDialogComponent {
  /** Which action is being confirmed. Drives all copy. */
  @Input({ required: true }) action!: PinSaveConfirmAction;

  @Output() confirmClick = new EventEmitter<void>();
  @Output() cancelClick = new EventEmitter<void>();

  get title(): string {
    return this.loc('title');
  }

  get messageText(): string {
    return this.loc('message');
  }

  get confirmButtonText(): string {
    return this.loc('yes');
  }

  get cancelButtonText(): string {
    return this.loc('no');
  }

  private loc(suffix: string): string {
    return CometChatLocalize.getLocalizedString(`${COPY[this.action]}_${suffix}`);
  }
}
