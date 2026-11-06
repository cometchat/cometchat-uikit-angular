/**
 * Text-processing helpers of the text bubble utils.
 *
 * These are pure functions, so there is no TestBed here — each test imports the
 * function and calls it directly.
 *
 * @module components/cometchat-text-bubble
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  detectSingleEmoji,
  detectSingleEmojiInRichText,
  stripInvalidMentionFormats,
  getDomainFromUrl,
  convertMarkdownToHtml,
} from './cometchat-text-bubble.utils';

// ---------------------------------------------------------------------------
// Fixtures
//
// Emoji are written as escapes rather than literals so the expectations stay
// readable in a diff and cannot be mangled by an editor re-encoding the file.
// ---------------------------------------------------------------------------

/** Plain single code point emoji. */
const GRINNING = '\u{1F600}';
/** Thumbs up + a skin-tone Emoji_Modifier. */
const THUMBS_UP_TONED = '\u{1F44D}\u{1F3FD}';
/** man + ZWJ + woman + ZWJ + girl. */
const FAMILY_ZWJ = '\u{1F468}‍\u{1F469}‍\u{1F467}';
/** White flag + VS16 + ZWJ + rainbow. */
const RAINBOW_FLAG = '\u{1F3F3}️‍\u{1F308}';
/** Two regional indicators (US). */
const FLAG_US = '\u{1F1FA}\u{1F1F8}';
/** Two regional indicators (GB). */
const FLAG_GB = '\u{1F1EC}\u{1F1E7}';
/** Keycap: digit + VS16 + combining enclosing keycap. */
const KEYCAP_ONE = '1️⃣';

/**
 * England's subdivision flag: black flag + five TAG characters + CANCEL TAG.
 *
 * This is the one shape that the fast regex (layer 1) rejects — tag characters
 * are neither an Emoji_Modifier, VS16 nor a ZWJ join — while Intl.Segmenter
 * still resolves it to a single grapheme. It is therefore the only way to reach
 * the Extended_Pictographic arm of the segmenter branch.
 */
const ENGLAND_TAG_FLAG = '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}';

/**
 * Flag + a trailing VS16. Layer 1 rejects it (regional indicators are not
 * Extended_Pictographic, and the pair is no longer at the end of the string),
 * the segmenter resolves it to one grapheme that matches none of the three
 * arms, and the final fallback regex accepts it. That split makes it the probe
 * for "did the segmenter branch fall through or return?".
 */
const FLAG_US_WITH_VS = FLAG_US + '️';

/** A ZWJ chain of two flags: rejected by layer 1, two graphemes, accepted by the fallback. */
const FLAG_ZWJ_FLAG = FLAG_US + '‍' + FLAG_GB;

const ORIGINAL_SEGMENTER = (Intl as unknown as { Segmenter: unknown }).Segmenter;

/** Removes Intl.Segmenter so the segmenter branch is skipped entirely. */
function removeSegmenter(): void {
  (Intl as unknown as { Segmenter: unknown }).Segmenter = undefined;
}

afterEach(() => {
  // Every segmenter stub must be undone, or it leaks into the next test.
  (Intl as unknown as { Segmenter: unknown }).Segmenter = ORIGINAL_SEGMENTER;
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// detectSingleEmoji
// ---------------------------------------------------------------------------

describe('detectSingleEmoji', () => {
  describe('input guards', () => {
    it('returns false for an empty string', () => {
      expect(detectSingleEmoji('')).toBe(false);
    });

    it('returns false for null and undefined', () => {
      expect(detectSingleEmoji(null as unknown as string)).toBe(false);
      expect(detectSingleEmoji(undefined as unknown as string)).toBe(false);
    });

    it('returns false for a non-string input', () => {
      expect(detectSingleEmoji(42 as unknown as string)).toBe(false);
      expect(detectSingleEmoji({} as unknown as string)).toBe(false);
      expect(detectSingleEmoji([] as unknown as string)).toBe(false);
    });

    it('returns false for a whitespace-only string', () => {
      expect(detectSingleEmoji('   ')).toBe(false);
      expect(detectSingleEmoji('\n\t ')).toBe(false);
    });
  });

  describe('fast regex (layer 1)', () => {
    it('accepts a plain single-code-point emoji', () => {
      expect(detectSingleEmoji(GRINNING)).toBe(true);
    });

    it('accepts an emoji carrying a skin-tone modifier', () => {
      expect(detectSingleEmoji(THUMBS_UP_TONED)).toBe(true);
    });

    it('accepts a ZWJ sequence', () => {
      expect(detectSingleEmoji(FAMILY_ZWJ)).toBe(true);
    });

    it('accepts a ZWJ sequence that also carries VS16', () => {
      expect(detectSingleEmoji(RAINBOW_FLAG)).toBe(true);
    });

    it('accepts a two-char regional-indicator flag', () => {
      expect(detectSingleEmoji(FLAG_US)).toBe(true);
    });

    it('accepts a keycap sequence', () => {
      expect(detectSingleEmoji(KEYCAP_ONE)).toBe(true);
      expect(detectSingleEmoji('#️⃣')).toBe(true);
      // VS16 is optional in the pattern.
      expect(detectSingleEmoji('*⃣')).toBe(true);
    });

    it('trims surrounding whitespace before matching', () => {
      expect(detectSingleEmoji(`  ${GRINNING}\n`)).toBe(true);
    });
  });

  describe('Intl.Segmenter branch (layer 2)', () => {
    it('accepts a tag-sequence flag that the fast regex rejects but the segmenter resolves to one grapheme', () => {
      expect(detectSingleEmoji(ENGLAND_TAG_FLAG)).toBe(true);
    });

    it('rejects a multi-grapheme string before inspecting any segment', () => {
      expect(detectSingleEmoji('ab')).toBe(false);
      expect(detectSingleEmoji('hello')).toBe(false);
    });

    it('rejects a single non-emoji grapheme', () => {
      expect(detectSingleEmoji('a')).toBe(false);
      // A base letter plus a combining acute is still one grapheme.
      expect(detectSingleEmoji('é')).toBe(false);
      // Devanagari consonant cluster: one grapheme, several code points.
      expect(detectSingleEmoji('क्षि')).toBe(false);
    });

    it('evaluates all three arms — pictographic, regional-indicator pair, keycap — and rejects a flag with a trailing VS16', () => {
      // The single grapheme here does not start with Extended_Pictographic, is
      // not exactly a regional-indicator pair, and is not a keycap, so each arm
      // of the return is exercised and the result is false.
      expect(detectSingleEmoji(FLAG_US_WITH_VS)).toBe(false);
    });

    it('rejects a ZWJ chain of two flags, which the segmenter splits into two graphemes', () => {
      expect(detectSingleEmoji(FLAG_ZWJ_FLAG)).toBe(false);
    });

    it('rejects two emoji side by side', () => {
      expect(detectSingleEmoji(GRINNING + GRINNING)).toBe(false);
      expect(detectSingleEmoji(FLAG_US + FLAG_GB)).toBe(false);
    });

    it('rejects an emoji followed by text', () => {
      expect(detectSingleEmoji(`${GRINNING} hi`)).toBe(false);
      expect(detectSingleEmoji(`hi ${GRINNING}`)).toBe(false);
    });
  });

  describe('Intl.Segmenter failure handling', () => {
    it('falls through to the fallback regex when segment() throws, rather than returning', () => {
      const segmenter = (Intl as unknown as { Segmenter: { prototype: { segment: unknown } } })
        .Segmenter;
      const spy = vi
        .spyOn(segmenter.prototype as { segment: () => unknown }, 'segment')
        .mockImplementation(() => {
          throw new Error('segment failed');
        });

      // With a working segmenter this input is false; only the fallback regex
      // accepts it. Getting true back proves the catch did not return early.
      expect(detectSingleEmoji(FLAG_US_WITH_VS)).toBe(true);
      expect(spy).toHaveBeenCalled();
    });

    it('falls through to the fallback regex when the Segmenter constructor throws', () => {
      (Intl as unknown as { Segmenter: unknown }).Segmenter = class {
        constructor() {
          throw new Error('no segmenter for you');
        }
      };

      expect(detectSingleEmoji(FLAG_US_WITH_VS)).toBe(true);
      // The fallback still rejects non-emoji, so the catch is not a blanket yes.
      expect(detectSingleEmoji('a')).toBe(false);
    });
  });

  describe('fallback regex (layer 3)', () => {
    it('accepts a complex ZWJ sequence when the segmenter is unavailable', () => {
      removeSegmenter();
      expect(detectSingleEmoji(FLAG_ZWJ_FLAG)).toBe(true);
      expect(detectSingleEmoji(FLAG_US_WITH_VS)).toBe(true);
    });

    it('rejects ordinary text when the segmenter is unavailable', () => {
      removeSegmenter();
      expect(detectSingleEmoji('hello world')).toBe(false);
      expect(detectSingleEmoji('a')).toBe(false);
    });

    it('rejects the tag-sequence flag when the segmenter is unavailable, since only the segmenter arm accepts it', () => {
      removeSegmenter();
      expect(detectSingleEmoji(ENGLAND_TAG_FLAG)).toBe(false);
    });

    it('still accepts a keycap when the segmenter is unavailable', () => {
      removeSegmenter();
      expect(detectSingleEmoji(KEYCAP_ONE)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// detectSingleEmojiInRichText
// ---------------------------------------------------------------------------

describe('detectSingleEmojiInRichText', () => {
  it('returns false for an empty string', () => {
    expect(detectSingleEmojiInRichText('')).toBe(false);
  });

  it('returns false when there are no wrapping <p> tags, because stripping changed nothing', () => {
    // The guard compares the stripped text against the input: unwrapped html is
    // never treated as rich text, so even a lone emoji is rejected here.
    expect(detectSingleEmojiInRichText(GRINNING)).toBe(false);
    expect(detectSingleEmojiInRichText('hello')).toBe(false);
    expect(detectSingleEmojiInRichText(`<div>${GRINNING}</div>`)).toBe(false);
  });

  it('unwraps a single <p> and delegates to detectSingleEmoji', () => {
    expect(detectSingleEmojiInRichText(`<p>${GRINNING}</p>`)).toBe(true);
    expect(detectSingleEmojiInRichText(`<p>${FLAG_US}</p>`)).toBe(true);
    // Padding inside the paragraph does not defeat detection.
    expect(detectSingleEmojiInRichText(`<p>   ${GRINNING}   </p>`)).toBe(true);
  });

  it('returns false for wrapped plain text', () => {
    expect(detectSingleEmojiInRichText('<p>hello</p>')).toBe(false);
  });

  it('returns false for wrapped text containing two emoji', () => {
    expect(detectSingleEmojiInRichText(`<p>${GRINNING}${GRINNING}</p>`)).toBe(false);
  });

  it('returns false when the unwrapped content still contains a tag', () => {
    expect(detectSingleEmojiInRichText('<p><strong>x</strong></p>')).toBe(false);
    expect(detectSingleEmojiInRichText(`<p><em>${GRINNING}</em></p>`)).toBe(false);
  });

  it('returns false for two sibling paragraphs, whose greedy unwrap leaves inner tags behind', () => {
    expect(detectSingleEmojiInRichText(`<p>${GRINNING}</p><p>x</p>`)).toBe(false);
  });

  it('strips a multi-line paragraph too, thanks to the dot-all flag', () => {
    expect(detectSingleEmojiInRichText(`<p>\n${GRINNING}\n</p>`)).toBe(true);
    expect(detectSingleEmojiInRichText('<p>\nhello\nthere\n</p>')).toBe(false);
  });

  it('does not unwrap a paragraph that carries attributes, because the pattern anchors on a bare <p>', () => {
    // Rich-text editors commonly emit <p dir="ltr">. The strip pattern matches
    // only a bare tag, so the guard sees an unchanged string and bails out.
    expect(detectSingleEmojiInRichText(`<p dir="ltr">${GRINNING}</p>`)).toBe(false);
    expect(detectSingleEmojiInRichText(`<p class="x">${GRINNING}</p>`)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// stripInvalidMentionFormats
// ---------------------------------------------------------------------------

describe('stripInvalidMentionFormats', () => {
  it('returns an empty string for falsy input', () => {
    expect(stripInvalidMentionFormats('')).toBe('');
    expect(stripInvalidMentionFormats(null as unknown as string)).toBe('');
    expect(stripInvalidMentionFormats(undefined as unknown as string)).toBe('');
  });

  it('returns an empty string for a non-string input', () => {
    expect(stripInvalidMentionFormats(7 as unknown as string)).toBe('');
    expect(stripInvalidMentionFormats({} as unknown as string)).toBe('');
  });

  it('preserves a valid uid mention', () => {
    expect(stripInvalidMentionFormats('hi <@uid:u1>')).toBe('hi <@uid:u1>');
  });

  it('preserves a valid all mention', () => {
    expect(stripInvalidMentionFormats('hi <@all:x>')).toBe('hi <@all:x>');
  });

  it('removes a name:display style tag that is not SDK format', () => {
    expect(stripInvalidMentionFormats('hi <@John:Doe>')).toBe('hi ');
  });

  it('removes a bare tag with no prefix', () => {
    expect(stripInvalidMentionFormats('hi <@someone> there')).toBe('hi  there');
  });

  it('removes only the invalid tag when valid and invalid are mixed', () => {
    expect(stripInvalidMentionFormats('<@uid:u1> and <@John:Doe> and <@all:x>')).toBe(
      '<@uid:u1> and  and <@all:x>'
    );
  });

  it('removes every invalid tag, not just the first', () => {
    expect(stripInvalidMentionFormats('a<@x:1>b<@y:2>c<@z:3>d')).toBe('abcd');
  });

  it('leaves text without any tags unchanged', () => {
    expect(stripInvalidMentionFormats('plain text, no mentions')).toBe('plain text, no mentions');
    // An email-ish "@" is not a tag.
    expect(stripInvalidMentionFormats('ping me @john')).toBe('ping me @john');
  });
});

// ---------------------------------------------------------------------------
// getDomainFromUrl
// ---------------------------------------------------------------------------

describe('getDomainFromUrl', () => {
  it('returns the hostname of a full url with a path and query', () => {
    expect(getDomainFromUrl('https://example.com/a/b?q=1')).toBe('example.com');
  });

  it('drops the port from the hostname', () => {
    expect(getDomainFromUrl('https://example.com:8080/a')).toBe('example.com');
  });

  it('keeps the subdomain', () => {
    expect(getDomainFromUrl('https://api.staging.example.com/v1')).toBe('api.staging.example.com');
  });

  it('returns an empty string for an empty url', () => {
    expect(getDomainFromUrl('')).toBe('');
  });

  it('returns an empty string for a string that is not a url', () => {
    expect(getDomainFromUrl('not a url')).toBe('');
  });

  it('returns an empty string for a host with no scheme, which URL cannot parse', () => {
    expect(getDomainFromUrl('example.com')).toBe('');
    expect(getDomainFromUrl('//example.com/a')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// convertMarkdownToHtml
// ---------------------------------------------------------------------------

describe('convertMarkdownToHtml', () => {
  it('returns an empty string for falsy input', () => {
    expect(convertMarkdownToHtml('')).toBe('');
    expect(convertMarkdownToHtml(null as unknown as string)).toBe('');
    expect(convertMarkdownToHtml(undefined as unknown as string)).toBe('');
  });

  it('converts inline code', () => {
    expect(convertMarkdownToHtml('`code`')).toBe('<code>code</code>');
    expect(convertMarkdownToHtml('run `a` then `b`')).toBe(
      'run <code>a</code> then <code>b</code>'
    );
  });

  it('converts double asterisks to strong', () => {
    expect(convertMarkdownToHtml('**bold**')).toBe('<strong>bold</strong>');
  });

  it('converts a single asterisk pair to em', () => {
    expect(convertMarkdownToHtml('*italic*')).toBe('<em>italic</em>');
    expect(convertMarkdownToHtml('*a* and *b*')).toBe('<em>a</em> and <em>b</em>');
  });

  it('applies bold and italic independently in the same string', () => {
    expect(convertMarkdownToHtml('**b** and *i*')).toBe('<strong>b</strong> and <em>i</em>');
  });

  it('leaves an unterminated bold marker alone, because the italic lookarounds skip doubled asterisks', () => {
    // The bold rule needs a closing '**' and finds none. Without the
    // (?<!\*) / (?!\*) guards the italic rule would then match the inner
    // '*a*' and yield '*<em>a</em>'; the guards make it match nothing.
    expect(convertMarkdownToHtml('**a*')).toBe('**a*');
    expect(convertMarkdownToHtml('*a**')).toBe('*a**');
  });

  it('converts double underscores to underline', () => {
    expect(convertMarkdownToHtml('__under__')).toBe('<u>under</u>');
  });

  it('converts a single underscore pair to em', () => {
    expect(convertMarkdownToHtml('_emphasis_')).toBe('<em>emphasis</em>');
  });

  it('applies underline and italic independently in the same string', () => {
    expect(convertMarkdownToHtml('__u__ and _e_')).toBe('<u>u</u> and <em>e</em>');
  });

  it('leaves an unterminated underline marker alone, because the italic lookarounds skip doubled underscores', () => {
    // Mirror of the asterisk case: a naive /_([^_]+)_/ would produce
    // '_<em>a</em>' here.
    expect(convertMarkdownToHtml('__a_')).toBe('__a_');
  });

  it('converts double tildes to strikethrough', () => {
    expect(convertMarkdownToHtml('~~strike~~')).toBe('<s>strike</s>');
  });

  it('converts a markdown link into an anchor with href, target, rel and class', () => {
    const html = convertMarkdownToHtml('[label](https://x.com)');
    expect(html).toContain('href="https://x.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('class="cometchat-link"');
    expect(html).toBe(
      '<a href="https://x.com" target="_blank" rel="noopener noreferrer" class="cometchat-link">label</a>'
    );
  });

  it('converts a plain http link as well as https', () => {
    expect(convertMarkdownToHtml('[l](http://x.com/a)')).toBe(
      '<a href="http://x.com/a" target="_blank" rel="noopener noreferrer" class="cometchat-link">l</a>'
    );
  });

  it('leaves a non-http scheme unconverted, so a javascript: url never becomes an anchor', () => {
    const input = '[label](javascript:alert(1))';
    const html = convertMarkdownToHtml(input);
    expect(html).toBe(input);
    expect(html).not.toContain('<a ');
    expect(html).not.toContain('href');
    expect(convertMarkdownToHtml('[l](data:text/html,<script>)')).not.toContain('<a ');
    expect(convertMarkdownToHtml('[l](ftp://a.com)')).not.toContain('<a ');
  });

  it('applies every transform when several markers appear together', () => {
    expect(
      convertMarkdownToHtml('**b** *i* `c` __u__ _e_ ~~s~~ [l](https://x.com)')
    ).toBe(
      '<strong>b</strong> <em>i</em> <code>c</code> <u>u</u> <em>e</em> <s>s</s> ' +
        '<a href="https://x.com" target="_blank" rel="noopener noreferrer" class="cometchat-link">l</a>'
    );
  });

  it('leaves plain text unchanged', () => {
    expect(convertMarkdownToHtml('plain text with no markers')).toBe(
      'plain text with no markers'
    );
    // A lone marker is not a pair, so nothing is replaced.
    expect(convertMarkdownToHtml('a * b')).toBe('a * b');
    expect(convertMarkdownToHtml('2 ~ 3')).toBe('2 ~ 3');
  });
});
