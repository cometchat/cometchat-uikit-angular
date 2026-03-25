/**
 * CSS Variable Standardization Audit Script
 *
 * Scans all component CSS files under the CometChat Angular UIKit and reports
 * violations of the three-tier CSS variable architecture:
 *   component-level → global semantic → hardcoded default
 *
 * Detects:
 * - padding using `--cometchat-spacing-*` instead of `--cometchat-padding-*`
 * - margin using `--cometchat-spacing-*` instead of `--cometchat-margin-*`
 * - gap without a component-level variable wrapper
 * - height/width using `--cometchat-spacing-*` instead of pixel defaults
 * - hardcoded values for padding/margin/gap/border-radius/background/font/color
 *
 * Severity levels:
 * - ERROR:   Wrong variable category (e.g., spacing used for padding)
 * - WARNING: Missing component-level wrapper (e.g., gap directly using global var)
 * - INFO:    Hardcoded value that could be variablized
 *
 * Usage: npx ts-node projects/cometchat-uikit/scripts/css-audit.ts [--json] [--file <path>]
 *
 * @see .kiro/specs/css-variable-standardization/design.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// Types
// ============================================

type Severity = 'ERROR' | 'WARNING' | 'INFO';

interface Violation {
  file: string;
  line: number;
  severity: Severity;
  rule: string;
  message: string;
  declaration: string;
}

interface FileReport {
  file: string;
  violations: Violation[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

interface AuditReport {
  timestamp: string;
  totalFiles: number;
  totalViolations: number;
  totalErrors: number;
  totalWarnings: number;
  totalInfos: number;
  files: FileReport[];
}

// ============================================
// Constants
// ============================================

const COMPONENTS_DIR = path.resolve(
  __dirname,
  '../src/lib/components'
);


// Properties that should use specific global variable categories
const PROPERTY_CATEGORY_MAP: Record<string, { correct: RegExp; wrong: RegExp; correctName: string }> = {
  padding: {
    correct: /--cometchat-padding(-\d+)?/,
    wrong: /--cometchat-spacing(-\d+)?/,
    correctName: '--cometchat-padding-*',
  },
  'padding-top': {
    correct: /--cometchat-padding(-\d+)?/,
    wrong: /--cometchat-spacing(-\d+)?/,
    correctName: '--cometchat-padding-*',
  },
  'padding-bottom': {
    correct: /--cometchat-padding(-\d+)?/,
    wrong: /--cometchat-spacing(-\d+)?/,
    correctName: '--cometchat-padding-*',
  },
  'padding-left': {
    correct: /--cometchat-padding(-\d+)?/,
    wrong: /--cometchat-spacing(-\d+)?/,
    correctName: '--cometchat-padding-*',
  },
  'padding-right': {
    correct: /--cometchat-padding(-\d+)?/,
    wrong: /--cometchat-spacing(-\d+)?/,
    correctName: '--cometchat-padding-*',
  },
  margin: {
    correct: /--cometchat-margin(-\d+)?/,
    wrong: /--cometchat-spacing(-\d+)?/,
    correctName: '--cometchat-margin-*',
  },
  'margin-top': {
    correct: /--cometchat-margin(-\d+)?/,
    wrong: /--cometchat-spacing(-\d+)?/,
    correctName: '--cometchat-margin-*',
  },
  'margin-bottom': {
    correct: /--cometchat-margin(-\d+)?/,
    wrong: /--cometchat-spacing(-\d+)?/,
    correctName: '--cometchat-margin-*',
  },
  'margin-left': {
    correct: /--cometchat-margin(-\d+)?/,
    wrong: /--cometchat-spacing(-\d+)?/,
    correctName: '--cometchat-margin-*',
  },
  'margin-right': {
    correct: /--cometchat-margin(-\d+)?/,
    wrong: /--cometchat-spacing(-\d+)?/,
    correctName: '--cometchat-margin-*',
  },
};

// Properties where height/width should NOT use spacing vars
const DIMENSION_PROPERTIES = ['height', 'width', 'min-height', 'min-width', 'max-height', 'max-width'];

// Properties that should have component-level variable wrappers
const WRAPPER_REQUIRED_PROPERTIES = ['gap', 'row-gap', 'column-gap'];

// Properties where hardcoded values are violations
const HARDCODED_CHECK_PROPERTIES = [
  'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
  'margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
  'gap', 'row-gap', 'column-gap',
  'border-radius',
  'background', 'background-color',
  'font',
  'color',
];

// Regex patterns
const SPACING_VAR_RE = /--cometchat-spacing(-\d+)?(?!\w)/g;
const COMPONENT_VAR_RE = /var\(\s*(--cometchat-[\w-]+)/;
const VAR_FUNCTION_RE = /var\(\s*(--[\w-]+)/g;
const HARDCODED_PX_RE = /:\s*(\d+px)/;
const HARDCODED_COLOR_HEX_RE = /:\s*(#[0-9a-fA-F]{3,8})\b/;
const HARDCODED_COLOR_RGB_RE = /:\s*(rgba?\([^)]+\))/;

// Patterns to skip (comments, keyframes, :root, etc.)
const COMMENT_LINE_RE = /^\s*(\/\*|\*|\/\/)/;
const KEYFRAME_BLOCK_RE = /^@keyframes\b/;
const ROOT_BLOCK_RE = /^:root\b/;

// ============================================
// Helpers
// ============================================

/**
 * Parse a CSS file into an array of { lineNumber, property, value, rawLine, inMediaQuery, inKeyframes }
 */
function parseDeclarations(content: string): Array<{
  lineNumber: number;
  property: string;
  value: string;
  rawLine: string;
  inMediaQuery: boolean;
  inKeyframes: boolean;
  inRootBlock: boolean;
  isCommentedOut: boolean;
}> {
  const lines = content.split('\n');
  const declarations: Array<{
    lineNumber: number;
    property: string;
    value: string;
    rawLine: string;
    inMediaQuery: boolean;
    inKeyframes: boolean;
    inRootBlock: boolean;
    isCommentedOut: boolean;
  }> = [];

  let inBlockComment = false;
  let mediaQueryDepth = 0;
  let inKeyframes = false;
  let inRootBlock = false;
  let braceDepth = 0;
  let keyframesBraceStart = -1;
  let rootBraceStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track block comments
    if (inBlockComment) {
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }
    if (trimmed.startsWith('/*') && !trimmed.includes('*/')) {
      inBlockComment = true;
      continue;
    }

    // Check if line is a single-line comment
    const isCommentedOut = COMMENT_LINE_RE.test(trimmed) ||
      (trimmed.startsWith('/*') && trimmed.includes('*/'));

    // Track @keyframes blocks
    if (KEYFRAME_BLOCK_RE.test(trimmed)) {
      inKeyframes = true;
      keyframesBraceStart = braceDepth;
    }

    // Track :root blocks
    if (ROOT_BLOCK_RE.test(trimmed)) {
      inRootBlock = true;
      rootBraceStart = braceDepth;
    }

    // Track @media blocks
    if (trimmed.startsWith('@media')) {
      mediaQueryDepth++;
    }

    // Track brace depth
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    braceDepth += openBraces - closeBraces;

    // End keyframes/root tracking
    if (inKeyframes && braceDepth <= keyframesBraceStart) {
      inKeyframes = false;
    }
    if (inRootBlock && braceDepth <= rootBraceStart) {
      inRootBlock = false;
    }
    if (closeBraces > 0 && mediaQueryDepth > 0 && braceDepth <= 0) {
      mediaQueryDepth = Math.max(0, mediaQueryDepth - 1);
    }

    // Parse property: value declarations
    const declMatch = trimmed.match(/^([\w-]+)\s*:\s*(.+?)\s*;?\s*$/);
    if (declMatch && !trimmed.startsWith('--') && !trimmed.startsWith('@') && !trimmed.startsWith('.') && !trimmed.startsWith('#')) {
      declarations.push({
        lineNumber: i + 1,
        property: declMatch[1],
        value: declMatch[2].replace(/;$/, '').trim(),
        rawLine: trimmed,
        inMediaQuery: mediaQueryDepth > 0,
        inKeyframes,
        inRootBlock,
        isCommentedOut,
      });
    }
  }

  return declarations;
}

/**
 * Extract all var() references from a CSS value string
 */
function extractVarReferences(value: string): string[] {
  const refs: string[] = [];
  const re = /var\(\s*(--[\w-]+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(value)) !== null) {
    refs.push(match[1]);
  }
  return refs;
}

/**
 * Check if a value uses a component-level variable as the outermost var()
 */
function hasComponentLevelWrapper(value: string, componentName: string): boolean {
  const outerVarMatch = value.match(/^var\(\s*(--cometchat-[\w-]+)/);
  if (!outerVarMatch) return false;
  const varName = outerVarMatch[1];
  // Component-level vars follow --cometchat-{component}-{element}-{property}
  // They should NOT be a global category var
  const globalPrefixes = [
    '--cometchat-spacing', '--cometchat-padding', '--cometchat-margin',
    '--cometchat-radius', '--cometchat-background-color', '--cometchat-text-color',
    '--cometchat-icon-color', '--cometchat-font-', '--cometchat-border-color',
    '--cometchat-primary-color', '--cometchat-neutral-color', '--cometchat-error-color',
    '--cometchat-success-color', '--cometchat-warning-color', '--cometchat-static-',
    '--cometchat-extended-', '--cometchat-primary-button',
  ];
  for (const prefix of globalPrefixes) {
    if (varName.startsWith(prefix)) return false;
  }
  return varName.startsWith('--cometchat-');
}

/**
 * Check if a value contains a spacing variable used as fallback
 */
function findSpacingInFallback(value: string): string[] {
  const spacingRefs: string[] = [];
  const refs = extractVarReferences(value);
  for (const ref of refs) {
    if (/^--cometchat-spacing(-\d+)?$/.test(ref)) {
      spacingRefs.push(ref);
    }
  }
  return spacingRefs;
}

/**
 * Check if a value is purely hardcoded (no var() references)
 */
function isHardcodedValue(value: string): boolean {
  return !value.includes('var(');
}

/**
 * Check if a hardcoded value is a "trivial" value that shouldn't be flagged
 */
function isTrivialValue(property: string, value: string): boolean {
  const trivialValues = [
    '0', '0px', 'none', 'inherit', 'initial', 'unset', 'auto', 'transparent',
    '100%', '50%', 'normal', 'nowrap', 'hidden', 'visible', 'relative',
    'absolute', 'fixed', 'sticky', 'flex', 'block', 'inline', 'inline-block',
    'grid', 'inline-flex', 'column', 'row', 'wrap', 'center', 'stretch',
    'space-between', 'space-around', 'space-evenly', 'flex-start', 'flex-end',
    'baseline', 'pointer', 'default', 'not-allowed', 'currentColor',
  ];
  if (trivialValues.includes(value)) return true;

  // Skip 0-based margins/paddings
  if (/^0(\s+0)*$/.test(value)) return true;

  // Skip negative margins like -1px (often structural)
  if (property.startsWith('margin') && value.startsWith('-')) return true;

  // Skip transition/animation/transform/cursor/overflow/display/position/z-index/box-sizing
  const skipProperties = [
    'transition', 'animation', 'transform', 'cursor', 'overflow', 'overflow-x',
    'overflow-y', 'display', 'position', 'z-index', 'box-sizing', 'flex',
    'flex-direction', 'flex-wrap', 'flex-shrink', 'flex-grow', 'flex-basis',
    'align-items', 'align-self', 'justify-content', 'text-align', 'text-overflow',
    'text-decoration', 'white-space', 'word-break', 'word-wrap', 'overflow-wrap',
    'list-style', 'outline', 'outline-offset', 'opacity', 'visibility',
    'clip', 'clip-path', 'resize', 'user-select', 'pointer-events',
    'object-fit', 'object-position', 'vertical-align', 'content',
    'appearance', '-webkit-appearance', 'box-shadow', 'text-shadow',
    'filter', '-webkit-filter', 'backdrop-filter',
    'animation-delay', 'animation-duration', 'animation-name',
    'animation-fill-mode', 'animation-timing-function',
    '-webkit-mask', 'mask', '-webkit-mask-image', 'mask-image',
    '-webkit-mask-size', 'mask-size', '-webkit-mask-repeat', 'mask-repeat',
    '-webkit-mask-position', 'mask-position',
    'background-size', 'background-position', 'background-repeat',
    'border-width', 'border-style', 'border-collapse', 'border-spacing',
    'table-layout', 'top', 'bottom', 'left', 'right',
    'scrollbar-width', '-ms-overflow-style',
  ];
  if (skipProperties.includes(property)) return true;

  return false;
}

/**
 * Extract component name from file path
 * e.g., cometchat-groups.component.css → groups
 */
function extractComponentName(filePath: string): string {
  const basename = path.basename(filePath);
  const match = basename.match(/^cometchat-([\w-]+)\.component\.css$/);
  return match ? match[1] : basename.replace('.css', '');
}

// ============================================
// Audit Rules
// ============================================

function auditFile(filePath: string): FileReport {
  const content = fs.readFileSync(filePath, 'utf-8');
  const declarations = parseDeclarations(content);
  const violations: Violation[] = [];
  const componentName = extractComponentName(filePath);
  const relPath = path.relative(process.cwd(), filePath);

  for (const decl of declarations) {
    // Skip commented-out lines, keyframes internals, and :root blocks
    if (decl.isCommentedOut || decl.inKeyframes || decl.inRootBlock) continue;

    const { property, value, lineNumber, rawLine, inMediaQuery } = decl;

    // ── Rule 1: Padding using --cometchat-spacing-* ──
    if (property.startsWith('padding') && PROPERTY_CATEGORY_MAP[property]) {
      const spacingRefs = findSpacingInFallback(value);
      if (spacingRefs.length > 0) {
        violations.push({
          file: relPath,
          line: lineNumber,
          severity: 'ERROR',
          rule: 'padding-wrong-category',
          message: `Padding uses ${spacingRefs.join(', ')} instead of --cometchat-padding-*`,
          declaration: rawLine,
        });
      }
    }

    // ── Rule 2: Margin using --cometchat-spacing-* ──
    if (property.startsWith('margin') && PROPERTY_CATEGORY_MAP[property]) {
      const spacingRefs = findSpacingInFallback(value);
      if (spacingRefs.length > 0) {
        violations.push({
          file: relPath,
          line: lineNumber,
          severity: 'ERROR',
          rule: 'margin-wrong-category',
          message: `Margin uses ${spacingRefs.join(', ')} instead of --cometchat-margin-*`,
          declaration: rawLine,
        });
      }
    }

    // ── Rule 3: Gap without component-level wrapper ──
    if (WRAPPER_REQUIRED_PROPERTIES.includes(property)) {
      if (value.includes('var(')) {
        if (!hasComponentLevelWrapper(value, componentName)) {
          violations.push({
            file: relPath,
            line: lineNumber,
            severity: 'WARNING',
            rule: 'gap-missing-component-wrapper',
            message: `Gap uses global variable directly without component-level wrapper`,
            declaration: rawLine,
          });
        }
      }
    }

    // ── Rule 4: Height/width using --cometchat-spacing-* ──
    if (DIMENSION_PROPERTIES.includes(property)) {
      const spacingRefs = findSpacingInFallback(value);
      if (spacingRefs.length > 0) {
        // Check if it's inside a component-level var (which is acceptable if the
        // component var has a pixel fallback after the spacing var)
        // But the innermost fallback should be a pixel value, not spacing
        const outerVarMatch = value.match(/^var\(\s*(--cometchat-[\w-]+)\s*,\s*var\(\s*(--cometchat-spacing[\w-]*)/);
        if (outerVarMatch) {
          violations.push({
            file: relPath,
            line: lineNumber,
            severity: 'ERROR',
            rule: 'dimension-uses-spacing',
            message: `${property} uses ${spacingRefs.join(', ')} as fallback; should use pixel default`,
            declaration: rawLine,
          });
        } else if (!hasComponentLevelWrapper(value, componentName)) {
          violations.push({
            file: relPath,
            line: lineNumber,
            severity: 'ERROR',
            rule: 'dimension-uses-spacing',
            message: `${property} uses ${spacingRefs.join(', ')} directly; should use component-level var with pixel default`,
            declaration: rawLine,
          });
        }
      }
    }

    // ── Rule 5: Hardcoded values for key visual properties ──
    if (HARDCODED_CHECK_PROPERTIES.includes(property)) {
      if (isHardcodedValue(value) && !isTrivialValue(property, value)) {
        violations.push({
          file: relPath,
          line: lineNumber,
          severity: 'INFO',
          rule: 'hardcoded-value',
          message: `Hardcoded value "${value}" for ${property}; consider using CSS variable`,
          declaration: rawLine,
        });
      }
    }

    // ── Rule 6: Responsive breakpoints using spacing for padding/margin ──
    if (inMediaQuery) {
      if (property.startsWith('padding') || property.startsWith('margin')) {
        const spacingRefs = findSpacingInFallback(value);
        if (spacingRefs.length > 0) {
          violations.push({
            file: relPath,
            line: lineNumber,
            severity: 'ERROR',
            rule: 'responsive-wrong-category',
            message: `Responsive ${property} uses ${spacingRefs.join(', ')} instead of correct category variable`,
            declaration: rawLine,
          });
        }
        // Check for missing component-level wrapper in media queries
        if (value.includes('var(') && !hasComponentLevelWrapper(value, componentName)) {
          violations.push({
            file: relPath,
            line: lineNumber,
            severity: 'WARNING',
            rule: 'responsive-missing-component-wrapper',
            message: `Responsive ${property} uses global variable directly without component-level wrapper with responsive suffix`,
            declaration: rawLine,
          });
        }
        // Check for hardcoded values in responsive
        if (isHardcodedValue(value) && !isTrivialValue(property, value)) {
          violations.push({
            file: relPath,
            line: lineNumber,
            severity: 'WARNING',
            rule: 'responsive-hardcoded',
            message: `Responsive ${property} uses hardcoded value "${value}"; should use component-level variable with responsive suffix`,
            declaration: rawLine,
          });
        }
      }

      // Responsive dimensions with hardcoded values
      if (DIMENSION_PROPERTIES.includes(property)) {
        if (isHardcodedValue(value) && !isTrivialValue(property, value)) {
          violations.push({
            file: relPath,
            line: lineNumber,
            severity: 'INFO',
            rule: 'responsive-dimension-hardcoded',
            message: `Responsive ${property} uses hardcoded value "${value}"; consider component-level variable with responsive suffix`,
            declaration: rawLine,
          });
        }
      }
    }
  }

  const errorCount = violations.filter(v => v.severity === 'ERROR').length;
  const warningCount = violations.filter(v => v.severity === 'WARNING').length;
  const infoCount = violations.filter(v => v.severity === 'INFO').length;

  return { file: relPath, violations, errorCount, warningCount, infoCount };
}

// ============================================
// File Discovery
// ============================================

function findComponentCssFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        // Skip __tests__ and node_modules
        if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
        walk(fullPath);
      } else if (entry.name.endsWith('.component.css')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files.sort();
}

// ============================================
// Output Formatting
// ============================================

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
  white: '\x1b[37m',
};

function severityColor(severity: Severity): string {
  switch (severity) {
    case 'ERROR': return COLORS.red;
    case 'WARNING': return COLORS.yellow;
    case 'INFO': return COLORS.cyan;
  }
}

function printReport(report: AuditReport): void {
  console.log(`\n${COLORS.bold}CSS Variable Standardization Audit${COLORS.reset}`);
  console.log(`${COLORS.gray}${'─'.repeat(60)}${COLORS.reset}`);
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Files scanned: ${report.totalFiles}`);
  console.log(`Total violations: ${report.totalViolations}`);
  console.log(`  ${COLORS.red}Errors:   ${report.totalErrors}${COLORS.reset}`);
  console.log(`  ${COLORS.yellow}Warnings: ${report.totalWarnings}${COLORS.reset}`);
  console.log(`  ${COLORS.cyan}Info:     ${report.totalInfos}${COLORS.reset}`);
  console.log(`${COLORS.gray}${'─'.repeat(60)}${COLORS.reset}\n`);

  for (const fileReport of report.files) {
    if (fileReport.violations.length === 0) continue;

    console.log(`${COLORS.bold}${fileReport.file}${COLORS.reset} (${fileReport.errorCount}E / ${fileReport.warningCount}W / ${fileReport.infoCount}I)`);

    for (const v of fileReport.violations) {
      const color = severityColor(v.severity);
      const pad = v.severity === 'INFO' ? '    ' : v.severity === 'ERROR' ? '   ' : '';
      console.log(`  ${COLORS.gray}L${String(v.line).padStart(4)}${COLORS.reset} ${color}${v.severity}${COLORS.reset}${pad}  ${v.message}`);
      console.log(`  ${COLORS.gray}      ${v.declaration}${COLORS.reset}`);
    }
    console.log('');
  }

  // Summary of clean files
  const cleanFiles = report.files.filter(f => f.violations.length === 0);
  if (cleanFiles.length > 0) {
    console.log(`${COLORS.gray}${cleanFiles.length} file(s) with no violations.${COLORS.reset}\n`);
  }
}

// ============================================
// Main
// ============================================

function main(): void {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const fileIndex = args.indexOf('--file');
  const singleFile = fileIndex !== -1 ? args[fileIndex + 1] : null;

  let cssFiles: string[];

  if (singleFile) {
    const resolved = path.resolve(process.cwd(), singleFile);
    if (!fs.existsSync(resolved)) {
      console.error(`File not found: ${singleFile}`);
      process.exit(1);
    }
    cssFiles = [resolved];
  } else {
    if (!fs.existsSync(COMPONENTS_DIR)) {
      console.error(`Components directory not found: ${COMPONENTS_DIR}`);
      process.exit(1);
    }
    cssFiles = findComponentCssFiles(COMPONENTS_DIR);
  }

  const fileReports: FileReport[] = cssFiles.map(f => auditFile(f));

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    totalFiles: fileReports.length,
    totalViolations: fileReports.reduce((sum, f) => sum + f.violations.length, 0),
    totalErrors: fileReports.reduce((sum, f) => sum + f.errorCount, 0),
    totalWarnings: fileReports.reduce((sum, f) => sum + f.warningCount, 0),
    totalInfos: fileReports.reduce((sum, f) => sum + f.infoCount, 0),
    files: fileReports,
  };

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(report);
  }

  // Exit with error code if there are ERROR-level violations
  if (report.totalErrors > 0) {
    process.exit(1);
  }
}

main();
