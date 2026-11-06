/**
 * CometChatConversations — event subscription tests
 *
 * Covers the three pieces that only run in response to an application-wide
 * event: the conversation-id resolver, the read/unread-count subscriptions and
 * the pin swap. Each of these is wired in `ngOnInit`, so building the fixture is
 * enough to make them live, and a test drives them by pushing through the static
 * event Subjects.
 *
 * The resolver itself is also called directly. Its branches turn on
 * `instanceof CometChat.User` / `CometChat.Group`, which no amount of rendering
 * reveals, and driving it through the template would need a fully formed SDK
 * message on every conversation.
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
// initialised SDK. Only the audio playback is stubbed out.
vi.mock('../../resources/CometChatSoundManager/CometChatSoundManager', () => ({
  CometChatSoundManager: { play: vi.fn(), pause: vi.fn() },
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MockInstance } from 'vitest';
import { signal, WritableSignal } from '@angular/core';
import type { Provider } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatConversationsComponent } from './cometchat-conversations.component';
import { ConversationsService } from '../../services/conversations.service';
import { ChatStateService } from '../../services/chat-state.service';
import { PinSaveService } from '../../services/pin-save.service';
import { LiveAnnouncerService } from '../../services/live-announcer.service';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';
import { CometChatConversationEvents } from '../../events/CometChatConversationEvents';
import { CometChatPinSaveEvents } from '../../events/CometChatPinSaveEvents';
import { CometChatUIKit } from '../../cometchat-uikit';
import { CometChatLogger } from '../../utils/CometChatLogger';

// jsdom has no scrollIntoView, and the list reaches for it while rendering.
if (!(Element.prototype as unknown as Record<string, unknown>)['scrollIntoView']) {
  (Element.prototype as unknown as Record<string, unknown>)['scrollIntoView'] = () => undefined;
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

/**
 * A real `CometChat.User` instance with just the accessors under test.
 * `Object.create` keeps the prototype — the resolver tests `instanceof`, so a
 * plain object would take a different branch.
 */
function userParticipant(uid: string): CometChat.User {
  const u = Object.create(CometChat.User.prototype) as CometChat.User;
  Object.assign(u, { uid, name: uid });
  (u as unknown as Record<string, unknown>)['getUid'] = () => uid;
  (u as unknown as Record<string, unknown>)['getName'] = () => uid;
  return u;
}

/** A real `CometChat.Group` instance. See {@link userParticipant}. */
function groupParticipant(guid: string): CometChat.Group {
  const g = Object.create(CometChat.Group.prototype) as CometChat.Group;
  (g as unknown as Record<string, unknown>)['getGuid'] = () => guid;
  (g as unknown as Record<string, unknown>)['getName'] = () => guid;
  return g;
}

/**
 * A conversation whose participant is a user with the given uid. `getLastMessage`
 * stays undefined so the row renders without a fully formed SDK message.
 */
function userConversation(uid: string): CometChat.Conversation {
  return {
    getConversationId: () => `conv-${uid}`,
    getConversationWith: () => userParticipant(uid),
    getConversationType: () => 'user',
    getUnreadMessageCount: () => 0,
    getLastMessage: () => undefined,
  } as unknown as CometChat.Conversation;
}

/** The smallest message the id resolver and the read handler look at. */
function message(receiver: unknown, sender: unknown): CometChat.BaseMessage {
  return {
    getId: () => 42,
    getReceiver: () => receiver,
    getSender: () => sender,
  } as unknown as CometChat.BaseMessage;
}

/** A conversation as the ccUpdateConversation handler reads it. */
function updatedConversation(participant: unknown, unread: number | undefined): CometChat.Conversation {
  return {
    getConversationId: () => 'conv-updated',
    getConversationWith: () => participant,
    getConversationType: () => 'user',
    getUnreadMessageCount: () => unread,
    getLastMessage: () => undefined,
  } as unknown as CometChat.Conversation;
}

/** A conversation the pin handler is expected to hand straight to the service. */
function pinnedConversation(uid: string): CometChat.Conversation {
  const conv = userConversation(uid) as unknown as Record<string, unknown>;
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

const READ_FAILED = 'Error handling message read event:';
const UPDATE_FAILED = 'Error handling ccUpdateConversation event:';
const INIT_FAILED = 'Error in ngOnInit:';

interface BuildOptions {
  items?: CometChat.Conversation[];
  /** Applied before the component exists, so `ngOnInit` sees it. */
  configureService?: (svc: MockConversationsService) => void;
  providers?: Provider[];
  /**
   * Runs after construction but before `ngOnInit`. Outputs raised during
   * initialisation are gone by the time a test could subscribe otherwise.
   */
  afterCreate?: (component: CometChatConversationsComponent) => void;
}

describe('CometChatConversationsComponent — event subscriptions', () => {
  let fixture: ComponentFixture<CometChatConversationsComponent>;
  let c: CometChatConversationsComponent;
  let service: MockConversationsService;
  let logError: MockInstance;
  let loggedInUser: MockInstance;

  async function build(options: BuildOptions = {}): Promise<void> {
    // A live fixture from an earlier build would keep its own subscription on
    // these static Subjects and answer events meant for the new one.
    fixture?.destroy();

    service = makeConversationsService(options.items ?? [userConversation('alice')]);
    options.configureService?.(service);

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CometChatConversationsComponent],
      providers: [
        { provide: ConversationsService, useValue: service },
        { provide: ChatStateService, useValue: { setActiveConversation: vi.fn() } },
        { provide: LiveAnnouncerService, useValue: { announce: vi.fn() } },
        ...(options.providers ?? []),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatConversationsComponent);
    c = fixture.componentInstance;
    // The conversations effect plays a notification sound, which reaches into
    // CometChatUIKit and needs an initialised SDK.
    c.disableSoundForMessages = true;
    options.afterCreate?.(c);
    fixture.detectChanges();
  }

  /** Makes the resolver treat `uid` as the logged-in user. */
  function loginAs(uid: string): void {
    loggedInUser.mockReturnValue(userParticipant(uid));
  }

  /** Reaches the private resolver — its branches have no public surface. */
  function idOf(msg: CometChat.BaseMessage): string {
    return (c as unknown as { conversationIdOf(m: CometChat.BaseMessage): string }).conversationIdOf(msg);
  }

  beforeEach(async () => {
    logError = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
    // Signed out unless a test says otherwise, so the self-sent branch is opt-in.
    loggedInUser = vi.spyOn(CometChatUIKit, 'getLoggedInUser').mockReturnValue(null);
    await build();
  });

  afterEach(() => {
    fixture?.destroy();
    fixture = undefined as unknown as ComponentFixture<CometChatConversationsComponent>;
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // conversationIdOf
  // -------------------------------------------------------------------------

  describe('conversationIdOf', () => {
    it('uses the guid when the receiver is a group', () => {
      expect(idOf(message(groupParticipant('team'), userParticipant('alice')))).toBe('team');
    });

    it('prefers the group receiver over the sender, even for a message this user sent', () => {
      loginAs('me');
      expect(idOf(message(groupParticipant('team'), userParticipant('me')))).toBe('team');
    });

    it('uses the receiver uid for a message this user sent to a user', () => {
      loginAs('me');
      expect(idOf(message(userParticipant('bob'), userParticipant('me')))).toBe('bob');
    });

    it('falls back to a plain receiver uid for a self-sent message', () => {
      loginAs('me');
      expect(idOf(message({ uid: 'bob' }, userParticipant('me')))).toBe('bob');
    });

    it('falls back to a plain receiver guid for a self-sent message', () => {
      loginAs('me');
      expect(idOf(message({ guid: 'team' }, userParticipant('me')))).toBe('team');
    });

    it('returns an empty id when a self-sent receiver carries neither uid nor guid', () => {
      loginAs('me');
      expect(idOf(message({}, userParticipant('me')))).toBe('');
    });

    it('returns an empty id when a self-sent message has no receiver at all', () => {
      loginAs('me');
      expect(idOf(message(undefined, userParticipant('me')))).toBe('');
    });

    it('uses the sender uid for a message from somebody else', () => {
      loginAs('me');
      expect(idOf(message(userParticipant('me'), userParticipant('alice')))).toBe('alice');
    });

    it('ignores the self-sent branch when the logged-in user is unknown', () => {
      // Signed out, so a message this user sent still resolves by its sender.
      loggedInUser.mockReturnValue(undefined as unknown as CometChat.User);
      expect(idOf(message(userParticipant('bob'), userParticipant('me')))).toBe('me');
    });

    it('returns an empty id when the message has no sender', () => {
      expect(idOf(message(undefined, undefined))).toBe('');
    });

    it('returns an empty id when a logged-in user has a message with no sender', () => {
      loginAs('me');
      expect(idOf(message({ uid: 'bob' }, undefined))).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // ccMessageRead
  // -------------------------------------------------------------------------

  describe('ccMessageRead', () => {
    it('marks the group conversation read by its guid', () => {
      const msg = message(groupParticipant('team'), userParticipant('alice'));
      CometChatMessageEvents.ccMessageRead.next(msg);

      expect(service.updateConversationReadStatus).toHaveBeenCalledTimes(1);
      expect(service.updateConversationReadStatus).toHaveBeenCalledWith('team', msg);
    });

    it('marks a one-to-one conversation read by the other party for a message this user sent', () => {
      loginAs('me');
      const msg = message(userParticipant('bob'), userParticipant('me'));
      CometChatMessageEvents.ccMessageRead.next(msg);

      expect(service.updateConversationReadStatus).toHaveBeenCalledWith('bob', msg);
    });

    it('marks a one-to-one conversation read by its sender for a received message', () => {
      loginAs('me');
      const msg = message(userParticipant('me'), userParticipant('alice'));
      CometChatMessageEvents.ccMessageRead.next(msg);

      expect(service.updateConversationReadStatus).toHaveBeenCalledWith('alice', msg);
    });

    it('skips the service when no id can be resolved', () => {
      CometChatMessageEvents.ccMessageRead.next(message(undefined, undefined));

      expect(service.updateConversationReadStatus).not.toHaveBeenCalled();
    });

    it('skips the service when a self-sent receiver yields an empty id', () => {
      loginAs('me');
      CometChatMessageEvents.ccMessageRead.next(message({}, userParticipant('me')));

      expect(service.updateConversationReadStatus).not.toHaveBeenCalled();
    });

    it('logs instead of throwing when the message cannot be read', () => {
      const broken = {
        getId: () => 42,
        getReceiver: () => {
          throw new Error('receiver unavailable');
        },
        getSender: () => userParticipant('alice'),
      } as unknown as CometChat.BaseMessage;

      expect(() => CometChatMessageEvents.ccMessageRead.next(broken)).not.toThrow();
      expect(logError).toHaveBeenCalledWith('CometChatConversations', READ_FAILED, expect.any(Error));
      expect(service.updateConversationReadStatus).not.toHaveBeenCalled();
    });

    it('handles every read event, not just the first', () => {
      CometChatMessageEvents.ccMessageRead.next(message(groupParticipant('team'), userParticipant('alice')));
      CometChatMessageEvents.ccMessageRead.next(message(groupParticipant('support'), userParticipant('alice')));

      expect(service.updateConversationReadStatus).toHaveBeenCalledTimes(2);
      expect(service.updateConversationReadStatus.mock.calls[1][0]).toBe('support');
    });

    it('stops answering read events once the component is destroyed', () => {
      fixture.destroy();
      CometChatMessageEvents.ccMessageRead.next(message(groupParticipant('team'), userParticipant('alice')));

      expect(service.updateConversationReadStatus).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // ccUpdateConversation
  // -------------------------------------------------------------------------

  describe('ccUpdateConversation', () => {
    it('updates the unread count of a user conversation by uid', () => {
      CometChatConversationEvents.ccUpdateConversation.next(updatedConversation(userParticipant('bob'), 3));

      expect(service.updateConversationUnreadCount).toHaveBeenCalledTimes(1);
      expect(service.updateConversationUnreadCount).toHaveBeenCalledWith('bob', 3);
    });

    it('updates the unread count of a group conversation by guid', () => {
      CometChatConversationEvents.ccUpdateConversation.next(updatedConversation(groupParticipant('team'), 7));

      expect(service.updateConversationUnreadCount).toHaveBeenCalledWith('team', 7);
    });

    it('treats a missing unread count as zero', () => {
      CometChatConversationEvents.ccUpdateConversation.next(updatedConversation(userParticipant('bob'), undefined));

      expect(service.updateConversationUnreadCount).toHaveBeenCalledWith('bob', 0);
    });

    it('keeps a zero count rather than discarding it', () => {
      CometChatConversationEvents.ccUpdateConversation.next(updatedConversation(userParticipant('bob'), 0));

      expect(service.updateConversationUnreadCount).toHaveBeenCalledWith('bob', 0);
    });

    it('logs instead of throwing when the conversation participant cannot be read', () => {
      const broken = {
        getConversationId: () => 'conv-broken',
        getConversationWith: () => {
          throw new Error('participant unavailable');
        },
        getUnreadMessageCount: () => 1,
        getLastMessage: () => undefined,
      } as unknown as CometChat.Conversation;

      expect(() => CometChatConversationEvents.ccUpdateConversation.next(broken)).not.toThrow();
      expect(logError).toHaveBeenCalledWith('CometChatConversations', UPDATE_FAILED, expect.any(Error));
      expect(service.updateConversationUnreadCount).not.toHaveBeenCalled();
    });

    it('logs instead of throwing when the participant is neither a user nor a group', () => {
      // A plain object has no getGuid, so the group fallback throws.
      expect(() =>
        CometChatConversationEvents.ccUpdateConversation.next(updatedConversation({ uid: 'bob' }, 1))
      ).not.toThrow();
      expect(logError).toHaveBeenCalledWith('CometChatConversations', UPDATE_FAILED, expect.any(TypeError));
      expect(service.updateConversationUnreadCount).not.toHaveBeenCalled();
    });

    it('stops answering conversation updates once the component is destroyed', () => {
      fixture.destroy();
      CometChatConversationEvents.ccUpdateConversation.next(updatedConversation(userParticipant('bob'), 3));

      expect(service.updateConversationUnreadCount).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Conversation pin events
  // -------------------------------------------------------------------------

  describe('conversation pin events', () => {
    it('swaps in the conversation a pin confirmation carries', () => {
      const conversation = pinnedConversation('bob');
      CometChatPinSaveEvents.publishConversationPinned({ conversation });

      expect(service.replaceConversation).toHaveBeenCalledTimes(1);
      expect(service.replaceConversation).toHaveBeenCalledWith(conversation);
    });

    it('swaps in the conversation an unpin confirmation carries', () => {
      const conversation = pinnedConversation('bob');
      CometChatPinSaveEvents.publishConversationUnpinned({ conversation });

      expect(service.replaceConversation).toHaveBeenCalledTimes(1);
      expect(service.replaceConversation).toHaveBeenCalledWith(conversation);
    });

    it('swaps in a conversation this client optimistically pinned', () => {
      const conversation = pinnedConversation('bob');
      CometChatPinSaveEvents.publishConversationPinChanged({ conversation, pinned: true });

      // Both channels run the same handler, so a change that leaked into the
      // unpin view as well would swap the row in twice.
      expect(service.replaceConversation).toHaveBeenCalledTimes(1);
      expect(service.replaceConversation).toHaveBeenCalledWith(conversation);
    });

    it('swaps in a conversation this client optimistically unpinned', () => {
      const conversation = pinnedConversation('bob');
      CometChatPinSaveEvents.publishConversationPinChanged({ conversation, pinned: false });

      expect(service.replaceConversation).toHaveBeenCalledTimes(1);
      expect(service.replaceConversation).toHaveBeenCalledWith(conversation);
    });

    it('marks the view for check so the row repaints with its new pin state', () => {
      const markForCheck = vi.spyOn(
        (c as unknown as { cdr: { markForCheck(): void } }).cdr,
        'markForCheck'
      );
      CometChatPinSaveEvents.publishConversationPinned({ conversation: pinnedConversation('bob') });

      expect(markForCheck).toHaveBeenCalledTimes(1);
    });

    it('ignores a pin event with no conversation', () => {
      CometChatPinSaveEvents.publishConversationPinned({ conversation: null as unknown as CometChat.Conversation });

      expect(service.replaceConversation).not.toHaveBeenCalled();
    });

    it('ignores an unpin event with no conversation', () => {
      CometChatPinSaveEvents.publishConversationUnpinned({ conversation: null as unknown as CometChat.Conversation });

      expect(service.replaceConversation).not.toHaveBeenCalled();
    });

    it('swaps once per event across both channels', () => {
      const pinned = pinnedConversation('bob');
      const unpinned = pinnedConversation('alice');
      CometChatPinSaveEvents.publishConversationPinned({ conversation: pinned });
      CometChatPinSaveEvents.publishConversationUnpinned({ conversation: unpinned });

      expect(service.replaceConversation).toHaveBeenCalledTimes(2);
      expect(service.replaceConversation.mock.calls[0][0]).toBe(pinned);
      expect(service.replaceConversation.mock.calls[1][0]).toBe(unpinned);
    });

    it('stops answering pin events once the component is destroyed', () => {
      fixture.destroy();
      CometChatPinSaveEvents.publishConversationPinned({ conversation: pinnedConversation('bob') });
      CometChatPinSaveEvents.publishConversationUnpinned({ conversation: pinnedConversation('bob') });

      expect(service.replaceConversation).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // The ngOnInit wiring that puts the subscriptions in place
  // -------------------------------------------------------------------------

  describe('ngOnInit wiring', () => {
    /** Collects whatever the error output raises while ngOnInit runs. */
    async function buildFailing(thrown: unknown): Promise<unknown[]> {
      const emitted: unknown[] = [];
      await build({
        configureService: svc =>
          svc.fetchConversations.mockImplementation(() => {
            throw thrown;
          }),
        afterCreate: component => {
          component.error.subscribe(e => emitted.push(e));
        },
      });
      return emitted;
    }

    it('reports a failed start-up instead of throwing out of ngOnInit', async () => {
      const emitted = await buildFailing(new Error('service unavailable'));

      expect(logError).toHaveBeenCalledWith('CometChatConversations', INIT_FAILED, expect.any(Error));
      expect(emitted).toHaveLength(1);
      expect((emitted[0] as Error).message).toBe('service unavailable');
    });

    it('wraps a non-Error failure so a subscriber always receives an Error', async () => {
      const emitted = await buildFailing('service unavailable');

      expect(emitted[0]).toBeInstanceOf(Error);
      expect((emitted[0] as Error).message).toBe('service unavailable');
    });
  });

  // -------------------------------------------------------------------------
  // The app-level conversation-pin flag ngOnInit resolves
  // -------------------------------------------------------------------------

  describe('conversation pin availability', () => {
    const sdk = CometChat as unknown as Record<string, unknown>;
    let originalPin: unknown;
    let originalUnpin: unknown;

    /** The option is hidden outright unless the SDK exposes both calls. */
    beforeEach(() => {
      originalPin = sdk['pinConversation'];
      originalUnpin = sdk['unpinConversation'];
      sdk['pinConversation'] = () => Promise.resolve(undefined);
      sdk['unpinConversation'] = () => Promise.resolve(undefined);
    });

    afterEach(() => {
      sdk['pinConversation'] = originalPin;
      sdk['unpinConversation'] = originalUnpin;
    });

    async function buildWithPinFlag(answer: Promise<boolean>): Promise<void> {
      await build({
        providers: [{ provide: PinSaveService, useValue: { isPinConversationEnabled: () => answer } }],
      });
      // Two turns: one for the promise, one for the `then` that sets the flag.
      await Promise.resolve();
      await Promise.resolve();
    }

    function offersPin(): boolean {
      return c.getContextMenuOptions(userConversation('bob')).some(o => o.id === 'pinConversation');
    }

    it('offers the pin option once the app-level flag resolves', async () => {
      await buildWithPinFlag(Promise.resolve(true));

      expect(offersPin()).toBe(true);
    });

    it('withholds the pin option while the flag is still outstanding', async () => {
      // An option that rejects on click is worse than one that arrives late.
      await buildWithPinFlag(new Promise<boolean>(() => undefined));

      expect(offersPin()).toBe(false);
    });

    it('withholds the pin option when the app plan excludes it', async () => {
      await buildWithPinFlag(Promise.resolve(false));

      expect(offersPin()).toBe(false);
    });

    it('withholds the pin option when the flag cannot be resolved', async () => {
      await buildWithPinFlag(Promise.reject(new Error('plan lookup failed')));

      expect(offersPin()).toBe(false);
    });

    it('still offers delete, so a withheld pin does not take the menu with it', async () => {
      await buildWithPinFlag(Promise.resolve(false));

      expect(c.getContextMenuOptions(userConversation('bob')).map(o => o.id)).toEqual(['delete']);
    });
  });
});
