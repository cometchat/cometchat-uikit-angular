/**
 * Mentions Formatter Pattern Wrapping — Property-Based Tests
 *
 * Categories: Property-Based Mention Wrapping Invariants, SDK Mention Formatting
 * Validates: Requirements 6.7
 *
 * Property 23: Mentions Formatter Pattern Wrapping
 * For text with `<@uid:username>` SDK mention patterns and configured user list,
 * format() wraps each mention with data-uid attribute matching the user's UID.
 *
 * @module formatters/mentions-formatter-pattern-wrapping.property
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { vi, beforeAll, afterAll, describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import { CometChatMentionsFormatter } from './cometchat-mentions-formatter';

// ==================== Helpers ====================

/**
 * Count occurrences of a substring in a string.
 */
function countOccurrences(str: string, sub: string): number {
  let count = 0;
  let pos = 0;
  while ((pos = str.indexOf(sub, pos)) !== -1) {
    count++;
    pos += sub.length;
  }
  return count;
}

/**
 * Build a minimal mock user object with getUid() and getName().
 * CometChat SDK User objects are complex — we only need these two methods
 * for the mentions formatter's setUsers() and formatSdkMentions().
 */
function makeFakeUser(uid: string, name: string): any {
  return {
    getUid: () => uid,
    getName: () => name,
  };
}

// ==================== Arbitraries ====================

/** Arbitrary alphanumeric UID (3–20 chars, no special chars). */
const arbUid = fc.stringMatching(/^[a-zA-Z0-9]{3,20}$/);

/** Arbitrary display name (letters and spaces, 2–20 chars). */
const arbDisplayName = fc.stringMatching(/^[a-zA-Z][a-zA-Z ]{1,19}$/);

/** Arbitrary plain text that won't contain SDK mention patterns or @ symbols. */
const arbPlainText = fc
  .stringMatching(/^[a-zA-Z0-9 ,.\-!?;'"()+=]{0,100}$/)
  .filter(s => !s.includes('<') && !s.includes('>') && !s.includes('@'));

/** Arbitrary surrounding text (no angle brackets or @). */
const arbSurroundText = fc
  .stringMatching(/^[a-zA-Z0-9 ]{1,30}$/)
  .filter(s => !s.includes('<') && !s.includes('>') && !s.includes('@'));

/**
 * Arbitrary single SDK mention pattern: `<@uid:{uid}>`.
 * Returns { uid, pattern } for verification.
 */
const arbSdkMention = fc.tuple(arbUid, arbDisplayName).map(([uid, name]) => ({
  uid,
  name,
  pattern: `<@uid:${uid}>`,
}));

/**
 * Arbitrary text with exactly one SDK mention embedded.
 */
const arbTextWithOneMention = fc
  .tuple(arbSurroundText, arbSdkMention, arbSurroundText)
  .map(([before, mention, after]) => ({
    text: `${before} ${mention.pattern} ${after}`,
    mentions: [mention],
  }));

/**
 * Arbitrary text with 2–5 distinct SDK mentions embedded.
 */
const arbTextWithMultipleMentions = fc
  .tuple(
    fc.array(fc.tuple(arbUid, arbDisplayName, arbSurroundText), { minLength: 2, maxLength: 5 }),
    arbSurroundText
  )
  .chain(([entries, trailing]) => {
    // Ensure unique UIDs
    const seen = new Set<string>();
    const unique = entries.filter(([uid]) => {
      if (seen.has(uid)) return false;
      seen.add(uid);
      return true;
    });
    if (unique.length < 2) {
      return fc.constant(null);
    }
    const mentions = unique.map(([uid, name]) => ({
      uid,
      name,
      pattern: `<@uid:${uid}>`,
    }));
    const text = mentions.map((m, i) => `${unique[i][2]} ${m.pattern}`).join(' ') + ` ${trailing}`;
    return fc.constant({ text, mentions });
  })
  .filter((v): v is NonNullable<typeof v> => v !== null);

/**
 * Arbitrary username that is a valid word-character sequence (for format() method).
 */
const arbWordUsername = fc.stringMatching(/^[a-zA-Z]{3,12}$/);

// ==================== Tests ====================

describe('Property 23: Mentions Formatter Pattern Wrapping', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  });

  // ---------- 1. Single SDK mention wrapping via formatSdkMentions ----------

  describe('Single SDK mention wrapping', () => {
    /**
     * **Validates: Requirements 6.7**
     *
     * For text with one `<@uid:X>` pattern and a matching user in mentionedUsers,
     * formatSdkMentions() wraps the mention with data-uid="X".
     */
    it('wraps single SDK mention with data-uid attribute', () => {
      fc.assert(
        fc.property(arbTextWithOneMention, ({ text, mentions }) => {
          const formatter = new CometChatMentionsFormatter();
          const mentionedUsers = mentions.map(m => makeFakeUser(m.uid, m.name));
          const result = formatter.formatSdkMentions(text, mentionedUsers);

          for (const m of mentions) {
            expect(result).toContain(`data-uid="${m.uid}"`);
            expect(result).not.toContain(m.pattern);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 2. Multiple SDK mentions wrapping ----------

  describe('Multiple SDK mentions wrapping', () => {
    /**
     * **Validates: Requirements 6.7**
     *
     * For text with N distinct `<@uid:X>` patterns and matching users,
     * formatSdkMentions() wraps each mention with its respective data-uid.
     */
    it('wraps each SDK mention with its own data-uid attribute', () => {
      fc.assert(
        fc.property(arbTextWithMultipleMentions, ({ text, mentions }) => {
          const formatter = new CometChatMentionsFormatter();
          const mentionedUsers = mentions.map(m => makeFakeUser(m.uid, m.name));
          const result = formatter.formatSdkMentions(text, mentionedUsers);

          for (const m of mentions) {
            expect(result).toContain(`data-uid="${m.uid}"`);
            expect(result).not.toContain(m.pattern);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 3. Mention count preservation ----------

  describe('Mention count preservation', () => {
    /**
     * **Validates: Requirements 6.7**
     *
     * The number of data-uid attributes in the output equals the number
     * of SDK mention patterns in the input.
     */
    it('output contains exactly N data-uid attributes for N SDK mentions', () => {
      fc.assert(
        fc.property(arbTextWithMultipleMentions, ({ text, mentions }) => {
          const formatter = new CometChatMentionsFormatter();
          const mentionedUsers = mentions.map(m => makeFakeUser(m.uid, m.name));
          const result = formatter.formatSdkMentions(text, mentionedUsers);

          const dataUidCount = countOccurrences(result, 'data-uid="');
          expect(dataUidCount).toBe(mentions.length);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 4. No mentions — identity property ----------

  describe('No mentions identity', () => {
    /**
     * **Validates: Requirements 6.7**
     *
     * For text with no SDK mention patterns, formatSdkMentions() returns
     * the text unchanged.
     */
    it('returns text unchanged when no SDK mention patterns are present', () => {
      fc.assert(
        fc.property(arbPlainText, text => {
          const formatter = new CometChatMentionsFormatter();
          const result = formatter.formatSdkMentions(text, []);
          expect(result).toBe(text);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 5. Wrapped mentions contain <span> tags ----------

  describe('Span wrapping', () => {
    /**
     * **Validates: Requirements 6.7**
     *
     * Each SDK mention is wrapped in a `<span>` element.
     */
    it('wraps each SDK mention in a <span> element', () => {
      fc.assert(
        fc.property(arbTextWithOneMention, ({ text, mentions }) => {
          const formatter = new CometChatMentionsFormatter();
          const mentionedUsers = mentions.map(m => makeFakeUser(m.uid, m.name));
          const result = formatter.formatSdkMentions(text, mentionedUsers);

          const spanCount = countOccurrences(result, '<span ');
          expect(spanCount).toBe(mentions.length);
          expect(result).toContain('</span>');
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 6. Display name appears in output ----------

  describe('Display name in output', () => {
    /**
     * **Validates: Requirements 6.7**
     *
     * The formatted output contains the user's display name prefixed with @.
     */
    it('output contains @displayName for each mention', () => {
      fc.assert(
        fc.property(arbTextWithOneMention, ({ text, mentions }) => {
          const formatter = new CometChatMentionsFormatter();
          const mentionedUsers = mentions.map(m => makeFakeUser(m.uid, m.name));
          const result = formatter.formatSdkMentions(text, mentionedUsers);

          for (const m of mentions) {
            expect(result).toContain(`@${m.name}`);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 7. format() with @username and configured users ----------

  describe('format() with @username patterns and configured users', () => {
    /**
     * **Validates: Requirements 6.7**
     *
     * For text with @username patterns and matching users set via setUsers(),
     * format() wraps each mention with data-uid attribute.
     */
    it('wraps @username mentions with data-uid when user is configured', () => {
      fc.assert(
        fc.property(
          arbSurroundText,
          arbWordUsername,
          arbUid,
          arbSurroundText,
          (before, username, uid, after) => {
            const formatter = new CometChatMentionsFormatter();
            const user = makeFakeUser(uid, username);
            formatter.setUsers([user]);

            const text = `${before} @${username} ${after}`;
            const result = formatter.format(text);

            expect(result).toContain(`data-uid="${uid}"`);
            expect(result).toContain(`@${username}`);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 8. format() with no matching users — passthrough ----------

  describe('format() with no matching users', () => {
    /**
     * **Validates: Requirements 6.7**
     *
     * When no users are configured, @username patterns pass through unchanged
     * (no data-uid wrapping).
     */
    it('does not wrap @username when no users are configured', () => {
      fc.assert(
        fc.property(
          arbSurroundText,
          arbWordUsername,
          arbSurroundText,
          (before, username, after) => {
            const formatter = new CometChatMentionsFormatter();
            // No users set
            const text = `${before} @${username} ${after}`;
            const result = formatter.format(text);

            expect(result).not.toContain('data-uid');
            expect(result).toBe(text);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 9. SDK mention with unknown UID uses UID as fallback name ----------

  describe('SDK mention with unknown user falls back to UID', () => {
    /**
     * **Validates: Requirements 6.7**
     *
     * When formatSdkMentions() encounters a `<@uid:X>` pattern but X is not
     * in the mentionedUsers list, it still wraps with data-uid using UID as display name.
     */
    it('wraps SDK mention with data-uid even when user is not in mentionedUsers', () => {
      fc.assert(
        fc.property(arbSurroundText, arbUid, arbSurroundText, (before, uid, after) => {
          const formatter = new CometChatMentionsFormatter();
          const text = `${before} <@uid:${uid}> ${after}`;
          // Pass empty mentionedUsers — UID used as fallback display name
          const result = formatter.formatSdkMentions(text, []);

          expect(result).toContain(`data-uid="${uid}"`);
          expect(result).not.toContain(`<@uid:${uid}>`);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 10. getMentions() returns correct count after formatSdkMentions ----------

  describe('getMentions() count matches input mentions', () => {
    /**
     * **Validates: Requirements 6.7**
     *
     * After formatSdkMentions(), getMentions() returns an array with
     * the same number of entries as SDK mention patterns in the input.
     */
    it('getMentions().length equals number of SDK mention patterns', () => {
      fc.assert(
        fc.property(arbTextWithMultipleMentions, ({ text, mentions }) => {
          const formatter = new CometChatMentionsFormatter();
          const mentionedUsers = mentions.map(m => makeFakeUser(m.uid, m.name));
          formatter.formatSdkMentions(text, mentionedUsers);

          const detected = formatter.getMentions();
          expect(detected.length).toBe(mentions.length);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 11. getMentions() UIDs match input UIDs ----------

  describe('getMentions() UIDs match input', () => {
    /**
     * **Validates: Requirements 6.7**
     *
     * After formatSdkMentions(), each MentionData.uid matches one of the
     * input SDK mention UIDs.
     */
    it('getMentions() UIDs correspond to input SDK mention UIDs', () => {
      fc.assert(
        fc.property(arbTextWithMultipleMentions, ({ text, mentions }) => {
          const formatter = new CometChatMentionsFormatter();
          const mentionedUsers = mentions.map(m => makeFakeUser(m.uid, m.name));
          formatter.formatSdkMentions(text, mentionedUsers);

          const detected = formatter.getMentions();
          const inputUids = new Set(mentions.map(m => m.uid));
          for (const d of detected) {
            expect(inputUids.has(d.uid)).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 12. CSS class presence in wrapped mentions ----------

  describe('CSS class presence', () => {
    /**
     * **Validates: Requirements 6.7**
     *
     * Each wrapped mention span contains the base CSS class `cometchat-mentions`.
     */
    it('wrapped mentions contain cometchat-mentions CSS class', () => {
      fc.assert(
        fc.property(arbTextWithOneMention, ({ text, mentions }) => {
          const formatter = new CometChatMentionsFormatter();
          const mentionedUsers = mentions.map(m => makeFakeUser(m.uid, m.name));
          const result = formatter.formatSdkMentions(text, mentionedUsers);

          expect(result).toContain('cometchat-mentions');
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 13. hasMentions() returns true after formatting mentions ----------

  describe('hasMentions() after formatting', () => {
    /**
     * **Validates: Requirements 6.7**
     *
     * After formatSdkMentions() with at least one mention, hasMentions() returns true.
     */
    it('hasMentions() returns true after formatting text with SDK mentions', () => {
      fc.assert(
        fc.property(arbTextWithOneMention, ({ text, mentions }) => {
          const formatter = new CometChatMentionsFormatter();
          const mentionedUsers = mentions.map(m => makeFakeUser(m.uid, m.name));
          formatter.formatSdkMentions(text, mentionedUsers);

          expect(formatter.hasMentions()).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  // ---------- 14. Surrounding text preserved ----------

  describe('Surrounding text preserved', () => {
    /**
     * **Validates: Requirements 6.7**
     *
     * Text before and after SDK mention patterns is preserved in the output.
     */
    it('preserves surrounding text around SDK mentions', () => {
      fc.assert(
        fc.property(arbSurroundText, arbSdkMention, arbSurroundText, (before, mention, after) => {
          const formatter = new CometChatMentionsFormatter();
          const text = `${before} ${mention.pattern} ${after}`;
          const mentionedUsers = [makeFakeUser(mention.uid, mention.name)];
          const result = formatter.formatSdkMentions(text, mentionedUsers);

          expect(result).toContain(before);
          expect(result).toContain(after);
        }),
        { numRuns: 100 }
      );
    });
  });
});
