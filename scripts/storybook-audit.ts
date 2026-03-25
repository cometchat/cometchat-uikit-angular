/**
 * Storybook Coverage Audit Script
 *
 * Scans all component directories under the CometChat Angular UIKit
 * and cross-references against existing `.stories.ts` files.
 *
 * Produces a JSON report + console table categorizing each component as:
 * - covered: Has story file with variants for all significant @Input() properties
 * - partially-covered: Has story file but missing variants for some @Input() properties
 * - missing: No story file exists
 *
 * Usage: npx ts-node scripts/storybook-audit.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================
// Interfaces
// ============================================

export interface AuditResult {
  componentName: string;
  componentPath: string;
  storyExists: boolean;
  storyPath: string | null;
  status: 'covered' | 'partially-covered' | 'missing';
  missingVariants: string[];
  hasAutodocs: boolean;
}

export interface AuditReport {
  timestamp: string;
  totalComponents: number;
  covered: number;
  partiallyCovered: number;
  missing: number;
  results: AuditResult[];
}

// ============================================
// Constants
// ============================================

const COMPONENTS_DIR = path.resolve(
  process.cwd(),
  'projects/cometchat-uikit/src/lib/components'
);
const BASE_ELEMENTS_DIR = path.join(COMPONENTS_DIR, 'base-elements');
const REPORT_OUTPUT_PATH = path.resolve(process.cwd(), 'scripts/storybook-audit-report.json');

// ============================================
// Directory Scanning (Task 1.1)
// ============================================

/**
 * Discovers all component directories, including base-elements sub-directories.
 * A valid component directory contains a `.component.ts` file.
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
 * Finds the story file for a component directory.
 * Looks for any `.stories.ts` file in the directory.
 */
function findStoryFile(dirPath: string, dirName: string): string | null {
  const expectedStory = path.join(dirPath, `${dirName}.stories.ts`);
  if (fs.existsSync(expectedStory)) {
    return expectedStory;
  }

  // Also check for any .stories.ts file in the directory
  try {
    const files = fs.readdirSync(dirPath);
    const storyFile = files.find((f) => f.endsWith('.stories.ts'));
    return storyFile ? path.join(dirPath, storyFile) : null;
  } catch {
    return null;
  }
}

// ============================================
// @Input() Extraction (Task 1.2)
// ============================================

/**
 * Extracts @Input() property names from component source content using regex.
 *
 * Handles patterns:
 * - @Input() propName: Type = value;
 * - @Input() propName?: Type;
 * - @Input() propName!: Type;
 * - @Input({ required: true }) propName!: Type;
 * - @Input({ transform: booleanAttribute }) propName = false;
 *
 * Multi-line patterns where @Input(...) is on one line and the property on the next.
 */
export function extractInputsFromContent(content: string): string[] {
  const inputs: string[] = [];

  // Match @Input() or @Input({...}) followed by property name
  // Handles both single-line and multi-line patterns
  const inputRegex = /@Input\s*\([^)]*\)\s*(?:\n\s*)?(\w+)\s*[?!]?\s*[=:]/g;
  let match: RegExpExecArray | null;

  while ((match = inputRegex.exec(content)) !== null) {
    const propName = match[1];
    if (propName) {
      inputs.push(propName);
    }
  }

  return inputs;
}

function extractInputs(componentFilePath: string): string[] {
  const content = fs.readFileSync(componentFilePath, 'utf-8');
  return extractInputsFromContent(content);
}

/**
 * Extracts named story variant exports from story file content.
 * Looks for `export const VariantName: Story = ...` patterns.
 */
export function extractStoryVariantsFromContent(content: string): string[] {
  const variants: string[] = [];

  const exportRegex = /export\s+const\s+(\w+)\s*:\s*Story\b/g;
  let match: RegExpExecArray | null;

  while ((match = exportRegex.exec(content)) !== null) {
    const variantName = match[1];
    if (variantName) {
      variants.push(variantName);
    }
  }

  return variants;
}

function extractStoryVariants(storyFilePath: string): string[] {
  const content = fs.readFileSync(storyFilePath, 'utf-8');
  return extractStoryVariantsFromContent(content);
}

/**
 * Checks if story file content has the autodocs tag.
 */
export function hasAutodocsTagInContent(content: string): boolean {
  return /tags\s*:\s*\[.*['"]autodocs['"].*\]/s.test(content);
}

function hasAutodocsTag(storyFilePath: string): boolean {
  const content = fs.readFileSync(storyFilePath, 'utf-8');
  return hasAutodocsTagInContent(content);
}

/**
 * Determines which @Input() properties are not covered by story variants.
 * Pure function version that operates on content strings.
 *
 * A variant is considered to cover an input if the variant name (case-insensitive)
 * contains the input name, or if the story file content references the input
 * in an args block.
 */
export function findMissingVariantsFromContent(
  inputs: string[],
  storyContent: string
): string[] {
  if (inputs.length === 0) return [];

  const variants = extractStoryVariantsFromContent(storyContent);
  const variantNamesLower = variants.map((v) => v.toLowerCase());

  const missing: string[] = [];

  for (const input of inputs) {
    const inputLower = input.toLowerCase();

    // Check 1: Is the input name referenced in any variant name?
    const inVariantName = variantNamesLower.some((v) => v.includes(inputLower));

    // Check 2: Is the input referenced in an args block in the story content?
    const inArgsRegex = new RegExp(
      `(?:args\\s*:\\s*\\{[^}]*\\b${escapeRegex(input)}\\b|\\[${escapeRegex(input)}\\])`,
      's'
    );
    const inArgs = inArgsRegex.test(storyContent);

    // Check 3: Is the input referenced anywhere in the story content (template bindings, etc.)?
    const inContent = new RegExp(`\\b${escapeRegex(input)}\\b`).test(storyContent);

    if (!inVariantName && !inArgs && !inContent) {
      missing.push(input);
    }
  }

  return missing;
}

function findMissingVariants(
  inputs: string[],
  storyFilePath: string
): string[] {
  if (inputs.length === 0) return [];
  const storyContent = fs.readFileSync(storyFilePath, 'utf-8');
  return findMissingVariantsFromContent(inputs, storyContent);
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================
// Audit Logic
// ============================================

/**
 * Describes a component directory's file contents for pure audit logic.
 */
export interface ComponentDirInfo {
  dirPath: string;
  dirName: string;
  componentContent: string;
  storyContent: string | null;
  storyPath: string | null;
}

/**
 * Pure audit logic that determines the audit result from component directory info.
 * No file system access — all data is passed in.
 */
export function auditComponentFromInfo(info: ComponentDirInfo): AuditResult {
  const componentName = info.dirName.replace('cometchat-', '');

  if (info.storyContent === null) {
    return {
      componentName,
      componentPath: info.dirPath,
      storyExists: false,
      storyPath: null,
      status: 'missing',
      missingVariants: [],
      hasAutodocs: false,
    };
  }

  const inputs = extractInputsFromContent(info.componentContent);
  const missingVariants = findMissingVariantsFromContent(inputs, info.storyContent);
  const autodocs = hasAutodocsTagInContent(info.storyContent);

  const status: AuditResult['status'] =
    missingVariants.length > 0 ? 'partially-covered' : 'covered';

  return {
    componentName,
    componentPath: info.dirPath,
    storyExists: true,
    storyPath: info.storyPath,
    status,
    missingVariants,
    hasAutodocs: autodocs,
  };
}

function auditComponent(dirPath: string): AuditResult {
  const dirName = path.basename(dirPath);
  const componentName = dirName.replace('cometchat-', '');
  const componentFilePath = path.join(dirPath, `${dirName}.component.ts`);

  const storyPath = findStoryFile(dirPath, dirName);
  const storyExists = storyPath !== null;

  if (!storyExists) {
    return {
      componentName,
      componentPath: path.relative(process.cwd(), dirPath),
      storyExists: false,
      storyPath: null,
      status: 'missing',
      missingVariants: [],
      hasAutodocs: false,
    };
  }

  const inputs = extractInputs(componentFilePath);
  const missingVariants = findMissingVariants(inputs, storyPath!);
  const autodocs = hasAutodocsTag(storyPath!);

  const status: AuditResult['status'] =
    missingVariants.length > 0 ? 'partially-covered' : 'covered';

  return {
    componentName,
    componentPath: path.relative(process.cwd(), dirPath),
    storyExists: true,
    storyPath: path.relative(process.cwd(), storyPath!),
    status,
    missingVariants,
    hasAutodocs: autodocs,
  };
}

// ============================================
// Report Output (Task 1.3)
// ============================================

export function generateReport(results: AuditResult[]): AuditReport {
  return {
    timestamp: new Date().toISOString(),
    totalComponents: results.length,
    covered: results.filter((r) => r.status === 'covered').length,
    partiallyCovered: results.filter((r) => r.status === 'partially-covered').length,
    missing: results.filter((r) => r.status === 'missing').length,
    results,
  };
}

function printConsoleTable(report: AuditReport): void {
  console.log('\n========================================');
  console.log('  Storybook Coverage Audit Report');
  console.log('========================================\n');

  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Total Components: ${report.totalComponents}`);
  console.log(`  ✅ Covered: ${report.covered}`);
  console.log(`  ⚠️  Partially Covered: ${report.partiallyCovered}`);
  console.log(`  ❌ Missing: ${report.missing}`);
  console.log('');

  // Console table data
  const tableData = report.results.map((r) => ({
    Component: r.componentName,
    Status: r.status,
    'Story Exists': r.storyExists ? 'Yes' : 'No',
    Autodocs: r.hasAutodocs ? 'Yes' : 'No',
    'Missing Variants': r.missingVariants.length > 0
      ? r.missingVariants.join(', ')
      : '-',
  }));

  console.table(tableData);

  // Print missing components separately for quick reference
  const missingComponents = report.results.filter((r) => r.status === 'missing');
  if (missingComponents.length > 0) {
    console.log('\n❌ Components WITHOUT stories:');
    missingComponents.forEach((r) => {
      console.log(`  - ${r.componentName} (${r.componentPath})`);
    });
  }

  // Print partially covered components
  const partialComponents = report.results.filter((r) => r.status === 'partially-covered');
  if (partialComponents.length > 0) {
    console.log('\n⚠️  Partially covered components:');
    partialComponents.forEach((r) => {
      console.log(`  - ${r.componentName}: missing [${r.missingVariants.join(', ')}]`);
    });
  }

  console.log('');
}

function writeJsonReport(report: AuditReport): void {
  fs.writeFileSync(REPORT_OUTPUT_PATH, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`📄 JSON report written to: ${path.relative(process.cwd(), REPORT_OUTPUT_PATH)}`);
}

// ============================================
// Main
// ============================================

function main(): void {
  console.log('Scanning component directories...');

  const componentDirs = discoverComponentDirs();
  console.log(`Found ${componentDirs.length} component directories.\n`);

  const results = componentDirs.map(auditComponent);
  const report = generateReport(results);

  printConsoleTable(report);
  writeJsonReport(report);
}

// Only run main() when executed directly (not when imported for testing)
const isDirectExecution =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].endsWith('storybook-audit.ts') || process.argv[1].endsWith('storybook-audit.js'));

if (isDirectExecution) {
  main();
}
