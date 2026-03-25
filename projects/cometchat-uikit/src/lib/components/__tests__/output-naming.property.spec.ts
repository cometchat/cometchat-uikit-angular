/**
 * Property 2: All @Output() names are free of the "on" prefix.
 *
 * Angular coding standards require action-verb names (backClick, itemClick)
 * not React-style "on" prefixes (onBack, onItemClick).
 *
 * Validates: Requirement 1.5
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

/**
 * Extracts @Output() property names from a TypeScript source string.
 * Handles both:
 *   @Output() onFoo = ...
 *   @Output() onFoo: EventEmitter<...>
 */
function extractOutputNames(source: string): { name: string; line: number }[] {
  const results: { name: string; line: number }[] = [];
  const lines = source.split('\n');
  // Match @Output() on the same line or the next non-empty line
  for (let i = 0; i < lines.length; i++) {
    if (/@Output\s*\(\s*\)/.test(lines[i])) {
      // Try same line first
      const sameLine = lines[i].match(/@Output\s*\(\s*\)\s+(\w+)/);
      if (sameLine) {
        results.push({ name: sameLine[1], line: i + 1 });
        continue;
      }
      // Try next non-empty line
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        const nextLine = lines[j].match(/^\s*(\w+)\s*[=:]/);
        if (nextLine) {
          results.push({ name: nextLine[1], line: j + 1 });
          break;
        }
      }
    }
  }
  return results;
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

describe('Property 2 — @Output() names have no "on" prefix', () => {
  const allFiles = getAllComponentTsFiles(COMPONENTS_ROOT);

  interface Violation {
    file: string;
    line: number;
    name: string;
  }
  const violations: Violation[] = [];

  for (const file of allFiles) {
    const source = fs.readFileSync(file, 'utf-8');
    const outputs = extractOutputNames(source);
    for (const output of outputs) {
      if (/^on[A-Z]/.test(output.name)) {
        violations.push({ file, line: output.line, name: output.name });
      }
    }
  }

  it('should find no @Output() declarations with "on" prefix', () => {
    if (violations.length > 0) {
      for (const v of violations) {
        const relPath = path.relative(process.cwd(), v.file);
        appendFinding({
          id: nextFindingId('F-PROP'),
          severity: 'Major',
          requirement: '1.5',
          area: 'architecture',
          file: relPath,
          line: v.line,
          description: `@Output() property "${v.name}" uses forbidden "on" prefix. Angular convention requires action-verb names without the "on" prefix.`,
          suggestedFix: `Rename "${v.name}" to "${v.name.replace(/^on/, '').replace(/^[A-Z]/, (c) => c.toLowerCase())}". Update all template bindings from (${v.name})="..." to the new name.`,
          status: 'Open',
          fixStrategy: 'Inline',
        });
      }
    }

    expect(violations).toHaveLength(0);
  });

  it('should scan at least 5 component files', () => {
    expect(allFiles.length).toBeGreaterThan(5);
  });
});
