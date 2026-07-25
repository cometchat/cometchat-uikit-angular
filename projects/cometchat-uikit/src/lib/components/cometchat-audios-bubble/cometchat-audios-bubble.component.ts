import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import type { AudioAttachment } from '../../modals';
import { extractAudioAttachments } from '../cometchat-audio-bubble/cometchat-audio-bubble.utils';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatTextBubbleComponent } from '../cometchat-text-bubble/cometchat-text-bubble.component';
import { getMediaCaption } from '../../utils/message-metadata-utils';
import { triggerMediaDownload } from '../../utils/media-download';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

interface AudioRowState {
  currentTime: number;
  duration: number;
  playing: boolean;
}

/**
 * CometChatAudiosBubble — receive-side bubble for a (multi-)audio-file message (Phase 2).
 *
 * New design (WhatsApp-style, interim pending final @Pradeep): each audio row shows an
 * audio icon, a play/pause button, a flat slider (position/duration) and the file name.
 * Voice notes are handled by CometChatVoiceNoteBubble (routed via metadata.audioType).
 * Reuses `extractAudioAttachments` for the attachment list.
 */
@Component({
  selector: 'cometchat-audios-bubble',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe, CometChatTextBubbleComponent],
  templateUrl: './cometchat-audios-bubble.component.html',
  styleUrls: ['./cometchat-audios-bubble.component.css'],
})
export class CometChatAudiosBubbleComponent implements OnChanges {
  @Input({ required: true }) message!: CometChat.MediaMessage;
  @Input() alignment: MessageBubbleAlignment = MessageBubbleAlignment.left;

  /** True for outgoing (right-aligned) messages. Enum-safe comparison for the template. */
  protected get isSender(): boolean {
    return this.alignment === MessageBubbleAlignment.right;
  }

  private readonly cdr = inject(ChangeDetectorRef);

  protected attachments: AudioAttachment[] = [];
  protected states: AudioRowState[] = [];
  protected captionText = '';
  protected isExpanded = false;
  /** Row indices whose media can't be decoded as audio — rendered as a file row instead of a player. */
  protected errorIndices = new Set<number>();

  readonly unsupportedIconUrl = 'assets/unsupported.svg';

  readonly playIconUrl = 'assets/play_arrow.svg';
  readonly pauseIconUrl = 'assets/pause.svg';
  readonly downloadIconUrl = 'assets/download.svg';
  /** Chevrons on the expand / collapse bar. Masked, so they take the button's text colour. */
  readonly expandIconUrl = 'assets/keyboard_arrow_down.svg';
  readonly collapseIconUrl = 'assets/keyboard_arrow_up.svg';

  /** Rows shown before the list collapses behind a "+N more" toggle. Matches the React kit. */
  static readonly COLLAPSED_MAX = 3;

  private activeEl: HTMLAudioElement | null = null;
  private activeIndex = -1;

  /**
   * The rows rendered right now. The collapsed slice is a PREFIX of `attachments`, so a row's
   * index into `states` is the same in both states — no index remapping needed.
   */
  protected get visibleAttachments(): AudioAttachment[] {
    return this.isExpanded
      ? this.attachments
      : this.attachments.slice(0, CometChatAudiosBubbleComponent.COLLAPSED_MAX);
  }

  protected get hasOverflow(): boolean {
    return this.remainingCount > 0;
  }

  protected get remainingCount(): number {
    return Math.max(0, this.attachments.length - CometChatAudiosBubbleComponent.COLLAPSED_MAX);
  }

  protected get isMulti(): boolean {
    return this.attachments.length > 1;
  }

  /** "+N more", localized. */
  protected getShowMoreLabel(): string {
    return CometChatLocalize.getLocalizedString('bubble_show_more').replace(
      '{count}',
      String(this.remainingCount),
    );
  }

  protected toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
    this.cdr.markForCheck();
  }

  /**
   * Trigger a browser download for one row. Goes through the shared downloader so the file is
   * actually saved — an anchor aimed straight at the cross-origin CDN would only open it in a tab.
   */
  protected download(attachment: AudioAttachment): void {
    if (!attachment.url) {
      return;
    }
    triggerMediaDownload(attachment.url, attachment.name ?? 'audio');
  }

  ngOnChanges(): void {
    this.attachments = extractAudioAttachments(this.message) ?? [];
    this.states = this.attachments.map((a) => ({
      currentTime: 0,
      duration: a.duration ?? 0,
      playing: false,
    }));
    this.errorIndices = new Set<number>();
    this.captionText = getMediaCaption(this.message);
  }

  /** True when this row's media failed to load as audio (unsupported type / broken link). */
  protected isUnsupported(index: number): boolean {
    return this.errorIndices.has(index);
  }

  /**
   * The <audio> couldn't decode the source (it isn't a playable audio file, or the link is broken).
   * Swap the row to a file-style layout (icon + name + download) instead of a dead player.
   */
  protected onAudioError(index: number): void {
    this.errorIndices = new Set(this.errorIndices).add(index);
    this.cdr.markForCheck();
  }

  /** Play/pause one row; pauses any other currently-playing row. */
  togglePlay(index: number, el: HTMLAudioElement): void {
    if (this.activeEl && this.activeEl !== el) {
      this.activeEl.pause();
      if (this.activeIndex >= 0 && this.states[this.activeIndex]) {
        this.states[this.activeIndex].playing = false;
      }
    }
    if (el.paused) {
      void el.play();
      this.states[index].playing = true;
      this.activeEl = el;
      this.activeIndex = index;
    } else {
      el.pause();
      this.states[index].playing = false;
      this.activeEl = null;
      this.activeIndex = -1;
    }
    this.cdr.markForCheck();
  }

  onTimeUpdate(index: number, el: HTMLAudioElement): void {
    this.states[index].currentTime = el.currentTime;
    this.cdr.markForCheck();
  }

  onLoadedMetadata(index: number, el: HTMLAudioElement): void {
    if (Number.isFinite(el.duration)) {
      this.states[index].duration = el.duration;
      this.cdr.markForCheck();
    }
  }

  onEnded(index: number): void {
    this.states[index].playing = false;
    this.states[index].currentTime = 0;
    if (this.activeIndex === index) {
      this.activeEl = null;
      this.activeIndex = -1;
    }
    this.cdr.markForCheck();
  }

  onSeek(index: number, el: HTMLAudioElement, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    el.currentTime = value;
    this.states[index].currentTime = value;
    this.cdr.markForCheck();
  }

  /** `mm:ss` with zero-padded minutes (e.g. "00:32"), matching the design reference. */
  formatTime(seconds: number): string {
    const total = !seconds || seconds < 0 || !Number.isFinite(seconds) ? 0 : Math.floor(seconds);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
