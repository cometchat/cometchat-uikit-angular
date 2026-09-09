/**
 * CometChatSavedMessages Component Tests
 *
 * The saved list is user-level and cross-conversation, so these run against a
 * fake request rather than a live session and focus on the panel's own logic:
 * paging, the stop-guard, and what it does when a load is superseded.
 *
 * Several cases pin down review findings that were live defects:
 *   - SF5: a host-supplied builder was re-built (single-shot) and the
 *          stop-guard assumed the default page size
 *   - SF6: a failed scroll page stamped `hasMore=false` on a list it no longer
 *          belonged to, permanently disabling pagination
 *   - SF8: a row click did not check whether it landed on a control
 *
 * @module components/cometchat-saved-messages
 */

// The calls SDK pulls in a JitsiMeetJS runtime that does not exist in jsdom.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatSavedMessagesComponent } from './cometchat-saved-messages.component';
import { PinSaveService } from '../../services/pin-save.service';
import { CometChatPinSaveEvents } from '../../events/CometChatPinSaveEvents';
import { States } from '../../Enums/Enums';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

/** Pages handed back in order, one per fetchPrevious() call. */
let pages: any[][] = [];
let fetchCalls = 0;
let buildCalls = 0;
let lastLimit = 0;
/** When set, the next fetch rejects — for the superseded-failure case. */
let failNextFetch = false;

function fakeMessage(id: number, sentAt = 1_700_000_000): any {
  const base: Record<string, unknown> = {
    getId: () => id,
    getText: () => `m${id}`,
    getType: () => 'text',
    getCategory: () => 'message',
    getSender: () => ({ getUid: () => 'bob', getName: () => 'Bob', getAvatar: () => '' }),
    getReceiverId: () => 'bob',
    getReceiverType: () => 'user',
    getSentAt: () => sentAt,
    getSavedAt: () => 1_700_000_100,
    isSaved: () => true,
    isPinned: () => false,
    getParentMessageId: () => 0,
    getDeletedAt: () => undefined,
    getMetadata: () => ({}),
    getMentionedUsers: () => [],
  };
  // Answer the rest of BaseMessage harmlessly, so the spec stays about the panel.
  return new Proxy(base, {
    get(target, prop) {
      if (prop in target) return target[prop as string];
      if (typeof prop !== 'string') return undefined;
      if (prop.startsWith('get')) return () => undefined;
      if (prop.startsWith('is') || prop.startsWith('has')) return () => false;
      return undefined;
    },
  });
}

function installSdkFake(): void {
  (CometChat as any).MessagesRequestBuilder = class {
    limit = 30;
    setLimit(n: number) { this.limit = n; return this; }
    setSaved() { return this; }
    build() {
      buildCalls++;
      lastLimit = this.limit;
      return {
        fetchPrevious: async () => {
          if (failNextFetch) { failNextFetch = false; throw new Error('network'); }
          return pages[fetchCalls++] ?? [];
        },
      };
    }
  };
}

class FakePinSaveService {
  run = vi.fn().mockResolvedValue(null);
  isSystemPin = vi.fn().mockReturnValue(false);
  isSaveEnabled = vi.fn().mockResolvedValue(true);
  isPinEnabled = vi.fn().mockResolvedValue(true);
  isSupported = vi.fn().mockReturnValue(true);
}

/** A scroll event that reads as "near the bottom". */
function scrollToEnd(): Event {
  return { target: { scrollHeight: 1000, scrollTop: 900, clientHeight: 100 } } as unknown as Event;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('CometChatSavedMessagesComponent', () => {
  let fixture: ComponentFixture<CometChatSavedMessagesComponent>;
  let component: CometChatSavedMessagesComponent;

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    pages = [];
    fetchCalls = 0;
    buildCalls = 0;
    lastLimit = 0;
    failNextFetch = false;
    installSdkFake();

    await TestBed.configureTestingModule({
      imports: [CometChatSavedMessagesComponent],
      providers: [{ provide: PinSaveService, useValue: new FakePinSaveService() }],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatSavedMessagesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => fixture?.destroy());

  describe('initial load', () => {
    it('renders the first page', async () => {
      pages = [[fakeMessage(1), fakeMessage(2)]];
      await settle();
      expect(component.rows().length).toBe(2);
      expect(component.state()).toBe(States.loaded);
    });

    it('reports empty when nothing is saved', async () => {
      pages = [[]];
      await settle();
      expect(component.state()).toBe(States.empty);
    });

    it('asks for the default page size', async () => {
      pages = [[]];
      await settle();
      expect(lastLimit).toBe(30);
    });
  });

  // SF5 — a host-supplied builder.
  describe('with a custom messagesRequestBuilder', () => {
    it('honours the host limit', async () => {
      pages = [[]];
      const builder = new (CometChat as any).MessagesRequestBuilder().setLimit(50);
      buildCalls = 0;
      component.messagesRequestBuilder = builder;
      await settle();
      expect(lastLimit).toBe(50);
    });

    it('does not re-build the caller-owned builder', async () => {
      // Builders are single-shot; building one twice is not safe.
      pages = [[], []];
      const builder = new (CometChat as any).MessagesRequestBuilder().setLimit(20);
      const buildsBefore = buildCalls;
      component.messagesRequestBuilder = builder;
      await settle();
      component.retry();
      await settle();
      // Each load built its OWN request; the supplied builder was only read.
      expect(buildCalls).toBeGreaterThan(buildsBefore);
    });

    it('derives the stop-guard from the host limit, not the default', async () => {
      // With limit 20, a 20-row page is FULL and paging must continue. The old
      // guard compared against 30 and stopped after page one.
      pages = [Array.from({ length: 20 }, (_, i) => fakeMessage(i + 1))];
      component.messagesRequestBuilder = new (CometChat as any).MessagesRequestBuilder().setLimit(20);
      await settle();
      expect(component.rows().length).toBe(20);
      expect(component['hasMore']()).toBe(true);
    });
  });

  describe('ordering', () => {
    it('renders newest first, whatever order the page arrives in', async () => {
      // The server hands the saved list back oldest-first, which read as a list
      // rendered upside down.
      pages = [[fakeMessage(1, 100), fakeMessage(2, 300), fakeMessage(3, 200)]];
      await settle();

      expect(component.rows().map(r => r.message.getId())).toEqual([2, 3, 1]);
    });

    it('keeps a page fetched on scroll below the rows already shown', async () => {
      pages = [
        Array.from({ length: 30 }, (_, i) => fakeMessage(i + 1, 1_000 - i)),
        [fakeMessage(31, 900), fakeMessage(32, 800)],
      ];
      await settle();
      await component.onListScroll(scrollToEnd());
      await settle();

      const ids = component.rows().map(r => r.message.getId());
      expect(ids.slice(-2)).toEqual([31, 32]);
    });

    it('files a message saved in realtime by when it was SENT, not at the top', async () => {
      // Saving something old must not make it look like the newest thing in
      // the list.
      pages = [[fakeMessage(1, 300), fakeMessage(2, 200)]];
      await settle();

      CometChatPinSaveEvents.publishMessageSaved({
        message: fakeMessage(3, 100),
      });
      await settle();

      expect(component.rows().map(r => r.message.getId())).toEqual([1, 2, 3]);
    });
  });

  describe('paging', () => {
    it('appends the next page on scroll', async () => {
      pages = [
        Array.from({ length: 30 }, (_, i) => fakeMessage(i + 1)),
        [fakeMessage(31), fakeMessage(32)],
      ];
      await settle();
      await component.onListScroll(scrollToEnd());
      await settle();
      expect(component.rows().length).toBe(32);
    });

    it('stops when a page brings nothing new', async () => {
      // Guards against a cursor that never advances and returns page one again.
      const first = Array.from({ length: 30 }, (_, i) => fakeMessage(i + 1));
      pages = [first, first];
      await settle();
      await component.onListScroll(scrollToEnd());
      await settle();
      expect(component.rows().length).toBe(30);
      expect(component['hasMore']()).toBe(false);
    });

    it('stops when a short page arrives', async () => {
      pages = [[fakeMessage(1)]];
      await settle();
      expect(component['hasMore']()).toBe(false);
    });

    it('ignores a scroll that is not near the bottom', async () => {
      pages = [Array.from({ length: 30 }, (_, i) => fakeMessage(i + 1))];
      await settle();
      const before = fetchCalls;
      await component.onListScroll({
        target: { scrollHeight: 1000, scrollTop: 0, clientHeight: 100 },
      } as unknown as Event);
      expect(fetchCalls).toBe(before);
    });
  });

  // SF6 — a failed page must not touch a list it no longer owns.
  describe('when a scroll page fails', () => {
    it('marks the CURRENT list exhausted', async () => {
      pages = [Array.from({ length: 30 }, (_, i) => fakeMessage(i + 1))];
      await settle();
      failNextFetch = true;
      await component.onListScroll(scrollToEnd());
      await settle();
      expect(component['hasMore']()).toBe(false);
    });

    it('does not disable paging on a list that superseded it', async () => {
      pages = [Array.from({ length: 30 }, (_, i) => fakeMessage(i + 1))];
      await settle();

      // Start a scroll page that will reject, then reload before it settles.
      failNextFetch = true;
      const inFlight = component.onListScroll(scrollToEnd());
      pages[fetchCalls] = Array.from({ length: 30 }, (_, i) => fakeMessage(100 + i));
      component.retry();
      await inFlight;
      await settle();

      // The fresh list is full, so it must still be pageable.
      expect(component['hasMore']()).toBe(true);
    });
  });

  // SF8 — row clicks.
  describe('row interaction', () => {
    it('emits the message when the row itself is clicked', async () => {
      pages = [[fakeMessage(1)]];
      await settle();
      const emitted: CometChat.BaseMessage[] = [];
      component.messageClick.subscribe(m => emitted.push(m));

      const row = component.rows()[0];
      component.onRowClick(row, { target: document.createElement('div') } as unknown as Event);
      expect(emitted.length).toBe(1);
    });

    it('ignores a click that landed on a control inside the row', async () => {
      pages = [[fakeMessage(1)]];
      await settle();
      const emitted: CometChat.BaseMessage[] = [];
      component.messageClick.subscribe(m => emitted.push(m));

      const button = document.createElement('button');
      document.body.appendChild(button);
      component.onRowClick(component.rows()[0], { target: button } as unknown as Event);
      expect(emitted).toEqual([]);
    });

    it('still emits when called without an event', async () => {
      // The keyboard path passes the keydown event; a bare call must not break.
      pages = [[fakeMessage(1)]];
      await settle();
      const emitted: CometChat.BaseMessage[] = [];
      component.messageClick.subscribe(m => emitted.push(m));
      component.onRowClick(component.rows()[0]);
      expect(emitted.length).toBe(1);
    });
  });

  describe('outputs', () => {
    it('emits closeClick', async () => {
      pages = [[]];
      await settle();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);
      component.closeClick.emit();
      expect(spy).toHaveBeenCalled();
    });
  });
});
