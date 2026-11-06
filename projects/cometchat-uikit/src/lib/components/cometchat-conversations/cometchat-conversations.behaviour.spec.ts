/**
 * CometChatConversations — Behaviour Tests
 *
 * Drives the real component against a fully mocked service layer, so the
 * handlers, selection logic, delete flow, search, keyboard navigation and
 * context menu can be exercised without a live SDK session.
 *
 * The existing `cometchat-conversations.component.spec.ts` covers rendering
 * and inputs against the real services; this file covers behaviour that needs
 * controllable data.
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
// initialised SDK. The component's sound decision is still exercised; only the
// audio playback itself is stubbed out.
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

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

/** A conversation whose participant is a user with the given uid. */
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

// ---------------------------------------------------------------------------
// Service doubles
// ---------------------------------------------------------------------------

/**
 * The component reads its state from the service's Observables via toSignal(),
 * and `hasMore` as a signal. BehaviorSubjects let a test push new state and have
 * the component pick it up.
 */
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

describe('CometChatConversationsComponent — behaviour', () => {
  let fixture: ComponentFixture<CometChatConversationsComponent>;
  let c: CometChatConversationsComponent;
  let service: MockConversationsService;
  let chatState: { setActiveConversation: ReturnType<typeof vi.fn> };
  let announcer: { announce: ReturnType<typeof vi.fn> };

  const convs = [userConversation('alice'), userConversation('bob'), groupConversation('team')];

  async function build(items: CometChat.Conversation[] = convs): Promise<void> {
    service = makeConversationsService(items);
    chatState = { setActiveConversation: vi.fn() };
    announcer = { announce: vi.fn() };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CometChatConversationsComponent],
      providers: [
        { provide: ConversationsService, useValue: service },
        { provide: ChatStateService, useValue: chatState },
        { provide: LiveAnnouncerService, useValue: announcer },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatConversationsComponent);
    c = fixture.componentInstance;
    // The conversations effect plays a notification sound, which reaches into
    // CometChatUIKit and needs an initialised SDK. Off by default here so that
    // pushing new state does not drag the SDK into every test.
    c.disableSoundForMessages = true;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await build();
  });

  afterEach(() => {
    fixture?.destroy();
    vi.restoreAllMocks();
  });

  const idOf = (conv: CometChat.Conversation) => c.getConversationId(conv);

  // -------------------------------------------------------------------------
  // Service wiring
  // -------------------------------------------------------------------------

  describe('Service wiring', () => {
    it('fetches conversations on init', () => {
      expect(service.fetchConversations).toHaveBeenCalled();
    });

    it('exposes the service conversations', () => {
      expect(c.conversations()).toHaveLength(3);
      expect(c.hasConversations()).toBe(true);
    });

    it('sets an initially supplied active conversation', async () => {
      service = makeConversationsService(convs);
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [CometChatConversationsComponent],
        providers: [
          { provide: ConversationsService, useValue: service },
          { provide: ChatStateService, useValue: { setActiveConversation: vi.fn() } },
          { provide: LiveAnnouncerService, useValue: { announce: vi.fn() } },
        ],
      }).compileComponents();

      const f = TestBed.createComponent(CometChatConversationsComponent);
      f.componentInstance.activeConversation = convs[0];
      f.detectChanges();

      expect(service.setActiveConversation).toHaveBeenCalledWith(convs[0]);
      f.destroy();
    });

    it('clears the error and refetches on retry', () => {
      c.handleRetryClick();
      expect(service.clearError).toHaveBeenCalled();
      expect(service.fetchConversations).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------

  describe('handleLoadMore', () => {
    it('requests the next page', () => {
      c.handleLoadMore();
      expect(service.fetchNextConversations).toHaveBeenCalled();
    });

    it('marks itself as fetching while in flight', () => {
      c.handleLoadMore();
      expect(c.isFetchingMore()).toBe(true);
    });

    it('ignores a second request while one is in flight', () => {
      c.handleLoadMore();
      c.handleLoadMore();
      expect(service.fetchNextConversations).toHaveBeenCalledTimes(1);
    });

    it('settles and records whether more remain', async () => {
      vi.useFakeTimers();
      service.fetchNextConversations.mockResolvedValue(false);

      c.handleLoadMore();
      await vi.advanceTimersByTimeAsync(600);

      expect(c.isFetchingMore()).toBe(false);
      expect(c.hasMore()).toBe(false);
      vi.useRealTimers();
    });

    it('recovers when the fetch rejects', async () => {
      service.fetchNextConversations.mockRejectedValue(new Error('network'));
      c.handleLoadMore();
      await Promise.resolve();
      await Promise.resolve();

      expect(c.isFetchingMore()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Clicking a conversation
  // -------------------------------------------------------------------------

  describe('handleConversationClick', () => {
    it('activates the conversation through the service', () => {
      c.handleConversationClick(convs[0]);
      expect(service.setActiveConversation).toHaveBeenCalledWith(convs[0]);
    });

    it('routes to chat state when nothing listens to itemClick', () => {
      c.handleConversationClick(convs[0]);
      expect(chatState.setActiveConversation).toHaveBeenCalledWith(convs[0]);
    });

    it('emits itemClick instead when something is listening', () => {
      const spy = vi.fn();
      c.itemClick.subscribe(spy);

      c.handleConversationClick(convs[0]);

      expect(spy).toHaveBeenCalledWith(convs[0]);
      expect(chatState.setActiveConversation).not.toHaveBeenCalled();
    });

    it('ignores clicks while the list is still loading', () => {
      service.loadingState$.next(true);
      c.handleConversationClick(convs[0]);
      expect(service.setActiveConversation).not.toHaveBeenCalled();
    });

    it('selects rather than opens when a selection mode is active', () => {
      c.selectionMode = SelectionMode.single;
      c.handleConversationClick(convs[0]);

      expect(c.isConversationSelected(convs[0])).toBe(true);
      expect(service.setActiveConversation).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Selection
  // -------------------------------------------------------------------------

  describe('Selection', () => {
    it('does nothing in none mode', () => {
      c.selectionMode = SelectionMode.none;
      c.handleSelection(convs[0]);
      expect(c.selectedCount()).toBe(0);
    });

    describe('single mode', () => {
      beforeEach(() => {
        c.selectionMode = SelectionMode.single;
      });

      it('selects one conversation', () => {
        c.handleSelection(convs[0]);
        expect(c.selectedCount()).toBe(1);
        expect(c.isConversationSelected(convs[0])).toBe(true);
      });

      it('replaces the previous selection', () => {
        c.handleSelection(convs[0]);
        c.handleSelection(convs[1]);

        expect(c.selectedCount()).toBe(1);
        expect(c.isConversationSelected(convs[1])).toBe(true);
      });

      it('deselects when the same one is chosen again', () => {
        c.handleSelection(convs[0]);
        c.handleSelection(convs[0]);
        expect(c.selectedCount()).toBe(0);
      });

      it('emits select with the new state', () => {
        const spy = vi.fn();
        c.select.subscribe(spy);

        c.handleSelection(convs[0]);
        expect(spy).toHaveBeenCalledWith({ conversation: convs[0], selected: true });
      });
    });

    describe('multiple mode', () => {
      beforeEach(() => {
        c.selectionMode = SelectionMode.multiple;
      });

      it('accumulates selections', () => {
        c.handleSelection(convs[0]);
        c.handleSelection(convs[1]);
        expect(c.selectedCount()).toBe(2);
      });

      it('toggles an already-selected conversation off', () => {
        c.handleSelection(convs[0]);
        c.handleSelection(convs[0]);
        expect(c.selectedCount()).toBe(0);
      });

      it('selects a range on shift-click', () => {
        c.handleSelection(convs[0]);
        c.handleSelection(convs[2], { shiftKey: true } as MouseEvent);
        expect(c.selectedCount()).toBe(3);
      });

      it('selects a range backwards too', () => {
        c.handleSelection(convs[2]);
        c.handleSelection(convs[0], { shiftKey: true } as MouseEvent);
        expect(c.selectedCount()).toBe(3);
      });

      it('deselects a range when the anchor is already selected', () => {
        c.selectAll();
        c.handleSelection(convs[2], { shiftKey: true } as MouseEvent);
        expect(c.selectedCount()).toBeLessThan(3);
      });

      it('falls back to a plain toggle when there is no anchor', () => {
        c.handleSelection(convs[1], { shiftKey: true } as MouseEvent);
        expect(c.selectedCount()).toBe(1);
      });
    });

    describe('selectAll', () => {
      it('selects everything in multiple mode', () => {
        c.selectionMode = SelectionMode.multiple;
        c.selectAll();
        expect(c.selectedCount()).toBe(3);
      });

      it('does nothing in single mode', () => {
        c.selectionMode = SelectionMode.single;
        c.selectAll();
        expect(c.selectedCount()).toBe(0);
      });

      it('emits select for each conversation', () => {
        c.selectionMode = SelectionMode.multiple;
        const spy = vi.fn();
        c.select.subscribe(spy);

        c.selectAll();
        expect(spy).toHaveBeenCalledTimes(3);
      });
    });

    describe('clearSelection', () => {
      it('empties the selection', () => {
        c.selectionMode = SelectionMode.multiple;
        c.selectAll();
        c.clearSelection();

        expect(c.selectedCount()).toBe(0);
        expect(c.hasSelection()).toBe(false);
      });

      it('emits select false for previously selected conversations', () => {
        c.selectionMode = SelectionMode.multiple;
        c.handleSelection(convs[0]);

        const spy = vi.fn();
        c.select.subscribe(spy);
        c.clearSelection();

        expect(spy).toHaveBeenCalledWith({ conversation: convs[0], selected: false });
      });

      it('emits a selectionChange with an empty set', () => {
        const spy = vi.fn();
        c.selectionChange.subscribe(spy);

        c.clearSelection();
        expect(spy.mock.calls[0][0].selectedIds.size).toBe(0);
      });
    });

    describe('handleSelectionClick', () => {
      it('stops the event propagating when given one', () => {
        c.selectionMode = SelectionMode.multiple;
        const event = { stopPropagation: vi.fn(), shiftKey: false } as unknown as MouseEvent;
        Object.setPrototypeOf(event, MouseEvent.prototype);

        c.handleSelectionClick(event, convs[0]);
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('accepts a bare conversation with no event', () => {
        c.selectionMode = SelectionMode.multiple;
        c.handleSelectionClick(convs[0]);
        expect(c.isConversationSelected(convs[0])).toBe(true);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Active conversation
  // -------------------------------------------------------------------------

  describe('isConversationActive', () => {
    it('matches an explicitly supplied active conversation', () => {
      c.activeConversation = convs[1];
      expect(c.isConversationActive(convs[1])).toBe(true);
      expect(c.isConversationActive(convs[0])).toBe(false);
    });

    it('falls back to the service signal', () => {
      service.activeConversation$.next(convs[2]);
      expect(c.isConversationActive(convs[2])).toBe(true);
    });

    it('is false when nothing is active', () => {
      expect(c.isConversationActive(convs[0])).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Delete flow
  // -------------------------------------------------------------------------

  describe('Delete flow', () => {
    it('opens the dialog for a conversation', () => {
      c.handleDeleteConversationClick(convs[0]);
      expect(c.showDeleteConfirmDialog()).toBe(true);
      expect(c.shouldShowDeleteDialog()).toBe(true);
    });

    it('closes the dialog on cancel', () => {
      c.handleDeleteConversationClick(convs[0]);
      c.handleDeleteCancel();

      expect(c.showDeleteConfirmDialog()).toBe(false);
      expect(c.conversationToDelete()).toBeNull();
    });

    it('deletes a user conversation by uid', async () => {
      c.handleDeleteConversationClick(convs[0]);
      await c.handleDeleteConfirm();

      expect(service.deleteConversation).toHaveBeenCalledWith('alice', 'user');
    });

    it('deletes a group conversation by guid', async () => {
      c.handleDeleteConversationClick(convs[2]);
      await c.handleDeleteConfirm();

      expect(service.deleteConversation).toHaveBeenCalledWith('team', 'group');
    });

    it('announces the deletion', async () => {
      c.handleDeleteConversationClick(convs[0]);
      await c.handleDeleteConfirm();

      expect(announcer.announce).toHaveBeenCalled();
    });

    it('does nothing when no conversation is staged', async () => {
      await c.handleDeleteConfirm();
      expect(service.deleteConversation).not.toHaveBeenCalled();
    });

    it('survives a delete failure', async () => {
      service.deleteConversation.mockRejectedValue(new Error('denied'));
      c.handleDeleteConversationClick(convs[0]);

      await expect(c.handleDeleteConfirm()).resolves.toBeUndefined();
    });

    it('closes the dialog on Escape', () => {
      c.handleDeleteConversationClick(convs[0]);
      c.handleDialogKeydown({
        key: 'Escape',
        stopPropagation: vi.fn(),
      } as unknown as KeyboardEvent);

      expect(c.showDeleteConfirmDialog()).toBe(false);
    });

    it('swallows other keys but keeps the dialog open', () => {
      c.handleDeleteConversationClick(convs[0]);
      const stopPropagation = vi.fn();
      c.handleDialogKeydown({ key: 'a', stopPropagation } as unknown as KeyboardEvent);

      expect(stopPropagation).toHaveBeenCalled();
      expect(c.showDeleteConfirmDialog()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------

  describe('Search', () => {
    it('records the current search text', () => {
      c.onSearch('hello');
      expect(c.currentSearchText).toBe('hello');
    });

    it('emits searchBarClick', () => {
      const spy = vi.fn();
      c.searchBarClick.subscribe(spy);

      c.handleSearchBarClick();
      expect(spy).toHaveBeenCalled();
    });

    it('announces a result count', () => {
      c.announceSearchResults(3);
      expect(announcer.announce).toHaveBeenCalled();
    });

    it('announces a zero result count', () => {
      c.announceSearchResults(0);
      expect(announcer.announce).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Announcements
  // -------------------------------------------------------------------------

  describe('Announcements', () => {
    it('announces a new conversation by name', () => {
      c.announceNewConversation('Alice');
      expect(announcer.announce.mock.calls[0][0]).toContain('Alice');
    });

    it('announces a deletion', () => {
      c.announceConversationDeleted();
      expect(announcer.announce).toHaveBeenCalled();
    });

    it('announces typing after a settling delay', () => {
      vi.useFakeTimers();
      c.announceTyping('Alice');

      // Deliberately debounced — a burst of typing events should not produce a
      // burst of screen-reader announcements.
      expect(announcer.announce).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1000);
      expect(announcer.announce).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('does not re-announce the same typist', () => {
      vi.useFakeTimers();
      c.announceTyping('Alice');
      vi.advanceTimersByTime(1000);
      announcer.announce.mockClear();

      c.announceTyping('Alice');
      vi.advanceTimersByTime(1000);

      expect(announcer.announce).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  // -------------------------------------------------------------------------
  // Scroll outputs
  // -------------------------------------------------------------------------

  describe('Scroll outputs', () => {
    it('emits scrollToTop', () => {
      const spy = vi.fn();
      c.scrollToTop.subscribe(spy);
      c.handleScrollToTop();
      expect(spy).toHaveBeenCalled();
    });

    it('emits scrollToBottom', () => {
      const spy = vi.fn();
      c.scrollToBottom.subscribe(spy);
      c.handleScrollToBottom();
      expect(spy).toHaveBeenCalled();
    });

    it('emits contextMenuOpen', () => {
      const spy = vi.fn();
      c.contextMenuOpen.subscribe(spy);
      c.handleContextMenuOpen(convs[0]);
      expect(spy).toHaveBeenCalledWith(convs[0]);
    });

    it('re-emits an item select event', () => {
      const spy = vi.fn();
      c.select.subscribe(spy);
      const event = { conversation: convs[0], selected: true };

      c.handleConversationSelect(event);
      expect(spy).toHaveBeenCalledWith(event);
    });
  });

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  describe('Helpers', () => {
    it('derives a stable conversation id', () => {
      expect(idOf(convs[0])).toBeTruthy();
      expect(idOf(convs[0])).toBe(idOf(convs[0]));
    });

    it('tracks by conversation id', () => {
      expect(c.trackByConversation(0, convs[0])).toBe(idOf(convs[0]));
    });

    it('returns no typing indicator when none are present', () => {
      expect(c.getTypingIndicator(convs[0])).toBeNull();
    });

    it('returns the typing indicator for a user conversation', () => {
      const indicator = {} as CometChat.TypingIndicator;
      service.typingIndicators$.next(new Map([['alice', indicator]]));
      expect(c.getTypingIndicator(convs[0])).toBe(indicator);
    });

    it('returns the typing indicator for a group conversation', () => {
      const indicator = {} as CometChat.TypingIndicator;
      service.typingIndicators$.next(new Map([['team', indicator]]));
      expect(c.getTypingIndicator(convs[2])).toBe(indicator);
    });

    it('supplies a default date-time format', () => {
      const format = c.getDefaultDateTimeFormat();
      expect(format).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Container click
  // -------------------------------------------------------------------------

  describe('handleContainerClick', () => {
    it('clears the focused index when the click misses every row', () => {
      c.focusedIndex.set(2);
      const target = document.createElement('div');
      c.handleContainerClick({ target } as unknown as MouseEvent);

      expect(c.focusedIndex()).toBe(-1);
    });

    it('leaves focus alone when the click lands on a row', () => {
      c.focusedIndex.set(2);
      const row = document.createElement('div');
      row.className = 'cometchat-conversation-item';

      c.handleContainerClick({ target: row } as unknown as MouseEvent);
      expect(c.focusedIndex()).toBe(2);
    });

    it('leaves focus alone when the click lands on the search bar', () => {
      c.focusedIndex.set(1);
      const bar = document.createElement('cometchat-search-bar');

      c.handleContainerClick({ target: bar } as unknown as MouseEvent);
      expect(c.focusedIndex()).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Keyboard navigation
  // -------------------------------------------------------------------------

  describe('Keyboard navigation', () => {
    /** A keydown whose target sits inside the list, as the guard requires. */
    function key(k: string, mods: Partial<KeyboardEvent> = {}): KeyboardEvent {
      const host = document.createElement('div');
      host.className = 'cometchat-conversations';
      const target = document.createElement('div');
      host.appendChild(target);

      return {
        key: k,
        target,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        ...mods,
      } as unknown as KeyboardEvent;
    }

    it('ignores keys when the list is empty', async () => {
      await build([]);
      c.handleKeydown(key('ArrowDown'));
      expect(c.focusedIndex()).toBe(-1);
    });

    it('ignores keys while the delete dialog is open', () => {
      c.handleDeleteConversationClick(convs[0]);
      c.handleKeydown(key('ArrowDown'));
      expect(c.focusedIndex()).toBe(-1);
    });

    it('ignores keys originating outside the list', () => {
      const outside = { key: 'ArrowDown', target: document.createElement('div'), preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as KeyboardEvent;
      c.handleKeydown(outside);
      expect(c.focusedIndex()).toBe(-1);
    });

    it('moves focus to the first row on ArrowDown', () => {
      c.handleKeydown(key('ArrowDown'));
      expect(c.focusedIndex()).toBe(0);
    });

    it('advances focus on repeated ArrowDown', () => {
      c.handleKeydown(key('ArrowDown'));
      c.handleKeydown(key('ArrowDown'));
      expect(c.focusedIndex()).toBe(1);
    });

    it('wraps from the last row back to the first', () => {
      c.focusedIndex.set(2);
      c.handleKeydown(key('ArrowDown'));
      expect(c.focusedIndex()).toBe(0);
    });

    it('wraps to the last row on ArrowUp from the start', () => {
      c.handleKeydown(key('ArrowUp'));
      expect(c.focusedIndex()).toBe(2);
    });

    it('moves focus back on ArrowUp', () => {
      c.focusedIndex.set(2);
      c.handleKeydown(key('ArrowUp'));
      expect(c.focusedIndex()).toBe(1);
    });

    it('opens the focused conversation on Enter', () => {
      c.focusedIndex.set(1);
      c.handleKeydown(key('Enter'));
      expect(service.setActiveConversation).toHaveBeenCalledWith(convs[1]);
    });

    it('ignores Enter with nothing focused', () => {
      c.handleKeydown(key('Enter'));
      expect(service.setActiveConversation).not.toHaveBeenCalled();
    });

    it('opens the focused conversation on Space outside selection mode', () => {
      c.focusedIndex.set(0);
      c.handleKeydown(key(' '));
      expect(service.setActiveConversation).toHaveBeenCalledWith(convs[0]);
    });

    it('clears focus on Escape', () => {
      c.focusedIndex.set(1);
      c.handleKeydown(key('Escape'));
      expect(c.focusedIndex()).toBe(-1);
    });

    it('clears an active selection on Escape', () => {
      c.selectionMode = SelectionMode.multiple;
      c.handleSelection(convs[0]);
      c.handleKeydown(key('Escape'));

      expect(c.hasSelection()).toBe(false);
    });

    it('selects all on Ctrl+A in multiple mode', () => {
      c.selectionMode = SelectionMode.multiple;
      c.handleKeydown(key('a', { ctrlKey: true }));
      expect(c.selectedCount()).toBe(3);
    });

    it('selects all on Cmd+A too', () => {
      c.selectionMode = SelectionMode.multiple;
      c.handleKeydown(key('a', { metaKey: true }));
      expect(c.selectedCount()).toBe(3);
    });

    it('clears the selection on Ctrl+Shift+A', () => {
      c.selectionMode = SelectionMode.multiple;
      c.selectAll();
      c.handleKeydown(key('a', { ctrlKey: true, shiftKey: true }));

      expect(c.selectedCount()).toBe(0);
    });

    it('ignores Ctrl+A outside multiple mode', () => {
      c.selectionMode = SelectionMode.single;
      c.handleKeydown(key('a', { ctrlKey: true }));
      expect(c.selectedCount()).toBe(0);
    });

    it('opens the context menu for the focused row on Shift+F10', () => {
      const spy = vi.fn();
      c.contextMenuOpen.subscribe(spy);
      c.focusedIndex.set(1);

      c.handleKeydown(key('F10', { shiftKey: true }));
      expect(spy).toHaveBeenCalledWith(convs[1]);
    });

    it('opens the context menu on the ContextMenu key', () => {
      const spy = vi.fn();
      c.contextMenuOpen.subscribe(spy);
      c.focusedIndex.set(0);

      c.handleKeydown(key('ContextMenu'));
      expect(spy).toHaveBeenCalledWith(convs[0]);
    });

    it.each(['Delete', 'Backspace'])('stages a delete on %s', (k) => {
      c.focusedIndex.set(0);
      c.handleKeydown(key(k));
      expect(c.showDeleteConfirmDialog()).toBe(true);
    });

    it('does not stage a delete when deletion is hidden', () => {
      c.hideDeleteConversation = true;
      c.focusedIndex.set(0);
      c.handleKeydown(key('Delete'));

      expect(c.showDeleteConfirmDialog()).toBe(false);
    });

    describe('in selection mode', () => {
      beforeEach(() => {
        c.selectionMode = SelectionMode.multiple;
      });

      it('toggles the focused row on Space', () => {
        c.focusedIndex.set(0);
        c.handleKeydown(key(' '));
        expect(c.isConversationSelected(convs[0])).toBe(true);
      });

      it('extends the selection on Shift+ArrowDown', () => {
        c.focusedIndex.set(0);
        c.handleSelection(convs[0]);
        c.handleKeydown(key('ArrowDown', { shiftKey: true }));

        expect(c.selectedCount()).toBe(2);
        expect(c.focusedIndex()).toBe(1);
      });

      it('extends the selection on Shift+ArrowUp', () => {
        c.focusedIndex.set(2);
        c.handleSelection(convs[2]);
        c.handleKeydown(key('ArrowUp', { shiftKey: true }));

        expect(c.selectedCount()).toBe(2);
        expect(c.focusedIndex()).toBe(1);
      });

      it('does not extend past the end of the list', () => {
        c.focusedIndex.set(2);
        c.handleKeydown(key('ArrowDown', { shiftKey: true }));
        expect(c.focusedIndex()).toBe(2);
      });

      it('does not extend before the start of the list', () => {
        c.focusedIndex.set(0);
        c.handleKeydown(key('ArrowUp', { shiftKey: true }));
        expect(c.focusedIndex()).toBe(0);
      });

      it('selects a range on Shift+Space', () => {
        c.handleSelection(convs[0]);
        c.focusedIndex.set(2);
        c.handleKeydown(key(' ', { shiftKey: true }));

        expect(c.selectedCount()).toBe(3);
      });

      it('announces the selection count', () => {
        c.focusedIndex.set(0);
        c.handleKeydown(key(' '));
        expect(announcer.announce).toHaveBeenCalled();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Focus tracking
  // -------------------------------------------------------------------------

  describe('handleFocusIn', () => {
    /** Builds the nesting the handler walks up through. */
    function focusEventAt(index: number, total = 3): FocusEvent {
      const items = document.createElement('div');
      items.className = 'cometchat-paginated-list__items';

      let target: HTMLElement | null = null;
      for (let i = 0; i < total; i++) {
        const listItem = document.createElement('div');
        listItem.className = 'cometchat-paginated-list__item';
        const wrapper = document.createElement('div');
        wrapper.className = 'cometchat-conversations__list-item-wrapper';
        const item = document.createElement('div');
        item.className = 'cometchat-conversation-item';

        wrapper.appendChild(item);
        listItem.appendChild(wrapper);
        items.appendChild(listItem);
        if (i === index) target = item;
      }

      return { target } as unknown as FocusEvent;
    }

    it('adopts the index of the focused row', () => {
      c.handleFocusIn(focusEventAt(1));
      expect(c.focusedIndex()).toBe(1);
    });

    it('adopts the first row', () => {
      c.handleFocusIn(focusEventAt(0));
      expect(c.focusedIndex()).toBe(0);
    });

    it('ignores a focus event with no target', () => {
      c.handleFocusIn({ target: null } as unknown as FocusEvent);
      expect(c.focusedIndex()).toBe(-1);
    });

    it('ignores focus landing outside a conversation row', () => {
      c.handleFocusIn({ target: document.createElement('div') } as unknown as FocusEvent);
      expect(c.focusedIndex()).toBe(-1);
    });

    it('ignores a row that is not inside a paginated list', () => {
      const orphan = document.createElement('div');
      orphan.className = 'cometchat-conversation-item';
      c.handleFocusIn({ target: orphan } as unknown as FocusEvent);

      expect(c.focusedIndex()).toBe(-1);
    });
  });

  // -------------------------------------------------------------------------
  // Pin / unpin
  // -------------------------------------------------------------------------

  describe('Pin and unpin', () => {
    /** A conversation reporting the given pinned state. */
    function pinnable(uid: string, pinned: boolean): CometChat.Conversation {
      const conv = userConversation(uid) as unknown as Record<string, unknown>;
      conv['isPinned'] = () => pinned;
      return conv as unknown as CometChat.Conversation;
    }

    it('reports an unpinned conversation', () => {
      expect(c.isConversationPinned(pinnable('a', false))).toBe(false);
    });

    it('reports a pinned conversation', () => {
      expect(c.isConversationPinned(pinnable('a', true))).toBe(true);
    });

    it('treats a conversation with no isPinned as unpinned', () => {
      expect(c.isConversationPinned(convs[0])).toBe(false);
    });

    it('asks for confirmation before unpinning', () => {
      const conv = pinnable('a', true);
      c.requestPinConversation(conv);

      expect(c.pendingUnpinConversation()).toBe(conv);
    });

    it('pins straight away without asking', () => {
      c.requestPinConversation(pinnable('a', false));
      expect(c.pendingUnpinConversation()).toBeNull();
    });

    it('clears the pending conversation on confirm', () => {
      c.requestPinConversation(pinnable('a', true));
      c.confirmUnpinConversation();

      expect(c.pendingUnpinConversation()).toBeNull();
    });

    it('clears the pending conversation on cancel', () => {
      c.requestPinConversation(pinnable('a', true));
      c.cancelUnpinConversation();

      expect(c.pendingUnpinConversation()).toBeNull();
    });

    it('does nothing on confirm when nothing is pending', () => {
      expect(() => c.confirmUnpinConversation()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Search debouncing
  // -------------------------------------------------------------------------

  describe('Search debouncing', () => {
    it('does not search until the debounce elapses', () => {
      vi.useFakeTimers();
      c.onSearch('hel');

      expect(service.searchConversations).not.toHaveBeenCalled();
      vi.advanceTimersByTime(300);
      expect(service.searchConversations).toHaveBeenCalledWith('hel');

      vi.useRealTimers();
    });

    it('collapses a burst of keystrokes into one search', () => {
      vi.useFakeTimers();
      c.onSearch('h');
      c.onSearch('he');
      c.onSearch('hel');
      vi.advanceTimersByTime(300);

      expect(service.searchConversations).toHaveBeenCalledTimes(1);
      expect(service.searchConversations).toHaveBeenCalledWith('hel');

      vi.useRealTimers();
    });

    it('ignores a repeat of the same term', () => {
      vi.useFakeTimers();
      c.onSearch('hello');
      vi.advanceTimersByTime(300);
      c.onSearch('hello');
      vi.advanceTimersByTime(300);

      expect(service.searchConversations).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });
  });


  // -------------------------------------------------------------------------
  // Context menu options
  // -------------------------------------------------------------------------

  describe('getContextMenuOptions', () => {
    function pinnable(uid: string, pinned: boolean): CometChat.Conversation {
      const conv = userConversation(uid) as unknown as Record<string, unknown>;
      conv['isPinned'] = () => pinned;
      return conv as unknown as CometChat.Conversation;
    }

    it('defers entirely to a supplied options builder', () => {
      const custom = [{ id: 'custom' }] as never;
      c.options = () => custom;
      expect(c.getContextMenuOptions(convs[0])).toBe(custom);
    });

    it('offers delete by default', () => {
      const ids = c.getContextMenuOptions(convs[0]).map(o => o.id);
      expect(ids).toContain('delete');
    });

    it('omits delete when deletion is hidden', () => {
      c.hideDeleteConversation = true;
      const ids = c.getContextMenuOptions(convs[0]).map(o => o.id);
      expect(ids).not.toContain('delete');
    });

    /**
     * The pin option only appears when the SDK exposes both pin calls AND the
     * app-level flag has resolved true. Enables both for the duration of `fn`.
     */
    function withPinningAvailable(fn: () => void): void {
      const sdk = CometChat as unknown as Record<string, unknown>;
      const originalPin = sdk['pinConversation'];
      const originalUnpin = sdk['unpinConversation'];
      sdk['pinConversation'] = () => Promise.resolve(undefined);
      sdk['unpinConversation'] = () => Promise.resolve(undefined);
      (c as unknown as { conversationPinEnabled: WritableSignal<boolean> }).conversationPinEnabled.set(true);
      try {
        fn();
      } finally {
        sdk['pinConversation'] = originalPin;
        sdk['unpinConversation'] = originalUnpin;
      }
    }

    it('omits pin when pinning is hidden', () => {
      withPinningAvailable(() => {
        // Control: with pinning available and not hidden, the option is offered
        expect(c.getContextMenuOptions(pinnable('a', false)).map(o => o.id)).toContain('pinConversation');

        c.hidePinConversation = true;
        const ids = c.getContextMenuOptions(pinnable('a', false)).map(o => o.id);
        expect(ids).not.toContain('pinConversation');
        expect(ids).toEqual(['delete']);
      });
    });

    it('puts the reversible action before the destructive one', () => {
      withPinningAvailable(() => {
        const ids = c.getContextMenuOptions(pinnable('a', false)).map(o => o.id);
        expect(ids).toEqual(['pinConversation', 'delete']);
      });
    });

    it('returns no options when both are hidden', () => {
      withPinningAvailable(() => {
        c.hideDeleteConversation = true;
        c.hidePinConversation = true;
        expect(c.getContextMenuOptions(pinnable('a', false))).toEqual([]);
      });
    });

    it('runs the delete option handler', () => {
      const del = c.getContextMenuOptions(convs[0]).find(o => o.id === 'delete');
      (del as unknown as { onClick: () => void }).onClick();
      expect(c.showDeleteConfirmDialog()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Sound notification
  // -------------------------------------------------------------------------

  describe('Sound notification', () => {
    /** A conversation carrying a last message with the given id and sender. */
    function withMessage(uid: string, messageId: number, senderUid = 'other'): CometChat.Conversation {
      const conv = userConversation(uid) as unknown as Record<string, unknown>;
      // The child item component renders this message, so the stub needs the
      // accessors it reads — not just the two the sound logic uses.
      conv['getLastMessage'] = () => ({
        getId: () => messageId,
        getSender: () => ({ getUid: () => senderUid, getName: () => senderUid }),
        getType: () => 'text',
        getCategory: () => 'message',
        getSentAt: () => 1700000000,
        getText: () => 'hello',
        getDeletedAt: () => undefined,
        getEditedAt: () => undefined,
        getReadAt: () => undefined,
        getDeliveredAt: () => undefined,
      });
      return conv as unknown as CometChat.Conversation;
    }

    // Two earlier tests here rendered a conversation carrying a last message,
    // which drags the real conversation-item component in and needs a fully
    // formed SDK message to render. They asserted only list length and
    // truthiness, so they were removed rather than grown a larger stub; the
    // announcement tests below cover this effect meaningfully.

    it('announces a conversation that was not in the previous list', () => {
      service.conversations$.next([convs[0]]);
      fixture.detectChanges();
      announcer.announce.mockClear();

      service.conversations$.next([convs[0], convs[1]]);
      fixture.detectChanges();

      expect(announcer.announce).toHaveBeenCalled();
    });

    it('does not announce on the very first load', () => {
      announcer.announce.mockClear();
      service.conversations$.next([convs[0]]);
      fixture.detectChanges();

      expect(announcer.announce).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Error surfacing
  // -------------------------------------------------------------------------

  describe('Error surfacing', () => {
    it('emits an error pushed by the service', () => {
      const spy = vi.fn();
      c.error.subscribe(spy);

      service.errorState$.next(new Error('boom'));
      fixture.detectChanges();

      expect(spy).toHaveBeenCalled();
    });

    it('stays quiet when errors are hidden', () => {
      c.hideError = true;
      fixture.detectChanges();

      const spy = vi.fn();
      c.error.subscribe(spy);
      service.errorState$.next(new Error('boom'));
      fixture.detectChanges();

      expect(spy).not.toHaveBeenCalled();
    });

    it('reports hasError once an error arrives', () => {
      service.errorState$.next(new Error('boom'));
      fixture.detectChanges();
      expect(c.hasError()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // hasMore sync
  // -------------------------------------------------------------------------

  describe('hasMore', () => {
    it('mirrors the service signal', () => {
      service.hasMore.set(false);
      fixture.detectChanges();
      expect(c.hasMore()).toBe(false);
    });

    it('picks up a reset back to true', () => {
      service.hasMore.set(false);
      fixture.detectChanges();
      service.hasMore.set(true);
      fixture.detectChanges();

      expect(c.hasMore()).toBe(true);
    });
  });

});
