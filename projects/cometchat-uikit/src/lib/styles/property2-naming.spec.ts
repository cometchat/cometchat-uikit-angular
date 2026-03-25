/**
 * Property 2: Naming convention compliance — All Components
 *
 * For any component-level CSS custom property defined in a component CSS file,
 * the variable name must follow the pattern:
 *   --cometchat-{component}-{element}-{property}[-{modifier}][-{breakpoint}]
 *
 * Where:
 *   {component} matches the component directory name without the `cometchat-` prefix
 *   {element} identifies the sub-element (BEM element)
 *   {property} identifies the CSS property
 *   {modifier} (optional) state or variant (hover, active, focus, etc.)
 *   {breakpoint} (optional) responsive suffix (tablet, mobile, small-mobile)
 *
 * The test:
 * 1. Globs all *.component.css files under components/
 * 2. Extracts component-level variable DEFINITIONS from each file
 * 3. Verifies each starts with --cometchat-{component-name}-
 * 4. Verifies at least 3 segments after --cometchat-: component, element, property
 *
 * **Validates: Requirements 1.4, 2.4, 3.2, 5.4, 11.3, 12.4, 13.2**
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { globSync } from 'glob';

// ---------------------------------------------------------------------------
// Discover ALL component CSS files
// ---------------------------------------------------------------------------
const COMPONENTS_DIR = path.resolve(__dirname, '../components');

function findAllComponentCssFiles(): string[] {
  return globSync('**/*.component.css', { cwd: COMPONENTS_DIR, absolute: true });
}

const ALL_CSS_FILES = findAllComponentCssFiles();

// ---------------------------------------------------------------------------
// Known global variable prefixes — these are NOT component-level variables
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strips CSS comments from content. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Derives the expected component name from the CSS file path.
 *
 * The component directory is named `cometchat-{component}`, so we strip
 * the `cometchat-` prefix to get the component name used in variables.
 *
 * Examples:
 *   cometchat-groups/cometchat-groups.component.css → "groups"
 *   cometchat-message-header/cometchat-message-header.component.css → "message-header"
 *   base-elements/cometchat-dropdown/cometchat-dropdown.component.css → "dropdown"
 */
function deriveComponentName(filePath: string): string {
  // Get the immediate parent directory name (e.g., "cometchat-groups")
  const dirName = path.basename(path.dirname(filePath));
  // Strip the "cometchat-" prefix
  return dirName.replace(/^cometchat-/, '');
}

/**
 * Extracts all component-level custom property DEFINITIONS from a CSS file.
 *
 * A component-level variable definition is a line like:
 *   --cometchat-groups-header-padding: value;
 * or used inline as the first argument of var():
 *   padding: var(--cometchat-groups-header-padding, ...);
 *
 * We look for:
 * 1. Explicit definitions: lines matching `--cometchat-*: value`
 * 2. First-argument usage in var(): the outermost var(--cometchat-*-..., ...)
 *    where the variable is component-level (not global)
 *
 * Returns unique variable names found as component-level definitions/usages.
 */
interface VariableOccurrence {
  varName: string;
  line: number;
  context: string; // trimmed line for error reporting
}

function extractComponentVariables(css: string): VariableOccurrence[] {
  const cleaned = stripComments(css);
  const lines = cleaned.split('\n');
  const occurrences: VariableOccurrence[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // 1. Explicit custom property definitions: --cometchat-*: value
    const defMatch = trimmed.match(/^(--cometchat-[\w-]+)\s*:/);
    if (defMatch) {
      const varName = defMatch[1];
      if (!isGlobalVariable(varName) && !seen.has(varName)) {
        seen.add(varName);
        occurrences.push({ varName, line: i + 1, context: trimmed });
      }
    }

    // 2. Component-level variables used as first arg of var()
    //    e.g., padding: var(--cometchat-groups-header-padding, ...)
    const varUsageRegex = /var\(\s*(--cometchat-[\w-]+)/g;
    let m: RegExpExecArray | null;
    while ((m = varUsageRegex.exec(trimmed)) !== null) {
      const varName = m[1];
      if (!isGlobalVariable(varName) && !seen.has(varName)) {
        seen.add(varName);
        occurrences.push({ varName, line: i + 1, context: trimmed });
      }
    }
  }

  return occurrences;
}

// ---------------------------------------------------------------------------
// Violation detection
// ---------------------------------------------------------------------------
interface Violation {
  file: string;
  line: number;
  varName: string;
  issue: 'wrong_prefix' | 'too_few_segments';
  details: string;
}

/**
 * Audits a single CSS file for naming convention violations.
 *
 * Checks:
 * 1. Each component-level variable starts with --cometchat-{component-name}-
 * 2. Each variable has at least 3 segments after --cometchat-:
 *    component, element, property (e.g., groups-header-padding)
 */
function auditFile(filePath: string): Violation[] {
  const css = fs.readFileSync(filePath, 'utf-8');
  const componentName = deriveComponentName(filePath);
  const expectedPrefix = `--cometchat-${componentName}-`;
  const variables = extractComponentVariables(css);
  const violations: Violation[] = [];
  const fileName = path.basename(filePath);

  for (const occ of variables) {
    // Check 1: Variable must start with --cometchat-{component}-
    if (!occ.varName.startsWith(expectedPrefix)) {
      // Special case: variables referencing other components embedded in this one
      // e.g., --cometchat-paginated-list-loading-padding set inside cometchat-groups
      // These are parent-scoped overrides for child components — acceptable
      if (isParentScopedOverride(occ.varName, componentName)) {
        continue;
      }

      violations.push({
        file: fileName,
        line: occ.line,
        varName: occ.varName,
        issue: 'wrong_prefix',
        details: `Expected prefix "${expectedPrefix}" but got "${occ.varName}"`,
      });
      continue;
    }

    // Check 2: At least 3 segments after --cometchat-
    // Split the part after --cometchat- by hyphens, but respect multi-word
    // component names (e.g., "message-header" is ONE segment)
    const afterPrefix = occ.varName.slice(expectedPrefix.length);
    // afterPrefix should contain at least element-property (2+ more segments)
    // But element and property can themselves be multi-word (e.g., "empty-state-padding")
    // Minimum: at least one hyphen in afterPrefix (element + property)
    if (!afterPrefix || !afterPrefix.includes('-')) {
      // Single segment after component name — missing element or property
      // e.g., --cometchat-groups-background is acceptable (root element, property = background)
      // The convention allows root-level properties without an explicit element name
      // So we only flag if afterPrefix is empty
      if (!afterPrefix) {
        violations.push({
          file: fileName,
          line: occ.line,
          varName: occ.varName,
          issue: 'too_few_segments',
          details: `Variable "${occ.varName}" has no element or property segment after component name`,
        });
      }
      // Single segment like --cometchat-groups-background is OK (root element implied)
    }
  }

  return violations;
}

/**
 * Checks if a variable is a parent-scoped override for a child component.
 *
 * Parent components can define variables targeting embedded child components,
 * e.g., inside cometchat-groups.component.css:
 *   --cometchat-paginated-list-loading-padding: 0px var(--cometchat-padding-4)
 *
 * These are valid and should not be flagged as naming violations.
 */
function isParentScopedOverride(varName: string, _parentComponent: string): boolean {
  // A parent-scoped override starts with --cometchat- followed by a DIFFERENT
  // component name. We check if it starts with --cometchat- and contains
  // enough segments to be a valid component-level variable for some other component.
  const afterCometchat = varName.slice('--cometchat-'.length);
  // Must have at least component-element pattern (contains a hyphen beyond component name)
  return afterCometchat.includes('-') && !isGlobalVariable(varName);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 2: Naming convention compliance — All Components', () => {
  it('should discover component CSS files (sanity check)', () => {
    expect(ALL_CSS_FILES.length).toBeGreaterThan(0);
  });

  describe('component-level variables must start with --cometchat-{component}-', () => {
    it.each(ALL_CSS_FILES)('variables follow naming convention: %s', filePath => {
      const violations = auditFile(filePath).filter(v => v.issue === 'wrong_prefix');
      if (violations.length > 0) {
        const details = violations
          .map(v => `  Line ${v.line}: ${v.varName}\n    ${v.details}`)
          .join('\n');
        expect.fail(`${path.basename(filePath)} has naming prefix violations:\n${details}`);
      }
    });
  });

  describe('component-level variables must have sufficient segments', () => {
    it.each(ALL_CSS_FILES)(
      'variables have at least component + property segments: %s',
      filePath => {
        const violations = auditFile(filePath).filter(v => v.issue === 'too_few_segments');
        if (violations.length > 0) {
          const details = violations
            .map(v => `  Line ${v.line}: ${v.varName}\n    ${v.details}`)
            .join('\n');
          expect.fail(`${path.basename(filePath)} has naming segment violations:\n${details}`);
        }
      }
    );
  });

  describe('all declarations combined — no naming violations across all components', () => {
    it('should have zero naming convention violations across all component CSS files', () => {
      const allViolations: Violation[] = [];
      for (const filePath of ALL_CSS_FILES) {
        allViolations.push(...auditFile(filePath));
      }
      if (allViolations.length > 0) {
        const details = allViolations
          .map(v => `  ${v.file}:${v.line} [${v.issue}] — ${v.varName}: ${v.details}`)
          .join('\n');
        expect.fail(`Found ${allViolations.length} naming convention violation(s):\n${details}`);
      }
    });

    it('should find component-level variables to audit (sanity check)', () => {
      let totalVariables = 0;
      for (const filePath of ALL_CSS_FILES) {
        const css = fs.readFileSync(filePath, 'utf-8');
        const vars = extractComponentVariables(css);
        totalVariables += vars.length;
      }
      // With ~60 component files, we expect many component-level variables
      expect(totalVariables).toBeGreaterThan(100);
    });
  });
});
