/**
 * Property 4: All *ngFor directives include a trackBy function.
 *
 * Every *ngFor in component templates must include a trackBy binding
 * to prevent unnecessary DOM re-creation on list updates.
 *
 * Validates: Requirement 2.2
 */
import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAllHtmlFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.component.html')) {
      results.push(full);
    }
  }
  return results;
}

interface NgForViolation {
  file: string;
  line: number;
  snippet: string;
}

/**
 * Finds *ngFor directives that span one or more lines but lack trackBy.
 * Handles multi-line *ngFor by joining continuation lines.
 */
function findNgForWithoutTrackBy(source: string, filePath: string): NgForViolation[] {
  const violations: NgForViolation[] = [];
  const lines = source.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/\*ngFor/.test(line)) continue;

    // Collect the full directive expression (may span multiple lines until closing >)
    let block = line;
    let j = i;
    while (j < lines.length && !block.includes('>') && j - i < 5) {
      j++;
      if (j < lines.length) block += ' ' + lines[j];
    }

    // Only flag if this ngFor block has no trackBy
    if (!/trackBy/.test(block)) {
      violations.push({
        file: filePath,
        line: i + 1,
        snippet: line.trim().substring(0, 120),
      });
    }
  }

  return violations;
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

describe('Property 4 — All *ngFor directives include trackBy', () => {
  const allFiles = getAllHtmlFiles(COMPONENTS_ROOT);
  const violations: NgForViolation[] = [];

  for (const file of allFiles) {
    const source = fs.readFileSync(file, 'utf-8');
    violations.push(...findNgForWithoutTrackBy(source, file));
  }

  it('should find no *ngFor directives missing trackBy', () => {
    if (violations.length > 0) {
      for (const v of violations) {
        const relPath = path.relative(process.cwd(), v.file);
        appendFinding({
          id: nextFindingId('F-PROP'),
          severity: 'Major',
          requirement: '2.2',
          area: 'performance',
          file: relPath,
          line: v.line,
          description: `*ngFor directive at line ${v.line} is missing a trackBy function: "${v.snippet}". Without trackBy, Angular re-creates all DOM nodes on every change.`,
          suggestedFix:
            'Add `; trackBy: trackByFn` to the *ngFor directive and implement a `trackByFn(index: number, item: T): any` method in the component class that returns a stable unique identifier (e.g., item.id).',
          status: 'Open',
          fixStrategy: 'Inline',
        });
      }
    }

    expect(violations).toHaveLength(0);
  });

  it('should scan at least 5 HTML template files', () => {
    expect(allFiles.length).toBeGreaterThan(5);
  });
});
