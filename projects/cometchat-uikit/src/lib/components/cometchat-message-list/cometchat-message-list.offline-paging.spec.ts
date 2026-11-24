/**
 * Offline paging on the message list screen (UIK-READ-03, AC-4.3): an offline
 * read past the saved messages never ends the list, and a chat with nothing
 * saved shows the "Connect to load more" footer, not the empty view. With offline
 * off (no footer) both behave as today.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { describe, expect, it, vi } from 'vitest';
import { signal } from '@angular/core';
import { States } from '../../Enums/Enums';
import {
  handleScrollToBottomImpl,
  handleScrollToTopImpl,
} from './cometchat-message-list.scroll-handlers';
import { updateListStateImpl } from './cometchat-message-list.helper-utils';

function scrollCtx(hasMore: boolean, footer: 'none' | 'connect_to_load_more'): any {
  return {
    isFetchingPrevious: signal(false),
    isFetchingNext: signal(false),
    hasMorePrevious: signal(true),
    hasMoreNext: signal(true),
    messageListService: {
      fetchPreviousMessages: vi.fn(async () => hasMore),
      fetchNextMessages: vi.fn(async () => hasMore),
      offlineFooter: () => footer,
    },
  };
}

function stateHost(footer: 'none' | 'connect_to_load_more', messages: unknown[] = []): any {
  return {
    isAgentChat: false,
    parentMessageId: undefined,
    listState: signal(States.loading),
    loadingState: () => false,
    errorState: () => null,
    messages: () => messages,
    effectiveHideError: () => false,
    messageListService: { offlineFooter: () => footer },
  };
}

describe('offline pagination does not dead-end (UIK-READ-03)', () => {
  it('an offline read past the cache keeps older messages reachable', async () => {
    const ctx = scrollCtx(false, 'connect_to_load_more');
    await handleScrollToTopImpl(ctx);
    expect(ctx.hasMorePrevious()).toBe(true);
    expect(ctx.isFetchingPrevious()).toBe(false);
  });

  it('an empty server page online still ends the list', async () => {
    const ctx = scrollCtx(false, 'none');
    await handleScrollToTopImpl(ctx);
    expect(ctx.hasMorePrevious()).toBe(false);
  });

  it('a read of newer messages offline keeps them reachable, and online it ends as today', async () => {
    const offline = scrollCtx(false, 'connect_to_load_more');
    handleScrollToBottomImpl(offline);
    await vi.waitFor(() => expect(offline.isFetchingNext()).toBe(false));
    expect(offline.hasMoreNext()).toBe(true);
    const online = scrollCtx(false, 'none');
    handleScrollToBottomImpl(online);
    await vi.waitFor(() => expect(online.isFetchingNext()).toBe(false));
    expect(online.hasMoreNext()).toBe(false);
  });
});

describe('a chat with nothing saved, offline (AC-4.3)', () => {
  it('shows the loaded view (with its footer), not the empty view', () => {
    const host = stateHost('connect_to_load_more');
    updateListStateImpl(host);
    expect(host.listState()).toBe(States.loaded);
  });

  it('D83: when the read failed with nothing saved, it is the error view, not the empty or loaded view', () => {
    const host = stateHost('none');
    host.errorState = () => new Error('not connected');
    updateListStateImpl(host);
    expect(host.listState()).toBe(States.error);
  });

  it('a genuinely empty chat keeps the empty view', () => {
    const host = stateHost('none');
    updateListStateImpl(host);
    expect(host.listState()).toBe(States.empty);
  });
});
