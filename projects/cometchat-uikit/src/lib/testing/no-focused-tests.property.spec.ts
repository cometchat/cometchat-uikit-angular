// @ts-nocheck
/**
 * Property 15: No focused or excluded test markers in spec files.
 *
 * Enumerates all *.spec.ts files under src/lib/ and asserts none contain
 * focused (f-describe, f-it) or excluded (x-describe, x-it) markers that would cause
 * CI to run only a subset of tests or silently skip tests.
 *
 * Findings are appended to the findings-report.json with F-TEST prefix.
 *
 * @property Property 15 — No focused or excluded test markers
 * @validates Requirements 8.8
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const LIB_ROOT = path.resolve(__dirname, '..');
const REPORT_PATH = path.resolve(
  __dirname,
  '../../../../../../.kiro/specs/angular-v5-uikit-code-review/findings-report.json'
);

// Build marker strings dynamically to avoid self-detection when this file is scanned
const FOCUSED_MARKERS = [
  'f' + 'describe',
  'f' + 'it(',
  'x' + 'describe',
  'x' + 'it(',
] as const;
type Marker = (typeof FOCUSED_MARKERS)[number];

interface MarkerViolation {
  file: string;
  marker: Marker;
  line: number;
  lineContent: string;
}

function collectSpecFiles(dir: string): string[] {
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
      results.push(...collectSpecFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.spec.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

function scanForMarkers(specFile: string): MarkerViolation[] {
  const violations: MarkerViolation[] = [];
  let content: string;
  try {
    content = fs.readFileSync(specFile, 'utf-8');
  } catch {
    return violations;
  }
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip comment lines
    if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) {
      continue;
    }
    for (const marker of FOCUSED_MARKERS) {
      if (line.includes(marker)) {
        violations.push({
          file: path.relative(LIB_ROOT, specFile),
          marker,
          line: i + 1,
          lineContent: line.trim(),
        });
      }
    }
  }
  return violations;
}

function appendFindingsToReport(violations: MarkerViolation[]): void {
  if (violations.length === 0) return;
  let report: Record<string, unknown>;
  try {
    report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
  } catch {
    return;
  }
  const findings = report.findings as unknown[];
  const bySeverity = report.bySeverity as Record<string, number>;
  const byArea = report.byArea as Record<string, number>;

  // Determine next ID
  const existingIds = findings
    .map((f: { id: string }) => f.id)
    .filter((id: string) => id.startsWith('F-TEST-'))
    .map((id: string) => parseInt(id.replace('F-TEST-', ''), 10))
    .filter((n: number) => !isNaN(n));
  let nextNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

  for (const v of violations) {
    const id = `F-TEST-${String(nextNum).padStart(4, '0')}`;
    nextNum++;
    findings.push({
      id,
      severity: 'Major',
      requirement: '8.8',
      area: 'testing',
      file: v.file,
      line: v.line,
      description: `Spec file contains focused/excluded test marker \`${v.marker}\` at line ${v.line}. This causes CI to run only a subset of tests or silently skip tests.`,
      suggestedFix: `Remove the \`${v.marker}\` marker and replace with the standard \`describe\` / \`it\` equivalent. Ensure all tests are included in the full suite.`,
      status: 'Open',
      fixStrategy: 'Inline',
    });
    bySeverity['Major'] = (bySeverity['Major'] ?? 0) + 1;
    byArea['testing'] = (byArea['testing'] ?? 0) + 1;
  }

  report.totalFindings = findings.length;
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
}

describe('Property 15 — No focused or excluded test markers', () => {
  const specFiles = collectSpecFiles(LIB_ROOT);

  it('should find spec files to audit', () => {
    expect(specFiles.length).toBeGreaterThan(0);
  });

  const allViolations: MarkerViolation[] = [];

  for (const specFile of specFiles) {
    const violations = scanForMarkers(specFile);
    allViolations.push(...violations);
  }

  if (allViolations.length > 0) {
    it.each(allViolations.map((v) => [v.file, v.marker, v.line]))(
      'VIOLATION: %s contains `%s` at line %d',
      (file, marker, line) => {
        expect.fail(
          `Focused/excluded marker \`${marker}\` found in ${file} at line ${line}. Remove it before merging.`
        );
      }
    );
  }

  it('should have zero focused or excluded test markers across all spec files', () => {
    appendFindingsToReport(allViolations);

    if (allViolations.length > 0) {
      const summary = allViolations
        .map((v) => `  ${v.file}:${v.line} — ${v.marker}`)
        .join('\n');
      expect.fail(
        `Found ${allViolations.length} focused/excluded marker(s):\n${summary}`
      );
    }

    expect(allViolations.length).toBe(0);
  });

  it('should report scan summary', () => {
    console.log(`\n🔍 Focused/Excluded Marker Scan:`);
    console.log(`  Spec files scanned: ${specFiles.length}`);
    console.log(`  Violations found:   ${allViolations.length}`);
    if (allViolations.length === 0) {
      console.log('  ✅ No focused or excluded markers found');
    }
    expect(specFiles.length).toBeGreaterThan(0);
  });
});
