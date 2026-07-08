/**
 * CometChatCardBubble Component.
 *
 * First-party, built-in bubble for persisted **developer cards**
 * (`message.category === "card"`). Mirrors `CometChatTextBubble`'s role as a
 * standard message bubble — the message-bubble wrapper supplies the container,
 * receipts, reactions, long-press options, reply and thread; this component only
 * replaces the *content view* with the rendered card.
 *
 * Render-only contract: the raw card payload from `getCard()` is stringified and
 * handed to the prebuilt `CometChatCardView` renderer verbatim (zero transformation).
 * The renderer's action callback is wired declaratively via `(action)`, which
 * Angular subscribes at view-creation time — i.e. *before* `[cardJson]` is
 * assigned — satisfying the "callback before schema" requirement.
 *
 * Actions are pure-forwarded on BOTH channels: the `(onCardAction)`
 * `@Output()` (for apps that render this bubble directly) and the global
 * `CometChatMessageEvents.ccCardActionClicked` bus (for the standard, internally
 * rendered flow). The bubble itself implements no action behavior.
 */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  input,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatCardViewComponent } from '@cometchat/cards-angular';
import type {
  CometChatCardActionEvent,
  CometChatCardThemeMode,
  CometChatCardThemeOverride,
} from '@cometchat/cards-angular';

import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { cardPayloadToJson, safeString } from '../../utils/card-utils';

/** Payload emitted by the bubble's `onCardAction` output. */
export interface CardBubbleAction {
  message: CometChat.CardMessage;
  action: unknown;
}

@Component({
  selector: 'cometchat-card-bubble',
  standalone: true,
  templateUrl: './cometchat-card-bubble.component.html',
  styleUrls: ['./cometchat-card-bubble.component.css'],
  imports: [CometChatCardViewComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatCardBubbleComponent {
  /** The developer card message to render. */
  readonly message = input.required<CometChat.CardMessage>();

  /** Theme mode passed straight to the renderer. */
  @Input() themeMode: CometChatCardThemeMode = 'auto';

  /** Optional renderer theme overrides. */
  @Input() themeOverride?: CometChatCardThemeOverride;

  /** Pure-forward of the raw renderer action (developer-card prop channel). */
  @Output() onCardAction = new EventEmitter<CardBubbleAction>();

  /** Stringified raw card payload (`''` when there is nothing drawable). */
  protected readonly cardJson = computed(() => {
    let card: unknown;
    try {
      card = this.message().getCard?.();
    } catch {
      card = undefined;
    }
    return cardPayloadToJson(card);
  });

  /** Whether a non-empty card payload is present. */
  protected readonly hasCard = computed(() => this.cardJson() !== '');

  /**
   * Single-line fallback for the empty/invalid-payload case:
   * `getFallbackText()` → `getText()` → "Card Message". Lazy — the template only
   * reads it when `hasCard()` is false.
   */
  protected readonly fallbackText = computed(
    () =>
      safeString(() => this.message().getFallbackText?.()) ||
      safeString(() => this.message().getText?.())
  );

  /**
   * Forwards the raw renderer action on BOTH channels. The bubble runs
   * no behavior of its own. Apps should act on one channel only to avoid
   * double-handling (a stable messageId is available for dedupe).
   */
  protected handleAction(event: CometChatCardActionEvent): void {
    const action = event?.action;
    this.onCardAction.emit({ message: this.message(), action });
    CometChatMessageEvents.ccCardActionClicked.next({
      message: this.message(),
      action,
      elementId: event?.elementId,
      cardJson: event?.cardJson,
    });
  }
}
