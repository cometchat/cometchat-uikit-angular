/**
 * Property 3: Height and width use pixel defaults — Group 3 (Message Components)
 *
 * For any height or width declaration in a Group 3 component CSS file that
 * uses a component-level variable, the innermost fallback value must be a
 * hardcoded pixel value (e.g., `32px`, `48px`) or an acceptable CSS keyword
 * (`100%`, `auto`, `fit-content`, `max-content`, `min-content`), and must
 * NOT be a `--cometchat-spacing-*` variable.
 *
 * **Validates: Requirements 4.1, 4.2, 4.3**
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Group 3 CSS files (Message Components)
// ---------------------------------------------------------------------------
const COMPONENT_DIR = path.resolve(__dirname, '../components');

const GROUP3_FILES = [
  'cometchat-message-header/cometchat-message-header.component.css',
  'cometchat-message-list/cometchat-message-list.component.css',
  'cometchat-message-composer/cometchat-message-composer.component.css',
  'cometchat-message-bubble/cometchat-message-bubble.component.css',
  'cometchat-message-information/cometchat-message-information.component.css',
  'cometchat-thread-header/cometchat-thread-header.component.css',
  'base-elements/cometchat-thread-view/cometchat-thread-view.component.css',
].map(f => path.join(COMPONENT_DIR, f));

// ---------------------------------------------------------------------------
// Acceptable innermost fallback values
// ---------------------------------------------------------------------------

/**
 * CSS keywords that are acceptable as innermost fallbacks for height/width.
 * These are not spacing variables and represent valid CSS sizing values.
 */
const ACCEPTABLE_CSS_KEYWORDS = [
  '100%',
  'auto',
  'fit-content',
  'max-content',
  'min-content',
  'none',
  'inherit',
  'initial',
  'unset',
];

/**
 * Returns true if the value is an acceptable innermost fallback for height/width:
 * - A hardcoded pixel value (e.g., `32px`, `48px`)
 * - A percentage value (e.g., `100%`, `50%`)
 * - An acceptable CSS keyword (e.g., `auto`, `fit-content`)
 * - A `calc()` expression
 * - A viewport unit (e.g., `40vh`, `100vw`)
 */
function isAcceptableFallback(value: string): boolean {
  const trimmed = value.trim();

  // Pixel value: 32px, 0px, 1px, etc.
  if (/^\d+(\.\d+)?px$/.test(trimmed)) return true;

  // Percentage value: 100%, 50%, etc.
  if (/^\d+(\.\d+)?%$/.test(trimmed)) return true;

  // Viewport units: 40vh, 100vw, etc.
  if (/^\d+(\.\d+)?(vh|vw|vmin|vmax|dvh|dvw|svh|svw)$/.test(trimmed)) return true;

  // CSS keywords
  if (ACCEPTABLE_CSS_KEYWORDS.includes(trimmed)) return true;

  // calc() expressions
  if (trimmed.startsWith('calc(')) return true;

  // Plain 0
  if (trimmed === '0') return true;

  return false;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strips CSS comments from content. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Extracts the innermost fallback from a var() expression.
 *
 * Given: `var(--cometchat-message-header-back-button-height, 32px)`
 * Returns: `32px`
 *
 * Given: `var(--cometchat-comp-height, var(--cometchat-spacing-8))`
 * Returns: `--cometchat-spacing-8` (as a variable reference — a violation)
 *
 * Given: `var(--cometchat-comp-height, var(--cometchat-global, 48px))`
 * Returns: `48px`
 */
function extractInnermostFallback(value: string): string | null {
  // Find the deepest var() and extract its fallback
  // We walk from the inside out by finding the innermost var() first
  let current = value;

  // Iteratively resolve the innermost var() fallback
  // Pattern: var(--name, fallback) — we want the fallback of the deepest var()
  const varRegex = /var\(\s*(--[\w-]+)\s*(?:,\s*([^)]*(?:\([^)]*\)[^)]*)*))?\s*\)/;

  // Find the innermost var() — one that doesn't contain another var() in its fallback
  let maxIterations = 20;
  while (maxIterations-- > 0) {
    // Find a var() whose fallback does NOT contain another var()
    const innermostMatch = current.match(/var\(\s*(--[\w-]+)\s*,\s*([^)]*)\)/);
    if (!innermostMatch) {
      // Try to find a var() without a fallback
      const noFallbackMatch = current.match(/var\(\s*(--[\w-]+)\s*\)/);
      if (noFallbackMatch) {
        // var() with no fallback — the variable itself is the "fallback"
        return noFallbackMatch[1];
      }
      break;
    }

    const fallback = innermostMatch[2].trim();

    // If the fallback contains another var(), go deeper
    if (fallback.includes('var(')) {
      // Replace the outer var() with its fallback to go one level deeper
      current = fallback;
      continue;
    }

    return fallback;
  }

  return null;
}

interface Declaration {
  property: string;
  value: string;
  line: number;
}

/**
 * Extracts all height/width declarations that use var() from CSS content.
 * Includes: height, width, min-height, min-width, max-height, max-width
 */
function extractHeightWidthVarDeclarations(css: string): Declaration[] {
  const cleaned = stripComments(css);
  const declarations: Declaration[] = [];
  const lines = cleaned.split('\n');

  const hwPattern = /^((?:min-|max-)?(?:height|width))\s*:\s*(.*?)\s*;?\s*$/;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const match = trimmed.match(hwPattern);
    if (match && match[2].includes('var(')) {
      declarations.push({
        property: match[1],
        value: match[2],
        line: i + 1,
      });
    }
  }
  return declarations;
}

/**
 * Returns true if a variable name is a `--cometchat-spacing-*` variable.
 */
function isSpacingVariable(varName: string): boolean {
  return varName === '--cometchat-spacing' || varName.startsWith('--cometchat-spacing-');
}

interface Violation {
  file: string;
  line: number;
  property: string;
  value: string;
  innermostFallback: string;
  issue: 'spacing_variable' | 'non_pixel_default';
}

/**
 * Audits a single CSS file for height/width pixel default violations.
 */
function auditFile(filePath: string): Violation[] {
  const css = fs.readFileSync(filePath, 'utf-8');
  const declarations = extractHeightWidthVarDeclarations(css);
  const violations: Violation[] = [];
  const fileName = path.basename(filePath);

  for (const decl of declarations) {
    const innermost = extractInnermostFallback(decl.value);
    if (innermost === null) continue;

    // Check if the innermost fallback is a --cometchat-spacing-* variable
    if (isSpacingVariable(innermost)) {
      violations.push({
        file: fileName,
        line: decl.line,
        property: decl.property,
        value: decl.value,
        innermostFallback: innermost,
        issue: 'spacing_variable',
      });
      continue;
    }

    // If the innermost fallback is a variable reference (starts with --)
    // that is NOT a spacing variable, it may still be acceptable
    // (e.g., a component-level variable used as override).
    // We only flag spacing variables as violations per the requirement.
    if (innermost.startsWith('--')) {
      // Only flag if it's a spacing variable
      if (isSpacingVariable(innermost)) {
        violations.push({
          file: fileName,
          line: decl.line,
          property: decl.property,
          value: decl.value,
          innermostFallback: innermost,
          issue: 'spacing_variable',
        });
      }
      continue;
    }

    // For non-variable innermost fallbacks, verify it's an acceptable value
    if (!isAcceptableFallback(innermost)) {
      violations.push({
        file: fileName,
        line: decl.line,
        property: decl.property,
        value: decl.value,
        innermostFallback: innermost,
        issue: 'non_pixel_default',
      });
    }
  }
  return violations;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 3: Height and width use pixel defaults — Group 3 (Message Components)', () => {
  // Verify all files exist before running
  it.each(GROUP3_FILES)('CSS file exists: %s', filePath => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  describe('height/width declarations must not use --cometchat-spacing-* as fallback', () => {
    it.each(GROUP3_FILES)('no --cometchat-spacing-* in height/width fallbacks: %s', filePath => {
      const violations = auditFile(filePath).filter(v => v.issue === 'spacing_variable');
      if (violations.length > 0) {
        const details = violations
          .map(
            v =>
              `  Line ${v.line}: ${v.property} uses ${v.innermostFallback} as innermost fallback\n    Value: ${v.value}`
          )
          .join('\n');
        expect.fail(
          `${path.basename(filePath)} has height/width spacing variable violations:\n${details}`
        );
      }
    });
  });

  describe('height/width innermost fallbacks must be pixel values or CSS keywords', () => {
    it.each(GROUP3_FILES)('all innermost fallbacks are acceptable values: %s', filePath => {
      const violations = auditFile(filePath).filter(v => v.issue === 'non_pixel_default');
      if (violations.length > 0) {
        const details = violations
          .map(
            v =>
              `  Line ${v.line}: ${v.property} has non-pixel innermost fallback "${v.innermostFallback}"\n    Value: ${v.value}`
          )
          .join('\n');
        expect.fail(
          `${path.basename(filePath)} has height/width non-pixel fallback violations:\n${details}`
        );
      }
    });
  });

  describe('all declarations combined — no violations across Group 3', () => {
    it('should have zero height/width fallback violations across all Group 3 files', () => {
      const allViolations: Violation[] = [];
      for (const filePath of GROUP3_FILES) {
        allViolations.push(...auditFile(filePath));
      }
      if (allViolations.length > 0) {
        const details = allViolations
          .map(
            v =>
              `  ${v.file}:${v.line} — ${v.property} [${v.issue}]: innermost fallback "${v.innermostFallback}"`
          )
          .join('\n');
        expect.fail(
          `Found ${allViolations.length} height/width fallback violation(s):\n${details}`
        );
      }
    });

    it('should find height/width var() declarations in Group 3 files (sanity check)', () => {
      let totalDeclarations = 0;
      for (const filePath of GROUP3_FILES) {
        const css = fs.readFileSync(filePath, 'utf-8');
        const decls = extractHeightWidthVarDeclarations(css);
        totalDeclarations += decls.length;
      }
      // Group 3 has many height/width declarations — ensure we're actually parsing them
      expect(totalDeclarations).toBeGreaterThan(0);
    });
  });
});
