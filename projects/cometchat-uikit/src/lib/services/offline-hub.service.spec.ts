/** The Angular face of the hub: the notices a screen shows, and the hub subscriptions' teardown. */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { OfflineHub, OfflineNotice } from '../utils/offline/offline-hub';
import { OfflineHubService, SEND_IN_FLIGHT_NOTICE_MS } from './offline-hub.service';

describe('OfflineHubService', () => {
  beforeEach(() => {
    OfflineHub.resetForTests();
    TestBed.configureTestingModule({ providers: [OfflineHubService] });
  });
  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
    OfflineHub.resetForTests();
  });

  const notice = (kind: OfflineNotice['kind']): OfflineNotice => ({ gen: OfflineHub.getInstance().gen, kind, count: 1 });

  it('claims the notices raised before it was created', () => {
    const early = notice('unsent_messages_lost');
    OfflineHub.getInstance().notice$.next(early);
    const service = TestBed.inject(OfflineHubService);
    expect(service.notices()).toEqual([early]);
  });

  it('shows a new notice and lets a screen dismiss it', () => {
    const service = TestBed.inject(OfflineHubService);
    const raised = notice('messages_not_sent');
    OfflineHub.getInstance().notice$.next(raised);
    expect(service.notices()).toEqual([raised]);
    service.dismissNotice(raised);
    expect(service.notices()).toEqual([]);
  });

  it('keeps one "sending, try again" notice at a time and dismisses it by itself', () => {
    vi.useFakeTimers();
    const service = TestBed.inject(OfflineHubService);
    const hub = OfflineHub.getInstance();
    hub.notice$.next(notice('send_in_flight'));
    hub.notice$.next(notice('send_in_flight'));
    expect(service.notices().filter(n => n.kind === 'send_in_flight')).toHaveLength(1);
    vi.advanceTimersByTime(SEND_IN_FLIGHT_NOTICE_MS + 1);
    expect(service.notices()).toEqual([]);
  });

  it('drops the notices of an earlier session when the session ends', () => {
    const service = TestBed.inject(OfflineHubService);
    OfflineHub.getInstance().notice$.next(notice('messages_not_sent'));
    OfflineHub.getInstance().endSession();
    expect(service.notices()).toEqual([]);
  });

  it('counts the mounted conversation lists, each unmount once', () => {
    const service = TestBed.inject(OfflineHubService);
    expect(service.hasConversationList).toBe(false);
    const unmountFirst = service.conversationListMounted();
    const unmountSecond = service.conversationListMounted();
    unmountFirst();
    unmountFirst();
    expect(service.hasConversationList).toBe(true);
    unmountSecond();
    expect(service.hasConversationList).toBe(false);
  });

  it('stops listening to the hub when it is destroyed', () => {
    const hub = OfflineHub.getInstance();
    const service = TestBed.inject(OfflineHubService);
    TestBed.resetTestingModule();
    hub.notice$.next(notice('messages_not_sent'));
    expect(service.notices()).toEqual([]);
  });
});
