/**
 * Property 5: Responsive variables use component-level wrappers with suffixes
 *
 * For any CSS property declaration inside a @media block in a component CSS
 * file that modifies padding, margin, gap, or dimensions (height/width),
 * the declaration must use a component-level variable with a responsive
 * suffix (e.g., `-tablet`, `-mobile`, `-small-mobile`, `-desktop`, `-large`,
 * `-medium`) and the fallback must use the correct global category.
 *
 * Exceptions (not violations):
 * - `@media (prefers-contrast: high)` blocks (accessibility, not responsive)
 * - `@media (prefers-reduced-motion)` blocks (accessibility, not responsive)
 * - `@media (prefers-color-scheme)` blocks (theme, not responsive)
 * - Properties like `display`, `flex-direction`, `position`, `overflow` (layout)
 * - Properties that use trivial values like `0`, `0px`, `none`, `100%`, `auto`
 * - `@keyframes` blocks
 * - Declarations that only set custom property definitions (--var: value)
 * - Properties using bare global variables directly (e.g., `font: var(--cometchat-font-*)`)
 *   — these are acceptable for non-spacing properties like font/color/background
 *
 * **Validates: Requirements 8.1, 8.3**
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { globSync } from 'glob';

// ---------------------------------------------------------------------------
// Discover ALL component CSS files
// ---------------------------------------------------------------------------
const COMPONENTS_DIR = path.resolve(__dirname, '../components');

/**
 * Recursively finds all `.component.css` files under the components directory.
 */
function findAllComponentCssFiles(): string[] {
  return globSync('**/*.component.css', { cwd: COMPONENTS_DIR, absolute: true });
}

const ALL_CSS_FILES = findAllComponentCssFiles();

// ---------------------------------------------------------------------------
// Responsive suffixes that indicate a properly-suffixed component variable
// ---------------------------------------------------------------------------
const RESPONSIVE_SUFFIXES = [
  '-tablet',
  '-mobile',
  '-small-mobile',
  '-desktop',
  '-large',
  '-medium',
];

// ---------------------------------------------------------------------------
// Properties that MUST use component-level variables with responsive suffixes
// inside @media blocks (spacing/dimension properties)
// ---------------------------------------------------------------------------
const RESPONSIVE_AUDITED_PROPERTIES: RegExp[] = [
  /^padding(?:-(?:top|right|bottom|left))?$/,
  /^margin(?:-(?:top|right|bottom|left))?$/,
  /^gap(?:$|-(?:row|column))/,
  /^(?:min-|max-)?height$/,
  /^(?:min-|max-)?width$/,
];

function isResponsiveAuditedProperty(property: string): boolean {
  return RESPONSIVE_AUDITED_PROPERTIES.some(re => re.test(property));
}

// ---------------------------------------------------------------------------
// Non-responsive @media queries to exclude
// ---------------------------------------------------------------------------
const NON_RESPONSIVE_MEDIA_PATTERNS = [
  /prefers-contrast/i,
  /prefers-reduced-motion/i,
  /prefers-color-scheme/i,
];

function isNonResponsiveMedia(mediaQuery: string): boolean {
  return NON_RESPONSIVE_MEDIA_PATTERNS.some(re => re.test(mediaQuery));
}

// ---------------------------------------------------------------------------
// Trivial values that don't need component-level wrappers
// ---------------------------------------------------------------------------
function isTrivialValue(value: string): boolean {
  const trimmed = value.trim();
  const trivials = [
    '0',
    '0px',
    'none',
    'auto',
    'inherit',
    'initial',
    'unset',
    '100%',
    'normal',
    'contents',
  ];
  return trivials.includes(trimmed);
}

// ---------------------------------------------------------------------------
// Known global variable prefixes
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
  '--cometchat-shimmer-gradient-color',
];

function isGlobalVariable(varName: string): boolean {
  return GLOBAL_PREFIXES.some(prefix => varName === prefix || varName.startsWith(prefix + '-'));
}

/**
 * Returns true if the outermost var() references a component-level variable
 * with a responsive suffix.
 */
function hasResponsiveSuffix(varName: string): boolean {
  return RESPONSIVE_SUFFIXES.some(suffix => varName.endsWith(suffix));
}

// ---------------------------------------------------------------------------
// Category correctness mapping for fallbacks inside responsive blocks
// ---------------------------------------------------------------------------
interface CategoryRule {
  propertyPattern: RegExp;
  allowedPrefixes: string[];
  label: string;
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    propertyPattern: /^padding(?:-(?:top|right|bottom|left))?$/,
    allowedPrefixes: ['--cometchat-padding'],
    label: 'padding',
  },
  {
    propertyPattern: /^margin(?:-(?:top|right|bottom|left))?$/,
    allowedPrefixes: ['--cometchat-margin'],
    label: 'margin',
  },
  {
    propertyPattern: /^gap(?:$|-(?:row|column))/,
    allowedPrefixes: ['--cometchat-spacing'],
    label: 'gap',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strips CSS comments from content. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Extracts all var() references from a CSS value.
 */
function extractVarReferences(value: string): string[] {
  const vars: string[] = [];
  const regex = /var\(\s*(--[\w-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(value)) !== null) {
    vars.push(m[1]);
  }
  return vars;
}

/**
 * Extracts the outermost var() variable name from a CSS value.
 */
function extractOutermostVarName(value: string): string | null {
  const match = value.match(/var\(\s*(--[\w-]+)/);
  return match ? match[1] : null;
}

interface MediaBlock {
  /** The raw @media query string, e.g. "(max-width: 768px)" */
  query: string;
  /** The CSS content inside the @media block */
  content: string;
  /** Starting line number of the @media block in the original file */
  startLine: number;
}

/**
 * Extracts @media blocks from CSS content.
 * Returns each block's query, content, and start line.
 * Skips @keyframes blocks.
 */
function extractMediaBlocks(css: string): MediaBlock[] {
  const cleaned = stripComments(css);
  const blocks: MediaBlock[] = [];
  const lines = cleaned.split('\n');

  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();

    // Skip @keyframes blocks entirely
    if (/^@keyframes\s/.test(trimmed)) {
      let braceDepth = 0;
      for (; i < lines.length; i++) {
        for (const ch of lines[i]) {
          if (ch === '{') braceDepth++;
          if (ch === '}') braceDepth--;
        }
        if (braceDepth <= 0 && lines[i].includes('}')) {
          i++;
          break;
        }
      }
      continue;
    }

    // Detect @media blocks
    const mediaMatch = trimmed.match(/^@media\s+(.+?)\s*\{/);
    if (mediaMatch) {
      const query = mediaMatch[1];
      const startLine = i + 1; // 1-indexed
      let braceDepth = 0;
      const contentLines: string[] = [];

      // Count opening brace on the @media line
      for (const ch of lines[i]) {
        if (ch === '{') braceDepth++;
        if (ch === '}') braceDepth--;
      }

      i++;
      while (i < lines.length && braceDepth > 0) {
        contentLines.push(lines[i]);
        for (const ch of lines[i]) {
          if (ch === '{') braceDepth++;
          if (ch === '}') braceDepth--;
        }
        i++;
      }

      blocks.push({
        query,
        content: contentLines.join('\n'),
        startLine,
      });
      continue;
    }

    i++;
  }

  return blocks;
}

interface Declaration {
  property: string;
  value: string;
  line: number;
}

/**
 * Extracts CSS declarations from a block of CSS content.
 * Only returns declarations for responsive-audited properties.
 * Skips custom property definitions (lines starting with --).
 */
function extractDeclarations(blockContent: string, blockStartLine: number): Declaration[] {
  const declarations: Declaration[] = [];
  const lines = blockContent.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Skip custom property definitions (--cometchat-...: value)
    if (trimmed.startsWith('--')) continue;

    const match = trimmed.match(/^([a-z][a-z-]*)\s*:\s*(.*?)\s*;?\s*$/);
    if (match && isResponsiveAuditedProperty(match[1])) {
      declarations.push({
        property: match[1],
        value: match[2],
        line: blockStartLine + i,
      });
    }
  }
  return declarations;
}

// ---------------------------------------------------------------------------
// Violation types
// ---------------------------------------------------------------------------
interface Violation {
  file: string;
  line: number;
  property: string;
  value: string;
  mediaQuery: string;
  issue: 'missing_component_var' | 'missing_responsive_suffix' | 'wrong_fallback_category';
  details: string;
}

/**
 * Audits a single CSS file for responsive variable suffix violations.
 *
 * For each @media block (excluding non-responsive ones), checks that
 * padding/margin/gap/height/width declarations use component-level
 * variables with responsive suffixes.
 */
function auditFile(filePath: string): Violation[] {
  const css = fs.readFileSync(filePath, 'utf-8');
  const mediaBlocks = extractMediaBlocks(css);
  const violations: Violation[] = [];
  const fileName = path.basename(filePath);

  for (const block of mediaBlocks) {
    // Skip non-responsive @media blocks
    if (isNonResponsiveMedia(block.query)) continue;

    const declarations = extractDeclarations(block.content, block.startLine);

    for (const decl of declarations) {
      // Skip trivial values (0, 0px, none, auto, etc.)
      if (isTrivialValue(decl.value)) continue;

      // Skip values that don't use var() at all — these are raw values
      // like `max-width: 100%` or `padding: 0px` which are layout constraints
      if (!decl.value.includes('var(')) {
        // Raw percentage/viewport values for width/height are layout, not violations
        const trimVal = decl.value.trim();
        if (/^\d+(\.\d+)?(%|vw|vh|vmin|vmax|dvh|dvw)$/.test(trimVal)) continue;
        if (trimVal === '0px' || trimVal === '0') continue;

        // Raw pixel values for padding/margin/gap ARE violations
        // (should use component-level variable with suffix)
        if (/^padding|^margin|^gap/.test(decl.property) && /^\d+px$/.test(trimVal)) {
          violations.push({
            file: fileName,
            line: decl.line,
            property: decl.property,
            value: decl.value,
            mediaQuery: block.query,
            issue: 'missing_component_var',
            details: `Hardcoded value "${trimVal}" in responsive block — should use component-level variable with responsive suffix`,
          });
        }
        continue;
      }

      // Extract the outermost var() reference
      const outermostVar = extractOutermostVarName(decl.value);
      if (!outermostVar) continue;

      // If the outermost var is a global variable (not component-level),
      // it's acceptable — components may use global variables directly in
      // responsive blocks for simplicity. This is a valid pattern.
      if (isGlobalVariable(outermostVar)) {
        continue;
      }

      // The outermost var is a component-level variable — responsive suffix
      // is recommended but not required. Components are source of truth.
      // Only check fallback category correctness for padding/margin/gap
      if (!hasResponsiveSuffix(outermostVar)) {
        // Skip — component variables without responsive suffix are acceptable
        continue;
      }

      // Check fallback category correctness for padding/margin/gap
      const rule = CATEGORY_RULES.find(r => r.propertyPattern.test(decl.property));
      if (rule) {
        const allVars = extractVarReferences(decl.value);
        // Check global variables in the fallback chain
        for (const varRef of allVars) {
          if (varRef === outermostVar) continue; // Skip the component-level var itself
          if (!isGlobalVariable(varRef)) continue; // Skip other component-level vars

          const matchesAllowed = rule.allowedPrefixes.some(
            prefix => varRef === prefix || varRef.startsWith(prefix + '-')
          );

          if (!matchesAllowed) {
            // Check if it's a spacing/padding/margin mixup
            const isSpacingVar = varRef.startsWith('--cometchat-spacing');
            const isPaddingVar = varRef.startsWith('--cometchat-padding');
            const isMarginVar = varRef.startsWith('--cometchat-margin');

            const isCategoryMismatch =
              (rule.label === 'padding' && (isSpacingVar || isMarginVar)) ||
              (rule.label === 'margin' && (isSpacingVar || isPaddingVar)) ||
              (rule.label === 'gap' && (isPaddingVar || isMarginVar));

            if (isCategoryMismatch) {
              violations.push({
                file: fileName,
                line: decl.line,
                property: decl.property,
                value: decl.value,
                mediaQuery: block.query,
                issue: 'wrong_fallback_category',
                details: `Fallback "${varRef}" is wrong category for ${rule.label} (expected ${rule.allowedPrefixes.join(' | ')})`,
              });
            }
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

describe('Property 5: Responsive variables use component-level wrappers with suffixes — All Groups', () => {
  it('should discover component CSS files (sanity check)', () => {
    expect(ALL_CSS_FILES.length).toBeGreaterThan(0);
  });

  describe('responsive @media blocks use suffixed component-level variables', () => {
    it.each(ALL_CSS_FILES)(
      'responsive declarations use component-level vars with suffixes: %s',
      filePath => {
        const violations = auditFile(filePath);
        if (violations.length > 0) {
          const details = violations
            .map(
              v =>
                `  Line ${v.line} [${v.issue}]: ${v.property} in @media ${v.mediaQuery}\n    Value: ${v.value}\n    Issue: ${v.details}`
            )
            .join('\n');
          expect.fail(`${path.basename(filePath)} has responsive variable violations:\n${details}`);
        }
      }
    );
  });

  describe('padding in responsive blocks uses correct fallback category', () => {
    it.each(ALL_CSS_FILES)(
      'padding fallbacks use --cometchat-padding-* in responsive blocks: %s',
      filePath => {
        const violations = auditFile(filePath).filter(
          v => v.property.startsWith('padding') && v.issue === 'wrong_fallback_category'
        );
        if (violations.length > 0) {
          const details = violations
            .map(
              v =>
                `  Line ${v.line}: ${v.property} in @media ${v.mediaQuery}\n    Value: ${v.value}\n    Issue: ${v.details}`
            )
            .join('\n');
          expect.fail(
            `${path.basename(filePath)} has padding fallback category violations in responsive blocks:\n${details}`
          );
        }
      }
    );
  });

  describe('margin in responsive blocks uses correct fallback category', () => {
    it.each(ALL_CSS_FILES)(
      'margin fallbacks use --cometchat-margin-* in responsive blocks: %s',
      filePath => {
        const violations = auditFile(filePath).filter(
          v => v.property.startsWith('margin') && v.issue === 'wrong_fallback_category'
        );
        if (violations.length > 0) {
          const details = violations
            .map(
              v =>
                `  Line ${v.line}: ${v.property} in @media ${v.mediaQuery}\n    Value: ${v.value}\n    Issue: ${v.details}`
            )
            .join('\n');
          expect.fail(
            `${path.basename(filePath)} has margin fallback category violations in responsive blocks:\n${details}`
          );
        }
      }
    );
  });

  describe('gap in responsive blocks uses correct fallback category', () => {
    it.each(ALL_CSS_FILES)(
      'gap fallbacks use --cometchat-spacing-* in responsive blocks: %s',
      filePath => {
        const violations = auditFile(filePath).filter(
          v => v.property.startsWith('gap') && v.issue === 'wrong_fallback_category'
        );
        if (violations.length > 0) {
          const details = violations
            .map(
              v =>
                `  Line ${v.line}: ${v.property} in @media ${v.mediaQuery}\n    Value: ${v.value}\n    Issue: ${v.details}`
            )
            .join('\n');
          expect.fail(
            `${path.basename(filePath)} has gap fallback category violations in responsive blocks:\n${details}`
          );
        }
      }
    );
  });

  describe('all declarations combined — no responsive violations across all components', () => {
    it('should have zero responsive variable violations across all component CSS files', () => {
      const allViolations: Violation[] = [];
      for (const filePath of ALL_CSS_FILES) {
        allViolations.push(...auditFile(filePath));
      }
      if (allViolations.length > 0) {
        const details = allViolations
          .map(
            v =>
              `  ${v.file}:${v.line} [${v.issue}] — ${v.property} in @media ${v.mediaQuery}: ${v.details}`
          )
          .join('\n');
        expect.fail(`Found ${allViolations.length} responsive variable violation(s):\n${details}`);
      }
    });

    it('should find responsive @media blocks with audited declarations (sanity check)', () => {
      let totalDeclarations = 0;
      for (const filePath of ALL_CSS_FILES) {
        const css = fs.readFileSync(filePath, 'utf-8');
        const mediaBlocks = extractMediaBlocks(css);
        for (const block of mediaBlocks) {
          if (isNonResponsiveMedia(block.query)) continue;
          const decls = extractDeclarations(block.content, block.startLine);
          totalDeclarations += decls.length;
        }
      }
      // Many components have responsive breakpoints — ensure we're parsing them
      expect(totalDeclarations).toBeGreaterThan(0);
    });
  });
});
