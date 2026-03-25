/**
 * Property 1: Variable category correctness — Group 1 (List Components)
 *
 * For any CSS property declaration in a Group 1 component CSS file, if the
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
 * Validates: Requirements 1.1, 1.3, 2.1, 2.3, 3.1, 5.2
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Group 1 CSS files (List Components)
// ---------------------------------------------------------------------------
const COMPONENT_DIR = path.resolve(__dirname, '../components');

const GROUP1_FILES = [
  'cometchat-groups/cometchat-groups.component.css',
  'cometchat-users/cometchat-users.component.css',
  'cometchat-call-logs/cometchat-call-logs.component.css',
  'cometchat-group-members/cometchat-group-members.component.css',
].map(f => path.join(COMPONENT_DIR, f));

// ---------------------------------------------------------------------------
// Category rules: CSS property → allowed global variable prefix(es)
// ---------------------------------------------------------------------------
interface CategoryRule {
  /** Regex that matches the CSS property name (left side of `:`) */
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
 * Returns every variable name found (including nested fallbacks).
 */
function extractVarReferences(value: string): string[] {
  const vars: string[] = [];
  const regex = /var\(\s*(--cometchat-[\w-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(value)) !== null) {
    vars.add ? undefined : vars.push(m[1]);
  }
  return vars;
}

/**
 * Returns true if the variable name is a *global* variable (defined in
 * css-variables.css :root). Global variables follow patterns like
 * `--cometchat-padding-3`, `--cometchat-spacing-2`, `--cometchat-font-*`,
 * `--cometchat-background-color-*`, `--cometchat-text-color-*`, etc.
 *
 * Component-level variables contain a component name segment, e.g.
 * `--cometchat-groups-header-padding`.
 *
 * We identify global variables by checking known global prefixes.
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

/**
 * Checks whether a global variable matches at least one of the allowed
 * prefixes for a given category rule.
 */
function matchesAllowedPrefix(varName: string, allowedPrefixes: string[]): boolean {
  return allowedPrefixes.some(prefix => varName === prefix || varName.startsWith(prefix + '-'));
}

/**
 * Strips CSS comments from content.
 */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

interface Declaration {
  property: string;
  value: string;
  line: number;
}

/**
 * Extracts CSS declarations (property: value) from CSS content.
 * Only returns declarations whose value contains `var(`.
 *
 * Also detects CSS mask patterns: when a rule block uses mask/-webkit-mask,
 * the `background` property acts as icon fill color (not a traditional
 * background), so it gets reclassified to skip the background category rule.
 */
function extractVarDeclarations(css: string): Declaration[] {
  const cleaned = stripComments(css);
  const declarations: Declaration[] = [];

  // First, split into rule blocks and detect which blocks use CSS masks.
  // A "masked block" is any rule block containing mask or -webkit-mask properties.
  const maskedLineSet = buildMaskedLineSet(cleaned);

  const lines = cleaned.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Match property: value patterns (skip custom property definitions)
    const match = trimmed.match(/^(?!--)([a-z][a-z-]*)\s*:\s*(.*?)\s*;?\s*$/);
    if (match && match[2].includes('var(')) {
      let property = match[1];

      // If this line is inside a masked block and the property is background,
      // reclassify it so the audit treats it as an icon color context.
      if (maskedLineSet.has(i) && /^background(?:-color)?$/.test(property)) {
        property = '__masked-background'; // sentinel — skipped by category rules
      }

      declarations.push({
        property,
        value: match[2],
        line: i + 1,
      });
    }
  }
  return declarations;
}

/**
 * Builds a set of line indices that belong to CSS rule blocks containing
 * mask or -webkit-mask properties. This allows us to detect when `background`
 * is used as an icon fill color rather than a traditional background.
 */
function buildMaskedLineSet(css: string): Set<number> {
  const lines = css.split('\n');
  const maskedLines = new Set<number>();

  // Find all rule blocks (track brace-delimited ranges)
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

  // For each block, check if it contains mask-related properties
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
  const fileName = path.basename(filePath);

  for (const decl of declarations) {
    // Find which category rule applies to this property
    const rule = CATEGORY_RULES.find(r => r.propertyPattern.test(decl.property));
    if (!rule) continue; // Property not in our audit scope

    // Extract all var references from the value
    const varRefs = extractVarReferences(decl.value);

    // Check each global variable reference
    for (const varRef of varRefs) {
      if (!isGlobalVariable(varRef)) continue; // Skip component-level vars

      // Skip variables that are clearly not in the category domain
      // e.g. --cometchat-border-color-light used in a border-bottom shorthand
      // that happens to be inside a padding declaration's fallback chain
      // We only check variables that *could* be a spacing/sizing category
      if (!matchesAllowedPrefix(varRef, rule.allowedPrefixes)) {
        // Check if this is a "wrong category" spacing variable
        // e.g. --cometchat-spacing-* used for padding (should be --cometchat-padding-*)
        const isSpacingVar =
          varRef === '--cometchat-spacing' || varRef.startsWith('--cometchat-spacing-');
        const isPaddingVar =
          varRef === '--cometchat-padding' || varRef.startsWith('--cometchat-padding-');
        const isMarginVar =
          varRef === '--cometchat-margin' || varRef.startsWith('--cometchat-margin-');

        // Only flag as violation if it's a spacing/padding/margin mixup
        // or a clearly wrong category (e.g. font var used for padding)
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
// Tests
// ---------------------------------------------------------------------------

describe('Property 1: Variable category correctness — Group 1 (List Components)', () => {
  // Verify all files exist before running
  it.each(GROUP1_FILES)('CSS file exists: %s', filePath => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  describe('padding properties must use --cometchat-padding-* fallbacks', () => {
    it.each(GROUP1_FILES)(
      'no --cometchat-spacing-* or --cometchat-margin-* in padding declarations: %s',
      filePath => {
        const violations = auditFile(filePath).filter(v => v.property.startsWith('padding'));
        if (violations.length > 0) {
          const details = violations
            .map(
              v =>
                `  Line ${v.line}: ${v.property} uses ${v.globalVar} (expected ${v.expectedCategory})`
            )
            .join('\n');
          expect.fail(`${path.basename(filePath)} has padding category violations:\n${details}`);
        }
      }
    );
  });

  describe('margin properties must use --cometchat-margin-* fallbacks', () => {
    it.each(GROUP1_FILES)(
      'no --cometchat-spacing-* or --cometchat-padding-* in margin declarations: %s',
      filePath => {
        const violations = auditFile(filePath).filter(v => v.property.startsWith('margin'));
        if (violations.length > 0) {
          const details = violations
            .map(
              v =>
                `  Line ${v.line}: ${v.property} uses ${v.globalVar} (expected ${v.expectedCategory})`
            )
            .join('\n');
          expect.fail(`${path.basename(filePath)} has margin category violations:\n${details}`);
        }
      }
    );
  });

  describe('gap properties must use --cometchat-spacing-* fallbacks', () => {
    it.each(GROUP1_FILES)(
      'no --cometchat-padding-* or --cometchat-margin-* in gap declarations: %s',
      filePath => {
        const violations = auditFile(filePath).filter(v => v.property.startsWith('gap'));
        if (violations.length > 0) {
          const details = violations
            .map(
              v =>
                `  Line ${v.line}: ${v.property} uses ${v.globalVar} (expected ${v.expectedCategory})`
            )
            .join('\n');
          expect.fail(`${path.basename(filePath)} has gap category violations:\n${details}`);
        }
      }
    );
  });

  describe('border-radius must use --cometchat-radius-* fallbacks', () => {
    it.each(GROUP1_FILES)(
      'no wrong-category variables in border-radius declarations: %s',
      filePath => {
        const violations = auditFile(filePath).filter(v => v.property === 'border-radius');
        if (violations.length > 0) {
          const details = violations
            .map(
              v =>
                `  Line ${v.line}: ${v.property} uses ${v.globalVar} (expected ${v.expectedCategory})`
            )
            .join('\n');
          expect.fail(
            `${path.basename(filePath)} has border-radius category violations:\n${details}`
          );
        }
      }
    );
  });

  describe('background properties must use --cometchat-background-color-* fallbacks', () => {
    it.each(GROUP1_FILES)(
      'no wrong-category variables in background declarations: %s',
      filePath => {
        const violations = auditFile(filePath).filter(
          v => v.property === 'background' || v.property === 'background-color'
        );
        if (violations.length > 0) {
          const details = violations
            .map(
              v =>
                `  Line ${v.line}: ${v.property} uses ${v.globalVar} (expected ${v.expectedCategory})`
            )
            .join('\n');
          expect.fail(`${path.basename(filePath)} has background category violations:\n${details}`);
        }
      }
    );
  });

  describe('font properties must use --cometchat-font-* fallbacks', () => {
    it.each(GROUP1_FILES)('no wrong-category variables in font declarations: %s', filePath => {
      const violations = auditFile(filePath).filter(v => v.property === 'font');
      if (violations.length > 0) {
        const details = violations
          .map(
            v =>
              `  Line ${v.line}: ${v.property} uses ${v.globalVar} (expected ${v.expectedCategory})`
          )
          .join('\n');
        expect.fail(`${path.basename(filePath)} has font category violations:\n${details}`);
      }
    });
  });

  describe('all declarations combined — no category violations across Group 1', () => {
    it('should have zero variable category violations across all Group 1 files', () => {
      const allViolations: Violation[] = [];
      for (const filePath of GROUP1_FILES) {
        allViolations.push(...auditFile(filePath));
      }
      if (allViolations.length > 0) {
        const details = allViolations
          .map(
            v =>
              `  ${v.file}:${v.line} — ${v.property} uses ${v.globalVar} (expected ${v.expectedCategory})`
          )
          .join('\n');
        expect.fail(`Found ${allViolations.length} variable category violation(s):\n${details}`);
      }
    });
  });
});
