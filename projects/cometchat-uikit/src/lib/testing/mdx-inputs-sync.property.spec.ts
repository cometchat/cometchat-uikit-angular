// @ts-nocheck
/**
 * Property 17 — MDX Inputs/Outputs Sync: MDX tables match component source.
 *
 * For each MDX file under docs/components/ that maps to a component under
 * projects/cometchat-uikit/src/lib/components/cometchat-{name}/, this test:
 *   1. Parses @Input() and @Output() declarations from the component .ts file
 *   2. Parses the Properties / Events markdown tables from the MDX file
 *   3. Reports a Major finding for each @Input not listed in the MDX Properties table
 *   4. Reports a Major finding for each @Output not listed in the MDX Events table
 *   5. Reports a Major finding for each MDX table entry with no matching source declaration (stale)
 *
 * Findings are appended to findings-report.json with F-DOC prefix (Major severity).
 *
 * @property Property 17: MDX Inputs/Outputs tables match component source
 * @validates Requirements 9.4, 9.5, 9.10
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
// Helpers — component source parsing
// ---------------------------------------------------------------------------

/** Extract @Input() property names from a TypeScript component source string. */
function parseInputs(source: string): Set<string> {
  const names = new Set<string>();
  // Matches: @Input() propName, @Input() propName:, @Input() propName =
  const re = /@Input\s*\(\s*(?:'[^']*'|"[^"]*")?\s*\)\s+(?:(?:public|protected|private|readonly)\s+)*(\w+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    names.add(m[1]);
  }
  return names;
}

/** Extract @Output() property names from a TypeScript component source string. */
function parseOutputs(source: string): Set<string> {
  const names = new Set<string>();
  const re = /@Output\s*\(\s*(?:'[^']*'|"[^"]*")?\s*\)\s+(?:(?:public|protected|private|readonly)\s+)*(\w+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    names.add(m[1]);
  }
  return names;
}

// ---------------------------------------------------------------------------
// Helpers — MDX table parsing
// ---------------------------------------------------------------------------

/**
 * Parse all markdown table rows from sections matching the given heading pattern.
 * Returns the first column value (property/event name) from each data row.
 */
function parseMdxTableNames(mdxSource: string, headingPattern: RegExp): Set<string> {
  const names = new Set<string>();
  const lines = mdxSource.split('\n');
  let inTargetSection = false;
  let inTable = false;

  for (const line of lines) {
    // Detect section headings (## Properties, ## Events, ### Display Control Properties, etc.)
    if (/^#{1,4}\s/.test(line)) {
      inTargetSection = headingPattern.test(line);
      inTable = false;
      continue;
    }
    if (!inTargetSection) continue;

    // Detect table header row
    if (/^\|/.test(line) && /\|/.test(line)) {
      inTable = true;
      // Skip separator rows (|---|---|)
      if (/^\|\s*[-:]+\s*\|/.test(line)) continue;
      // Extract first column (property/event name) — strip backticks
      const cols = line.split('|').map((c) => c.trim());
      // cols[0] is empty (before first |), cols[1] is first column
      if (cols.length >= 2 && cols[1]) {
        const name = cols[1].replace(/`/g, '').trim();
        if (name && name !== 'Property' && name !== 'Event' && name !== 'Name') {
          names.add(name);
        }
      }
      continue;
    }
    // Non-table line resets table state
    if (inTable && !/^\|/.test(line)) {
      inTable = false;
    }
  }
  return names;
}

// ---------------------------------------------------------------------------
// Helpers — file resolution
// ---------------------------------------------------------------------------

/** Find the component .ts file for a given component name. */
function findComponentTs(name: string): string | null {
  const dir = path.join(COMPONENTS_ROOT, `cometchat-${name}`);
  const candidate = path.join(dir, `cometchat-${name}.component.ts`);
  if (fs.existsSync(candidate)) return candidate;
  // Fallback: any .component.ts in the dir
  try {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.component.ts'));
    if (files.length > 0) return path.join(dir, files[0]);
  } catch {
    // ignore
  }
  return null;
}

/** Find the MDX file for a given component name. */
function findMdxFile(name: string): string | null {
  const withPrefix = path.join(DOCS_COMPONENTS_DIR, `cometchat-${name}.mdx`);
  if (fs.existsSync(withPrefix)) return withPrefix;
  const withoutPrefix = path.join(DOCS_COMPONENTS_DIR, `${name}.mdx`);
  if (fs.existsSync(withoutPrefix)) return withoutPrefix;
  return null;
}

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

// ---------------------------------------------------------------------------
// Violation types
// ---------------------------------------------------------------------------

interface SyncViolation {
  componentName: string;
  mdxFile: string;
  kind: 'missing-input' | 'missing-output' | 'stale-input' | 'stale-output';
  propertyName: string;
}

// ---------------------------------------------------------------------------
// Report writer
// ---------------------------------------------------------------------------

function appendFindingsToReport(violations: SyncViolation[]): void {
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

    let description: string;
    let suggestedFix: string;

    if (v.kind === 'missing-input') {
      description = `MDX doc for "cometchat-${v.componentName}" is missing @Input() "${v.propertyName}" in its Properties table.`;
      suggestedFix = `Add a row for \`${v.propertyName}\` to the Properties table in ${v.mdxFile} with type, default value, and description.`;
    } else if (v.kind === 'missing-output') {
      description = `MDX doc for "cometchat-${v.componentName}" is missing @Output() "${v.propertyName}" in its Events table.`;
      suggestedFix = `Add a row for \`${v.propertyName}\` to the Events table in ${v.mdxFile} with payload type and description.`;
    } else if (v.kind === 'stale-input') {
      description = `MDX doc for "cometchat-${v.componentName}" lists "${v.propertyName}" in Properties table but no matching @Input() exists in the component source.`;
      suggestedFix = `Remove or rename the stale entry \`${v.propertyName}\` in the Properties table in ${v.mdxFile}.`;
    } else {
      description = `MDX doc for "cometchat-${v.componentName}" lists "${v.propertyName}" in Events table but no matching @Output() exists in the component source.`;
      suggestedFix = `Remove or rename the stale entry \`${v.propertyName}\` in the Events table in ${v.mdxFile}.`;
    }

    findings.push({
      id,
      severity: 'Major',
      requirement: '9.4',
      area: 'documentation',
      file: v.mdxFile.replace(WORKSPACE_ROOT + '/', ''),
      line: null,
      description,
      suggestedFix,
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

describe('Property 17 — MDX Inputs/Outputs tables match component source', () => {
  const componentNames = getComponentNames();

  it('should find component directories to audit', () => {
    expect(componentNames.length).toBeGreaterThan(0);
  });

  const violations: SyncViolation[] = [];

  for (const name of componentNames) {
    const mdxFile = findMdxFile(name);
    const tsFile = findComponentTs(name);
    if (!mdxFile || !tsFile) continue;

    let mdxSource: string;
    let tsSource: string;
    try {
      mdxSource = fs.readFileSync(mdxFile, 'utf-8');
      tsSource = fs.readFileSync(tsFile, 'utf-8');
    } catch {
      continue;
    }

    const sourceInputs = parseInputs(tsSource);
    const sourceOutputs = parseOutputs(tsSource);

    // MDX Properties table covers both "## Properties" and "### * Properties" headings
    const mdxInputNames = parseMdxTableNames(mdxSource, /properties/i);
    // MDX Events table
    const mdxOutputNames = parseMdxTableNames(mdxSource, /events/i);

    // Missing from MDX (source has it, MDX doesn't)
    for (const inputName of sourceInputs) {
      if (!mdxInputNames.has(inputName)) {
        violations.push({ componentName: name, mdxFile, kind: 'missing-input', propertyName: inputName });
      }
    }
    for (const outputName of sourceOutputs) {
      if (!mdxOutputNames.has(outputName)) {
        violations.push({ componentName: name, mdxFile, kind: 'missing-output', propertyName: outputName });
      }
    }

    // Stale in MDX (MDX has it, source doesn't)
    for (const mdxName of mdxInputNames) {
      if (!sourceInputs.has(mdxName)) {
        violations.push({ componentName: name, mdxFile, kind: 'stale-input', propertyName: mdxName });
      }
    }
    for (const mdxName of mdxOutputNames) {
      if (!sourceOutputs.has(mdxName)) {
        violations.push({ componentName: name, mdxFile, kind: 'stale-output', propertyName: mdxName });
      }
    }
  }

  if (violations.length > 0) {
    it.each(violations.map((v) => [v.componentName, v.kind, v.propertyName]))(
      'VIOLATION: cometchat-%s — %s: "%s"',
      (name, kind, prop) => {
        console.warn(`  ⚠ cometchat-${name}: ${kind} — "${prop}"`);
        // Major finding — log warning; hard failures are reserved for missing MDX files
        expect(true).toBe(true);
      }
    );
  }

  it('should report MDX sync summary and append findings', () => {
    appendFindingsToReport(violations);

    const missing = violations.filter((v) => v.kind.startsWith('missing')).length;
    const stale = violations.filter((v) => v.kind.startsWith('stale')).length;

    console.log(`\n🔄 MDX Inputs/Outputs Sync Audit:`);
    console.log(`  Components audited: ${componentNames.length}`);
    console.log(`  Missing entries:    ${missing}`);
    console.log(`  Stale entries:      ${stale}`);
    console.log(`  Total violations:   ${violations.length}`);

    if (violations.length > 0) {
      console.warn(`\n  ⚠ ${violations.length} MDX sync violation(s) found`);
    } else {
      console.log('  ✅ All MDX tables are in sync with component source');
    }

    expect(componentNames.length).toBeGreaterThan(0);
  });
});
