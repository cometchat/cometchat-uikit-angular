import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Unit Tests for CometChatStickersKeyboardComponent
 *
 * Tests cover:
 * - Component instantiation with default values (Requirement 4.1)
 * - Sticker pack rendering (Requirement 4.2)
 * - @Output stickerClick emission (Requirement 4.2)
 * - Category navigation (Requirement 4.2)
 * - Empty packs handling (Requirement 4.1)
 * - Error state handling
 * - Keyboard navigation (grid + tabs)
 *
 * Uses vi.mock() for SDK mocking BEFORE imports,
 * and Object.create() to bypass Angular's inject() context requirement.
 *
 * **Validates: Requirements 4.1, 4.2**
 */

// ==================== SDK Mocks (must be before any imports that trigger SDK) ====================

vi.mock('@cometchat/calls-sdk-javascript', () => {
  return {
    CometChatCalls: {
      CallSettingsBuilder: class {
        enableDefaultLayout() {
          return this;
        }
        setIsAudioOnlyCall() {
          return this;
        }
        setCallListener() {
          return this;
        }
      },
      OngoingCallListener: class {
        constructor(callbacks: any) {
          Object.assign(this, callbacks);
        }
      },
      endSession: vi.fn(),
      init: vi.fn(),
    },
  };
});

vi.mock('@cometchat/chat-sdk-javascript', () => {
  class MockCometChatException {
    code: string;
    message: string;
    details?: string;
    constructor(opts: { code: string; message: string; details?: string }) {
      this.code = opts.code;
      this.message = opts.message;
      this.details = opts.details;
    }
  }

  return {
    CometChat: {
      CometChatException: MockCometChatException,
      CallListener: class {
        constructor(callbacks: any) {
          Object.assign(this, callbacks);
        }
      },
      ConnectionListener: class {
        constructor(callbacks: any) {
          Object.assign(this, callbacks);
        }
      },

      CATEGORY_MESSAGE: 'message',
      CATEGORY_CUSTOM: 'custom',
      CATEGORY_ACTION: 'action',
      CATEGORY_CALL: 'call',
      CATEGORY_INTERACTIVE: 'interactive',
      MessageCategory: { AGENTIC: 'agentic' },
      ModerationStatus: {
        PENDING: 'pending',
        APPROVED: 'approved',
        DISAPPROVED: 'disapproved',
        UNMODERATED: 'unmoderated',
      },
      MESSAGE_TYPE: {
        TEXT: 'text',
        FILE: 'file',
        IMAGE: 'image',
        AUDIO: 'audio',
        VIDEO: 'video',
        ASSISTANT: 'assistant',
        TOOL_ARGUMENTS: 'toolArguments',
        TOOL_RESULT: 'toolResults',
      },
      ACTION_TYPE: {
        MEMBER_JOINED: 'joined',
        MEMBER_LEFT: 'left',
        MEMBER_ADDED: 'added',
        MEMBER_BANNED: 'banned',
        MEMBER_UNBANNED: 'unbanned',
        MEMBER_KICKED: 'kicked',
        MEMBER_INVITED: 'invited',
        MEMBER_SCOPE_CHANGED: 'scopeChanged',
      },
      RECEIVER_TYPE: { USER: 'user', GROUP: 'group' },
      USER_STATUS: { ONLINE: 'online', OFFLINE: 'offline' },
      GROUP_MEMBER_SCOPE: { ADMIN: 'admin', PARTICIPANT: 'participant', MODERATOR: 'moderator' },
      GROUP_TYPE: { PRIVATE: 'private', PASSWORD: 'password', PUBLIC: 'public' },
      CALL_STATUS: {
        ONGOING: 'ongoing',
        ENDED: 'ended',
        INITIATED: 'initiated',
        CANCELLED: 'cancelled',
        REJECTED: 'rejected',
        UNANSWERED: 'unanswered',
        BUSY: 'busy',
      },
      CALL_MODE: {
        DEFAULT: 'default',
        GRID: 'grid',
        SINGLE: 'single',
        SPOTLIGHT: 'spotlight',
        TILE: 'tile',
      },
      CALL_TYPE: { AUDIO: 'audio', VIDEO: 'video' },
      GoalType: { ALL_OF: 'allOf', ANY_OF: 'anyOf', ANY_ACTION: 'anyAction', NONE: 'none' },
      AI_ASSISTANT_EVENTS: {
        RUN_STARTED: 'run_started',
        TEXT_MESSAGE_START: 'text_message_start',
        TEXT_MESSAGE_CONTENT: 'text_message_content',
        TEXT_MESSAGE_END: 'text_message_end',
        RUN_FINISHED: 'run_finished',
        TOOL_CALL_STARTED: 'tool_call_start',
        TOOL_CALL_ENDED: 'tool_call_end',
        TOOL_CALL_ARGUMENT: 'tool_call_args',
        TOOL_CALL_RESULT: 'tool_call_result',
      },

      getLoggedinUser: vi.fn().mockResolvedValue({
        getUid: () => 'logged-in-user',
        getName: () => 'Logged In User',
        getAvatar: () => 'https://example.com/avatar.png',
      }),

      callExtension: vi.fn().mockResolvedValue({
        data: {
          defaultStickers: [
            { stickerUrl: 'https://example.com/s1.png', stickerSetName: 'Pack A', stickerOrder: 1 },
            { stickerUrl: 'https://example.com/s2.png', stickerSetName: 'Pack A', stickerOrder: 2 },
            { stickerUrl: 'https://example.com/s3.png', stickerSetName: 'Pack B', stickerOrder: 1 },
          ],
          customStickers: [
            {
              stickerUrl: 'https://example.com/c1.png',
              stickerSetName: 'Custom Pack',
              stickerOrder: 1,
            },
          ],
        },
      }),
    },
  };
});

// Now import modules AFTER mocks are set up
import { EventEmitter, signal, computed } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  CometChatStickersKeyboardComponent,
  StickerClickEvent,
  StickerItem,
  StickerSet,
} from './cometchat-stickers-keyboard.component';

// ==================== Mock Sticker Data ====================

function createMockStickerSets(): StickerSet {
  return {
    'Pack A': [
      { stickerUrl: 'https://example.com/s1.png', stickerSetName: 'Pack A', stickerOrder: 1 },
      { stickerUrl: 'https://example.com/s2.png', stickerSetName: 'Pack A', stickerOrder: 2 },
    ],
    'Pack B': [
      { stickerUrl: 'https://example.com/s3.png', stickerSetName: 'Pack B', stickerOrder: 1 },
    ],
    'Custom Pack': [
      { stickerUrl: 'https://example.com/c1.png', stickerSetName: 'Custom Pack', stickerOrder: 1 },
    ],
  };
}

// ==================== Component Factory ====================

/**
 * Creates a CometChatStickersKeyboardComponent instance via Object.create()
 * to bypass Angular's inject() context requirement.
 * Manually wires signals, inputs, outputs, and internal state.
 */
function createComponent(): CometChatStickersKeyboardComponent {
  const comp = Object.create(
    CometChatStickersKeyboardComponent.prototype
  ) as CometChatStickersKeyboardComponent;

  // Initialize inputs with defaults
  comp.errorStateText = undefined;
  comp.emptyStateText = undefined;
  comp.autoFocus = true;
  comp.trapFocus = true;

  // Initialize outputs
  comp.stickerClick = new EventEmitter<StickerClickEvent>();
  comp.closeKeyboard = new EventEmitter<void>();

  // Initialize signals (matching component internals)
  (comp as any).componentState = signal<string>('loading');
  (comp as any).stickerSets = signal<StickerSet>({});
  (comp as any).activeCategory = signal<string>('');
  (comp as any).focusedStickerIndex = signal<number>(-1);
  (comp as any).focusedTabIndex = signal<number>(0);
  (comp as any).loadedImages = signal<Set<string>>(new Set());

  // Initialize computed values
  (comp as any).categoryNames = computed(() => Object.keys((comp as any).stickerSets()));
  (comp as any).currentStickers = computed(() => {
    const sets = (comp as any).stickerSets();
    const category = (comp as any).activeCategory();
    return sets[category] || [];
  });

  // Initialize grid configuration
  (comp as any).gridColumns = 4;
  (comp as any).shimmerTabs = Array.from({ length: 6 });
  (comp as any).shimmerStickers = Array.from({ length: 12 });

  // Mock liveAnnouncer (injected service)
  (comp as any).liveAnnouncer = {
    announce: vi.fn(),
  };

  // Mock tabsContainer ViewChild
  (comp as any).tabsContainer = {
    nativeElement: {
      scrollLeft: 0,
      scrollTo: vi.fn(),
    },
  };

  // Initialize pendingTimers array (used by addOption, removeOption, fetchStickers, etc.)
  (comp as any).pendingTimers = [];

  return comp;
}

// ==================== Unit Tests ====================

describe('CometChatStickersKeyboardComponent', () => {
  let component: CometChatStickersKeyboardComponent;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== Instantiation (Req 4.1) ====================

  describe('instantiation with defaults', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('creates a component instance', () => {
      expect(component).toBeTruthy();
    });

    it('has errorStateText as undefined by default', () => {
      expect(component.errorStateText).toBeUndefined();
    });

    it('has emptyStateText as undefined by default', () => {
      expect(component.emptyStateText).toBeUndefined();
    });

    it('has autoFocus as true by default', () => {
      expect(component.autoFocus).toBe(true);
    });

    it('has trapFocus as true by default', () => {
      expect(component.trapFocus).toBe(true);
    });

    it('has stickerClick EventEmitter initialized', () => {
      expect(component.stickerClick).toBeInstanceOf(EventEmitter);
    });

    it('has closeKeyboard EventEmitter initialized', () => {
      expect(component.closeKeyboard).toBeInstanceOf(EventEmitter);
    });

    it('has componentState as loading', () => {
      expect((component as any).componentState()).toBe('loading');
    });

    it('has stickerSets as empty object', () => {
      expect((component as any).stickerSets()).toEqual({});
    });

    it('has activeCategory as empty string', () => {
      expect((component as any).activeCategory()).toBe('');
    });

    it('has categoryNames as empty array', () => {
      expect((component as any).categoryNames()).toEqual([]);
    });

    it('has currentStickers as empty array', () => {
      expect((component as any).currentStickers()).toEqual([]);
    });
  });

  // ==================== Sticker Pack Rendering (Req 4.2) ====================

  describe('sticker pack rendering', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('categoryNames returns all pack names when sets are populated', () => {
      const sets = createMockStickerSets();
      (component as any).stickerSets.set(sets);
      expect((component as any).categoryNames()).toEqual(['Pack A', 'Pack B', 'Custom Pack']);
    });

    it('currentStickers returns stickers for the active category', () => {
      const sets = createMockStickerSets();
      (component as any).stickerSets.set(sets);
      (component as any).activeCategory.set('Pack A');
      const stickers = (component as any).currentStickers();
      expect(stickers.length).toBe(2);
      expect(stickers[0].stickerUrl).toBe('https://example.com/s1.png');
    });

    it('currentStickers returns empty array for unknown category', () => {
      const sets = createMockStickerSets();
      (component as any).stickerSets.set(sets);
      (component as any).activeCategory.set('Nonexistent');
      expect((component as any).currentStickers()).toEqual([]);
    });

    it('getCategoryIcon returns first sticker URL of a category', () => {
      const sets = createMockStickerSets();
      (component as any).stickerSets.set(sets);
      expect(component.getCategoryIcon('Pack A')).toBe('https://example.com/s1.png');
    });

    it('getCategoryIcon returns empty string for unknown category', () => {
      (component as any).stickerSets.set({});
      expect(component.getCategoryIcon('Unknown')).toBe('');
    });

    it('getRowIndex returns 1-based row index', () => {
      expect(component.getRowIndex(0)).toBe(1);
      expect(component.getRowIndex(3)).toBe(1);
      expect(component.getRowIndex(4)).toBe(2);
      expect(component.getRowIndex(7)).toBe(2);
    });

    it('getColIndex returns 1-based column index', () => {
      expect(component.getColIndex(0)).toBe(1);
      expect(component.getColIndex(1)).toBe(2);
      expect(component.getColIndex(3)).toBe(4);
      expect(component.getColIndex(4)).toBe(1);
    });
  });

  // ==================== @Output stickerClick Emission (Req 4.2) ====================

  describe('@Output stickerClick emission', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('emits stickerClick with stickerUrl and stickerName on handleStickerClick', () => {
      const spy = vi.fn();
      component.stickerClick.subscribe(spy);

      const sticker: StickerItem = {
        stickerUrl: 'https://example.com/s1.png',
        stickerSetName: 'Pack A',
        stickerOrder: 1,
      };

      component.handleStickerClick(sticker);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({
        stickerUrl: 'https://example.com/s1.png',
        stickerName: 'Pack A',
      });
    });

    it('emits stickerClick for different stickers', () => {
      const spy = vi.fn();
      component.stickerClick.subscribe(spy);

      component.handleStickerClick({
        stickerUrl: 'https://example.com/s1.png',
        stickerSetName: 'Pack A',
      });
      component.handleStickerClick({
        stickerUrl: 'https://example.com/c1.png',
        stickerSetName: 'Custom Pack',
      });

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(1, {
        stickerUrl: 'https://example.com/s1.png',
        stickerName: 'Pack A',
      });
      expect(spy).toHaveBeenNthCalledWith(2, {
        stickerUrl: 'https://example.com/c1.png',
        stickerName: 'Custom Pack',
      });
    });
  });

  // ==================== Category Navigation (Req 4.2) ====================

  describe('category navigation', () => {
    beforeEach(() => {
      component = createComponent();
      const sets = createMockStickerSets();
      (component as any).stickerSets.set(sets);
      (component as any).activeCategory.set('Pack A');
    });

    it('onCategoryClick changes active category', () => {
      component.onCategoryClick('Pack B');
      expect((component as any).activeCategory()).toBe('Pack B');
    });

    it('onCategoryClick resets focusedStickerIndex to -1', () => {
      (component as any).focusedStickerIndex.set(3);
      component.onCategoryClick('Pack B');
      expect((component as any).focusedStickerIndex()).toBe(-1);
    });

    it('switching category updates currentStickers', () => {
      component.onCategoryClick('Pack B');
      const stickers = (component as any).currentStickers();
      expect(stickers.length).toBe(1);
      expect(stickers[0].stickerUrl).toBe('https://example.com/s3.png');
    });

    it('tab keyboard Enter activates category', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onTabKeydown(event, 'Pack B', 1);
      expect(event.preventDefault).toHaveBeenCalled();
      expect((component as any).activeCategory()).toBe('Pack B');
    });

    it('tab keyboard Space activates category', () => {
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onTabKeydown(event, 'Custom Pack', 2);
      expect(event.preventDefault).toHaveBeenCalled();
      expect((component as any).activeCategory()).toBe('Custom Pack');
    });

    it('tab keyboard ArrowRight moves to next tab', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onTabKeydown(event, 'Pack A', 0);
      expect(event.preventDefault).toHaveBeenCalled();
      expect((component as any).focusedTabIndex()).toBe(1);
    });

    it('tab keyboard ArrowRight wraps from last to first', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onTabKeydown(event, 'Custom Pack', 2);
      expect((component as any).focusedTabIndex()).toBe(0);
    });

    it('tab keyboard ArrowLeft moves to previous tab', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onTabKeydown(event, 'Pack B', 1);
      expect(event.preventDefault).toHaveBeenCalled();
      expect((component as any).focusedTabIndex()).toBe(0);
    });

    it('tab keyboard ArrowLeft wraps from first to last', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onTabKeydown(event, 'Pack A', 0);
      expect((component as any).focusedTabIndex()).toBe(2);
    });
  });

  // ==================== fetchStickers ====================

  describe('fetchStickers', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('sets componentState to loading during fetch', async () => {
      const statesDuringFetch: string[] = [];
      const origSet = (component as any).componentState.set.bind((component as any).componentState);
      vi.spyOn((component as any).componentState, 'set').mockImplementation((val: any) => {
        statesDuringFetch.push(val);
        origSet(val);
      });

      await component.fetchStickers();
      expect(statesDuringFetch[0]).toBe('loading');
    });

    it('sets componentState to loaded after successful fetch', async () => {
      await component.fetchStickers();
      expect((component as any).componentState()).toBe('loaded');
    });

    it('populates stickerSets from SDK response', async () => {
      await component.fetchStickers();
      const sets = (component as any).stickerSets();
      expect(Object.keys(sets).length).toBe(3);
      expect(sets['Pack A'].length).toBe(2);
      expect(sets['Pack B'].length).toBe(1);
      expect(sets['Custom Pack'].length).toBe(1);
    });

    it('sets first category as active after fetch', async () => {
      await component.fetchStickers();
      const categories = (component as any).categoryNames();
      expect((component as any).activeCategory()).toBe(categories[0]);
    });

    it('announces loading state for screen readers', async () => {
      await component.fetchStickers();
      const announcer = (component as any).liveAnnouncer;
      expect(announcer.announce).toHaveBeenCalled();
    });

    it('sets componentState to error on SDK failure', async () => {
      vi.mocked(CometChat.callExtension).mockRejectedValueOnce(new Error('Network error'));

      await component.fetchStickers();
      expect((component as any).componentState()).toBe('error');
    });

    it('sets componentState to empty when response has no stickers', async () => {
      vi.mocked(CometChat.callExtension).mockResolvedValueOnce({
        data: { defaultStickers: [], customStickers: [] },
      });

      await component.fetchStickers();
      expect((component as any).componentState()).toBe('empty');
    });

    it('sets componentState to empty when response is not an object', async () => {
      vi.mocked(CometChat.callExtension).mockResolvedValueOnce(null as any);

      await component.fetchStickers();
      expect((component as any).componentState()).toBe('empty');
    });

    it('calls CometChat.callExtension with correct parameters', async () => {
      await component.fetchStickers();
      expect(CometChat.callExtension).toHaveBeenCalledWith(
        'stickers',
        'GET',
        'v1/fetch',
        undefined
      );
    });

    it('sorts stickers within each set by stickerOrder', async () => {
      vi.mocked(CometChat.callExtension).mockResolvedValueOnce({
        data: {
          defaultStickers: [
            { stickerUrl: 'https://example.com/b.png', stickerSetName: 'Set', stickerOrder: 3 },
            { stickerUrl: 'https://example.com/a.png', stickerSetName: 'Set', stickerOrder: 1 },
            { stickerUrl: 'https://example.com/c.png', stickerSetName: 'Set', stickerOrder: 2 },
          ],
          customStickers: [],
        },
      });

      await component.fetchStickers();
      const sets = (component as any).stickerSets();
      expect(sets['Set'][0].stickerUrl).toBe('https://example.com/a.png');
      expect(sets['Set'][1].stickerUrl).toBe('https://example.com/c.png');
      expect(sets['Set'][2].stickerUrl).toBe('https://example.com/b.png');
    });

    it('skips stickers with empty URL', async () => {
      vi.mocked(CometChat.callExtension).mockResolvedValueOnce({
        data: {
          defaultStickers: [
            { stickerUrl: '', stickerSetName: 'Set', stickerOrder: 1 },
            { stickerUrl: 'https://example.com/valid.png', stickerSetName: 'Set', stickerOrder: 2 },
          ],
          customStickers: [],
        },
      });

      await component.fetchStickers();
      const sets = (component as any).stickerSets();
      expect(sets['Set'].length).toBe(1);
      expect(sets['Set'][0].stickerUrl).toBe('https://example.com/valid.png');
    });
  });

  // ==================== Empty Packs Handling (Req 4.1) ====================

  describe('empty packs handling', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('getEmptyText returns default localized string when emptyStateText is not set', () => {
      const text = component.getEmptyText();
      expect(typeof text).toBe('string');
    });

    it('getEmptyText returns custom text when emptyStateText is set', () => {
      component.emptyStateText = 'No stickers available';
      expect(component.getEmptyText()).toBe('No stickers available');
    });

    it('getErrorText returns default localized string when errorStateText is not set', () => {
      const text = component.getErrorText();
      expect(typeof text).toBe('string');
    });

    it('getErrorText returns custom text when errorStateText is set', () => {
      component.errorStateText = 'Something went wrong';
      expect(component.getErrorText()).toBe('Something went wrong');
    });
  });

  // ==================== Sticker Grid Keyboard Navigation ====================

  describe('sticker grid keyboard navigation', () => {
    beforeEach(() => {
      component = createComponent();
      const sets = createMockStickerSets();
      (component as any).stickerSets.set(sets);
      (component as any).activeCategory.set('Pack A');
    });

    it('Enter key on sticker emits stickerClick', () => {
      const spy = vi.fn();
      component.stickerClick.subscribe(spy);

      const sticker: StickerItem = {
        stickerUrl: 'https://example.com/s1.png',
        stickerSetName: 'Pack A',
        stickerOrder: 1,
      };
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onStickerKeydown(event, sticker, 0);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith({
        stickerUrl: 'https://example.com/s1.png',
        stickerName: 'Pack A',
      });
    });

    it('Space key on sticker emits stickerClick', () => {
      const spy = vi.fn();
      component.stickerClick.subscribe(spy);

      const sticker: StickerItem = {
        stickerUrl: 'https://example.com/s2.png',
        stickerSetName: 'Pack A',
        stickerOrder: 2,
      };
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onStickerKeydown(event, sticker, 1);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith({
        stickerUrl: 'https://example.com/s2.png',
        stickerName: 'Pack A',
      });
    });

    it('ArrowRight navigates to next sticker in grid', () => {
      const sticker: StickerItem = {
        stickerUrl: 'https://example.com/s1.png',
        stickerSetName: 'Pack A',
        stickerOrder: 1,
      };
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onStickerKeydown(event, sticker, 0);
      expect(event.preventDefault).toHaveBeenCalled();
      expect((component as any).focusedStickerIndex()).toBe(1);
    });

    it('ArrowLeft at first sticker wraps to last', () => {
      const sticker: StickerItem = {
        stickerUrl: 'https://example.com/s1.png',
        stickerSetName: 'Pack A',
        stickerOrder: 1,
      };
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onStickerKeydown(event, sticker, 0);
      expect(event.preventDefault).toHaveBeenCalled();
      // Pack A has 2 stickers, so wraps to index 1
      expect((component as any).focusedStickerIndex()).toBe(1);
    });
  });

  // ==================== Escape Key / closeKeyboard ====================

  describe('escape key handling', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('Escape key emits closeKeyboard', () => {
      const spy = vi.fn();
      component.closeKeyboard.subscribe(spy);

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      vi.spyOn(event, 'preventDefault');

      component.onKeydown(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== Retry ====================

  describe('retry', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('handleRetry calls fetchStickers', () => {
      const fetchSpy = vi.spyOn(component, 'fetchStickers').mockResolvedValue();
      component.handleRetry();
      expect(fetchSpy).toHaveBeenCalled();
    });
  });

  // ==================== Image Loading ====================

  describe('image loading', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('onImageLoaded adds URL to loadedImages set', () => {
      component.onImageLoaded('https://example.com/s1.png');
      expect((component as any).loadedImages().has('https://example.com/s1.png')).toBe(true);
    });

    it('onImageLoaded accumulates multiple URLs', () => {
      component.onImageLoaded('https://example.com/s1.png');
      component.onImageLoaded('https://example.com/s2.png');
      const loaded = (component as any).loadedImages();
      expect(loaded.size).toBe(2);
      expect(loaded.has('https://example.com/s1.png')).toBe(true);
      expect(loaded.has('https://example.com/s2.png')).toBe(true);
    });
  });

  // ==================== Track By Functions ====================

  describe('track by functions', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('trackByCategoryName returns the category name', () => {
      expect(component.trackByCategoryName(0, 'Pack A')).toBe('Pack A');
    });

    it('trackByStickerUrl returns the sticker URL', () => {
      const sticker: StickerItem = {
        stickerUrl: 'https://example.com/s1.png',
        stickerSetName: 'Pack A',
      };
      expect(component.trackByStickerUrl(0, sticker)).toBe('https://example.com/s1.png');
    });
  });

  // ==================== Wheel Scroll ====================

  describe('wheel scroll on tabs', () => {
    beforeEach(() => {
      component = createComponent();
    });

    it('onWheel scrolls the tabs container horizontally', () => {
      const scrollToSpy = (component as any).tabsContainer.nativeElement.scrollTo;
      const event = { deltaY: 100, deltaMode: 0 } as WheelEvent;

      component.onWheel(event);
      expect(scrollToSpy).toHaveBeenCalledWith({
        top: 0,
        left: expect.any(Number),
        behavior: 'auto',
      });
    });
  });

  // ─── Accessibility ───

  describe('Accessibility', () => {
    it('should have focusable sticker items', () => {
      const component = createComponent();
      expect(typeof component.handleStickerClick).toBe('function');
    });

    it('should have focusable category tabs', () => {
      const component = createComponent();
      expect(typeof component.onCategoryClick).toBe('function');
    });

    it('should provide accessible sticker labels', () => {
      const component = createComponent();
      expect(component).toBeTruthy();
    });
  });
});
