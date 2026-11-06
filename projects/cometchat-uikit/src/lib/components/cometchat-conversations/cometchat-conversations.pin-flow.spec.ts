/**
 * CometChatConversations — pin / unpin flow
 *
 * Covers the whole conversation pin path: whether the option is offered at
 * all, the confirmation asymmetry between pin and unpin, the SDK call and the
 * id it is made with, the event it publishes, the toast it announces and every
 * arm of the failure reporter.
 *
 * The conversations pushed through the service deliberately carry no last
 * message: rendering one pulls in the real conversation-item component, which
 * then needs a fully formed SDK message. Nothing here depends on a rendered
 * row, so the methods are driven directly on the instance instead.
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
// initialised SDK. Only the audio playback itself is stubbed out.
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
import { CometChatToastService } from '../base-elements/cometchat-toast/cometchat-toast.service';
import { PinSaveService } from '../../services/pin-save.service';
import { CometChatPinSaveEvents } from '../../events/CometChatPinSaveEvents';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChatLogger } from '../../utils/CometChatLogger';
import { CometChatUIKitConstants } from '../../constants';

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
    getConversationType: () => CometChatUIKitConstants.MessageReceiverType.user,
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
    getConversationType: () => CometChatUIKitConstants.MessageReceiverType.group,
    getUnreadMessageCount: () => 0,
    getLastMessage: () => undefined,
  } as unknown as CometChat.Conversation;
}

/**
 * A pinned conversation.
 *
 * Only the pinned variant gets an `isPinned` at all — an unpinned conversation
 * genuinely carries no key, which is what the optional call in
 * `isConversationPinned` exists for.
 */
function pinnedUserConversation(uid: string): CometChat.Conversation {
  const conv = userConversation(uid) as unknown as Record<string, unknown>;
  conv['isPinned'] = () => true;
  return conv as unknown as CometChat.Conversation;
}

/** A pinned group conversation. See {@link pinnedUserConversation}. */
function pinnedGroupConversation(guid: string): CometChat.Conversation {
  const conv = groupConversation(guid) as unknown as Record<string, unknown>;
  conv['isPinned'] = () => true;
  return conv as unknown as CometChat.Conversation;
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

/** The pin/save service as this flow uses it, or absent entirely. */
type PinSaveDouble = { isPinConversationEnabled: ReturnType<typeof vi.fn> } | null;

interface MockToastService {
  error: ReturnType<typeof vi.fn>;
  info: ReturnType<typeof vi.fn>;
  success: ReturnType<typeof vi.fn>;
  warning: ReturnType<typeof vi.fn>;
}

// ---------------------------------------------------------------------------
// SDK surface
// ---------------------------------------------------------------------------

const sdk = CometChat as unknown as Record<string, unknown>;

/**
 * The three members this flow feature-detects.
 *
 * The package's peer range admits builds without any of them, so the component
 * checks before calling — which means a test has to own their presence rather
 * than inherit whatever the installed SDK happens to ship. Saved and put back
 * around every test so nothing leaks into another file.
 */
const SDK_MEMBERS = ['pinConversation', 'unpinConversation', 'getPinnedConversationsLimit'] as const;
type SdkMember = (typeof SDK_MEMBERS)[number];

const originalSdkMembers = new Map<SdkMember, { present: boolean; value: unknown }>();

function stashSdkMembers(): void {
  originalSdkMembers.clear();
  for (const key of SDK_MEMBERS) {
    originalSdkMembers.set(key, {
      present: Object.prototype.hasOwnProperty.call(sdk, key),
      value: sdk[key],
    });
  }
}

function restoreSdkMembers(): void {
  for (const key of SDK_MEMBERS) {
    const original = originalSdkMembers.get(key);
    if (!original || !original.present) delete sdk[key];
    else sdk[key] = original.value;
  }
}

describe('CometChatConversationsComponent — pin flow', () => {
  let fixture: ComponentFixture<CometChatConversationsComponent>;
  let c: CometChatConversationsComponent;
  let service: MockConversationsService;
  let toast: MockToastService;
  let pinSave: PinSaveDouble;
  let pinConversation: ReturnType<typeof vi.fn>;
  let unpinConversation: ReturnType<typeof vi.fn>;
  let publishPinned: ReturnType<typeof vi.spyOn>;
  let publishUnpinned: ReturnType<typeof vi.spyOn>;
  let loggerError: ReturnType<typeof vi.spyOn>;

  const unpinnedUser = userConversation('alice');
  const unpinnedGroup = groupConversation('team');

  async function build(
    items: CometChat.Conversation[] = [unpinnedUser, unpinnedGroup],
    // Resolves false by default so the flag is only ever turned on by a test
    // that means to. `null` withholds the service altogether, which is what an
    // integrator on a build without it gets.
    pinSaveDouble: PinSaveDouble = { isPinConversationEnabled: vi.fn().mockResolvedValue(false) },
  ): Promise<void> {
    service = makeConversationsService(items);
    toast = { error: vi.fn(), info: vi.fn(), success: vi.fn(), warning: vi.fn() };
    pinSave = pinSaveDouble;

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CometChatConversationsComponent],
      providers: [
        { provide: ConversationsService, useValue: service },
        { provide: ChatStateService, useValue: { setActiveConversation: vi.fn() } },
        { provide: LiveAnnouncerService, useValue: { announce: vi.fn() } },
        { provide: CometChatToastService, useValue: toast },
        { provide: PinSaveService, useValue: pinSaveDouble },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatConversationsComponent);
    c = fixture.componentInstance;
    // The conversations effect plays a notification sound, which reaches into
    // CometChatUIKit and needs an initialised SDK.
    c.disableSoundForMessages = true;
    fixture.detectChanges();
    // Let the feature-flag promise settle, so no test observes the signal
    // changing underneath it. Two ticks: a rejection has to pass the `then`
    // before it reaches the `catch`.
    await Promise.resolve();
    await Promise.resolve();
  }

  /** Turn on the app-level flag that gates the pin option. */
  function enablePin(): void {
    (c as unknown as { conversationPinEnabled: WritableSignal<boolean> }).conversationPinEnabled.set(true);
  }

  /** The pin entry of the row menu, if the component offers one. */
  function pinOption(conversation: CometChat.Conversation) {
    return c.getContextMenuOptions(conversation).find(o => o.id === 'pinConversation');
  }

  /** The ids of the row menu entries, in order. */
  function optionIds(conversation: CometChat.Conversation): (string | undefined)[] {
    return c.getContextMenuOptions(conversation).map(o => o.id);
  }

  const localized = (key: string) => CometChatLocalize.getLocalizedString(key);

  beforeEach(async () => {
    stashSdkMembers();

    pinConversation = vi.fn().mockResolvedValue(pinnedUserConversation('alice'));
    unpinConversation = vi.fn().mockResolvedValue(userConversation('alice'));
    sdk['pinConversation'] = pinConversation;
    sdk['unpinConversation'] = unpinConversation;
    // Absent by default — the generic-copy arm of the failure reporter is the
    // one a build without the helper takes.
    delete sdk['getPinnedConversationsLimit'];

    // The pin/save subjects are static and shared. Publishing for real would
    // re-enter this component's own subscription and call replaceConversation a
    // second time, so the publishers are silenced and asserted on instead.
    publishPinned = vi
      .spyOn(CometChatPinSaveEvents, 'publishConversationPinned')
      .mockImplementation(() => undefined);
    publishUnpinned = vi
      .spyOn(CometChatPinSaveEvents, 'publishConversationUnpinned')
      .mockImplementation(() => undefined);
    loggerError = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);

    await build();
  });

  afterEach(() => {
    fixture?.destroy();
    vi.restoreAllMocks();
    restoreSdkMembers();
  });

  // -------------------------------------------------------------------------
  // Is the option offered at all?
  // -------------------------------------------------------------------------

  describe('pin option availability', () => {
    it('offers the pin entry when the SDK supports it and the app allows it', () => {
      enablePin();
      expect(optionIds(unpinnedUser)).toContain('pinConversation');
    });

    it('omits the pin entry while the app flag is still false', () => {
      expect(optionIds(unpinnedUser)).not.toContain('pinConversation');
      expect(optionIds(unpinnedUser)).toContain('delete');
    });

    it('omits the pin entry when the SDK has no pinConversation', () => {
      enablePin();
      delete sdk['pinConversation'];

      expect(optionIds(unpinnedUser)).not.toContain('pinConversation');
    });

    it('omits the pin entry when the SDK has no unpinConversation', () => {
      enablePin();
      delete sdk['unpinConversation'];

      expect(optionIds(unpinnedUser)).not.toContain('pinConversation');
    });

    it('omits the pin entry when pinning is hidden by input', () => {
      enablePin();
      c.hidePinConversation = true;

      expect(optionIds(unpinnedUser)).not.toContain('pinConversation');
    });

    it('leaves only delete when the SDK cannot pin', () => {
      enablePin();
      delete sdk['pinConversation'];
      delete sdk['unpinConversation'];

      expect(optionIds(unpinnedUser)).toEqual(['delete']);
    });

    it('offers pin above delete', () => {
      enablePin();
      const ids = optionIds(unpinnedUser);

      expect(ids.indexOf('pinConversation')).toBeLessThan(ids.indexOf('delete'));
    });

    it('offers pin on its own when deletion is hidden', () => {
      enablePin();
      c.hideDeleteConversation = true;

      expect(optionIds(unpinnedUser)).toEqual(['pinConversation']);
    });

    it('defers to a supplied options builder instead of offering pin', () => {
      enablePin();
      const custom = [{ id: 'custom' }] as never;
      c.options = () => custom;

      expect(c.getContextMenuOptions(unpinnedUser)).toBe(custom);
    });
  });

  // -------------------------------------------------------------------------
  // Where the app-level flag comes from
  //
  // Every other block here turns the flag on by setting the signal. These are
  // the tests that the signal is wired to the service at all — without them
  // the option could be gated on a flag nothing ever resolves.
  // -------------------------------------------------------------------------

  describe('pin option gating on the resolved app flag', () => {
    it('offers the pin entry once the service reports pinning is enabled', async () => {
      await build([unpinnedUser], { isPinConversationEnabled: vi.fn().mockResolvedValue(true) });

      expect(pinSave?.isPinConversationEnabled).toHaveBeenCalled();
      expect(optionIds(unpinnedUser)).toContain('pinConversation');
    });

    it('withholds the pin entry when the service reports pinning is disabled', async () => {
      await build([unpinnedUser], { isPinConversationEnabled: vi.fn().mockResolvedValue(false) });

      expect(optionIds(unpinnedUser)).toEqual(['delete']);
    });

    it('withholds the pin entry when the flag lookup rejects', async () => {
      await build([unpinnedUser], {
        isPinConversationEnabled: vi.fn().mockRejectedValue(new Error('no plan info')),
      });

      expect(optionIds(unpinnedUser)).toEqual(['delete']);
    });

    it('withholds the pin entry when the pin/save service is not provided at all', async () => {
      await build([unpinnedUser], null);

      expect(optionIds(unpinnedUser)).toEqual(['delete']);
    });

    it('withholds the pin entry before the flag lookup settles', async () => {
      // A promise that never resolves: the option must not render on the
      // strength of a lookup still in flight.
      await build([unpinnedUser], { isPinConversationEnabled: vi.fn(() => new Promise<boolean>(() => undefined)) });

      expect(optionIds(unpinnedUser)).toEqual(['delete']);
    });
  });

  // -------------------------------------------------------------------------
  // How the option describes itself
  // -------------------------------------------------------------------------

  describe('pin option labelling', () => {
    beforeEach(() => enablePin());

    it('reads Pin for an unpinned conversation', () => {
      expect(pinOption(unpinnedUser)?.title).toBe(localized('conversation_pin'));
    });

    it('reads Unpin for a pinned conversation', () => {
      expect(pinOption(pinnedUserConversation('alice'))?.title).toBe(localized('conversation_unpin'));
    });

    it('uses the keep icon for an unpinned conversation', () => {
      expect(pinOption(unpinnedUser)?.iconURL).toBe('assets/keep.svg');
    });

    it('uses the keep-off icon for a pinned conversation', () => {
      expect(pinOption(pinnedUserConversation('alice'))?.iconURL).toBe('assets/keep_off.svg');
    });

    it('pins straight away when the entry is clicked for an unpinned conversation', async () => {
      pinOption(unpinnedUser)?.onClick?.();
      await Promise.resolve();
      await Promise.resolve();

      expect(pinConversation).toHaveBeenCalled();
      expect(c.pendingUnpinConversation()).toBeNull();
    });

    it('asks first when the entry is clicked for a pinned conversation', () => {
      const pinned = pinnedUserConversation('alice');
      pinOption(pinned)?.onClick?.();

      expect(c.pendingUnpinConversation()).toBe(pinned);
      expect(unpinConversation).not.toHaveBeenCalled();
    });

    it('leaves the neighbouring delete entry pointed at the delete dialog', () => {
      c.getContextMenuOptions(unpinnedUser).find(o => o.id === 'delete')?.onClick?.();

      expect(c.showDeleteConfirmDialog()).toBe(true);
      expect(c.conversationToDelete()).toBe(unpinnedUser);
    });
  });

  // -------------------------------------------------------------------------
  // isConversationPinned
  // -------------------------------------------------------------------------

  describe('isConversationPinned', () => {
    it('is true when the conversation reports a pin', () => {
      expect(c.isConversationPinned(pinnedUserConversation('alice'))).toBe(true);
    });

    it('is false when the conversation reports no pin', () => {
      const conv = userConversation('alice') as unknown as Record<string, unknown>;
      conv['isPinned'] = () => false;

      expect(c.isConversationPinned(conv as unknown as CometChat.Conversation)).toBe(false);
    });

    it('is false when the conversation has no isPinned at all', () => {
      expect(c.isConversationPinned(unpinnedUser)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // requestPinConversation / confirm / cancel
  // -------------------------------------------------------------------------

  describe('requestPinConversation', () => {
    it('stages a confirmation for a pinned conversation instead of calling the SDK', () => {
      const pinned = pinnedUserConversation('alice');
      c.requestPinConversation(pinned);

      expect(c.pendingUnpinConversation()).toBe(pinned);
      expect(unpinConversation).not.toHaveBeenCalled();
      expect(pinConversation).not.toHaveBeenCalled();
    });

    it('pins an unpinned conversation without asking', async () => {
      c.requestPinConversation(unpinnedUser);
      await Promise.resolve();
      await Promise.resolve();

      expect(pinConversation).toHaveBeenCalledWith('alice', CometChatUIKitConstants.MessageReceiverType.user);
      expect(c.pendingUnpinConversation()).toBeNull();
    });
  });

  describe('confirmUnpinConversation', () => {
    it('clears the staged conversation and unpins it', async () => {
      c.requestPinConversation(pinnedUserConversation('alice'));
      c.confirmUnpinConversation();
      await Promise.resolve();
      await Promise.resolve();

      expect(c.pendingUnpinConversation()).toBeNull();
      expect(unpinConversation).toHaveBeenCalledWith('alice', CometChatUIKitConstants.MessageReceiverType.user);
    });

    it('does nothing when nothing is staged', async () => {
      c.confirmUnpinConversation();
      await Promise.resolve();

      expect(unpinConversation).not.toHaveBeenCalled();
      expect(c.pendingUnpinConversation()).toBeNull();
    });
  });

  describe('cancelUnpinConversation', () => {
    it('drops the staged conversation', () => {
      c.requestPinConversation(pinnedUserConversation('alice'));
      c.cancelUnpinConversation();

      expect(c.pendingUnpinConversation()).toBeNull();
    });

    it('leaves the conversation pinned', async () => {
      c.requestPinConversation(pinnedUserConversation('alice'));
      c.cancelUnpinConversation();
      await Promise.resolve();

      expect(unpinConversation).not.toHaveBeenCalled();
      expect(service.replaceConversation).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // handlePinConversationClick
  // -------------------------------------------------------------------------

  describe('handlePinConversationClick', () => {
    it('pins a user conversation by uid', async () => {
      await c.handlePinConversationClick(unpinnedUser);

      expect(pinConversation).toHaveBeenCalledWith('alice', CometChatUIKitConstants.MessageReceiverType.user);
    });

    it('pins a group conversation by guid', async () => {
      await c.handlePinConversationClick(unpinnedGroup);

      expect(pinConversation).toHaveBeenCalledWith('team', CometChatUIKitConstants.MessageReceiverType.group);
    });

    it('unpins a pinned user conversation by uid', async () => {
      await c.handlePinConversationClick(pinnedUserConversation('alice'));

      expect(unpinConversation).toHaveBeenCalledWith('alice', CometChatUIKitConstants.MessageReceiverType.user);
      expect(pinConversation).not.toHaveBeenCalled();
    });

    it('unpins a pinned group conversation by guid', async () => {
      await c.handlePinConversationClick(pinnedGroupConversation('team'));

      expect(unpinConversation).toHaveBeenCalledWith('team', CometChatUIKitConstants.MessageReceiverType.group);
    });

    it('swaps the SDK answer into the list', async () => {
      const updated = pinnedUserConversation('alice');
      pinConversation.mockResolvedValue(updated);

      await c.handlePinConversationClick(unpinnedUser);

      expect(service.replaceConversation).toHaveBeenCalledWith(updated);
    });

    it('publishes the pinned event with the updated conversation', async () => {
      const updated = pinnedUserConversation('alice');
      pinConversation.mockResolvedValue(updated);

      await c.handlePinConversationClick(unpinnedUser);

      expect(publishPinned).toHaveBeenCalledWith({ conversation: updated });
      expect(publishUnpinned).not.toHaveBeenCalled();
    });

    it('publishes the unpinned event with the updated conversation', async () => {
      const updated = userConversation('alice');
      unpinConversation.mockResolvedValue(updated);

      await c.handlePinConversationClick(pinnedUserConversation('alice'));

      expect(publishUnpinned).toHaveBeenCalledWith({ conversation: updated });
      expect(publishPinned).not.toHaveBeenCalled();
    });

    it('falls back to the original conversation when the SDK answers with nothing', async () => {
      pinConversation.mockResolvedValue(undefined);

      await c.handlePinConversationClick(unpinnedUser);

      expect(publishPinned).toHaveBeenCalledWith({ conversation: unpinnedUser });
    });

    it('does not swap the list when the SDK answers with nothing', async () => {
      pinConversation.mockResolvedValue(undefined);

      await c.handlePinConversationClick(unpinnedUser);

      expect(service.replaceConversation).not.toHaveBeenCalled();
    });

    it('announces the pinned toast after a successful pin', async () => {
      await c.handlePinConversationClick(unpinnedUser);

      expect(toast.info).toHaveBeenCalledWith(localized('conversation_pinned_toast'));
    });

    it('announces the unpinned toast after a successful unpin', async () => {
      await c.handlePinConversationClick(pinnedUserConversation('alice'));

      expect(toast.info).toHaveBeenCalledWith(localized('conversation_unpinned_toast'));
    });

    it('logs a rejection rather than letting it escape', async () => {
      loggerError.mockClear();

      const refusal = new Error('pin refused');
      pinConversation.mockRejectedValue(refusal);

      await expect(c.handlePinConversationClick(unpinnedUser)).resolves.toBeUndefined();
      expect(loggerError).toHaveBeenCalledWith(
        'CometChatConversations',
        'Failed to toggle conversation pin:',
        refusal
      );
    });

    it('reports a rejection to the user', async () => {
      pinConversation.mockRejectedValue(new Error('pin refused'));

      await c.handlePinConversationClick(unpinnedUser);
      await Promise.resolve();
      await Promise.resolve();

      expect(toast.error).toHaveBeenCalledWith(localized('pin_save_generic_error'));
    });

    it('neither swaps the list nor publishes when the call rejects', async () => {
      unpinConversation.mockRejectedValue(new Error('unpin refused'));

      await c.handlePinConversationClick(pinnedUserConversation('alice'));

      expect(service.replaceConversation).not.toHaveBeenCalled();
      expect(publishUnpinned).not.toHaveBeenCalled();
      expect(toast.info).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // reportConversationPinFailure
  // -------------------------------------------------------------------------

  describe('reportConversationPinFailure', () => {
    /** The private reporter, reached directly — it carries the branching. */
    function report(error: unknown = new Error('refused')): Promise<void> {
      return (c as unknown as { reportConversationPinFailure: (e: unknown) => Promise<void> })
        .reportConversationPinFailure(error);
    }

    /** Pre-seed the cached cap, as a previous failure would have done. */
    function seedLimit(value: number | null | undefined): void {
      (c as unknown as { pinnedConversationsLimit: number | null | undefined }).pinnedConversationsLimit = value;
    }

    it('uses an already-cached cap without consulting the SDK', async () => {
      const read = vi.fn().mockResolvedValue(9);
      sdk['getPinnedConversationsLimit'] = read;
      seedLimit(5);

      await report();

      expect(read).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(
        localized('conversation_pin_limit_error').replace('{limit}', '5')
      );
    });

    it('reads the cap from the SDK when nothing is cached', async () => {
      const read = vi.fn().mockResolvedValue(3);
      sdk['getPinnedConversationsLimit'] = read;

      await report();

      expect(read).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(
        localized('conversation_pin_limit_error').replace('{limit}', '3')
      );
    });

    it('reads the cap only once across repeated failures', async () => {
      const read = vi.fn().mockResolvedValue(3);
      sdk['getPinnedConversationsLimit'] = read;

      await report();
      await report();

      expect(read).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledTimes(2);
    });

    it('falls back to generic copy when the SDK reports no cap', async () => {
      sdk['getPinnedConversationsLimit'] = vi.fn().mockResolvedValue(null);

      await report();

      expect(toast.error).toHaveBeenCalledWith(localized('pin_save_generic_error'));
    });

    it('falls back to generic copy when the SDK has no cap reader', async () => {
      delete sdk['getPinnedConversationsLimit'];

      await report();

      expect(toast.error).toHaveBeenCalledWith(localized('pin_save_generic_error'));
    });

    it('falls back to generic copy when the cap reader throws', async () => {
      sdk['getPinnedConversationsLimit'] = vi.fn(() => {
        throw new Error('not initialised');
      });

      await report();

      expect(toast.error).toHaveBeenCalledWith(localized('pin_save_generic_error'));
    });

    it('falls back to generic copy when the cap reader rejects', async () => {
      sdk['getPinnedConversationsLimit'] = vi.fn().mockRejectedValue(new Error('offline'));

      await report();

      expect(toast.error).toHaveBeenCalledWith(localized('pin_save_generic_error'));
    });

    it('caches the absent cap so a second failure does not retry the read', async () => {
      const read = vi.fn().mockResolvedValue(null);
      sdk['getPinnedConversationsLimit'] = read;

      await report();
      await report();

      expect(read).toHaveBeenCalledTimes(1);
    });

    it('treats a zero cap as a readable number rather than an absent one', async () => {
      seedLimit(0);

      await report();

      expect(toast.error).toHaveBeenCalledWith(
        localized('conversation_pin_limit_error').replace('{limit}', '0')
      );
    });
  });
});
