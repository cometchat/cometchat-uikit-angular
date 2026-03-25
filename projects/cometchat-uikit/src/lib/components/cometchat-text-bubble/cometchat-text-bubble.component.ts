/**
 * CometChatTextBubble Component
 *
 * A standalone component for rendering text messages within the chat interface.
 * This component provides advanced text rendering capabilities including:
 * - Link previews with rich preview cards
 * - Message translations
 * - Mentions formatting (@user, @all)
 * - URL detection and clickability
 * - Rich text formatting (bold, italic, lists, code blocks)
 * - Intelligent content truncation with read more/less
 * - Single emoji detection with larger display
 * - HTML sanitization for XSS prevention
 *
 * @module components/cometchat-text-bubble
 * @see Requirements 14.1, 14.2, 14.5
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

/**
 * Link Preview Data Structure
 *
 * Represents the data extracted from message metadata for displaying
 * rich link preview cards.
 *
 * @interface LinkPreviewData
 * @see Requirements 1.2, 7.1
 */
export interface LinkPreviewData {
  /** The URL of the link */
  url: string;
  /** The title of the linked page (optional) */
  title?: string;
  /** A description of the linked page (optional) */
  description?: string;
  /** The URL of a preview image (optional) */
  image?: string;
  /** The URL of the favicon (optional) */
  favicon?: string;
}

/**
 * CometChatTextBubble is a standalone Angular component that renders
 * text messages with rich formatting capabilities.
 *
 * Features:
 * - Message object processing with metadata extraction
 * - Link preview display from message metadata
 * - Message translation display
 * - Mentions formatting with interactive behavior
 * - URL detection and formatting
 * - Rich text rendering
 * - Content truncation with read more/less
 * - Single emoji detection with larger display
 * - Sender/receiver styling variants
 * - Full accessibility support
 *
 * @example
 * ```html
 * <cometchat-text-bubble
 *   [message]="textMessage"
 *   [alignment]="MessageBubbleAlignment.LEFT"
 *   (linkClick)="onLinkClick($event)"
 *   (mentionClick)="onMentionClick($event)">
 * </cometchat-text-bubble>
 * ```
 *
 * @see Requirements 14.1 - THE Text_Bubble SHALL be implemented as a standalone Angular component
 * @see Requirements 14.2 - THE Text_Bubble SHALL export all public APIs through an index.ts barrel file
 * @see Requirements 14.5 - THE Text_Bubble SHALL follow the established component directory structure
 */
@Component({
  selector: 'cometchat-text-bubble',
  standalone: true,
  templateUrl: './cometchat-text-bubble.component.html',
  styleUrls: ['./cometchat-text-bubble.component.css'],
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatTextBubbleComponent implements OnInit, OnChanges, AfterViewInit {
  // ============================================
  // Injected Services (GlobalConfig)
  // ============================================

  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, {
    optional: true,
  });

  // ============================================
  // ExplicitlySet Flags & Backing Fields (GlobalConfig Priority System)
  // ============================================

  private textFormattersExplicitlySet = signal(false);
  private _textFormatters = signal<CometChatTextFormatter[]>([]);

  // ============================================
  // Inputs
  // ============================================

  /**
   * The CometChat.TextMessage object to render.
   * This is the primary data source for the component.
   *
   * @required
   * @see Requirements 1.1, 1.2, 1.3, 1.4, 1.5
   */
  @Input({ required: true }) message!: CometChat.TextMessage;

  /**
   * The alignment of the message bubble.
   * LEFT for incoming/receiver messages, RIGHT for outgoing/sender messages.
   *
   * @default MessageBubbleAlignment.left
   * @see Requirements 9.1, 9.2
   */
  @Input() alignment: MessageBubbleAlignment = MessageBubbleAlignment.left;

  /**
   * Array of text formatters to apply to the message text.
   * If not provided, default formatters (mentions, URLs) will be used.
   *
   * @see Requirements 2.3, 2.4
   */
  @Input()
  set textFormatters(value: CometChatTextFormatter[] | undefined) {
    if (value != null) {
      this._textFormatters.set(value);
      this.textFormattersExplicitlySet.set(true);
    }
  }
  get textFormatters(): CometChatTextFormatter[] {
    return this._textFormatters();
  }

  /**
   * Override for translated text.
   * When provided, this text will be displayed as the translation instead of
   * extracting from message metadata. This allows parent components to pass
   * translated text from external translation services.
   *
   * @see Requirement 14.3 - Display original and translated text
   */
  @Input() translatedTextOverride?: string;

  // ============================================
  // Outputs
  // ============================================

  /**
   * Emitted when a link preview card or URL link is clicked.
   * Contains the URL string.
   *
   * @see Requirements 7.9, 13.1, 13.3
   */
  @Output() linkClick = new EventEmitter<string>();

  /**
   * Emitted when a formatted mention is clicked.
   * Contains the CometChat.User object of the mentioned user.
   *
   * @see Requirements 5.5, 13.2
   */
  @Output() mentionClick = new EventEmitter<CometChat.User>();

  // ============================================
  // Effective Values (GlobalConfig Priority System)
  // ============================================

  /**
   * Resolved textFormatters value using 3-tier priority:
   * 1. Explicitly set @Input value
   * 2. GlobalConfig value (if defined)
   * 3. Component default ([])
   */
  effectiveTextFormatters = computed(() => {
    if (this.textFormattersExplicitlySet()) return this._textFormatters();
    if (this.globalConfig?.textFormatters !== undefined) return this.globalConfig.textFormatters;
    return [];
  });

  // ============================================
  // ViewChild References
  // ============================================

  /**
   * Reference to the content element for height measurement.
   * Used to determine if content should be truncated.
   *
   * @see Requirements 4.1
   */
  @ViewChild('contentElement', { read: ElementRef }) contentElement?: ElementRef<HTMLElement>;

  // ============================================
  // Internal State
  // ============================================

  /** The original text extracted from the message */
  protected messageText = '';

  /** The formatted text after applying formatters and sanitization */
  protected formattedText = '';

  /** The translated text from message metadata (if exists) */
  protected translatedText = '';

  /** The formatted translated text after applying formatters and sanitization */
  protected formattedTranslatedText = '';

  /** Array of link preview data extracted from message metadata */
  protected linkPreviews: LinkPreviewData[] = [];

  /** Whether the message is a single emoji */
  protected isSingleEmoji = false;

  /** Whether the content exceeds the truncation threshold */
  protected isContentTruncated = false;

  /** Whether the content is currently expanded (read more clicked) */
  protected isExpanded = false;

  /** The measured height of the content element */
  protected contentHeight = 0;

  /** Array of mentioned users extracted from the message */
  protected mentionedUsers: CometChat.User[] = [];

  /** Whether the message is outgoing (sender is logged-in user) */
  protected isOutgoing = false;

  /** Whether the current message uses rich text from metadata */
  protected isRichText = false;

  // ============================================
  // Template Exposed Properties
  // ============================================

  /** Expose MessageBubbleAlignment enum to template */
  readonly MessageBubbleAlignment = MessageBubbleAlignment;

  // ============================================
  // Constructor
  // ============================================

  constructor(
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private formatterConfig: FormatterConfigService,
    private htmlSanitizer: HtmlSanitizerService
  ) {}

  // ============================================
  // Lifecycle Hooks
  // ============================================

  /**
   * Initialize the component.
   * Sets up default text formatters and processes the message.
   */
  ngOnInit(): void {
    // Initialize formatters asynchronously, then process message
    this.initializeTextFormatters().then(() => {
      this.processMessage();
    });
  }

  /**
   * Handle input changes.
   * Reprocesses the message when the message or alignment input changes.
   *
   * @param changes - The changed inputs
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message'] || changes['alignment'] || changes['translatedTextOverride']) {
      this.processMessage();
    }
  }

  /**
   * After view initialization, measure content height for truncation.
   * This lifecycle hook is called after Angular has fully initialized
   * the component's view and child views.
   *
   * @see Requirements 4.1 - WHEN text content height exceeds 80 pixels (approximately 4 lines),
   *      THE Text_Bubble SHALL truncate the content
   */
  ngAfterViewInit(): void {
    // Measure content height after the view has been initialized
    // This ensures the DOM elements are rendered and measurable
    this.checkContentTruncation();
  }

  // ============================================
  // Private Methods - Initialization
  // ============================================

  /**
   * Initialize default text formatters if none provided.
   * Uses FormatterConfigService to get default formatters with context.
   *
   * This method checks if the textFormatters input array is empty. If empty,
   * it gets default formatters from FormatterConfigService configured with
   * the logged-in user and message alignment. If formatters are provided via
   * input, they are configured with context and used as-is.
   *
   * @private
   * @see Requirements 2.4 - WHEN text formatters are not provided, THE Text_Bubble SHALL
   *      use default formatters (CometChatMentionsFormatter and CometChatUrlsFormatter)
   * @see Requirements 11.1, 11.2, 11.3 - Use FormatterConfigService for default formatters
   */
  private async initializeTextFormatters(): Promise<void> {
    // Get logged-in user for formatter context
    let loggedInUser!: CometChat.User | null;
    try {
      loggedInUser = await CometChat.getLoggedinUser();
    } catch {
      // Continue without logged-in user if unavailable
      console.warn('CometChatTextBubble: Could not get logged-in user for formatter context');
    }

    // Check if effective textFormatters (respecting GlobalConfig priority) is empty
    const formatters = this.effectiveTextFormatters();
    if (!formatters || formatters.length === 0) {
      // Get default formatters from FormatterConfigService with context
      // This includes mentions and URL formatters configured with:
      // - Logged-in user for self-mention detection
      // - Message alignment for direction CSS classes
      if (loggedInUser) {
        this._textFormatters.set(this.formatterConfig.getFormattersWithContext(
          loggedInUser,
          this.alignment
        ));
      }
    } else {
      // If formatters are provided via input or GlobalConfig, configure them with context
      formatters.forEach(formatter => {
        if (formatter instanceof CometChatMentionsFormatter) {
          // Configure mentions formatter with logged-in user
          if (loggedInUser) {
            formatter.setLoggedInUser(loggedInUser);
          }
          // Configure mentions formatter with message alignment
          formatter.setMessageBubbleAlignment(this.alignment);
          // Set mentioned users from message for matching
          if (this.message) {
            const mentionedUsers = this.message.getMentionedUsers?.() || [];
            if (mentionedUsers.length > 0) {
              formatter.setUsers(mentionedUsers);
            }
          }
        }
      });
    }
  }

  // ============================================
  // Private Methods - Message Processing
  // ============================================

  /**
   * Process the message object and extract all relevant data.
   *
   * @private
   */
  private processMessage(): void {
    if (!this.message) {
      return;
    }

    // Extract message data
    this.messageText = this.extractMessageText();
    this.linkPreviews = this.extractLinkPreviews();
    this.translatedText = this.extractTranslation();
    this.mentionedUsers = this.extractMentionedUsers();
    this.isOutgoing = this.alignment === MessageBubbleAlignment.right;

    // Check for rich text metadata
    // Note: richText metadata is no longer sent by the composer
    // All messages now use the plain text path with Markdown formatting
    // This ensures formatters always run (mentions, markdown, URLs, custom)
    const richTextHtml = this.extractRichTextHtml();
    this.isRichText = richTextHtml.length > 0;

    if (this.isRichText) {
      // Legacy support: If old messages have richText metadata, handle them
      // This path should rarely be used in new messages
      this.isSingleEmoji = this.detectSingleEmojiInRichText(richTextHtml);
      this.formattedText = this.sanitizeHtml(richTextHtml);
    } else {
      // Standard path: Apply formatter pipeline
      // Formatters process: mentions → markdown → URLs → custom
      this.isSingleEmoji = this.detectSingleEmoji(this.messageText);
      this.formattedText = this.applyTextFormatters(this.messageText);
    }

    // Translated text always uses plain text formatting with formatters
    // @see Requirements 5.1, 5.2 - Translation uses formatter pipeline regardless of rich text mode
    if (this.translatedText) {
      this.formattedTranslatedText = this.applyTextFormatters(this.translatedText);
    } else {
      this.formattedTranslatedText = '';
    }

    // Trigger change detection
    this.cdr.markForCheck();
  }

  /**
   * Extract the text content from the message object.
   *
   * This method safely extracts text from a CometChat.TextMessage object,
   * handling null/undefined message gracefully by returning an empty string.
   *
   * @private
   * @returns The text content of the message, or empty string if message is null/undefined
   * @see Requirements 1.1 - WHEN a CometChat.TextMessage object is provided,
   *      THE Text_Bubble SHALL extract the text content from the message
   */
  private extractMessageText(): string {
    // Handle null/undefined message gracefully
    if (!this.message) {
      return '';
    }

    // Safely call getText() and return empty string if it returns null/undefined
    return this.message.getText?.() || '';
  }

  /**
   * Extract link preview data from message metadata.
   *
   * This method safely navigates the nested metadata path to extract link preview data.
   * The expected path is: metadata["@injected"]["extensions"]["link-preview"]["links"]
   *
   * @private
   * @returns Array of link preview data objects, or empty array if path is missing/invalid
   * @see Requirements 1.2 - WHEN a message contains metadata, THE Text_Bubble SHALL parse
   *      metadata for link preview data at path `metadata["@injected"]["extensions"]["link-preview"]["links"]`
   * @see Requirements 7.1 - WHEN message metadata contains link preview data at path
   *      `metadata["@injected"]["extensions"]["link-preview"]["links"]`, THE Text_Bubble SHALL parse the links array
   */
  private extractLinkPreviews(): LinkPreviewData[] {
    // Handle null/undefined message gracefully
    if (!this.message) {
      return [];
    }

    try {
      // Get metadata from message
      const metadata = this.message.getMetadata?.();

      // Return empty array if no metadata
      if (!metadata || typeof metadata !== 'object') {
        return [];
      }

      // Safely navigate the nested path: @injected -> extensions -> link-preview -> links
      const injected = (metadata as Record<string, unknown>)['@injected'];
      if (!injected || typeof injected !== 'object') {
        return [];
      }

      const extensions = (injected as Record<string, unknown>)['extensions'];
      if (!extensions || typeof extensions !== 'object') {
        return [];
      }

      const linkPreview = (extensions as Record<string, unknown>)['link-preview'];
      if (!linkPreview || typeof linkPreview !== 'object') {
        return [];
      }

      const links = (linkPreview as Record<string, unknown>)['links'];

      // Validate that links is an array
      if (!Array.isArray(links)) {
        return [];
      }

      // Map each link object to LinkPreviewData interface
      // Filter out invalid entries and ensure required 'url' field exists
      return links
        .filter(
          (link): link is Record<string, unknown> =>
            link !== null &&
            typeof link === 'object' &&
            typeof (link as Record<string, unknown>)['url'] === 'string'
        )
        .map(link => ({
          url: link['url'] as string,
          title: typeof link['title'] === 'string' ? link['title'] : undefined,
          description: typeof link['description'] === 'string' ? link['description'] : undefined,
          image: typeof link['image'] === 'string' ? link['image'] : undefined,
          favicon: typeof link['favicon'] === 'string' ? link['favicon'] : undefined,
        }));
    } catch {
      // Handle any unexpected errors gracefully
      return [];
    }
  }

  /**
   * Extract translation text from message metadata.
   *
   * This method safely extracts the translated message text from the metadata.
   * The expected path is: metadata["translated_message"]
   *
   * If `translatedTextOverride` input is provided, it takes precedence over
   * the metadata translation.
   *
   * @private
   * @returns The translated text string if it exists and is a string, or empty string otherwise
   * @see Requirements 1.3 - WHEN a message contains metadata, THE Text_Bubble SHALL parse
   *      metadata for translation data at path `metadata["translated_message"]`
   * @see Requirement 14.3 - Display original and translated text
   */
  private extractTranslation(): string {
    // Check for override first - this allows parent components to pass
    // translated text from external translation services
    if (this.translatedTextOverride && typeof this.translatedTextOverride === 'string') {
      return this.translatedTextOverride;
    }

    // Handle null/undefined message gracefully
    if (!this.message) {
      return '';
    }

    try {
      // Get metadata from message
      const metadata = this.message.getMetadata?.();

      // Return empty string if no metadata
      if (!metadata || typeof metadata !== 'object') {
        return '';
      }

      // Extract translated_message from metadata
      const translatedMessage = (metadata as Record<string, unknown>)['translated_message'];

      // Validate that translated_message is a string
      if (typeof translatedMessage !== 'string') {
        return '';
      }

      return translatedMessage;
    } catch {
      // Handle any unexpected errors gracefully
      return '';
    }
  }

  /**
   * Extract mentioned users from the message object.
   *
   * This method safely extracts the mentioned users list from a CometChat.TextMessage object,
   * handling null/undefined message gracefully by returning an empty array.
   *
   * @private
   * @returns Array of mentioned users, or empty array if message is null/undefined or has no mentioned users
   * @see Requirements 1.4 - WHEN a message contains mentioned users, THE Text_Bubble SHALL
   *      extract the mentioned users list from the message object
   */
  private extractMentionedUsers(): CometChat.User[] {
    // Handle null/undefined message gracefully
    if (!this.message) {
      return [];
    }

    try {
      // Safely call getMentionedUsers() and return empty array if it returns null/undefined
      const mentionedUsers = this.message.getMentionedUsers?.();

      // Validate that mentionedUsers is an array
      if (!Array.isArray(mentionedUsers)) {
        return [];
      }

      return mentionedUsers;
    } catch {
      // Handle any unexpected errors gracefully
      return [];
    }
  }

  // ============================================
  // Private Methods - Rich Text Extraction
  // ============================================

  /**
   * Extract rich text HTML from message metadata.
   * Path: metadata.richText.html (when metadata.richText.hasFormatting is true)
   *
   * Uses defensive checks at each level of the metadata path.
   * Returns empty string on any failure, triggering fallback to plain text rendering.
   *
   * @private
   * @returns The rich text HTML string, or empty string if not available
   * @see Requirements 1.1, 1.2, 1.3, 1.4
   */
  private extractRichTextHtml(): string {
    if (!this.message) return '';

    try {
      const metadata = this.message.getMetadata?.();
      if (!metadata || typeof metadata !== 'object') return '';

      const richText = (metadata as Record<string, unknown>)['richText'];
      if (!richText || typeof richText !== 'object') return '';

      const richTextObj = richText as Record<string, unknown>;
      if (richTextObj['hasFormatting'] !== true) return '';

      const html = richTextObj['html'];
      if (typeof html !== 'string' || html.trim() === '') return '';

      return html;
    } catch {
      return '';
    }
  }

  // ============================================
  // Private Methods - Text Processing
  // ============================================

  /**
   * Detect if the message text is a single emoji.
   *
   * This method checks if the provided text contains exactly one emoji character
   * and no other text (whitespace is allowed). It handles:
   * - Basic emojis (😀, 👍, ❤️)
   * - Emoji with skin tone modifiers (👍🏻, 👍🏿)
   * - ZWJ sequences (family emojis like 👨‍👩‍👧‍👦, profession emojis)
   * - Flag emojis (🇺🇸, 🇬🇧)
   * - Keycap sequences (1️⃣, #️⃣)
   *
   * @private
   * @param text - The text to check
   * @returns True if the text is a single emoji, false otherwise
   * @see Requirements 3.1
   */
  private detectSingleEmoji(text: string): boolean {
    // Handle null, undefined, or empty string
    if (!text || typeof text !== 'string') {
      return false;
    }

    // Trim whitespace from the text
    const trimmedText = text.trim();

    // Empty string after trimming is not a single emoji
    if (trimmedText.length === 0) {
      return false;
    }

    // Regex pattern to match emoji characters including:
    // - Extended_Pictographic: Most emoji characters
    // - Regional_Indicator: Flag emoji components (🇺🇸)
    // - Emoji_Modifier: Skin tone modifiers (🏻🏼🏽🏾🏿)
    // - Emoji_Component: Components like ZWJ, variation selectors
    //
    // The pattern uses Unicode property escapes with the 'u' flag
    // We need to match complete emoji sequences including:
    // - ZWJ sequences (joined with \u200D)
    // - Skin tone modifiers (\u{1F3FB}-\u{1F3FF})
    // - Variation selectors (\uFE0E, \uFE0F)
    // - Keycap sequences (digit + \uFE0F + \u20E3)
    // - Flag sequences (regional indicator pairs)

    // Comprehensive emoji regex that matches complete emoji sequences
    // This pattern matches:
    // 1. Extended pictographic emojis with optional modifiers and ZWJ sequences
    // 2. Regional indicator pairs (flags)
    // 3. Keycap sequences
    const emojiRegex =
      /^(?:\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|\uFE0F|\u200D\p{Extended_Pictographic})*|\p{Regional_Indicator}{2}|[0-9#*]\uFE0F?\u20E3)$/u;

    // First, check if the trimmed text matches the basic emoji pattern
    if (emojiRegex.test(trimmedText)) {
      return true;
    }

    // For more complex emoji sequences (like family emojis with multiple ZWJ),
    // we use the Intl.Segmenter API if available, otherwise fall back to
    // a more comprehensive regex approach

    // Use Intl.Segmenter for accurate grapheme cluster counting
    // This correctly handles complex emoji sequences as single graphemes
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      try {
        const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
        const segments = Array.from(segmenter.segment(trimmedText));

        // Check if there's exactly one grapheme cluster
        if (segments.length !== 1) {
          return false;
        }

        // Verify the single segment is an emoji
        // Use Extended_Pictographic to check if it starts with an emoji
        const segment = segments[0].segment;
        const startsWithEmoji = /^\p{Extended_Pictographic}/u.test(segment);
        const isRegionalIndicator = /^\p{Regional_Indicator}{2}$/u.test(segment);
        const isKeycap = /^[0-9#*]\uFE0F?\u20E3$/u.test(segment);

        return startsWithEmoji || isRegionalIndicator || isKeycap;
      } catch {
        // Fall through to fallback approach if Segmenter fails
      }
    }

    // Fallback: Use a more comprehensive regex for ZWJ sequences
    // This handles family emojis, profession emojis, etc.
    const complexEmojiRegex =
      /^(?:(?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2})(?:\p{Emoji_Modifier}|\uFE0F)?(?:\u200D(?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2})(?:\p{Emoji_Modifier}|\uFE0F)?)*|[0-9#*]\uFE0F?\u20E3)$/u;

    return complexEmojiRegex.test(trimmedText);
  }

  /**
   * Detect single emoji in rich text content.
   * Rich text wraps content in <p> tags, so a single emoji appears as <p>😀</p>.
   * Strip the wrapping tags and delegate to existing detectSingleEmoji().
   *
   * @private
   * @param html - The rich text HTML string to check
   * @returns True if the HTML contains only a single emoji wrapped in paragraph tags
   * @see Requirements 7.1, 7.2
   */
  private detectSingleEmojiInRichText(html: string): boolean {
    if (!html) return false;

    // Strip wrapping <p> tags: "<p>😀</p>" → "😀"
    const stripped = html.replace(/^<p>(.*)<\/p>$/s, '$1').trim();

    // If stripping changed nothing or result still has HTML tags, not a single emoji
    if (stripped === html || /<[^>]+>/.test(stripped)) return false;

    return this.detectSingleEmoji(stripped);
  }

  /**
   * Sanitize HTML content to prevent XSS attacks.
   *
   * This method uses HtmlSanitizerService to sanitize HTML content, removing dangerous
   * elements and attributes while preserving safe rich text formatting tags.
   *
   * The sanitization process:
   * 1. Handles empty/null input by returning empty string
   * 2. Delegates to HtmlSanitizerService which applies DOMPurify with configured whitelist
   * 3. Removes script tags, event handlers, javascript: URLs, data: URIs
   * 4. Removes iframe, object, embed tags
   * 5. Returns the sanitized HTML string
   *
   * @private
   * @param html - The HTML string to sanitize
   * @returns The sanitized HTML string, or empty string if input is empty/null or on error
   * @see Requirements 2A.5 - WHEN rendering any HTML content, THE Text_Bubble SHALL sanitize
   *      the HTML to prevent XSS attacks
   * @see Requirements 2A.6 - WHEN sanitizing HTML, THE Text_Bubble SHALL allow only safe
   *      formatting tags (strong, em, u, s, ul, ol, li, code, pre, h1-h6, p, br)
   * @see Requirements 2A.7 - WHEN sanitizing HTML, THE Text_Bubble SHALL strip all script
   *      tags, event handlers, and dangerous attributes
   * @see Requirements 2A.8 - WHEN sanitizing HTML, THE Text_Bubble SHALL remove any inline
   *      JavaScript or data URIs
  /**
   * Sanitize HTML content using DOMPurify.
   *
   * This method delegates to HtmlSanitizerService for consistent, secure HTML sanitization
   * across the application. The service handles whitelisting safe tags, removing dangerous
   * content, and ensuring link security.
   *
   * @private
   * @param html - The HTML string to sanitize
   * @returns The sanitized HTML string, or empty string if input is empty/null or on error
   * @see Requirements 2A.5 - WHEN rendering any HTML content, THE Text_Bubble SHALL sanitize
   *      the HTML to prevent XSS attacks
   * @see Requirements 2A.6 - WHEN sanitizing HTML, THE Text_Bubble SHALL allow only safe
   *      formatting tags (strong, em, u, s, ul, ol, li, code, pre, h1-h6, p, br)
   * @see Requirements 2A.7 - WHEN sanitizing HTML, THE Text_Bubble SHALL strip all script
   *      tags, event handlers, and dangerous attributes
   * @see Requirements 2A.8 - WHEN sanitizing HTML, THE Text_Bubble SHALL remove any inline
   *      JavaScript or data URIs
   * @see Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6 - Use HtmlSanitizerService
   */
  private sanitizeHtml(html: string): string {
    // Handle empty/null input gracefully
    if (!html || typeof html !== 'string') {
      return '';
    }

    // Handle whitespace-only input
    if (html.trim() === '') {
      return '';
    }

    // Delegate to HtmlSanitizerService for consistent sanitization
    // The service handles:
    // - Whitelisting safe rich text formatting tags
    // - Removing script tags, event handlers, dangerous attributes
    // - Ensuring link security (target="_blank", rel="noopener noreferrer")
    // - Caching for performance
    // - Error handling
    return this.htmlSanitizer.sanitize(html);
  }

  /**
   * Apply text formatters to the message text.
   *
   * This method applies each formatter in the textFormatters array sequentially
   * to the input text. Each formatter's output becomes the input for the next
   * formatter in the sequence. The method handles exceptions gracefully by
   * catching errors, logging them, and continuing with the remaining formatters.
   *
   * For CometChatMentionsFormatter, this method detects if the text contains
   * SDK format mentions (`<@uid:{uid}>`) and uses `formatSdkMentions()` instead
   * of `format()` to properly render mentions with user display names.
   *
   * After all formatters have been applied, the result is sanitized to prevent
   * XSS attacks before being returned. Any remaining invalid mention formats
   * are stripped to prevent raw format strings from being displayed to users.
   *
   * @private
   * @param text - The text to format
   * @returns The formatted HTML string after applying all formatters and sanitization
   * @see Requirements 1.2 - WHEN a mention is displayed in a message bubble THEN THE
   *      Text_Bubble SHALL render it as a styled span with the user's display name
   * @see Requirements 1.4 - IF a mention format is invalid THEN THE System SHALL NOT
   *      display the raw format to the user
   * @see Requirements 2.3 - WHEN text content is displayed, THE Text_Bubble SHALL apply
   *      all configured text formatters in sequence
   * @see Requirements 2.5 - WHEN formatted text is rendered, THE Text_Bubble SHALL
   *      display the formatted HTML safely
   */
  private applyTextFormatters(text: string): string {
    // Handle empty text gracefully - return empty string
    if (!text || typeof text !== 'string') {
      return '';
    }

    // SECURITY: Escape HTML entities in raw user text BEFORE formatters run.
    // This prevents XSS payloads like <img src=x onerror=alert()> from being
    // interpreted as HTML. SDK mention patterns (<@uid:...>, <@all:...>) are
    // preserved via placeholders so the mentions formatter can still process them.
    const escapedText = this.htmlSanitizer.escapeUserHtml(text);

    // Handle empty formatters array - return original text (after sanitization)
    // Also strip any invalid mention formats before returning
    // Use _textFormatters() directly because initializeTextFormatters() populates it
    // with defaults from FormatterConfigService. The effectiveTextFormatters() computed
    // signal won't reflect those defaults since they are set via signal.set() internally.
    const formatters =
      this._textFormatters().length > 0 ? this._textFormatters() : this.effectiveTextFormatters();
    if (!formatters || formatters.length === 0) {
      return this.sanitizeHtml(this.stripInvalidMentionFormats(escapedText));
    }

    // Apply each formatter in sequence
    // Each formatter's output becomes the input for the next formatter
    let formattedText = escapedText;
    for (const formatter of formatters) {
      try {
        // Check if formatter should process this text
        const shouldFormat = formatter.shouldFormat(formattedText, this.message);

        if (!shouldFormat) {
          continue;
        }

        // Check if this is a CometChatMentionsFormatter and text contains SDK format mentions
        // SDK format mentions are in the format <@uid:{uid}> or <@all:{label}>
        // @see Requirements 1.2, 1.3

        if (formatter instanceof CometChatMentionsFormatter) {
          if (formatter.hasSdkMentions(formattedText)) {
            // Use formatSdkMentions() for SDK format mentions
            // This properly renders mentions with user display names
            const result = formatter.formatSdkMentions(formattedText, this.mentionedUsers);

            if (typeof result === 'string') {
              formattedText = result;
            }
          } else {
            // Use regular format() for plain text @mentions
            const result = formatter.format(formattedText);

            if (typeof result === 'string') {
              formattedText = result;
            }
          }
        } else {
          // Apply the formatter to the current text
          // The format method takes the text and returns the formatted result
          const result = formatter.format(formattedText);

          // Only update formattedText if the formatter returned a valid string
          if (typeof result === 'string') {
            formattedText = result;
          }
        }

        // If formatter returns non-string, continue with previous text
      } catch (error) {
        // Handle formatter exceptions gracefully
        // Log the error and continue with the remaining formatters
        console.warn('CometChatTextBubble: Error applying text formatter', error);
        // Continue with the current formattedText value
        // This ensures one failing formatter doesn't break the entire chain
      }
    }

    // Strip any remaining invalid mention formats before sanitization
    // This ensures raw format strings like <@vivektesting:vivek testing> are not displayed
    // @see Requirements 1.4
    formattedText = this.stripInvalidMentionFormats(formattedText);

    // Sanitize the final result to prevent XSS attacks
    // This ensures the formatted HTML is safe to render
    return this.sanitizeHtml(formattedText);
  }

  /**
   * Strip invalid mention formats from text.
   *
   * This method removes any remaining mention-like patterns that don't match
   * the valid SDK format. This prevents raw format strings from being displayed
   * to users when the mention format is invalid.
   *
   * Valid formats that are preserved (handled by formatSdkMentions):
   * - `<@uid:{uid}>` - User mentions
   * - `<@all:{label}>` - Channel mentions
   *
   * Invalid formats that are stripped:
   * - `<@{name}:{display_name}>` - Old/incorrect format
   * - `<@anything:anything>` - Any other format not matching uid or all
   *
   * @private
   * @param text - The text to process
   * @returns The text with invalid mention formats removed
   * @see Requirements 1.4 - IF a mention format is invalid THEN THE System SHALL NOT
   *      display the raw format to the user
   */
  private stripInvalidMentionFormats(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Pattern to match invalid mention formats
    // This matches <@{anything}:{anything}> but NOT <@uid:{uid}> or <@all:{label}>
    // We use a negative lookahead to exclude valid formats
    // Invalid format: <@{name}:{display}> where name is not 'uid' or 'all'
    const invalidMentionRegex = /<@(?!uid:|all:)[^>]+>/g;

    // Replace invalid mention formats with empty string
    // This removes the raw format from display
    return text.replace(invalidMentionRegex, '');
  }

  /**
   * Check if content should be truncated based on height.
   *
   * This method measures the height of the content element and sets the
   * isContentTruncated flag if the height exceeds 80 pixels (approximately 4 lines).
   * The method uses ViewChild to access the content element's native DOM element
   * and measure its scrollHeight.
   *
   * The truncation threshold of 80px is based on:
   * - Line height: ~20px (typical for body text)
   * - 4 lines: 4 * 20px = 80px
   *
   * @private
   * @see Requirements 4.1 - WHEN text content height exceeds 80 pixels (approximately 4 lines),
   *      THE Text_Bubble SHALL truncate the content
   */
  private checkContentTruncation(): void {
    // Check if the content element reference is available
    if (!this.contentElement?.nativeElement) {
      // Content element not yet rendered or not available
      // This can happen if the component is destroyed before ngAfterViewInit
      // or if the content is conditionally rendered
      this.isContentTruncated = false;
      return;
    }

    // Get the native DOM element
    const element = this.contentElement.nativeElement;

    // Measure the content height using scrollHeight
    // scrollHeight gives the full height of the content including overflow
    // This is more accurate than clientHeight which only gives the visible height
    const height = element.scrollHeight;

    // Store the measured height for potential future use
    this.contentHeight = height;

    // Set truncation flag if height exceeds 80 pixels
    // 80px is approximately 4 lines of text (assuming ~20px line height)
    const TRUNCATION_THRESHOLD = 80;
    this.isContentTruncated = height > TRUNCATION_THRESHOLD;

    // Trigger change detection to update the view with the new truncation state
    // This is necessary because we're using OnPush change detection strategy
    this.cdr.markForCheck();
  }

  // ============================================
  // Protected Methods - Event Handlers
  // ============================================

  /**
   * Toggle the read more/less state.
   *
   * @protected
   * @see Requirements 4.3, 4.5
   */
  protected toggleReadMore(): void {
    this.isExpanded = !this.isExpanded;
    this.cdr.markForCheck();
  }

  /**
   * Handle link preview card click.
   *
   * @protected
   * @param url - The URL of the clicked link preview
   * @see Requirements 7.9, 13.1
   */
  protected onLinkPreviewClick(url: string): void {
    if (url) {
      // Open the URL in a new tab
      window.open(url, '_blank', 'noopener,noreferrer');
      this.linkClick.emit(url);
    }
  }

  /**
   * Handle mention click.
   *
   * This method is called when a mention element is clicked. It extracts
   * the user data from the mention element and emits the mentionClick event.
   *
   * @protected
   * @param user - The mentioned user
   * @see Requirements 5.5, 13.2
   */
  protected onMentionClick(user: CometChat.User): void {
    if (user) {
      this.mentionClick.emit(user);
    }
  }

  /**
   * Handle click events on the text content to detect mention and URL clicks.
   *
   * This method is called when the text content is clicked. It checks if
   * the click target is a mention element or URL link and handles the
   * appropriate event emission.
   *
   * For mentions: Extracts user data and emits mentionClick event.
   * For URLs: Prevents default navigation and emits linkClick event.
   *
   * @protected
   * @param event - The click event
   * @see Requirements 5.5, 6.3, 13.3
   */
  protected onTextContentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (!target) {
      return;
    }

    // Check if the clicked element is a URL link (anchor tag with cometchat-link class)
    // The CometChatUrlFormatter adds class="cometchat-link" to formatted URLs
    // @see Requirements 6.3, 13.3
    if (target.tagName === 'A' && target.classList.contains('cometchat-link')) {
      event.preventDefault();
      event.stopPropagation();

      // Extract the URL from the href attribute
      const url = target.getAttribute('href');

      if (url) {
        // Emit the linkClick event with the URL string
        this.linkClick.emit(url);
      }
      return;
    }

    // Check if the clicked element is a mention
    if (target.classList.contains('cometchat-mentions')) {
      event.preventDefault();
      event.stopPropagation();

      // Extract user data from the mention element
      const uid = target.getAttribute('data-uid');
      const mentionType = target.getAttribute('data-mention-type');

      // Don't emit for channel mentions (@all)
      if (mentionType === 'channel' || uid === 'all') {
        return;
      }

      // Find the user in the mentioned users list
      if (uid && this.mentionedUsers.length > 0) {
        const user = this.mentionedUsers.find(u => u.getUid() === uid);
        if (user) {
          this.mentionClick.emit(user);
        }
      }
    }
  }

  // ============================================
  // Protected Methods - Utilities
  // ============================================

  /**
   * Extract the domain from a URL.
   *
   * @protected
   * @param url - The URL to extract domain from
   * @returns The domain name or empty string if invalid
   * @see Requirements 7.7
   */
  protected getDomainFromUrl(url: string): string {
    // TODO: Task 8.2 - Implement domain extraction
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }
}
