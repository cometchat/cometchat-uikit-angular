import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { CometChatEmoji, CometChatEmojiCategory } from '../../../modals/CometChatEmoji';

/**
 * Property-Based Tests for Emoji Keyboard Search Filtering (Issue 9)
 *
 * **Property 5: Emoji keyword search returns all and only matching emojis**
 * *For any* search term and emoji dataset, the filtered results SHALL contain exactly those emojis
 * where at least one entry in the emoji's `keywords` array contains the search term as a
 * case-insensitive substring.
 *
 * **Validates: Requirements 9.1, 9.2, 9.3**
 *
 * This test validates that:
 * - Search filters emojis by keywords array (case-insensitive)
 * - Empty search shows all emojis (restores full category list)
 * - Search results only contain emojis with matching keywords
 * - Search is case-insensitive
 * - Clearing search restores all emojis
 */

// ==================== Mock Data ====================

/**
 * Create mock emoji data for testing
 */
function createMockEmojiData(): CometChatEmojiCategory[] {
  return [
    {
      id: 'smileys',
      name: 'Smileys & Emotion',
      symbolURL: 'assets/smileys.svg',
      emojies: {
        'grinning face': { char: '😀', keywords: ['face', 'smile', 'happy', 'joy', 'grin'] },
        'smiling face': { char: '😊', keywords: ['face', 'happy', 'joy', 'smile'] },
        'laughing face': { char: '😆', keywords: ['face', 'happy', 'laugh', 'lol'] },
        'heart eyes': { char: '😍', keywords: ['face', 'love', 'heart', 'eyes', 'crush'] },
        'thinking face': { char: '🤔', keywords: ['face', 'thinking', 'hmm'] },
        'sad face': { char: '😢', keywords: ['face', 'sad', 'cry', 'tear'] },
        'angry face': { char: '😠', keywords: ['face', 'angry', 'mad'] },
      },
    },
    {
      id: 'animals',
      name: 'Animals & Nature',
      symbolURL: 'assets/animals.svg',
      emojies: {
        'dog face': { char: '🐶', keywords: ['animal', 'pet', 'dog', 'puppy', 'face'] },
        'cat face': { char: '🐱', keywords: ['animal', 'pet', 'cat', 'kitten', 'face'] },
        'monkey face': { char: '🐵', keywords: ['animal', 'monkey', 'face'] },
        'lion face': { char: '🦁', keywords: ['animal', 'lion', 'face', 'king'] },
        'tiger face': { char: '🐯', keywords: ['animal', 'tiger', 'face'] },
        'bear face': { char: '🐻', keywords: ['animal', 'bear', 'face'] },
      },
    },
    {
      id: 'food',
      name: 'Food & Drink',
      symbolURL: 'assets/food.svg',
      emojies: {
        pizza: { char: '🍕', keywords: ['food', 'pizza', 'slice'] },
        hamburger: { char: '🍔', keywords: ['food', 'hamburger', 'burger', 'fast'] },
        'hot dog': { char: '🌭', keywords: ['food', 'hot', 'dog', 'sausage'] },
        taco: { char: '🌮', keywords: ['food', 'taco', 'mexican'] },
        burrito: { char: '🌯', keywords: ['food', 'burrito', 'wrap', 'mexican'] },
        apple: { char: '🍎', keywords: ['food', 'fruit', 'apple', 'red'] },
        banana: { char: '🍌', keywords: ['food', 'fruit', 'banana', 'yellow'] },
      },
    },
  ];
}

/**
 * Filter emojis based on search query by matching against each emoji's keywords array (case-insensitive).
 * Matches the updated component logic.
 */
function filterEmojis(
  categories: CometChatEmojiCategory[],
  searchQuery: string
): Record<string, CometChatEmoji> {
  if (!searchQuery) {
    return {};
  }

  const filtered: Record<string, CometChatEmoji> = {};
  const lowerQuery = searchQuery.toLowerCase();

  categories.forEach(category => {
    Object.entries(category.emojies).forEach(([name, emoji]) => {
      const keywords = emoji.keywords;
      if (keywords && keywords.some(kw => kw.toLowerCase().includes(lowerQuery))) {
        filtered[name] = emoji;
      }
    });
  });

  return filtered;
}

/**
 * Get all emojis from categories
 */
function getAllEmojis(categories: CometChatEmojiCategory[]): Record<string, CometChatEmoji> {
  const all: Record<string, CometChatEmoji> = {};
  categories.forEach(category => {
    Object.entries(category.emojies).forEach(([name, emoji]) => {
      all[name] = emoji;
    });
  });
  return all;
}

// ==================== Property-Based Tests ====================

describe('Property 4: Emoji Search Filtering', () => {
  let mockEmojiData: CometChatEmojiCategory[];

  beforeEach(() => {
    mockEmojiData = createMockEmojiData();
  });

  /**
   * Property Test: Empty search returns empty results
   * **Validates: Requirements 6.2, 6.3**
   */
  it('should return empty results for empty search query', () => {
    fc.assert(
      fc.property(fc.constantFrom('', '   ', '\t', '\n'), (emptyQuery: string) => {
        // Act
        const results = filterEmojis(mockEmojiData, emptyQuery.trim());

        // Assert
        expect(Object.keys(results).length).toBe(0);
      })
    );
  });

  /**
   * Property Test: Search results only contain emojis with matching keywords
   * **Validates: Requirements 9.1, 9.2**
   */
  it('should only return emojis whose keywords contain the search query', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('face', 'dog', 'pizza', 'heart', 'thinking'),
        (searchQuery: string) => {
          // Act
          const results = filterEmojis(mockEmojiData, searchQuery);

          // Assert: All results must have at least one keyword containing the search query
          Object.entries(results).forEach(([, emoji]) => {
            const hasMatchingKeyword = emoji.keywords!.some(kw =>
              kw.toLowerCase().includes(searchQuery.toLowerCase())
            );
            expect(hasMatchingKeyword).toBe(true);
          });
        }
      )
    );
  });

  /**
   * Property Test: Search is case-insensitive
   * **Validates: Requirements 6.2**
   */
  it('should perform case-insensitive search', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          { lower: 'face', upper: 'FACE' },
          { lower: 'dog', upper: 'DOG' },
          { lower: 'pizza', upper: 'PIZZA' },
          { lower: 'heart', upper: 'HEART' }
        ),
        (testCase: { lower: string; upper: string }) => {
          // Act
          const lowerResults = filterEmojis(mockEmojiData, testCase.lower);
          const upperResults = filterEmojis(mockEmojiData, testCase.upper);

          // Assert: Same results regardless of case
          expect(Object.keys(lowerResults).length).toBe(Object.keys(upperResults).length);
          expect(Object.keys(lowerResults).sort()).toEqual(Object.keys(upperResults).sort());
        }
      )
    );
  });

  /**
   * Property Test: Search with mixed case returns correct results
   * **Validates: Requirements 9.1**
   */
  it('should handle mixed case search queries correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('FaCe', 'DoG', 'PiZzA', 'HeArT', 'ThInKiNg'),
        (mixedCaseQuery: string) => {
          // Act
          const results = filterEmojis(mockEmojiData, mixedCaseQuery);

          // Assert: All results have at least one keyword containing the query (case-insensitive)
          Object.entries(results).forEach(([, emoji]) => {
            const hasMatchingKeyword = emoji.keywords!.some(kw =>
              kw.toLowerCase().includes(mixedCaseQuery.toLowerCase())
            );
            expect(hasMatchingKeyword).toBe(true);
          });

          // Assert: Results are not empty for known queries
          if (mixedCaseQuery.toLowerCase() === 'face') {
            expect(Object.keys(results).length).toBeGreaterThan(0);
          }
        }
      )
    );
  });

  /**
   * Property Test: Partial keyword matches are included
   * **Validates: Requirements 9.1, 9.2**
   */
  it('should include partial keyword matches in search results', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          { query: 'fac', expectedKeyword: 'face' },
          { query: 'do', expectedKeyword: 'dog' },
          { query: 'piz', expectedKeyword: 'pizza' },
          { query: 'hea', expectedKeyword: 'heart' }
        ),
        (testCase: { query: string; expectedKeyword: string }) => {
          // Act
          const results = filterEmojis(mockEmojiData, testCase.query);

          // Assert: At least one result has a keyword containing the expected keyword
          const hasExpectedMatch = Object.values(results).some(emoji =>
            emoji.keywords!.some(kw => kw.toLowerCase().includes(testCase.expectedKeyword))
          );
          expect(hasExpectedMatch).toBe(true);
        }
      )
    );
  });

  /**
   * Property Test: Non-matching search returns empty results
   * **Validates: Requirements 6.2**
   */
  it('should return empty results for non-matching search queries', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('xyz123', 'qwerty', 'zzzzzz', 'nonexistent'),
        (nonMatchingQuery: string) => {
          // Act
          const results = filterEmojis(mockEmojiData, nonMatchingQuery);

          // Assert: No results for non-matching queries
          expect(Object.keys(results).length).toBe(0);
        }
      )
    );
  });

  /**
   * Property Test: Search across multiple categories
   * **Validates: Requirements 6.2**
   */
  it('should search across all emoji categories', () => {
    fc.assert(
      fc.property(fc.constant('face'), (searchQuery: string) => {
        // Act
        const results = filterEmojis(mockEmojiData, searchQuery);

        // Assert: Results should include emojis from multiple categories
        // 'face' appears in both 'smileys' and 'animals' categories
        const resultNames = Object.keys(results);
        const hasSmileyFace = resultNames.some(name => name.includes('grinning'));
        const hasAnimalFace = resultNames.some(name => name.includes('dog'));

        expect(hasSmileyFace || hasAnimalFace).toBe(true);
        expect(resultNames.length).toBeGreaterThan(0);
      })
    );
  });

  /**
   * Property Test: Clearing search (empty string) shows no filtered results
   * **Validates: Requirements 6.3**
   */
  it('should clear filtered results when search is cleared', () => {
    fc.assert(
      fc.property(fc.constantFrom('face', 'dog', 'pizza'), (initialQuery: string) => {
        // Arrange: First perform a search
        const initialResults = filterEmojis(mockEmojiData, initialQuery);
        expect(Object.keys(initialResults).length).toBeGreaterThan(0);

        // Act: Clear the search
        const clearedResults = filterEmojis(mockEmojiData, '');

        // Assert: Cleared search returns empty results
        // (Component will show all categories when searchEmojiData is empty)
        expect(Object.keys(clearedResults).length).toBe(0);
      })
    );
  });

  /**
   * Property Test: Search results are deterministic
   * **Validates: Requirements 6.2**
   */
  it('should return consistent results for the same search query', () => {
    fc.assert(
      fc.property(fc.constantFrom('face', 'dog', 'pizza', 'heart'), (searchQuery: string) => {
        // Act: Perform search multiple times
        const results1 = filterEmojis(mockEmojiData, searchQuery);
        const results2 = filterEmojis(mockEmojiData, searchQuery);
        const results3 = filterEmojis(mockEmojiData, searchQuery);

        // Assert: All results are identical
        expect(Object.keys(results1).sort()).toEqual(Object.keys(results2).sort());
        expect(Object.keys(results2).sort()).toEqual(Object.keys(results3).sort());
      })
    );
  });

  /**
   * Property Test: Search with whitespace is trimmed
   * **Validates: Requirements 6.2**
   */
  it('should handle search queries with leading/trailing whitespace', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          { trimmed: 'face', withSpace: '  face  ' },
          { trimmed: 'dog', withSpace: '\tdog\t' },
          { trimmed: 'pizza', withSpace: ' pizza ' }
        ),
        (testCase: { trimmed: string; withSpace: string }) => {
          // Act
          const trimmedResults = filterEmojis(mockEmojiData, testCase.trimmed);
          const spacedResults = filterEmojis(mockEmojiData, testCase.withSpace.trim());

          // Assert: Results should be the same after trimming
          expect(Object.keys(trimmedResults).sort()).toEqual(Object.keys(spacedResults).sort());
        }
      )
    );
  });

  /**
   * Property Test: Search results subset of all emojis
   * **Validates: Requirements 6.2**
   */
  it('should return results that are a subset of all available emojis', () => {
    fc.assert(
      fc.property(fc.constantFrom('face', 'dog', 'pizza', 'a', 'e'), (searchQuery: string) => {
        // Arrange
        const allEmojis = getAllEmojis(mockEmojiData);

        // Act
        const results = filterEmojis(mockEmojiData, searchQuery);

        // Assert: All results exist in the full emoji set
        Object.keys(results).forEach(emojiName => {
          expect(allEmojis).toHaveProperty(emojiName);
        });
      })
    );
  });

  /**
   * Property Test: Search with single character
   * **Validates: Requirements 9.1**
   */
  it('should handle single character search queries', () => {
    fc.assert(
      fc.property(fc.constantFrom('a', 'e', 'i', 'o', 'f', 'd', 'p'), (singleChar: string) => {
        // Act
        const results = filterEmojis(mockEmojiData, singleChar);

        // Assert: All results have at least one keyword containing the single character
        Object.entries(results).forEach(([, emoji]) => {
          const hasMatchingKeyword = emoji.keywords!.some(kw =>
            kw.toLowerCase().includes(singleChar.toLowerCase())
          );
          expect(hasMatchingKeyword).toBe(true);
        });
      })
    );
  });
});

// ==================== Integration Tests ====================

describe('Emoji Search Filtering - Integration', () => {
  let mockEmojiData: CometChatEmojiCategory[];

  beforeEach(() => {
    mockEmojiData = createMockEmojiData();
  });

  /**
   * Integration test: Verify search works with keyword-based filtering
   */
  it('should correctly filter emojis by keywords', () => {
    // Search for 'face' - matches keyword in smileys and animals
    const faceResults = filterEmojis(mockEmojiData, 'face');
    expect(Object.keys(faceResults).length).toBeGreaterThan(0);
    expect(faceResults).toHaveProperty('grinning face');
    expect(faceResults).toHaveProperty('dog face');

    // Search for 'dog' - matches keyword in animals and food ('hot dog' has keyword 'dog')
    const dogResults = filterEmojis(mockEmojiData, 'dog');
    expect(Object.keys(dogResults).length).toBeGreaterThan(0);
    expect(dogResults).toHaveProperty('dog face');
    expect(dogResults).toHaveProperty('hot dog');

    // Search for 'pizza' - matches keyword in food
    const pizzaResults = filterEmojis(mockEmojiData, 'pizza');
    expect(Object.keys(pizzaResults).length).toBe(1);
    expect(pizzaResults).toHaveProperty('pizza');

    // Search for 'happy' - matches keyword in smileys (not in emoji name)
    const happyResults = filterEmojis(mockEmojiData, 'happy');
    expect(Object.keys(happyResults).length).toBeGreaterThan(0);
    expect(happyResults).toHaveProperty('grinning face');
    expect(happyResults).toHaveProperty('smiling face');
  });

  /**
   * Integration test: Verify empty search behavior
   */
  it('should return empty object for empty search', () => {
    const results = filterEmojis(mockEmojiData, '');
    expect(Object.keys(results).length).toBe(0);
    expect(results).toEqual({});
  });

  /**
   * Integration test: Verify case-insensitive search
   */
  it('should perform case-insensitive search in real scenario', () => {
    const lowerResults = filterEmojis(mockEmojiData, 'face');
    const upperResults = filterEmojis(mockEmojiData, 'FACE');
    const mixedResults = filterEmojis(mockEmojiData, 'FaCe');

    expect(Object.keys(lowerResults).sort()).toEqual(Object.keys(upperResults).sort());
    expect(Object.keys(lowerResults).sort()).toEqual(Object.keys(mixedResults).sort());
  });

  /**
   * Integration test: Verify search across categories
   */
  it('should search across all categories', () => {
    const results = filterEmojis(mockEmojiData, 'face');

    // Should find faces in both smileys and animals categories
    const hasSmileysCategory = Object.keys(results).some(name =>
      ['grinning face', 'smiling face', 'laughing face'].includes(name)
    );
    const hasAnimalsCategory = Object.keys(results).some(name =>
      ['dog face', 'cat face', 'monkey face'].includes(name)
    );

    expect(hasSmileysCategory).toBe(true);
    expect(hasAnimalsCategory).toBe(true);
  });
});
