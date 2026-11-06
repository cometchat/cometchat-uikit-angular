/**
 * cometchat-message-composer.mentions-handler Tests
 *
 * Covers: checkForMentionTriggerImpl, fetchMoreMentionsImpl, handleMentionsScrollImpl,
 *         selectMentionSuggestionImpl, scrollMentionIntoViewImpl,
 *         closeMentionSuggestionsImpl, updateMentionsCountImpl,
 *         initializeMentionsRequestBuilderImpl, checkIfSelfMentionImpl.
 *
 * @module components/cometchat-message-composer/mentions-handler
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  checkForMentionTriggerImpl,
  fetchMoreMentionsImpl,
  handleMentionsScrollImpl,
  selectMentionSuggestionImpl,
  scrollMentionIntoViewImpl,
  closeMentionSuggestionsImpl,
  updateMentionsCountImpl,
  initializeMentionsRequestBuilderImpl,
  checkIfSelfMentionImpl,
  MentionsHandlerContext,
} from './cometchat-message-composer.mentions-handler';
import { MENTIONS_LIMIT } from './cometchat-message-composer.component';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal writable-signal stand-in: callable for reads, with a spied `set`. */
function sig<T>(initial: T) {
  const box = { value: initial };
  const fn = (() => box.value) as unknown as { (): T; set: ReturnType<typeof vi.fn> };
  fn.set = vi.fn((v: T) => {
    box.value = v;
  });
  return fn;
}

function makeCtx(overrides: Partial<MentionsHandlerContext> = {}): MentionsHandlerContext {
  const ctx = {
    disableMentions: false,
    disableMentionAll: false,
    mentionAllLabel: 'All',
    mentionsUsersRequestBuilder: undefined,
    mentionsGroupMembersRequestBuilder: undefined,
    enableRichText: false,
    customRichTextEditor: null,

    richTextEditorService: {
      getText: vi.fn().mockReturnValue(''),
      getHTML: vi.fn().mockReturnValue(''),
      getUniqueMentionUids: vi.fn().mockReturnValue(new Set<string>()),
      insertMention: vi.fn(),
    },
    messageComposerService: {
      searchMentions: vi.fn(),
      fetchMoreMentions: vi.fn().mockResolvedValue(undefined),
      clearMentionSuggestions: vi.fn(),
      stopMentionSearch: vi.fn(),
      checkIfSelfMention: vi.fn().mockResolvedValue(false),
      initializeMentionsPagination: vi.fn(),
    },

    mentionSearchText: sig(''),
    isMentionSuggestionsOpen: sig(false),
    focusedMentionIndex: sig(0),
    uniqueMentionCount: sig(0),
    showMentionsCountWarning: sig(false),
    composerText: sig(''),
    cursorPosition: sig(0),

    mentionedUsersMap: new Map<string, CometChat.User>(),
    plainTextMentionUids: new Set<string>(),
    skipNextMentionCheck: false,
    currentGroup: () => null,

    textChange: { emit: vi.fn() },
    mentionSelected: { emit: vi.fn() },
    liveAnnouncerService: { announce: vi.fn() },
    cdr: { markForCheck: vi.fn() },

    focusRichTextEditor: vi.fn(),
    focusTextInput: vi.fn(),
    updateMentionsCount: vi.fn(),
    announceMentionInserted: vi.fn(),
    announceFocusedMention: vi.fn(),
  } as unknown as MentionsHandlerContext;

  return Object.assign(ctx, overrides);
}

/** A rich-text editor stub whose text/HTML the service mocks read back. */
function withRichEditor(ctx: MentionsHandlerContext, plainText: string, html = '') {
  (ctx as any).customRichTextEditor = { getText: () => plainText };
  (ctx.richTextEditorService as any).getText.mockReturnValue(plainText);
  (ctx.richTextEditorService as any).getHTML.mockReturnValue(html);
  return ctx;
}

const svc = (ctx: MentionsHandlerContext) => ctx.messageComposerService as any;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// closeMentionSuggestionsImpl
// ---------------------------------------------------------------------------

describe('closeMentionSuggestionsImpl', () => {
  it('closes the panel and clears the search', () => {
    const ctx = makeCtx();
    closeMentionSuggestionsImpl(ctx);

    expect(ctx.isMentionSuggestionsOpen.set).toHaveBeenCalledWith(false);
    expect(ctx.mentionSearchText.set).toHaveBeenCalledWith('');
    expect(ctx.focusedMentionIndex.set).toHaveBeenCalledWith(0);
    expect(svc(ctx).clearMentionSuggestions).toHaveBeenCalled();
    expect(svc(ctx).stopMentionSearch).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// checkForMentionTriggerImpl
// ---------------------------------------------------------------------------

describe('checkForMentionTriggerImpl', () => {
  it('does nothing while a mention insertion is settling', () => {
    const ctx = makeCtx({ skipNextMentionCheck: true });
    checkForMentionTriggerImpl(ctx, '@al', 3);
    expect(ctx.isMentionSuggestionsOpen.set).not.toHaveBeenCalled();
  });

  it('closes the panel once the mention limit is reached', () => {
    const ctx = makeCtx({ uniqueMentionCount: sig(MENTIONS_LIMIT) as any });
    checkForMentionTriggerImpl(ctx, '@al', 3);
    expect(ctx.isMentionSuggestionsOpen.set).toHaveBeenCalledWith(false);
  });

  describe('plain-text composer', () => {
    it('opens suggestions for the text after the last @', () => {
      const ctx = makeCtx();
      checkForMentionTriggerImpl(ctx, 'hi @al', 6);

      expect(ctx.mentionSearchText.set).toHaveBeenCalledWith('al');
      expect(ctx.focusedMentionIndex.set).toHaveBeenCalledWith(0);
      expect(ctx.isMentionSuggestionsOpen.set).toHaveBeenCalledWith(true);
    });

    it('closes when there is no @ before the cursor', () => {
      const ctx = makeCtx();
      checkForMentionTriggerImpl(ctx, 'hello there', 11);
      expect(ctx.isMentionSuggestionsOpen.set).toHaveBeenCalledWith(false);
    });

    it('closes once a space follows the @', () => {
      const ctx = makeCtx();
      checkForMentionTriggerImpl(ctx, '@al ice', 7);
      expect(ctx.isMentionSuggestionsOpen.set).toHaveBeenCalledWith(false);
    });

    it('only considers text before the cursor', () => {
      const ctx = makeCtx();
      checkForMentionTriggerImpl(ctx, '@alice extra', 3);
      expect(ctx.mentionSearchText.set).toHaveBeenCalledWith('al');
    });

    it('does not reset the focused index when the search text is unchanged', () => {
      const ctx = makeCtx({ mentionSearchText: sig('al') as any });
      checkForMentionTriggerImpl(ctx, 'hi @al', 6);
      expect(ctx.focusedMentionIndex.set).not.toHaveBeenCalled();
      expect(ctx.isMentionSuggestionsOpen.set).toHaveBeenCalledWith(true);
    });
  });

  describe('rich-text composer', () => {
    it('closes inside a code block', () => {
      const ctx = withRichEditor(makeCtx({ enableRichText: true }), '@al');
      const pre = document.createElement('pre');
      const text = document.createTextNode('@al');
      pre.appendChild(text);
      document.body.appendChild(pre);
      vi.spyOn(window, 'getSelection').mockReturnValue({
        rangeCount: 1,
        anchorNode: text,
      } as unknown as Selection);

      checkForMentionTriggerImpl(ctx, '@al', 3);
      expect(ctx.isMentionSuggestionsOpen.set).toHaveBeenCalledWith(false);
      pre.remove();
    });

    it('closes when the text holds no @ at all', () => {
      const ctx = withRichEditor(makeCtx(), 'hello');
      checkForMentionTriggerImpl(ctx, 'hello', 5);
      expect(ctx.isMentionSuggestionsOpen.set).toHaveBeenCalledWith(false);
    });

    it('closes when every @ already belongs to an inserted mention', () => {
      const ctx = withRichEditor(makeCtx(), '@alice', '<span data-uid="alice">@alice</span>');
      checkForMentionTriggerImpl(ctx, '@alice', 6);
      expect(ctx.isMentionSuggestionsOpen.set).toHaveBeenCalledWith(false);
    });

    it('opens for a fresh @ beyond the inserted mentions', () => {
      const ctx = withRichEditor(makeCtx(), '@alice @bo', '<span data-uid="alice">@alice</span>');
      checkForMentionTriggerImpl(ctx, '', 0);

      expect(ctx.mentionSearchText.set).toHaveBeenCalledWith('bo');
      expect(ctx.isMentionSuggestionsOpen.set).toHaveBeenCalledWith(true);
    });

    it.each([
      ['a space', '@al ice'],
      ['a non-breaking space', '@al ice'],
      ['a newline', '@al\nice'],
    ])('closes when the text after @ contains %s', (_label, plain) => {
      const ctx = withRichEditor(makeCtx(), plain);
      checkForMentionTriggerImpl(ctx, '', 0);
      expect(ctx.isMentionSuggestionsOpen.set).toHaveBeenCalledWith(false);
    });

    it('searches only when the term repeats, and not while mentions are disabled', () => {
      const ctx = withRichEditor(makeCtx({ mentionSearchText: sig('bo') as any }), '@bo');
      checkForMentionTriggerImpl(ctx, '', 0);
      expect(svc(ctx).searchMentions).toHaveBeenCalledWith(
        'bo',
        undefined,
        undefined,
        undefined,
        false,
        'All',
      );

      const disabled = withRichEditor(
        makeCtx({ disableMentions: true, mentionSearchText: sig('bo') as any }),
        '@bo',
      );
      checkForMentionTriggerImpl(disabled, '', 0);
      expect(svc(disabled).searchMentions).not.toHaveBeenCalled();
    });

    it('passes the active group through to the search', () => {
      const group = { getGuid: () => 'g1' } as CometChat.Group;
      const ctx = withRichEditor(
        makeCtx({ currentGroup: () => group, mentionSearchText: sig('bo') as any }),
        '@bo',
      );
      checkForMentionTriggerImpl(ctx, '', 0);
      expect(svc(ctx).searchMentions).toHaveBeenCalledWith(
        'bo',
        group,
        undefined,
        undefined,
        false,
        'All',
      );
    });
  });
});

// ---------------------------------------------------------------------------
// fetchMoreMentionsImpl / handleMentionsScrollImpl
// ---------------------------------------------------------------------------

describe('fetchMoreMentionsImpl', () => {
  it('fetches in user context and marks for check', async () => {
    const ctx = makeCtx();
    await fetchMoreMentionsImpl(ctx);
    expect(svc(ctx).fetchMoreMentions).toHaveBeenCalledWith(false);
    expect(ctx.cdr.markForCheck).toHaveBeenCalled();
  });

  it('fetches in group context when a group is active', async () => {
    const ctx = makeCtx({ currentGroup: () => ({ getGuid: () => 'g1' }) as CometChat.Group });
    await fetchMoreMentionsImpl(ctx);
    expect(svc(ctx).fetchMoreMentions).toHaveBeenCalledWith(true);
  });
});

describe('handleMentionsScrollImpl', () => {
  function scrollEvent(scrollTop: number, clientHeight = 100, scrollHeight = 500) {
    const el = document.createElement('div');
    Object.defineProperty(el, 'scrollTop', { value: scrollTop, configurable: true });
    Object.defineProperty(el, 'clientHeight', { value: clientHeight, configurable: true });
    Object.defineProperty(el, 'scrollHeight', { value: scrollHeight, configurable: true });
    return { target: el } as unknown as Event;
  }

  it('loads more within 50px of the bottom', () => {
    const ctx = makeCtx();
    handleMentionsScrollImpl(ctx, scrollEvent(360));
    expect(svc(ctx).fetchMoreMentions).toHaveBeenCalled();
  });

  it('does not load more further up the list', () => {
    const ctx = makeCtx();
    handleMentionsScrollImpl(ctx, scrollEvent(10));
    expect(svc(ctx).fetchMoreMentions).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// selectMentionSuggestionImpl
// ---------------------------------------------------------------------------

describe('selectMentionSuggestionImpl', () => {
  const suggestion = (over: Record<string, unknown> = {}) =>
    ({ uid: 'alice', name: 'Alice', entity: undefined, ...over }) as any;

  it('rejects a suggestion with an empty uid', async () => {
    const ctx = makeCtx();
    await selectMentionSuggestionImpl(ctx, suggestion({ uid: '  ' }));
    expect(ctx.isMentionSuggestionsOpen.set).toHaveBeenCalledWith(false);
    expect(ctx.textChange.emit).not.toHaveBeenCalled();
  });

  it('rejects a suggestion with an empty name', async () => {
    const ctx = makeCtx();
    await selectMentionSuggestionImpl(ctx, suggestion({ name: '' }));
    expect(ctx.isMentionSuggestionsOpen.set).toHaveBeenCalledWith(false);
    expect(ctx.textChange.emit).not.toHaveBeenCalled();
  });

  it('refuses a new uid once the limit is reached', async () => {
    const ctx = makeCtx({ uniqueMentionCount: sig(MENTIONS_LIMIT) as any });
    await selectMentionSuggestionImpl(ctx, suggestion());
    expect(ctx.textChange.emit).not.toHaveBeenCalled();
  });

  it('still allows re-selecting a uid already mentioned at the limit', async () => {
    const ctx = makeCtx({
      uniqueMentionCount: sig(MENTIONS_LIMIT) as any,
      plainTextMentionUids: new Set(['alice']),
      composerText: sig('hi @al') as any,
      cursorPosition: sig(6) as any,
    });
    await selectMentionSuggestionImpl(ctx, suggestion());
    expect(ctx.textChange.emit).toHaveBeenCalled();
  });

  it('inserts into plain text and moves the cursor past the mention', async () => {
    const ctx = makeCtx({ composerText: sig('hi @al') as any, cursorPosition: sig(6) as any });
    await selectMentionSuggestionImpl(ctx, suggestion());

    expect(ctx.composerText.set).toHaveBeenCalledWith('hi @Alice ');
    expect(ctx.cursorPosition.set).toHaveBeenCalledWith('hi @Alice '.length);
    expect(ctx.textChange.emit).toHaveBeenCalledWith('hi @Alice ');
    expect(ctx.plainTextMentionUids.has('alice')).toBe(true);
    expect(ctx.focusTextInput).toHaveBeenCalled();
  });

  it('preserves text after the cursor', async () => {
    const ctx = makeCtx({ composerText: sig('@al rest') as any, cursorPosition: sig(3) as any });
    await selectMentionSuggestionImpl(ctx, suggestion());
    expect(ctx.composerText.set).toHaveBeenCalledWith('@Alice  rest');
  });

  it('bails out when the @ has vanished from the plain-text buffer', async () => {
    const ctx = makeCtx({ composerText: sig('no trigger') as any, cursorPosition: sig(10) as any });
    await selectMentionSuggestionImpl(ctx, suggestion());

    expect(ctx.textChange.emit).not.toHaveBeenCalled();
    expect(ctx.skipNextMentionCheck).toBe(false);
  });

  it('clears the skip flag after the plain-text settle delay', async () => {
    const ctx = makeCtx({ composerText: sig('@al') as any, cursorPosition: sig(3) as any });
    await selectMentionSuggestionImpl(ctx, suggestion());

    expect(ctx.skipNextMentionCheck).toBe(true);
    vi.advanceTimersByTime(300);
    expect(ctx.skipNextMentionCheck).toBe(false);
  });

  it('delegates insertion to the rich-text editor', async () => {
    const ctx = makeCtx({ mentionSearchText: sig('al') as any });
    (ctx as any).customRichTextEditor = { getText: () => '@Alice ' };
    await selectMentionSuggestionImpl(ctx, suggestion());

    expect(ctx.richTextEditorService.insertMention).toHaveBeenCalledWith(
      ctx.customRichTextEditor,
      'alice',
      'Alice',
      3, // 'al'.length + 1 for the '@'
      false,
    );
    expect(ctx.composerText.set).toHaveBeenCalledWith('@Alice ');
    expect(ctx.textChange.emit).toHaveBeenCalledWith('@Alice ');
  });

  it('refocuses the rich-text editor and clears the skip flag', async () => {
    const ctx = makeCtx();
    (ctx as any).customRichTextEditor = { getText: () => '@Alice ' };
    await selectMentionSuggestionImpl(ctx, suggestion());

    vi.advanceTimersByTime(0);
    expect(ctx.focusRichTextEditor).toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(ctx.skipNextMentionCheck).toBe(false);
  });

  it('marks a self-mention when the service says so', async () => {
    const ctx = makeCtx({ mentionSearchText: sig('') as any });
    (ctx as any).customRichTextEditor = { getText: () => '@Me ' };
    svc(ctx).checkIfSelfMention.mockResolvedValue(true);

    await selectMentionSuggestionImpl(ctx, suggestion());
    expect(ctx.richTextEditorService.insertMention).toHaveBeenCalledWith(
      expect.anything(),
      'alice',
      'Alice',
      1,
      true,
    );
  });

  it('records a User entity and re-emits it', async () => {
    const user = new CometChat.User({ uid: 'alice', name: 'Alice' });
    const ctx = makeCtx({ composerText: sig('@al') as any, cursorPosition: sig(3) as any });
    await selectMentionSuggestionImpl(ctx, suggestion({ entity: user }));

    expect(ctx.mentionedUsersMap.get('alice')).toBe(user);
    expect(ctx.mentionSelected.emit).toHaveBeenCalledWith(user);
  });

  it('converts a GroupMember entity into a User', async () => {
    const member = new CometChat.GroupMember({ uid: 'alice', name: 'Alice' } as any);
    const ctx = makeCtx({ composerText: sig('@al') as any, cursorPosition: sig(3) as any });
    await selectMentionSuggestionImpl(ctx, suggestion({ entity: member }));

    const stored = ctx.mentionedUsersMap.get('alice');
    expect(stored).toBeInstanceOf(CometChat.User);
    expect(stored?.getUid()).toBe('alice');
  });

  it('announces the insertion and refreshes the count', async () => {
    const ctx = makeCtx({ composerText: sig('@al') as any, cursorPosition: sig(3) as any });
    await selectMentionSuggestionImpl(ctx, suggestion());

    expect(ctx.announceMentionInserted).toHaveBeenCalledWith('Alice');
    expect(ctx.updateMentionsCount).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// The small helpers
// ---------------------------------------------------------------------------

describe('scrollMentionIntoViewImpl', () => {
  it('scrolls the option with the matching id into view', () => {
    const el = document.createElement('div');
    el.id = 'mention-option-2';
    el.scrollIntoView = vi.fn();
    document.body.appendChild(el);

    scrollMentionIntoViewImpl(makeCtx(), 2);
    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest' });
    el.remove();
  });

  it('does nothing when the option is not rendered', () => {
    expect(() => scrollMentionIntoViewImpl(makeCtx(), 99)).not.toThrow();
  });
});

describe('updateMentionsCountImpl', () => {
  it('zeroes the count while mentions are disabled', () => {
    const ctx = makeCtx({ disableMentions: true, plainTextMentionUids: new Set(['a', 'b']) });
    updateMentionsCountImpl(ctx);

    expect(ctx.uniqueMentionCount.set).toHaveBeenCalledWith(0);
    expect(ctx.showMentionsCountWarning.set).toHaveBeenCalledWith(false);
  });

  it('counts plain-text mention uids', () => {
    const ctx = makeCtx({ plainTextMentionUids: new Set(['a', 'b']) });
    updateMentionsCountImpl(ctx);

    expect(ctx.uniqueMentionCount.set).toHaveBeenCalledWith(2);
    expect(ctx.showMentionsCountWarning.set).toHaveBeenCalledWith(false);
  });

  it('counts rich-text mention uids', () => {
    const ctx = makeCtx();
    (ctx as any).customRichTextEditor = {};
    (ctx.richTextEditorService as any).getUniqueMentionUids.mockReturnValue(new Set(['a', 'b', 'c']));

    updateMentionsCountImpl(ctx);
    expect(ctx.uniqueMentionCount.set).toHaveBeenCalledWith(3);
  });

  it('raises the warning at the limit', () => {
    const ctx = makeCtx({
      plainTextMentionUids: new Set(Array.from({ length: MENTIONS_LIMIT }, (_, i) => `u${i}`)),
    });
    updateMentionsCountImpl(ctx);
    expect(ctx.showMentionsCountWarning.set).toHaveBeenCalledWith(true);
  });
});

describe('initializeMentionsRequestBuilderImpl', () => {
  it('paginates without a group in a one-to-one chat', () => {
    const ctx = makeCtx();
    initializeMentionsRequestBuilderImpl(ctx, 'al');
    expect(svc(ctx).initializeMentionsPagination).toHaveBeenCalledWith('al', undefined, undefined, undefined);
  });

  it('passes the group through in a group chat', () => {
    const group = { getGuid: () => 'g1' } as CometChat.Group;
    const ctx = makeCtx({ currentGroup: () => group });
    initializeMentionsRequestBuilderImpl(ctx, 'al');
    expect(svc(ctx).initializeMentionsPagination).toHaveBeenCalledWith('al', group, undefined, undefined);
  });
});

describe('checkIfSelfMentionImpl', () => {
  it('delegates to the composer service', async () => {
    const ctx = makeCtx();
    svc(ctx).checkIfSelfMention.mockResolvedValue(true);

    await expect(checkIfSelfMentionImpl(ctx, 'me')).resolves.toBe(true);
    expect(svc(ctx).checkIfSelfMention).toHaveBeenCalledWith('me');
  });
});
