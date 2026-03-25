import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for Text Selection
 *
 * **Feature: message-composer-bugfixes, Property 6: Text Selection Works**
 *
 * These tests verify universal properties that should hold across all inputs,
 * using fast-check for property-based testing.
 *
 * Property 6: Text Selection Works
 * *For any* text content in the editor, double-click should select the word under cursor,
 * and triple-click should select the paragraph.
 *
 * **Validates: Requirements 4.1, 4.2**
 */

// ==================== Mock Types ====================

/**
 * Interface representing a text selection range
 */
interface SelectionRange {
  /** Start position of selection */
  start: number;
  /** End position of selection */
  end: number;
}

/**
 * Interface representing a word in the text with its boundaries
 */
interface WordBoundary {
  /** The word text */
  word: string;
  /** Start offset of the word */
  start: number;
  /** End offset of the word (exclusive) */
  end: number;
}

/**
 * Interface representing a paragraph with its boundaries
 */
interface ParagraphBoundary {
  /** The paragraph text */
  text: string;
  /** Start offset of the paragraph */
  start: number;
  /** End offset of the paragraph (exclusive) */
  end: number;
}

/**
 * Interface representing the editor state
 */
interface EditorState {
  /** The full text content */
  content: string;
  /** Current selection range (null if no selection) */
  selection: SelectionRange | null;
  /** Whether the editor is in rich text mode */
  isRichTextMode: boolean;
}

/**
 * Click type for selection
 */
type ClickType = 'single' | 'double' | 'triple';

// ==================== Constants ====================

/**
 * Word boundary characters (non-word characters)
 * These characters separate words in text
 */
const WORD_BOUNDARY_CHARS = /[\s.,!?;:'"()\[\]{}<>\/\\@#$%^&*+=|~`\-\n\r\t]/;

/**
 * Paragraph separator (newline)
 */
const PARAGRAPH_SEPARATOR = '\n';

// ==================== Pure Functions (Mirror Browser/Editor Behavior) ====================

/**
 * Check if a character is a word character
 *
 * @param char - Character to check
 * @returns True if the character is part of a word
 */
function isWordChar(char: string): boolean {
  if (!char || char.length === 0) return false;
  return !WORD_BOUNDARY_CHARS.test(char);
}

/**
 * Find the word at a given position in the text
 * Mirrors browser's double-click word selection behavior
 *
 * **Validates: Requirements 4.1**
 *
 * @param text - The full text content
 * @param position - The character position (offset)
 * @returns WordBoundary object with word and its boundaries
 */
function findWordAtPosition(text: string, position: number): WordBoundary {
  if (!text || text.length === 0) {
    return { word: '', start: 0, end: 0 };
  }

  // Clamp position to valid range
  const pos = Math.max(0, Math.min(position, text.length - 1));

  // If position is on a non-word character, return empty selection at that position
  if (!isWordChar(text[pos])) {
    return { word: '', start: pos, end: pos };
  }

  // Find word start (scan backwards)
  let start = pos;
  while (start > 0 && isWordChar(text[start - 1])) {
    start--;
  }

  // Find word end (scan forwards)
  let end = pos;
  while (end < text.length && isWordChar(text[end])) {
    end++;
  }

  return {
    word: text.slice(start, end),
    start,
    end,
  };
}

/**
 * Find the paragraph at a given position in the text
 * Mirrors browser's triple-click paragraph selection behavior
 *
 * **Validates: Requirements 4.2**
 *
 * @param text - The full text content
 * @param position - The character position (offset)
 * @returns ParagraphBoundary object with paragraph text and its boundaries
 */
function findParagraphAtPosition(text: string, position: number): ParagraphBoundary {
  if (!text || text.length === 0) {
    return { text: '', start: 0, end: 0 };
  }

  // Clamp position to valid range
  const pos = Math.max(0, Math.min(position, text.length - 1));

  // Find paragraph start (scan backwards to find newline or start of text)
  let start = pos;
  while (start > 0 && text[start - 1] !== PARAGRAPH_SEPARATOR) {
    start--;
  }

  // Find paragraph end (scan forwards to find newline or end of text)
  let end = pos;
  while (end < text.length && text[end] !== PARAGRAPH_SEPARATOR) {
    end++;
  }

  return {
    text: text.slice(start, end),
    start,
    end,
  };
}

/**
 * Simulate double-click selection behavior
 * Double-click selects the word under the cursor
 *
 * **Validates: Requirements 4.1**
 *
 * @param state - Current editor state
 * @param clickPosition - Position where double-click occurred
 * @returns New editor state with word selected
 */
function handleDoubleClick(state: EditorState, clickPosition: number): EditorState {
  const wordBoundary = findWordAtPosition(state.content, clickPosition);

  return {
    ...state,
    selection: {
      start: wordBoundary.start,
      end: wordBoundary.end,
    },
  };
}

/**
 * Simulate triple-click selection behavior
 * Triple-click selects the paragraph under the cursor
 *
 * **Validates: Requirements 4.2**
 *
 * @param state - Current editor state
 * @param clickPosition - Position where triple-click occurred
 * @returns New editor state with paragraph selected
 */
function handleTripleClick(state: EditorState, clickPosition: number): EditorState {
  const paragraphBoundary = findParagraphAtPosition(state.content, clickPosition);

  return {
    ...state,
    selection: {
      start: paragraphBoundary.start,
      end: paragraphBoundary.end,
    },
  };
}

/**
 * Get the selected text from an editor state
 *
 * @param state - Editor state with selection
 * @returns The selected text, or empty string if no selection
 */
function getSelectedText(state: EditorState): string {
  if (!state.selection) {
    return '';
  }
  return state.content.slice(state.selection.start, state.selection.end);
}

/**
 * Check if a selection is valid (start <= end, within bounds)
 *
 * @param selection - Selection range to validate
 * @param contentLength - Length of the content
 * @returns True if selection is valid
 */
function isValidSelection(selection: SelectionRange | null, contentLength: number): boolean {
  if (!selection) return true; // No selection is valid
  return selection.start >= 0 && selection.end >= selection.start && selection.end <= contentLength;
}

/**
 * Check if a selection represents a complete word
 * A complete word selection should not have word characters immediately before or after
 *
 * @param text - Full text content
 * @param selection - Selection range
 * @returns True if selection is a complete word
 */
function isCompleteWordSelection(text: string, selection: SelectionRange): boolean {
  const { start, end } = selection;

  // Check character before selection (should not be a word char)
  if (start > 0 && isWordChar(text[start - 1])) {
    return false;
  }

  // Check character after selection (should not be a word char)
  if (end < text.length && isWordChar(text[end])) {
    return false;
  }

  return true;
}

/**
 * Check if a selection represents a complete paragraph
 * A complete paragraph selection should start after a newline (or at start) and end before a newline (or at end)
 *
 * @param text - Full text content
 * @param selection - Selection range
 * @returns True if selection is a complete paragraph
 */
function isCompleteParagraphSelection(text: string, selection: SelectionRange): boolean {
  const { start, end } = selection;

  // Check character before selection (should be newline or start of text)
  if (start > 0 && text[start - 1] !== PARAGRAPH_SEPARATOR) {
    return false;
  }

  // Check character after selection (should be newline or end of text)
  if (end < text.length && text[end] !== PARAGRAPH_SEPARATOR) {
    return false;
  }

  return true;
}

/**
 * Create an initial editor state
 *
 * @param content - Text content
 * @param isRichTextMode - Whether in rich text mode
 * @returns EditorState object
 */
function createEditorState(content: string, isRichTextMode = true): EditorState {
  return {
    content,
    selection: null,
    isRichTextMode,
  };
}

/**
 * Get all words in a text with their boundaries
 *
 * @param text - Text to analyze
 * @returns Array of WordBoundary objects
 */
function getAllWords(text: string): WordBoundary[] {
  const words: WordBoundary[] = [];
  let i = 0;

  while (i < text.length) {
    // Skip non-word characters
    while (i < text.length && !isWordChar(text[i])) {
      i++;
    }

    if (i >= text.length) break;

    // Found start of a word
    const start = i;
    while (i < text.length && isWordChar(text[i])) {
      i++;
    }

    words.push({
      word: text.slice(start, i),
      start,
      end: i,
    });
  }

  return words;
}

/**
 * Get all paragraphs in a text with their boundaries
 *
 * @param text - Text to analyze
 * @returns Array of ParagraphBoundary objects
 */
function getAllParagraphs(text: string): ParagraphBoundary[] {
  const paragraphs: ParagraphBoundary[] = [];
  let start = 0;

  for (let i = 0; i <= text.length; i++) {
    if (i === text.length || text[i] === PARAGRAPH_SEPARATOR) {
      paragraphs.push({
        text: text.slice(start, i),
        start,
        end: i,
      });
      start = i + 1;
    }
  }

  return paragraphs;
}

// ==================== Test Generators ====================

/**
 * Characters that can be part of a word
 */
const WORD_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Generator for a single word (alphanumeric characters)
 */
const wordGenerator = (): fc.Arbitrary<string> =>
  fc
    .array(fc.constantFrom(...WORD_CHARS.split('')), { minLength: 1, maxLength: 15 })
    .map(chars => chars.join(''));

/**
 * Generator for a sentence (words separated by spaces)
 */
const sentenceGenerator = (): fc.Arbitrary<string> =>
  fc.array(wordGenerator(), { minLength: 1, maxLength: 10 }).map(words => words.join(' '));

/**
 * Generator for a paragraph (sentence without newlines)
 */
const paragraphGenerator = (): fc.Arbitrary<string> => sentenceGenerator();

/**
 * Generator for multi-paragraph text
 */
const multiParagraphTextGenerator = (): fc.Arbitrary<string> =>
  fc
    .array(paragraphGenerator(), { minLength: 1, maxLength: 5 })
    .map(paragraphs => paragraphs.join('\n'));

/**
 * Generator for text with words
 */
const textWithWordsGenerator = (): fc.Arbitrary<string> =>
  fc.oneof(sentenceGenerator(), multiParagraphTextGenerator());

/**
 * Generator for editor state with content
 */
const editorStateGenerator = (): fc.Arbitrary<EditorState> =>
  fc
    .tuple(textWithWordsGenerator(), fc.boolean())
    .map(([content, isRichText]) => createEditorState(content, isRichText));

/**
 * Generator for editor state with guaranteed words
 */
const editorStateWithWordsGenerator = (): fc.Arbitrary<EditorState> =>
  textWithWordsGenerator()
    .filter(text => getAllWords(text).length > 0)
    .map(content => createEditorState(content, true));

/**
 * Generator for editor state with multiple paragraphs
 */
const editorStateWithParagraphsGenerator = (): fc.Arbitrary<EditorState> =>
  multiParagraphTextGenerator()
    .filter(text => getAllParagraphs(text).length > 1)
    .map(content => createEditorState(content, true));

/**
 * Generator for click type
 */
const clickTypeGenerator = (): fc.Arbitrary<ClickType> =>
  fc.constantFrom('single', 'double', 'triple');

// ==================== Property Tests ====================

describe('Text Selection Property Tests', () => {
  /**
   * **Feature: message-composer-bugfixes, Property 6: Text Selection Works**
   *
   * *For any* text content in the editor, double-click should select the word under cursor,
   * and triple-click should select the paragraph.
   *
   * **Validates: Requirements 4.1, 4.2**
   */
  describe('Property 6: Text Selection Works', () => {
    /**
     * Test: Double-click selects the word under cursor
     *
     * **Validates: Requirements 4.1**
     *
     * WHEN the user double-clicks on a word
     * THEN the word SHALL be selected
     */
    it('should select word when double-clicking on a word character', () => {
      fc.assert(
        fc.property(editorStateWithWordsGenerator(), initialState => {
          const words = getAllWords(initialState.content);
          if (words.length === 0) return; // Skip if no words

          // Pick a random word and click position within it
          const wordIndex = Math.floor(Math.random() * words.length);
          const word = words[wordIndex];
          const clickPos = word.start + Math.floor((word.end - word.start) / 2);

          const newState = handleDoubleClick(initialState, clickPos);

          // Selection should exist
          expect(newState.selection).not.toBeNull();

          // Selected text should be the word
          const selectedText = getSelectedText(newState);
          expect(selectedText).toBe(word.word);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Triple-click selects the paragraph under cursor
     *
     * **Validates: Requirements 4.2**
     *
     * WHEN the user triple-clicks on a paragraph
     * THEN the paragraph SHALL be selected
     */
    it('should select paragraph when triple-clicking', () => {
      fc.assert(
        fc.property(editorStateWithParagraphsGenerator(), initialState => {
          const paragraphs = getAllParagraphs(initialState.content);
          if (paragraphs.length === 0) return; // Skip if no paragraphs

          // Pick a random paragraph and click position within it
          const paraIndex = Math.floor(Math.random() * paragraphs.length);
          const paragraph = paragraphs[paraIndex];
          const clickPos = paragraph.start + Math.floor((paragraph.end - paragraph.start) / 2);

          const newState = handleTripleClick(initialState, clickPos);

          // Selection should exist
          expect(newState.selection).not.toBeNull();

          // Selected text should be the paragraph
          const selectedText = getSelectedText(newState);
          expect(selectedText).toBe(paragraph.text);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Double-click selection is always a complete word
     *
     * **Validates: Requirements 4.1**
     *
     * WHEN double-click selects text
     * THEN the selection SHALL be a complete word (not partial)
     */
    it('should select complete words, not partial words', () => {
      fc.assert(
        fc.property(editorStateWithWordsGenerator(), initialState => {
          const words = getAllWords(initialState.content);
          if (words.length === 0) return;

          // Test clicking at various positions within each word
          for (const word of words) {
            for (let pos = word.start; pos < word.end; pos++) {
              const newState = handleDoubleClick(initialState, pos);

              if (newState.selection && newState.selection.start !== newState.selection.end) {
                // If there's a non-empty selection, it should be a complete word
                expect(isCompleteWordSelection(initialState.content, newState.selection)).toBe(
                  true
                );
              }
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Triple-click selection is always a complete paragraph
     *
     * **Validates: Requirements 4.2**
     *
     * WHEN triple-click selects text
     * THEN the selection SHALL be a complete paragraph
     */
    it('should select complete paragraphs, not partial paragraphs', () => {
      fc.assert(
        fc.property(editorStateWithParagraphsGenerator(), initialState => {
          const paragraphs = getAllParagraphs(initialState.content);

          // Test clicking at various positions within each paragraph
          for (const paragraph of paragraphs) {
            if (paragraph.end > paragraph.start) {
              const clickPos = paragraph.start + Math.floor((paragraph.end - paragraph.start) / 2);
              const newState = handleTripleClick(initialState, clickPos);

              if (newState.selection) {
                expect(isCompleteParagraphSelection(initialState.content, newState.selection)).toBe(
                  true
                );
              }
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Selection is always valid (within bounds)
     *
     * **Validates: Requirements 4.1, 4.2**
     *
     * WHEN any selection operation occurs
     * THEN the selection SHALL be within valid bounds
     */
    it('should always produce valid selections within bounds', () => {
      fc.assert(
        fc.property(editorStateGenerator(), clickTypeGenerator(), (initialState, clickType) => {
          if (initialState.content.length === 0) return;

          const clickPos = Math.floor(Math.random() * initialState.content.length);

          let newState: EditorState;
          if (clickType === 'double') {
            newState = handleDoubleClick(initialState, clickPos);
          } else if (clickType === 'triple') {
            newState = handleTripleClick(initialState, clickPos);
          } else {
            return; // Single click doesn't create selection in this model
          }

          // Selection should be valid
          expect(isValidSelection(newState.selection, newState.content.length)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Double-click on whitespace produces empty or whitespace selection
     *
     * **Validates: Requirements 4.1**
     *
     * WHEN double-clicking on whitespace
     * THEN the selection SHALL be empty (no word to select)
     */
    it('should produce empty selection when double-clicking on whitespace', () => {
      fc.assert(
        fc.property(fc.array(wordGenerator(), { minLength: 2, maxLength: 5 }), words => {
          // Create text with spaces between words
          const text = words.join('   '); // Multiple spaces
          const state = createEditorState(text);

          // Find a space position
          const spaceIndex = text.indexOf(' ');
          if (spaceIndex === -1) return;

          const newState = handleDoubleClick(state, spaceIndex);

          // Selection should be empty (start === end) when clicking on whitespace
          if (newState.selection) {
            expect(newState.selection.start).toBe(newState.selection.end);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Selection works in both plain text and rich text modes
     *
     * **Validates: Requirements 4.7**
     *
     * WHEN text selection is performed
     * THEN it SHALL work correctly in both plain text and rich text modes
     */
    it('should work correctly in both plain text and rich text modes', () => {
      fc.assert(
        fc.property(textWithWordsGenerator(), fc.boolean(), (content, isRichText) => {
          const state = createEditorState(content, isRichText);
          const words = getAllWords(content);

          if (words.length === 0) return;

          const word = words[0];
          const clickPos = word.start;

          const newState = handleDoubleClick(state, clickPos);

          // Selection should work regardless of mode
          expect(newState.selection).not.toBeNull();
          expect(getSelectedText(newState)).toBe(word.word);

          // Mode should be preserved
          expect(newState.isRichTextMode).toBe(isRichText);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Double-click at word boundaries selects the correct word
     *
     * **Validates: Requirements 4.1**
     *
     * WHEN double-clicking at the start or end of a word
     * THEN the entire word SHALL be selected
     */
    it('should select entire word when clicking at word boundaries', () => {
      fc.assert(
        fc.property(editorStateWithWordsGenerator(), initialState => {
          const words = getAllWords(initialState.content);
          if (words.length === 0) return;

          for (const word of words) {
            // Click at start of word
            const stateFromStart = handleDoubleClick(initialState, word.start);
            expect(getSelectedText(stateFromStart)).toBe(word.word);

            // Click at end of word (last character)
            if (word.end > word.start) {
              const stateFromEnd = handleDoubleClick(initialState, word.end - 1);
              expect(getSelectedText(stateFromEnd)).toBe(word.word);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Triple-click at paragraph boundaries selects the correct paragraph
     *
     * **Validates: Requirements 4.2**
     *
     * WHEN triple-clicking at the start or end of a paragraph
     * THEN the entire paragraph SHALL be selected
     */
    it('should select entire paragraph when clicking at paragraph boundaries', () => {
      fc.assert(
        fc.property(editorStateWithParagraphsGenerator(), initialState => {
          const paragraphs = getAllParagraphs(initialState.content);

          for (const paragraph of paragraphs) {
            if (paragraph.end > paragraph.start) {
              // Click at start of paragraph
              const stateFromStart = handleTripleClick(initialState, paragraph.start);
              expect(getSelectedText(stateFromStart)).toBe(paragraph.text);

              // Click at end of paragraph (last character)
              const stateFromEnd = handleTripleClick(initialState, paragraph.end - 1);
              expect(getSelectedText(stateFromEnd)).toBe(paragraph.text);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Selection is deterministic
     *
     * **Validates: Requirements 4.1, 4.2**
     *
     * WHEN the same click operation is performed multiple times
     * THEN the result SHALL be identical each time
     */
    it('should produce deterministic results for same click position', () => {
      fc.assert(
        fc.property(
          editorStateWithWordsGenerator(),
          fc.integer({ min: 2, max: 5 }),
          (initialState, repeatCount) => {
            if (initialState.content.length === 0) return;

            const clickPos = Math.floor(initialState.content.length / 2);

            // Perform double-click multiple times
            const doubleClickResults: EditorState[] = [];
            for (let i = 0; i < repeatCount; i++) {
              doubleClickResults.push(handleDoubleClick(initialState, clickPos));
            }

            // All results should be identical
            for (let i = 1; i < doubleClickResults.length; i++) {
              expect(doubleClickResults[i].selection?.start).toBe(
                doubleClickResults[0].selection?.start
              );
              expect(doubleClickResults[i].selection?.end).toBe(
                doubleClickResults[0].selection?.end
              );
            }

            // Perform triple-click multiple times
            const tripleClickResults: EditorState[] = [];
            for (let i = 0; i < repeatCount; i++) {
              tripleClickResults.push(handleTripleClick(initialState, clickPos));
            }

            // All results should be identical
            for (let i = 1; i < tripleClickResults.length; i++) {
              expect(tripleClickResults[i].selection?.start).toBe(
                tripleClickResults[0].selection?.start
              );
              expect(tripleClickResults[i].selection?.end).toBe(
                tripleClickResults[0].selection?.end
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Empty content produces no selection
     *
     * **Validates: Requirements 4.1, 4.2**
     *
     * WHEN the editor content is empty
     * THEN selection operations SHALL produce empty selections
     */
    it('should handle empty content gracefully', () => {
      const emptyState = createEditorState('');

      const doubleClickState = handleDoubleClick(emptyState, 0);
      expect(doubleClickState.selection?.start).toBe(0);
      expect(doubleClickState.selection?.end).toBe(0);

      const tripleClickState = handleTripleClick(emptyState, 0);
      expect(tripleClickState.selection?.start).toBe(0);
      expect(tripleClickState.selection?.end).toBe(0);
    });

    /**
     * Test: Click position clamping
     *
     * **Validates: Requirements 4.1, 4.2**
     *
     * WHEN click position is out of bounds
     * THEN it SHALL be clamped to valid range
     */
    it('should clamp out-of-bounds click positions', () => {
      fc.assert(
        fc.property(editorStateWithWordsGenerator(), initialState => {
          const contentLength = initialState.content.length;

          // Click at negative position
          const stateNegative = handleDoubleClick(initialState, -10);
          expect(isValidSelection(stateNegative.selection, contentLength)).toBe(true);

          // Click beyond content length
          const stateBeyond = handleDoubleClick(initialState, contentLength + 100);
          expect(isValidSelection(stateBeyond.selection, contentLength)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Word selection with special characters
     *
     * **Validates: Requirements 4.1**
     *
     * WHEN text contains special characters between words
     * THEN double-click SHALL correctly identify word boundaries
     */
    it('should handle special characters as word boundaries', () => {
      fc.assert(
        fc.property(
          fc.array(wordGenerator(), { minLength: 2, maxLength: 4 }),
          fc.constantFrom('.', ',', '!', '?', ';', ':', '-', '(', ')', '[', ']'),
          (words, separator) => {
            const text = words.join(separator);
            const state = createEditorState(text);

            // Each word should be selectable independently
            const foundWords = getAllWords(text);

            for (const word of foundWords) {
              const clickPos = word.start;
              const newState = handleDoubleClick(state, clickPos);
              expect(getSelectedText(newState)).toBe(word.word);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Paragraph selection with multiple newlines
     *
     * **Validates: Requirements 4.2**
     *
     * WHEN text has multiple consecutive newlines
     * THEN triple-click SHALL select only the current paragraph
     */
    it('should handle multiple consecutive newlines correctly', () => {
      fc.assert(
        fc.property(fc.array(paragraphGenerator(), { minLength: 2, maxLength: 4 }), paragraphs => {
          // Join with double newlines
          const text = paragraphs.join('\n\n');
          const state = createEditorState(text);

          const allParagraphs = getAllParagraphs(text);

          // Each paragraph should be selectable
          for (const para of allParagraphs) {
            if (para.end > para.start) {
              const clickPos = para.start;
              const newState = handleTripleClick(state, clickPos);
              expect(getSelectedText(newState)).toBe(para.text);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test: Content is preserved after selection
     *
     * **Validates: Requirements 4.1, 4.2**
     *
     * WHEN a selection operation is performed
     * THEN the content SHALL remain unchanged
     */
    it('should preserve content after selection operations', () => {
      fc.assert(
        fc.property(editorStateGenerator(), initialState => {
          if (initialState.content.length === 0) return;

          const clickPos = Math.floor(initialState.content.length / 2);

          const afterDoubleClick = handleDoubleClick(initialState, clickPos);
          expect(afterDoubleClick.content).toBe(initialState.content);

          const afterTripleClick = handleTripleClick(initialState, clickPos);
          expect(afterTripleClick.content).toBe(initialState.content);
        }),
        { numRuns: 100 }
      );
    });
  });
});
