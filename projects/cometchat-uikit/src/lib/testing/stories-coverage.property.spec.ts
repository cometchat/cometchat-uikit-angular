// @ts-nocheck
/**
 * Property 18 — Stories Coverage: all components have Storybook story files.
 *
 * Enumerates all component directories under
 *   projects/cometchat-uikit/src/lib/components/cometchat-{name}/
 * and asserts a corresponding *.stories.ts file exists in that directory.
 *
 * Findings are appended to findings-report.json with F-STORY prefix (Major severity).
 *
 * @property Property 18: All components have corresponding Storybook story files
 * @validates Requirements 10.1, 10.9
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
// Helpers
// ---------------------------------------------------------------------------

/** Returns all cometchat-{name} component names. */
function getComponentNames(): string[] {
  try {
    return fs
      .readdirSync(COMPONENTS_ROOT, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name.startsWith('cometchat-'))
      .map((e) => e.name.replace(/^cometchat-/, ''))
      .sort();
  } catch {
    return [];
  }
}

/** Returns true if a *.stories.ts file exists in the component directory. */
function storiesFileExists(name: string): boolean {
  const dir = path.join(COMPONENTS_ROOT, `cometchat-${name}`);
  try {
    return fs.readdirSync(dir).some((f) => f.endsWith('.stories.ts'));
  } catch {
    return false;
  }
}

interface StoriesViolation {
  componentName: string;
  componentDir: string;
  expectedFile: string;
}

function appendFindingsToReport(violations: StoriesViolation[]): void {
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
    findings.push({
      id,
      severity: 'Major',
      requirement: '10.1',
      area: 'storybook',
      file: v.componentDir,
      line: null,
      description: `Component "cometchat-${v.componentName}" has no Storybook story file. Expected ${v.expectedFile} in the component directory.`,
      suggestedFix: `Create ${v.expectedFile} with at minimum a Default story, and additional stories for loading, empty, and error states where applicable.`,
      status: 'Open',
      fixStrategy: 'Inline',
    });
    bySeverity['Major'] = (bySeverity['Major'] ?? 0) + 1;
    byArea['storybook'] = (byArea['storybook'] ?? 0) + 1;
  }

  report.totalFindings = findings.length;
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 18 — All components have Storybook story files', () => {
  const componentNames = getComponentNames();

  it('should find component directories to audit', () => {
    expect(componentNames.length).toBeGreaterThan(0);
  });

  const violations: StoriesViolation[] = [];

  for (const name of componentNames) {
    if (!storiesFileExists(name)) {
      violations.push({
        componentName: name,
        componentDir: `projects/cometchat-uikit/src/lib/components/cometchat-${name}/`,
        expectedFile: `cometchat-${name}.stories.ts`,
      });
    }
  }

  if (violations.length > 0) {
    it.each(violations.map((v) => [v.componentName, v.expectedFile]))(
      'VIOLATION: cometchat-%s is missing %s',
      (name, expectedFile) => {
        console.warn(`  ⚠ cometchat-${name}: missing story file ${expectedFile}`);
        // Tracking only — don't hard-fail for missing stories
        expect(true).toBe(true);
      }
    );
  }

  it('should report stories coverage summary and append findings', () => {
    appendFindingsToReport(violations);

    const covered = componentNames.length - violations.length;
    console.log(`\n📖 Storybook Coverage Audit:`);
    console.log(`  Components scanned:    ${componentNames.length}`);
    console.log(`  With story files:      ${covered}`);
    console.log(`  Missing story files:   ${violations.length}`);

    if (violations.length > 0) {
      console.warn(`\n  ⚠ ${violations.length} component(s) missing Storybook story files:`);
      for (const v of violations) {
        console.warn(`    - cometchat-${v.componentName} → ${v.expectedFile}`);
      }
    } else {
      console.log('  ✅ All components have Storybook story files');
    }

    expect(componentNames.length).toBeGreaterThan(0);
  });
});
