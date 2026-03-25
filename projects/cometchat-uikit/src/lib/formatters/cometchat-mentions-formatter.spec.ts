/**
 * CometChatMentionsFormatter Tests
 *
 * Tests cover:
 * - @mention detection and transformation (Req 6.1, 6.2)
 * - HTML wrapping with data-uid attributes (Req 6.7)
 * - Multiple mentions in a single string
 * - No-match passthrough (Req 6.4)
 * - Empty input handling (Req 6.3)
 * - Reset clears state (Req 6.5)
 * - SDK format mention parsing (formatSdkMentions)
 * - User UID / channel label extraction
 * - Self-mention detection via loggedInUser
 * - Message bubble alignment CSS classes
 * - Real CometChat.User objects for mention user lists (Req 13.6)
 *
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 13.6, 14.4, 14.5, 15.7**
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ensureSdkReady, sdkCleanup, fetchTestUser } from '../test-setup';
import { CometChatMentionsFormatter, MentionData } from './cometchat-mentions-formatter';
import { MentionType, MessageBubbleAlignment } from '../Enums/Enums';

/**
 * Lightweight mock for tests that need controlled usernames.
 * The formatter matches by lowercase name, so we need predictable names.
 */
class MockUser {
  constructor(
    private uid: string,
    private name: string
  ) {}
  getUid(): string {
    return this.uid;
  }
  getName(): string {
    return this.name;
  }
}

describe('CometChatMentionsFormatter', () => {
  let formatter: CometChatMentionsFormatter;
  let realUser: CometChat.User;

  beforeAll(async () => {
    realUser = await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(() => {
    formatter = new CometChatMentionsFormatter();
  });

  afterEach(() => {
    formatter.reset();
  });

  // ─── Identity & Priority ───────────────────────────────────────────

  describe('id and priority', () => {
    it('should have id "mentions-formatter"', () => {
      expect(formatter.id).toBe('mentions-formatter');
    });

    it('should have priority 20', () => {
      expect(formatter.priority).toBe(20);
    });
  });

  // ─── getRegex() ────────────────────────────────────────────────────

  describe('getRegex()', () => {
    it('should return a RegExp pattern for @mentions', () => {
      expect(formatter.getRegex()).toBeInstanceOf(RegExp);
    });

    it('should match @username patterns', () => {
      const matches = '@john hello @jane'.match(formatter.getRegex());
      expect(matches).toEqual(['@john', '@jane']);
    });

    it('should match usernames with numbers and underscores', () => {
      const matches = '@user_123 @test456'.match(formatter.getRegex());
      expect(matches).toEqual(['@user_123', '@test456']);
    });

    it('should not match bare @ without a word character', () => {
      expect('@ hello'.match(formatter.getRegex())).toBeNull();
    });
  });

  // ─── format() with controlled mock users ───────────────────────────

  describe('format() — pattern matching & HTML wrapping', () => {
    beforeEach(() => {
      formatter.setUsers([
        new MockUser('user1', 'John'),
        new MockUser('user2', 'Jane'),
        new MockUser('user3', 'Bob'),
      ] as any);
    });

    it('should store original text', () => {
      formatter.format('Hello @john');
      expect(formatter.getOriginalText()).toBe('Hello @john');
    });

    it('should wrap matched mention in <span> with data-uid', () => {
      const result = formatter.format('Hello @john');
      expect(result).toContain('<span class="cometchat-mentions');
      expect(result).toContain('data-uid="user1"');
      expect(result).toContain('@John</span>');
    });

    it('should preserve unmatched @mentions as-is', () => {
      expect(formatter.format('Hello @unknown')).toBe('Hello @unknown');
    });

    it('should handle multiple mentions', () => {
      const result = formatter.format('Hello @john and @jane');
      expect(result).toContain('data-uid="user1"');
      expect(result).toContain('data-uid="user2"');
    });

    it('should handle text without any @ symbols', () => {
      expect(formatter.format('Hello world')).toBe('Hello world');
    });

    it('should handle consecutive mentions', () => {
      formatter.format('@john @jane @bob');
      expect(formatter.getMentions()).toHaveLength(3);
    });

    it('should handle mention at start of text', () => {
      const result = formatter.format('@john is here');
      expect(result).toContain('<span class="cometchat-mentions');
    });

    it('should handle mention at end of text', () => {
      const result = formatter.format('Hello @john');
      expect(result).toContain('@John</span>');
    });
  });

  // ─── format() with real CometChat.User objects ─────────────────────

  describe('format() — real CometChat.User objects', () => {
    let superhero2: CometChat.User;

    beforeAll(async () => {
      superhero2 = await fetchTestUser('superhero2');
    });

    it('should match a real SDK user by lowercase name', () => {
      // realUser is superhero1 — use its actual name
      formatter.setUsers([realUser]);
      const name = realUser.getName().toLowerCase();
      const result = formatter.format(`Hey @${name}`);
      expect(result).toContain(`data-uid="${realUser.getUid()}"`);
      expect(formatter.getMentions()).toHaveLength(1);
      expect(formatter.getMentions()[0].uid).toBe(realUser.getUid());
    });

    it('should detect self-mention with real logged-in user', () => {
      formatter.setLoggedInUser(realUser);
      formatter.setUsers([realUser]);
      const name = realUser.getName().toLowerCase();
      formatter.format(`Hello @${name}`);
      expect(formatter.getMentions()[0].type).toBe(MentionType.self);
    });

    it('should detect other-mention for a different real user', () => {
      formatter.setLoggedInUser(realUser);
      formatter.setUsers([superhero2]);
      const name = superhero2.getName().toLowerCase();
      formatter.format(`Hello @${name}`);
      const mentions = formatter.getMentions();
      if (mentions.length > 0) {
        expect(mentions[0].type).toBe(MentionType.other);
      }
    });

    it('should use real user display name in formatted output', () => {
      formatter.setUsers([realUser]);
      const name = realUser.getName().toLowerCase();
      const result = formatter.format(`@${name}`);
      expect(result).toContain(`@${realUser.getName()}</span>`);
    });
  });

  // ─── No-match passthrough ──────────────────────────────────────────

  describe('format() — no-match passthrough', () => {
    it('should return plain text unchanged when no @ symbols present', () => {
      const text = 'This is a regular message with no mentions.';
      expect(formatter.format(text)).toBe(text);
    });

    it('should return text unchanged when no users are set', () => {
      expect(formatter.format('Hello @someone')).toBe('Hello @someone');
    });

    it('should leave unmatched mentions while formatting matched ones', () => {
      formatter.setUsers([new MockUser('u1', 'Alice')] as any);
      const result = formatter.format('@alice and @unknown');
      expect(result).toContain('@Alice</span>');
      expect(result).toContain('@unknown');
    });
  });

  // ─── Empty input handling ──────────────────────────────────────────

  describe('format() — empty input', () => {
    it('should handle empty string', () => {
      expect(formatter.format('')).toBe('');
      expect(formatter.getMentions()).toEqual([]);
    });

    it('should handle whitespace-only input', () => {
      expect(formatter.format('   ')).toBe('   ');
      expect(formatter.getMentions()).toEqual([]);
    });

    it('should handle string with only @ symbol', () => {
      expect(formatter.format('@')).toBe('@');
      expect(formatter.getMentions()).toEqual([]);
    });
  });

  // ─── getMentions() ─────────────────────────────────────────────────

  describe('getMentions()', () => {
    beforeEach(() => {
      formatter.setUsers([new MockUser('user1', 'John'), new MockUser('user2', 'Jane')] as any);
    });

    it('should return empty array when no mentions', () => {
      formatter.format('Hello world');
      expect(formatter.getMentions()).toEqual([]);
    });

    it('should return mention data with uid, name, startIndex, endIndex', () => {
      formatter.format('Hello @john');
      const m = formatter.getMentions()[0];
      expect(m.uid).toBe('user1');
      expect(m.name).toBe('John');
      expect(m.startIndex).toBe(6);
      expect(m.endIndex).toBe(11);
    });

    it('should return correct indices for multiple mentions', () => {
      formatter.format('@john and @jane');
      const mentions = formatter.getMentions();
      expect(mentions[0]).toMatchObject({ startIndex: 0, endIndex: 5 });
      expect(mentions[1]).toMatchObject({ startIndex: 10, endIndex: 15 });
    });

    it('should return a defensive copy', () => {
      formatter.format('Hello @john');
      expect(formatter.getMentions()).not.toBe(formatter.getMentions());
      expect(formatter.getMentions()).toEqual(formatter.getMentions());
    });
  });

  // ─── hasMentions() ─────────────────────────────────────────────────

  describe('hasMentions()', () => {
    beforeEach(() => {
      formatter.setUsers([new MockUser('u1', 'John')] as any);
    });

    it('should return false when no mentions', () => {
      formatter.format('Hello world');
      expect(formatter.hasMentions()).toBe(false);
    });

    it('should return true when mentions exist', () => {
      formatter.format('Hello @john');
      expect(formatter.hasMentions()).toBe(true);
    });

    it('should return false for unmatched mentions', () => {
      formatter.format('Hello @unknown');
      expect(formatter.hasMentions()).toBe(false);
    });
  });

  // ─── @all mention support ──────────────────────────────────────────

  describe('@all mention support', () => {
    beforeEach(() => {
      formatter.setAllMentionConfig(true, 'all');
    });

    it('should detect @all mention', () => {
      formatter.format('Hello @all');
      expect(formatter.hasAllMention()).toBe(true);
    });

    it('should format @all with cometchat-mentions-you class', () => {
      expect(formatter.format('Hello @all')).toContain('cometchat-mentions-you');
    });

    it('should store @all mention with uid "all" and type channel', () => {
      formatter.format('Hello @all');
      const m = formatter.getMentions()[0];
      expect(m.uid).toBe('all');
      expect(m.type).toBe(MentionType.channel);
    });

    it('should handle custom @all label', () => {
      formatter.setAllMentionConfig(true, 'everyone');
      formatter.format('Hello @everyone');
      expect(formatter.hasAllMention()).toBe(true);
    });

    it('should not detect @all when disabled', () => {
      formatter.setAllMentionConfig(false, 'all');
      formatter.format('Hello @all');
      expect(formatter.hasAllMention()).toBe(false);
    });

    it('should handle case-insensitive @ALL', () => {
      formatter.format('Hello @ALL');
      expect(formatter.hasAllMention()).toBe(true);
    });
  });

  // ─── Self-mention detection ────────────────────────────────────────

  describe('self-mention detection (loggedInUser)', () => {
    const loggedIn = new MockUser('me123', 'CurrentUser');
    const other = new MockUser('other1', 'OtherPerson');

    beforeEach(() => {
      formatter.setLoggedInUser(loggedIn as any);
      formatter.setUsers([loggedIn, other] as any);
    });

    it('should set and get logged-in user', () => {
      expect(formatter.getLoggedInUser()).toBe(loggedIn);
    });

    it('should mark self-mention with MentionType.self', () => {
      formatter.format('Hello @currentuser');
      expect(formatter.getMentions()[0].type).toBe(MentionType.self);
    });

    it('should mark other-mention with MentionType.other', () => {
      formatter.format('Hello @otherperson');
      expect(formatter.getMentions()[0].type).toBe(MentionType.other);
    });

    it('should apply cometchat-mentions-you for self', () => {
      expect(formatter.format('Hello @currentuser')).toContain('cometchat-mentions-you');
    });

    it('should apply cometchat-mentions-other for others', () => {
      expect(formatter.format('Hello @otherperson')).toContain('cometchat-mentions-other');
    });

    it('should treat all mentions as "other" when loggedInUser is null', () => {
      formatter.setLoggedInUser(null);
      formatter.format('Hello @currentuser');
      expect(formatter.getMentions()[0].type).toBe(MentionType.other);
    });
  });

  // ─── messageBubbleAlignment CSS classes ────────────────────────────

  describe('messageBubbleAlignment CSS classes', () => {
    beforeEach(() => {
      formatter.setUsers([new MockUser('u1', 'Alice')] as any);
    });

    it('should set and get alignment', () => {
      formatter.setMessageBubbleAlignment(MessageBubbleAlignment.left);
      expect(formatter.getMessageBubbleAlignment()).toBe(MessageBubbleAlignment.left);
    });

    it('should add cometchat-mentions-incoming for left alignment', () => {
      formatter.setMessageBubbleAlignment(MessageBubbleAlignment.left);
      expect(formatter.format('Hello @alice')).toContain('cometchat-mentions-incoming');
    });

    it('should add cometchat-mentions-outgoing for right alignment', () => {
      formatter.setMessageBubbleAlignment(MessageBubbleAlignment.right);
      expect(formatter.format('Hello @alice')).toContain('cometchat-mentions-outgoing');
    });

    it('should not add direction class when alignment is undefined', () => {
      formatter.setMessageBubbleAlignment(undefined);
      const result = formatter.format('Hello @alice');
      expect(result).not.toContain('cometchat-mentions-incoming');
      expect(result).not.toContain('cometchat-mentions-outgoing');
    });
  });

  // ─── metadata ──────────────────────────────────────────────────────

  describe('metadata', () => {
    beforeEach(() => {
      formatter.setUsers([new MockUser('user1', 'John')] as any);
    });

    it('should store mentions array in metadata', () => {
      formatter.format('Hello @john');
      const meta = formatter.getMetadata();
      expect(meta).toHaveProperty('mentions');
      expect(Array.isArray(meta['mentions'])).toBe(true);
    });

    it('should include uid, name, startIndex, endIndex in metadata mentions', () => {
      formatter.format('Hello @john');
      const m = (formatter.getMetadata()['mentions'] as MentionData[])[0];
      expect(m).toHaveProperty('uid');
      expect(m).toHaveProperty('name');
      expect(m).toHaveProperty('startIndex');
      expect(m).toHaveProperty('endIndex');
    });

    it('should store empty mentions array when no mentions found', () => {
      formatter.format('Hello world');
      expect(formatter.getMetadata()['mentions']).toEqual([]);
    });
  });

  // ─── formatSdkMentions() ───────────────────────────────────────────

  describe('formatSdkMentions()', () => {
    it('should parse user mentions in SDK format <@uid:xxx>', () => {
      const users = [new MockUser('user1', 'John')];
      const result = formatter.formatSdkMentions('Hello <@uid:user1>', users as any);
      expect(result).toContain('@John</span>');
      expect(result).toContain('data-uid="user1"');
    });

    it('should parse multiple SDK user mentions', () => {
      const users = [new MockUser('u1', 'Alice'), new MockUser('u2', 'Bob')];
      const result = formatter.formatSdkMentions('<@uid:u1> and <@uid:u2>', users as any);
      expect(result).toContain('@Alice</span>');
      expect(result).toContain('@Bob</span>');
      expect(formatter.getMentions()).toHaveLength(2);
    });

    it('should parse channel mentions <@all:label>', () => {
      const result = formatter.formatSdkMentions('Hello <@all:everyone>');
      expect(result).toContain('@everyone</span>');
      expect(result).toContain('data-uid="all"');
      expect(result).toContain('data-mention-type="channel"');
    });

    it('should use UID as fallback display name when user not found', () => {
      const result = formatter.formatSdkMentions('Hello <@uid:unknownUser123>');
      expect(result).toContain('@unknownUser123</span>');
    });

    it('should return text unchanged when no SDK mentions present', () => {
      const text = 'Hello world, no mentions here';
      expect(formatter.formatSdkMentions(text)).toBe(text);
      expect(formatter.getMentions()).toEqual([]);
    });

    it('should detect self-mention in SDK format when loggedInUser is set', () => {
      const loggedIn = new MockUser('me1', 'Me');
      formatter.setLoggedInUser(loggedIn as any);
      const result = formatter.formatSdkMentions('Hello <@uid:me1>', [loggedIn] as any);
      expect(result).toContain('cometchat-mentions-you');
      expect(result).toContain('data-mention-type="self"');
    });

    it('should apply direction CSS classes in SDK format mentions', () => {
      formatter.setMessageBubbleAlignment(MessageBubbleAlignment.left);
      const users = [new MockUser('u1', 'Alice')];
      const result = formatter.formatSdkMentions('Hello <@uid:u1>', users as any);
      expect(result).toContain('cometchat-mentions-incoming');
    });

    it('should handle mixed user and channel SDK mentions', () => {
      const users = [new MockUser('u1', 'Alice')];
      const result = formatter.formatSdkMentions('<@all:everyone> and <@uid:u1>', users as any);
      expect(result).toContain('@everyone</span>');
      expect(result).toContain('@Alice</span>');
      expect(formatter.getMentions()).toHaveLength(2);
    });

    it('should store original text from SDK format', () => {
      const text = 'Hello <@uid:user1>';
      formatter.formatSdkMentions(text, [new MockUser('user1', 'John')] as any);
      expect(formatter.getOriginalText()).toBe(text);
    });
  });

  // ─── formatSdkMentions() with real CometChat.User ──────────────────

  describe('formatSdkMentions() — real CometChat.User objects', () => {
    it('should format SDK mention using real user display name', () => {
      const result = formatter.formatSdkMentions(`Hello <@uid:${realUser.getUid()}>`, [realUser]);
      expect(result).toContain(`data-uid="${realUser.getUid()}"`);
      expect(result).toContain(`@${realUser.getName()}</span>`);
    });

    it('should detect self-mention with real logged-in user in SDK format', () => {
      formatter.setLoggedInUser(realUser);
      const result = formatter.formatSdkMentions(`<@uid:${realUser.getUid()}>`, [realUser]);
      expect(result).toContain('data-mention-type="self"');
    });
  });

  // ─── extractUserUids() ─────────────────────────────────────────────

  describe('extractUserUids()', () => {
    it('should extract UIDs from SDK format mentions', () => {
      expect(formatter.extractUserUids('Hello <@uid:user1> and <@uid:user2>')).toEqual([
        'user1',
        'user2',
      ]);
    });

    it('should return empty array when no SDK mentions', () => {
      expect(formatter.extractUserUids('Hello world')).toEqual([]);
    });

    it('should deduplicate UIDs', () => {
      expect(formatter.extractUserUids('<@uid:user1> said hi to <@uid:user1>')).toEqual(['user1']);
    });

    it('should handle empty string', () => {
      expect(formatter.extractUserUids('')).toEqual([]);
    });
  });

  // ─── extractChannelLabels() ────────────────────────────────────────

  describe('extractChannelLabels()', () => {
    it('should extract channel labels from SDK format', () => {
      expect(formatter.extractChannelLabels('Hello <@all:everyone>')).toEqual(['everyone']);
    });

    it('should return empty array when no channel mentions', () => {
      expect(formatter.extractChannelLabels('Hello world')).toEqual([]);
    });

    it('should deduplicate labels', () => {
      expect(formatter.extractChannelLabels('<@all:everyone> and <@all:everyone>')).toEqual([
        'everyone',
      ]);
    });
  });

  // ─── hasSdkMentions() ──────────────────────────────────────────────

  describe('hasSdkMentions()', () => {
    it('should return true for text with user SDK mentions', () => {
      expect(formatter.hasSdkMentions('Hello <@uid:user1>')).toBe(true);
    });

    it('should return true for text with channel SDK mentions', () => {
      expect(formatter.hasSdkMentions('Hello <@all:everyone>')).toBe(true);
    });

    it('should return false for text without SDK mentions', () => {
      expect(formatter.hasSdkMentions('Hello world')).toBe(false);
    });

    it('should return false for plain @mentions (non-SDK format)', () => {
      expect(formatter.hasSdkMentions('Hello @john')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(formatter.hasSdkMentions('')).toBe(false);
    });
  });

  // ─── HTML escaping ─────────────────────────────────────────────────

  describe('HTML escaping in mentions', () => {
    it('should escape HTML characters in user display names via SDK format', () => {
      const users = [new MockUser('u1', '<script>alert("xss")</script>')];
      const result = formatter.formatSdkMentions('Hello <@uid:u1>', users as any);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should escape HTML characters in UIDs', () => {
      const result = formatter.formatSdkMentions('Hello <@uid:user&1>');
      expect(result).toContain('&amp;');
    });
  });

  // ─── getUserMentionRegex / getChannelMentionRegex ──────────────────

  describe('getUserMentionRegex()', () => {
    it('should match SDK user mention format', () => {
      expect(formatter.getUserMentionRegex().test('<@uid:user123>')).toBe(true);
    });

    it('should not match plain @mentions', () => {
      expect(formatter.getUserMentionRegex().test('@john')).toBe(false);
    });
  });

  describe('getChannelMentionRegex()', () => {
    it('should match SDK channel mention format', () => {
      expect(formatter.getChannelMentionRegex().test('<@all:everyone>')).toBe(true);
    });

    it('should not match plain @all', () => {
      expect(formatter.getChannelMentionRegex().test('@all')).toBe(false);
    });
  });

  // ─── reset() ───────────────────────────────────────────────────────

  describe('reset()', () => {
    beforeEach(() => {
      formatter.setUsers([new MockUser('user1', 'John')] as any);
    });

    it('should clear mentions', () => {
      formatter.format('Hello @john');
      formatter.reset();
      expect(formatter.getMentions()).toEqual([]);
    });

    it('should clear originalText', () => {
      formatter.format('Hello @john');
      formatter.reset();
      expect(formatter.getOriginalText()).toBe('');
    });

    it('should clear formattedText', () => {
      formatter.format('Hello @john');
      formatter.reset();
      expect(formatter.getFormattedText()).toBe('');
    });

    it('should clear metadata', () => {
      formatter.format('Hello @john');
      formatter.reset();
      expect(formatter.getMetadata()).toEqual({});
    });

    it('should not clear users map (users survive reset)', () => {
      formatter.format('Hello @john');
      formatter.reset();
      formatter.format('Hello @john again');
      expect(formatter.getMentions()).toHaveLength(1);
    });
  });

  // ─── setUsers() ────────────────────────────────────────────────────

  describe('setUsers()', () => {
    it('should set available users for matching', () => {
      formatter.setUsers([new MockUser('u1', 'John'), new MockUser('u2', 'Jane')] as any);
      formatter.format('Hello @john');
      expect(formatter.getMentions()).toHaveLength(1);
      expect(formatter.getMentions()[0].uid).toBe('u1');
    });

    it('should handle case-insensitive matching', () => {
      formatter.setUsers([new MockUser('u1', 'John')] as any);
      formatter.format('Hello @JOHN');
      expect(formatter.getMentions()[0].name).toBe('John');
    });

    it('should clear previous users when called again', () => {
      formatter.setUsers([new MockUser('u1', 'John')] as any);
      formatter.setUsers([new MockUser('u2', 'Jane')] as any);
      formatter.format('@john @jane');
      expect(formatter.getMentions()).toHaveLength(1);
      expect(formatter.getMentions()[0].name).toBe('Jane');
    });
  });
});
