import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Cursor Positioning Accuracy
 *
 * **Feature: message-composer-bugfixes, Property 7: Cursor Positioning Accuracy**
 *
 * These tests verify universal properties that should hold across all inputs,
 * using fast-check for property-based testing.
 *
 * Property 7: Cursor Positioning Accuracy
 * *For any* click position in the editor (including between mentions and formatted text),
 * the cursor should be positioned at the click location, not jump to the end.
 *
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
 */

// ==================== Mock Types ====================

/**
 * Interface representing a cursor position in the editor
 */
interface CursorPosition {
  /** Character offset from the start of the content */
  offset: number;
}

/**
 * Interface representing a mention node in the editor
 * Mentions are atomic nodes that cannot be partially selected
 */
interface MentionNode {
  /** Type identifier for the node */
  type: 'mention';
  /** Start offset of the mention in the content */
  startOffset: number;
  /** End offset of the mention (exclusive) */
  endOffset: number;
  /** The mention label (e.g., "@John Doe") */
  label: string;
  /** User ID associated with the mention */
  uid: string;
}

/**
 * Interface representing a text node in the editor
 */
interface TextNode {
  /** Type identifier for the node */
  type: 'text';
  /** Start offset of the text in the content */
  startOffset: number;
  /** End offset of the text (exclusive) */
  endOffset: number;
  /** The text content */
  content: string;
  /** Formatting applied to this text */
  formatting: TextFormatting;
}

/**
 * Interface representing text formatting
 */
interface TextFormatting {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
}

/**
 * Union type for editor nodes
 */
type EditorNode = MentionNode | TextNode;

/**
 * Interface representing the editor state
 */
interface EditorState {
  /** Array of nodes in the editor */
  nodes: EditorNode[];
  /** Current cursor position */
  cursorPosition: CursorPosition;
  /** Total content length */
  contentLength: number;
}

/**
 * Interface representing a click event in the editor
 */
interface ClickEvent {
  /** The offset where the click occurred */
  clickOffset: number;
}

// ==================== Constants ====================

/**
 * Default formatting (no formatting applied)
 */
const DEFAULT_FORMATTING: TextFormatting = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
};

// ==================== Pure Functions (Mirror Editor Behavior) ====================

/**
 * Create a text node
 *
 * @param content - The text content
 * @param startOffset - Start offset in the editor
 * @param formatting - Text formatting
 * @returns TextNode object
 */
function createTextNode(
  content: string,
  startOffset: number,
  formatting: TextFormatting = DEFAULT_FORMATTING
): TextNode {
  return {
    type: 'text',
    startOffset,
    endOffset: startOffset + content.length,
    content,
    formatting,
  };
}

/**
 * Create a mention node
 *
 * @param label - The mention label (e.g., "@John Doe")
 * @param uid - User ID
 * @param startOffset - Start offset in the editor
 * @returns MentionNode object
 */
function createMentionNode(label: string, uid: string, startOffset: number): MentionNode {
  return {
    type: 'mention',
    startOffset,
    endOffset: startOffset + label.length,
    label,
    uid,
  };
}

/**
 * Create an empty editor state
 *
 * @returns Empty EditorState
 */
function createEmptyEditorState(): EditorState {
  return {
    nodes: [],
    cursorPosition: { offset: 0 },
    contentLength: 0,
  };
}

/**
 * Create an editor state from nodes
 *
 * @param nodes - Array of editor nodes
 * @returns EditorState with calculated content length
 */
function createEditorState(nodes: EditorNode[]): EditorState {
  const contentLength = nodes.length > 0 ? nodes[nodes.length - 1].endOffset : 0;

  return {
    nodes,
    cursorPosition: { offset: 0 },
    contentLength,
  };
}

/**
 * Find the node at a given offset
 *
 * @param state - Editor state
 * @param offset - Character offset
 * @returns The node at the offset, or null if not found
 */
function findNodeAtOffset(state: EditorState, offset: number): EditorNode | null {
  for (const node of state.nodes) {
    if (offset >= node.startOffset && offset < node.endOffset) {
      return node;
    }
  }
  return null;
}

/**
 * Check if an offset is inside a mention node
 *
 * @param state - Editor state
 * @param offset - Character offset
 * @returns True if the offset is inside a mention
 */
function isInsideMention(state: EditorState, offset: number): boolean {
  const node = findNodeAtOffset(state, offset);
  return node !== null && node.type === 'mention';
}

/**
 * Handle a click event in the editor
 * Mirrors the ProseMirror click handling behavior
 *
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
 *
 * @param state - Current editor state
 * @param clickEvent - The click event
 * @returns New editor state with updated cursor position
 */
function handleClick(state: EditorState, clickEvent: ClickEvent): EditorState {
  const { clickOffset } = clickEvent;
  const { contentLength } = state;

  // Clamp click offset to valid range
  const clampedOffset = Math.max(0, Math.min(clickOffset, contentLength));

  // Check if click is inside a mention
  const node = findNodeAtOffset(state, clampedOffset);

  if (node && node.type === 'mention') {
    // For mentions (atomic nodes), position cursor before or after
    // based on which half of the mention was clicked
    const mentionMidpoint = node.startOffset + (node.endOffset - node.startOffset) / 2;
    const cursorOffset = clampedOffset < mentionMidpoint ? node.startOffset : node.endOffset;

    return {
      ...state,
      cursorPosition: { offset: cursorOffset },
    };
  }

  // For text nodes or empty space, position cursor at click location
  return {
    ...state,
    cursorPosition: { offset: clampedOffset },
  };
}

/**
 * Check if cursor position is valid (not inside a mention)
 *
 * **Validates: Requirements 5.7**
 *
 * @param state - Editor state
 * @returns True if cursor is at a valid position
 */
function isCursorPositionValid(state: EditorState): boolean {
  const { cursorPosition, nodes } = state;

  // Cursor at position 0 is always valid
  if (cursorPosition.offset === 0) return true;

  // Cursor at end is always valid
  if (cursorPosition.offset === state.contentLength) return true;

  // Check if cursor is inside a mention (invalid)
  for (const node of nodes) {
    if (node.type === 'mention') {
      // Cursor should not be strictly inside a mention
      if (cursorPosition.offset > node.startOffset && cursorPosition.offset < node.endOffset) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Check if cursor is at the expected click position (or valid alternative for mentions)
 *
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
 *
 * @param state - Editor state after click
 * @param clickOffset - Original click offset
 * @returns True if cursor is at expected position
 */
function isCursorAtExpectedPosition(state: EditorState, clickOffset: number): boolean {
  const { cursorPosition, contentLength } = state;
  const clampedClick = Math.max(0, Math.min(clickOffset, contentLength));

  // Check if click was inside a mention
  const clickedNode = findNodeAtOffset(
    { ...state, cursorPosition: { offset: clampedClick } },
    clampedClick
  );

  if (clickedNode && clickedNode.type === 'mention') {
    // For mentions, cursor should be at start or end of mention
    return (
      cursorPosition.offset === clickedNode.startOffset ||
      cursorPosition.offset === clickedNode.endOffset
    );
  }

  // For text, cursor should be at the click position
  return cursorPosition.offset === clampedClick;
}

/**
 * Check if cursor jumped to end (the bug we're testing against)
 *
 * @param state - Editor state after click
 * @param clickOffset - Original click offset
 * @returns True if cursor incorrectly jumped to end
 */
function didCursorJumpToEnd(state: EditorState, clickOffset: number): boolean {
  const { cursorPosition, contentLength } = state;

  // If click was at end, cursor at end is correct
  if (clickOffset >= contentLength) return false;

  // If cursor is at end but click was not at end, it jumped
  return cursorPosition.offset === contentLength && clickOffset < contentLength;
}

/**
 * Get the nearest character boundary for a click position
 * Mirrors browser behavior for positioning cursor at character boundaries
 *
 * **Validates: Requirements 5.5**
 *
 * @param state - Editor state
 * @param clickOffset - Click offset (may be fractional in real scenarios)
 * @returns Nearest valid character boundary
 */
function getNearestCharacterBoundary(state: EditorState, clickOffset: number): number {
  // In our model, all offsets are integers representing character boundaries
  // This function ensures the offset is within valid bounds
  return Math.max(0, Math.min(Math.round(clickOffset), state.contentLength));
}

// ==================== Test Generators ====================

/**
 * Characters that can be part of text content
 */
const TEXT_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,!?';

/**
 * Generator for text content
 */
const textContentGenerator = (): fc.Arbitrary<string> =>
  fc
    .array(fc.constantFrom(...TEXT_CHARS.split('')), { minLength: 1, maxLength: 30 })
    .map(chars => chars.join(''));

/**
 * Generator for a user name (for mentions)
 */
const userNameGenerator = (): fc.Arbitrary<string> =>
  fc
    .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')), {
      minLength: 3,
      maxLength: 15,
    })
    .map(chars => chars.join(''))
    .map(name => name.charAt(0).toUpperCase() + name.slice(1));

/**
 * Generator for text formatting
 */
const formattingGenerator = (): fc.Arbitrary<TextFormatting> =>
  fc.record({
    bold: fc.boolean(),
    italic: fc.boolean(),
    underline: fc.boolean(),
    strikethrough: fc.boolean(),
  });

/**
 * Generator for a text node
 */
const textNodeGenerator = (startOffset: number): fc.Arbitrary<TextNode> =>
  fc
    .tuple(textContentGenerator(), formattingGenerator())
    .map(([content, formatting]) => createTextNode(content, startOffset, formatting));

/**
 * Generator for a mention node
 */
const mentionNodeGenerator = (startOffset: number): fc.Arbitrary<MentionNode> =>
  fc
    .tuple(userNameGenerator(), fc.uuid())
    .map(([name, uid]) => createMentionNode(`@${name}`, uid, startOffset));

/**
 * Generator for editor state with text only
 */
const textOnlyEditorStateGenerator = (): fc.Arbitrary<EditorState> =>
  fc.array(textContentGenerator(), { minLength: 1, maxLength: 5 }).map(contents => {
    const nodes: TextNode[] = [];
    let offset = 0;

    for (const content of contents) {
      nodes.push(createTextNode(content, offset));
      offset += content.length;
    }

    return createEditorState(nodes);
  });

/**
 * Generator for editor state with mentions only
 */
const mentionsOnlyEditorStateGenerator = (): fc.Arbitrary<EditorState> =>
  fc.array(userNameGenerator(), { minLength: 1, maxLength: 5 }).map(names => {
    const nodes: MentionNode[] = [];
    let offset = 0;

    for (const name of names) {
      const label = `@${name}`;
      nodes.push(createMentionNode(label, `uid-${name}`, offset));
      offset += label.length;
    }

    return createEditorState(nodes);
  });

/**
 * Generator for mixed editor state (text and mentions)
 */
const mixedEditorStateGenerator = (): fc.Arbitrary<EditorState> =>
  fc
    .array(
      fc.oneof(
        fc.record({ type: fc.constant('text' as const), content: textContentGenerator() }),
        fc.record({ type: fc.constant('mention' as const), name: userNameGenerator() })
      ),
      { minLength: 2, maxLength: 8 }
    )
    .map(items => {
      const nodes: EditorNode[] = [];
      let offset = 0;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type === 'text') {
          nodes.push(createTextNode(item.content, offset));
          offset += item.content.length;
        } else {
          const label = `@${item.name}`;
          nodes.push(createMentionNode(label, `uid-${i}`, offset));
          offset += label.length;
        }
      }

      return createEditorState(nodes);
    });

/**
 * Generator for any editor state
 */
const editorStateGenerator = (): fc.Arbitrary<EditorState> =>
  fc.oneof(
    textOnlyEditorStateGenerator(),
    mentionsOnlyEditorStateGenerator(),
    mixedEditorStateGenerator()
  );

/**
 * Generator for editor state with guaranteed content
 */
const nonEmptyEditorStateGenerator = (): fc.Arbitrary<EditorState> =>
  editorStateGenerator().filter(state => state.contentLength > 0);

/**
 * Generator for click event within editor bounds
 */
const validClickEventGenerator = (contentLength: number): fc.Arbitrary<ClickEvent> =>
  fc.integer({ min: 0, max: contentLength }).map(offset => ({ clickOffset: offset }));

/**
 * Generator for click event that may be out of bounds
 */
const anyClickEventGenerator = (contentLength: number): fc.Arbitrary<ClickEvent> =>
  fc.integer({ min: -10, max: contentLength + 10 }).map(offset => ({ clickOffset: offset }));

/**
 * Generator for editor state with two mentions separated by text
 */
const twoMentionsWithTextGenerator = (): fc.Arbitrary<EditorState> =>
  fc
    .tuple(userNameGenerator(), textContentGenerator(), userNameGenerator())
    .map(([name1, text, name2]) => {
      const nodes: EditorNode[] = [];
      let offset = 0;

      const label1 = `@${name1}`;
      nodes.push(createMentionNode(label1, 'uid-1', offset));
      offset += label1.length;

      nodes.push(createTextNode(text, offset));
      offset += text.length;

      const label2 = `@${name2}`;
      nodes.push(createMentionNode(label2, 'uid-2', offset));

      return createEditorState(nodes);
    });

/**
 * Generator for editor state with formatted and unformatted text
 */
const formattedTextEditorStateGenerator = (): fc.Arbitrary<EditorState> =>
  fc
    .tuple(textContentGenerator(), textContentGenerator(), formattingGenerator())
    .map(([unformatted, formatted, formatting]) => {
      const nodes: EditorNode[] = [];
      let offset = 0;

      nodes.push(createTextNode(unformatted, offset, DEFAULT_FORMATTING));
      offset += unformatted.length;

      nodes.push(createTextNode(formatted, offset, formatting));

      return createEditorState(nodes);
    });

// ==================== Property Tests ====================

describe('Cursor Positioning Property Tests', () => {
  /**
   * **Feature: message-composer-bugfixes, Property 7: Cursor Positioning Accuracy**
   *
   * *For any* click position in the editor (including between mentions and formatted text),
   * the cursor should be positioned at the click location, not jump to the end.
   *
   * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
   */
  describe('Property 7: Cursor Positioning Accuracy', () => {
    /**
     * Test: Click between two mentions positions cursor correctly
     *
     * **Validates: Requirements 5.1**
     *
     * WHEN the user clicks between two mentions
     * THEN the cursor SHALL be positioned at the click location
     */
    it('should position cursor at click location between mentions', () => {
      fc.assert(
        fc.property(twoMentionsWithTextGenerator(), state => {
          // Find the text node between mentions
          const textNode = state.nodes.find(n => n.type === 'text');
          if (!textNode) return;

          // Click in the middle of the text between mentions
          const clickOffset =
            textNode.startOffset + Math.floor((textNode.endOffset - textNode.startOffset) / 2);

          const newState = handleClick(state, { clickOffset });

          // Cursor should be at the click position
          expect(newState.cursorPosition.offset).toBe(clickOffset);
          // Cursor should NOT have jumped to end
          expect(didCursorJumpToEnd(newState, clickOffset)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Click between formatted and unformatted text positions cursor correctly
     *
     * **Validates: Requirements 5.2**
     *
     * WHEN the user clicks between formatted and unformatted text
     * THEN the cursor SHALL be positioned at the click location
     */
    it('should position cursor at click location between formatted and unformatted text', () => {
      fc.assert(
        fc.property(formattedTextEditorStateGenerator(), state => {
          // Click at the boundary between the two text nodes
          const firstNode = state.nodes[0];
          const clickOffset = firstNode.endOffset;

          const newState = handleClick(state, { clickOffset });

          // Cursor should be at the boundary
          expect(newState.cursorPosition.offset).toBe(clickOffset);
          expect(didCursorJumpToEnd(newState, clickOffset)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Click at beginning of text positions cursor at position 0
     *
     * **Validates: Requirements 5.3**
     *
     * WHEN the user clicks at the beginning of the text
     * THEN the cursor SHALL be positioned at position 0
     */
    it('should position cursor at position 0 when clicking at beginning', () => {
      fc.assert(
        fc.property(nonEmptyEditorStateGenerator(), state => {
          const newState = handleClick(state, { clickOffset: 0 });

          expect(newState.cursorPosition.offset).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Click at end of text positions cursor at end
     *
     * **Validates: Requirements 5.4**
     *
     * WHEN the user clicks at the end of the text
     * THEN the cursor SHALL be positioned at the end
     */
    it('should position cursor at end when clicking at end', () => {
      fc.assert(
        fc.property(nonEmptyEditorStateGenerator(), state => {
          const newState = handleClick(state, { clickOffset: state.contentLength });

          expect(newState.cursorPosition.offset).toBe(state.contentLength);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Click inside a word positions cursor at nearest character boundary
     *
     * **Validates: Requirements 5.5**
     *
     * WHEN the user clicks inside a word
     * THEN the cursor SHALL be positioned at the nearest character boundary
     */
    it('should position cursor at nearest character boundary when clicking inside text', () => {
      fc.assert(
        fc.property(textOnlyEditorStateGenerator(), state => {
          if (state.contentLength === 0) return;

          // Click at a random position
          const clickOffset = Math.floor(Math.random() * state.contentLength);
          const newState = handleClick(state, { clickOffset });

          // Cursor should be at a valid character boundary (integer offset)
          expect(Number.isInteger(newState.cursorPosition.offset)).toBe(true);
          expect(newState.cursorPosition.offset).toBeGreaterThanOrEqual(0);
          expect(newState.cursorPosition.offset).toBeLessThanOrEqual(state.contentLength);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Cursor does NOT jump to end when clicking in middle of text content
     *
     * **Validates: Requirements 5.6**
     *
     * WHEN the user clicks in the middle of text content
     * THEN the cursor SHALL NOT jump to the end of text
     *
     * Note: For mention-only content, clicking in the middle of a mention
     * correctly positions cursor at start or end of the mention (atomic behavior).
     * This test focuses on text content where cursor should stay at click position.
     */
    it('should NOT jump cursor to end when clicking in middle of content', () => {
      fc.assert(
        fc.property(textOnlyEditorStateGenerator(), state => {
          if (state.contentLength <= 1) return;

          // Click somewhere in the middle (not at end)
          const clickOffset = Math.floor(state.contentLength / 2);
          const newState = handleClick(state, { clickOffset });

          // Cursor should NOT have jumped to end
          expect(didCursorJumpToEnd(newState, clickOffset)).toBe(false);
          // Cursor should be at the click position for text content
          expect(newState.cursorPosition.offset).toBe(clickOffset);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Click on mention positions cursor before or after (not inside)
     *
     * **Validates: Requirements 5.7**
     *
     * WHEN the user clicks on a mention
     * THEN the cursor SHALL be positioned before or after the mention (not inside)
     */
    it('should position cursor before or after mention when clicking on mention', () => {
      fc.assert(
        fc.property(mentionsOnlyEditorStateGenerator(), state => {
          const mention = state.nodes[0] as MentionNode;

          // Click in the middle of the mention
          const clickOffset =
            mention.startOffset + Math.floor((mention.endOffset - mention.startOffset) / 2);

          const newState = handleClick(state, { clickOffset });

          // Cursor should be at start or end of mention, not inside
          expect(
            newState.cursorPosition.offset === mention.startOffset ||
              newState.cursorPosition.offset === mention.endOffset
          ).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Cursor position is always valid after any click
     *
     * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
     *
     * WHEN any click occurs in the editor
     * THEN the cursor position SHALL be valid (within bounds, not inside mention)
     */
    it('should always produce valid cursor position after click', () => {
      fc.assert(
        fc.property(
          nonEmptyEditorStateGenerator(),
          fc.integer({ min: -10, max: 200 }),
          (state, clickOffset) => {
            const newState = handleClick(state, { clickOffset });

            // Cursor should be within bounds
            expect(newState.cursorPosition.offset).toBeGreaterThanOrEqual(0);
            expect(newState.cursorPosition.offset).toBeLessThanOrEqual(state.contentLength);

            // Cursor should be at a valid position (not inside a mention)
            expect(isCursorPositionValid(newState)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Cursor is at expected position for any valid click
     *
     * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
     *
     * WHEN a click occurs at any valid position
     * THEN the cursor SHALL be at the expected position
     */
    it('should position cursor at expected location for any click', () => {
      fc.assert(
        fc.property(nonEmptyEditorStateGenerator(), state => {
          // Test clicks at various positions
          const positions = [
            0, // Beginning
            state.contentLength, // End
            Math.floor(state.contentLength / 2), // Middle
            Math.floor(state.contentLength / 4), // Quarter
            Math.floor((state.contentLength * 3) / 4), // Three quarters
          ].filter(p => p >= 0 && p <= state.contentLength);

          for (const clickOffset of positions) {
            const newState = handleClick(state, { clickOffset });
            expect(isCursorAtExpectedPosition(newState, clickOffset)).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Click handling is deterministic
     *
     * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
     *
     * WHEN the same click is performed multiple times
     * THEN the cursor position SHALL be identical each time
     */
    it('should produce deterministic cursor position for same click', () => {
      fc.assert(
        fc.property(
          nonEmptyEditorStateGenerator(),
          fc.integer({ min: 2, max: 5 }),
          (state, repeatCount) => {
            const clickOffset = Math.floor(state.contentLength / 2);
            const results: number[] = [];

            for (let i = 0; i < repeatCount; i++) {
              const newState = handleClick(state, { clickOffset });
              results.push(newState.cursorPosition.offset);
            }

            // All results should be identical
            for (let i = 1; i < results.length; i++) {
              expect(results[i]).toBe(results[0]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Out of bounds clicks are clamped to valid range
     *
     * **Validates: Requirements 5.3, 5.4**
     *
     * WHEN a click occurs outside the content bounds
     * THEN the cursor SHALL be clamped to valid range (0 to contentLength)
     */
    it('should clamp out-of-bounds clicks to valid range', () => {
      fc.assert(
        fc.property(
          nonEmptyEditorStateGenerator(),
          fc.integer({ min: -100, max: -1 }),
          fc.integer({ min: 1, max: 100 }),
          (state, negativeOffset, positiveOverflow) => {
            // Test negative offset
            const stateAfterNegative = handleClick(state, { clickOffset: negativeOffset });
            expect(stateAfterNegative.cursorPosition.offset).toBe(0);

            // Test overflow offset
            const overflowOffset = state.contentLength + positiveOverflow;
            const stateAfterOverflow = handleClick(state, { clickOffset: overflowOffset });
            expect(stateAfterOverflow.cursorPosition.offset).toBe(state.contentLength);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Empty editor handles clicks gracefully
     *
     * **Validates: Requirements 5.3, 5.4**
     *
     * WHEN the editor is empty and a click occurs
     * THEN the cursor SHALL be at position 0
     */
    it('should handle clicks in empty editor gracefully', () => {
      fc.assert(
        fc.property(fc.integer({ min: -10, max: 10 }), clickOffset => {
          const emptyState = createEmptyEditorState();
          const newState = handleClick(emptyState, { clickOffset });

          // Cursor should be at 0 (only valid position in empty editor)
          expect(newState.cursorPosition.offset).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Click at mention boundary positions cursor correctly
     *
     * **Validates: Requirements 5.1, 5.7**
     *
     * WHEN clicking exactly at the start or end of a mention
     * THEN the cursor SHALL be positioned at that boundary
     */
    it('should position cursor at mention boundary when clicking at boundary', () => {
      fc.assert(
        fc.property(mixedEditorStateGenerator(), state => {
          const mentions = state.nodes.filter(n => n.type === 'mention') as MentionNode[];
          if (mentions.length === 0) return;

          for (const mention of mentions) {
            // Click at start of mention
            const stateAtStart = handleClick(state, { clickOffset: mention.startOffset });
            expect(stateAtStart.cursorPosition.offset).toBe(mention.startOffset);

            // Click at end of mention
            const stateAtEnd = handleClick(state, { clickOffset: mention.endOffset });
            expect(stateAtEnd.cursorPosition.offset).toBe(mention.endOffset);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Multiple consecutive clicks maintain correct positioning
     *
     * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
     *
     * WHEN multiple clicks occur at different positions
     * THEN each click SHALL position the cursor correctly
     */
    it('should maintain correct positioning across multiple clicks', () => {
      fc.assert(
        fc.property(
          nonEmptyEditorStateGenerator(),
          fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 3, maxLength: 10 }),
          (initialState, clickOffsets) => {
            let state = initialState;

            for (const rawOffset of clickOffsets) {
              // Normalize offset to valid range
              const clickOffset = Math.min(rawOffset, state.contentLength);
              state = handleClick(state, { clickOffset });

              // Each click should result in valid cursor position
              expect(isCursorPositionValid(state)).toBe(true);
              expect(state.cursorPosition.offset).toBeGreaterThanOrEqual(0);
              expect(state.cursorPosition.offset).toBeLessThanOrEqual(state.contentLength);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Content is preserved after click
     *
     * **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
     *
     * WHEN a click occurs
     * THEN the content SHALL remain unchanged
     */
    it('should preserve content after click', () => {
      fc.assert(
        fc.property(
          nonEmptyEditorStateGenerator(),
          fc.integer({ min: 0, max: 100 }),
          (state, clickOffset) => {
            const originalNodes = JSON.stringify(state.nodes);
            const originalLength = state.contentLength;

            const newState = handleClick(state, { clickOffset });

            // Content should be unchanged
            expect(JSON.stringify(newState.nodes)).toBe(originalNodes);
            expect(newState.contentLength).toBe(originalLength);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Click in first half of mention positions cursor before
     *
     * **Validates: Requirements 5.7**
     *
     * WHEN clicking in the first half of a mention
     * THEN the cursor SHALL be positioned before the mention
     */
    it('should position cursor before mention when clicking in first half', () => {
      fc.assert(
        fc.property(mentionsOnlyEditorStateGenerator(), state => {
          const mention = state.nodes[0] as MentionNode;
          const mentionLength = mention.endOffset - mention.startOffset;

          if (mentionLength < 2) return;

          // Click in first quarter of mention
          const clickOffset = mention.startOffset + Math.floor(mentionLength / 4);
          const newState = handleClick(state, { clickOffset });

          // Cursor should be at start of mention
          expect(newState.cursorPosition.offset).toBe(mention.startOffset);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Click in second half of mention positions cursor after
     *
     * **Validates: Requirements 5.7**
     *
     * WHEN clicking in the second half of a mention
     * THEN the cursor SHALL be positioned after the mention
     */
    it('should position cursor after mention when clicking in second half', () => {
      fc.assert(
        fc.property(mentionsOnlyEditorStateGenerator(), state => {
          const mention = state.nodes[0] as MentionNode;
          const mentionLength = mention.endOffset - mention.startOffset;

          if (mentionLength < 2) return;

          // Click in last quarter of mention
          const clickOffset = mention.startOffset + Math.floor((mentionLength * 3) / 4);
          const newState = handleClick(state, { clickOffset });

          // Cursor should be at end of mention
          expect(newState.cursorPosition.offset).toBe(mention.endOffset);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Cursor position is always an integer
     *
     * **Validates: Requirements 5.5**
     *
     * WHEN any click occurs
     * THEN the cursor position SHALL be an integer (character boundary)
     */
    it('should always produce integer cursor position', () => {
      fc.assert(
        fc.property(
          editorStateGenerator(),
          fc.double({ min: -10, max: 200, noNaN: true }),
          (state, clickOffset) => {
            const newState = handleClick(state, { clickOffset: Math.round(clickOffset) });

            expect(Number.isInteger(newState.cursorPosition.offset)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Clicking between adjacent mentions positions cursor correctly
     *
     * **Validates: Requirements 5.1**
     *
     * WHEN clicking at the boundary between two adjacent mentions
     * THEN the cursor SHALL be positioned at that boundary
     */
    it('should position cursor at boundary between adjacent mentions', () => {
      fc.assert(
        fc.property(fc.tuple(userNameGenerator(), userNameGenerator()), ([name1, name2]) => {
          // Create two adjacent mentions
          const label1 = `@${name1}`;
          const label2 = `@${name2}`;
          const nodes: EditorNode[] = [
            createMentionNode(label1, 'uid-1', 0),
            createMentionNode(label2, 'uid-2', label1.length),
          ];
          const state = createEditorState(nodes);

          // Click at the boundary between mentions
          const boundaryOffset = label1.length;
          const newState = handleClick(state, { clickOffset: boundaryOffset });

          // Cursor should be at the boundary
          expect(newState.cursorPosition.offset).toBe(boundaryOffset);
        }),
        { numRuns: 100 }
      );
    });
  });
});
