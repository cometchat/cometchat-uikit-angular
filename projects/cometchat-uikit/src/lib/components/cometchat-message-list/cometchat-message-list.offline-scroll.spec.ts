/**
 * UIK-READ-03 / UIT-READ-03: offline, scrolling past the saved messages stops
 * cleanly at "Connect to load older messages"; once the connection is back,
 * tapping the footer OR scrolling loads older messages.
 *
 * Regression: the footer stayed and only a tap loaded. The scroll observers
 * report a change only, and the sentinel at the top was still in view, so a
 * scroll gesture at the top never started a read.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  installOfflineSdk,
  OfflineSdkFake,
  offlineMessage,
  textMessage,
} from '../../testing/offline-sdk-fake';
import { OfflineHub } from '../../utils/offline/offline-hub';
import { HeldReceipts } from '../../utils/offline/reconcile';
import { fetchPreviousOffline } from '../../services/message-list.offline';
import { MessageListService } from '../../services/message-list.service';
import { handleReconnectionImpl } from '../../services/message-list.conversation-utils';
import { CometChatMessageListComponent } from './cometchat-message-list.component';
import {
  attachRetryOnScroll,
  RETRY_ON_SCROLL_GAP_MS,
  RetryOnScrollHost,
  scrollDirectionOf,
} from './cometchat-message-list.offline-scroll';

// ── the read: when is the footer retryable by scrolling ──────────────────────

function msg(text: string, id: number) {
  return offlineMessage(textMessage(text), { id, sentAt: id });
}

function ctxFor(script: (listener: any) => void): any {
  const request: any = {
    fetchPrevious(listener: any) {
      script(listener);
      return Promise.reject({ code: 'FAILED_TO_FETCH' });
    },
  };
  return {
    messagesRequest: request,
    nextMessagesRequest: request,
    fetchGeneration: 0,
    parentMessageId: null,
    isAgentChatMode: false,
    hideGroupActionMessages: false,
    errorCallback: vi.fn(),
    loadingStateSignal: signal(false),
    errorStateSignal: signal<Error | null>(null),
    prevMessageIdSignal: signal(0),
    nextMessageIdSignal: signal(0),
    allMessagesSignal: signal<any[]>([]),
    messagesSignal: signal<any[]>([]),
    messageIdMap: new Map(),
    messageMuidMap: new Map(),
    offlineFooterSignal: signal<'none' | 'connect_to_load_more'>('none'),
    offlineFooterRetryableSignal: signal(false),
    heldReceipts: new HeldReceipts(),
    offlinePathUsed: false,
    currentUser: {},
    currentGroup: null,
    DEFAULT_MESSAGE_LIMIT: 30,
    normalizeMessageId: (id: string | number) => Number(id),
    markInitialMessagesAsRead: vi.fn(() => Promise.resolve()),
    buildMessagesRequest: vi.fn(() => request),
    buildNextMessagesRequest: vi.fn(() => request),
    clearMessagesAndState: vi.fn(),
    isMessageForCurrentConversation: () => true,
  };
}

describe('the footer is retryable by scrolling only once the connection is back', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    OfflineHub.getInstance().start();
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  const offlineRead = (l: any) => {
    l.onCachedMessages([msg('a', 1)]);
    l.onError({ code: 'FAILED_TO_FETCH' });
  };

  it('a read that stops offline shows the footer, and scrolling does not retry yet', async () => {
    fake.connected = false;
    const ctx = ctxFor(offlineRead);
    await fetchPreviousOffline(ctx);
    expect(ctx.offlineFooterSignal()).toBe('connect_to_load_more');
    expect(ctx.offlineFooterRetryableSignal()).toBe(false);
  });

  it('a read that gave up after the connection was already back is retryable at once', async () => {
    fake.connected = true;
    const ctx = ctxFor(offlineRead);
    await fetchPreviousOffline(ctx);
    expect(ctx.offlineFooterSignal()).toBe('connect_to_load_more');
    expect(ctx.offlineFooterRetryableSignal()).toBe(true);
  });

  it('a read that stops offline again clears it; one that succeeds clears footer and flag', async () => {
    fake.connected = true;
    const ctx = ctxFor(offlineRead);
    await fetchPreviousOffline(ctx);
    expect(ctx.offlineFooterRetryableSignal()).toBe(true);
    fake.connected = false;
    ctx.messagesRequest = {
      fetchPrevious: (l: any) => {
        offlineRead(l);
        return Promise.reject({});
      },
    };
    await fetchPreviousOffline(ctx);
    expect(ctx.offlineFooterRetryableSignal()).toBe(false);
    fake.connected = true;
    ctx.messagesRequest = {
      fetchPrevious: (l: any) => {
        l.onServerMessages([msg('older', 0)]);
        return Promise.resolve([]);
      },
    };
    await fetchPreviousOffline(ctx);
    expect(ctx.offlineFooterSignal()).toBe('none');
    expect(ctx.offlineFooterRetryableSignal()).toBe(false);
  });
});

describe('MessageListService: the connection coming back makes a shown footer retryable', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    TestBed.configureTestingModule({ providers: [MessageListService] });
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    TestBed.resetTestingModule();
  });

  it('markOfflineConnected sets the flag only while the footer shows', () => {
    const service = TestBed.inject(MessageListService) as any;
    service.markOfflineConnected();
    expect(service.offlineFooterRetryable()).toBe(false);
    service.offlineFooterSignal.set('connect_to_load_more');
    service.markOfflineConnected();
    expect(service.offlineFooterRetryable()).toBe(true);
  });

  it('a reconnect with offline on marks it and fetches nothing', async () => {
    const service = TestBed.inject(MessageListService) as any;
    service.currentUser = { getUid: () => 'sam' };
    service.messagesRequest = { fetchPrevious: vi.fn(), fetchNext: vi.fn() };
    service.nextMessagesRequest = { fetchPrevious: vi.fn(), fetchNext: vi.fn() };
    service.offlineFooterSignal.set('connect_to_load_more');
    await handleReconnectionImpl(service);
    expect(service.offlineFooterRetryable()).toBe(true);
    expect(service.messagesRequest.fetchPrevious).not.toHaveBeenCalled();
    expect(service.nextMessagesRequest.fetchNext).not.toHaveBeenCalled();
  });

  it('retrying the footer (a tap) and clearing the chat reset the flag', () => {
    const service = TestBed.inject(MessageListService) as any;
    service.offlineFooterSignal.set('connect_to_load_more');
    service.markOfflineConnected();
    service.clearMessagesAndState();
    expect(service.offlineFooter()).toBe('none');
    expect(service.offlineFooterRetryable()).toBe(false);
  });
});

// ── the gesture ──────────────────────────────────────────────────────────────

function container(metrics: {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}): HTMLElement {
  const el = document.createElement('div');
  for (const [key, value] of Object.entries(metrics))
    Object.defineProperty(el, key, { value, configurable: true, writable: true });
  return el;
}

function host(
  el: HTMLElement,
  overrides: Partial<RetryOnScrollHost> = {}
): RetryOnScrollHost & { top: ReturnType<typeof vi.fn>; bottom: ReturnType<typeof vi.fn> } {
  const top = vi.fn();
  const bottom = vi.fn();
  return {
    listContainer: { nativeElement: el },
    isFetchingPrevious: () => false,
    isFetchingNext: () => false,
    hasMoreNext: () => false,
    BOTTOM_THRESHOLD: 100,
    handleScrollToTop: top,
    handleScrollToBottom: bottom,
    top,
    bottom,
    ...overrides,
  };
}

const wheel = (deltaY: number) => new WheelEvent('wheel', { deltaY });

describe('a scroll gesture at the end the footer stands at loads (UIK-READ-03)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-04T10:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('scrolling up at the top loads older messages, once per gesture', () => {
    const el = container({ scrollTop: 0, scrollHeight: 2000, clientHeight: 500 });
    const h = host(el);
    attachRetryOnScroll(h);
    el.dispatchEvent(wheel(-40));
    el.dispatchEvent(wheel(-40));
    el.dispatchEvent(new Event('scroll'));
    expect(h.top).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(RETRY_ON_SCROLL_GAP_MS);
    el.dispatchEvent(wheel(-40));
    expect(h.top).toHaveBeenCalledTimes(2);
  });

  it('a touch drag and a scroll event at the top load too; the arrow, page and home keys scroll up', () => {
    for (const make of [
      () => new Event('touchmove'),
      () => new Event('scroll'),
      () => new KeyboardEvent('keydown', { key: 'ArrowUp' }),
      () => new KeyboardEvent('keydown', { key: 'PageUp' }),
      () => new KeyboardEvent('keydown', { key: 'Home' }),
    ]) {
      const el = container({ scrollTop: 0, scrollHeight: 2000, clientHeight: 500 });
      const h = host(el);
      attachRetryOnScroll(h);
      el.dispatchEvent(make());
      expect(h.top).toHaveBeenCalledTimes(1);
    }
  });

  it('scrolling down at the top, other keys, a read in flight and a list not at the top load nothing', () => {
    const el = container({ scrollTop: 0, scrollHeight: 2000, clientHeight: 500 });
    const h = host(el);
    attachRetryOnScroll(h);
    el.dispatchEvent(wheel(40));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(h.top).not.toHaveBeenCalled();

    const busy = host(el, { isFetchingPrevious: () => true });
    attachRetryOnScroll(busy);
    el.dispatchEvent(wheel(-40));
    expect(busy.top).not.toHaveBeenCalled();

    const middle = container({ scrollTop: 800, scrollHeight: 2000, clientHeight: 500 });
    const m = host(middle);
    attachRetryOnScroll(m);
    middle.dispatchEvent(wheel(-40));
    expect(m.top).not.toHaveBeenCalled();
    expect(m.bottom).not.toHaveBeenCalled();
  });

  it('scrolling down at the bottom loads newer messages when there are some', () => {
    const el = container({ scrollTop: 1450, scrollHeight: 2000, clientHeight: 500 });
    const h = host(el, { hasMoreNext: () => true });
    attachRetryOnScroll(h);
    el.dispatchEvent(wheel(40));
    expect(h.bottom).toHaveBeenCalledTimes(1);
    expect(h.top).not.toHaveBeenCalled();
    const none = host(el);
    attachRetryOnScroll(none);
    el.dispatchEvent(wheel(40));
    expect(none.bottom).not.toHaveBeenCalled();
  });

  it('detaching removes every listener', () => {
    const el = container({ scrollTop: 0, scrollHeight: 2000, clientHeight: 500 });
    const h = host(el);
    const detach = attachRetryOnScroll(h);
    detach();
    el.dispatchEvent(wheel(-40));
    expect(h.top).not.toHaveBeenCalled();
  });

  it('scrollDirectionOf reads the wheel and the scrolling keys only', () => {
    expect(scrollDirectionOf(wheel(-1))).toBe('up');
    expect(scrollDirectionOf(wheel(1))).toBe('down');
    expect(scrollDirectionOf(wheel(0))).toBeUndefined();
    expect(scrollDirectionOf(new KeyboardEvent('keydown', { key: 'End' }))).toBe('down');
    expect(scrollDirectionOf(new Event('scroll'))).toBeUndefined();
  });
});

// ── the screen: the listeners follow the footer ──────────────────────────────

describe('the message list attaches the scroll retry only while the footer is retryable', () => {
  let fake: OfflineSdkFake;
  beforeEach(async () => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    await TestBed.configureTestingModule({
      imports: [CometChatMessageListComponent],
    }).compileComponents();
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    TestBed.resetTestingModule();
  });

  it('a wheel at the top loads older messages after the reconnect, not before', async () => {
    const fixture = TestBed.createComponent(CometChatMessageListComponent);
    const component = fixture.componentInstance as any;
    const load = vi.spyOn(component, 'handleScrollToTop').mockResolvedValue(undefined);
    fixture.detectChanges();
    const list = (fixture.nativeElement as HTMLElement).querySelector(
      '.cometchat-message-list__container'
    ) as HTMLElement;
    Object.defineProperty(list, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(list, 'clientHeight', { value: 500, configurable: true });
    const service = fixture.debugElement.injector.get(MessageListService) as any;

    // Offline: the footer shows, tapping retries, scrolling does not.
    service.offlineFooterSignal.set('connect_to_load_more');
    fixture.detectChanges();
    list.dispatchEvent(wheel(-40));
    expect(load).not.toHaveBeenCalled();

    // The connection is back: scrolling loads.
    service.markOfflineConnected();
    fixture.detectChanges();
    list.dispatchEvent(wheel(-40));
    expect(load).toHaveBeenCalledTimes(1);

    // The footer goes (the read worked): the listeners go with it.
    service.offlineFooterSignal.set('none');
    service.offlineFooterRetryableSignal.set(false);
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, RETRY_ON_SCROLL_GAP_MS + 50));
    list.dispatchEvent(wheel(-40));
    expect(load).toHaveBeenCalledTimes(1);
  });
});
