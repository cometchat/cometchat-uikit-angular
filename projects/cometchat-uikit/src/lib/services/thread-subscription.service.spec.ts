/**
 * ThreadSubscriptionService Tests
 *
 * Covers the behaviour both follow/unfollow surfaces depend on: state read off
 * the message object, the optimistic publish, the throttle that swallows rapid
 * taps, the one-in-flight-per-thread guard, revert-on-error, the 403/404
 * mapping, the Case 3/4 mirrors, and dropping a response that arrives after the
 * session ended.
 *
 * @module services/thread-subscription
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatThreadEvents, IThreadSubscriptionChanged } from '../events/CometChatThreadEvents';

// The service reads the session from CometChatUIKit and shows failures through
// the toast service; both are stubbed so the tests stay pure TypeScript.
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
  info: (text: string) => toastCalls.push({ level: 'info', text }),
  error: (text: string) => toastCalls.push({ level: 'error', text }),
};
vi.mock('../components/base-elements/cometchat-toast/cometchat-toast.service', () => ({
  CometChatToastService: class {},
}));

// The service resolves the toast host through inject(); these tests construct
// it directly, outside any injection context, so inject() is stubbed to hand
// back the spy instead of throwing.
vi.mock('@angular/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@angular/core')>();
  return { ...actual, inject: () => toastStub };
});

const { ThreadSubscriptionService } = await import('./thread-subscription.service');

const PARENT_ID = 4242;
const ME = 'logged-in-user';

/**
 * The message object the kit holds — the source of truth. Only the accessors
 * the service touches; `setThreadSubscribed` writes locally, exactly like the
 * SDK's.
 */
function makeMessage(options: {
  id?: number;
  parentMessageId?: number;
  subscribed?: boolean;
  senderUid?: string;
  mentions?: string[];
} = {}): CometChat.BaseMessage {
  let subscribed = options.subscribed ?? false;
  return {
    getId: () => options.id ?? PARENT_ID,
    getParentMessageId: () => options.parentMessageId ?? 0,
    getSender: () => ({ getUid: () => options.senderUid ?? ME }),
    getMentionedUsers: () => (options.mentions ?? []).map(uid => ({ getUid: () => uid })),
    isThreadSubscribed: () => subscribed,
    setThreadSubscribed: (value: boolean) => {
      subscribed = value;
    },
  } as unknown as CometChat.BaseMessage;
}

let subscribeSpy: ReturnType<typeof vi.fn>;
let unsubscribeSpy: ReturnType<typeof vi.fn>;
let service: InstanceType<typeof ThreadSubscriptionService>;
let events: IThreadSubscriptionChanged[];
let eventSub: { unsubscribe(): void };

function stubSdk(): void {
  subscribeSpy = vi.fn(() => Promise.resolve('ok'));
  unsubscribeSpy = vi.fn(() => Promise.resolve('ok'));
  (CometChat as any).subscribeToThread = subscribeSpy;
  (CometChat as any).unsubscribeFromThread = unsubscribeSpy;
}

/**
 * Stand in for the surfaces: they subscribe to the bus and write the flag back
 * onto the message objects they hold, which is what makes the next read current.
 */
function attachSurface(...messages: CometChat.BaseMessage[]): { unsubscribe(): void } {
  return CometChatThreadEvents.ccThreadSubscriptionChanged.subscribe(({ parentMessageId, subscribed }) => {
    for (const message of messages) {
      const threadId = message.getParentMessageId() || message.getId();
      if (threadId === parentMessageId) message.setThreadSubscribed(subscribed);
    }
  });
}

/** Let the throttle window elapse and any resulting promise settle. */
async function settle(): Promise<void> {
  await vi.advanceTimersByTimeAsync(500);
  await Promise.resolve();
}

beforeEach(() => {
  vi.useFakeTimers();
  toastCalls.length = 0;
  stubSdk();
  service = new ThreadSubscriptionService();
  events = [];
  eventSub = CometChatThreadEvents.ccThreadSubscriptionChanged.subscribe(e => events.push(e));
});

afterEach(() => {
  eventSub.unsubscribe();
  service.ngOnDestroy();
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Reading state
// ---------------------------------------------------------------------------

describe('ThreadSubscriptionService — state', () => {
  it('reads the flag off the message rather than any cache', () => {
    expect(service.isFollowing(makeMessage({ subscribed: true }))).toBe(true);
    expect(service.isFollowing(makeMessage({ subscribed: false }))).toBe(false);
  });

  it('reports not-following for a missing message, and never throws', () => {
    expect(service.isFollowing(null)).toBe(false);
    expect(service.isFollowing(undefined)).toBe(false);
  });

  it('survives a partial message with no subscription accessor', () => {
    const partial = { getId: () => PARENT_ID } as unknown as CometChat.BaseMessage;
    expect(service.isFollowing(partial)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Optimism, throttle, in-flight
// ---------------------------------------------------------------------------

describe('ThreadSubscriptionService — toggle', () => {
  it('flips the UI synchronously, before the request can resolve', () => {
    const message = makeMessage();
    const surface = attachSurface(message);
    const publishedBeforeRequest: boolean[] = [];
    subscribeSpy.mockImplementation(() => {
      publishedBeforeRequest.push(message.isThreadSubscribed());
      return Promise.resolve('ok');
    });

    const subscribed = service.toggle(message);

    expect(subscribed).toBe(true);
    expect(service.isFollowing(message)).toBe(true);
    expect(events).toEqual([{ parentMessageId: PARENT_ID, subscribed: true }]);
    // The optimistic publish lands first: by the time the write leaves, the held
    // message already reads followed, so nothing renders the pre-tap state.
    expect(publishedBeforeRequest).toEqual([true]);
    surface.unsubscribe();
  });

  it('sends the request on the tap itself, not after a delay', async () => {
    const message = makeMessage();
    const surface = attachSurface(message);

    service.toggle(message);

    // Leading edge: the write is already on the wire before any timer elapses.
    expect(subscribeSpy).toHaveBeenCalledTimes(1);
    expect(subscribeSpy).toHaveBeenCalledWith(PARENT_ID);
    await settle();
    expect(service.isFollowing(message)).toBe(true);
    surface.unsubscribe();
  });

  it('resolves a reply to its parent thread rather than subscribing to the reply', async () => {
    const reply = makeMessage({ id: 99, parentMessageId: PARENT_ID });
    const surface = attachSurface(reply);

    service.toggle(reply);
    await settle();

    expect(subscribeSpy).toHaveBeenCalledWith(PARENT_ID);
    surface.unsubscribe();
  });

  it('swallows rapid taps whole — the first intent is the one that ships', async () => {
    const message = makeMessage();
    const surface = attachSurface(message);

    expect(service.toggle(message)).toBe(true); // accepted → follow
    expect(service.toggle(message)).toBe(true); // swallowed: control stays put
    expect(service.toggle(message)).toBe(true); // swallowed
    await settle();

    expect(subscribeSpy).toHaveBeenCalledTimes(1);
    expect(unsubscribeSpy).not.toHaveBeenCalled();
    // A swallowed tap publishes nothing, so the message is never flipped back.
    expect(service.isFollowing(message)).toBe(true);
    expect(events).toEqual([{ parentMessageId: PARENT_ID, subscribed: true }]);
    surface.unsubscribe();
  });

  it('accepts the next toggle once the window has passed', async () => {
    const message = makeMessage({ subscribed: false });
    const surface = attachSurface(message);

    service.toggle(message);
    await settle();
    expect(subscribeSpy).toHaveBeenCalledTimes(1);

    service.toggle(message);
    await settle();

    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    expect(service.isFollowing(message)).toBe(false);
    surface.unsubscribe();
  });

  it('trusts a re-fetched flag, holding no baseline of its own', async () => {
    const message = makeMessage({ subscribed: false });
    const surface = attachSurface(message);

    service.toggle(message);
    await settle();
    expect(subscribeSpy).toHaveBeenCalledTimes(1);

    // The user unfollows on another device and the thread is re-fetched: the
    // fresh object says un-followed, and the desired flip is read off it, so
    // subscribing again is what ships.
    const refetched = makeMessage({ subscribed: false });
    surface.unsubscribe();
    const refetchedSurface = attachSurface(refetched);

    service.toggle(refetched);
    await settle();

    expect(subscribeSpy).toHaveBeenCalledTimes(2);
    refetchedSurface.unsubscribe();
  });

  it('keeps one request per thread on the wire, dropping a tap that lands mid-flight', async () => {
    const message = makeMessage();
    const surface = attachSurface(message);
    let release!: () => void;
    subscribeSpy.mockImplementation(() => new Promise<string>(resolve => {
      release = () => resolve('ok');
    }));

    service.toggle(message);
    await vi.advanceTimersByTimeAsync(500);
    expect(subscribeSpy).toHaveBeenCalledTimes(1);

    // A tap while the follow is in flight is swallowed by the in-flight guard —
    // nothing is queued behind it, matching React.
    expect(service.toggle(message)).toBe(true);
    release();
    await settle();
    expect(unsubscribeSpy).not.toHaveBeenCalled();

    // Once it has settled, a fresh tap is accepted normally.
    service.toggle(message);
    await settle();
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    surface.unsubscribe();
  });

  it('confirms subscribing in plain language', async () => {
    const message = makeMessage({ subscribed: false });
    const surface = attachSurface(message);

    service.toggle(message);
    await settle();

    expect(subscribeSpy).toHaveBeenCalledTimes(1);
    expect(toastCalls).toEqual([
      { level: 'info', text: "Subscribed. You'll be notified about new replies in this thread." },
    ]);
    surface.unsubscribe();
  });

  it('confirms unsubscribing too, not just subscribing', async () => {
    const message = makeMessage({ subscribed: true });
    const surface = attachSurface(message);

    service.toggle(message);
    await settle();

    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    expect(toastCalls).toEqual([
      { level: 'info', text: 'Unsubscribed. Notifications are off until you reply or are mentioned.' },
    ]);
    surface.unsubscribe();
  });

  it('does nothing on an SDK build without the write API', () => {
    delete (CometChat as any).subscribeToThread;
    const message = makeMessage();

    expect(service.isSupported()).toBe(false);
    expect(service.toggle(message)).toBe(false);
    expect(events).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Failure handling
// ---------------------------------------------------------------------------

describe('ThreadSubscriptionService — failures', () => {
  it('reverts the optimistic flip and surfaces a retryable failure', async () => {
    subscribeSpy.mockRejectedValue({ code: 'ERR_INTERNAL_SERVER_ERROR' });
    const message = makeMessage();
    const surface = attachSurface(message);

    service.toggle(message);
    expect(service.isFollowing(message)).toBe(true);
    await settle();

    expect(service.isFollowing(message)).toBe(false);
    expect(service.isUnavailable(PARENT_ID)).toBe(false);
    expect(toastCalls).toEqual([{ level: 'error', text: "Couldn't update. Please try again." }]);
    expect(events.at(-1)).toEqual({ parentMessageId: PARENT_ID, subscribed: false });
    surface.unsubscribe();
  });

  it('lets a deliberate retry through after a failure', async () => {
    subscribeSpy.mockRejectedValueOnce({ code: 'ERR_INTERNAL_SERVER_ERROR' });
    const message = makeMessage();
    const surface = attachSurface(message);

    service.toggle(message);
    await settle();
    expect(service.isFollowing(message)).toBe(false);

    service.toggle(message);
    await settle();

    expect(subscribeSpy).toHaveBeenCalledTimes(2);
    expect(service.isFollowing(message)).toBe(true);
    surface.unsubscribe();
  });

  it('stops offering the control once the thread is off-limits', async () => {
    subscribeSpy.mockRejectedValue({ code: 'ERR_MESSAGE_NO_ACCESS' });
    const message = makeMessage();
    const surface = attachSurface(message);

    service.toggle(message);
    await settle();

    expect(service.isUnavailable(PARENT_ID)).toBe(true);
    expect(toastCalls).toEqual([
      { level: 'error', text: 'You no longer have access to this thread.' },
    ]);
    // A further tap is inert rather than another doomed request.
    subscribeSpy.mockClear();
    service.toggle(message);
    await settle();
    expect(subscribeSpy).not.toHaveBeenCalled();
    surface.unsubscribe();
  });

  it('treats a deleted parent message the same way', async () => {
    subscribeSpy.mockRejectedValue({ code: 'ERR_MESSAGE_ID_NOT_FOUND' });
    const message = makeMessage();

    service.toggle(message);
    await settle();

    expect(service.isUnavailable(PARENT_ID)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Cases 3 & 4 — local mirrors of server-side truths
// ---------------------------------------------------------------------------

describe('ThreadSubscriptionService — mirrors', () => {
  it('publishes the flip without writing to the server', () => {
    service.mirrorSubscribed(PARENT_ID);

    expect(events).toEqual([{ parentMessageId: PARENT_ID, subscribed: true }]);
    expect(subscribeSpy).not.toHaveBeenCalled();
  });

  it('ignores a non-thread id', () => {
    service.mirrorSubscribed(0);
    expect(events).toEqual([]);
  });

  it('still publishes when the captured session is the current one', () => {
    const captured = service.captureSession();
    service.mirrorSubscribed(PARENT_ID, captured);
    expect(events).toEqual([{ parentMessageId: PARENT_ID, subscribed: true }]);
  });

  it('drops a mirror whose session ended before it landed', () => {
    // What a threaded send does: capture, await the network, then mirror. A
    // logout in that window must not mark the next user's view as followed.
    const captured = service.captureSession();
    loggedInUser$.next(null);

    service.mirrorSubscribed(PARENT_ID, captured);

    expect(events).toEqual([]);
  });

  it('keeps mirroring for callers that publish synchronously', () => {
    // No token means no await happened, so there is no window to guard.
    loggedInUser$.next({ uid: 'someone-new' });
    service.mirrorSubscribed(PARENT_ID);
    expect(events).toEqual([{ parentMessageId: PARENT_ID, subscribed: true }]);
  });

  it('subscribes me when an incoming reply mentions me — Case 3', () => {
    const parentMessage = makeMessage({ subscribed: false });
    const reply = makeMessage({
      id: 5,
      parentMessageId: PARENT_ID,
      senderUid: 'someone-else',
      mentions: [ME],
    });

    service.applyIncomingReply({ reply, parentMessage, loggedInUserUid: ME });

    // The reply arrived over the socket reading `false`; both it and the held
    // parent are corrected, and every mounted surface hears about it.
    expect(reply.isThreadSubscribed()).toBe(true);
    expect(parentMessage.isThreadSubscribed()).toBe(true);
    expect(events).toEqual([{ parentMessageId: PARENT_ID, subscribed: true }]);
    expect(subscribeSpy).not.toHaveBeenCalled();
  });

  it('inherits the parent state onto any other reply', () => {
    const parentMessage = makeMessage({ subscribed: true });
    const reply = makeMessage({ id: 5, parentMessageId: PARENT_ID, senderUid: 'someone-else' });

    service.applyIncomingReply({ reply, parentMessage, loggedInUserUid: ME });

    // A realtime frame's own `false` is not authoritative — the parent is.
    expect(reply.isThreadSubscribed()).toBe(true);
    expect(events).toEqual([]);
  });

  it('does not treat my own mention of myself as an auto-subscribe', () => {
    const parentMessage = makeMessage({ subscribed: false });
    const reply = makeMessage({
      id: 5,
      parentMessageId: PARENT_ID,
      senderUid: ME,
      mentions: [ME],
    });

    service.applyIncomingReply({ reply, parentMessage, loggedInUserUid: ME });

    expect(events).toEqual([]);
  });

  it('still mirrors a mention when no parent is held — the main list', () => {
    const reply = makeMessage({
      id: 5,
      parentMessageId: PARENT_ID,
      senderUid: 'someone-else',
      mentions: [ME],
    });

    service.applyIncomingReply({ reply, parentMessage: null, loggedInUserUid: ME });

    expect(events).toEqual([{ parentMessageId: PARENT_ID, subscribed: true }]);
  });

  it('is a no-op on a message that is not a thread reply', () => {
    const message = makeMessage({ senderUid: 'someone-else', mentions: [ME] });

    service.applyIncomingReply({ reply: message, parentMessage: null, loggedInUserUid: ME });

    expect(events).toEqual([]);
    expect(message.isThreadSubscribed()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Session boundaries
// ---------------------------------------------------------------------------

describe('ThreadSubscriptionService — session', () => {
  it('drops a response that lands after the session ended', async () => {
    let release!: () => void;
    subscribeSpy.mockImplementation(() => new Promise<string>(resolve => {
      release = () => resolve('ok');
    }));
    const message = makeMessage();

    service.toggle(message);
    await vi.advanceTimersByTimeAsync(500);

    loggedInUser$.next(null); // logout mid-toggle

    const before = events.length;
    release();
    await settle();

    // No toast, no event: the surfaces that would hear it belong to a session
    // that has ended.
    expect(events.length).toBe(before);
    expect(toastCalls).toEqual([]);
  });

  it('clears the throttle when the session changes, so the next user is not blocked', async () => {
    const message = makeMessage();

    service.toggle(message);
    await settle();
    expect(subscribeSpy).toHaveBeenCalledTimes(1);

    // Same thread, new session, immediately: the previous user's stamp must not
    // swallow this tap.
    loggedInUser$.next({ uid: 'someone-else' });
    service.toggle(makeMessage({ subscribed: false }));

    expect(subscribeSpy).toHaveBeenCalledTimes(2);
  });
});
