import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { CometChatAudioBubbleComponent } from '../cometchat-audio-bubble/cometchat-audio-bubble.component';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';

/**
 * CometChatVoiceNoteBubble — receive-side bubble for a voice note (Phase 2).
 *
 * A voice note is a `MESSAGE_TYPE.AUDIO` message tagged with `metadata.audioType === 'voiceNote'`
 * (set by the composer's recorder). It looks like today's voice note, so this delegates to the
 * existing `cometchat-audio-bubble` (waveform player). A distinct component so the routing can
 * pick it over `CometChatAudiosBubble` (audio files).
 */
@Component({
  selector: 'cometchat-voice-note-bubble',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CometChatAudioBubbleComponent],
  template: `<cometchat-audio-bubble
    [message]="message"
    [alignment]="alignment"
      [textFormatters]="textFormatters"
  ></cometchat-audio-bubble>`,
})
export class CometChatVoiceNoteBubbleComponent {
  @Input({ required: true }) message!: CometChat.MediaMessage;
  @Input() alignment: MessageBubbleAlignment = MessageBubbleAlignment.left;
  /**
   * Formatters applied to the caption's text. Forwarded to the bubble this one
   * delegates to, which renders the caption — nothing is applied here.
   */
  @Input() textFormatters?: CometChatTextFormatter[];
}
