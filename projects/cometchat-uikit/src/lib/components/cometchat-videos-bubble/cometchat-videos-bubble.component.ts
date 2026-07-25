import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { CometChatVideoBubbleComponent } from '../cometchat-video-bubble/cometchat-video-bubble.component';

/**
 * CometChatVideosBubble — receive-side bubble for a (multi-)video message (Phase 2).
 * Delegates to the existing `cometchat-video-bubble` (grid/overflow/player/caption). A distinct
 * component so the batch-aware width and grouping live here; the single-attachment
 * `cometchat-video-bubble` is the deprecated primitive it delegates to.
 */
@Component({
  selector: 'cometchat-videos-bubble',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CometChatVideoBubbleComponent],
  template: `<cometchat-video-bubble
    [message]="message"
    [alignment]="alignment"
    [disableInteraction]="disableInteraction"
  ></cometchat-video-bubble>`,
  // All four batch bubbles share one width via --cometchat-multi-attachment-width, so every message
  // in a batch lines up. Defaults to 400px, matching the React kit's container cap; set the token to
  // 100% to let batch media fill the bubble instead. The inner max-height caps stay relaxed so a
  // 16:9 video fills that width instead of leaving empty space.
  styles: [`
    :host { display: block; width: 100%; }
    :host {
      --cometchat-batch-width: var(--cometchat-multi-attachment-width, 400px);
      --cometchat-video-bubble-max-width: var(--cometchat-batch-width);
      --cometchat-video-bubble-single-max-width: var(--cometchat-batch-width);
      --cometchat-video-bubble-grid-max-width: var(--cometchat-batch-width);
      --cometchat-video-bubble-grid-2x2-max-width: var(--cometchat-batch-width);
      --cometchat-video-bubble-overflow-max-width: var(--cometchat-batch-width);
      --cometchat-video-bubble-container-max-width: var(--cometchat-batch-width);
      --cometchat-video-bubble-max-height: none;
      --cometchat-video-bubble-single-max-height: none;
    }
  `],
})
export class CometChatVideosBubbleComponent {
  @Input({ required: true }) message!: CometChat.MediaMessage;
  @Input() alignment: MessageBubbleAlignment = MessageBubbleAlignment.left;
  @Input() disableInteraction = false;
}
