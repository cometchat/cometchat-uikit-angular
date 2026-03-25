import { DestroyRef, TemplateRef } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { MouseEventSource, PanelAlignment } from '../Enums/Enums';
import { ComposerId } from '../Enums/Enums';
import { subscribeWithOptionalCleanup } from './event-utils';

/**
 * UI event subjects for handling various UI-related actions (e.g., showing panels, modals, dialogs, etc.)
 */
export class CometChatUIEvents {
  static ccHidePanel: Subject<PanelAlignment | void> = new Subject<PanelAlignment | void>();
  static ccShowPanel: Subject<IPanel> = new Subject<IPanel>();
  static ccShowModal: Subject<IModal> = new Subject<IModal>();
  static ccHideModal: Subject<void> = new Subject<void>();
  static ccShowDialog: Subject<IDialog> = new Subject<IDialog>();
  static ccHideDialog: Subject<void> = new Subject<void>();
  static ccActiveChatChanged: Subject<IActiveChatChanged> = new Subject<IActiveChatChanged>();
  static ccShowOngoingCall: Subject<IShowOngoingCall> = new Subject<IShowOngoingCall>();
  static ccOpenChat: Subject<IOpenChat> = new Subject<IOpenChat>();
  static ccComposeMessage: Subject<string> = new Subject<string>();
  static ccMouseEvent: Subject<IMouseEvent> = new Subject<IMouseEvent>();
  static ccShowMentionsCountWarning: Subject<IMentionsCountWarning> =
    new Subject<IMentionsCountWarning>();
  static ccActivePopover: Subject<string> = new Subject<string>();

  // ── Typed Publish Methods ──

  static publishShowPanel(panel: IPanel): void {
    CometChatUIEvents.ccShowPanel.next(panel);
  }

  static publishHidePanel(alignment?: PanelAlignment): void {
    CometChatUIEvents.ccHidePanel.next(alignment);
  }

  static publishShowModal(modal: IModal): void {
    CometChatUIEvents.ccShowModal.next(modal);
  }

  static publishHideModal(): void {
    CometChatUIEvents.ccHideModal.next();
  }

  static publishShowDialog(dialog: IDialog): void {
    CometChatUIEvents.ccShowDialog.next(dialog);
  }

  static publishHideDialog(): void {
    CometChatUIEvents.ccHideDialog.next();
  }

  static publishActiveChatChanged(data: IActiveChatChanged): void {
    CometChatUIEvents.ccActiveChatChanged.next(data);
  }

  static publishShowOngoingCall(data: IShowOngoingCall): void {
    CometChatUIEvents.ccShowOngoingCall.next(data);
  }

  static publishOpenChat(data: IOpenChat): void {
    CometChatUIEvents.ccOpenChat.next(data);
  }

  static publishComposeMessage(text: string): void {
    CometChatUIEvents.ccComposeMessage.next(text);
  }

  static publishMouseEvent(data: IMouseEvent): void {
    CometChatUIEvents.ccMouseEvent.next(data);
  }

  static publishShowMentionsCountWarning(data: IMentionsCountWarning): void {
    CometChatUIEvents.ccShowMentionsCountWarning.next(data);
  }

  static publishActivePopover(id: string): void {
    CometChatUIEvents.ccActivePopover.next(id);
  }

  // ── Typed Subscribe Helpers ──

  static onShowPanel(cb: (panel: IPanel) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatUIEvents.ccShowPanel, cb, destroyRef);
  }

  static onHidePanel(
    cb: (alignment: PanelAlignment | void) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(CometChatUIEvents.ccHidePanel, cb, destroyRef);
  }

  static onShowModal(cb: (modal: IModal) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatUIEvents.ccShowModal, cb, destroyRef);
  }

  static onHideModal(cb: () => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatUIEvents.ccHideModal, cb, destroyRef);
  }

  static onShowDialog(cb: (dialog: IDialog) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatUIEvents.ccShowDialog, cb, destroyRef);
  }

  static onHideDialog(cb: () => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatUIEvents.ccHideDialog, cb, destroyRef);
  }

  static onActiveChatChanged(
    cb: (data: IActiveChatChanged) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(CometChatUIEvents.ccActiveChatChanged, cb, destroyRef);
  }

  static onShowOngoingCall(
    cb: (data: IShowOngoingCall) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(CometChatUIEvents.ccShowOngoingCall, cb, destroyRef);
  }

  static onOpenChat(cb: (data: IOpenChat) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatUIEvents.ccOpenChat, cb, destroyRef);
  }

  static onComposeMessage(cb: (text: string) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatUIEvents.ccComposeMessage, cb, destroyRef);
  }

  static onMouseEvent(cb: (data: IMouseEvent) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatUIEvents.ccMouseEvent, cb, destroyRef);
  }

  static onShowMentionsCountWarning(
    cb: (data: IMentionsCountWarning) => void,
    destroyRef?: DestroyRef
  ): Subscription {
    return subscribeWithOptionalCleanup(
      CometChatUIEvents.ccShowMentionsCountWarning,
      cb,
      destroyRef
    );
  }

  static onActivePopover(cb: (id: string) => void, destroyRef?: DestroyRef): Subscription {
    return subscribeWithOptionalCleanup(CometChatUIEvents.ccActivePopover, cb, destroyRef);
  }
}

/**
 * Interface for ui-related events
 */
export interface IOpenChat {
  user?: CometChat.User;
  group?: CometChat.Group;
}
export interface IShowOngoingCall {
  child: TemplateRef<unknown> | CometChat.Call | CometChat.Group | null;
  message?: CometChat.CustomMessage;
}
export interface IPanel {
  child?: TemplateRef<unknown>;
  configuration?: Record<string, unknown>;
  message?: CometChat.BaseMessage;
  position?: PanelAlignment;
  composerId?: ComposerId;
}
export interface IModal {
  child?: TemplateRef<unknown>;
  composerId?: ComposerId;
}
export interface IActiveChatChanged {
  user?: CometChat.User;
  group?: CometChat.Group;
  message?: CometChat.BaseMessage;
  unreadMessageCount?: number;
}
export interface IDialog {
  child: TemplateRef<unknown>;
  confirmCallback: () => void;
}

export interface IMouseEvent {
  event: Event;

  source: MouseEventSource;
  body?: Record<string, unknown>;
}

export interface IMentionsCountWarning {
  showWarning: boolean;
  id?: string;
}
