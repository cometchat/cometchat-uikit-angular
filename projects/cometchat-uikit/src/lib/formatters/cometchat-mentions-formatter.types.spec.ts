/**
 * Mentions formatter regex constants Tests
 *
 * The file's interface is type-only; its runtime surface is the two SDK-format
 * mention regexes, which these tests pin down.
 *
 * @module formatters/mentions-types
 */

import { describe, it, expect } from 'vitest';
import { USER_MENTION_REGEX, CHANNEL_MENTION_REGEX } from './cometchat-mentions-formatter.types';
import { CometChatMentionsFormatter } from './cometchat-mentions-formatter';

/** Fresh copy so the shared global regex's lastIndex never leaks between tests. */
const fresh = (re: RegExp) => new RegExp(re.source, re.flags);
const captures = (re: RegExp, text: string) => [...text.matchAll(fresh(re))].map(m => m[1]);

describe('USER_MENTION_REGEX', () => {
  it('is global and has the SDK `<@uid:…>` source', () => {
    expect(USER_MENTION_REGEX.flags).toBe('g');
    expect(USER_MENTION_REGEX.source).toBe('<@uid:(.*?)>');
  });

  it('captures the uid of a single mention', () => {
    expect(captures(USER_MENTION_REGEX, 'hi <@uid:superhero1> there')).toEqual(['superhero1']);
  });

  it('captures each mention separately (non-greedy)', () => {
    expect(captures(USER_MENTION_REGEX, '<@uid:a> and <@uid:b-2>')).toEqual(['a', 'b-2']);
  });

  it('keeps uids that contain dots, underscores and @', () => {
    expect(captures(USER_MENTION_REGEX, '<@uid:john.doe_99@x>')).toEqual(['john.doe_99@x']);
  });

  it('reports the match index and full length for replacement', () => {
    const m = fresh(USER_MENTION_REGEX).exec('Hey <@uid:abc>!');
    expect(m?.index).toBe(4);
    expect(m?.[0]).toBe('<@uid:abc>');
  });

  it('does not match a channel mention, a bare @name, or an unclosed tag', () => {
    expect(captures(USER_MENTION_REGEX, '<@all:all> @bob <@uid:open')).toEqual([]);
  });

  it('matches an empty uid as an empty capture', () => {
    expect(captures(USER_MENTION_REGEX, '<@uid:>')).toEqual(['']);
  });
});

describe('CHANNEL_MENTION_REGEX', () => {
  it('is global and has the `<@all:…>` source', () => {
    expect(CHANNEL_MENTION_REGEX.flags).toBe('g');
    expect(CHANNEL_MENTION_REGEX.source).toBe('<@all:(.*?)>');
  });

  it('captures the channel label', () => {
    expect(captures(CHANNEL_MENTION_REGEX, 'heads up <@all:all>')).toEqual(['all']);
  });

  it('captures multiple labels independently', () => {
    expect(captures(CHANNEL_MENTION_REGEX, '<@all:everyone> <@all:here>')).toEqual(['everyone', 'here']);
  });

  it('does not match user mentions', () => {
    expect(captures(CHANNEL_MENTION_REGEX, '<@uid:all>')).toEqual([]);
  });
});

describe('mixed text', () => {
  it('each regex picks only its own kind out of mixed text', () => {
    const text = '<@uid:u1> ping <@all:all> and <@uid:u2>';
    expect(captures(USER_MENTION_REGEX, text)).toEqual(['u1', 'u2']);
    expect(captures(CHANNEL_MENTION_REGEX, text)).toEqual(['all']);
  });
});

describe('formatter wiring', () => {
  it('the formatter re-exports the same regex objects', async () => {
    const mod = await import('./cometchat-mentions-formatter');
    expect(mod.USER_MENTION_REGEX).toBe(USER_MENTION_REGEX);
    expect(mod.CHANNEL_MENTION_REGEX).toBe(CHANNEL_MENTION_REGEX);
  });

  it('the formatter hands out fresh regex copies built from these sources', () => {
    const f = new CometChatMentionsFormatter();
    const a = f.getUserMentionRegex();
    expect(a).not.toBe(USER_MENTION_REGEX);
    expect(a.source).toBe(USER_MENTION_REGEX.source);
    expect(f.getChannelMentionRegex().source).toBe(CHANNEL_MENTION_REGEX.source);
  });
});
