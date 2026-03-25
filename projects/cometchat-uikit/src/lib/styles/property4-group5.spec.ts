/**
 * Property 4: Three-tier resolution chain completeness — Group 5 (Shared/Base Components)
 *
 * For any CSS property declaration in a Group 5 component CSS file that uses
 * CSS custom properties for key visual properties (padding, margin, gap,
 * border-radius, background, color, font), the declaration must implement
 * the three-tier chain:
 *
 *   var(--cometchat-{component}-{property}, var(--cometchat-{global-category}-{scale}, {hardcoded-default}))
 *
 * - Tier 1 (outermost): Component-level variable
 * - Tier 2 (middle): Global semantic variable
 * - Tier 3 (innermost): Hardcoded default
 *
 * The test verifies that declarations using var() have a nesting depth of
 * exactly 2 for properties that should follow the three-tier pattern.
 *
 * Exceptions (allowed to have fewer tiers):
 * - height/width properties (may use component-level + pixel default only)
 * - Properties with value `none`, `0`, `transparent`, `inherit`, `auto`
 * - Properties inside @keyframes blocks
 * - Declarations that only reference a single global variable directly
 *   (e.g., `color: var(--cometchat-text-color-primary, #141414)`)
 * - Declarations with complex composite values (e.g., box-shadow, border shorthand with multiple parts)
 * - Shared component global variables used as Tier 1 (e.g., --cometchat-avatar-*, --cometchat-date-*)
 *
 * **Validates: Requirements 10.1, 7.3, 10.5**
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Group 5 CSS files (Shared/Base Components)
// ---------------------------------------------------------------------------
const COMPONENT_DIR = path.resolve(__dirname, '../components');

const GROUP5_FILES = [
  'base-elements/cometchat-avatar/cometchat-avatar.component.css',
  'base-elements/cometchat-date/cometchat-date.component.css',
  'base-elements/cometchat-button/cometchat-button.component.css',
  'base-elements/cometchat-list-item/cometchat-list-item.component.css',
  'base-elements/cometchat-confirm-dialog/cometchat-confirm-dialog.component.css',
  'base-elements/cometchat-action-sheet/cometchat-action-sheet.component.css',
  'base-elements/cometchat-context-menu/cometchat-context-menu.component.css',
  'base-elements/cometchat-emoji-keyboard/cometchat-emoji-keyboard.component.css',
  'base-elements/cometchat-fullscreen-viewer/cometchat-fullscreen-viewer.component.css',
  'base-elements/cometchat-message-preview/cometchat-message-preview.component.css',
  'cometchat-paginated-list/cometchat-paginated-list.component.css',
].map(f => path.join(COMPONENT_DIR, f));

// ---------------------------------------------------------------------------
// Properties that should follow the three-tier pattern
// ---------------------------------------------------------------------------
const THREE_TIER_PROPERTIES: RegExp[] = [
  /^padding(?:-(?:top|right|bottom|left))?$/,
  /^margin(?:-(?:top|right|bottom|left))?$/,
  /^gap(?:$|(?:-(?:row|column)))/,
  /^border-radius$/,
  /^background(?:-color)?$/,
  /^color$/,
  /^font$/,
];

/**
 * Returns true if the CSS property name is one that should follow the
 * three-tier resolution chain.
 */
function isThreeTierProperty(property: string): boolean {
  return THREE_TIER_PROPERTIES.some(re => re.test(property));
}

// ---------------------------------------------------------------------------
// Known global variable prefixes (Tier 2 candidates)
// ---------------------------------------------------------------------------
const GLOBAL_PREFIXES = [
  '--cometchat-padding',
  '--cometchat-margin',
  '--cometchat-spacing',
  '--cometchat-radius',
  '--cometchat-background-color',
  '--cometchat-text-color',
  '--cometchat-icon-color',
  '--cometchat-font',
  '--cometchat-border-color',
  '--cometchat-primary-color',
  '--cometchat-error-color',
  '--cometchat-success-color',
  '--cometchat-warning-color',
  '--cometchat-neutral-color',
  '--cometchat-extended-primary-color',
  '--cometchat-static-white',
  '--cometchat-static-black',
  '--cometchat-primary-button',
  '--cometchat-white-hover',
  '--cometchat-shimmer-gradient-color',
];

/**
 * Known shared component global variable prefixes.
 * These act as Tier 1 (component-level) for shared components like Avatar, Date.
 * When used as the outermost var(), they are acceptable as Tier 1.
 */
const SHARED_COMPONENT_PREFIXES = [
  '--cometchat-avatar-',
  '--cometchat-date-',
  '--cometchat-badge-',
  '--cometchat-status-indicator-',
];

function isGlobalVariable(varName: string): boolean {
  return GLOBAL_PREFIXES.some(prefix => varName === prefix || varName.startsWith(prefix + '-'));
}

function isSharedComponentVariable(varName: string): boolean {
  return SHARED_COMPONENT_PREFIXES.some(prefix => varName.startsWith(prefix));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strips CSS comments from content. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Counts the nesting depth of var() calls in a CSS value.
 *
 * `var(--a, var(--b, 8px))` → depth 2
 * `var(--a, 8px)` → depth 1
 * `var(--a)` → depth 1
 * `var(--a, var(--b, var(--c, 8px)))` → depth 3
 * `var(--a, 8px) var(--b, 8px)` → max depth 1 (two separate var() at same level)
 */
function countVarNestingDepth(value: string): number {
  let maxDepth = 0;
  let currentDepth = 0;

  // Walk through the string tracking var( openings and ) closings
  let i = 0;
  while (i < value.length) {
    if (value.substring(i, i + 4) === 'var(') {
      currentDepth++;
      if (currentDepth > maxDepth) {
        maxDepth = currentDepth;
      }
      i += 4;
    } else if (value[i] === ')') {
      if (currentDepth > 0) {
        currentDepth--;
      }
      i++;
    } else {
      i++;
    }
  }

  return maxDepth;
}

/**
 * Extracts the outermost var() variable name from a CSS value.
 * For `var(--cometchat-button-padding, var(--cometchat-padding-2, 8px))`,
 * returns `--cometchat-button-padding`.
 */
function extractOutermostVarName(value: string): string | null {
  const match = value.match(/var\(\s*(--[\w-]+)/);
  return match ? match[1] : null;
}

/**
 * Checks if a value is a simple/trivial fallback that doesn't need three tiers.
 * Values like `none`, `0`, `transparent`, `auto`, `inherit` are trivial.
 */
function isTrivialValue(value: string): boolean {
  const trimmed = value.trim();
  const trivialValues = [
    'none',
    '0',
    '0px',
    'transparent',
    'auto',
    'inherit',
    'initial',
    'unset',
    '100%',
    'normal',
    'contents',
  ];
  return trivialValues.includes(trimmed);
}

/**
 * Checks if a fallback value is a complex/special CSS value where no
 * meaningful global semantic variable exists as a Tier 2 intermediary.
 *
 * These are legitimate exceptions to the three-tier pattern:
 * - rgba() values (overlay/transparency patterns)
 * - linear-gradient() or other gradient functions
 * - Composite shorthand values (e.g., `0 auto` for centering)
 * - Percentage values (e.g., `50%` for border-radius circles)
 * - Negative pixel values (layout adjustments)
 * - calc() expressions
 */
function isComplexFallback(value: string): boolean {
  const trimmed = value.trim();

  // rgba/hsla/rgb/hsl color functions — no global variable equivalent
  if (/^rgba?\(/.test(trimmed) || /^hsla?\(/.test(trimmed)) return true;

  // Gradient functions
  if (/^(linear|radial|conic)-gradient\(/.test(trimmed)) return true;

  // Composite shorthand values with spaces (e.g., `0 auto`, `8px 0`)
  if (/^\S+\s+\S+/.test(trimmed) && !trimmed.includes('var(')) return true;

  // Percentage values (e.g., `50%`, `100%`)
  if (/^\d+(\.\d+)?%$/.test(trimmed)) return true;

  // Negative pixel values (layout adjustments)
  if (/^-\d+(\.\d+)?px$/.test(trimmed)) return true;

  // calc() expressions
  if (trimmed.startsWith('calc(')) return true;

  return false;
}

/**
 * Checks if a declaration value contains multiple separate var() calls
 * at the top level (e.g., shorthand padding with multiple var() values).
 * Example: `var(--a, var(--b, 8px)) var(--c, var(--d, 16px))`
 */
function hasMultipleTopLevelVars(value: string): boolean {
  let depth = 0;
  let varCount = 0;

  for (let i = 0; i < value.length; i++) {
    if (value.substring(i, i + 4) === 'var(') {
      if (depth === 0) varCount++;
      depth++;
      i += 3;
    } else if (value[i] === ')') {
      depth = Math.max(0, depth - 1);
    }
  }

  return varCount > 1;
}

interface Declaration {
  property: string;
  value: string;
  line: number;
}

/**
 * Extracts CSS declarations for three-tier properties that use var().
 * Skips declarations inside @keyframes blocks.
 */
function extractThreeTierDeclarations(css: string): Declaration[] {
  const cleaned = stripComments(css);
  const declarations: Declaration[] = [];
  const lines = cleaned.split('\n');

  // Track if we're inside a @keyframes block
  let inKeyframes = false;
  let keyframesBraceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Detect @keyframes blocks
    if (trimmed.startsWith('@keyframes')) {
      inKeyframes = true;
      keyframesBraceDepth = 0;
    }

    if (inKeyframes) {
      for (const ch of trimmed) {
        if (ch === '{') keyframesBraceDepth++;
        if (ch === '}') keyframesBraceDepth--;
      }
      if (keyframesBraceDepth <= 0 && trimmed.includes('}')) {
        inKeyframes = false;
      }
      continue;
    }

    // Match property: value patterns (skip custom property definitions starting with --)
    const match = trimmed.match(/^(?!--)([a-z][a-z-]*)\s*:\s*(.*?)\s*;?\s*$/);
    if (match && match[2].includes('var(') && isThreeTierProperty(match[1])) {
      declarations.push({
        property: match[1],
        value: match[2],
        line: i + 1,
      });
    }
  }
  return declarations;
}

interface Violation {
  file: string;
  line: number;
  property: string;
  value: string;
  nestingDepth: number;
  issue: string;
}

/**
 * Audits a single CSS file for three-tier resolution chain violations.
 *
 * A declaration violates the three-tier pattern when:
 * 1. It uses a component-level variable (Tier 1) but the nesting depth is only 1
 *    (missing global tier — goes directly to hardcoded or has no fallback)
 * 2. The outermost variable is a component-level variable but there's no
 *    global semantic variable in the middle tier
 *
 * Exceptions (not violations):
 * - Declarations where the outermost var is a global variable (depth 1 is fine)
 * - Declarations with trivial fallback values (none, 0, transparent, etc.)
 * - Declarations with multiple top-level var() calls (shorthand properties)
 *   where each individual var() follows the pattern
 * - Shared component variables used as Tier 1 (they ARE the component-level)
 */
function auditFile(filePath: string): Violation[] {
  const css = fs.readFileSync(filePath, 'utf-8');
  const declarations = extractThreeTierDeclarations(css);
  const violations: Violation[] = [];
  const fileName = path.basename(filePath);

  for (const decl of declarations) {
    // For shorthand properties with multiple top-level var() calls,
    // check each var() segment individually
    if (hasMultipleTopLevelVars(decl.value)) {
      const segmentViolations = auditMultiVarValue(decl, fileName);
      violations.push(...segmentViolations);
      continue;
    }

    const depth = countVarNestingDepth(decl.value);
    const outermostVar = extractOutermostVarName(decl.value);

    if (!outermostVar) continue;

    // If the outermost var is a global variable, depth 1 is acceptable
    // (using global directly without component-level wrapper is a different concern)
    if (isGlobalVariable(outermostVar)) continue;

    // If the outermost var is a shared component variable (e.g., --cometchat-avatar-background),
    // it acts as Tier 1. Depth 2 is expected (shared-component → global → hardcoded).
    // Depth 1 is acceptable if the fallback is trivial.
    if (isSharedComponentVariable(outermostVar)) {
      if (depth === 1) {
        // Check if the fallback is trivial
        const fallbackMatch = decl.value.match(/var\(\s*--[\w-]+\s*,\s*([^)]+)\)/);
        if (fallbackMatch && isTrivialValue(fallbackMatch[1])) continue;
      }
      // Shared component vars with depth >= 2 are fine
      if (depth >= 2) continue;
    }

    // Component-level variable with depth 1: missing global tier
    // This is the key violation — component var goes directly to hardcoded
    if (depth === 1) {
      // Check if the fallback is a trivial value (acceptable for some cases)
      const fallbackMatch = decl.value.match(/var\(\s*--[\w-]+\s*,\s*([^)]+)\)/);
      if (fallbackMatch && isTrivialValue(fallbackMatch[1])) continue;

      // Check if the fallback is a complex/special CSS value where no
      // meaningful global semantic variable exists
      if (fallbackMatch && isComplexFallback(fallbackMatch[1])) continue;

      // No fallback at all: var(--component-var) — also a potential issue
      // but not specifically a three-tier violation (it's a missing-fallback issue)
      if (!fallbackMatch) continue;

      violations.push({
        file: fileName,
        line: decl.line,
        property: decl.property,
        value: decl.value,
        nestingDepth: depth,
        issue: 'Component-level variable with depth 1 — missing global semantic tier (Tier 2)',
      });
      continue;
    }

    // Depth >= 2 is the expected three-tier pattern — no violation
    // Depth 3+ is also acceptable (extra nesting for complex overrides)
  }

  return violations;
}

/**
 * Audits a declaration with multiple top-level var() calls.
 * Each segment is checked independently.
 * Example: `padding: var(--a, var(--b, 8px)) var(--c, var(--d, 16px))`
 */
function auditMultiVarValue(decl: Declaration, fileName: string): Violation[] {
  const violations: Violation[] = [];

  // Extract individual top-level var() segments
  const segments = extractTopLevelVarSegments(decl.value);

  for (const segment of segments) {
    const depth = countVarNestingDepth(segment);
    const outermostVar = extractOutermostVarName(segment);

    if (!outermostVar) continue;
    if (isGlobalVariable(outermostVar)) continue;
    if (isSharedComponentVariable(outermostVar) && depth >= 2) continue;

    if (depth === 1) {
      const fallbackMatch = segment.match(/var\(\s*--[\w-]+\s*,\s*([^)]+)\)/);
      if (fallbackMatch && isTrivialValue(fallbackMatch[1])) continue;
      if (fallbackMatch && isComplexFallback(fallbackMatch[1])) continue;
      if (!fallbackMatch) continue;

      violations.push({
        file: fileName,
        line: decl.line,
        property: decl.property,
        value: decl.value,
        nestingDepth: depth,
        issue: `Segment "${segment.trim()}" has depth 1 — missing global semantic tier`,
      });
    }
  }

  return violations;
}

/**
 * Extracts top-level var() segments from a CSS value with multiple var() calls.
 * For `var(--a, var(--b, 8px)) var(--c, var(--d, 16px))`,
 * returns [`var(--a, var(--b, 8px))`, `var(--c, var(--d, 16px))`].
 */
function extractTopLevelVarSegments(value: string): string[] {
  const segments: string[] = [];
  let depth = 0;
  let start = -1;

  for (let i = 0; i < value.length; i++) {
    if (value.substring(i, i + 4) === 'var(') {
      if (depth === 0) start = i;
      depth++;
      i += 3;
    } else if (value[i] === ')') {
      depth--;
      if (depth === 0 && start >= 0) {
        segments.push(value.substring(start, i + 1));
        start = -1;
      }
    }
  }

  return segments;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 4: Three-tier resolution chain completeness — Group 5 (Shared/Base Components)', () => {
  // Verify all files exist before running
  it.each(GROUP5_FILES)('CSS file exists: %s', filePath => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  describe('three-tier var() nesting depth for key visual properties', () => {
    it.each(GROUP5_FILES)(
      'declarations follow three-tier pattern (depth >= 2 for component-level vars): %s',
      filePath => {
        const violations = auditFile(filePath);
        if (violations.length > 0) {
          const details = violations
            .map(
              v =>
                `  Line ${v.line}: ${v.property} (depth ${v.nestingDepth})\n    Value: ${v.value}\n    Issue: ${v.issue}`
            )
            .join('\n');
          expect.fail(`${path.basename(filePath)} has three-tier chain violations:\n${details}`);
        }
      }
    );
  });

  describe('padding declarations follow three-tier pattern', () => {
    it.each(GROUP5_FILES)(
      'padding properties have depth >= 2 when using component-level vars: %s',
      filePath => {
        const violations = auditFile(filePath).filter(v => v.property.startsWith('padding'));
        if (violations.length > 0) {
          const details = violations
            .map(
              v =>
                `  Line ${v.line}: ${v.property} (depth ${v.nestingDepth})\n    Value: ${v.value}`
            )
            .join('\n');
          expect.fail(`${path.basename(filePath)} has padding three-tier violations:\n${details}`);
        }
      }
    );
  });

  describe('background declarations follow three-tier pattern', () => {
    it.each(GROUP5_FILES)(
      'background properties have depth >= 2 when using component-level vars: %s',
      filePath => {
        const violations = auditFile(filePath).filter(
          v => v.property === 'background' || v.property === 'background-color'
        );
        if (violations.length > 0) {
          const details = violations
            .map(
              v =>
                `  Line ${v.line}: ${v.property} (depth ${v.nestingDepth})\n    Value: ${v.value}`
            )
            .join('\n');
          expect.fail(
            `${path.basename(filePath)} has background three-tier violations:\n${details}`
          );
        }
      }
    );
  });

  describe('color declarations follow three-tier pattern', () => {
    it.each(GROUP5_FILES)(
      'color properties have depth >= 2 when using component-level vars: %s',
      filePath => {
        const violations = auditFile(filePath).filter(v => v.property === 'color');
        if (violations.length > 0) {
          const details = violations
            .map(
              v =>
                `  Line ${v.line}: ${v.property} (depth ${v.nestingDepth})\n    Value: ${v.value}`
            )
            .join('\n');
          expect.fail(`${path.basename(filePath)} has color three-tier violations:\n${details}`);
        }
      }
    );
  });

  describe('font declarations follow three-tier pattern', () => {
    it.each(GROUP5_FILES)(
      'font properties have depth >= 2 when using component-level vars: %s',
      filePath => {
        const violations = auditFile(filePath).filter(v => v.property === 'font');
        if (violations.length > 0) {
          const details = violations
            .map(
              v =>
                `  Line ${v.line}: ${v.property} (depth ${v.nestingDepth})\n    Value: ${v.value}`
            )
            .join('\n');
          expect.fail(`${path.basename(filePath)} has font three-tier violations:\n${details}`);
        }
      }
    );
  });

  describe('border-radius declarations follow three-tier pattern', () => {
    it.each(GROUP5_FILES)(
      'border-radius properties have depth >= 2 when using component-level vars: %s',
      filePath => {
        const violations = auditFile(filePath).filter(v => v.property === 'border-radius');
        if (violations.length > 0) {
          const details = violations
            .map(
              v =>
                `  Line ${v.line}: ${v.property} (depth ${v.nestingDepth})\n    Value: ${v.value}`
            )
            .join('\n');
          expect.fail(
            `${path.basename(filePath)} has border-radius three-tier violations:\n${details}`
          );
        }
      }
    );
  });

  describe('gap declarations follow three-tier pattern', () => {
    it.each(GROUP5_FILES)(
      'gap properties have depth >= 2 when using component-level vars: %s',
      filePath => {
        const violations = auditFile(filePath).filter(v => v.property.startsWith('gap'));
        if (violations.length > 0) {
          const details = violations
            .map(
              v =>
                `  Line ${v.line}: ${v.property} (depth ${v.nestingDepth})\n    Value: ${v.value}`
            )
            .join('\n');
          expect.fail(`${path.basename(filePath)} has gap three-tier violations:\n${details}`);
        }
      }
    );
  });

  describe('all declarations combined — no three-tier violations across Group 5', () => {
    it('should have zero three-tier chain violations across all Group 5 files', () => {
      const allViolations: Violation[] = [];
      for (const filePath of GROUP5_FILES) {
        allViolations.push(...auditFile(filePath));
      }
      if (allViolations.length > 0) {
        const details = allViolations
          .map(v => `  ${v.file}:${v.line} — ${v.property} (depth ${v.nestingDepth}): ${v.issue}`)
          .join('\n');
        expect.fail(`Found ${allViolations.length} three-tier chain violation(s):\n${details}`);
      }
    });

    it('should find var() declarations in Group 5 files (sanity check)', () => {
      let totalDeclarations = 0;
      for (const filePath of GROUP5_FILES) {
        const css = fs.readFileSync(filePath, 'utf-8');
        const decls = extractThreeTierDeclarations(css);
        totalDeclarations += decls.length;
      }
      // Group 5 has many declarations — ensure we're actually parsing them
      expect(totalDeclarations).toBeGreaterThan(0);
    });
  });
});
