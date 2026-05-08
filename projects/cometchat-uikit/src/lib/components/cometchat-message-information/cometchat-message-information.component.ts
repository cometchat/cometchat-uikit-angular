/**
 * CometChatMessageInformation Component
 *
 * A panel component for displaying detailed message information including
 * delivery and read receipts with user avatars, names, and timestamps.
 *
 * @example
 * ```html
 * <cometchat-message-information
 *   [message]="selectedMessage"
 *   [dateTimeFormat]="customDateFormat"
 *   (closeClick)="onClosePanel()">
 * </cometchat-message-information>
 * ```
 */
import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectionStrategy,
  computed,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAvatarComponent } from '../base-elements/cometchat-avatar';
import { CometChatDateComponent } from '../base-elements/cometchat-date';
import { CometChatMessageBubbleComponent } from '../cometchat-message-bubble';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CalendarObject } from '../../resources/CometChatLocalize/localization.interfaces';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';
import { FocusTrapService } from '../../services/focus-trap.service';
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';
import { CometChatLogger } from '../../utils/CometChatLogger';

// Re-export types for backward compatibility
export type { UserReceiptInfo } from './cometchat-message-information.types';
import type { ReceiptInfo, UserReceiptInfo } from './cometchat-message-information.types';
import {
  getReceiptAriaLabel,
  getMessagePreview,
  getMediaIcon,
} from './cometchat-message-information.utils';

/**
 * CometChatMessageInformationComponent displays detailed message information
 * including delivery and read receipts.
 */
@Component({
  selector: 'cometchat-message-information',
  standalone: true,
  imports: [
    CommonModule,
    CometChatAvatarComponent,
    CometChatDateComponent,
    CometChatMessageBubbleComponent,
    TranslatePipe,
  ],
  templateUrl: './cometchat-message-information.component.html',
  styleUrls: ['./cometchat-message-information.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatMessageInformationComponent implements OnInit, OnChanges, OnDestroy {
  /** @internal Timer references for cleanup */
  private pendingTimers: ReturnType<typeof setTimeout>[] = [];

  // ==================== Injected Services ====================

  private elementRef = inject(ElementRef);
  private focusTrapService = inject(FocusTrapService);
  private datePipe = new DatePipe('en-US');
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, {
    optional: true,
  });

  // ==================== ExplicitlySet Flags & Backing Fields ====================
  private textFormattersExplicitlySet = signal(false);
  private _textFormatters = signal<CometChatTextFormatter[]>([]);

  // ==================== Inputs ====================

  /** The message to show information for. */
  @Input() message!: CometChat.BaseMessage;

  /** Date format for timestamps. */
  @Input() dateTimeFormat?: CalendarObject;

  /** Text formatters for processing message text content. */
  @Input()
  set textFormatters(value: CometChatTextFormatter[]) {
    this._textFormatters.set(value);
    this.textFormattersExplicitlySet.set(true);
  }
  get textFormatters(): CometChatTextFormatter[] {
    return this._textFormatters();
  }

  /** Whether to show the scrollbar in the content area. */
  @Input() showScrollbar = false;

  // ==================== Outputs ====================

  /** Emitted when the panel close button is clicked. */
  @Output() closeClick = new EventEmitter<void>();

  // ==================== Effective Values ====================

  effectiveTextFormatters = computed(() => {
    if (this.textFormattersExplicitlySet()) return this._textFormatters();
    if (this.globalConfig?.textFormatters !== undefined) return this.globalConfig.textFormatters;
    return [];
  });

  // ==================== Signals ====================

  /** Combined user receipts for group messages. */
  userReceipts = signal<UserReceiptInfo[]>([]);

  /** Delivery receipts signal (legacy, kept for backward compatibility). */
  deliveryReceipts = signal<ReceiptInfo[]>([]);

  /** Read receipts signal (legacy, kept for backward compatibility). */
  readReceipts = signal<ReceiptInfo[]>([]);

  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);
  hasMoreReceipts = signal<boolean>(true);

  /** Read timestamp for 1-on-1 messages (Unix timestamp in seconds). */
  oneOnOneReadAt = signal<number>(0);

  /** Delivered timestamp for 1-on-1 messages (Unix timestamp in seconds). */
  oneOnOneDeliveredAt = signal<number>(0);

  // ==================== Private Properties ====================

  private loggedInUserUid = '';

  // ==================== Computed Properties ====================

  get effectiveDateFormat(): CalendarObject {
    return this.dateTimeFormat || {
      today: 'hh:mm A',
      yesterday: '[Yesterday] hh:mm A',
      otherDays: 'DD/MM/YYYY hh:mm A',
    };
  }

  get messageBubbleDateFormat(): CalendarObject {
    return { today: 'hh:mm A', yesterday: 'hh:mm A', otherDays: 'hh:mm A' };
  }

  get messagePreview(): string {
    return getMessagePreview(this.message);
  }

  get mediaIcon(): string | null {
    return getMediaIcon(this.message);
  }

  get isMediaMessage(): boolean {
    return this.mediaIcon !== null;
  }

  get sentTimestamp(): number {
    return this.message?.getSentAt() || 0;
  }

  get isGroupMessage(): boolean {
    return this.message?.getReceiverType() === CometChat.RECEIVER_TYPE.GROUP;
  }

  get ariaLabel(): string {
    return CometChatLocalize.getLocalizedString('message_information_title');
  }

  get closeButtonAriaLabel(): string {
    return CometChatLocalize.getLocalizedString('message_information_close_hover');
  }

  get messageBubbleAlignment(): MessageBubbleAlignment {
    if (!this.message || !this.loggedInUserUid) return MessageBubbleAlignment.left;
    const senderId = this.message.getSender()?.getUid();
    return senderId == this.loggedInUserUid
      ? MessageBubbleAlignment.right
      : MessageBubbleAlignment.left;
  }

  // ==================== Lifecycle Hooks ====================

  ngOnInit(): void {
    this.initializeLoggedInUser();
    this.pendingTimers.push(setTimeout(() => {
      this.focusTrapService.activate({
        container: this.elementRef.nativeElement,
        initialFocus: 'first',
        returnFocusOnDeactivate: true,
      });
    }, 0));
  }

  ngOnDestroy(): void {
    this.pendingTimers.forEach(t => clearTimeout(t));
    this.pendingTimers = [];
    this.focusTrapService.deactivate(this.elementRef.nativeElement);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message'] && this.message) {
      this.resetAndFetchReceipts();
    }
  }

  // ==================== Private Methods ====================

  private async initializeLoggedInUser(): Promise<void> {
    try {
      const user = await CometChat.getLoggedinUser();
      if (user) this.loggedInUserUid = user.getUid();
    } catch (error) {
      CometChatLogger.error('CometChatMessageInformation', 'Error getting logged-in user:', error);
    }
  }

  private resetAndFetchReceipts(): void {
    this.userReceipts.set([]);
    this.deliveryReceipts.set([]);
    this.readReceipts.set([]);
    this.oneOnOneReadAt.set(0);
    this.oneOnOneDeliveredAt.set(0);
    this.hasMoreReceipts.set(true);
    this.hasError.set(false);

    this.fetchReceipts();
  }

  async fetchReceipts(): Promise<void> {
    if (!this.message || this.isLoading() || !this.hasMoreReceipts()) return;

    this.isLoading.set(true);
    this.hasError.set(false);

    try {
      if (this.isGroupMessage) {
        await this.fetchGroupMessageReceipts(this.message.getId());
      } else {
        this.processOneOnOneReceipts();
      }
    } catch (error) {
      CometChatLogger.error('CometChatMessageInformation', 'Error fetching receipts:', error);
      this.hasError.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async fetchGroupMessageReceipts(messageId: number): Promise<void> {
    try {
      const receiptsResponse = await CometChat.getMessageReceipts(messageId);
      const receipts = receiptsResponse as CometChat.MessageReceipt[];

      if (!receipts || !Array.isArray(receipts) || receipts.length === 0) {
        this.hasMoreReceipts.set(false);
        return;
      }

      const userReceiptMap = new Map<string, UserReceiptInfo>();

      for (const receipt of receipts) {
        const sender = receipt.getSender();
        if (!sender || sender.getUid() === this.loggedInUserUid) continue;

        const uid = sender.getUid();
        const readAt = receipt.getReadAt() || 0;
        const deliveredAt = receipt.getDeliveredAt() || 0;
        const existing = userReceiptMap.get(uid);

        if (existing) {
          if (readAt > existing.readAt) existing.readAt = readAt;
          if (deliveredAt > existing.deliveredAt) existing.deliveredAt = deliveredAt;
        } else {
          userReceiptMap.set(uid, { user: sender, readAt, deliveredAt });
        }
      }

      this.userReceipts.set([...this.userReceipts(), ...Array.from(userReceiptMap.values())]);
      this.hasMoreReceipts.set(false);
    } catch (error) {
      CometChatLogger.error('CometChatMessageInformation', 'Error fetching group receipts:', error);
      throw error;
    }
  }

  private processOneOnOneReceipts(): void {
    this.oneOnOneReadAt.set(this.message.getReadAt() || 0);
    this.oneOnOneDeliveredAt.set(this.message.getDeliveredAt() || 0);
    this.hasMoreReceipts.set(false);
  }

  // ==================== Event Handlers ====================

  onPanelKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.onCloseClick();
    }
  }

  onCloseClick(): void {
    this.closeClick.emit();
  }

  onCloseKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onCloseClick();
    }
  }

  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const scrollBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    if (scrollBottom < 50 && !this.isLoading() && this.hasMoreReceipts()) {
      this.fetchReceipts();
    }
  }

  retry(): void {
    this.hasError.set(false);
    this.fetchReceipts();
  }

  // ==================== Accessibility Methods ====================

  getReceiptAriaLabel(receipt: ReceiptInfo, type: 'delivered' | 'read'): string {
    return getReceiptAriaLabel(receipt, type, this.datePipe);
  }

  // ==================== TrackBy Functions ====================

  trackByReceipt(index: number, receipt: ReceiptInfo): string {
    return `${receipt.user.getUid()}-${receipt.timestamp}`;
  }

  trackByUserReceipt(index: number, receipt: UserReceiptInfo): string {
    return receipt.user.getUid();
  }
}
