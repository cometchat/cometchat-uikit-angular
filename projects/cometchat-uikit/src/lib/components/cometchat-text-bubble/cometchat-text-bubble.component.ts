/**
 * CometChatTextBubble Component
 *
 * Renders text messages with rich formatting: link previews, translations,
 * mentions, URL detection, rich text, content truncation, and single emoji display.
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  AfterViewInit,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  inject,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';
import { CometChatMentionsFormatter } from '../../formatters/cometchat-mentions-formatter';
import { FormatterConfigService } from '../../services/formatter-config.service';
import { HtmlSanitizerService } from '../../services/html-sanitizer.service';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';
import type { LinkPreviewData } from './cometchat-text-bubble.types';
import {
  extractMessageText,
  extractLinkPreviews,
  extractTranslation,
  extractMentionedUsers,
  extractRichTextHtml,
  detectSingleEmoji,
  detectSingleEmojiInRichText,
  stripInvalidMentionFormats,
  getDomainFromUrl,
} from './cometchat-text-bubble.utils';

// Re-export for backward compatibility
export type { LinkPreviewData } from './cometchat-text-bubble.types';

@Component({
  selector: 'cometchat-text-bubble',
  standalone: true,
  templateUrl: './cometchat-text-bubble.component.html',
  styleUrls: ['./cometchat-text-bubble.component.css'],
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatTextBubbleComponent implements OnInit, OnChanges, AfterViewInit {
  // ── GlobalConfig Priority System ──────────────────────────────────────────
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, { optional: true });
  private textFormattersExplicitlySet = signal(false);
  private _textFormatters = signal<CometChatTextFormatter[]>([]);

  // ── Inputs ────────────────────────────────────────────────────────────────
  @Input({ required: true }) message!: CometChat.TextMessage;
  @Input() alignment: MessageBubbleAlignment = MessageBubbleAlignment.left;

  @Input()
  set textFormatters(value: CometChatTextFormatter[] | undefined) {
    if (value != null) { this._textFormatters.set(value); this.textFormattersExplicitlySet.set(true); }
  }
  get textFormatters(): CometChatTextFormatter[] { return this._textFormatters(); }

  @Input() translatedTextOverride?: string;

  // ── Outputs ───────────────────────────────────────────────────────────────
  @Output() linkClick = new EventEmitter<string>();
  @Output() mentionClick = new EventEmitter<CometChat.User>();

  // ── Effective Values (GlobalConfig Priority) ──────────────────────────────
  effectiveTextFormatters = computed(() => {
    if (this.textFormattersExplicitlySet()) return this._textFormatters();
    if (this.globalConfig?.textFormatters !== undefined) return this.globalConfig.textFormatters;
    return [];
  });

  // ── View References ───────────────────────────────────────────────────────
  @ViewChild('contentElement', { read: ElementRef }) contentElement?: ElementRef<HTMLElement>;

  // ── Internal State ────────────────────────────────────────────────────────
  protected messageText = '';
  protected formattedText = '';
  protected translatedText = '';
  protected formattedTranslatedText = '';
  protected linkPreviews: LinkPreviewData[] = [];
  protected isSingleEmoji = false;
  protected isContentTruncated = false;
  protected isExpanded = false;
  protected contentHeight = 0;
  protected mentionedUsers: CometChat.User[] = [];
  protected isOutgoing = false;
  protected isRichText = false;

  readonly MessageBubbleAlignment = MessageBubbleAlignment;

  constructor(
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private formatterConfig: FormatterConfigService,
    private htmlSanitizer: HtmlSanitizerService
  ) {}

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.initializeTextFormatters().then(() => this.processMessage());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message'] || changes['alignment'] || changes['translatedTextOverride']) {
      this.processMessage();
    }
  }

  ngAfterViewInit(): void {
    this.checkContentTruncation();
  }

  // ── Initialization ────────────────────────────────────────────────────────

  private async initializeTextFormatters(): Promise<void> {
    let loggedInUser: CometChat.User | null = null;
    try { loggedInUser = await CometChat.getLoggedinUser(); } catch {
      console.warn('CometChatTextBubble: Could not get logged-in user for formatter context');
    }
    const formatters = this.effectiveTextFormatters();
    if (!formatters || formatters.length === 0) {
      if (loggedInUser) {
        this._textFormatters.set(this.formatterConfig.getFormattersWithContext(loggedInUser, this.alignment));
      }
    } else {
      formatters.forEach(formatter => {
        if (formatter instanceof CometChatMentionsFormatter) {
          if (loggedInUser) { formatter.setLoggedInUser(loggedInUser); }
          formatter.setMessageBubbleAlignment(this.alignment);
          if (this.message) {
            const mentioned = this.message.getMentionedUsers?.() || [];
            if (mentioned.length > 0) { formatter.setUsers(mentioned); }
          }
        }
      });
    }
  }

  // ── Message Processing ────────────────────────────────────────────────────

  private processMessage(): void {
    if (!this.message) return;
    this.messageText = extractMessageText(this.message);
    this.linkPreviews = extractLinkPreviews(this.message);
    this.translatedText = extractTranslation(this.message, this.translatedTextOverride);
    this.mentionedUsers = extractMentionedUsers(this.message);
    this.isOutgoing = this.alignment === MessageBubbleAlignment.right;

    const richTextHtml = extractRichTextHtml(this.message);
    this.isRichText = richTextHtml.length > 0;

    if (this.isRichText) {
      this.isSingleEmoji = detectSingleEmojiInRichText(richTextHtml);
      // Apply text formatters to rich text HTML as well (for custom formatters like hashtags)
      const sanitized = this.sanitizeHtml(richTextHtml);
      this.formattedText = this.applyFormattersToParsedHtml(sanitized);
    } else {
      this.isSingleEmoji = detectSingleEmoji(this.messageText);
      this.formattedText = this.applyTextFormatters(this.messageText);
    }

    this.formattedTranslatedText = this.translatedText
      ? this.applyTextFormatters(this.translatedText)
      : '';

    this.cdr.markForCheck();
  }

  // ── Text Formatting ───────────────────────────────────────────────────────

  private sanitizeHtml(html: string): string {
    if (!html || typeof html !== 'string' || html.trim() === '') return '';
    return this.htmlSanitizer.sanitize(html);
  }

  private applyTextFormatters(text: string): string {
    if (!text || typeof text !== 'string') return '';
    const escapedText = this.htmlSanitizer.escapeUserHtml(text);
    const formatters =
      this._textFormatters().length > 0 ? this._textFormatters() : this.effectiveTextFormatters();
    if (!formatters || formatters.length === 0) {
      return this.sanitizeHtml(stripInvalidMentionFormats(escapedText));
    }
    let formattedText = escapedText;
    for (const formatter of formatters) {
      try {
        if (!formatter.shouldFormat(formattedText, this.message)) continue;
        if (formatter instanceof CometChatMentionsFormatter) {
          const result = formatter.hasSdkMentions(formattedText)
            ? formatter.formatSdkMentions(formattedText, this.mentionedUsers)
            : formatter.format(formattedText);
          if (typeof result === 'string') { formattedText = result; }
        } else {
          const result = formatter.format(formattedText);
          if (typeof result === 'string') { formattedText = result; }
        }
      } catch (error) {
        console.warn('CometChatTextBubble: Error applying text formatter', error);
      }
    }
    return this.sanitizeHtml(stripInvalidMentionFormats(formattedText));
  }

  /**
   * Applies non-mentions formatters to already-sanitized rich text HTML.
   * Only processes text nodes (content outside of HTML tags) to avoid
   * breaking existing markup. Mentions formatter is skipped since rich text
   * already has mentions rendered.
   */
  private applyFormattersToParsedHtml(html: string): string {
    const formatters =
      this._textFormatters().length > 0 ? this._textFormatters() : this.effectiveTextFormatters();
    if (!formatters || formatters.length === 0) return html;

    // Only apply non-mentions formatters to text segments between HTML tags
    const nonMentionsFormatters = formatters.filter(
      f => !(f instanceof CometChatMentionsFormatter)
    );
    if (nonMentionsFormatters.length === 0) return html;

    // Split HTML into tags and text segments, only format text segments
    return html.replace(/([^<]+)(?=<|$)/g, (textSegment) => {
      let result = textSegment;
      for (const formatter of nonMentionsFormatters) {
        try {
          if (!formatter.shouldFormat(result)) continue;
          const formatted = formatter.format(result);
          if (typeof formatted === 'string') result = formatted;
        } catch { /* skip formatter errors */ }
      }
      return result;
    });
  }

  // ── Content Truncation ────────────────────────────────────────────────────

  private checkContentTruncation(): void {
    if (!this.contentElement?.nativeElement) { this.isContentTruncated = false; return; }
    const element = this.contentElement.nativeElement;
    this.contentHeight = element.scrollHeight;
    this.isContentTruncated = this.contentHeight > 80;
    this.cdr.markForCheck();
  }

  // ── Event Handlers ────────────────────────────────────────────────────────

  protected toggleReadMore(): void {
    this.isExpanded = !this.isExpanded;
    this.cdr.markForCheck();
  }

  protected onLinkPreviewClick(url: string): void {
    if (url) { window.open(url, '_blank', 'noopener,noreferrer'); this.linkClick.emit(url); }
  }

  protected onMentionClick(user: CometChat.User): void {
    if (user) { this.mentionClick.emit(user); }
  }

  protected onTextContentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    if (target.tagName === 'A' && target.classList.contains('cometchat-link')) {
      event.preventDefault(); event.stopPropagation();
      const url = target.getAttribute('href');
      if (url) { this.linkClick.emit(url); }
      return;
    }

    if (target.classList.contains('cometchat-mentions')) {
      event.preventDefault(); event.stopPropagation();
      const uid = target.getAttribute('data-uid');
      const mentionType = target.getAttribute('data-mention-type');
      if (mentionType === 'channel' || uid === 'all') return;
      if (uid && this.mentionedUsers.length > 0) {
        const user = this.mentionedUsers.find(u => u.getUid() === uid);
        if (user) { this.mentionClick.emit(user); }
      }
    }
  }

  // ── Template Utilities ────────────────────────────────────────────────────

  protected getDomainFromUrl(url: string): string {
    return getDomainFromUrl(url);
  }
}
