import { Injectable, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKit } from '../cometchat-uikit';
import { CometChatLocalize } from '../resources/CometChatLocalize/cometchat-localize';
import { applyPinSave, isLimitError, snapshotPinSave, isPermissionError, isSystemPinned } from '../utils/pin-save-utils';
import { CometChatPinSaveEvents } from '../events/CometChatPinSaveEvents';
import { CometChatToastService } from '../components/base-elements/cometchat-toast/cometchat-toast.service';
import { CometChatLogger } from '../utils/CometChatLogger';

/** The four actions this service performs, as the confirm modal names them. */
export type PinSaveAction = 'pin' | 'unpin' | 'save' | 'unsave';

/**
 * Which of the two independent states an action writes.
 *
 * Pin and unpin contend with each other, and so do save and unsave — but a pin
 * and a save touch different fields and may run at the same time.
 */
function familyOf(action: PinSaveAction): 'pin' | 'save' {
  return action === 'pin' || action === 'unpin' ? 'pin' : 'save';
}

/** Raised by the server when the caller lacks the scope to pin here. */
/**
 * How long to wait for the app's configured cap before giving up on it.
 *
 * The lookup sits on the path to an error toast, so it must not be able to
 * delay or suppress that toast — an uninitialised SDK can leave the call
 * pending indefinitely.
 */
const LIMIT_LOOKUP_TIMEOUT_MS = 1_500;

/**
 * How long to wait for an app-level feature flag.
 *
 * Shorter than the cap lookup: this one gates whether an option renders at all,
 * so a slow answer must not hold the surface up.
 */
const FEATURE_LOOKUP_TIMEOUT_MS = 1_000;

/**
 * Owns pinning and saving for every surface that offers them — the action
 * sheet, the bubble indicators and both panels.
 *
 * The SDK returns the **full updated message** from each call, and pin/save
 * fields are present-only-when-set, so consumers swap their copy of the message
 * rather than patching fields. Patching would leave a stale `pinnedAt` behind
 * on unpin, which is the one mistake the contract calls out explicitly.
 *
 * Optimism is deliberate and reverting: the caller confirms, the UI flips
 * immediately, and a failure puts it back. The server is idempotent, so a
 * double-pin is harmless — but a permission failure or a hit cap must not leave
 * the UI claiming something that did not happen.
 */
@Injectable({ providedIn: 'root' })
export class PinSaveService implements OnDestroy {
  /** Optional so the service still works with no toast host (SSR, tests). */
  private readonly toast: CometChatToastService | null = (() => {
    try {
      return inject(CometChatToastService);
    } catch {
      return null;
    }
  })();

  /**
   * Targets with a request on the wire, so a double-tap cannot open a second.
   *
   * Keyed by message AND family (`42:pin`, `42:save`) rather than by message
   * alone. Pinning and saving are independent actions that happen to share this
   * service: keying on the id by itself made an in-flight pin swallow a save of
   * the same message, and a swallowed action is invisible — no toast, no error,
   * nothing for the user to retry from.
   */
  private readonly inFlight = new Set<string>();

  /**
   * Feature-flag answers, resolved once per session. The flags live in the
   * SDK's app settings, so this is a cached read rather than a network call
   * per render.
   */
  private pinEnabled: boolean | null = null;
  private saveEnabled: boolean | null = null;
  private pinConversationEnabled: boolean | null = null;

  private readonly listenerId = `cometchat-uikit-pin-save-${Math.random().toString(36).slice(2)}`;
  private listenerAttached = false;
  /** Tracked apart from the message listener: one SDK build may have only one of them. */
  private conversationListenerAttached = false;
  private readonly sessionSubscription: Subscription;

  constructor() {
    this.attachSdkListener();
    this.sessionSubscription = CometChatUIKit.loggedInUser$.subscribe(() => this.resetSession());
  }

  // ==================== Capability ====================

  /**
   * Whether the installed Chat SDK exposes the pin/save API at all. The kit's
   * peer range still admits older builds, and calling a missing method throws
   * synchronously rather than rejecting — so every surface asks this before
   * rendering, and an app on an older SDK simply sees no options.
   */
  isSupported(): boolean {
    return (
      typeof CometChat.pinMessage === 'function' &&
      typeof CometChat.unpinMessage === 'function' &&
      typeof CometChat.saveMessage === 'function' &&
      typeof CometChat.unsaveMessage === 'function'
    );
  }

  /**
   * The three app-level flags, resolved together and only once.
   *
   * Every surface asks before rendering, so a burst of mounting bubbles used to
   * mean a burst of independent lookups. Concurrent callers now share one
   * in-flight promise and the answer is cached for the session, mirroring how
   * the React kit warms these at init.
   *
   * Each flag resolves false rather than rejecting: an unavailable setting
   * should hide an option, not take the surface down with it.
   */
  private featuresInFlight: Promise<void> | null = null;

  private async resolveFeatures(): Promise<void> {
    if (this.pinEnabled !== null && this.saveEnabled !== null && this.pinConversationEnabled !== null) {
      return;
    }
    if (this.featuresInFlight) return this.featuresInFlight;

    this.featuresInFlight = (async () => {
      const supported = this.isSupported();
      const read = async (name: string): Promise<boolean> => {
        if (!supported) return false;
        const fn = (CometChat as unknown as Record<string, unknown>)[name];
        if (typeof fn !== 'function') return false;
        try {
          // Raced against a deadline for the same reason the cap lookup is: an
          // uninitialised SDK leaves these pending rather than rejecting, and a
          // hang here would stop the options rendering at all. Unresolved reads
          // as "off", which hides the option rather than freezing the surface.
          return await Promise.race([
            (fn as () => Promise<boolean>).call(CometChat),
            new Promise<boolean>(resolve =>
              setTimeout(() => resolve(false), FEATURE_LOOKUP_TIMEOUT_MS)
            ),
          ]);
        } catch {
          return false;
        }
      };
      const [pin, save, pinConversation] = await Promise.all([
        read('isPinMessageEnabled'),
        read('isSaveMessageEnabled'),
        read('isPinConversationEnabled'),
      ]);
      this.pinEnabled = pin;
      this.saveEnabled = save;
      this.pinConversationEnabled = pinConversation;
      this.featuresInFlight = null;
    })();

    return this.featuresInFlight;
  }

  /** Resolves the app-level pin flag; false on any failure rather than throwing. */
  async isPinEnabled(): Promise<boolean> {
    await this.resolveFeatures();
    return this.pinEnabled ?? false;
  }

  /** Resolves the app-level save flag; false on any failure rather than throwing. */
  async isSaveEnabled(): Promise<boolean> {
    await this.resolveFeatures();
    return this.saveEnabled ?? false;
  }

  /**
   * Whether pinning a CONVERSATION is enabled for this app.
   *
   * Separate from the message flag: an app can have one without the other, and
   * checking only that the SDK exposes `pinConversation` would offer the option
   * on an app whose plan does not include it.
   */
  async isPinConversationEnabled(): Promise<boolean> {
    if (typeof (CometChat as unknown as Record<string, unknown>)['pinConversation'] !== 'function') {
      return false;
    }
    await this.resolveFeatures();
    return this.pinConversationEnabled ?? false;
  }

  // ==================== State reads ====================

  /**
   * Presence of `pinnedAt` IS the boolean — there is no separate flag, and an
   * absent value means "not pinned", never an error and never zero.
   */
  isPinned(message: CometChat.BaseMessage | null | undefined): boolean {
    return !!message?.getPinnedAt?.();
  }

  /** Same rule for saves, but scoped to the viewing user. */
  isSaved(message: CometChat.BaseMessage | null | undefined): boolean {
    return !!message?.getSavedAt?.();
  }

  /** Who pinned it, or `null`. `app_system` means an admin/global pin. */
  pinnedBy(message: CometChat.BaseMessage | null | undefined): string | null {
    return message?.getPinnedBy?.() || null;
  }

  /** True when the pin came from the app rather than a person. */
  isSystemPin(message: CometChat.BaseMessage | null | undefined): boolean {
    return isSystemPinned(message);
  }

  // ==================== Actions ====================

  /**
   * Perform one action and return the updated message, or `null` when it failed.
   *
   * The flip is applied to the passed message BEFORE the network call so the
   * indicator responds immediately, then reconciled against the authoritative
   * copy the SDK returns — the server owns the real timestamps, and re-pinning
   * rewrites `pinnedBy` to the latest pinner. On failure the pre-call attributes
   * are restored, so a rejected pin does not leave a pin showing.
   *
   * Every step publishes, because subscribers read state off the message object
   * and would otherwise render the stale one.
   */
  async run(action: PinSaveAction, message: CometChat.BaseMessage): Promise<CometChat.BaseMessage | null> {
    const id = message?.getId?.();
    if (!id || !this.isSupported()) return null;
    // One request per message per family: a double-tap must not race itself,
    // but a pin must not block a save of the same message either.
    const inFlightKey = `${id}:${familyOf(action)}`;
    if (this.inFlight.has(inFlightKey)) return null;
    this.inFlight.add(inFlightKey);

    const before = snapshotPinSave(message);
    const now = Math.floor(Date.now() / 1000);
    // Optional-called: `pinnedBy` is a nicety on an optimistic pin, and the
    // server overwrites it on reconcile. It must never be able to take the
    // whole action down.
    const me = CometChatUIKit.getLoggedInUser?.()?.getUid();

    // --- optimistic flip ---
    switch (action) {
      case 'pin':
        applyPinSave(message, { pinnedAt: now, pinnedBy: me });
        break;
      case 'unpin':
        applyPinSave(message, { pinnedAt: undefined, pinnedBy: undefined });
        break;
      case 'save':
        applyPinSave(message, { savedAt: now });
        break;
      default:
        applyPinSave(message, { savedAt: undefined });
    }
    this.publishOptimistic(action, message, this.intendedState(action));

    try {
      const updated = await this.call(action, id);
      // Defensive: an absent payload means skip reconciliation, NOT revert a
      // change the server actually accepted.
      if (updated) {
        applyPinSave(message, {
          pinnedAt: updated.getPinnedAt?.(),
          pinnedBy: updated.getPinnedBy?.(),
          savedAt: updated.getSavedAt?.(),
        });
      }
      this.publishTruth(action, updated ?? message);
      this.toast?.success(CometChatLocalize.getLocalizedString(TOAST_KEYS[action]));
      return updated;
    } catch (error) {
      applyPinSave(message, before);
      // The claim is withdrawn, not re-asserted: the reverse boolean IS the revert.
      this.publishOptimistic(action, message, !this.intendedState(action));
      this.reportFailure(action, error as CometChat.CometChatException);
      return null;
    } finally {
      this.inFlight.delete(inFlightKey);
    }
  }

  private call(action: PinSaveAction, id: number): Promise<CometChat.BaseMessage> {

    const request = (() => {
      switch (action) {
        case 'pin':
          return CometChat.pinMessage(id);
        case 'unpin':
          return CometChat.unpinMessage(id);
        case 'save':
          return CometChat.saveMessage(id);
        default:
          return CometChat.unsaveMessage(id);
      }
    })();

    return request.then(
      updated => {
        return updated;
      },
      error => {
        throw error;
      }
    );
  }

  /**
   * Turn a failure into copy the user can act on.
   *
   * The cap named in the toast comes from the app's settings, never from the
   * rejection: the SDK no longer exposes a way to read a structured limit off
   * an error, and scraping the number out of the message text guesses at prose
   * the backend is free to reword.
   */
  private reportFailure(action: PinSaveAction, error: CometChat.CometChatException): void {
    if (isPermissionError(error)) {
      this.toast?.error(CometChatLocalize.getLocalizedString('pin_message_permission_error'));
      CometChatLogger.error('PinSaveService', `Failed to ${action} message:`, error);
      return;
    }

    CometChatLogger.error('PinSaveService', `Failed to ${action} message:`, error);

    // Only quote the cap when the cap is the reason. Every other failure gets
    // the generic message: telling someone to unpin something when the pin
    // failed for an unrelated reason is advice that cannot work, and it buries
    // the real cause.
    if (!isLimitError(error)) {
      this.toast?.error(CometChatLocalize.getLocalizedString('pin_save_generic_error'));
      return;
    }

    void this.getConfiguredLimit(action).then(limit => {
      this.toast?.error(
        limit !== null
          ? this.limitMessage(action, limit)
          : CometChatLocalize.getLocalizedString('pin_save_generic_error')
      );
    });
  }

  /** The cap message for an action, with the number filled in. */
  private limitMessage(action: PinSaveAction, limit: number): string {
    const key =
      action === 'pin' || action === 'unpin'
        ? 'pin_message_limit_error'
        : 'save_message_limit_error';
    return CometChatLocalize.getLocalizedString(key).replace('{limit}', String(limit));
  }

  /**
   * The caps the app is configured with, cached for the session.
   *
   * `null` means the app settings carry no value for that cap — generic copy is
   * then correct, rather than guessing a number.
   */
  private pinnedMessagesLimit: number | null | undefined;
  private savedMessagesLimit: number | null | undefined;

  /**
   * The configured cap for an action, or null when the app sets none.
   *
   * Read once and reused: it is app configuration, not per-message state, and
   * it is now the only source for the number — both for a rejection's toast and
   * for disabling a control before the user reaches the cap.
   */
  async getConfiguredLimit(action: PinSaveAction): Promise<number | null> {
    const wantsPin = action === 'pin' || action === 'unpin';
    const cached = wantsPin ? this.pinnedMessagesLimit : this.savedMessagesLimit;
    if (cached !== undefined) return cached;

    let limit: number | null = null;
    try {
      const sdk = CometChat as unknown as Record<string, undefined | (() => Promise<number | null>)>;
      // Feature-detected: the package's peer range still admits builds without
      // these, and calling a missing method throws synchronously.
      const read = wantsPin ? sdk['getPinnedMessagesLimit'] : sdk['getSavedMessagesLimit'];
      if (typeof read === 'function') {
        // Raced against a deadline: this call can hang rather than reject when
        // the SDK is not fully initialised, and the caller is an error toast —
        // no number is recoverable, but no toast at all is not. Generic copy
        // beats silence.
        limit = await Promise.race([
          read().then(value => value ?? null),
          new Promise<null>(resolve => setTimeout(() => resolve(null), LIMIT_LOOKUP_TIMEOUT_MS)),
        ]);
      }
    } catch {
      limit = null;
    }

    if (wantsPin) this.pinnedMessagesLimit = limit;
    else this.savedMessagesLimit = limit;
    return limit;
  }

  // ==================== Events ====================

  /**
   * Announce a confirmed change — an ack, or a realtime frame from the server.
   *
   * The ack is published as truth even though the socket usually echoes it a
   * moment later: the SDK suppresses some of its own-session echoes, so the
   * acting device cannot rely on hearing about its own write. Both paths are
   * idempotent for every subscriber, so the overlap is harmless.
   */
  private publishTruth(action: PinSaveAction, message: CometChat.BaseMessage): void {
    const payload = { message };
    switch (action) {
      case 'pin':
        CometChatPinSaveEvents.publishMessagePinned(payload);
        break;
      case 'unpin':
        CometChatPinSaveEvents.publishMessageUnpinned(payload);
        break;
      case 'save':
        CometChatPinSaveEvents.publishMessageSaved(payload);
        break;
      default:
        CometChatPinSaveEvents.publishMessageUnsaved(payload);
    }
  }

  /**
   * Announce what this client is *claiming*, before the server has answered.
   *
   * `applied` is the resulting state, which is what lets one channel per pair
   * carry both directions: an optimistic unpin claims `pinned: false`, and the
   * revert of an optimistic pin claims the same thing.
   */
  private publishOptimistic(
    action: PinSaveAction,
    message: CometChat.BaseMessage,
    applied: boolean
  ): void {
    if (action === 'pin' || action === 'unpin') {
      CometChatPinSaveEvents.publishMessagePinChanged({ message, pinned: applied });
    } else {
      CometChatPinSaveEvents.publishMessageSaveChanged({ message, saved: applied });
    }
  }

  /** The state the action is asking for: the additive half of each pair is `true`. */
  private intendedState(action: PinSaveAction): boolean {
    return action === 'pin' || action === 'save';
  }

  /**
   * Bridge the SDK's realtime callbacks onto the kit bus. Pin events arrive for
   * everyone in the conversation; save events arrive only on this user's own
   * devices, which is what keeps a save in sync across their sessions.
   */
  private attachSdkListener(): void {
    if (this.listenerAttached) return;
    try {
      CometChat.addMessageListener(
        this.listenerId,
        new CometChat.MessageListener({
          onMessagePinned: (message: CometChat.BaseMessage) => this.publishTruth('pin', message),
          onMessageUnpinned: (message: CometChat.BaseMessage) => this.publishTruth('unpin', message),
          onMessageSaved: (message: CometChat.BaseMessage) => this.publishTruth('save', message),
          onMessageUnsaved: (message: CometChat.BaseMessage) => this.publishTruth('unsave', message),
        })
      );
      this.listenerAttached = true;
    } catch (error) {
      CometChatLogger.warn('PinSaveService', 'Pin/save listeners unavailable in this SDK build:', error);
    }

    // Separate registration, separate try: a build with the message listener but
    // not the conversation one must still get message events rather than losing
    // both to one throw.
    try {
      CometChat.addConversationListener(
        this.listenerId,
        new CometChat.ConversationListener({
          onConversationPinned: (conversation: CometChat.Conversation) =>
            CometChatPinSaveEvents.publishConversationPinned({ conversation }),
          onConversationUnpinned: (conversation: CometChat.Conversation) =>
            CometChatPinSaveEvents.publishConversationUnpinned({ conversation }),
        })
      );
      this.conversationListenerAttached = true;
    } catch (error) {
      CometChatLogger.warn(
        'PinSaveService',
        'Conversation pin listeners unavailable in this SDK build:',
        error
      );
    }
  }

  /**
   * Re-register the realtime listener, dropping any earlier registration.
   *
   * Attaching used to happen once, in the constructor. This service is provided
   * in root, so it can be built before the SDK is initialised — and when the
   * registration threw there, nothing ever tried again. Pin and save then went
   * silent for the whole session: the person who acted saw their own optimistic
   * flip, everyone else saw nothing until they reloaded the page.
   *
   * Re-attaching also covers a listener that survived into a session it no
   * longer belongs to, which is why the old one is removed rather than kept.
   */
  private reattachSdkListener(): void {
    this.detachSdkListeners();
    this.attachSdkListener();
  }

  /** Drop both registrations, each guarded — neither is guaranteed to exist. */
  private detachSdkListeners(): void {
    if (this.listenerAttached) {
      try {
        CometChat.removeMessageListener(this.listenerId);
      } catch {
        // Nothing to unwind if the SDK never registered it.
      }
      this.listenerAttached = false;
    }
    if (this.conversationListenerAttached) {
      try {
        CometChat.removeConversationListener(this.listenerId);
      } catch {
        // Nothing to unwind if the SDK never registered it.
      }
      this.conversationListenerAttached = false;
    }
  }

  /** Login or logout ends the session: flags and in-flight state are re-resolved. */
  private resetSession(): void {
    this.inFlight.clear();
    this.pinEnabled = null;
    this.saveEnabled = null;
    this.pinConversationEnabled = null;
    this.featuresInFlight = null;
    // Caps are per-app, and a new session may be a different app.
    this.pinnedMessagesLimit = undefined;
    this.savedMessagesLimit = undefined;
    // Login is the first moment registering can succeed, so retry it here.
    this.reattachSdkListener();
  }

  ngOnDestroy(): void {
    this.sessionSubscription.unsubscribe();
    this.detachSdkListeners();
  }
}

/** SDK method behind each action, for the console trace. */
const TOAST_KEYS: Record<PinSaveAction, string> = {
  pin: 'message_pinned_toast',
  unpin: 'message_unpinned_toast',
  save: 'message_saved_toast',
  unsave: 'message_unsaved_toast',
};
