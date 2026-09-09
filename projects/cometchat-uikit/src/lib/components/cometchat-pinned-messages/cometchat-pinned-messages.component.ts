import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  AfterViewInit,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  Output,
  TemplateRef,
  booleanAttribute,
  numberAttribute,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatDateComponent } from '../base-elements/cometchat-date/cometchat-date.component';
import { CometChatMessageBubbleComponent } from '../cometchat-message-bubble/cometchat-message-bubble.component';
import { CometChatAvatarComponent } from '../base-elements/cometchat-avatar/cometchat-avatar.component';
import { CometChatPinSaveConfirmDialogComponent } from '../base-elements/cometchat-pin-save-confirm-dialog/cometchat-pin-save-confirm-dialog.component';
import { CometChatMessageInformationComponent } from '../cometchat-message-information/cometchat-message-information.component';
import { CometChatActionsIcon } from '../../modals/CometChatActionsIcon';
import { ContextMenuItem } from '../base-elements/cometchat-context-menu/cometchat-context-menu.component';
import { CometChatUIKit } from '../../cometchat-uikit';
import { CometChatUIKitConstants } from '../../constants';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { CalendarObject } from '../../resources/CometChatLocalize/localization.interfaces';
import { PinSaveService } from '../../services/pin-save.service';
import { FocusTrapService } from '../../services/focus-trap.service';
import { CometChatPinSaveEvents } from '../../events/CometChatPinSaveEvents';
import { CometChatUIEvents } from '../../events/CometChatUIEvents';
import { CometChatMessageEvents, IMessages } from '../../events/CometChatMessageEvents';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';
import { CometChatLogger } from '../../utils/CometChatLogger';
import {
  applyPinSaveFrom,
  carryPinSaveForward,
  isInteractiveTarget,
} from '../../utils/pin-save-utils';
import { States } from '../../Enums/Enums';

/**
 * CometChatPinnedMessages — the pinned messages of ONE conversation, newest pin
 * first, opened from the chat header.
 *
 * Read-only by design: opening this panel must not mark anything as read, emit
 * receipts, or move the unread count. It is a lens over messages the user has
 * already been shown, not a second inbox.
 */
@Component({
  selector: 'cometchat-pinned-messages',
  standalone: true,
  imports: [
    CometChatPinSaveConfirmDialogComponent,
    CommonModule,
    TranslatePipe,
    CometChatDateComponent,
    CometChatMessageBubbleComponent,
    CometChatAvatarComponent,
    CometChatMessageInformationComponent,
  ],
  templateUrl: './cometchat-pinned-messages.component.html',
  styleUrls: ['./cometchat-pinned-messages.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatPinnedMessagesComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pinSave = inject(PinSaveService);
  private readonly focusTrap = inject(FocusTrapService);
  private readonly elementRef = inject(ElementRef);

  /** Scope the list to a 1-1 conversation. Mutually exclusive with `group`. */
  @Input() user?: CometChat.User;
  /** Scope the list to a group. Mutually exclusive with `user`. */
  @Input() group?: CometChat.Group;
  /** Hides the close button, for hosts that supply their own chrome. */
  @Input({ transform: booleanAttribute }) hideCloseButton = false;

  /** Replaces the default "Pinned Messages" header row. */
  @Input() headerView?: TemplateRef<unknown>;
  @Input() emptyView?: TemplateRef<unknown>;
  @Input() errorView?: TemplateRef<unknown>;
  @Input() loadingView?: TemplateRef<unknown>;
  /**
   * Replaces a whole row, not just its bubble.
   *
   * The row's click and keyboard affordances go with it — a host taking over the
   * row owns its interaction too, which is the point of replacing it rather than
   * decorating it. The message arrives as `$implicit` and again as `message`.
   */
  @Input() itemView?: TemplateRef<{ $implicit: CometChat.BaseMessage; message: CometChat.BaseMessage }>;

  /**
   * Formatters applied to each row's text — mentions, links, markdown, or a
   * custom one. Falls back to the global config's set when unset, exactly as the
   * message bubble does on its own.
   */
  @Input() textFormatters?: CometChatTextFormatter[];

  /**
   * Custom request builder, for page size and any other supported filter.
   *
   * Used as supplied apart from `setPinned` and the conversation scope, which are
   * re-asserted — without them the read is ordinary history, or another chat's.
   */
  @Input() messagesRequestBuilder?: CometChat.MessagesRequestBuilder;

  /**
   * How many options sit outside the overflow menu as bare icons.
   *
   * Defaults to 1, matching the React kit: Unpin stays reachable in one tap and
   * everything else folds into the ⋮.
   */
  @Input({ transform: numberAttribute }) quickOptionsCount = 1;

  // ── Message option toggles ──

  /**
   * Hides Unpin.
   *
   * There is no client-side role gate, so this input is the only thing that
   * withholds Unpin — apart from a system pin, which nobody may lift. A member
   * without the permission still sees the option; the server refuses the call
   * and the optimistic flip reverts.
   */
  @Input({ transform: booleanAttribute }) hideUnpinMessageOption = false;
  /** Hides Save. */
  @Input({ transform: booleanAttribute }) hideSaveMessageOption = false;
  /** Hides Unsave. */
  @Input({ transform: booleanAttribute }) hideUnsaveMessageOption = false;
  /** Hides Message Information. */
  @Input({ transform: booleanAttribute }) hideMessageInfoOption = false;
  /** Hides Translate. */
  @Input({ transform: booleanAttribute }) hideTranslateMessageOption = false;
  /** Hides Copy. */
  @Input({ transform: booleanAttribute }) hideCopyMessageOption = false;
  /** Hides Report. */
  @Input({ transform: booleanAttribute }) hideFlagMessageOption = false;
  /** Hides Message Privately. */
  @Input({ transform: booleanAttribute }) hideMessagePrivatelyOption = false;

  @Output() closeClick = new EventEmitter<void>();
  /** A row was tapped — the host jumps the main list to that message. */
  @Output() messageClick = new EventEmitter<CometChat.BaseMessage>();
  @Output() error = new EventEmitter<CometChat.CometChatException>();
  /**
   * An option this panel cannot complete on its own — Info, Translate, Report.
   * Each needs a surface the host owns, so it forwards rather than half-acting.
   */
  @Output() messageOptionClick = new EventEmitter<{
    option: ContextMenuItem;
    message: CometChat.BaseMessage;
  }>();

  messages = signal<CometChat.BaseMessage[]>([]);

  /**
   * Which load is current. A conversation switch mid-flight must not let the
   * previous request's result land — it would show another chat's pins.
   */
  private loadGeneration = 0;

  /**
   * How many rows are on screen. Grows a page at a time as the user scrolls.
   *
   * The server caps a conversation at 100 pins and hands back the whole list in
   * one request, so paging here is about what is RENDERED, not what is fetched:
   * a hundred full bubbles built up front is the cost worth avoiding, and one
   * small request beats several. It also sidesteps the SDK's inability to
   * advance a pinned list's cursor — the cursor is keyed on `pinnedAt`, which
   * `MessagesRequest` cannot send, so a second fetch would return page one
   * again. When that lands, this can become a real fetch without the list
   * behaving any differently.
   */
  private static readonly PAGE_SIZE = 30;
  private visibleCount = signal(CometChatPinnedMessagesComponent.PAGE_SIZE);

  visibleMessages = computed(() => this.messages().slice(0, this.visibleCount()));
  hasMoreToShow = computed(() => this.visibleCount() < this.messages().length);

  /** Reveal the next page once the reader is near the end of the current one. */
  onListScroll(event: Event): void {
    if (!this.hasMoreToShow()) return;
    const el = event.target as HTMLElement;
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (remaining > 200) return;
    this.visibleCount.update(n => n + CometChatPinnedMessagesComponent.PAGE_SIZE);
    this.cdr.markForCheck();
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
    // Escape belongs to whatever is on top: the Information overlay first,
    // then a confirmation, and only then the panel itself.
    if (this.messageInfoTarget()) { this.closeMessageInfo(); return; }
    if (this.pendingPinSave()) { this.cancelPinSave(); return; }
    this.closeClick.emit();
  }

  ngOnInit(): void {
    this.initialised = true;
    // Prime the scope here as well as in ngOnChanges: a host that assigns the
    // inputs programmatically never triggers ngOnChanges, and an unprimed
    // scope would make the next real change look like a conversation switch.
    this.loadedScope = this.currentScope();
    void this.load();
    void this.resolveSaveEnabled();
    this.subscribeToPinEvents();
  }

  /**
   * Whether Save/Unsave may be offered at all.
   *
   * Starts false so the options never flash in before the answer arrives: on an
   * older SDK, or with the feature switched off for the app, `pinSave.run()`
   * silently no-ops — a visible option that does nothing is worse than no
   * option. Mirrors how the message list resolves the same flag.
   */
  private saveMessageEnabled = signal(false);

  private async resolveSaveEnabled(): Promise<void> {
    try {
      this.saveMessageEnabled.set(await this.pinSave.isSaveEnabled());
    } catch {
      this.saveMessageEnabled.set(false);
    }
    this.cdr.markForCheck();
  }

  /**
   * Refetch when the panel is pointed at a different conversation.
   *
   * Hosts commonly keep one panel instance and swap `user`/`group` as the user
   * moves between chats. Without this the panel keeps showing the pins of the
   * conversation it was first opened for — stale rows, silently.
   *
   * Compared by id rather than object identity: a host that re-creates its
   * `CometChat.User`/`Group` on every change-detection pass would otherwise
   * refetch continuously.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['user'] && !changes['group']) return;

    const next = this.currentScope();
    if (next === this.loadedScope) return;
    this.loadedScope = next;

    // ngOnInit has not run yet on the first change — it does the initial load.
    if (!this.initialised) return;
    void this.load(true);
  }

  /**
   * A stable id for the conversation the panel is pointed at.
   *
   * Identified by shape rather than `instanceof`: a host may hand over a plain
   * object, and `instanceof` also fails across duplicate copies of the SDK
   * module. A wrong answer here means either a missed refetch or an endless one.
   */
  private currentScope(): string {
    const idOf = (value: CometChat.User | CometChat.Group | undefined): string => {
      if (!value) return '';
      const shape = value as unknown as { getGuid?: () => string; getUid?: () => string };
      if (typeof shape.getGuid === 'function') return `group:${shape.getGuid()}`;
      if (typeof shape.getUid === 'function') return `user:${shape.getUid()}`;
      return '';
    };
    return `${idOf(this.user)}|${idOf(this.group)}`;
  }

  /** Which conversation the current rows belong to, so we only refetch on a real change. */
  private loadedScope = '';

  /** ngOnInit owns the first load; ngOnChanges fires before it. */
  private initialised = false;

  /**
   * The server caps a conversation at 100 pins and exposes no count field, so
   * the panel fetches the whole list and counts it. One request covers the cap.
   */
  private async load(reset = false): Promise<void> {
    const generation = ++this.loadGeneration;
    // An explicit reload starts from nothing. Merging into rows that belong to
    // the conversation we just left would append this conversation's pins to
    // the previous one's.
    if (reset) {
      this.messages.set([]);
      this.visibleCount.set(CometChatPinnedMessagesComponent.PAGE_SIZE);
    }
    this.state.set(States.loading);
    try {
      // The pinned list is not cursor-paginated: the server ignores sentAt/id under
      // `pinned=1` and returns the whole capped list in one page. fetchPrevious()
      // suits that better than fetchNext(), which refuses to run without a cursor
      // this list has no meaning for. The page's own order is not relied on —
      // `sortByPinnedAtDesc` imposes newest-pin-first below.
      const builder = (this.messagesRequestBuilder ?? new CometChat.MessagesRequestBuilder().setLimit(100))
        .setPinned(true);
      if (this.group) builder.setGUID(this.group.getGuid());
      else if (this.user) builder.setUID(this.user.getUid());
      else {
        this.state.set(States.empty);
        return;
      }

      const scope = this.group ? `GUID ${this.group.getGuid()}` : `UID ${this.user?.getUid()}`;
      const page = await builder.build().fetchPrevious();

      // A conversation switch mid-flight must not land the old result.
      if (generation !== this.loadGeneration) return;

      // Merge rather than replace: a pin broadcast can land between the request
      // going out and the page arriving, and a straight `set` would drop it.
      // On a reload the list was emptied above, so this merges into nothing but
      // still catches a pin that arrived while THIS request was in flight.
      const seen = new Set(this.messages().map(m => m.getId()));
      const merged = sortByPinnedAtDesc([
        ...this.messages(),
        ...page.filter(m => !seen.has(m.getId())),
      ]);
      this.messages.set(merged);
      this.state.set(merged.length ? States.loaded : States.empty);
    } catch (err) {
      if (generation !== this.loadGeneration) return;
      const error = err as CometChat.CometChatException;
      this.state.set(States.error);
      this.error.emit(error);
      CometChatLogger.error('CometChatPinnedMessages', 'Failed to load pinned messages:', err);
    } finally {
      this.cdr.markForCheck();
    }
  }

  /**
   * Pins are conversation-wide, so another member pinning or unpinning changes
   * this list under the user. The event carries the full message, so a pin is
   * inserted at the head and an unpin drops the row.
   */
  private subscribeToPinEvents(): void {
    // The merged view, so an optimistic pin shows up instantly and the server's
    // confirmation reconciles it — subscribing to one tier only would either lag
    // by a round trip or never reflect this user's own action.
    CometChatPinSaveEvents.pinned$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ message }) => {
        if (!this.belongsHere(message)) return;
        // Guarded against a double-insert: a pin broadcast can arrive while the
        // initial fetch is still in flight and then again inside its page.
        this.messages.update(list =>
          list.some(m => m.getId() === message.getId()) ? list : insertByPinnedAt(list, message)
        );
        this.state.set(this.messages().length ? States.loaded : States.empty);
        this.cdr.markForCheck();
      });

    CometChatPinSaveEvents.unpinned$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ message }) => {
        this.messages.update(list => list.filter(m => m.getId() !== message.getId()));
        this.state.set(this.messages().length ? States.loaded : States.empty);
        this.cdr.markForCheck();
      });

    /*
     * Saving does not change WHICH messages are pinned, but it does change how a
     * row renders — the bookmark in its meta row, and whether the quick action
     * reads Save or Unsave. Both read `isSaved()` off the message object, so
     * without swapping in the updated one the row keeps describing the state it
     * was in before the save. Membership is deliberately untouched here: an
     * unsave must not drop a row from a list that is about PINS.
     */
    merge(CometChatPinSaveEvents.saved$, CometChatPinSaveEvents.unsaved$)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ message }) => this.replaceMessage(message, true));

    this.subscribeToContentEvents();
  }

  /**
   * The panel renders full bubbles, so anything that changes a bubble's CONTENT
   * has to reach it: an edit rewrites the text, moderation can replace it with a
   * notice, reactions draw chips, and a delete must take the row away.
   *
   * Without these a pinned row keeps showing the text it had when the panel
   * opened, and a deleted message lingers as a ghost.
   */
  private subscribeToContentEvents(): void {
    merge(CometChatMessageEvents.ccMessageEdited, CometChatMessageEvents.ccMessageSent)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event: IMessages) => this.replaceMessage(event?.message));

    CometChatMessageEvents.ccMessageDeleted
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message: CometChat.BaseMessage) => this.removeMessage(message));

    // Subscribed separately, not merged: the subject carries no direction, and
    // the helper needs to be told whether this was an add or a removal.
    CometChatMessageEvents.onMessageReactionAdded
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event: CometChat.ReactionEvent) =>
        this.applyReaction(event, CometChat.REACTION_ACTION.REACTION_ADDED)
      );

    CometChatMessageEvents.onMessageReactionRemoved
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event: CometChat.ReactionEvent) =>
        this.applyReaction(event, CometChat.REACTION_ACTION.REACTION_REMOVED)
      );
  }

  /**
   * Drop a row, plus any pinned reply orphaned by it.
   *
   * Deleting a parent does not delete its replies, so a pinned reply whose
   * parent has gone would otherwise linger with nothing behind it.
   */
  private removeMessage(deleted: CometChat.BaseMessage): void {
    const deletedId = deleted?.getId?.();
    if (!deletedId) return;

    this.messages.update(list =>
      list.filter(m => {
        if (m.getId() === deletedId) return false;
        const parentId = m.getParentMessageId?.();
        return !(parentId && parentId === deletedId);
      })
    );
    this.state.set(this.messages().length ? States.loaded : States.empty);
    this.cdr.markForCheck();
  }

  /** Redraw a row's reaction chips in place. */
  private applyReaction(
    event: CometChat.ReactionEvent,
    action: CometChat.REACTION_ACTION
  ): void {
    const reaction = event?.getReaction?.();
    if (!reaction) return;
    // Compared as strings: the SDK hands back a numeric id in some payloads and
    // a string in others, and `===` between the two silently drops the reaction.
    // The saved panel normalises the same way.
    const messageId = String(reaction.getMessageId());
    const existing = this.messages().find(m => String(m.getId()) === messageId);
    // Not pinned here — the reaction belongs to some other message.
    if (!existing) return;

    try {
      const updated = CometChat.CometChatHelper.updateMessageWithReactionInfo(
        existing,
        reaction,
        action
      ) as CometChat.BaseMessage;
      this.replaceMessage(updated);
    } catch (err) {
      CometChatLogger.error('CometChatPinnedMessages', 'Failed to apply reaction:', err);
    }
  }

  /**
   * Swap a message for its updated copy, in place.
   *
   * A new array AND the new object: the bubble reads its state off the message
   * it was handed, so mutating the old one in place would leave the binding
   * pointing at an object Angular has no reason to re-read.
   */
  private replaceMessage(
    updated: CometChat.BaseMessage,
    pinSaveAuthoritative = false
  ): void {
    const id = updated?.getId?.();
    if (!id) return;

    this.messages.update(list => {
      const index = list.findIndex(m => m.getId() === id);
      // Not on this surface — nothing to update, and nothing to insert either.
      if (index === -1) return list;

      const previous = list[index];
      const next = [...list];

      // A pin/save payload is authoritative about the three attributes and about
      // nothing else — it carries no quoted message, so the row keeps its OWN
      // object and only those attributes are patched onto it. Swapping wholesale
      // erased the reply preview from a bubble that had one.
      if (pinSaveAuthoritative && previous) {
        applyPinSaveFrom(previous, updated);
        next[index] = previous;
        return next;
      }

      // An edit, moderation or reaction payload describes THAT change and makes
      // no promise about pin/save attributes. Swapping it in wholesale would
      // blank the row's indicators — and on this panel, erase the very reason
      // the row is there.
      if (previous) carryPinSaveForward(previous, updated);

      next[index] = updated;
      return next;
    });
    this.cdr.markForCheck();
  }

  /** A pin elsewhere must not appear in this conversation's panel. */
  private belongsHere(message: CometChat.BaseMessage): boolean {
    if (this.group) return message.getReceiverId?.() === this.group.getGuid();
    if (this.user) {
      const uid = this.user.getUid();
      return message.getReceiverId?.() === uid || message.getSender?.()?.getUid() === uid;
    }
    return false;
  }

  /** Count lives inline in the title, per the design — no separate badge. */
  /** Per the design, the title names the panel; the list itself shows how many. */
  get title(): string {
    return CometChatLocalize.getLocalizedString('pinned_messages_title')
      .replace('{count}', '')
      .trim();
  }

  async unpin(message: CometChat.BaseMessage, event: Event): Promise<void> {
    // The row itself navigates; the control must not trigger that too.
    event.stopPropagation();
    await this.pinSave.run('unpin', message);
  }

  onRowClick(message: CometChat.BaseMessage, event?: Event): void {
    // Controls inside the bubble keep their own clicks.
    if (event && isInteractiveTarget(event)) return;
    this.messageClick.emit(message);
  }

  onRowKeydown(event: KeyboardEvent, message: CometChat.BaseMessage): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onRowClick(message, event);
    }
  }

  retry(): void {
    void this.load(true);
  }

  senderName(message: CometChat.BaseMessage): string {
    return message.getSender()?.getName() ?? '';
  }

  /**
   * Every entry runs down the LEFT, your own included.
   *
   * This is a list of pins, not a dialogue: mirroring your own messages to the
   * right would leave the eye hunting for each author down a column that is
   * already narrow. The colour still says whose it is — see `variantOf`.
   */
  readonly rowAlignment = MessageBubbleAlignment.left;

  /** …but your own pins keep their own colour, as they do in the conversation. */
  variantOf(message: CometChat.BaseMessage): 'incoming' | 'outgoing' {
    const me = CometChatUIKit.getLoggedInUser()?.getUid();
    return message.getSender()?.getUid() === me ? 'outgoing' : 'incoming';
  }

  /**
   * Unpin and Save first, then everything else.
   *
   * Order IS the split: the bubble's `quickOptionsCount` keeps the first two as
   * bare icons and folds the remainder into the ⋮, the same way the thread view
   * does — so the two actions this panel exists for stay one click away and the
   * long tail does not crowd the row.
   *
   * The list stays read-only regardless: no markAsRead, no receipts, no unread
   * movement, and nothing here edits or deletes.
   */
  optionsFor(message: CometChat.BaseMessage): CometChatActionsIcon[] {
    const options: CometChatActionsIcon[] = [];
    const me = CometChatUIKit.getLoggedInUser()?.getUid();
    const isOwn = !!me && message.getSender?.()?.getUid() === me;
    // Copy and Translate act on TEXT, so they are offered only where there is any.
    const isText = message.getType?.() === CometChatUIKitConstants.MessageTypes.text;

    // A system pin is refused for everyone — it is the app's, not a member's, so
    // no member can take it down and the option would only ever produce an
    // error toast. That is the one case still withheld client-side.
    if (!this.hideUnpinMessageOption && !this.isSystemPin(message)) {
      options.push(new CometChatActionsIcon({
        id: CometChatUIKitConstants.MessageOption.unpinMessage,
        title: CometChatLocalize.getLocalizedString('message_list_option_unpin_message'),
        iconURL: 'assets/keep_off.svg',
        onClick: () => {},
      }));
    }

    const saved = !!message.isSaved?.();
    const saveHidden = saved ? this.hideUnsaveMessageOption : this.hideSaveMessageOption;
    if (!saveHidden && this.saveMessageEnabled()) {
      options.push(new CometChatActionsIcon({
        id: saved
          ? CometChatUIKitConstants.MessageOption.unsaveMessage
          : CometChatUIKitConstants.MessageOption.saveMessage,
        title: CometChatLocalize.getLocalizedString(
          saved ? 'message_list_option_unsave_message' : 'message_list_option_save_message'
        ),
        iconURL: saved ? 'assets/bookmark_remove.svg' : 'assets/bookmark.svg',
        onClick: () => {},
      }));
    }

    // ── everything below folds into the ⋮ ──
    if (isOwn && !this.hideMessageInfoOption) {
      options.push(new CometChatActionsIcon({
        id: CometChatUIKitConstants.MessageOption.messageInformation,
        title: CometChatLocalize.getLocalizedString('message_list_option_info'),
        iconURL: 'assets/info_icon.svg',
        onClick: () => {},
      }));
    }
    if (isText && !this.hideTranslateMessageOption) {
      options.push(new CometChatActionsIcon({
        id: CometChatUIKitConstants.MessageOption.translateMessage,
        title: CometChatLocalize.getLocalizedString('message_list_option_translate'),
        iconURL: 'assets/translate.svg',
        onClick: () => {},
      }));
    }
    if (isText && !this.hideCopyMessageOption) {
      options.push(new CometChatActionsIcon({
        id: CometChatUIKitConstants.MessageOption.copyMessage,
        title: CometChatLocalize.getLocalizedString('message_list_option_copy'),
        iconURL: 'assets/Copy.svg',
        onClick: () => {},
      }));
    }
    if (!isOwn && !this.hideFlagMessageOption) {
      options.push(new CometChatActionsIcon({
        id: CometChatUIKitConstants.MessageOption.flagMessage,
        title: CometChatLocalize.getLocalizedString('message_list_option_flag_message'),
        iconURL: 'assets/flags.svg',
        onClick: () => {},
      }));
    }
    // Group-only and never on your own message, the same two gates the message
    // list applies — there is no private channel to open with yourself, and in a
    // 1:1 chat you are already in it.
    if (!isOwn && !this.hideMessagePrivatelyOption && this.group) {
      options.push(new CometChatActionsIcon({
        id: CometChatUIKitConstants.MessageOption.sendMessagePrivately,
        title: CometChatLocalize.getLocalizedString('message_list_option_message_privately'),
        iconURL: 'assets/send_message_privately.svg',
        onClick: () => {},
      }));
    }

    return options;
  }

  /**
   * The unpin/unsave awaiting confirmation, or null.
   *
   * Only the removing directions ask. Pin and Save are additive and undone from
   * the same menu; unpinning takes the message off the list for everyone in the
   * conversation, and an unsave can drop the only pointer the user had to it.
   */
  pendingPinSave = signal<{ action: 'unpin' | 'unsave'; message: CometChat.BaseMessage } | null>(null);

  /** The message whose Information overlay is open, or null. */
  messageInfoTarget = signal<CometChat.BaseMessage | null>(null);

  closeMessageInfo(): void {
    this.messageInfoTarget.set(null);
    this.cdr.markForCheck();
  }

  confirmPinSave(): void {
    const pending = this.pendingPinSave();
    this.pendingPinSave.set(null);
    if (pending) void this.pinSave.run(pending.action, pending.message);
  }

  cancelPinSave(): void {
    this.pendingPinSave.set(null);
    this.cdr.markForCheck();
  }

  onBubbleOption(option: ContextMenuItem, message: CometChat.BaseMessage): void {
    const Option = CometChatUIKitConstants.MessageOption;
    switch (option?.id) {
      case Option.unpinMessage:
        this.pendingPinSave.set({ action: 'unpin', message });
        this.cdr.markForCheck();
        return;
      case Option.saveMessage:
        void this.pinSave.run('save', message);
        return;
      case Option.unsaveMessage:
        this.pendingPinSave.set({ action: 'unsave', message });
        this.cdr.markForCheck();
        return;
      case Option.copyMessage:
        void this.copyToClipboard(message);
        return;
      case Option.sendMessagePrivately: {
        // Same effect as from the message list: ask the host to open the direct
        // chat with the sender. The panel does not close itself — the host owns
        // its own chrome and may keep it open beside the new conversation.
        const sender = message.getSender?.();
        if (sender) {
          CometChatUIEvents.ccOpenChat.next({ user: sender });
          this.messageOptionClick.emit({ option, message });
        }
        return;
      }
      case Option.messageInformation:
        // Shown in the panel rather than forwarded: Info is self-contained and
        // the host has nowhere obvious to put it while this drawer is open.
        this.messageInfoTarget.set(message);
        this.cdr.markForCheck();
        return;
      default:
        // Info, Translate and Report each need surfaces this panel does not own
        // — the info drawer, the translation cache, the report dialog — so they
        // are handed to the host rather than half-built here.
        this.messageOptionClick.emit({ option, message });
    }
  }

  private async copyToClipboard(message: CometChat.BaseMessage): Promise<void> {
    const text = (message as CometChat.TextMessage).getText?.() ?? '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      CometChatLogger.error('CometChatPinnedMessages', 'Failed to copy message:', err);
    }
  }

  /** The date beside each author, short because it sits inline with the name. */
  entryDateFormat: CalendarObject = { today: 'DD/MM/YY', yesterday: 'DD/MM/YY', otherDays: 'DD/MM/YY' };

  /** Your own pins say "You", as the conversation list does for your messages. */
  displayName(message: CometChat.BaseMessage): string {
    const me = CometChatUIKit.getLoggedInUser()?.getUid();
    if (me && message.getSender?.()?.getUid() === me) {
      return CometChatLocalize.getLocalizedString('conversation_subtitle_you_message');
    }
    return this.senderName(message);
  }

  /** Empty is fine — the avatar falls back to initials from the name. */
  senderAvatar(message: CometChat.BaseMessage): string {
    return message.getSender?.()?.getAvatar?.() ?? '';
  }

  /** `app_system` means the app pinned it, not a person. */
  isSystemPin(message: CometChat.BaseMessage): boolean {
    return this.pinSave.isSystemPin(message);
  }

  preview(message: CometChat.BaseMessage): string {
    if (message.getDeletedAt?.()) return CometChatLocalize.getLocalizedString('message_deleted');
    const text = (message as CometChat.TextMessage).getText?.();
    return text || `(${message.getType?.() ?? ''})`;
  }

}

/**
 * When a message was pinned, in seconds. 0 when the accessor is missing.
 *
 * Normalised because two sources feed this list and they are not guaranteed to
 * agree: the server's value, and the seconds-based one the service stamps on an
 * optimistic pin before the server answers. A millisecond value compared
 * against a second one is ~1000× larger, so a single mismatched source would
 * either pin every one of its rows to the top or bury them all at the bottom —
 * which is the failure this ordering exists to prevent.
 */
function pinnedAtOf(message: CometChat.BaseMessage): number {
  const probe = message as unknown as { getPinnedAt?: () => number | undefined };
  const raw = typeof probe.getPinnedAt === 'function' ? (probe.getPinnedAt() ?? 0) : 0;
  // Anything past ~2001 in seconds is a millisecond timestamp.
  return raw > 1e12 ? Math.floor(raw / 1000) : raw;
}

/**
 * Newest pin first.
 *
 * The list is ordered by when things were PINNED, not by when they were sent,
 * and that is not the order the server hands them back in — so it is imposed
 * here rather than assumed.
 *
 * Ties keep the order they arrived in. `sort` is stable, so two pins sharing a
 * second stay where the server put them instead of being shuffled by a
 * tie-break this side has no better basis for.
 */
function sortByPinnedAtDesc(messages: CometChat.BaseMessage[]): CometChat.BaseMessage[] {
  return [...messages].sort((a, b) => pinnedAtOf(b) - pinnedAtOf(a));
}

/**
 * Place a newly pinned message by its `pinnedAt`, rather than prepending it.
 *
 * A fresh pin carries the newest timestamp and still lands on top — which is
 * the whole point: another member's pin has to appear ABOVE the pins already
 * there, not at the foot of the list. But a message arriving with an OLDER
 * timestamp keeps its rightful slot, which is what a failed unpin does: it
 * restores the original `pinnedAt` and republishes, and a blind prepend would
 * jump that row to the top of a list nothing actually changed in.
 */
function insertByPinnedAt(
  list: CometChat.BaseMessage[],
  message: CometChat.BaseMessage
): CometChat.BaseMessage[] {
  const incoming = pinnedAtOf(message);
  const index = list.findIndex(m => pinnedAtOf(m) <= incoming);
  const at = index === -1 ? list.length : index;
  return [...list.slice(0, at), message, ...list.slice(at)];
}
