// The calls SDK touches JitsiMeetJS at import time, which does not exist in jsdom.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

/**
 * Message-extraction helpers of CometChatTextBubble.
 *
 * These five helpers are pure functions that read untrusted, loosely typed payloads
 * straight off the wire: SDK getters may be missing entirely, metadata may be any
 * JSON shape, and a getter may throw. Every guard is therefore exercised both failing
 * and passing, with the WRONG TYPE supplied per field rather than per function, so a
 * copy-paste slip in one of the four link-preview ternaries cannot hide behind its
 * neighbours.
 *
 * No TestBed: a message double only needs the accessors the function under test calls.
 *
 * @module components/cometchat-text-bubble
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  extractMessageText,
  extractLinkPreviews,
  extractTranslation,
  extractMentionedUsers,
  extractRichTextHtml,
} from './cometchat-text-bubble.utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A message double exposing only getMetadata, which is all the metadata readers call. */
function withMetadata(metadata: unknown): any {
  return { getMetadata: () => metadata };
}

/** A message double whose getMetadata throws, to drive the catch blocks. */
function metadataThrows(): any {
  return {
    getMetadata: () => {
      throw new Error('metadata unavailable');
    },
  };
}

/** Wraps a links array in the full metadata path link previews are read from. */
function withLinks(links: unknown): any {
  return withMetadata({ '@injected': { extensions: { 'link-preview': { links } } } });
}

// ---------------------------------------------------------------------------
// extractMessageText
// ---------------------------------------------------------------------------

describe('extractMessageText', () => {
  it('returns empty string for a null message', () => {
    expect(extractMessageText(null)).toBe('');
  });

  it('returns empty string for an undefined message', () => {
    expect(extractMessageText(undefined)).toBe('');
  });

  it('returns the string produced by getText', () => {
    expect(extractMessageText({ getText: () => 'hello' } as any)).toBe('hello');
  });

  it('falls back to data.text when getText is absent', () => {
    expect(extractMessageText({ getData: () => ({ text: 'caption' }) } as any)).toBe('caption');
  });

  it('falls back to data.text when getText returns an empty string', () => {
    const msg = { getText: () => '', getData: () => ({ text: 'caption' }) } as any;
    expect(extractMessageText(msg)).toBe('caption');
  });

  it('returns empty string when getData is also absent', () => {
    expect(extractMessageText({ getText: () => '' } as any)).toBe('');
  });

  it('returns empty string when getData returns undefined', () => {
    expect(extractMessageText({ getData: () => undefined } as any)).toBe('');
  });

  it('returns empty string when data carries no text key', () => {
    expect(extractMessageText({ getData: () => ({}) } as any)).toBe('');
  });

  it('returns empty string when data.text is a number rather than a string', () => {
    expect(extractMessageText({ getData: () => ({ text: 42 }) } as any)).toBe('');
  });

  // The other four helpers wrap their getter calls in try/catch and return a neutral value.
  // This one does not, so a throwing getter escapes to the caller. Pinned deliberately: if
  // the guard is ever added, these two tests should be the ones that fail and get updated.
  it('lets a throwing getText escape instead of swallowing it', () => {
    const msg = { getText: () => { throw new Error('text unavailable'); } } as any;
    expect(() => extractMessageText(msg)).toThrow('text unavailable');
  });

  it('lets a throwing getData escape instead of swallowing it', () => {
    const msg = { getData: () => { throw new Error('data unavailable'); } } as any;
    expect(() => extractMessageText(msg)).toThrow('data unavailable');
  });

  // extractRichTextHtml trims before deciding whether text is present; this one does not.
  // Same message therefore yields BOTH a text and a rich-text result — see the paired test
  // in the extractRichTextHtml block.
  it('keeps a whitespace-only getText result verbatim without trimming it away', () => {
    expect(extractMessageText({ getText: () => '   ' } as any)).toBe('   ');
  });
});

// ---------------------------------------------------------------------------
// extractLinkPreviews — guard chain
// ---------------------------------------------------------------------------

describe('extractLinkPreviews guard chain', () => {
  it('returns an empty array for a null message', () => {
    expect(extractLinkPreviews(null)).toEqual([]);
  });

  it('returns an empty array for an undefined message', () => {
    expect(extractLinkPreviews(undefined)).toEqual([]);
  });

  it('returns an empty array when getMetadata is absent', () => {
    expect(extractLinkPreviews({} as any)).toEqual([]);
  });

  it('returns an empty array when getMetadata returns null', () => {
    expect(extractLinkPreviews(withMetadata(null))).toEqual([]);
  });

  it('returns an empty array when metadata is a string', () => {
    expect(extractLinkPreviews(withMetadata('not-an-object'))).toEqual([]);
  });

  it('returns an empty array when metadata has no @injected key', () => {
    expect(extractLinkPreviews(withMetadata({ other: true }))).toEqual([]);
  });

  it('returns an empty array when @injected is null', () => {
    expect(extractLinkPreviews(withMetadata({ '@injected': null }))).toEqual([]);
  });

  it('returns an empty array when @injected is a string', () => {
    expect(extractLinkPreviews(withMetadata({ '@injected': 'nope' }))).toEqual([]);
  });

  it('returns an empty array when @injected has no extensions key', () => {
    expect(extractLinkPreviews(withMetadata({ '@injected': { other: true } }))).toEqual([]);
  });

  it('returns an empty array when extensions is a number', () => {
    expect(extractLinkPreviews(withMetadata({ '@injected': { extensions: 3 } }))).toEqual([]);
  });

  it('returns an empty array when extensions has no link-preview key', () => {
    expect(extractLinkPreviews(withMetadata({ '@injected': { extensions: {} } }))).toEqual([]);
  });

  it('returns an empty array when link-preview is a string', () => {
    const msg = withMetadata({ '@injected': { extensions: { 'link-preview': 'x' } } });
    expect(extractLinkPreviews(msg)).toEqual([]);
  });

  it('returns an empty array when link-preview has no links key', () => {
    const msg = withMetadata({ '@injected': { extensions: { 'link-preview': {} } } });
    expect(extractLinkPreviews(msg)).toEqual([]);
  });

  // These two pin the OUTCOME for a non-array links value, not the Array.isArray guard
  // itself: a plain object or a string has no .filter, so removing the guard still yields []
  // via the catch below. The next test is the one that can tell the two implementations apart.
  it('returns an empty array when links is an object rather than an array', () => {
    expect(extractLinkPreviews(withLinks({ 0: { url: 'https://a.com' } }))).toEqual([]);
  });

  it('returns an empty array when links is a string', () => {
    expect(extractLinkPreviews(withLinks('https://a.com'))).toEqual([]);
  });

  it('rejects a links value that merely duck-types as an array, instead of mapping it', () => {
    const quacksLikeAnArray = {
      filter: () => [{ url: 'https://smuggled.com' }],
      map: (fn: (l: unknown) => unknown) => [fn({ url: 'https://smuggled.com' })],
    };
    expect(extractLinkPreviews(withLinks(quacksLikeAnArray))).toEqual([]);
  });

  it('returns an empty array when getMetadata throws', () => {
    expect(extractLinkPreviews(metadataThrows())).toEqual([]);
  });

  it('returns an empty array when links is an empty array', () => {
    expect(extractLinkPreviews(withLinks([]))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// extractLinkPreviews — entry filter
// ---------------------------------------------------------------------------

describe('extractLinkPreviews entry filter', () => {
  it('drops a null entry and keeps the valid one', () => {
    const result = extractLinkPreviews(withLinks([null, { url: 'https://valid.com' }]));
    expect(result).toEqual([{ url: 'https://valid.com', title: undefined, description: undefined, image: undefined, favicon: undefined }]);
  });

  it('drops a string entry and keeps the valid one', () => {
    const result = extractLinkPreviews(withLinks(['https://string.com', { url: 'https://valid.com' }]));
    expect(result.map(l => l.url)).toEqual(['https://valid.com']);
  });

  it('drops a number entry and keeps the valid one', () => {
    const result = extractLinkPreviews(withLinks([5, { url: 'https://valid.com' }]));
    expect(result.map(l => l.url)).toEqual(['https://valid.com']);
  });

  it('drops an entry whose url is a number', () => {
    const result = extractLinkPreviews(withLinks([{ url: 99 }, { url: 'https://valid.com' }]));
    expect(result.map(l => l.url)).toEqual(['https://valid.com']);
  });

  it('drops an entry with no url key at all', () => {
    const result = extractLinkPreviews(withLinks([{ title: 'no url here' }, { url: 'https://valid.com' }]));
    expect(result.map(l => l.url)).toEqual(['https://valid.com']);
  });

  it('drops an entry whose url is null', () => {
    const result = extractLinkPreviews(withLinks([{ url: null }, { url: 'https://valid.com' }]));
    expect(result.map(l => l.url)).toEqual(['https://valid.com']);
  });

  it('drops every invalid shape at once, keeping only the valid entry', () => {
    const result = extractLinkPreviews(
      withLinks([null, 'str', 12, { url: {} }, {}, { url: 'https://valid.com' }])
    );
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://valid.com');
  });

  it('returns an empty array when no entry survives the filter', () => {
    expect(extractLinkPreviews(withLinks([null, 'str', { url: 1 }]))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// extractLinkPreviews — field mapping
// ---------------------------------------------------------------------------

describe('extractLinkPreviews field mapping', () => {
  it('carries a string title through', () => {
    const result = extractLinkPreviews(withLinks([{ url: 'https://a.com', title: 'A title' }]));
    expect(result[0].title).toBe('A title');
  });

  it('maps a numeric title to undefined', () => {
    const result = extractLinkPreviews(withLinks([{ url: 'https://a.com', title: 123 }]));
    expect(result[0].title).toBeUndefined();
  });

  it('carries a string description through', () => {
    const result = extractLinkPreviews(withLinks([{ url: 'https://a.com', description: 'A description' }]));
    expect(result[0].description).toBe('A description');
  });

  it('maps a null description to undefined', () => {
    const result = extractLinkPreviews(withLinks([{ url: 'https://a.com', description: null }]));
    expect(result[0].description).toBeUndefined();
  });

  it('carries a string image through', () => {
    const result = extractLinkPreviews(withLinks([{ url: 'https://a.com', image: 'https://a.com/i.png' }]));
    expect(result[0].image).toBe('https://a.com/i.png');
  });

  it('maps an object image to undefined', () => {
    const result = extractLinkPreviews(withLinks([{ url: 'https://a.com', image: { src: 'x' } }]));
    expect(result[0].image).toBeUndefined();
  });

  it('carries a string favicon through', () => {
    const result = extractLinkPreviews(withLinks([{ url: 'https://a.com', favicon: 'https://a.com/f.ico' }]));
    expect(result[0].favicon).toBe('https://a.com/f.ico');
  });

  it('maps a numeric favicon to undefined', () => {
    const result = extractLinkPreviews(withLinks([{ url: 'https://a.com', favicon: 0.5 }]));
    expect(result[0].favicon).toBeUndefined();
  });

  it('maps all four fields when all are strings', () => {
    const result = extractLinkPreviews(
      withLinks([
        {
          url: 'https://a.com',
          title: 'T',
          description: 'D',
          image: 'I',
          favicon: 'F',
        },
      ])
    );
    expect(result[0]).toEqual({
      url: 'https://a.com',
      title: 'T',
      description: 'D',
      image: 'I',
      favicon: 'F',
    });
  });

  it('returns two valid links in source order', () => {
    const result = extractLinkPreviews(
      withLinks([{ url: 'https://first.com' }, { url: 'https://second.com' }])
    );
    expect(result.map(l => l.url)).toEqual(['https://first.com', 'https://second.com']);
  });
});

// ---------------------------------------------------------------------------
// extractTranslation
// ---------------------------------------------------------------------------

describe('extractTranslation', () => {
  it('lets a non-empty override win over the metadata translation', () => {
    const msg = withMetadata({ translated_message: 'from metadata' });
    expect(extractTranslation(msg, 'from override')).toBe('from override');
  });

  it('returns the override even when there is no message', () => {
    expect(extractTranslation(null, 'from override')).toBe('from override');
  });

  it('does not let an empty-string override win, falling through to the metadata', () => {
    const msg = withMetadata({ translated_message: 'from metadata' });
    expect(extractTranslation(msg, '')).toBe('from metadata');
  });

  it('ignores a non-string override and falls through to the metadata', () => {
    const msg = withMetadata({ translated_message: 'from metadata' });
    expect(extractTranslation(msg, 99 as unknown as string)).toBe('from metadata');
  });

  it('returns empty string with neither message nor override', () => {
    expect(extractTranslation(null)).toBe('');
  });

  it('returns empty string for an undefined message and an empty override', () => {
    expect(extractTranslation(undefined, '')).toBe('');
  });

  it('returns empty string when getMetadata is absent', () => {
    expect(extractTranslation({} as any)).toBe('');
  });

  it('returns empty string when getMetadata returns null', () => {
    expect(extractTranslation(withMetadata(null))).toBe('');
  });

  it('returns empty string when metadata is a string', () => {
    expect(extractTranslation(withMetadata('translated'))).toBe('');
  });

  it('returns the translated_message when it is a string', () => {
    expect(extractTranslation(withMetadata({ translated_message: 'hola' }))).toBe('hola');
  });

  it('returns empty string when translated_message is a number', () => {
    expect(extractTranslation(withMetadata({ translated_message: 5 }))).toBe('');
  });

  it('returns empty string when translated_message is absent', () => {
    expect(extractTranslation(withMetadata({ other: 'x' }))).toBe('');
  });

  it('returns empty string when getMetadata throws', () => {
    expect(extractTranslation(metadataThrows())).toBe('');
  });
});

// ---------------------------------------------------------------------------
// extractMentionedUsers
// ---------------------------------------------------------------------------

describe('extractMentionedUsers', () => {
  it('returns an empty array for a null message', () => {
    expect(extractMentionedUsers(null)).toEqual([]);
  });

  it('returns an empty array for an undefined message', () => {
    expect(extractMentionedUsers(undefined)).toEqual([]);
  });

  it('returns an empty array when getMentionedUsers is absent', () => {
    expect(extractMentionedUsers({} as any)).toEqual([]);
  });

  it('returns the very array the getter produced', () => {
    const users = [{ uid: 'u1' }, { uid: 'u2' }] as any;
    const msg = { getMentionedUsers: () => users } as any;
    expect(extractMentionedUsers(msg)).toBe(users);
  });

  it('passes an empty array straight through rather than substituting its own', () => {
    const empty: any[] = [];
    expect(extractMentionedUsers({ getMentionedUsers: () => empty } as any)).toBe(empty);
  });

  it('returns an empty array when the getter produced null', () => {
    expect(extractMentionedUsers({ getMentionedUsers: () => null } as any)).toEqual([]);
  });

  it('returns an empty array when the getter produced a string', () => {
    expect(extractMentionedUsers({ getMentionedUsers: () => 'u1,u2' } as any)).toEqual([]);
  });

  it('returns an empty array when the getter throws', () => {
    const msg = {
      getMentionedUsers: () => {
        throw new Error('no mentions');
      },
    } as any;
    expect(extractMentionedUsers(msg)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// extractRichTextHtml
// ---------------------------------------------------------------------------

describe('extractRichTextHtml', () => {
  /** Rich metadata that WOULD be returned if plain text did not take precedence. */
  const richMetadata = {
    richText: { hasFormatting: true, html: '<p><strong>bold</strong></p>' },
  };

  it('returns empty string for a null message', () => {
    expect(extractRichTextHtml(null)).toBe('');
  });

  it('returns empty string for an undefined message', () => {
    expect(extractRichTextHtml(undefined)).toBe('');
  });

  it('yields to plain text: non-empty getText beats valid rich metadata', () => {
    const msg = { getText: () => 'plain text wins', getMetadata: () => richMetadata } as any;
    expect(extractRichTextHtml(msg)).toBe('');
  });

  it('does not treat whitespace-only text as text, so the rich metadata is used', () => {
    const msg = { getText: () => '   \n  ', getMetadata: () => richMetadata } as any;
    expect(extractRichTextHtml(msg)).toBe('<p><strong>bold</strong></p>');
  });

  it('uses the rich metadata when getText returns an empty string', () => {
    const msg = { getText: () => '', getMetadata: () => richMetadata } as any;
    expect(extractRichTextHtml(msg)).toBe('<p><strong>bold</strong></p>');
  });

  it('uses the rich metadata when getText is absent entirely', () => {
    expect(extractRichTextHtml(withMetadata(richMetadata))).toBe('<p><strong>bold</strong></p>');
  });

  it('returns empty string when getMetadata is absent', () => {
    expect(extractRichTextHtml({ getText: () => '' } as any)).toBe('');
  });

  it('returns empty string when getMetadata returns null', () => {
    expect(extractRichTextHtml(withMetadata(null))).toBe('');
  });

  it('returns empty string when metadata is a string', () => {
    expect(extractRichTextHtml(withMetadata('<p>hi</p>'))).toBe('');
  });

  it('returns empty string when metadata has no richText key', () => {
    expect(extractRichTextHtml(withMetadata({ other: true }))).toBe('');
  });

  it('returns empty string when richText is null', () => {
    expect(extractRichTextHtml(withMetadata({ richText: null }))).toBe('');
  });

  it('returns empty string when richText is a string', () => {
    expect(extractRichTextHtml(withMetadata({ richText: '<p>hi</p>' }))).toBe('');
  });

  it('returns empty string when hasFormatting is false', () => {
    const msg = withMetadata({ richText: { hasFormatting: false, html: '<p>hi</p>' } });
    expect(extractRichTextHtml(msg)).toBe('');
  });

  it('returns empty string when hasFormatting is absent', () => {
    expect(extractRichTextHtml(withMetadata({ richText: { html: '<p>hi</p>' } }))).toBe('');
  });

  it.each([['the string "true"', 'true'], ['the number 1', 1], ['a non-empty object', {}]])(
    'rejects %s for hasFormatting — the check is strict equality against true',
    (_label, hasFormatting) => {
      const msg = withMetadata({ richText: { hasFormatting, html: '<p>hi</p>' } });
      expect(extractRichTextHtml(msg)).toBe('');
    }
  );

  it('returns empty string when html is absent', () => {
    expect(extractRichTextHtml(withMetadata({ richText: { hasFormatting: true } }))).toBe('');
  });

  it('returns empty string when html is a number', () => {
    const msg = withMetadata({ richText: { hasFormatting: true, html: 404 } });
    expect(extractRichTextHtml(msg)).toBe('');
  });

  it('returns empty string when html is whitespace only', () => {
    const msg = withMetadata({ richText: { hasFormatting: true, html: '   ' } });
    expect(extractRichTextHtml(msg)).toBe('');
  });

  it('returns the html when hasFormatting is true and html is a real string', () => {
    const msg = withMetadata({ richText: { hasFormatting: true, html: '<p><em>x</em></p>' } });
    expect(extractRichTextHtml(msg)).toBe('<p><em>x</em></p>');
  });

  it('returns empty string when getMetadata throws', () => {
    expect(extractRichTextHtml(metadataThrows())).toBe('');
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
