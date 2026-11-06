/**
 * Behaviour tests for the CometChatMessageComposer component shell.
 *
 * The sibling component spec drives the composer against a live CometChat
 * session. Without a session its early guards fire and most of the component
 * body never executes, so this suite replaces the data layer with test doubles
 * and exercises the component directly instead.
 *
 * MessageComposerService and MediaUploadTrayService are declared in the
 * component's own `providers:` array, so they have to be swapped through
 * TestBed.overrideComponent — a root-level provider is shadowed by the
 * component injector and the real services would be used silently.
 *
 * Methods are called on the instance rather than driven through the template:
 * rendering pulls in the whole child-component tree and the SDK stubs it needs,
 * which tells us nothing extra about this file's logic.
 */

// The calls SDK needs JitsiMeetJS, which jsdom does not provide.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import type { Subscription } from 'rxjs';

import {
  CometChatMessageComposerComponent,
  type AttachmentFile,
} from './cometchat-message-composer.component';
import { MessageComposerService } from '../../services/message-composer.service';
import { MediaUploadTrayService } from '../../services/media-upload-tray.service';
import { CometChatToastService } from '../base-elements/cometchat-toast/cometchat-toast.service';
import { ThreadSubscriptionService } from '../../services/thread-subscription.service';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import { CometChatUIEvents } from '../../events/CometChatUIEvents';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatMentionsFormatter } from '../../formatters/cometchat-mentions-formatter';
import { CometChatUIKit } from '../../cometchat-uikit';
import { COMETCHAT_GLOBAL_CONFIG } from '../../services/global-config.service';
import { EnterKeyBehavior, MessageStatus } from '../../Enums/Enums';

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

const BLANK_FORMAT_STATE = {
  bold: false, italic: false, underline: false, strikethrough: false, code: false,
  blockquote: false, codeBlock: false, orderedList: false, bulletList: false, link: false,
};

/**
 * Stand-in for a RichTextEditor instance. The real RichTextEditorService is left
 * in place, so these are the methods the service actually forwards to.
 */
function makeEditor(overrides: Record<string, unknown> = {}) {
  const el = document.createElement('div');
  el.setAttribute('contenteditable', 'true');
  el.textContent = 'hi';
  document.body.appendChild(el);
  const editor: Record<string, unknown> = {
    __element: el,
    isDestroyed: vi.fn(() => false),
    destroy: vi.fn(),
    applyBold: vi.fn(), applyItalic: vi.fn(), applyUnderline: vi.fn(),
    applyStrikethrough: vi.fn(), applyInlineCode: vi.fn(), applyCodeBlock: vi.fn(),
    applyBlockquote: vi.fn(), applyOrderedList: vi.fn(), applyBulletList: vi.fn(),
    setLink: vi.fn(),
    getFormatState: vi.fn(() => ({ ...BLANK_FORMAT_STATE })),
    getHTML: vi.fn(() => '<p>hi</p>'),
    getText: vi.fn(() => 'hi'),
    setHTML: vi.fn(),
    setContentWithMentions: vi.fn(),
    clear: vi.fn(),
    insertText: vi.fn(),
    insertMention: vi.fn(),
    isEmpty: vi.fn(() => false),
    isInList: vi.fn(() => false),
    getTextWithMentionFormat: vi.fn(() => 'hi'),
    getUniqueMentionUids: vi.fn(() => new Set<string>()),
    focus: vi.fn(),
    blur: vi.fn(),
    getContentEditable: vi.fn(() => el),
    getElement: vi.fn(() => el),
    getSelection: vi.fn(() => null),
    saveSelection: vi.fn(() => ({ start: 1, end: 4 })),
    restoreSelection: vi.fn(),
    getCurrentLink: vi.fn(() => 'https://existing.test'),
    getCurrentLinkText: vi.fn(() => 'existing'),
    getSelectedText: vi.fn(() => 'selected'),
    setCustomFormatters: vi.fn(),
    ...overrides,
  };
  return editor;
}

function makeComposerService() {
  const mentionSuggestions = signal<Array<Record<string, unknown>>>([]);
  const isFetchingMentions = signal(false);
  const isFetchingMoreMentions = signal(false);
  const hasMoreMentions = signal(false);
  return {
    mentionSuggestions,
    isFetchingMentions,
    isFetchingMoreMentions,
    hasMoreMentions,
    setErrorCallback: vi.fn(),
    startTyping: vi.fn(),
    endTyping: vi.fn(),
    searchMentions: vi.fn(),
    initializeMentionsPagination: vi.fn(),
    fetchMoreMentions: vi.fn().mockResolvedValue(undefined),
    checkIfSelfMention: vi.fn().mockResolvedValue(false),
    clearMentionSuggestions: vi.fn(),
    stopMentionSearch: vi.fn(),
    cleanup: vi.fn(),
    sendTextMessage: vi.fn().mockResolvedValue(null),
    sendMediaMessage: vi.fn().mockResolvedValue(null),
    editMessage: vi.fn().mockResolvedValue(null),
    sendStickerMessage: vi.fn().mockResolvedValue(null),
    createCollaborativeDocument: vi.fn().mockResolvedValue({}),
    createCollaborativeWhiteboard: vi.fn().mockResolvedValue({}),
  };
}

function makeTray() {
  const tiles = signal<AttachmentFile[]>([]);
  const canSend = signal(true);
  const batchId = signal<string | null>(null);
  return {
    tiles,
    canSend,
    batchId,
    hasTiles: computed(() => tiles().length > 0),
    getSuccessfulTiles: vi.fn(() => tiles()),
    getBatchId: vi.fn(() => batchId()),
    setValidationConfig: vi.fn(),
    setReceiver: vi.fn(),
    stage: vi.fn().mockResolvedValue(undefined),
    clearAll: vi.fn(() => tiles.set([])),
    reset: vi.fn(() => tiles.set([])),
  };
}

function attachmentStub(name: string, mime: string) {
  return {
    getUrl: () => `https://cdn.test/${name}`,
    getName: () => name,
    getMimeType: () => mime,
    getSize: () => 1024,
    getExtension: () => name.split('.').pop() ?? '',
  } as unknown as CometChat.Attachment;
}

function tile(type: AttachmentFile['type'], name: string, mime: string) {
  return {
    id: name,
    file: new File(['x'], name, { type: mime }),
    type,
    name,
    size: 1024,
    uploadProgress: 100,
    status: 'uploaded' as const,
    attachment: attachmentStub(name, mime),
  } as unknown as AttachmentFile;
}

function textMessage(text: string, id = 11): CometChat.TextMessage {
  const m = new CometChat.TextMessage('u1', text, CometChat.RECEIVER_TYPE.USER);
  m.setId(id);
  m.setSender(new CometChat.User({ uid: 'sender1', name: 'Sender One' }) as CometChat.User);
  return m;
}

/** Puts a real, non-collapsed selection in the document. */
function selectSomeText(): HTMLElement {
  const host = document.createElement('div');
  host.textContent = 'hello world';
  document.body.appendChild(host);
  const range = document.createRange();
  range.selectNodeContents(host);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
  return host;
}

function key(init: Partial<KeyboardEvent> & { key: string }): KeyboardEvent {
  const ev = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...(init as KeyboardEventInit) });
  return ev;
}

const tick = (ms = 0) => new Promise<void>((r) => setTimeout(r, ms));
/** The announcement helpers re-set their live region on a 50 ms timer. */
const announceSettled = () => tick(80);

// ---------------------------------------------------------------------------

describe('CometChatMessageComposerComponent (shell behaviour)', () => {
  let fixture: ComponentFixture<CometChatMessageComposerComponent>;
  let c: CometChatMessageComposerComponent;
  let anyC: Record<string, any>;
  let svc: ReturnType<typeof makeComposerService>;
  let tray: ReturnType<typeof makeTray>;
  let toast: { error: ReturnType<typeof vi.fn> };
  let thread: ThreadSubscriptionService;
  let subs: Subscription[];
  let strays: HTMLElement[];
  let loggerError: ReturnType<typeof vi.spyOn>;
  let loggerWarn: ReturnType<typeof vi.spyOn>;

  function build(opts: { toastThrows?: boolean } = {}) {
    svc = makeComposerService();
    tray = makeTray();
    toast = { error: vi.fn() };
    TestBed.configureTestingModule({ imports: [CometChatMessageComposerComponent] });
    TestBed.overrideComponent(CometChatMessageComposerComponent, {
      set: {
        providers: [
          { provide: MessageComposerService, useValue: svc },
          { provide: MediaUploadTrayService, useValue: tray },
          opts.toastThrows
            ? {
                provide: CometChatToastService,
                useFactory: () => {
                  throw new Error('no toast host in this environment');
                },
              }
            : { provide: CometChatToastService, useValue: toast },
        ],
      },
    });
    fixture = TestBed.createComponent(CometChatMessageComposerComponent);
    // The component's own logic is what is under test here. Detaching the host
    // view keeps Angular's automatic change detection from rendering the whole
    // child-component tree (and from re-populating @ViewChild between steps),
    // which would only add SDK-stub noise.
    fixture.componentRef.changeDetectorRef.detach();
    c = fixture.componentInstance;
    anyC = c as unknown as Record<string, any>;
    thread = TestBed.inject(ThreadSubscriptionService);
    // Keep the outgoing-sound path out of every unrelated test.
    c.disableSoundForMessage = true;
  }

  /**
   * Points the composer at a conversation. `propsProvided` is what tells the
   * constructor effect that the host supplied the receiver, so the effect does
   * not overwrite it from the (empty) ChatStateService on the next flush.
   */
  function useReceiver(receiver: CometChat.User | CometChat.Group) {
    anyC['propsProvided'].set(true);
    if (receiver instanceof CometChat.User) {
      c.user = receiver;
      c.group = undefined;
      anyC['currentUser'].set(receiver);
      anyC['currentGroup'].set(null);
    } else {
      c.group = receiver;
      c.user = undefined;
      anyC['currentGroup'].set(receiver);
      anyC['currentUser'].set(null);
    }
  }

  /** Leaves the composer with no conversation at all. */
  function noReceiver() {
    c.user = undefined;
    c.group = undefined;
    anyC['currentUser'].set(null);
    anyC['currentGroup'].set(null);
  }

  const aUser = () => new CometChat.User({ uid: 'u1', name: 'One' }) as CometChat.User;
  const aGroup = () => new CometChat.Group('g1', 'Group One', CometChat.GROUP_TYPE.PUBLIC);

  beforeEach(() => {
    subs = [];
    strays = [];
    // The SDK doubles live in the shared vitest setup, so their call history
    // carries over between tests unless it is cleared here.
    vi.mocked(CometChat.sendMediaMessage).mockClear();
    loggerError = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
    loggerWarn = vi.spyOn(CometChatLogger, 'warn').mockImplementation(() => undefined);
    build();
  });

  afterEach(() => {
    // Static event subjects outlive a test; a surviving fixture keeps firing handlers.
    subs.forEach((s) => s.unsubscribe());
    strays.forEach((el) => el.remove());
    document.querySelectorAll('[contenteditable]').forEach((el) => el.remove());
    window.getSelection()?.removeAllRanges();
    fixture.destroy();
    (CometChatUIKit as unknown as { _loggedInUser: { next(v: unknown): void } })._loggedInUser.next(null);
    vi.restoreAllMocks();
  });

  // =========================================================================
  describe('provider overrides', () => {
    it('resolves the component-scoped services from the overridden providers', () => {
      c.ngOnInit();
      // Proves the override took: the real MessageComposerService has no spy here.
      expect(svc.setErrorCallback).toHaveBeenCalledTimes(1);
      expect(c.mediaUploadTray).toBe(tray as unknown as MediaUploadTrayService);
      expect(c.toast).toBe(toast as unknown as CometChatToastService);
    });

    it('falls back to a null toast when the toast service cannot be constructed, and still reports errors', () => {
      fixture.destroy();
      TestBed.resetTestingModule();
      build({ toastThrows: true });

      expect(c.toast).toBeNull();

      const seen: CometChat.CometChatException[] = [];
      subs.push(c.error.subscribe((e) => seen.push(e)));
      anyC['emitError'](new Error('still reported'));

      expect(seen).toHaveLength(1);
      expect(seen[0].message).toBe('still reported');
    });
  });

  // =========================================================================
  describe('computed view state', () => {
    it('mirrors the mention paging flags off the service', () => {
      expect(c.isFetchingMoreMentions()).toBe(false);
      expect(c.hasMoreMentions()).toBe(false);

      svc.isFetchingMoreMentions.set(true);
      svc.hasMoreMentions.set(true);

      expect(c.isFetchingMoreMentions()).toBe(true);
      expect(c.hasMoreMentions()).toBe(true);
    });

    it('is not in thread-reply mode without a parent message', () => {
      expect(c.isInReplyMode()).toBe(false);
    });

    it('is in thread-reply mode once a parent message is bound', () => {
      // parentMessageId is a plain @Input, so the computed latches on first read.
      c.parentMessageId = 77;
      expect(c.isInReplyMode()).toBe(true);
    });

    it('derives the attachment counters and the add-more gate from the attachment list', () => {
      c.maxAttachments = 2;
      expect(c.hasAttachments()).toBe(false);
      expect(c.attachmentCount()).toBe(0);
      expect(c.canAddMoreAttachments()).toBe(true);

      c.attachments.set([tile('image', 'a.png', 'image/png'), tile('image', 'b.png', 'image/png')]);

      expect(c.hasAttachments()).toBe(true);
      expect(c.attachmentCount()).toBe(2);
      expect(c.canAddMoreAttachments()).toBe(false);
    });

    it('hides the toolbar entirely when rich text is off', () => {
      c.enableRichText = false;
      c.hideRichTextToolbar = false;
      expect(anyC['shouldShowToolbar']()).toBe(false);
    });

    it('shows the toolbar on mobile selection even when hideRichTextToolbar is set', () => {
      c.enableRichText = true;
      c.hideRichTextToolbar = true;
      c.showBubbleMenuOnSelection = true;
      anyC['isMobileView'].set(true);
      c.isFixedToolbarShown.set(true);

      expect(anyC['shouldShowToolbar']()).toBe(true);

      // Same inputs minus the selection toolbar -> the hide flag wins again.
      c.isFixedToolbarShown.set(false);
      expect(anyC['shouldShowToolbar']()).toBe(false);
    });

    it('gates Send on the staging tray once anything is staged', () => {
      tray.tiles.set([tile('image', 'a.png', 'image/png')]);
      tray.canSend.set(true);
      expect(c.canSend()).toBe(true);

      // A tile still uploading (or failed) blocks Send even with text present.
      tray.canSend.set(false);
      c.composerText.set('a caption');
      expect(c.canSend()).toBe(false);
    });

    it('gates Send on the composer contents when nothing is staged', () => {
      expect(c.canSend()).toBe(false);
      c.composerText.set('  ');
      expect(c.canSend()).toBe(false);
      c.composerText.set('hi');
      expect(c.canSend()).toBe(true);
    });

    it('blocks Send outright while a staged batch is in flight', () => {
      tray.tiles.set([tile('image', 'a.png', 'image/png')]);
      tray.canSend.set(true);
      c.isSendingStaged.set(true);

      expect(c.canSend()).toBe(false);
    });

    it('reports no popup open when every surface is closed', () => {
      expect(anyC['isAnyPopupOpen']()).toBe(false);
    });

    it('reports a popup open for each surface in turn', () => {
      const flags = [
        c.isEmojiKeyboardOpen, c.isStickersKeyboardOpen, c.isAttachmentMenuOpen,
        c.isMentionSuggestionsOpen, c.isRecording, c.isFullscreenViewerOpen,
      ];
      for (const flag of flags) {
        flag.set(true);
        expect(anyC['isAnyPopupOpen']()).toBe(true);
        flag.set(false);
      }
      expect(anyC['isAnyPopupOpen']()).toBe(false);
    });

    it('builds the attachment menu and appends integrator-supplied options', () => {
      c.hideVideoAttachmentOption = true;
      c.hidePollsOption = true;
      const extra = { id: 'custom-one', title: 'Custom' } as never;
      c.attachmentOptions = [extra];

      const ids = c.attachmentMenuOptions().map((o) => o.id);

      expect(ids).toContain('image');
      expect(ids).not.toContain('video');
      expect(ids).not.toContain('polls');
      expect(ids[ids.length - 1]).toBe('custom-one');
    });
  });

  // =========================================================================
  describe('lifecycle hooks', () => {
    it('reports a failure inside ngAfterViewInit through composerError and the error output', () => {
      const seen: unknown[] = [];
      subs.push(c.error.subscribe((e) => seen.push(e)));
      // A non-iterable formatter list makes the formatter spread throw.
      c.textFormatters = { length: 1 } as never;

      c.ngAfterViewInit();

      expect(c.composerError()).toBeInstanceOf(Error);
      expect(seen).toHaveLength(1);
      expect(loggerError).toHaveBeenCalledWith(
        'CometChatMessageComposer',
        'Error in ngAfterViewInit:',
        expect.any(Error),
      );
    });

    it('wraps a non-Error lifecycle failure in an Error carrying its string form', () => {
      svc.setErrorCallback.mockImplementation(() => {
        throw 'plain string failure';
      });

      c.handleRetryClick();

      expect(c.composerError()?.message).toBe('plain string failure');
    });

    it('resets the staging tray when the conversation changes', () => {
      c.ngOnChanges({
        user: {
          currentValue: new CometChat.User({ uid: 'u2', name: 'Two' }),
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(tray.reset).toHaveBeenCalledTimes(1);
    });

    it('logs but does not surface an ngOnChanges failure', () => {
      // currentValue without getUid() makes the uid comparison throw.
      c.ngOnChanges({
        user: {
          currentValue: {},
          previousValue: {},
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(loggerError).toHaveBeenCalledWith(
        'CometChatMessageComposer',
        'Error in ngOnChanges:',
        expect.any(TypeError),
      );
      // Unlike ngOnInit/ngAfterViewInit this hook stays silent to the integrator.
      expect(c.composerError()).toBeNull();
    });

    it('clears a pending typing timeout on destroy', () => {
      anyC['typingTimeout'] = setTimeout(() => undefined, 10_000);

      c.ngOnDestroy();

      expect(anyC['typingTimeout']).toBeUndefined();
      expect(svc.cleanup).toHaveBeenCalledTimes(1);
    });

    it('abandons the rest of cleanup when a step throws, and logs it', () => {
      useReceiver(aUser());
      svc.endTyping.mockImplementation(() => {
        throw new Error('socket already gone');
      });

      c.ngOnDestroy();

      expect(loggerError).toHaveBeenCalledWith(
        'CometChatMessageComposer',
        'Error during cleanup:',
        expect.any(Error),
      );
      // Everything after endTypingIndicator() is skipped.
      expect(svc.cleanup).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  describe('retry and the service error callback', () => {
    it('clears the error and re-runs initialisation on retry', () => {
      c.composerError.set(new Error('earlier'));
      c.text = 'restored draft';

      c.handleRetryClick();

      expect(c.composerError()).toBeNull();
      expect(svc.setErrorCallback).toHaveBeenCalledTimes(1);
      expect(c.composerText()).toBe('restored draft');
      expect(c.textFormatterArray().length).toBeGreaterThan(0);
    });

    it('prefers initialComposerText only when text is empty', () => {
      c.text = '';
      c.initialComposerText = 'draft from the list';
      const emitted: string[] = [];
      subs.push(c.textChange.subscribe((t) => emitted.push(t)));

      c.handleRetryClick();

      expect(c.composerText()).toBe('draft from the list');
      expect(emitted).toEqual(['draft from the list']);
    });

    it('forwards an exception raised by the service to the error output', () => {
      c.handleRetryClick();
      const callback = svc.setErrorCallback.mock.calls[0][0] as (e: unknown) => void;
      const seen: unknown[] = [];
      subs.push(c.error.subscribe((e) => seen.push(e)));

      const exception = new CometChat.CometChatException({ code: 'ERR_X', message: 'from sdk' });
      callback(exception);

      expect(seen).toEqual([exception]);
    });
  });

  // =========================================================================
  describe('mobile view detection', () => {
    const originalWidth = window.innerWidth;

    afterEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        value: originalWidth, configurable: true, writable: true,
      });
    });

    function setWidth(px: number) {
      Object.defineProperty(window, 'innerWidth', { value: px, configurable: true, writable: true });
    }

    it('tracks the viewport across resize events', () => {
      setWidth(1024);
      anyC['initializeMobileViewDetection']();
      expect(anyC['isMobileView']()).toBe(false);

      setWidth(400);
      window.dispatchEvent(new Event('resize'));
      expect(anyC['isMobileView']()).toBe(true);

      setWidth(900);
      window.dispatchEvent(new Event('resize'));
      expect(anyC['isMobileView']()).toBe(false);
    });

    it('removes the resize listener through DestroyRef exactly once', () => {
      const onDestroy = vi.spyOn(anyC['destroyRef'], 'onDestroy');
      const removeSpy = vi.spyOn(window, 'removeEventListener');

      anyC['initializeMobileViewDetection']();
      const handler = anyC['boundResizeHandler'];
      expect(typeof handler).toBe('function');

      const cleanup = onDestroy.mock.calls[0][0] as () => void;
      cleanup();

      expect(removeSpy).toHaveBeenCalledWith('resize', handler);
      expect(anyC['boundResizeHandler']).toBeNull();

      // A second run is a no-op rather than a second removal.
      removeSpy.mockClear();
      cleanup();
      expect(removeSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  describe('text inserted from another surface', () => {
    it('uses the incoming text verbatim when the composer is empty', () => {
      anyC['insertTextFromExternalSource']('from the AI panel');
      expect(c.composerText()).toBe('from the AI panel');
    });

    it('appends to existing text with a separating space', () => {
      c.composerText.set('hello');
      anyC['insertTextFromExternalSource']('world');
      expect(c.composerText()).toBe('hello world');
    });

    it('pushes the merged text into the rich text editor when one is active', () => {
      const editor = makeEditor();
      c.customRichTextEditor = editor as never;
      c.enableRichText = true;
      c.composerText.set('a');

      anyC['insertTextFromExternalSource']('b');

      expect(editor['setHTML']).toHaveBeenCalledWith('a b');
    });

    it('leaves the editor alone when rich text is disabled', () => {
      const editor = makeEditor();
      c.customRichTextEditor = editor as never;
      c.enableRichText = false;

      anyC['insertTextFromExternalSource']('plain');

      expect(c.composerText()).toBe('plain');
      expect(editor['setHTML']).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  describe('popovers and content toggles', () => {
    it('ignores a coordinator stop request when this composer is not recording', () => {
      c.contentToDisplay.set('emojiKeyboard');
      c.recordingDuration.set(9);

      c.stopRecordingForCoordinator();

      expect(c.contentToDisplay()).toBe('emojiKeyboard');
      expect(c.recordingDuration()).toBe(9);
    });

    it('tears down the recorder when the coordinator hands the microphone away', () => {
      c.contentToDisplay.set('voiceRecording');
      anyC['syncLegacyPopoverSignals']();
      c.recordingDuration.set(4);

      c.stopRecordingForCoordinator();

      expect(c.isRecording()).toBe(false);
      expect(c.contentToDisplay()).toBe('none');
      expect(c.recordingDuration()).toBe(0);
    });

    it('toggles the AI panel and broadcasts it as the active popover', () => {
      const active: string[] = [];
      subs.push(CometChatUIEvents.ccActivePopover.subscribe((v) => active.push(v as string)));
      c.isMentionSuggestionsOpen.set(true);

      c.toggleAI();
      expect(c.contentToDisplay()).toBe('ai');
      expect(active).toContain('ai');
      expect(c.isMentionSuggestionsOpen()).toBe(false);

      c.toggleAI();
      expect(c.contentToDisplay()).toBe('none');
    });

    it('maps each popover open/close callback onto the displayed content', () => {
      c.onEmojiPopoverOpened();
      expect(c.isEmojiKeyboardOpen()).toBe(true);
      c.onEmojiPopoverClosed();
      expect(c.isEmojiKeyboardOpen()).toBe(false);

      c.onAttachmentPopoverOpened();
      expect(c.isAttachmentMenuOpen()).toBe(true);
      c.onAttachmentPopoverClosed();
      expect(c.isAttachmentMenuOpen()).toBe(false);

      c.onStickersPopoverOpened();
      expect(c.isStickersKeyboardOpen()).toBe(true);
      c.onStickersPopoverClosed();
      expect(c.isStickersKeyboardOpen()).toBe(false);

      c.onVoiceRecorderPopoverOpened();
      expect(c.isRecording()).toBe(true);
      expect(c.contentToDisplay()).toBe('voiceRecording');
      c.recordingDuration.set(12);
      c.onVoiceRecorderPopoverClosed();
      expect(c.isRecording()).toBe(false);
      expect(c.recordingDuration()).toBe(0);
    });

    it('closes only the popover instances that are open', () => {
      const open = { isOpen: true, closePopover: vi.fn() };
      const closed = { isOpen: false, closePopover: vi.fn() };
      anyC['popoverInstances'] = [open, closed];

      anyC['closeAllPopoverInstances']();

      expect(open.closePopover).toHaveBeenCalledTimes(1);
      expect(closed.closePopover).not.toHaveBeenCalled();
    });

    it('routes the attachment button through the attachment menu toggle', () => {
      c.handleAttachmentButtonClick();
      expect(c.isAttachmentMenuOpen()).toBe(true);
      c.handleAttachmentButtonClick();
      expect(c.isAttachmentMenuOpen()).toBe(false);
    });

    it('clicks the real attachment trigger and runs the action sheet item callback', () => {
      const button = document.createElement('button');
      strays.push(button);
      document.body.appendChild(button);
      const clicked = vi.fn();
      button.addEventListener('click', clicked);
      anyC['attachmentButtonRef'] = { nativeElement: button };
      const onClick = vi.fn();

      c.handleActionSheetItemClick({ onClick } as never);

      expect(clicked).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('opens the emoji keyboard from the emoji button', () => {
      c.handleEmojiButtonClick();
      expect(c.isEmojiKeyboardOpen()).toBe(true);
    });

    it('inserts a picked emoji into the rich text editor and closes the popups', () => {
      const editor = makeEditor();
      c.customRichTextEditor = editor as never;

      c.handleEmojiSelect('🎉');

      expect(editor['insertText']).toHaveBeenCalledWith('🎉');
      expect(c.isEmojiKeyboardOpen()).toBe(false);
      expect(svc.clearMentionSuggestions).toHaveBeenCalled();
    });

    it('inserts a picked emoji at the caret in plain-text mode', () => {
      c.composerText.set('ab');
      c.cursorPosition.set(1);
      const emitted: string[] = [];
      subs.push(c.textChange.subscribe((t) => emitted.push(t)));

      c.handleEmojiSelect('*');

      expect(c.composerText()).toBe('a*b');
      expect(c.cursorPosition()).toBe(2);
      expect(emitted).toEqual(['a*b']);
    });
  });

  // =========================================================================
  describe('edit mode', () => {
    it('enters edit mode from a messageToEdit change and publishes the in-progress event', () => {
      const seen: Array<{ status: string }> = [];
      subs.push(CometChatMessageEvents.ccMessageEdited.subscribe((e) => seen.push(e as never)));
      const msg = textMessage('original body');

      c.ngOnChanges({
        messageToEdit: {
          currentValue: msg, previousValue: undefined, firstChange: true, isFirstChange: () => true,
        },
      });

      expect(c.isEditMode()).toBe(true);
      expect(c.textMessageToEdit()).toBe(msg);
      expect(c.composerText()).toBe('original body');
      expect(seen.map((e) => e.status)).toContain(MessageStatus.inprogress);
    });

    it('re-renders the message through the editor with its mentions preserved', () => {
      const editor = makeEditor();
      c.customRichTextEditor = editor as never;
      c.enableRichText = true;
      const msg = textMessage('hi <@uid:u9>');
      msg.setMentionedUsers([new CometChat.User({ uid: 'u9', name: 'Niner' }) as CometChat.User]);

      c.enterEditMode(msg);

      expect(editor['setContentWithMentions']).toHaveBeenCalledWith(
        'hi <@uid:u9>',
        expect.arrayContaining([expect.anything()]),
      );
    });

    it('writes the raw text when rich text is disabled', () => {
      const editor = makeEditor();
      c.customRichTextEditor = editor as never;
      c.enableRichText = false;

      c.enterEditMode(textMessage('raw body'));

      expect(editor['setHTML']).toHaveBeenCalledWith('raw body');
      expect(editor['setContentWithMentions']).not.toHaveBeenCalled();
    });

    it('leaves reply mode when edit mode is entered', () => {
      c.messageToReplySignal.set(textMessage('quoted', 5));

      c.enterEditMode(textMessage('being edited', 6));

      expect(c.messageToReplySignal()).toBeNull();
      expect(c.isEditMode()).toBe(true);
    });

    it('restores the pre-edit draft when messageToEdit is cleared', () => {
      c.composerText.set('draft kept aside');
      c.enterEditMode(textMessage('being edited'));
      expect(c.composerText()).toBe('being edited');

      c.ngOnChanges({
        messageToEdit: {
          currentValue: undefined, previousValue: textMessage('being edited'),
          firstChange: false, isFirstChange: () => false,
        },
      });

      expect(c.isEditMode()).toBe(false);
      expect(c.composerText()).toBe('draft kept aside');
    });

    it('does nothing when messageToEdit is cleared and no draft was captured', () => {
      anyC['originalTextBeforeEdit'] = undefined;
      c.composerText.set('untouched');

      c.ngOnChanges({
        messageToEdit: {
          currentValue: undefined, previousValue: undefined,
          firstChange: false, isFirstChange: () => false,
        },
      });

      expect(c.composerText()).toBe('untouched');
      expect(c.isEditMode()).toBe(false);
    });

    it('exits edit mode and restores the draft through the editor', () => {
      const editor = makeEditor();
      c.customRichTextEditor = editor as never;
      c.enableRichText = true;
      anyC['originalTextBeforeEdit'] = 'kept';
      c.isEditMode.set(true);
      c.textMessageToEdit.set(textMessage('x'));

      anyC['exitEditMode']();

      expect(c.isEditMode()).toBe(false);
      expect(c.textMessageToEdit()).toBeNull();
      expect(editor['setHTML']).toHaveBeenCalledWith('kept');
      expect(anyC['originalTextBeforeEdit']).toBe('');
    });

    it('cancels editing from the preview close button', () => {
      const closed = vi.fn();
      subs.push(c.closePreview.subscribe(closed));
      const seen: Array<{ status: string }> = [];
      subs.push(CometChatMessageEvents.ccMessageEdited.subscribe((e) => seen.push(e as never)));
      c.textMessageToEdit.set(textMessage('being edited'));
      c.isEditMode.set(true);

      c.onEditPreviewClose();

      expect(c.isEditMode()).toBe(false);
      expect(closed).toHaveBeenCalledTimes(1);
      expect(seen.map((e) => e.status)).toContain(MessageStatus.cancelled);
    });

    it('labels the edit banner with the localized edit-message string', () => {
      const expected = CometChatLocalize.getLocalizedString('message_composer_edit_message');
      expect(expected.length).toBeGreaterThan(0);
      expect(c.getEditPreviewTitle()).toBe(expected);
    });

    it('converts the markdown subset to html', () => {
      const html = anyC['convertMarkdownToHtml'](
        '**bold** _em_ ~~gone~~ `code` [link](https://x.test)',
      ) as string;

      expect(html).toContain('<strong>bold</strong>');
      expect(html).toContain('<em>em</em>');
      expect(html).toContain('<s>gone</s>');
      expect(html).toContain('<code class="cometchat-rich-text__code">code</code>');
      expect(html).toContain('href="https://x.test"');
      expect(anyC['convertMarkdownToHtml']('')).toBe('');
    });

    it('reports the message currently being edited', () => {
      expect(c.getCurrentEditMessage()).toBeNull();
      const msg = textMessage('x');
      c.textMessageToEdit.set(msg);
      expect(c.getCurrentEditMessage()).toBe(msg);
    });
  });

  // =========================================================================
  describe('reply mode', () => {
    it('enters reply mode when messageToReply is set', async () => {
      const msg = textMessage('quoted body', 42);

      c.ngOnChanges({
        messageToReply: {
          currentValue: msg, previousValue: undefined, firstChange: true, isFirstChange: () => true,
        },
      });

      expect(c.messageToReplySignal()).toBe(msg);
      await announceSettled();
      expect(c.liveRegionPoliteText()).toContain('Sender One');
    });

    it('names the logged-in user as "You" in the reply announcement', async () => {
      const me = new CometChat.User({ uid: 'me', name: 'Me Myself' }) as CometChat.User;
      (CometChatUIKit as unknown as { _loggedInUser: { next(v: unknown): void } })._loggedInUser.next(me);
      const msg = textMessage('quoted', 43);
      msg.setSender(me);

      c.enterReplyMode(msg);

      await announceSettled();
      const you = CometChatLocalize.getLocalizedString('conversation_subtitle_you_message');
      expect(c.liveRegionPoliteText()).toContain(you);
    });

    it('leaves reply mode when messageToReply is cleared', () => {
      c.messageToReplySignal.set(textMessage('quoted', 44));

      c.ngOnChanges({
        messageToReply: {
          currentValue: undefined, previousValue: undefined,
          firstChange: false, isFirstChange: () => false,
        },
      });

      expect(c.messageToReplySignal()).toBeNull();
    });

    it('publishes a cancelled reply when the reply preview is closed', () => {
      const seen: Array<{ status: string }> = [];
      subs.push(CometChatMessageEvents.ccReplyToMessage.subscribe((e) => seen.push(e as never)));
      const closed = vi.fn();
      subs.push(c.closePreview.subscribe(closed));
      c.messageToReplySignal.set(textMessage('quoted', 45));

      c.onReplyPreviewClose();

      expect(seen.map((e) => e.status)).toEqual([MessageStatus.cancelled]);
      expect(c.messageToReplySignal()).toBeNull();
      expect(closed).toHaveBeenCalledTimes(1);
    });

    it('closes the preview straight away when there is nothing to cancel', () => {
      const closed = vi.fn();
      subs.push(c.closePreview.subscribe(closed));

      c.handleClosePreview();

      expect(closed).toHaveBeenCalledTimes(1);
    });

    it('cancels the edit when the preview closes during an edit of a bound message', () => {
      c.messageToEdit = textMessage('bound edit', 46);
      c.isEditMode.set(true);
      const seen: Array<{ status: string }> = [];
      subs.push(CometChatMessageEvents.ccMessageEdited.subscribe((e) => seen.push(e as never)));

      c.handleClosePreview();

      expect(seen.map((e) => e.status)).toContain(MessageStatus.cancelled);
    });

    it('closes the quoted reply when edit mode has no bound message', () => {
      // isInEditMode() is true via the signal, but messageToEdit is unset.
      c.textMessageToEdit.set(textMessage('signal only', 47));
      c.messageToReplySignal.set(textMessage('quoted', 48));
      const seen: Array<{ status: string }> = [];
      subs.push(CometChatMessageEvents.ccReplyToMessage.subscribe((e) => seen.push(e as never)));

      c.handleClosePreview();

      expect(seen.map((e) => e.status)).toEqual([MessageStatus.cancelled]);
    });

    it('resets everything the composer was holding when the conversation changes', () => {
      c.composerText.set('half typed');
      c.attachments.set([tile('image', 'a.png', 'image/png')]);
      c.messageToReplySignal.set(textMessage('quoted', 49));
      c.uniqueMentionCount.set(3);
      c.showMentionsCountWarning.set(true);

      anyC['resetComposerState']();

      expect(c.composerText()).toBe('');
      expect(c.attachments()).toEqual([]);
      expect(c.messageToReplySignal()).toBeNull();
      expect(c.uniqueMentionCount()).toBe(0);
      expect(c.showMentionsCountWarning()).toBe(false);
      expect(c.contentToDisplay()).toBe('none');
    });
  });

  // =========================================================================
  describe('polls and collaborative extensions', () => {
    it('closes the poll modal and resolves the pending reply after creation', () => {
      const seen: Array<{ status: string }> = [];
      subs.push(CometChatMessageEvents.ccReplyToMessage.subscribe((e) => seen.push(e as never)));
      c.openPollModal();
      c.messageToReplySignal.set(textMessage('quoted', 50));

      c.onPollCreated();

      expect(c.isPollModalOpen()).toBe(false);
      expect(seen.map((e) => e.status)).toEqual([MessageStatus.success]);
      expect(c.messageToReplySignal()).toBeNull();
    });

    it('closes the poll modal without a reply event when nothing was quoted', () => {
      const seen: unknown[] = [];
      subs.push(CometChatMessageEvents.ccReplyToMessage.subscribe((e) => seen.push(e)));
      c.openPollModal();

      c.onPollCreated();

      expect(c.isPollModalOpen()).toBe(false);
      expect(seen).toEqual([]);
    });

    it('creates a collaborative document for the active user', async () => {
      useReceiver(aUser());
      c.contentToDisplay.set('attachments');

      await c.createCollaborativeDocument();

      expect(svc.createCollaborativeDocument).toHaveBeenCalledWith('u1', 'user', undefined);
      expect(c.contentToDisplay()).toBe('none');
      expect(c.isExtensionLoading()).toBe(false);
    });

    it('creates a collaborative whiteboard for the active group and clears the quoted reply', async () => {
      useReceiver(aGroup());
      c.messageToReplySignal.set(textMessage('quoted', 51));

      await c.createCollaborativeWhiteboard();

      expect(svc.createCollaborativeWhiteboard).toHaveBeenCalledWith('g1', 'group', 51);
      expect(c.messageToReplySignal()).toBeNull();
    });

    it('surfaces a collaborative-extension failure and still clears the loading flag', async () => {
      useReceiver(aUser());
      svc.createCollaborativeDocument.mockRejectedValue(new Error('extension disabled'));
      const seen: CometChat.CometChatException[] = [];
      subs.push(c.error.subscribe((e) => seen.push(e)));

      await c.createCollaborativeDocument();

      expect(seen).toHaveLength(1);
      expect(seen[0].message).toBe('extension disabled');
      expect(c.isExtensionLoading()).toBe(false);
    });

    it('does nothing without a receiver', async () => {
      await c.createCollaborativeWhiteboard();
      expect(svc.createCollaborativeWhiteboard).not.toHaveBeenCalled();
      expect(loggerWarn).toHaveBeenCalled();
    });
  });

  // =========================================================================
  describe('link dialog and popover', () => {
    function withComposerBox(left: number, width: number) {
      const box = document.createElement('div');
      box.className = 'cometchat-message-composer';
      box.getBoundingClientRect = () =>
        ({ left, width, right: left + width, top: 0, bottom: 0, height: 0, x: left, y: 0 }) as DOMRect;
      (anyC['hostElementRef'].nativeElement as HTMLElement).appendChild(box);
      strays.push(box);
    }

    it('applies a saved link, restoring the selection it was started from', () => {
      const editor = makeEditor();
      c.customRichTextEditor = editor as never;
      const saved = { start: 2, end: 6 };
      anyC['savedLinkSelection'] = saved;
      c.isLinkDialogOpen.set(true);

      c.handleLinkDialogSave({ url: 'https://new.test', text: 'new' } as never);

      expect(editor['restoreSelection']).toHaveBeenCalledWith(saved);
      expect(editor['setLink']).toHaveBeenCalledWith('https://new.test', 'new');
      expect(anyC['savedLinkSelection']).toBeNull();
      expect(c.isLinkDialogOpen()).toBe(false);
    });

    it('closes the dialog with no editor work when there is no editor', () => {
      c.isLinkDialogOpen.set(true);
      c.handleLinkDialogSave({ url: 'https://x.test', text: 'x' } as never);
      expect(c.isLinkDialogOpen()).toBe(false);
    });

    it('removes a link from the dialog', () => {
      const editor = makeEditor();
      c.customRichTextEditor = editor as never;
      c.isLinkDialogOpen.set(true);

      c.handleLinkDialogRemove();

      expect(editor['setLink']).toHaveBeenCalledWith(null, undefined);
      expect(c.isLinkDialogOpen()).toBe(false);
    });

    it('removes a link from the popover, restoring the saved selection first', () => {
      const editor = makeEditor();
      c.customRichTextEditor = editor as never;
      anyC['savedLinkSelection'] = { start: 0, end: 3 };
      c.isLinkPopoverOpen.set(true);

      c.handleLinkPopoverRemove();

      expect(c.isLinkPopoverOpen()).toBe(false);
      expect(editor['restoreSelection']).toHaveBeenCalled();
      expect(editor['setLink']).toHaveBeenCalledWith(null, undefined);
    });

    it('opens the link popover at the clicked coordinates', () => {
      const editor = makeEditor();
      c.customRichTextEditor = editor as never;
      c.enableRichText = true;

      anyC['handleLinkClick']('https://clicked.test', 'clicked', 120, 240);

      expect(c.isLinkPopoverOpen()).toBe(true);
      expect(c.linkPopoverUrl()).toBe('https://clicked.test');
      expect(c.linkPopoverText()).toBe('clicked');
      expect(c.linkPopoverX()).toBe(120);
      expect(c.linkPopoverY()).toBe(240);
      expect(editor['saveSelection']).toHaveBeenCalled();
    });

    it('ignores a link click when rich text is disabled', () => {
      c.enableRichText = false;
      anyC['handleLinkClick']('https://clicked.test', 'clicked', 1, 2);
      expect(c.isLinkPopoverOpen()).toBe(false);
    });

    it('swaps the popover for the edit dialog, carrying the link across', () => {
      withComposerBox(100, 1000);
      c.isLinkPopoverOpen.set(true);
      c.linkPopoverX.set(300);

      c.handleLinkPopoverEdit({ url: 'https://edit.test', text: 'edit me' });

      expect(c.isLinkPopoverOpen()).toBe(false);
      expect(c.isLinkDialogOpen()).toBe(true);
      expect(c.linkDialogMode()).toBe('edit');
      expect(c.linkDialogInitialUrl()).toBe('https://edit.test');
      expect(c.linkDialogInitialText()).toBe('edit me');
      expect(c.linkDialogX()).toBe(200);
    });

    it('keeps the dialog inside the composer on both edges', () => {
      withComposerBox(100, 1000);

      // Plenty of room to the right.
      expect(anyC['computeLinkDialogLeft'](300)).toBe(200);
      // Would overflow the right edge -> pinned to width - dialogWidth.
      expect(anyC['computeLinkDialogLeft'](1050)).toBe(600);
      // Would land left of the composer -> clamped to 0.
      expect(anyC['computeLinkDialogLeft'](50)).toBe(0);
    });

    it('closes the popover and drops the saved selection', () => {
      const editor = makeEditor();
      c.customRichTextEditor = editor as never;
      anyC['savedLinkSelection'] = { start: 0, end: 1 };
      c.isLinkPopoverOpen.set(true);

      c.handleLinkPopoverClose();

      expect(c.isLinkPopoverOpen()).toBe(false);
      expect(anyC['savedLinkSelection']).toBeNull();
      expect(editor['focus']).toHaveBeenCalled();
    });

    it('cancels the dialog and drops the saved selection', () => {
      anyC['savedLinkSelection'] = { start: 0, end: 1 };
      c.isLinkDialogOpen.set(true);

      c.handleLinkDialogCancel();

      expect(c.isLinkDialogOpen()).toBe(false);
      expect(anyC['savedLinkSelection']).toBeNull();
    });
  });

  // =========================================================================
  describe('rich text editor plumbing', () => {
    it('returns no metadata when rich text is disabled', () => {
      c.enableRichText = false;
      c.customRichTextEditor = makeEditor() as never;
      expect(c.getRichTextMetadata()).toBeUndefined();
    });

    it('returns the editor metadata when rich text is on', () => {
      c.enableRichText = true;
      c.customRichTextEditor = makeEditor() as never;

      // html is the plain paragraph wrapper around the text -> nothing formatted.
      expect(c.getRichTextMetadata()).toEqual({
        html: '<p>hi</p>', plainText: 'hi', hasFormatting: false,
      });

      c.customRichTextEditor = makeEditor({ getHTML: vi.fn(() => '<p><strong>hi</strong></p>') }) as never;
      expect(c.getRichTextMetadata()?.hasFormatting).toBe(true);
    });

    it('returns no metadata when rich text is on but no editor exists', () => {
      c.enableRichText = true;
      c.customRichTextEditor = null;
      expect(c.getRichTextMetadata()).toBeUndefined();
    });

    it('inserts text into the editor only when one exists', () => {
      c.insertTextIntoRichTextEditor('nothing happens');

      const editor = makeEditor();
      c.customRichTextEditor = editor as never;
      c.insertTextIntoRichTextEditor('now it does');

      expect(editor['insertText']).toHaveBeenCalledExactlyOnceWith('now it does');
    });

    it('clears the editor only when one exists', () => {
      c.clearRichTextEditorContent();

      const editor = makeEditor();
      c.customRichTextEditor = editor as never;
      c.clearRichTextEditorContent();

      expect(editor['clear']).toHaveBeenCalledTimes(1);
    });

    it('publishes an editor update on the next microtask and refreshes the mention count', async () => {
      const editor = makeEditor({ getUniqueMentionUids: vi.fn(() => new Set(['a', 'b'])) });
      c.customRichTextEditor = editor as never;
      useReceiver(aUser());
      const emitted: string[] = [];
      subs.push(c.textChange.subscribe((t) => emitted.push(t)));

      anyC['handleRichTextUpdate']('<p>typed</p>', 'typed');

      expect(c.uniqueMentionCount()).toBe(2);
      expect(svc.startTyping).toHaveBeenCalledTimes(1);
      // Deferred so change detection does not run inside the input event.
      expect(c.composerText()).toBe('');
      await Promise.resolve();
      expect(c.composerText()).toBe('typed');
      expect(emitted).toEqual(['typed']);
    });

    it('focuses the editor and collapses the caret to the end', async () => {
      const editor = makeEditor();
      c.customRichTextEditor = editor as never;

      c.focusRichTextEditor();
      await tick(80);

      expect(editor['getContentEditable']).toHaveBeenCalled();
      expect(window.getSelection()?.rangeCount).toBe(1);
    });

    it('returns the caret to the editor when the bubble menu closes', () => {
      const editor = makeEditor();
      c.customRichTextEditor = editor as never;
      anyC['isBubbleMenuVisible'].set(true);
      anyC['textSelection'].set({ from: 1, to: 3 });

      anyC['closeBubbleMenu']();

      expect(anyC['isBubbleMenuVisible']()).toBe(false);
      expect(anyC['textSelection']()).toBeNull();
    });

    it('closes the bubble menu with no editor attached', () => {
      anyC['isBubbleMenuVisible'].set(true);
      anyC['closeBubbleMenu']();
      expect(anyC['isBubbleMenuVisible']()).toBe(false);
    });
  });

  // =========================================================================
  describe('plain-text input handling', () => {
    function inputEvent(value: string, selectionStart: number | null) {
      const target = { value, selectionStart } as unknown as HTMLTextAreaElement;
      return { target } as unknown as Event;
    }

    it('publishes the typed text, caret and typing indicator', () => {
      useReceiver(aUser());
      const emitted: string[] = [];
      subs.push(c.textChange.subscribe((t) => emitted.push(t)));

      c.handleTextInput(inputEvent('hello', 5));

      expect(c.composerText()).toBe('hello');
      expect(emitted).toEqual(['hello']);
      expect(c.cursorPosition()).toBe(5);
      expect(svc.startTyping).toHaveBeenCalledTimes(1);
    });

    it('treats a null caret as position zero and skips typing and mention work when disabled', () => {
      c.disableTypingEvents = true;
      c.disableMentions = true;

      c.handleTextInput(inputEvent('@som', null));

      expect(c.cursorPosition()).toBe(0);
      expect(svc.startTyping).not.toHaveBeenCalled();
      expect(c.isMentionSuggestionsOpen()).toBe(false);
    });

    it('treats a null caret as position zero while still checking for mentions', () => {
      c.disableTypingEvents = true;
      c.disableMentions = false;

      c.handleTextInput(inputEvent('@som', null));

      expect(c.cursorPosition()).toBe(0);
      // Nothing precedes position 0, so no trigger is found and the list stays shut.
      expect(c.isMentionSuggestionsOpen()).toBe(false);
    });

    it('opens the mention list when an @ token is being typed', () => {
      c.disableTypingEvents = true;
      c.disableMentions = false;

      c.handleTextInput(inputEvent('hi @al', 6));

      expect(c.isMentionSuggestionsOpen()).toBe(true);
      expect(c.mentionSearchText()).toBe('al');
    });

    it('starts a typing indicator once and ends it when the timer fires', async () => {
      useReceiver(aUser());

      anyC['handleTypingStart']();
      anyC['handleTypingStart']();

      expect(svc.startTyping).toHaveBeenCalledTimes(1);
      await tick(600);
      expect(svc.endTyping).toHaveBeenCalledTimes(1);
      expect(anyC['typingTimeout']).toBeUndefined();
    });

    it('skips the typing indicator for a blocked conversation', () => {
      const blocked = new CometChat.User({ uid: 'u1', name: 'One' }) as CometChat.User;
      vi.spyOn(blocked, 'getBlockedByMe').mockReturnValue(true);
      anyC['propsProvided'].set(true);
      anyC['currentUser'].set(blocked);

      anyC['handleTypingStart']();

      expect(svc.startTyping).not.toHaveBeenCalled();
    });

    it('does not announce typing without a receiver', () => {
      anyC['startTyping']();
      expect(svc.startTyping).not.toHaveBeenCalled();
    });

    it('inserts text at the caret, clamping an out-of-range position', () => {
      c.composerText.set('abc');
      c.cursorPosition.set(99);

      expect(c.insertTextAtCursor('Z')).toBe(4);
      expect(c.composerText()).toBe('abcZ');
    });
  });

  // =========================================================================
  describe('keyboard handling', () => {
    it('sends on Enter and forwards the event to the formatters', () => {
      const formatter = { onKeyDown: vi.fn(), onKeyUp: vi.fn() };
      c.textFormatterArray.set([formatter as never]);
      c.enterKeyBehavior = EnterKeyBehavior.SendMessage;
      c.enableRichText = false;
      const send = vi.spyOn(c, 'handleSend').mockResolvedValue(undefined);

      c.handleKeydown(key({ key: 'Enter' }));

      expect(send).toHaveBeenCalledTimes(1);
      expect(formatter.onKeyDown).toHaveBeenCalledTimes(1);
      expect(formatter.onKeyUp).not.toHaveBeenCalled();
    });

    it('routes keyup to the formatters as a keyup, not a keydown', () => {
      const formatter = { onKeyDown: vi.fn(), onKeyUp: vi.fn() };
      c.textFormatterArray.set([formatter as never]);

      c.handleKeyup(key({ key: 'a' }));

      expect(formatter.onKeyUp).toHaveBeenCalledTimes(1);
      expect(formatter.onKeyDown).not.toHaveBeenCalled();
    });

    it('hands the live selection and range to formatters that want the caret', () => {
      const formatter = { setCaretPositionAndRange: vi.fn() };
      c.textFormatterArray.set([formatter as never]);
      strays.push(selectSomeText());

      anyC['updateFormatterCaretPosition']();

      expect(formatter.setCaretPositionAndRange).toHaveBeenCalledTimes(1);
      const [sel, range] = formatter.setCaretPositionAndRange.mock.calls[0];
      expect(range.toString()).toBe('hello world');
      expect(sel.rangeCount).toBe(1);
    });

    it('skips the caret handover when nothing is selected', () => {
      const formatter = { setCaretPositionAndRange: vi.fn() };
      c.textFormatterArray.set([formatter as never]);
      window.getSelection()?.removeAllRanges();

      anyC['updateFormatterCaretPosition']();

      expect(formatter.setCaretPositionAndRange).not.toHaveBeenCalled();
    });

    it('maps the bold, italic and underline accelerators and ignores the rest', () => {
      c.enableRichText = true;
      const editor = makeEditor();
      c.customRichTextEditor = editor as never;

      expect(anyC['handleFormattingShortcuts'](key({ key: 'b', ctrlKey: true }))).toBe(true);
      expect(editor['applyBold']).toHaveBeenCalledTimes(1);
      expect(anyC['handleFormattingShortcuts'](key({ key: 'i', ctrlKey: true }))).toBe(true);
      expect(editor['applyItalic']).toHaveBeenCalledTimes(1);
      expect(anyC['handleFormattingShortcuts'](key({ key: 'u', ctrlKey: true }))).toBe(true);
      expect(editor['applyUnderline']).toHaveBeenCalledTimes(1);

      expect(anyC['handleFormattingShortcuts'](key({ key: 'k', ctrlKey: true }))).toBe(false);
      expect(anyC['handleFormattingShortcuts'](key({ key: 'b' }))).toBe(false);
    });

    it('closes open popups on Escape in the rich text editor', () => {
      c.isEmojiKeyboardOpen.set(true);

      anyC['handleRichTextKeydown'](key({ key: 'Escape' }));

      expect(c.isEmojiKeyboardOpen()).toBe(false);
    });

    it('selects the focused mention on Enter in the rich text editor', async () => {
      const editor = makeEditor();
      c.customRichTextEditor = editor as never;
      svc.mentionSuggestions.set([{ uid: 'u5', name: 'Five' }]);
      c.isMentionSuggestionsOpen.set(true);
      c.focusedMentionIndex.set(0);

      anyC['handleRichTextKeydown'](key({ key: 'Enter' }));
      await tick(0);

      expect(editor['insertMention']).toHaveBeenCalledWith('u5', 'Five', 1, false);
    });

    it('sends on Enter from the rich text editor when no mention list is open', () => {
      c.enterKeyBehavior = EnterKeyBehavior.SendMessage;
      const send = vi.spyOn(c, 'handleSend').mockResolvedValue(undefined);

      anyC['handleRichTextKeydown'](key({ key: 'Enter' }));

      expect(send).toHaveBeenCalledTimes(1);
    });

    it('stops the Escape host listener at the bubble menu when it is open', () => {
      anyC['isBubbleMenuVisible'].set(true);
      const event = key({ key: 'Escape' });

      c.handleGlobalEscapeKey(event);

      expect(anyC['isBubbleMenuVisible']()).toBe(false);
      expect(event.defaultPrevented).toBe(true);
    });
  });

  // =========================================================================
  describe('staged batch send', () => {
    beforeEach(() => {
      useReceiver(aUser());
    });

    it('does nothing when there is no receiver', async () => {
      noReceiver();
      tray.tiles.set([tile('image', 'a.png', 'image/png')]);

      await c.handleSend();

      expect(CometChat.sendMediaMessage).not.toHaveBeenCalled();
      expect(c.isSendingStaged()).toBe(false);
    });

    it('does nothing when every staged tile failed to upload', async () => {
      tray.tiles.set([tile('image', 'a.png', 'image/png')]);
      tray.getSuccessfulTiles.mockReturnValue([]);

      await c.handleSend();

      expect(CometChat.sendMediaMessage).not.toHaveBeenCalled();
    });

    it('sends one message per staged kind and puts the caption on the last only', async () => {
      const sent: Array<{ message: CometChat.BaseMessage; status: MessageStatus }> = [];
      subs.push(CometChatMessageEvents.ccMessageSent.subscribe((e) => sent.push(e as never)));
      tray.tiles.set([
        tile('file', 'notes.pdf', 'application/pdf'),
        tile('image', 'a.png', 'image/png'),
      ]);
      tray.batchId.set('batch-from-sdk');
      c.composerText.set('  look at these  ');
      const emitted: CometChat.BaseMessage[] = [];
      subs.push(c.sendButtonClick.subscribe((m) => emitted.push(m)));

      await c.handleSend();

      expect(CometChat.sendMediaMessage).toHaveBeenCalledTimes(2);
      const outgoing = vi.mocked(CometChat.sendMediaMessage).mock.calls.map(
        (call) => call[0] as CometChat.MediaMessage,
      );
      // Images are ordered before files regardless of staging order.
      expect(outgoing.map((m) => m.getType())).toEqual([
        CometChat.MESSAGE_TYPE.IMAGE,
        CometChat.MESSAGE_TYPE.FILE,
      ]);
      const metas = outgoing.map((m) => m.getMetadata() as Record<string, unknown>);
      expect(metas.every((meta) => meta['batchId'] === 'batch-from-sdk')).toBe(true);
      expect(outgoing[0].getCaption?.()).toBeFalsy();
      expect(outgoing[1].getCaption?.()).toBe('look at these');

      expect(sent.filter((e) => e.status === MessageStatus.inprogress)).toHaveLength(2);
      expect(sent.filter((e) => e.status === MessageStatus.success)).toHaveLength(2);
      expect(emitted).toHaveLength(1);
      expect(tray.clearAll).toHaveBeenCalledTimes(1);
      expect(c.isSendingStaged()).toBe(false);
    });

    it('addresses a group receiver by guid and mints its own batch id when the tray has none', async () => {
      useReceiver(aGroup());
      tray.tiles.set([tile('video', 'clip.mp4', 'video/mp4')]);
      tray.batchId.set(null);

      await c.handleSend();

      const msg = vi.mocked(CometChat.sendMediaMessage).mock.calls[0][0] as CometChat.MediaMessage;
      expect(msg.getReceiverId()).toBe('g1');
      expect(msg.getReceiverType()).toBe(CometChat.RECEIVER_TYPE.GROUP);
      const batchId = (msg.getMetadata() as Record<string, unknown>)['batchId'];
      expect(typeof batchId).toBe('string');
      expect(batchId).not.toBe('');
    });

    it('stamps the thread parent and mirrors the subscription for a threaded batch', async () => {
      const mirror = vi.spyOn(thread, 'mirrorSubscribed').mockImplementation(() => undefined);
      const session = thread.captureSession();
      c.parentMessageId = 909;
      tray.tiles.set([tile('audio', 'clip.mp3', 'audio/mpeg')]);

      await c.handleSend();

      const msg = vi.mocked(CometChat.sendMediaMessage).mock.calls[0][0] as CometChat.MediaMessage;
      expect(msg.getParentMessageId()).toBe(909);
      expect(mirror).toHaveBeenCalledWith(909, session);
    });

    it('carries the quoted message and leaves reply mode once the batch is handed off', async () => {
      const quoted = textMessage('quoted', 606);
      c.messageToReplySignal.set(quoted);
      tray.tiles.set([tile('image', 'a.png', 'image/png')]);

      await c.handleSend();

      const msg = vi.mocked(CometChat.sendMediaMessage).mock.calls[0][0] as CometChat.MediaMessage;
      expect(msg.getQuotedMessageId?.()).toBe(606);
      expect(c.messageToReplySignal()).toBeNull();
    });

    it('marks the message failed and reports the error when the SDK rejects', async () => {
      const sent: Array<{ message: CometChat.BaseMessage; status: MessageStatus }> = [];
      subs.push(CometChatMessageEvents.ccMessageSent.subscribe((e) => sent.push(e as never)));
      const seen: CometChat.CometChatException[] = [];
      subs.push(c.error.subscribe((e) => seen.push(e)));
      vi.mocked(CometChat.sendMediaMessage).mockRejectedValueOnce(
        Object.assign(new Error('upload rejected'), { code: 'ERR_UPLOAD' }),
      );
      tray.tiles.set([tile('image', 'a.png', 'image/png')]);

      await c.handleSend();

      const errored = sent.filter((e) => e.status === MessageStatus.error);
      expect(errored).toHaveLength(1);
      expect((errored[0].message as unknown as { error: { code: string } }).error.code).toBe('ERR_UPLOAD');
      expect(seen).toHaveLength(1);
      expect(toast.error).toHaveBeenCalled();
      expect(c.isSendingStaged()).toBe(false);
    });

    it('treats an undefined SDK result as a failure rather than leaving the bubble pending', async () => {
      const sent: Array<{ message: CometChat.BaseMessage; status: MessageStatus }> = [];
      subs.push(CometChatMessageEvents.ccMessageSent.subscribe((e) => sent.push(e as never)));
      const seen: CometChat.CometChatException[] = [];
      subs.push(c.error.subscribe((e) => seen.push(e)));
      vi.mocked(CometChat.sendMediaMessage).mockResolvedValueOnce(undefined as never);
      tray.tiles.set([tile('image', 'a.png', 'image/png')]);

      await c.handleSend();

      const errored = sent.filter((e) => e.status === MessageStatus.error);
      expect(errored).toHaveLength(1);
      expect((errored[0].message as unknown as { error: { code: string } }).error.code)
        .toBe('ERR_MESSAGE_SEND_FAILED');
      expect(seen[0].message).toContain('returned no message');
    });

    it('leaves the send flag set when the staged tiles have no sendable kind', async () => {
      tray.tiles.set([{ ...tile('image', 'a.png', 'image/png'), type: 'other' } as never]);

      await c.handleSend();

      expect(CometChat.sendMediaMessage).not.toHaveBeenCalled();
      // The early return happens before the try/finally, so Send stays disabled.
      expect(c.isSendingStaged()).toBe(true);
    });

    it('ignores a second send while a batch is in flight', async () => {
      tray.tiles.set([tile('image', 'a.png', 'image/png')]);
      c.isSendingStaged.set(true);

      await c.handleSend();

      expect(CometChat.sendMediaMessage).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  describe('single-message send paths', () => {
    it('attaches no metadata to an outgoing message', () => {
      expect(anyC['buildMessageMetadata']()).toBeUndefined();
    });

    it('collects mentioned users from the map, the suggestions and the sdk markers', () => {
      anyC['mentionedUsersMap'].set('u1', new CometChat.User({ uid: 'u1', name: 'One' }));
      svc.mentionSuggestions.set([
        { uid: 'u2', entity: new CometChat.User({ uid: 'u2', name: 'Two' }) },
      ]);
      c.composerText.set('hey <@uid:u1> and <@uid:u2> and <@uid:ghost>');

      const users = anyC['extractMentionedUsers']() as CometChat.User[];

      expect(users.map((u) => u.getUid()).sort()).toEqual(['u1', 'u2']);
      expect(users.map((u) => u.getName()).sort()).toEqual(['One', 'Two']);
    });

    it('collects nothing when mentions are disabled', () => {
      c.disableMentions = true;
      anyC['mentionedUsersMap'].set('u1', new CometChat.User({ uid: 'u1', name: 'One' }));
      c.composerText.set('<@uid:u1>');

      expect(anyC['extractMentionedUsers']()).toEqual([]);
    });

    it('lets each formatter rewrite the outgoing message', () => {
      const formatter = {
        formatMessageForSending: vi.fn((m: CometChat.TextMessage) => {
          m.setText(`${m.getText()}!`);
          return m;
        }),
      };
      c.textFormatterArray.set([formatter as never, {} as never]);
      const msg = textMessage('body');

      const out = anyC['applyTextFormatters'](msg) as CometChat.TextMessage;

      expect(out.getText()).toBe('body!');
    });

    it('publishes a successful edit and emits the edited message', async () => {
      const edited = textMessage('edited body', 70);
      svc.editMessage.mockResolvedValue(edited);
      const seen: Array<{ status: string }> = [];
      subs.push(CometChatMessageEvents.ccMessageEdited.subscribe((e) => seen.push(e as never)));
      const emitted: CometChat.BaseMessage[] = [];
      subs.push(c.sendButtonClick.subscribe((m) => emitted.push(m)));

      await anyC['handleEditMessage']('edited body', textMessage('old body', 70));

      expect(svc.editMessage).toHaveBeenCalledTimes(1);
      expect(seen.map((e) => e.status)).toEqual([MessageStatus.success]);
      expect(emitted).toEqual([edited]);
      expect(c.composerText()).toBe('');
      expect(c.isEditMode()).toBe(false);
    });

    it('publishes a failed edit and reports the error', async () => {
      svc.editMessage.mockRejectedValue(new Error('edit window closed'));
      const seen: Array<{ status: string }> = [];
      subs.push(CometChatMessageEvents.ccMessageEdited.subscribe((e) => seen.push(e as never)));
      const errors: CometChat.CometChatException[] = [];
      subs.push(c.error.subscribe((e) => errors.push(e)));

      await anyC['handleEditMessage']('new', textMessage('old', 71));

      expect(seen.map((e) => e.status)).toEqual([MessageStatus.error]);
      expect(errors[0].message).toBe('edit window closed');
    });

    it('ignores an edit with no target message', async () => {
      await anyC['handleEditMessage']('new', undefined);
      expect(svc.editMessage).not.toHaveBeenCalled();
    });

    it('sends a new text message and clears the composer', async () => {
      const receiver = new CometChat.User({ uid: 'u1', name: 'One' }) as CometChat.User;
      const delivered = textMessage('hello', 72);
      svc.sendTextMessage.mockResolvedValue(delivered);
      const sent: Array<{ status: string }> = [];
      subs.push(CometChatMessageEvents.ccMessageSent.subscribe((e) => sent.push(e as never)));
      const emitted: CometChat.BaseMessage[] = [];
      subs.push(c.sendButtonClick.subscribe((m) => emitted.push(m)));
      c.composerText.set('hello');

      await anyC['handleSendNewMessage'](receiver, 'hello', []);

      expect(sent.map((e) => e.status)).toEqual([MessageStatus.inprogress, MessageStatus.success]);
      expect(emitted).toEqual([delivered]);
      expect(c.composerText()).toBe('');
    });

    it('resets the mentions formatter when one is installed', () => {
      const formatter = new CometChatMentionsFormatter();
      const reset = vi.spyOn(formatter, 'reset');
      c.mentionsFormatter.set(formatter);

      anyC['resetMentionsFormatter']();

      expect(reset).toHaveBeenCalledTimes(1);
    });

    it('tolerates resetting the mentions formatter when there is none', () => {
      c.mentionsFormatter.set(null);
      anyC['resetMentionsFormatter']();
      expect(c.mentionsFormatter()).toBeNull();
    });

    it('maps each staged kind onto the sdk media message type', () => {
      expect(anyC['getMediaMessageType']('image')).toBe(CometChat.MESSAGE_TYPE.IMAGE);
      expect(anyC['getMediaMessageType']('video')).toBe(CometChat.MESSAGE_TYPE.VIDEO);
      expect(anyC['getMediaMessageType']('audio')).toBe(CometChat.MESSAGE_TYPE.AUDIO);
      expect(anyC['getMediaMessageType']('file')).toBe(CometChat.MESSAGE_TYPE.FILE);
    });
  });

  // =========================================================================
  describe('stickers', () => {
    it('sends the picked sticker and emits the delivered message', async () => {
      useReceiver(aUser());
      const delivered = textMessage('sticker', 80);
      svc.sendStickerMessage.mockResolvedValue(delivered);
      const sent: Array<{ status: string }> = [];
      subs.push(CometChatMessageEvents.ccMessageSent.subscribe((e) => sent.push(e as never)));
      const emitted: CometChat.BaseMessage[] = [];
      subs.push(c.sendButtonClick.subscribe((m) => emitted.push(m)));

      await c.handleStickerSelect({ stickerUrl: 'https://s.test/a.png', stickerName: 'wave' } as never);

      expect(svc.sendStickerMessage).toHaveBeenCalledWith(
        expect.anything(), 'https://s.test/a.png', 'wave', undefined, undefined, expect.anything(),
      );
      expect(sent.map((e) => e.status)).toEqual([MessageStatus.inprogress, MessageStatus.success]);
      expect(emitted).toEqual([delivered]);
    });

    it('marks the sticker failed when the service returns nothing', async () => {
      useReceiver(aUser());
      svc.sendStickerMessage.mockResolvedValue(null);
      const sent: Array<{ status: string }> = [];
      subs.push(CometChatMessageEvents.ccMessageSent.subscribe((e) => sent.push(e as never)));

      await c.handleStickerSelect({ stickerUrl: 'https://s.test/a.png', stickerName: 'wave' } as never);

      expect(sent.map((e) => e.status)).toEqual([MessageStatus.inprogress, MessageStatus.error]);
    });

    it('reports a sticker send failure', async () => {
      useReceiver(aUser());
      svc.sendStickerMessage.mockRejectedValue(new Error('stickers disabled'));
      const errors: CometChat.CometChatException[] = [];
      subs.push(c.error.subscribe((e) => errors.push(e)));

      await c.handleStickerSelect({ stickerUrl: 'https://s.test/a.png', stickerName: 'wave' } as never);

      expect(errors.some((e) => e.message === 'stickers disabled')).toBe(true);
    });

    it('does not send a sticker without a receiver', async () => {
      await c.handleStickerSelect({ stickerUrl: 'https://s.test/a.png', stickerName: 'wave' } as never);
      expect(svc.sendStickerMessage).not.toHaveBeenCalled();
      expect(loggerWarn).toHaveBeenCalled();
    });
  });

  // =========================================================================
  describe('attachment previews', () => {
    const images = () => [
      tile('image', 'a.png', 'image/png'),
      tile('image', 'b.png', 'image/png'),
      tile('file', 'c.pdf', 'application/pdf'),
    ];

    it('opens the fullscreen viewer for visual attachments only', () => {
      c.attachments.set(images());

      c.handleAttachmentClick(c.attachments()[2], 2);
      expect(c.isFullscreenViewerOpen()).toBe(false);

      c.handleAttachmentClick(c.attachments()[1], 1);
      expect(c.isFullscreenViewerOpen()).toBe(true);
      expect(c.fullscreenViewerIndex()).toBe(1);
    });

    it('wraps around when paging through the fullscreen viewer', () => {
      c.attachments.set(images());

      c.fullscreenViewerIndex.set(0);
      c.handleFullscreenViewerPrevious();
      expect(c.fullscreenViewerIndex()).toBe(2);
      c.handleFullscreenViewerPrevious();
      expect(c.fullscreenViewerIndex()).toBe(1);

      c.fullscreenViewerIndex.set(2);
      c.handleFullscreenViewerNext();
      expect(c.fullscreenViewerIndex()).toBe(0);
      c.handleFullscreenViewerNext();
      expect(c.fullscreenViewerIndex()).toBe(1);
      expect(c.getCurrentFullscreenAttachment()?.name).toBe('b.png');
    });

    it('removes an attachment, emits it and announces the removal', async () => {
      const list = images();
      c.attachments.set(list);
      const removed: File[] = [];
      subs.push(c.attachmentRemoved.subscribe((f) => removed.push(f)));

      c.handleRemoveAttachment(list[0]);

      expect(c.attachments().map((a) => a.name)).toEqual(['b.png', 'c.pdf']);
      expect(removed).toEqual([list[0].file]);
      await announceSettled();
      expect(c.liveRegionPoliteText()).toContain('a.png');
    });
  });

  // =========================================================================
  describe('focus helpers', () => {
    function refWithButton() {
      const host = document.createElement('div');
      const btn = document.createElement('button');
      host.appendChild(btn);
      document.body.appendChild(host);
      strays.push(host);
      const focus = vi.spyOn(btn, 'focus');
      return { ref: { nativeElement: host }, focus };
    }

    it('focuses the text input and parks the caret at the end', async () => {
      const input = document.createElement('textarea');
      input.value = 'abc';
      document.body.appendChild(input);
      strays.push(input);
      const focus = vi.spyOn(input, 'focus');
      anyC['textInputRef'] = { nativeElement: input };

      anyC['focusTextInput']();
      await tick(80);

      expect(focus).toHaveBeenCalledTimes(1);
      expect(input.selectionStart).toBe(3);
    });

    it('does nothing when the text input is not rendered', async () => {
      const other = document.createElement('button');
      document.body.appendChild(other);
      strays.push(other);
      other.focus();
      expect(document.activeElement).toBe(other);

      const timeoutSpy = vi.spyOn(globalThis, 'setTimeout');
      anyC['textInputRef'] = undefined;
      try {
        expect(() => anyC['focusTextInput']()).not.toThrow();
        // No deferred focus is scheduled when there is nothing to focus
        expect(timeoutSpy).not.toHaveBeenCalled();
      } finally {
        timeoutSpy.mockRestore();
      }
      await tick(80);
      // Focus is left exactly where it was
      expect(document.activeElement).toBe(other);
    });

    it('focuses the inner button of each toolbar control', async () => {
      const attachment = refWithButton();
      const emoji = refWithButton();
      const stickers = refWithButton();
      const voice = refWithButton();
      anyC['attachmentButtonRef'] = attachment.ref;
      anyC['emojiButtonRef'] = emoji.ref;
      anyC['stickersButtonRef'] = stickers.ref;
      anyC['voiceButtonRef'] = voice.ref;

      anyC['focusAttachmentButton']();
      anyC['focusEmojiButton']();
      anyC['focusStickersButton']();
      anyC['focusVoiceButton']();
      await tick(20);

      expect(attachment.focus).toHaveBeenCalledTimes(1);
      expect(emoji.focus).toHaveBeenCalledTimes(1);
      expect(stickers.focus).toHaveBeenCalledTimes(1);
      expect(voice.focus).toHaveBeenCalledTimes(1);
    });

    it('moves focus nowhere when the toolbar controls are hidden', async () => {
      const sentinel = document.createElement('input');
      document.body.appendChild(sentinel);
      strays.push(sentinel);
      sentinel.focus();
      anyC['attachmentButtonRef'] = undefined;
      anyC['emojiButtonRef'] = undefined;
      anyC['stickersButtonRef'] = undefined;
      anyC['voiceButtonRef'] = undefined;

      anyC['focusAttachmentButton']();
      anyC['focusEmojiButton']();
      anyC['focusStickersButton']();
      anyC['focusVoiceButton']();
      await tick(20);

      expect(document.activeElement).toBe(sentinel);
    });
  });

  // =========================================================================
  describe('voice recording', () => {
    it('announces a recording start from the inline button, which closeAllPopups then cancels', async () => {
      c.isFullscreenViewerOpen.set(true);

      c.handleVoiceRecordingClick();

      await announceSettled();
      const started = CometChatLocalize.getLocalizedString('message_composer_recording_started');
      expect(started.length).toBeGreaterThan(0);
      expect(c.liveRegionAssertiveText()).toBe(started);
      // closeAllPopups() runs straight after the flag is raised and clears any
      // active recording, so the start never survives the same click.
      expect(c.isRecording()).toBe(false);
      expect(c.isFullscreenViewerOpen()).toBe(false);
    });

    it('stops recording from the inline button and resets the duration', async () => {
      c.isRecording.set(true);
      c.recordingDuration.set(7);

      c.handleVoiceRecordingClick();

      expect(c.isRecording()).toBe(false);
      expect(c.recordingDuration()).toBe(0);
      await announceSettled();
      const stopped = CometChatLocalize.getLocalizedString('message_composer_recording_stopped');
      expect(c.liveRegionAssertiveText()).toBe(stopped);
    });

    it('sends the finished recording as a voice note', async () => {
      useReceiver(aUser());
      const delivered = textMessage('voice', 90);
      svc.sendMediaMessage.mockResolvedValue(delivered);
      const emitted: CometChat.BaseMessage[] = [];
      subs.push(c.sendButtonClick.subscribe((m) => emitted.push(m)));

      await c.handleRecordingComplete(new Blob(['xx'], { type: 'audio/webm' }));

      expect(svc.sendMediaMessage).toHaveBeenCalledTimes(1);
      const file = svc.sendMediaMessage.mock.calls[0][1] as File;
      expect(file.name).toMatch(/^voice_message_\d+\.webm$/);
      expect(emitted).toEqual([delivered]);
      expect(c.isRecording()).toBe(false);
    });

    it('does not send a recording without a receiver', async () => {
      await c.handleRecordingComplete(new Blob(['xx'], { type: 'audio/webm' }));
      expect(svc.sendMediaMessage).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  describe('mentions', () => {
    it('loads the next mention page and marks the view for check', async () => {
      useReceiver(aGroup());

      await c.fetchMoreMentions();

      expect(svc.fetchMoreMentions).toHaveBeenCalledWith(true);
    });

    it('pages in more mentions once the list is scrolled near the bottom', () => {
      const list = document.createElement('div');
      Object.defineProperties(list, {
        scrollTop: { value: 160, configurable: true },
        scrollHeight: { value: 200, configurable: true },
        clientHeight: { value: 40, configurable: true },
      });

      c.handleMentionsScroll({ target: list } as unknown as Event);

      expect(svc.fetchMoreMentions).toHaveBeenCalledTimes(1);
    });

    it('does not page in more mentions while the list is scrolled high up', () => {
      const list = document.createElement('div');
      Object.defineProperties(list, {
        scrollTop: { value: 0, configurable: true },
        scrollHeight: { value: 2000, configurable: true },
        clientHeight: { value: 40, configurable: true },
      });

      c.handleMentionsScroll({ target: list } as unknown as Event);

      expect(svc.fetchMoreMentions).not.toHaveBeenCalled();
    });

    it('asks the service whether a mention points at the logged-in user', async () => {
      svc.checkIfSelfMention.mockResolvedValue(true);
      await expect(anyC['checkIfSelfMention']('me')).resolves.toBe(true);
    });

    it('inserts the chosen mention into the plain-text composer and emits the entity', async () => {
      const entity = new CometChat.User({ uid: 'u7', name: 'Seven' }) as CometChat.User;
      c.composerText.set('hi @se');
      c.cursorPosition.set(6);
      c.mentionSearchText.set('se');
      const picked: unknown[] = [];
      subs.push(c.mentionSelected.subscribe((e) => picked.push(e)));

      await c.selectMentionSuggestion({ uid: 'u7', name: 'Seven', entity } as never);

      expect(c.composerText()).toBe('hi @Seven ');
      expect(c.cursorPosition()).toBe(10);
      expect(picked).toEqual([entity]);
      expect(c.uniqueMentionCount()).toBe(1);
    });

    it('scrolls the focused mention option into view', () => {
      const option = document.createElement('div');
      option.id = 'mention-option-3';
      document.body.appendChild(option);
      strays.push(option);
      const scroll = vi.spyOn(option, 'scrollIntoView');

      anyC['scrollMentionIntoView'](3);

      expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest' });
    });

    it('ignores a scroll request for an option that is not rendered', () => {
      anyC['scrollMentionIntoView'](999);
      expect(document.getElementById('mention-option-999')).toBeNull();
    });

    it('closes the mention list and stops the in-flight search', () => {
      c.isMentionSuggestionsOpen.set(true);
      c.mentionSearchText.set('al');
      c.focusedMentionIndex.set(4);

      anyC['closeMentionSuggestions']();

      expect(c.isMentionSuggestionsOpen()).toBe(false);
      expect(c.mentionSearchText()).toBe('');
      expect(c.focusedMentionIndex()).toBe(0);
      expect(svc.stopMentionSearch).toHaveBeenCalledTimes(1);
    });

    it('raises the mention warning once the limit is reached', () => {
      const uids = new Set(Array.from({ length: 10 }, (_, i) => `u${i}`));
      c.customRichTextEditor = makeEditor({ getUniqueMentionUids: vi.fn(() => uids) }) as never;

      anyC['updateMentionsCount']();

      expect(c.uniqueMentionCount()).toBe(10);
      expect(c.showMentionsCountWarning()).toBe(true);
    });

    it('zeroes the mention count when mentions are disabled', () => {
      c.disableMentions = true;
      c.uniqueMentionCount.set(5);
      c.showMentionsCountWarning.set(true);

      anyC['updateMentionsCount']();

      expect(c.uniqueMentionCount()).toBe(0);
      expect(c.showMentionsCountWarning()).toBe(false);
    });

    it('primes mention pagination with the active group', () => {
      const group = aGroup();
      useReceiver(group);

      anyC['initializeMentionsRequestBuilder']('al');

      expect(svc.initializeMentionsPagination).toHaveBeenCalledWith('al', group, undefined, undefined);
    });

    it('closes the mention list on a click outside both the panel and the editor', () => {
      c.isMentionSuggestionsOpen.set(true);
      const outside = document.createElement('div');
      document.body.appendChild(outside);
      strays.push(outside);

      c.onDocumentClick({ target: outside } as unknown as MouseEvent);

      expect(c.isMentionSuggestionsOpen()).toBe(false);
    });

    it('keeps the mention list open for a click inside the suggestion panel', () => {
      c.isMentionSuggestionsOpen.set(true);
      const panel = document.createElement('div');
      panel.className = 'cometchat-message-composer__mention-suggestions';
      const row = document.createElement('div');
      panel.appendChild(row);
      document.body.appendChild(panel);
      strays.push(panel);

      c.onDocumentClick({ target: row } as unknown as MouseEvent);

      expect(c.isMentionSuggestionsOpen()).toBe(true);
    });

    it('keeps the mention list open for a click inside the editor', () => {
      c.isMentionSuggestionsOpen.set(true);
      const editorBox = document.createElement('div');
      editorBox.className = 'cometchat-message-composer__rich-text-editor';
      document.body.appendChild(editorBox);
      strays.push(editorBox);

      c.onDocumentClick({ target: editorBox } as unknown as MouseEvent);

      expect(c.isMentionSuggestionsOpen()).toBe(true);
    });

    it('ignores document clicks while the mention list is closed', () => {
      c.isMentionSuggestionsOpen.set(false);
      const outside = document.createElement('div');
      document.body.appendChild(outside);
      strays.push(outside);
      const closest = vi.spyOn(outside, 'closest');

      c.onDocumentClick({ target: outside } as unknown as MouseEvent);

      expect(closest).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  describe('screen-reader announcements', () => {
    it('announces the active edit mode', async () => {
      anyC['announceEditModeActivated']();
      await announceSettled();
      const expected = CometChatLocalize.getLocalizedString('message_composer_edit_mode_activated');
      expect(expected.length).toBeGreaterThan(0);
      expect(c.liveRegionPoliteText()).toBe(expected);
    });

    it('announces the active reply mode', async () => {
      anyC['announceReplyModeActivated']();
      await announceSettled();
      expect(c.liveRegionPoliteText()).toBe(
        CometChatLocalize.getLocalizedString('message_composer_reply_mode_activated'),
      );
    });

    it('names the file in the attachment-added announcement', async () => {
      anyC['announceAttachmentAdded']('quarterly.pdf');
      await announceSettled();
      expect(c.liveRegionPoliteText()).toContain('quarterly.pdf');
    });

    it('names the file in the attachment-removed announcement', async () => {
      anyC['announceAttachmentRemoved']('old.png');
      await announceSettled();
      expect(c.liveRegionPoliteText()).toContain('old.png');
    });

    it('announces the focused mention with its position in the list', async () => {
      anyC['announceFocusedMention']('Seven', 2, 5);
      await announceSettled();
      const text = c.liveRegionPoliteText();
      expect(text).toContain('Seven');
      expect(text).toContain('2');
      expect(text).toContain('5');
    });

    it('announces the mention suggestion count through the live announcer', () => {
      const announce = vi.spyOn(anyC['liveAnnouncerService'], 'announce').mockImplementation(() => undefined);

      anyC['announceMentionSuggestionsCount'](4);

      expect(announce).toHaveBeenCalledTimes(1);
      expect(announce.mock.calls[0][0]).toContain('4');
      expect(announce.mock.calls[0][1]).toBe('polite');
    });

    it('announces an inserted mention through the live announcer', () => {
      const announce = vi.spyOn(anyC['liveAnnouncerService'], 'announce').mockImplementation(() => undefined);

      anyC['announceMentionInserted']('Seven');

      expect(announce.mock.calls[0][0]).toContain('Seven');
    });

    it('distinguishes a format being switched on from being switched off', async () => {
      anyC['announceFormatStateChange']('Bold', true);
      await announceSettled();
      const on = c.liveRegionPoliteText();

      anyC['announceFormatStateChange']('Bold', false);
      await announceSettled();
      const off = c.liveRegionPoliteText();

      expect(on).toContain('Bold');
      expect(off).toContain('Bold');
      expect(on).not.toBe(off);
    });

    // Regression for a CI flake in the test above (expected '' to contain 'Bold'):
    // the layout-mode effect announces the layout and then blanked the polite
    // region 100 ms later unconditionally, wiping any announcement made in the
    // meantime. Whether it hit the test depended on when change detection first
    // ran the effect relative to the test body. Pinned here with fake timers.
    it('does not let the layout-mode announcement clear a later announcement', () => {
      vi.useFakeTimers();
      try {
        TestBed.tick(); // runs the constructor effects, including the layout-mode one
        vi.advanceTimersByTime(0);
        const layoutText = CometChatLocalize.getLocalizedString('message_composer_layout_single_line');
        expect(layoutText.length).toBeGreaterThan(0);
        expect(c.liveRegionPoliteText()).toBe(layoutText);

        // Announce inside the layout announcement's 100 ms window...
        vi.advanceTimersByTime(30);
        anyC['announceFormatStateChange']('Bold', true);
        // ...and read after both the 50 ms announce timer and the layout clear have fired.
        vi.advanceTimersByTime(80);

        expect(c.liveRegionPoliteText()).toContain('Bold');
      } finally {
        vi.useRealTimers();
      }
    });

    it('still clears its own layout-mode announcement when nothing replaced it', () => {
      vi.useFakeTimers();
      try {
        TestBed.tick();
        vi.advanceTimersByTime(0);
        expect(c.liveRegionPoliteText()).toBe(
          CometChatLocalize.getLocalizedString('message_composer_layout_single_line'),
        );
        vi.advanceTimersByTime(100);
        expect(c.liveRegionPoliteText()).toBe('');
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // =========================================================================
  describe('drag, drop, paste and the file picker', () => {
    function dragEvent(files: File[] = []): DragEvent {
      return {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: { files },
      } as unknown as DragEvent;
    }

    it('shows the drop overlay while a drag is over the composer', () => {
      c.handleDragEnter(dragEvent());
      expect(c.isDraggingOver()).toBe(true);
      c.handleDragEnter(dragEvent());
      // One leave for a nested element does not dismiss the overlay.
      c.handleDragLeave(dragEvent());
      expect(c.isDraggingOver()).toBe(true);
      c.handleDragLeave(dragEvent());
      expect(c.isDraggingOver()).toBe(false);
    });

    it('accepts the dragover event so the drop can land', () => {
      const event = dragEvent();
      c.handleDragOver(event);
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
    });

    it('stages dropped files and clears any stale picker kind', () => {
      useReceiver(aUser());
      c.pendingPickerKind = 'image';
      const file = new File(['x'], 'drop.png', { type: 'image/png' });

      c.handleDrop(dragEvent([file]));

      expect(c.isDraggingOver()).toBe(false);
      expect(tray.stage).toHaveBeenCalledWith([file], undefined);
      expect(c.pendingPickerKind).toBeUndefined();
    });

    it('ignores a drop when drag and drop is turned off', () => {
      c.enableDragDrop = false;
      c.handleDrop(dragEvent([new File(['x'], 'drop.png', { type: 'image/png' })]));
      expect(tray.stage).not.toHaveBeenCalled();
    });

    it('stages pasted files and leaves text pastes alone', () => {
      useReceiver(aUser());
      const file = new File(['x'], 'pasted.png', { type: 'image/png' });
      const preventDefault = vi.fn();

      c.handlePaste({
        clipboardData: { items: [{ kind: 'file', getAsFile: () => file }] },
        preventDefault,
      } as unknown as ClipboardEvent);

      expect(preventDefault).toHaveBeenCalledTimes(1);
      expect(tray.stage).toHaveBeenCalledWith([file], undefined);

      tray.stage.mockClear();
      const textPaste = vi.fn();
      c.handlePaste({
        clipboardData: { items: [{ kind: 'string', getAsFile: () => null }] },
        preventDefault: textPaste,
      } as unknown as ClipboardEvent);
      expect(textPaste).not.toHaveBeenCalled();
      expect(tray.stage).not.toHaveBeenCalled();
    });

    it('does nothing for a paste with no clipboard payload', () => {
      c.handlePaste({ clipboardData: null } as unknown as ClipboardEvent);
      expect(tray.stage).not.toHaveBeenCalled();
    });

    it('scopes the upload to a user receiver and keeps the picker kind', () => {
      useReceiver(aUser());
      c.parentMessageId = 55;
      c.pendingPickerKind = 'file';
      const file = new File(['x'], 'clip.mp4', { type: 'video/mp4' });

      anyC['processFiles']([file]);

      expect(tray.setReceiver).toHaveBeenCalledWith('u1', CometChat.RECEIVER_TYPE.USER, 55);
      // The chosen picker, not the MIME type, decides the staged kind.
      expect(tray.stage).toHaveBeenCalledWith([file], 'file');
    });

    it('scopes the upload to a group receiver', () => {
      useReceiver(aGroup());

      anyC['processFiles']([new File(['x'], 'a.png', { type: 'image/png' })]);

      expect(tray.setReceiver).toHaveBeenCalledWith('g1', CometChat.RECEIVER_TYPE.GROUP, undefined);
    });

    it('stages without a receiver scope when no conversation is open', () => {
      anyC['processFiles']([new File(['x'], 'a.png', { type: 'image/png' })]);

      expect(tray.setReceiver).not.toHaveBeenCalled();
      expect(tray.stage).toHaveBeenCalledTimes(1);
    });

    it('hands the whole picker selection to the tray and rearms the input', () => {
      useReceiver(aUser());
      const file = new File(['x'], 'picked.png', { type: 'image/png' });
      const target = { files: [file], value: 'C:\\fakepath\\picked.png' };

      c.handleFileInputChange({ target } as unknown as Event);

      expect(target.value).toBe('');
      expect(tray.stage).toHaveBeenCalledWith([file], undefined);
    });

    it('ignores a cancelled file dialog', () => {
      const target = { files: null, value: 'x' };
      c.handleFileInputChange({ target } as unknown as Event);
      expect(tray.stage).not.toHaveBeenCalled();
    });

    it('sends dropped files one by one on the single-attachment path', async () => {
      useReceiver(aUser());
      const delivered = textMessage('media', 95);
      svc.sendMediaMessage.mockResolvedValue(delivered);
      const emitted: CometChat.BaseMessage[] = [];
      subs.push(c.sendButtonClick.subscribe((m) => emitted.push(m)));

      await anyC['sendFilesDirectly']([new File(['x'], 'a.png', { type: 'image/png' })]);

      expect(svc.sendMediaMessage).toHaveBeenCalledTimes(1);
      expect(svc.sendMediaMessage.mock.calls[0][2]).toBe(CometChat.MESSAGE_TYPE.IMAGE);
      expect(emitted).toEqual([delivered]);
    });

    it('does not send files directly without a receiver', async () => {
      await anyC['sendFilesDirectly']([new File(['x'], 'a.png', { type: 'image/png' })]);
      expect(svc.sendMediaMessage).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  describe('file helpers', () => {
    it('derives the attachment kind from the mime type', () => {
      expect(anyC['getFileType'](new File([''], 'a.png', { type: 'image/png' }))).toBe('image');
      expect(anyC['getFileType'](new File([''], 'a.mp4', { type: 'video/mp4' }))).toBe('video');
      expect(anyC['getFileType'](new File([''], 'a.mp3', { type: 'audio/mpeg' }))).toBe('audio');
      expect(anyC['getFileType'](new File([''], 'a.bin', { type: '' }))).toBe('file');
    });

    it('labels a mime type for the size error', () => {
      expect(anyC['getFileTypeLabel']('image/png')).toBe('photo');
      expect(anyC['getFileTypeLabel']('application/pdf')).toBe('file');
    });

    it('pluralises the file-type labels', () => {
      expect(anyC['getPluralFileType']('photo')).toBe('photos');
      expect(anyC['getPluralFileType']('video')).toBe('videos');
      expect(anyC['getPluralFileType']('audio')).toBe('audio files');
      expect(anyC['getPluralFileType']('document')).toBe('files');
    });

    it('phrases the size error in the singular and the plural', () => {
      c.fileSizeError.set({ count: 1, fileType: 'photo', limitMB: 10, timestamp: 1 });
      expect(c.getFileSizeErrorMessage()).toBe(
        '1 photo you tried adding is larger than the 10 MB limit',
      );

      c.fileSizeError.set({ count: 3, fileType: 'photo', limitMB: 10, timestamp: 1 });
      expect(c.getFileSizeErrorMessage()).toBe(
        '3 photos you tried adding are larger than the 10 MB limit',
      );
    });

    it('has no size-error message once the banner is dismissed', () => {
      c.fileSizeError.set({ count: 1, fileType: 'photo', limitMB: 10, timestamp: 1 });
      c.dismissFileSizeError();
      expect(c.fileSizeError()).toBeNull();
      expect(c.getFileSizeErrorMessage()).toBe('');
    });
  });

  // =========================================================================
  describe('formatting toolbar', () => {
    let editor: Record<string, unknown>;

    beforeEach(() => {
      editor = makeEditor();
      c.customRichTextEditor = editor as never;
      c.enableRichText = true;
    });

    it('forwards every toolbar button to its editor command', () => {
      c.handleToolbarBold();
      c.handleToolbarItalic();
      c.handleToolbarUnderline();
      c.handleToolbarStrikethrough();
      c.handleToolbarInlineCode();
      c.handleToolbarOrderedList();
      c.handleToolbarBulletList();
      c.handleToolbarCodeBlock();
      c.handleToolbarBlockquote();

      expect(editor['applyBold']).toHaveBeenCalledTimes(1);
      expect(editor['applyItalic']).toHaveBeenCalledTimes(1);
      expect(editor['applyUnderline']).toHaveBeenCalledTimes(1);
      expect(editor['applyStrikethrough']).toHaveBeenCalledTimes(1);
      expect(editor['applyInlineCode']).toHaveBeenCalledTimes(1);
      expect(editor['applyOrderedList']).toHaveBeenCalledTimes(1);
      expect(editor['applyBulletList']).toHaveBeenCalledTimes(1);
      expect(editor['applyCodeBlock']).toHaveBeenCalledTimes(1);
      expect(editor['applyBlockquote']).toHaveBeenCalledTimes(1);
    });

    it('ignores every toolbar button when rich text is disabled', () => {
      c.enableRichText = false;

      c.handleToolbarBold();
      c.handleToolbarItalic();
      c.handleToolbarUnderline();
      c.handleToolbarStrikethrough();
      c.handleToolbarInlineCode();
      c.handleToolbarLink();
      c.handleToolbarOrderedList();
      c.handleToolbarBulletList();
      c.handleToolbarCodeBlock();
      c.handleToolbarBlockquote();

      expect(editor['applyBold']).not.toHaveBeenCalled();
      expect(c.isLinkDialogOpen()).toBe(false);
    });

    it('opens the add-link dialog seeded with the selected text', () => {
      c.handleToolbarLink();

      expect(c.isLinkDialogOpen()).toBe(true);
      expect(c.linkDialogMode()).toBe('add');
      expect(c.linkDialogInitialText()).toBe('selected');
      expect(c.linkDialogInitialUrl()).toBe('');
      expect(anyC['savedLinkSelection']).toEqual({ start: 1, end: 4 });
    });

    it('opens the edit-link dialog seeded from the link under the caret', () => {
      editor['getFormatState'] = vi.fn(() => ({ ...BLANK_FORMAT_STATE, link: true }));
      c.richTextFormatState.set({ ...BLANK_FORMAT_STATE, link: true });

      c.handleToolbarLink();

      expect(c.linkDialogMode()).toBe('edit');
      expect(c.linkDialogInitialUrl()).toBe('https://existing.test');
      expect(c.linkDialogInitialText()).toBe('existing');
    });

    it('reads the format state back off the editor', () => {
      editor['getFormatState'] = vi.fn(() => ({ ...BLANK_FORMAT_STATE, bold: true, codeBlock: true }));

      anyC['updateFormatStateFromEditor']();

      expect(c.richTextFormatState().bold).toBe(true);
      expect(c.isInlineFormattingDisabled()).toBe(true);
    });

    it('leaves the format state alone when rich text is disabled', () => {
      c.enableRichText = false;
      c.richTextFormatState.set({ ...BLANK_FORMAT_STATE });
      editor['getFormatState'] = vi.fn(() => ({ ...BLANK_FORMAT_STATE, bold: true }));

      anyC['updateFormatStateFromEditor']();

      expect(c.richTextFormatState().bold).toBe(false);
    });

    it('stores the format state reported by a selection change', () => {
      c.showBubbleMenuOnSelection = false;

      anyC['handleSelectionUpdate']({ ...BLANK_FORMAT_STATE, italic: true });

      expect(c.richTextFormatState().italic).toBe(true);
    });

    it('does not position the bubble menu for a range with no client rects', () => {
      const host = selectSomeText();
      strays.push(host);
      const range = window.getSelection()!.getRangeAt(0);

      anyC['updateBubbleMenuPosition'](range);

      expect(anyC['bubbleMenuPosition']()).toBeNull();
    });

    it('centres the bubble menu over the selection and clamps it inside the composer', () => {
      const rect = new DOMRect(500, 300, 100, 20);
      const editorRect = new DOMRect(100, 200, 800, 400);
      const composerRect = new DOMRect(100, 180, 800, 500);

      anyC['calculateAndSetPosition'](rect, editorRect, composerRect, 200);

      // left = 500 + (100 - 200) / 2 = 450, top = 300 - 44 - 8 = 248
      expect(anyC['bubbleMenuPosition']()).toEqual({ top: 248, left: 450 });
    });

    it('pins the bubble menu to the composer edges and off the top of the viewport', () => {
      anyC['calculateAndSetPosition'](
        new DOMRect(100, 10, 10, 20), new DOMRect(100, 0, 800, 400), new DOMRect(100, 0, 800, 400), 200,
      );
      // left would be 100 + (10 - 200) / 2 = 5 -> clamped to composer.left + 8
      expect(anyC['bubbleMenuPosition']()).toEqual({ top: 8, left: 108 });

      anyC['calculateAndSetPosition'](
        new DOMRect(880, 300, 10, 20), new DOMRect(100, 0, 800, 400), new DOMRect(100, 0, 800, 400), 200,
      );
      // right-clamped to composer.right - width - 8 = 900 - 200 - 8
      expect(anyC['bubbleMenuPosition']()).toEqual({ top: 248, left: 692 });
    });

    it('counts the text offset of a node inside the editor', () => {
      const root = document.createElement('div');
      root.innerHTML = '<span>abc</span><span>defg</span>';
      document.body.appendChild(root);
      strays.push(root);
      const second = root.querySelectorAll('span')[1].firstChild!;

      expect(anyC['getTextOffsetFromNode'](root, second, 2)).toBe(5);
      // A node outside the walk falls through to the total length.
      expect(anyC['getTextOffsetFromNode'](root, document.createTextNode('x'), 0)).toBe(7);
    });

    it('toggles the fixed toolbar and drops any open bubble menu', () => {
      anyC['isBubbleMenuVisible'].set(true);
      anyC['textSelection'].set({ from: 0, to: 2 });
      anyC['bubbleMenuPosition'].set({ top: 1, left: 2 });

      c.toggleFixedToolbar();

      expect(c.isFixedToolbarShown()).toBe(true);
      expect(c.isFixedToolbarManuallyToggled()).toBe(true);
      expect(anyC['isBubbleMenuVisible']()).toBe(false);
      expect(anyC['bubbleMenuPosition']()).toBeNull();

      c.toggleFixedToolbar();
      expect(c.isFixedToolbarShown()).toBe(false);
    });
  });


  // =========================================================================
  describe('sound and formatter inputs', () => {
    it('reads back the values set through the paired setters', () => {
      c.disableSoundForMessage = false;
      expect(c.disableSoundForMessage).toBe(false);
      c.disableSoundForMessage = true;
      expect(c.disableSoundForMessage).toBe(true);

      c.customSoundForMessage = 'assets/bell.mp3';
      expect(c.customSoundForMessage).toBe('assets/bell.mp3');

      const formatters = [new CometChatMentionsFormatter()];
      c.textFormatters = formatters;
      expect(c.textFormatters).toBe(formatters);
    });

    it('falls back to the empty defaults when neither an input nor a global config is given', () => {
      // build() sets disableSoundForMessage, which latches the "explicit" flag.
      anyC['disableSoundForMessageExplicitlySet'].set(false);

      expect(c.effectiveDisableSoundForMessage()).toBe(false);
      expect(c.effectiveCustomSoundForMessage()).toBe('');
      expect(c.effectiveTextFormatters()).toEqual([]);
    });
  });

  describe('global config fallbacks', () => {
    const globalFormatter = new CometChatMentionsFormatter();

    beforeEach(() => {
      fixture.destroy();
      TestBed.resetTestingModule();
      svc = makeComposerService();
      tray = makeTray();
      toast = { error: vi.fn() };
      TestBed.configureTestingModule({
        imports: [CometChatMessageComposerComponent],
        providers: [
          {
            provide: COMETCHAT_GLOBAL_CONFIG,
            useValue: {
              disableSoundForMessages: true,
              customSoundForMessages: 'assets/global.mp3',
              textFormatters: [globalFormatter],
            },
          },
        ],
      });
      TestBed.overrideComponent(CometChatMessageComposerComponent, {
        set: {
          providers: [
            { provide: MessageComposerService, useValue: svc },
            { provide: MediaUploadTrayService, useValue: tray },
            { provide: CometChatToastService, useValue: toast },
          ],
        },
      });
      fixture = TestBed.createComponent(CometChatMessageComposerComponent);
      fixture.componentRef.changeDetectorRef.detach();
      c = fixture.componentInstance;
      anyC = c as unknown as Record<string, any>;
    });

    it('takes the sound and formatter settings from the global config', () => {
      expect(c.effectiveDisableSoundForMessage()).toBe(true);
      expect(c.effectiveCustomSoundForMessage()).toBe('assets/global.mp3');
      expect(c.effectiveTextFormatters()).toEqual([globalFormatter]);
    });

    it('lets an explicit input override the global config', () => {
      c.disableSoundForMessage = false;
      c.customSoundForMessage = 'assets/local.mp3';
      c.textFormatters = [];

      expect(c.effectiveDisableSoundForMessage()).toBe(false);
      expect(c.effectiveCustomSoundForMessage()).toBe('assets/local.mp3');
      expect(c.effectiveTextFormatters()).toEqual([]);
    });
  });

  // =========================================================================
  describe('ngOnInit failure', () => {
    it('reports a failure inside ngOnInit through composerError and the error output', () => {
      const seen: unknown[] = [];
      subs.push(c.error.subscribe((e) => seen.push(e)));
      svc.setErrorCallback.mockImplementation(() => {
        throw new Error('no error channel');
      });

      c.ngOnInit();

      expect(c.composerError()?.message).toBe('no error channel');
      expect(seen).toHaveLength(1);
      expect(loggerError).toHaveBeenCalledWith(
        'CometChatMessageComposer',
        'Error in ngOnInit:',
        expect.any(Error),
      );
    });
  });

  // =========================================================================
  describe('remaining toggles and close handlers', () => {
    it('toggles voice recording on and off through the popover toggle', async () => {
      c.toggleVoiceRecording();
      expect(c.contentToDisplay()).toBe('voiceRecording');
      expect(c.isRecording()).toBe(true);
      c.recordingDuration.set(6);

      c.toggleVoiceRecording();
      expect(c.contentToDisplay()).toBe('none');
      expect(c.isRecording()).toBe(false);
      expect(c.recordingDuration()).toBe(0);
      await announceSettled();
      expect(c.liveRegionAssertiveText()).toBe(
        CometChatLocalize.getLocalizedString('message_composer_recording_stopped'),
      );
    });

    it('toggles the sticker keyboard and broadcasts it as the active popover', () => {
      const active: string[] = [];
      subs.push(CometChatUIEvents.ccActivePopover.subscribe((v) => active.push(v as string)));

      c.toggleStickersKeyboard();
      expect(c.isStickersKeyboardOpen()).toBe(true);
      expect(active).toContain('stickers');

      c.toggleStickersKeyboard();
      expect(c.isStickersKeyboardOpen()).toBe(false);
    });

    it('closes the action sheet back to no content', () => {
      c.contentToDisplay.set('attachments');
      anyC['syncLegacyPopoverSignals']();

      c.handleActionSheetClose();

      expect(c.contentToDisplay()).toBe('none');
      expect(c.isAttachmentMenuOpen()).toBe(false);
    });

    it('closes the emoji keyboard and returns focus to the editor', async () => {
      const editor = makeEditor();
      c.customRichTextEditor = editor as never;
      c.isEmojiKeyboardOpen.set(true);

      c.handleEmojiKeyboardClose();
      await tick(80);

      expect(c.isEmojiKeyboardOpen()).toBe(false);
      expect(c.contentToDisplay()).toBe('none');
      expect(editor['getContentEditable']).toHaveBeenCalled();
    });

    it('closes the sticker keyboard and returns focus to the plain-text input', async () => {
      const input = document.createElement('textarea');
      document.body.appendChild(input);
      strays.push(input);
      const focus = vi.spyOn(input, 'focus');
      anyC['textInputRef'] = { nativeElement: input };
      c.contentToDisplay.set('stickers');

      c.handleStickersKeyboardClose();
      await tick(80);

      expect(c.contentToDisplay()).toBe('none');
      expect(focus).toHaveBeenCalledTimes(1);
    });

    it('closes the fullscreen viewer', () => {
      c.isFullscreenViewerOpen.set(true);
      c.handleFullscreenViewerClose();
      expect(c.isFullscreenViewerOpen()).toBe(false);
    });

    it('starts an inline recording after clearing whatever was open', async () => {
      c.isEmojiKeyboardOpen.set(true);
      c.contentToDisplay.set('emojiKeyboard');

      c.startInlineRecording();

      expect(c.isRecording()).toBe(true);
      expect(c.contentToDisplay()).toBe('voiceRecording');
      expect(c.isEmojiKeyboardOpen()).toBe(false);
      await announceSettled();
      expect(c.liveRegionAssertiveText()).toBe(
        CometChatLocalize.getLocalizedString('message_composer_recording_started'),
      );
    });

    it('cancels a recording without sending anything', async () => {
      c.contentToDisplay.set('voiceRecording');
      c.isRecording.set(true);
      c.recordingDuration.set(5);

      c.handleRecordingCancel();

      expect(c.isRecording()).toBe(false);
      expect(c.recordingDuration()).toBe(0);
      expect(c.contentToDisplay()).toBe('none');
      expect(svc.sendMediaMessage).not.toHaveBeenCalled();
      await announceSettled();
      expect(c.liveRegionAssertiveText()).toBe(
        CometChatLocalize.getLocalizedString('message_composer_recording_stopped'),
      );
    });

    it('reports a recorder failure and leaves recording mode', () => {
      c.isRecording.set(true);
      const seen: CometChat.CometChatException[] = [];
      subs.push(c.error.subscribe((e) => seen.push(e)));

      c.handleRecordingError(new Error('microphone blocked'));

      expect(c.isRecording()).toBe(false);
      expect(c.contentToDisplay()).toBe('none');
      expect(seen).toHaveLength(1);
      expect(seen[0].message).toBe('microphone blocked');
    });
  });

  // =========================================================================
  describe('attachment menu options', () => {
    let input: HTMLInputElement;
    let click: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      input = document.createElement('input');
      input.type = 'file';
      document.body.appendChild(input);
      strays.push(input);
      click = vi.spyOn(input, 'click').mockImplementation(() => undefined);
      anyC['fileInputRef'] = { nativeElement: input };
      c.contentToDisplay.set('attachments');
      anyC['syncLegacyPopoverSignals']();
    });

    it('opens the picker filtered to images', () => {
      c.handleAttachmentOptionClick('image');
      expect(input.accept).toBe('image/*');
      expect(c.pendingPickerKind).toBe('image');
      expect(click).toHaveBeenCalledTimes(1);
      expect(c.isAttachmentMenuOpen()).toBe(false);
    });

    it('opens the picker filtered to videos', () => {
      c.handleAttachmentOptionClick('video');
      expect(input.accept).toBe('video/*');
      expect(c.pendingPickerKind).toBe('video');
    });

    it('opens the picker filtered to audio', () => {
      c.handleAttachmentOptionClick('audio');
      expect(input.accept).toBe('audio/*');
      expect(c.pendingPickerKind).toBe('audio');
    });

    it('opens the unfiltered picker for the file option', () => {
      c.handleAttachmentOptionClick('file');
      expect(input.accept).toBe('*/*');
      expect(c.pendingPickerKind).toBe('file');
    });

    it('opens the poll modal instead of the picker', () => {
      c.handleAttachmentOptionClick('polls');
      expect(c.isPollModalOpen()).toBe(true);
      expect(click).not.toHaveBeenCalled();
    });

    it('starts a collaborative document', () => {
      useReceiver(aUser());
      c.handleAttachmentOptionClick('collaborative-document');
      expect(svc.createCollaborativeDocument).toHaveBeenCalledTimes(1);
    });

    it('starts a collaborative whiteboard', () => {
      useReceiver(aUser());
      c.handleAttachmentOptionClick('collaborative-whiteboard');
      expect(svc.createCollaborativeWhiteboard).toHaveBeenCalledTimes(1);
    });

    it('ignores an unknown option id', () => {
      c.handleAttachmentOptionClick('not-a-real-option');
      expect(click).not.toHaveBeenCalled();
      expect(c.pendingPickerKind).toBeUndefined();
      expect(c.isPollModalOpen()).toBe(false);
    });

    it('does nothing when the hidden file input is not rendered', () => {
      anyC['fileInputRef'] = undefined;
      c.handleAttachmentOptionClick('image');
      expect(c.pendingPickerKind).toBeUndefined();
      expect(loggerWarn).toHaveBeenCalled();
    });
  });

  // =========================================================================
  describe('edit and reply preview content', () => {
    function mediaMessage(caption: string) {
      const file = new File(['x'], 'holiday.png', { type: 'image/png' });
      const m = new CometChat.MediaMessage(
        'u1', file, CometChat.MESSAGE_TYPE.IMAGE, CometChat.RECEIVER_TYPE.USER,
      );
      m.setId(120);
      m.setCaption(caption);
      return m;
    }

    it('renders the formatted body as the edit subtitle for a text message', () => {
      c.textMessageToEdit.set(textMessage('**bold** caption'));

      const subtitle = c.getEditPreviewSubtitle();

      expect(subtitle).toContain('<strong>bold</strong>');
    });

    it('has no edit subtitle when nothing is being edited', () => {
      expect(c.getEditPreviewSubtitle()).toBe('');
    });

    it('leaves the edit subtitle to the media banner for a media message', () => {
      c.textMessageToEdit.set(mediaMessage('a caption') as never);
      expect(c.getEditPreviewSubtitle()).toBe('');
    });

    it('describes a captioned media message in the edit banner', () => {
      c.textMessageToEdit.set(mediaMessage('on the beach') as never);

      const parts = c.getEditPreviewMedia();

      expect(parts?.iconUrl).toBe('assets/conversations_image-message.svg');
      expect(parts?.label.length).toBeGreaterThan(0);
      expect(parts?.captionHtml).toContain('on the beach');
    });

    it('describes a captioned media message in the reply banner', () => {
      c.messageToReplySignal.set(mediaMessage('reply caption') as never);

      const parts = c.getReplyPreviewMedia();

      expect(parts?.captionHtml).toContain('reply caption');
    });

    it('has no media banner for a text message', () => {
      c.textMessageToEdit.set(textMessage('just words'));
      expect(c.getEditPreviewMedia()).toBeNull();
      expect(c.getReplyPreviewMedia()).toBeNull();
    });

    it('re-renders a media caption through the editor as rich nodes', () => {
      const editor = makeEditor();
      c.customRichTextEditor = editor as never;
      const msg = textMessage('body with <@uid:u3>');
      msg.setMentionedUsers([new CometChat.User({ uid: 'u3', name: 'Three' }) as CometChat.User]);

      anyC['populateEditorWithFormattedText'](msg);

      expect(editor['setContentWithMentions']).toHaveBeenCalledWith(
        'body with <@uid:u3>',
        expect.arrayContaining([expect.anything()]),
      );
    });
  });

  // =========================================================================
  describe('plain send path', () => {
    it('does not send when there is nothing to send', async () => {
      useReceiver(aUser());
      c.composerText.set('   ');

      await c.handleSend();

      expect(svc.sendTextMessage).not.toHaveBeenCalled();
    });

    it('sends the typed text when the composer has no staged tiles', async () => {
      useReceiver(aUser());
      svc.sendTextMessage.mockResolvedValue(textMessage('typed body', 130));
      c.composerText.set('typed body');

      await c.handleSend();

      expect(tray.getSuccessfulTiles).not.toHaveBeenCalled();
      expect(svc.sendTextMessage).toHaveBeenCalledTimes(1);
      expect(svc.sendTextMessage.mock.calls[0][1]).toBe('typed body');
    });

    it('hands the recording to the inline recorder instead of sending text', async () => {
      useReceiver(aUser());
      const handleInlineSend = vi.fn();
      c.isRecording.set(true);
      anyC['mediaRecorderRef'] = { handleInlineSend };

      await c.handleSend();

      expect(handleInlineSend).toHaveBeenCalledTimes(1);
      expect(svc.sendTextMessage).not.toHaveBeenCalled();
    });

    it('reports a send failure raised below the composer', async () => {
      useReceiver(aUser());
      svc.sendTextMessage.mockRejectedValue(new Error('rate limited'));
      c.composerText.set('typed body');
      const seen: CometChat.CometChatException[] = [];
      subs.push(c.error.subscribe((e) => seen.push(e)));

      await c.handleSend();

      expect(seen.some((e) => e.message === 'rate limited')).toBe(true);
    });

    it('validates and sends files one at a time on the single-attachment path', async () => {
      useReceiver(aUser());
      c.enableMultipleAttachments = false;
      c.maxFileSize = 10;
      svc.sendMediaMessage.mockResolvedValue(textMessage('media', 131));
      const seen: CometChat.CometChatException[] = [];
      subs.push(c.error.subscribe((e) => seen.push(e)));

      anyC['processFiles']([
        new File(['x'], 'small.png', { type: 'image/png' }),
        new File(['x'.repeat(200)], 'big.png', { type: 'image/png' }),
      ]);
      await tick(0);

      expect(tray.stage).not.toHaveBeenCalled();
      // The oversized file is reported and recorded, the valid one still goes out.
      expect(c.fileSizeError()?.count).toBe(1);
      expect(c.fileSizeError()?.fileType).toBe('photo');
      expect(seen).toHaveLength(1);
      expect(svc.sendMediaMessage).toHaveBeenCalledTimes(1);
      expect((svc.sendMediaMessage.mock.calls[0][1] as File).name).toBe('small.png');
    });
  });

  // =========================================================================
  describe('template context', () => {
    it('exposes the resolved conversation to custom views', () => {
      const user = aUser();
      useReceiver(user);

      expect(c.templateContext).toEqual({ user, group: undefined });
      expect(c.toolbarTrailingContext.composer).toBe(c);
    });

    it('exposes a group conversation, and nothing at all when none is set', () => {
      const group = aGroup();
      useReceiver(group);
      expect(c.templateContext).toEqual({ user: undefined, group });

      noReceiver();
      expect(c.templateContext).toEqual({ user: undefined, group: undefined });
    });

    it('does nothing on input focus or blur', () => {
      c.composerText.set('kept');
      c.handleInputFocus();
      c.handleInputBlur();
      expect(c.composerText()).toBe('kept');
    });
  });
});
