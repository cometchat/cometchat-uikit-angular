/**
 * Pin/save event tiers Tests
 *
 * The two-tier split ported from the React kit: server truth on one channel,
 * this client's optimism on another, and the merged views a surface subscribes
 * to so it cannot end up hearing one tier and not the other.
 *
 * @module events/pin-save
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatPinSaveEvents, IPinSaveChanged } from './CometChatPinSaveEvents';

const message = { getId: () => 7 } as unknown as CometChat.BaseMessage;

/** Collect from a merged view for the duration of one publish. */
function collect(view: 'pinned$' | 'unpinned$' | 'saved$' | 'unsaved$', publish: () => void) {
  const seen: IPinSaveChanged[] = [];
  const sub = CometChatPinSaveEvents[view].subscribe(e => seen.push(e));
  publish();
  sub.unsubscribe();
  return seen;
}

describe('CometChatPinSaveEvents — tiers', () => {
  let raw: IPinSaveChanged[];

  beforeEach(() => {
    raw = [];
  });

  it('routes a confirmed pin to the truth channel', () => {
    const sub = CometChatPinSaveEvents.ccMessagePinned.subscribe(e => raw.push(e));
    CometChatPinSaveEvents.publishMessagePinned({ message });
    sub.unsubscribe();
    expect(raw).toEqual([{ message }]);
  });

  it('keeps a claim off the truth channel', () => {
    // The whole point of the split: an unconfirmed flip must never look
    // authoritative to a subscriber that only wants the server's word.
    const sub = CometChatPinSaveEvents.ccMessagePinned.subscribe(e => raw.push(e));
    CometChatPinSaveEvents.publishMessagePinChanged({ message, pinned: true });
    sub.unsubscribe();
    expect(raw).toEqual([]);
  });

  it('surfaces both tiers on the merged pinned view', () => {
    expect(collect('pinned$', () =>
      CometChatPinSaveEvents.publishMessagePinned({ message })
    )).toEqual([{ message }]);

    expect(collect('pinned$', () =>
      CometChatPinSaveEvents.publishMessagePinChanged({ message, pinned: true })
    )).toEqual([{ message }]);
  });

  it('routes a claim by its direction, not by which channel it came from', () => {
    // One optimistic channel carries both directions, so `pinned: false` has to
    // reach the UNPINNED view and nothing else.
    expect(collect('unpinned$', () =>
      CometChatPinSaveEvents.publishMessagePinChanged({ message, pinned: false })
    )).toEqual([{ message }]);

    expect(collect('pinned$', () =>
      CometChatPinSaveEvents.publishMessagePinChanged({ message, pinned: false })
    )).toEqual([]);
  });

  it('does the same for saves', () => {
    expect(collect('saved$', () =>
      CometChatPinSaveEvents.publishMessageSaveChanged({ message, saved: true })
    )).toEqual([{ message }]);

    expect(collect('unsaved$', () =>
      CometChatPinSaveEvents.publishMessageSaveChanged({ message, saved: false })
    )).toEqual([{ message }]);

    expect(collect('unsaved$', () =>
      CometChatPinSaveEvents.publishMessageUnsaved({ message })
    )).toEqual([{ message }]);
  });

  it('keeps pin and save channels apart', () => {
    // A save says nothing about anyone's pins, and vice versa.
    expect(collect('pinned$', () =>
      CometChatPinSaveEvents.publishMessageSaveChanged({ message, saved: true })
    )).toEqual([]);

    expect(collect('saved$', () =>
      CometChatPinSaveEvents.publishMessagePinChanged({ message, pinned: true })
    )).toEqual([]);
  });

  it('drops the direction boolean, so both tiers arrive in one shape', () => {
    const seen = collect('pinned$', () =>
      CometChatPinSaveEvents.publishMessagePinChanged({ message, pinned: true })
    );
    // A subscriber destructures `{ message }` and must not have to care which
    // tier it came from.
    expect(Object.keys(seen[0])).toEqual(['message']);
  });

  it('feeds the typed subscribe helpers from the merged views', () => {
    const sub = CometChatPinSaveEvents.onMessageUnpinned(e => raw.push(e));
    CometChatPinSaveEvents.publishMessagePinChanged({ message, pinned: false });
    CometChatPinSaveEvents.publishMessageUnpinned({ message });
    sub.unsubscribe();
    expect(raw).toEqual([{ message }, { message }]);
  });
});
