/**
 * Documentation Coverage Audit Script
 *
 * Scans all component directories under the CometChat Angular UIKit
 * and cross-references against existing `.mdx` files in `docs/components/`.
 *
 * Produces a JSON report + console table categorizing each component as:
 * - documented: Has MDX file with all @Input() and @Output() entries
 * - partially-documented: Has MDX file but missing/stale entries
 * - missing: No MDX file exists
 *
 * Usage: npx ts-node scripts/docs-audit.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// Interfaces
// ============================================

interface ComponentAuditEntry {
  name: string;
  status: 'documented' | 'partially-documented' | 'missing';
  docFile: string | null;
  sourceInputs: string[];
  sourceOutputs: string[];
  documentedInputs: string[];
  documentedOutputs: string[];
  missingInputs: string[];
  missingOutputs: string[];
  staleInputs: string[];
  staleOutputs: string[];
}

interface AuditReport {
  timestamp: string;
  summary: {
    totalComponents: number;
    documented: number;
    partiallyDocumented: number;
    missing: number;
  };
  components: ComponentAuditEntry[];
}

// ============================================
// Constants
// ============================================

const COMPONENTS_DIR = path.resolve(
  __dirname,
  '../projects/cometchat-uikit/src/lib/components'
);
const BASE_ELEMENTS_DIR = path.join(COMPONENTS_DIR, 'base-elements');
const DOCS_DIR = path.resolve(__dirname, '../docs/components');
const REPORT_OUTPUT_PATH = path.resolve(__dirname, '../docs-audit-report.json');

// ============================================
// Task 1.1: Component Directory Scanning
// ============================================

/**
 * Discovers all component directories, including base-elements sub-directories.
 * A valid component directory contains a `.component.ts` file matching the dir name.
 */
function discoverComponentDirs(): string[] {
  const dirs: string[] = [];

  // Scan top-level component directories (skip base-elements folder itself)
  const topLevelEntries = fs.readdirSync(COMPONENTS_DIR, { withFileTypes: true });
  for (const entry of topLevelEntries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'base-elements') continue;

    const dirPath = path.join(COMPONENTS_DIR, entry.name);
    if (hasComponentFile(dirPath, entry.name)) {
      dirs.push(dirPath);
    }
  }

  // Scan base-elements sub-directories
  if (fs.existsSync(BASE_ELEMENTS_DIR)) {
    const baseEntries = fs.readdirSync(BASE_ELEMENTS_DIR, { withFileTypes: true });
    for (const entry of baseEntries) {
      if (!entry.isDirectory()) continue;

      const dirPath = path.join(BASE_ELEMENTS_DIR, entry.name);
      if (hasComponentFile(dirPath, entry.name)) {
        dirs.push(dirPath);
      }
    }
  }

  return dirs.sort();
}

/**
 * Checks if a directory contains a component .ts file matching the directory name.
 */
function hasComponentFile(dirPath: string, dirName: string): boolean {
  const componentFile = path.join(dirPath, `${dirName}.component.ts`);
  return fs.existsSync(componentFile);
}

/**
 * Finds the MDX doc file for a component.
 * Checks multiple naming conventions used in the docs/ directory:
 * - cometchat-{name}.mdx (e.g., cometchat-conversations.mdx)
 * - {name}.mdx without prefix (e.g., button.mdx, avatar.mdx)
 * - {name-without-cometchat}.mdx (e.g., groups.mdx for cometchat-groups)
 */
function findDocFile(componentDirName: string): string | null {
  // Try exact match: cometchat-conversations.mdx
  const exactPath = path.join(DOCS_DIR, `${componentDirName}.mdx`);
  if (fs.existsSync(exactPath)) {
    return exactPath;
  }

  // Try without cometchat- prefix: conversations.mdx
  const withoutPrefix = componentDirName.replace(/^cometchat-/, '');
  const shortPath = path.join(DOCS_DIR, `${withoutPrefix}.mdx`);
  if (fs.existsSync(shortPath)) {
    return shortPath;
  }

  return null;
}

/**
 * Scans docs/components/ and returns a set of all .mdx file paths.
 */
function discoverDocFiles(): Set<string> {
  const docFiles = new Set<string>();
  if (!fs.existsSync(DOCS_DIR)) return docFiles;

  const entries = fs.readdirSync(DOCS_DIR);
  for (const entry of entries) {
    if (entry.endsWith('.mdx')) {
      docFiles.add(path.join(DOCS_DIR, entry));
    }
  }
  return docFiles;
}

// ============================================
// Task 1.2: @Input() and @Output() Extraction
// ============================================

/**
 * Extracts @Input() property names from a component .ts file using regex.
 *
 * Handles patterns:
 * - @Input() propName = value;
 * - @Input() propName?: Type;
 * - @Input() propName!: Type;
 * - @Input() propName: Type = value;
 * - @Input({ transform: booleanAttribute }) propName = false;
 * - @Input({ transform: booleanAttribute })\n  set propName(value: boolean) { ... }
 * - @Input({ required: true }) propName!: Type;
 */
function extractInputs(componentFilePath: string): string[] {
  const content = fs.readFileSync(componentFilePath, 'utf-8');
  const inputs: string[] = [];

  // Pattern 1: @Input() or @Input({...}) followed by property name (field or setter)
  // Handles both single-line and multi-line (decorator on one line, property on next)
  const inputRegex = /@Input\s*\([^)]*\)\s*(?:\n\s*)?(?:set\s+)?(\w+)\s*[?!]?\s*[=:(]/g;
  let match: RegExpExecArray | null;

  while ((match = inputRegex.exec(content)) !== null) {
    const propName = match[1];
    if (propName && !inputs.includes(propName)) {
      inputs.push(propName);
    }
  }

  return inputs.sort();
}

/**
 * Extracts @Output() property names from a component .ts file using regex.
 *
 * Handles patterns:
 * - @Output() eventName = new EventEmitter<Type>();
 * - @Output() eventName = new EventEmitter();
 */
function extractOutputs(componentFilePath: string): string[] {
  const content = fs.readFileSync(componentFilePath, 'utf-8');
  const outputs: string[] = [];

  const outputRegex = /@Output\(\)\s+(\w+)\s*=\s*new\s+EventEmitter/g;
  let match: RegExpExecArray | null;

  while ((match = outputRegex.exec(content)) !== null) {
    const eventName = match[1];
    if (eventName && !outputs.includes(eventName)) {
      outputs.push(eventName);
    }
  }

  return outputs.sort();
}

// ============================================
// Task 1.3: MDX Properties/Events Table Parsing
// ============================================

/**
 * Parses a markdown table and extracts values from the first column.
 * Handles backtick-wrapped names like `propName`.
 *
 * @param content - The full MDX file content
 * @param headerPattern - Regex to match the table header row
 * @returns Array of names extracted from the first data column
 */
function parseTableColumn(content: string, headerPattern: RegExp): string[] {
  const names: string[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Find a table header matching the pattern
    if (!headerPattern.test(line)) continue;

    // Skip the separator row (|---|---|...)
    const separatorIndex = i + 1;
    if (separatorIndex >= lines.length) break;
    const separatorLine = lines[separatorIndex].trim();
    if (!separatorLine.startsWith('|') || !separatorLine.includes('---')) break;

    // Parse data rows
    for (let j = separatorIndex + 1; j < lines.length; j++) {
      const dataLine = lines[j].trim();
      if (!dataLine.startsWith('|')) break; // End of table

      const cells = dataLine
        .split('|')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      if (cells.length > 0) {
        // Strip backticks from the name
        const name = cells[0].replace(/`/g, '').trim();
        if (name && !name.startsWith('---')) {
          names.push(name);
        }
      }
    }
  }

  return names;
}

/**
 * Extracts documented property names from the Properties table(s) in an MDX file.
 */
function extractDocumentedInputs(docFilePath: string): string[] {
  const content = fs.readFileSync(docFilePath, 'utf-8');

  // Match Properties table headers with various column formats:
  // | Property | Type | Default | Description |
  // | Property | Type | Description |
  const headerPattern = /^\|\s*Property\s*\|.*Type\s*\|/i;
  return parseTableColumn(content, headerPattern);
}

/**
 * Extracts documented event names from the Events table(s) in an MDX file.
 */
function extractDocumentedOutputs(docFilePath: string): string[] {
  const content = fs.readFileSync(docFilePath, 'utf-8');

  // Match Events table headers with various column formats:
  // | Event | Type | Description |
  // | Event | Payload Type | Description |
  const headerPattern = /^\|\s*Event\s*\|/i;
  return parseTableColumn(content, headerPattern);
}

// ============================================
// Task 1.4: Comparison and Classification
// ============================================

/**
 * Audits a single component by comparing source declarations against documentation.
 */
function auditComponent(dirPath: string): ComponentAuditEntry {
  const dirName = path.basename(dirPath);
  const componentFilePath = path.join(dirPath, `${dirName}.component.ts`);

  // Extract source declarations
  const sourceInputs = extractInputs(componentFilePath);
  const sourceOutputs = extractOutputs(componentFilePath);

  // Find corresponding doc file
  const docFilePath = findDocFile(dirName);

  if (!docFilePath) {
    return {
      name: dirName,
      status: 'missing',
      docFile: null,
      sourceInputs,
      sourceOutputs,
      documentedInputs: [],
      documentedOutputs: [],
      missingInputs: sourceInputs,
      missingOutputs: sourceOutputs,
      staleInputs: [],
      staleOutputs: [],
    };
  }

  const relativeDocPath = path.relative(process.cwd(), docFilePath);

  // Extract documented entries
  const documentedInputs = extractDocumentedInputs(docFilePath);
  const documentedOutputs = extractDocumentedOutputs(docFilePath);

  // Find missing: in source but not in docs
  const missingInputs = sourceInputs.filter(
    (input) => !documentedInputs.includes(input)
  );
  const missingOutputs = sourceOutputs.filter(
    (output) => !documentedOutputs.includes(output)
  );

  // Find stale: in docs but not in source
  const staleInputs = documentedInputs.filter(
    (input) => !sourceInputs.includes(input)
  );
  const staleOutputs = documentedOutputs.filter(
    (output) => !sourceOutputs.includes(output)
  );

  // Classify status
  const hasGaps =
    missingInputs.length > 0 ||
    missingOutputs.length > 0 ||
    staleInputs.length > 0 ||
    staleOutputs.length > 0;

  const status: ComponentAuditEntry['status'] = hasGaps
    ? 'partially-documented'
    : 'documented';

  return {
    name: dirName,
    status,
    docFile: relativeDocPath,
    sourceInputs,
    sourceOutputs,
    documentedInputs,
    documentedOutputs,
    missingInputs,
    missingOutputs,
    staleInputs,
    staleOutputs,
  };
}

// ============================================
// Task 1.5: Report Output
// ============================================

/**
 * Generates the full audit report from individual component results.
 */
function generateReport(results: ComponentAuditEntry[]): AuditReport {
  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalComponents: results.length,
      documented: results.filter((r) => r.status === 'documented').length,
      partiallyDocumented: results.filter((r) => r.status === 'partially-documented').length,
      missing: results.filter((r) => r.status === 'missing').length,
    },
    components: results,
  };
}

/**
 * Prints a console summary table of the audit results.
 */
function printConsoleTable(report: AuditReport): void {
  console.log('\n========================================');
  console.log('  Documentation Coverage Audit Report');
  console.log('========================================\n');

  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Total Components: ${report.summary.totalComponents}`);
  console.log(`  ✅ Documented: ${report.summary.documented}`);
  console.log(`  ⚠️  Partially Documented: ${report.summary.partiallyDocumented}`);
  console.log(`  ❌ Missing: ${report.summary.missing}`);
  console.log('');

  // Console table
  const tableData = report.components.map((r) => ({
    Component: r.name,
    Status: r.status,
    'Doc File': r.docFile ? path.basename(r.docFile) : '—',
    'Src Inputs': r.sourceInputs.length,
    'Src Outputs': r.sourceOutputs.length,
    'Doc Inputs': r.documentedInputs.length,
    'Doc Outputs': r.documentedOutputs.length,
    'Missing Inputs': r.missingInputs.length > 0 ? r.missingInputs.join(', ') : '—',
    'Missing Outputs': r.missingOutputs.length > 0 ? r.missingOutputs.join(', ') : '—',
    'Stale Inputs': r.staleInputs.length > 0 ? r.staleInputs.join(', ') : '—',
    'Stale Outputs': r.staleOutputs.length > 0 ? r.staleOutputs.join(', ') : '—',
  }));

  console.table(tableData);

  // Print missing components for quick reference
  const missingComponents = report.components.filter((r) => r.status === 'missing');
  if (missingComponents.length > 0) {
    console.log('\n❌ Components WITHOUT documentation:');
    missingComponents.forEach((r) => {
      console.log(`  - ${r.name}`);
    });
  }

  // Print partially documented components
  const partialComponents = report.components.filter(
    (r) => r.status === 'partially-documented'
  );
  if (partialComponents.length > 0) {
    console.log('\n⚠️  Partially documented components:');
    partialComponents.forEach((r) => {
      const issues: string[] = [];
      if (r.missingInputs.length > 0) {
        issues.push(`missing inputs: [${r.missingInputs.join(', ')}]`);
      }
      if (r.missingOutputs.length > 0) {
        issues.push(`missing outputs: [${r.missingOutputs.join(', ')}]`);
      }
      if (r.staleInputs.length > 0) {
        issues.push(`stale inputs: [${r.staleInputs.join(', ')}]`);
      }
      if (r.staleOutputs.length > 0) {
        issues.push(`stale outputs: [${r.staleOutputs.join(', ')}]`);
      }
      console.log(`  - ${r.name}: ${issues.join('; ')}`);
    });
  }

  console.log('');
}

/**
 * Writes the JSON report to disk.
 */
function writeJsonReport(report: AuditReport): void {
  fs.writeFileSync(REPORT_OUTPUT_PATH, JSON.stringify(report, null, 2), 'utf-8');
  console.log(
    `📄 JSON report written to: ${path.relative(process.cwd(), REPORT_OUTPUT_PATH)}`
  );
}

// ============================================
// Main
// ============================================

function main(): void {
  console.log('Scanning component directories...');

  const componentDirs = discoverComponentDirs();
  console.log(`Found ${componentDirs.length} component directories.`);

  console.log('Scanning docs/components/ for MDX files...');
  const docFiles = discoverDocFiles();
  console.log(`Found ${docFiles.size} MDX documentation files.\n`);

  const results = componentDirs.map(auditComponent);
  const report = generateReport(results);

  printConsoleTable(report);
  writeJsonReport(report);

  // Exit with non-zero code if any Coverage_Gap or Stale_Entry is found
  const hasGaps = report.summary.missing > 0 || report.summary.partiallyDocumented > 0;
  if (hasGaps) {
    console.log(
      '⚠️  Audit found coverage gaps or stale entries. Exiting with code 1.'
    );
    process.exit(1);
  } else {
    console.log('✅ All components are fully documented. Exiting with code 0.');
    process.exit(0);
  }
}

main();
