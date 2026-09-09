/**
 * CometChatPinnedMessages Component Tests
 *
 * Renders the panel against a fake PinSaveService rather than a live session,
 * so the behaviours under test are the panel's own: which conversation it
 * fetched for, what it does when that conversation changes, and which options
 * it offers.
 *
 * Several cases here pin down review findings that were live defects:
 *   - B1: a reused panel kept showing the previous conversation's pins
 *   - B2: load() merged into stale rows, so a reload appended across chats
 *   - SF4: Save/Unsave rendered even when the feature was unavailable
 *
 * @module components/cometchat-pinned-messages
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
import { CometChatPinnedMessagesComponent } from './cometchat-pinned-messages.component';
import { PinSaveService } from '../../services/pin-save.service';
import { CometChatPinSaveEvents } from '../../events/CometChatPinSaveEvents';
import { States } from '../../Enums/Enums';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

/** Pages returned by the SDK, keyed by the scope the panel asked for. */
const pagesByScope = new Map<string, any[]>();
let lastScope = '';
let fetchCount = 0;

function fakeMessage(
  id: number,
  text = `m${id}`,
  overrides: { pinnedAt?: number; pinnedBy?: string; receiverId?: string } = {}
): any {
  const base: Record<string, unknown> = {
    getId: () => id,
    getText: () => text,
    getType: () => 'text',
    getCategory: () => 'message',
    getSender: () => ({ getUid: () => 'someone', getName: () => 'Someone', getAvatar: () => '' }),
    getSentAt: () => 1_700_000_000,
    getReceiverId: () => overrides.receiverId ?? 'group-a',
    getPinnedAt: () => overrides.pinnedAt ?? 1_700_000_100,
    getPinnedBy: () => overrides.pinnedBy ?? 'someone',
    getSavedAt: () => undefined,
    isPinned: () => true,
    isSaved: () => false,
    getReactions: () => [],
    getParentMessageId: () => 0,
    getDeletedAt: () => undefined,
    getMetadata: () => ({}),
    getMentionedUsers: () => [],
  };

  // The message bubble reaches for a good part of BaseMessage. Answering the
  // rest with a harmless default keeps this spec about the PANEL rather than
  // about mirroring the SDK's surface, and a getter we do care about is still
  // declared explicitly above.
  return new Proxy(base, {
    get(target, prop) {
      if (prop in target) return target[prop as string];
      // Symbols (Symbol.toPrimitive and friends) are not accessors we stand in for.
      if (typeof prop !== 'string') return undefined;
      if (prop.startsWith('get')) return () => undefined;
      if (prop.startsWith('is') || prop.startsWith('has')) return () => false;
      return undefined;
    },
  });
}

/** Stands in for MessagesRequestBuilder/MessagesRequest, recording the scope. */
function installSdkFake(): void {
  (CometChat as any).MessagesRequestBuilder = class {
    private scope = '';
    setLimit() { return this; }
    setPinned() { return this; }
    setGUID(guid: string) { this.scope = `group:${guid}`; return this; }
    setUID(uid: string) { this.scope = `user:${uid}`; return this; }
    build() {
      const scope = this.scope;
      return {
        fetchPrevious: async () => {
          lastScope = scope;
          fetchCount++;
          return pagesByScope.get(scope) ?? [];
        },
      };
    }
  };
}

class FakePinSaveService {
  saveEnabled = true;
  run = vi.fn().mockResolvedValue(null);
  isSystemPin = vi.fn().mockReturnValue(false);
  isSaveEnabled = vi.fn(async () => this.saveEnabled);
  isPinEnabled = vi.fn(async () => true);
  isSupported = vi.fn().mockReturnValue(true);
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('CometChatPinnedMessagesComponent', () => {
  let fixture: ComponentFixture<CometChatPinnedMessagesComponent>;
  let component: CometChatPinnedMessagesComponent;
  let pinSave: FakePinSaveService;

  const groupA = { getGuid: () => 'group-a', getName: () => 'A', getOwner: () => 'me', getScope: () => 'admin' } as unknown as CometChat.Group;
  const groupB = { getGuid: () => 'group-b', getName: () => 'B', getOwner: () => 'me', getScope: () => 'admin' } as unknown as CometChat.Group;

  /** Let the initial load and the flag resolution settle. */
  async function settle(): Promise<void> {
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    pagesByScope.clear();
    pagesByScope.set('group:group-a', [fakeMessage(1), fakeMessage(2)]);
    pagesByScope.set('group:group-b', [fakeMessage(9)]);
    lastScope = '';
    fetchCount = 0;
    installSdkFake();

    pinSave = new FakePinSaveService();
    await TestBed.configureTestingModule({
      imports: [CometChatPinnedMessagesComponent],
      providers: [{ provide: PinSaveService, useValue: pinSave }],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatPinnedMessagesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture?.destroy();
  });

  describe('initial load', () => {
    it('fetches the group it was given', async () => {
      component.group = groupA;
      await settle();
      expect(lastScope).toBe('group:group-a');
      expect(component.messages().length).toBe(2);
    });

    it('fetches a one-to-one conversation by uid', async () => {
      component.user = { getUid: () => 'bob', getName: () => 'Bob' } as unknown as CometChat.User;
      await settle();
      expect(lastScope).toBe('user:bob');
    });

    it('reports empty when the conversation has no pins', async () => {
      pagesByScope.set('group:group-a', []);
      component.group = groupA;
      await settle();
      expect(component.state()).toBe(States.empty);
    });

    it('does not fetch when given neither a user nor a group', async () => {
      await settle();
      expect(fetchCount).toBe(0);
      expect(component.state()).toBe(States.empty);
    });
  });

  // B1 + B2 — the review blockers.
  describe('when the conversation changes', () => {
    it('refetches for the new conversation', async () => {
      component.group = groupA;
      await settle();
      expect(component.messages().length).toBe(2);

      component.group = groupB;
      component.ngOnChanges({ group: { currentValue: groupB, previousValue: groupA, firstChange: false, isFirstChange: () => false } });
      await settle();

      expect(lastScope).toBe('group:group-b');
    });

    it("REPLACES the previous conversation's rows rather than appending to them", async () => {
      // B2: load() merges by design, to catch a pin that lands mid-flight. A
      // reload must reset first, or one chat's pins pile onto another's.
      component.group = groupA;
      await settle();

      component.group = groupB;
      component.ngOnChanges({ group: { currentValue: groupB, previousValue: groupA, firstChange: false, isFirstChange: () => false } });
      await settle();

      expect(component.messages().map(m => m.getId())).toEqual([9]);
    });

    it('ignores a change that names the same conversation', async () => {
      // A host re-creating its Group object on every change-detection pass must
      // not send the panel into a refetch loop.
      component.group = groupA;
      await settle();
      const before = fetchCount;

      const sameGroupNewObject = { ...groupA, getGuid: () => 'group-a' } as unknown as CometChat.Group;
      component.group = sameGroupNewObject;
      component.ngOnChanges({ group: { currentValue: sameGroupNewObject, previousValue: groupA, firstChange: false, isFirstChange: () => false } });
      await settle();

      expect(fetchCount).toBe(before);
    });

    it('ignores changes to inputs other than user/group', async () => {
      component.group = groupA;
      await settle();
      const before = fetchCount;
      component.ngOnChanges({ hideCloseButton: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false } });
      await settle();
      expect(fetchCount).toBe(before);
    });
  });

  describe('retry', () => {
    it('refetches and does not duplicate the rows it already had', async () => {
      component.group = groupA;
      await settle();
      component.retry();
      await settle();
      expect(component.messages().map(m => m.getId())).toEqual([1, 2]);
    });
  });

  // SF4 — the capability gate.
  describe('Save/Unsave availability', () => {
    it('offers Save when the feature is enabled', async () => {
      component.group = groupA;
      await settle();
      const ids = component.optionsFor(fakeMessage(1)).map(o => o.id);
      expect(ids).toContain('saveMessage');
    });

    it('hides Save when the feature is unavailable', async () => {
      // Otherwise the option renders and pinSave.run() silently no-ops — a dead
      // control is worse than an absent one.
      pinSave.saveEnabled = false;
      component.group = groupA;
      await settle();
      const ids = component.optionsFor(fakeMessage(1)).map(o => o.id);
      expect(ids).not.toContain('saveMessage');
      expect(ids).not.toContain('unsaveMessage');
    });

    it('hides Save when the host asked it to be hidden', async () => {
      component.group = groupA;
      component.hideSaveMessageOption = true;
      await settle();
      expect(component.optionsFor(fakeMessage(1)).map(o => o.id)).not.toContain('saveMessage');
    });
  });

  describe('ordering', () => {
    it('shows the newest pin first, whatever order the page arrives in', async () => {
      // The server does not promise an order under `pinned=1`, and the panel is
      // a list of PINS — so the pin time decides, not the page.
      pagesByScope.set('group:group-a', [
        fakeMessage(1, 'oldest pin', { pinnedAt: 100 }),
        fakeMessage(2, 'newest pin', { pinnedAt: 300 }),
        fakeMessage(3, 'middle pin', { pinnedAt: 200 }),
      ]);
      component.group = groupA;
      await settle();

      expect(component.messages().map(m => m.getId())).toEqual([2, 3, 1]);
    });

    it('puts a pin that lands in realtime ABOVE the pins already there', async () => {
      pagesByScope.set('group:group-a', [fakeMessage(1, 'm1', { pinnedAt: 100 })]);
      component.group = groupA;
      await settle();

      CometChatPinSaveEvents.publishMessagePinned({
        message: fakeMessage(2, 'just pinned', { pinnedAt: 500 }),
      });
      await settle();

      expect(component.messages().map(m => m.getId())).toEqual([2, 1]);
    });

    it('leaves an older pin where it belongs instead of jumping it to the top', async () => {
      // A failed unpin restores the original pinnedAt and republishes. A blind
      // prepend would move the row to the top of a list nothing changed in.
      pagesByScope.set('group:group-a', [fakeMessage(1, 'm1', { pinnedAt: 300 })]);
      component.group = groupA;
      await settle();

      // A failed unpin withdraws the claim: the optimistic channel republishes
      // with `pinned: true`, which the panel reads as "still pinned".
      CometChatPinSaveEvents.publishMessagePinChanged({
        message: fakeMessage(2, 'reverted unpin', { pinnedAt: 100 }),
        pinned: true,
      });
      await settle();

      expect(component.messages().map(m => m.getId())).toEqual([1, 2]);
    });

    it('compares a millisecond timestamp against a second one correctly', async () => {
      // The optimistic pin is stamped in seconds. A server value in
      // milliseconds is ~1000x larger, so an unnormalised comparison would bury
      // the pin that just happened at the foot of the list.
      pagesByScope.set('group:group-a', [fakeMessage(1, 'm1', { pinnedAt: 1_700_000_000_000 })]);
      component.group = groupA;
      await settle();

      CometChatPinSaveEvents.publishMessagePinChanged({
        message: fakeMessage(2, 'just pinned', { pinnedAt: 1_700_000_500 }),
        pinned: true,
      });
      await settle();

      expect(component.messages().map(m => m.getId())).toEqual([2, 1]);
    });

    it('ignores a pin belonging to another conversation', async () => {
      component.group = groupA;
      await settle();
      const before = component.messages().length;

      CometChatPinSaveEvents.publishMessagePinned({
        message: fakeMessage(77, 'elsewhere', { receiverId: 'group-b' }),
      });
      await settle();

      expect(component.messages().length).toBe(before);
    });
  });

  describe('system pins', () => {
    it('offers no Unpin on a pin the app placed', async () => {
      // Nobody can lift a system pin from the client — the option would only
      // ever produce an error toast.
      pinSave.isSystemPin.mockReturnValue(true);
      component.group = groupA;
      await settle();

      expect(component.optionsFor(fakeMessage(1)).map(o => o.id)).not.toContain('unpinMessage');
    });

    it('still offers Unpin on an ordinary pin', async () => {
      component.group = groupA;
      await settle();

      expect(component.optionsFor(fakeMessage(1)).map(o => o.id)).toContain('unpinMessage');
    });
  });

  describe('row interaction', () => {
    it('emits the message when a row is clicked', async () => {
      component.group = groupA;
      await settle();
      const emitted: CometChat.BaseMessage[] = [];
      component.messageClick.subscribe(m => emitted.push(m));

      const message = fakeMessage(1);
      component.onRowClick(message, { target: document.createElement('div') } as unknown as Event);
      expect(emitted).toEqual([message]);
    });

    it('ignores a click that landed on a control inside the row', async () => {
      component.group = groupA;
      await settle();
      const emitted: CometChat.BaseMessage[] = [];
      component.messageClick.subscribe(m => emitted.push(m));

      const button = document.createElement('button');
      document.body.appendChild(button);
      component.onRowClick(fakeMessage(1), { target: button } as unknown as Event);
      expect(emitted).toEqual([]);
    });
  });

  describe('outputs', () => {
    it('emits closeClick', async () => {
      await settle();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);
      component.closeClick.emit();
      expect(spy).toHaveBeenCalled();
    });
  });
});
