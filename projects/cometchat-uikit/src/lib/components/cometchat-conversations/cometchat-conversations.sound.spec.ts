/**
 * CometChatConversations — Incoming-message sound and typing lookup
 *
 * The sound decision is deliberately exercised by calling the private methods
 * on the instance rather than by pushing conversations through the service.
 * A conversation that carries a last message makes the real conversation-item
 * component render it, which demands a fully formed SDK message; calling the
 * decision directly keeps the message stub down to the two accessors the logic
 * actually reads.
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
import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '../../services/global-config.service';
import { CometChatSoundManager } from '../../resources/CometChatSoundManager/CometChatSoundManager';
import { CometChatLogger } from '../../utils/CometChatLogger';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

/** A user instance whose prototype satisfies the `instanceof` id lookup. */
function user(uid: string): CometChat.User {
  const participant = Object.create(CometChat.User.prototype) as CometChat.User;
  Object.assign(participant, { uid, name: uid });
  (participant as unknown as Record<string, unknown>)['getUid'] = () => uid;
  (participant as unknown as Record<string, unknown>)['getName'] = () => uid;
  return participant;
}

/** A conversation whose participant is a user with the given uid. */
function userConversation(uid: string): CometChat.Conversation {
  return {
    getConversationId: () => `conv-${uid}`,
    getConversationWith: () => user(uid),
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

/**
 * The smallest message the sound decision reads: an id and a sender.
 *
 * Nothing renders these, so the stub stays at two accessors — growing it to
 * satisfy the item component is what made this region expensive to test
 * through the template.
 */
function message(id: number, senderUid?: string): CometChat.BaseMessage {
  return {
    getId: () => id,
    getSender: () => (senderUid === undefined ? undefined : user(senderUid)),
  } as unknown as CometChat.BaseMessage;
}

/** A conversation carrying a last message with the given id and sender. */
function withMessage(uid: string, messageId: number, senderUid = 'other'): CometChat.Conversation {
  const conv = userConversation(uid) as unknown as Record<string, unknown>;
  conv['getLastMessage'] = () => message(messageId, senderUid);
  return conv as unknown as CometChat.Conversation;
}

/**
 * A typing indicator with the sender the announcement effect reads.
 *
 * Change detection runs that effect, so an empty object throws there.
 */
function typingIndicator(uid: string): CometChat.TypingIndicator {
  return { getSender: () => user(uid) } as unknown as CometChat.TypingIndicator;
}

/** A group conversation carrying a last message. */
function groupWithMessage(guid: string, messageId: number, senderUid = 'other'): CometChat.Conversation {
  const conv = groupConversation(guid) as unknown as Record<string, unknown>;
  conv['getLastMessage'] = () => message(messageId, senderUid);
  return conv as unknown as CometChat.Conversation;
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

const play = CometChatSoundManager.play as unknown as ReturnType<typeof vi.fn>;

describe('CometChatConversationsComponent — sound and typing', () => {
  let fixture: ComponentFixture<CometChatConversationsComponent>;
  let c: CometChatConversationsComponent;
  let service: MockConversationsService;

  /** Conversations safe to render: none of them carries a last message. */
  const convs = [userConversation('alice'), userConversation('bob'), groupConversation('team')];

  /**
   * @param soundEnabled whether the component starts with sounds on. Left
   * undefined the @Input is not touched at all, which is what lets the global
   * config and the built-in default be reached. Set before the first change
   * detection, because flipping an @Input afterwards trips the
   * changed-after-checked guard.
   * @param globalConfig an app-wide config to provide. The token is optional,
   * so omitting it is the no-config case rather than a config of nothing.
   */
  async function build(
    items: CometChat.Conversation[] = convs,
    opts: { soundEnabled?: boolean; globalConfig?: Partial<GlobalConfig> } = {}
  ): Promise<void> {
    service = makeConversationsService(items);

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CometChatConversationsComponent],
      providers: [
        { provide: ConversationsService, useValue: service },
        { provide: ChatStateService, useValue: { setActiveConversation: vi.fn() } },
        { provide: LiveAnnouncerService, useValue: { announce: vi.fn() } },
        ...(opts.globalConfig ? [{ provide: COMETCHAT_GLOBAL_CONFIG, useValue: opts.globalConfig }] : []),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatConversationsComponent);
    c = fixture.componentInstance;
    // Assigning the input — even `false` — marks it explicitly set, and an
    // explicitly set input wins over the global config. A test that wants the
    // fallback has to leave the setter untouched.
    if (opts.soundEnabled !== undefined) c.disableSoundForMessages = !opts.soundEnabled;
    fixture.detectChanges();

    // The initial render already ran the conversations effect; start every
    // test from a clean throttle window and call count.
    (c as unknown as Record<string, unknown>)['lastSoundPlayedAt'] = 0;
    c.loggedInUser = null;
    play.mockReset();
  }

  beforeEach(async () => {
    // Resolving the logged-in user needs a live session; the sound decision
    // reads the field directly, so each test sets it itself.
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(undefined as never);
    await build();
  });

  afterEach(() => {
    // Static event Subjects are shared between tests — a surviving fixture
    // would keep handling events and skew the call counts here.
    fixture?.destroy();
    vi.restoreAllMocks();
  });

  /** Runs the sound decision the way the conversations effect does. */
  function decide(current: CometChat.Conversation[], previous: CometChat.Conversation[] = []): void {
    (c as unknown as { handleSoundNotification: (a: unknown, b: unknown) => void }).handleSoundNotification(
      current,
      previous
    );
  }

  const asAny = () => c as unknown as Record<string, (...args: never[]) => unknown>;

  /** The component's own throttle window, so the tests do not restate it. */
  const throttleInterval = () => (c as unknown as Record<string, number>)['SOUND_THROTTLE_INTERVAL'];

  // -------------------------------------------------------------------------
  // handleSoundNotification
  // -------------------------------------------------------------------------

  describe('handleSoundNotification', () => {
    it('plays for a new message from somebody else', () => {
      decide([withMessage('alice', 10)], [userConversation('alice')]);
      expect(play).toHaveBeenCalledTimes(1);
    });

    it('asks for the incoming-message sound', () => {
      decide([withMessage('alice', 10)]);
      expect(play).toHaveBeenCalledWith('incomingMessage', null);
    });

    it('stays silent when sounds are disabled', async () => {
      await build(convs, { soundEnabled: false });
      decide([withMessage('alice', 10)]);
      expect(play).not.toHaveBeenCalled();
    });

    it('stays silent for an empty list', () => {
      decide([]);
      expect(play).not.toHaveBeenCalled();
    });

    it('stays silent while throttled', () => {
      (c as unknown as Record<string, unknown>)['lastSoundPlayedAt'] = Date.now();
      decide([withMessage('alice', 10)]);
      expect(play).not.toHaveBeenCalled();
    });

    it('plays once the throttle window has passed', () => {
      // A sound genuinely played one full window ago. Leaving the zero the
      // reset puts there would make this pass even with the throttle removed.
      (c as unknown as Record<string, unknown>)['lastSoundPlayedAt'] = Date.now() - throttleInterval();
      decide([withMessage('alice', 10)]);
      expect(play).toHaveBeenCalledTimes(1);
    });

    it('throttles a second batch arriving immediately after the first', () => {
      decide([withMessage('alice', 10)]);
      decide([withMessage('alice', 11)], [withMessage('alice', 10)]);
      expect(play).toHaveBeenCalledTimes(1);
    });

    it('ignores a conversation with no last message', () => {
      decide([userConversation('alice')]);
      expect(play).not.toHaveBeenCalled();
    });

    it('ignores a message that was already the last one', () => {
      decide([withMessage('alice', 10)], [withMessage('alice', 10)]);
      expect(play).not.toHaveBeenCalled();
    });

    it('ignores the conversation the user is already reading', () => {
      const conv = withMessage('alice', 10);
      c.activeConversation = conv;

      decide([conv], [userConversation('alice')]);
      expect(play).not.toHaveBeenCalled();
    });

    it('ignores the active conversation reported by the service', () => {
      const conv = withMessage('alice', 10);
      service.activeConversation$.next(userConversation('alice'));
      fixture.detectChanges();

      decide([conv], [userConversation('alice')]);
      expect(play).not.toHaveBeenCalled();
    });

    it('ignores a message the user sent themselves', () => {
      c.loggedInUser = user('alice');
      decide([withMessage('bob', 10, 'alice')], [userConversation('bob')]);
      expect(play).not.toHaveBeenCalled();
    });

    it('plays for a group message from somebody else', () => {
      decide([groupWithMessage('team', 10)], [groupConversation('team')]);
      expect(play).toHaveBeenCalledTimes(1);
    });

    it('plays once when two conversations change at the same time', () => {
      decide(
        [withMessage('alice', 10), withMessage('bob', 20)],
        [userConversation('alice'), userConversation('bob')]
      );
      expect(play).toHaveBeenCalledTimes(1);
    });

    it('looks past an unchanged conversation to a changed one', () => {
      const unchanged = withMessage('alice', 10);
      decide([unchanged, withMessage('bob', 20)], [unchanged, userConversation('bob')]);
      expect(play).toHaveBeenCalledTimes(1);
    });

    it('looks past a pinned conversation sitting at the top with nothing new', () => {
      // Pinned chats sort first, so scanning only index 0 would mean no sound
      // ever played for a message arriving further down.
      decide([userConversation('pinned'), withMessage('bob', 20)], [userConversation('bob')]);
      expect(play).toHaveBeenCalledTimes(1);
    });

    it('stays silent when every candidate is excluded', () => {
      c.loggedInUser = user('me');
      decide(
        [userConversation('alice'), withMessage('bob', 20), withMessage('carol', 30, 'me')],
        [withMessage('bob', 20)]
      );
      expect(play).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // isNewMessage
  // -------------------------------------------------------------------------

  describe('isNewMessage', () => {
    const isNew = (conv: CometChat.Conversation, previous: CometChat.Conversation[]) =>
      asAny()['isNewMessage'](conv as never, previous as never);

    it('is false for a conversation with no last message', () => {
      expect(isNew(userConversation('alice'), [])).toBe(false);
    });

    it('is true when the conversation is not in the previous list', () => {
      expect(isNew(withMessage('alice', 10), [userConversation('bob')])).toBe(true);
    });

    it('is true when the previous entry had no last message', () => {
      expect(isNew(withMessage('alice', 10), [userConversation('alice')])).toBe(true);
    });

    it('is true when the previous entry had a different message', () => {
      expect(isNew(withMessage('alice', 11), [withMessage('alice', 10)])).toBe(true);
    });

    it('is false when the previous entry had the same message', () => {
      expect(isNew(withMessage('alice', 10), [withMessage('alice', 10)])).toBe(false);
    });

    it('matches the previous entry by participant, not list position', () => {
      const previous = [withMessage('bob', 99), withMessage('alice', 10)];
      expect(isNew(withMessage('alice', 10), previous)).toBe(false);
    });

    it('is true for a group whose last message changed', () => {
      expect(isNew(groupWithMessage('team', 11), [groupWithMessage('team', 10)])).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // isMessageFromLoggedInUser
  // -------------------------------------------------------------------------

  describe('isMessageFromLoggedInUser', () => {
    const isMine = (msg: CometChat.BaseMessage) => asAny()['isMessageFromLoggedInUser'](msg as never);

    it('is false when no user is logged in', () => {
      c.loggedInUser = null;
      expect(isMine(message(1, 'alice'))).toBe(false);
    });

    it('is false for a message with no sender', () => {
      c.loggedInUser = user('alice');
      expect(isMine(message(1))).toBe(false);
    });

    it('is true when the sender is the logged-in user', () => {
      c.loggedInUser = user('alice');
      expect(isMine(message(1, 'alice'))).toBe(true);
    });

    it('is false for a message from anybody else', () => {
      c.loggedInUser = user('alice');
      expect(isMine(message(1, 'bob'))).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // shouldPlaySound
  // -------------------------------------------------------------------------

  describe('shouldPlaySound', () => {
    const should = () => asAny()['shouldPlaySound']();

    it('allows a sound when none has played yet', () => {
      (c as unknown as Record<string, unknown>)['lastSoundPlayedAt'] = 0;
      expect(should()).toBe(true);
    });

    it('refuses a sound right after one played', () => {
      (c as unknown as Record<string, unknown>)['lastSoundPlayedAt'] = Date.now();
      expect(should()).toBe(false);
    });

    it('allows a sound again once the window has elapsed', () => {
      // Exactly one window ago: the comparison is inclusive.
      (c as unknown as Record<string, unknown>)['lastSoundPlayedAt'] = Date.now() - throttleInterval();
      expect(should()).toBe(true);
    });

    it('refuses a sound one millisecond short of the window', () => {
      (c as unknown as Record<string, unknown>)['lastSoundPlayedAt'] = Date.now() - throttleInterval() + 50;
      expect(should()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // playMessageSound
  // -------------------------------------------------------------------------

  describe('playMessageSound', () => {
    const playSound = () => asAny()['playMessageSound']();

    it('passes a configured custom sound through', () => {
      c.customSoundForMessages = 'https://example.test/ping.wav';
      playSound();

      expect(play).toHaveBeenCalledWith('incomingMessage', 'https://example.test/ping.wav');
    });

    it('passes null when no custom sound is configured', () => {
      c.customSoundForMessages = '';
      playSound();

      expect(play).toHaveBeenCalledWith('incomingMessage', null);
    });

    it('advances the throttle timestamp', () => {
      (c as unknown as Record<string, unknown>)['lastSoundPlayedAt'] = 0;
      const before = Date.now();
      playSound();

      const at = (c as unknown as Record<string, number>)['lastSoundPlayedAt'];
      expect(at).toBeGreaterThanOrEqual(before);
      expect(at).toBeLessThanOrEqual(Date.now());
    });

    it('logs a playback failure instead of letting it escape', () => {
      const logged = vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      play.mockImplementationOnce(() => {
        throw new Error('no audio device');
      });

      expect(() => playSound()).not.toThrow();
      expect(logged).toHaveBeenCalled();
    });

    it('still advances the throttle when playback fails', () => {
      vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      (c as unknown as Record<string, unknown>)['lastSoundPlayedAt'] = 0;
      play.mockImplementationOnce(() => {
        throw new Error('no audio device');
      });

      const before = Date.now();
      playSound();

      // The timestamp is written before play() is reached, so a throwing
      // player must not leave the throttle open for an unbounded retry.
      const at = (c as unknown as Record<string, number>)['lastSoundPlayedAt'];
      expect(at).toBeGreaterThanOrEqual(before);
      expect(at).toBeLessThanOrEqual(Date.now());
    });

    it('keeps the sound decision alive when playback throws', () => {
      vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);
      play.mockImplementationOnce(() => {
        throw new Error('no audio device');
      });

      expect(() => decide([withMessage('alice', 10)])).not.toThrow();
      expect(play).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Global config
  //
  // Both sound settings fall back to the app-wide config when the matching
  // @Input was never assigned, so the decision has three possible sources.
  // -------------------------------------------------------------------------

  describe('app-wide sound config', () => {
    it('stays silent when the global config disables message sounds', async () => {
      await build(convs, { globalConfig: { disableSoundForMessages: true } });

      decide([withMessage('alice', 10)]);
      expect(play).not.toHaveBeenCalled();
    });

    it('plays when the global config leaves message sounds on', async () => {
      await build(convs, { globalConfig: { disableSoundForMessages: false } });

      decide([withMessage('alice', 10)]);
      expect(play).toHaveBeenCalledTimes(1);
    });

    it('lets the input turn sounds on over a global config that disables them', async () => {
      await build(convs, { soundEnabled: true, globalConfig: { disableSoundForMessages: true } });

      decide([withMessage('alice', 10)]);
      expect(play).toHaveBeenCalledTimes(1);
    });

    it('lets the input turn sounds off over a global config that leaves them on', async () => {
      await build(convs, { soundEnabled: false, globalConfig: { disableSoundForMessages: false } });

      decide([withMessage('alice', 10)]);
      expect(play).not.toHaveBeenCalled();
    });

    it('keeps sounds on for a global config that says nothing about them', async () => {
      await build(convs, { globalConfig: { customSoundForMessages: 'https://example.test/app.wav' } });

      decide([withMessage('alice', 10)]);
      expect(play).toHaveBeenCalledTimes(1);
    });

    it('plays the custom sound named by the global config', async () => {
      await build(convs, { globalConfig: { customSoundForMessages: 'https://example.test/app.wav' } });

      decide([withMessage('alice', 10)]);
      expect(play).toHaveBeenCalledWith('incomingMessage', 'https://example.test/app.wav');
    });

    it('lets the input custom sound override the global config one', async () => {
      await build(convs, { globalConfig: { customSoundForMessages: 'https://example.test/app.wav' } });
      c.customSoundForMessages = 'https://example.test/input.wav';

      decide([withMessage('alice', 10)]);
      expect(play).toHaveBeenCalledWith('incomingMessage', 'https://example.test/input.wav');
    });
  });

  // -------------------------------------------------------------------------
  // getTypingIndicator
  // -------------------------------------------------------------------------

  describe('getTypingIndicator', () => {
    it('returns null when there are no indicators at all', () => {
      service.typingIndicators$.next(null as unknown as Map<string, CometChat.TypingIndicator>);
      fixture.detectChanges();

      expect(c.getTypingIndicator(convs[0])).toBeNull();
    });

    it('returns the indicator for a user conversation', () => {
      const indicator = typingIndicator('alice');
      service.typingIndicators$.next(new Map([['alice', indicator]]));
      fixture.detectChanges();

      expect(c.getTypingIndicator(convs[0])).toBe(indicator);
    });

    it('returns the indicator for a group conversation', () => {
      const indicator = typingIndicator('team');
      service.typingIndicators$.next(new Map([['team', indicator]]));
      fixture.detectChanges();

      expect(c.getTypingIndicator(convs[2])).toBe(indicator);
    });

    it('returns null for a conversation nobody is typing in', () => {
      const indicator = typingIndicator('alice');
      service.typingIndicators$.next(new Map([['alice', indicator]]));
      fixture.detectChanges();

      expect(c.getTypingIndicator(convs[1])).toBeNull();
    });
  });
});
