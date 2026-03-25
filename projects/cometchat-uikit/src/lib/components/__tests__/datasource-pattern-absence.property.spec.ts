/**
 * Property 1: No DataSource_Pattern inheritance in any library file.
 *
 * Asserts that no class in the library extends MessagesDataSource,
 * DataSourceDecorator, or any abstract decorator chain class.
 * Angular-native services + DI must be used instead.
 *
 * Validates: Requirements 1.1, 1.7
 */
import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAllTsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllTsFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
      results.push(full);
    }
  }
  return results;
}

const FORBIDDEN_PATTERNS = [
  /\bextends\s+MessagesDataSource\b/,
  /\bextends\s+DataSourceDecorator\b/,
  /\bextends\s+\w*DataSource\w*Decorator\b/,
  /\bextends\s+\w*DecoratorChain\b/,
];

const LIB_ROOT = path.resolve(__dirname, '../../');
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
    // Non-fatal: test still records violations via expect()
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

describe('Property 1 — No DataSource_Pattern inheritance', () => {
  const allFiles = getAllTsFiles(LIB_ROOT);
  const violations: { file: string; line: number; match: string }[] = [];

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(line)) {
          violations.push({ file, line: idx + 1, match: line.trim() });
        }
      }
    });
  }

  it('should find no files extending MessagesDataSource or DataSourceDecorator', () => {
    if (violations.length > 0) {
      for (const v of violations) {
        const relPath = path.relative(process.cwd(), v.file);
        appendFinding({
          id: nextFindingId('F-PROP'),
          severity: 'Critical',
          requirement: '1.1',
          area: 'architecture',
          file: relPath,
          line: v.line,
          description: `Class extends a forbidden DataSource/Decorator pattern: "${v.match}". Angular-native services with DI must be used instead.`,
          suggestedFix:
            'Replace the class inheritance with an Angular injectable service. Inject dependencies via constructor DI and expose functionality through service methods or @Input()/@Output() bindings.',
          status: 'Open',
          fixStrategy: 'Inline',
        });
      }
    }

    expect(violations).toHaveLength(0);
  });

  it('should scan at least 10 TypeScript source files', () => {
    expect(allFiles.length).toBeGreaterThan(10);
  });
});
