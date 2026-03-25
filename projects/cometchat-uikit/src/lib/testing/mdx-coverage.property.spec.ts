// @ts-nocheck
/**
 * Property 16 — MDX Coverage: all components have MDX documentation files.
 *
 * Enumerates all component directories under
 *   projects/cometchat-uikit/src/lib/components/cometchat-{name}/
 * and asserts a corresponding docs/components/{name}.mdx (or
 * docs/components/cometchat-{name}.mdx) exists.
 *
 * Findings are appended to findings-report.json with F-DOC prefix (Major severity).
 *
 * @property Property 16: All components have corresponding MDX documentation files
 * @validates Requirements 9.1, 9.9
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
const DOCS_COMPONENTS_DIR = path.resolve(WORKSPACE_ROOT, 'docs/components');
const REPORT_PATH = path.resolve(
  WORKSPACE_ROOT,
  '.kiro/specs/angular-v5-uikit-code-review/findings-report.json'
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns all cometchat-{name} directory names under the components root. */
function getComponentNames(): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(COMPONENTS_ROOT, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isDirectory() && e.name.startsWith('cometchat-'))
    .map((e) => e.name.replace(/^cometchat-/, ''))
    .sort();
}

/** Returns true if a docs/components MDX file exists for the given name. */
function mdxExists(name: string): boolean {
  const withPrefix = path.join(DOCS_COMPONENTS_DIR, `cometchat-${name}.mdx`);
  const withoutPrefix = path.join(DOCS_COMPONENTS_DIR, `${name}.mdx`);
  return fs.existsSync(withPrefix) || fs.existsSync(withoutPrefix);
}

interface MdxViolation {
  componentName: string;
  componentDir: string;
  expectedMdxPath: string;
}

function appendFindingsToReport(violations: MdxViolation[]): void {
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
    .filter((id) => id.startsWith('F-DOC-'))
    .map((id) => parseInt(id.replace('F-DOC-', ''), 10))
    .filter((n) => !isNaN(n));
  let nextNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

  for (const v of violations) {
    const id = `F-DOC-${String(nextNum).padStart(4, '0')}`;
    nextNum++;
    findings.push({
      id,
      severity: 'Major',
      requirement: '9.1',
      area: 'documentation',
      file: `projects/cometchat-uikit/src/lib/components/cometchat-${v.componentName}/`,
      line: null,
      description: `Component "cometchat-${v.componentName}" has no corresponding MDX documentation file. Expected at docs/components/${v.expectedMdxPath}`,
      suggestedFix: `Create docs/components/${v.expectedMdxPath} with sections: Overview, Basic Usage, Properties table (@Input), Events table (@Output), Customization, and Styling.`,
      status: 'Open',
      fixStrategy: 'Inline',
    });
    bySeverity['Major'] = (bySeverity['Major'] ?? 0) + 1;
    byArea['documentation'] = (byArea['documentation'] ?? 0) + 1;
  }

  report.totalFindings = findings.length;
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 16 — All components have MDX documentation files', () => {
  const componentNames = getComponentNames();

  it('should find component directories to audit', () => {
    expect(componentNames.length).toBeGreaterThan(0);
  });

  const violations: MdxViolation[] = [];

  for (const name of componentNames) {
    if (!mdxExists(name)) {
      violations.push({
        componentName: name,
        componentDir: `projects/cometchat-uikit/src/lib/components/cometchat-${name}/`,
        expectedMdxPath: `cometchat-${name}.mdx`,
      });
    }
  }

  if (violations.length > 0) {
    it.each(violations.map((v) => [v.componentName, v.expectedMdxPath]))(
      'VIOLATION: cometchat-%s is missing docs/components/%s',
      (name, mdxPath) => {
        console.warn(`  ⚠ cometchat-${name}: missing MDX doc at docs/components/${mdxPath}`);
        // Major finding — fail the assertion
        expect(
          fs.existsSync(path.join(DOCS_COMPONENTS_DIR, mdxPath)),
          `Missing MDX documentation for cometchat-${name}`
        ).toBe(true);
      }
    );
  }

  it('should report MDX coverage summary and append findings', () => {
    appendFindingsToReport(violations);

    const covered = componentNames.length - violations.length;
    console.log(`\n📄 MDX Documentation Coverage Audit:`);
    console.log(`  Components scanned: ${componentNames.length}`);
    console.log(`  With MDX docs:      ${covered}`);
    console.log(`  Missing MDX docs:   ${violations.length}`);

    if (violations.length > 0) {
      console.warn(`\n  ⚠ ${violations.length} component(s) missing MDX documentation:`);
      for (const v of violations) {
        console.warn(`    - cometchat-${v.componentName} → docs/components/${v.expectedMdxPath}`);
      }
    } else {
      console.log('  ✅ All components have MDX documentation files');
    }

    expect(componentNames.length).toBeGreaterThan(0);
  });
});
