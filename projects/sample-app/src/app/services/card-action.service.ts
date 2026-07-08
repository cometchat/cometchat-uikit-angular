import { Injectable, DestroyRef, inject } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  CometChatMessageEvents,
  ICardActionEvent,
  ChatStateService,
} from '@cometchat/chat-uikit-angular';
import type { CometChatCardAction } from '@cometchat/cards-angular';

import { NavigationService } from './navigation.service';
import { AppStateService } from './app-state.service';
import { ToastService } from './toast.service';

/** Narrows the discriminated card action union to one variant by its `type`. */
type Action<T extends CometChatCardAction['type']> = Extract<CometChatCardAction, { type: T }>;

/** Context passed to a `customCallback` app hook. */
export interface CardCallbackContext {
  elementId?: string;
  cardJson?: string;
  messageId?: string | number;
}

/**
 * CardActionService — sample-app reference implementation of the 9 card action
 * handlers.
 *
 * The UI Kit is render-only: card bubbles (developer + nested agent) forward the
 * raw renderer action on the `ccCardActionClicked` bus and run NO behavior. This
 * service subscribes ONCE (cleaned up via DestroyRef) and owns all behavior.
 */
@Injectable({ providedIn: 'root' })
export class CardActionService {
  private readonly navigation = inject(NavigationService);
  private readonly appState = inject(AppStateService);
  private readonly chatState = inject(ChatStateService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  /** App-defined hooks invoked by `customCallback` actions, keyed by callbackId. */
  private readonly customCallbacks = new Map<
    string,
    (payload: unknown, ctx: CardCallbackContext) => void
  >();

  private started = false;

  /**
   * Subscribe once to card actions. Idempotent. Auto-unsubscribes when the root
   * injector is destroyed.
   */
  start(): void {
    if (this.started) return;
    this.started = true;
    CometChatMessageEvents.subscribeOnCardActionClicked(
      (event) => this.dispatch(event),
      this.destroyRef
    );
  }

  /** Registers an app hook for a `customCallback` action's `callbackId`. */
  registerCustomCallback(
    callbackId: string,
    handler: (payload: unknown, ctx: CardCallbackContext) => void
  ): void {
    this.customCallbacks.set(callbackId, handler);
  }

  // ── Dispatch ────────────────────────────────────────────────────────────────

  private dispatch(event: ICardActionEvent): void {
    const action = event.action as CometChatCardAction | null | undefined;
    if (!action || typeof action !== 'object') return;

    try {
      switch (action.type) {
        case 'openUrl':
          this.openUrl(action);
          break;
        case 'copyToClipboard':
          this.copyToClipboard(action);
          break;
        case 'downloadFile':
          this.downloadFile(action);
          break;
        case 'sendMessage':
          void this.sendMessage(action);
          break;
        case 'apiCall':
          void this.apiCall(action);
          break;
        case 'chatWithUser':
          void this.chatWithUser(action);
          break;
        case 'chatWithGroup':
          void this.chatWithGroup(action);
          break;
        case 'initiateCall':
          void this.initiateCall(action);
          break;
        case 'customCallback':
          this.customCallback(action, event);
          break;
        default:
          // Unknown action — no behavior (the renderer owns the action vocabulary).
          break;
      }
    } catch (err) {
      this.toast.showError('Card action failed');
      // eslint-disable-next-line no-console
      console.error('[CardActionService] action failed', err);
    }
  }

  // ── Self-contained actions ────────────────────────────────────────────────

  private openUrl(a: Action<'openUrl'>): void {
    if (!a.url) return;
    // "webview" → open in the same context; "browser" (default) → new tab.
    const target = a.openIn === 'webview' ? '_self' : '_blank';
    window.open(a.url, target, 'noopener,noreferrer');
  }

  private copyToClipboard(a: Action<'copyToClipboard'>): void {
    if (a.value == null) return;
    navigator.clipboard?.writeText(a.value).then(
      () => this.toast.showInfo('Copied to clipboard'),
      () => this.toast.showError('Could not copy')
    );
  }

  private downloadFile(a: Action<'downloadFile'>): void {
    if (!a.url) return;
    const anchor = document.createElement('a');
    anchor.href = a.url;
    if (a.filename) anchor.download = a.filename;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  private async apiCall(a: Action<'apiCall'>): Promise<void> {
    if (!a.url) return;
    const method = (a.method ?? 'GET').toUpperCase();
    const hasBody = method !== 'GET' && method !== 'HEAD' && a.body != null;
    await fetch(a.url, {
      method,
      headers: {
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...(a.headers ?? {}),
      },
      body: hasBody ? JSON.stringify(a.body) : undefined,
    });
  }

  private async sendMessage(a: Action<'sendMessage'>): Promise<void> {
    if (!a.text) return;

    let receiverId = a.receiverUid || a.receiverGuid || '';
    let receiverType: string = a.receiverUid
      ? CometChat.RECEIVER_TYPE.USER
      : a.receiverGuid
        ? CometChat.RECEIVER_TYPE.GROUP
        : '';

    // Fall back to the current conversation when no receiver is specified.
    if (!receiverId) {
      const activeUser = this.chatState.getActiveUser();
      const activeGroup = this.chatState.getActiveGroup();
      if (activeUser) {
        receiverId = activeUser.getUid();
        receiverType = CometChat.RECEIVER_TYPE.USER;
      } else if (activeGroup) {
        receiverId = activeGroup.getGuid();
        receiverType = CometChat.RECEIVER_TYPE.GROUP;
      }
    }
    if (!receiverId || !receiverType) {
      this.toast.showError('No conversation to send to');
      return;
    }

    await CometChat.sendMessage(new CometChat.TextMessage(receiverId, a.text, receiverType));
  }

  // ── Routing actions ───────────────────────────────────────────────────────

  private async chatWithUser(a: Action<'chatWithUser'>): Promise<void> {
    if (!a.uid) return;
    const user = await CometChat.getUser(a.uid);
    this.appState.setSelectedUser(user);
    this.navigation.navigateToMessages();
  }

  private async chatWithGroup(a: Action<'chatWithGroup'>): Promise<void> {
    if (!a.guid) return;
    const group = await CometChat.getGroup(a.guid);
    this.appState.setSelectedGroup(group);
    this.navigation.navigateToMessages();
  }

  private async initiateCall(a: Action<'initiateCall'>): Promise<void> {
    const receiverId = a.uid || a.guid || '';
    if (!receiverId) return;
    const receiverType = a.uid ? CometChat.RECEIVER_TYPE.USER : CometChat.RECEIVER_TYPE.GROUP;
    const call = new CometChat.Call(receiverId, a.callType, receiverType);
    // Initiate via the Calls flow; the app's existing call-event handling surfaces
    // the ongoing-call UI. (Reference impl — wire to the app's call screen as needed.)
    await CometChat.initiateCall(call);
    this.toast.showInfo('Call initiated');
  }

  // ── App-defined action ────────────────────────────────────────────────────

  private customCallback(a: Action<'customCallback'>, event: ICardActionEvent): void {
    if (!a.callbackId) return;
    const handler = this.customCallbacks.get(a.callbackId);
    if (!handler) {
      this.toast.showInfo(`No handler for "${a.callbackId}"`);
      return;
    }
    handler(a.payload, {
      elementId: event.elementId,
      cardJson: event.cardJson,
      messageId: event.message?.getId?.(),
    });
    // No server message is sent by the kit/app for customCallback.
  }
}
