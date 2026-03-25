/**
 * Findings Writer — build-time helper for the Angular V5 UIKit code review.
 *
 * Reads and writes `.kiro/specs/angular-v5-uikit-code-review/findings-report.json`.
 * This is a Node.js script (uses `fs`), not a browser module.
 *
 * Usage:
 *   import { appendFinding, markFixed, markDeferred } from './findings-writer';
 */
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReviewArea =
  | 'architecture'
  | 'performance'
  | 'dx'
  | 'accessibility'
  | 'css-theming'
  | 'localization'
  | 'typescript'
  | 'testing'
  | 'documentation'
  | 'storybook'
  | 'sample-app'
  | 'public-api'
  | 'memory-leaks'
  | 'error-handling'
  | 'formatters';

export interface Finding {
  id: string;
  severity: 'Critical' | 'Major' | 'Minor';
  requirement: string;
  area: ReviewArea;
  file: string;
  line?: number;
  description: string;
  suggestedFix: string;
  status: 'Open' | 'Fixed' | 'Deferred';
  fixStrategy: 'Inline' | 'SeparateTask';
}

export interface FindingsReport {
  generatedAt: string;
  totalFindings: number;
  bySeverity: Record<'Critical' | 'Major' | 'Minor', number>;
  byArea: Record<ReviewArea, number>;
  findings: Finding[];
  parseErrors: string[];
}

// ---------------------------------------------------------------------------
// File path (resolved relative to this script's location at build time)
// ---------------------------------------------------------------------------

const REPORT_PATH = path.resolve(
  __dirname,
  '../../../../../.kiro/specs/angular-v5-uikit-code-review/findings-report.json'
);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function readReport(): FindingsReport {
  const raw = fs.readFileSync(REPORT_PATH, 'utf-8');
  return JSON.parse(raw) as FindingsReport;
}

function writeReport(report: FindingsReport): void {
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Appends a finding to the report, incrementing the relevant counters.
 */
export function appendFinding(f: Finding): void {
  const report = readReport();

  report.findings.push(f);
  report.totalFindings = report.findings.length;
  report.bySeverity[f.severity] = (report.bySeverity[f.severity] ?? 0) + 1;
  report.byArea[f.area] = (report.byArea[f.area] ?? 0) + 1;

  writeReport(report);
}

/**
 * Sets the status of a finding to 'Fixed' by its id.
 */
export function markFixed(id: string): void {
  const report = readReport();

  const finding = report.findings.find((f) => f.id === id);
  if (!finding) {
    throw new Error(`Finding with id "${id}" not found in report.`);
  }
  finding.status = 'Fixed';

  writeReport(report);
}

/**
 * Sets the status of a finding to 'Deferred' and fixStrategy to 'SeparateTask'.
 */
export function markDeferred(id: string): void {
  const report = readReport();

  const finding = report.findings.find((f) => f.id === id);
  if (!finding) {
    throw new Error(`Finding with id "${id}" not found in report.`);
  }
  finding.status = 'Deferred';
  finding.fixStrategy = 'SeparateTask';

  writeReport(report);
}
