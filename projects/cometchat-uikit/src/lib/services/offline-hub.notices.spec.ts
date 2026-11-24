/**
 * The "Sending... try again in a moment" notice (ruling R162 / S73): shown one
 * at a time, replaced by a newer one, and gone by itself after a few seconds.
 * Other notices are untouched by it.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { OfflineHubService, SEND_IN_FLIGHT_NOTICE_MS } from './offline-hub.service';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { OfflineHub, OfflineNotice } from '../utils/offline/offline-hub';


/** An own failed row of `receiverId`, optionally a reply in thread `parentId`. */
function own(text: string, receiverId: string, parentId = 0): CometChat.BaseMessage {
  const m = new CometChat.TextMessage(receiverId, text, CometChat.RECEIVER_TYPE.USER);
  if (parentId) m.setParentMessageId(parentId);
  return m as unknown as CometChat.BaseMessage;
}

function raise(
  hub: OfflineHub,
  kind: OfflineNotice['kind'],
  extra: Partial<OfflineNotice> = {}
): void {
  hub.notice$.next({ gen: hub.gen, kind, ...extra });
}

describe('send_in_flight notice', () => {
  let hub: OfflineHub;
  let service: OfflineHubService;

  beforeEach(() => {
    vi.useFakeTimers();
    OfflineHub.resetForTests();
    hub = OfflineHub.getInstance();
    service = TestBed.inject(OfflineHubService);
  });
  afterEach(() => {
    vi.useRealTimers();
    OfflineHub.resetForTests();
    TestBed.resetTestingModule();
  });

  const kinds = () => service.notices().map(n => n.kind);

  it('dismisses itself after SEND_IN_FLIGHT_NOTICE_MS', () => {
    raise(hub, 'send_in_flight');
    expect(kinds()).toEqual(['send_in_flight']);
    vi.advanceTimersByTime(SEND_IN_FLIGHT_NOTICE_MS - 1);
    expect(kinds()).toEqual(['send_in_flight']);
    vi.advanceTimersByTime(1);
    expect(kinds()).toEqual([]);
  });

  it('shows one at a time: a newer tap replaces the older notice and restarts the wait', () => {
    raise(hub, 'send_in_flight');
    vi.advanceTimersByTime(SEND_IN_FLIGHT_NOTICE_MS - 1000);
    raise(hub, 'send_in_flight');
    expect(kinds()).toEqual(['send_in_flight']);
    // The first notice's timer must not remove the newer one.
    vi.advanceTimersByTime(1000);
    expect(kinds()).toEqual(['send_in_flight']);
    vi.advanceTimersByTime(SEND_IN_FLIGHT_NOTICE_MS - 1000);
    expect(kinds()).toEqual([]);
  });

  it('leaves every other notice alone, and they stay until dismissed', () => {
    raise(hub, 'queue_full');
    raise(hub, 'send_in_flight');
    raise(hub, 'messages_not_sent', { count: 2 });
    expect(kinds()).toEqual(['queue_full', 'send_in_flight', 'messages_not_sent']);
    vi.advanceTimersByTime(SEND_IN_FLIGHT_NOTICE_MS);
    expect(kinds()).toEqual(['queue_full', 'messages_not_sent']);
    vi.advanceTimersByTime(60_000);
    expect(kinds()).toEqual(['queue_full', 'messages_not_sent']);
  });

  it('a user dismissal first leaves nothing for the timer to remove', () => {
    raise(hub, 'send_in_flight');
    service.dismissNotice(service.notices()[0]);
    raise(hub, 'queue_full');
    vi.advanceTimersByTime(SEND_IN_FLIGHT_NOTICE_MS);
    expect(kinds()).toEqual(['queue_full']);
  });
});

/**
 * A refusal notice is a fixed sentence with nothing in it to tell two of them apart, so the
 * list shows one at a time. QA hit the opposite: three refused sends left three identical
 * "Too many messages waiting to send" banners covering part of the chat, each needing its own
 * dismissal. Android raises them singly onto a transient surface (`OfflineNoticeRelay`).
 */
describe('repeated refusal notices', () => {
  let hub: OfflineHub;
  let service: OfflineHubService;

  beforeEach(() => {
    OfflineHub.resetForTests();
    hub = OfflineHub.getInstance();
    service = TestBed.inject(OfflineHubService);
  });
  afterEach(() => {
    OfflineHub.resetForTests();
    TestBed.resetTestingModule();
  });

  const kinds = () => service.notices().map(n => n.kind);

  it('three refused sends leave one "too many messages" notice, not three', () => {
    raise(hub, 'queue_full');
    raise(hub, 'queue_full');
    raise(hub, 'queue_full');
    expect(kinds()).toEqual(['queue_full']);
  });

  it('three oversized files leave one "file too large" notice', () => {
    raise(hub, 'file_too_large_offline');
    raise(hub, 'file_too_large_offline');
    raise(hub, 'file_too_large_offline');
    expect(kinds()).toEqual(['file_too_large_offline']);
  });

  it('collapsing one kind leaves the other notices in place, newest last', () => {
    raise(hub, 'messages_not_sent', { count: 2 });
    raise(hub, 'queue_full');
    raise(hub, 'file_too_large_offline');
    raise(hub, 'queue_full');
    expect(kinds()).toEqual(['messages_not_sent', 'file_too_large_offline', 'queue_full']);
  });

  // The store is one signal shared by every mounted list, and each list renders only the notices
  // that are its own. A collapse must therefore replace within the raising list only: collapsing
  // by kind alone let a refusal in one chat (or a thread panel) silently drop another list's
  // banner, which broke the list-scoping parity the kit guarantees (Android: acceptsOfflineSendRow).
  it('collapses within one list only: another chat keeps its own refusal notice', () => {
    const here = own('here', 'uid-a');
    const there = own('there', 'uid-b');
    raise(hub, 'queue_full', { message: here });
    raise(hub, 'queue_full', { message: there });
    raise(hub, 'queue_full', { message: here });
    const texts = service
      .notices()
      .map(n => (n.message as any)?.getText?.() ?? '');
    expect(texts).toEqual(['there', 'here']);
  });

  it('collapses within one thread level only: the main list and its panel keep one each', () => {
    const main = own('main', 'uid-a');
    const reply = own('reply', 'uid-a', 55);
    raise(hub, 'queue_full', { message: main });
    raise(hub, 'queue_full', { message: reply });
    raise(hub, 'queue_full', { message: reply });
    const texts = service
      .notices()
      .map(n => (n.message as any)?.getText?.() ?? '');
    expect(texts).toEqual(['main', 'reply']);
  });

  it('keeps every removed-message notice: each names its own message and offers Copy', () => {
    raise(hub, 'unsent_message_removed', { count: 1 });
    raise(hub, 'unsent_message_removed', { count: 1 });
    expect(kinds()).toEqual(['unsent_message_removed', 'unsent_message_removed']);
  });
});
