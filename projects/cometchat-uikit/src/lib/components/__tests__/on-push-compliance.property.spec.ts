/**
 * Property 3: All components declare OnPush change detection.
 *
 * Every @Component must include `changeDetection: ChangeDetectionStrategy.OnPush`
 * to ensure optimal rendering performance.
 *
 * Validates: Requirement 2.1
 */
import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAllComponentTsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllComponentTsFiles(full));
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.component.ts') &&
      !entry.name.endsWith('.spec.ts')
    ) {
      results.push(full);
    }
  }
  return results;
}

function hasComponentDecorator(source: string): boolean {
  return /@Component\s*\(/.test(source);
}

function hasOnPush(source: string): boolean {
  return /changeDetection\s*:\s*ChangeDetectionStrategy\.OnPush/.test(source);
}

const COMPONENTS_ROOT = path.resolve(__dirname, '../');
const REPORT_PATH = path.join(
  process.cwd(),
  '.kiro/specs/angular-v5-uikit-code-review/findings-report.json'
);

// ---------------------------------------------------------------------------
// Finding writer
// ---------------------------------------------------------------------------

function appendFinding(finding: object): void {
  try {
    const raw = fs.readFileSync(REPORT_PATH, 'utf-8');
    const report = JSON.parse(raw);
    report.findings.push(finding);
    report.totalFindings = report.findings.length;
    const f = finding as any;
    report.bySeverity[f.severity] = (report.bySeverity[f.severity] ?? 0) + 1;
    report.byArea[f.area] = (report.byArea[f.area] ?? 0) + 1;
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  } catch {
    // Non-fatal
  }
}

function nextFindingId(prefix: string): string {
  try {
    const raw = fs.readFileSync(REPORT_PATH, 'utf-8');
    const report = JSON.parse(raw);
    const existing = report.findings
      .map((f: any) => f.id)
      .filter((id: string) => id.startsWith(prefix))
      .map((id: string) => parseInt(id.replace(prefix + '-', ''), 10))
      .filter((n: number) => !isNaN(n));
    const max = existing.length > 0 ? Math.max(...existing) : 0;
    return `${prefix}-${String(max + 1).padStart(4, '0')}`;
  } catch {
    return `${prefix}-0001`;
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 3 — All components declare OnPush change detection', () => {
  const allFiles = getAllComponentTsFiles(COMPONENTS_ROOT);
  const violations: string[] = [];

  for (const file of allFiles) {
    const source = fs.readFileSync(file, 'utf-8');
    if (hasComponentDecorator(source) && !hasOnPush(source)) {
      violations.push(file);
    }
  }

  it('should find no components missing ChangeDetectionStrategy.OnPush', () => {
    if (violations.length > 0) {
      for (const file of violations) {
        const relPath = path.relative(process.cwd(), file);
        const componentName = path.basename(file, '.component.ts');
        appendFinding({
          id: nextFindingId('F-PROP'),
          severity: 'Major',
          requirement: '2.1',
          area: 'performance',
          file: relPath,
          line: null,
          description: `Component "${componentName}" is missing \`changeDetection: ChangeDetectionStrategy.OnPush\` in its @Component decorator. Default change detection causes unnecessary re-renders.`,
          suggestedFix:
            'Add `changeDetection: ChangeDetectionStrategy.OnPush` to the @Component decorator and import ChangeDetectionStrategy from @angular/core. Ensure all inputs are immutable or use signals/observables to trigger updates.',
          status: 'Open',
          fixStrategy: 'Inline',
        });
      }
    }

    expect(violations).toHaveLength(0);
  });

  it('should scan at least 10 component files', () => {
    expect(allFiles.length).toBeGreaterThan(10);
  });
});
