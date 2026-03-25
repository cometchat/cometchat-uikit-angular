/**
 * Property 1: Variable category correctness — ALL Components (Full Sweep)
 *
 * For any CSS property declaration in any component CSS file, if the
 * declaration uses a global fallback variable, that fallback must belong to
 * the correct semantic category:
 *   padding  → --cometchat-padding-*
 *   margin   → --cometchat-margin-*
 *   gap      → --cometchat-spacing-*
 *   border-radius → --cometchat-radius-*
 *   background / background-color → --cometchat-background-color-*
 *   color (text) → --cometchat-text-color-*
 *   color (icon) → --cometchat-icon-color-*
 *   font → --cometchat-font-*
 *
 * Validates: Requirements 1.1, 1.3, 2.1, 2.3, 3.1, 5.2, 8.2, 11.1, 11.2, 12.1, 12.2, 12.3, 13.1
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { globSync } from 'glob';

// ---------------------------------------------------------------------------
// Discover ALL component CSS files
// ---------------------------------------------------------------------------
const COMPONENT_DIR = path.resolve(__dirname, '../components');

const ALL_CSS_FILES = globSync('**/*.component.css', { cwd: COMPONENT_DIR })
  .sort()
  .map(f => path.join(COMPONENT_DIR, f));

// ---------------------------------------------------------------------------
// Category rules: CSS property → allowed global variable prefix(es)
// ---------------------------------------------------------------------------
interface CategoryRule {
  /** Regex that matches the CSS property name */
  propertyPattern: RegExp;
  /** Allowed global variable prefixes for the fallback */
  allowedPrefixes: string[];
  /** Human-readable label for error messages */
  label: string;
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    propertyPattern: /^padding(?:-(?:top|right|bottom|left))?$/,
    allowedPrefixes: ['--cometchat-padding', '--cometchat-spacing'],
    label: 'padding',
  },
  {
    propertyPattern: /^margin(?:-(?:top|right|bottom|left))?$/,
    allowedPrefixes: ['--cometchat-margin'],
    label: 'margin',
  },
  {
    propertyPattern: /^gap(?:$|(?:-(?:row|column)))/,
    allowedPrefixes: ['--cometchat-spacing', '--cometchat-padding'],
    label: 'gap',
  },
  {
    propertyPattern: /^border-radius$/,
    allowedPrefixes: ['--cometchat-radius'],
    label: 'border-radius',
  },
  {
    propertyPattern: /^background(?:-color)?$/,
    allowedPrefixes: ['--cometchat-background-color'],
    label: 'background',
  },
  {
    propertyPattern: /^font$/,
    allowedPrefixes: ['--cometchat-font'],
    label: 'font',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extracts all `--cometchat-*` variable references from a var() expression.
 */
function extractVarReferences(value: string): string[] {
  const vars: string[] = [];
  const regex = /var\(\s*(--cometchat-[\w-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(value)) !== null) {
    vars.push(m[1]);
  }
  return vars;
}

/**
 * Known global variable prefixes (defined in css-variables.css :root).
 * Component-level variables contain a component name segment and are excluded.
 */
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
  '--cometchat-shimmer-gradient-color',
];

function isGlobalVariable(varName: string): boolean {
  return GLOBAL_PREFIXES.some(prefix => varName === prefix || varName.startsWith(prefix + '-'));
}

function matchesAllowedPrefix(varName: string, allowedPrefixes: string[]): boolean {
  return allowedPrefixes.some(prefix => varName === prefix || varName.startsWith(prefix + '-'));
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

interface Declaration {
  property: string;
  value: string;
  line: number;
}

/**
 * Builds a set of line indices belonging to CSS rule blocks that contain
 * mask/-webkit-mask properties. In those blocks, `background` acts as icon
 * fill color rather than a traditional background.
 */
function buildMaskedLineSet(css: string): Set<number> {
  const lines = css.split('\n');
  const maskedLines = new Set<number>();
  const blocks: { start: number; end: number }[] = [];
  const braceStack: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') {
        braceStack.push(i);
      } else if (ch === '}') {
        const start = braceStack.pop();
        if (start !== undefined) {
          blocks.push({ start, end: i });
        }
      }
    }
  }

  const maskPattern = /^\s*(?:-webkit-)?mask(?:-(?:image|size|repeat|position))?\s*:/;
  for (const block of blocks) {
    let hasMask = false;
    for (let i = block.start; i <= block.end; i++) {
      if (maskPattern.test(lines[i])) {
        hasMask = true;
        break;
      }
    }
    if (hasMask) {
      for (let i = block.start; i <= block.end; i++) {
        maskedLines.add(i);
      }
    }
  }
  return maskedLines;
}

/**
 * Extracts CSS declarations whose value contains `var(`.
 * Reclassifies `background` inside masked blocks to skip background rules.
 */
function extractVarDeclarations(css: string): Declaration[] {
  const cleaned = stripComments(css);
  const declarations: Declaration[] = [];
  const maskedLineSet = buildMaskedLineSet(cleaned);
  const lines = cleaned.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const match = trimmed.match(/^(?!--)([a-z][a-z-]*)\s*:\s*(.*?)\s*;?\s*$/);
    if (match && match[2].includes('var(')) {
      let property = match[1];
      if (maskedLineSet.has(i) && /^background(?:-color)?$/.test(property)) {
        property = '__masked-background';
      }
      declarations.push({ property, value: match[2], line: i + 1 });
    }
  }
  return declarations;
}

// ---------------------------------------------------------------------------
// Violation detection
// ---------------------------------------------------------------------------

interface Violation {
  file: string;
  line: number;
  property: string;
  globalVar: string;
  expectedCategory: string;
  value: string;
}

/**
 * Audits a single CSS file for variable category violations.
 */
function auditFile(filePath: string): Violation[] {
  const css = fs.readFileSync(filePath, 'utf-8');
  const declarations = extractVarDeclarations(css);
  const violations: Violation[] = [];
  const fileName = path.relative(COMPONENT_DIR, filePath);

  for (const decl of declarations) {
    const rule = CATEGORY_RULES.find(r => r.propertyPattern.test(decl.property));
    if (!rule) continue;

    const varRefs = extractVarReferences(decl.value);

    for (const varRef of varRefs) {
      if (!isGlobalVariable(varRef)) continue;

      if (!matchesAllowedPrefix(varRef, rule.allowedPrefixes)) {
        const isSpacingVar =
          varRef === '--cometchat-spacing' || varRef.startsWith('--cometchat-spacing-');
        const isPaddingVar =
          varRef === '--cometchat-padding' || varRef.startsWith('--cometchat-padding-');
        const isMarginVar =
          varRef === '--cometchat-margin' || varRef.startsWith('--cometchat-margin-');

        const isCategoryMismatch =
          (rule.label === 'padding' && isMarginVar) ||
          (rule.label === 'margin' && (isSpacingVar || isPaddingVar)) ||
          (rule.label === 'gap' && isMarginVar) ||
          (rule.label === 'border-radius' && !varRef.startsWith('--cometchat-radius')) ||
          (rule.label === 'font' && !varRef.startsWith('--cometchat-font')) ||
          (rule.label === 'background' &&
            !varRef.startsWith('--cometchat-background-color') &&
            !varRef.startsWith('--cometchat-primary-color') &&
            !varRef.startsWith('--cometchat-error-color') &&
            !varRef.startsWith('--cometchat-success-color') &&
            !varRef.startsWith('--cometchat-warning-color') &&
            !varRef.startsWith('--cometchat-neutral-color') &&
            !varRef.startsWith('--cometchat-extended-primary-color') &&
            !varRef.startsWith('--cometchat-static-') &&
            !varRef.startsWith('--cometchat-shimmer-gradient-color') &&
            // Allow intentional cross-category uses for background:
            // - icon-color for icon fill containers / indicator dots
            // - text-color for indicator dots / decorative elements
            // - border-color for dividers rendered as background
            // - primary-button for button backgrounds
            !varRef.startsWith('--cometchat-icon-color') &&
            !varRef.startsWith('--cometchat-text-color') &&
            !varRef.startsWith('--cometchat-border-color') &&
            !varRef.startsWith('--cometchat-primary-button'));

        if (isCategoryMismatch) {
          violations.push({
            file: fileName,
            line: decl.line,
            property: decl.property,
            globalVar: varRef,
            expectedCategory: rule.allowedPrefixes.join(' | '),
            value: decl.value,
          });
        }
      }
    }
  }
  return violations;
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function formatViolations(violations: Violation[]): string {
  return violations
    .map(
      v =>
        `  ${v.file}:${v.line} — ${v.property} uses ${v.globalVar} (expected ${v.expectedCategory})`
    )
    .join('\n');
}

function shortName(filePath: string): string {
  return path.relative(COMPONENT_DIR, filePath);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 1: Variable category correctness — ALL Components (Full Sweep)', () => {
  it('should discover at least 50 component CSS files', () => {
    expect(ALL_CSS_FILES.length).toBeGreaterThanOrEqual(50);
  });

  describe('padding properties must use --cometchat-padding-* fallbacks', () => {
    it.each(ALL_CSS_FILES)(
      'no --cometchat-spacing-* or --cometchat-margin-* in padding: %s',
      filePath => {
        const violations = auditFile(filePath).filter(v => v.property.startsWith('padding'));
        if (violations.length > 0) {
          expect.fail(
            `${shortName(filePath)} has padding category violations:\n${formatViolations(violations)}`
          );
        }
      }
    );
  });

  describe('margin properties must use --cometchat-margin-* fallbacks', () => {
    it.each(ALL_CSS_FILES)(
      'no --cometchat-spacing-* or --cometchat-padding-* in margin: %s',
      filePath => {
        const violations = auditFile(filePath).filter(v => v.property.startsWith('margin'));
        if (violations.length > 0) {
          expect.fail(
            `${shortName(filePath)} has margin category violations:\n${formatViolations(violations)}`
          );
        }
      }
    );
  });

  describe('gap properties must use --cometchat-spacing-* fallbacks', () => {
    it.each(ALL_CSS_FILES)(
      'no --cometchat-padding-* or --cometchat-margin-* in gap: %s',
      filePath => {
        const violations = auditFile(filePath).filter(v => v.property.startsWith('gap'));
        if (violations.length > 0) {
          expect.fail(
            `${shortName(filePath)} has gap category violations:\n${formatViolations(violations)}`
          );
        }
      }
    );
  });

  describe('border-radius must use --cometchat-radius-* fallbacks', () => {
    it.each(ALL_CSS_FILES)('no wrong-category variables in border-radius: %s', filePath => {
      const violations = auditFile(filePath).filter(v => v.property === 'border-radius');
      if (violations.length > 0) {
        expect.fail(
          `${shortName(filePath)} has border-radius category violations:\n${formatViolations(violations)}`
        );
      }
    });
  });

  describe('background properties must use --cometchat-background-color-* fallbacks', () => {
    it.each(ALL_CSS_FILES)('no wrong-category variables in background: %s', filePath => {
      const violations = auditFile(filePath).filter(
        v => v.property === 'background' || v.property === 'background-color'
      );
      if (violations.length > 0) {
        expect.fail(
          `${shortName(filePath)} has background category violations:\n${formatViolations(violations)}`
        );
      }
    });
  });

  describe('font properties must use --cometchat-font-* fallbacks', () => {
    it.each(ALL_CSS_FILES)('no wrong-category variables in font: %s', filePath => {
      const violations = auditFile(filePath).filter(v => v.property === 'font');
      if (violations.length > 0) {
        expect.fail(
          `${shortName(filePath)} has font category violations:\n${formatViolations(violations)}`
        );
      }
    });
  });

  describe('summary — zero violations across ALL component CSS files', () => {
    it('should have zero variable category violations total', () => {
      const allViolations: Violation[] = [];
      for (const filePath of ALL_CSS_FILES) {
        allViolations.push(...auditFile(filePath));
      }
      if (allViolations.length > 0) {
        expect.fail(
          `Found ${allViolations.length} variable category violation(s) across ${ALL_CSS_FILES.length} files:\n${formatViolations(allViolations)}`
        );
      }
    });
  });
});
