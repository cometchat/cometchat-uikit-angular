/**
 * CometChatCollaborativeDocumentBubbleComponent
 *
 * A presentational component that renders collaborative document messages within chat.
 * Displays a banner image, title, subtitle, and an action button to open the document.
 *
 * @remarks
 * This component processes CometChat.CustomMessage objects of type `extension_document`
 * to extract and display collaborative document content with support for:
 * - Theme-aware banner images (light/dark)
 * - Localized text for title, subtitle, and button
 * - Sender/receiver styling variants
 * - Full keyboard accessibility and screen reader support
 *
 * @example
 * ```html
 * <cometchat-collaborative-document-bubble
 *   [message]="documentMessage"
 *   [alignment]="MessageBubbleAlignment.right"
 *   (buttonClick)="onDocumentOpen($event)">
 * </cometchat-collaborative-document-bubble>
 * ```
 *
 * @see Requirements 1.1, 10.1, 10.2, 10.5
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { getThemeMode } from '../../utils/util';
import { extractExtensionUrl } from '../../utils/extension-url-extractor';

@Component({
  selector: 'cometchat-collaborative-document-bubble',
  standalone: true,
  templateUrl: './cometchat-collaborative-document-bubble.component.html',
  styleUrls: ['./cometchat-collaborative-document-bubble.component.css'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatCollaborativeDocumentBubbleComponent implements OnInit, OnChanges {
  // ============================================
  // Inputs
  // ============================================

  /**
   * The custom message object containing collaborative document metadata.
   *
   * @remarks
   * This is a required input. The component extracts the document URL from
   * `metadata["@injected"]["extensions"]["document"]["document_url"]`.
   *
   * @see Requirements 1.1, 2.1
   */
  @Input({ required: true }) message!: CometChat.CustomMessage;

  /**
   * The alignment of the message bubble.
   *
   * @remarks
   * LEFT for incoming/receiver messages, RIGHT for outgoing/sender messages.
   *
   * @default MessageBubbleAlignment.left
   * @see Requirements 1.3, 1.4
   */
  @Input() alignment: MessageBubbleAlignment = MessageBubbleAlignment.left;

  /**
   * When true, disables all interactive elements (action button).
   * Used in thread header to prevent interaction with the parent message.
   * @default false
   */
  @Input() disableInteraction = false;

  // ============================================
  // Outputs
  // ============================================

  /**
   * Event emitted when the action button is clicked.
   *
   * @remarks
   * Emits the document URL string when the button is clicked.
   *
   * @see Requirements 5.2, 9.1, 9.2, 9.3
   */
  @Output() buttonClick = new EventEmitter<string>();

  // ============================================
  // Internal State
  // ============================================

  /** Extracted document URL from message metadata */
  protected documentUrl = '';

  /** Theme-aware banner image URL */
  protected bannerImage = '';

  /** Localized title text */
  protected title = '';

  /** Localized subtitle text */
  protected subtitle = '';

  /** Localized button text */
  protected buttonText = '';

  /** Whether this is an outgoing message (sender is logged-in user) */
  protected isOutgoing = false;

  /** Whether the banner image failed to load */
  protected bannerImageError = false;

  // ============================================
  // Template Exposed Properties
  // ============================================

  /** Expose MessageBubbleAlignment enum to template */
  readonly MessageBubbleAlignment = MessageBubbleAlignment;

  // ============================================
  // Constructor
  // ============================================

  constructor(private cdr: ChangeDetectorRef) {}

  // ============================================
  // Lifecycle Hooks
  // ============================================

  ngOnInit(): void {
    this.processMessage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message'] || changes['alignment']) {
      this.processMessage();
    }
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Process the message to extract document URL and set up component state.
   *
   * @see Requirements 1.1, 2.1
   */
  private processMessage(): void {
    this.extractDocumentUrl();
    this.determineBannerImage();
    this.loadLocalizedStrings();
    this.isOutgoing = this.alignment === MessageBubbleAlignment.right;
    this.bannerImageError = false;
    this.cdr.markForCheck();
  }

  /**
   * Extract the document URL from message metadata.
   *
   * @remarks
   * Extracts from `metadata["@injected"]["extensions"]["document"]["document_url"]`.
   * Handles missing or malformed metadata gracefully.
   *
   * @see Requirements 2.1, 2.3, 2.4
   */
  private extractDocumentUrl(): void {
    this.documentUrl = extractExtensionUrl(
      this.message,
      'document',
      'document_url',
      'CometChatCollaborativeDocumentBubble'
    );
  }

  /**
   * Determine the appropriate banner image based on current theme.
   *
   * @remarks
   * Selects `Collaborative_Document_Light.png` or `Collaborative_Document_Dark.png`
   * based on the current theme mode.
   *
   * @see Requirements 3.1, 3.3
   */
  private determineBannerImage(): void {
    const themeMode = getThemeMode();
    this.bannerImage =
      themeMode === 'dark'
        ? 'assets/Collaborative_Document_Dark.png'
        : 'assets/Collaborative_Document_Light.png';
  }

  /**
   * Load localized strings for title, subtitle, and button text.
   *
   * @see Requirements 4.1, 4.2, 4.3, 4.7
   */
  private loadLocalizedStrings(): void {
    this.title = CometChatLocalize.getLocalizedString('message_list_collaborative_document_title');
    this.subtitle = CometChatLocalize.getLocalizedString(
      'message_list_collaborative_document_subtitile'
    );
    this.buttonText = CometChatLocalize.getLocalizedString(
      'message_list_collaborative_document_open'
    );
  }

  // ============================================
  // Protected Methods (Template Accessible)
  // ============================================

  /**
   * Handle button click to emit event and open URL.
   *
   * @remarks
   * Opens the document URL in a new fullscreen window.
   *
   * @see Requirements 5.1, 5.2, 5.3
   */
  protected onButtonClick(): void {
    if (this.documentUrl) {
      this.buttonClick.emit(this.documentUrl);
      window.open(this.documentUrl, '', 'fullscreen=yes, scrollbars=auto');
    }
  }

  /**
   * Check if the action button should be disabled.
   *
   * @returns True if the URL is empty or invalid
   * @see Requirements 5.4
   */
  protected isButtonDisabled(): boolean {
    return !this.documentUrl || !this.documentUrl.trim();
  }

  /**
   * Handle banner image load error.
   *
   * @see Requirements 3.5
   */
  protected onBannerImageError(): void {
    this.bannerImageError = true;
    this.cdr.markForCheck();
  }
}
