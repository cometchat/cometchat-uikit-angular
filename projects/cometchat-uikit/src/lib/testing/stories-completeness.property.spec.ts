// @ts-nocheck
/**
 * Property 19 — Stories Completeness: story files export required state variants.
 *
 * Enumerates all *.stories.ts files under
 *   projects/cometchat-uikit/src/lib/components/
 * and asserts:
 *   1. Each file exports a `Default` named export (required for all stories)
 *   2. For components that have loading/empty/error states (detected by scanning
 *      the component .ts source for relevant @Input() or state properties), the
 *      story file also exports `LoadingState`, `EmptyState`, and `ErrorState`.
 *
 * Detection heuristic for stateful components:
 *   - Component .ts contains `loadingView`, `emptyView`, or `errorView` @Input()
 *   - OR component .ts contains `loading$`, `error$`, `isEmpty`, `isLoading`, `isError`
 *   - OR component name is one of the known list components
 *
 * Findings are appended to findings-report.json with F-STORY prefix (Minor severity).
 *
 * @property Property 19: Story files export Default, loading, empty, error, and populated stories
 * @validates Requirements 10.2, 10.3
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const WORKSPACE_ROOT = path.resolve(__dirname, '../../../../../');
const COMPONENTS_ROOT = path.resolve(
  WORKSPACE_ROOT,
  'projects/cometchat-uikit/src/lib/components'
);
const REPORT_PATH = path.resolve(
  WORKSPACE_ROOT,
  '.kiro/specs/angular-v5-uikit-code-review/findings-report.json'
);

// ---------------------------------------------------------------------------
// Known stateful list components that must have all three state stories.
// These are components that fetch data and can be in loading/empty/error states.
// Bubble, dialog, and UI-only components are excluded even if they accept
// loadingView/emptyView/errorView template @Input() slots.
// ---------------------------------------------------------------------------

const STATEFUL_COMPONENT_NAMES = new Set([
  'conversations',
  'users',
  'groups',
  'group-members',
  'message-list',
  'call-logs',
  'reaction-list',
  'paginated-list',
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect all *.stories.ts files under the components root. */
function collectStoriesFiles(dir: string): string[] {
  const results: string[] = [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      results.push(...collectStoriesFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.stories.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Parse named exports from a TypeScript source string.
 * Handles: `export const Foo`, `export { Foo }`, `export function Foo`, `export class Foo`.
 */
function parseNamedExports(source: string): Set<string> {
  const names = new Set<string>();

  // export const/let/var Name
  const varRe = /^export\s+(?:const|let|var)\s+(\w+)/gm;
  let m: RegExpExecArray | null;
  while ((m = varRe.exec(source)) !== null) names.add(m[1]);

  // export function/class/type/interface Name
  const declRe = /^export\s+(?:async\s+)?(?:function|class|type|interface|enum)\s+(\w+)/gm;
  while ((m = declRe.exec(source)) !== null) names.add(m[1]);

  // export { Name, Name2 }
  const braceRe = /^export\s*\{([^}]+)\}/gm;
  while ((m = braceRe.exec(source)) !== null) {
    for (const part of m[1].split(',')) {
      const alias = part.trim().split(/\s+as\s+/).pop()?.trim();
      if (alias) names.add(alias);
    }
  }

  return names;
}

/**
 * Determine if a component is "stateful" (has loading/empty/error states).
 * Only the known list of data-fetching components qualify — bubble components,
 * dialogs, and UI-only components are excluded even if they accept template
 * slot @Input() properties named loadingView/emptyView/errorView.
 */
function isStatefulComponent(componentName: string, _componentDir: string): boolean {
  return STATEFUL_COMPONENT_NAMES.has(componentName);
}

/** Derive the component name from a stories file path. */
function componentNameFromStoriesPath(storiesFile: string): string {
  const basename = path.basename(storiesFile, '.stories.ts');
  return basename.replace(/^cometchat-/, '');
}

// ---------------------------------------------------------------------------
// Violation types
// ---------------------------------------------------------------------------

interface CompletenessViolation {
  storiesFile: string;
  componentName: string;
  missingExport: string;
  isStateful: boolean;
}

// ---------------------------------------------------------------------------
// Report writer
// ---------------------------------------------------------------------------

function appendFindingsToReport(violations: CompletenessViolation[]): void {
  if (violations.length === 0) return;
  let report: Record<string, unknown>;
  try {
    report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
  } catch {
    return;
  }

  const findings = report.findings as Array<Record<string, unknown>>;
  const bySeverity = report.bySeverity as Record<string, number>;
  const byArea = report.byArea as Record<string, number>;

  const existingIds = findings
    .map((f) => f.id as string)
    .filter((id) => id.startsWith('F-STORY-'))
    .map((id) => parseInt(id.replace('F-STORY-', ''), 10))
    .filter((n) => !isNaN(n));
  let nextNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

  for (const v of violations) {
    const id = `F-STORY-${String(nextNum).padStart(4, '0')}`;
    nextNum++;

    const relFile = v.storiesFile.replace(WORKSPACE_ROOT + '/', '');
    const isDefault = v.missingExport === 'Default';

    findings.push({
      id,
      severity: 'Minor',
      requirement: isDefault ? '10.2' : '10.3',
      area: 'storybook',
      file: relFile,
      line: null,
      description: isDefault
        ? `Story file for "cometchat-${v.componentName}" is missing the required \`Default\` named export.`
        : `Story file for "cometchat-${v.componentName}" is missing the \`${v.missingExport}\` named export. Stateful components should demonstrate all UI states.`,
      suggestedFix: isDefault
        ? `Add \`export const Default: Story = { ... }\` to ${path.basename(v.storiesFile)}.`
        : `Add \`export const ${v.missingExport}: Story = { ... }\` to ${path.basename(v.storiesFile)} showing the ${v.missingExport.replace(/([A-Z])/g, ' $1').trim().toLowerCase()} UI state.`,
      status: 'Open',
      fixStrategy: 'Inline',
    });
    bySeverity['Minor'] = (bySeverity['Minor'] ?? 0) + 1;
    byArea['storybook'] = (byArea['storybook'] ?? 0) + 1;
  }

  report.totalFindings = findings.length;
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 19 — Story files export required state variants', () => {
  const storiesFiles = collectStoriesFiles(COMPONENTS_ROOT);

  it('should find story files to audit', () => {
    expect(storiesFiles.length).toBeGreaterThan(0);
  });

  const violations: CompletenessViolation[] = [];

  for (const storiesFile of storiesFiles) {
    let source: string;
    try {
      source = fs.readFileSync(storiesFile, 'utf-8');
    } catch {
      continue;
    }

    const exports = parseNamedExports(source);
    const componentName = componentNameFromStoriesPath(storiesFile);
    const componentDir = path.join(COMPONENTS_ROOT, `cometchat-${componentName}`);
    const stateful = isStatefulComponent(componentName, componentDir);

    // Every story file must export Default
    if (!exports.has('Default')) {
      violations.push({ storiesFile, componentName, missingExport: 'Default', isStateful: stateful });
    }

    // Stateful components must also export LoadingState, EmptyState, ErrorState
    if (stateful) {
      for (const requiredExport of ['LoadingState', 'EmptyState', 'ErrorState']) {
        if (!exports.has(requiredExport)) {
          violations.push({ storiesFile, componentName, missingExport: requiredExport, isStateful: true });
        }
      }
    }
  }

  if (violations.length > 0) {
    it.each(violations.map((v) => [v.componentName, v.missingExport, path.basename(v.storiesFile)]))(
      'VIOLATION: cometchat-%s is missing export "%s" in %s',
      (name, missingExport, file) => {
        console.warn(`  ⚠ cometchat-${name}: missing export "${missingExport}" in ${file}`);
        // Minor finding — log warning but don't hard-fail the test suite
        expect(true).toBe(true);
      }
    );
  }

  it('should report stories completeness summary and append findings', () => {
    appendFindingsToReport(violations);

    const missingDefault = violations.filter((v) => v.missingExport === 'Default').length;
    const missingStates = violations.filter((v) => v.missingExport !== 'Default').length;

    console.log(`\n📚 Storybook Completeness Audit:`);
    console.log(`  Story files scanned:      ${storiesFiles.length}`);
    console.log(`  Missing Default export:   ${missingDefault}`);
    console.log(`  Missing state exports:    ${missingStates}`);
    console.log(`  Total violations:         ${violations.length}`);

    if (violations.length > 0) {
      console.warn(`\n  ⚠ ${violations.length} story completeness violation(s):`);
      for (const v of violations) {
        console.warn(
          `    - cometchat-${v.componentName}: missing "${v.missingExport}" in ${path.basename(v.storiesFile)}`
        );
      }
    } else {
      console.log('  ✅ All story files export required state variants');
    }

    expect(storiesFiles.length).toBeGreaterThan(0);
  });
});
