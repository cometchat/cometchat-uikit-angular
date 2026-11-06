/**
 * CometChatConversations — interaction edge paths
 *
 * The behaviour suite walks the main lines through selection, search and
 * keyboard navigation. This file picks up the short arms it steps over: early
 * returns on out-of-range indexes, the deselect half of a range click, the
 * "nothing announced" branches, the typing-announcement timers and the two DOM
 * helpers that reach into `document` directly.
 *
 * Harness copied from `cometchat-conversations.behaviour.spec.ts` — the same
 * mocked service layer, driven by BehaviorSubjects.
 *
 * @module components/cometchat-conversations
 */

vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

// Playing a notification sound reaches into CometChatUIKit, which needs an
// initialised SDK. Only the audio playback is stubbed; the component's own
// sound decision is untouched.
vi.mock('../../resources/CometChatSoundManager/CometChatSoundManager', () => ({
  CometChatSoundManager: { play: vi.fn(), pause: vi.fn() },
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signal, WritableSignal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatConversationsComponent } from './cometchat-conversations.component';
import { ConversationsService } from '../../services/conversations.service';
import { ChatStateService } from '../../services/chat-state.service';
import { LiveAnnouncerService } from '../../services/live-announcer.service';
import { SelectionMode } from '../../Enums/Enums';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

/**
 * A conversation whose participant is a user with the given uid.
 *
 * `getLastMessage` stays undefined on purpose: a conversation carrying a last
 * message makes the real conversation-item component render it, which then
 * needs a fully formed SDK message. Logic that needs a last message is called
 * directly on the instance instead.
 */
function userConversation(uid: string): CometChat.Conversation {
  const participant = Object.create(CometChat.User.prototype) as CometChat.User;
  Object.assign(participant, { uid, name: uid });
  (participant as unknown as Record<string, unknown>)['getUid'] = () => uid;
  (participant as unknown as Record<string, unknown>)['getName'] = () => uid;

  return {
    getConversationId: () => `conv-${uid}`,
    getConversationWith: () => participant,
    getConversationType: () => 'user',
    getUnreadMessageCount: () => 0,
    getLastMessage: () => undefined,
  } as unknown as CometChat.Conversation;
}

/** A conversation whose participant is a group with the given guid. */
function groupConversation(guid: string): CometChat.Conversation {
  const participant = Object.create(CometChat.Group.prototype) as CometChat.Group;
  (participant as unknown as Record<string, unknown>)['getGuid'] = () => guid;
  (participant as unknown as Record<string, unknown>)['getName'] = () => guid;

  return {
    getConversationId: () => `conv-${guid}`,
    getConversationWith: () => participant,
    getConversationType: () => 'group',
    getUnreadMessageCount: () => 0,
    getLastMessage: () => undefined,
  } as unknown as CometChat.Conversation;
}

/** A user conversation whose participant reports the given display name. */
function namedConversation(uid: string, name: string): CometChat.Conversation {
  const conv = userConversation(uid);
  const participant = conv.getConversationWith() as unknown as Record<string, unknown>;
  participant['getName'] = () => name;
  return conv;
}

// ---------------------------------------------------------------------------
// Service doubles
// ---------------------------------------------------------------------------

interface MockConversationsService {
  conversations$: BehaviorSubject<CometChat.Conversation[]>;
  loadingState$: BehaviorSubject<boolean>;
  errorState$: BehaviorSubject<Error | null>;
  activeConversation$: BehaviorSubject<CometChat.Conversation | null>;
  typingIndicators$: BehaviorSubject<Map<string, CometChat.TypingIndicator>>;
  hasMore: WritableSignal<boolean>;
  fetchConversations: ReturnType<typeof vi.fn>;
  fetchNextConversations: ReturnType<typeof vi.fn>;
  setActiveConversation: ReturnType<typeof vi.fn>;
  deleteConversation: ReturnType<typeof vi.fn>;
  searchConversations: ReturnType<typeof vi.fn>;
  clearError: ReturnType<typeof vi.fn>;
  replaceConversation: ReturnType<typeof vi.fn>;
  updateConversationReadStatus: ReturnType<typeof vi.fn>;
  updateConversationUnreadCount: ReturnType<typeof vi.fn>;
}

function makeConversationsService(items: CometChat.Conversation[] = []): MockConversationsService {
  return {
    conversations$: new BehaviorSubject<CometChat.Conversation[]>(items),
    loadingState$: new BehaviorSubject<boolean>(false),
    errorState$: new BehaviorSubject<Error | null>(null),
    activeConversation$: new BehaviorSubject<CometChat.Conversation | null>(null),
    typingIndicators$: new BehaviorSubject<Map<string, CometChat.TypingIndicator>>(new Map()),
    hasMore: signal(true),
    fetchConversations: vi.fn(),
    fetchNextConversations: vi.fn().mockResolvedValue(true),
    setActiveConversation: vi.fn(),
    deleteConversation: vi.fn().mockResolvedValue(undefined),
    searchConversations: vi.fn(),
    clearError: vi.fn(),
    replaceConversation: vi.fn(),
    updateConversationReadStatus: vi.fn(),
    updateConversationUnreadCount: vi.fn(),
  };
}

describe('CometChatConversationsComponent — interaction edges', () => {
  let fixture: ComponentFixture<CometChatConversationsComponent>;
  let c: CometChatConversationsComponent;
  let service: MockConversationsService;
  let announcer: { announce: ReturnType<typeof vi.fn> };

  /** Nodes appended to document.body by a test, removed again afterwards. */
  let appended: HTMLElement[] = [];

  const convs = [userConversation('alice'), userConversation('bob'), groupConversation('team')];

  async function build(items: CometChat.Conversation[] = convs): Promise<void> {
    service = makeConversationsService(items);
    announcer = { announce: vi.fn() };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CometChatConversationsComponent],
      providers: [
        { provide: ConversationsService, useValue: service },
        { provide: ChatStateService, useValue: { setActiveConversation: vi.fn() } },
        { provide: LiveAnnouncerService, useValue: announcer },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatConversationsComponent);
    c = fixture.componentInstance;
    // The conversations effect plays a notification sound, which reaches into
    // CometChatUIKit and needs an initialised SDK.
    c.disableSoundForMessages = true;
    fixture.detectChanges();
  }

  /** Appends a node to the document and schedules its removal. */
  function mount<T extends HTMLElement>(el: T): T {
    document.body.appendChild(el);
    appended.push(el);
    return el;
  }

  beforeEach(async () => {
    appended = [];
    await build();
  });

  afterEach(() => {
    fixture?.destroy();
    appended.forEach(el => el.remove());
    appended = [];
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // selectRange
  // -------------------------------------------------------------------------

  describe('selectRange', () => {
    beforeEach(() => {
      c.selectionMode = SelectionMode.multiple;
    });

    /** `selectRange` is private but carries the whole range/deselect decision. */
    const selectRange = (start: number, end: number) =>
      (c as unknown as { selectRange(s: number, e: number): void }).selectRange(start, end);

    it('ignores a click index past the end of the list', () => {
      const spy = vi.fn();
      c.select.subscribe(spy);

      selectRange(0, 99);

      expect(c.selectedCount()).toBe(0);
      expect(spy).not.toHaveBeenCalled();
    });

    it('ignores a negative click index', () => {
      selectRange(0, -1);
      expect(c.selectedCount()).toBe(0);
    });

    /**
     * A five-item list, so a range can leave conversations untouched on both
     * sides. On the three-item default list every range covers the whole list,
     * and a count of three would pass however the bounds were read.
     */
    async function buildWide(): Promise<void> {
      await build([...convs, userConversation('carol'), userConversation('dave')]);
      c.selectionMode = SelectionMode.multiple;
    }

    it('selects every conversation between the two indexes', async () => {
      await buildWide();

      selectRange(1, 3);

      expect([...c.selectedConversations()].sort()).toEqual(['bob', 'carol', 'team']);
    });

    it('selects the same range when the indexes arrive reversed', async () => {
      await buildWide();

      selectRange(3, 1);

      expect([...c.selectedConversations()].sort()).toEqual(['bob', 'carol', 'team']);
    });

    it('removes the whole range when the clicked conversation is already selected', () => {
      selectRange(0, 2);

      const spy = vi.fn();
      c.select.subscribe(spy);
      selectRange(0, 2);

      expect(c.selectedCount()).toBe(0);
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy.mock.calls.every(([e]) => e.selected === false)).toBe(true);
    });

    it('leaves an unselected neighbour alone while deselecting', () => {
      // Only the clicked conversation decides the direction, so a gap in the
      // range is skipped rather than toggled on.
      c.handleSelection(convs[2]);
      selectRange(0, 2);

      expect(c.isConversationSelected(convs[2])).toBe(false);
      expect(c.isConversationSelected(convs[0])).toBe(false);
    });

    it('steps over a gap in the list instead of throwing', () => {
      // A list that is still being reconciled can hand the component a hole.
      // Swapped in directly rather than pushed through the service, because a
      // hole would reach the item template and break rendering.
      const real = c.conversations;
      const sparse = [convs[0], undefined, convs[2]] as unknown as CometChat.Conversation[];
      c.conversations = (() => sparse) as unknown as typeof c.conversations;

      try {
        expect(() => selectRange(0, 2)).not.toThrow();
        expect(c.selectedCount()).toBe(2);
        expect(c.isConversationSelected(convs[0])).toBe(true);
        expect(c.isConversationSelected(convs[2])).toBe(true);
      } finally {
        c.conversations = real;
      }
    });
  });

  // -------------------------------------------------------------------------
  // handleSelectionClick
  // -------------------------------------------------------------------------

  describe('handleSelectionClick', () => {
    beforeEach(() => {
      c.selectionMode = SelectionMode.multiple;
    });

    it('drops the focus ring and blurs the active element on a shift-click', () => {
      const input = mount(document.createElement('input'));
      input.focus();
      const blur = vi.spyOn(input, 'blur');
      c.focusedIndex.set(2);

      c.handleSelectionClick(new MouseEvent('click', { shiftKey: true }), convs[0]);

      expect(c.focusedIndex()).toBe(-1);
      expect(blur).toHaveBeenCalled();
    });

    it('keeps the focus ring on a plain click', () => {
      const input = mount(document.createElement('input'));
      input.focus();
      const blur = vi.spyOn(input, 'blur');
      c.focusedIndex.set(2);

      c.handleSelectionClick(new MouseEvent('click'), convs[0]);

      expect(c.focusedIndex()).toBe(2);
      expect(blur).not.toHaveBeenCalled();
    });

    it('stops a real click reaching the row underneath', () => {
      const event = new MouseEvent('click');
      const stop = vi.spyOn(event, 'stopPropagation');

      c.handleSelectionClick(event, convs[0]);

      expect(stop).toHaveBeenCalled();
      expect(c.isConversationSelected(convs[0])).toBe(true);
    });

    it('selects when handed a bare conversation instead of an event', () => {
      c.handleSelectionClick(convs[1]);

      expect(c.isConversationSelected(convs[1])).toBe(true);
      expect(c.focusedIndex()).toBe(-1);
    });
  });

  // -------------------------------------------------------------------------
  // Search debouncing
  // -------------------------------------------------------------------------

  describe('Search debouncing', () => {
    it('searches for an empty term without announcing a result count', () => {
      vi.useFakeTimers();

      c.onSearch('');
      vi.advanceTimersByTime(350);

      expect(service.searchConversations).toHaveBeenCalledWith('');
      expect(announcer.announce).not.toHaveBeenCalled();
    });

    it('treats a whitespace-only term as empty', () => {
      vi.useFakeTimers();

      c.onSearch('   ');
      vi.advanceTimersByTime(350);

      expect(service.searchConversations).toHaveBeenCalledWith('   ');
      expect(announcer.announce).not.toHaveBeenCalled();
    });

    it('announces the result count for a real term', () => {
      vi.useFakeTimers();

      c.onSearch('ali');
      vi.advanceTimersByTime(300);
      expect(service.searchConversations).toHaveBeenCalledWith('ali');
      // The count is read a tick later, once the list has settled.
      expect(announcer.announce).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(announcer.announce).toHaveBeenCalledTimes(1);
      // The three seeded conversations all match, so the announcement must be
      // the "results found" phrasing carrying the count, not "no results".
      expect(announcer.announce.mock.calls[0][0]).toBe(
        CometChatLocalize.getLocalizedString('accessibility_results_found').replace('{count}', '3'),
      );
    });

    it('announces an empty result set', async () => {
      await build([]);
      vi.useFakeTimers();

      c.onSearch('nobody');
      vi.advanceTimersByTime(350);

      expect(announcer.announce).toHaveBeenCalledTimes(1);
      expect(announcer.announce.mock.calls[0][0]).toBe(
        CometChatLocalize.getLocalizedString('accessibility_no_results'),
      );
    });

    it('reaches the service once for a repeated term', () => {
      vi.useFakeTimers();

      c.onSearch('ali');
      vi.advanceTimersByTime(350);
      c.onSearch('ali');
      vi.advanceTimersByTime(350);

      expect(service.searchConversations).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // handleKeydown
  // -------------------------------------------------------------------------

  describe('handleKeydown', () => {
    /** The rendered list root, which the handler's guard looks for. */
    function listRoot(): HTMLElement {
      const root = (fixture.nativeElement as HTMLElement).querySelector(
        '.cometchat-conversations',
      ) as HTMLElement | null;
      if (root) return root;
      const host = document.createElement('div');
      host.className = 'cometchat-conversations';
      return host;
    }

    /** A keydown whose target sits inside the list, as the guard requires. */
    function key(k: string, mods: Partial<KeyboardEvent> = {}): KeyboardEvent {
      return {
        key: k,
        target: listRoot(),
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        ...mods,
      } as unknown as KeyboardEvent;
    }

    it('ignores a key when there are no conversations', async () => {
      await build([]);
      c.handleKeydown(key('ArrowDown'));

      expect(c.focusedIndex()).toBe(-1);
      expect(announcer.announce).not.toHaveBeenCalled();
    });

    it('ignores a key while the delete dialog is open', () => {
      c.handleDeleteConversationClick(convs[0]);
      c.handleKeydown(key('ArrowDown'));

      expect(c.focusedIndex()).toBe(-1);
    });

    it('ignores a key raised outside the list', () => {
      c.handleKeydown({
        key: 'ArrowDown',
        target: document.createElement('div'),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as KeyboardEvent);

      expect(c.focusedIndex()).toBe(-1);
    });

    describe('select-all shortcuts', () => {
      beforeEach(() => {
        c.selectionMode = SelectionMode.multiple;
      });

      it('clears the selection on Ctrl+Shift+A and says so', () => {
        c.selectAll();
        announcer.announce.mockClear();

        c.handleKeydown(key('a', { ctrlKey: true, shiftKey: true }));

        expect(c.selectedCount()).toBe(0);
        expect(announcer.announce).toHaveBeenCalledTimes(1);
      });

      it('clears the selection on Meta+Shift+A too', () => {
        c.selectAll();
        announcer.announce.mockClear();

        c.handleKeydown(key('a', { metaKey: true, shiftKey: true }));

        expect(c.selectedCount()).toBe(0);
        expect(announcer.announce).toHaveBeenCalledTimes(1);
      });

      it('selects everything on Ctrl+A and announces the count', () => {
        c.handleKeydown(key('a', { ctrlKey: true }));

        expect(c.selectedCount()).toBe(3);
        expect(String(announcer.announce.mock.calls[0][0])).toContain('3');
      });

      it('selects everything on Meta+A too', () => {
        c.handleKeydown(key('a', { metaKey: true }));
        expect(c.selectedCount()).toBe(3);
      });

      it('leaves a single-mode selection alone on Ctrl+Shift+A', () => {
        c.selectionMode = SelectionMode.single;
        c.handleSelection(convs[0]);

        c.handleKeydown(key('a', { ctrlKey: true, shiftKey: true }));

        expect(c.selectedCount()).toBe(1);
      });
    });

    describe('context menu keys', () => {
      it('opens the menu for the focused row on the ContextMenu key', () => {
        const spy = vi.fn();
        c.contextMenuOpen.subscribe(spy);
        c.focusedIndex.set(2);

        c.handleKeydown(key('ContextMenu'));

        expect(spy).toHaveBeenCalledWith(convs[2]);
      });

      it('opens the menu for the focused row on Shift+F10', () => {
        const spy = vi.fn();
        c.contextMenuOpen.subscribe(spy);
        c.focusedIndex.set(1);

        c.handleKeydown(key('F10', { shiftKey: true }));

        expect(spy).toHaveBeenCalledWith(convs[1]);
      });

      it('stays quiet when no row is focused', () => {
        const spy = vi.fn();
        c.contextMenuOpen.subscribe(spy);

        c.handleKeydown(key('ContextMenu'));

        expect(spy).not.toHaveBeenCalled();
      });

      it('does nothing for F10 without Shift', () => {
        const spy = vi.fn();
        c.contextMenuOpen.subscribe(spy);
        c.focusedIndex.set(1);

        c.handleKeydown(key('F10'));

        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('delete keys', () => {
      it.each(['Delete', 'Backspace'])('stages the focused row on %s', k => {
        c.focusedIndex.set(1);
        c.handleKeydown(key(k));

        expect(c.showDeleteConfirmDialog()).toBe(true);
        expect(c.conversationToDelete()).toBe(convs[1]);
      });

      it('does not stage anything when deletion is hidden', () => {
        c.hideDeleteConversation = true;
        c.focusedIndex.set(1);

        c.handleKeydown(key('Delete'));

        expect(c.showDeleteConfirmDialog()).toBe(false);
        expect(c.conversationToDelete()).toBeNull();
      });

      it('does not stage anything when no row is focused', () => {
        c.handleKeydown(key('Delete'));
        expect(c.showDeleteConfirmDialog()).toBe(false);
      });
    });

    describe('Space outside selection mode', () => {
      it('opens the focused conversation', () => {
        c.focusedIndex.set(2);
        c.handleKeydown(key(' '));

        expect(service.setActiveConversation).toHaveBeenCalledWith(convs[2]);
      });

      it('does nothing with no row focused', () => {
        c.handleKeydown(key(' '));
        expect(service.setActiveConversation).not.toHaveBeenCalled();
      });
    });

    describe('Space inside selection mode', () => {
      beforeEach(() => {
        c.selectionMode = SelectionMode.multiple;
      });

      it('toggles the focused row and announces the count', () => {
        c.focusedIndex.set(1);
        c.handleKeydown(key(' '));

        expect(c.isConversationSelected(convs[1])).toBe(true);
        expect(announcer.announce).toHaveBeenCalledTimes(1);
      });

      it('swallows Space with no row focused', () => {
        c.handleKeydown(key(' '));

        expect(c.selectedCount()).toBe(0);
        expect(service.setActiveConversation).not.toHaveBeenCalled();
      });

      it('selects the range up to the focused row on Shift+Space', () => {
        c.handleSelection(convs[0]);
        // Focus the middle row, not the last: a range that stops short of the
        // end proves the anchor and the focused row are both read, where a
        // range covering the whole list would not.
        c.focusedIndex.set(1);

        c.handleKeydown(key(' ', { shiftKey: true }));

        expect([...c.selectedConversations()].sort()).toEqual(['alice', 'bob']);
      });

      it('selects nothing on Shift+Space with no row focused', () => {
        c.handleKeydown(key(' ', { shiftKey: true }));
        expect(c.selectedCount()).toBe(0);
      });

      it('does nothing for Shift+Space in single-select mode', () => {
        // Range selection belongs to multiple mode, and Space must not fall
        // through to opening the conversation while a mode is active.
        c.selectionMode = SelectionMode.single;
        c.focusedIndex.set(1);

        c.handleKeydown(key(' ', { shiftKey: true }));

        expect(c.selectedCount()).toBe(0);
        expect(service.setActiveConversation).not.toHaveBeenCalled();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Private selection helpers
  // -------------------------------------------------------------------------

  describe('extendSelectionTo', () => {
    const extendTo = (i: number) =>
      (c as unknown as { extendSelectionTo(i: number): void }).extendSelectionTo(i);

    beforeEach(() => {
      c.selectionMode = SelectionMode.multiple;
    });

    it('ignores a negative index', () => {
      const spy = vi.fn();
      c.select.subscribe(spy);

      extendTo(-1);

      expect(c.selectedCount()).toBe(0);
      expect(spy).not.toHaveBeenCalled();
    });

    it('ignores an index past the end of the list', () => {
      const spy = vi.fn();
      c.select.subscribe(spy);

      extendTo(3);

      expect(c.selectedCount()).toBe(0);
      expect(spy).not.toHaveBeenCalled();
    });

    it('adds the conversation at an index inside the list', () => {
      extendTo(1);

      expect(c.isConversationSelected(convs[1])).toBe(true);
      expect(c.selectedCount()).toBe(1);
    });
  });

  describe('getFocusedConversation', () => {
    const focused = () =>
      (c as unknown as { getFocusedConversation(): CometChat.Conversation | null }).getFocusedConversation();

    it('is null with nothing focused', () => {
      expect(focused()).toBeNull();
    });

    it('is null when the focused index is past the end', () => {
      c.focusedIndex.set(9);
      expect(focused()).toBeNull();
    });

    it('returns the conversation at the focused index', () => {
      c.focusedIndex.set(1);
      expect(focused()).toBe(convs[1]);
    });
  });

  describe('openContextMenuForFocused', () => {
    const open = () =>
      (c as unknown as { openContextMenuForFocused(): void }).openContextMenuForFocused();

    it('emits nothing with no row focused', () => {
      const spy = vi.fn();
      c.contextMenuOpen.subscribe(spy);

      open();

      expect(spy).not.toHaveBeenCalled();
    });

    it('emits the focused conversation', () => {
      const spy = vi.fn();
      c.contextMenuOpen.subscribe(spy);
      c.focusedIndex.set(0);

      open();

      expect(spy).toHaveBeenCalledWith(convs[0]);
    });
  });

  describe('announceSelectionCount', () => {
    const announceCount = () =>
      (c as unknown as { announceSelectionCount(): void }).announceSelectionCount();

    it('stays quiet when nothing is selected', () => {
      announceCount();
      expect(announcer.announce).not.toHaveBeenCalled();
    });

    it('announces how many are selected', () => {
      c.selectionMode = SelectionMode.multiple;
      c.handleSelection(convs[0]);
      c.handleSelection(convs[1]);
      announcer.announce.mockClear();

      announceCount();

      expect(String(announcer.announce.mock.calls[0][0])).toContain('2');
    });
  });

  // -------------------------------------------------------------------------
  // Typing announcements
  // -------------------------------------------------------------------------

  describe('announceTyping', () => {
    const lastTypist = () =>
      (c as unknown as { lastAnnouncedTypingUser: string | null }).lastAnnouncedTypingUser;

    it('announces only the latest typist when a second arrives first', () => {
      vi.useFakeTimers();

      c.announceTyping('alpha');
      c.announceTyping('bravo');
      vi.advanceTimersByTime(1000);

      expect(announcer.announce).toHaveBeenCalledTimes(1);
      expect(String(announcer.announce.mock.calls[0][0])).toContain('bravo');
    });

    it('forgets the typist a few seconds after announcing them', () => {
      vi.useFakeTimers();

      c.announceTyping('alpha');
      vi.advanceTimersByTime(1000);
      expect(lastTypist()).toBe('alpha');

      vi.advanceTimersByTime(5000);
      expect(lastTypist()).toBeNull();
    });

    it('leaves a newer typist in place when the older reset fires', () => {
      vi.useFakeTimers();

      c.announceTyping('alpha');
      vi.advanceTimersByTime(1000);

      c.announceTyping('bravo');
      vi.advanceTimersByTime(1000);
      expect(lastTypist()).toBe('bravo');

      // The reset queued for 'alpha' lands first and must not clear 'bravo'.
      vi.advanceTimersByTime(4000);
      expect(lastTypist()).toBe('bravo');

      vi.advanceTimersByTime(1000);
      expect(lastTypist()).toBeNull();
    });

    it('does not repeat the typist already announced', () => {
      vi.useFakeTimers();

      c.announceTyping('alpha');
      vi.advanceTimersByTime(1000);
      announcer.announce.mockClear();

      c.announceTyping('alpha');
      vi.advanceTimersByTime(1000);

      expect(announcer.announce).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // New conversation announcement
  // -------------------------------------------------------------------------

  describe('detectAndAnnounceNewConversation', () => {
    const detect = (current: CometChat.Conversation[], previous: CometChat.Conversation[]) =>
      (
        c as unknown as {
          detectAndAnnounceNewConversation(
            current: CometChat.Conversation[],
            previous: CometChat.Conversation[],
          ): void;
        }
      ).detectAndAnnounceNewConversation(current, previous);

    beforeEach(() => {
      announcer.announce.mockClear();
    });

    it('announces an added conversation by name', () => {
      detect([convs[0], namedConversation('carol', 'Carol')], [convs[0]]);

      expect(String(announcer.announce.mock.calls[0][0])).toContain('Carol');
    });

    it('says nothing when the added conversation has no name', () => {
      detect([convs[0], namedConversation('ghost', '')], [convs[0]]);

      expect(announcer.announce).not.toHaveBeenCalled();
    });

    it('says nothing when the list is now empty', () => {
      detect([], [convs[0]]);
      expect(announcer.announce).not.toHaveBeenCalled();
    });

    it('says nothing on the very first list', () => {
      detect([convs[0]], []);
      expect(announcer.announce).not.toHaveBeenCalled();
    });

    it('says nothing when nothing was added', () => {
      detect([convs[1], convs[0]], [convs[0], convs[1]]);
      expect(announcer.announce).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // focusItemAtIndex
  // -------------------------------------------------------------------------

  describe('focusItemAtIndex', () => {
    const focusAt = (i: number) =>
      (c as unknown as { focusItemAtIndex(i: number): void }).focusItemAtIndex(i);

    /** The row elements the helper walks, with focus and scroll spied on. */
    interface Row {
      item: HTMLElement;
      focus: ReturnType<typeof vi.fn>;
      scrollIntoView: ReturnType<typeof vi.fn>;
    }

    /**
     * Builds the list structure the helper queries straight off `document`.
     * jsdom has no scrollIntoView, so each row gets its own stub.
     */
    function buildList(
      count: number,
      opts: { containerClass?: string; withTabIndex?: boolean } = {},
    ): Row[] {
      const container = document.createElement('div');
      container.className = opts.containerClass ?? 'cometchat-paginated-list__items';

      const rows: Row[] = [];
      for (let i = 0; i < count; i++) {
        const listItem = document.createElement('div');
        listItem.className = 'cometchat-paginated-list__item';
        const item = document.createElement('div');
        item.className = 'cometchat-conversation-item';
        if (opts.withTabIndex !== false) item.setAttribute('tabindex', '0');

        const focus = vi.fn();
        const scrollIntoView = vi.fn();
        item.focus = focus;
        (item as unknown as Record<string, unknown>)['scrollIntoView'] = scrollIntoView;

        listItem.appendChild(item);
        container.appendChild(listItem);
        rows.push({ item, focus, scrollIntoView });
      }

      mount(container);
      return rows;
    }

    // The rendered component owns the only other items container in the
    // document, so these tests run against an empty list.
    beforeEach(async () => {
      await build([]);
    });

    it('does nothing when the document has no items container', () => {
      vi.useFakeTimers();
      const rows = buildList(2, { containerClass: 'some-other-list' });

      focusAt(0);
      vi.advanceTimersByTime(0);

      expect(rows[0].focus).not.toHaveBeenCalled();
    });

    it('does nothing for a negative index', () => {
      vi.useFakeTimers();
      const rows = buildList(2);

      focusAt(-1);
      vi.advanceTimersByTime(0);

      expect(rows[0].focus).not.toHaveBeenCalled();
    });

    it('does nothing for an index past the last row', () => {
      vi.useFakeTimers();
      const rows = buildList(2);

      focusAt(5);
      vi.advanceTimersByTime(0);

      expect(rows[0].focus).not.toHaveBeenCalled();
      expect(rows[1].focus).not.toHaveBeenCalled();
    });

    it('does nothing when the row carries no tabindex', () => {
      vi.useFakeTimers();
      const rows = buildList(2, { withTabIndex: false });

      focusAt(1);
      vi.advanceTimersByTime(0);

      expect(rows[1].focus).not.toHaveBeenCalled();
    });

    it('focuses the row at the index and scrolls it into view', () => {
      vi.useFakeTimers();
      const rows = buildList(3);

      focusAt(2);
      vi.advanceTimersByTime(0);

      expect(rows[2].focus).toHaveBeenCalled();
      expect(rows[2].scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest' });
      expect(rows[0].focus).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // handleFocusIn
  // -------------------------------------------------------------------------

  describe('handleFocusIn', () => {
    /**
     * Builds the nesting the handler walks up through and returns the rows'
     * innermost conversation-item elements.
     */
    function buildRows(
      count: number,
      opts: { containerClass?: string; withWrapper?: boolean } = {},
    ): HTMLElement[] {
      const container = document.createElement('div');
      container.className = opts.containerClass ?? 'cometchat-paginated-list__items';

      const items: HTMLElement[] = [];
      for (let i = 0; i < count; i++) {
        const listItem = document.createElement('div');
        listItem.className = 'cometchat-paginated-list__item';
        const item = document.createElement('div');
        item.className = 'cometchat-conversation-item';

        if (opts.withWrapper === false) {
          listItem.appendChild(item);
        } else {
          const wrapper = document.createElement('div');
          wrapper.className = 'cometchat-conversations__list-item-wrapper';
          wrapper.appendChild(item);
          listItem.appendChild(wrapper);
        }

        container.appendChild(listItem);
        items.push(item);
      }

      mount(container);
      return items;
    }

    /** jsdom will not set `target` on a hand-made event, so it is forced. */
    function focusIn(target: unknown): FocusEvent {
      const event = new FocusEvent('focusin');
      Object.defineProperty(event, 'target', { value: target });
      return event;
    }

    it('adopts the index of the row that received focus', () => {
      const items = buildRows(3);

      c.handleFocusIn(focusIn(items[2]));

      expect(c.focusedIndex()).toBe(2);
    });

    it('adopts the index when focus lands on something inside the row', () => {
      const items = buildRows(3);
      const inner = document.createElement('button');
      items[1].appendChild(inner);

      c.handleFocusIn(focusIn(inner));

      expect(c.focusedIndex()).toBe(1);
    });

    it('ignores an event with no target', () => {
      c.handleFocusIn(focusIn(null));
      expect(c.focusedIndex()).toBe(-1);
    });

    it('ignores focus landing outside any conversation row', () => {
      buildRows(2);
      c.handleFocusIn(focusIn(mount(document.createElement('div'))));

      expect(c.focusedIndex()).toBe(-1);
    });

    it('ignores a row with no wrapper around it', () => {
      const items = buildRows(2, { withWrapper: false });

      c.handleFocusIn(focusIn(items[1]));

      expect(c.focusedIndex()).toBe(-1);
    });

    it('ignores a row whose container is not the paginated list', () => {
      const items = buildRows(2, { containerClass: 'some-other-list' });

      c.handleFocusIn(focusIn(items[1]));

      expect(c.focusedIndex()).toBe(-1);
    });

    it('leaves the signal untouched when the index already matches', () => {
      const items = buildRows(3);
      c.focusedIndex.set(1);
      const set = vi.spyOn(c.focusedIndex, 'set');

      c.handleFocusIn(focusIn(items[1]));

      expect(set).not.toHaveBeenCalled();
      expect(c.focusedIndex()).toBe(1);
    });
  });
});
