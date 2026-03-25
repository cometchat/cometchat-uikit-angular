/**
 * CometChatUIEvents Tests
 *
 * Categories: Subscribe/Emit, Unsubscribe, Multiple Subscribers,
 *             No-Subscriber Emission, Event Type Isolation, Null Payloads
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 14.4, 14.5, 15.7
 *
 * Tests the static Subject-based event bus for UI events:
 * - subscribe/emit delivery for all UI event subjects
 * - unsubscribe prevents delivery
 * - multiple subscribers each receive the emitted value
 * - no error on emit with no subscribers
 * - event type isolation (subscribing to one does not receive from another)
 * - null/undefined payload handling
 */
import { DestroyRef } from '@angular/core';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { Subscription } from 'rxjs';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import {
  CometChatUIEvents,
  IPanel,
  IActiveChatChanged,
  IModal,
  IDialog,
  IShowOngoingCall,
  IOpenChat,
  IMouseEvent,
  IMentionsCountWarning,
} from './CometChatUIEvents';
import { PanelAlignment, MouseEventSource } from '../Enums/Enums';

function createMockDestroyRef(): DestroyRef & { triggerDestroy: () => void } {
  const callbacks: (() => void)[] = [];
  return {
    onDestroy: (cb: () => void) => {
      callbacks.push(cb);
    },
    triggerDestroy: () => {
      callbacks.forEach(cb => cb());
    },
  } as any;
}

// ─── Mock Helpers ────────────────────────────────────────────────────

function createMockPanel(overrides: Partial<IPanel> = {}): IPanel {
  return {
    child: overrides.child ?? document.createElement('div'),
    position: overrides.position ?? PanelAlignment.messageListFooter,
    ...overrides,
  };
}

function createMockActiveChatChanged(
  overrides: Partial<IActiveChatChanged> = {}
): IActiveChatChanged {
  return {
    user: overrides.user ?? ({ getUid: () => 'user-1', getName: () => 'Test User' } as any),
    unreadMessageCount: overrides.unreadMessageCount ?? 0,
    ...overrides,
  };
}

function createMockModal(overrides: Partial<IModal> = {}): IModal {
  return {
    child: overrides.child ?? document.createElement('div'),
    ...overrides,
  };
}

function createMockDialog(overrides: Partial<IDialog> = {}): IDialog {
  return {
    child: overrides.child ?? document.createElement('div'),
    confirmCallback: overrides.confirmCallback ?? (() => {}),
    ...overrides,
  };
}

function createMockOpenChat(overrides: Partial<IOpenChat> = {}): IOpenChat {
  return {
    user: overrides.user ?? ({ getUid: () => 'user-1', getName: () => 'Test User' } as any),
    ...overrides,
  };
}

function createMockShowOngoingCall(overrides: Partial<IShowOngoingCall> = {}): IShowOngoingCall {
  return {
    child: overrides.child ?? document.createElement('div'),
    ...overrides,
  };
}

function createMockMouseEvent(overrides: Partial<IMouseEvent> = {}): IMouseEvent {
  return {
    event: overrides.event ?? new Event('click'),
    source: overrides.source ?? MouseEventSource.mentions,
    ...overrides,
  };
}

function createMockMentionsCountWarning(
  overrides: Partial<IMentionsCountWarning> = {}
): IMentionsCountWarning {
  return {
    showWarning: overrides.showWarning ?? true,
    id: overrides.id ?? 'warning-1',
    ...overrides,
  };
}

describe('CometChatUIEvents', () => {
  const subscriptions: Subscription[] = [];

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  afterEach(() => {
    subscriptions.forEach(s => s.unsubscribe());
    subscriptions.length = 0;
  });

  // ─── Subscribe / Emit ──────────────────────────────────────────────

  describe('Subscribe/Emit', () => {
    it('should deliver ccShowPanel payloads to subscriber', () => {
      const received: IPanel[] = [];
      const sub = CometChatUIEvents.ccShowPanel.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockPanel({ position: PanelAlignment.composerHeader });
      CometChatUIEvents.ccShowPanel.next(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('should deliver ccHidePanel payloads to subscriber', () => {
      const received: (PanelAlignment | void)[] = [];
      const sub = CometChatUIEvents.ccHidePanel.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatUIEvents.ccHidePanel.next(PanelAlignment.messageListHeader);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(PanelAlignment.messageListHeader);
    });

    it('should deliver ccHidePanel with void payload', () => {
      const received: (PanelAlignment | void)[] = [];
      const sub = CometChatUIEvents.ccHidePanel.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatUIEvents.ccHidePanel.next();

      expect(received).toHaveLength(1);
      expect(received[0]).toBeUndefined();
    });

    it('should deliver ccActiveChatChanged payloads to subscriber', () => {
      const received: IActiveChatChanged[] = [];
      const sub = CometChatUIEvents.ccActiveChatChanged.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockActiveChatChanged({ unreadMessageCount: 5 });
      CometChatUIEvents.ccActiveChatChanged.next(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('should deliver ccShowModal payloads to subscriber', () => {
      const received: IModal[] = [];
      const sub = CometChatUIEvents.ccShowModal.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockModal();
      CometChatUIEvents.ccShowModal.next(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('should deliver ccHideModal void emissions to subscriber', () => {
      const received: void[] = [];
      const sub = CometChatUIEvents.ccHideModal.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatUIEvents.ccHideModal.next();

      expect(received).toHaveLength(1);
    });

    it('should deliver ccShowDialog payloads to subscriber', () => {
      const received: IDialog[] = [];
      const sub = CometChatUIEvents.ccShowDialog.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockDialog();
      CometChatUIEvents.ccShowDialog.next(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('should deliver ccComposeMessage string payloads to subscriber', () => {
      const received: string[] = [];
      const sub = CometChatUIEvents.ccComposeMessage.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatUIEvents.ccComposeMessage.next('Hello world');

      expect(received).toHaveLength(1);
      expect(received[0]).toBe('Hello world');
    });

    it('should deliver ccMouseEvent payloads to subscriber', () => {
      const received: IMouseEvent[] = [];
      const sub = CometChatUIEvents.ccMouseEvent.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockMouseEvent();
      CometChatUIEvents.ccMouseEvent.next(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('should deliver ccActivePopover string payloads to subscriber', () => {
      const received: string[] = [];
      const sub = CometChatUIEvents.ccActivePopover.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatUIEvents.ccActivePopover.next('popover-1');

      expect(received).toHaveLength(1);
      expect(received[0]).toBe('popover-1');
    });

    it('should not deliver prior emissions to new subscribers (Subject behavior)', () => {
      CometChatUIEvents.ccActiveChatChanged.next(createMockActiveChatChanged());

      const received: IActiveChatChanged[] = [];
      const sub = CometChatUIEvents.ccActiveChatChanged.subscribe(v => received.push(v));
      subscriptions.push(sub);

      expect(received).toHaveLength(0);
    });

    it('should deliver multiple sequential emissions in order', () => {
      const received: string[] = [];
      const sub = CometChatUIEvents.ccComposeMessage.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatUIEvents.ccComposeMessage.next('msg-1');
      CometChatUIEvents.ccComposeMessage.next('msg-2');
      CometChatUIEvents.ccComposeMessage.next('msg-3');

      expect(received).toHaveLength(3);
      expect(received[0]).toBe('msg-1');
      expect(received[1]).toBe('msg-2');
      expect(received[2]).toBe('msg-3');
    });
  });

  // ─── Unsubscribe ───────────────────────────────────────────────────

  describe('Unsubscribe', () => {
    it('should stop receiving ccShowPanel after unsubscribe', () => {
      const received: IPanel[] = [];
      const sub = CometChatUIEvents.ccShowPanel.subscribe(v => received.push(v));

      CometChatUIEvents.ccShowPanel.next(createMockPanel());
      expect(received).toHaveLength(1);

      sub.unsubscribe();

      CometChatUIEvents.ccShowPanel.next(createMockPanel());
      expect(received).toHaveLength(1);
    });

    it('should stop receiving ccActiveChatChanged after unsubscribe', () => {
      const received: IActiveChatChanged[] = [];
      const sub = CometChatUIEvents.ccActiveChatChanged.subscribe(v => received.push(v));

      CometChatUIEvents.ccActiveChatChanged.next(createMockActiveChatChanged());
      expect(received).toHaveLength(1);

      sub.unsubscribe();

      CometChatUIEvents.ccActiveChatChanged.next(createMockActiveChatChanged());
      expect(received).toHaveLength(1);
    });

    it('should stop receiving ccComposeMessage after unsubscribe', () => {
      const received: string[] = [];
      const sub = CometChatUIEvents.ccComposeMessage.subscribe(v => received.push(v));

      CometChatUIEvents.ccComposeMessage.next('msg-1');
      expect(received).toHaveLength(1);

      sub.unsubscribe();

      CometChatUIEvents.ccComposeMessage.next('msg-2');
      expect(received).toHaveLength(1);
    });

    it('should not affect other subscribers when one unsubscribes', () => {
      const receivedA: IActiveChatChanged[] = [];
      const receivedB: IActiveChatChanged[] = [];
      const subA = CometChatUIEvents.ccActiveChatChanged.subscribe(v => receivedA.push(v));
      const subB = CometChatUIEvents.ccActiveChatChanged.subscribe(v => receivedB.push(v));
      subscriptions.push(subB);

      CometChatUIEvents.ccActiveChatChanged.next(createMockActiveChatChanged());
      expect(receivedA).toHaveLength(1);
      expect(receivedB).toHaveLength(1);

      subA.unsubscribe();

      CometChatUIEvents.ccActiveChatChanged.next(createMockActiveChatChanged());
      expect(receivedA).toHaveLength(1);
      expect(receivedB).toHaveLength(2);
    });
  });

  // ─── Multiple Subscribers ──────────────────────────────────────────

  describe('Multiple Subscribers', () => {
    it('should deliver to multiple subscribers simultaneously', () => {
      const receivedA: IPanel[] = [];
      const receivedB: IPanel[] = [];
      const receivedC: IPanel[] = [];
      const subA = CometChatUIEvents.ccShowPanel.subscribe(v => receivedA.push(v));
      const subB = CometChatUIEvents.ccShowPanel.subscribe(v => receivedB.push(v));
      const subC = CometChatUIEvents.ccShowPanel.subscribe(v => receivedC.push(v));
      subscriptions.push(subA, subB, subC);

      const payload = createMockPanel();
      CometChatUIEvents.ccShowPanel.next(payload);

      expect(receivedA).toHaveLength(1);
      expect(receivedB).toHaveLength(1);
      expect(receivedC).toHaveLength(1);
      expect(receivedA[0]).toBe(payload);
      expect(receivedB[0]).toBe(payload);
      expect(receivedC[0]).toBe(payload);
    });

    it('should deliver ccComposeMessage to multiple subscribers', () => {
      const receivedA: string[] = [];
      const receivedB: string[] = [];
      const subA = CometChatUIEvents.ccComposeMessage.subscribe(v => receivedA.push(v));
      const subB = CometChatUIEvents.ccComposeMessage.subscribe(v => receivedB.push(v));
      subscriptions.push(subA, subB);

      CometChatUIEvents.ccComposeMessage.next('shared-msg');

      expect(receivedA).toHaveLength(1);
      expect(receivedB).toHaveLength(1);
      expect(receivedA[0]).toBe('shared-msg');
      expect(receivedB[0]).toBe('shared-msg');
    });
  });

  // ─── No-Subscriber Emission ────────────────────────────────────────

  describe('No-Subscriber Emission', () => {
    it('should not throw when emitting ccShowPanel with no subscribers', () => {
      expect(() => CometChatUIEvents.ccShowPanel.next(createMockPanel())).not.toThrow();
    });

    it('should not throw when emitting ccHidePanel with no subscribers', () => {
      expect(() =>
        CometChatUIEvents.ccHidePanel.next(PanelAlignment.messageListHeader)
      ).not.toThrow();
    });

    it('should not throw when emitting ccShowModal with no subscribers', () => {
      expect(() => CometChatUIEvents.ccShowModal.next(createMockModal())).not.toThrow();
    });

    it('should not throw when emitting ccHideModal with no subscribers', () => {
      expect(() => CometChatUIEvents.ccHideModal.next()).not.toThrow();
    });

    it('should not throw when emitting ccShowDialog with no subscribers', () => {
      expect(() => CometChatUIEvents.ccShowDialog.next(createMockDialog())).not.toThrow();
    });

    it('should not throw when emitting ccHideDialog with no subscribers', () => {
      expect(() => CometChatUIEvents.ccHideDialog.next()).not.toThrow();
    });

    it('should not throw when emitting ccActiveChatChanged with no subscribers', () => {
      expect(() =>
        CometChatUIEvents.ccActiveChatChanged.next(createMockActiveChatChanged())
      ).not.toThrow();
    });

    it('should not throw when emitting ccComposeMessage with no subscribers', () => {
      expect(() => CometChatUIEvents.ccComposeMessage.next('test')).not.toThrow();
    });

    it('should not throw when emitting ccActivePopover with no subscribers', () => {
      expect(() => CometChatUIEvents.ccActivePopover.next('popover-id')).not.toThrow();
    });
  });

  // ─── Event Type Isolation ──────────────────────────────────────────

  describe('Event Type Isolation', () => {
    it('should not deliver ccShowPanel emissions to ccHidePanel subscriber', () => {
      const received: any[] = [];
      const sub = CometChatUIEvents.ccHidePanel.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatUIEvents.ccShowPanel.next(createMockPanel());

      expect(received).toHaveLength(0);
    });

    it('should not deliver ccShowModal emissions to ccShowDialog subscriber', () => {
      const received: any[] = [];
      const sub = CometChatUIEvents.ccShowDialog.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatUIEvents.ccShowModal.next(createMockModal());

      expect(received).toHaveLength(0);
    });

    it('should not deliver ccComposeMessage emissions to ccActivePopover subscriber', () => {
      const received: any[] = [];
      const sub = CometChatUIEvents.ccActivePopover.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatUIEvents.ccComposeMessage.next('hello');

      expect(received).toHaveLength(0);
    });

    it('should isolate panel, modal, dialog, and chat events from each other', () => {
      const panel: any[] = [];
      const modal: any[] = [];
      const dialog: any[] = [];
      const chat: any[] = [];

      subscriptions.push(
        CometChatUIEvents.ccShowPanel.subscribe(v => panel.push(v)),
        CometChatUIEvents.ccShowModal.subscribe(v => modal.push(v)),
        CometChatUIEvents.ccShowDialog.subscribe(v => dialog.push(v)),
        CometChatUIEvents.ccActiveChatChanged.subscribe(v => chat.push(v))
      );

      CometChatUIEvents.ccShowPanel.next(createMockPanel());

      expect(panel).toHaveLength(1);
      expect(modal).toHaveLength(0);
      expect(dialog).toHaveLength(0);
      expect(chat).toHaveLength(0);
    });
  });

  // ─── Null / Undefined Payload Handling ─────────────────────────────

  describe('Null Payload Handling', () => {
    it('should deliver null payload on ccShowPanel without error', () => {
      const received: any[] = [];
      const sub = CometChatUIEvents.ccShowPanel.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatUIEvents.ccShowPanel.next(null as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBeNull();
    });

    it('should deliver null payload on ccActiveChatChanged without error', () => {
      const received: any[] = [];
      const sub = CometChatUIEvents.ccActiveChatChanged.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatUIEvents.ccActiveChatChanged.next(null as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBeNull();
    });

    it('should deliver undefined payload on ccComposeMessage without error', () => {
      const received: any[] = [];
      const sub = CometChatUIEvents.ccComposeMessage.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatUIEvents.ccComposeMessage.next(undefined as any);

      expect(received).toHaveLength(1);
      expect(received[0]).toBeUndefined();
    });
  });

  // ─── Typed Publish Methods ─────────────────────────────────────────

  describe('Typed Publish Methods', () => {
    it('publishShowPanel should emit on ccShowPanel', () => {
      const received: IPanel[] = [];
      const sub = CometChatUIEvents.ccShowPanel.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockPanel({ position: PanelAlignment.composerHeader });
      CometChatUIEvents.publishShowPanel(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('publishActiveChatChanged should emit on ccActiveChatChanged', () => {
      const received: IActiveChatChanged[] = [];
      const sub = CometChatUIEvents.ccActiveChatChanged.subscribe(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockActiveChatChanged({ unreadMessageCount: 3 });
      CometChatUIEvents.publishActiveChatChanged(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('publishComposeMessage should emit on ccComposeMessage', () => {
      const received: string[] = [];
      const sub = CometChatUIEvents.ccComposeMessage.subscribe(v => received.push(v));
      subscriptions.push(sub);

      CometChatUIEvents.publishComposeMessage('Hello typed');

      expect(received).toHaveLength(1);
      expect(received[0]).toBe('Hello typed');
    });

    it('should not throw when typed publish is called with no subscribers', () => {
      expect(() => CometChatUIEvents.publishShowPanel(createMockPanel())).not.toThrow();
      expect(() =>
        CometChatUIEvents.publishActiveChatChanged(createMockActiveChatChanged())
      ).not.toThrow();
      expect(() => CometChatUIEvents.publishComposeMessage('test')).not.toThrow();
    });
  });

  // ─── Subscribe Helpers with DestroyRef ─────────────────────────────

  describe('Subscribe Helpers with DestroyRef', () => {
    it('onShowPanel should receive emitted values', () => {
      const received: IPanel[] = [];
      const sub = CometChatUIEvents.onShowPanel(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockPanel();
      CometChatUIEvents.ccShowPanel.next(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('onActiveChatChanged should receive emitted values', () => {
      const received: IActiveChatChanged[] = [];
      const sub = CometChatUIEvents.onActiveChatChanged(v => received.push(v));
      subscriptions.push(sub);

      const payload = createMockActiveChatChanged({ unreadMessageCount: 7 });
      CometChatUIEvents.ccActiveChatChanged.next(payload);

      expect(received).toHaveLength(1);
      expect(received[0]).toBe(payload);
    });

    it('onComposeMessage should receive emitted values', () => {
      const received: string[] = [];
      const sub = CometChatUIEvents.onComposeMessage(v => received.push(v));
      subscriptions.push(sub);

      CometChatUIEvents.ccComposeMessage.next('typed msg');

      expect(received).toHaveLength(1);
      expect(received[0]).toBe('typed msg');
    });

    it('should close subscription when DestroyRef is triggered', () => {
      const destroyRef = createMockDestroyRef();
      const received: IPanel[] = [];
      const sub = CometChatUIEvents.onShowPanel(v => received.push(v), destroyRef);

      CometChatUIEvents.ccShowPanel.next(createMockPanel());
      expect(received).toHaveLength(1);
      expect(sub.closed).toBe(false);

      destroyRef.triggerDestroy();
      expect(sub.closed).toBe(true);

      CometChatUIEvents.ccShowPanel.next(createMockPanel());
      expect(received).toHaveLength(1);
    });

    it('should keep subscription open when no DestroyRef is provided', () => {
      const received: string[] = [];
      const sub = CometChatUIEvents.onComposeMessage(v => received.push(v));
      subscriptions.push(sub);

      CometChatUIEvents.ccComposeMessage.next('msg-1');
      CometChatUIEvents.ccComposeMessage.next('msg-2');

      expect(received).toHaveLength(2);
      expect(sub.closed).toBe(false);
    });
  });
});
