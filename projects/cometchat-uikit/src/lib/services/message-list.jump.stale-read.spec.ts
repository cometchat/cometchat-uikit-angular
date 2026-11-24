/**
 * A jump to a message starts a new window: an older-page read already in
 * flight never lands in it (offline off; the same generation guards the
 * offline path).
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MessageListService } from './message-list.service';

const message = (id: number): any => ({
  getId: () => id,
  getMuid: () => `m${String(id)}`,
  getSentAt: () => id,
  getCategory: () => 'message',
  getType: () => 'text',
});

describe('MessageListService: jump to a message while an older page is loading', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('drops the older page, so the jumped-to window is only what the jump read', async () => {
    TestBed.configureTestingModule({ providers: [MessageListService] });
    const service = TestBed.inject(MessageListService);
    const internals = service as any;
    let finishOlder!: (rows: unknown[]) => void;
    internals.currentUser = { getUid: () => 'peer' };
    internals.messagesRequest = {
      fetchPrevious: () =>
        new Promise(resolve => {
          finishOlder = resolve;
        }),
    };
    vi.spyOn(internals, 'buildMessagesRequest').mockReturnValue({
      fetchPrevious: () => Promise.resolve([message(100)]),
    });
    vi.spyOn(internals, 'buildNextMessagesRequest').mockReturnValue({
      fetchNext: () => Promise.resolve([]),
    });

    const older = service.fetchPreviousMessages();
    await service.fetchMessagesAroundId(100);
    finishOlder([message(1), message(2)]);
    await expect(older).resolves.toBe(false);

    expect(service.messages().map(m => m.getId())).toEqual([100]);
  });
});
