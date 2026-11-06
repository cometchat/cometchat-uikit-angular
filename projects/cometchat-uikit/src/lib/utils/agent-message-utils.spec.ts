/**
 * Agent message text extraction Tests
 *
 * Covers: copy text (cards skipped, newline-joined) and subtitle text (card
 * fallbackText included, space-joined), element shapes, fallbacks to the
 * outer assistant text, and throwing accessors.
 *
 * @module utils/agent-message-utils
 */

import { describe, it, expect } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { getAgentMessageCopyText, getAgentMessageSubtitleText } from './agent-message-utils';

type El = { type?: string; data?: unknown; noGetData?: boolean };

function el({ type = 'text', data, noGetData }: El) {
  return {
    getType: () => type,
    ...(noGetData ? {} : { getData: () => data }),
  };
}

function makeAiMessage(opts: {
  elements?: unknown[] | (() => never);
  outerText?: string;
  outerThrows?: boolean;
}): CometChat.BaseMessage {
  const msg: Record<string, unknown> = {};
  if (opts.elements !== undefined) {
    msg['getElements'] = typeof opts.elements === 'function' ? opts.elements : () => opts.elements;
  }
  msg['getAssistantMessageData'] = () => {
    if (opts.outerThrows) throw new Error('boom');
    return { getText: () => opts.outerText };
  };
  return msg as unknown as CometChat.BaseMessage;
}

describe('getAgentMessageCopyText', () => {
  it('joins string and {text} element data with newlines', () => {
    const msg = makeAiMessage({
      elements: [el({ data: 'Hello' }), el({ data: { text: 'World' } })],
    });
    expect(getAgentMessageCopyText(msg)).toBe('Hello\nWorld');
  });

  it('skips card elements', () => {
    const msg = makeAiMessage({
      elements: [el({ data: 'Before' }), el({ type: 'card', data: { fallbackText: 'CARD' } }), el({ data: 'After' })],
    });
    expect(getAgentMessageCopyText(msg)).toBe('Before\nAfter');
  });

  it('skips elements with empty text, missing text or no getData', () => {
    const msg = makeAiMessage({
      elements: [el({ data: '' }), el({ data: {} }), el({ data: null }), el({ noGetData: true }), el({ data: 'Only' })],
    });
    expect(getAgentMessageCopyText(msg)).toBe('Only');
  });

  it('trims surrounding whitespace of the combined text', () => {
    const msg = makeAiMessage({ elements: [el({ data: '  padded  ' })] });
    expect(getAgentMessageCopyText(msg)).toBe('padded');
  });

  it('falls back to the outer text when every element is a card', () => {
    const msg = makeAiMessage({
      elements: [el({ type: 'card', data: { fallbackText: 'x' } })],
      outerText: 'outer',
    });
    expect(getAgentMessageCopyText(msg)).toBe('outer');
  });

  it('falls back to the outer text when elements are whitespace only', () => {
    const msg = makeAiMessage({ elements: [el({ data: '   ' })], outerText: 'outer' });
    expect(getAgentMessageCopyText(msg)).toBe('outer');
  });

  it('falls back to the outer text when the elements array is empty', () => {
    expect(getAgentMessageCopyText(makeAiMessage({ elements: [], outerText: 'outer' }))).toBe('outer');
  });

  it('falls back to the outer text when getElements is missing', () => {
    expect(getAgentMessageCopyText(makeAiMessage({ outerText: 'outer' }))).toBe('outer');
  });

  it('falls back to the outer text when getElements throws', () => {
    const msg = makeAiMessage({
      elements: () => {
        throw new Error('bad');
      },
      outerText: 'outer',
    });
    expect(getAgentMessageCopyText(msg)).toBe('outer');
  });

  it('returns an empty string when the outer accessor throws', () => {
    expect(getAgentMessageCopyText(makeAiMessage({ elements: [], outerThrows: true }))).toBe('');
  });

  it('returns an empty string when the outer text is undefined', () => {
    expect(getAgentMessageCopyText(makeAiMessage({ elements: [] }))).toBe('');
  });

  it('returns an empty string for a plain object with no accessors', () => {
    expect(getAgentMessageCopyText({} as CometChat.BaseMessage)).toBe('');
  });
});

describe('getAgentMessageSubtitleText', () => {
  it('joins element text with spaces', () => {
    const msg = makeAiMessage({ elements: [el({ data: 'Hello' }), el({ data: { text: 'there' } })] });
    expect(getAgentMessageSubtitleText(msg)).toBe('Hello there');
  });

  it('includes a card fallbackText nested under data.card', () => {
    const msg = makeAiMessage({
      elements: [el({ data: 'Intro' }), el({ type: 'card', data: { card: { fallbackText: 'Weather card' } } })],
    });
    expect(getAgentMessageSubtitleText(msg)).toBe('Intro Weather card');
  });

  it('includes a card fallbackText placed directly on data', () => {
    const msg = makeAiMessage({ elements: [el({ type: 'card', data: { fallbackText: 'Flat card' } })] });
    expect(getAgentMessageSubtitleText(msg)).toBe('Flat card');
  });

  it('skips a card with no payload or no fallbackText', () => {
    const msg = makeAiMessage({
      elements: [el({ type: 'card', data: null }), el({ type: 'card', data: { card: {} } }), el({ data: 'Text' })],
    });
    expect(getAgentMessageSubtitleText(msg)).toBe('Text');
  });

  it('falls back to the outer text when nothing produces text', () => {
    const msg = makeAiMessage({
      elements: [el({ type: 'card', data: { card: {} } }), el({ data: '' })],
      outerText: 'outer',
    });
    expect(getAgentMessageSubtitleText(msg)).toBe('outer');
  });

  it('falls back to the outer text when getElements throws', () => {
    const msg = makeAiMessage({
      elements: () => {
        throw new Error('bad');
      },
      outerText: 'outer',
    });
    expect(getAgentMessageSubtitleText(msg)).toBe('outer');
  });

  it('returns an empty string when the outer accessor throws', () => {
    expect(getAgentMessageSubtitleText(makeAiMessage({ elements: [], outerThrows: true }))).toBe('');
  });

  it('returns an empty string for a plain object with no accessors', () => {
    expect(getAgentMessageSubtitleText({} as CometChat.BaseMessage)).toBe('');
  });
});
