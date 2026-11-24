/**
 * The sweep inserts only rows the list would show (BEH-SYNC-25/31, R82): the server's
 * `action`/`message` records of an edit or delete are dropped, while the edited and
 * deleted originals and group-member actions still land.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { signal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  installOfflineSdk,
  OfflineSdkFake,
  offlineMessage,
  textMessage,
} from '../testing/offline-sdk-fake';
import { HeldReceipts } from '../utils/offline/reconcile';
import { OfflineHub } from '../utils/offline/offline-hub';
import { applyMessageSync } from './message-list.offline';
import { acceptsSweptRowImpl } from './message-list.request-builder';

function makeCtx(overrides: Record<string, unknown> = {}): any {
  const ctx: any = {
    messagesRequest: null,
    nextMessagesRequest: null,
    fetchGeneration: 0,
    parentMessageId: null,
    isAgentChatMode: false,
    hideGroupActionMessages: false,
    customMessageTypes: new Set<string>(),
    customMessageCategories: new Set<string>(),
    replacedMessageTypes: null,
    replacedMessageCategories: null,
    messagesRequestBuilder: null,
    prevMessageIdSignal: signal(0),
    nextMessageIdSignal: signal(0),
    allMessagesSignal: signal<CometChat.BaseMessage[]>([]),
    messagesSignal: signal<CometChat.BaseMessage[]>([]),
    messageIdMap: new Map(),
    messageMuidMap: new Map(),
    heldReceipts: new HeldReceipts(),
    offlinePathUsed: false,
    buildNextMessagesRequest: () => null,
    buildMessagesRequest: () => null,
    normalizeMessageId: (id: string | number) => Number(id),
    isMessageForCurrentConversation: () => true,
    acceptsSweptRow: (m: CometChat.BaseMessage) => acceptsSweptRowImpl(ctx, m),
    ...overrides,
  };
  return ctx;
}

function text(body: string, id: number, extra: Record<string, unknown> = {}): any {
  const m: any = offlineMessage(textMessage(body), { id, sentAt: id });
  for (const [k, v] of Object.entries(extra)) m[k] = v;
  return m;
}

function action(type: string, kind: string, id: number): any {
  const a: any = offlineMessage(new CometChat.Action('g', type, 'group', 'action' as any) as any, {
    id,
    sentAt: id,
  });
  a.getType = () => type;
  a.getAction = () => kind;
  return a;
}

const body = (m: any) => (m.getText ? m.getText() : `[${m.getCategory()}/${m.getType()}]`);

describe('applyMessageSync: swept rows pass the list type/category acceptance', () => {
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

  const sweep = () => [
    text('edited text', 1),
    action('message', 'edited', 10),
    text('', 2, { getDeletedAt: () => 99 }),
    action('message', 'deleted', 11),
    action('groupMember', 'joined', 12),
    text('brand new', 13),
  ];

  const run = (ctx: any) => {
    ctx.allMessagesSignal.set([text('old text', 1), text('to delete', 2)]);
    applyMessageSync(ctx, {
      gen: OfflineHub.getInstance().gen,
      messages: sweep(),
      outcome: 'CAUGHT_UP',
    });
    return ctx.allMessagesSignal() as any[];
  };

  it('keeps the edited and deleted originals, the group action and the new text; drops action(message) rows', () => {
    const rows = run(makeCtx());
    expect(rows.map(body)).toEqual(['edited text', '', '[action/groupMember]', 'brand new']);
    expect(rows[1].getDeletedAt()).toBe(99);
    expect(rows.some(r => r.getCategory() === 'action' && r.getType() === 'message')).toBe(false);
  });

  it('hideGroupActionMessages drops the groupMember row too', () => {
    const rows = run(makeCtx({ hideGroupActionMessages: true }));
    expect(rows.map(body)).toEqual(['edited text', '', 'brand new']);
  });

  it("an integrator builder's types and categories decide what the sweep inserts", () => {
    // The real builder keeps setTypes/setCategories in `types`/`categories`.
    const builder = { types: ['text'], categories: ['message'] };
    const rows = run(makeCtx({ messagesRequestBuilder: builder }));
    expect(rows.map(body)).toEqual(['edited text', '', 'brand new']);
  });
});
