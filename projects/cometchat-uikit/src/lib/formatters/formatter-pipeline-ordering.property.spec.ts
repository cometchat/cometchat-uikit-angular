/**
 * Formatter Pipeline Ordering — Property-Based Tests
 *
 * Categories: Property-Based Pipeline Ordering Invariants, Formatter Chaining
 * Validates: Requirements 6.6
 *
 * Property 25: Formatter Pipeline Ordering
 * For any array of formatters with distinct priorities, applying them in
 * ascending priority order produces deterministic results — each formatter
 * receives the output of the previous one, and shuffling the input array
 * does not change the final output.
 *
 * @module formatters/formatter-pipeline-ordering.property
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { vi, beforeAll, afterAll, describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import { CometChatTextFormatter } from './cometchat-text-formatter';

// ==================== Test Formatter ====================

/**
 * A deterministic test formatter that appends a tag to text.
 * Each instance appends `[tag]` to the input, making ordering observable.
 */
class TagFormatter extends CometChatTextFormatter {
  readonly id: string;
  private tag: string;

  constructor(id: string, priority: number, tag: string) {
    super();
    this.id = id;
    this.priority = priority;
    this.tag = tag;
  }

  getRegex(): RegExp {
    return /./g;
  }

  format(text: string): string {
    this.originalText = text;
    this.formattedText = `${text}[${this.tag}]`;
    this.metadata = { [`tag_${this.id}`]: this.tag };
    return this.formattedText;
  }
}

// ==================== Pipeline Helper ====================

/**
 * Applies an array of formatters in ascending priority order.
 * Each formatter receives the output of the previous one.
 * Formatters are sorted by priority (lower = first), then applied sequentially.
 */
function applyInPriorityOrder(formatters: CometChatTextFormatter[], text: string): string {
  const sorted = [...formatters].sort((a, b) => a.priority - b.priority);
  let current = text;
  for (const fmt of sorted) {
    fmt.reset();
    if (fmt.shouldFormat(current)) {
      current = fmt.format(current);
    }
  }
  return current;
}

// ==================== Arbitraries ====================

/**
 * Generate a TagFormatter with a given index and priority.
 * Tag is a short alphanumeric string for readability.
 */
function arbTagFormatter(index: number, priority: number): fc.Arbitrary<TagFormatter> {
  return fc
    .stringMatching(/^[a-zA-Z0-9]{1,4}$/)
    .map(tag => new TagFormatter(`fmt-${index}`, priority, tag));
}

/**
 * Generate an array of 2–6 TagFormatters with DISTINCT priorities.
 * Distinct priorities ensure deterministic sort order.
 */
const arbFormatters: fc.Arbitrary<TagFormatter[]> = fc.integer({ min: 2, max: 6 }).chain(count =>
  fc
    .uniqueArray(fc.integer({ min: 1, max: 1000 }), {
      minLength: count,
      maxLength: count,
    })
    .chain(priorities =>
      fc.tuple(...priorities.map((p, i) => arbTagFormatter(i, p))).map(arr => arr as TagFormatter[])
    )
);

/** Non-empty input text. */
const arbText = fc.stringMatching(/^[a-zA-Z0-9 ]{1,100}$/);

/** Arbitrary single TagFormatter for single-formatter tests. */
const arbSingleFormatter = fc
  .tuple(fc.integer({ min: 1, max: 1000 }), fc.stringMatching(/^[a-zA-Z0-9]{1,4}$/))
  .map(([priority, tag]) => new TagFormatter('single', priority, tag));

// ==================== Tests ====================

describe('Property 25: Formatter Pipeline Ordering', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  });

  // ---------- Core ordering properties ----------

  /**
   * **Validates: Requirements 6.6**
   *
   * For any array of formatters with distinct priorities and any text,
   * applying them in priority order produces the same result regardless
   * of the original array order (shuffling doesn't matter).
   */
  it('pipeline output is invariant to input array order', () => {
    fc.assert(
      fc.property(arbFormatters, arbText, (formatters, text) => {
        const result1 = applyInPriorityOrder(formatters, text);
        const reversed = [...formatters].reverse();
        const result2 = applyInPriorityOrder(reversed, text);
        expect(result1).toBe(result2);
      }),
      { numRuns: 150 }
    );
  });

  /**
   * **Validates: Requirements 6.6**
   *
   * For any array of formatters, the tags in the output appear in
   * ascending priority order — proving the pipeline sorts correctly.
   */
  it('tags appear in ascending priority order in output', () => {
    fc.assert(
      fc.property(arbFormatters, arbText, (formatters, text) => {
        const result = applyInPriorityOrder(formatters, text);
        const sorted = [...formatters].sort((a, b) => a.priority - b.priority);

        // Each formatter appends [tag], so the order of [tag] substrings
        // in the result must match the priority-sorted order.
        let searchFrom = 0;
        for (const fmt of sorted) {
          const fmtResult = fmt.getFormattedText();
          // The tag portion is the last [...] in the formatted text
          const tagStr = `[${(fmt as any).tag}]`;
          const idx = result.indexOf(tagStr, searchFrom);
          expect(idx).toBeGreaterThanOrEqual(searchFrom);
          searchFrom = idx + tagStr.length;
        }
      }),
      { numRuns: 150 }
    );
  });

  /**
   * **Validates: Requirements 6.6**
   *
   * For any random permutation of the same formatters, the pipeline
   * always produces identical output.
   */
  it('any permutation of formatters yields same result', () => {
    fc.assert(
      fc.property(
        arbFormatters,
        arbText,
        fc.integer({ min: 0, max: 100 }),
        (formatters, text, seed) => {
          const result1 = applyInPriorityOrder(formatters, text);

          // Create a seeded shuffle
          const shuffled = [...formatters];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = (seed + i) % (i + 1);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }

          const result2 = applyInPriorityOrder(shuffled, text);
          expect(result1).toBe(result2);
        }
      ),
      { numRuns: 150 }
    );
  });

  // ---------- Sequential chaining properties ----------

  /**
   * **Validates: Requirements 6.6**
   *
   * Each formatter in the pipeline receives the output of the previous one.
   * The final result equals applying them one-by-one in priority order.
   */
  it('result equals manual sequential application in priority order', () => {
    fc.assert(
      fc.property(arbFormatters, arbText, (formatters, text) => {
        const pipelineResult = applyInPriorityOrder(formatters, text);

        // Manual sequential application
        const sorted = [...formatters].sort((a, b) => a.priority - b.priority);
        let manual = text;
        for (const fmt of sorted) {
          const fresh = new TagFormatter(fmt.id, fmt.priority, (fmt as any).tag);
          manual = fresh.format(manual);
        }

        expect(pipelineResult).toBe(manual);
      }),
      { numRuns: 150 }
    );
  });

  /**
   * **Validates: Requirements 6.6**
   *
   * For N formatters, the output contains exactly N tag markers appended.
   */
  it('output contains exactly N tag markers for N formatters', () => {
    fc.assert(
      fc.property(arbFormatters, arbText, (formatters, text) => {
        const result = applyInPriorityOrder(formatters, text);
        const tagMatches = result.match(/\[[a-zA-Z0-9]{1,4}\]/g) || [];
        expect(tagMatches.length).toBe(formatters.length);
      }),
      { numRuns: 150 }
    );
  });

  /**
   * **Validates: Requirements 6.6**
   *
   * The original text is preserved as a prefix in the output
   * (all formatters only append, never modify the base text).
   */
  it('original text is preserved as prefix in pipeline output', () => {
    fc.assert(
      fc.property(arbFormatters, arbText, (formatters, text) => {
        const result = applyInPriorityOrder(formatters, text);
        expect(result.startsWith(text)).toBe(true);
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Single formatter ----------

  /**
   * **Validates: Requirements 6.6**
   *
   * A single formatter in the pipeline produces text + [tag].
   */
  it('single formatter appends exactly one tag', () => {
    fc.assert(
      fc.property(arbSingleFormatter, arbText, (formatter, text) => {
        const result = applyInPriorityOrder([formatter], text);
        const expected = `${text}[${(formatter as any).tag}]`;
        expect(result).toBe(expected);
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Empty pipeline ----------

  /**
   * **Validates: Requirements 6.6**
   *
   * An empty formatter array returns the input text unchanged.
   */
  it('empty formatter array returns input text unchanged', () => {
    fc.assert(
      fc.property(arbText, text => {
        const result = applyInPriorityOrder([], text);
        expect(result).toBe(text);
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Priority ordering verification ----------

  /**
   * **Validates: Requirements 6.6**
   *
   * The lowest-priority formatter's tag appears first after the base text,
   * and the highest-priority formatter's tag appears last.
   */
  it('lowest priority tag appears first, highest last', () => {
    fc.assert(
      fc.property(arbFormatters, arbText, (formatters, text) => {
        const result = applyInPriorityOrder(formatters, text);
        const sorted = [...formatters].sort((a, b) => a.priority - b.priority);

        const firstTag = `[${(sorted[0] as any).tag}]`;
        const lastTag = `[${(sorted[sorted.length - 1] as any).tag}]`;

        const firstIdx = result.indexOf(firstTag);
        const lastIdx = result.lastIndexOf(lastTag);

        expect(firstIdx).toBeLessThan(lastIdx);
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Determinism ----------

  /**
   * **Validates: Requirements 6.6**
   *
   * Applying the same formatters to the same text twice yields identical results.
   */
  it('pipeline is deterministic — same input always yields same output', () => {
    fc.assert(
      fc.property(arbFormatters, arbText, (formatters, text) => {
        const result1 = applyInPriorityOrder(formatters, text);

        // Reset all formatters and apply again
        for (const fmt of formatters) {
          fmt.reset();
        }

        const result2 = applyInPriorityOrder(formatters, text);
        expect(result1).toBe(result2);
      }),
      { numRuns: 150 }
    );
  });

  // ---------- shouldFormat interaction ----------

  /**
   * **Validates: Requirements 6.6**
   *
   * When a formatter's shouldFormat returns false, it is skipped in the pipeline
   * and the next formatter receives the unmodified text from the previous step.
   */
  it('formatters with shouldFormat=false are skipped in pipeline', () => {
    fc.assert(
      fc.property(arbFormatters, arbText, (formatters, text) => {
        // Make the first formatter (by priority) skip
        const sorted = [...formatters].sort((a, b) => a.priority - b.priority);
        const skippedFmt = sorted[0];
        const origShouldFormat = skippedFmt.shouldFormat.bind(skippedFmt);
        skippedFmt.shouldFormat = () => false;

        const resultWithSkip = applyInPriorityOrder(formatters, text);

        // Restore and apply without the skipped formatter
        skippedFmt.shouldFormat = origShouldFormat;
        const remaining = formatters.filter(f => f !== skippedFmt);
        const resultWithout = applyInPriorityOrder(remaining, text);

        expect(resultWithSkip).toBe(resultWithout);
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Associativity-like property ----------

  /**
   * **Validates: Requirements 6.6**
   *
   * Splitting the formatter array into two halves (by priority), applying
   * the first half then the second half, yields the same result as applying
   * all at once — because priority ordering is consistent.
   */
  it('splitting pipeline by priority and applying in two stages yields same result', () => {
    fc.assert(
      fc.property(arbFormatters, arbText, (formatters, text) => {
        const sorted = [...formatters].sort((a, b) => a.priority - b.priority);
        const mid = Math.floor(sorted.length / 2);
        const firstHalf = sorted.slice(0, mid);
        const secondHalf = sorted.slice(mid);

        // Apply first half, then second half
        const intermediate = applyInPriorityOrder(firstHalf, text);
        // Second half applied directly (already sorted, just apply sequentially)
        let staged = intermediate;
        for (const fmt of secondHalf) {
          fmt.reset();
          if (fmt.shouldFormat(staged)) {
            staged = fmt.format(staged);
          }
        }

        // Apply all at once
        // Reset all formatters first
        for (const fmt of formatters) {
          fmt.reset();
        }
        const allAtOnce = applyInPriorityOrder(formatters, text);

        expect(staged).toBe(allAtOnce);
      }),
      { numRuns: 150 }
    );
  });
});
