import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  AfterViewInit,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  booleanAttribute,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatAvatarComponent } from '../base-elements/cometchat-avatar/cometchat-avatar.component';
import { CometChatPinSaveConfirmDialogComponent } from '../base-elements/cometchat-pin-save-confirm-dialog/cometchat-pin-save-confirm-dialog.component';
import {
  getConversationAvatarImage,
  getConversationAvatarName,
} from '../cometchat-conversation-item/cometchat-conversation-item.utils';
import { CometChatUIKit } from '../../cometchat-uikit';
import { isInteractiveTarget } from '../../utils/pin-save-utils';
import { CometChatUIKitConstants } from '../../constants';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import {
  getSubtitleIconName,
  hasMarkdownLink,
} from '../cometchat-conversation-item/cometchat-conversation-item.subtitle-utils';
import { PinSaveService } from '../../services/pin-save.service';
import { FocusTrapService } from '../../services/focus-trap.service';
import { CometChatPinSaveEvents } from '../../events/CometChatPinSaveEvents';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { States } from '../../Enums/Enums';

/** One saved message plus the source conversation we resolve ourselves. */
interface SavedRow {
  message: CometChat.BaseMessage;
  /** Display name of the conversation it came from; null until it resolves. */
  sourceName: string | null;
  /** Its avatar/icon; empty until resolved, which the avatar renders as initials. */
  sourceAvatar: string;
}

/** What a resolved conversation contributes to its rows. */
interface SourceIdentity {
  name: string;
  avatar: string;
}

/**
 * CometChatSavedMessages — the logged-in user's saved messages, newest message
 * first, across every conversation.
 *
 * This is a USER-LEVEL surface reached from app chrome, not a conversation
 * panel: saves are private to the user and span conversations, so scoping it to
 * one chat would hide most of it.
 *
 * Read-only, like the pinned panel: no `markAsRead`, no receipts, no unread
 * changes.
 */
@Component({
  selector: 'cometchat-saved-messages',
  standalone: true,
  imports: [
    CometChatPinSaveConfirmDialogComponent,
    CommonModule, TranslatePipe, CometChatAvatarComponent],
  templateUrl: './cometchat-saved-messages.component.html',
  styleUrls: ['./cometchat-saved-messages.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatSavedMessagesComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pinSave = inject(PinSaveService);
  private readonly focusTrap = inject(FocusTrapService);
  private readonly elementRef = inject(ElementRef);

  /**
   * Hides the Unsave action on each row.
   *
   * Deliberately the only option flag here, and the React kit agrees: rows are
   * conversation-style list items with one inline Unsave button, not bubbles with
   * an options menu, so there is nothing else to configure. The Pinned panel
   * carries the full set because its rows ARE bubbles. With this set the list
   * becomes read-only.
   */
  @Input({ transform: booleanAttribute }) hideUnsaveMessageOption = false;

  /** Hides the close button, for hosts that supply their own chrome. */
  @Input({ transform: booleanAttribute }) hideCloseButton = false;

  /** Replaces the default "Saved Messages" header row. */
  @Input() headerView?: TemplateRef<unknown>;
  @Input() emptyView?: TemplateRef<unknown>;
  @Input() errorView?: TemplateRef<unknown>;
  @Input() loadingView?: TemplateRef<unknown>;
  /**
   * Replaces a whole row, along with its click and keyboard affordances — see the
   * Pinned panel, which takes the same slot. The message arrives as `$implicit`
   * and again as `message`.
   */
  @Input() itemView?: TemplateRef<{ $implicit: CometChat.BaseMessage; message: CometChat.BaseMessage }>;

  /**
   * Formatters applied to each row's text. Falls back to the global config's set
   * when unset.
   */
  @Input() textFormatters?: CometChatTextFormatter[];

  /**
   * Custom request builder, for page size and any other supported filter.
   *
   * Used as supplied apart from `setSaved`, which is re-asserted — without it the
   * read is ordinary history. Do not scope it to a uid/guid: saves span
   * conversations.
   */
  @Input() messagesRequestBuilder?: CometChat.MessagesRequestBuilder;

  @Output() closeClick = new EventEmitter<void>();
  /** A row was tapped — the host opens that conversation and jumps to it. */
  @Output() messageClick = new EventEmitter<CometChat.BaseMessage>();
  @Output() error = new EventEmitter<CometChat.CometChatException>();

  rows = signal<SavedRow[]>([]);

  /**
   * Which load is current. The panel can be reopened while a read is still in
   * flight; the earlier result must not overwrite the newer one.
   */
  private loadGeneration = 0;

  private static readonly PAGE_SIZE = 30;

  /** The live request, kept so later pages continue from where this one ended. */
  private request: CometChat.MessagesRequest | null = null;

  /**
   * The page size actually in force.
   *
   * The stop-guard compares a page's length against the limit that was asked
   * for, so it has to track a host-supplied builder rather than assume the
   * default: with a smaller limit every page would look short and paging would
   * stop after one, and with a larger one a genuinely final page would look
   * full and paging would continue past the end.
   */
  private pageSize = CometChatSavedMessagesComponent.PAGE_SIZE;

  /**
   * A request for one load.
   *
   * Builders are single-shot, so a host-supplied one is never `build()`t twice
   * — its limit is read and a fresh builder is configured to match. `setSaved`
   * is re-asserted either way; without it the read is ordinary history.
   */
  private buildRequest(): CometChat.MessagesRequest {
    const supplied = this.messagesRequestBuilder;
    if (supplied) {
      const limit = this.readBuilderLimit(supplied) ?? CometChatSavedMessagesComponent.PAGE_SIZE;
      this.pageSize = limit;
      return new CometChat.MessagesRequestBuilder().setLimit(limit).setSaved(true).build();
    }
    this.pageSize = CometChatSavedMessagesComponent.PAGE_SIZE;
    return new CometChat.MessagesRequestBuilder()
      .setLimit(CometChatSavedMessagesComponent.PAGE_SIZE)
      .setSaved(true)
      .build();
  }

  /**
   * The limit a builder was configured with.
   *
   * The SDK exposes no getter, so this reads the field the builder stores it
   * in and falls back to the default when the shape is not what we expect —
   * a wrong guess here would silently break paging.
   */
  private readBuilderLimit(builder: CometChat.MessagesRequestBuilder): number | null {
    const shape = builder as unknown as { limit?: unknown };
    return typeof shape.limit === 'number' && shape.limit > 0 ? shape.limit : null;
  }
  /** False once the server has nothing further, or cannot advance. */
  private hasMore = signal(true);
  private loadingMore = false;

  visibleRows = computed(() => this.rows());
  hasMoreToShow = computed(() => this.hasMore());

  /**
   * Fetch the next page as the reader nears the end.
   *
   * Real server paging, unlike the pinned panel: a saved list's cursor is keyed
   * on `sentAt`, which `MessagesRequest` knows how to send, so `fetchPrevious()`
   * genuinely advances. (A pinned list's cursor is keyed on `pinnedAt`, which
   * the SDK cannot send at all — hence the different approach there.)
   *
   * Guarded so it can never regress into a loop: if a page brings nothing NEW,
   * paging stops. That covers the case where the cursor silently fails to
   * advance and the server keeps returning page one — the list then behaves
   * exactly as the single-fetch version did, rather than appending forever.
   */
  async onListScroll(event: Event): Promise<void> {
    if (!this.hasMore() || this.loadingMore || !this.request) return;
    const el = event.target as HTMLElement;
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (remaining > 200) return;

    this.loadingMore = true;
    const generation = this.loadGeneration;
    try {
      const page = await this.request.fetchPrevious();
      if (generation !== this.loadGeneration) return;

      const seen = new Set(this.rows().map(r => String(r.message.getId())));
      const fresh = page.filter(m => !seen.has(String(m.getId())));

      // Nothing new: either the list is exhausted or the cursor did not move.
      // Either way there is no further page worth asking for.
      if (fresh.length === 0) {
        this.hasMore.set(false);
        return;
      }

      this.rows.update(rows =>
        sortRowsNewestFirst([
          ...rows,
          ...fresh.map(message => ({ message, sourceName: null, sourceAvatar: '' })),
        ])
      );
      this.hasMore.set(page.length >= this.pageSize);
      this.hydrateSources(fresh);
    } catch (err) {
      CometChatLogger.error('CometChatSavedMessages', 'Failed to load more saved messages:', err);
      // Only the current list may be marked exhausted. A reload that started
      // while this page was in flight owns `hasMore` now, and stamping false on
      // it would disable pagination on a list this page never belonged to.
      if (generation !== this.loadGeneration) return;
      // A failed page must not kill the rows already on screen.
      this.hasMore.set(false);
    } finally {
      // Same reasoning: a stale page must not clear the fresh load's in-flight
      // flag, which would let two scroll fetches run at once.
      if (generation === this.loadGeneration) this.loadingMore = false;
      this.cdr.markForCheck();
    }
  }
  state = signal<States>(States.loading);
  readonly States = States;
  readonly shimmerList = CometChatUIKitConstants.shimmerList;

  ngAfterViewInit(): void {
    // Focus stays inside the drawer while it is open, and returns to whatever
    // opened it on close — the same contract the message-information panel has.
    this.focusTrap.activate({
      container: this.elementRef.nativeElement,
      initialFocus: 'first',
      returnFocusOnDeactivate: true,
    });
  }

  ngOnDestroy(): void {
    this.focusTrap.deactivate(this.elementRef.nativeElement);
  }

  /** Escape dismisses the topmost layer, not always the panel. */
  onPanelKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    // A confirmation on top owns Escape before the panel does.
    if (this.pendingUnsave()) { this.cancelUnsave(); return; }
    this.closeClick.emit();
  }

  ngOnInit(): void {
    void this.load();
    this.subscribeToSaveEvents();
  }

  /** The server caps a user at 100 saves, so one page covers the whole list. */
  private async load(): Promise<void> {
    const generation = ++this.loadGeneration;
    this.state.set(States.loading);
    try {

      // User-level and cross-conversation: leaving uid/guid unset is what routes
      // this to the bare messages endpoint rather than a conversation's list.
      //
      // The saved list is not cursor-paginated: the server ignores sentAt/id under
      // `saved=1` and returns the whole capped list in one page — in whatever
      // order it likes, which is why `sortRowsNewestFirst` runs over the result.
      // fetchPrevious() suits that better than fetchNext(), which refuses to run
      // without a cursor this list has no meaning for.
      // A builder is single-shot: `build()` hands out a request bound to that
      // builder's state, so calling it twice on a caller-owned builder is not
      // safe. Each load therefore starts from a fresh builder, and a supplied
      // one is only read for its configuration.
      const request = this.buildRequest();
      // Retained: later pages continue from where this one ended.
      this.request = request;

      const page = await request.fetchPrevious();

      // A reload started while this was in flight owns the list now.
      if (generation !== this.loadGeneration) return;

      this.rows.set(
        sortRowsNewestFirst(page.map(message => ({ message, sourceName: null, sourceAvatar: '' })))
      );
      this.hasMore.set(page.length >= this.pageSize);
      this.state.set(page.length ? States.loaded : States.empty);
      // Rows render immediately; names arrive after.
      this.hydrateSources(page);
    } catch (err) {
      const error = err as CometChat.CometChatException;
      if (generation !== this.loadGeneration) return;
      this.state.set(States.error);
      this.error.emit(error);
      CometChatLogger.error('CometChatSavedMessages', 'Failed to load saved messages:', err);
    } finally {
      this.cdr.markForCheck();
    }
  }

  /**
   * Conversation names already resolved, kept across openings of the panel.
   *
   * Static because the panel is created fresh every time it opens, and a name
   * looked up on the last opening is still the answer on this one.
   */
  private static readonly sourceNames = new Map<string, SourceIdentity>();

  /**
   * Which user the cache above belongs to.
   *
   * The cache is static so it survives the panel closing and reopening, which
   * also means it survives a logout. Keys are peer ids, and the same id can
   * resolve to a different person for a different account — so the cache is
   * dropped whenever the logged-in user changes rather than served to whoever
   * logs in next.
   */
  private static cacheOwnerUid: string | null = null;

  /** Empty the cache if it belongs to a different session. */
  private static ensureCacheOwner(uid: string | null): void {
    if (CometChatSavedMessagesComponent.cacheOwnerUid === uid) return;
    CometChatSavedMessagesComponent.sourceNames.clear();
    CometChatSavedMessagesComponent.cacheOwnerUid = uid;
  }

  /**
   * The id of the conversation a saved message belongs to.
   *
   * For a group that is simply the guid. For a 1-1 it is the OTHER party, which
   * `getReceiverId()` alone does not give: on a message you RECEIVED the
   * receiver is you, so keying on it files every incoming save under your own
   * name. Which side to take therefore depends on who sent it — the same rule
   * the app uses when opening the conversation a saved row points at.
   */
  private sourcePeerId(message: CometChat.BaseMessage): string | null {
    const receiverId = message.getReceiverId?.() ?? null;
    if (message.getReceiverType?.() === CometChat.RECEIVER_TYPE.GROUP) return receiverId;

    const me = CometChatUIKit.getLoggedInUser()?.getUid();
    const senderUid = message.getSender?.()?.getUid() ?? null;
    return me && senderUid === me ? receiverId : senderUid;
  }

  private sourceKey(message: CometChat.BaseMessage): string | null {
    const id = this.sourcePeerId(message);
    if (!id) return null;
    return `${message.getReceiverType?.() ?? ''}:${id}`;
  }

  /**
   * Resolve the source-conversation label for a whole page of rows.
   *
   * Saved rows cluster hard — a hundred saves usually come from a handful of
   * chats — so resolving per row would fire a hundred lookups and ask for the
   * same chat over and over. Each conversation is resolved ONCE and the answer
   * fanned out to every row that shares it; anything already known costs
   * nothing.
   */
  private hydrateSources(page: CometChat.BaseMessage[]): void {
    // Drop anything cached for a previous session before reading it.
    CometChatSavedMessagesComponent.ensureCacheOwner(
      CometChatUIKit.getLoggedInUser?.()?.getUid() ?? null
    );
    const unresolved = new Map<string, CometChat.BaseMessage>();

    for (const message of page) {
      const key = this.sourceKey(message);
      if (!key) continue;

      const known = CometChatSavedMessagesComponent.sourceNames.get(key);
      if (known) {
        this.applySource(key, known);
      } else if (!unresolved.has(key)) {
        unresolved.set(key, message);
      }
    }

    unresolved.forEach(message => void this.hydrateSource(message));
  }

  /**
   * Resolve the conversation a saved message came from.
   *
   * A saved row spans conversations, so it needs a "where is this from" label
   * the message itself does not carry as text — only a raw uid/guid. Resolve it
   * lazily and NEVER withhold a row waiting on the answer: the raw id shows
   * meanwhile, which is strictly better than an empty list.
   */
  private async hydrateSource(message: CometChat.BaseMessage): Promise<void> {
    const id = this.sourcePeerId(message);
    const key = this.sourceKey(message);
    if (!id || !key) return;

    const known = CometChatSavedMessagesComponent.sourceNames.get(key);
    if (known) {
      this.applySource(key, known);
      return;
    }

    try {
      const entity =
        message.getReceiverType?.() === CometChat.RECEIVER_TYPE.GROUP
          ? await CometChat.getGroup(id)
          : await CometChat.getUser(id);
      if (!entity) return;

      // The same helpers the conversation list uses, so a group falls back to
      // its icon and a user to their avatar by exactly the same rule.
      const identity: SourceIdentity = {
        name: getConversationAvatarName(entity),
        avatar: getConversationAvatarImage(entity),
      };
      if (!identity.name) return;

      CometChatSavedMessagesComponent.sourceNames.set(key, identity);
      this.applySource(key, identity);
    } catch {
      // Keep the row; the raw id stays on screen.
    }
  }

  /** Give every row from the same conversation the identity resolved for it. */
  private applySource(key: string, identity: SourceIdentity): void {
    this.rows.update(rows =>
      rows.map(r =>
        this.sourceKey(r.message) === key
          ? { ...r, sourceName: identity.name, sourceAvatar: identity.avatar }
          : r
      )
    );
    this.cdr.markForCheck();
  }

  /**
   * Saves are private but multi-device, so the same user saving elsewhere
   * changes this list. A save inserts at the head, an unsave drops the row.
   */
  private subscribeToSaveEvents(): void {
    // Merged view — see the Pinned panel: optimism for feedback, truth for
    // correctness, one subscription per direction so they cannot drift.
    CometChatPinSaveEvents.saved$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ message }) => {
        this.rows.update(rows =>
          rows.some(r => r.message.getId() === message.getId())
            ? rows
            : sortRowsNewestFirst([{ message, sourceName: null, sourceAvatar: '' }, ...rows])
        );
        this.state.set(this.rows().length ? States.loaded : States.empty);
        void this.hydrateSource(message);
        this.cdr.markForCheck();
      });

    CometChatPinSaveEvents.unsaved$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ message }) => {
        this.rows.update(rows => rows.filter(r => r.message.getId() !== message.getId()));
        this.state.set(this.rows().length ? States.loaded : States.empty);
        this.cdr.markForCheck();
      });
  }

  /** Per the design, the title names the panel; the list itself shows how many. */
  get title(): string {
    return CometChatLocalize.getLocalizedString('saved_messages_title')
      .replace('{count}', '')
      .trim();
  }

  /** Falls back to the raw id so a row is never blank while resolving. */
  sourceLabel(row: SavedRow): string {
    if (row.sourceName) return row.sourceName;
    // Same peer the name is being resolved for, so the placeholder it replaces
    // is never a different conversation's id.
    return this.sourcePeerId(row.message) ?? '';
  }

  isGroupRow(row: SavedRow): boolean {
    return row.message.getReceiverType?.() === CometChat.RECEIVER_TYPE.GROUP;
  }

  /**
   * The unsave awaiting confirmation, or null.
   *
   * Unsaving asks first: a save can be the only pointer the user has to a
   * message buried far up a conversation's history, and losing it by a stray
   * click means going back to find it.
   */
  pendingUnsave = signal<CometChat.BaseMessage | null>(null);

  unsave(row: SavedRow, event: Event): void {
    // The row navigates; this button must not.
    event.stopPropagation();
    this.pendingUnsave.set(row.message);
    this.cdr.markForCheck();
  }

  confirmUnsave(): void {
    const message = this.pendingUnsave();
    this.pendingUnsave.set(null);
    if (message) void this.pinSave.run('unsave', message);
  }

  cancelUnsave(): void {
    this.pendingUnsave.set(null);
    this.cdr.markForCheck();
  }

  /**
   * Open the message a row points at.
   *
   * Clicks landing on a control inside the row belong to that control, not to
   * the row — matching the pinned panel. Relying on each control to stop
   * propagation works only until someone adds one that forgets.
   */
  onRowClick(row: SavedRow, event?: Event): void {
    if (event && isInteractiveTarget(event)) return;
    this.messageClick.emit(row.message);
  }

  onRowKeydown(event: KeyboardEvent, row: SavedRow): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onRowClick(row, event);
    }
  }

  retry(): void {
    void this.load();
  }

  /**
   * `Sender:` ahead of the preview, by the conversation list's rule.
   *
   * Group rows name who spoke, because the title is the group and the speaker
   * would otherwise be unidentifiable; 1-1 rows do not, because the title is
   * already the only other person it could be. Action and call messages read as
   * whole sentences, so a name in front of them makes no sense.
   */
  senderPrefix(row: SavedRow): string {
    if (!this.isGroupRow(row)) return '';

    const message = row.message;
    const category = message.getCategory?.();
    if (category === CometChatUIKitConstants.MessageCategory.action) return '';
    if (category === CometChatUIKitConstants.MessageCategory.call) return '';

    const me = CometChatUIKit.getLoggedInUser()?.getUid();
    if (me && message.getSender?.()?.getUid() === me) {
      return CometChatLocalize.getLocalizedString('conversation_subtitle_you_message') + ':';
    }

    const sender = message.getSender?.()?.getName();
    return sender ? sender + ':' : '';
  }

  /**
   * The row's preview text.
   *
   * Built from the same rules the conversation list uses, so a saved row reads
   * the way the same message reads there: a media message names its type rather
   * than showing a bare `(image)`, a markdown link shows its label instead of
   * its URL, and a deleted message says so.
   */
  preview(row: SavedRow): string {
    const message = row.message;
    const loc = (key: string) => CometChatLocalize.getLocalizedString(key);

    if (message.getDeletedAt?.()) return loc('conversation_subtitle_deleted_message');

    const type = message.getType?.() ?? '';
    const category = message.getCategory?.();

    if (category === CometChatUIKitConstants.MessageCategory.card) {
      return (message as CometChat.CardMessage).getText?.() || loc('card_message');
    }

    switch (type) {
      case CometChatUIKitConstants.MessageTypes.text: {
        const text = (message as CometChat.TextMessage).getText?.() ?? '';
        // Show a markdown link's label, not its URL — the URL is noise at this size.
        return hasMarkdownLink(text) ? text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') : text;
      }
      case CometChatUIKitConstants.MessageTypes.image:
        return this.captionOr(message, 'conversation_subtitle_image');
      case CometChatUIKitConstants.MessageTypes.video:
        return this.captionOr(message, 'conversation_subtitle_video');
      case CometChatUIKitConstants.MessageTypes.audio:
        return this.captionOr(message, 'conversation_subtitle_audio');
      case CometChatUIKitConstants.MessageTypes.file:
        return this.captionOr(message, 'conversation_subtitle_file');
      case CometChatUIKitConstants.ExtensionTypes.poll:
        return loc('conversation_subtitle_poll');
      case CometChatUIKitConstants.ExtensionTypes.sticker:
        return loc('conversation_subtitle_sticker');
      case CometChatUIKitConstants.ExtensionTypes.document:
        return loc('conversation_subtitle_collaborative_document');
      case CometChatUIKitConstants.ExtensionTypes.whiteboard:
        return loc('conversation_subtitle_collaborative_whiteboard');
      default:
        return type;
    }
  }

  /** A captioned attachment shows its caption; an uncaptioned one names its type. */
  private captionOr(message: CometChat.BaseMessage, typeKey: string): string {
    const caption = (message as CometChat.MediaMessage).getCaption?.();
    return caption || CometChatLocalize.getLocalizedString(typeKey);
  }

  /**
   * Which media glyph leads the preview, as a class suffix. `none` renders
   * nothing — the icon is only meaningful when the text alone is ambiguous.
   */
  previewIcon(row: SavedRow): string {
    return getSubtitleIconName(row.message, CometChatUIKit.getLoggedInUser()?.getUid() ?? '');
  }

  /** A saved thread reply is marked, so it is clear it lives inside a thread. */
  isThreadReply(row: SavedRow): boolean {
    return (row.message.getParentMessageId?.() ?? 0) > 0;
  }

}

/**
 * Newest message first.
 *
 * The server does not hand the saved list back in this order, so it is imposed
 * here rather than assumed — without it the first page reads bottom-up. Ordered
 * by `sentAt` rather than `savedAt` so it agrees with the cursor: paging walks
 * back through `sentAt`, and sorting on the other key would have later pages
 * interleaving into the middle of the list instead of extending its foot.
 *
 * Ties keep the order they arrived in — `sort` is stable — so two messages
 * sharing a second stay where the server put them rather than being shuffled by
 * a tie-break this side has no better basis for. The pinned panel orders itself
 * by the same rule, on `pinnedAt`.
 */
function sortRowsNewestFirst(rows: SavedRow[]): SavedRow[] {
  return [...rows].sort(
    (a, b) => (b.message.getSentAt?.() ?? 0) - (a.message.getSentAt?.() ?? 0)
  );
}
