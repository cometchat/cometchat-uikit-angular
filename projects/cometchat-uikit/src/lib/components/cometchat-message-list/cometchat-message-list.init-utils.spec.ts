/**
 * cometchat-message-list.init-utils Tests: publishActiveChatChangedImpl, the "this chat is now
 * active" announcement the message list makes once its first page of messages has loaded.
 *
 * @module components/cometchat-message-list/init-utils
 */

import { describe, it, expect, afterEach } from 'vitest';
import { Subscription } from 'rxjs';
import { CometChatUIEvents } from '../../events/CometChatUIEvents';
import { publishActiveChatChangedImpl } from './cometchat-message-list.init-utils';

const user = { getUid: () => 'bob' };
const lastMessage = { getId: () => 2 };

/** The fields publishActiveChatChangedImpl reads from the list. */
function list(overrides: Record<string, unknown> = {}) {
  return {
    isFirstLoad: true,
    isDestroyed: false,
    parentMessageId: undefined,
    user,
    group: undefined,
    messages: () => [{ getId: () => 1 }, lastMessage],
    ...overrides,
  };
}

describe('publishActiveChatChangedImpl', () => {
  let sub: Subscription | undefined;
  let events: unknown[] = [];
  const listen = () => {
    events = [];
    sub = CometChatUIEvents.ccActiveChatChanged.subscribe((e) => events.push(e));
  };
  afterEach(() => sub?.unsubscribe());

  it('announces the chat once, with its last message, after the first load', () => {
    listen();
    const self = list();
    publishActiveChatChangedImpl(self);
    publishActiveChatChangedImpl(self);
    expect(events).toEqual([{ user, group: undefined, message: lastMessage, unreadMessageCount: 0 }]);
    expect(self.isFirstLoad).toBe(false);
  });

  it('does not announce a thread view', () => {
    listen();
    publishActiveChatChangedImpl(list({ parentMessageId: 7 }));
    expect(events).toEqual([]);
  });

  // A chat closed while its messages were loading (the user switched tab) reopened when the late
  // load announced it: the sample app makes the announced chat active.
  it('does not announce a chat whose list was closed before its first load finished', () => {
    listen();
    const self = list({ isDestroyed: true });
    publishActiveChatChangedImpl(self);
    expect(events).toEqual([]);
  });
});
