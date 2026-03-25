/**
 * Property 9: All CSS classes follow BEM naming convention
 *
 * Every class selector in a component CSS file must match one of:
 *   cometchat-{component}                          — block
 *   cometchat-{component}__{element}               — element
 *   cometchat-{component}--{modifier}              — block modifier
 *   cometchat-{component}__{element}--{modifier}   — element modifier
 *
 * Where:
 *   {component} is the component name (e.g., "avatar", "conversations")
 *   {element}   is a BEM element name (alphanumeric + hyphens)
 *   {modifier}  is a BEM modifier name (alphanumeric + hyphens)
 *
 * Pseudo-classes (:hover, :focus, :active, :nth-child, etc.) and
 * pseudo-elements (::before, ::after, ::-webkit-scrollbar, etc.) are
 * stripped before validation — they are valid CSS extensions of BEM selectors.
 *
 * Parent-scoped overrides (a component overriding a child component's classes)
 * are allowed as long as the overriding class also starts with "cometchat-".
 *
 * **Property 9: All CSS classes follow BEM naming convention**
 * **Validates: Requirements 5.4**
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { globSync } from 'glob';

// ---------------------------------------------------------------------------
// Discover ALL component CSS files
// ---------------------------------------------------------------------------
const COMPONENTS_DIR = path.resolve(__dirname, '../components');

const ALL_CSS_FILES = globSync('**/*.component.css', { cwd: COMPONENTS_DIR, absolute: true }).sort();

// ---------------------------------------------------------------------------
// BEM validation helpers
// ---------------------------------------------------------------------------

/** Strips CSS block comments. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Strips pseudo-classes, pseudo-elements, and attribute selectors from a
 * selector token so we can validate the base class name.
 *
 * Examples:
 *   .cometchat-avatar:hover          → .cometchat-avatar
 *   .cometchat-list__item:nth-child  → .cometchat-list__item
 *   .cometchat-btn::-webkit-scrollbar → .cometchat-btn
 *   .cometchat-input[aria-invalid="true"] → .cometchat-input
 *   .cometchat-menu[data-show]       → .cometchat-menu
 */
function stripPseudos(selector: string): string {
  // Strip attribute selectors first: [attr], [attr="value"], [attr='value']
  let result = selector.replace(/\[[^\]]*\]/g, '');
  // Strip pseudo-classes and pseudo-elements
  result = result.replace(/:{1,2}[\w-]+(\([^)]*\))?/g, '');
  return result;
}

/**
 * Extracts individual class tokens from a CSS selector string.
 * Handles compound selectors like `.foo .bar`, `.foo.bar`, `.foo > .bar`, etc.
 *
 * Returns only tokens that start with `.` (class selectors).
 */
function extractClassTokens(selector: string): string[] {
  // Split on combinators and whitespace, keeping class tokens
  const tokens = selector.split(/[\s>+~,]+/);
  const classTokens: string[] = [];

  for (const token of tokens) {
    const stripped = stripPseudos(token).trim();
    if (stripped.startsWith('.')) {
      // A token may be a compound selector like .foo.bar — split on . boundaries
      // but keep the leading dot for each class
      const parts = stripped.split(/(?=\.)/);
      for (const part of parts) {
        // Clean up any remaining parentheses or brackets from pseudo-class remnants
        const cleaned = part.replace(/[()[\]]/g, '').trim();
        if (cleaned.startsWith('.') && cleaned.length > 1) {
          classTokens.push(cleaned);
        }
      }
    }
  }

  return classTokens;
}

/**
 * BEM pattern for cometchat components:
 *   Block:            cometchat-{name}
 *   Element:          cometchat-{name}__{element}
 *   Block modifier:   cometchat-{name}--{modifier}
 *   Element modifier: cometchat-{name}__{element}--{modifier}
 *   Nested element:   cometchat-{name}__{element}__{sub-element}
 *
 * Where {name}, {element}, {modifier} are alphanumeric + hyphens (no underscores
 * except the BEM double-underscore separator).
 */
const BEM_PATTERN = /^\.cometchat-[a-z][a-z0-9-]*(__[a-z][a-z0-9-]*){0,2}(--[a-z][a-z0-9-]*)?$/;

function isValidBemClass(className: string): boolean {
  return BEM_PATTERN.test(className);
}

// ---------------------------------------------------------------------------
// Violation detection
// ---------------------------------------------------------------------------

export interface BemViolation {
  file: string;
  line: number;
  selector: string;
  invalidClass: string;
  reason: string;
}

/**
 * Audits a single CSS file for BEM naming violations.
 *
 * Skips:
 * - @keyframes blocks
 * - @font-face blocks
 * - :root and [data-theme] blocks (design token definitions)
 * - Attribute selectors, element selectors, ID selectors (not BEM classes)
 * - Universal selector (*)
 */
export function auditFileForBemViolations(filePath: string): BemViolation[] {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const css = stripComments(raw);
  const lines = css.split('\n');
  const violations: BemViolation[] = [];
  const relPath = path.relative(path.resolve(__dirname, '../../../../../'), filePath);

  // Track block context to skip @keyframes, @font-face, :root, [data-theme]
  let braceDepth = 0;
  let skipDepth = -1; // depth at which we entered a skip block

  for (let i = 0; i < lines.length; i++) {
    const raw_line = lines[i];
    const trimmed = raw_line.trim();
    const lineNum = i + 1;

    // Detect skip blocks
    if (
      trimmed.startsWith('@keyframes') ||
      trimmed.startsWith('@font-face') ||
      trimmed.startsWith(':root') ||
      trimmed.startsWith('[data-theme')
    ) {
      skipDepth = braceDepth;
    }

    const openBraces = (raw_line.match(/\{/g) || []).length;
    const closeBraces = (raw_line.match(/\}/g) || []).length;
    braceDepth += openBraces - closeBraces;

    if (skipDepth >= 0 && braceDepth <= skipDepth) {
      skipDepth = -1;
    }

    if (skipDepth >= 0) continue;

    // Only process lines that look like CSS selectors (contain a class and end with { or ,)
    // A selector line ends with { or is a multi-line selector ending with ,
    if (!trimmed.includes('.cometchat-') && !trimmed.startsWith('.cometchat-')) continue;
    if (!trimmed.endsWith('{') && !trimmed.endsWith(',')) continue;

    // Strip the trailing { or , to get the selector
    const selectorPart = trimmed.replace(/[{,]\s*$/, '').trim();

    // Extract class tokens
    const classTokens = extractClassTokens(selectorPart);

    for (const token of classTokens) {
      if (!token.startsWith('.cometchat-')) {
        // Non-cometchat class in a cometchat component file
        violations.push({
          file: relPath,
          line: lineNum,
          selector: selectorPart,
          invalidClass: token,
          reason: `Class "${token}" does not start with "cometchat-" prefix`,
        });
        continue;
      }

      if (!isValidBemClass(token)) {
        violations.push({
          file: relPath,
          line: lineNum,
          selector: selectorPart,
          invalidClass: token,
          reason: `Class "${token}" does not match BEM pattern cometchat-{block}[__{element}][--{modifier}]`,
        });
      }
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 9: All CSS classes follow BEM naming convention', () => {
  it('should discover component CSS files (sanity check)', () => {
    expect(ALL_CSS_FILES.length).toBeGreaterThan(50);
  });

  describe('all class selectors must start with cometchat- prefix', () => {
    it.each(ALL_CSS_FILES)('no non-cometchat classes: %s', filePath => {
      const violations = auditFileForBemViolations(filePath).filter(v =>
        v.reason.includes('does not start with')
      );
      if (violations.length > 0) {
        const details = violations
          .map(v => `  Line ${v.line}: "${v.invalidClass}" in selector "${v.selector}"`)
          .join('\n');
        expect.fail(
          `${path.basename(filePath)} has ${violations.length} non-cometchat class(es):\n${details}`
        );
      }
    });
  });

  describe('all cometchat- classes must follow BEM pattern', () => {
    it.each(ALL_CSS_FILES)('classes match cometchat-{block}[__{element}][--{modifier}]: %s', filePath => {
      const violations = auditFileForBemViolations(filePath).filter(v =>
        v.reason.includes('does not match BEM')
      );
      if (violations.length > 0) {
        const details = violations
          .map(v => `  Line ${v.line}: "${v.invalidClass}"\n    Selector: ${v.selector}\n    ${v.reason}`)
          .join('\n');
        expect.fail(
          `${path.basename(filePath)} has ${violations.length} BEM naming violation(s):\n${details}`
        );
      }
    });
  });

  describe('summary — zero BEM violations across all component CSS files', () => {
    it('should have zero BEM naming violations total', () => {
      const allViolations: BemViolation[] = [];
      for (const filePath of ALL_CSS_FILES) {
        allViolations.push(...auditFileForBemViolations(filePath));
      }
      if (allViolations.length > 0) {
        const byFile = allViolations.reduce(
          (acc, v) => {
            const base = path.basename(v.file);
            acc[base] = (acc[base] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );
        expect.fail(
          `Found ${allViolations.length} BEM naming violation(s) across ${ALL_CSS_FILES.length} files.\n` +
          `By file: ${JSON.stringify(byFile, null, 2)}\n` +
          `First 10:\n${allViolations.slice(0, 10).map(v => `  ${path.basename(v.file)}:${v.line} — ${v.invalidClass}`).join('\n')}`
        );
      }
    });

    it('should find class selectors to audit (sanity check)', () => {
      let totalClasses = 0;
      for (const filePath of ALL_CSS_FILES) {
        const css = stripComments(fs.readFileSync(filePath, 'utf-8'));
        const matches = css.match(/\.cometchat-[\w-]+/g) || [];
        totalClasses += matches.length;
      }
      // With ~60 component files, we expect many class selectors
      expect(totalClasses).toBeGreaterThan(500);
    });
  });
});
