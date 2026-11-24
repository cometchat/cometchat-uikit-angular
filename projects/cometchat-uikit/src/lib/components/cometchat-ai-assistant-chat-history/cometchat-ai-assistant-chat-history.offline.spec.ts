vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatAIAssistantChatHistory } from './cometchat-ai-assistant-chat-history.component';
import { installOfflineSdk, OfflineSdkFake } from '../../testing/offline-sdk-fake';
import { NOT_CONNECTED, twoPhaseRequest } from '../../testing/two-phase-request-fake';
import { ConnectionStateService } from '../../services/connection-state.service';
import { setConnection } from '../../testing/connection-driver';

const holder = vi.hoisted(() => ({ request: null as any }));

vi.mock('@cometchat/chat-sdk-javascript', async importOriginal => {
  const actual = await importOriginal<typeof import('@cometchat/chat-sdk-javascript')>();
  return {
    ...actual,
    CometChat: {
      ...actual.CometChat,
      MessagesRequestBuilder: class {
        hideReplies() {
          return this;
        }
        setLimit() {
          return this;
        }
        hideDeletedMessages() {
          return this;
        }
        setUID() {
          return this;
        }
        setGUID() {
          return this;
        }
        build() {
          return holder.request;
        }
      },
      TextMessage: class {
        constructor(
          public _id: number,
          public _text: string,
          public _sentAt: number
        ) {}
        getId() {
          return this._id;
        }
        getText() {
          return this._text;
        }
        getSentAt() {
          return this._sentAt;
        }
        getType() {
          return 'text';
        }
      },
    },
  };
});

const text = (id: number): any =>
  new (CometChat.TextMessage as any)(id, `m${id}`, 1_700_000_000 + id);
/** The connection drops and comes back, as the SDK reports it. */
function reconnect(): void {
  const connection = TestBed.inject(ConnectionStateService) as any;
  for (const value of [false, true]) {
    setConnection(connection, value);
    TestBed.tick();
  }
}
const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

/** AI assistant chat history, offline path: cached then server, newest first, no repeats (UIT-LIST-03). */
describe('CometChatAIAssistantChatHistory: two-phase', () => {
  let fake: OfflineSdkFake;

  beforeEach(() => {
    fake = installOfflineSdk();
  });
  afterEach(() => {
    fake.restore();
    vi.restoreAllMocks();
  });

  async function open(calls: Parameters<typeof twoPhaseRequest>[1]) {
    holder.request = twoPhaseRequest('Messages', calls);
    await TestBed.configureTestingModule({
      imports: [CometChatAIAssistantChatHistory],
    }).compileComponents();
    const fixture = TestBed.createComponent(CometChatAIAssistantChatHistory);
    fixture.componentRef.setInput('user', { getUid: () => 'agent' } as any);
    const comp = fixture.componentInstance;
    comp.ngOnInit();
    await flush();
    return comp;
  }
  const ids = (comp: CometChatAIAssistantChatHistory) => comp.messages().map(m => m.getId());

  it("shows the cached history, then the server's, newest first, with no repeats", async () => {
    const comp = await open([{ cached: [text(1), text(2)], server: [text(2), text(3)] }]);
    expect(ids(comp)).toEqual([3, 2]);
    expect(comp.isLoading()).toBe(false);
  });

  it('"load more" appends only older rows', async () => {
    const comp = await open([
      { server: [text(5), text(6)] },
      { cached: [text(4), text(5)], server: [text(4), text(3), text(5)] },
    ]);
    comp.fetchMessages();
    await flush();
    expect(ids(comp)).toEqual([6, 5, 4, 3]);
  });

  it('offline: keeps the cached history and shows no error', async () => {
    const comp = await open([{ cached: [text(1)], error: NOT_CONNECTED }]);
    expect(ids(comp)).toEqual([1]);
    expect(comp.hasError()).toBe(false);
  });

  it('D83: offline with nothing cached is the error view, and the history loads once by itself on reconnect', async () => {
    // The host's first change detection reads the history as well as the explicit ngOnInit.
    const comp = await open([{ error: NOT_CONNECTED }, { error: NOT_CONNECTED }, { server: [text(1)] }]);
    expect(comp.hasError()).toBe(true);
    expect(ids(comp)).toEqual([]);
    const reads = holder.request.fetchPrevious.mock.calls.length;
    reconnect();
    await vi.waitFor(() => expect(ids(comp)).toEqual([1]));
    expect(comp.hasError()).toBe(false);
    reconnect();
    await flush();
    expect(holder.request.fetchPrevious).toHaveBeenCalledTimes(reads + 1);
  });

  it('D83: a non-network error is not reloaded on reconnect', async () => {
    const comp = await open([{ error: { code: 'ERR_X' } }, { error: { code: 'ERR_X' } }, { server: [text(1)] }]);
    expect(comp.hasError()).toBe(true);
    const reads = holder.request.fetchPrevious.mock.calls.length;
    reconnect();
    await flush();
    expect(holder.request.fetchPrevious).toHaveBeenCalledTimes(reads);
  });

  it('a real error with nothing shown is the error state', async () => {
    // The host's first change detection reads the history as well as the explicit ngOnInit.
    const comp = await open([{ error: { code: 'ERR_X' } }, { error: { code: 'ERR_X' } }]);
    expect(comp.hasError()).toBe(true);
  });

  it('offline off: one plain read (P1)', async () => {
    fake.setEnabled(false);
    const comp = await open([{ server: [text(1)] }]);
    expect(holder.request.fetchPrevious).toHaveBeenCalledWith();
    expect(ids(comp)).toEqual([1]);
  });
});
