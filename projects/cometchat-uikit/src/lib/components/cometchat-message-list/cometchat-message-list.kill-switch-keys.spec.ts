vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, describe, expect, it } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { installOfflineSdk, offlineMessage, textMessage } from '../../testing/offline-sdk-fake';
import { trackKeyFor } from './cometchat-message-list.message-state';

describe('message list track keys across the offline kill switch', () => {
  let fake: ReturnType<typeof installOfflineSdk> | null = null;
  afterEach(() => {
    fake?.restore();
    fake = null;
  });

  const own = () =>
    offlineMessage(textMessage('hello'), { localMessageId: 'L1', muid: 'M1', status: 'PENDING' });
  const list = () => ({ loggedInUser: new CometChat.User('me') });

  it('a list that used the offline keys keeps them when offline turns off: no row is rebuilt', () => {
    fake = installOfflineSdk({ enabled: true });
    const ctx = list();
    const message = own();
    const before = trackKeyFor(ctx)(message);
    fake.setEnabled(false);
    expect(trackKeyFor(ctx)(message)).toBe(before);
  });

  it('a list that never ran offline keeps today\'s keys', () => {
    fake = installOfflineSdk({ enabled: false });
    const message = own();
    expect(trackKeyFor(list())(message)).toBe('msg-M1');
  });
});
