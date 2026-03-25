import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  HostListener,
  OnInit,
  OnDestroy,
  inject,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';
import { LiveAnnouncerService } from '../../../services/live-announcer.service';

/**
 * CometChatThreadViewComponent displays thread reply indicators on messages
 * and can also serve as a thread panel container for accessibility.
 *
 * This component supports two modes:
 * 1. Indicator Mode (default): Shows reply count for messages with threaded conversations
 * 2. Panel Mode: Serves as an accessible container for thread content
 *
 * Features:
 * - Displays thread icon alongside reply count
 * - Shows unread indicator when there are unread replies
 * - Supports keyboard navigation (Enter/Space to activate)
 * - Uses localization for reply count text (singular/plural)
 * - Only displays when replyCount > 0 (in indicator mode)
 * - Panel mode: role="complementary", aria-label="Thread replies"
 * - Escape key closes thread and restores focus
 * - Announces thread opened with reply count
 *
 * @example
 * ```html
 * <!-- Indicator Mode -->
 * <cometchat-thread-view
 *   [replyCount]="5"
 *   [unreadReplyCount]="2"
 *   [parentMessage]="message"
 *   (threadClick)="onThreadClick($event)">
 * </cometchat-thread-view>
 *
 * <!-- Panel Mode -->
 * <cometchat-thread-view
 *   [mode]="'panel'"
 *   [replyCount]="5"
 *   [parentMessage]="message"
 *   (closeClick)="onCloseThread()">
 *   <ng-content></ng-content>
 * </cometchat-thread-view>
 * ```
 *
 * @see Requirement 2.1 - Standalone Angular component
 * @see Requirement 2.2 - Display reply count for messages with thread replies
 * @see Requirement 2.3 - Display thread icon alongside reply count
 * @see Requirement 2.5 - Display unread indicator when there are unread replies
 * @see Requirement 13.1 - Implement same keyboard navigation as message list
 * @see Requirement 13.2 - Escape closes thread and restores focus
 * @see Requirement 13.3 - role="complementary" and aria-label="Thread replies"
 * @see Requirement 13.5 - Announce thread opened with reply count
 */
@Component({
  selector: 'cometchat-thread-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cometchat-thread-view.component.html',
  styleUrls: ['./cometchat-thread-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatThreadViewComponent implements OnInit, OnDestroy {
  /** @internal Timer references for cleanup */
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  // ==================== Services ====================

  private liveAnnouncer = inject(LiveAnnouncerService);
  private elementRef = inject(ElementRef);
  // ==================== Inputs ====================

  /**
   * The mode of the thread view component.
   * - 'indicator': Shows reply count indicator on messages (default)
   * - 'panel': Serves as an accessible container for thread content
   * @see Requirement 13.3
   */
  @Input() mode: 'indicator' | 'panel' = 'indicator';

  /**
   * The number of replies in the thread.
   * @see Requirement 2.2
   */
  @Input() replyCount = 0;

  /**
   * The number of unread replies in the thread.
   * @see Requirement 2.5
   */
  @Input() unreadReplyCount = 0;

  /**
   * The parent message for the thread.
   */
  @Input() parentMessage?: CometChat.BaseMessage;

  /**
   * Whether to announce thread opened on init (panel mode only).
   * @see Requirement 13.5
   */
  @Input() announceOnOpen = true;

  // ==================== Outputs ====================

  /**
   * Emitted when the thread view is clicked (indicator mode).
   * @see Requirement 2.6
   */
  @Output() threadClick = new EventEmitter<CometChat.BaseMessage>();

  /**
   * Emitted when the thread should be closed (panel mode).
   * Triggered by Escape key.
   * @see Requirement 13.2
   */
  @Output() closeClick = new EventEmitter<void>();

  // ==================== Private Properties ====================

  /**
   * Reference to the element that had focus before thread opened.
   * Used for focus restoration on close.
   */
  private previouslyFocusedElement: HTMLElement | null = null;

  // ==================== Public Properties ====================

  /**
   * URL for the thread icon.
   * @see Requirement 2.3
   */
  readonly threadIconUrl: string = 'assets/conversations_thread.svg';

  // ==================== Lifecycle Hooks ====================

  /**
   * Initializes the component.
   * In panel mode, announces thread opened and stores focus reference.
   * @see Requirement 13.5
   */
  ngOnInit(): void {
    if (this.mode === 'panel') {
      // Store reference to previously focused element for focus restoration
      this.previouslyFocusedElement = document.activeElement as HTMLElement;

      // Announce thread opened with reply count
      if (this.announceOnOpen) {
        this.announceThreadOpened();
      }
    }
  }

  /**
   * Cleanup on component destruction.
   */
  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
    this.previouslyFocusedElement = null;
  }

  // ==================== Computed Properties ====================

  /**
   * Whether the thread view should be displayed.
   * Only shows when replyCount > 0.
   * @see Requirement 2.9
   */
  get shouldDisplay(): boolean {
    return this.replyCount > 0;
  }

  /**
   * Whether there are unread replies.
   * @see Requirement 2.5
   */
  get hasUnreadReplies(): boolean {
    return this.unreadReplyCount > 0;
  }

  /**
   * The localized reply count text.
   * Uses singular form for 1 reply, plural for multiple.
   * @see Requirement 2.7
   */
  get replyCountText(): string {
    const displayCount = this.replyCount > 999 ? '999+' : this.replyCount;
    if (this.replyCount === 1) {
      return `${displayCount} ${CometChatLocalize.getLocalizedString('thread_reply')}`;
    }
    return `${displayCount} ${CometChatLocalize.getLocalizedString('thread_replies')}`;
  }

  get ariaLabel(): string {
    const baseLabel = this.replyCountText;
    if (this.hasUnreadReplies) {
      return `${baseLabel}, ${this.unreadReplyCount} unread`;
    }
    return baseLabel;
  }

  /**
   * Gets the aria-label for panel mode.
   * @see Requirement 13.3
   */
  get panelAriaLabel(): string {
    return CometChatLocalize.getLocalizedString('accessibility_thread_replies');
  }

  /**
   * Whether the component is in panel mode.
   */
  get isPanelMode(): boolean {
    return this.mode === 'panel';
  }

  /**
   * Whether the component is in indicator mode.
   */
  get isIndicatorMode(): boolean {
    return this.mode === 'indicator';
  }

  // ==================== Event Handlers ====================

  /**
   * Handles click events on the thread view (indicator mode).
   * @see Requirement 2.4, 2.6
   */
  onThreadViewClick(): void {
    if (this.parentMessage) {
      this.threadClick.emit(this.parentMessage);
    }
  }

  /**
   * Handles keyboard events for accessibility.
   * - Indicator mode: Activates on Enter or Space key
   * - Panel mode: Closes on Escape key
   * @see Requirement 2.8, 13.2
   */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Indicator mode: Enter/Space to activate
    if (this.isIndicatorMode) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.onThreadViewClick();
      }
    }

    // Panel mode: Escape to close thread
    if (this.isPanelMode && event.key === 'Escape') {
      event.preventDefault();
      this.closeThread();
    }
  }

  /**
   * Closes the thread and restores focus to the previously focused element.
   * @see Requirement 13.2
   */
  closeThread(): void {
    this.closeClick.emit();

    // Restore focus to the previously focused element
    if (
      this.previouslyFocusedElement &&
      typeof this.previouslyFocusedElement.focus === 'function'
    ) {
      // Use setTimeout to ensure the DOM has updated before focusing
      this.pendingTimers.push(setTimeout(() => {
        this.previouslyFocusedElement?.focus();
      }, 0));
    }
  }

  /**
   * Announces thread opened with reply count via live region.
   * @see Requirement 13.5
   */
  private announceThreadOpened(): void {
    const message = CometChatLocalize.getLocalizedString('accessibility_thread_opened').replace(
      '{count}',
      this.replyCount.toString()
    );
    this.liveAnnouncer.announce(message, 'polite');
  }
}
