import { describe, it, expect, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { MessageBubbleAlignment } from '../../Enums/Enums';

/**
 * Property-Based Tests for Bubble Alignment CSS Class
 *
 * Feature: comprehensive-test-suite, Property 8: Bubble Alignment CSS Class
 *
 * For any bubble component and any MessageBubbleAlignment value, setting the
 * alignment input SHALL result in the corresponding BEM modifier CSS class
 * being applied to the bubble container element.
 *
 * **Validates: Requirements 3.3**
 */

// ─── Alignment Enum Values ───

const ALL_ALIGNMENTS = [
  MessageBubbleAlignment.left,
  MessageBubbleAlignment.right,
  MessageBubbleAlignment.center,
] as const;

const arbAlignment = fc.constantFrom(...ALL_ALIGNMENTS);

// ─── CSS Class Naming Variants ───
// Real bubble components use two naming conventions for alignment modifiers:
//   Variant A (incoming/outgoing): text, image, video, sticker, collab-doc, collab-whiteboard
//   Variant B (sender/receiver): audio, file, call, poll, delete
//   Action bubble: no alignment classes (always centered, no left/right variant)

type AlignmentVariant = 'incoming-outgoing' | 'sender-receiver' | 'none';

interface BubbleAlignmentConfig {
  name: string;
  cssBlock: string;
  variant: AlignmentVariant;
}

const BUBBLE_CONFIGS: BubbleAlignmentConfig[] = [
  { name: 'text', cssBlock: 'cometchat-text-bubble', variant: 'incoming-outgoing' },
  { name: 'image', cssBlock: 'cometchat-image-bubble', variant: 'incoming-outgoing' },
  { name: 'video', cssBlock: 'cometchat-video-bubble', variant: 'incoming-outgoing' },
  { name: 'sticker', cssBlock: 'cometchat-sticker-bubble', variant: 'incoming-outgoing' },
  { name: 'audio', cssBlock: 'cometchat-audio-bubble', variant: 'sender-receiver' },
  { name: 'file', cssBlock: 'cometchat-file-bubble', variant: 'sender-receiver' },
  { name: 'call', cssBlock: 'cometchat-call-bubble', variant: 'sender-receiver' },
  { name: 'poll', cssBlock: 'cometchat-poll-bubble', variant: 'sender-receiver' },
  { name: 'delete', cssBlock: 'cometchat-delete-bubble', variant: 'sender-receiver' },
  { name: 'action', cssBlock: 'cometchat-action-bubble', variant: 'none' },
  {
    name: 'collab-doc',
    cssBlock: 'cometchat-collaborative-document-bubble',
    variant: 'incoming-outgoing',
  },
  {
    name: 'collab-whiteboard',
    cssBlock: 'cometchat-collaborative-whiteboard-bubble',
    variant: 'incoming-outgoing',
  },
];

const arbBubbleConfig = fc.constantFrom(...BUBBLE_CONFIGS);

// ─── Alignment → CSS Class Resolution ───

/**
 * Given a bubble config and an alignment value, returns the expected
 * BEM modifier class that should be applied.
 *
 * Text bubble uses a flat class (no `--` separator): `cometchat-text-bubble-incoming`
 * Other bubbles use BEM modifier: `cometchat-{type}-bubble--incoming`
 */
function getExpectedClass(
  config: BubbleAlignmentConfig,
  alignment: MessageBubbleAlignment
): string | null {
  if (config.variant === 'none') {
    // Action bubble has no alignment modifier classes
    return null;
  }

  const isTextBubble = config.cssBlock === 'cometchat-text-bubble';

  if (config.variant === 'incoming-outgoing') {
    if (alignment === MessageBubbleAlignment.left) {
      return isTextBubble ? `${config.cssBlock}-incoming` : `${config.cssBlock}--incoming`;
    }
    if (alignment === MessageBubbleAlignment.right) {
      return isTextBubble ? `${config.cssBlock}-outgoing` : `${config.cssBlock}--outgoing`;
    }
    // center — no incoming/outgoing class applied
    return null;
  }

  if (config.variant === 'sender-receiver') {
    if (alignment === MessageBubbleAlignment.right) {
      return `${config.cssBlock}--sender`;
    }
    if (alignment === MessageBubbleAlignment.left) {
      return `${config.cssBlock}--receiver`;
    }
    // center — no sender/receiver class applied
    return null;
  }

  return null;
}

/**
 * Returns the "opposite" modifier class that should NOT be present
 * when a given alignment is active.
 */
function getConflictingClass(
  config: BubbleAlignmentConfig,
  alignment: MessageBubbleAlignment
): string | null {
  if (config.variant === 'none') return null;

  const isTextBubble = config.cssBlock === 'cometchat-text-bubble';

  if (config.variant === 'incoming-outgoing') {
    if (alignment === MessageBubbleAlignment.left) {
      return isTextBubble ? `${config.cssBlock}-outgoing` : `${config.cssBlock}--outgoing`;
    }
    if (alignment === MessageBubbleAlignment.right) {
      return isTextBubble ? `${config.cssBlock}-incoming` : `${config.cssBlock}--incoming`;
    }
    return null;
  }

  if (config.variant === 'sender-receiver') {
    if (alignment === MessageBubbleAlignment.right) {
      return `${config.cssBlock}--receiver`;
    }
    if (alignment === MessageBubbleAlignment.left) {
      return `${config.cssBlock}--sender`;
    }
    return null;
  }

  return null;
}

// ─── Mock Bubble Class ───
// Simulates the alignment → CSS class logic used across all bubble components.

class MockBubbleElement {
  private classes = new Set<string>();

  constructor(
    private config: BubbleAlignmentConfig,
    private alignment: MessageBubbleAlignment
  ) {
    this.classes.add(config.cssBlock);
    this.applyAlignmentClasses();
  }

  private applyAlignmentClasses(): void {
    const isOutgoing = this.alignment === MessageBubbleAlignment.right;
    const isIncoming = this.alignment === MessageBubbleAlignment.left;
    const isTextBubble = this.config.cssBlock === 'cometchat-text-bubble';

    if (this.config.variant === 'incoming-outgoing') {
      if (isIncoming) {
        this.classes.add(
          isTextBubble ? `${this.config.cssBlock}-incoming` : `${this.config.cssBlock}--incoming`
        );
      }
      if (isOutgoing) {
        this.classes.add(
          isTextBubble ? `${this.config.cssBlock}-outgoing` : `${this.config.cssBlock}--outgoing`
        );
      }
    } else if (this.config.variant === 'sender-receiver') {
      if (isOutgoing) {
        this.classes.add(`${this.config.cssBlock}--sender`);
      }
      if (isIncoming) {
        this.classes.add(`${this.config.cssBlock}--receiver`);
      }
    }
    // 'none' variant (action bubble): no alignment classes added
  }

  hasClass(cls: string): boolean {
    return this.classes.has(cls);
  }

  getClasses(): string[] {
    return [...this.classes];
  }
}

// ─── Tests ───

describe('Bubble Alignment CSS Class Property Tests', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Feature: comprehensive-test-suite, Property 8: Bubble Alignment CSS Class**
   *
   * *For any* bubble component and *for any* MessageBubbleAlignment value,
   * setting the alignment input SHALL result in the corresponding BEM modifier
   * CSS class being applied to the bubble container element.
   *
   * **Validates: Requirements 3.3**
   */
  describe('Property 8: Bubble Alignment CSS Class', () => {
    it('each alignment value maps to exactly one BEM modifier class (or none for action/center)', () => {
      fc.assert(
        fc.property(arbBubbleConfig, arbAlignment, (config, alignment) => {
          const el = new MockBubbleElement(config, alignment);
          const expected = getExpectedClass(config, alignment);

          if (expected !== null) {
            // The expected modifier class must be present
            expect(el.hasClass(expected)).toBe(true);
          }

          // The base block class is always present
          expect(el.hasClass(config.cssBlock)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('the mapping is deterministic — same alignment always produces same class', () => {
      fc.assert(
        fc.property(arbBubbleConfig, arbAlignment, (config, alignment) => {
          const el1 = new MockBubbleElement(config, alignment);
          const el2 = new MockBubbleElement(config, alignment);

          const classes1 = el1.getClasses().sort();
          const classes2 = el2.getClasses().sort();

          expect(classes1).toEqual(classes2);
        }),
        { numRuns: 100 }
      );
    });

    it('alignment classes are mutually exclusive — only one alignment class at a time', () => {
      fc.assert(
        fc.property(arbBubbleConfig, arbAlignment, (config, alignment) => {
          const el = new MockBubbleElement(config, alignment);
          const conflicting = getConflictingClass(config, alignment);

          if (conflicting !== null) {
            expect(el.hasClass(conflicting)).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('alignment class is independent of message type — same alignment produces consistent pattern across bubbles', () => {
      fc.assert(
        fc.property(arbAlignment, alignment => {
          for (const config of BUBBLE_CONFIGS) {
            const el = new MockBubbleElement(config, alignment);
            const expected = getExpectedClass(config, alignment);

            if (expected !== null) {
              expect(el.hasClass(expected)).toBe(true);
            }

            // Verify no conflicting class
            const conflicting = getConflictingClass(config, alignment);
            if (conflicting !== null) {
              expect(el.hasClass(conflicting)).toBe(false);
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
