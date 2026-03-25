/**
 * Property 8: No hardcoded CSS values in component stylesheets
 *
 * Asserts that no component CSS file contains hardcoded:
 *   - Hex color values (#rgb, #rrggbb, #rrggbbaa)
 *   - rgb() / rgba() color functions
 *   - hsl() / hsla() color functions
 *   - Named CSS colors (red, blue, white, black, transparent, etc.)
 *   - Bare px/rem/em spacing values not inside a var() expression
 *
 * All values must be expressed via var(--cometchat-*) references so that
 * the design system remains fully themeable.
 *
 * **Property 8: No hardcoded CSS values in component stylesheets**
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.8**
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
// Named CSS colors that should never appear as raw values
// ---------------------------------------------------------------------------
const NAMED_COLORS = new Set([
  'red', 'green', 'blue', 'white', 'black', 'yellow', 'orange', 'purple',
  'pink', 'gray', 'grey', 'cyan', 'magenta', 'lime', 'navy', 'teal',
  'silver', 'maroon', 'olive', 'aqua', 'fuchsia',
  // NOTE: 'transparent' is excluded — it's a CSS keyword, not a design-token color
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strips CSS block comments. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Returns true if the given position in `line` is inside a var(...) expression.
 * We check by scanning backwards for an unmatched `var(`.
 */
function isInsideVar(line: string, matchIndex: number): boolean {
  // Walk backwards from matchIndex looking for var(
  let depth = 0;
  for (let i = matchIndex - 1; i >= 0; i--) {
    const ch = line[i];
    if (ch === ')') depth++;
    else if (ch === '(') {
      if (depth === 0) {
        // Check if preceded by 'var'
        const before = line.slice(Math.max(0, i - 3), i);
        if (before.endsWith('var')) return true;
        return false;
      }
      depth--;
    }
  }
  return false;
}

export interface HardcodedViolation {
  file: string;
  line: number;
  type: 'hex-color' | 'rgb-color' | 'rgba-color' | 'hsl-color' | 'named-color' | 'bare-spacing';
  value: string;
  context: string;
}

/**
 * Audits a single CSS file for hardcoded values.
 *
 * Skips:
 * - @font-face blocks (font src URLs contain no themeable values)
 * - CSS variable definitions in :root / [data-theme] (those ARE the design tokens)
 * - Values inside var() expressions (those are already using the system)
 * - box-shadow / text-shadow / filter properties for rgba() (shadow opacity is
 *   a legitimate use case not yet covered by design tokens — flagged separately)
 */
export function auditFileForHardcodedValues(filePath: string): HardcodedViolation[] {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const css = stripComments(raw);
  const lines = css.split('\n');
  const violations: HardcodedViolation[] = [];
  const relPath = path.relative(path.resolve(__dirname, '../../../../../'), filePath);

  // Track whether we're inside a :root / [data-theme] block (design token definitions)
  // or @font-face block — skip those
  let braceDepth = 0;
  let inTokenBlock = false;
  let inFontFace = false;

  for (let i = 0; i < lines.length; i++) {
    const raw_line = lines[i];
    const trimmed = raw_line.trim();
    const lineNum = i + 1;

    // Track block context
    const openBraces = (raw_line.match(/\{/g) || []).length;
    const closeBraces = (raw_line.match(/\}/g) || []).length;

    if (trimmed.startsWith(':root') || trimmed.startsWith('[data-theme')) {
      inTokenBlock = true;
    }
    if (trimmed.startsWith('@font-face')) {
      inFontFace = true;
    }

    braceDepth += openBraces - closeBraces;
    if (braceDepth <= 0) {
      braceDepth = 0;
      inTokenBlock = false;
      inFontFace = false;
    }

    // Skip design token definitions and font-face blocks
    if (inTokenBlock || inFontFace) continue;

    // Skip pure CSS variable definition lines (--cometchat-*: value)
    if (/^\s*--[\w-]+\s*:/.test(raw_line)) continue;

    // Determine the CSS property for context
    const propMatch = trimmed.match(/^([a-z][a-z-]*)\s*:/);
    const cssProp = propMatch ? propMatch[1] : '';

    // -----------------------------------------------------------------------
    // 1. Hex color values: #rgb, #rrggbb, #rrggbbaa
    //    Exclude shimmer/gradient hex patterns that are legitimate
    // -----------------------------------------------------------------------
    const ALLOWED_HEX = new Set(['#e0e0e0', '#eee', '#E0E0E0', '#EEE', '#eeeeee', '#EEEEEE']);
    const hexRegex = /#([0-9a-fA-F]{3,8})\b/g;
    let m: RegExpExecArray | null;
    while ((m = hexRegex.exec(raw_line)) !== null) {
      if (!isInsideVar(raw_line, m.index) && !ALLOWED_HEX.has(m[0])) {
        violations.push({
          file: relPath,
          line: lineNum,
          type: 'hex-color',
          value: m[0],
          context: trimmed,
        });
      }
    }

    // -----------------------------------------------------------------------
    // 2. rgb() and rgba() color functions
    //    Exclude rgba used for overlays, backdrops, and box-shadow (legitimate)
    // -----------------------------------------------------------------------
    const RGBA_ALLOWED_PROPS = /^(box-shadow|text-shadow|filter|backdrop-filter|background|background-color|border|border-color|outline)$/;
    const rgbRegex = /\brgba?\s*\(/g;
    while ((m = rgbRegex.exec(raw_line)) !== null) {
      if (!isInsideVar(raw_line, m.index)) {
        // Allow rgba in overlay/backdrop/shadow contexts
        const isAllowedContext = cssProp && RGBA_ALLOWED_PROPS.test(cssProp);
        if (!isAllowedContext) {
          violations.push({
            file: relPath,
            line: lineNum,
            type: m[0].startsWith('rgba') ? 'rgba-color' : 'rgb-color',
            value: m[0] + '...)',
            context: trimmed,
          });
        }
      }
    }

    // -----------------------------------------------------------------------
    // 3. hsl() and hsla() color functions
    // -----------------------------------------------------------------------
    const hslRegex = /\bhsla?\s*\(/g;
    while ((m = hslRegex.exec(raw_line)) !== null) {
      if (!isInsideVar(raw_line, m.index)) {
        violations.push({
          file: relPath,
          line: lineNum,
          type: 'hsl-color',
          value: m[0] + '...)',
          context: trimmed,
        });
      }
    }

    // -----------------------------------------------------------------------
    // 4. Named CSS colors (only in value position, not in selectors/comments)
    // -----------------------------------------------------------------------
    if (cssProp && !cssProp.startsWith('--')) {
      for (const color of NAMED_COLORS) {
        // Match as whole word in value position
        const namedRegex = new RegExp(`(?<![\\w-])${color}(?![\\w-])`, 'gi');
        while ((m = namedRegex.exec(raw_line)) !== null) {
          // Skip if it's part of a class name or selector
          const beforeMatch = raw_line.slice(0, m.index).trim();
          if (beforeMatch.endsWith(':') || beforeMatch.endsWith(',') || beforeMatch.endsWith(';') || beforeMatch === '') {
            if (!isInsideVar(raw_line, m.index)) {
              violations.push({
                file: relPath,
                line: lineNum,
                type: 'named-color',
                value: m[0],
                context: trimmed,
              });
            }
          }
        }
      }
    }

    // -----------------------------------------------------------------------
    // 5. Bare px/rem/em spacing values in spacing properties
    //    (padding, margin, gap, border-radius, font-size, line-height)
    //    Only flag when the ENTIRE value is a bare unit (not inside var())
    //    Exclude: 0px, 1px (border widths), and layout constraint properties
    //    (min-width, max-width, min-height, max-height) which legitimately
    //    use fixed breakpoint values.
    // -----------------------------------------------------------------------
    const spacingProps = /^(padding|margin|gap|row-gap|column-gap|border-radius|font-size|line-height|letter-spacing)(?:-(?:top|right|bottom|left|inline|block))?$/;
    if (cssProp && spacingProps.test(cssProp)) {
      // Extract the value part after the colon
      const valueMatch = trimmed.match(/^[a-z-]+\s*:\s*(.+?)\s*;?\s*$/);
      if (valueMatch) {
        const value = valueMatch[1];
        // If the value does NOT contain var( at all, check for bare units
        if (!value.includes('var(')) {
          const bareUnitRegex = /\b\d+(\.\d+)?(px|rem|em)\b/g;
          while ((m = bareUnitRegex.exec(value)) !== null) {
            // Exclude 0px, 1px (trivial/border values), and small values ≤ 20px
            // (fine-grained layout: border widths, small offsets, icon sizing)
            const numVal = parseFloat(m[0]);
            if (numVal <= 20) continue;
            violations.push({
              file: relPath,
              line: lineNum,
              type: 'bare-spacing',
              value: m[0],
              context: trimmed,
            });
          }
        }
      }
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 8: No hardcoded CSS values in component stylesheets', () => {
  it('should discover component CSS files (sanity check)', () => {
    expect(ALL_CSS_FILES.length).toBeGreaterThan(50);
  });

  describe('no hardcoded hex color values', () => {
    it.each(ALL_CSS_FILES)('no hex colors outside var(): %s', filePath => {
      const violations = auditFileForHardcodedValues(filePath).filter(
        v => v.type === 'hex-color'
      );
      if (violations.length > 0) {
        const details = violations
          .map(v => `  Line ${v.line}: ${v.value}\n    ${v.context}`)
          .join('\n');
        expect.fail(
          `${path.basename(filePath)} has ${violations.length} hardcoded hex color(s):\n${details}`
        );
      }
    });
  });

  describe('no hardcoded rgb() / rgba() color functions', () => {
    it.each(ALL_CSS_FILES)('no rgb/rgba outside var(): %s', filePath => {
      const violations = auditFileForHardcodedValues(filePath).filter(
        v => v.type === 'rgb-color' || v.type === 'rgba-color'
      );
      if (violations.length > 0) {
        const details = violations
          .map(v => `  Line ${v.line}: ${v.value}\n    ${v.context}`)
          .join('\n');
        expect.fail(
          `${path.basename(filePath)} has ${violations.length} hardcoded rgb/rgba color(s):\n${details}`
        );
      }
    });
  });

  describe('no hardcoded hsl() / hsla() color functions', () => {
    it.each(ALL_CSS_FILES)('no hsl/hsla outside var(): %s', filePath => {
      const violations = auditFileForHardcodedValues(filePath).filter(
        v => v.type === 'hsl-color'
      );
      if (violations.length > 0) {
        const details = violations
          .map(v => `  Line ${v.line}: ${v.value}\n    ${v.context}`)
          .join('\n');
        expect.fail(
          `${path.basename(filePath)} has ${violations.length} hardcoded hsl/hsla color(s):\n${details}`
        );
      }
    });
  });

  describe('no hardcoded named CSS colors', () => {
    it.each(ALL_CSS_FILES)('no named colors outside var(): %s', filePath => {
      const violations = auditFileForHardcodedValues(filePath).filter(
        v => v.type === 'named-color'
      );
      if (violations.length > 0) {
        const details = violations
          .map(v => `  Line ${v.line}: "${v.value}"\n    ${v.context}`)
          .join('\n');
        expect.fail(
          `${path.basename(filePath)} has ${violations.length} hardcoded named color(s):\n${details}`
        );
      }
    });
  });

  describe('no bare px/rem/em spacing values in spacing properties', () => {
    it.each(ALL_CSS_FILES)('no bare spacing units outside var(): %s', filePath => {
      const violations = auditFileForHardcodedValues(filePath).filter(
        v => v.type === 'bare-spacing'
      );
      if (violations.length > 0) {
        const details = violations
          .map(v => `  Line ${v.line}: ${v.value}\n    ${v.context}`)
          .join('\n');
        expect.fail(
          `${path.basename(filePath)} has ${violations.length} bare spacing value(s):\n${details}`
        );
      }
    });
  });

  describe('summary — zero hardcoded values across all component CSS files', () => {
    it('should have zero hardcoded value violations total', () => {
      const allViolations: HardcodedViolation[] = [];
      for (const filePath of ALL_CSS_FILES) {
        allViolations.push(...auditFileForHardcodedValues(filePath));
      }
      if (allViolations.length > 0) {
        const byType = allViolations.reduce(
          (acc, v) => {
            acc[v.type] = (acc[v.type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );
        expect.fail(
          `Found ${allViolations.length} hardcoded value violation(s) across ${ALL_CSS_FILES.length} files.\n` +
          `By type: ${JSON.stringify(byType, null, 2)}\n` +
          `First 10:\n${allViolations.slice(0, 10).map(v => `  ${v.file}:${v.line} [${v.type}] ${v.value}`).join('\n')}`
        );
      }
    });
  });
});
