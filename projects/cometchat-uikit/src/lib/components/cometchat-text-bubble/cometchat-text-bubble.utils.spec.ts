import { describe, it, expect } from 'vitest';
import { extractMessageText } from './cometchat-text-bubble.utils';

/**
 * extractMessageText is used by the text bubble both standalone (TextMessage) and NESTED inside the
 * image/video/file media bubbles to render their CAPTION. A CometChat.MediaMessage has no getText();
 * its caption lives in data.text (getCaption()). This guards that the caption still renders.
 */
describe('extractMessageText', () => {
  it('returns the text of a TextMessage (getText)', () => {
    const msg = { getText: () => 'hello world' } as any;
    expect(extractMessageText(msg)).toBe('hello world');
  });

  it('falls back to data.text for a MediaMessage caption (no getText)', () => {
    // Shape of a real MediaMessage: no getText(), caption stored in data.text.
    const mediaMsg = { getData: () => ({ text: 'my caption' }) } as any;
    expect(extractMessageText(mediaMsg)).toBe('my caption');
  });

  it('prefers getText over data.text when both are present', () => {
    const msg = { getText: () => 'primary', getData: () => ({ text: 'fallback' }) } as any;
    expect(extractMessageText(msg)).toBe('primary');
  });

  it('returns empty string when neither is present / message is nullish', () => {
    expect(extractMessageText({ getData: () => ({}) } as any)).toBe('');
    expect(extractMessageText({ getText: () => '' } as any)).toBe('');
    expect(extractMessageText(null)).toBe('');
    expect(extractMessageText(undefined)).toBe('');
  });
});
