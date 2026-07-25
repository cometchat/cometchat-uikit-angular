import { describe, it, expect } from 'vitest';
import {
  getAttachmentCount,
  getFirstAttachmentName,
  getMediaPreview,
  getMediaTypeLabel,
  isMediaPreviewType,
} from './message-preview-utils';

/** Minimal stand-in for the SDK MediaMessage surface these helpers touch. */
function mkMedia(over: {
  type?: string;
  names?: string[];
  caption?: string;
  audioType?: string;
} = {}): any {
  const names = over.names ?? ['a.jpg'];
  return {
    getType: () => over.type ?? 'image',
    getCategory: () => 'message',
    getAttachments: () => names.map((n) => ({ getName: () => n })),
    getCaption: () => over.caption ?? '',
    getData: () => undefined,
    getMetadata: () => (over.audioType ? { audioType: over.audioType } : null),
  };
}

describe('isMediaPreviewType / getAttachmentCount / getFirstAttachmentName', () => {
  it('recognises the four media types only', () => {
    for (const t of ['image', 'video', 'audio', 'file']) expect(isMediaPreviewType(t)).toBe(true);
    for (const t of ['text', 'sticker', 'card']) expect(isMediaPreviewType(t)).toBe(false);
  });

  it('counts attachments, never below 1', () => {
    expect(getAttachmentCount(mkMedia({ names: ['a', 'b', 'c'] }))).toBe(3);
    expect(getAttachmentCount(mkMedia({ names: [] }))).toBe(1);
    expect(getAttachmentCount({ getAttachments: () => { throw new Error('boom'); } } as any)).toBe(1);
  });

  it('reads the first attachment name, tolerating absence', () => {
    expect(getFirstAttachmentName(mkMedia({ names: ['x.pdf', 'y.pdf'] }))).toBe('x.pdf');
    expect(getFirstAttachmentName(mkMedia({ names: [] }))).toBe('');
  });
});

describe('getMediaTypeLabel', () => {
  it('is singular for one, counted+plural beyond', () => {
    expect(getMediaTypeLabel('image', 1)).toBe('Image');
    expect(getMediaTypeLabel('image', 3)).toBe('3 Images');
    expect(getMediaTypeLabel('video', 2)).toBe('2 Videos');
    expect(getMediaTypeLabel('audio', 2)).toBe('2 Audio Files');
    expect(getMediaTypeLabel('file', 5)).toBe('5 Files');
  });
});

describe("getMediaPreview — style: 'conversation'", () => {
  const conv = (m: any) => getMediaPreview(m, 'conversation');

  it('one attachment, no caption -> the type label', () => {
    expect(conv(mkMedia({ type: 'image' }))).toBe('Image');
    expect(conv(mkMedia({ type: 'file', names: ['doc.pdf'] }))).toBe('File');
  });

  it('several attachments, no caption -> counted label', () => {
    expect(conv(mkMedia({ type: 'image', names: ['a', 'b', 'c'] }))).toBe('3 Images');
    expect(conv(mkMedia({ type: 'file', names: ['a', 'b'] }))).toBe('2 Files');
  });

  it('caption is appended after a middot, for one OR many', () => {
    expect(conv(mkMedia({ type: 'image', caption: 'nice trip' }))).toBe('Image · nice trip');
    expect(conv(mkMedia({ type: 'image', names: ['a', 'b', 'c'], caption: 'nice trip' }))).toBe(
      '3 Images · nice trip',
    );
  });

  it('a blank caption is not a caption', () => {
    expect(conv(mkMedia({ type: 'image', caption: '   ' }))).toBe('Image');
  });

  it('a voice note short-circuits — no count, no caption', () => {
    const vn = mkMedia({ type: 'audio', audioType: 'voice_note', names: ['a', 'b'], caption: 'hi' });
    expect(conv(vn)).toBe('Voice Note');
  });

  it('the LEGACY camelCase voice-note tag is honoured too', () => {
    expect(conv(mkMedia({ type: 'audio', audioType: 'voiceNote' }))).toBe('Voice Note');
  });

  it('an untagged audio message is a normal audio message', () => {
    expect(conv(mkMedia({ type: 'audio', names: ['a', 'b'] }))).toBe('2 Audio Files');
  });

  it('a non-media type passes through unchanged', () => {
    expect(conv(mkMedia({ type: 'sticker' }))).toBe('sticker');
  });
});

describe("getMediaPreview — style: 'search'", () => {
  const search = (m: any) => getMediaPreview(m, 'search');

  it('one attachment, no caption -> the FILENAME (not the type label)', () => {
    expect(search(mkMedia({ type: 'image', names: ['holiday.jpg'] }))).toBe('holiday.jpg');
  });

  it('falls back to the type label when the filename is unavailable', () => {
    expect(search(mkMedia({ type: 'image', names: [] }))).toBe('Image');
  });

  it('several attachments, no caption -> counted label', () => {
    expect(search(mkMedia({ type: 'image', names: ['a', 'b', 'c'] }))).toBe('3 Images');
  });

  it('one attachment + caption -> the caption alone', () => {
    expect(search(mkMedia({ type: 'file', names: ['doc.pdf'], caption: 'the contract' }))).toBe(
      'the contract',
    );
  });

  it('many images/videos + caption -> caption alone (the count is the +N badge)', () => {
    expect(search(mkMedia({ type: 'image', names: ['a', 'b', 'c'], caption: 'trip' }))).toBe('trip');
    expect(search(mkMedia({ type: 'video', names: ['a', 'b'], caption: 'trip' }))).toBe('trip');
  });

  it('many audio/files + caption -> "N Files · caption" (no badge on those)', () => {
    expect(search(mkMedia({ type: 'file', names: ['a', 'b'], caption: 'specs' }))).toBe(
      '2 Files · specs',
    );
    expect(search(mkMedia({ type: 'audio', names: ['a', 'b', 'c'], caption: 'demo' }))).toBe(
      '3 Audio Files · demo',
    );
  });
});

describe('getMediaPreview — formatting hooks', () => {
  it('formatCaption runs BEFORE formatLabel, so the label can react to it', () => {
    const order: string[] = [];
    getMediaPreview(mkMedia({ type: 'image', names: ['a', 'b'], caption: 'x' }), 'conversation', {
      formatCaption: (c) => { order.push('caption'); return c; },
      formatLabel: (l) => { order.push('label'); return l; },
    });
    expect(order).toEqual(['caption', 'label']);
  });

  it('formatLabel is applied to the label in every branch that shows one', () => {
    const up = { formatLabel: (l: string) => l.toUpperCase() };
    expect(getMediaPreview(mkMedia({ type: 'image' }), 'conversation', up)).toBe('IMAGE');
    expect(
      getMediaPreview(mkMedia({ type: 'file', names: ['a', 'b'], caption: 'c' }), 'search', up),
    ).toBe('2 FILES · c');
  });

  it('formatCaption returning "" suppresses the caption entirely', () => {
    const drop = { formatCaption: () => '' };
    expect(getMediaPreview(mkMedia({ type: 'image', caption: 'hi' }), 'conversation', drop)).toBe(
      'Image',
    );
  });
});
