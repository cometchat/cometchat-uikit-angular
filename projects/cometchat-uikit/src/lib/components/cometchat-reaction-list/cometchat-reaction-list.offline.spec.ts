vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChatReactionListComponent } from './cometchat-reaction-list.component';
import { installOfflineSdk, OfflineSdkFake } from '../../testing/offline-sdk-fake';
import { NOT_CONNECTED, twoPhaseRequest } from '../../testing/two-phase-request-fake';
import { ConnectionStateService } from '../../services/connection-state.service';
import { setConnection } from '../../testing/connection-driver';

/** The connection drops and comes back, as the SDK reports it. */
function reconnect(): void {
  const connection = TestBed.inject(ConnectionStateService) as any;
  for (const value of [false, true]) {
    setConnection(connection, value);
    TestBed.tick();
  }
}

function reaction(emoji: string, uid: string): any {
  return {
    getReaction: () => emoji,
    getUid: () => uid,
    getReactedBy: () => ({ getUid: () => uid, getName: () => uid, getAvatar: () => '' }),
  };
}

/** Reactions list, offline path: cached then server, deduped, never repeating on "load more". */
describe('CometChatReactionListComponent: two-phase (UIT-LIST-07)', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    fake = installOfflineSdk();
  });
  afterEach(() => {
    fake.restore();
    vi.restoreAllMocks();
  });

  function open(request: any) {
    const comp = TestBed.createComponent(CometChatReactionListComponent).componentInstance;
    comp.reactionsRequestBuilder = { build: () => request } as any;
    comp.message = { getId: () => 1 } as any;
    return comp;
  }
  const ids = (comp: CometChatReactionListComponent) =>
    comp.filteredReactions().map(r => `${r.getReaction()}${r.getUid()}`);

  it('paints the cached page, then the server page replaces it in place', async () => {
    const request = twoPhaseRequest('Reactions', [
      {
        cached: [reaction('a', 'u1'), reaction('a', 'u2')],
        server: [reaction('a', 'u2'), reaction('a', 'u3')],
      },
    ]);
    const painted: string[][] = [];
    const comp = open(request);
    const original = (comp as any).groupReactionsByEmoji.bind(comp);
    (comp as any).groupReactionsByEmoji = (rows: any[]) => {
      painted.push(rows.map(r => r.getUid()));
      original(rows);
    };
    await comp.fetchReactions();
    expect(painted[0]).toEqual(['u1', 'u2']);
    expect(ids(comp)).toEqual(['au2', 'au3']);
    expect(comp.hasError()).toBe(false);
  });

  it('"load more" never repeats a row, and only an empty server page ends the list', async () => {
    const request = twoPhaseRequest('Reactions', [
      { cached: [], server: [reaction('a', 'u1'), reaction('a', 'u2')] },
      { cached: [reaction('a', 'u2')], server: [reaction('a', 'u2'), reaction('a', 'u3')] },
      { server: [] },
    ]);
    const comp = open(request);
    await comp.fetchReactions();
    await comp.fetchReactions();
    expect(ids(comp)).toEqual(['au1', 'au2', 'au3']);
    expect(comp.hasMoreReactions()).toBe(true);
    await comp.fetchReactions();
    expect(comp.hasMoreReactions()).toBe(false);
  });

  it('offline past the cache keeps the rows shown and raises no error', async () => {
    const request = twoPhaseRequest('Reactions', [
      { cached: [reaction('a', 'u1')], error: NOT_CONNECTED },
    ]);
    const comp = open(request);
    await comp.fetchReactions();
    expect(ids(comp)).toEqual(['au1']);
    expect(comp.hasError()).toBe(false);
  });

  it('D84 rule 3: offline with nothing on screen is "Connect to load reactions" with no Retry, and the list loads once by itself on reconnect', async () => {
    const request = twoPhaseRequest('Reactions', [
      { error: NOT_CONNECTED },
      { server: [reaction('a', 'u1')] },
    ]);
    const comp = open(request);
    await comp.fetchReactions();
    expect(comp.hasError()).toBe(true);
    expect(comp.offlineConnectToLoad()).toBe(true);
    expect(ids(comp)).toEqual([]);
    reconnect();
    await vi.waitFor(() => expect(ids(comp)).toEqual(['au1']));
    expect(comp.hasError()).toBe(false);
    expect(comp.offlineConnectToLoad()).toBe(false);
    reconnect();
    await Promise.resolve();
    expect(request.fetchNext).toHaveBeenCalledTimes(2);
  });

  it('D84 rule 3: the offline state shows the text and no Retry; a real error shows Retry', async () => {
    for (const [error, offlineState] of [[NOT_CONNECTED, true], [{ code: 'ERR_X' }, false]] as const) {
      const fixture = TestBed.createComponent(CometChatReactionListComponent);
      const comp = fixture.componentInstance;
      comp.reactionsRequestBuilder = { build: () => twoPhaseRequest('Reactions', [{ error }]) } as any;
      comp.message = { getId: () => 1 } as any;
      await comp.fetchReactions();
      expect(comp.hasError()).toBe(true);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const retry = el.querySelector('.cometchat-reaction-list__retry-button');
      if (offlineState) {
        expect(el.querySelector('[data-cc-reason="connect-to-load"]')?.textContent).toContain('Connect to load reactions');
        expect(retry).toBeNull();
      } else {
        expect(el.querySelector('[data-cc-reason="connect-to-load"]')).toBeNull();
        expect(retry).not.toBeNull();
      }
    }
  });

  /** The message's own reaction counts: 👍 x2, ❤️ x1. */
  const counted = (id = 1): any => ({
    getId: () => id,
    getReactions: () => [
      { getReaction: () => '👍', getCount: () => 2 },
      { getReaction: () => '❤️', getCount: () => 1 },
    ],
  });
  const tabs = (el: HTMLElement) =>
    Array.from(el.querySelectorAll('.cometchat-reaction-list__tabs-tab')).map(tab =>
      Array.from(tab.querySelectorAll('span')).map(span => span.textContent!.trim()).join(' '));

  it('ENG-57325: "Connect to load reactions" keeps the tab bar, with the message\'s own counts, until the list loads on reconnect (as Android)', async () => {
    const request = twoPhaseRequest('Reactions', [
      { error: NOT_CONNECTED },
      { server: [reaction('👍', 'u1'), reaction('👍', 'u2'), reaction('❤️', 'u3'), reaction('😂', 'u4')] },
    ]);
    const fixture = TestBed.createComponent(CometChatReactionListComponent);
    const comp = fixture.componentInstance;
    comp.reactionsRequestBuilder = { build: () => request } as any;
    comp.message = counted();
    await comp.fetchReactions();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(tabs(el)).toEqual(['All 3', '👍 2', '❤️ 1']);
    expect(el.querySelector('[data-cc-reason="connect-to-load"]')?.textContent).toContain('Connect to load reactions');
    expect(el.querySelector('.cometchat-reaction-list__retry-button')).toBeNull();
    // A tab picked while offline still shows the offline message, not an empty list.
    comp.selectEmoji('👍');
    fixture.detectChanges();
    expect(el.querySelector('[data-cc-reason="connect-to-load"]')).not.toBeNull();
    expect(el.querySelector('.cometchat-reaction-list__empty')).toBeNull();

    reconnect();
    await vi.waitFor(() => expect(comp.filteredReactions()).toHaveLength(4));
    fixture.detectChanges();
    // Loaded rows drive the tabs again.
    expect(tabs(el)).toEqual(['All 4', '👍 2', '❤️ 1', '😂 1']);
    expect(el.querySelector('[data-cc-reason="connect-to-load"]')).toBeNull();
  });

  it('ENG-57325: the online error view and its hidden tab bar are unchanged (offline on with a real error, and offline off)', async () => {
    for (const offline of [true, false]) {
      fake.setEnabled(offline);
      const fixture = TestBed.createComponent(CometChatReactionListComponent);
      const comp = fixture.componentInstance;
      comp.reactionsRequestBuilder = { build: () => twoPhaseRequest('Reactions', [{ error: { code: 'ERR_X' } }]) } as any;
      comp.message = counted();
      await comp.fetchReactions();
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(comp.hasError()).toBe(true);
      expect(el.querySelector('.cometchat-reaction-list__tabs')).toBeNull();
      expect(el.querySelector('.cometchat-reaction-list__retry-button')).not.toBeNull();
      expect(comp.totalReactionCount()).toBe(0);
      expect(comp.emojiTabs()).toEqual([]);
    }
  });

  it('ENG-57325: loaded rows, not the message counts, drive the tabs', async () => {
    const fixture = TestBed.createComponent(CometChatReactionListComponent);
    const comp = fixture.componentInstance;
    comp.reactionsRequestBuilder = { build: () => twoPhaseRequest('Reactions', [{ cached: [reaction('😂', 'u1')], error: NOT_CONNECTED }]) } as any;
    comp.message = counted();
    await comp.fetchReactions();
    fixture.detectChanges();
    expect(comp.offlineConnectToLoad()).toBe(false);
    expect(tabs(fixture.nativeElement)).toEqual(['All 1', '😂 1']);
  });

  it('D84 rule 8: a non-network error with nothing on screen is not reloaded on reconnect', async () => {
    const request = twoPhaseRequest('Reactions', [
      { error: { code: 'ERR_X' } },
      { server: [reaction('a', 'u1')] },
    ]);
    const comp = open(request);
    await comp.fetchReactions();
    reconnect();
    await Promise.resolve();
    expect(request.fetchNext).toHaveBeenCalledTimes(1);
    expect(comp.hasError()).toBe(true);
  });

  it('D84 rule 6: an empty server page is the empty view, not an error', async () => {
    const comp = open(twoPhaseRequest('Reactions', [{ server: [] }]));
    await comp.fetchReactions();
    expect(comp.hasError()).toBe(false);
    expect(ids(comp)).toEqual([]);
  });

  it('D84 rule 4: a real error with nothing shown is the error state with Retry, not the offline state', async () => {
    const comp = open(twoPhaseRequest('Reactions', [{ error: { code: 'ERR_X' } }]));
    await comp.fetchReactions();
    expect(comp.hasError()).toBe(true);
    expect(comp.offlineConnectToLoad()).toBe(false);
  });

  it('offline off: one plain read, no listener (P1)', async () => {
    fake.setEnabled(false);
    const request = twoPhaseRequest('Reactions', [{ server: [reaction('a', 'u1')] }]);
    const comp = open(request);
    await comp.fetchReactions();
    expect(request.fetchNext).toHaveBeenCalledWith();
    expect(ids(comp)).toEqual(['au1']);
  });
});
