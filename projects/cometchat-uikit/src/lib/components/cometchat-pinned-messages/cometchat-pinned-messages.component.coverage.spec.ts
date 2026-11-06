/**
 * CometChatPinnedMessages — behaviour not reached by the main spec
 *
 * The companion spec covers fetching and ordering. This one covers the rest of
 * the panel: the keyboard layer, rendered paging, the realtime handlers that
 * keep a row's CONTENT current (edit, delete, reaction, save), the option menu
 * matrix, and the confirmation flow behind unpin/unsave.
 *
 * Almost everything is driven by calling the method or publishing the event
 * rather than by rendering. Rendering a row pulls in the real message bubble
 * and its children, which would make this spec about stubbing the SDK instead
 * of about the panel — and the panel's logic is reachable directly.
 *
 * @module components/cometchat-pinned-messages/coverage
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
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import { CometChatUIEvents } from '../../events/CometChatUIEvents';
import { CometChatUIKit } from '../../cometchat-uikit';
import { CometChatUIKitConstants } from '../../constants';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { ContextMenuItem } from '../base-elements/cometchat-context-menu/cometchat-context-menu.component';
import { States } from '../../Enums/Enums';

const OPTION = CometChatUIKitConstants.MessageOption;

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

interface FakeOptions {
  id?: number | string;
  text?: string;
  type?: string;
  category?: string;
  /** `null` stands for a message the SDK handed over with no sender. */
  senderUid?: string | null;
  senderName?: string;
  senderAvatar?: string;
  pinnedAt?: number;
  pinnedBy?: string;
  savedAt?: number;
  receiverId?: string;
  parentMessageId?: number;
  deletedAt?: number;
  /** Accessors to leave genuinely absent, for the panel's optional-call paths. */
  without?: string[];
}

/**
 * A message-shaped stand-in whose pin/save attributes are MUTABLE.
 *
 * The panel's update paths write through `setPinnedAt`/`setSavedAt` and then the
 * row reads its indicators back off the same object, so a fake with frozen
 * getters would hide whether the write happened at all.
 */
function fakeMessage(options: FakeOptions = {}): any {
  const id = options.id ?? 1;
  const state = {
    pinnedAt: 'pinnedAt' in options ? options.pinnedAt : 1_700_000_100,
    pinnedBy: 'pinnedBy' in options ? options.pinnedBy : 'someone',
    savedAt: options.savedAt,
  };
  const senderUid = 'senderUid' in options ? options.senderUid : 'someone';
  const sender =
    senderUid === null
      ? null
      : {
          getUid: () => senderUid,
          getName: () => options.senderName,
          getAvatar: () => options.senderAvatar,
        };

  const base: Record<string, unknown> = {
    getId: () => id,
    getText: () => ('text' in options ? options.text : `m${id}`),
    getType: () => options.type ?? 'text',
    getCategory: () => options.category ?? 'message',
    getSender: () => sender,
    getSentAt: () => 1_700_000_000,
    getReceiverId: () => options.receiverId ?? 'group-a',
    getParentMessageId: () => options.parentMessageId ?? 0,
    getDeletedAt: () => options.deletedAt,
    getPinnedAt: () => state.pinnedAt,
    getPinnedBy: () => state.pinnedBy,
    getSavedAt: () => state.savedAt,
    setPinnedAt: (value: number | undefined) => {
      state.pinnedAt = value;
    },
    setPinnedBy: (value: string | undefined) => {
      state.pinnedBy = value;
    },
    setSavedAt: (value: number | undefined) => {
      state.savedAt = value;
    },
    // Presence IS the boolean, per the pin/save contract.
    isPinned: () => state.pinnedAt !== undefined,
    isSaved: () => state.savedAt !== undefined,
    getReactions: () => [],
    getMetadata: () => ({}),
    getMentionedUsers: () => [],
  };

  const absent = new Set(options.without ?? []);
  for (const name of absent) delete base[name];

  // The bubble reaches for a good part of BaseMessage; a harmless default for
  // the rest keeps this spec about the panel.
  return new Proxy(base, {
    get(target, prop) {
      if (typeof prop !== 'string') return undefined;
      if (absent.has(prop)) return undefined;
      if (prop in target) return target[prop];
      if (prop.startsWith('get')) return () => undefined;
      if (prop.startsWith('is') || prop.startsWith('has')) return () => false;
      return undefined;
    },
  });
}

/** Pages the fake SDK hands back, keyed by the scope the panel asked for. */
const pagesByScope = new Map<string, any[]>();
const fetchLog: string[] = [];

/** Swapped by tests that need to hold a page in flight. */
let fetchImpl: (scope: string) => Promise<any[]>;

function defaultFetch(scope: string): Promise<any[]> {
  return Promise.resolve(pagesByScope.get(scope) ?? []);
}

function installSdkFake(): void {
  (CometChat as any).MessagesRequestBuilder = class {
    private scope = '';
    setLimit() {
      return this;
    }
    setPinned() {
      return this;
    }
    setGUID(guid: string) {
      this.scope = `group:${guid}`;
      return this;
    }
    setUID(uid: string) {
      this.scope = `user:${uid}`;
      return this;
    }
    build() {
      const scope = this.scope;
      return {
        fetchPrevious: () => {
          fetchLog.push(scope);
          return fetchImpl(scope);
        },
      };
    }
  };
}

class FakePinSaveService {
  saveEnabled: boolean | Promise<boolean> = true;
  run = vi.fn().mockResolvedValue(null);
  isSystemPin = vi.fn().mockReturnValue(false);
  isSaveEnabled = vi.fn(() => Promise.resolve(this.saveEnabled));
  isPinEnabled = vi.fn(async () => true);
  isSupported = vi.fn().mockReturnValue(true);
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('CometChatPinnedMessagesComponent — panel behaviour', () => {
  let fixture: ComponentFixture<CometChatPinnedMessagesComponent>;
  let component: CometChatPinnedMessagesComponent;
  let pinSave: FakePinSaveService;

  let closeClicks: number;
  let messageClicks: any[];
  let errors: CometChat.CometChatException[];
  let optionClicks: { option: ContextMenuItem; message: CometChat.BaseMessage }[];
  let openedChats: any[];

  const groupA = { getGuid: () => 'group-a', getName: () => 'A' } as unknown as CometChat.Group;
  const groupB = { getGuid: () => 'group-b', getName: () => 'B' } as unknown as CometChat.Group;
  const userBob = { getUid: () => 'bob', getName: () => 'Bob' } as unknown as CometChat.User;
  const loggedInMe = { getUid: () => 'me', getName: () => 'Me' } as unknown as CometChat.User;

  /** Let the initial load and the save-capability lookup settle. */
  async function settle(): Promise<void> {
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
  }

  /**
   * Build the panel. Inputs are assigned before the first change detection,
   * because assigning them afterwards throws NG0100.
   */
  async function create(inputs: Partial<CometChatPinnedMessagesComponent> = {}): Promise<void> {
    fixture = TestBed.createComponent(CometChatPinnedMessagesComponent);
    component = fixture.componentInstance;
    Object.assign(component, inputs);

    // Subscribed before the first load so an error it emits is recorded.
    component.closeClick.subscribe(() => closeClicks++);
    component.messageClick.subscribe(m => messageClicks.push(m));
    component.error.subscribe(e => errors.push(e));
    component.messageOptionClick.subscribe(e => optionClicks.push(e));

    await settle();
  }

  /** A host swapping the panel onto another conversation. */
  function switchTo(group: CometChat.Group): void {
    component.group = group;
    component.ngOnChanges({
      group: {
        currentValue: group,
        previousValue: undefined,
        firstChange: false,
        isFirstChange: () => false,
      },
    });
  }

  /** The panel renders nothing for an empty list, so rows can be seeded directly. */
  function seed(...messages: any[]): void {
    component.messages.set(messages);
    component.state.set(messages.length ? States.loaded : States.empty);
  }

  function scrollEvent(scrollHeight: number, scrollTop: number, clientHeight: number): Event {
    return { target: { scrollHeight, scrollTop, clientHeight } } as unknown as Event;
  }

  function keydown(key: string): KeyboardEvent {
    return { key, preventDefault: vi.fn() } as unknown as KeyboardEvent;
  }

  beforeEach(async () => {
    pagesByScope.clear();
    pagesByScope.set('group:group-a', [fakeMessage({ id: 1 }), fakeMessage({ id: 2 })]);
    pagesByScope.set('group:group-b', [fakeMessage({ id: 9, receiverId: 'group-b' })]);
    fetchLog.length = 0;
    fetchImpl = defaultFetch;
    installSdkFake();

    closeClicks = 0;
    messageClicks = [];
    errors = [];
    optionClicks = [];
    openedChats = [];

    pinSave = new FakePinSaveService();
    await TestBed.configureTestingModule({
      imports: [CometChatPinnedMessagesComponent],
      providers: [{ provide: PinSaveService, useValue: pinSave }],
    }).compileComponents();
  });

  afterEach(() => {
    // The event subjects are static: a surviving fixture keeps handling events
    // published by later tests.
    fixture?.destroy();
    vi.restoreAllMocks();
  });

  describe('rendered paging', () => {
    const many = (count: number) =>
      Array.from({ length: count }, (_, i) => fakeMessage({ id: i + 1, pinnedAt: 1000 - i }));

    it('renders only the first page and reports that more is held back', async () => {
      await create();
      seed(...many(35));

      expect(component.visibleMessages().map(m => m.getId())).toHaveLength(30);
      expect(component.visibleMessages()[29].getId()).toBe(30);
      expect(component.hasMoreToShow()).toBe(true);
    });

    it('says nothing is held back when the whole list already fits', async () => {
      await create();
      seed(...many(4));

      expect(component.hasMoreToShow()).toBe(false);
      expect(component.visibleMessages()).toHaveLength(4);
    });

    it('reveals the next page once the reader is near the end', async () => {
      await create();
      seed(...many(35));

      component.onListScroll(scrollEvent(3000, 2750, 300));

      expect(component.visibleMessages()).toHaveLength(35);
      expect(component.visibleMessages()[34].getId()).toBe(35);
      expect(component.hasMoreToShow()).toBe(false);
    });

    it('holds the next page back while the reader is still far from the end', async () => {
      await create();
      seed(...many(35));

      component.onListScroll(scrollEvent(3000, 100, 300));

      expect(component.visibleMessages()).toHaveLength(30);
      expect(component.hasMoreToShow()).toBe(true);
    });

    it('does not keep growing the window once everything is on screen', async () => {
      await create();
      seed(...many(4));

      component.onListScroll(scrollEvent(400, 300, 100));

      expect((component as any).visibleCount()).toBe(30);
    });

    it('starts the window again from one page on a conversation switch', async () => {
      pagesByScope.set('group:group-a', many(35));
      await create({ group: groupA });
      component.onListScroll(scrollEvent(3000, 2900, 300));
      expect((component as any).visibleCount()).toBe(60);

      switchTo(groupB);
      await settle();

      expect((component as any).visibleCount()).toBe(30);
    });
  });

  describe('Escape dismisses the topmost layer', () => {
    it('closes the Information overlay and leaves the panel open', async () => {
      await create();
      component.messageInfoTarget.set(fakeMessage({ id: 1 }));
      const event = keydown('Escape');

      component.onPanelKeydown(event);

      expect(component.messageInfoTarget()).toBeNull();
      expect(closeClicks).toBe(0);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('cancels a pending confirmation and leaves the panel open', async () => {
      await create();
      component.pendingPinSave.set({ action: 'unpin', message: fakeMessage({ id: 1 }) });

      component.onPanelKeydown(keydown('Escape'));

      expect(component.pendingPinSave()).toBeNull();
      expect(closeClicks).toBe(0);
    });

    it('closes the panel when nothing is layered over it', async () => {
      await create();

      component.onPanelKeydown(keydown('Escape'));

      expect(closeClicks).toBe(1);
    });

    it('leaves every other key to the panel', async () => {
      await create();
      component.pendingPinSave.set({ action: 'unpin', message: fakeMessage({ id: 1 }) });
      const event = keydown('Enter');

      component.onPanelKeydown(event);

      expect(closeClicks).toBe(0);
      expect(component.pendingPinSave()).not.toBeNull();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('the save capability lookup', () => {
    it('withholds Save when the service reports saving is off for this app', async () => {
      vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(loggedInMe);
      pinSave.saveEnabled = false;
      await create({ group: groupA });

      const ids = component.optionsFor(fakeMessage({ id: 1, senderUid: 'bob' })).map(o => o.id);
      expect(ids).not.toContain(OPTION.saveMessage);
      expect(ids).not.toContain(OPTION.unsaveMessage);
      // The panel's own action is unaffected — only Save is gated on the app.
      expect(ids).toContain(OPTION.unpinMessage);
    });

    it('withholds Save when the lookup fails rather than offering a dead control', async () => {
      pinSave.isSaveEnabled = vi.fn(async () => {
        throw new Error('no answer');
      });
      await create({ group: groupA });

      const ids = component.optionsFor(fakeMessage({ id: 1 })).map(o => o.id);
      expect(ids).not.toContain(OPTION.saveMessage);
      expect(ids).toContain(OPTION.unpinMessage);
    });
  });

  describe('a conversation the panel cannot identify', () => {
    it('reads no id off an object with neither accessor, so it cannot refetch forever', async () => {
      // A host may hand over a plain object. A wrong answer here means either a
      // missed refetch or an endless one.
      vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      await create({ group: groupA });
      expect((component as any).currentScope()).toBe('|group:group-a');
      expect(fetchLog).toEqual(['group:group-a']);

      const mysteryOne = { getName: () => 'one' } as unknown as CometChat.Group;
      const mysteryTwo = { getName: () => 'two' } as unknown as CometChat.Group;
      component.group = mysteryOne;
      expect((component as any).currentScope()).toBe('|');

      // Leaving a real conversation IS a change, so that one reloads — and the
      // attempt surfaces, because there is no id to ask the server for.
      switchTo(mysteryOne);
      await settle();
      expect(component.state()).toBe(States.error);
      expect(errors).toHaveLength(1);

      // …but swapping one unrecognisable object for another is not a change, so
      // nothing is retried and no second failure reaches the host.
      switchTo(mysteryTwo);
      await settle();
      expect(errors).toHaveLength(1);
      expect(fetchLog).toEqual(['group:group-a']);
    });
  });

  describe('a load that outlives its conversation', () => {
    it('drops a page that lands after the panel moved on', async () => {
      let releaseA!: (page: any[]) => void;
      fetchImpl = scope =>
        scope === 'group:group-a'
          ? new Promise<any[]>(resolve => {
              releaseA = resolve;
            })
          : defaultFetch(scope);

      await create({ group: groupA });
      switchTo(groupB);
      await settle();
      expect(component.messages().map(m => m.getId())).toEqual([9]);

      releaseA([fakeMessage({ id: 1 }), fakeMessage({ id: 2 })]);
      await settle();

      expect(component.messages().map(m => m.getId())).toEqual([9]);
    });

    it('does not surface a failure from a load the panel moved on from', async () => {
      let failA!: (err: unknown) => void;
      fetchImpl = scope =>
        scope === 'group:group-a'
          ? new Promise<any[]>((_resolve, reject) => {
              failA = reject;
            })
          : defaultFetch(scope);

      await create({ group: groupA });
      switchTo(groupB);
      await settle();

      failA({ code: 'ERR_SOMETHING' });
      await settle();

      expect(errors).toEqual([]);
      expect(component.state()).toBe(States.loaded);
    });

    it('keeps a pin that landed while the first page was still in flight', async () => {
      let release!: (page: any[]) => void;
      fetchImpl = () =>
        new Promise<any[]>(resolve => {
          release = resolve;
        });

      await create({ group: groupA });
      CometChatPinSaveEvents.publishMessagePinned({
        message: fakeMessage({ id: 5, pinnedAt: 500 }),
      });

      // The same pin is also inside the page that then arrives.
      release([fakeMessage({ id: 5, pinnedAt: 500 }), fakeMessage({ id: 1, pinnedAt: 100 })]);
      await settle();

      expect(component.messages().map(m => m.getId())).toEqual([5, 1]);
    });
  });

  describe('a load that fails', () => {
    it('shows the error state, emits the exception and logs it', async () => {
      const logged = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      const failure = { code: 'ERR_NO_NETWORK' } as unknown as CometChat.CometChatException;
      fetchImpl = async () => {
        throw failure;
      };

      await create({ group: groupA });

      expect(component.state()).toBe(States.error);
      expect(errors).toEqual([failure]);
      expect(logged).toHaveBeenCalledWith(
        'CometChatPinnedMessages',
        'Failed to load pinned messages:',
        failure
      );
    });

    it('clears the error and reloads on retry', async () => {
      vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      const failure = { code: 'ERR' };
      fetchImpl = async () => {
        throw failure;
      };
      await create({ group: groupA });
      expect(component.state()).toBe(States.error);

      fetchImpl = defaultFetch;
      component.retry();
      await settle();

      expect(component.state()).toBe(States.loaded);
      expect(component.messages().map(m => m.getId())).toEqual([1, 2]);
    });
  });

  describe('an unpin somewhere else in the conversation', () => {
    it('drops the row and falls back to the empty state when it was the last', async () => {
      await create();
      seed(fakeMessage({ id: 1 }));

      CometChatPinSaveEvents.publishMessageUnpinned({ message: fakeMessage({ id: 1 }) });

      expect(component.messages()).toEqual([]);
      expect(component.state()).toBe(States.empty);
    });

    it('keeps the list loaded while other pins remain', async () => {
      await create();
      seed(fakeMessage({ id: 1 }), fakeMessage({ id: 2 }));

      CometChatPinSaveEvents.publishMessageUnpinned({ message: fakeMessage({ id: 1 }) });

      expect(component.messages().map(m => m.getId())).toEqual([2]);
      expect(component.state()).toBe(States.loaded);
    });

    it('ignores an unpin for a message this panel does not hold', async () => {
      await create();
      seed(fakeMessage({ id: 1 }));

      CometChatPinSaveEvents.publishMessageUnpinned({ message: fakeMessage({ id: 77 }) });

      expect(component.messages().map(m => m.getId())).toEqual([1]);
      expect(component.state()).toBe(States.loaded);
    });
  });

  describe('a save or unsave of a pinned message', () => {
    it('patches the row in place, keeping the object the bubble was given', async () => {
      await create();
      const row = fakeMessage({ id: 1, savedAt: undefined });
      seed(row);
      const listBefore = component.messages();

      CometChatPinSaveEvents.publishMessageSaved({
        message: fakeMessage({ id: 1, savedAt: 1_700_000_900 }),
      });

      // Same message object — a save payload carries no quoted message, so
      // swapping it in would erase a reply preview the row had.
      expect(component.messages()[0]).toBe(row);
      expect(row.isSaved()).toBe(true);
      expect(row.getSavedAt()).toBe(1_700_000_900);
      // …but a new array, or Angular has no reason to re-read the row.
      expect(component.messages()).not.toBe(listBefore);
    });

    it('clears the bookmark again on an unsave without dropping the row', async () => {
      await create();
      const row = fakeMessage({ id: 1, savedAt: 1_700_000_900 });
      seed(row);

      CometChatPinSaveEvents.publishMessageUnsaved({
        message: fakeMessage({ id: 1, savedAt: undefined }),
      });

      expect(component.messages()).toHaveLength(1);
      expect(row.isSaved()).toBe(false);
    });
  });

  describe('an edit of a pinned message', () => {
    it('swaps in the edited copy and keeps the pin that put the row here', async () => {
      await create();
      const original = fakeMessage({ id: 1, text: 'before', pinnedAt: 4242, pinnedBy: 'someone' });
      seed(original);

      // An edit payload describes the edit and makes no promise about pin state.
      const edited = fakeMessage({ id: 1, text: 'after', pinnedAt: undefined, pinnedBy: undefined });
      CometChatMessageEvents.ccMessageEdited.next({ message: edited } as any);

      const row = component.messages()[0];
      expect(row).toBe(edited);
      expect(row.getType()).toBe('text');
      expect((row as CometChat.TextMessage).getText()).toBe('after');
      expect(row.isPinned()).toBe(true);
      expect(row.getPinnedAt()).toBe(4242);
    });

    it('ignores an event with no message on it, or one the SDK cannot identify', async () => {
      await create();
      const row = fakeMessage({ id: 1 });
      seed(row);

      CometChatMessageEvents.ccMessageEdited.next({} as any);
      CometChatMessageEvents.ccMessageSent.next({ message: fakeMessage({ without: ['getId'] }) } as any);

      expect(component.messages()).toEqual([row]);
    });

    it('does not adopt a message that is not pinned here', async () => {
      await create();
      const row = fakeMessage({ id: 1 });
      seed(row);

      CometChatMessageEvents.ccMessageSent.next({ message: fakeMessage({ id: 404 }) } as any);

      expect(component.messages()).toEqual([row]);
    });
  });

  describe('a delete', () => {
    it('drops the deleted row', async () => {
      await create();
      seed(fakeMessage({ id: 1 }), fakeMessage({ id: 2 }));

      CometChatMessageEvents.ccMessageDeleted.next(fakeMessage({ id: 1 }));

      expect(component.messages().map(m => m.getId())).toEqual([2]);
      expect(component.state()).toBe(States.loaded);
    });

    it('also drops a pinned reply orphaned by its parent', async () => {
      await create();
      seed(
        fakeMessage({ id: 1 }),
        fakeMessage({ id: 2, parentMessageId: 1 }),
        fakeMessage({ id: 3, parentMessageId: 99 }),
        fakeMessage({ id: 4, without: ['getParentMessageId'] })
      );

      CometChatMessageEvents.ccMessageDeleted.next(fakeMessage({ id: 1 }));

      // The reply to the deleted parent goes; a reply to something else, and a
      // message that cannot even be asked, stay.
      expect(component.messages().map(m => m.getId())).toEqual([3, 4]);
    });

    it('falls back to the empty state when the deleted row was the last', async () => {
      await create();
      seed(fakeMessage({ id: 1 }));

      CometChatMessageEvents.ccMessageDeleted.next(fakeMessage({ id: 1 }));

      expect(component.state()).toBe(States.empty);
    });

    it('ignores a delete that names no message', async () => {
      await create();
      const row = fakeMessage({ id: 1 });
      seed(row);

      CometChatMessageEvents.ccMessageDeleted.next(undefined as any);
      CometChatMessageEvents.ccMessageDeleted.next(fakeMessage({ without: ['getId'] }));
      CometChatMessageEvents.ccMessageDeleted.next(fakeMessage({ id: 0 }));

      expect(component.messages()).toEqual([row]);
    });
  });

  describe('a reaction on a pinned message', () => {
    function reactionEvent(messageId: number | string): CometChat.ReactionEvent {
      return {
        getReaction: () => ({ getMessageId: () => messageId, getReaction: () => '👍' }),
      } as unknown as CometChat.ReactionEvent;
    }

    beforeEach(() => {
      (CometChat as any).CometChatHelper = { updateMessageWithReactionInfo: vi.fn() };
    });

    it('redraws the row with the reaction, matching ids across string and number', async () => {
      await create();
      // The SDK hands back a numeric id in some payloads and a string in others.
      const row = fakeMessage({ id: '1' });
      seed(row);
      const withReaction = fakeMessage({ id: '1', text: 'reacted' });
      (CometChat as any).CometChatHelper.updateMessageWithReactionInfo = vi
        .fn()
        .mockReturnValue(withReaction);

      CometChatMessageEvents.onMessageReactionAdded.next(reactionEvent(1));

      expect(component.messages()[0]).toBe(withReaction);
      expect(
        (CometChat as any).CometChatHelper.updateMessageWithReactionInfo
      ).toHaveBeenCalledWith(row, expect.anything(), CometChat.REACTION_ACTION.REACTION_ADDED);
    });

    it('tells the SDK a removal is a removal', async () => {
      await create();
      seed(fakeMessage({ id: 1 }));
      const updated = fakeMessage({ id: 1 });
      (CometChat as any).CometChatHelper.updateMessageWithReactionInfo = vi
        .fn()
        .mockReturnValue(updated);

      CometChatMessageEvents.onMessageReactionRemoved.next(reactionEvent(1));

      expect(
        (CometChat as any).CometChatHelper.updateMessageWithReactionInfo
      ).toHaveBeenCalledWith(expect.anything(), expect.anything(), CometChat.REACTION_ACTION.REACTION_REMOVED);
      expect(component.messages()[0]).toBe(updated);
    });

    it('ignores a reaction for a message that is not pinned here', async () => {
      await create();
      const row = fakeMessage({ id: 1 });
      seed(row);

      CometChatMessageEvents.onMessageReactionAdded.next(reactionEvent(404));

      expect((CometChat as any).CometChatHelper.updateMessageWithReactionInfo).not.toHaveBeenCalled();
      expect(component.messages()).toEqual([row]);
    });

    it('ignores an event with no reaction on it', async () => {
      await create();
      const row = fakeMessage({ id: 1 });
      seed(row);

      CometChatMessageEvents.onMessageReactionAdded.next(undefined as any);
      CometChatMessageEvents.onMessageReactionAdded.next({} as any);
      CometChatMessageEvents.onMessageReactionAdded.next({
        getReaction: () => null,
      } as unknown as CometChat.ReactionEvent);

      expect((CometChat as any).CometChatHelper.updateMessageWithReactionInfo).not.toHaveBeenCalled();
      expect(component.messages()).toEqual([row]);
    });

    it('keeps the row as it was when the SDK refuses the reaction', async () => {
      const logged = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      await create();
      const row = fakeMessage({ id: 1 });
      seed(row);
      const boom = new Error('malformed reaction');
      (CometChat as any).CometChatHelper.updateMessageWithReactionInfo = vi.fn(() => {
        throw boom;
      });

      CometChatMessageEvents.onMessageReactionAdded.next(reactionEvent(1));

      expect(component.messages()).toEqual([row]);
      expect(logged).toHaveBeenCalledWith(
        'CometChatPinnedMessages',
        'Failed to apply reaction:',
        boom
      );
    });
  });

  describe('which pins belong to this panel', () => {
    it('accepts a one-to-one pin addressed to the other party', async () => {
      pagesByScope.set('user:bob', []);
      await create({ user: userBob });

      CometChatPinSaveEvents.publishMessagePinned({
        message: fakeMessage({ id: 1, receiverId: 'bob', senderUid: 'me' }),
      });

      expect(component.messages().map(m => m.getId())).toEqual([1]);
    });

    it('accepts a one-to-one pin that the other party sent', async () => {
      pagesByScope.set('user:bob', []);
      await create({ user: userBob });

      CometChatPinSaveEvents.publishMessagePinned({
        message: fakeMessage({ id: 2, receiverId: 'me', senderUid: 'bob' }),
      });

      expect(component.messages().map(m => m.getId())).toEqual([2]);
    });

    it('rejects a pin from a conversation the user is not in', async () => {
      pagesByScope.set('user:bob', []);
      await create({ user: userBob });

      CometChatPinSaveEvents.publishMessagePinned({
        message: fakeMessage({ id: 3, receiverId: 'carol', senderUid: 'dave' }),
      });

      expect(component.messages()).toEqual([]);
      expect(component.state()).toBe(States.empty);
    });

    it('rejects every pin while the panel is pointed at nothing', async () => {
      await create();

      CometChatPinSaveEvents.publishMessagePinned({ message: fakeMessage({ id: 1 }) });

      expect(component.messages()).toEqual([]);
    });

    it('does not insert a pin it already holds twice', async () => {
      await create({ group: groupA });
      expect(component.messages().map(m => m.getId())).toEqual([1, 2]);

      CometChatPinSaveEvents.publishMessagePinned({ message: fakeMessage({ id: 1 }) });

      expect(component.messages().map(m => m.getId())).toEqual([1, 2]);
    });

    it('sends a pin whose timestamp the SDK cannot report below the pins that have one', async () => {
      await create({ group: groupA });
      seed(fakeMessage({ id: 1, pinnedAt: 300 }));

      CometChatPinSaveEvents.publishMessagePinned({
        message: fakeMessage({ id: 7, without: ['getPinnedAt'] }),
      });

      expect(component.messages().map(m => m.getId())).toEqual([1, 7]);
    });

    it('treats an absent pin timestamp as zero rather than as the newest pin', async () => {
      await create({ group: groupA });
      seed(fakeMessage({ id: 1, pinnedAt: 300 }));

      CometChatPinSaveEvents.publishMessagePinned({
        message: fakeMessage({ id: 8, pinnedAt: undefined }),
      });

      expect(component.messages().map(m => m.getId())).toEqual([1, 8]);
    });
  });

  describe('the unpin control on a row', () => {
    it('unpins without letting the row navigate as well', async () => {
      await create({ group: groupA });
      const message = fakeMessage({ id: 1 });
      const event = { stopPropagation: vi.fn() } as unknown as Event;

      await component.unpin(message, event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(pinSave.run).toHaveBeenCalledWith('unpin', message);
      expect(messageClicks).toEqual([]);
    });
  });

  describe('keyboard activation of a row', () => {
    it('opens the message on Enter', async () => {
      await create();
      const message = fakeMessage({ id: 1 });
      const event = keydown('Enter');

      component.onRowKeydown(event, message);

      expect(messageClicks).toEqual([message]);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('opens the message on Space, rather than scrolling the list', async () => {
      await create();
      const message = fakeMessage({ id: 1 });
      const event = keydown(' ');

      component.onRowKeydown(event, message);

      expect(messageClicks).toEqual([message]);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('leaves Tab and the arrow keys to the browser', async () => {
      await create();
      const event = keydown('Tab');

      component.onRowKeydown(event, fakeMessage({ id: 1 }));
      component.onRowKeydown(keydown('ArrowDown'), fakeMessage({ id: 1 }));

      expect(messageClicks).toEqual([]);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('how a row describes its sender', () => {
    it('passes the avatar through, and an empty string when there is none to pass', async () => {
      // Empty rather than undefined: the avatar falls back to initials, and
      // `undefined` would make it render a broken image instead.
      await create();

      expect(component.senderAvatar(fakeMessage({ senderAvatar: 'a.png' }))).toBe('a.png');
      expect(component.senderAvatar(fakeMessage({ senderAvatar: undefined }))).toBe('');
      expect(component.senderAvatar(fakeMessage({ senderUid: null }))).toBe('');
    });

    it('falls back to a blank name when the SDK names nobody', async () => {
      await create();

      expect(component.senderName(fakeMessage({ senderName: undefined }))).toBe('');
      expect(component.senderName(fakeMessage({ senderUid: null }))).toBe('');
    });

    it('says "You" on your own pin and the name on everyone else\'s', async () => {
      vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(loggedInMe);
      await create();
      const you = CometChatLocalize.getLocalizedString('conversation_subtitle_you_message');

      expect(component.displayName(fakeMessage({ senderUid: 'me' }))).toBe(you);
      expect(component.displayName(fakeMessage({ senderUid: 'bob', senderName: 'Bob' }))).toBe('Bob');
      expect(component.displayName(fakeMessage({ senderUid: null }))).toBe('');
    });

    it('names the sender when nobody is logged in', async () => {
      await create();
      expect(component.displayName(fakeMessage({ senderUid: 'me', senderName: 'Me' }))).toBe('Me');
    });

    it('colours your own pins as outgoing and keeps them on the left', async () => {
      vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(loggedInMe);
      await create();

      expect(component.variantOf(fakeMessage({ senderUid: 'me' }))).toBe('outgoing');
      expect(component.variantOf(fakeMessage({ senderUid: 'bob' }))).toBe('incoming');
      expect(component.variantOf(fakeMessage({ senderUid: null }))).toBe('incoming');
    });
  });

  describe('the one-line preview of a row', () => {
    it('shows the text of a text message', async () => {
      await create();
      expect(component.preview(fakeMessage({ text: 'hello' }))).toBe('hello');
    });

    it('names the type when there is no text to show', async () => {
      await create();
      expect(component.preview(fakeMessage({ text: '', type: 'image' }))).toBe('(image)');
      expect(component.preview(fakeMessage({ without: ['getText', 'getType'] }))).toBe('()');
    });

    it('says the message was deleted rather than previewing what it said', async () => {
      await create();
      const deleted = fakeMessage({ text: 'secret', deletedAt: 1_700_000_500 });

      expect(component.preview(deleted)).toBe(
        CometChatLocalize.getLocalizedString('message_deleted')
      );
    });
  });

  describe('the options offered on a row', () => {
    it('offers Info, Translate and Copy on your own text pin, and no Report', async () => {
      vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(loggedInMe);
      await create({ group: groupA });

      const ids = component.optionsFor(fakeMessage({ id: 1, senderUid: 'me' })).map(o => o.id);

      expect(ids).toEqual([
        OPTION.unpinMessage,
        OPTION.saveMessage,
        OPTION.messageInformation,
        OPTION.translateMessage,
        OPTION.copyMessage,
      ]);
    });

    it('offers Report and Message Privately on someone else\'s group pin', async () => {
      vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(loggedInMe);
      await create({ group: groupA });

      const ids = component.optionsFor(fakeMessage({ id: 1, senderUid: 'bob' })).map(o => o.id);

      expect(ids).toEqual([
        OPTION.unpinMessage,
        OPTION.saveMessage,
        OPTION.translateMessage,
        OPTION.copyMessage,
        OPTION.flagMessage,
        OPTION.sendMessagePrivately,
      ]);
    });

    it('withholds Message Privately in a one-to-one chat, where there is nowhere to go', async () => {
      vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(loggedInMe);
      pagesByScope.set('user:bob', []);
      await create({ user: userBob });

      const ids = component.optionsFor(fakeMessage({ id: 1, senderUid: 'bob' })).map(o => o.id);

      expect(ids).not.toContain(OPTION.sendMessagePrivately);
      expect(ids).toContain(OPTION.flagMessage);
    });

    it('offers neither Copy nor Translate on a message with no text', async () => {
      await create({ group: groupA });

      const ids = component
        .optionsFor(fakeMessage({ id: 1, type: 'image', senderUid: 'bob' }))
        .map(o => o.id);

      expect(ids).not.toContain(OPTION.copyMessage);
      expect(ids).not.toContain(OPTION.translateMessage);
      expect(ids).toContain(OPTION.flagMessage);
    });

    it('turns Save into Unsave once the message is saved', async () => {
      await create({ group: groupA });
      const saved = fakeMessage({ id: 1, savedAt: 1_700_000_900 });
      const unsaved = fakeMessage({ id: 2 });

      const savedOption = component.optionsFor(saved).find(o => o.id === OPTION.unsaveMessage);
      const unsavedOption = component.optionsFor(unsaved).find(o => o.id === OPTION.saveMessage);

      expect(savedOption?.iconURL).toBe('assets/bookmark_remove.svg');
      expect(unsavedOption?.iconURL).toBe('assets/bookmark.svg');
      expect(savedOption?.title).not.toBe(unsavedOption?.title);
      expect(component.optionsFor(saved).map(o => o.id)).not.toContain(OPTION.saveMessage);
    });

    it('reads the Unsave toggle, not the Save one, on a saved message', async () => {
      await create({
        group: groupA,
        hideSaveMessageOption: true,
        hideUnsaveMessageOption: false,
      });
      const saved = fakeMessage({ id: 1, savedAt: 1_700_000_900 });

      expect(component.optionsFor(saved).map(o => o.id)).toContain(OPTION.unsaveMessage);

      component.hideUnsaveMessageOption = true;
      expect(component.optionsFor(saved).map(o => o.id)).not.toContain(OPTION.unsaveMessage);
    });

    it('honours every option toggle the host sets', async () => {
      vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(loggedInMe);
      await create({
        group: groupA,
        hideUnpinMessageOption: true,
        hideMessageInfoOption: true,
        hideTranslateMessageOption: true,
        hideCopyMessageOption: true,
      });

      expect(component.optionsFor(fakeMessage({ id: 1, senderUid: 'me' })).map(o => o.id)).toEqual([
        OPTION.saveMessage,
      ]);

      component.hideFlagMessageOption = true;
      component.hideMessagePrivatelyOption = true;
      expect(component.optionsFor(fakeMessage({ id: 2, senderUid: 'bob' })).map(o => o.id)).toEqual([
        OPTION.saveMessage,
      ]);
    });

    it('leaves each option inert, because activation arrives through the bubble', async () => {
      vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(loggedInMe);
      await create({ group: groupA });
      const own = fakeMessage({ id: 1, senderUid: 'me' });
      const other = fakeMessage({ id: 2, senderUid: 'bob' });

      [...component.optionsFor(own), ...component.optionsFor(other)].forEach(option =>
        option.onClick(1)
      );

      // Every action goes through onBubbleOption, which is what gives unpin and
      // unsave their confirmation step.
      expect(pinSave.run).not.toHaveBeenCalled();
      expect(component.pendingPinSave()).toBeNull();
      expect(component.messageInfoTarget()).toBeNull();
      expect(optionClicks).toEqual([]);
    });
  });

  describe('acting on an option', () => {
    const activate = (id: string | undefined, message: any) =>
      component.onBubbleOption({ id } as unknown as ContextMenuItem, message);

    it('asks before unpinning, and unpins only once confirmed', async () => {
      await create({ group: groupA });
      const message = fakeMessage({ id: 1 });

      activate(OPTION.unpinMessage, message);
      expect(component.pendingPinSave()).toEqual({ action: 'unpin', message });
      expect(pinSave.run).not.toHaveBeenCalled();

      component.confirmPinSave();
      expect(pinSave.run).toHaveBeenCalledWith('unpin', message);
      expect(component.pendingPinSave()).toBeNull();
    });

    it('asks before unsaving', async () => {
      await create({ group: groupA });
      const message = fakeMessage({ id: 1, savedAt: 1_700_000_900 });

      activate(OPTION.unsaveMessage, message);

      expect(component.pendingPinSave()).toEqual({ action: 'unsave', message });
      expect(pinSave.run).not.toHaveBeenCalled();
    });

    it('drops the pending action on cancel without running it', async () => {
      await create({ group: groupA });
      component.pendingPinSave.set({ action: 'unsave', message: fakeMessage({ id: 1 }) });

      component.cancelPinSave();

      expect(component.pendingPinSave()).toBeNull();
      expect(pinSave.run).not.toHaveBeenCalled();
    });

    it('does nothing when confirm arrives with nothing pending', async () => {
      await create({ group: groupA });

      component.confirmPinSave();

      expect(pinSave.run).not.toHaveBeenCalled();
    });

    it('saves straight away, because saving is additive', async () => {
      await create({ group: groupA });
      const message = fakeMessage({ id: 1 });

      activate(OPTION.saveMessage, message);

      expect(pinSave.run).toHaveBeenCalledWith('save', message);
      expect(component.pendingPinSave()).toBeNull();
    });

    it('opens Information inside the panel rather than handing it to the host', async () => {
      await create({ group: groupA });
      const message = fakeMessage({ id: 1 });

      activate(OPTION.messageInformation, message);

      expect(component.messageInfoTarget()).toBe(message);
      expect(optionClicks).toEqual([]);

      component.closeMessageInfo();
      expect(component.messageInfoTarget()).toBeNull();
    });

    it('asks the host to open a direct chat with the sender, and keeps the panel open', async () => {
      await create({ group: groupA });
      CometChatUIEvents.ccOpenChat.subscribe(e => openedChats.push(e));
      const message = fakeMessage({ id: 1, senderUid: 'bob' });

      activate(OPTION.sendMessagePrivately, message);

      expect(openedChats).toHaveLength(1);
      expect(openedChats[0].user.getUid()).toBe('bob');
      expect(optionClicks.map(e => e.message)).toEqual([message]);
      expect(closeClicks).toBe(0);
    });

    it('does nothing for Message Privately when the message has no sender', async () => {
      await create({ group: groupA });
      CometChatUIEvents.ccOpenChat.subscribe(e => openedChats.push(e));

      activate(OPTION.sendMessagePrivately, fakeMessage({ id: 1, senderUid: null }));

      expect(openedChats).toEqual([]);
      expect(optionClicks).toEqual([]);
    });

    it('forwards an option the panel cannot complete on its own', async () => {
      await create({ group: groupA });
      const message = fakeMessage({ id: 1 });

      activate(OPTION.translateMessage, message);
      activate(OPTION.flagMessage, message);

      expect(optionClicks.map(e => e.option?.id)).toEqual([
        OPTION.translateMessage,
        OPTION.flagMessage,
      ]);
      expect(pinSave.run).not.toHaveBeenCalled();
    });

    it('survives an option event with no option on it', async () => {
      await create({ group: groupA });
      const message = fakeMessage({ id: 1 });

      component.onBubbleOption(undefined as unknown as ContextMenuItem, message);

      expect(optionClicks).toHaveLength(1);
      expect(optionClicks[0].message).toBe(message);
    });
  });

  describe('copying a row', () => {
    let writeText: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
        writable: true,
      });
    });

    afterEach(() => {
      delete (navigator as any).clipboard;
    });

    it('copies the message text', async () => {
      await create({ group: groupA });

      component.onBubbleOption({ id: OPTION.copyMessage } as unknown as ContextMenuItem,
        fakeMessage({ id: 1, text: 'copy me' }));
      await Promise.resolve();

      expect(writeText).toHaveBeenCalledWith('copy me');
    });

    it('copies nothing when there is no text to copy', async () => {
      await create({ group: groupA });

      component.onBubbleOption({ id: OPTION.copyMessage } as unknown as ContextMenuItem,
        fakeMessage({ id: 1, text: '' }));
      component.onBubbleOption({ id: OPTION.copyMessage } as unknown as ContextMenuItem,
        fakeMessage({ id: 2, without: ['getText'] }));
      await Promise.resolve();

      expect(writeText).not.toHaveBeenCalled();
    });

    it('logs a refused clipboard instead of failing the panel', async () => {
      const logged = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      const denied = new Error('clipboard blocked');
      writeText.mockRejectedValue(denied);
      await create({ group: groupA });

      component.onBubbleOption({ id: OPTION.copyMessage } as unknown as ContextMenuItem,
        fakeMessage({ id: 1, text: 'copy me' }));
      await Promise.resolve();
      await Promise.resolve();

      expect(logged).toHaveBeenCalledWith(
        'CometChatPinnedMessages',
        'Failed to copy message:',
        denied
      );
    });
  });

  describe('system pins', () => {
    it('offers no Unpin on a pin the app made, which no member may take down', async () => {
      // The one case still refused client-side: the server would reject it, so
      // offering the control would only ever produce an error toast.
      await create({ group: groupA });
      const appPin = fakeMessage({ id: 1 });
      const memberPin = fakeMessage({ id: 2 });
      pinSave.isSystemPin.mockImplementation((m: any) => m.getId() === 1);

      expect(component.optionsFor(appPin).map(o => o.id)).not.toContain(OPTION.unpinMessage);
      expect(component.optionsFor(memberPin).map(o => o.id)).toContain(OPTION.unpinMessage);
      // Asked of the service rather than decided here, so the panel and the
      // message list cannot disagree about what counts as a system pin.
      expect(pinSave.isSystemPin).toHaveBeenCalledWith(appPin);
      expect(component.isSystemPin(appPin)).toBe(true);
    });
  });
});
