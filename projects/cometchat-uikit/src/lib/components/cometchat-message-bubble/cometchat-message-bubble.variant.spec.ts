/**
 * CometChatMessageBubble — alignment vs variant
 *
 * `alignment` used to decide three things at once: which side the bubble sits
 * on, which palette it wears, and where its options go. A list of messages —
 * the pinned panel — needs the first and third to say "left" while the second
 * still says "yours", so `variant` splits the palette off.
 *
 * These cover the split itself: that a bubble with no `variant` behaves exactly
 * as it always did, and that one with a `variant` keeps the colour without
 * taking the side.
 *
 * @module components/cometchat-message-bubble
 */

// The calls SDK pulls in a JitsiMeetJS runtime that does not exist in jsdom.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChatMessageBubbleComponent } from './cometchat-message-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';

describe('CometChatMessageBubbleComponent — variant', () => {
  let fixture: ComponentFixture<CometChatMessageBubbleComponent>;
  let bubble: CometChatMessageBubbleComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatMessageBubbleComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CometChatMessageBubbleComponent);
    bubble = fixture.componentInstance;
  });

  afterEach(() => fixture?.destroy());

  describe('without a variant — the conversation', () => {
    it('takes the palette from the side it sits on', () => {
      bubble.alignment = MessageBubbleAlignment.right;
      expect(bubble.bubbleClassName).toBe('cometchat-message-bubble-outgoing');
      expect(bubble.isOutgoingStyle).toBe(true);

      bubble.alignment = MessageBubbleAlignment.left;
      expect(bubble.bubbleClassName).toBe('cometchat-message-bubble-incoming');
      expect(bubble.isOutgoingStyle).toBe(false);
    });

    it('needs none of the left-column corrections', () => {
      bubble.alignment = MessageBubbleAlignment.right;
      expect(bubble.isColourOnlyOutgoing).toBe(false);
      bubble.alignment = MessageBubbleAlignment.left;
      expect(bubble.isColourOnlyOutgoing).toBe(false);
    });
  });

  describe('with a variant — a list of messages', () => {
    it('wears the outgoing colour while sitting on the left', () => {
      bubble.alignment = MessageBubbleAlignment.left;
      bubble.variant = 'outgoing';

      expect(bubble.bubbleClassName).toBe('cometchat-message-bubble-outgoing');
      expect(bubble.isOutgoingStyle).toBe(true);
      // …and asks for the modifier that undoes the class's rightward pull.
      expect(bubble.isColourOnlyOutgoing).toBe(true);
    });

    it('renders someone else\'s message as an ordinary incoming bubble', () => {
      bubble.alignment = MessageBubbleAlignment.left;
      bubble.variant = 'incoming';

      expect(bubble.bubbleClassName).toBe('cometchat-message-bubble-incoming');
      expect(bubble.isColourOnlyOutgoing).toBe(false);
    });

    it('leaves an action bubble alone', () => {
      // Centre is neither side, so a variant has nothing to say about it —
      // reading it as one would give a group-action notice a message palette.
      bubble.alignment = MessageBubbleAlignment.center;
      bubble.variant = 'outgoing';

      expect(bubble.colourAlignment).toBe(MessageBubbleAlignment.center);
      expect(bubble.bubbleClassName).toBe('cometchat-message-bubble-action');
      expect(bubble.isColourOnlyOutgoing).toBe(false);
    });
  });
});
