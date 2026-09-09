/**
 * PinSaveService Tests
 *
 * Covers what every pin/save surface depends on: the one-in-flight guard, the
 * toasts, the error mapping (permission vs server-owned limit vs generic), the
 * local "don't ask again" preference, and the events that keep the bubbles and
 * both panels in agreement.
 *
 * @module services/pin-save
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatPinSaveEvents } from '../events/CometChatPinSaveEvents';

const loggedInUser$ = new BehaviorSubject<unknown>(null);
vi.mock('../cometchat-uikit', () => ({
  CometChatUIKit: {
    get loggedInUser$() {
      return loggedInUser$.asObservable();
    },
  },
}));

const toastCalls: { level: string; text: string }[] = [];
const toastStub = {
  success: (text: string) => toastCalls.push({ level: 'success', text }),
  info: (text: string) => toastCalls.push({ level: 'info', text }),
  error: (text: string) => toastCalls.push({ level: 'error', text }),
};
vi.mock('../components/base-elements/cometchat-toast/cometchat-toast.service', () => ({
  CometChatToastService: class {},
}));

// The service resolves its toast host through inject(); these tests construct
// it directly, outside an injection context, so inject() hands back the spy.
vi.mock('@angular/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@angular/core')>();
  return { ...actual, inject: () => toastStub };
});

const { PinSaveService } = await import('./pin-save.service');

const MESSAGE_ID = 777;

let service: InstanceType<typeof PinSaveService>;
/**
 * Every pin/save signal in order, tagged by tier — `truth` for a confirmed write
 * or realtime frame, `claim` for this client's own optimistic flip and its
 * withdrawal. The tier is what the tests assert on, so the two channels cannot
 * be confused for one another.
 */
let events: { tier: 'truth' | 'claim'; message: CometChat.BaseMessage; applied?: boolean }[];
let subs: { unsubscribe(): void }[];
let pinSpy: ReturnType<typeof vi.fn>;
let unpinSpy: ReturnType<typeof vi.fn>;
let saveSpy: ReturnType<typeof vi.fn>;
let unsaveSpy: ReturnType<typeof vi.fn>;

/**
 * A message stub that can actually be mutated.
 *
 * Setters matter: the service flips the attributes optimistically and reverts
 * them on failure, so a getter-only stub would let both silently no-op and the
 * tests would pass without exercising anything.
 */
function makeMessage(fields: { pinnedAt?: number; savedAt?: number; pinnedBy?: string } = {}) {
  const state = { ...fields };
  return {
    getId: () => MESSAGE_ID,
    getPinnedAt: () => state.pinnedAt,
    getSavedAt: () => state.savedAt,
    getPinnedBy: () => state.pinnedBy,
    setPinnedAt: (value?: number) => { state.pinnedAt = value; },
    setSavedAt: (value?: number) => { state.savedAt = value; },
    setPinnedBy: (value?: string) => { state.pinnedBy = value; },
    isPinned: () => state.pinnedAt !== undefined,
    isSaved: () => state.savedAt !== undefined,
  } as unknown as CometChat.BaseMessage;
}

function stubSdk(): void {
  pinSpy = vi.fn(() => Promise.resolve(makeMessage({ pinnedAt: 1_700_000_000 })));
  unpinSpy = vi.fn(() => Promise.resolve(makeMessage()));
  saveSpy = vi.fn(() => Promise.resolve(makeMessage({ savedAt: 1_700_000_000 })));
  unsaveSpy = vi.fn(() => Promise.resolve(makeMessage()));
  (CometChat as any).pinMessage = pinSpy;
  (CometChat as any).unpinMessage = unpinSpy;
  (CometChat as any).saveMessage = saveSpy;
  (CometChat as any).unsaveMessage = unsaveSpy;
  (CometChat as any).isPinMessageEnabled = () => Promise.resolve(true);
  (CometChat as any).isSaveMessageEnabled = () => Promise.resolve(true);
  (CometChat as any).addMessageListener = vi.fn();
  (CometChat as any).removeMessageListener = vi.fn();
  (CometChat as any).MessageListener = class {
    constructor(public callbacks: Record<string, unknown>) {}
  };
}

beforeEach(() => {
  toastCalls.length = 0;
  globalThis.localStorage?.clear?.();
  stubSdk();
  service = new PinSaveService();
  events = [];
  subs = [
    CometChatPinSaveEvents.ccMessagePinned.subscribe(e => events.push({ tier: 'truth', ...e })),
    CometChatPinSaveEvents.ccMessageUnpinned.subscribe(e => events.push({ tier: 'truth', ...e })),
    CometChatPinSaveEvents.ccMessageSaved.subscribe(e => events.push({ tier: 'truth', ...e })),
    CometChatPinSaveEvents.ccMessageUnsaved.subscribe(e => events.push({ tier: 'truth', ...e })),
    CometChatPinSaveEvents.ccMessagePinChanged.subscribe(e =>
      events.push({ tier: 'claim', message: e.message, applied: e.pinned })
    ),
    CometChatPinSaveEvents.ccMessageSaveChanged.subscribe(e =>
      events.push({ tier: 'claim', message: e.message, applied: e.saved })
    ),
  ];
});

afterEach(() => {
  subs.forEach(s => s.unsubscribe());
  service.ngOnDestroy();
});

// ---------------------------------------------------------------------------
// State reads
// ---------------------------------------------------------------------------

describe('PinSaveService — state', () => {
  it('reads the presence of the timestamp as the boolean', () => {
    expect(service.isPinned(makeMessage({ pinnedAt: 1_700_000_000 }))).toBe(true);
    expect(service.isPinned(makeMessage())).toBe(false);
    expect(service.isSaved(makeMessage({ savedAt: 1_700_000_000 }))).toBe(true);
    expect(service.isSaved(makeMessage())).toBe(false);
  });

  it('treats a zero timestamp as not pinned, never as pinned-at-epoch', () => {
    expect(service.isPinned(makeMessage({ pinnedAt: 0 }))).toBe(false);
  });

  it('survives a null message', () => {
    expect(service.isPinned(null)).toBe(false);
    expect(service.isSaved(undefined)).toBe(false);
  });

  it('recognises an app-level pin', () => {
    const pinned = { pinnedAt: 1_700_000_000 };
    expect(service.isSystemPin(makeMessage({ ...pinned, pinnedBy: 'app_system' }))).toBe(true);
    expect(service.isSystemPin(makeMessage({ ...pinned, pinnedBy: 'cometchat-uid-1' }))).toBe(false);
  });

  it('does not call a message a system pin when it is not pinned at all', () => {
    // A leftover `pinnedBy` with no `pinnedAt` describes a pin that has been
    // lifted. Reading it as a system pin would hide Pin from the one surface
    // that should still offer it.
    expect(service.isSystemPin(makeMessage({ pinnedBy: 'app_system' }))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

describe('PinSaveService — actions', () => {
  it.each([
    ['pin', 'Message pinned'],
    ['unpin', 'Message unpinned'],
    ['save', 'Message saved'],
    ['unsave', 'Message unsaved'],
  ])('runs %s and confirms with a toast', async (action, toast) => {
    const result = await service.run(action as never, makeMessage());

    expect(result).toBeTruthy();
    expect(toastCalls).toEqual([{ level: 'success', text: toast }]);
  });

  it('publishes the full updated message so consumers swap rather than patch', async () => {
    await service.run('pin', makeMessage());

    // Two publishes by design, one per tier: the claim so the indicator responds
    // immediately, then the authoritative copy once the server answers.
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ tier: 'claim', applied: true });
    expect(events[1].tier).toBe('truth');
    expect(events[1].message.getPinnedAt()).toBe(1_700_000_000);
  });

  it('flips optimistically before the SDK answers', async () => {
    let release!: () => void;
    pinSpy.mockImplementation(
      () => new Promise(resolve => { release = () => { resolve(makeMessage({ pinnedAt: 1_700_000_000 })); }; })
    );

    const message = makeMessage();
    const pending = service.run('pin', message);

    // Already pinned on screen, with the call still open.
    expect(message.getPinnedAt()).toBeTruthy();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ tier: 'claim', applied: true });

    release();
    await pending;
  });

  it('keeps one request per message on the wire', async () => {
    let release!: () => void;
    pinSpy.mockImplementation(() => new Promise(resolve => { release = () => resolve(makeMessage({ pinnedAt: 1 })); }));

    const first = service.run('pin', makeMessage());
    const second = await service.run('pin', makeMessage()); // while the first is open

    expect(second).toBeNull();
    expect(pinSpy).toHaveBeenCalledTimes(1);
    release();
    await first;
  });

  it('does nothing on an SDK build without the pin/save API', async () => {
    delete (CometChat as any).pinMessage;

    expect(service.isSupported()).toBe(false);
    expect(await service.run('pin', makeMessage())).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/**
 * Wait for the failure toast to land.
 *
 * When a rejection names no limit the service consults the app's configured
 * cap, which is an async SDK read — and in a test with no initialised SDK that
 * promise rejects after an unpredictable number of ticks. Polling for the
 * toast is stable where a fixed tick count is not.
 */
async function waitForToast(toasts: unknown[], timeoutMs = 5_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (toasts.length === 0 && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

describe('PinSaveService — errors', () => {
  it('maps a permission refusal to permission copy', async () => {
    pinSpy.mockRejectedValue({ code: 'ERR_ACTION_NOT_ALLOWED' });

    expect(await service.run('pin', makeMessage())).toBeNull();
    expect(toastCalls).toEqual([
      { level: 'error', text: "You don't have permission to pin messages here." },
    ]);
  });

  it('reads the cap from the app settings rather than hard-coding it', async () => {
    (CometChat as unknown as Record<string, unknown>)['getPinnedMessagesLimit'] =
      vi.fn().mockResolvedValue(100);
    pinSpy.mockRejectedValue({ code: 'ERR_PIN_LIMIT' });

    await service.run('pin', makeMessage());
    await waitForToast(toastCalls);

    expect(toastCalls).toEqual([
      { level: 'error', text: 'You can only pin 100 messages. Unpin one to pin another.' },
    ]);
    delete (CometChat as unknown as Record<string, unknown>)['getPinnedMessagesLimit'];
  });

  it('uses the save-specific limit copy for a save', async () => {
    (CometChat as unknown as Record<string, unknown>)['getSavedMessagesLimit'] =
      vi.fn().mockResolvedValue(100);
    saveSpy.mockRejectedValue({ code: 'ERR_SAVE_LIMIT' });

    await service.run('save', makeMessage());
    await waitForToast(toastCalls);

    expect(toastCalls).toEqual([{ level: 'error', text: 'You can only save 100 messages. Unsave one to save another.' }]);
    delete (CometChat as unknown as Record<string, unknown>)['getSavedMessagesLimit'];
  });

  it('falls back to generic copy when the app names no limit', async () => {
    pinSpy.mockRejectedValue({ code: 'ERR_INTERNAL' });

    await service.run('pin', makeMessage());
    // A rejection that names no number sends the service to the app's
    // configured cap, which is an async read — so the toast lands a tick later.
    await waitForToast(toastCalls);

    expect(toastCalls).toEqual([
      { level: 'error', text: 'Something went wrong. Please try again.' },
    ]);
  });

  it('does not blame the cap for a failure that has nothing to do with it', () => {
    // ENG-38344: every non-permission rejection used to be answered with the
    // app's cap, so a pin that failed for any other reason told the user to
    // unpin something — advice that could not work, over the real cause.
    return (async () => {
      (CometChat as unknown as Record<string, unknown>)['getPinnedMessagesLimit'] =
        vi.fn().mockResolvedValue(10);
      pinSpy.mockRejectedValue({ code: 'ERR_NOT_FOUND', message: 'Message not found: 76019' });

      await service.run('pin', makeMessage());
      await waitForToast(toastCalls);

      expect(toastCalls).toEqual([
        { level: 'error', text: 'Something went wrong. Please try again.' },
      ]);
    })();
  });

  it('still quotes the cap when the cap really is the reason', () => {
    return (async () => {
      (CometChat as unknown as Record<string, unknown>)['getPinnedMessagesLimit'] =
        vi.fn().mockResolvedValue(10);
      pinSpy.mockRejectedValue({
        code: 'ERR_SOMETHING',
        message: 'You can only pin 10 messages. Unpin one to pin another.',
      });

      await service.run('pin', makeMessage());
      await waitForToast(toastCalls);

      expect(toastCalls).toEqual([
        { level: 'error', text: 'You can only pin 10 messages. Unpin one to pin another.' },
      ]);
    })();
  });

  it('ignores a number in the rejection prose in favour of the configured cap', async () => {
    // The prose is the backend's to reword at any time, and there is no longer
    // an SDK helper for reading a structured cap off an error — so the app's
    // own setting is the single source for the figure.
    (CometChat as unknown as Record<string, unknown>)['getPinnedMessagesLimit'] =
      vi.fn().mockResolvedValue(25);
    pinSpy.mockRejectedValue({ code: 'ERR_LIMIT', message: 'reached the allowed limit of 7.' });

    await service.run('pin', makeMessage());
    await waitForToast(toastCalls);

    expect(toastCalls).toEqual([
      { level: 'error', text: 'You can only pin 25 messages. Unpin one to pin another.' },
    ]);
    delete (CometChat as unknown as Record<string, unknown>)['getPinnedMessagesLimit'];
  });

  it('reverts the optimistic flip when the action failed', async () => {
    pinSpy.mockRejectedValue({ code: 'ERR_INTERNAL' });

    const message = makeMessage();
    await service.run('pin', message);

    // The claim is published, then withdrawn — a rejected pin must not leave a
    // pin showing. What must NOT appear is a truth event claiming success: the
    // withdrawal rides the same optimistic channel with the boolean reversed.
    expect(events).toEqual([
      { tier: 'claim', message, applied: true },
      { tier: 'claim', message, applied: false },
    ]);
    expect(message.getPinnedAt()).toBeFalsy();
  });

  it('lets a save run while a pin of the same message is still on the wire', async () => {
    // Pin and save write different fields, so they do not contend. Keying the
    // guard on the message alone used to swallow this save outright — and a
    // swallowed action leaves nothing for the user to retry from.
    const message = makeMessage();
    let releasePin: (value: unknown) => void = () => {};
    pinSpy.mockReturnValueOnce(new Promise(resolve => { releasePin = resolve; }));

    const pinning = service.run('pin', message);
    const saved = await service.run('save', message);

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saved).toBeTruthy();

    releasePin(makeMessage({ pinnedAt: 1 }));
    await pinning;
  });

  it('still blocks a second pin while the first is on the wire', async () => {
    const message = makeMessage();
    let releasePin: (value: unknown) => void = () => {};
    pinSpy.mockReturnValueOnce(new Promise(resolve => { releasePin = resolve; }));

    const pinning = service.run('pin', message);
    expect(await service.run('pin', message)).toBeNull();
    expect(pinSpy).toHaveBeenCalledTimes(1);

    releasePin(makeMessage({ pinnedAt: 1 }));
    await pinning;
  });

  it('blocks an unpin while a pin of the same message is on the wire', async () => {
    // Same family, opposite directions: these DO contend.
    const message = makeMessage();
    let releasePin: (value: unknown) => void = () => {};
    pinSpy.mockReturnValueOnce(new Promise(resolve => { releasePin = resolve; }));

    const pinning = service.run('pin', message);
    expect(await service.run('unpin', message)).toBeNull();
    expect(unpinSpy).not.toHaveBeenCalled();

    releasePin(makeMessage({ pinnedAt: 1 }));
    await pinning;
  });

  it('frees the in-flight slot after a failure', async () => {
    pinSpy.mockRejectedValueOnce({ code: 'ERR_INTERNAL' });
    await service.run('pin', makeMessage());

    // A retry must be possible; the guard is per-request, not a permanent lock.
    pinSpy.mockResolvedValue(makeMessage({ pinnedAt: 1 }));
    expect(await service.run('pin', makeMessage())).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Feature flags
// ---------------------------------------------------------------------------

describe('PinSaveService — feature flags', () => {
  it('reports the app flags', async () => {
    expect(await service.isPinEnabled()).toBe(true);
    expect(await service.isSaveEnabled()).toBe(true);
  });

  it('reports false rather than throwing when the flag read fails', async () => {
    (CometChat as any).isPinMessageEnabled = () => Promise.reject(new Error('offline'));
    const fresh = new PinSaveService();

    expect(await fresh.isPinEnabled()).toBe(false);
    fresh.ngOnDestroy();
  });
});
