vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatReactionInfoComponent } from './cometchat-reaction-info.component';
import { installOfflineSdk, OfflineSdkFake } from '../../testing/offline-sdk-fake';
import { NOT_CONNECTED, stubBuild, twoPhaseRequest } from '../../testing/two-phase-request-fake';

function reaction(uid: string, name: string): any {
  return { getReactedBy: () => ({ getUid: () => uid, getName: () => name }) };
}

/** Reaction info tooltip, offline path (UIT-LIST-07). */
describe('CometChatReactionInfoComponent: two-phase', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    fake = installOfflineSdk();
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(null as any);
  });
  afterEach(() => {
    fake.restore();
    vi.restoreAllMocks();
  });

  async function open(request: any) {
    stubBuild(CometChat, 'ReactionsRequestBuilder').mockReturnValue(request);
    const fixture = TestBed.createComponent(CometChatReactionInfoComponent);
    fixture.componentRef.setInput('message', { getId: () => 1, getReactions: () => [] });
    fixture.componentRef.setInput('reaction', '👍');
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
    return fixture.componentInstance;
  }

  it("shows the cached names, then the server's", async () => {
    const request = twoPhaseRequest('Reactions', [
      { cached: [reaction('a', 'Ann')], server: [reaction('a', 'Ann'), reaction('b', 'Bob')] },
    ]);
    const comp = await open(request);
    expect(comp.state()).toBe('loaded');
    expect(comp.reactionNames()).toEqual(['Ann', 'Bob']);
  });

  it('offline with a cached page keeps it and shows no error', async () => {
    const comp = await open(
      twoPhaseRequest('Reactions', [{ cached: [reaction('a', 'Ann')], error: NOT_CONNECTED }])
    );
    expect(comp.state()).toBe('loaded');
    expect(comp.reactionNames()).toEqual(['Ann']);
  });

  it('offline with nothing cached is not an error state', async () => {
    const comp = await open(twoPhaseRequest('Reactions', [{ cached: [], error: NOT_CONNECTED }]));
    expect(comp.state()).toBe('loaded');
  });

  it('offline off: one plain read (P1)', async () => {
    fake.setEnabled(false);
    const request = twoPhaseRequest('Reactions', [{ server: [reaction('a', 'Ann')] }]);
    const comp = await open(request);
    expect(request.fetchNext).toHaveBeenCalledWith();
    expect(comp.reactionNames()).toEqual(['Ann']);
  });

  /** A cached reaction can have no reactor; naming it must not throw (Prajwal #15). */
  describe('a cached reaction with no reactor', () => {
    /** No getReactedBy at all, as a cached row can come back. */
    const noReactor = (uid?: string): any => ({
      getReactedBy: () => undefined,
      ...(uid ? { getUid: () => uid } : {}),
    });

    it('does not throw, and leaves the named reactors in place', async () => {
      const comp = await open(
        twoPhaseRequest('Reactions', [
          { cached: [reaction('a', 'Ann'), noReactor()], server: [reaction('a', 'Ann'), noReactor()] },
        ])
      );
      expect(comp.state()).toBe('loaded');
      expect(comp.reactionNames()).toEqual(['Ann']);
    });

    it('does not throw while painting the cached page either', async () => {
      const comp = await open(
        twoPhaseRequest('Reactions', [{ cached: [noReactor(), reaction('b', 'Bob')], error: NOT_CONNECTED }])
      );
      expect(comp.state()).toBe('loaded');
      expect(comp.reactionNames()).toEqual(['Bob']);
    });

    it('is left out of the names, so it shows in the "and N others" suffix', async () => {
      stubBuild(CometChat, 'ReactionsRequestBuilder').mockReturnValue(
        twoPhaseRequest('Reactions', [{ server: [reaction('a', 'Ann'), noReactor()] }])
      );
      const fixture = TestBed.createComponent(CometChatReactionInfoComponent);
      fixture.componentRef.setInput('message', {
        getId: () => 1,
        // The message itself knows there are two reactions for this emoji.
        getReactions: () => [{ getReaction: () => '👍', getCount: () => 2 }],
      });
      fixture.componentRef.setInput('reaction', '👍');
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve, 0));
      const comp = fixture.componentInstance;
      expect(comp.reactionNames()).toEqual(['Ann']);
      expect(comp.totalReactions()).toBe(2);
      expect(comp.getDisplayText()).toContain('Ann');
      expect(comp.getDisplayText()).toContain('1');
    });

    it("still reads the logged-in user from the reaction's own uid", async () => {
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue({ getUid: () => 'me' } as any);
      const comp = await open(
        twoPhaseRequest('Reactions', [{ server: [reaction('a', 'Ann'), noReactor('me')] }])
      );
      // "You" first, then the other reactor; the nameless row is not dropped silently.
      expect(comp.reactionNames()).toHaveLength(2);
      expect(comp.reactionNames()[1]).toBe('Ann');
    });
  });
});
