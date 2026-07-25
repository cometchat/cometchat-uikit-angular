import { describe, it, expect } from 'vitest';
import {
  getAudioType,
  getBatchId,
  getMediaCaption,
  hasMediaCaption,
  isMediaMessage,
  isVoiceNote,
  stampBatchMetadata,
} from './message-metadata-utils';
import { CometChatUIKitConstants } from '../constants';

/** Minimal stand-in for the SDK message surface these helpers touch. */
function mkMessage(over: {
  type?: string;
  category?: string;
  metadata?: Record<string, unknown> | null;
  caption?: string;
  data?: Record<string, unknown>;
} = {}): any {
  let metadata = over.metadata ?? null;
  let caption = over.caption ?? '';
  return {
    getType: () => over.type ?? 'image',
    getCategory: () => over.category ?? 'message',
    getMetadata: () => metadata,
    setMetadata: (m: Record<string, unknown>) => { metadata = m; },
    getCaption: () => caption,
    setCaption: (c: string) => { caption = c; },
    getData: () => over.data,
  };
}

describe('isVoiceNote', () => {
  it('accepts the cross-platform "voice_note" value', () => {
    expect(isVoiceNote(mkMessage({ metadata: { audioType: 'voice_note' } }))).toBe(true);
  });

  it('still accepts the legacy camelCase "voiceNote" this kit used to write', () => {
    // Voice notes already persisted in a conversation must keep rendering as waveforms.
    expect(isVoiceNote(mkMessage({ metadata: { audioType: 'voiceNote' } }))).toBe(true);
  });

  it('treats an absent or unrelated audioType as NOT a voice note', () => {
    expect(isVoiceNote(mkMessage({ metadata: {} }))).toBe(false);
    expect(isVoiceNote(mkMessage({ metadata: null }))).toBe(false);
    expect(isVoiceNote(mkMessage({ metadata: { audioType: 'podcast' } }))).toBe(false);
    expect(isVoiceNote(null)).toBe(false);
  });

  it('the constant this kit WRITES matches React/iOS/Android', () => {
    expect(CometChatUIKitConstants.AudioType.voiceNote).toBe('voice_note');
  });
});

describe('getAudioType / getBatchId', () => {
  it('reads the raw tag, or undefined/null when absent', () => {
    expect(getAudioType(mkMessage({ metadata: { audioType: 'voice_note' } }))).toBe('voice_note');
    expect(getAudioType(mkMessage({ metadata: {} }))).toBeUndefined();
    expect(getBatchId(mkMessage({ metadata: { batchId: 'b1' } }))).toBe('b1');
    expect(getBatchId(mkMessage({ metadata: { batchId: '' } }))).toBeNull();
    expect(getBatchId(mkMessage({ metadata: null }))).toBeNull();
  });
});

describe('stampBatchMetadata', () => {
  it('merges rather than clobbering metadata the SDK/app already set', () => {
    const msg = mkMessage({ metadata: { richText: true, audioType: 'voice_note' } });
    stampBatchMetadata(msg, { batchId: 'b1' });
    expect(msg.getMetadata()).toEqual({ richText: true, audioType: 'voice_note', batchId: 'b1' });
  });

  it('sets the caption through setCaption, and only when provided', () => {
    const msg = mkMessage({ caption: 'original' });
    stampBatchMetadata(msg, { batchId: 'b1' });
    expect(msg.getCaption()).toBe('original');
    stampBatchMetadata(msg, { batchId: 'b1', caption: 'new' });
    expect(msg.getCaption()).toBe('new');
  });

  it('writes audioType when asked', () => {
    const msg = mkMessage();
    stampBatchMetadata(msg, { audioType: CometChatUIKitConstants.AudioType.voiceNote });
    expect(msg.getMetadata()).toEqual({ audioType: 'voice_note' });
  });

  it('round-trips: what the voice-note composer writes, the bubble router reads back', () => {
    const msg = mkMessage({ type: 'audio' });
    stampBatchMetadata(msg, { audioType: CometChatUIKitConstants.AudioType.voiceNote });
    expect(isVoiceNote(msg)).toBe(true);
  });
});

describe('isMediaMessage', () => {
  it('is true for image/video/audio/file in the message category', () => {
    for (const type of ['image', 'video', 'audio', 'file']) {
      expect(isMediaMessage(mkMessage({ type }))).toBe(true);
    }
  });

  it('is false for text, and for media types outside the message category', () => {
    expect(isMediaMessage(mkMessage({ type: 'text' }))).toBe(false);
    expect(isMediaMessage(mkMessage({ type: 'image', category: 'custom' }))).toBe(false);
    expect(isMediaMessage(null)).toBe(false);
  });
});

describe('getMediaCaption / hasMediaCaption', () => {
  it('prefers getCaption(), falling back to data.text', () => {
    expect(getMediaCaption(mkMessage({ caption: 'hi' }))).toBe('hi');
    expect(getMediaCaption(mkMessage({ caption: '', data: { text: 'from data' } }))).toBe('from data');
    expect(getMediaCaption(mkMessage({ caption: '' }))).toBe('');
  });

  it('gates Copy/Edit: only media WITH a non-blank caption qualifies', () => {
    expect(hasMediaCaption(mkMessage({ caption: 'hi' }))).toBe(true);
    expect(hasMediaCaption(mkMessage({ caption: '   ' }))).toBe(false);
    expect(hasMediaCaption(mkMessage({ caption: '' }))).toBe(false);
    // A text message is not "media with a caption" — it takes the text path.
    expect(hasMediaCaption(mkMessage({ type: 'text', caption: 'hi' }))).toBe(false);
  });
});
