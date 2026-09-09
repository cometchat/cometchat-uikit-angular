/**
 * Pin and save have to keep working after login without a page reload.
 *
 * The realtime listener used to be registered once, from the constructor. This
 * service is provided in root, so it can be constructed before the SDK is
 * initialised — and a registration that threw there was never retried. Pin and
 * save then went silent for the whole session: the person who acted saw their
 * own optimistic flip, everyone else saw nothing until they refreshed.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';

const loggedInUser$ = new BehaviorSubject<unknown>(null);
vi.mock('../cometchat-uikit', () => ({
  CometChatUIKit: {
    get loggedInUser$() {
      return loggedInUser$.asObservable();
    },
  },
}));
vi.mock('../components/base-elements/cometchat-toast/cometchat-toast.service', () => ({
  CometChatToastService: class {},
}));
vi.mock('@angular/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@angular/core')>();
  return { ...actual, inject: () => null };
});

const { PinSaveService } = await import('./pin-save.service');

let addSpy: ReturnType<typeof vi.fn>;
let removeSpy: ReturnType<typeof vi.fn>;
let service: InstanceType<typeof PinSaveService> | null = null;

interface ConvHandlers {
  onConversationPinned?: (c: unknown) => void;
  onConversationUnpinned?: (c: unknown) => void;
}
let addConvSpy: ReturnType<typeof vi.fn>;
let removeConvSpy: ReturnType<typeof vi.fn>;
/** The handler bundle the service handed the SDK, so tests can fire it. */
let convHandlers: ConvHandlers | null = null;

/** Register-time failures, then successes — the SDK-not-ready sequence. */
function stubSdk(failFirstAttach: boolean) {
  let calls = 0;
  addSpy = vi.fn(() => {
    calls += 1;
    if (failFirstAttach && calls === 1) throw new Error('SDK not initialised');
  });
  removeSpy = vi.fn();
  (CometChat as unknown as Record<string, unknown>)['addMessageListener'] = addSpy;
  (CometChat as unknown as Record<string, unknown>)['removeMessageListener'] = removeSpy;
  (CometChat as unknown as Record<string, unknown>)['MessageListener'] = class {
    constructor(public handlers: unknown) {}
  };

  convHandlers = null;
  addConvSpy = vi.fn();
  removeConvSpy = vi.fn();
  (CometChat as unknown as Record<string, unknown>)['addConversationListener'] = addConvSpy;
  (CometChat as unknown as Record<string, unknown>)['removeConversationListener'] = removeConvSpy;
  (CometChat as unknown as Record<string, unknown>)['ConversationListener'] = class {
    constructor(handlers: ConvHandlers) {
      convHandlers = handlers;
    }
  };
}

describe('PinSaveService — realtime listener', () => {
  beforeEach(() => {
    loggedInUser$.next(null);
  });

  afterEach(() => {
    service?.ngOnDestroy();
    service = null;
    vi.restoreAllMocks();
  });

  it('registers a listener when constructed', () => {
    stubSdk(false);
    service = new PinSaveService();
    expect(addSpy).toHaveBeenCalled();
  });

  it('retries after login when the first attempt threw', () => {
    // The SDK was not ready when the service was built, so nothing registered.
    stubSdk(true);
    service = new PinSaveService();
    const before = addSpy.mock.calls.length;

    loggedInUser$.next({ uid: 'u1' });
    expect(addSpy.mock.calls.length).toBeGreaterThan(before);
    // The retry took, so a later session change unregisters it first.
    removeSpy.mockClear();
    loggedInUser$.next({ uid: 'u2' });
    expect(removeSpy).toHaveBeenCalled();
  });

  it('replaces the previous registration on login rather than stacking', () => {
    stubSdk(false);
    service = new PinSaveService();
    addSpy.mockClear();
    removeSpy.mockClear();

    loggedInUser$.next({ uid: 'u1' });
    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(addSpy).toHaveBeenCalledTimes(1);
  });

  it('keeps retrying across a logout and a second login', () => {
    stubSdk(false);
    service = new PinSaveService();
    addSpy.mockClear();

    loggedInUser$.next({ uid: 'u1' });
    loggedInUser$.next(null);
    loggedInUser$.next({ uid: 'u2' });
    expect(addSpy).toHaveBeenCalledTimes(3);
  });

  // ── Conversation pin ──────────────────────────────────────────────────────

  it('registers a conversation listener alongside the message one', () => {
    stubSdk(false);
    service = new PinSaveService();
    expect(addConvSpy).toHaveBeenCalled();
  });

  it('puts an SDK conversation-pin frame on the kit bus', async () => {
    const { CometChatPinSaveEvents } = await import('../events/CometChatPinSaveEvents');
    stubSdk(false);
    service = new PinSaveService();

    const seen: unknown[] = [];
    const sub = CometChatPinSaveEvents.ccConversationPinned.subscribe(e => seen.push(e));
    const conversation = { getConversationId: () => 'c1' };
    convHandlers?.onConversationPinned?.(conversation);
    sub.unsubscribe();

    expect(seen).toEqual([{ conversation }]);
  });

  it('puts an SDK conversation-unpin frame on the kit bus', async () => {
    const { CometChatPinSaveEvents } = await import('../events/CometChatPinSaveEvents');
    stubSdk(false);
    service = new PinSaveService();

    const seen: unknown[] = [];
    const sub = CometChatPinSaveEvents.ccConversationUnpinned.subscribe(e => seen.push(e));
    const conversation = { getConversationId: () => 'c1' };
    convHandlers?.onConversationUnpinned?.(conversation);
    sub.unsubscribe();

    expect(seen).toEqual([{ conversation }]);
  });

  it('still registers message events on a build without the conversation listener', () => {
    // The two registrations are separate try blocks precisely so one missing API
    // cannot take the other down.
    stubSdk(false);
    (CometChat as unknown as Record<string, unknown>)['addConversationListener'] = () => {
      throw new Error('unsupported');
    };
    expect(() => {
      service = new PinSaveService();
    }).not.toThrow();
    expect(addSpy).toHaveBeenCalled();
  });

  it('unregisters both listeners on destroy', () => {
    stubSdk(false);
    service = new PinSaveService();
    service.ngOnDestroy();
    service = null;
    expect(removeSpy).toHaveBeenCalled();
    expect(removeConvSpy).toHaveBeenCalled();
  });

  it('survives an SDK with no listener support at all', () => {
    (CometChat as unknown as Record<string, unknown>)['addMessageListener'] = () => {
      throw new Error('unsupported');
    };
    (CometChat as unknown as Record<string, unknown>)['removeMessageListener'] = vi.fn();
    expect(() => {
      service = new PinSaveService();
      loggedInUser$.next({ uid: 'u1' });
    }).not.toThrow();
  });
});
